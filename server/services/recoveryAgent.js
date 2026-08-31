import prisma from '../config/database.js';
import { validateActionAgainstPolicy } from './policyEngine.js';
import { createAuditLog } from './auditService.js';
import { executeTestPaymentRetry } from './razorpayService.js';

/**
 * Executes a single controlled autonomous recovery action for a RevenueRisk event
 */
export async function executeAutonomousRecoveryAgent({ merchantId, riskId, actionType = 'retry_payment', actor = 'AI Agent', isMerchantApproved = false }) {
  // 1. Load RevenueRisk record with relations
  const risk = await prisma.revenueRisk.findFirst({
    where: {
      merchantId,
      OR: [{ id: riskId }, { orderId: riskId }],
    },
    include: {
      order: true,
      customer: true,
      payment: true,
      aiDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!risk) {
    return {
      success: false,
      status: 'error',
      message: 'Revenue risk record not found or access denied.',
    };
  }

  // 2. Idempotency Check: Verify if already recovered
  if (risk.status === 'recovered') {
    return {
      success: true,
      status: 'already_recovered',
      message: `Transaction for order #${risk.orderId} has already been successfully recovered.`,
      risk,
    };
  }

  // Concurrency Guard: Verify if currently executing
  if (risk.status === 'executing' || risk.status === 'recovering') {
    return {
      success: true,
      status: 'already_executing',
      message: `Recovery action for order #${risk.orderId} is currently executing in background.`,
      risk,
    };
  }

  // 3. Load Merchant Policy
  const policy = await prisma.merchantPolicy.findUnique({
    where: { merchantId },
  });

  // Determine actual action type
  const targetAction = actionType || risk.aiDecisions[0]?.recommendedAction || 'retry_payment';

  // Check if explicit merchant authorization was granted
  const isApproved = isMerchantApproved || actor === 'Merchant Admin';

  // 4. Policy Engine Authority Check (MANDATORY BEFORE ANY EXECUTION)
  const policyCheck = validateActionAgainstPolicy(policy, risk, targetAction, isApproved);

  if (!policyCheck.allowed) {
    // Record Blocked RecoveryAction in MySQL
    const blockedAction = await prisma.recoveryAction.create({
      data: {
        merchantId,
        revenueRiskId: risk.id,
        actionType: targetAction,
        amount: risk.amount,
        attemptNumber: risk.recoveryAttempts + 1,
        status: 'blocked',
        result: policyCheck.reason,
        approvedBy: actor,
      },
    });

    // Log Audit Event: RECOVERY_BLOCKED_POLICY
    await createAuditLog({
      merchantId,
      eventType: 'RECOVERY_BLOCKED_POLICY',
      entityId: risk.id,
      action: `Autonomous Recovery Blocked: ${targetAction}`,
      reason: policyCheck.reason,
      amount: risk.amount,
      policyResult: 'Blocked',
      actor,
      status: 'Failed',
      metadata: {
        maxAutoRecoveryAmount: policy?.maxAutoRecoveryAmount,
        maxRetries: policy?.maxRetries,
      },
    });

    // Update RevenueRisk status to escalated
    const updatedRisk = await prisma.revenueRisk.update({
      where: { id: risk.id },
      data: { status: 'escalated' },
    });

    return {
      success: false,
      status: 'merchant_approval_required',
      message: policyCheck.reason,
      risk: updatedRisk,
      recoveryAction: blockedAction,
    };
  }

  // 5. Handle Non-Direct Action Types (e.g. send_reminder, customer_recheckout, escalate, stop)
  if (targetAction === 'send_reminder' || targetAction === 'customer_recheckout') {
    const actionRecord = await prisma.recoveryAction.create({
      data: {
        merchantId,
        revenueRiskId: risk.id,
        actionType: targetAction,
        amount: risk.amount,
        attemptNumber: risk.recoveryAttempts + 1,
        status: 'pending',
        result: `Customer recovery link generated for ${targetAction}. Awaiting customer interaction.`,
        approvedBy: actor,
      },
    });

    await createAuditLog({
      merchantId,
      eventType: 'CUSTOMER_ACTION_INITIATED',
      entityId: risk.id,
      action: `Customer Workflow Triggered: ${targetAction}`,
      reason: 'Policy engine approved customer notification workflow',
      amount: risk.amount,
      actor,
      status: 'Completed',
    });

    return {
      success: true,
      status: 'pending_customer_action',
      message: `Customer recovery link generated for ${targetAction}.`,
      recoveryAction: actionRecord,
    };
  }

  if (targetAction === 'escalate') {
    const updatedRisk = await prisma.revenueRisk.update({
      where: { id: risk.id },
      data: { status: 'escalated' },
    });

    await createAuditLog({
      merchantId,
      eventType: 'RECOVERY_ESCALATED',
      entityId: risk.id,
      action: 'Escalated to Merchant Support',
      reason: 'AI recommendation or policy rule required escalation',
      amount: risk.amount,
      actor,
      status: 'Completed',
    });

    return {
      success: true,
      status: 'escalated',
      message: 'Transaction escalated to merchant support team.',
      risk: updatedRisk,
    };
  }

  if (targetAction === 'stop') {
    const updatedRisk = await prisma.revenueRisk.update({
      where: { id: risk.id },
      data: { status: 'stopped' },
    });

    await createAuditLog({
      merchantId,
      eventType: 'RECOVERY_STOPPED',
      entityId: risk.id,
      action: 'Automatic Recovery Halted',
      reason: 'Recovery engine stopped by policy or merchant decision',
      amount: risk.amount,
      actor,
      status: 'Completed',
    });

    return {
      success: true,
      status: 'stopped',
      message: 'Automatic recovery halted for this event.',
      risk: updatedRisk,
    };
  }

  // 6. Execute Allowed Automated Payment Retry via Razorpay TEST API
  const attemptNumber = risk.recoveryAttempts + 1;

  // Create executing RecoveryAction
  const executingAction = await prisma.recoveryAction.create({
    data: {
      merchantId,
      revenueRiskId: risk.id,
      actionType: 'retry_payment',
      amount: risk.amount,
      attemptNumber,
      status: 'executing',
      result: 'Initiating Razorpay TEST payment retry transaction...',
      approvedBy: actor,
    },
  });

  // Call Razorpay TEST execution service
  const retryResult = await executeTestPaymentRetry({
    orderId: risk.orderId,
    amount: risk.amount,
    currency: risk.order.currency,
  });

  const isSuccess = retryResult.success;
  const newStatus = isSuccess ? 'recovered' : attemptNumber >= (policy?.maxRetries || 2) ? 'escalated' : 'failed';

  // 7. Update MySQL database records atomically via transaction
  const [updatedRisk, updatedAction] = await prisma.$transaction([
    prisma.revenueRisk.update({
      where: { id: risk.id },
      data: {
        status: newStatus,
        recoveryAttempts: attemptNumber,
        recoveredAmount: isSuccess ? risk.amount : risk.recoveredAmount,
      },
    }),
    prisma.recoveryAction.update({
      where: { id: executingAction.id },
      data: {
        status: isSuccess ? 'success' : 'failed',
        result: isSuccess
          ? `Razorpay TEST payment retry succeeded (${retryResult.razorpayPaymentId})`
          : 'Payment retry declined by gateway',
      },
    }),
  ]);

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

  // 8. Create Audit Log Entry
  await createAuditLog({
    merchantId,
    eventType: isSuccess ? 'RECOVERY_SUCCESS' : 'RECOVERY_FAILED',
    entityId: risk.id,
    action: isSuccess ? 'Razorpay TEST Payment Recovered' : 'Payment Retry Failed',
    reason: isSuccess ? policyCheck.reason : 'Gateway decline on retry attempt',
    amount: risk.amount,
    policyResult: 'Allowed',
    actor,
    status: isSuccess ? 'Completed' : 'Failed',
    metadata: {
      razorpayPaymentId: retryResult.razorpayPaymentId,
      attemptNumber,
      isMerchantApproved: isApproved,
    },
  });

  return {
    success: isSuccess,
    status: isSuccess ? 'recovered' : 'failed',
    message: isSuccess
      ? `Successfully recovered ₹${risk.amount.toLocaleString()} via Razorpay TEST API!`
      : 'Payment retry failed on gateway attempt.',
    risk: updatedRisk,
    recoveryAction: updatedAction,
  };
}

/**
 * Runs autonomous scan across all recoverable risks for a merchant
 */
export async function runAutonomousRecoveryScan(merchantId) {
  const recoverableRisks = await prisma.revenueRisk.findMany({
    where: {
      merchantId,
      eligibleForRecovery: true,
      status: { in: ['at_risk', 'recoverable', 'recovering', 'pending'] },
    },
  });

  let processedCount = 0;
  let recoveredCount = 0;
  let blockedCount = 0;

  for (const risk of recoverableRisks) {
    processedCount++;
    const result = await executeAutonomousRecoveryAgent({
      merchantId,
      riskId: risk.id,
      actionType: 'retry_payment',
      actor: 'Autonomous AI Recovery Agent',
      isMerchantApproved: false,
    });

    if (result.status === 'recovered') {
      recoveredCount++;
    } else if (result.status === 'merchant_approval_required' || result.status === 'blocked') {
      blockedCount++;
    }
  }

  await createAuditLog({
    merchantId,
    eventType: 'AUTONOMOUS_SCAN_COMPLETED',
    action: 'Autonomous AI Recovery Agent Scan Completed',
    reason: `Scanned ${recoverableRisks.length} events, processed ${processedCount}, recovered ${recoveredCount}, blocked ${blockedCount}`,
    actor: 'Autonomous AI Recovery Agent',
    status: 'Completed',
  });

  return {
    scannedCount: recoverableRisks.length,
    processedCount,
    recoveredCount,
    blockedCount,
  };
}
