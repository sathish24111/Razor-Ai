import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rr_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('rr_auth_token');
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data.data.token) {
      localStorage.setItem('rr_auth_token', res.data.data.token);
    }
    return res.data;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.data.token) {
      localStorage.setItem('rr_auth_token', res.data.data.token);
    }
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('rr_auth_token');
  },
};

// Dashboard Service
export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },

  getRecoveryChart: async () => {
    const res = await api.get('/dashboard/recovery-chart');
    return res.data;
  },
};

// Customers Service
export const customerService = {
  getCustomers: async (params = {}) => {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  getCustomer: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  getCustomerOrders: async (id) => {
    const res = await api.get(`/customers/${id}/orders`);
    return res.data;
  },
};

// Products Service
export const productService = {
  getProducts: async () => {
    const res = await api.get('/products');
    return res.data;
  },
};

// Orders Service
export const orderService = {
  getOrders: async () => {
    const res = await api.get('/orders');
    return res.data;
  },

  getOrder: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
};

// Payments & Razorpay Service
export const paymentService = {
  getPayments: async () => {
    const res = await api.get('/payments');
    return res.data;
  },

  createRazorpayOrder: async ({ amount, currency = 'INR', customerId }) => {
    const res = await api.post('/payments/razorpay/order', { amount, currency, customerId });
    return res.data;
  },

  verifyRazorpayPayment: async (verificationData) => {
    const res = await api.post('/payments/razorpay/verify', verificationData);
    return res.data;
  },
};

// Revenue Risks Service
export const revenueRiskService = {
  getRevenueRisks: async (params = {}) => {
    const res = await api.get('/revenue-risk', { params });
    return res.data;
  },

  getRevenueRisk: async (id) => {
    const res = await api.get(`/revenue-risk/${id}`);
    return res.data;
  },
};

// AI Telemetry Diagnosis Service
export const aiService = {
  analyzePaymentRisk: async (riskId) => {
    const res = await api.post(`/ai/analyze/${riskId}`);
    return res.data;
  },
};

// Autonomous AI Recovery Agent Execution Service
export const recoveryExecutionService = {
  executeAgent: async ({ riskId, actionType }) => {
    const res = await api.post('/recovery/agent/execute', { riskId, actionType });
    return res.data;
  },

  scanAgent: async () => {
    const res = await api.post('/recovery/agent/scan');
    return res.data;
  },

  analyze: async (riskId) => {
    const res = await api.post(`/recovery/${riskId}/analyze`);
    return res.data;
  },

  approve: async (riskId) => {
    const res = await api.post(`/recovery/${riskId}/approve`);
    return res.data;
  },

  retry: async (riskId) => {
    const res = await api.post(`/recovery/${riskId}/retry`);
    return res.data;
  },

  escalate: async (riskId) => {
    const res = await api.post(`/recovery/${riskId}/escalate`);
    return res.data;
  },

  stop: async (riskId) => {
    const res = await api.post(`/recovery/${riskId}/stop`);
    return res.data;
  },
};

// Merchant Policy Service
export const policyService = {
  getPolicies: async () => {
    const res = await api.get('/policies');
    return res.data;
  },

  updatePolicies: async (data) => {
    const res = await api.put('/policies', data);
    return res.data;
  },
};

// Audit Service
export const auditService = {
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  },

  verifyAudit: async () => {
    const res = await api.get('/audit/verify');
    return res.data;
  },

  exportCSV: async () => {
    const response = await api.get('/audit/export', { responseType: 'blob' });
    return response.data;
  },
};

// Analytics Service
export const analyticsService = {
  getOverview: async () => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  getFunnel: async () => {
    const res = await api.get('/analytics/funnel');
    return res.data;
  },

  getReasons: async () => {
    const res = await api.get('/analytics/reasons');
    return res.data;
  },

  exportCSV: async () => {
    const response = await api.get('/analytics/export', { responseType: 'blob' });
    return response.data;
  },
};

// Simulation Service
export const simulationService = {
  createSingle: async (data) => {
    const res = await api.post('/simulation/payment', data);
    return res.data;
  },

  simulatePayment: async (data) => {
    const res = await api.post('/simulation/payment', data);
    return res.data;
  },

  simulateBatch: async (count = 10) => {
    const res = await api.post('/simulation/batch', { count });
    return res.data;
  },

  runSimulation: async () => {
    const res = await api.post('/simulation/run');
    return res.data;
  },
};

export default api;
