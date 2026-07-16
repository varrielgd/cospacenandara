import { prisma, logger } from '../index.js';
import { AiService } from './ai.service.js';
import { BuyerTimelineService } from './buyer-timeline.service.js';
import { EmailIntelligenceService } from './email-intelligence.service.js';

export interface CompanyClassification {
  companyName: string;
  tradingName?: string;
  country: string;
  city: string;
  address?: string;
  website: string;
  businessType: string;
  founded?: string;
  employeeEstimate?: string;
  businessScale?: string;
  confidenceScore: number;
  isCoffeeBusiness: boolean;
  warning?: string;
  coffeeCategories?: string[];
  services?: string[];
  industries?: string[];
  targetCustomers?: string[];
}

export interface ContactInfo {
  companyEmail: string | null;
  procurementEmail: string | null;
  salesEmail: string | null;
  coffeeBuyingEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  contactPerson: string | null;
  jobTitle: string | null;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PersonContact {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  phone?: string;
  linkedin?: string;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CoffeePortfolio {
  origins: string[];
  products: string[];
  processingMethods: string[];
  certifications: string[];
  roastingStyle: string;
  currentSuppliers: string[];
  privateLabels: string[];
  buyingInterests: string[];
  packagingTypes: string[];
  estimatedAnnualVolume: string;
  specialtyFocus: string;
}

export interface ProductMatchDetail {
  productName: string;
  matchScore: number;
  reason: string;
  gapAnalysis: string;
}

export interface BuyerScores {
  opportunityScore: number;
  relationshipDifficulty: number;
  buyingPotential: number;
  estimatedVolume: string;
  premiumPotential: number;
  specialtyCoffeeInterest: number;
  decisionComplexity: number;
  priceSensitivity: number;
  responseProbability: number;
  riskLevel: string;
}

export interface BuyerInsight {
  businessSummary: string;
  businessModel: string;
  currentCoffeeStrategy: string;
  possiblePainPoints: string[];
  potentialOpportunities: string[];
  recommendedSalesAngle: string;
  recommendedCommunicationStyle: string;
}

export interface AutoDiscoverResult {
  classification: CompanyClassification;
  contacts: ContactInfo;
  portfolio: CoffeePortfolio;
  productMatches: ProductMatchDetail[];
  bestProducts: string[];
  gapAnalysis: string;
  scores: BuyerScores;
  insight: BuyerInsight;
  importerId?: string;
  isNewBuyer: boolean;
  timeline: string[];
  outreachStrategy: {
    emailType: string;
    reason: string;
  };
  emailDraft: {
    subject: string;
    body: string;
  };
  recommendedAttachments: string[];
}

const NANDARA_PRODUCTS_DATA = [
  { name: 'Aceh Gayo Grade 1 (Classic)', process: 'Washed', body: 'Medium', acidity: 'Bright', notes: 'Citrus, floral, chocolate' },
  { name: 'Sumatra Lintong G1 (Classic)', process: 'Washed', body: 'Full', acidity: 'Low', notes: 'Earthy, spicy, herbal' },
  { name: 'Sumatra Mandheling (Classic)', process: 'Wet-Hulled', body: 'Very Full', acidity: 'Low', notes: 'Chocolate, tobacco, cedar' },
  { name: 'Gayo Wild Natural (Modern Process)', process: 'Natural', body: 'Full', acidity: 'Medium', notes: 'Berry, wine, tropical fruit' },
  { name: 'Java Preanger Reserve (Modern Process)', process: 'Washed', body: 'Medium', acidity: 'Clean', notes: 'Complex, jasmine, stone fruit' },
  { name: 'Bali Kintamani (Modern Process)', process: 'Washed', body: 'Medium', acidity: 'Bright', notes: 'Citrus, mandarin, herbs' },
  { name: 'Flores Volcanic (Modern Process)', process: 'Washed', body: 'Medium', acidity: 'Sweet', notes: 'Earthy, sweet, dark chocolate' },
  { name: 'Toraja Reserve (Modern Process)', process: 'Washed', body: 'Full', acidity: 'Spicy', notes: 'Spicy, full body, complex' },
  { name: 'Gayo LB Reserve (Rare Microlot)', process: 'Washed', body: 'Elegant', acidity: 'Bright', notes: 'Longberry, rare, premium' },
  { name: 'Lampung Reserve (Fine Robusta)', process: 'Washed', body: 'Bold', acidity: 'Low', notes: 'Bold, high caffeine, earthy' },
  { name: 'Temanggung Fine Robusta (Fine Robusta)', process: 'Washed', body: 'Smooth', acidity: 'Low', notes: 'Smooth, low acid, nutty' },
];

export class AutoDiscoverService {

  /**
   * Main pipeline: Full auto-discover workflow
   */
  static async executeAutoDiscover(websiteUrl: string, userId: string): Promise<AutoDiscoverResult> {
    logger.info(`[AutoDiscover] Starting auto-discover for ${websiteUrl}`);

    const timeline: string[] = [];

    // Step 1: Crawl website
    timeline.push('Crawling website...');
    const websiteContent = await this.crawlWebsite(websiteUrl);
    timeline.push('Website crawled successfully');

    // Step 2: Classify company
    timeline.push('Analyzing company...');
    const classification = await this.classifyCompany(websiteUrl, websiteContent);
    timeline.push(`Company classified: ${classification.companyName} (${classification.businessType})`);

    // Step 3: Extract multiple contacts with full details
    timeline.push('Extracting contacts...');
    const allContacts = await this.extractAllContacts(websiteUrl, websiteContent);
    timeline.push(`Contacts extracted: ${allContacts.length} contacts found`);
    
    // Determine primary contact info for email generation
    const primaryContact = this.selectPrimaryContact(allContacts);
    const contacts: ContactInfo = {
      companyEmail: primaryContact.email,
      procurementEmail: primaryContact.department === 'Procurement' ? primaryContact.email : 
                        allContacts.find(c => c.department === 'Procurement')?.email || null,
      salesEmail: primaryContact.department === 'Sales' ? primaryContact.email : 
                  allContacts.find(c => c.department === 'Sales')?.email || null,
      coffeeBuyingEmail: primaryContact.department === 'Green Coffee Buying' ? primaryContact.email : 
                         allContacts.find(c => c.department === 'Green Coffee Buying')?.email || null,
      phone: primaryContact.phone || null,
      whatsapp: primaryContact.phone || null,
      linkedin: primaryContact.linkedin || null,
      contactPerson: primaryContact.name,
      jobTitle: primaryContact.jobTitle,
      priority: primaryContact.priority,
    };

    // Step 4: Analyze coffee portfolio
    timeline.push('Analyzing coffee portfolio...');
    const portfolio = await this.analyzeCoffeePortfolio(websiteUrl, websiteContent);
    timeline.push(`Portfolio analyzed: ${portfolio.origins.length} origins detected`);

    // Step 5: Match Nandara products
    timeline.push('Matching Nandara products...');
    const { matches, gapAnalysis } = await this.matchProducts(classification, portfolio);
    const bestProducts = matches.filter(m => m.matchScore >= 60).map(m => m.productName);
    timeline.push(`Product matching complete: ${bestProducts.length} strong matches`);

    // Step 6: Generate buyer scores
    timeline.push('Calculating buyer scores...');
    const scores = await this.generateScores(classification, portfolio);
    timeline.push(`Scores generated - Opportunity: ${scores.opportunityScore}/100`);

    // Step 7: Generate buyer insight
    timeline.push('Generating buyer insight...');
    const insight = await this.generateInsight(classification, portfolio, scores, websiteUrl, websiteContent);
    timeline.push('Buyer insight report ready');

    // Step 8: Auto-create CRM buyer if valid
    let importerId: string | undefined;
    let isNewBuyer = false;

    if (classification.isCoffeeBusiness && classification.confidenceScore >= 70) {
      timeline.push('Creating CRM buyer record...');
      const result = await this.createOrUpdateBuyer(classification, contacts, portfolio, scores, websiteUrl, insight);
      importerId = result.importerId;
      isNewBuyer = result.isNew;
      timeline.push(isNewBuyer ? 'New buyer created in CRM' : 'Existing buyer updated in CRM');
    } else {
      timeline.push('Buyer not auto-created - confidence below threshold or not a coffee business');
    }

    // Step 9: Determine outreach strategy
    timeline.push('Determining outreach strategy...');
    const outreachStrategy = await this.determineStrategy(classification, portfolio, scores);
    timeline.push(`Strategy: ${outreachStrategy.emailType}`);

    // Step 10: Generate email draft
    timeline.push('Generating personalized email...');
    let emailDraft = { subject: '', body: '' };
    let recommendedAttachments: string[] = [];
    if (importerId) {
      const emailResult = await EmailIntelligenceService.generateIntelligentEmail(
        importerId,
        classification.companyName,
        classification.country,
        contacts.procurementEmail || contacts.companyEmail || '',
        websiteUrl,
        contacts.contactPerson || 'Procurement Team',
        insight.businessSummary,
        'New Lead',
        outreachStrategy.emailType
      );
      emailDraft = {
        subject: emailResult.subject,
        body: emailResult.body,
      };
      recommendedAttachments = emailResult.recommendedAttachments.map(a => a.name);
    }
    timeline.push('Email draft generated');

    // Step 11: Save timeline events
    if (importerId) {
      for (const event of timeline) {
        await BuyerTimelineService.addEvent(importerId, 'AI Insight', event, '', 'AI', {}, 70, 80);
      }
    }

    logger.info(`[AutoDiscover] Complete for ${websiteUrl}. ${timeline.length} steps executed.`);

    return {
      classification,
      contacts,
      portfolio,
      productMatches: matches,
      bestProducts,
      gapAnalysis,
      scores,
      insight,
      importerId,
      isNewBuyer,
      timeline,
      outreachStrategy,
      emailDraft,
      recommendedAttachments,
    };
  }

  /**
   * Crawl website content from multiple pages - Enhanced for Business Intelligence
   * Follows internal links and extracts comprehensive data
   */
  private static async crawlWebsite(websiteUrl: string): Promise<string> {
    const baseUrl = new URL(websiteUrl).origin;
    const visited = new Set<string>();
    const pagesToCrawl = [
      '', '/about', '/company', '/products', '/coffee', '/contact', '/team', '/sustainability',
      '/blog', '/careers', '/news', '/certificates', '/quality', '/services', '/locations',
      '/partners', '/origins', '/our-story', '/about-us', '/our-team', '/history',
      '/management', '/offices', '/privacy', '/terms', '/footer'
    ];
    let allContent = '';

    const normalizedUrl = websiteUrl.replace(/\/+$/, '');

    for (const page of pagesToCrawl) {
      try {
        const url = `${normalizedUrl}${page}`;
        if (visited.has(url)) continue;
        visited.add(url);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(10000),
        });
        const html = await response.text();
        
        // Extract internal links for further crawling
        const linkMatches = html.match(/href=["']([^"']+)["']/g) || [];
        const internalLinks = linkMatches
          .map(match => match.replace(/href=["']([^"']+)["']/, '$1'))
          .filter(link => link && !link.startsWith('http') && !link.startsWith('#') && !link.startsWith('mailto:') && !link.startsWith('tel:'))
          .map(link => {
            try {
              const fullUrl = new URL(link, baseUrl).href;
              return fullUrl;
            } catch {
              return null;
            }
          })
          .filter((url): url is string => url !== null && url.startsWith(baseUrl) && !visited.has(url));

        // Add discovered internal links to crawl queue (max 50 pages total)
        if (internalLinks.length > 0 && visited.size < 50) {
          pagesToCrawl.push(...internalLinks.slice(0, 10));
        }

        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        allContent += `\n--- PAGE: ${url} ---\n${text.substring(0, 4000)}`;
      } catch {
        // Skip pages that fail to load
      }
    }

    return allContent.substring(0, 50000);
  }

