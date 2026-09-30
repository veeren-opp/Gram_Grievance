import express from 'express';
import { authenticateUser, requireCitizen } from '../middleware/authMiddleware.js';
import handleSingleUpload from '../middleware/uploadMiddleware.js';
import { submitComplaint, getComplaintById } from '../controllers/complaintController.js';

const router = express.Router();

// Submit complaint is authenticated and restricted to citizens, supporting photo upload
router.post(
  '/',
  authenticateUser,
  requireCitizen,
  handleSingleUpload('photo'),
  submitComplaint
);

// View complaint details is authenticated (citizen or admin authorized inside controller)
router.get('/:id', authenticateUser, getComplaintById);

export default router;
