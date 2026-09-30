import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getComplaints,
  getComplaintById,
  updateComplaint,
} from '../controllers/adminController.js';

const router = express.Router();

// All administrative routes require admin privileges
router.use(authenticateUser, requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintById);
router.patch('/complaints/:id', updateComplaint);

export default router;
