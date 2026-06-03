import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/start', discoveryController.startDiscovery);

export default router;
