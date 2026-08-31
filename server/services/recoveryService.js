import prisma from '../config/database.js';
import { validateActionAgainstPolicy } from './policyEngine.js';
import { createAuditLog } from './auditService.js';
import { executeTestPaymentRetry } from './razorpayService.js';

export async function processRecoveryAction({ merchantId, riskId, actionType, actor = 'Merchant Admin' }) {
  const risk = await prisma.revenueRisk.findFirst({
    where: { id: riskId, merchantId },
    include: { order: true, customer: true, payment: true },
  });

  if (!risk) {
    throw new Error('Revenue risk record not found or access denied.');
  }

  const policy = await prisma.merchantPolicy.findUnique({
    where: { merchantId },
  });

  // 1. Policy check
  const policyCheck = validateActionAgainstPolicy(policy, risk, actionType);

  if (!policyCheck.allowed) {
    // Log blocked audit event
    await createAuditLog({
      merchantId,
      eventType: 'POLICY_CHECK_BLOCKED',
      entityId: risk.id,
      action: `Recovery Action Blocked: ${actionType}`,
      reason: policyCheck.reason,
      amount: risk.amount,
      policyResult: 'Blocked',
      actor,
      status: 'Failed',
    });

    return {
      success: false,
      allowed: false,
      message: policyCheck.reason,
      risk,
    };
  }

  // 2. Execute simulated recovery action
  const paymentResult = await executeTestPaymentRetry({
    orderId: risk.orderId,
    amount: risk.amount,
    currency: risk.order.currency,
  });

  const isSuccess = paymentResult.success;
  const newAttempts = risk.recoveryAttempts + 1;
  const newStatus = isSuccess ? 'recovered' : newAttempts >= (policy?.maxRetries || 2) ? 'escalated' : 'failed';

  // 3. Update RevenueRisk
  const updatedRisk = await prisma.revenueRisk.update({
    where: { id: risk.id },
    data: {
      status: newStatus,
      recoveryAttempts: newAttempts,
      recoveredAmount: isSuccess ? risk.amount : risk.recoveredAmount,
    },
  });

  // 4. Create RecoveryAction record
  const recoveryAction = await prisma.recoveryAction.create({
    data: {
      merchantId,
      revenueRiskId: risk.id,
      actionType,
      amount: risk.amount,
      attemptNumber: newAttempts,
      status: isSuccess ? 'success' : 'failed',
      result: isSuccess ? `Payment retry successful via Razorpay Test API (${paymentResult.razorpayPaymentId})` : 'Payment retry declined by gateway',
      approvedBy: actor,
    },
  });

  // 5. Update Order & Customer stats if recovered
  if (isSuccess) {
    await prisma.order.update({
      where: { id: risk.orderId },
      data: { status: 'recovered' },
    });

    await prisma.customer.update({
      where: { id: risk.customerId },
      data: {
        recoveredAmount: { increment: risk.amount },
        successfulPayments: { increment: 1 },
      },
    });
  }

  // 6. Create Audit Log
  await createAuditLog({
    merchantId,
    eventType: isSuccess ? 'RECOVERY_SUCCESS' : 'RECOVERY_FAILED',
    entityId: risk.id,
    action: isSuccess ? 'Razorpay Test Payment Recovered' : 'Recovery Retry Failed',
    reason: isSuccess ? policyCheck.reason : 'Gateway decline on retry',
    amount: risk.amount,
    policyResult: 'Allowed',
    actor,
    status: isSuccess ? 'Completed' : 'Failed',
    metadata: {
      orderId: risk.orderId,
      customerName: risk.customer.name,
      razorpayPaymentId: paymentResult.razorpayPaymentId,
    },
  });

  return {
    success: isSuccess,
    allowed: true,
    message: isSuccess ? `Successfully recovered ₹${risk.amount.toLocaleString()}` : 'Payment retry failed',
    updatedRisk,
    recoveryAction,
  };
}
