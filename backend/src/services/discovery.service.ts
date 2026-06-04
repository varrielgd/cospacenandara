import { prisma, logger } from '../index';
import { GoogleSheetsService } from './google-sheets.service';
import { AiService } from './ai.service';

export class DiscoveryService {
  /**
   * Main discovery function - AI-powered importer discovery
   * @param query Search query (e.g., "coffee importers Germany")
   * @param sessionId Session ID to track progress
   */
  static async discoverImporters(query: string, sessionId?: string) {
    const foundImporterIds: string[] = [];

    try {
      logger.info(`Starting REAL AI discovery for query: ${query}, session: ${sessionId}`);

      // Step 1: Use AI to find real importers
      const systemPrompt = `
        You are a specialized coffee market research expert. 
        Your task is to find REAL and EXISTING coffee importers, green bean buyers, or specialty coffee roasters.
        
        CRITICAL RULES:
        - Return ONLY real companies that actually exist.
        - Provide verified contact information if available.
        - Return the data as a JSON array of objects.
        
        JSON Schema:
        [
          {
            "companyName": "string",
            "website": "string",
            "email": "string",
            "phone": "string",
            "country": "string",
            "city": "string",
            "leadScore": "A" | "B" | "C",
            "linkedin": "string"
          }
        ]
      `;

      const aiResponse = await AiService.generateContent(
        `Find 5 real coffee importers based on this query: ${query}. Focus on businesses that might import Indonesian coffee.`,
        { systemPrompt, responseMimeType: 'application/json' }
      );

      let discoveredImporters: any[] = [];
      try {
        // Clean AI response from markdown backticks if present
        const cleanedResponse = aiResponse.replace(/```json\n?|```/g, '').trim();
        discoveredImporters = JSON.parse(cleanedResponse);
        
        if (!Array.isArray(discoveredImporters)) {
          if (typeof discoveredImporters === 'object' && (discoveredImporters as any).importers) {
            discoveredImporters = (discoveredImporters as any).importers;
          } else if (typeof discoveredImporters === 'object') {
            discoveredImporters = [discoveredImporters];
          }
        }
      } catch (e) {
        logger.error('Failed to parse AI response for discovery:', e);
        logger.debug('Raw AI response:', aiResponse);
        throw new Error('AI returned invalid data format');
      }

      if (sessionId) {
        await prisma.discoverySession.update({
          where: { id: sessionId },
          data: { totalFound: discoveredImporters.length, status: 'RUNNING' }
        }).catch(() => {});
      }

      logger.info(`Found ${discoveredImporters.length} importers from REAL AI discovery`);

      if (discoveredImporters.length === 0) {
        logger.warn('AI returned 0 importers. Check the prompt or AI provider status.');
      }

      // Process each discovered importer
      for (let i = 0; i < discoveredImporters.length; i++) {
        const importer = discoveredImporters[i];
        logger.info(`Processing importer ${i + 1}/${discoveredImporters.length}: ${importer.companyName}`);

        // Update progress
        if (sessionId) {
          await prisma.discoverySession.update({
            where: { id: sessionId },
            data: { totalProcessed: i + 1 }
          }).catch(() => {});
        }

        try {
          // Basic validation
          if (!importer.companyName) continue;

          // Check if already exists
          const existing = await prisma.importer.findFirst({
            where: {
              OR: [
                { companyName: importer.companyName },
                { website: importer.website || undefined }
              ].filter(c => c.companyName || c.website) as any
            }
          });

          if (existing) {
            logger.info(`Skipping existing importer: ${importer.companyName}`);
            foundImporterIds.push(existing.id);
            continue;
          }

          // Create importer record
          const created = await prisma.importer.create({
            data: {
              companyName: importer.companyName,
              website: importer.website || '',
              email: importer.email || '',
              phone: importer.phone || '',
              linkedin: importer.linkedin || '',
              country: importer.country || '',
              city: importer.city || '',
              leadScore: (importer.leadScore as any) || 'B',
              status: 'NEW',
              notes: `Real AI Discovery: ${query}`
            }
          });

          foundImporterIds.push(created.id);

          // Sync to Google Sheets
          await GoogleSheetsService.syncImporter(created).catch((err) => {
            logger.error('Google Sheets sync failed:', err);
          });

          logger.info(`Successfully discovered: ${created.companyName}`);
        } catch (err) {
          logger.warn(`Failed to process importer:`, err);
        }
      }

      // Mark session as completed
      if (sessionId) {
        await prisma.discoverySession.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            totalFound: discoveredImporters.length,
            totalProcessed: discoveredImporters.length,
            importerIds: JSON.stringify(foundImporterIds),
            completedAt: new Date()
          }
        }).catch(() => {});
      }

      logger.info(`Discovery completed with ${foundImporterIds.length} importers processed`);
      return foundImporterIds;
    } catch (error) {
      logger.error('Discovery error:', error);
      if (sessionId) {
        await prisma.discoverySession.update({
          where: { id: sessionId },
          data: { 
            status: 'FAILED',
            error: String(error),
            completedAt: new Date()
          }
        }).catch(() => {});
      }
      throw error;
    }
  }
}
