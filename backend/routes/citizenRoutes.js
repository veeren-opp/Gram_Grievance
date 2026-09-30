import express from 'express';
import { authenticateUser, requireCitizen } from '../middleware/authMiddleware.js';
import { getProfile, getDashboard, getComplaints } from '../controllers/citizenController.js';

const router = express.Router();

// All citizen routes require citizen authentication
router.use(authenticateUser, requireCitizen);

router.get('/profile', getProfile);
router.get('/dashboard', getDashboard);
router.get('/complaints', getComplaints);

export default router;