  /**
   * Classify company from website content - Enhanced Business Intelligence
   */
  private static async classifyCompany(websiteUrl: string, websiteContent: string): Promise<CompanyClassification> {
    const prompt = `Analyze this company website and extract comprehensive business intelligence.

WEBSITE: ${websiteUrl}

CONTENT:
${websiteContent.substring(0, 15000)}

Return EXACTLY this JSON. Use "Unknown" or null when not found. NEVER fabricate.

{
  "companyName": "Full company name",
  "tradingName": "Trading name or brand name if different",
  "country": "Country of operation",
  "city": "City of operation",
  "address": "Full address if available",
  "website": "${websiteUrl}",
  "businessType": "One of: Coffee Importer / Coffee Trader / Coffee Roaster / Coffee Chain / Coffee Manufacturer / Coffee Broker / Coffee Retailer / Private Label / Exporter / Other",
  "founded": "Year founded if mentioned",
  "employeeEstimate": "Small/Medium/Large/Enterprise",
  "businessScale": "Local/Regional/National/International",
  "confidenceScore": 0-100,
  "isCoffeeBusiness": true or false,
  "warning": "If confidence < 70%, explain why uncertain",
  "coffeeCategories": ["Green Coffee", "Roasted Coffee", "Instant Coffee", "Coffee Pods", "Specialty Coffee", "Commercial Coffee"],
  "services": ["Import/Export", "Roasting", "Distribution", "Retail", "Wholesale", "Private Label", "Consulting"],
  "industries": ["B2B", "B2C", "Food Service", "Hospitality", "Retail", "Online"],
  "targetCustomers": ["Roasters", "Retailers", "Cafes", "Distributors", "Consumers", "Manufacturers"]
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You classify companies based on website analysis for B2B coffee export intelligence. Be honest about uncertainty.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        companyName: parsed.companyName || 'Unknown',
        tradingName: parsed.tradingName || undefined,
        country: parsed.country || 'Unknown',
        city: parsed.city || 'Unknown',
        address: parsed.address || undefined,
        website: websiteUrl,
        businessType: parsed.businessType || 'Unknown',
        founded: parsed.founded || undefined,
        employeeEstimate: parsed.employeeEstimate || undefined,
        businessScale: parsed.businessScale || undefined,
        confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 50)),
        isCoffeeBusiness: parsed.isCoffeeBusiness === true,
        warning: parsed.confidenceScore < 70 ? (parsed.warning || 'Low confidence in classification. Manual verification recommended.') : undefined,
        coffeeCategories: Array.isArray(parsed.coffeeCategories) ? parsed.coffeeCategories : undefined,
        services: Array.isArray(parsed.services) ? parsed.services : undefined,
        industries: Array.isArray(parsed.industries) ? parsed.industries : undefined,
        targetCustomers: Array.isArray(parsed.targetCustomers) ? parsed.targetCustomers : undefined,
      };
    } catch (error: any) {
      logger.error(`[AutoDiscover] Classification failed: ${error.message}`);
      return {
        companyName: 'Unknown', country: 'Unknown', city: 'Unknown',
        website: websiteUrl, businessType: 'Unknown',
        confidenceScore: 0, isCoffeeBusiness: false,
        warning: 'AI classification service unavailable.'
      };
    }
  }

  /**
   * Extract all contacts from website with full details and priority scoring
   */
  private static async extractAllContacts(websiteUrl: string, websiteContent: string): Promise<PersonContact[]> {
    const prompt = `Extract ALL contacts from this company website.

WEBSITE: ${websiteUrl}

CONTENT:
${websiteContent.substring(0, 15000)}

Search for: Contact page, About page, Team page, Management, Staff directory, Footer, Header.

Extract EVERY person mentioned with their details.

Return EXACTLY this JSON array. NEVER fabricate. Use null when not found.

[
  {
    "name": "Full Name",
    "email": "email@example.com",
    "jobTitle": "Job Title",
    "department": "One of: Procurement / Purchasing / Green Coffee Buying / Coffee Trader / Import Manager / Trading Manager / Operations / Sales / Marketing / General",
    "phone": "Phone if available",
    "linkedin": "LinkedIn URL if available"
  }
]

Department priority (highest to lowest):
1. Procurement
2. Green Coffee Buying
3. Coffee Buyer
4. Coffee Trader
5. Import Manager
6. Trading Manager
7. Purchasing Manager
8. Operations
9. Sales
10. Marketing
11. General

Return empty array [] if no contacts found.`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You extract all contact information from company websites. Return pure JSON array only.'
      });
      
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((contact: any) => {
        const dept = (contact.department || 'General').toLowerCase();
        const jobTitle = (contact.jobTitle || '').toLowerCase();
        
        let priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        
        // Priority scoring based on department and job title
        if (/procurement|purchasing|green\s*coffee\s*buying|coffee\s*buyer|coffee\s*trader|import\s*manager|trading\s*manager/i.test(dept + ' ' + jobTitle)) {
          priority = 'HIGHEST';
        } else if (/operations|sourcing|supply\s*chain/i.test(dept + ' ' + jobTitle)) {
          priority = 'HIGH';
        } else if (/sales|marketing|manager|director/i.test(dept + ' ' + jobTitle)) {
          priority = 'MEDIUM';
        } else {
          priority = 'LOW';
        }

        return {
          name: contact.name || 'Unknown',
          email: contact.email,
          jobTitle: contact.jobTitle || 'Staff',
          department: contact.department || 'General',
          phone: contact.phone,
          linkedin: contact.linkedin,
          priority,
        };
      }).filter((c: PersonContact) => c.email); // Only return contacts with valid emails
    } catch {
      return [];
    }
  }

  /**
   * Select primary contact based on priority
   */
  private static selectPrimaryContact(contacts: PersonContact[]): PersonContact {
    if (contacts.length === 0) {
      return {
        name: 'Unknown',
        email: '',
        jobTitle: 'Unknown',
        department: 'General',
        priority: 'LOW',
      };
    }

    // Sort by priority: HIGHEST > HIGH > MEDIUM > LOW
    const priorityOrder = { 'HIGHEST': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    const sorted = [...contacts].sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 3;
      const bPriority = priorityOrder[b.priority] || 3;
      return aPriority - bPriority;
    });

    return sorted[0];
  }

  /**
   * Extract contact information from website (legacy method)
   */
  private static async extractContacts(websiteUrl: string, websiteContent: string): Promise<ContactInfo> {
    const prompt = `Extract all possible contact information from this company website.

WEBSITE: ${websiteUrl}

CONTENT:
${websiteContent.substring(0, 10000)}

Return EXACTLY this JSON. Use null when not found. NEVER fabricate.

{
  "companyEmail": "General company email",
  "procurementEmail": "Email for purchasing/procurement department",
  "salesEmail": "Email for sales inquiries",
  "coffeeBuyingEmail": "Email specifically for coffee buying",
  "phone": "Phone number (international format)",
  "whatsapp": "WhatsApp number if mentioned",
  "linkedin": "LinkedIn company URL if found",
  "contactPerson": "Name of a contact person, buyer, or decision-maker",
  "jobTitle": "Job title of the contact person"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You extract professional contact information from company websites. Only return what you find. Use null for missing data.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // Determine priority based on job title/role
      const jobTitleLower = (parsed.jobTitle || '').toLowerCase();
      const contactPersonLower = (parsed.contactPerson || '').toLowerCase();
      
      let priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (/coffee\s*buyer|green\s*coffee|trading\s*manager|import\s*manager|purchasing|procurement/i.test(jobTitleLower + ' ' + contactPersonLower)) {
        priority = 'HIGHEST';
      } else if (/buyer|trade|operations|sourcing/i.test(jobTitleLower + ' ' + contactPersonLower)) {
        priority = 'HIGH';
      } else if (/sales|marketing|manager|director/i.test(jobTitleLower + ' ' + contactPersonLower)) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      return {
        companyEmail: parsed.companyEmail || null,
        procurementEmail: parsed.procurementEmail || null,
        salesEmail: parsed.salesEmail || null,
        coffeeBuyingEmail: parsed.coffeeBuyingEmail || null,
        phone: parsed.phone || null,
        whatsapp: parsed.whatsapp || null,
        linkedin: parsed.linkedin || null,
        contactPerson: parsed.contactPerson || null,
        jobTitle: parsed.jobTitle || null,
        priority,
      };
    } catch {
      return {
        companyEmail: null, procurementEmail: null, salesEmail: null,
        coffeeBuyingEmail: null, phone: null, whatsapp: null,
        linkedin: null, contactPerson: null, jobTitle: null,
        priority: 'LOW',
      };
    }
  }

