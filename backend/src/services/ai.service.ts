import Groq from 'groq-sdk';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '../index';

export class AiService {
  private static readonly MASTER_BUSINESS_CONTEXT = `
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

  private static groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
  });

  private static genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  // Track the primary provider to avoid unnecessary failures if one is rate limited
  private static primaryProvider: 'groq' | 'gemini' = 'gemini';

  /**
   * Generates content using available AI providers with automatic fallback
   */
  static async generateContent(prompt: string, options: { systemPrompt?: string; responseMimeType?: string } = {}) {
    const systemInstruction = options.systemPrompt 
      ? `${this.MASTER_BUSINESS_CONTEXT}\n${options.systemPrompt}`
      : this.MASTER_BUSINESS_CONTEXT;

    logger.info(`AI Request initiated using ${this.primaryProvider} provider`);

    if (this.primaryProvider === 'gemini') {
      try {
        return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
      } catch (error: any) {
        logger.warn(`Gemini failed (${error.message}), falling back to Groq`);
        this.primaryProvider = 'groq';
        try {
          return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
        } catch (groqError: any) {
          logger.error(`Both AI providers failed. Groq error: ${groqError.message}`);
          throw groqError;
        }
      }
    } else {
      try {
        return await this.tryGroq(prompt, systemInstruction, options.responseMimeType);
      } catch (error: any) {
        logger.warn(`Groq failed (${error.message}), falling back to Gemini`);
        this.primaryProvider = 'gemini';
        try {
          return await this.tryGemini(prompt, systemInstruction, options.responseMimeType);
        } catch (geminiError: any) {
          logger.error(`Both AI providers failed. Gemini error: ${geminiError.message}`);
          throw geminiError;
        }
      }
    }
  }

  /**
   * Generates an email draft with automatic failover between Groq and Gemini
   */
  static async generateEmailDraft(importerName: string, context: string, tone: string = 'professional') {
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
    } catch (error) {
      return this.getFallbackDraft(importerName, subject);
    }
  }

  private static getFallbackDraft(importerName: string, subject: string) {
    return {
      subject,
      body: `Dear ${importerName},\n\nWe are interested in supplying premium Indonesian coffee to your company. We would like to discuss a potential partnership and share our catalog with you.\n\nBest regards,\nNandara Nusa Montierra Team`
    };
  }

  private static async tryGroq(prompt: string, systemInstruction: string, responseMimeType?: string) {
    try {
      logger.info('Attempting AI generation with Groq...');
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
        logger.info('Groq response received successfully');
        return content;
      }
      throw new Error('Groq returned empty response');
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate limit');
      logger.warn(`Groq ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
      if (error.response?.data) {
        logger.debug('Groq error details:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  private static async tryGemini(prompt: string, systemInstruction: string, responseMimeType?: string) {
    try {
      logger.info('Attempting AI generation with Gemini...');
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
      
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
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
        logger.info('Gemini response received successfully');
        return text;
      }
      
      // If no text, check if it was blocked
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the request: ${response.promptFeedback.blockReason}`);
      }

      throw new Error('Gemini returned empty response');
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('rate limit');
      logger.warn(`Gemini ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
      throw error;
    }
  }
}
