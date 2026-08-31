import { 
  getOverviewAnalytics, 
  getPaymentAnalytics, 
  getFailureReasonAnalytics, 
  getRecoveryAnalytics, 
  getAIAnalytics, 
  getPolicyAnalytics, 
  getRecoveryFunnel 
} from '../services/analyticsService.js';

export async function getOverview(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const overview = await getOverviewAnalytics(merchantId);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

export async function getPayments(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const payments = await getPaymentAnalytics(merchantId);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
}

export async function getReasons(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const reasons = await getFailureReasonAnalytics(merchantId);
    res.json({ success: true, data: reasons });
  } catch (error) {
    next(error);
  }
}

export async function getRecovery(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const recovery = await getRecoveryAnalytics(merchantId);
    res.json({ success: true, data: recovery });
  } catch (error) {
    next(error);
  }
}

export async function getAI(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const aiStats = await getAIAnalytics(merchantId);
    res.json({ success: true, data: aiStats });
  } catch (error) {
    next(error);
  }
}

export async function getPolicy(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const policyStats = await getPolicyAnalytics(merchantId);
    res.json({ success: true, data: policyStats });
  } catch (error) {
    next(error);
  }
}

export async function getFunnel(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const funnel = await getRecoveryFunnel(merchantId);
    res.json({ success: true, data: funnel });
  } catch (error) {
    next(error);
  }
}

export async function exportAnalytics(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const overview = await getOverviewAnalytics(merchantId);
    const funnel = await getRecoveryFunnel(merchantId);
    const reasons = await getFailureReasonAnalytics(merchantId);

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue (INR)', overview.totalRevenue],
      ['Recovered Revenue (INR)', overview.recoveredRevenue],
      ['At Risk Revenue (INR)', overview.atRiskRevenue],
      ['Lost Revenue (INR)', overview.lostRevenue],
      ['Recovery Rate (%)', overview.recoveryRate],
      ['Total Payments', overview.totalPayments],
      ['Successful Payments', overview.successfulPayments],
      ['Failed Payments', overview.failedPayments],
      ['Funnel: Failed Payments', funnel.failedPayments],
      ['Funnel: Revenue Risks', funnel.revenueRisks],
      ['Funnel: AI Analyzed', funnel.aiAnalyzed],
      ['Funnel: Policy Approved', funnel.policyApproved],
      ['Funnel: Recovery Attempts', funnel.recoveryAttempts],
      ['Funnel: Successful Recoveries', funnel.successfulRecoveries],
    ];

    reasons.forEach(r => {
      rows.push([`Failure Reason: ${r.reason} (Count)`, r.count]);
      rows.push([`Failure Reason: ${r.reason} (Amount INR)`, r.amount]);
    });

    const csvContent = [headers.join(','), ...rows.map(r => `"${r[0]}","${r[1]}"`)].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="razorrecover_analytics_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
