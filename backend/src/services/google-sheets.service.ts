import axios from 'axios';
import { logger } from '../index';

export class GoogleSheetsService {
  private static scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  /**
   * Sync a single importer to Google Sheets
   */
  static async syncImporter(importer: any) {
    if (!this.scriptUrl) {
      logger.warn('Google Script URL not configured, skipping sheet sync');
      return;
    }

    try {
      await axios.post(this.scriptUrl, {
        action: 'addImporter',
        data: {
          id: importer.id,
          companyName: importer.companyName,
          website: importer.website,
          email: importer.email,
          phone: importer.phone,
          country: importer.country,
          status: importer.status,
          leadScore: importer.leadScore,
          createdAt: importer.createdAt
        }
      });
      logger.info(`Synced importer ${importer.companyName} to Google Sheets`);
    } catch (error) {
      logger.error('Google Sheets sync error:', error);
    }
  }

  /**
   * Bulk sync all data to Google Sheets
   */
  static async syncAll(data: { importers: any[], samples: any[], quotations: any[] }) {
    if (!this.scriptUrl) {
      logger.warn('Google Script URL not configured, skipping bulk sync');
      return;
    }

    try {
      await axios.post(this.scriptUrl, {
        action: 'syncAll',
        ...data
      });
      logger.info('Bulk sync to Google Sheets completed');
    } catch (error) {
      logger.error('Google Sheets bulk sync error:', error);
    }
  }
}
