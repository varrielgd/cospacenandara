import { prisma, logger } from '../index.js';
import { AiService } from './ai.service.js';

export interface BuyerIntelligence {
  companyProfile: string;
  products: string;
  brands: string;
  roastingCapability: string;
  importingActivity: string;
  sustainabilityInfo: string;
  sourcingInfo: string;
  targetMarket: string;
  businessPersonality: string;
  companySize: string;
  estimatedBuyingVolume: string;
  possibleDecisionMaker: string;
  buyingInterestScore: number;
  riskScore: number;
  opportunityScore: number;
  rawAnalysis: string;
}

export interface ProductMatchResult {
  productName: string;
  matchLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReason: string;
  confidenceScore: number;
}

export interface OutreachStrategy {
  strategy: string;
  reason: string;
  confidenceScore: number;
}

export interface EmailHistoryAnalysis {
  totalEmails: number;
  lastContactDate: string | null;
  lastEmailType: string | null;
  lastSubject: string | null;
  conversationSummary: string;
  buyerReplied: boolean;
  buyerIntent: string | null;
  buyerQuestions: string[];
  buyerConcerns: string[];
  whatWasOffered: string[];
  whatWasSent: string[];
  quotationsExist: boolean;
  samplesExist: boolean;
  pricingDiscussed: boolean;
  shipmentExists: boolean;
  contractExists: boolean;
  sequenceStep: number;
}

export interface AttachmentRecommendation {
  name: string;
  reason: string;
  checkboxField: string;
}

export interface IntelligentEmailResult {
  subject: string;
  subjects: string[];
  body: string;
  emailType: string;
  strategy: OutreachStrategy;
  aiReason: string;
  confidenceScore: number;
  recommendedAttachments: AttachmentRecommendation[];
  selectedProduct: string;
  sequenceStep: number;
  nextRecommendedAction: string;
}

const NANDARA_PRODUCTS = [
  'Aceh Gayo Grade 1 (Classic)',
  'Sumatra Lintong G1 (Classic)',
  'Sumatra Mandheling (Classic)',
  'Gayo Wild Natural (Modern Process)',
  'Java Preanger Reserve (Modern Process)',
  'Bali Kintamani (Modern Process)',
  'Flores Volcanic (Modern Process)',
  'Toraja Reserve (Modern Process)',
  'Gayo LB Reserve (Rare Microlot)',
  'Lampung Reserve (Fine Robusta)',
  'Temanggung Fine Robusta (Fine Robusta)'
];

const EMAIL_SEQUENCE = [
  'FIRST_CONTACT',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'SAMPLE_OFFER',
  'SAMPLE_SENT',
  'SAMPLE_FEEDBACK',
  'QUOTATION',
  'NEGOTIATION',
  'PRICE_UPDATE',
  'SHIPMENT_READY',
  'SHIPMENT_SENT',
  'CONTRACT_REMINDER',
  'LONG_TERM_PARTNERSHIP',
  'REENGAGEMENT'
];

export class EmailIntelligenceService {

  private static getFallbackIntelligence(websiteUrl: string): BuyerIntelligence {
    return {
      companyProfile: 'Unable to analyze website automatically.',
      products: '',
      brands: '',
      roastingCapability: '',
      importingActivity: '',
      sustainabilityInfo: '',
      sourcingInfo: '',
      targetMarket: '',
      businessPersonality: '',
      companySize: '',
      estimatedBuyingVolume: '',
      possibleDecisionMaker: '',
      buyingInterestScore: 50,
      riskScore: 50,
      opportunityScore: 50,
      rawAnalysis: `Website ${websiteUrl} could not be analyzed. Please try again or enter details manually.`
    };
  }

