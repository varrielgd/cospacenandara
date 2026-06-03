import { Response } from 'express';
import { prisma, logger } from '../index';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      importersCount,
      samplesCount,
      quotationsCount,
      emailsCount,
      recentActivities,
      statusDistribution
    ] = await Promise.all([
      prisma.importer.count(),
      prisma.sample.count(),
      prisma.quotation.count(),
      prisma.email.count({ where: { status: 'SENT' } }),
      prisma.activity.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } }, importer: { select: { companyName: true } } }
      }),
      prisma.importer.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    // Calculate conversion rate (WON / TOTAL)
    const wonCount = statusDistribution.find((s: any) => s.status === 'CLOSED_WON')?._count._all || 0;
    const conversionRate = importersCount > 0 ? (wonCount / importersCount) * 100 : 0;

    return res.json({
      stats: {
        importers: importersCount,
        samples: samplesCount,
        quotations: quotationsCount,
        emailsSent: emailsCount,
        conversionRate: conversionRate.toFixed(2)
      },
      recentActivities,
      statusDistribution: statusDistribution.map((s: any) => ({
        status: s.status,
        count: s._count._all
      }))
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
