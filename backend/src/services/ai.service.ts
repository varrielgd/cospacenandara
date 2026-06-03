import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../index';

export class AiService {
  private static groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  private static genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  static async generateEmailDraft(importerName: string, context: string, tone: string = 'professional') {
    try {
      const prompt = `
        Generate a professional B2B introductory email for a coffee importer.
        Importer Name: ${importerName}
        Context: ${context}
        Tone: ${tone}
        
        The email should be persuasive but respectful. 
        Focus on high-quality Indonesian coffee beans.
        Do not include subject line in the body.
      `;

      // Try Groq first, fallback to Gemini or placeholder
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
        });

        return {
          subject: `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`,
          body: completion.choices[0]?.message?.content || ''
        };
      } catch (groqError) {
        logger.warn('Groq failed, trying Gemini...', groqError);
        
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
          subject: `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`,
          body: response.text()
        };
      }
    } catch (error) {
      logger.error('AI Generation error:', error);
      return {
        subject: `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`,
        body: `Dear ${importerName},\n\nWe are interested in supplying premium Indonesian coffee to your company. [AI generation failed, please write manually]`
      };
    }
  }
}
