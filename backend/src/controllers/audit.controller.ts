import { Response } from 'express';
import { prisma, logger } from '../index';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