  /**
   * Analyze a buyer's website using AI to extract structured intelligence
   */
  static async analyzeWebsite(importerId: string, websiteUrl: string): Promise<BuyerIntelligence> {
    logger.info(`[EmailIntelligence] Analyzing website for importer ${importerId}: ${websiteUrl}`);

    let websiteContent = '';
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000)
      });
      websiteContent = await response.text();
      websiteContent = websiteContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000);
    } catch (fetchErr: any) {
      logger.warn(`[EmailIntelligence] Failed to fetch website ${websiteUrl}: ${fetchErr.message}`);
      websiteContent = `Unable to fetch website content. URL: ${websiteUrl}. Error: ${fetchErr.message}`;
    }

    const prompt = `You are a B2B buyer intelligence analyst for a premium Indonesian coffee exporter. Analyze this buyer's website content and produce a structured intelligence profile.

WEBSITE URL: ${websiteUrl}

WEBSITE CONTENT:
${websiteContent}

TASK: Extract the following intelligence from the website content. Be honest if information is not available — do not fabricate.

Return your analysis in EXACTLY this JSON format (no markdown, no code blocks, pure JSON):

{
  "companyProfile": "Summary of what the company does, their mission, and core business",
  "products": "Products they sell or use (types of coffee, equipment, etc.)",
  "brands": "Brands they represent or sell",
  "roastingCapability": "Do they roast coffee? What scale? Any roasting equipment mentioned?",
  "importingActivity": "Evidence they import coffee from other countries. Which origins?",
  "sustainabilityInfo": "Any sustainability certifications, programs, or commitments mentioned",
  "sourcingInfo": "How they source coffee — direct trade, fair trade, auctions, etc.",
  "targetMarket": "Who do they sell to? (retailers, cafes, wholesalers, end consumers)",
  "businessPersonality": "Company culture and communication style (professional, innovative, traditional, etc.)",
  "companySize": "Estimated size (small, medium, large enterprise, multinational)",
  "estimatedBuyingVolume": "Estimated annual coffee buying volume in metric tons (educated guess based on company size and type)",
  "possibleDecisionMaker": "Likely job title(s) of person who makes purchasing decisions",
  "buyingInterestScore": "Numeric score 0-100 indicating how likely they are to buy Indonesian specialty coffee",
  "riskScore": "Numeric score 0-100 indicating risk level (payment risk, competition, etc.)",
  "opportunityScore": "Numeric score 0-100 indicating business opportunity for Nandara",
  "rawAnalysis": "Detailed narrative analysis of this buyer as a potential partner for Nandara"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are an expert B2B buyer intelligence analyst specializing in the global coffee industry. You analyze company websites and produce accurate, structured intelligence reports. Always respond in pure JSON format without markdown formatting.'
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : this.getFallbackIntelligence(websiteUrl);

      const intelligence: BuyerIntelligence = {
        companyProfile: parsed.companyProfile || '',
        products: parsed.products || '',
        brands: parsed.brands || '',
        roastingCapability: parsed.roastingCapability || '',
        importingActivity: parsed.importingActivity || '',
        sustainabilityInfo: parsed.sustainabilityInfo || '',
        sourcingInfo: parsed.sourcingInfo || '',
        targetMarket: parsed.targetMarket || '',
        businessPersonality: parsed.businessPersonality || '',
        companySize: parsed.companySize || '',
        estimatedBuyingVolume: parsed.estimatedBuyingVolume || '',
        possibleDecisionMaker: parsed.possibleDecisionMaker || '',
        buyingInterestScore: Math.min(100, Math.max(0, parsed.buyingInterestScore || 50)),
        riskScore: Math.min(100, Math.max(0, parsed.riskScore || 50)),
        opportunityScore: Math.min(100, Math.max(0, parsed.opportunityScore || 50)),
        rawAnalysis: parsed.rawAnalysis || '',
      };

      await prisma.$executeRawUnsafe(`
        INSERT INTO "BuyerIntelligence" ("importerId", "websiteUrl", "companyProfile", "products", "brands", "roastingCapability", "importingActivity", "sustainabilityInfo", "sourcingInfo", "targetMarket", "businessPersonality", "companySize", "estimatedBuyingVolume", "possibleDecisionMaker", "buyingInterestScore", "riskScore", "opportunityScore", "rawAnalysis", "analyzedAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        ON CONFLICT ("importerId") DO UPDATE SET
          "websiteUrl" = EXCLUDED."websiteUrl",
          "companyProfile" = EXCLUDED."companyProfile",
          "products" = EXCLUDED."products",
          "brands" = EXCLUDED."brands",
          "roastingCapability" = EXCLUDED."roastingCapability",
          "importingActivity" = EXCLUDED."importingActivity",
          "sustainabilityInfo" = EXCLUDED."sustainabilityInfo",
          "sourcingInfo" = EXCLUDED."sourcingInfo",
          "targetMarket" = EXCLUDED."targetMarket",
          "businessPersonality" = EXCLUDED."businessPersonality",
          "companySize" = EXCLUDED."companySize",
          "estimatedBuyingVolume" = EXCLUDED."estimatedBuyingVolume",
          "possibleDecisionMaker" = EXCLUDED."possibleDecisionMaker",
          "buyingInterestScore" = EXCLUDED."buyingInterestScore",
          "riskScore" = EXCLUDED."riskScore",
          "opportunityScore" = EXCLUDED."opportunityScore",
          "rawAnalysis" = EXCLUDED."rawAnalysis",
          "analyzedAt" = NOW(),
          "updatedAt" = NOW()
      `, [
        importerId, websiteUrl, intelligence.companyProfile, intelligence.products,
        intelligence.brands, intelligence.roastingCapability, intelligence.importingActivity,
        intelligence.sustainabilityInfo, intelligence.sourcingInfo, intelligence.targetMarket,
        intelligence.businessPersonality, intelligence.companySize, intelligence.estimatedBuyingVolume,
        intelligence.possibleDecisionMaker, intelligence.buyingInterestScore,
        intelligence.riskScore, intelligence.opportunityScore, intelligence.rawAnalysis
      ]);

      logger.info(`[EmailIntelligence] Website analysis saved for importer ${importerId}`);
      return intelligence;

    } catch (error: any) {
      logger.error(`[EmailIntelligence] Website analysis failed: ${error.message}`);
      return this.getFallbackIntelligence(websiteUrl);
    }
  }

  /**
   * Match buyer profile against all Nandara products
   */
  static async matchProducts(importerId: string, buyerIntelligence: BuyerIntelligence): Promise<ProductMatchResult[]> {
    logger.info(`[EmailIntelligence] Matching products for importer ${importerId}`);

    const prompt = `You are a product matching specialist for Nandara Nusa Montierra, an Indonesian specialty coffee exporter.

BUYER PROFILE:
Company Profile: ${buyerIntelligence.companyProfile}
Products They Sell: ${buyerIntelligence.products}
Target Market: ${buyerIntelligence.targetMarket}
Roasting Capability: ${buyerIntelligence.roastingCapability}
Importing Activity: ${buyerIntelligence.importingActivity}
Sustainability Focus: ${buyerIntelligence.sustainabilityInfo}

NANDARA PRODUCT PORTFOLIO:
${NANDARA_PRODUCTS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

TASK: For each Nandara product, determine the match level (HIGH, MEDIUM, or LOW) based on how well it fits this buyer's business. Consider:
- Buyer's target market and customer preferences
- Roasting capability (light roast vs dark roast suitable origins)
- Sustainability focus (organic, direct trade certifications)
- Importing patterns (which origins they currently buy from)
- Business type (roaster, importer, distributor, cafe chain)

Return your analysis in EXACTLY this JSON array format (no markdown, no code blocks, pure JSON):

[
  {
    "productName": "Aceh Gayo Grade 1 (Classic)",
    "matchLevel": "HIGH",
    "matchReason": "Brief reason why this product matches",
    "confidenceScore": 85
  }
]

Include ALL ${NANDARA_PRODUCTS.length} products in the array.`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a product matching AI for a coffee export company. You analyze buyer profiles and match them against a product portfolio. Always respond in pure JSON array format without markdown formatting.'
      });

      const jsonMatch = result.match(/\[[\s\S]*\]/);
      const matches: any[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      const productMatches: ProductMatchResult[] = matches.map((m: any) => ({
        productName: m.productName || '',
        matchLevel: (m.matchLevel === 'HIGH' || m.matchLevel === 'MEDIUM' || m.matchLevel === 'LOW') ? m.matchLevel : 'MEDIUM',
        matchReason: m.matchReason || '',
        confidenceScore: Math.min(100, Math.max(0, m.confidenceScore || 50)),
      }));

      // Save to database
      await prisma.$executeRawUnsafe(`DELETE FROM "ProductMatch" WHERE "importerId" = $1`, [importerId]);
      for (const pm of productMatches) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "ProductMatch" ("importerId", "productName", "matchLevel", "matchReason", "confidenceScore", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [importerId, pm.productName, pm.matchLevel, pm.matchReason, pm.confidenceScore]);
      }

      logger.info(`[EmailIntelligence] Product matches saved for importer ${importerId}: ${productMatches.length} products`);
      return productMatches;

    } catch (error: any) {
      logger.error(`[EmailIntelligence] Product matching failed: ${error.message}`);
      return NANDARA_PRODUCTS.map(p => ({
        productName: p,
        matchLevel: 'MEDIUM' as const,
        matchReason: 'AI matching unavailable. Default medium match.',
        confidenceScore: 50,
      }));
    }
  }

  /**
   * Analyze email history for a buyer
   */
  static async analyzeEmailHistory(importerId: string): Promise<EmailHistoryAnalysis> {
    logger.info(`[EmailIntelligence] Analyzing email history for importer ${importerId}`);

    try {
      const emails = await prisma.email.findMany({
        where: { importerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const quotations = await prisma.quotation.findMany({
        where: { importerId },
        take: 5,
      });

      const samples = await prisma.sample.findMany({
        where: { importerId },
        take: 5,
      });

      const memoryRecords = await prisma.$queryRawUnsafe<Array<{
        id: string; emailType: string; sequenceStep: number; nextRecommendedAction: string; generatedAt: Date;
      }>>(
        `SELECT id, "emailType", "sequenceStep", "nextRecommendedAction", "generatedAt" FROM "EmailMemory" WHERE "importerId" = $1 ORDER BY "generatedAt" DESC LIMIT 10`,
        [importerId]
      );

      const lastEmail = emails[0] || null;
      const lastMemory = memoryRecords[0] || null;

      const analysis: EmailHistoryAnalysis = {
        totalEmails: emails.length,
        lastContactDate: lastEmail?.createdAt?.toISOString() || null,
        lastEmailType: lastMemory?.emailType || null,
        lastSubject: lastEmail?.subject || null,
        conversationSummary: emails.length > 0
          ? emails.slice(0, 5).map(e => `[${e.direction}] ${e.subject} (${e.status})`).join(' | ')
          : 'No previous email history.',
        buyerReplied: emails.some(e => e.direction === 'INBOUND'),
        buyerIntent: null,
        buyerQuestions: [],
        buyerConcerns: [],
        whatWasOffered: [],
        whatWasSent: [],
        quotationsExist: quotations.length > 0,
        samplesExist: samples.length > 0,
        pricingDiscussed: quotations.length > 0,
        shipmentExists: false,
        contractExists: false,
        sequenceStep: lastMemory?.sequenceStep || 0,
      };

      // If there are inbound emails, analyze the latest one for intent
      const inboundEmails = emails.filter(e => e.direction === 'INBOUND');
      if (inboundEmails.length > 0) {
        const latestReply = inboundEmails[0];
        const intentAnalysis = await this.analyzeReplyIntent(latestReply.subject, latestReply.body);
        analysis.buyerIntent = intentAnalysis.intent;
        analysis.buyerQuestions = intentAnalysis.questions;
        analysis.buyerConcerns = intentAnalysis.concerns;
      }

      return analysis;

    } catch (error: any) {
      logger.error(`[EmailIntelligence] Email history analysis failed: ${error.message}`);
      return {
        totalEmails: 0,
        lastContactDate: null,
        lastEmailType: null,
        lastSubject: null,
        conversationSummary: 'Unable to analyze email history.',
        buyerReplied: false,
        buyerIntent: null,
        buyerQuestions: [],
        buyerConcerns: [],
        whatWasOffered: [],
        whatWasSent: [],
        quotationsExist: false,
        samplesExist: false,
        pricingDiscussed: false,
        shipmentExists: false,
        contractExists: false,
        sequenceStep: 0,
      };
    }
  }

  /**
   * Analyze a buyer's reply to understand intent
   */
  private static async analyzeReplyIntent(subject: string, body: string): Promise<{
    intent: string; questions: string[]; concerns: string[];
  }> {
    const prompt = `Analyze this buyer's email reply and extract their intent, questions, and concerns.

SUBJECT: ${subject}
BODY: ${body.substring(0, 2000)}

Return in JSON format:
{
  "intent": "One of: INTERESTED, NOT_INTERESTED, NEED_MORE_INFO, PRICE_NEGOTIATION, QUALITY_CONCERN, LOGISTICS_QUESTION, SAMPLE_REQUEST, QUOTATION_REQUEST, MEETING_REQUEST, OTHER",
  "questions": ["Question 1", "Question 2"],
  "concerns": ["Concern 1", "Concern 2"]
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You analyze B2B email replies and extract buyer intent. Respond in pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'OTHER', questions: [], concerns: [] };
      return {
        intent: parsed.intent || 'OTHER',
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      };
    } catch {
      return { intent: 'OTHER', questions: [], concerns: [] };
    }
  }

  /**
   * Determine the best outreach strategy
   */
  static async determineStrategy(
    emailHistory: EmailHistoryAnalysis,
    buyerIntelligence: BuyerIntelligence,
    productMatches: ProductMatchResult[]
  ): Promise<OutreachStrategy> {
    const bestProduct = productMatches.find(p => p.matchLevel === 'HIGH') || productMatches[0] || null;

    const prompt = `You are an AI sales strategist for Nandara Nusa Montierra, an Indonesian coffee exporter.

BUYER INTELLIGENCE:
Company: ${buyerIntelligence.companyProfile.substring(0, 300)}
Target Market: ${buyerIntelligence.targetMarket}
Buying Interest Score: ${buyerIntelligence.buyingInterestScore}/100
Opportunity Score: ${buyerIntelligence.opportunityScore}/100

EMAIL HISTORY:
Total Emails Sent: ${emailHistory.totalEmails}
Last Email Type: ${emailHistory.lastEmailType || 'None'}
Buyer Replied: ${emailHistory.buyerReplied ? 'Yes' : 'No'}
Buyer Intent: ${emailHistory.buyerIntent || 'Unknown'}
Conversation Summary: ${emailHistory.conversationSummary.substring(0, 300)}

BEST PRODUCT MATCH: ${bestProduct ? `${bestProduct.productName} (${bestProduct.matchLevel} - ${bestProduct.matchReason})` : 'Unknown'}

AVAILABLE STRATEGIES:
Introduction, Education, Relationship, Sample, Pricing, Negotiation, Urgency, Harvest Update, Follow Up, Re-engagement, Contract, Long Term Partnership

TASK: Choose the single best outreach strategy for this buyer at this moment. Consider:
- Where they are in the buyer journey
- Their demonstrated interest level
- Previous conversation history
- Their business type and needs
- The best product match

Return in JSON format:
{
  "strategy": "Chosen strategy name",
  "reason": "Detailed explanation of why this strategy is best",
  "confidenceScore": 0-100
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a B2B sales strategist for specialty coffee exports. Choose the optimal outreach strategy based on buyer intelligence and history. Respond in pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { strategy: 'Introduction', reason: 'Default strategy', confidenceScore: 50 };
      return {
        strategy: parsed.strategy || 'Introduction',
        reason: parsed.reason || 'AI analysis unavailable.',
        confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 50)),
      };
    } catch {
      return { strategy: 'Introduction', reason: 'AI analysis unavailable.', confidenceScore: 50 };
    }
  }

  /**
   * Determine the best email type based on sequence and intelligence
   */
  static determineEmailTypeFromSequence(history: EmailHistoryAnalysis): string {
    if (history.totalEmails === 0) return 'FIRST_CONTACT';
    if (history.buyerReplied && history.buyerIntent === 'SAMPLE_REQUEST') return 'SAMPLE_OFFER';
    if (history.buyerReplied && history.buyerIntent === 'QUOTATION_REQUEST') return 'QUOTATION';
    if (history.buyerReplied && history.buyerIntent === 'PRICE_NEGOTIATION') return 'NEGOTIATION';
    if (history.buyerReplied && history.buyerIntent === 'NOT_INTERESTED') return 'REENGAGEMENT';
    if (history.quotationsExist && !history.pricingDiscussed) return 'NEGOTIATION';
    if (history.samplesExist && !history.buyerReplied) return 'SAMPLE_FEEDBACK';
    if (history.totalEmails === 1) return 'FOLLOW_UP_1';
    if (history.totalEmails >= 2) return 'FOLLOW_UP_2';
    return 'FIRST_CONTACT';
  }

  /**
   * Recommend attachments based on email type and buyer profile
   */
  static async recommendAttachments(
    emailType: string,
    strategy: OutreachStrategy,
    buyerIntelligence: BuyerIntelligence
  ): Promise<AttachmentRecommendation[]> {
    const recommendations: AttachmentRecommendation[] = [];

    // Always recommend Company Profile for first contacts
    if (emailType === 'FIRST_CONTACT' || emailType === 'FOLLOW_UP_1') {
      recommendations.push({
        name: 'Company Profile',
        reason: 'Introduce Nandara Nusa Montierra as a reliable coffee exporter',
        checkboxField: 'attachCompanyProfile'
      });
      recommendations.push({
        name: 'Product Catalogue',
        reason: 'Showcase our full range of Indonesian specialty coffee',
        checkboxField: 'attachCatalogue'
      });
    }

    // Price list for pricing-related emails
    if (['QUOTATION', 'NEGOTIATION', 'PRICE_UPDATE'].includes(emailType)) {
      recommendations.push({
        name: 'Price List',
        reason: 'Provide current FOB pricing for negotiation',
        checkboxField: 'attachPriceList'
      });
    }

    // Sample program for sample-related emails
    if (['SAMPLE_OFFER', 'SAMPLE_SENT'].includes(emailType)) {
      recommendations.push({
        name: 'Sample Program',
        reason: 'Outline our sample request and shipping process',
        checkboxField: 'attachSampleProgram'
      });
    }

    // Quotation for negotiation
    if (['NEGOTIATION', 'QUOTATION'].includes(emailType)) {
      recommendations.push({
        name: 'Quotation',
        reason: 'Formal pricing proposal for the buyer',
        checkboxField: 'attachQuotation'
      });
    }

    // Proforma Invoice for shipment
    if (['SHIPMENT_READY', 'SHIPMENT_SENT'].includes(emailType)) {
      recommendations.push({
        name: 'Proforma Invoice',
        reason: 'Commercial invoice for the shipment',
        checkboxField: 'attachProformaInvoice'
      });
    }

    // If buyer has sustainability focus, always recommend Company Profile
    if (buyerIntelligence.sustainabilityInfo && buyerIntelligence.sustainabilityInfo.length > 20) {
      if (!recommendations.find(r => r.checkboxField === 'attachCompanyProfile')) {
        recommendations.push({
          name: 'Company Profile',
          reason: 'Highlight our sustainability certifications and direct trade model',
          checkboxField: 'attachCompanyProfile'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate 5 optimized subject lines
   */
  static async generateSubjectLines(
    buyerName: string,
    buyerCountry: string,
    emailType: string,
    strategy: OutreachStrategy,
    selectedProduct: string,
    buyerIntelligence: BuyerIntelligence
  ): Promise<string[]> {
    const prompt = `Generate 5 professional B2B email subject lines for a coffee export outreach.

BUYER: ${buyerName}
COUNTRY: ${buyerCountry}
EMAIL TYPE: ${emailType}
STRATEGY: ${strategy.strategy}
PRODUCT: ${selectedProduct}
BUYER BUSINESS: ${buyerIntelligence.companyProfile.substring(0, 200)}

Requirements:
- Each subject line must be unique
- Must reference the buyer's business or country
- Must be professional and compelling
- No clickbait or spammy language
- Max 60 characters each
- Rank from strongest (1) to weakest (5)

Return as a JSON array of strings only:
["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"]`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a B2B email copywriter specializing in coffee export. Generate compelling, professional subject lines. Respond in pure JSON array format.'
      });
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      const subjects: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      return subjects.filter(s => typeof s === 'string' && s.length > 0).slice(0, 5);
    } catch {
      return [
        `Partnership Inquiry: Premium Indonesian Coffee for ${buyerName}`,
        `Exploring a Coffee Partnership with ${buyerName}`,
        `Indonesian Specialty Coffee — Direct from Origin`,
        `${selectedProduct} — Sourcing Opportunity`,
        `Direct Trade Coffee: ${buyerName} & Nandara Nusa Montierra`
      ];
    }
  }

  /**
   * Main pipeline: Generate a fully intelligent email
   */
  static async generateIntelligentEmail(
    importerId: string,
    importerName: string,
    buyerCountry: string,
    buyerEmail: string,
    buyerWebsite: string,
    contactName: string,
    crmNotes: string,
    pipelineStage: string,
    manualEmailType?: string
  ): Promise<IntelligentEmailResult> {
    logger.info(`[EmailIntelligence] Generating intelligent email for ${importerName} (${importerId})`);

    // Step 1: Get or create buyer intelligence
    let buyerIntelligence: BuyerIntelligence;
    try {
      const existing = await prisma.$queryRawUnsafe<Array<{
        companyProfile: string; products: string; brands: string; roastingCapability: string;
        importingActivity: string; sustainabilityInfo: string; sourcingInfo: string;
        targetMarket: string; businessPersonality: string; companySize: string;
        estimatedBuyingVolume: string; possibleDecisionMaker: string;
        buyingInterestScore: number; riskScore: number; opportunityScore: number;
        rawAnalysis: string;
      }>>(
        `SELECT "companyProfile", "products", "brands", "roastingCapability", "importingActivity", "sustainabilityInfo", "sourcingInfo", "targetMarket", "businessPersonality", "companySize", "estimatedBuyingVolume", "possibleDecisionMaker", "buyingInterestScore", "riskScore", "opportunityScore", "rawAnalysis" FROM "BuyerIntelligence" WHERE "importerId" = $1`,
        [importerId]
      );

      if (existing && existing.length > 0) {
        buyerIntelligence = existing[0];
        logger.info(`[EmailIntelligence] Using cached intelligence for ${importerName}`);
      } else if (buyerWebsite && buyerWebsite.length > 5) {
        buyerIntelligence = await this.analyzeWebsite(importerId, buyerWebsite);
      } else {
        buyerIntelligence = this.getFallbackIntelligence(buyerWebsite || 'No website');
      }
    } catch {
      buyerIntelligence = buyerWebsite && buyerWebsite.length > 5
        ? await this.analyzeWebsite(importerId, buyerWebsite)
        : this.getFallbackIntelligence(buyerWebsite || 'No website');
    }

    // Step 2: Match products
    const productMatches = await this.matchProducts(importerId, buyerIntelligence);
    const bestProduct = productMatches.find(p => p.matchLevel === 'HIGH')
      || productMatches.find(p => p.matchLevel === 'MEDIUM')
      || productMatches[0];

    // Step 3: Analyze email history
    const emailHistory = await this.analyzeEmailHistory(importerId);

    // Step 4: Determine email type
    const emailType = manualEmailType || this.determineEmailTypeFromSequence(emailHistory);

    // Step 5: Determine strategy
    const strategy = await this.determineStrategy(emailHistory, buyerIntelligence, productMatches);

    // Step 6: Generate subject lines
    const subjects = await this.generateSubjectLines(
      importerName, buyerCountry, emailType, strategy,
      bestProduct?.productName || 'Premium Indonesian Coffee',
      buyerIntelligence
    );

    // Step 7: Recommend attachments
    const recommendedAttachments = await this.recommendAttachments(emailType, strategy, buyerIntelligence);

    // Step 8: Generate the email body using existing AiService
    const ragContext = emailHistory.conversationSummary.length > 50
      ? `EMAIL HISTORY: ${emailHistory.conversationSummary}\nBUYER INTENT: ${emailHistory.buyerIntent || 'Unknown'}\nBUYER QUESTIONS: ${emailHistory.buyerQuestions.join(', ')}\nBUYER CONCERNS: ${emailHistory.buyerConcerns.join(', ')}`
      : '';

    const marketContext = '';

    const draft = await AiService.generateEmailDraft(
      importerName,
      `Buyer Intelligence: ${buyerIntelligence.companyProfile.substring(0, 500)}\nTarget Market: ${buyerIntelligence.targetMarket}\nBusiness Type: ${buyerIntelligence.businessPersonality}`,
      'professional',
      ragContext,
      marketContext,
      {
        leadStatus: pipelineStage,
        timelineCount: emailHistory.totalEmails,
        coffeeInterest: bestProduct?.productName || 'Premium Indonesian Coffee',
        contactName,
        buyerName: importerName,
        buyerEmail,
        buyerWebsite,
        buyerContact: contactName,
        crmNotes,
        pipelineStage,
        selectedCoffeeProduct: bestProduct?.productName || 'Premium Indonesian Coffee',
        latestSampleStatus: emailHistory.samplesExist ? 'Delivered' : null,
        latestQuoteStatus: emailHistory.quotationsExist ? 'Sent' : null,
        daysSinceLastContact: emailHistory.lastContactDate
          ? Math.floor((Date.now() - new Date(emailHistory.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        buyerCountry,
        emailType,
      }
    );

    // Step 9: Determine next recommended action
    const nextAction = this.getNextRecommendedAction(emailType, strategy.strategy, emailHistory);

    // Step 10: Save to EmailMemory
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "EmailMemory" ("importerId", "emailType", "subject", "body", "attachments", "aiStrategy", "aiReason", "confidenceScore", "selectedEmailType", "sequenceStep", "nextRecommendedAction", "buyerIntelligenceSummary", "productMatchSummary", "metadata", "generatedAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      `, [
        importerId, emailType, draft.subject, draft.body,
        recommendedAttachments.map(a => a.name).join(', '),
        strategy.strategy, strategy.reason, strategy.confidenceScore,
        emailType, emailHistory.sequenceStep + 1, nextAction,
        buyerIntelligence.companyProfile.substring(0, 500),
        bestProduct ? `${bestProduct.productName} (${bestProduct.matchLevel})` : '',
        JSON.stringify({ buyerIntelligence, productMatches, emailHistory })
      ]);
    } catch (dbErr: any) {
      logger.warn(`[EmailIntelligence] Failed to save EmailMemory: ${dbErr.message}`);
    }

    return {
      subject: draft.subject,
      subjects: subjects.length > 0 ? subjects : draft.subjects,
      body: draft.body,
      emailType,
      strategy,
      aiReason: strategy.reason,
      confidenceScore: strategy.confidenceScore,
      recommendedAttachments,
      selectedProduct: bestProduct?.productName || 'Premium Indonesian Coffee',
      sequenceStep: emailHistory.sequenceStep + 1,
      nextRecommendedAction: nextAction,
    };
  }

  /**
   * Get the next recommended action based on current state
   */
  private static getNextRecommendedAction(
    emailType: string,
    strategy: string,
    history: EmailHistoryAnalysis
  ): string {
    const actions: Record<string, string> = {
      'FIRST_CONTACT': 'Wait for buyer response. If no reply in 5-7 days, send follow-up.',
      'FOLLOW_UP_1': 'Wait for buyer response. If no reply in 5-7 days, send final follow-up.',
      'FOLLOW_UP_2': 'Move to re-engagement sequence or archive lead.',
      'SAMPLE_OFFER': 'Prepare sample package and arrange courier pickup.',
      'SAMPLE_SENT': 'Track shipment. Follow up after delivery confirmation.',
      'SAMPLE_FEEDBACK': 'If positive, prepare quotation. If negative, ask for preferences.',
      'QUOTATION': 'Wait for buyer response. Prepare for negotiation.',
      'NEGOTIATION': 'Prepare revised terms. Set deadline for decision.',
      'PRICE_UPDATE': 'Give buyer 7 days to lock current pricing.',
      'SHIPMENT_READY': 'Confirm shipping instructions with buyer.',
      'SHIPMENT_SENT': 'Monitor shipment. Confirm arrival with buyer.',
      'CONTRACT_REMINDER': 'Schedule contract renewal discussion.',
      'LONG_TERM_PARTNERSHIP': 'Prepare annual volume commitment proposal.',
      'REENGAGEMENT': 'If no response, move to cold re-engagement in 30 days.',
    };
    return actions[emailType] || 'Monitor buyer response and adjust strategy accordingly.';
  }
}