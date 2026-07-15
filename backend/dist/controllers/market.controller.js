"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshMarketData = exports.getMarketData = void 0;
const market_data_service_js_1 = require("../services/market-data.service.js");
const index_js_1 = require("../index.js");
/**
 * GET /api/market
 * Returns the current market snapshot enriched for the dashboard.
 */
const getMarketData = async (_req, res) => {
    try {
        const data = await market_data_service_js_1.MarketDataService.getDashboardData();
        return res.json(data);
    }
    catch (error) {
        index_js_1.logger.error('[Market] getMarketData error:', error);
        return res.status(500).json({ message: 'Failed to fetch market data' });
    }
};
exports.getMarketData = getMarketData;
/**
 * POST /api/market/refresh
 * Forces a cache invalidation and re-fetches live data immediately.
 */
const refreshMarketData = async (_req, res) => {
    try {
        const { prisma } = await import('../index.js');
        // Delete cache entry so next getSnapshot() fetches fresh data
        await prisma.setting.deleteMany({ where: { key: 'market_data_cache' } });
        const data = await market_data_service_js_1.MarketDataService.getDashboardData();
        return res.json({ message: 'Market data refreshed', data });
    }
    catch (error) {
        index_js_1.logger.error('[Market] refreshMarketData error:', error);
        return res.status(500).json({ message: 'Failed to refresh market data' });
    }
};
exports.refreshMarketData = refreshMarketData;
//# sourceMappingURL=market.controller.js.map