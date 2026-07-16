import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma, logger } from '../index.js';
import { AutoDiscoverService } from '../services/auto-discover.service.js';

export const executeAutoDiscover = async (req: AuthRequest, res: Response) => {
  try {
    const { websiteUrl, force = false } = req.body;
    const userId = req.user?.id;

    if (!websiteUrl) {
      return res.status(400).json({ message: 'Website URL is required' });
    }

    logger.info(`[AutoDiscover] Starting execution for ${websiteUrl} by user ${userId} (force: ${force})`);

    // Check if we have a cached analysis for this website
    const existingImporter = await prisma.importer.findFirst({
      where: { website: websiteUrl }
    });

    // If exists, recently analyzed (within 30 days), and NOT forced: return cached
    if (existingImporter && existingImporter.updatedAt && !force) {
      const daysSinceUpdate = (Date.now() - new Date(existingImporter.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        logger.info(`[AutoDiscover] CACHE HIT - Returning cached analysis for ${websiteUrl} (${daysSinceUpdate.toFixed(1)} days old)`);
        
        // Build cached response with all available fields
        const cachedResponse = {
          classification: {
            companyName: existingImporter.companyName,
            tradingName: existingImporter.companyName, // Use companyName as tradingName for cached
            country: existingImporter.country || 'Unknown',
            city: existingImporter.city || 'Unknown',
            address: existingImporter.address || undefined,
            website: existingImporter.website || websiteUrl,
            businessType: existingImporter.businessType || 'Unknown',
            founded: undefined,
            employeeEstimate: undefined,
            businessScale: undefined,
            confidenceScore: existingImporter.confidenceScore ? Math.round(existingImporter.confidenceScore * 100) : 50,
            isCoffeeBusiness: true,
            warning: existingImporter.confidenceScore && existingImporter.confidenceScore < 0.7 ? 'Cached analysis - confidence below 70%' : undefined,
            coffeeCategories: undefined,
            services: undefined,
            industries: undefined,
            targetCustomers: undefined,
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
            priority: 'MEDIUM',
          },
          portfolio: {
            origins: [],
            products: [],
            processingMethods: [],
            certifications: [],
            roastingStyle: 'Unknown',
            currentSuppliers: [],
            privateLabels: [],
            buyingInterests: [],
            packagingTypes: [],
            estimatedAnnualVolume: 'Unknown',
            specialtyFocus: 'Unknown',
          },
          productMatches: [],
          bestProducts: [],
          gapAnalysis: 'Cached analysis - full product matching not available.',
          scores: {
            opportunityScore: 50,
            relationshipDifficulty: 50,
            buyingPotential: 50,
            estimatedVolume: 'Unknown',
            premiumPotential: 50,
            specialtyCoffeeInterest: 50,
            decisionComplexity: 50,
            priceSensitivity: 50,
            responseProbability: 50,
            riskLevel: 'Medium',
          },
          insight: {
            businessSummary: existingImporter.notes || 'No business summary available in cache.',
            businessModel: existingImporter.businessType || 'Unknown',
            currentCoffeeStrategy: 'Unknown',
            possiblePainPoints: [],
            potentialOpportunities: [],
            recommendedSalesAngle: 'Refresh analysis for updated insights.',
            recommendedCommunicationStyle: 'Professional',
          },
          importerId: existingImporter.id,
          isNewBuyer: false,
          timeline: ['Previous analysis cached', `Last updated: ${new Date(existingImporter.updatedAt).toLocaleDateString()}`],
          outreachStrategy: {
            emailType: 'FIRST_CONTACT',
            reason: 'Cached analysis - refresh for updated strategy.',
          },
          emailDraft: {
            subject: '',
            body: '',
          },
          recommendedAttachments: [],
          cached: true,
        };

        return res.json(cachedResponse);
      } else {
        logger.info(`[AutoDiscover] CACHE EXPIRED - Re-analyzing (${daysSinceUpdate.toFixed(1)} days old)`);
      }
    } else if (force) {
      logger.info(`[AutoDiscover] CACHE BYPASS - Force re-analysis requested for ${websiteUrl}`);
    }

    // Execute full auto-discover workflow
    logger.info(`[AutoDiscover] AI REQUEST STARTED - Executing full workflow for ${websiteUrl}`);
    const result = await AutoDiscoverService.executeAutoDiscover(websiteUrl, userId || 'system');
    logger.info(`[AutoDiscover] AI RESPONSE RECEIVED - Completed for ${websiteUrl}. New buyer: ${result.isNewBuyer}, ImporterId: ${result.importerId}`);

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