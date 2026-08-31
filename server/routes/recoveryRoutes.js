import express from 'express';
import { 
  analyze, 
  approve, 
  retry, 
  escalate, 
  stop, 
  executeAgent, 
  scanAgent 
} from '../controllers/recoveryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/agent/execute', protect, executeAgent);
router.post('/agent/scan', protect, scanAgent);
router.post('/:riskId/analyze', protect, analyze);
router.post('/:riskId/approve', protect, approve);
router.post('/:riskId/retry', protect, retry);
router.post('/:riskId/escalate', protect, escalate);
router.post('/:riskId/stop', protect, stop);

export default router;
