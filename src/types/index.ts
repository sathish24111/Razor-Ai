export type RiskLevel = 'High' | 'Medium' | 'Low';

export type RecoveryStatus = 'Recovered' | 'Pending' | 'Failed' | 'Escalated' | 'Recoverable';

export interface RecoveryEvent {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  productName: string;
  riskLevel: RiskLevel;
  failureReason: string;
  aiRecommendation: string;
  aiConfidence: number;
  aiReasoning: string;
  status: RecoveryStatus;
  policyStatus: 'Allowed' | 'Blocked' | 'Approval Required';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  revenueRecovered: number;
  timeline: {
    time: string;
    title: string;
    description: string;
    type: 'failed' | 'diagnosis' | 'recommendation' | 'approval' | 'payment' | 'recovered' | 'escalated';
  }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpend: number;
  failedPaymentsCount: number;
  recoveryAttempts: number;
  recoveredRevenue: number;
  status: 'Healthy' | 'Medium Risk' | 'High Risk';
  createdAt: string;
  recentOrders: {
    id: string;
    product: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventId: string;
  orderId: string;
  action: string;
  reason: string;
  amount: number;
  policyResult: 'Allowed' | 'Blocked' | 'Manual Override';
  actor: 'AI Agent' | 'Merchant Admin' | 'Customer' | 'System';
  status: 'Completed' | 'Failed' | 'Pending';
  details?: {
    what: string;
    why: string;
    who: string;
    policyApplied: string;
    amountInvolved: string;
    result: string;
  };
}

export interface AIDecision {
  id: string;
  orderId: string;
  customerName: string;
  diagnosis: string;
  recommendation: string;
  confidence: number;
  reason: string;
  policyValid: boolean;
  policyDetails: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Executed';
  createdAt: string;
  bestChannel?: string;
  optimalRetryTime?: string;
  incentiveStrategy?: string;
  suggestedMessage?: string;
}

export interface MerchantPolicy {
  id?: string;
  merchantId?: string;
  maxRetries?: number;
  maxAutoRetries?: number;
  maxAutoRecoveryAmount: number;
  highValueThreshold?: number;
  requireApprovalAboveAmount?: number;
  recoveryWindowHours: number;
  automaticRecoveryEnabled?: boolean;
  autoRecoveryEnabled?: boolean;
  allowedActions?: string[] | any;
  enableAutoRetry?: boolean;
  enableCustomerReminder?: boolean;
  applyDiscount?: boolean;
  altPaymentMethod?: boolean;
}

export interface KPIStats {
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  recoveryRate: number;
  failedPayments?: number;
  totalPayments?: number;
  successfulPayments?: number;
}

export type PageRoute = 
  | 'login'
  | 'onboarding'
  | 'dashboard'
  | 'revenue-at-risk'
  | 'recovery-events'
  | 'event-details'
  | 'ai-decision-center'
  | 'recovery-actions'
  | 'customer-recovery'
  | 'payment-result'
  | 'policies'
  | 'audit-trail'
  | 'analytics'
  | 'customers'
  | 'customer-details'
  | 'settings'
  | 'simulation';
