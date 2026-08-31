import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import prisma, { connectDB } from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import revenueRiskRoutes from './routes/revenueRiskRoutes.js';
import recoveryRoutes from './routes/recoveryRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

// Mandatory Secret Validation Check at Startup
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MySQL
connectDB();

// Security HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite client dev compatibility
}));

// CORS Configuration (Strict rejection of unapproved origins)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175'];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Request ID Correlation Middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Configure JSON parser with raw body retention for Razorpay Webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

// Rate Limiters (Preserves unthrottled access for /api/webhooks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'API rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limits
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/recovery/agent/execute', apiLimiter);
app.use('/api/simulation/', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RazorRecover AI',
    version: 'v2.4.0',
    database: 'MySQL (Prisma ORM)',
    razorpayMode: 'TEST_MODE',
    simulationMode: process.env.PAYMENT_SIMULATION_MODE === 'true',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Readiness Check Endpoint (Verifies MySQL & Prisma connectivity)
app.get('/api/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  }
});

// Webhooks (Public - Verified via Razorpay HMAC signature; unthrottled for Razorpay retries)
app.use('/api/webhooks', webhookRoutes);

// Protected API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/revenue-risk', revenueRiskRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 RazorRecover AI Backend Server running on http://localhost:${PORT}`);
});
