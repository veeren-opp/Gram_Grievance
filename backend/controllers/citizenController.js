import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
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
 * Get Citizen Profile
 */
export const getProfile = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Citizen account not found.' });
    }

    const complaintCount = await Complaint.countDocuments({ citizenId: user._id });

    return res.json({
      success: true,
      profile: {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        state: user.state,
        district: user.district,
        gramPanchayat: user.gramPanchayat,
        createdAt: user.createdAt,
        totalComplaints: complaintCount,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
};

/**
 * Get Citizen Dashboard Statistics from MongoDB
 */
export const getDashboard = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const citizenId = req.user.userId;

    // Real MongoDB counts
    const [total, submitted, inProgress, underReview, resolved, recentComplaints] = await Promise.all([
      Complaint.countDocuments({ citizenId }),
      Complaint.countDocuments({ citizenId, status: 'Submitted' }),
      Complaint.countDocuments({ citizenId, status: 'In Progress' }),
      Complaint.countDocuments({ citizenId, status: 'Under Review' }),
      Complaint.countDocuments({ citizenId, status: 'Resolved' }),
      Complaint.find({ citizenId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('complaintId title category status createdAt adminRemark location'),
    ]);

    return res.json({
      success: true,
      stats: {
        total,
        submitted,
        inProgress: inProgress + underReview,
        resolved,
      },
      recentComplaints,
    });
  } catch (error) {
    console.error('Get citizen dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve dashboard statistics.' });
  }
};

/**
 * Get all complaints submitted by the logged-in citizen
 */
export const getComplaints = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const citizenId = req.user.userId;
    const complaints = await Complaint.find({ citizenId })
      .sort({ createdAt: -1 })
      .select('complaintId title category status createdAt updatedAt location photoUrl adminRemark');

    return res.json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve complaints.' });
  }
};
