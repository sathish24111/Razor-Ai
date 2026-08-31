import prisma from '../config/database.js';

export async function getRevenueRisks(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { status, riskLevel, search } = req.query;

    const where = { merchantId };
    if (status && status !== 'All') {
      where.status = status.toLowerCase();
    }
    if (riskLevel && riskLevel !== 'All') {
      where.riskLevel = riskLevel.toLowerCase();
    }

    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { reason: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const risks = await prisma.revenueRisk.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, amount: true, currency: true, status: true } },
        payment: true,
        aiDecisions: { orderBy: { createdAt: 'desc' }, take: 1 },
        recoveryActions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: risks });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueRiskById(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const risk = await prisma.revenueRisk.findFirst({
      where: {
        merchantId,
        OR: [{ id }, { orderId: id }],
      },
      include: {
        customer: true,
        order: true,
        payment: true,
        aiDecisions: { orderBy: { createdAt: 'desc' } },
        recoveryActions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Revenue risk record not found.' });
    }

    // Fetch related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { merchantId, entityId: risk.id },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      data: {
        ...risk,
        auditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.revenueRisk.updateMany({
      where: { id, merchantId },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
