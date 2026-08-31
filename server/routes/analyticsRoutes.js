import express from 'express';
import { 
  getOverview, 
  getPayments, 
  getReasons, 
  getRecovery, 
  getAI, 
  getPolicy, 
  getFunnel, 
  exportAnalytics 
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, getOverview);
router.get('/payments', protect, getPayments);
router.get('/reasons', protect, getReasons);
router.get('/recovery', protect, getRecovery);
router.get('/ai', protect, getAI);
router.get('/policy', protect, getPolicy);
router.get('/funnel', protect, getFunnel);
router.get('/export', protect, exportAnalytics);

export default router;
