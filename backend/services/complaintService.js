import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../models/Complaint.js';
import { getNextComplaintId } from '../models/Counter.js';

export { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES };

/**
 * Generate sequential complaint ID and persist grievance
 */
export const createGrievance = async (data) => {
  const complaintId = await getNextComplaintId();

  const complaint = new Complaint({
    complaintId,
    citizenId: data.citizenId,
    title: data.title,
    category: data.category,
    location: data.location,
    description: data.description,
    photoUrl: data.photoUrl || '',
    photoPublicId: data.photoPublicId || '',
    state: 'Maharashtra',
    district: 'Buldhana',
    gramPanchayat: 'XYZ Gram Panchayat',
    status: 'Submitted',
  });

  return await complaint.save();
};

export default {
  createGrievance,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
};
