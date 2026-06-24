export declare class DiscoveryService {
    /**
     * Main discovery function - AI-powered importer discovery
     * @param query Search query (e.g., "coffee importers Germany")
     * @param sessionId Session ID to track progress
     * @param options Additional search options
     */
    static discoverImporters(query: string, sessionId?: string, options?: {
        country?: string;
        region?: string;
        importerType?: string;
    }): Promise<string[]>;
    /**
     * Generates realistic simulated data if AI fails or refuses
     */
    private static generateSimulatedImporters;
}
//# sourceMappingURL=discovery.service.d.ts.map