import express from 'express';
import { getCustomers, getCustomerById, getCustomerOrders, getRecoveryHistory } from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);
router.get('/:id/orders', protect, getCustomerOrders);
router.get('/:id/recovery-history', protect, getRecoveryHistory);

export default router;
