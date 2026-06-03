import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma, logger } from '../index';
import { LeadScore } from '@prisma/client';

export class DiscoveryService {
  /**
   * Main discovery function
   * @param query Search query (e.g., "coffee importers Europe")
   */
  static async discoverImporters(query: string) {
    try {
      logger.info(`Starting discovery for query: ${query}`);
      
      // In a real production system, you would use a search API like Serper or Google Search API here
      // to get a list of URLs. For this implementation, we'll simulate finding some URLs
      // based on the query, then scrape them.
      
      const discoveredUrls = [
        'https://www.example-coffee-importer.com',
        'https://www.global-beans-ltd.com'
      ];

      const results = [];

      for (const url of discoveredUrls) {
        // Check if already exists
        const existing = await prisma.importer.findFirst({
          where: { website: url }
        });

        if (existing) {
          logger.info(`Skipping existing importer: ${url}`);
          continue;
        }

        const scrapedData = await this.scrapeWebsite(url);
        if (scrapedData) {
          const score = this.calculateLeadScore(scrapedData);
          
          const importer = await prisma.importer.create({
            data: {
              companyName: scrapedData.companyName || 'Unknown Company',
              website: url,
              email: scrapedData.email,
              phone: scrapedData.phone,
              linkedin: scrapedData.linkedin,
              country: scrapedData.country,
              leadScore: score,
              status: 'NEW',
              notes: `Discovered via automated search: ${query}`
            }
          });
          results.push(importer);
        }
      }

      return results;
    } catch (error) {
      logger.error('Discovery error:', error);
      throw error;
    }
  }

  private static async scrapeWebsite(url: string) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const companyName = $('title').text().split('|')[0].trim() || $('h1').first().text().trim();
      
      // Basic regex for email/phone (in production, use more robust patterns)
      const bodyText = $('body').text();
      const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = bodyText.match(/\+?[\d\s-]{10,}/);
      
      // Look for social links
      const linkedin = $('a[href*="linkedin.com"]').attr('href');

      return {
        companyName,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        linkedin,
        country: null, // Harder to extract reliably without NLP
        text: bodyText
      };
    } catch (error) {
      logger.warn(`Failed to scrape ${url}:`, error);
      return null;
    }
  }

  private static calculateLeadScore(data: any): LeadScore {
    let scorePoints = 0;

    if (data.email) scorePoints += 2;
    if (data.phone) scorePoints += 1;
    if (data.linkedin) scorePoints += 1;
    
    const keywords = ['coffee', 'specialty', 'importer', 'green bean', 'roasted'];
    const lowerText = data.text.toLowerCase();
    
    keywords.forEach(kw => {
      if (lowerText.includes(kw)) scorePoints += 1;
    });

    if (scorePoints >= 6) return 'A';
    if (scorePoints >= 3) return 'B';
    return 'C';
  }
}
