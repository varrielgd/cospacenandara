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
   * Strips markdown formatting, emojis, and symbols from AI-generated text
   */
  private static sanitizeDraft(text: string): string {
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
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // Misc symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport & map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')  // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')     // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')     // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')     // Variation selectors
      .replace(/[\u{200D}]/gu, '')              // Zero-width joiner
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
  static async generateEmailDraft(importerName: string, context: string, tone: string = 'professional') {
    const prompt = `
      Generate a professional B2B introductory email for a coffee importer.
      
      Importer Name: ${importerName}
      Context: ${context}
      Tone: ${tone}
      
      IMPORTANT FORMATTING RULES:
      - Write as a natural human email from a CMO (Chief Marketing Officer)
      - Do NOT use any markdown formatting (no **bold**, no *italic*, no bullet points)
      - Do NOT use any emojis, emoticons, or symbols
      - Do NOT use quotation marks for emphasis within sentences
      - Use plain text only, with proper paragraph breaks
      - Keep the tone professional, warm, and persuasive
      - The email should be well-structured with clear paragraphs
      - Do not include subject line in the body
      - Do not use lists - write in flowing narrative paragraphs
      - Do not use asterisks or special characters for formatting
    `;

    const subject = `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`;

    try {
      const result = await this.generateContent(prompt);
      const sanitized = this.sanitizeDraft(result);
      return { subject, body: sanitized };
    } catch (error) {
      return this.getFallbackDraft(importerName, subject);
    }
  }

  private static getFallbackDraft(importerName: string, subject: string) {
    return {
      subject,
      body: `Dear ${importerName},

We are interested in supplying premium Indonesian coffee to your company. We would like to discuss a potential partnership and share our catalog with you.

Best regards,
Nandara Nusa Montierra Team`
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
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      
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