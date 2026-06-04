import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/start', discoveryController.startDiscovery);
router.get('/status/:sessionId', discoveryController.getDiscoveryStatus);
router.get('/recent', discoveryController.getRecentDiscoveries);

export default router;
