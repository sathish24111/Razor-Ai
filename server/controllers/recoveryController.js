import prisma from '../config/database.js';
import { executeAutonomousRecoveryAgent, runAutonomousRecoveryScan } from '../services/recoveryAgent.js';
import { diagnoseFailureTelemetry } from '../services/aiService.js';
import { createAuditLog } from '../services/auditService.js';

export async function analyze(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    const risk = await prisma.revenueRisk.findFirst({
      where: {
        merchantId,
        OR: [{ id: riskId }, { orderId: riskId }],
      },
      include: { payment: true },
    });

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Revenue risk record not found or access denied.' });
    }

    const aiDiagnosis = await diagnoseFailureTelemetry({
      failureReason: risk.reason,
      amount: risk.amount,
    });

    const createdDecision = await prisma.aIDecision.create({
      data: {
        merchantId,
        revenueRiskId: risk.id,
        diagnosis: aiDiagnosis.diagnosis,
        riskLevel: aiDiagnosis.riskLevel,
        recommendedAction: aiDiagnosis.recommendedAction,
        confidence: aiDiagnosis.confidence,
        requiresCustomerAction: aiDiagnosis.requiresCustomerAction,
        requiresMerchantApproval: aiDiagnosis.requiresMerchantApproval,
        recoverability: aiDiagnosis.recoverability,
        explanation: aiDiagnosis.explanation,
      },
    });

    res.json({ success: true, data: createdDecision });
  } catch (error) {
    next(error);
  }
}

export async function executeAgent(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId, actionType } = req.body;
    const targetRiskId = riskId || req.params.riskId;

    const result = await executeAutonomousRecoveryAgent({
      merchantId,
      riskId: targetRiskId,
      actionType: actionType || 'retry_payment',
      actor: 'Autonomous AI Recovery Agent',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function scanAgent(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const scanResult = await runAutonomousRecoveryScan(merchantId);
    res.json({ success: true, data: scanResult });
  } catch (error) {
    next(error);
  }
}

export async function approve(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    // 1. Verify risk ownership
    const risk = await prisma.revenueRisk.findFirst({
      where: {
        merchantId,
        OR: [{ id: riskId }, { orderId: riskId }],
      },
    });

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Revenue risk record not found or access denied.' });
    }

    // 2. Log Audit Event: MERCHANT_APPROVAL_GRANTED
    await createAuditLog({
      merchantId,
      eventType: 'MERCHANT_APPROVAL_GRANTED',
      entityId: risk.id,
      action: 'Merchant Admin Approved Recovery Action',
      reason: `Merchant explicitly approved recovery for order #${risk.orderId}`,
      amount: risk.amount,
      actor: 'Merchant Admin',
      status: 'Completed',
    });

    // 3. Delegate execution to Recovery Agent
    const result = await executeAutonomousRecoveryAgent({
      merchantId,
      riskId: risk.id,
      actionType: 'retry_payment',
      actor: 'Merchant Admin',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function retry(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    const result = await executeAutonomousRecoveryAgent({
      merchantId,
      riskId,
      actionType: 'retry_payment',
      actor: 'Customer',
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function escalate(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    const risk = await prisma.revenueRisk.updateMany({
      where: {
        merchantId,
        OR: [{ id: riskId }, { orderId: riskId }],
      },
      data: { status: 'escalated' },
    });

    await createAuditLog({
      merchantId,
      eventType: 'RECOVERY_ESCALATED',
      entityId: riskId,
      action: 'Escalated to Merchant Support',
      reason: 'Manual escalation triggered by merchant admin',
      actor: 'Merchant Admin',
      status: 'Completed',
    });

    res.json({ success: true, message: 'Event escalated to merchant support.', data: risk });
  } catch (error) {
    next(error);
  }
}

export async function stop(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    const risk = await prisma.revenueRisk.findFirst({
      where: {
        merchantId,
        OR: [{ id: riskId }, { orderId: riskId }],
      },
    });

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Revenue risk record not found or access denied.' });
    }

    // 1. Create RecoveryAction record: actionType = "stop", status = "completed"
    await prisma.recoveryAction.create({
      data: {
        merchantId,
        revenueRiskId: risk.id,
        actionType: 'stop',
        amount: risk.amount,
        attemptNumber: risk.recoveryAttempts + 1,
        status: 'completed',
        result: 'Automatic recovery stopped by merchant admin.',
        approvedBy: 'Merchant Admin',
      },
    });

    // 2. Update RevenueRisk: status = "stopped", eligibleForRecovery = false
    const updatedRisk = await prisma.revenueRisk.update({
      where: { id: risk.id },
      data: {
        status: 'stopped',
        eligibleForRecovery: false,
      },
    });

    // 3. Create AuditLog: MERCHANT_RECOVERY_STOPPED
    await createAuditLog({
      merchantId,
      eventType: 'MERCHANT_RECOVERY_STOPPED',
      entityId: risk.id,
      action: 'Merchant Stopped Automatic Recovery',
      reason: `Merchant explicitly stopped recovery workflow for order #${risk.orderId}`,
      amount: risk.amount,
      actor: 'Merchant Admin',
      status: 'Completed',
    });

    res.json({
      success: true,
      message: 'Automatic recovery stopped successfully.',
      data: updatedRisk,
    });
  } catch (error) {
    next(error);
  }
}
