import express from 'express';
import { getSummary, getRecoveryChart } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/recovery-chart', protect, getRecoveryChart);

export default router;
