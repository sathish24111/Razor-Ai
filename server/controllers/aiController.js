import prisma from '../config/database.js';
import { diagnoseFailureTelemetry } from '../services/aiService.js';
import { validateActionAgainstPolicy } from '../services/policyEngine.js';
import { createAuditLog } from '../services/auditService.js';

export async function analyzePaymentRisk(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { riskId } = req.params;

    // 1. Multi-Tenant Authorization Check
    const risk = await prisma.revenueRisk.findFirst({
      where: {
        merchantId,
        OR: [{ id: riskId }, { orderId: riskId }],
      },
      include: {
        order: true,
        customer: true,
        payment: true,
      },
    });

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Revenue risk record not found or access denied.',
      });
    }

    // 2. Fetch Merchant Policy
    const policy = await prisma.merchantPolicy.findUnique({
      where: { merchantId },
    });

    // 3. Log Audit Event: AI_ANALYSIS_STARTED
    await createAuditLog({
      merchantId,
      eventType: 'AI_ANALYSIS_STARTED',
      entityId: risk.id,
      action: 'AI Telemetry Diagnosis Requested',
      reason: `Analyzing failure telemetry for order #${risk.orderId}`,
      amount: risk.amount,
      actor: 'Merchant Admin',
      status: 'Completed',
    });

    // 4. Call AI Service for Diagnosis (with privacy filtering)
    const aiResult = await diagnoseFailureTelemetry({
      amount: risk.amount,
      currency: risk.order.currency,
      failureReason: risk.reason || risk.payment?.failureReason || '3DS_OTP_TIMEOUT',
      attemptNumber: risk.recoveryAttempts + 1,
      customer: risk.customer,
      policy: policy,
    });

    // 5. Handle Audit Logs based on AI Execution Result
    if (aiResult.usedFallback) {
      await createAuditLog({
        merchantId,
        eventType: 'AI_ANALYSIS_FAILED',
        entityId: risk.id,
        action: 'LLM API Unreachable or Validation Error',
        reason: aiResult.fallbackReason || 'OpenAI API call failed',
        actor: 'System',
        status: 'Failed',
      });

      await createAuditLog({
        merchantId,
        eventType: 'AI_ANALYSIS_FALLBACK',
        entityId: risk.id,
        action: 'Deterministic Fallback Diagnosis Applied',
        reason: `Mapped telemetry code (${risk.reason}) to deterministic fallback rules`,
        amount: risk.amount,
        policyResult: 'Allowed',
        actor: 'System',
        status: 'Completed',
      });
    } else {
      await createAuditLog({
        merchantId,
        eventType: 'AI_ANALYSIS_COMPLETED',
        entityId: risk.id,
        action: 'LLM Telemetry Diagnosis Completed',
        reason: `AI model (${aiResult.modelUsed}) generated structured diagnosis`,
        amount: risk.amount,
        policyResult: 'Allowed',
        actor: 'AI Agent',
        status: 'Completed',
      });
    }

    // 6. Policy Engine Preview Check (Policy Engine is the sole authority)
    const policyCheck = validateActionAgainstPolicy(policy, risk, aiResult.recommendedAction);

    const finalRequiresMerchantApproval = !policyCheck.allowed || risk.amount > (policy?.maxAutoRecoveryAmount || 10000);

    // 7. Save AIDecision Record in MySQL
    const savedDecision = await prisma.aIDecision.create({
      data: {
        merchantId,
        revenueRiskId: risk.id,
        diagnosis: aiResult.diagnosis,
        riskLevel: aiResult.riskLevel,
        recommendedAction: aiResult.recommendedAction,
        confidence: aiResult.confidence,
        requiresCustomerApproval: Boolean(aiResult.requiresCustomerApproval ?? policy?.requireCustomerApproval ?? true),
        requiresCustomerAction: Boolean(aiResult.requiresCustomerAction ?? true),
        requiresMerchantApproval: finalRequiresMerchantApproval,
        recoverability: aiResult.recoverability,
        explanation: aiResult.explanation,
      },
    });

    res.json({
      success: true,
      data: {
        ...savedDecision,
        usedFallback: aiResult.usedFallback,
        fallbackReason: aiResult.fallbackReason || null,
        policyCheck: {
          allowed: policyCheck.allowed,
          reason: policyCheck.reason,
          previewResult: policyCheck.allowed ? 'ALLOWED' : 'MERCHANT APPROVAL REQUIRED',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
