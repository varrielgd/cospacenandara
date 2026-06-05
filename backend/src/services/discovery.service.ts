import { ImporterStatus } from '@prisma/client';
import { prisma, logger } from '../index';
import { AiService } from './ai.service';

type LeadScore = 'A+' | 'A' | 'B+' | 'B' | 'C';
type VerificationStatus = 'VERIFIED' | 'LIKELY' | 'REJECTED';

type DiscoveryOptions = {
  country?: string;
  region?: string;
  importerType?: string;
  products?: string[];
  maxResults?: number;
};

type FetchInit = {
  headers?: Record<string, string>;
  signal?: unknown;
  redirect?: 'follow' | 'error' | 'manual';
  [key: string]: unknown;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  url: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
};

// Node 18+ provides global fetch. These declarations keep Node-only tsconfig
// projects compiling even when the DOM lib is not enabled.
declare const fetch: (url: string, init?: FetchInit) => Promise<FetchResponse>;
declare const AbortController: {
  new (): {
    signal: unknown;
    abort: () => void;
  };
};

type SearchProvider = 'brave' | 'serpapi' | 'bing' | 'ai-seed';

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  provider: SearchProvider;
  rank: number;
};

type WebsiteIntel = {
  requestedUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  text: string;
  html: string;
  emails: string[];
  phones: string[];
  linkedin: string;
  sourceUrls: string[];
  evidenceSnippets: string[];
  candidateUrls: string[];
  statusCode?: number;
};

type AiLeadAssessment = {
  companyName?: string;
  city?: string;
  country?: string;
  businessType?: string;
  matchedProducts?: string[];
  relevanceScore?: number;
  isCoffeeBusiness?: boolean;
  isPotentialBuyer?: boolean;
  evidenceSnippets?: string[];
  rejectionReason?: string;
};

type CandidateLead = {
  companyName: string;
  website: string;
  email: string;
  phone: string;
  linkedin: string;
  country: string;
  city: string;
  leadScore: LeadScore;
  confidenceScore: number;
  verificationStatus: VerificationStatus;
  businessType: string;
  matchedProducts: string[];
  sourceUrls: string[];
  evidenceSnippets: string[];
  notes: string;
};

export class DiscoveryService {
  private static readonly TARGET_COUNT = 30;
  private static readonly MAX_ATTEMPTS = 4;
  private static readonly MAX_SEARCH_RESULTS_PER_QUERY = 10;
  private static readonly MAX_INITIAL_RESULTS = 90;
  private static readonly MAX_CRAWL_CANDIDATES = 120;
  private static readonly MAX_AI_ASSESSMENTS = 65;
  private static readonly REQUEST_TIMEOUT_MS = 15000;

  private static readonly CONTACT_PATH_HINTS = [
    'contact',
    'about',
    'wholesale',
    'trade',
    'sourcing',
    'green-coffee',
    'green_coffee',
    'roastery',
    'roaster',
    'distribution',
    'b2b',
    'horeca'
  ];

  private static readonly BUYER_KEYWORDS = [
    'importer',
    'imports',
    'import',
    'green coffee',
    'green bean',
    'green beans',
    'coffee trader',
    'coffee trading',
    'trading house',
    'specialty roaster',
    'speciality roaster',
    'coffee roaster',
    'roastery',
    'wholesale coffee',
    'wholesale',
    'distributor',
    'distribution',
    'supplier',
    'horeca',
    'hotel',
    'restaurant',
    'cafe supply',
    'private label',
    'single origin',
    'arabica',
    'robusta'
  ];

  private static readonly NEGATIVE_KEYWORDS = [
    'job vacancy',
    'career only',
    'coffee machine only',
    'equipment only',
    'recipe blog',
    'news article',
    'personal blog',
    'review site',
    'map listing',
    'yellow pages'
  ];

  private static readonly DIRECTORY_DOMAINS = [
    'kompass.',
    'yellowpages.',
    'yelp.',
    'tripadvisor.',
    'opencorporates.',
    'crunchbase.',
    'linkedin.',
    'facebook.',
    'instagram.',
    'wikipedia.',
    'google.',
    'bing.',
    'duckduckgo.',
    'mapcarta.',
    'foursquare.',
    'clutch.co',
    'apollo.io',
    'zoominfo.',
    'signalhire.',
    'rocketreach.',
    'dnb.com'
  ];

