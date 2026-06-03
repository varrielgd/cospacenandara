import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { GoogleSheetsService } from '../services/google-sheets.service';
import { prisma } from '../index';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);

router.post('/sync-sheets', async (req, res) => {
  try {
    const [importers, samples, quotations] = await Promise.all([
      prisma.importer.findMany(),
      prisma.sample.findMany(),
      prisma.quotation.findMany()
    ]);

    await GoogleSheetsService.syncAll({ importers, samples, quotations });
    res.json({ message: 'Sync to Google Sheets successful' });
  } catch (error) {
    res.status(500).json({ message: 'Sync failed' });
  }
});

export default router;
