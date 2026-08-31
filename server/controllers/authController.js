import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { createAuditLog } from '../services/auditService.js';

function generateToken(merchantId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id: merchantId }, secret, { expiresIn: '30d' });
}

export async function register(req, res, next) {
  try {
    const { businessName, email, password, website, category, currency } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name, email, and password are required.',
      });
    }

    const existing = await prisma.merchant.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A merchant account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const merchant = await prisma.merchant.create({
      data: {
        businessName,
        email,
        passwordHash: hashedPassword,
        website: website || null,
        category: category || 'General Commerce',
        currency: currency || 'INR',
      },
    });

    // Create default MerchantPolicy
    await prisma.merchantPolicy.create({
      data: {
        merchantId: merchant.id,
        maxRetries: 2,
        maxAutoRecoveryAmount: 10000.0,
        highValueThreshold: 10000.0,
        requireCustomerApproval: true,
        requireMerchantApproval: true,
        recoveryWindowHours: 24,
        automaticRecoveryEnabled: true,
        allowedActions: ["retry_payment", "send_reminder", "customer_recheckout", "escalate", "stop"],
      },
    });

    // Audit Log
    await createAuditLog({
      merchantId: merchant.id,
      eventType: 'MERCHANT_REGISTERED',
      action: 'Merchant Account Registration',
      reason: 'New merchant registered on platform',
      actor: 'Merchant Admin',
    });

    const token = generateToken(merchant.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          currency: merchant.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const merchant = await prisma.merchant.findUnique({ where: { email } });
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, merchant.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Audit log
    await createAuditLog({
      merchantId: merchant.id,
      eventType: 'LOGIN',
      action: 'Merchant Sign In',
      reason: 'Authenticated successfully via JWT',
      actor: 'Merchant Admin',
    });

    const token = generateToken(merchant.id);

    res.json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          email: merchant.email,
          currency: merchant.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: req.merchant,
  });
}
