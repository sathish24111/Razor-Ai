import prisma from '../config/database.js';

/**
 * Analytics Engine Service for RazorRecover AI
 * Computes all metrics dynamically from MySQL database records.
 */

export async function getOverviewAnalytics(merchantId) {
  const [
    successfulPaymentAgg,
    failedPaymentAgg,
    pendingPaymentCount,
    totalPaymentCount,
    recoveredRiskAgg,
    atRiskAgg,
    lostRiskAgg,
    totalRiskCount,
    eligibleRiskCount,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { merchantId, status: 'success' },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { merchantId, status: 'failed' },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.count({ where: { merchantId, status: 'pending' } }),
    prisma.payment.count({ where: { merchantId } }),
    prisma.revenueRisk.aggregate({
      where: { merchantId, status: 'recovered' },
      _sum: { recoveredAmount: true },
      _count: { _all: true },
    }),
    prisma.revenueRisk.aggregate({
      where: { merchantId, status: { in: ['at_risk', 'recoverable', 'recovering', 'pending'] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.revenueRisk.aggregate({
      where: { merchantId, status: { in: ['failed', 'escalated', 'stopped'] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.revenueRisk.count({ where: { merchantId } }),
    prisma.revenueRisk.count({ where: { merchantId, eligibleForRecovery: true } }),
  ]);

  const totalRevenue = successfulPaymentAgg._sum.amount || 0;
  const recoveredRevenue = recoveredRiskAgg._sum.recoveredAmount || 0;
  const atRiskRevenue = atRiskAgg._sum.amount || 0;
  const lostRevenue = lostRiskAgg._sum.amount || 0;

  const successfulPayments = successfulPaymentAgg._count._all || 0;
  const failedPayments = failedPaymentAgg._count._all || 0;
  const successfulRecoveries = recoveredRiskAgg._count._all || 0;

  const recoveryRate = eligibleRiskCount > 0 
    ? Number(((successfulRecoveries / eligibleRiskCount) * 100).toFixed(1)) 
    : 0.0;

  const averageTransactionValue = totalPaymentCount > 0 
    ? Number(((totalRevenue + (failedPaymentAgg._sum.amount || 0)) / totalPaymentCount).toFixed(2)) 
    : 0.0;

  return {
    totalRevenue,
    recoveredRevenue,
    atRiskRevenue,
    lostRevenue,
    recoveryRate,
    totalPayments: totalPaymentCount,
    successfulPayments,
    failedPayments,
    pendingPayments: pendingPaymentCount,
    successfulRecoveries,
    totalRisks: totalRiskCount,
    eligibleRisks: eligibleRiskCount,
    averageTransactionValue,
  };
}

export async function getPaymentAnalytics(merchantId) {
  const [totalPayments, successfulPayments, failedPayments, pendingPayments] = await Promise.all([
    prisma.payment.count({ where: { merchantId } }),
    prisma.payment.count({ where: { merchantId, status: 'success' } }),
    prisma.payment.count({ where: { merchantId, status: 'failed' } }),
    prisma.payment.count({ where: { merchantId, status: 'pending' } }),
  ]);

  const failureRate = totalPayments > 0 
    ? Number(((failedPayments / totalPayments) * 100).toFixed(1)) 
    : 0.0;

  const paymentAgg = await prisma.payment.aggregate({
    where: { merchantId },
    _avg: { amount: true },
  });

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    failureRate,
    averageTransactionValue: Number((paymentAgg._avg.amount || 0).toFixed(2)),
    distribution: {
      success: successfulPayments,
      failed: failedPayments,
      pending: pendingPayments,
    },
  };
}

export async function getFailureReasonAnalytics(merchantId) {
  const failedPayments = await prisma.payment.findMany({
    where: { merchantId, status: 'failed' },
    select: { failureReason: true, amount: true },
  });

  const reasonMap = {};
  failedPayments.forEach(p => {
    const reason = p.failureReason || 'UNKNOWN';
    if (!reasonMap[reason]) {
      reasonMap[reason] = { reason, count: 0, amount: 0 };
    }
    reasonMap[reason].count += 1;
    reasonMap[reason].amount += p.amount;
  });

  const result = Object.values(reasonMap).sort((a, b) => b.count - a.count);
  return result;
}

export async function getRecoveryAnalytics(merchantId) {
  const [
    totalAttemptsAgg,
    recoveredAgg,
    failedRiskCount,
    blockedActionCount,
    executingActionCount,
  ] = await Promise.all([
    prisma.revenueRisk.aggregate({
      where: { merchantId },
      _sum: { recoveryAttempts: true },
      _count: { _all: true },
    }),
    prisma.revenueRisk.aggregate({
      where: { merchantId, status: 'recovered' },
      _sum: { recoveredAmount: true },
      _count: { _all: true },
    }),
    prisma.revenueRisk.count({ where: { merchantId, status: 'failed' } }),
    prisma.recoveryAction.count({ where: { merchantId, status: 'blocked' } }),
    prisma.recoveryAction.count({ where: { merchantId, status: 'executing' } }),
  ]);

  const totalRecoveryAttempts = totalAttemptsAgg._sum.recoveryAttempts || 0;
  const successfulRecoveries = recoveredAgg._count._all || 0;
  const recoveredRevenue = recoveredAgg._sum.recoveredAmount || 0;

  const recoverySuccessRate = totalRecoveryAttempts > 0 
    ? Number(((successfulRecoveries / totalRecoveryAttempts) * 100).toFixed(1)) 
    : 0.0;

  return {
    totalRecoveryAttempts,
    successfulRecoveries,
    failedRecoveries: failedRiskCount,
    blockedRecoveries: blockedActionCount,
    executingActions: executingActionCount,
    recoverySuccessRate,
    recoveredRevenue,
  };
}

export async function getAIAnalytics(merchantId) {
  const [
    totalDecisions,
    completedLogs,
    fallbackLogs,
    failedLogs,
    confidenceAgg,
  ] = await Promise.all([
    prisma.aIDecision.count({ where: { merchantId } }),
    prisma.auditLog.count({ where: { merchantId, eventType: 'AI_ANALYSIS_COMPLETED' } }),
    prisma.auditLog.count({ where: { merchantId, eventType: 'AI_ANALYSIS_FALLBACK' } }),
    prisma.auditLog.count({ where: { merchantId, eventType: 'AI_ANALYSIS_FAILED' } }),
    prisma.aIDecision.aggregate({
      where: { merchantId },
      _avg: { confidence: true },
    }),
  ]);

  const avgConf = confidenceAgg._avg.confidence || 0.90;
  const averageConfidence = Number((avgConf <= 1.0 ? avgConf * 100 : avgConf).toFixed(1));

  return {
    totalAnalyses: totalDecisions || (completedLogs + fallbackLogs),
    completed: completedLogs || totalDecisions,
    fallback: fallbackLogs,
    failed: failedLogs,
    averageConfidence,
  };
}

export async function getPolicyAnalytics(merchantId) {
  const [
    totalPolicyChecks,
    allowedLogs,
    blockedLogs,
    approvalRequiredLogs,
  ] = await Promise.all([
    prisma.auditLog.count({
      where: { merchantId, eventType: { in: ['POLICY_CHECK', 'RECOVERY_BLOCKED_POLICY', 'MERCHANT_APPROVAL_REQUIRED'] } },
    }),
    prisma.auditLog.count({ where: { merchantId, policyResult: 'Allowed' } }),
    prisma.auditLog.count({ where: { merchantId, policyResult: 'Blocked' } }),
    prisma.auditLog.count({ where: { merchantId, eventType: 'MERCHANT_APPROVAL_REQUIRED' } }),
  ]);

  const totalChecks = totalPolicyChecks || (allowedLogs + blockedLogs);
  const policyBlockRate = totalChecks > 0 
    ? Number(((blockedLogs / totalChecks) * 100).toFixed(1)) 
    : 0.0;

  return {
    totalPolicyChecks: totalChecks,
    allowedActions: allowedLogs,
    blockedActions: blockedLogs,
    approvalRequired: approvalRequiredLogs,
    policyBlockRate,
  };
}

export async function getRecoveryFunnel(merchantId) {
  const [
    failedPayments,
    revenueRisks,
    aiAnalyzed,
    policyApproved,
    recoveryAttempts,
    successfulRecoveries,
  ] = await Promise.all([
    prisma.payment.count({ where: { merchantId, status: 'failed' } }),
    prisma.revenueRisk.count({ where: { merchantId } }),
    prisma.aIDecision.count({ where: { merchantId } }),
    prisma.auditLog.count({ where: { merchantId, policyResult: 'Allowed' } }),
    prisma.revenueRisk.count({ where: { merchantId, recoveryAttempts: { gt: 0 } } }),
    prisma.revenueRisk.count({ where: { merchantId, status: 'recovered' } }),
  ]);

  return {
    failedPayments: Math.max(failedPayments, revenueRisks),
    revenueRisks,
    aiAnalyzed: Math.min(aiAnalyzed, revenueRisks),
    policyApproved: Math.min(policyApproved, revenueRisks),
    recoveryAttempts,
    successfulRecoveries,
  };
}
