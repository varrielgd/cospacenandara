import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma, logger } from '../index.js';
import { AutoDiscoverService } from '../services/auto-discover.service.js';

export const executeAutoDiscover = async (req: AuthRequest, res: Response) => {
  try {
    const { websiteUrl } = req.body;
    const userId = req.user?.id;

    if (!websiteUrl) {
      return res.status(400).json({ message: 'Website URL is required' });
    }

    logger.info(`[AutoDiscover] Starting execution for ${websiteUrl} by user ${userId}`);

    // Check if we have a cached analysis for this website
    const existingImporter = await prisma.importer.findFirst({
      where: { website: websiteUrl }
    });

    // If exists and recently analyzed (within 30 days), return cached
    if (existingImporter && existingImporter.updatedAt) {
      const daysSinceUpdate = (Date.now() - new Date(existingImporter.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        logger.info(`[AutoDiscover] Returning cached analysis for ${websiteUrl} (${daysSinceUpdate.toFixed(1)} days old)`);
        
        // Build cached response
        const cachedResponse = {
          classification: {
            companyName: existingImporter.companyName,
            country: existingImporter.country || 'Unknown',
            city: existingImporter.city || 'Unknown',
            website: existingImporter.website || websiteUrl,
            businessType: existingImporter.businessType || 'Unknown',
            confidenceScore: existingImporter.confidenceScore ? Math.round(existingImporter.confidenceScore * 100) : 50,
            isCoffeeBusiness: true,
          },
          contacts: {
            companyEmail: existingImporter.email,
            procurementEmail: existingImporter.primaryContactEmail,
            salesEmail: null,
            coffeeBuyingEmail: null,
            phone: existingImporter.phone,
            whatsapp: existingImporter.whatsapp,
            linkedin: existingImporter.linkedin,
            contactPerson: existingImporter.primaryContactName,
            jobTitle: null,
          },
          importerId: existingImporter.id,
          isNewBuyer: false,
          timeline: ['Previous analysis cached'],
          cached: true,
        };

        return res.json(cachedResponse);
      }
    }

    // Execute full auto-discover workflow
    const result = await AutoDiscoverService.executeAutoDiscover(websiteUrl, userId || 'system');

    logger.info(`[AutoDiscover] Completed for ${websiteUrl}. New buyer: ${result.isNewBuyer}, ImporterId: ${result.importerId}`);

    return res.json({
      ...result,
      cached: false,
    });

  } catch (error: any) {
    logger.error('[AutoDiscover] Controller error:', error);
    return res.status(500).json({ 
      message: 'Auto-discover failed: ' + (error.message || 'Unknown error'),
      error: error.stack 
    });
  }
};

export const getAutoDiscoverHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { importerId } = req.params;
    const importerIdStr = typeof importerId === 'string' ? importerId : importerId?.[0];

    if (!importerIdStr) {
      return res.status(400).json({ message: 'Importer ID is required' });
    }

    const importer = await prisma.importer.findUnique({
      where: { id: importerIdStr }
    });
    
    const activities = await prisma.activity.findMany({
      where: { importerId: importerIdStr },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    const emails = await prisma.email.findMany({
      where: { importerId: importerIdStr },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const notes = await prisma.note.findMany({
      where: { importerId: importerIdStr },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    return res.json({
      importer,
      activities,
      emails,
      notes,
    });

  } catch (error: any) {
    logger.error('[AutoDiscover] History error:', error);
    return res.status(500).json({ message: 'Failed to load history: ' + error.message });
  }
};

export const refreshAutoDiscover = async (req: AuthRequest, res: Response) => {
  try {
    const { importerId } = req.params;
    const importerIdStr = typeof importerId === 'string' ? importerId : importerId?.[0];
    const userId = req.user?.id;

    if (!importerIdStr) {
      return res.status(400).json({ message: 'Importer ID is required' });
    }

    const importer = await prisma.importer.findUnique({
      where: { id: importerIdStr },
      select: { website: true }
    });

    if (!importer || !importer.website) {
      return res.status(404).json({ message: 'Importer or website not found' });
    }

    // Force fresh analysis (bypass cache)
    logger.info(`[AutoDiscover] Refreshing analysis for ${importer.website}`);
    
    const result = await AutoDiscoverService.executeAutoDiscover(importer.website, userId || 'system');

    return res.json({
      ...result,
      cached: false,
      refreshed: true,
    });

  } catch (error: any) {
    logger.error('[AutoDiscover] Refresh error:', error);
    return res.status(500).json({ message: 'Refresh failed: ' + error.message });
  }
};