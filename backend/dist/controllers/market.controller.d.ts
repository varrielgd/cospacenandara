import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
/**
 * GET /api/market
 * Returns the current market snapshot enriched for the dashboard.
 */
export declare const getMarketData: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/market/refresh
 * Forces a cache invalidation and re-fetches live data immediately.
 */
export declare const refreshMarketData: (_req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=market.controller.d.ts.map