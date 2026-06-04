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
        const fullPrompt = options.systemPrompt ? `${options.systemPrompt}\n\nUser Query: ${prompt}` : prompt;
        if (this.primaryProvider === 'gemini') {
            try {
                return await this.tryGemini(fullPrompt, options.responseMimeType);
            }
            catch (error) {
                index_1.logger.warn('Gemini failed or limited, falling back to Groq');
                this.primaryProvider = 'groq';
                try {
                    return await this.tryGroq(fullPrompt, options.responseMimeType);
                }
                catch (groqError) {
                    index_1.logger.error('Both AI providers failed');
                    throw groqError;
                }
            }
        }
        else {
            try {
                return await this.tryGroq(fullPrompt, options.responseMimeType);
            }
            catch (error) {
                index_1.logger.warn('Groq failed or limited, falling back to Gemini');
                this.primaryProvider = 'gemini';
                try {
                    return await this.tryGemini(fullPrompt, options.responseMimeType);
                }
                catch (geminiError) {
                    index_1.logger.error('Both AI providers failed');
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
    static async tryGroq(prompt, responseMimeType) {
        try {
            index_1.logger.info('Attempting AI generation with Groq...');
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: process.env.GROQ_MODEL || 'llama3-70b-8192',
                response_format: responseMimeType === 'application/json' ? { type: 'json_object' } : undefined
            });
            const content = completion.choices[0]?.message?.content;
            if (content) {
                return content;
            }
            throw new Error('Groq returned empty response');
        }
        catch (error) {
            const isRateLimit = error?.status === 429 || error?.message?.includes('rate limit');
            index_1.logger.warn(`Groq ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
            throw error;
        }
    }
    static async tryGemini(prompt, responseMimeType) {
        try {
            index_1.logger.info('Attempting AI generation with Gemini...');
            const model = this.genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
                generationConfig: responseMimeType === 'application/json' ? { responseMimeType: 'application/json' } : undefined
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text) {
                return text;
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