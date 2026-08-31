import prisma from '../config/database.js';

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'jwt',
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'api_key',
  'secret',
  'razorpaysecret',
  'razorpay_key_secret',
  'webhook_secret',
  'openai_api_key',
  'authorization',
];

/**
 * Strips sensitive keys and authorization tokens from audit metadata
 */
export function sanitizeAuditData(data) {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeAuditData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED_SENSITIVE_CREDENTIAL]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Creates an audit log entry in MySQL with mandatory data sanitization
 */
export async function createAuditLog({
  merchantId,
  eventType,
  entityId = null,
  action,
  reason = null,
  amount = 0.0,
  policyResult = 'Allowed',
  actor = 'System',
  status = 'Completed',
  metadata = null,
}) {
  try {
    const cleanMetadata = metadata ? sanitizeAuditData(metadata) : null;
    const cleanReason = reason ? String(reason).replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED_API_KEY]') : null;

    const log = await prisma.auditLog.create({
      data: {
        merchantId,
        eventType,
        entityId,
        action,
        reason: cleanReason,
        amount: Number(amount || 0),
        policyResult,
        actor,
        status,
        metadata: cleanMetadata ? JSON.parse(JSON.stringify(cleanMetadata)) : null,
      },
    });
    return log;
  } catch (error) {
    console.error('❌ Failed to create audit log entry:', error);
    return null;
  }
}

/**
 * Checks chronological consistency of merchant audit log timeline
 */
export async function verifyAuditIntegrity(merchantId) {
  const logs = await prisma.auditLog.findMany({
    where: { merchantId },
    orderBy: { timestamp: 'asc' },
    select: { id: true, timestamp: true, eventType: true },
  });

  let isChronological = true;
  for (let i = 1; i < logs.length; i++) {
    if (new Date(logs[i].timestamp) < new Date(logs[i - 1].timestamp)) {
      isChronological = false;
      break;
    }
  }

  return {
    chronologicalConsistency: isChronological ? 'PASS' : 'WARN_ORDERING',
    verified: isChronological,
    totalRecords: logs.length,
    oldestRecord: logs[0]?.timestamp || null,
    latestRecord: logs[logs.length - 1]?.timestamp || null,
  };
}

/**
 * Exports merchant audit logs as CSV string
 */
export async function exportAuditLogsCSV(merchantId) {
  const logs = await prisma.auditLog.findMany({
    where: { merchantId },
    orderBy: { timestamp: 'desc' },
  });

  const headers = ['Timestamp', 'Event Type', 'Entity ID', 'Action', 'Actor', 'Amount (INR)', 'Policy Result', 'Status', 'Reason'];
  const rows = logs.map(l => [
    `"${new Date(l.timestamp).toISOString()}"`,
    `"${l.eventType}"`,
    `"${l.entityId || 'N/A'}"`,
    `"${(l.action || '').replace(/"/g, '""')}"`,
    `"${l.actor}"`,
    `"${l.amount || 0}"`,
    `"${l.policyResult || 'Allowed'}"`,
    `"${l.status}"`,
    `"${(l.reason || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
