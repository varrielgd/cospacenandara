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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Auth failed: No Bearer token found. Headers: ${JSON.stringify(req.headers)}`);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      logger.warn('JWT_SECRET is not defined in production, using fallback');
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    return next();
  } catch (error) {
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
