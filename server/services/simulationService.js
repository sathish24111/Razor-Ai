import prisma from '../config/database.js';
import { createAuditLog } from './auditService.js';

const SUPPORTED_REASONS = [
  'INSUFFICIENT_FUNDS',
  'CARD_DECLINED',
  'CARD_LIMIT_EXCEEDED',
  '3DS_OTP_TIMEOUT',
  'AUTHENTICATION_FAILED',
  'GATEWAY_ERROR',
  'TIMEOUT',
  'NETWORK_ERROR',
  'UNKNOWN',
];

/**
 * Checks whether payment simulation mode is active (Strict opt-in: must be explicitly 'true')
 */
export function isSimulationModeEnabled() {
  return process.env.PAYMENT_SIMULATION_MODE === 'true';
}

/**
 * Normalizes payment failure reason
 */
export function normalizeFailureReason(reason) {
  if (!reason) return 'INSUFFICIENT_FUNDS';
  const upper = String(reason).toUpperCase().trim();
  if (SUPPORTED_REASONS.includes(upper)) return upper;
  
  if (upper.includes('OTP') || upper.includes('3D') || upper.includes('AUTH')) return '3DS_OTP_TIMEOUT';
  if (upper.includes('FUND') || upper.includes('BALANCE')) return 'INSUFFICIENT_FUNDS';
  if (upper.includes('LIMIT') || upper.includes('EXCEED')) return 'CARD_LIMIT_EXCEEDED';
  if (upper.includes('DECLINE')) return 'CARD_DECLINED';
  if (upper.includes('GATEWAY')) return 'GATEWAY_ERROR';
  if (upper.includes('TIMEOUT')) return 'TIMEOUT';
  if (upper.includes('NETWORK')) return 'NETWORK_ERROR';

  return 'UNKNOWN';
}

/**
 * Creates a single simulated payment failure in MySQL without calling Razorpay
 */
export async function createSimulatedPayment({ merchantId, amount = 4999, currency = 'INR', failureReason = 'INSUFFICIENT_FUNDS', customerId = null }) {
  if (!isSimulationModeEnabled()) {
    throw new Error('Payment simulation mode is currently disabled.');
  }

  const normalizedReason = normalizeFailureReason(failureReason);
  const simAmount = Number(amount);

  // 1. Get or create target customer
  let targetCustomerId = customerId;
  if (!targetCustomerId) {
    const existingCustomer = await prisma.customer.findFirst({ where: { merchantId } });
    targetCustomerId = existingCustomer?.id;
  }

  if (!targetCustomerId) {
    const newCustomer = await prisma.customer.create({
      data: {
        merchantId,
        name: 'Aarav Mehta (Simulated)',
        email: `aarav_${Math.floor(1000 + Math.random() * 9000)}@example.com`,
        phone: '+91 98765 00000',
      },
    });
    targetCustomerId = newCustomer.id;
  }

  // 2. Create local Order in MySQL
  const order = await prisma.order.create({
    data: {
      merchantId,
      customerId: targetCustomerId,
      amount: simAmount,
      currency,
      status: 'failed',
      razorpayOrderId: `order_sim_${Math.floor(100000 + Math.random() * 900000)}`,
    },
  });

  // 3. Create local Payment in MySQL
  const payment = await prisma.payment.create({
    data: {
      merchantId,
      orderId: order.id,
      customerId: targetCustomerId,
      amount: simAmount,
      currency,
      status: 'failed',
      failureReason: normalizedReason,
      attemptNumber: 1,
      razorpayPaymentId: `pay_sim_${Math.floor(100000 + Math.random() * 900000)}`,
    },
  });

  // 4. Update Customer failed count
  await prisma.customer.update({
    where: { id: targetCustomerId },
    data: { failedPayments: { increment: 1 } },
  });

  // 5. Create RevenueRisk record in MySQL
  const riskLevel = simAmount > 10000 ? 'high' : 'medium';
  const risk = await prisma.revenueRisk.create({
    data: {
      merchantId,
      orderId: order.id,
      customerId: targetCustomerId,
      paymentId: payment.id,
      amount: simAmount,
      reason: normalizedReason,
      riskLevel,
      status: 'recoverable',
      eligibleForRecovery: true,
      recoveryAttempts: 0,
      recoveredAmount: 0.0,
    },
  });

  // 6. Create initial AIDecision placeholder (normalized confidence = 0.90)
  await prisma.aIDecision.create({
    data: {
      merchantId,
      revenueRiskId: risk.id,
      diagnosis: normalizedReason.toLowerCase(),
      riskLevel,
      recommendedAction: normalizedReason === 'INSUFFICIENT_FUNDS' ? 'customer_recheckout' : 'retry_payment',
      confidence: 0.90,
      requiresCustomerAction: normalizedReason === 'INSUFFICIENT_FUNDS',
      requiresMerchantApproval: simAmount > 10000,
      recoverability: 'high',
      explanation: `Simulated payment failure (${normalizedReason}) created. Ready for policy evaluation.`,
    },
  });

  // 7. Create Audit Log Entry
  await createAuditLog({
    merchantId,
    eventType: 'SIMULATION_CREATED',
    entityId: risk.id,
    action: 'Simulated Payment Failure Created',
    reason: `Simulated telemetry signal: ${normalizedReason}`,
    amount: simAmount,
    policyResult: 'Allowed',
    actor: 'Merchant Admin',
    status: 'Completed',
    metadata: {
      orderId: order.id,
      paymentId: payment.id,
      failureReason: normalizedReason,
      simulationMode: true,
    },
  });

  return {
    success: true,
    riskId: risk.id,
    paymentId: payment.id,
    orderId: order.id,
    amount: simAmount,
    currency,
    failureReason: normalizedReason,
    status: 'recoverable',
  };
}

/**
 * Creates a batch of simulated payment failure scenarios
 */
export async function createBatchSimulation({ merchantId, count = 10 }) {
  if (!isSimulationModeEnabled()) {
    throw new Error('Payment simulation mode is currently disabled.');
  }

  const batchCount = Math.min(Math.max(Number(count), 1), 50); // Cap between 1 and 50
  const createdRisks = [];

  const sampleAmounts = [1999, 2999, 4999, 7999, 9999, 14999, 24999];

  for (let i = 0; i < batchCount; i++) {
    const failureReason = SUPPORTED_REASONS[i % SUPPORTED_REASONS.length];
    const amount = sampleAmounts[i % sampleAmounts.length];

    const result = await createSimulatedPayment({
      merchantId,
      amount,
      currency: 'INR',
      failureReason,
    });

    createdRisks.push(result);
  }

  await createAuditLog({
    merchantId,
    eventType: 'SIMULATION_BATCH_CREATED',
    action: 'Batch Payment Simulation Executed',
    reason: `Generated ${batchCount} deterministic payment failure scenarios in MySQL`,
    actor: 'Merchant Admin',
    status: 'Completed',
    metadata: { createdCount: batchCount },
  });

  return {
    success: true,
    created: createdRisks.length,
    recoverable: createdRisks.length,
    scenarios: createdRisks,
  };
}
