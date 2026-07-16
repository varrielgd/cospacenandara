import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { executeAutoDiscover, getAutoDiscoverHistory, refreshAutoDiscover } from '../controllers/auto-discover.controller.js';

const router = Router();

// Apply authentication to all auto-discover routes
router.use(authenticate);

router.post('/', executeAutoDiscover);
router.get('/history/:importerId', getAutoDiscoverHistory);
router.post('/refresh/:importerId', refreshAutoDiscover);

export default router;