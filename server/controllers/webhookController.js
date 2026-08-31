import prisma from '../config/database.js';
import { verifyWebhookSignature } from '../services/razorpayService.js';
import { createAuditLog } from '../services/auditService.js';

/**
 * Handle Razorpay Webhooks idempotently
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // 1. Verify Webhook Signature
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error('❌ Webhook signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const payload = req.body || {};
    const eventType = payload.event || 'unknown';
    const eventEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};
    
    // Unique Webhook Event ID for Idempotency
    const eventId = payload.event_id || `${eventEntity.id}_${eventType}`;

    // 2. Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      console.log(`ℹ️ [Webhook Idempotency] Duplicate event ${eventId} safely ignored.`);
      
      // Log duplicate detection audit entry
      if (eventEntity.notes?.merchantId) {
        await createAuditLog({
          merchantId: eventEntity.notes.merchantId,
          eventType: 'WEBHOOK_DUPLICATE',
          entityId: eventId,
          action: 'Duplicate Webhook Safely Ignored',
          reason: `Razorpay event ${eventId} (${eventType}) was already processed.`,
          actor: 'System',
          status: 'Completed',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Duplicate webhook safely ignored.',
      });
    }

    // Record Webhook Event in MySQL
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
        payload: payload,
      },
    });

    // Extract Merchant ID strictly from notes (No fallback to random merchant)
    const merchantId = eventEntity.notes?.merchantId;

    if (!merchantId) {
      console.warn(`⚠️ [Webhook Warning] Received webhook ${eventId} (${eventType}) without merchantId in payload notes.`);
      return res.status(400).json({
        success: false,
        message: 'Unidentifiable merchant webhook payload.',
      });
    }

    // Log Webhook Received Audit Entry
    await createAuditLog({
      merchantId,
      eventType: 'WEBHOOK_RECEIVED',
      entityId: eventId,
      action: `Webhook Received: ${eventType}`,
      reason: `Razorpay event ${eventType} payload validated`,
      actor: 'System',
      status: 'Completed',
    });

    // 3. Process Specific Events Idempotently
    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      const razorpayPaymentId = eventEntity.id;
      const razorpayOrderId = eventEntity.order_id;
      const amountInINR = (eventEntity.amount || 0) / 100;

      // Find local payment & order
      const localPayment = await prisma.payment.findFirst({
        where: {
          merchantId,
          OR: [
            { razorpayPaymentId },
            { razorpayOrderId },
          ],
        },
      });

      if (localPayment) {
        await prisma.$transaction(async (tx) => {
          // Update Payment
          await tx.payment.update({
            where: { id: localPayment.id },
            data: {
              status: 'success',
              razorpayPaymentId,
            },
          });

          // Update Order
          await tx.order.update({
            where: { id: localPayment.orderId },
            data: { status: 'paid' },
          });

          // Update Customer
          await tx.customer.update({
            where: { id: localPayment.customerId },
            data: {
              totalSpent: { increment: amountInINR },
              successfulPayments: { increment: 1 },
            },
          });

          // Update RevenueRisk if existing
          const existingRisk = await tx.revenueRisk.findFirst({
            where: { orderId: localPayment.orderId, merchantId },
          });

          if (existingRisk) {
            await tx.revenueRisk.update({
              where: { id: existingRisk.id },
              data: {
                status: 'recovered',
                recoveredAmount: amountInINR,
              },
            });
          }

          // Create Audit Log
          await tx.auditLog.create({
            data: {
              merchantId,
              eventType: 'PAYMENT_CAPTURED',
              entityId: localPayment.id,
              action: 'Razorpay Payment Captured',
              reason: 'Received payment.captured webhook confirmation',
              amount: amountInINR,
              policyResult: 'Allowed',
              actor: 'System',
              status: 'Completed',
              metadata: { razorpayPaymentId, razorpayOrderId },
            },
          });
        });
      }
    } else if (eventType === 'payment.failed') {
      const razorpayPaymentId = eventEntity.id;
      const razorpayOrderId = eventEntity.order_id;
      const amountInINR = (eventEntity.amount || 0) / 100;
      const rawError = eventEntity.error_description || eventEntity.failure_reason || '3DS OTP Timeout';

      // Normalize failure reason
      let normalizedReason = 'GATEWAY_ERROR';
      const lower = rawError.toLowerCase();
      if (lower.includes('otp') || lower.includes('auth') || lower.includes('3d')) normalizedReason = '3DS_OTP_TIMEOUT';
      else if (lower.includes('fund') || lower.includes('balance')) normalizedReason = 'INSUFFICIENT_FUNDS';
      else if (lower.includes('limit') || lower.includes('exceed')) normalizedReason = 'CARD_LIMIT_EXCEEDED';
      else if (lower.includes('decline')) normalizedReason = 'CARD_DECLINED';

      const localPayment = await prisma.payment.findFirst({
        where: {
          merchantId,
          OR: [
            { razorpayPaymentId },
            { razorpayOrderId },
          ],
        },
      });

      if (localPayment) {
        await prisma.$transaction(async (tx) => {
          // Update Payment
          await tx.payment.update({
            where: { id: localPayment.id },
            data: {
              status: 'failed',
              failureReason: normalizedReason,
            },
          });

          // Update Order
          await tx.order.update({
            where: { id: localPayment.orderId },
            data: { status: 'failed' },
          });

          // Update Customer failed count
          await tx.customer.update({
            where: { id: localPayment.customerId },
            data: { failedPayments: { increment: 1 } },
          });

          // Create RevenueRisk record if not existing
          const existingRisk = await tx.revenueRisk.findFirst({
            where: { orderId: localPayment.orderId, merchantId },
          });

          if (!existingRisk) {
            const riskLevel = amountInINR > 10000 ? 'high' : 'medium';
            const risk = await tx.revenueRisk.create({
              data: {
                merchantId,
                orderId: localPayment.orderId,
                customerId: localPayment.customerId,
                paymentId: localPayment.id,
                amount: amountInINR,
                reason: normalizedReason,
                riskLevel,
                status: 'recoverable',
                eligibleForRecovery: true,
                recoveryAttempts: 0,
                recoveredAmount: 0.0,
              },
            });

            // Create initial AI decision recommendation placeholder (normalized confidence = 0.90)
            await tx.aIDecision.create({
              data: {
                merchantId,
                revenueRiskId: risk.id,
                diagnosis: normalizedReason,
                riskLevel,
                recommendedAction: amountInINR > 10000 ? 'Send Payment Reminder with UPI' : 'Retry Payment',
                confidence: 0.90,
                requiresCustomerApproval: true,
                requiresMerchantApproval: amountInINR > 10000,
                explanation: `Payment failure (${normalizedReason}) logged. Eligible for automated retry policy.`,
              },
            });
          }

          // Create Audit Log
          await tx.auditLog.create({
            data: {
              merchantId,
              eventType: 'PAYMENT_FAILED',
              entityId: localPayment.id,
              action: 'Razorpay Payment Failed',
              reason: normalizedReason,
              amount: amountInINR,
              policyResult: 'Allowed',
              actor: 'System',
              status: 'Completed',
              metadata: { razorpayPaymentId, razorpayOrderId, rawError },
            },
          });
        });
      }
    } else if (eventType === 'order.paid') {
      const razorpayOrderId = eventEntity.id;
      await prisma.order.updateMany({
        where: { razorpayOrderId, merchantId },
        data: { status: 'paid' },
      });
    }

    res.status(200).json({
      success: true,
      message: `Webhook event ${eventType} processed successfully.`,
    });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error processing webhook event',
    });
  }
}
