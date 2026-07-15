import { Router } from 'express';
import * as marketController from '../controllers/market.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET  /api/market         — current market snapshot (cached 1hr)
router.get('/', marketController.getMarketData);

// POST /api/market/refresh — force cache invalidation + live refetch
router.post('/refresh', marketController.refreshMarketData);

export default router;
