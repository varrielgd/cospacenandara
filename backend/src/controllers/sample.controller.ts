import { Request, Response } from 'express';
import { prisma, logger } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAllSamples = async (_req: AuthRequest, res: Response) => {
  try {
    const samples = await prisma.sample.findMany({
      include: { importer: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(samples);
  } catch (error) {
    logger.error('Error fetching samples:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSample = async (req: AuthRequest, res: Response) => {
  try {
    const sampleData = req.body;
    const sample = await prisma.sample.create({
      data: sampleData,
      include: { importer: { select: { companyName: true } } }
    });

    if (req.user) {
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          importerId: sample.importerId,
          type: 'SAMPLE',
          description: `New sample process started for ${sample.importer.companyName} (${sample.product}). Current stage: ${sample.status}.`
        }
      });
    }

    return res.status(201).json(sample);
  } catch (error) {
    logger.error('Error creating sample:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSample = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    const sampleData = req.body;

    const oldSample = await prisma.sample.findUnique({ where: { id: id as string } });
    if (!oldSample) return res.status(404).json({ message: 'Sample not found' });

    const sample = await prisma.sample.update({
      where: { id: id as string },
      data: sampleData,
      include: { importer: { select: { companyName: true } } }
    });

    if (req.user && oldSample.status !== sample.status) {
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          importerId: sample.importerId,
          type: 'SAMPLE',
          description: `Sample stage updated for ${sample.importer.companyName}: ${oldSample.status} -> ${sample.status}.`
        }
      });
    }

    return res.json(sample);
  } catch (error) {
    logger.error('Error updating sample:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSample = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    await prisma.sample.delete({ where: { id: id as string } });
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting sample:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
