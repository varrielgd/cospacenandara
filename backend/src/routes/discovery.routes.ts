import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate, discoveryController.startDiscovery);
router.get('/status/:sessionId', authenticate, discoveryController.getDiscoveryStatus);
router.get('/recent', authenticate, discoveryController.getRecentDiscoveries);

export default router;
