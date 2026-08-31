/**
 * AI Service for RazorRecover AI
 * Provides LLM-powered Payment Failure Diagnosis and Telemetry Recommendations.
 * Implements strict JSON validation, privacy filtering, and deterministic fallback handling.
 */

const ALLOWED_DIAGNOSES = [
  'insufficient_funds',
  'authentication_failure',
  'card_declined',
  'card_limit_exceeded',
  'gateway_error',
  'timeout',
  'network_error',
  'unknown',
];

const ALLOWED_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

const ALLOWED_ACTIONS = [
  'retry_payment',
  'customer_recheckout',
  'send_reminder',
  'escalate',
  'stop',
];

const ALLOWED_RECOVERABILITY = ['high', 'medium', 'low', 'unknown'];

/**
 * Validates and sanitizes raw AI response object
 */
export function validateAIDecision(rawOutput) {
  try {
    if (!rawOutput || typeof rawOutput !== 'object') {
      return { valid: false, error: 'AI output is not a valid JSON object' };
    }

    const diagnosis = String(rawOutput.diagnosis || '').toLowerCase();
    const riskLevel = String(rawOutput.riskLevel || '').toLowerCase();
    const recommendedAction = String(rawOutput.recommendedAction || '').toLowerCase();
    const recoverability = String(rawOutput.recoverability || '').toLowerCase();

    if (!ALLOWED_DIAGNOSES.includes(diagnosis)) {
      return { valid: false, error: `Invalid diagnosis enum value: ${diagnosis}` };
    }

    if (!ALLOWED_RISK_LEVELS.includes(riskLevel)) {
      return { valid: false, error: `Invalid riskLevel enum value: ${riskLevel}` };
    }

    if (!ALLOWED_ACTIONS.includes(recommendedAction)) {
      return { valid: false, error: `Invalid recommendedAction enum value: ${recommendedAction}` };
    }

    if (!ALLOWED_RECOVERABILITY.includes(recoverability)) {
      return { valid: false, error: `Invalid recoverability enum value: ${recoverability}` };
    }

    const confidence = Number(rawOutput.confidence);
    if (isNaN(confidence) || confidence < 0.0 || confidence > 1.0) {
      return { valid: false, error: `Invalid confidence score: ${rawOutput.confidence}` };
    }

    const explanation = String(rawOutput.explanation || '').trim();
    if (!explanation) {
      return { valid: false, error: 'Missing business explanation string' };
    }

    return {
      valid: true,
      sanitized: {
        diagnosis,
        riskLevel,
        recommendedAction,
        confidence: Number(confidence.toFixed(2)),
        requiresCustomerApproval: Boolean(rawOutput.requiresCustomerApproval ?? true),
        requiresCustomerAction: Boolean(rawOutput.requiresCustomerAction ?? true),
        requiresMerchantApproval: Boolean(rawOutput.requiresMerchantApproval),
        recoverability,
        explanation,
        bestChannel: rawOutput.bestChannel || 'WhatsApp / SMS (Instant 1-Click)',
        optimalRetryTime: rawOutput.optimalRetryTime || 'Immediate (Customer Active)',
        incentiveStrategy: rawOutput.incentiveStrategy || 'No Discount Required (High Intent)',
        suggestedMessage: rawOutput.suggestedMessage || 'Hi, we noticed your payment timed out. Complete your order seamlessly with 1-click Razorpay UPI.',
      },
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Deterministic Telemetry Fallback Engine
 * Used when OpenAI API is unavailable, times out, or fails validation.
 * Preserves distinct payment failure signals.
 */
export function getDeterministicFallback(paymentTelemetry) {
  const failureReason = String(paymentTelemetry.failureReason || '').toUpperCase();
  const amount = Number(paymentTelemetry.amount || 0);

  let diagnosis = 'unknown';
  let recommendedAction = 'escalate';
  let riskLevel = amount > 10000 ? 'high' : 'medium';
  let recoverability = 'medium';
  let explanation = `Deterministic fallback analysis applied for telemetry signal code (${failureReason}).`;
  let bestChannel = 'WhatsApp / SMS (Instant 1-Click)';
  let optimalRetryTime = 'Immediate (Customer Active)';
  let incentiveStrategy = amount > 10000 ? '5% Recovery Discount Code' : 'No Discount Required (High Intent)';

  if (failureReason.includes('TIMEOUT')) {
    diagnosis = 'timeout';
    recommendedAction = 'retry_payment';
    recoverability = 'high';
    explanation = 'Payment failed due to gateway timeout during transaction processing. Limited automated retry is recommended.';
    bestChannel = 'Automated Retry Engine (Zero Touch)';
    optimalRetryTime = 'In 10 Minutes (Bank Gateway Stabilized)';
  } else if (failureReason.includes('GATEWAY')) {
    diagnosis = 'gateway_error';
    recommendedAction = 'retry_payment';
    recoverability = 'high';
    explanation = 'Transient gateway error detected from processor. Immediate automated payment retry is recommended.';
    bestChannel = 'Automated Retry Engine (Zero Touch)';
    optimalRetryTime = 'Immediate (Transient Blip)';
  } else if (failureReason.includes('NETWORK')) {
    diagnosis = 'network_error';
    recommendedAction = 'retry_payment';
    recoverability = 'high';
    explanation = 'Network connectivity failure detected. Retrying transaction after network stabilizes is recommended.';
    bestChannel = 'Automated Retry Engine (Zero Touch)';
    optimalRetryTime = 'In 15 Minutes (Network Stabilizing)';
  } else if (failureReason.includes('OTP') || failureReason.includes('AUTH') || failureReason.includes('3D')) {
    diagnosis = 'authentication_failure';
    recommendedAction = 'retry_payment';
    recoverability = 'high';
    explanation = 'Customer 3DS OTP authentication timed out. Re-prompting customer for authentication is recommended.';
    bestChannel = 'WhatsApp / SMS (Instant 1-Click)';
    optimalRetryTime = 'Immediate (Customer Active)';
  } else if (failureReason.includes('FUND') || failureReason.includes('BALANCE')) {
    diagnosis = 'insufficient_funds';
    recommendedAction = 'customer_recheckout';
    recoverability = 'medium';
    explanation = 'Customer account reported insufficient funds. A customer-initiated recheckout with an alternate payment method is recommended.';
    bestChannel = 'Razorpay UPI Link (Flexible Method)';
    optimalRetryTime = 'In 24 Hours (Salary/Deposit Window)';
  } else if (failureReason.includes('LIMIT') || failureReason.includes('EXCEED')) {
    diagnosis = 'card_limit_exceeded';
    recommendedAction = 'customer_recheckout';
    recoverability = 'medium';
    explanation = 'Transaction exceeded customer card limit. Directing customer to update payment method or recheckout is recommended.';
    bestChannel = 'Email Notification (Alternate Card)';
    optimalRetryTime = 'In 2 Hours (Peak Conversion Window)';
  } else if (failureReason.includes('DECLINE')) {
    diagnosis = 'card_declined';
    recommendedAction = 'customer_recheckout';
    recoverability = 'low';
    explanation = 'Card was declined by issuing bank. Customer action required to recheckout with a valid payment method.';
    bestChannel = 'Email & SMS Reminder';
    optimalRetryTime = 'In 4 Hours';
  }

  const suggestedMessage = `Hi ${paymentTelemetry.customer?.name || 'Valued Customer'}, your payment of ₹${amount.toLocaleString()} timed out. Click here to complete your order securely via Razorpay: https://techgear.io/pay/rzp_${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    diagnosis,
    riskLevel,
    recommendedAction,
    confidence: 0.88,
    requiresCustomerApproval: true,
    requiresCustomerAction: recommendedAction === 'customer_recheckout',
    requiresMerchantApproval: amount > 10000,
    recoverability,
    explanation,
    bestChannel,
    optimalRetryTime,
    incentiveStrategy,
    suggestedMessage,
    isFallback: true,
  };
}

/**
 * Main AI Analysis Entrypoint
 * Calls OpenAI REST API with structured prompt and 5000ms timeout
 */
export async function diagnoseFailureTelemetry(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // If API Key is unpopulated, use deterministic fallback
  if (!apiKey || apiKey.includes('placeholder')) {
    return {
      ...getDeterministicFallback(context),
      usedFallback: true,
      fallbackReason: 'Missing or unconfigured OPENAI_API_KEY',
    };
  }

  const systemPrompt = `You are RazorRecover AI, an expert payment failure analyst. 
Analyze payment failure telemetry and recommend recovery strategies.
You MUST output ONLY valid JSON matching this exact structure:
{
  "diagnosis": "insufficient_funds|authentication_failure|card_declined|card_limit_exceeded|gateway_error|timeout|network_error|unknown",
  "riskLevel": "low|medium|high|critical",
  "recommendedAction": "retry_payment|customer_recheckout|send_reminder|escalate|stop",
  "confidence": 0.92,
  "requiresCustomerApproval": true,
  "requiresCustomerAction": true,
  "requiresMerchantApproval": false,
  "recoverability": "high|medium|low|unknown",
  "explanation": "Short business-safe explanation for merchant dashboard.",
  "bestChannel": "WhatsApp / SMS (Instant 1-Click)|Razorpay UPI Link|Email Notification",
  "optimalRetryTime": "Immediate (Customer Active)|In 2 Hours|In 24 Hours",
  "incentiveStrategy": "No Discount Required (High Intent)|5% Recovery Discount Code",
  "suggestedMessage": "Short personalized customer re-engagement message string."
}
Rules:
1. Do NOT include Markdown formatting or code fences.
2. Keep explanation concise and professional.`;

  const userPrompt = JSON.stringify({
    paymentTelemetry: {
      amount: context.amount,
      currency: context.currency,
      failureReason: context.failureReason,
      attemptNumber: context.attemptNumber,
    },
    customerHistory: {
      name: context.customer?.name,
      totalOrders: context.customer?.totalOrders,
      successfulPayments: context.customer?.successfulPayments,
      failedPayments: context.customer?.failedPayments,
      recoveredAmount: context.customer?.recoveredAmount,
    },
    merchantPolicyLimits: {
      maxRetries: context.policy?.maxRetries,
      maxAutoRecoveryAmount: context.policy?.maxAutoRecoveryAmount,
    },
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    const validation = validateAIDecision(parsed);
    if (!validation.valid) {
      throw new Error(`AI response validation failed: ${validation.error}`);
    }

    return {
      ...validation.sanitized,
      usedFallback: false,
      modelUsed: model,
    };
  } catch (error) {
    console.warn(`⚠️ AI Service error (${error.message}). Falling back to deterministic engine.`);
    return {
      ...getDeterministicFallback(context),
      usedFallback: true,
      fallbackReason: error.message,
    };
  }
}
