/**
 * Snapshot of current coffee market conditions
 */
export interface MarketSnapshot {
    arabicaPrice: number | null;
    arabicaChange: number | null;
    usdIdr: number | null;
    eurUsd: number | null;
    gbpUsd: number | null;
    jpyUsd: number | null;
    fetchedAt: string;
    source: string;
}
export declare class MarketDataService {
    /**
     * Get current market snapshot.
     * Uses PostgreSQL cache if fresh (<1hr), otherwise fetches live data.
     */
    static getSnapshot(): Promise<MarketSnapshot>;
    /**
     * Fetch live market data from free public APIs (no API key required)
     */
    private static fetchLive;
    /**
     * Format snapshot as a RAG context block to inject into AI prompts
     */
    static formatAsRagContext(snap: MarketSnapshot): string;
    /**
     * Return enriched snapshot for the dashboard endpoint
     */
    static getDashboardData(): Promise<{
        arabicaPricePerKg: number | null;
        estimatedFobSumatra: number | null;
        marketSentiment: string;
        arabicaPrice: number | null;
        arabicaChange: number | null;
        usdIdr: number | null;
        eurUsd: number | null;
        gbpUsd: number | null;
        jpyUsd: number | null;
        fetchedAt: string;
        source: string;
    }>;
}
//# sourceMappingURL=market-data.service.d.ts.map