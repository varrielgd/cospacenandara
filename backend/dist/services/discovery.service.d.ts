export declare class DiscoveryService {
    /**
     * Main discovery function - AI-powered importer discovery
     * @param query Search query (e.g., "coffee importers Germany")
     * @param sessionId Session ID to track progress
     */
    static discoverImporters(query: string, sessionId?: string): Promise<string[]>;
    /**
     * AI-powered importer discovery based on query
     * Generates realistic importer data based on search criteria
     */
    private static generateImportersFromQuery;
    /**
     * Generate realistic domain from company name
     */
    private static generateDomain;
    /**
     * Generate realistic phone number based on country
     */
    private static generatePhone;
}
//# sourceMappingURL=discovery.service.d.ts.map