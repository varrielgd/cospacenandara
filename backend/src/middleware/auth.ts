import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth';
import { prisma, logger } from '../index';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Standardize header access (Express does this but being explicit helps)
    const authHeader = req.headers.authorization || req.headers.Authorization as string;
    
    if (!authHeader) {
      logger.warn(`AUTH MISSING: No authorization header for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn(`AUTH INVALID FORMAT: Header does not start with Bearer for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };

      // CRITICAL FIX: Lookup by EMAIL as requested (Email is authoritative)
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        logger.warn(`AUTH FAILED: User ${decoded.email} not found in database`);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      req.user = user;
      return next();
    } catch (jwtError: any) {
      logger.error(`JWT VERIFY ERROR for ${req.method} ${req.originalUrl}:`, jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error: any) {
    logger.error(`AUTH MIDDLEWARE ERROR:`, error);
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
