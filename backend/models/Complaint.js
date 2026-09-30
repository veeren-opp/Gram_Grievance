import mongoose from 'mongoose';

export const COMPLAINT_CATEGORIES = [
  'Roads',
  'Street Lights',
  'Water Supply',
  'Sanitation',
  'Drainage',
  'Waste Management',
  'Electricity',
  'Public Infrastructure',
  'Other',
];

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: COMPLAINT_CATEGORIES,
    },
    location: {
      type: String,
      required: [true, 'Exact location / landmark is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    photoPublicId: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: 'Maharashtra',
      immutable: true,
    },
    district: {
      type: String,
      default: 'Buldhana',
      immutable: true,
    },
    gramPanchayat: {
      type: String,
      default: 'XYZ Gram Panchayat',
      immutable: true,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'Submitted',
      index: true,
    },
    adminRemark: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast admin and citizen queries
complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;
