import express from 'express';
import { 
  getPayments, 
  getPaymentById, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);
router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

export default router;
