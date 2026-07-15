export declare class AiService {
    private static readonly MASTER_BUSINESS_CONTEXT;
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
     * Strips markdown formatting, emojis, and symbols from AI-generated text
     */
    private static sanitizeDraft;
    /**
     * Generates an email draft with automatic failover between Groq and Gemini
     */
    /**
     * Generates an email draft with RAG context (historical lead data + market data)
     * @param importerName  Company name of the lead
     * @param context       Base lead info (type, country, coffeeInterest, contact)
     * @param tone          Email tone (professional, warm, etc.)
     * @param ragContext    Historical context retrieved from DB (past emails, quotations, samples, notes)
     * @param marketContext Current market data (coffee price, FX rates, market trends)
     */
    static generateEmailDraft(importerName: string, context: string, tone?: string, ragContext?: string, marketContext?: string): Promise<{
        subject: string;
        body: string;
    }>;
    private static getFallbackDraft;
    private static tryGroq;
    private static tryGemini;
}
//# sourceMappingURL=ai.service.d.ts.map