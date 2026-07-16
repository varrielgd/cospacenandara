import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { executeAutoDiscover, getAutoDiscoverHistory, refreshAutoDiscover } from '../controllers/auto-discover.controller.js';

const router = Router();

// Apply authentication to all auto-discover routes
router.use(authenticate);

router.post('/auto-discover', executeAutoDiscover);
router.get('/auto-discover/history/:importerId', getAutoDiscoverHistory);
router.post('/auto-discover/refresh/:importerId', refreshAutoDiscover);

export default router;