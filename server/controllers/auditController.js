import prisma from '../config/database.js';
import { verifyAuditIntegrity, exportAuditLogsCSV } from '../services/auditService.js';

export async function getAuditLogs(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { eventType, search, page = 1, limit = 50 } = req.query;

    const where = { merchantId };
    if (eventType) {
      where.eventType = eventType;
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { reason: { contains: search } },
        { actor: { contains: search } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
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

export async function getAuditLogById(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const log = await prisma.auditLog.findFirst({
      where: { id, merchantId },
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log entry not found.' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function verifyAudit(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const result = await verifyAuditIntegrity(merchantId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function exportAudit(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const csvContent = await exportAuditLogsCSV(merchantId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="razorrecover_audit_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
