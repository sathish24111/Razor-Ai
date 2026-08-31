import express from 'express';
import { getPolicy, updatePolicy } from '../controllers/policyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getPolicy);
router.put('/', protect, updatePolicy);

export default router;
