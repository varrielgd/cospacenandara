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
    
    // Log headers for debugging
    logger.info(`Auth check: Header exists=${!!authHeader}`, {
      header: authHeader ? `${authHeader.substring(0, 15)}...` : 'NONE'
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Auth failed: Invalid header format.`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Check secret
    const secret = process.env.JWT_SECRET || 'nandara_secret_fallback_2026';
    logger.info(`Auth check: Secret state`, {
      hasEnvSecret: !!process.env.JWT_SECRET,
      secretLength: secret.length
    });

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };

      logger.info(`Auth check: Token verified for ${decoded.email}`, {
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'NONE'
      });

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        logger.warn(`Auth failed: User ${decoded.id} not found in DB`);
        return res.status(401).json({ message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (jwtError: any) {
      logger.error(`JWT Verification Error: ${jwtError.message}`);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token' });
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
