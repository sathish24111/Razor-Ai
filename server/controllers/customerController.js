import prisma from '../config/database.js';

export async function getCustomers(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { search, page = 1, limit = 50 } = req.query;

    const where = { merchantId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, merchantId },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        revenueRisks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { aiDecisions: true, recoveryActions: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied.',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerOrders(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const orders = await prisma.order.findMany({
      where: { customerId: id, merchantId },
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryHistory(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const risks = await prisma.revenueRisk.findMany({
      where: { customerId: id, merchantId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        aiDecisions: true,
        recoveryActions: true,
      },
    });

    res.json({
      success: true,
      data: risks,
    });
  } catch (error) {
    next(error);
  }
}