  /**
   * Real importer discovery pipeline.
   *
   * This service intentionally does not create fake fallback leads. AI can suggest
   * seed URLs, classify crawled pages, and extract structured fields, but records
   * are saved only after the website is reachable and the page evidence matches
   * the selected country/product niche.
   */
  static async discoverImporters(
    query: string,
    sessionId?: string,
    options: DiscoveryOptions = {}
  ) {
    const foundImporterIds: string[] = [];
    const targetCount = options.maxResults || this.TARGET_COUNT;
    const targetCountry = options.country || 'Global';
    const targetRegion = options.region || '';
    const targetType = options.importerType || 'Coffee Importer';
    const products = this.buildProductKeywords(query, options.products);

    logger.info(
      `[REAL DISCOVERY] Starting importer discovery. query="${query}" country="${targetCountry}" type="${targetType}" target=${targetCount}`
    );

    await this.updateSession(sessionId, {
      status: 'RUNNING',
      totalFound: 0,
      totalProcessed: 0,
      importerIds: foundImporterIds
    });

    try {
      const acceptedLeads: CandidateLead[] = [];
      const rejectedDomains = new Set<string>();
      const processedDomains = new Set<string>();

      for (let attempt = 1; attempt <= this.MAX_ATTEMPTS && acceptedLeads.length < targetCount; attempt++) {
        logger.info(`[REAL DISCOVERY] Attempt ${attempt}/${this.MAX_ATTEMPTS}. Accepted=${acceptedLeads.length}/${targetCount}`);

        const searchQueries =
          attempt === 1
            ? this.buildSearchQueries(query, targetCountry, targetRegion, targetType, products)
            : await this.buildExpansionQueries(query, targetCountry, targetRegion, targetType, products, acceptedLeads, attempt);

        const searchResults = await this.searchMultiple(searchQueries);
        const expandedResults = await this.expandDirectoryResults(searchResults, targetCountry, products);
        const uniqueResults = this.dedupeSearchResults([...searchResults, ...expandedResults])
          .filter(result => {
            const domain = this.domainFromUrl(result.url);
            return domain && !processedDomains.has(domain) && !rejectedDomains.has(domain);
          })
          .slice(0, this.MAX_INITIAL_RESULTS);

        logger.info(`[REAL DISCOVERY] Search yielded ${uniqueResults.length} unique candidate URLs.`);

        const leads = await this.buildLeadsFromSearchResults(uniqueResults, {
          query,
          targetCountry,
          targetRegion,
          targetType,
          products,
          processedDomains,
          rejectedDomains
        });

        for (const lead of leads) {
          if (acceptedLeads.length >= targetCount) break;
          if (this.hasDuplicateLead(acceptedLeads, lead)) continue;

          acceptedLeads.push(lead);

          const importerId = await this.upsertImporter(lead, query);
          if (!foundImporterIds.includes(importerId)) {
            foundImporterIds.push(importerId);
          }

          await this.updateSession(sessionId, {
            status: 'RUNNING',
            totalFound: foundImporterIds.length,
            totalProcessed: processedDomains.size,
            importerIds: foundImporterIds
          });
        }
      }

      if (foundImporterIds.length < targetCount) {
        logger.warn(
          `[REAL DISCOVERY] Completed with ${foundImporterIds.length}/${targetCount} verified or likely-real leads. No synthetic fallback was generated.`
        );
      }

      await this.updateSession(sessionId, {
        status: 'COMPLETED',
        totalFound: foundImporterIds.length,
        totalProcessed: foundImporterIds.length,
        importerIds: foundImporterIds,
        completedAt: new Date()
      });

      return foundImporterIds;
    } catch (error) {
      logger.error('[REAL DISCOVERY] Fatal discovery error:', error);
      await this.updateSession(sessionId, {
        status: 'FAILED',
        totalFound: foundImporterIds.length,
        totalProcessed: foundImporterIds.length,
        importerIds: foundImporterIds
      });
      throw error;
    }
  }

