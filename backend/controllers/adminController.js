import Complaint, { COMPLAINT_STATUSES } from '../models/Complaint.js';
import User from '../models/User.js';
import { getDBStatus } from '../config/db.js';

const ensureDatabaseConnected = (res) => {
  const dbStatus = getDBStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      error: 'MongoDB is currently disconnected. Please configure MONGODB_URI in your environment or .env file.',
    });
    return false;
  }
  return true;
};

/**
 * Admin Dashboard Statistics from MongoDB
 */
export const getDashboard = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const [
      total,
      submitted,
      underReview,
      inProgress,
      resolved,
      rejected,
      recentComplaints,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Submitted' }),
      Complaint.countDocuments({ status: 'Under Review' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Complaint.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('citizenId', 'fullName mobile email')
        .select('complaintId title category status createdAt adminRemark location citizenId'),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
      },
      recentComplaints,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve administrative dashboard metrics.',
    });
  }
};

/**
 * Get All Complaints for Admin with search and filtering
 */
export const getComplaints = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { status, category, search } = req.query;

    const filter = {};

    if (status && COMPLAINT_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    let matchingCitizenIds = [];
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Find citizens whose name or mobile matches
      const matchedCitizens = await User.find({
        $or: [{ fullName: searchRegex }, { mobile: searchRegex }],
      }).select('_id');

      matchingCitizenIds = matchedCitizens.map((c) => c._id);

      filter.$or = [
        { complaintId: searchRegex },
        { title: searchRegex },
        { citizenId: { $in: matchingCitizenIds } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('citizenId', 'fullName mobile email')
      .select('complaintId title category status location createdAt updatedAt photoUrl adminRemark citizenId');

    return res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Admin complaints list error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve grievance records.',
    });
  }
};

/**
 * Get Single Complaint details for Admin
 */
export const getComplaintById = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { id } = req.params;
    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };

    const complaint = await Complaint.findOne(query).populate('citizenId', 'fullName mobile email createdAt');

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Admin get complaint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load complaint details.',
    });
  }
};

/**
 * Update Complaint Status and/or Admin Remark
 */
export const updateComplaint = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { id } = req.params;
    const { status, adminRemark } = req.body;

    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };
    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    if (status) {
      if (!COMPLAINT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${COMPLAINT_STATUSES.join(', ')}`,
        });
      }
      complaint.status = status;
      if (status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      } else if (status !== 'Resolved') {
        complaint.resolvedAt = null;
      }
    }

    if (typeof adminRemark === 'string') {
      complaint.adminRemark = adminRemark.trim();
    }

    complaint.updatedAt = new Date();
    const updatedComplaint = await complaint.save();

    // Re-populate citizen details
    await updatedComplaint.populate('citizenId', 'fullName mobile email');

    return res.json({
      success: true,
      message: 'Grievance record updated successfully in MongoDB.',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Admin update complaint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update complaint record in database.',
    });
  }
};
