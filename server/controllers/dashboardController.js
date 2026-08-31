import prisma from '../config/database.js';

/**
 * Dashboard Controller for RazorRecover AI
 * Single source of truth for executive metrics, financial breakdown, and 7-day trend analytics.
 * All metrics derive 100% dynamically from MySQL database records.
 * Zero hardcoded fallback numbers.
 */
export async function getSummary(req, res, next) {
  try {
    const merchantId = req.merchant.id;

    // 1. Calculate Revenue at Risk: SUM(amount) of active/unrecovered RevenueRisk records
    const activeRiskAgg = await prisma.revenueRisk.aggregate({
      where: {
        merchantId,
        status: { in: ['at_risk', 'recoverable', 'recovering', 'pending'] },
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    // 2. Calculate Revenue Recovered: SUM(recoveredAmount) of recovered RevenueRisk records
    const recoveredRiskAgg = await prisma.revenueRisk.aggregate({
      where: {
        merchantId,
        status: 'recovered',
      },
      _sum: { recoveredAmount: true },
      _count: { _all: true },
    });

    // 3. Calculate Total Recovery Attempts & Successful Recoveries
    const attemptsAgg = await prisma.revenueRisk.aggregate({
      where: { merchantId },
      _sum: { recoveryAttempts: true },
    });

    const totalAttempts = attemptsAgg._sum.recoveryAttempts || 0;
    const successfulRecoveries = recoveredRiskAgg._count._all || 0;

    const recoveryRate = totalAttempts > 0
      ? Number(((successfulRecoveries / totalAttempts) * 100).toFixed(1))
      : 0.0;

    // 4. Calculate Risk Breakdown categories directly from active RevenueRisk population (Mutually Exclusive)
    const activeRisks = await prisma.revenueRisk.findMany({
      where: {
        merchantId,
        status: { in: ['at_risk', 'recoverable', 'recovering', 'pending'] },
      },
      select: { reason: true, amount: true },
    });

    let paymentFailuresAmount = 0;
    let checkoutAbandonmentAmount = 0;
    let subscriptionFailuresAmount = 0;

    activeRisks.forEach((r) => {
      const reason = String(r.reason || '').toUpperCase();
      if (['GATEWAY_ERROR', 'TIMEOUT', 'NETWORK_ERROR', 'AUTHENTICATION_FAILED', '3DS_OTP_TIMEOUT'].includes(reason)) {
        paymentFailuresAmount += r.amount;
      } else if (['INSUFFICIENT_FUNDS', 'CARD_DECLINED'].includes(reason)) {
        checkoutAbandonmentAmount += r.amount;
      } else {
        subscriptionFailuresAmount += r.amount;
      }
    });

    const totalActiveRiskAmount = activeRiskAgg._sum.amount || 0;

    // 5. Policy Status Breakdown Counts
    const [policyAllowed, policyApprovalRequired, policyBlocked] = await Promise.all([
      prisma.auditLog.count({ where: { merchantId, policyResult: 'Allowed' } }),
      prisma.revenueRisk.count({ where: { merchantId, status: 'escalated' } }),
      prisma.auditLog.count({ where: { merchantId, policyResult: 'Blocked' } }),
    ]);

    res.json({
      success: true,
      data: {
        revenueAtRisk: totalActiveRiskAmount,
        revenueRecovered: recoveredRiskAgg._sum.recoveredAmount || 0,
        recoveryAttempts: totalAttempts,
        successfulRecoveries: successfulRecoveries,
        recoveryRate: recoveryRate,
        activeRisksCount: activeRiskAgg._count._all || 0,
        breakdown: {
          paymentFailures: paymentFailuresAmount,
          checkoutAbandonment: checkoutAbandonmentAmount,
          subscriptionFailures: subscriptionFailuresAmount,
          total: totalActiveRiskAmount,
        },
        policyStatus: {
          allowed: policyAllowed || 0,
          approvalRequired: policyApprovalRequired || 0,
          blocked: policyBlocked || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryChart(req, res, next) {
  try {
    const merchantId = req.merchant.id;

    // Calculate 7-Day Detected Revenue at Risk vs Revenue Recovered from MySQL
    const now = new Date();
    const chartData = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(now);
      dayEnd.setDate(now.getDate() - i);
      dayEnd.setHours(23, 59, 59, 999);

      const [riskAgg, recoveredAgg] = await Promise.all([
        prisma.revenueRisk.aggregate({
          where: {
            merchantId,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { amount: true },
        }),
        prisma.revenueRisk.aggregate({
          where: {
            merchantId,
            status: 'recovered',
            updatedAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { recoveredAmount: true },
        }),
      ]);

      const label = `Day ${7 - i}`;
      const riskVal = riskAgg._sum.amount || 0;
      const recoveredVal = recoveredAgg._sum.recoveredAmount || 0;

      chartData.push({
        day: label,
        risk: riskVal,
        recovered: recoveredVal,
      });
    }

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
}
