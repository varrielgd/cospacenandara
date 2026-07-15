import { Router } from 'express';
import * as discoveryController from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/start', authenticate, discoveryController.startDiscovery);
router.get('/status/:sessionId', authenticate, discoveryController.getDiscoveryStatus);
router.get('/recent', authenticate, discoveryController.getRecentDiscoveries);
router.get('/market-recommendations', authenticate, discoveryController.getMarketRecommendations);
router.get('/test-ai', authenticate, async (req, res) => {
  try {
    const { AiService } = require('../services/ai.service');
    const response = await AiService.generateContent('Say "AI Connection OK" if you receive this.');
    res.json({ status: 'SUCCESS', response });
  } catch (error: any) {
    res.status(500).json({ status: 'FAILED', error: error.message });
  }
});

export default router;
