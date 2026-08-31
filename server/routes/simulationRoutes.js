import express from 'express';
import { handleSimulatePayment, handleSimulateBatch, runSimulation } from '../controllers/simulationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/payment', protect, handleSimulatePayment);
router.post('/batch', protect, handleSimulateBatch);
router.post('/run', protect, runSimulation);

export default router;
