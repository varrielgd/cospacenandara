export declare class AiService {
    private static groq;
    private static genAI;
    private static primaryProvider;
    /**
     * Generates content using available AI providers with automatic fallback
     */
    static generateContent(prompt: string, options?: {
        systemPrompt?: string;
        responseMimeType?: string;
    }): Promise<string>;
    /**
     * Generates an email draft with automatic failover between Groq and Gemini
     */
    static generateEmailDraft(importerName: string, context: string, tone?: string): Promise<{
        subject: string;
        body: string;
    }>;
    private static getFallbackDraft;
    private static tryGroq;
    private static tryGemini;
}
//# sourceMappingURL=ai.service.d.ts.map