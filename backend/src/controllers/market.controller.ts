import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MarketDataService } from '../services/market-data.service';
import { logger } from '../index';

/**
 * GET /api/market
 * Returns the current market snapshot enriched for the dashboard.
 */
export const getMarketData = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await MarketDataService.getDashboardData();
    return res.json(data);
  } catch (error) {
    logger.error('[Market] getMarketData error:', error);
    return res.status(500).json({ message: 'Failed to fetch market data' });
  }
};

/**
 * POST /api/market/refresh
 * Forces a cache invalidation and re-fetches live data immediately.
 */
export const refreshMarketData = async (_req: AuthRequest, res: Response) => {
  try {
    const { prisma } = await import('../index.js');
    // Delete cache entry so next getSnapshot() fetches fresh data
    await prisma.setting.deleteMany({ where: { key: 'market_data_cache' } });
    const data = await MarketDataService.getDashboardData();
    return res.json({ message: 'Market data refreshed', data });
  } catch (error) {
    logger.error('[Market] refreshMarketData error:', error);
    return res.status(500).json({ message: 'Failed to refresh market data' });
  }
};
