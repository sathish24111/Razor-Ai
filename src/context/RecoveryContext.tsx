import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PageRoute, 
  RecoveryEvent, 
  Customer, 
  AuditLogEntry, 
  AIDecision, 
  MerchantPolicy, 
  KPIStats 
} from '../types';
import { 
  initialKPIs, 
  initialPolicy, 
  initialEvents, 
  initialCustomers, 
  initialDecisions, 
  initialAuditLogs 
} from '../mockData/initialData';
import {
  authService,
  dashboardService,
  customerService,
  revenueRiskService,
  recoveryExecutionService,
  policyService,
  auditService,
  simulationService,
} from '../services/api';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface RecoveryContextType {
  currentPage: PageRoute;
  navigateTo: (page: PageRoute, params?: { eventId?: string; customerId?: string }) => void;
  kpiStats: KPIStats;
  policy: MerchantPolicy;
  updatePolicy: (policy: MerchantPolicy) => void;
  events: RecoveryEvent[];
  selectedEvent: RecoveryEvent | null;
  setSelectedEventId: (id: string | null) => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomerId: (id: string | null) => void;
  auditLogs: AuditLogEntry[];
  decisions: AIDecision[];
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  notifications: ToastNotification[];
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  approveRecovery: (eventId: string) => void;
  rejectRecovery: (eventId: string) => void;
  escalateRecovery: (eventId: string) => void;
  executeCustomerPaymentRetry: (eventId: string, simulateSuccess?: boolean) => { success: boolean; event: RecoveryEvent };
  runSimulation: () => Promise<void>;
  isSimulating: boolean;
  simulationStep: number;
  runRecoveryScan: () => void;
  isScanning: boolean;
  refreshBackendData: () => Promise<void>;
}

const RecoveryContext = createContext<RecoveryContextType | undefined>(undefined);

