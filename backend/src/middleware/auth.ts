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
    
    // Log headers for debugging (only in non-prod or if needed)
    logger.debug(`Auth attempt with header: ${authHeader ? 'Exists' : 'Missing'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Auth failed: Invalid header format. Received: ${authHeader ? 'Not Bearer' : 'None'}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Use a strict fallback only if not in production
    const secret = process.env.JWT_SECRET || 'nandara_secret_fallback_2026';
    
    if (!process.env.JWT_SECRET) {
      logger.error('CRITICAL: JWT_SECRET environment variable is missing!');
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        logger.warn(`Auth failed: User ${decoded.id} not found in database`);
        return res.status(401).json({ message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (jwtError: any) {
      logger.error(`JWT Verification Error: ${jwtError.message}`);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error: any) {
    logger.error(`Auth Middleware Fatal Error: ${error.message}`);
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
