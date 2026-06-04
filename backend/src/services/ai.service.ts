import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../index';

export class AiService {
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
    const fullPrompt = options.systemPrompt ? `${options.systemPrompt}\n\nUser Query: ${prompt}` : prompt;

    if (this.primaryProvider === 'gemini') {
      try {
        return await this.tryGemini(fullPrompt, options.responseMimeType);
      } catch (error) {
        logger.warn('Gemini failed or limited, falling back to Groq');
        this.primaryProvider = 'groq';
        try {
          return await this.tryGroq(fullPrompt, options.responseMimeType);
        } catch (groqError) {
          logger.error('Both AI providers failed');
          throw groqError;
        }
      }
    } else {
      try {
        return await this.tryGroq(fullPrompt, options.responseMimeType);
      } catch (error) {
        logger.warn('Groq failed or limited, falling back to Gemini');
        this.primaryProvider = 'gemini';
        try {
          return await this.tryGemini(fullPrompt, options.responseMimeType);
        } catch (geminiError) {
          logger.error('Both AI providers failed');
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

  private static async tryGroq(prompt: string, responseMimeType?: string) {
    try {
      logger.info('Attempting AI generation with Groq...');
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
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate limit');
      logger.warn(`Groq ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
      throw error;
    }
  }

  private static async tryGemini(prompt: string, responseMimeType?: string) {
    try {
      logger.info('Attempting AI generation with Gemini...');
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
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('rate limit');
      logger.warn(`Gemini ${isRateLimit ? 'rate limited' : 'failed'}: ${error.message}`);
      throw error;
    }
  }
}
