"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const generative_ai_1 = require("@google/generative-ai");
const index_js_1 = require("../index.js");
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

FORMATTING RULES (CRITICAL):
- Jangan gunakan **bold**, *italic*, atau formatting markdown APAPUN di tengah kalimat.
- Jangan gunakan emoticon, emoji, atau simbol seperti :), :-), atau icon lainnya.
- Jangan gunakan tanda kutip ganda "" di dalam kalimat untuk penekanan.
- Jangan gunakan tanda bintang * atau tanda strip - untuk bullet points di tengah paragraf.
- Gunakan bahasa profesional dan natural seperti tulisan seorang CMO (Chief Marketing Officer).
- Gunakan struktur paragraf yang rapi dengan spasi antar paragraf.
- Hindari format daftar (list) - gunakan kalimat naratif yang mengalir.
- Hasil harus formatted sebagai teks plain, tanpa markdown formatting.
- Jika ingin memberikan penekanan, gunakan struktur kalimat yang natural, bukan formatting visual.
`;
    static groq = new groq_sdk_1.default({
        apiKey: process.env.GROQ_API_KEY || ''
    });
    static genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Determine primary provider based on available API keys
    static primaryProvider = (() => {
        const hasGroqKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0;
        const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
        if (hasGroqKey)
            return 'groq';
        if (hasGeminiKey)
            return 'gemini';
        index_js_1.logger.warn('No AI API keys available — will always use fallback draft');
        return 'groq'; // Default to groq, will fail and use fallback
    })();
    /**
     * Generates content using available AI providers with automatic fallback
     */
    static async generateContent(prompt, options = {}) {
        const systemInstruction = options.systemPrompt
            ? `${this.MASTER_BUSINESS_CONTEXT}\n${options.systemPrompt}`
            : this.MASTER_BUSINESS_CONTEXT;
        index_js_1.logger.info(`AI Request initiated using ${this.primaryProvider} provider`);
        if (this.primaryProvider === 'gemini') {
            try {
                return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
            }
            catch (error) {
                index_js_1.logger.warn(`Gemini failed (${error.message}), falling back to Groq`);
                this.primaryProvider = 'groq';
                try {
                    return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
                }
                catch (groqError) {
                    index_js_1.logger.error(`Both AI providers failed. Groq error: ${groqError.message}`);
                    throw groqError;
                }
            }
        }
        else {
            try {
                return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
            }
            catch (error) {
                index_js_1.logger.warn(`Groq failed (${error.message}), falling back to Gemini`);
                this.primaryProvider = 'gemini';
                try {
                    return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
                }
                catch (geminiError) {
                    index_js_1.logger.error(`Both AI providers failed. Gemini error: ${geminiError.message}`);
                    throw geminiError;
                }
            }
        }
    }
    /**
     * Strips markdown formatting, emojis, and symbols from AI-generated text
     */
    static sanitizeDraft(text) {
        return text
            // Remove **bold** markers
            .replace(/\*\*(.*?)\*\*/g, '$1')
            // Remove *italic* markers
            .replace(/\*(.*?)\*/g, '$1')
            // Remove __underline__ markers
            .replace(/__(.*?)__/g, '$1')
            // Remove markdown links [text](url)
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove triple backticks code blocks
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline `code` backticks
            .replace(/`([^`]+)`/g, '$1')
            // Remove ### headings
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bullet points markers at line start
            .replace(/^[\s]*[-*+]\s+/gm, '')
            // Remove numbered list markers at line start
            .replace(/^[\s]*\d+[.)]\s+/gm, '')
            // Remove horizontal rules
            .replace(/^---+$/gm, '')
            .replace(/^___+$/gm, '')
            .replace(/^\*\*\*+$/gm, '')
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove emojis and emoticons
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols & pictographs
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
            .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
            .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation selectors
            .replace(/[\u{200D}]/gu, '') // Zero-width joiner
            // Remove common emoticons like :), :(, :-), ;), etc.
            .replace(/[:;=xX]-?[)D(\]PpOo\/\\|]/g, '')
            // Remove excessive quotation marks
            .replace(/""/g, '"')
            .replace(/''/g, "'")
            // Clean up multiple spaces
            .replace(/[ \t]+/g, ' ')
            // Clean up multiple newlines
            .replace(/\n{3,}/g, '\n\n')
            // Trim leading/trailing whitespace per line
            .split('\n').map(line => line.trim()).join('\n')
            .trim();
    }
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
    static async generateEmailDraft(importerName, context, tone = 'professional', ragContext = '', marketContext = '') {
        const hasHistory = ragContext.trim().length > 0;
        const hasMarketData = marketContext.trim().length > 0;
        // Compose the subject line dynamically based on context
        const subject = hasHistory
            ? `Following Up — Our Coffee Partnership with ${importerName}`
            : `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`;
        const prompt = `
Generate a professional B2B ${hasHistory ? 'follow-up' : 'introductory'} email for a coffee buyer/importer.

COMPANY INFO:
Importer/Company: ${importerName}
Context: ${context}
Tone: ${tone}
${hasHistory ? `\n${ragContext}` : ''}
${hasMarketData ? `\n${marketContext}` : ''}

INSTRUCTIONS:
${hasHistory
            ? `- This is a FOLLOW-UP email, NOT a first introduction. Reference the history above naturally.
- Acknowledge past interactions (emails sent, samples shipped, quotations given) where relevant.
- If there is sample feedback, mention it and build on it.
- If there are open quotations, reference them to create urgency or offer an update.
- If there are notes about buyer preferences, tailor the offer accordingly.`
            : `- This is a FIRST INTRODUCTION email. Be compelling and spark curiosity.
- Briefly introduce PT. Nandara Nusa Montierra as a premium Indonesian coffee exporter.
- Highlight key differentiators: single-origin, traceable, specialty-grade Indonesian coffee.`}
${hasMarketData
            ? `- Weave in the market data naturally to add credibility and urgency (e.g., mention price trends or favorable exchange rates).`
            : ''}

FORMATTING RULES (CRITICAL):
- Write as a natural human email from a CMO (Chief Marketing Officer)
- Do NOT use any markdown formatting (no **bold**, no *italic*, no bullet points)
- Do NOT use any emojis, emoticons, or symbols
- Do NOT use quotation marks for emphasis within sentences
- Use plain text only, with proper paragraph breaks
- Keep the tone professional, warm, and persuasive
- Do not include a subject line in the body
- Do not use lists — write in flowing narrative paragraphs
- Do not use asterisks or special characters for formatting
- Sign off professionally as: "Warm regards, Marketing Team, PT. Nandara Nusa Montierra"
    `;
        try {
            const result = await this.generateContent(prompt);
            const sanitized = this.sanitizeDraft(result);
            return { subject, body: sanitized };
        }
        catch (error) {
            return this.getFallbackDraft(importerName, subject);
        }
    }
    static getFallbackDraft(importerName, subject) {
        return {
            subject,
            body: `Dear ${importerName},

We are interested in supplying premium Indonesian coffee to your company. We would like to discuss a potential partnership and share our catalog with you.

Best regards,
Nandara Nusa Montierra Team`
        };
    }
    static async tryGroq(prompt, systemInstruction, responseMimeType) {
        try {
            index_js_1.logger.info('Attempting AI generation with Groq...');
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
                index_js_1.logger.info('Groq response received successfully');
                return content;
            }
            throw new Error('Groq returned empty response');
        }
        catch (error) {
            const isRateLimit = error?.status === 429 || error?.message?.includes('rate limit');
            index_js_1.logger.warn(`Groq ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
            if (error.response?.data) {
                index_js_1.logger.debug('Groq error details:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }
    static async tryGemini(prompt, systemInstruction, responseMimeType) {
        const TIMEOUT_MS = 25000; // 25 second timeout to prevent hanging
        try {
            index_js_1.logger.info('Attempting AI generation with Gemini...');
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
            // Race Gemini against a timeout to prevent indefinite hanging on Render
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out after 25s')), TIMEOUT_MS))
            ]);
            const response = await result.response;
            const text = response.text();
            if (text) {
                index_js_1.logger.info('Gemini response received successfully');
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
            index_js_1.logger.warn(`Gemini ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
            throw error;
        }
    }
}
exports.AiService = AiService;
//# sourceMappingURL=ai.service.js.map