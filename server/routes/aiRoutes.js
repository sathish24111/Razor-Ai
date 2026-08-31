import express from 'express';
import { analyzePaymentRisk } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/analyze/:riskId', protect, analyzePaymentRisk);

export default router;
