import { prisma, logger } from '../index.js';
import { AiService } from './ai.service.js';

export interface TimelineEvent {
  id: string;
  importerId: string;
  eventType: string;
  source: string;
  title: string;
  description: string | null;
  metadata: any;
  score: number | null;
  confidence: number | null;
  eventDate: Date;
}

export interface BuyerProfile {
  industry: string;
  companyType: string;
  importerScore: number;
  coffeeMatchScore: number;
  specialtyPotential: string;
  originPreference: string;
  preferredProcessing: string;
  likelyBuyingVolume: string;
  decisionMakerConfidence: string;
  communicationStyle: string;
  estimatedPurchaseFrequency: string;
  riskLevel: string;
  opportunityLevel: string;
  relationshipScore: string;
  nextBestAction: string;
  nextActionReason: string;
  productRelevance: Array<{ product: string; match: string; reason: string }>;
}

interface ReplyClassification {
  classification: string;
  intent: string;
  questions: string[];
  concerns: string[];
  urgency: string;
  sentiment: string;
}

const EVENT_TYPES = [
  'Website Analysis', 'Company Research', 'LinkedIn Analysis',
  'Previous Email Sent', 'Buyer Reply', 'Follow Up',
  'Quotation Sent', 'Sample Offered', 'Sample Sent',
  'Sample Delivered', 'Sample Feedback', 'Negotiation',
  'Price Discussion', 'Harvest Update', 'Meeting',
  'Shipment', 'Contract', 'Relationship Update',
  'Internal Note', 'AI Insight'
];

const SOURCES = ['Website', 'Email', 'CRM', 'Manual', 'AI', 'LinkedIn', 'Google', 'Trade Directory'];

const RELATIONSHIP_SCORES = ['Cold', 'Warm', 'Hot', 'Negotiation', 'Ready to Buy', 'Long-term Client', 'Lost', 'Dormant'];

const NEXT_BEST_ACTIONS = [
  'Send First Contact', 'Send Follow Up #1', 'Wait 5 Days',
  'Offer Sample', 'Send Catalogue', 'Send Price List',
  'Send Quotation', 'Arrange Meeting', 'WhatsApp Follow-up',
  'Call Buyer', 'Send Harvest Update', 'Re-engage', 'Archive'
];

export class BuyerTimelineService {

