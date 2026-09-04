import prisma from '../config/database.js';
import { createOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { createAuditLog } from '../services/auditService.js';

export async function getPayments(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const payments = await prisma.payment.findMany({
      where: { merchantId },
      include: {
        order: true,
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
}

export async function getPaymentById(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { id, merchantId },
      include: {
        order: true,
        customer: true,
        revenueRisks: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a Razorpay TEST Order
 * Converts INR to paise and creates local Order & Payment records in MySQL
 */
export async function createRazorpayOrder(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { amount, currency = 'INR', customerId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required.',
      });
    }

    // Get or fallback to first merchant customer
    let targetCustomerId = customerId;
    if (!targetCustomerId) {
      const firstCust = await prisma.customer.findFirst({ where: { merchantId } });
      targetCustomerId = firstCust?.id;
    }

    if (!targetCustomerId) {
      const createdCust = await prisma.customer.create({
        data: {
          merchantId,
          name: 'Walkin Customer',
          email: 'customer@example.com',
        },
      });
      targetCustomerId = createdCust.id;
    }

    // 1. Create Local Order in MySQL
    const localOrder = await prisma.order.create({
      data: {
        merchantId,
        customerId: targetCustomerId,
        amount: Number(amount),
        currency,
        status: 'created',
      },
    });

    // 2. Create Local Payment Record in MySQL
    const localPayment = await prisma.payment.create({
      data: {
        merchantId,
        orderId: localOrder.id,
        customerId: targetCustomerId,
        amount: Number(amount),
        currency,
        status: 'pending',
      },
    });

    // 3. Call Razorpay API to Create TEST Order (converting to paise)
    const razorpayOrder = await createOrder({
      amount: Number(amount),
      currency,
      receipt: `receipt_${localOrder.id.substring(0, 8)}`,
      notes: {
        merchantId,
        localOrderId: localOrder.id,
        localPaymentId: localPayment.id,
      },
    });

    // 4. Store razorpayOrderId in MySQL
    await prisma.order.update({
      where: { id: localOrder.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    await prisma.payment.update({
      where: { id: localPayment.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    // 5. Create Audit Log Entry
    await createAuditLog({
      merchantId,
      eventType: 'RAZORPAY_ORDER_CREATED',
      entityId: localOrder.id,
      action: 'Razorpay TEST Order Created',
      reason: 'Initiated checkout order via Razorpay TEST API',
      amount: Number(amount),
      policyResult: 'Allowed',
      actor: 'Merchant Admin',
      status: 'Completed',
      metadata: {
        localOrderId: localOrder.id,
        razorpayOrderId: razorpayOrder.id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: localOrder.id,
        paymentId: localPayment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verifies Razorpay Payment Signature
 */
export async function verifyRazorpayPayment(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters.',
      });
    }

    // 1. Cryptographic HMAC SHA256 Signature Verification
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await createAuditLog({
        merchantId,
        eventType: 'PAYMENT_VERIFICATION_FAILED',
        entityId: orderId || razorpay_order_id,
        action: 'Razorpay Signature Verification Failed',
        reason: 'HMAC signature mismatch on payment verification',
        actor: 'Customer',
        status: 'Failed',
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch',
      });
    }

    // 2. Find Local Order & Payment
    const localOrder = await prisma.order.findFirst({
      where: {
        merchantId,
        OR: [{ id: orderId }, { razorpayOrderId: razorpay_order_id }],
      },
      include: { payments: true },
    });

    if (!localOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order record not found.',
      });
    }

    const localPayment = localOrder.payments[0] || await prisma.payment.findFirst({
      where: { orderId: localOrder.id, merchantId },
    });

    // 3. Atomically Update Database Records using Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // Update Payment
      if (localPayment) {
        await tx.payment.update({
          where: { id: localPayment.id },
          data: {
            status: 'success',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
          },
        });
      }

      // Update Order
      await tx.order.update({
        where: { id: localOrder.id },
        data: { status: 'paid' },
      });

      // Update Customer Total Spent
      await tx.customer.update({
        where: { id: localOrder.customerId },
        data: {
          totalSpent: { increment: localOrder.amount },
          successfulPayments: { increment: 1 },
        },
      });

      // Resolve RevenueRisk if existing
      const existingRisk = await tx.revenueRisk.findFirst({
        where: { orderId: localOrder.id, merchantId },
      });

      if (existingRisk) {
        await tx.revenueRisk.update({
          where: { id: existingRisk.id },
          data: {
            status: 'recovered',
            recoveredAmount: localOrder.amount,
          },
        });
      }

      // Create Audit Log Entry
      await tx.auditLog.create({
        data: {
          merchantId,
          eventType: 'PAYMENT_SUCCESS',
          entityId: localOrder.id,
          action: 'Razorpay Test Payment Verified',
          reason: 'HMAC signature verified successfully',
          amount: localOrder.amount,
          policyResult: 'Allowed',
          actor: 'Customer',
          status: 'Completed',
          metadata: {
            razorpay_order_id,
            razorpay_payment_id,
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      data: {
        orderId: localOrder.id,
        razorpayPaymentId,
        amount: localOrder.amount,
        status: 'PAID',
      },
    });
  } catch (error) {
    next(error);
  }
}
