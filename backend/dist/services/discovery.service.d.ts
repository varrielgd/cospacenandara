type DiscoveryOptions = {
    country?: string;
    region?: string;
    importerType?: string;
    products?: string[];
    maxResults?: number;
};
export declare class DiscoveryService {
    private static readonly TARGET_COUNT;
    private static readonly MAX_ATTEMPTS;
    private static readonly MAX_SEARCH_RESULTS_PER_QUERY;
    private static readonly MAX_INITIAL_RESULTS;
    private static readonly MAX_CRAWL_CANDIDATES;
    private static readonly MAX_AI_ASSESSMENTS;
    private static readonly REQUEST_TIMEOUT_MS;
    private static readonly CONTACT_PATH_HINTS;
    private static readonly BUYER_KEYWORDS;
    private static readonly NEGATIVE_KEYWORDS;
    private static readonly DIRECTORY_DOMAINS;
    /**
     * Real importer discovery pipeline.
     *
     * This service intentionally does not create fake fallback leads. AI can suggest
     * seed URLs, classify crawled pages, and extract structured fields, but records
     * are saved only after the website is reachable and the page evidence matches
     * the selected country/product niche.
     */
    static discoverImporters(query: string, sessionId?: string, options?: DiscoveryOptions): Promise<string[]>;
    private static generateKnowledgeLeads;
    private static tryGenerateKnowledgeLeads;
    private static getEmergencyHubLeads;
    private static buildLeadsFromSearchResults;
    private static composeLead;
    private static upsertImporter;
    private static updateSession;
    private static searchMultiple;
    private static searchWeb;
    private static searchBrave;
    private static searchSerpApi;
    private static searchBing;
    private static searchAiSeed;
    private static expandDirectoryResults;
    private static crawlWebsite;
    private static assessLeadWithAi;
    private static buildSearchQueries;
    private static buildExpansionQueries;
    private static generateAiExpansionQueries;
    private static buildProductKeywords;
    private static scoreByHeuristics;
    private static isCountryMatch;
    private static countryAliases;
    private static toLeadScore;
    private static inferCountry;
    private static inferCity;
    private static inferBusinessType;
    private static inferCompanyName;
    private static matchProducts;
    private static hasDuplicateLead;
    private static dedupeLeads;
    private static dedupeSearchResults;
    private static extractCandidateLinksFromHtml;
    private static extractInternalLinks;
    private static extractLinks;
    private static extractTitle;
    private static extractEmails;
    private static extractPhones;
    private static extractLinkedin;
    private static extractEvidenceSnippets;
    private static htmlToText;
    private static stripHtml;
    private static decodeHtml;
    private static cleanText;
    private static cleanCompanyName;
    private static normalizeCompanyName;
    private static normalizeUrl;
    private static domainFromUrl;
    private static isBadUrl;
    private static isDirectoryLikeUrl;
    private static isBlockedOrLowValueDomain;
    private static containsAny;
    private static uniqueStrings;
    private static toNumber;
    private static parseJsonArray;
    private static parseJsonObject;
    private static parseJson;
    private static mergeNotes;
    private static defaultHeaders;
    private static fetchWithTimeout;
}
export {};
//# sourceMappingURL=discovery.service.d.ts.map