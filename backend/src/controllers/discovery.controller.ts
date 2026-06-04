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

    // Create a discovery session to track progress
    const session = await (prisma.discoverySession as any).create({
      data: {
        userId: String(req.user!.id),
        query,
        status: 'RUNNING',
        startedAt: new Date(),
        importerIds: '[]' // Initialize with empty array
      }
    });

    // Run discovery in background (don't await)
    DiscoveryService.discoverImporters(query, session.id).catch((error) => {
      logger.error('Background discovery error:', error);
      prisma.discoverySession.update({
        where: { id: session.id },
        data: { status: 'FAILED', error: String(error), completedAt: new Date() }
      }).catch(() => {});
    });

    return res.json({
      message: 'Discovery started',
      sessionId: session.id,
      status: 'RUNNING'
    });
  } catch (error) {
    logger.error('Discovery controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDiscoveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Prisma expects a scalar string id; normalize Express param typing (string|string[]).
    const normalizedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

    if (!normalizedSessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await (prisma.discoverySession as any).findUnique({
      where: { id: normalizedSessionId },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get the importers found in this session
    let importers: any[] = [];
    if ((session as any).importerIds) {
      try {
        const importerIds = JSON.parse((session as any).importerIds);
        importers = await prisma.importer.findMany({
          where: { id: { in: importerIds } }
        });
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return res.json({
      id: session.id,
      query: (session as any).query,
      status: (session as any).status,
      totalFound: (session as any).totalFound,
      totalProcessed: (session as any).totalProcessed,
      importers,
      error: (session as any).error,
      startedAt: (session as any).startedAt,
      completedAt: (session as any).completedAt
    });
  } catch (error) {
    logger.error('Get discovery status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRecentDiscoveries = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await (prisma.discoverySession as any).findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    return res.json(sessions);
  } catch (error) {
    logger.error('Get recent discoveries error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