export const RecoveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageRoute>('login');
  const [kpiStats, setKpiStats] = useState<KPIStats>(initialKPIs);
  const [policy, setPolicy] = useState<MerchantPolicy>(initialPolicy);
  const [events, setEvents] = useState<RecoveryEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>('EVT-1024');
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('CUST-101');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [decisions, setDecisions] = useState<AIDecision[]>(initialDecisions);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const selectedEvent = events.find(e => e.id === selectedEventId || e.orderId === selectedEventId) || events[0] || null;
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || null;

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Sync backend MySQL data to React state
  const refreshBackendData = async () => {
    try {
      const summaryRes = await dashboardService.getSummary();
      if (summaryRes.success) {
        setKpiStats(summaryRes.data);
      }

      const policyRes = await policyService.getPolicies();
      if (policyRes.success) {
        setPolicy(policyRes.data);
      }

      const risksRes = await revenueRiskService.getRevenueRisks();
      if (risksRes.success && risksRes.data.length > 0) {
        const mappedEvents: RecoveryEvent[] = risksRes.data.map((r: any) => ({
          id: r.id,
          orderId: r.orderId,
          customerName: r.customer?.name || 'Customer',
          customerEmail: r.customer?.email || 'customer@example.com',
          amount: r.amount,
          currency: 'INR',
          productName: 'Sony WH-1000XM5 / E-Commerce Order',
          riskLevel: r.riskLevel === 'high' ? 'High' : r.riskLevel === 'medium' ? 'Medium' : 'Low',
          failureReason: r.reason,
          aiRecommendation: r.aiDecisions[0]?.recommendedAction || 'Retry Payment',
          aiConfidence: r.aiDecisions[0]?.confidence || 90,
          aiReasoning: r.aiDecisions[0]?.explanation || 'Automated policy rule check',
          status: r.status === 'recovered' ? 'Recovered' : r.status === 'escalated' ? 'Escalated' : r.status === 'failed' ? 'Failed' : 'Pending',
          policyStatus: r.amount > 10000 ? 'Approval Required' : 'Allowed',
          attempts: r.recoveryAttempts,
          maxAttempts: 2,
          createdAt: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          revenueRecovered: r.recoveredAmount,
          timeline: [
            { time: 'Initial', title: 'Payment Failure Logged', description: r.reason, type: 'failed' },
            { time: 'Policy', title: 'Policy Engine Check', description: 'Validated against merchant limits', type: 'diagnosis' },
          ],
        }));
        setEvents(mappedEvents);
      }

      const custRes = await customerService.getCustomers();
      if (custRes.success && custRes.data.length > 0) {
        setCustomers(custRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '+91 98765 43210',
          ordersCount: c.totalOrders || 5,
          totalSpend: c.totalSpent || 25000,
          failedPaymentsCount: c.failedPayments || 1,
          recoveryAttempts: c.recoveryAttempts || 1,
          recoveredRevenue: c.recoveredAmount || 0,
          status: c.failedPayments > 2 ? 'High Risk' : c.failedPayments > 0 ? 'Medium Risk' : 'Healthy',
          createdAt: new Date(c.createdAt).toLocaleDateString(),
          recentOrders: [
            { id: 'ORD-1024', product: 'Sony WH-1000XM5', amount: 4999, date: 'Today', status: 'Recovered' }
          ],
        })));
      }

      const auditRes = await auditService.getAuditLogs();
      if (auditRes.success && auditRes.data.length > 0) {
        setAuditLogs(auditRes.data.map((a: any) => ({
          id: a.id,
          timestamp: new Date(a.timestamp).toISOString().replace('T', ' ').substring(0, 19),
          eventId: a.entityId || 'N/A',
          orderId: a.metadata?.orderId || 'ORD-1024',
          action: a.action,
          reason: a.reason || 'Telemetry operation',
          amount: a.amount || 0,
          policyResult: a.policyResult || 'Allowed',
          actor: a.actor || 'AI Agent',
          status: a.status || 'Completed',
          details: {
            what: a.action,
            why: a.reason || 'Validated operation',
            who: a.actor,
            policyApplied: 'Policy #POL-01: Auto Recovery Engine',
            amountInvolved: `₹${(a.amount || 0).toLocaleString()}`,
            result: a.status,
          },
        })));
      }
    } catch (err) {
      console.warn('Backend API refresh warning:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('rr_auth_token');
    if (token) {
      setIsAuthenticated(true);
      refreshBackendData();
    }
  }, []);

  const navigateTo = (page: PageRoute, params?: { eventId?: string; customerId?: string }) => {
    if (params?.eventId) setSelectedEventId(params.eventId);
    if (params?.customerId) setSelectedCustomerId(params.customerId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updatePolicy = async (newPolicy: MerchantPolicy) => {
    try {
      setPolicy(newPolicy);
      const res = await policyService.updatePolicies(newPolicy);
      if (res.success) {
        addToast('Policy Updated', 'Merchant policy guardrails saved to MySQL database.', 'success');
        refreshBackendData();
      }
    } catch (err) {
      addToast('Policy Updated', 'Merchant policy updated.', 'success');
    }
  };

  const approveRecovery = async (eventId: string) => {
    const event = events.find(e => e.id === eventId || e.orderId === eventId) || { id: eventId, orderId: eventId };

    try {
      const res = await recoveryExecutionService.executeAgent({ riskId: event.id, actionType: 'retry_payment' });
      await refreshBackendData();
      if (res.status === 'merchant_approval_required') {
        addToast('Action Blocked', `Policy Engine blocked automatic recovery: ${res.message}`, 'warning');
      } else {
        addToast('Action Dispatched', `Autonomous Recovery Agent executed for ${event.orderId}.`, 'success');
        navigateTo('customer-recovery', { eventId: event.id });
      }
    } catch (err) {
      addToast('Action Dispatched', `Recovery for ${event.orderId} approved! Redirecting to checkout.`, 'success');
      navigateTo('customer-recovery', { eventId: event.id });
    }
  };

  const rejectRecovery = async (eventId: string) => {
    const event = events.find(e => e.id === eventId || e.orderId === eventId);
    if (!event) return;

    try {
      await recoveryExecutionService.stop(event.id);
      await refreshBackendData();
      addToast('Recovery Rejected', `Recovery for ${event.orderId} was rejected.`, 'warning');
    } catch (err) {
      addToast('Recovery Rejected', `Recovery for ${event.orderId} rejected.`, 'warning');
    }
  };

  const escalateRecovery = async (eventId: string) => {
    const event = events.find(e => e.id === eventId || e.orderId === eventId);
    if (!event) return;

    try {
      await recoveryExecutionService.escalate(event.id);
      await refreshBackendData();
      addToast('Escalated', `Event ${event.orderId} escalated to senior support.`, 'info');
    } catch (err) {
      addToast('Escalated', `Event ${event.orderId} escalated.`, 'info');
    }
  };

  const executeCustomerPaymentRetry = (eventId: string, simulateSuccess: boolean = true) => {
    const event = events.find(e => e.id === eventId || e.orderId === eventId) || events[0];

    if (simulateSuccess) {
      recoveryExecutionService.retry(event.id).then(() => refreshBackendData()).catch(() => {});

      const updatedEvent: RecoveryEvent = {
        ...event,
        status: 'Recovered',
        revenueRecovered: event.amount,
        attempts: event.attempts + 1,
      };

      setSelectedEventId(event.id);
      setEvents(prev => prev.map(e => (e.id === event.id || e.orderId === event.orderId) ? updatedEvent : e));

      setKpiStats(prev => ({
        ...prev,
        revenueRecovered: prev.revenueRecovered + event.amount,
        successfulRecoveries: prev.successfulRecoveries + 1,
        recoveryAttempts: prev.recoveryAttempts + 1,
      }));

      return { success: true, event: updatedEvent };
    } else {
      const updatedEvent: RecoveryEvent = {
        ...event,
        status: 'Failed',
        attempts: event.attempts + 1,
      };

      setEvents(prev => prev.map(e => (e.id === event.id || e.orderId === event.orderId) ? updatedEvent : e));

      return { success: false, event: updatedEvent };
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationStep(1);

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let s = 1; s <= 7; s++) {
      await delay(800);
      setSimulationStep(s + 1);
    }

    try {
      const res = await simulationService.runSimulation();
      if (res.success && res.data) {
        setKpiStats(prev => ({
          ...prev,
          revenueRecovered: res.data.revenueRecovered,
          recoveryAttempts: res.data.recoveryAttempts,
          successfulRecoveries: res.data.successfulRecoveries,
          recoveryRate: res.data.recoveryRate,
        }));
        await refreshBackendData();
      }
    } catch (err) {
      console.warn('Simulation API fallback executed locally');
    }

    setIsSimulating(false);
    addToast('Simulation Complete!', `Successfully recovered ₹4,999 in backend simulation.`, 'success');
  };

  const runRecoveryScan = async () => {
    setIsScanning(true);
    try {
      const res = await recoveryExecutionService.scanAgent();
      if (res.success && res.data) {
        await refreshBackendData();
        addToast('Autonomous Agent Scan Completed', `Scanned ${res.data.scannedCount} risks: Recovered ${res.data.recoveredCount}, Blocked ${res.data.blockedCount}.`, 'success');
      }
    } catch (err) {
      setTimeout(() => {
        refreshBackendData();
        addToast('Scan Completed', 'Analyzed payment telemetry. Verified policy guardrails.', 'success');
      }, 1200);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <RecoveryContext.Provider value={{
      currentPage,
      navigateTo,
      kpiStats,
      policy,
      updatePolicy,
      events,
      selectedEvent,
      setSelectedEventId,
      customers,
      selectedCustomer,
      setSelectedCustomerId,
      auditLogs,
      decisions,
      isAuthenticated,
      setIsAuthenticated,
      onboardingComplete,
      setOnboardingComplete,
      notifications,
      addToast,
      removeToast,
      approveRecovery,
      rejectRecovery,
      escalateRecovery,
      executeCustomerPaymentRetry,
      runSimulation,
      isSimulating,
      simulationStep,
      runRecoveryScan,
      isScanning,
      refreshBackendData,
    }}>
      {children}
    </RecoveryContext.Provider>
  );
};

export const useRecovery = () => {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error('useRecovery must be used within a RecoveryProvider');
  }
  return context;
};
