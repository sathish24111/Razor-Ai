import prisma from '../config/database.js';

export async function getOrders(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const orders = await prisma.order.findMany({
      where: { merchantId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        payments: true,
        revenueRisks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, merchantId },
      include: {
        customer: true,
        payments: true,
        revenueRisks: {
          include: { aiDecisions: true, recoveryActions: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { customerId, amount, currency } = req.body;

    const order = await prisma.order.create({
      data: {
        merchantId,
        customerId,
        amount: Number(amount),
        currency: currency || 'INR',
        status: 'created',
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}
