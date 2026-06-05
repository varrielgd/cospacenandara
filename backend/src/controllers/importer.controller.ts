import { Response } from 'express';
import { prisma, logger } from '../index';
import { AuthRequest } from '../middleware/auth';
import { GoogleSheetsService } from '../services/google-sheets.service';

export const getAllImporters = async (req: AuthRequest, res: Response) => {
  try {
    const importers = await prisma.importer.findMany({
      include: {
        contacts: true,
        _count: {
          select: { samples: true, quotations: true, emails: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(importers);
  } catch (error) {
    logger.error('Error fetching importers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getImporterById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const importer = await prisma.importer.findUnique({
      where: { id: id as string },
      include: {
        contacts: true,
        samples: true,
        quotations: true,
        emails: true,
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        importerNotes: true,
        tasks: true,
        attachments: true
      }
    });

    if (!importer) {
      return res.status(404).json({ message: 'Importer not found' });
    }

    return res.json(importer);
  } catch (error) {
    logger.error('Error fetching importer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createImporter = async (req: AuthRequest, res: Response) => {
  try {
    const importerData = req.body;
    const importer = await prisma.importer.create({
      data: importerData
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        importerId: importer.id,
        type: 'SYSTEM',
        description: `Importer ${importer.companyName} created manually.`
      }
    });

    // Sync to Google Sheets
    await GoogleSheetsService.syncImporter(importer);

    return res.status(201).json(importer);
  } catch (error) {
    logger.error('Error creating importer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateImporter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    const importerData = req.body;

    const importer = await prisma.importer.update({
      where: { id: id as string },
      data: importerData
    });

    return res.json(importer);
  } catch (error) {
    logger.error('Error updating importer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteImporter = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    await prisma.importer.delete({ where: { id: id as string } });
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting importer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkCreateImporters = async (req: AuthRequest, res: Response) => {
  try {
    const { importers } = req.body;
    if (!importers || !Array.isArray(importers)) {
      return res.status(400).json({ message: 'Importers array is required' });
    }

    const createdImporters = [];
    for (const data of importers) {
      // Basic check for existing
      const existing = await prisma.importer.findFirst({
        where: {
          OR: [
            { companyName: data.companyName },
            { website: data.website || undefined },
            { email: data.email || undefined }
          ].filter(cond => cond.companyName || cond.website || cond.email) as any
        }
      });

      if (!existing) {
        const created = await prisma.importer.create({
          data: {
            companyName: data.companyName,
            website: data.website,
            email: data.email,
            phone: data.phone,
            country: data.country,
            city: data.city,
            leadScore: data.leadScore,
            status: data.status || 'NEW',
            notes: data.notes,
            linkedin: data.linkedin
          }
        });
        createdImporters.push(created);
        
        // Activity log
        await prisma.activity.create({
          data: {
            userId: req.user!.id,
            importerId: created.id,
            type: 'SYSTEM',
            description: `Importer ${created.companyName} added via Discovery.`
          }
        });
        
        // Sheets sync
        await GoogleSheetsService.syncImporter(created).catch(() => {});
      }
    }

    return res.status(201).json({ 
      message: `Successfully processed ${importers.length} importers. ${createdImporters.length} new records created.`,
      count: createdImporters.length 
    });
  } catch (error) {
    logger.error('Error bulk creating importers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const syncToSheets = async (req: AuthRequest, res: Response) => {
  try {
    const { importerId } = req.body;
    if (!importerId) return res.status(400).json({ message: 'Importer ID is required' });

    const importer = await prisma.importer.findUnique({
      where: { id: importerId }
    });

    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    await GoogleSheetsService.syncImporter(importer);
    return res.json({ message: 'Successfully synced to Google Sheets' });
  } catch (error) {
    logger.error('Error syncing to sheets:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