  /**
   * Analyze coffee portfolio from website - Enhanced with Indonesia-specific regions
   */
  private static async analyzeCoffeePortfolio(websiteUrl: string, websiteContent: string): Promise<CoffeePortfolio> {
    const prompt = `Analyze this coffee company's portfolio based on their website.

WEBSITE: ${websiteUrl}

CONTENT:
${websiteContent.substring(0, 15000)}

Return EXACTLY this JSON. Use [] or "Unknown" when not found. NEVER fabricate.

For Indonesian origins, detect specifically: Aceh, Java, Flores, Toraja, Bali, Mandheling, Lintong, Gayo, Lampung, Temanggung, Sumatra, Sulawesi, Papua.

{
  "origins": ["Brazil", "Colombia", "Ethiopia", "Indonesia"],
  "products": ["Whole bean", "Ground", "Single origin", "Blends", "Green coffee"],
  "processingMethods": ["Washed", "Natural", "Honey", "Wet-Hulled"],
  "certifications": ["Organic", "Fair Trade", "Rainforest Alliance", "UTZ", "RFA"],
  "roastingStyle": "Light / Medium / Dark / Mixed / Unknown",
  "currentSuppliers": ["Supplier 1", "Supplier 2"],
  "privateLabels": ["Brand 1", "Brand 2"],
  "buyingInterests": ["Specialty", "Commercial", "Both"],
  "packagingTypes": ["Vacuum pack", "GrainPro", "Jute"],
  "estimatedAnnualVolume": "Estimated annual volume in metric tons or containers",
  "specialtyFocus": "Low / Medium / High / Very High"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You analyze coffee company portfolios from website content. Be precise. Never fabricate data.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        origins: Array.isArray(parsed.origins) ? parsed.origins : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        processingMethods: Array.isArray(parsed.processingMethods) ? parsed.processingMethods : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        roastingStyle: parsed.roastingStyle || 'Unknown',
        currentSuppliers: Array.isArray(parsed.currentSuppliers) ? parsed.currentSuppliers : [],
        privateLabels: Array.isArray(parsed.privateLabels) ? parsed.privateLabels : [],
        buyingInterests: Array.isArray(parsed.buyingInterests) ? parsed.buyingInterests : [],
        packagingTypes: Array.isArray(parsed.packagingTypes) ? parsed.packagingTypes : [],
        estimatedAnnualVolume: parsed.estimatedAnnualVolume || 'Unknown',
        specialtyFocus: parsed.specialtyFocus || 'Unknown',
      };
    } catch {
      return {
        origins: [], products: [], processingMethods: [], certifications: [],
        roastingStyle: 'Unknown', currentSuppliers: [], privateLabels: [],
        buyingInterests: [], packagingTypes: [],
        estimatedAnnualVolume: 'Unknown', specialtyFocus: 'Unknown',
      };
    }
  }

  /**
   * Match Nandara products against buyer portfolio - Enhanced with opportunity analysis
   */
  private static async matchProducts(
    classification: CompanyClassification,
    portfolio: CoffeePortfolio
  ): Promise<{ matches: ProductMatchDetail[]; gapAnalysis: string }> {
    const prompt = `You are a product matching specialist for Nandara Nusa Montierra (Indonesian specialty coffee exporter).

BUYER: ${classification.companyName}
COUNTRY: ${classification.country}
BUSINESS TYPE: ${classification.businessType}
CURRENT ORIGINS: ${portfolio.origins.join(', ') || 'Unknown'}
CURRENT PRODUCTS: ${portfolio.products.join(', ') || 'Unknown'}
ROASTING STYLE: ${portfolio.roastingStyle}
CERTIFICATIONS: ${portfolio.certifications.join(', ') || 'None mentioned'}
SPECIALTY FOCUS: ${portfolio.specialtyFocus}

NANDARA PRODUCT PORTFOLIO:
${NANDARA_PRODUCTS_DATA.map(p => `- ${p.name}: ${p.process} process, ${p.body} body, ${p.acidity} acidity, notes: ${p.notes}`).join('\n')}

TASK: Match each Nandara product against this buyer's portfolio. Determine:
1. Match score (0-100) based on how well the product complements their existing portfolio
2. Specific reason for the match
3. Gap analysis - what does this product add that they don't currently have?

Return EXACTLY this JSON format:
{
  "matches": [
    {"productName": "Aceh Gayo Grade 1 (Classic)", "matchScore": 85, "reason": "They already buy washed coffees from Central America. Gayo offers a unique Indonesian alternative with bright acidity that fits their roasting profile.", "gapAnalysis": "They have no Indonesian origins. Gayo fills the gap as a high-quality washed Indonesian offering."}
  ],
  "gapAnalysis": "Overall analysis of portfolio gaps that Nandara products can fill"
}

Include ALL 11 products in matches array. Sort by matchScore descending.`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a coffee product matching specialist. Analyze portfolios and match Nandara products. Return pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const matches: ProductMatchDetail[] = (Array.isArray(parsed.matches) ? parsed.matches : []).map((m: any) => ({
        productName: m.productName || '',
        matchScore: Math.min(100, Math.max(0, m.matchScore || 50)),
        reason: m.reason || '',
        gapAnalysis: m.gapAnalysis || '',
      }));

      return {
        matches: matches.length > 0 ? matches : NANDARA_PRODUCTS_DATA.map(p => ({
          productName: p.name,
          matchScore: 50,
          reason: 'AI analysis unavailable. Default medium match.',
          gapAnalysis: 'Unable to determine gap without AI analysis.'
        })),
        gapAnalysis: parsed.gapAnalysis || 'AI gap analysis unavailable.',
      };
    } catch {
      return {
        matches: NANDARA_PRODUCTS_DATA.map(p => ({
          productName: p.name,
          matchScore: 50,
          reason: 'AI analysis unavailable.',
          gapAnalysis: 'Unable to determine gap.'
        })),
        gapAnalysis: 'AI gap analysis unavailable.',
      };
    }
  }

  /**
   * Generate buyer scores
   */
  private static async generateScores(
    classification: CompanyClassification,
    portfolio: CoffeePortfolio
  ): Promise<BuyerScores> {
    const prompt = `Generate buyer opportunity scores for this coffee company.

COMPANY: ${classification.companyName}
BUSINESS: ${classification.businessType}
COUNTRY: ${classification.country}
ORIGINS: ${portfolio.origins.join(', ') || 'None detected'}
SPECIALTY: ${portfolio.specialtyFocus}
VOLUME: ${portfolio.estimatedAnnualVolume}
CERTIFICATIONS: ${portfolio.certifications.join(', ') || 'None'}

Return EXACTLY this JSON. All scores 0-100.
{
  "opportunityScore": 0-100,
  "relationshipDifficulty": 0-100,
  "buyingPotential": 0-100,
  "estimatedVolume": "Metric tons per year estimate",
  "premiumPotential": 0-100,
  "specialtyCoffeeInterest": 0-100,
  "decisionComplexity": 0-100,
  "priceSensitivity": 0-100,
  "responseProbability": 0-100,
  "riskLevel": "Low / Medium / High"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a B2B coffee export scoring analyst. Generate buyer scores. Respond in pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        opportunityScore: Math.min(100, Math.max(0, parsed.opportunityScore || 50)),
        relationshipDifficulty: Math.min(100, Math.max(0, parsed.relationshipDifficulty || 50)),
        buyingPotential: Math.min(100, Math.max(0, parsed.buyingPotential || 50)),
        estimatedVolume: parsed.estimatedVolume || 'Unknown',
        premiumPotential: Math.min(100, Math.max(0, parsed.premiumPotential || 50)),
        specialtyCoffeeInterest: Math.min(100, Math.max(0, parsed.specialtyCoffeeInterest || 50)),
        decisionComplexity: Math.min(100, Math.max(0, parsed.decisionComplexity || 50)),
        priceSensitivity: Math.min(100, Math.max(0, parsed.priceSensitivity || 50)),
        responseProbability: Math.min(100, Math.max(0, parsed.responseProbability || 50)),
        riskLevel: parsed.riskLevel || 'Medium',
      };
    } catch {
      return {
        opportunityScore: 50, relationshipDifficulty: 50, buyingPotential: 50,
        estimatedVolume: 'Unknown', premiumPotential: 50,
        specialtyCoffeeInterest: 50, decisionComplexity: 50,
        priceSensitivity: 50, responseProbability: 50, riskLevel: 'Medium',
      };
    }
  }

  /**
   * Generate buyer insight report
   */
  private static async generateInsight(
    classification: CompanyClassification,
    portfolio: CoffeePortfolio,
    scores: BuyerScores,
    websiteUrl: string,
    websiteContent: string
  ): Promise<BuyerInsight> {
    const prompt = `Generate a professional buyer insight report for this coffee company.

COMPANY: ${classification.companyName}
COUNTRY: ${classification.country}
BUSINESS TYPE: ${classification.businessType}
CURRENT ORIGINS: ${portfolio.origins.join(', ') || 'Unknown'}
ROASTING STYLE: ${portfolio.roastingStyle}
SPECIALTY FOCUS: ${portfolio.specialtyFocus}
VOLUME: ${portfolio.estimatedAnnualVolume}
OPPORTUNITY: ${scores.opportunityScore}/100

WEBSITE CONTENT:
${websiteContent.substring(0, 8000)}

Return EXACTLY this JSON:
{
  "businessSummary": "2-3 paragraph professional summary of this company's business",
  "businessModel": "Description of how they make money (roasting, distributing, retail, etc.)",
  "currentCoffeeStrategy": "Their current approach to sourcing and selling coffee",
  "possiblePainPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "potentialOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "recommendedSalesAngle": "The most effective sales approach for this buyer",
  "recommendedCommunicationStyle": "Professional / Technical / Relationship Driven / Price Sensitive / Premium Focus"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You are a senior coffee trade intelligence analyst. Generate professional buyer insight reports. Return pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        businessSummary: parsed.businessSummary || 'Analysis unavailable.',
        businessModel: parsed.businessModel || 'Unknown',
        currentCoffeeStrategy: parsed.currentCoffeeStrategy || 'Unknown',
        possiblePainPoints: Array.isArray(parsed.possiblePainPoints) ? parsed.possiblePainPoints : [],
        potentialOpportunities: Array.isArray(parsed.potentialOpportunities) ? parsed.potentialOpportunities : [],
        recommendedSalesAngle: parsed.recommendedSalesAngle || 'Introduction with product portfolio showcase.',
        recommendedCommunicationStyle: parsed.recommendedCommunicationStyle || 'Professional',
      };
    } catch {
      return {
        businessSummary: 'AI analysis unavailable.', businessModel: 'Unknown',
        currentCoffeeStrategy: 'Unknown', possiblePainPoints: [],
        potentialOpportunities: [], recommendedSalesAngle: 'Standard introduction.',
        recommendedCommunicationStyle: 'Professional',
      };
    }
  }

  /**
   * Create or update CRM buyer record
   */
  private static async createOrUpdateBuyer(
    classification: CompanyClassification,
    contacts: ContactInfo,
    portfolio: CoffeePortfolio,
    scores: BuyerScores,
    websiteUrl: string,
    buyerInsight?: BuyerInsight
  ): Promise<{ importerId: string; isNew: boolean }> {
    // Check for duplicate by website
    const existing = await prisma.importer.findFirst({
      where: { website: websiteUrl }
    });

    if (existing) {
      // Update existing
      await prisma.importer.update({
        where: { id: existing.id },
        data: {
          businessType: classification.businessType,
          country: classification.country,
          city: classification.city,
          email: contacts.companyEmail || existing.email,
          phone: contacts.phone || existing.phone,
          leadScore: scores.opportunityScore >= 70 ? 'A' : scores.opportunityScore >= 50 ? 'B' : 'C',
          confidenceScore: classification.confidenceScore / 100,
        }
      });

      await BuyerTimelineService.addEvent(existing.id, 'Company Research', 'Buyer re-discovered via auto-discover',
        `Website re-analyzed. Updated business classification.`, 'AI', { classification }, scores.opportunityScore, classification.confidenceScore);

      return { importerId: existing.id, isNew: false };
    }

    // Create new
    const importer = await prisma.importer.create({
      data: {
        companyName: classification.companyName,
        website: websiteUrl,
        email: contacts.companyEmail || contacts.coffeeBuyingEmail || '',
        phone: contacts.phone || '',
        country: classification.country,
        city: classification.city,
        businessType: classification.businessType,
        primaryContactName: contacts.contactPerson || '',
        primaryContactEmail: contacts.procurementEmail || contacts.companyEmail || '',
        status: 'NEW' as any,
        leadScore: scores.opportunityScore >= 70 ? 'A' as any : scores.opportunityScore >= 50 ? 'B' as any : 'C' as any,
        confidenceScore: classification.confidenceScore / 100,
        notes: `Auto-discovered from ${websiteUrl}\n\nBusiness Type: ${classification.businessType}\nSpecialty Focus: ${portfolio.specialtyFocus}\nCurrent Origins: ${portfolio.origins.join(', ')}\nEstimated Volume: ${portfolio.estimatedAnnualVolume}\n\n${buyerInsight?.businessSummary || ''}`,
      }
    });

    await BuyerTimelineService.addEvent(importer.id, 'AI Insight', 'Buyer created via auto-discover',
      `Auto-discovered from ${websiteUrl}. Classified as ${classification.businessType}.`, 'AI',
      { classification, scores }, scores.opportunityScore, classification.confidenceScore);

    return { importerId: importer.id, isNew: true };
  }

  /**
   * Determine outreach strategy
   */
  private static async determineStrategy(
    classification: CompanyClassification,
    portfolio: CoffeePortfolio,
    scores: BuyerScores
  ): Promise<{ emailType: string; reason: string }> {
    const prompt = `Determine the best email outreach type for this coffee buyer.

COMPANY: ${classification.companyName}
BUSINESS: ${classification.businessType}
COUNTRY: ${classification.country}
SPECIALTY FOCUS: ${portfolio.specialtyFocus}
OPPORTUNITY SCORE: ${scores.opportunityScore}/100
BUYING POTENTIAL: ${scores.buyingPotential}/100
RESPONSE PROBABILITY: ${scores.responseProbability}/100

Choose from:
FIRST_CONTACT, FOLLOW_UP_1, FOLLOW_UP_2, SAMPLE_OFFER, SAMPLE_SENT, SAMPLE_FEEDBACK, QUOTATION, NEGOTIATION, PRICE_UPDATE, NEW_HARVEST, REENGAGEMENT, MEETING_THANKYOU, SHIPMENT_READY, SHIPMENT_SENT, CONTRACT_REMINDER, LONG_TERM_PARTNERSHIP

Return JSON:
{
  "emailType": "FIRST_CONTACT",
  "reason": "Explain why this email type is the best starting point for this buyer"
}`;

    try {
      const result = await AiService.generateContent(prompt, {
        systemPrompt: 'You choose the optimal B2B coffee export email outreach type. Return pure JSON.'
      });
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        emailType: parsed.emailType || 'FIRST_CONTACT',
        reason: parsed.reason || 'Standard first contact for new buyer.',
      };
    } catch {
      return { emailType: 'FIRST_CONTACT', reason: 'Standard first contact for new buyer.' };
    }
  }

}