  /** Add an event to the buyer's timeline */
  static async addEvent(
    importerId: string,
    eventType: string,
    title: string,
    description?: string,
    source: string = 'AI',
    metadata?: any,
    score?: number,
    confidence?: number
  ): Promise<TimelineEvent> {
    logger.info(`[BuyerTimeline] Adding event for ${importerId}: ${eventType} - ${title}`);

    try {
      const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO "BuyerTimeline" ("importerId", "eventType", "source", "title", "description", "metadata", "score", "confidence", "eventDate", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id`,
        [importerId, eventType, source, title, description || null, metadata ? JSON.stringify(metadata) : null, score || null, confidence || 50]
      );

      // Auto-update relationship score and next best action after significant events
      if (['Buyer Reply', 'Quotation Sent', 'Sample Sent', 'Meeting', 'Negotiation', 'Shipment', 'Contract'].includes(eventType)) {
        await this.recalculateBuyerProfile(importerId);
      }

      return {
        id: result[0].id,
        importerId,
        eventType,
        source,
        title,
        description: description || null,
        metadata: metadata || null,
        score: score || null,
        confidence: confidence || 50,
        eventDate: new Date()
      };
    } catch (error: any) {
      logger.error(`[BuyerTimeline] Failed to add event: ${error.message}`);
      throw error;
    }
  }

  /** Get full timeline for a buyer */
  static async getTimeline(importerId: string, limit: number = 50): Promise<TimelineEvent[]> {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<any>>(
        `SELECT id, "importerId", "eventType", "source", "title", description, metadata, score, confidence, "eventDate"
         FROM "BuyerTimeline"
         WHERE "importerId" = $1
         ORDER BY "eventDate" DESC
         LIMIT $2`,
        [importerId, limit]
      );
      return rows.map(r => ({
        ...r,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
      }));
    } catch (error: any) {
      logger.error(`[BuyerTimeline] Failed to get timeline: ${error.message}`);
      return [];
    }
  }

  /** Get or create AI buyer profile */
  static async getBuyerProfile(importerId: string): Promise<BuyerProfile | null> {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<any>>(
        `SELECT industry, "companyType", "importerScore", "coffeeMatchScore", "specialtyPotential",
                "originPreference", "preferredProcessing", "likelyBuyingVolume",
                "decisionMakerConfidence", "communicationStyle", "estimatedPurchaseFrequency",
                "riskLevel", "opportunityLevel", "relationshipScore", "nextBestAction",
                "nextActionReason", "productRelevance", "rawAnalysis"
         FROM "BuyerAiAnalysis"
         WHERE "importerId" = $1`,
        [importerId]
      );
      if (!rows || rows.length === 0) return null;

      const r = rows[0];
      return {
        industry: r.industry || 'Unknown',
        companyType: r.companyType || 'Unknown',
        importerScore: r.importerScore || 50,
        coffeeMatchScore: r.coffeeMatchScore || 50,
        specialtyPotential: r.specialtyPotential || 'Unknown',
        originPreference: r.originPreference || 'Unknown',
        preferredProcessing: r.preferredProcessing || 'Unknown',
        likelyBuyingVolume: r.likelyBuyingVolume || 'Unknown',
        decisionMakerConfidence: r.decisionMakerConfidence || 'Unknown',
        communicationStyle: r.communicationStyle || 'Unknown',
        estimatedPurchaseFrequency: r.estimatedPurchaseFrequency || 'Unknown',
        riskLevel: r.riskLevel || 'Medium',
        opportunityLevel: r.opportunityLevel || 'Medium',
        relationshipScore: r.relationshipScore || 'Cold',
        nextBestAction: r.nextBestAction || 'Send First Contact',
        nextActionReason: r.nextActionReason || 'New buyer identified.',
        productRelevance: typeof r.productRelevance === 'string' ? JSON.parse(r.productRelevance) : (r.productRelevance || []),
      };
    } catch {
      return null;
    }
  }

  /** Analyze buyer website with deep structure */
  static async analyzeWebsiteDeep(importerId: string, websiteUrl: string): Promise<any> {
    logger.info(`[BuyerTimeline] Deep website analysis for ${importerId}: ${websiteUrl}`);

    let websiteContent = '';
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(20000)
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
        .substring(0, 10000);
    } catch (fetchErr: any) {
      logger.warn(`[BuyerTimeline] Failed to fetch: ${fetchErr.message}`);
      websiteContent = `Cannot fetch website: ${fetchErr.message}`;
    }

    const prompt = `You are a B2B buyer intelligence analyst for Nandara Nusa Montierra, an Indonesian specialty coffee exporter.

Analyze this company's website and produce a structured analysis.

WEBSITE: ${websiteUrl}

CONTENT:
${websiteContent.substring(0, 8000)}

Return in EXACTLY this JSON format. Use "Unknown" or "Not Available" if information is not found. NEVER fabricate data.

{
  "businessModel": "What business model (B2B, B2C, wholesale, etc.)",
  "products": "Products they sell or use",
  "coffeeTypes": "Types of coffee they handle (green beans, roasted, specialty, commercial)",
  "roastingCapability": "Do they roast? What scale? Equipment?",
  "importActivity": "Do they import directly? From which origins?",
  "wholesale": "Do they operate wholesale?",
  "retail": "Do they have retail operations?",
  "cafe": "Do they run cafes?",
  "distributor": "Are they a distributor?",
  "manufacturer": "Do they manufacture products?",
  "companySize": "Estimated company size (small, medium, large, enterprise)",
  "targetMarket": "Who are their customers?",
  "country": "Country of operation",
  "buyingPotential": "Estimated buying potential (Low, Medium, High, Very High)",
  "importsGreenCoffee": true or false,
  "certifications": "Any certifications (Organic, Fair Trade, Rainforest, etc.)",
  "brands": "Brands they own or represent"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You analyze company websites for B2B coffee export intelligence. Respond in pure JSON. Never fabricate data.'
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // Save to cache
      await prisma.$executeRawUnsafe(`
        INSERT INTO "WebsiteAnalysisCache" ("importerId", "websiteUrl", "businessModel", "products", "coffeeTypes", "roastingCapability", "importActivity", "wholesale", "retail", "cafe", "distributor", "manufacturer", "companySize", "targetMarket", "country", "buyingPotential", "importsGreenCoffee", "certifications", "brands", "rawHtml", "analyzedAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
        ON CONFLICT ("importerId") DO UPDATE SET
          "websiteUrl" = EXCLUDED."websiteUrl",
          "businessModel" = EXCLUDED."businessModel",
          "products" = EXCLUDED."products",
          "coffeeTypes" = EXCLUDED."coffeeTypes",
          "roastingCapability" = EXCLUDED."roastingCapability",
          "importActivity" = EXCLUDED."importActivity",
          "wholesale" = EXCLUDED."wholesale",
          "retail" = EXCLUDED."retail",
          "cafe" = EXCLUDED."cafe",
          "distributor" = EXCLUDED."distributor",
          "manufacturer" = EXCLUDED."manufacturer",
          "companySize" = EXCLUDED."companySize",
          "targetMarket" = EXCLUDED."targetMarket",
          "country" = EXCLUDED."country",
          "buyingPotential" = EXCLUDED."buyingPotential",
          "importsGreenCoffee" = EXCLUDED."importsGreenCoffee",
          "certifications" = EXCLUDED."certifications",
          "brands" = EXCLUDED."brands",
          "analyzedAt" = NOW(),
          "updatedAt" = NOW()
      `, [
        importerId, websiteUrl, parsed.businessModel || null, parsed.products || null,
        parsed.coffeeTypes || null, parsed.roastingCapability || null, parsed.importActivity || null,
        parsed.wholesale || null, parsed.retail || null, parsed.cafe || null,
        parsed.distributor || null, parsed.manufacturer || null, parsed.companySize || null,
        parsed.targetMarket || null, parsed.country || null, parsed.buyingPotential || null,
        parsed.importsGreenCoffee === true, parsed.certifications || null, parsed.brands || null,
        websiteContent.substring(0, 5000)
      ]);

      // Add timeline event
      await this.addEvent(importerId, 'Website Analysis', `Website analyzed: ${websiteUrl}`,
        `Business model: ${parsed.businessModel || 'Unknown'}. Imports green coffee: ${parsed.importsGreenCoffee ? 'Yes' : 'No/Unknown'}`,
        'AI', parsed, parsed.importsGreenCoffee ? 80 : 50, 75
      );

      // Now generate full buyer profile with this data
      await this.generateBuyerProfile(importerId, parsed);

      return parsed;
    } catch (error: any) {
      logger.error(`[BuyerTimeline] Website deep analysis failed: ${error.message}`);
      return {
        businessModel: 'Unknown', products: 'Unknown', companySize: 'Unknown',
        targetMarket: 'Unknown', country: 'Unknown', buyingPotential: 'Medium',
        importsGreenCoffee: false, error: error.message
      };
    }
  }

  /** Generate full AI buyer profile including product relevance */
  static async generateBuyerProfile(importerId: string, websiteData?: any): Promise<BuyerProfile> {
    logger.info(`[BuyerTimeline] Generating buyer profile for ${importerId}`);

    // Get importer data
    const importer = await prisma.importer.findUnique({ where: { id: importerId } });
    if (!importer) throw new Error('Importer not found');

    const prompt = `You are a senior coffee export intelligence analyst. Based on the following buyer information, generate a complete AI buyer profile.

BUYER COMPANY: ${importer.companyName}
COUNTRY: ${importer.country || 'Unknown'}
WEBSITE: ${importer.website || 'Unknown'}
BUSINESS TYPE: ${importer.businessType || 'Unknown'}
CRM STATUS: ${importer.status || 'NEW'}
CRM NOTES: ${importer.notes || 'None'}
${websiteData ? `WEBSITE ANALYSIS: ${JSON.stringify(websiteData)}` : ''}

You must analyze product relevance against ALL Nandara products:
- Aceh Gayo Grade 1 (Classic) — Washed, bright acidity, medium body
- Sumatra Lintong G1 (Classic) — Washed, low acidity, full body
- Sumatra Mandheling (Classic) — Wet-hulled, low acidity, very full body
- Gayo Wild Natural (Modern Process) — Natural processed, fruity
- Java Preanger Reserve (Modern Process) — Washed, clean, complex
- Bali Kintamani (Modern Process) — Washed, bright, citrus
- Flores Volcanic (Modern Process) — Washed, earthy, sweet
- Toraja Reserve (Modern Process) — Washed, spicy, full body
- Gayo LB Reserve (Rare Microlot) — Longberry, rare, premium
- Lampung Reserve (Fine Robusta) — Fine Robusta, bold, high caffeine
- Temanggung Fine Robusta (Fine Robusta) — Fine Robusta, smooth, low acid

Return EXACTLY this JSON format. Use "Unknown" or "Not Available" when unsure. NEVER fabricate.

{
  "industry": "Coffee / Beverage / Food / Other",
  "companyType": "Importer / Roaster / Distributor / Cafe Chain / Retail / Wholesale / Manufacturer",
  "importerScore": 0-100,
  "coffeeMatchScore": 0-100,
  "specialtyPotential": "Low / Medium / High / Very High",
  "originPreference": "Likely origin preferences based on their business",
  "preferredProcessing": "Washed / Natural / Honey / Wet-Hulled / Mixed",
  "likelyBuyingVolume": "Estimated annual volume in metric tons",
  "decisionMakerConfidence": "Low / Medium / High / Very High",
  "communicationStyle": "Formal / Professional / Direct / Relationship-focused",
  "estimatedPurchaseFrequency": "Monthly / Quarterly / Biannual / Annual / Unknown",
  "riskLevel": "Low / Medium / High",
  "opportunityLevel": "Low / Medium / High / Very High",
  "relationshipScore": "Cold / Warm / Hot / Negotiation / Ready to Buy / Long-term Client / Lost / Dormant",
  "nextBestAction": "Send First Contact / Send Follow Up / Offer Sample / Send Catalogue / Send Price List / Send Quotation / Arrange Meeting / WhatsApp Follow-up / Call Buyer / Send Harvest Update / Re-engage / Archive",
  "nextActionReason": "Brief explanation of why this action is recommended",
  "productRelevance": [
    {"product": "Aceh Gayo Grade 1 (Classic)", "match": "Excellent / Good / Medium / Low", "reason": "Brief justification..."},
    {"product": "Sumatra Lintong G1 (Classic)", "match": "Excellent / Good / Medium / Low", "reason": "Brief justification..."}
  ]
}

Include ALL 11 products in productRelevance array.`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You generate comprehensive B2B buyer profiles for coffee export intelligence. Always respond in pure JSON. Never fabricate data. Use "Unknown" or "Not Available" for unsure information.'
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const profile: BuyerProfile = {
        industry: parsed.industry || 'Unknown',
        companyType: parsed.companyType || 'Unknown',
        importerScore: Math.min(100, Math.max(0, parsed.importerScore || 50)),
        coffeeMatchScore: Math.min(100, Math.max(0, parsed.coffeeMatchScore || 50)),
        specialtyPotential: parsed.specialtyPotential || 'Unknown',
        originPreference: parsed.originPreference || 'Unknown',
        preferredProcessing: parsed.preferredProcessing || 'Unknown',
        likelyBuyingVolume: parsed.likelyBuyingVolume || 'Unknown',
        decisionMakerConfidence: parsed.decisionMakerConfidence || 'Unknown',
        communicationStyle: parsed.communicationStyle || 'Unknown',
        estimatedPurchaseFrequency: parsed.estimatedPurchaseFrequency || 'Unknown',
        riskLevel: parsed.riskLevel || 'Medium',
        opportunityLevel: parsed.opportunityLevel || 'Medium',
        relationshipScore: parsed.relationshipScore || 'Cold',
        nextBestAction: parsed.nextBestAction || 'Send First Contact',
        nextActionReason: parsed.nextActionReason || 'Initial analysis completed.',
        productRelevance: Array.isArray(parsed.productRelevance) ? parsed.productRelevance : [],
      };

      // Save to DB
      await prisma.$executeRawUnsafe(`
        INSERT INTO "BuyerAiAnalysis" ("importerId", "industry", "companyType", "importerScore", "coffeeMatchScore", "specialtyPotential", "originPreference", "preferredProcessing", "likelyBuyingVolume", "decisionMakerConfidence", "communicationStyle", "estimatedPurchaseFrequency", "riskLevel", "opportunityLevel", "relationshipScore", "nextBestAction", "nextActionReason", "productRelevance", "analyzedAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        ON CONFLICT ("importerId") DO UPDATE SET
          "industry" = EXCLUDED."industry",
          "companyType" = EXCLUDED."companyType",
          "importerScore" = EXCLUDED."importerScore",
          "coffeeMatchScore" = EXCLUDED."coffeeMatchScore",
          "specialtyPotential" = EXCLUDED."specialtyPotential",
          "originPreference" = EXCLUDED."originPreference",
          "preferredProcessing" = EXCLUDED."preferredProcessing",
          "likelyBuyingVolume" = EXCLUDED."likelyBuyingVolume",
          "decisionMakerConfidence" = EXCLUDED."decisionMakerConfidence",
          "communicationStyle" = EXCLUDED."communicationStyle",
          "estimatedPurchaseFrequency" = EXCLUDED."estimatedPurchaseFrequency",
          "riskLevel" = EXCLUDED."riskLevel",
          "opportunityLevel" = EXCLUDED."opportunityLevel",
          "relationshipScore" = EXCLUDED."relationshipScore",
          "nextBestAction" = EXCLUDED."nextBestAction",
          "nextActionReason" = EXCLUDED."nextActionReason",
          "productRelevance" = EXCLUDED."productRelevance",
          "analyzedAt" = NOW(),
          "updatedAt" = NOW()
      `, [
        importerId, profile.industry, profile.companyType, profile.importerScore,
        profile.coffeeMatchScore, profile.specialtyPotential, profile.originPreference,
        profile.preferredProcessing, profile.likelyBuyingVolume,
        profile.decisionMakerConfidence, profile.communicationStyle,
        profile.estimatedPurchaseFrequency, profile.riskLevel, profile.opportunityLevel,
        profile.relationshipScore, profile.nextBestAction, profile.nextActionReason,
        JSON.stringify(profile.productRelevance)
      ]);

      // Add timeline event
      await this.addEvent(importerId, 'AI Insight', 'AI Buyer Profile Generated',
        `Score: ${profile.importerScore}/100 | Coffee Match: ${profile.coffeeMatchScore}/100 | Relationship: ${profile.relationshipScore}`,
        'AI', profile, profile.importerScore, 80
      );

      return profile;
    } catch (error: any) {
      logger.error(`[BuyerTimeline] Profile generation failed: ${error.message}`);
      return {
        industry: 'Unknown', companyType: 'Unknown', importerScore: 50, coffeeMatchScore: 50,
        specialtyPotential: 'Unknown', originPreference: 'Unknown', preferredProcessing: 'Unknown',
        likelyBuyingVolume: 'Unknown', decisionMakerConfidence: 'Unknown', communicationStyle: 'Unknown',
        estimatedPurchaseFrequency: 'Unknown', riskLevel: 'Medium', opportunityLevel: 'Medium',
        relationshipScore: 'Cold', nextBestAction: 'Send First Contact', nextActionReason: 'Unable to analyze.',
        productRelevance: []
      };
    }
  }

  /** Classify a buyer's reply */
  static async classifyReply(importerId: string, emailId: string, subject: string, body: string): Promise<ReplyClassification> {
    const prompt = `Classify this buyer's email reply for a coffee export company.

SUBJECT: ${subject}
BODY: ${body.substring(0, 2000)}

Return in JSON format:
{
  "classification": "One of: Interested / Not Interested / Needs Sample / Waiting Budget / Waiting Management / Price Too High / Need Certificate / Need MOQ / Need Shipping Info / Need Payment Terms / Need Incoterm / Need Product Spec / No Response",
  "intent": "What does the buyer want?",
  "questions": ["Question 1", "Question 2"],
  "concerns": ["Concern 1", "Concern 2"],
  "urgency": "Low / Normal / High / Urgent",
  "sentiment": "Negative / Neutral / Positive / Very Positive"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You classify B2B buyer email replies for coffee export sales. Respond in pure JSON.'
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        classification: 'Unknown', intent: 'Unknown', questions: [], concerns: [],
        urgency: 'Normal', sentiment: 'Neutral'
      };

      const classification: ReplyClassification = {
        classification: parsed.classification || 'Unknown',
        intent: parsed.intent || 'Unknown',
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        urgency: parsed.urgency || 'Normal',
        sentiment: parsed.sentiment || 'Neutral',
      };

      // Save to DB
      await prisma.$executeRawUnsafe(`
        INSERT INTO "BuyerReplyAnalysis" ("importerId", "emailId", "subject", "body", "classification", "intent", "questions", "concerns", "urgency", "sentiment", "analyzedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        importerId, emailId, subject, body.substring(0, 3000),
        classification.classification, classification.intent,
        classification.questions.join(' | '), classification.concerns.join(' | '),
        classification.urgency, classification.sentiment
      ]);

      // Add timeline event
      const title = `Buyer Reply: ${classification.classification}`;
      const description = `Intent: ${classification.intent} | Urgency: ${classification.urgency}`;
      const scoreMap: Record<string, number> = {
        'Interested': 80, 'Needs Sample': 70, 'Need Product Spec': 65,
        'Need Shipping Info': 60, 'Need Payment Terms': 60, 'Need Incoterm': 60,
        'Need MOQ': 55, 'Need Certificate': 55, 'Waiting Budget': 45,
        'Waiting Management': 45, 'Price Too High': 30, 'Not Interested': 10,
        'No Response': 0
      };

      await this.addEvent(importerId, 'Buyer Reply', title, description, 'Email',
        classification, scoreMap[classification.classification] || 50, 80
      );

      // Recalculate profile
      await this.recalculateBuyerProfile(importerId);

      return classification;
    } catch (error: any) {
      logger.error(`[BuyerTimeline] Reply classification failed: ${error.message}`);
      return { classification: 'Unknown', intent: 'Unknown', questions: [], concerns: [], urgency: 'Normal', sentiment: 'Neutral' };
    }
  }

  /** Recalculate buyer profile based on all events */
  static async recalculateBuyerProfile(importerId: string): Promise<void> {
    try {
      // Count events by type
      const events = await prisma.$queryRawUnsafe<Array<{ eventType: string; count: number }>>(
        `SELECT "eventType", COUNT(*) as count FROM "BuyerTimeline" WHERE "importerId" = $1 GROUP BY "eventType"`,
        [importerId]
      );

      const eventMap: Record<string, number> = {};
      events.forEach(e => { eventMap[e.eventType] = Number(e.count); });

      // Determine relationship score based on events
      let relationshipScore = 'Cold';
      if (eventMap['Contract']) relationshipScore = 'Long-term Client';
      else if (eventMap['Shipment']) relationshipScore = 'Ready to Buy';
      else if (eventMap['Negotiation']) relationshipScore = 'Negotiation';
      else if (eventMap['Meeting']) relationshipScore = 'Hot';
      else if (eventMap['Sample Sent'] || eventMap['Quotation Sent']) relationshipScore = 'Warm';
      else if (eventMap['Previous Email Sent'] && eventMap['Previous Email Sent'] >= 3) relationshipScore = 'Warm';
      else if (eventMap['Buyer Reply']) relationshipScore = 'Warm';
      else if (eventMap['Website Analysis']) relationshipScore = 'Cold';

      // Update the profile
      const existingProfile = await this.getBuyerProfile(importerId);
      if (existingProfile) {
        await prisma.$executeRawUnsafe(`
          UPDATE "BuyerAiAnalysis"
          SET "relationshipScore" = $1, "updatedAt" = NOW()
          WHERE "importerId" = $2
        `, [relationshipScore, importerId]);
      }

      await this.addEvent(importerId, 'AI Insight', 'Relationship Score Updated',
        `Current stage: ${relationshipScore}`, 'AI', { relationshipScore }, 50, 80
      );

    } catch (error: any) {
      logger.error(`[BuyerTimeline] Recalculate failed: ${error.message}`);
    }
  }

  /** Auto-generate timeline from existing data */
  static async syncFromExistingData(importerId: string): Promise<number> {
    let eventCount = 0;

    try {
      // Sync emails
      const emails = await prisma.email.findMany({ where: { importerId }, orderBy: { createdAt: 'asc' } });
      for (const email of emails) {
        const eventType = email.direction === 'INBOUND' ? 'Buyer Reply' : 'Previous Email Sent';
        const source = email.direction === 'INBOUND' ? 'Email' : 'CRM';
        await this.addEvent(importerId, eventType, email.subject.substring(0, 100),
          `Status: ${email.status} | ${email.body?.substring(0, 100) || ''}`,
          source, { emailId: email.id, messageId: email.messageId }, 50, 80
        );
        eventCount++;
      }

      // Sync quotations
      const quotations = await prisma.quotation.findMany({ where: { importerId } });
      for (const q of quotations) {
        const eventType = q.status === 'ACCEPTED' ? 'Contract' : 'Quotation Sent';
        await this.addEvent(importerId, eventType, `${q.product} - $${q.price}/ton`,
          `Quantity: ${q.quantity} | Terms: ${q.incoterm} | Status: ${q.status}`,
          'CRM', { quotationId: q.id, number: q.quotationNumber }, 70, 85
        );
        eventCount++;
      }

      // Sync samples
      const samples = await prisma.sample.findMany({ where: { importerId } });
      for (const s of samples) {
        const eventTypeMap: Record<string, string> = {
          'REQUESTED': 'Sample Offered', 'SHIPPED': 'Sample Sent',
          'DELIVERED': 'Sample Delivered', 'FEEDBACK_RECEIVED': 'Sample Feedback'
        };
        const eventType = eventTypeMap[s.status] || 'Sample Offered';
        await this.addEvent(importerId, eventType, `${s.product} ${s.weight}`,
          `Courier: ${s.courier || 'N/A'} | Tracking: ${s.trackingNumber || 'N/A'}`,
          'CRM', { sampleId: s.id }, 70, 85
        );
        eventCount++;
      }

      // Add AI Insight
      await this.addEvent(importerId, 'AI Insight', `Historical data synced: ${eventCount} events`,
        `Emails: ${emails.length} | Quotes: ${quotations.length} | Samples: ${samples.length}`,
        'AI', { syncedAt: new Date().toISOString() }, 50, 100
      );

      // Recalculate profile
      await this.recalculateBuyerProfile(importerId);

    } catch (error: any) {
      logger.error(`[BuyerTimeline] Sync failed: ${error.message}`);
    }

    return eventCount;
  }
}