  private static async buildLeadsFromSearchResults(
    searchResults: SearchResult[],
    context: {
      query: string;
      targetCountry: string;
      targetRegion: string;
      targetType: string;
      products: string[];
      processedDomains: Set<string>;
      rejectedDomains: Set<string>;
    }
  ): Promise<CandidateLead[]> {
    const leads: CandidateLead[] = [];
    let aiAssessmentCount = 0;

    for (const result of searchResults.slice(0, this.MAX_CRAWL_CANDIDATES)) {
      const normalizedUrl = this.normalizeUrl(result.url);
      const domain = this.domainFromUrl(normalizedUrl);
      if (!domain || context.processedDomains.has(domain)) continue;

      context.processedDomains.add(domain);

      if (this.isBlockedOrLowValueDomain(domain)) {
        context.rejectedDomains.add(domain);
        continue;
      }

      try {
        const intel = await this.crawlWebsite(normalizedUrl);
        if (!intel || intel.text.length < 250) {
          context.rejectedDomains.add(domain);
          continue;
        }

        const heuristicScore = this.scoreByHeuristics(intel, result, context.targetCountry, context.products);
        if (heuristicScore < 35) {
          context.rejectedDomains.add(domain);
          continue;
        }

        let aiAssessment: AiLeadAssessment = {};
        if (aiAssessmentCount < this.MAX_AI_ASSESSMENTS) {
          aiAssessmentCount++;
          aiAssessment = await this.assessLeadWithAi(intel, result, {
            targetCountry: context.targetCountry,
            targetType: context.targetType,
            products: context.products
          });
        }

        const lead = this.composeLead(intel, result, aiAssessment, heuristicScore, context);
        if (lead.verificationStatus === 'REJECTED') {
          context.rejectedDomains.add(domain);
          continue;
        }

        leads.push(lead);
      } catch (error) {
        logger.warn(`[REAL DISCOVERY] Failed to process candidate ${normalizedUrl}:`, error);
        context.rejectedDomains.add(domain);
      }
    }

    return this.dedupeLeads(leads).sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private static composeLead(
    intel: WebsiteIntel,
    result: SearchResult,
    ai: AiLeadAssessment,
    heuristicScore: number,
    context: {
      query: string;
      targetCountry: string;
      targetRegion: string;
      targetType: string;
      products: string[];
    }
  ): CandidateLead {
    const aiScore = this.toNumber(ai.relevanceScore, 0);
    const confidenceScore = Math.max(0, Math.min(100, Math.round(heuristicScore * 0.55 + aiScore * 0.45)));
    const country = this.cleanText(ai.country || this.inferCountry(intel, context.targetCountry));
    const city = this.cleanText(ai.city || this.inferCity(intel.text, context.targetCountry));
    const businessType = this.cleanText(ai.businessType || this.inferBusinessType(intel.text, context.targetType));
    const matchedProducts = this.uniqueStrings([...(ai.matchedProducts || []), ...this.matchProducts(intel.text, context.products)]);
    const companyName = this.cleanCompanyName(ai.companyName || this.inferCompanyName(intel, result));
    const isCountryMatch = this.isCountryMatch(country, intel.text, context.targetCountry);
    const isCoffeeBusiness = ai.isCoffeeBusiness !== false && this.containsAny(intel.text, ['coffee', 'cafe', 'roaster', 'roastery', 'arabica', 'robusta']);
    const isBuyer = ai.isPotentialBuyer !== false && this.containsAny(intel.text, this.BUYER_KEYWORDS);
    const hasContact = intel.emails.length > 0 || intel.phones.length > 0 || intel.sourceUrls.some(url => this.CONTACT_PATH_HINTS.some(hint => url.toLowerCase().includes(hint)));

    let verificationStatus: VerificationStatus = 'REJECTED';
    if (confidenceScore >= 78 && isCountryMatch && isCoffeeBusiness && isBuyer && hasContact) {
      verificationStatus = 'VERIFIED';
    } else if (confidenceScore >= 58 && isCoffeeBusiness && (isBuyer || matchedProducts.length > 0) && isCountryMatch) {
      verificationStatus = 'LIKELY';
    }

    const evidenceSnippets = this.uniqueStrings([
      ...(ai.evidenceSnippets || []),
      ...intel.evidenceSnippets,
      result.snippet
    ])
      .map(snippet => this.cleanText(snippet).slice(0, 260))
      .filter(Boolean)
      .slice(0, 6);

    const notesPayload = {
      discoveryEngine: 'real-web-scraping-v2',
      originalQuery: context.query,
      targetCountry: context.targetCountry,
      targetRegion: context.targetRegion,
      targetType: context.targetType,
      verificationStatus,
      confidenceScore,
      businessType,
      matchedProducts,
      sourceUrls: intel.sourceUrls,
      evidenceSnippets,
      provider: result.provider,
      rejectionReason: ai.rejectionReason || undefined,
      scrapedAt: new Date().toISOString()
    };

    return {
      companyName,
      website: intel.finalUrl,
      email: intel.emails[0] || '',
      phone: intel.phones[0] || '',
      linkedin: intel.linkedin,
      country: country || context.targetCountry,
      city,
      leadScore: this.toLeadScore(confidenceScore),
      confidenceScore,
      verificationStatus,
      businessType,
      matchedProducts,
      sourceUrls: intel.sourceUrls,
      evidenceSnippets,
      notes: JSON.stringify(notesPayload, null, 2)
    };
  }

  private static async upsertImporter(lead: CandidateLead, query: string): Promise<string> {
    const websiteDomain = this.domainFromUrl(lead.website);

    const existing = await prisma.importer.findFirst({
      where: {
        OR: [
          { companyName: lead.companyName },
          { website: lead.website },
          ...(websiteDomain ? [{ website: { contains: websiteDomain } }] : [])
        ]
      }
    });

    const data = {
      companyName: lead.companyName,
      website: lead.website,
      email: lead.email,
      phone: lead.phone,
      linkedin: lead.linkedin,
      country: lead.country,
      city: lead.city,
      leadScore: lead.leadScore as any,
      status: ImporterStatus.NEW,
      notes: lead.notes || `Real Discovery: ${query}`
    };

    if (existing) {
      const updated = await prisma.importer.update({
        where: { id: existing.id },
        data: {
          ...data,
          notes: this.mergeNotes(existing.notes, lead.notes)
        }
      });
      return updated.id;
    }

    const created = await prisma.importer.create({ data });
    return created.id;
  }

  private static async updateSession(
    sessionId: string | undefined,
    data: {
      status?: 'RUNNING' | 'COMPLETED' | 'FAILED';
      totalFound?: number;
      totalProcessed?: number;
      importerIds?: string[];
      completedAt?: Date;
    }
  ) {
    if (!sessionId) return;

    try {
      await prisma.discoverySession.update({
        where: { id: sessionId },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(typeof data.totalFound === 'number' ? { totalFound: data.totalFound } : {}),
          ...(typeof data.totalProcessed === 'number' ? { totalProcessed: data.totalProcessed } : {}),
          ...(data.importerIds ? { importerIds: JSON.stringify(data.importerIds) } : {}),
          ...(data.completedAt ? { completedAt: data.completedAt } : {})
        }
      });
    } catch (error) {
      logger.warn(`[REAL DISCOVERY] Failed to update discovery session ${sessionId}:`, error);
    }
  }

  private static async searchMultiple(queries: string[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const query of this.uniqueStrings(queries).slice(0, 18)) {
      try {
        const batch = await this.searchWeb(query);
        results.push(...batch);
      } catch (error) {
        logger.warn(`[REAL DISCOVERY] Search failed for query="${query}":`, error);
      }
    }

    return this.dedupeSearchResults(results);
  }

