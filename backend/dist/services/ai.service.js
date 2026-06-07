"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const generative_ai_1 = require("@google/generative-ai");
const index_1 = require("../index");
class AiService {
    static MASTER_BUSINESS_CONTEXT = `
KONTEKS BISNIS UTAMA (MASTER CONTEXT):
Perusahaan: PT. Nandara Nusa Montierra
Nama Brand: Nandara Nusa Montierra
Produk Utama: Kopi Premium Indonesia (Mandheling, Toraja, Gayo, Arabica, Robusta).
Target: Buyer Internasional, Importer, Roastery Global, Distributor Horeca.

TUGAS AI (ULTIMATE SCOUT):
1. Anda adalah pakar intelijen pasar kopi global.
2. Anda harus mencari entitas NYATA (perusahaan yang benar-benar ada).
3. Untuk tugas Discovery, berikan URL official yang paling akurat.
4. Jangan pernah mengarang URL atau perusahaan.
5. Pahami bahwa target adalah buyer yang memiliki kapasitas untuk mengimpor kopi dari Indonesia.
`;
    static groq = new groq_sdk_1.default({
        apiKey: process.env.GROQ_API_KEY || ''
    });
    static genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Track the primary provider to avoid unnecessary failures if one is rate limited
    static primaryProvider = 'gemini';
    /**
     * Generates content using available AI providers with automatic fallback
     */
    static async generateContent(prompt, options = {}) {
        const systemInstruction = options.systemPrompt
            ? `${this.MASTER_BUSINESS_CONTEXT}\n${options.systemPrompt}`
            : this.MASTER_BUSINESS_CONTEXT;
        index_1.logger.info(`AI Request initiated using ${this.primaryProvider} provider`);
        if (this.primaryProvider === 'gemini') {
            try {
                return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
            }
            catch (error) {
                index_1.logger.warn(`Gemini failed (${error.message}), falling back to Groq`);
                this.primaryProvider = 'groq';
                try {
                    return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
                }
                catch (groqError) {
                    index_1.logger.error(`Both AI providers failed. Groq error: ${groqError.message}`);
                    throw groqError;
                }
            }
        }
        else {
            try {
                return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
            }
            catch (error) {
                index_1.logger.warn(`Groq failed (${error.message}), falling back to Gemini`);
                this.primaryProvider = 'gemini';
                try {
                    return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
                }
                catch (geminiError) {
                    index_1.logger.error(`Both AI providers failed. Gemini error: ${geminiError.message}`);
                    throw geminiError;
                }
            }
        }
    }
    /**
     * Generates an email draft with automatic failover between Groq and Gemini
     */
    static async generateEmailDraft(importerName, context, tone = 'professional') {
        const prompt = `
      Generate a professional B2B introductory email for a coffee importer.
      Importer Name: ${importerName}
      Context: ${context}
      Tone: ${tone}
      
      The email should be persuasive but respectful. 
      Focus on high-quality Indonesian coffee beans.
      Do not include subject line in the body.
    `;
        const subject = `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`;
        try {
            const result = await this.generateContent(prompt);
            return { subject, body: result };
        }
        catch (error) {
            return this.getFallbackDraft(importerName, subject);
        }
    }
    static getFallbackDraft(importerName, subject) {
        return {
            subject,
            body: `Dear ${importerName},\n\nWe are interested in supplying premium Indonesian coffee to your company. We would like to discuss a potential partnership and share our catalog with you.\n\nBest regards,\nNandara Nusa Montierra Team`
        };
    }
    static async tryGroq(prompt, systemInstruction, responseMimeType) {
        try {
            index_1.logger.info('Attempting AI generation with Groq...');
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                response_format: responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
                temperature: 0.2,
                max_tokens: 2000
            });
            const content = completion.choices[0]?.message?.content;
            if (content) {
                index_1.logger.info('Groq response received successfully');
                return content;
            }
            throw new Error('Groq returned empty response');
        }
        catch (error) {
            const isRateLimit = error?.status === 429 || error?.message?.includes('rate limit');
            index_1.logger.warn(`Groq ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
            if (error.response?.data) {
                index_1.logger.debug('Groq error details:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }
    static async tryGemini(prompt, systemInstruction, responseMimeType) {
        try {
            index_1.logger.info('Attempting AI generation with Gemini...');
            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            const safetySettings = [
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
                { category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE },
            ];
            const model = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
                    responseMimeType: responseMimeType === 'application/json' ? 'application/json' : 'text/plain',
                },
                safetySettings
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text) {
                index_1.logger.info('Gemini response received successfully');
                return text;
            }
            // If no text, check if it was blocked
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Gemini blocked the request: ${response.promptFeedback.blockReason}`);
            }
            throw new Error('Gemini returned empty response');
        }
        catch (error) {
            const isRateLimit = error?.message?.includes('429') || error?.message?.includes('rate limit');
            index_1.logger.warn(`Gemini ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
            throw error;
        }
    }
}
exports.AiService = AiService;
//# sourceMappingURL=ai.service.js.map