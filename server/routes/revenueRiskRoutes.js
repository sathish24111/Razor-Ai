import express from 'express';
import { getRevenueRisks, getRevenueRiskById, updateStatus } from '../controllers/revenueRiskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getRevenueRisks);
router.get('/:id', protect, getRevenueRiskById);
router.patch('/:id/status', protect, updateStatus);

export default router;
