import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing authentication token',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET missing',
      });
    }

    const decoded = jwt.verify(token, secret);

    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        businessName: true,
        email: true,
        website: true,
        category: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Merchant account no longer exists',
      });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired authentication token',
    });
  }
}
