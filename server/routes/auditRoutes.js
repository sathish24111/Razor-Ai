import express from 'express';
import { getAuditLogs, getAuditLogById, verifyAudit, exportAudit } from '../controllers/auditController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAuditLogs);
router.get('/verify', protect, verifyAudit);
router.get('/export', protect, exportAudit);
router.get('/:id', protect, getAuditLogById);

export default router;
