/**
 * PolicyEngine Service for RazorRecover AI
 * Single Source of Truth for Merchant Financial Safeguards.
 * Evaluates recovery actions against merchant rules before ANY payment execution.
 */
export function validateActionAgainstPolicy(merchantPolicy, revenueRisk, actionType = 'retry_payment', isMerchantApproved = false) {
  if (!merchantPolicy) {
    return {
      allowed: false,
      requiresMerchantApproval: false,
      reason: 'POLICY_NOT_FOUND',
      status: 'BLOCKED',
    };
  }

  // A. AUTOMATIC RECOVERY DISABLED
  if (!merchantPolicy.automaticRecoveryEnabled) {
    return {
      allowed: false,
      requiresMerchantApproval: false,
      reason: 'AUTOMATED_RECOVERY_DISABLED',
      status: 'BLOCKED',
    };
  }

  // B. MAX RETRIES
  if (revenueRisk.recoveryAttempts >= merchantPolicy.maxRetries) {
    return {
      allowed: false,
      requiresMerchantApproval: false,
      reason: 'MAX_RETRIES_REACHED',
      status: 'BLOCKED',
    };
  }

  // C. RECOVERY WINDOW
  const createdAt = new Date(revenueRisk.createdAt);
  const now = new Date();
  const elapsedHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  if (elapsedHours > merchantPolicy.recoveryWindowHours) {
    return {
      allowed: false,
      requiresMerchantApproval: false,
      reason: 'RECOVERY_WINDOW_EXPIRED',
      status: 'BLOCKED',
    };
  }

  // D. ACTION NOT ALLOWED
  let allowedActions = merchantPolicy.allowedActions;
  if (typeof allowedActions === 'string') {
    try {
      allowedActions = JSON.parse(allowedActions);
    } catch (e) {
      allowedActions = ['retry_payment', 'customer_recheckout', 'send_reminder', 'escalate', 'stop'];
    }
  }

  if (Array.isArray(allowedActions) && !allowedActions.includes(actionType)) {
    return {
      allowed: false,
      requiresMerchantApproval: false,
      reason: 'ACTION_NOT_ALLOWED',
      status: 'BLOCKED',
    };
  }

  // E. HIGH VALUE / AUTO RECOVERY LIMIT (Waived ONLY if explicit merchant admin approval is provided)
  const amount = Number(revenueRisk.amount || 0);
  const maxAutoLimit = Number(merchantPolicy.maxAutoRecoveryAmount || 10000);
  const highValueLimit = Number(merchantPolicy.highValueThreshold || 10000);

  if (!isMerchantApproved && (amount > maxAutoLimit || amount > highValueLimit)) {
    return {
      allowed: false,
      requiresMerchantApproval: true,
      reason: 'EXCEEDS_AUTO_RECOVERY_LIMIT',
      status: 'APPROVAL_REQUIRED',
    };
  }

  // F. ALLOWED
  return {
    allowed: true,
    requiresMerchantApproval: false,
    reason: isMerchantApproved 
      ? 'MERCHANT_ADMIN_APPROVAL_GRANTED' 
      : 'TRANSACTION_COMPLIES_WITH_POLICY',
    status: 'ALLOWED',
  };
}
