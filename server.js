import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Fintech Data Store
let kpiStats = {
  revenueAtRisk: 245000,
  revenueRecovered: 94500,
  recoveryAttempts: 60,
  successfulRecoveries: 38,
  recoveryRate: 63.3,
};

let policy = {
  maxAutoRetries: 2,
  maxAutoRecoveryAmount: 10000,
  recoveryWindowHours: 24,
  requireApprovalAboveAmount: 5000,
  enableAutoRetry: true,
  enableCustomerReminder: true,
  applyDiscount: false,
  altPaymentMethod: true,
  autoRecoveryEnabled: true,
};

let events = [
  {
    id: 'EVT-1024',
    orderId: 'ORD-1024',
    customerName: 'Arjun Kumar',
    customerEmail: 'arjun.k@example.com',
    amount: 4999,
    currency: 'INR',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    riskLevel: 'Low',
    failureReason: 'Authentication Failure (3DS Timeout)',
    aiRecommendation: 'Retry Payment',
    aiConfidence: 91,
    aiReasoning: 'Customer has 5 previous successful payments. No recent failed attempts. Transaction amount is below merchant auto-recovery limit.',
    status: 'Recovered',
    policyStatus: 'Allowed',
    attempts: 1,
    maxAttempts: 2,
    createdAt: 'Today, 10:31 AM',
    updatedAt: 'Today, 10:34 AM',
    revenueRecovered: 4999,
  },
  {
    id: 'EVT-1025',
    orderId: 'ORD-1025',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@example.com',
    amount: 14999,
    currency: 'INR',
    productName: 'Apple Watch SE 40mm',
    riskLevel: 'High',
    failureReason: 'Insufficient Funds',
    aiRecommendation: 'Send Payment Reminder with UPI Option',
    aiConfidence: 78,
    aiReasoning: 'High-value transaction above ₹10,000 threshold. Requires manual merchant validation or scheduled UPI prompt.',
    status: 'Pending',
    policyStatus: 'Approval Required',
    attempts: 0,
    maxAttempts: 2,
    createdAt: 'Today, 09:15 AM',
    updatedAt: 'Today, 09:15 AM',
    revenueRecovered: 0,
  },
];

let auditLogs = [
  {
    id: 'AUD-9011',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    eventId: 'EVT-1024',
    orderId: 'ORD-1024',
    action: 'Payment Recovered',
    reason: 'Razorpay Test Payment successful following customer approval',
    amount: 4999,
    policyResult: 'Allowed',
    actor: 'Customer',
    status: 'Completed',
  },
];

// --- REST API ENDPOINTS ---

// Health & Agent Telemetry
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'RazorRecover AI Backend Engine',
    version: 'v2.4.0',
    agentStatus: 'ACTIVE',
    razorpayWebhookStatus: 'LISTENING',
    timestamp: new Date().toISOString(),
  });
});

// KPI Metrics
app.get('/api/kpi', (req, res) => {
  res.json(kpiStats);
});

// Events Queue
app.get('/api/events', (req, res) => {
  res.json(events);
});

app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id || e.orderId === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Approve Recovery Action
app.post('/api/events/:id/approve', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  event.status = 'Pending';
  event.policyStatus = 'Allowed';

  const newAudit = {
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    eventId: event.id,
    orderId: event.orderId,
    action: 'Manual Recovery Approval',
    reason: 'Merchant admin approved recovery action via REST API',
    amount: event.amount,
    policyResult: 'Manual Override',
    actor: 'Merchant Admin',
    status: 'Completed',
  };
  auditLogs.unshift(newAudit);

  res.json({ success: true, event, auditLog: newAudit });
});

// Real-Time Simulation Trigger
app.post('/api/simulate', (req, res) => {
  const simAmount = 4999;
  const simOrderId = `ORD-${Math.floor(1030 + Math.random() * 90)}`;
  const simEvtId = `EVT-${Math.floor(2000 + Math.random() * 9000)}`;

  const newEvent = {
    id: simEvtId,
    orderId: simOrderId,
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav.m@example.com',
    amount: simAmount,
    currency: 'INR',
    productName: 'Sony WH-1000XM5 Wireless Headphones',
    riskLevel: 'Low',
    failureReason: 'Simulated OTP Timeout',
    aiRecommendation: 'Smart Payment Retry',
    aiConfidence: 94,
    aiReasoning: 'Simulation agent detected recoverable card 3DS OTP delay.',
    status: 'Recovered',
    policyStatus: 'Allowed',
    attempts: 1,
    maxAttempts: 2,
    createdAt: 'Just Now',
    updatedAt: 'Just Now',
    revenueRecovered: simAmount,
  };

  events.unshift(newEvent);

  kpiStats.revenueRecovered += simAmount;
  kpiStats.recoveryAttempts += 1;
  kpiStats.successfulRecoveries += 1;
  kpiStats.recoveryRate = Number(((kpiStats.successfulRecoveries / kpiStats.recoveryAttempts) * 100).toFixed(1));

  const newAudit = {
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    eventId: simEvtId,
    orderId: simOrderId,
    action: 'Simulated Recovery Executed',
    reason: 'Backend simulation endpoint executed',
    amount: simAmount,
    policyResult: 'Allowed',
    actor: 'AI Agent',
    status: 'Completed',
  };
  auditLogs.unshift(newAudit);

  res.json({
    success: true,
    message: `Successfully recovered ₹${simAmount.toLocaleString()}`,
    newEvent,
    updatedKPIs: kpiStats,
  });
});

// Razorpay Webhook Endpoint
app.post('/api/razorpay/webhook', (req, res) => {
  const payload = req.body || {};
  const eventName = payload.event || 'payment.failed';
  
  console.log(`[Razorpay Webhook] Received event: ${eventName}`);

  res.json({ status: 'RECEIVED', event: eventName, processedBy: 'RazorRecover Policy Engine' });
});

// Audit Trail
app.get('/api/audit-trail', (req, res) => {
  res.json(auditLogs);
});

// Policy Engine
app.get('/api/policy', (req, res) => {
  res.json(policy);
});

app.put('/api/policy', (req, res) => {
  policy = { ...policy, ...req.body };
  res.json({ success: true, policy });
});

app.listen(PORT, () => {
  console.log(`🚀 RazorRecover AI Backend Server running on http://localhost:${PORT}`);
});
