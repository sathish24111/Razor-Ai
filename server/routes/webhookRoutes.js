import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Public webhook endpoint - Verified via Razorpay HMAC signature
router.post('/razorpay', handleRazorpayWebhook);

export default router;
