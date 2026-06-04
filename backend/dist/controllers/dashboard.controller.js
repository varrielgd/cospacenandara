"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const index_1 = require("../index");
const getDashboardStats = async (req, res) => {
    try {
        const [importersCount, samplesCount, quotationsCount, emailsCount, recentActivities, statusDistribution] = await Promise.all([
            index_1.prisma.importer.count(),
            index_1.prisma.sample.count(),
            index_1.prisma.quotation.count(),
            index_1.prisma.email.count({ where: { status: 'SENT' } }),
            index_1.prisma.activity.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { firstName: true, lastName: true } }, importer: { select: { companyName: true } } }
            }),
            index_1.prisma.importer.groupBy({
                by: ['status'],
                _count: { _all: true }
            })
        ]);
        // Calculate conversion rate (WON / TOTAL)
        const wonCount = statusDistribution.find((s) => s.status === 'CLOSED_WON')?._count._all || 0;
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
            statusDistribution: statusDistribution.map((s) => ({
                status: s.status,
                count: s._count._all
            }))
        });
    }
    catch (error) {
        index_1.logger.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboard.controller.js.map