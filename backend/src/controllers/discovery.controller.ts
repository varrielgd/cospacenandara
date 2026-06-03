import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DiscoveryService } from '../services/discovery.service';
import { logger, prisma } from '../index';

export const startDiscovery = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Run discovery in background or wait for it
    // For now, we wait for a few results to show progress
    const results = await DiscoveryService.discoverImporters(query);

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        type: 'SYSTEM',
        description: `Discovery started for query: "${query}". Found ${results.length} new importers.`
      }
    });

    return res.json({
      message: 'Discovery completed',
      count: results.length,
      results
    });
  } catch (error) {
    logger.error('Discovery controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