  private static async searchWeb(query: string): Promise<SearchResult[]> {
    if (process.env.BRAVE_SEARCH_API_KEY) {
      return this.searchBrave(query);
    }

    if (process.env.SERPAPI_API_KEY) {
      return this.searchSerpApi(query);
    }

    if (process.env.BING_SEARCH_API_KEY) {
      return this.searchBing(query);
    }

    logger.warn(
      '[REAL DISCOVERY] No search API key found. Set BRAVE_SEARCH_API_KEY, SERPAPI_API_KEY, or BING_SEARCH_API_KEY. Falling back to AI seed URLs with real website verification.'
    );
    return this.searchAiSeed(query);
  }

  private static async searchBrave(query: string): Promise<SearchResult[]> {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(this.MAX_SEARCH_RESULTS_PER_QUERY));
    url.searchParams.set('search_lang', 'en');
    url.searchParams.set('safesearch', 'moderate');

    const response = await this.fetchWithTimeout(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Brave Search failed with HTTP ${response.status}`);
    }

    const json: any = await response.json();
    return (json.web?.results || []).map((item: any, index: number) => ({
      title: this.stripHtml(item.title || ''),
      url: item.url,
      snippet: this.stripHtml(item.description || ''),
      provider: 'brave' as SearchProvider,
      rank: index + 1
    }));
  }

  private static async searchSerpApi(query: string): Promise<SearchResult[]> {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(this.MAX_SEARCH_RESULTS_PER_QUERY));
    url.searchParams.set('api_key', process.env.SERPAPI_API_KEY || '');

    const response = await this.fetchWithTimeout(url.toString());
    if (!response.ok) {
      throw new Error(`SerpAPI failed with HTTP ${response.status}`);
    }

    const json: any = await response.json();
    return (json.organic_results || []).map((item: any, index: number) => ({
      title: this.stripHtml(item.title || ''),
      url: item.link,
      snippet: this.stripHtml(item.snippet || ''),
      provider: 'serpapi' as SearchProvider,
      rank: index + 1
    }));
  }

  private static async searchBing(query: string): Promise<SearchResult[]> {
    const url = new URL('https://api.bing.microsoft.com/v7.0/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(this.MAX_SEARCH_RESULTS_PER_QUERY));
    url.searchParams.set('responseFilter', 'Webpages');
    url.searchParams.set('safeSearch', 'Moderate');

    const response = await this.fetchWithTimeout(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`Bing Search failed with HTTP ${response.status}`);
    }

    const json: any = await response.json();
    return (json.webPages?.value || []).map((item: any, index: number) => ({
      title: this.stripHtml(item.name || ''),
      url: item.url,
      snippet: this.stripHtml(item.snippet || ''),
      provider: 'bing' as SearchProvider,
      rank: index + 1
    }));
  }

  private static async searchAiSeed(query: string): Promise<SearchResult[]> {
    const systemPrompt = `
You generate seed URLs for a real web verification pipeline.
Return only official company websites likely relevant to the query.
Do not invent placeholder companies.
Do not include directories, social media, maps, articles, or marketplaces.
Output only JSON:
[
  {"title":"Company name","url":"https://official-domain.example","snippet":"Why this may match"}
]
`;

    const aiResponse = await AiService.generateContent(
      `Find up to ${this.MAX_SEARCH_RESULTS_PER_QUERY} official company website seed URLs for this B2B coffee buyer query: ${query}`,
      { systemPrompt, responseMimeType: 'application/json' }
    );

    const parsed = this.parseJsonArray(aiResponse || '');
    return parsed
      .map((item: any, index: number) => ({
        title: this.cleanText(item.title || item.companyName || ''),
        url: this.normalizeUrl(item.url || item.website || ''),
        snippet: this.cleanText(item.snippet || item.reason || ''),
        provider: 'ai-seed' as SearchProvider,
        rank: index + 1
      }))
      .filter((item: SearchResult) => item.title && item.url);
  }

  private static async expandDirectoryResults(
    results: SearchResult[],
    targetCountry: string,
    products: string[]
  ): Promise<SearchResult[]> {
    const expanded: SearchResult[] = [];
    const directoryResults = results
      .filter(result => this.isDirectoryLikeUrl(result.url))
      .slice(0, 12);

    for (const result of directoryResults) {
      try {
        const response = await this.fetchWithTimeout(this.normalizeUrl(result.url), {
          headers: this.defaultHeaders()
        });
        if (!response.ok) continue;

        const html = await response.text();
        const links = this.extractCandidateLinksFromHtml(html, result.url, targetCountry, products);
        expanded.push(
          ...links.map((url, index) => ({
            title: `Directory candidate from ${result.title}`,
            url,
            snippet: result.snippet,
            provider: result.provider,
            rank: 1000 + index
          }))
        );
      } catch (error) {
        logger.warn(`[REAL DISCOVERY] Directory expansion failed for ${result.url}:`, error);
      }
    }

    return expanded;
  }

  private static async crawlWebsite(inputUrl: string): Promise<WebsiteIntel | null> {
    const firstUrl = this.normalizeUrl(inputUrl);
    const firstResponse = await this.fetchWithTimeout(firstUrl, {
      headers: this.defaultHeaders()
    });

    if (!firstResponse.ok) {
      throw new Error(`Website returned HTTP ${firstResponse.status}`);
    }

    const finalUrl = firstResponse.url || firstUrl;
    const domain = this.domainFromUrl(finalUrl);
    const firstHtml = await firstResponse.text();
    const sourceUrls = [finalUrl];

    const contactUrls = this.extractInternalLinks(firstHtml, finalUrl)
      .filter(url => this.CONTACT_PATH_HINTS.some(hint => url.toLowerCase().includes(hint)))
      .slice(0, 5);

    const extraHtmlParts: string[] = [];
    for (const url of contactUrls) {
      try {
        const response = await this.fetchWithTimeout(url, {
          headers: this.defaultHeaders()
        });
        if (!response.ok) continue;
        extraHtmlParts.push(await response.text());
        sourceUrls.push(response.url || url);
      } catch (error) {
        logger.debug?.(`[REAL DISCOVERY] Secondary crawl failed for ${url}: ${String(error)}`);
      }
    }

    const html = [firstHtml, ...extraHtmlParts].join('\n');
    const text = this.htmlToText(html);
    const title = this.extractTitle(firstHtml);
    const emails = this.extractEmails(html);
    const phones = this.extractPhones(text);
    const linkedin = this.extractLinkedin(html);
    const evidenceSnippets = this.extractEvidenceSnippets(text);
    const candidateUrls = this.extractCandidateLinksFromHtml(html, finalUrl, '', []);

    return {
      requestedUrl: inputUrl,
      finalUrl,
      domain,
      title,
      text,
      html,
      emails,
      phones,
      linkedin,
      sourceUrls: this.uniqueStrings(sourceUrls),
      evidenceSnippets,
      candidateUrls,
      statusCode: firstResponse.status
    };
  }

  private static async assessLeadWithAi(
    intel: WebsiteIntel,
    result: SearchResult,
    context: {
      targetCountry: string;
      targetType: string;
      products: string[];
    }
  ): Promise<AiLeadAssessment> {
    const systemPrompt = `
You are a strict B2B coffee import/export lead analyst.
Use only the crawled website text provided by the user.
Never invent missing emails, phones, websites, cities, or company names.
Reject the lead if the text does not show a real coffee business or potential B2B buyer.
Return only JSON with this shape:
{
  "companyName": "string or empty",
  "city": "string or empty",
  "country": "string or empty",
  "businessType": "Importer | Green Coffee Buyer | Specialty Roaster | Distributor | Hospitality Supplier | Trading House | Other",
  "matchedProducts": ["Arabica","Robusta","Specialty Coffee"],
  "relevanceScore": 0,
  "isCoffeeBusiness": true,
  "isPotentialBuyer": true,
  "evidenceSnippets": ["short evidence from provided text"],
  "rejectionReason": "string or empty"
}
`;

    const prompt = `
Target country: ${context.targetCountry}
Target buyer type: ${context.targetType}
Target products/niche: ${context.products.join(', ')}

Search result title: ${result.title}
Search result snippet: ${result.snippet}
Website URL: ${intel.finalUrl}
Website title: ${intel.title}

Crawled website text:
${intel.text.slice(0, 14000)}
`;

    try {
      const response = await AiService.generateContent(prompt, {
        systemPrompt,
        responseMimeType: 'application/json'
      });

      const parsed = this.parseJsonObject(response || '');
      return parsed || {};
    } catch (error) {
      logger.warn(`[REAL DISCOVERY] AI assessment failed for ${intel.finalUrl}:`, error);
      return {};
    }
  }

  private static buildSearchQueries(
    query: string,
    targetCountry: string,
    targetRegion: string,
    targetType: string,
    products: string[]
  ): string[] {
    const location = [targetCountry, targetRegion].filter(Boolean).join(' ');
    const productText = products.slice(0, 8).join(' OR ');
    const base = query.trim();

    return this.uniqueStrings([
      base,
      `"${base}" official website`,
      `"${location}" "${targetType}" coffee importer`,
      `"${location}" "green coffee" importer`,
      `"${location}" "specialty coffee" roaster wholesale`,
      `"${location}" "coffee trading" "green beans"`,
      `"${location}" "coffee distributor" "arabica"`,
      `"${location}" "coffee supplier" "horeca"`,
      `"${location}" "single origin" "coffee roaster"`,
      `"${location}" (${productText}) "coffee"`,
      `"${targetCountry}" "Indonesian coffee" importer`,
      `"${targetCountry}" "Mandheling" coffee`,
      `"${targetCountry}" "Toraja" coffee`,
      `"${targetCountry}" "Gayo" coffee`,
      `"${targetCountry}" "robusta" "coffee roaster"`
    ]).filter(queryText => queryText.replace(/["()]/g, '').trim().length > 3);
  }

  private static async buildExpansionQueries(
    query: string,
    targetCountry: string,
    targetRegion: string,
    targetType: string,
    products: string[],
    acceptedLeads: CandidateLead[],
    attempt: number
  ): Promise<string[]> {
    const existingDomains = acceptedLeads.map(lead => this.domainFromUrl(lead.website)).filter(Boolean).join(', ');
    const location = [targetCountry, targetRegion].filter(Boolean).join(' ');

    const deterministicQueries = [
      `"${location}" "coffee importers" "contact"`,
      `"${location}" "green bean buyers" coffee`,
      `"${location}" "coffee roastery" "wholesale"`,
      `"${location}" "coffee trading company"`,
      `"${location}" "specialty coffee association" members roasters`,
      `"${location}" "coffee suppliers" "contact us"`,
      `"${location}" "arabica robusta" "coffee"`
    ];

    try {
      const aiQueries = await this.generateAiExpansionQueries({
        originalQuery: query,
        targetCountry,
        targetRegion,
        targetType,
        products,
        existingDomains,
        attempt
      });
      return this.uniqueStrings([...deterministicQueries, ...aiQueries]);
    } catch (error) {
      logger.warn('[REAL DISCOVERY] AI expansion query generation failed:', error);
      return deterministicQueries;
    }
  }

  private static async generateAiExpansionQueries(input: {
    originalQuery: string;
    targetCountry: string;
    targetRegion: string;
    targetType: string;
    products: string[];
    existingDomains: string;
    attempt: number;
  }): Promise<string[]> {
    const systemPrompt = `
You create search engine queries for finding real official websites of B2B coffee buyers.
Do not output company data.
Output only a JSON array of search query strings.
Use query patterns that uncover importers, roasters, green bean buyers, distributors, and hospitality suppliers.
`;

    const response = await AiService.generateContent(
      `
Original query: ${input.originalQuery}
Target country: ${input.targetCountry}
Region: ${input.targetRegion}
Buyer type: ${input.targetType}
Products: ${input.products.join(', ')}
Already found domains to avoid: ${input.existingDomains}
Attempt: ${input.attempt}

Return 8 new precise search queries.
`,
      { systemPrompt, responseMimeType: 'application/json' }
    );

    return this.parseJsonArray(response).filter((item: unknown): item is string => typeof item === 'string');
  }

  private static buildProductKeywords(query: string, products?: string[]): string[] {
    const defaults = [
      'specialty coffee',
      'speciality coffee',
      'arabica',
      'robusta',
      'green coffee',
      'green beans',
      'single origin',
      'Indonesian coffee',
      'Gayo',
      'Toraja',
      'Mandheling'
    ];

    const queryTokens = query
      .split(/[,\s]+/)
      .map(token => token.trim())
      .filter(token => token.length > 3 && !['coffee', 'importer', 'importers', 'buyer', 'buyers'].includes(token.toLowerCase()));

    return this.uniqueStrings([...(products || []), ...defaults, ...queryTokens]);
  }

  private static scoreByHeuristics(
    intel: WebsiteIntel,
    result: SearchResult,
    targetCountry: string,
    products: string[]
  ): number {
    const haystack = `${result.title} ${result.snippet} ${intel.title} ${intel.text}`.toLowerCase();
    let score = 0;

    if (this.containsAny(haystack, ['coffee', 'roaster', 'roastery', 'arabica', 'robusta', 'espresso'])) score += 20;
    if (this.containsAny(haystack, this.BUYER_KEYWORDS)) score += 22;
    if (this.matchProducts(haystack, products).length > 0) score += 12;
    if (intel.emails.length > 0) score += 10;
    if (intel.phones.length > 0) score += 6;
    if (intel.linkedin) score += 5;
    if (intel.sourceUrls.length > 1) score += 5;
    if (this.isCountryMatch('', haystack, targetCountry)) score += 15;
    if (this.isDirectoryLikeUrl(intel.finalUrl)) score -= 20;
    if (this.containsAny(haystack, this.NEGATIVE_KEYWORDS)) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private static isCountryMatch(countryField: string, text: string, targetCountry: string): boolean {
    if (!targetCountry || targetCountry.toLowerCase() === 'global') return true;

    const normalizedTarget = targetCountry.toLowerCase();
    const normalizedCountry = countryField.toLowerCase();
    const normalizedText = text.toLowerCase();
    const aliases = this.countryAliases(normalizedTarget);

    return (
      normalizedCountry.includes(normalizedTarget) ||
      aliases.some(alias => normalizedCountry.includes(alias)) ||
      normalizedText.includes(normalizedTarget) ||
      aliases.some(alias => normalizedText.includes(alias))
    );
  }

  private static countryAliases(country: string): string[] {
    const map: Record<string, string[]> = {
      'united arab emirates': ['uae', 'dubai', 'abu dhabi', 'sharjah'],
      uae: ['united arab emirates', 'dubai', 'abu dhabi', 'sharjah'],
      singapore: ['sg'],
      japan: ['tokyo', 'kyoto', 'osaka', 'jp'],
      taiwan: ['taipei', 'taichung', 'tainan', 'tw'],
      qatar: ['doha', 'qa'],
      oman: ['muscat', 'om'],
      'saudi arabia': ['ksa', 'riyadh', 'jeddah', 'dammam', 'khobar'],
      germany: ['deutschland', 'berlin', 'hamburg', 'munich'],
      france: ['paris'],
      netherlands: ['holland', 'amsterdam', 'rotterdam'],
      'united kingdom': ['uk', 'england', 'london', 'britain'],
      usa: ['united states', 'america', 'new york', 'los angeles'],
      'united states': ['usa', 'america', 'new york', 'los angeles']
    };

    return map[country] || [];
  }

  private static toLeadScore(score: number): LeadScore {
    if (score >= 88) return 'A+';
    if (score >= 76) return 'A';
    if (score >= 66) return 'B+';
    if (score >= 56) return 'B';
    return 'C';
  }

  private static inferCountry(intel: WebsiteIntel, targetCountry: string): string {
    if (targetCountry && targetCountry !== 'Global' && this.isCountryMatch('', intel.text, targetCountry)) {
      return targetCountry;
    }

    const tld = intel.domain.split('.').pop() || '';
    const tldMap: Record<string, string> = {
      sg: 'Singapore',
      ae: 'United Arab Emirates',
      sa: 'Saudi Arabia',
      qa: 'Qatar',
      om: 'Oman',
      tw: 'Taiwan',
      jp: 'Japan',
      de: 'Germany',
      fr: 'France',
      nl: 'Netherlands',
      uk: 'United Kingdom'
    };

    return tldMap[tld] || targetCountry || '';
  }

  private static inferCity(text: string, targetCountry: string): string {
    const citiesByCountry: Record<string, string[]> = {
      Singapore: ['Singapore'],
      'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
      'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Khobar'],
      Qatar: ['Doha'],
      Oman: ['Muscat', 'Seeb'],
      Taiwan: ['Taipei', 'Taichung', 'Tainan'],
      Japan: ['Tokyo', 'Kyoto', 'Osaka', 'Karuizawa'],
      Germany: ['Berlin', 'Hamburg', 'Munich', 'Bremen'],
      France: ['Paris', 'Lyon', 'Marseille'],
      Netherlands: ['Amsterdam', 'Rotterdam', 'Utrecht'],
      'United Kingdom': ['London', 'Manchester', 'Bristol']
    };

    const haystack = text.toLowerCase();
    const cities = citiesByCountry[targetCountry] || [];
    return cities.find(city => haystack.includes(city.toLowerCase())) || '';
  }

  private static inferBusinessType(text: string, fallback: string): string {
    const haystack = text.toLowerCase();
    if (haystack.includes('green coffee') && haystack.includes('import')) return 'Green Coffee Importer';
    if (haystack.includes('trading')) return 'Trading House';
    if (haystack.includes('distributor') || haystack.includes('distribution')) return 'Distributor';
    if (haystack.includes('wholesale')) return 'Wholesale Coffee Buyer';
    if (haystack.includes('hotel') || haystack.includes('horeca')) return 'Hospitality Supplier';
    if (haystack.includes('roaster') || haystack.includes('roastery')) return 'Specialty Roaster';
    return fallback;
  }

  private static inferCompanyName(intel: WebsiteIntel, result: SearchResult): string {
    const title = this.cleanCompanyName(intel.title || result.title);
    if (title) return title;

    const domainName = intel.domain.split('.')[0] || intel.domain;
    return domainName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private static matchProducts(text: string, products: string[]): string[] {
    const haystack = text.toLowerCase();
    return this.uniqueStrings(products.filter(product => haystack.includes(product.toLowerCase())));
  }

  private static hasDuplicateLead(existing: CandidateLead[], candidate: CandidateLead): boolean {
    const candidateDomain = this.domainFromUrl(candidate.website);
    const candidateName = this.normalizeCompanyName(candidate.companyName);

    return existing.some(lead => {
      const domain = this.domainFromUrl(lead.website);
      const name = this.normalizeCompanyName(lead.companyName);
      return domain === candidateDomain || name === candidateName;
    });
  }

  private static dedupeLeads(leads: CandidateLead[]): CandidateLead[] {
    const seen = new Set<string>();
    const unique: CandidateLead[] = [];

    for (const lead of leads) {
      const key = this.domainFromUrl(lead.website) || this.normalizeCompanyName(lead.companyName);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(lead);
    }

    return unique;
  }

  private static dedupeSearchResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      const normalized = this.normalizeUrl(result.url);
      const domain = this.domainFromUrl(normalized);
      if (!normalized || !domain || seen.has(normalized) || this.isBadUrl(normalized)) continue;
      seen.add(normalized);
      unique.push({ ...result, url: normalized });
    }

    return unique;
  }

  private static extractCandidateLinksFromHtml(
    html: string,
    baseUrl: string,
    targetCountry: string,
    products: string[]
  ): string[] {
    const links = this.extractLinks(html, baseUrl);
    const baseDomain = this.domainFromUrl(baseUrl);
    const text = this.htmlToText(html).toLowerCase();
    const pageLooksRelevant =
      this.containsAny(text, ['coffee', 'roaster', 'importer', 'green coffee', 'arabica', 'robusta']) ||
      this.matchProducts(text, products).length > 0 ||
      this.isCountryMatch('', text, targetCountry);

    if (!pageLooksRelevant) return [];

    return this.uniqueStrings(
      links
        .filter(url => {
          const domain = this.domainFromUrl(url);
          return domain && domain !== baseDomain && !this.isBlockedOrLowValueDomain(domain) && !this.isBadUrl(url);
        })
        .map(url => this.normalizeUrl(url))
    ).slice(0, 25);
  }

  private static extractInternalLinks(html: string, baseUrl: string): string[] {
    const baseDomain = this.domainFromUrl(baseUrl);
    return this.uniqueStrings(
      this.extractLinks(html, baseUrl)
        .map(url => this.normalizeUrl(url))
        .filter(url => this.domainFromUrl(url) === baseDomain && !this.isBadUrl(url))
    ).slice(0, 20);
  }

  private static extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const href = this.decodeHtml(match[1] || '').trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      try {
        links.push(new URL(href, baseUrl).toString());
      } catch {
        // Ignore invalid href values.
      }
    }

    return links;
  }

  private static extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return this.cleanText(this.stripHtml(titleMatch?.[1] || h1Match?.[1] || ''));
  }

  private static extractEmails(input: string): string[] {
    const decoded = this.decodeHtml(input)
      .replace(/\s*\[\s*at\s*]\s*/gi, '@')
      .replace(/\s*\(\s*at\s*\)\s*/gi, '@')
      .replace(/\s+at\s+/gi, '@')
      .replace(/\s*\[\s*dot\s*]\s*/gi, '.')
      .replace(/\s*\(\s*dot\s*\)\s*/gi, '.');

    const matches = decoded.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    return this.uniqueStrings(
      matches
        .map(email => email.toLowerCase())
        .filter(email => !email.includes('example.') && !email.endsWith('.png') && !email.endsWith('.jpg'))
    ).slice(0, 5);
  }

  private static extractPhones(text: string): string[] {
    const matches = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{3,5}/g) || [];
    return this.uniqueStrings(
      matches
        .map(phone => phone.replace(/\s+/g, ' ').trim())
        .filter(phone => phone.replace(/\D/g, '').length >= 7)
    ).slice(0, 5);
  }

  private static extractLinkedin(html: string): string {
    const match = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9%_.-]+\/?/i);
    return match?.[0] || '';
  }

  private static extractEvidenceSnippets(text: string): string[] {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(sentence => this.cleanText(sentence))
      .filter(sentence => sentence.length > 30 && sentence.length < 260);

    return sentences
      .filter(sentence => this.containsAny(sentence.toLowerCase(), this.BUYER_KEYWORDS))
      .slice(0, 5);
  }

  private static htmlToText(html: string): string {
    return this.cleanText(
      this.decodeHtml(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
          .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
          .replace(/<\/(p|div|section|article|li|h1|h2|h3|br)>/gi, '. ')
          .replace(/<[^>]+>/g, ' ')
      )
    );
  }

  private static stripHtml(input: string): string {
    return this.cleanText(this.decodeHtml(input.replace(/<[^>]+>/g, ' ')));
  }

  private static decodeHtml(input: string): string {
    return input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  }

  private static cleanText(input: string): string {
    return (input || '').replace(/\s+/g, ' ').trim();
  }

  private static cleanCompanyName(input: string): string {
    return this.cleanText(input)
      .replace(/\s*[-|]\s*(official site|home|homepage|coffee|specialty coffee|speciality coffee).*$/i, '')
      .replace(/\s*\|.*$/g, '')
      .replace(/\s*-\s*Home\s*$/i, '')
      .trim();
  }

  private static normalizeCompanyName(input: string): string {
    return this.cleanCompanyName(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/(ltd|limited|llc|inc|co|company|gmbh|pte|plc|corp|corporation)$/g, '');
  }

  private static normalizeUrl(input: string): string {
    if (!input) return '';
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

    try {
      const url = new URL(withProtocol);
      url.hash = '';

      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_|fbclid|gclid|mc_|ref$)/i.test(key)) {
          url.searchParams.delete(key);
        }
      }

      if (url.pathname !== '/' && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
      }

      return url.toString();
    } catch {
      return '';
    }
  }

  private static domainFromUrl(input: string): string {
    try {
      return new URL(this.normalizeUrl(input)).hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      return '';
    }
  }

  private static isBadUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('/search?') ||
      lower.includes('/maps?') ||
      lower.includes('/login') ||
      lower.includes('/signup') ||
      lower.includes('/privacy') ||
      lower.includes('/terms') ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.zip')
    );
  }

  private static isDirectoryLikeUrl(url: string): boolean {
    const domain = this.domainFromUrl(url);
    return this.DIRECTORY_DOMAINS.some(directory => domain.includes(directory.replace(/\.$/, '')));
  }

  private static isBlockedOrLowValueDomain(domain: string): boolean {
    if (!domain) return true;
    return this.DIRECTORY_DOMAINS.some(blocked => domain.includes(blocked.replace(/\.$/, '')));
  }

  private static containsAny(text: string, keywords: string[]): boolean {
    const haystack = text.toLowerCase();
    return keywords.some(keyword => haystack.includes(keyword.toLowerCase()));
  }

  private static uniqueStrings(values: string[]): string[] {
    return [...new Set(values.map(value => this.cleanText(String(value || ''))).filter(Boolean))];
  }

  private static toNumber(value: unknown, fallback: number): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  private static parseJsonArray(input: string | null | undefined): any[] {
    const parsed = this.parseJson(input);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.results)) return parsed.results;
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed?.queries)) return parsed.queries;
    if (Array.isArray(parsed?.importers)) return parsed.importers;
    return [];
  }

  private static parseJsonObject(input: string | null | undefined): any {
    const parsed = this.parseJson(input);
    return parsed && !Array.isArray(parsed) ? parsed : {};
  }

  private static parseJson(input: string | null | undefined): any {
    if (!input) return null;

    let cleaned = input.trim();
    const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeFenceMatch) cleaned = codeFenceMatch[1].trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const arrayMatch = cleaned.match(/\[[\s\S]*]/);
      const objectMatch = cleaned.match(/\{[\s\S]*}/);
      const jsonLike = arrayMatch?.[0] || objectMatch?.[0];
      if (!jsonLike) return null;

      try {
        return JSON.parse(jsonLike);
      } catch {
        return null;
      }
    }
  }

  private static mergeNotes(existingNotes: string | null | undefined, newNotes: string): string {
    if (!existingNotes) return newNotes;

    const marker = '\n\n--- Latest real discovery evidence ---\n';
    const merged = `${existingNotes}${marker}${newNotes}`;
    return merged.length > 12000 ? merged.slice(merged.length - 12000) : merged;
  }

  private static defaultHeaders(): Record<string, string> {
    return {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 NandaraDiscoveryBot/2.0'
    };
  }

  private static async fetchWithTimeout(url: string, init: FetchInit = {}): Promise<FetchResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
        redirect: 'follow'
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
