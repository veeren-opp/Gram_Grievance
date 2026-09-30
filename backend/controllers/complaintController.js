import Complaint, { COMPLAINT_CATEGORIES } from '../models/Complaint.js';
import { getNextComplaintId } from '../models/Counter.js';
import { uploadComplaintImage } from '../services/cloudinaryService.js';
import { getDBStatus } from '../config/db.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { persistComplaint } from '../config/persistence.js';

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
 * Submit New Complaint
 */
export const submitComplaint = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { title, category, location, description } = req.body;
    const citizenId = req.user.userId;

    // Field validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Complaint title is required.' });
    }

    if (!category || !COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Please select a valid category. Valid options: ${COMPLAINT_CATEGORIES.join(', ')}.`,
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Exact Location / Landmark is required.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Detailed description is required.' });
    }

    let photoUrl = '';
    let photoPublicId = '';

    // Handle photo upload if provided
    if (req.file) {
      try {
        const uploadResult = await uploadComplaintImage(req.file.buffer, req.file.originalname);
        photoUrl = uploadResult.url;
        photoPublicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(502).json({
          success: false,
          error: `Photo upload failed: ${uploadError.message || 'Unknown error'}. Please try again.`,
        });
      }
    }

    // Generate unique sequential Complaint ID: CMP-2026-000001
    const complaintId = await getNextComplaintId();

    const newComplaint = new Complaint({
      complaintId,
      citizenId,
      title: title.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      photoUrl,
      photoPublicId,
      state: 'Maharashtra',
      district: 'Buldhana',
      gramPanchayat: 'XYZ Gram Panchayat',
      status: 'Submitted',
      adminRemark: '',
    });

    const savedComplaint = await newComplaint.save();
    persistComplaint(savedComplaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint: savedComplaint,
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while submitting your complaint. Please try again.',
    });
  }
};

/**
 * Get Complaint Details by ID
 * Either by Mongo _id or custom complaintId (e.g. CMP-2026-000001)
 */
export const getComplaintById = async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { id } = req.params;

    // Support both MongoDB ObjectId and custom complaintId
    const query = id.startsWith('CMP-') ? { complaintId: id } : { _id: id };

    const complaint = await Complaint.findOne(query).populate('citizenId', 'fullName mobile email');

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    // Authorization check: Citizen can only view their own complaint; Admin can view all
    if (req.user.role === 'citizen') {
      const ownerId = complaint.citizenId._id || complaint.citizenId;
      if (ownerId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to view this complaint.',
        });
      }
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Get complaint details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve complaint details.',
    });
  }
};
