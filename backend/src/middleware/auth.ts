import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, logger } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    // PHASE 5: VERIFY TOKEN TRANSMISSION LOGGING
    logger.info('AUTH ATTEMPT', {
      headerExists: !!authHeader,
      headerPrefix: authHeader?.substring(0, 7),
      path: req.path
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('AUTH FAILED: Missing or malformed Bearer token');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // DEBUG LOGS REQUESTED BY USER
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
    console.log("TOKEN RECEIVED:", token);

    // PHASE 6: RENDER ENVIRONMENT AUDIT
    const secret = process.env.JWT_SECRET || 'nandara_secret_fallback_2026';
    
    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };

      console.log("JWT PAYLOAD:", decoded);
      console.log("USER LOOKUP ID:", decoded.id);

      logger.info('JWT VERIFY SUCCESS', {
        userId: decoded.id,
        email: decoded.email,
        exp: new Date((decoded.exp || 0) * 1000).toISOString()
      });

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        logger.warn('AUTH FAILED: User not found in database');
        return res.status(401).json({ message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (jwtError: any) {
      logger.error('JWT VERIFY FAILED', { error: jwtError.message });
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error: any) {
    logger.error('AUTH MIDDLEWARE FATAL ERROR', { error: error.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    return next();
  };
};
