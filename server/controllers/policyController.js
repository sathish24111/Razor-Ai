import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';

const SUPPORTED_ACTIONS = ['retry_payment', 'customer_recheckout', 'send_reminder', 'escalate', 'stop'];

export async function getPolicy(req, res, next) {
  try {
    const merchantId = req.merchant.id;

    let policy = await prisma.merchantPolicy.findUnique({
      where: { merchantId },
    });

    if (!policy) {
      policy = await prisma.merchantPolicy.create({
        data: {
          merchantId,
          maxRetries: 2,
          maxAutoRecoveryAmount: 10000.0,
          highValueThreshold: 10000.0,
          requireCustomerApproval: true,
          requireMerchantApproval: true,
          recoveryWindowHours: 24,
          automaticRecoveryEnabled: true,
          allowedActions: ["retry_payment", "customer_recheckout", "send_reminder", "escalate", "stop"],
        },
      });
    }

    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

export async function updatePolicy(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { 
      maxRetries, 
      maxAutoRecoveryAmount, 
      highValueThreshold, 
      recoveryWindowHours, 
      automaticRecoveryEnabled, 
      allowedActions 
    } = req.body;

    // Input Validation
    if (maxRetries !== undefined && (typeof maxRetries !== 'number' || maxRetries < 0)) {
      return res.status(400).json({ success: false, message: 'maxRetries must be a non-negative integer.' });
    }

    if (maxAutoRecoveryAmount !== undefined && (typeof maxAutoRecoveryAmount !== 'number' || maxAutoRecoveryAmount <= 0)) {
      return res.status(400).json({ success: false, message: 'maxAutoRecoveryAmount must be a positive number.' });
    }

    if (highValueThreshold !== undefined && (typeof highValueThreshold !== 'number' || highValueThreshold <= 0)) {
      return res.status(400).json({ success: false, message: 'highValueThreshold must be a positive number.' });
    }

    if (recoveryWindowHours !== undefined && (typeof recoveryWindowHours !== 'number' || recoveryWindowHours <= 0)) {
      return res.status(400).json({ success: false, message: 'recoveryWindowHours must be a positive number.' });
    }

    if (allowedActions !== undefined) {
      if (!Array.isArray(allowedActions) || !allowedActions.every(a => SUPPORTED_ACTIONS.includes(a))) {
        return res.status(400).json({ success: false, message: 'allowedActions must contain only valid action types.' });
      }
    }

    const updated = await prisma.merchantPolicy.update({
      where: { merchantId },
      data: {
        maxRetries: maxRetries !== undefined ? Number(maxRetries) : undefined,
        maxAutoRecoveryAmount: maxAutoRecoveryAmount !== undefined ? Number(maxAutoRecoveryAmount) : undefined,
        highValueThreshold: highValueThreshold !== undefined ? Number(highValueThreshold) : undefined,
        recoveryWindowHours: recoveryWindowHours !== undefined ? Number(recoveryWindowHours) : undefined,
        automaticRecoveryEnabled: automaticRecoveryEnabled !== undefined ? Boolean(automaticRecoveryEnabled) : undefined,
        allowedActions: allowedActions ? allowedActions : undefined,
      },
    });

    // Log POLICY_UPDATE Audit Event (omitting sensitive keys)
    await createAuditLog({
      merchantId,
      eventType: 'POLICY_UPDATE',
      action: 'Merchant Policy Rules Modified',
      reason: 'Merchant modified recovery thresholds & retry limits',
      actor: 'Merchant Admin',
      status: 'Completed',
      metadata: {
        maxRetries: updated.maxRetries,
        maxAutoRecoveryAmount: updated.maxAutoRecoveryAmount,
        highValueThreshold: updated.highValueThreshold,
        recoveryWindowHours: updated.recoveryWindowHours,
        automaticRecoveryEnabled: updated.automaticRecoveryEnabled,
        allowedActions: updated.allowedActions,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
