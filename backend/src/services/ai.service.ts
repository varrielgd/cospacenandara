import Groq from 'groq-sdk';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { logger } from '../index.js';

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

  // Determine primary provider based on available API keys
  private static primaryProvider: 'groq' | 'gemini' = (() => {
    const hasGroqKey = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
    if (hasGroqKey) return 'groq';
    if (hasGeminiKey) return 'gemini';
    logger.warn('No AI API keys available — will always use fallback draft');
    return 'groq'; // Default to groq, will fail and use fallback
  })();

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
  /**
   * Determines the email type based on CRM pipeline stage and communication history
   */
  static determineEmailType(
    leadStatus: string,
    timelineCount: number,
    latestSampleStatus: string | null,
    latestQuoteStatus: string | null,
    daysSinceLastContact: number | null
  ): string {
    // If buyer inactive for 30+ days
    if (daysSinceLastContact !== null && daysSinceLastContact >= 30) {
      return 'REENGAGEMENT';
    }

    // Pipeline stage based
    switch (leadStatus) {
      case 'New Lead':
        if (timelineCount === 0) return 'FIRST_CONTACT';
        if (timelineCount === 1) return 'FOLLOW_UP_1';
        if (timelineCount >= 2) return 'FOLLOW_UP_2';
        return 'FIRST_CONTACT';

      case 'Contacted':
        if (timelineCount <= 1) return 'FOLLOW_UP_1';
        if (timelineCount === 2) return 'FOLLOW_UP_2';
        return 'FOLLOW_UP_2';

      case 'Sample Requested':
        return 'SAMPLE_OFFER';

      case 'Sample Sent':
        if (latestSampleStatus === 'Delivered') return 'SAMPLE_FEEDBACK';
        return 'SAMPLE_SENT';

      case 'Negotiation':
      case 'Quotation Sent':
        if (latestQuoteStatus === 'Sent') return 'NEGOTIATION';
        return 'QUOTATION';

      case 'Order Confirmed':
        return 'SHIPMENT_READY';

      case 'Closed Won':
        return 'LONG_TERM_PARTNERSHIP';

      case 'Closed Lost':
        return 'REENGAGEMENT';

      default:
        if (timelineCount === 0) return 'FIRST_CONTACT';
        if (timelineCount === 1) return 'FOLLOW_UP_1';
        return 'FOLLOW_UP_2';
    }
  }

  /**
   * Generates a professional B2B email draft with intelligent email type detection,
   * country-specific personalization, and product-focused content
   */
  static async generateEmailDraft(
    importerName: string,
    context: string,
    tone: string = 'professional',
    ragContext: string = '',
    marketContext: string = '',
    extraParams: {
      leadStatus?: string;
      timelineCount?: number;
      coffeeInterest?: string;
      contactName?: string;
      buyerName?: string;
      buyerEmail?: string;
      buyerWebsite?: string;
      buyerContact?: string;
      crmNotes?: string;
      pipelineStage?: string;
      selectedCoffeeProduct?: string;
      latestSampleStatus?: string | null;
      latestQuoteStatus?: string | null;
      daysSinceLastContact?: number | null;
      buyerCountry?: string;
      emailType?: string;
    } = {}
  ) {
    const hasHistory = ragContext.trim().length > 0;
    const hasMarketData = marketContext.trim().length > 0;

    const normalizeEmailType = (value?: string) => {
      if (!value) return '';
      return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    };

    const emailType = normalizeEmailType(extraParams.emailType) || this.determineEmailType(
      extraParams.leadStatus || 'New Lead',
      extraParams.timelineCount || 0,
      extraParams.latestSampleStatus || null,
      extraParams.latestQuoteStatus || null,
      extraParams.daysSinceLastContact ?? null
    );

    // Country-specific personalization instructions
    const countryPersonalization: Record<string, string> = {
      'Japan': `FORMAT: Very formal and respectful. Use "Sama" or "San" after contact name if provided.
LENGTH: Detailed and thorough. Japanese buyers appreciate complete information.
FOCUS: Quality certificates, precise moisture readings, defect counts, traceability documentation. Emphasize consistency batch to batch.
TONE: Respectful, humble, knowledge-sharing. Reference any existing relationship history.
CLOSING: Express desire for long-term partnership.`,
      'Germany': `FORMAT: Structured, no-nonsense, specification-driven. Germans value precision.
LENGTH: Medium to detailed. Include spec sheets inline where relevant.
FOCUS: Technical specifications — moisture content, screen size, defect count, density, SCA score. Certifications (EUDR compliance, organic if applicable).
TONE: Direct, honest, transparent. No marketing fluff. Be specific about quantities and lead times.
CLOSING: Clear next step with timeline.`,
      'United States': `FORMAT: Direct, value-oriented, business efficiency focused.
LENGTH: Short to medium. Respect their time.
FOCUS: Business value — competitive pricing, reliable supply chain, speed of delivery. Differentiators vs other origins.
TONE: Professional but conversational. Confident, can-do attitude. Less formal than Europe.
CLOSING: Offer a specific next step (sample, call, quote).`,
      'South Korea': `FORMAT: Formal but relationship-building.
LENGTH: Medium length.
FOCUS: Long-term partnership potential. Quality consistency. Reference any Korean business connections if available.
TONE: Respectful, patient, relationship-first. Emphasize commitment to quality over many seasons.
CLOSING: Express desire for mutual growth partnership.`,
      'Australia': `FORMAT: Friendly, straightforward, egalitarian.
LENGTH: Short to medium.
FOCUS: Quality, story behind the coffee, direct trade impact. Australian roasters appreciate authenticity.
TONE: Warm but professional. Equal footing. No excessive formality.
CLOSING: Casual but clear — "Let me know if you'd like to cup this lot."`,
      'Singapore': `FORMAT: Efficient, trading-oriented.
LENGTH: Medium.
FOCUS: Logistics efficiency, trading terms (FOB/CIF), pricing, speed of shipment.
TONE: Professional, efficient, business-focused. Singapore values speed and reliability.
CLOSING: Clear commercial proposal with terms.`,
      'Taiwan': `FORMAT: Formal, detailed specification focus.
LENGTH: Medium to detailed.
FOCUS: Product quality, certificates (phyto, TFDA compliance), roasting recommendations.
TONE: Respectful, thorough, quality-focused.
CLOSING: Invite cupping evaluation.`,
      'United Kingdom': `FORMAT: Professional, understated, quality-focused.
LENGTH: Medium.
FOCUS: Origin story, quality specs, direct trade ethics.
TONE: Polite, professional, slightly reserved. Let the product speak.
CLOSING: Gentle invitation to proceed.`,
      'Netherlands': `FORMAT: Direct, trade-focused, pragmatic.
LENGTH: Medium.
FOCUS: Trading efficiency, sustainability credentials, volume capability.
TONE: Direct and straightforward. Dutch buyers appreciate honesty.
CLOSING: Specific proposal with clear terms.`
    };

    const countryInstruction = countryPersonalization[extraParams.buyerCountry || ''] || 
      `FORMAT: Professional and respectful.
FOCUS: Quality, reliability, partnership.
TONE: Professional and warm.`;

    // Build the prompt for the email
    const baseContext = context;
    const productToFocus = extraParams.selectedCoffeeProduct || extraParams.coffeeInterest || 'Premium Indonesian Coffee';
    const buyerName = extraParams.buyerName || importerName;
    const buyerEmail = extraParams.buyerEmail || 'Not available';
    const buyerWebsite = extraParams.buyerWebsite || 'Not available';
    const buyerContact = extraParams.buyerContact || extraParams.contactName || 'Procurement Team';
    const crmNotes = extraParams.crmNotes || 'No additional CRM notes provided.';
    const pipelineStage = extraParams.pipelineStage || extraParams.leadStatus || 'New Lead';

    const prompt = `
You are Fahril F., a professional coffee export specialist at PT Nandara Nusa Montierra in Indonesia. You are writing a real business email. Do not write as AI. Write as yourself.

ABOUT YOU (Sender):
Name: Fahril F.
Position: Export Relations
Company: PT Nandara Nusa Montierra
Website: https://www.nandaranusamontierra.com
Email: marketing@nandaranusamontierra.com
WhatsApp: +62 852 8348 0478
Office: Jl. Kartini 3 No.25, Sawah Besar, Jakarta Pusat 10720, Indonesia
Products: Single-origin specialty Indonesian coffee direct from smallholder cooperatives

RECIPIENT:
Buyer Name: ${buyerName}
Buyer Country: ${extraParams.buyerCountry || 'International'}
Buyer Email: ${buyerEmail}
Buyer Website: ${buyerWebsite}
Buyer Contact: ${buyerContact}
Selected Coffee Product: ${productToFocus}
Selected Email Type: ${emailType}
Current CRM Notes: ${crmNotes}
Current Pipeline Stage: ${pipelineStage}
Product Interest: ${productToFocus}
${baseContext ? `Context: ${baseContext}` : ''}

${hasHistory ? `\nHISTORICAL DATA:\n${ragContext}` : ''}
${hasMarketData ? `\nMARKET DATA:\n${marketContext}` : ''}

email_type=${emailType}
EMAIL TYPE: ${emailType}
${this.getEmailTypeInstructions(emailType, hasHistory, extraParams)}

COUNTRY-SPECIFIC INSTRUCTIONS:
${countryInstruction}

PRODUCT RULE:
Focus ONLY on ${productToFocus}. Do not mention any other coffee origins. If the product is Aceh Gayo, only discuss Aceh Gayo. If Flores, only Flores. Keep the email centered on their interest.

OUTPUT REQUIREMENTS:

You must return your response in EXACTLY this format with the section headers exactly as shown:

---SUBJECT_ALTERNATIVES---
Subject 1: [strongest]
Subject 2: 
Subject 3: 
Subject 4: 
Subject 5: [weakest]

---EMAIL_BODY---

[Write the email body here. This must be natural, professional, human-sounding.]

Write as Fahril F. PERSONALLY. Not as a marketing team. Not as AI.

Style rules:
- DO NOT use any markdown formatting like **bold** or *italic* or bullet points
- DO NOT use any emoji or emoticons
- DO NOT use quotation marks for emphasis
- DO NOT use numbered or bulleted lists - write in flowing paragraphs
- DO NOT sound like ChatGPT. Sound like a real Indonesian coffee exporter writing a real email.
- NO marketing hype or cliches like "unparalleled", "revolutionary", "game-changing"
- Tone should be natural and human, as if you personally met them at a coffee expo
- Use short paragraphs with line breaks between them
- Keep language natural and conversational but professional

Call to action: Include a soft, natural CTA appropriate for this email type.
- Cold email: "Would you be interested in receiving our latest FOB offers?"
- Follow-up: "May I send you a sample of our current crop for your evaluation?"
- Negotiation: "Would you be available for a brief call next week to discuss terms?"
- Relationship: "I would be happy to prepare a proposal tailored to your requirements."

Email length should be:
- Cold/First contact: Short (3-4 paragraphs)
- Follow-up: Short to medium (4-5 paragraphs)
- Negotiation: Medium (5-6 paragraphs)
- Relationship/Long-term: Medium to long (6-8 paragraphs)

SIGNATURE:
Always close with:

Best regards,

Fahril F.
Export Relations
PT Nandara Nusa Montierra
marketing@nandaranusamontierra.com
+62 852 8348 0478
www.nandaranusamontierra.com

---RECOMMENDED_ATTACHMENTS---
[List 2-4 specific attachment recommendations relevant to this email type]

Example:
- Company Profile (PDF)
- Product Catalogue for ${productToFocus}
- Latest Price List FOB Belawan
- Certificate of Analysis (COA)
    `;

    try {
      const result = await this.generateContent(prompt, { 
        systemPrompt: `You are Fahril F., Export Relations at PT Nandara Nusa Montierra, a premium Indonesian coffee exporter. You write professional B2B coffee export emails. You write naturally, like a real human export professional. You never sound like AI. You never use marketing cliches. You are direct, honest, and knowledgeable about Indonesian specialty coffee.

Format your response exactly with these section headers:
---SUBJECT_ALTERNATIVES---
---EMAIL_BODY---
---RECOMMENDED_ATTACHMENTS---` 
      });
      
      // Parse the structured response
      const sanitized = this.sanitizeDraft(result);
      const parsed = this.parseEmailResponse(sanitized);
      return parsed;
    } catch (error) {
      return this.getFallbackDraft(importerName, emailType, extraParams);
    }
  }

  /**
   * Returns email type-specific instructions for the AI prompt
   */
  private static getEmailTypeInstructions(
    emailType: string, 
    hasHistory: boolean,
    extraParams: Record<string, any>
  ): string {
    const instructions: Record<string, string> = {
      FIRST_CONTACT: `PURPOSE: First introduction to a potential buyer.
STRATEGY: Be compelling but not pushy. Introduce PT Nandara Nusa Montierra as a direct Indonesian specialty coffee exporter. Highlight what makes us different — we work directly with smallholder cooperatives, we control quality from cherry to export.
KEY POINTS: Mention specific origin expertise (Gayo Highlands, Toraja, Java Preanger). Offer to send product information or samples. Keep it brief and warm.
CTA SOFT: "Would you be interested in learning more about our current crop availability?"`,

      FOLLOW_UP_1: `PURPOSE: Gentle follow-up after no response to first email.
STRATEGY: Reference the previous email briefly. Add one new piece of value — maybe a recent cupping score, a harvest update, or a time-sensitive note about limited stock.
KEY POINTS: Do not repeat the entire first email. Add fresh information. Keep it shorter than the first email.
CTA SOFT: "May I send you a sample box for your team to evaluate?"`,

      FOLLOW_UP_2: `PURPOSE: Final follow-up before moving on.
STRATEGY: Brief and respectful. Acknowledge they are busy. Offer one last clear value proposition. Leave the door open for future contact.
KEY POINTS: Very short. Respectful tone. No pressure.
CTA SOFT: "If now is not the right time, I would be happy to reconnect during your next sourcing cycle."`,

      SAMPLE_OFFER: `PURPOSE: Offer to send product samples now that buyer has expressed interest.
STRATEGY: Confirm the specific product they want to sample. Explain how samples are prepared (vacuum sealed, freshly roasted or green as requested). Ask for shipping details.
KEY POINTS: Be specific about what you will send (product, weight, format). Mention that samples are prepared fresh from current harvest.
CTA SOFT: "Could you please share your shipping address and DHL/FedEx account number so I can arrange dispatch?"`,

      SAMPLE_SENT: `PURPOSE: Notify buyer that samples have been dispatched.
STRATEGY: Confirm shipment details (courier, tracking number, contents). Set expectations for delivery timeline. Offer assistance.
KEY POINTS: Include tracking number. Mention what is in the package. Give expected delivery date.
CTA SOFT: "I would love to hear your team's thoughts after cupping. Would you like me to schedule a call to discuss?"`,

      SAMPLE_FEEDBACK: `PURPOSE: Follow up after sample has been delivered and hopefully cupped.
STRATEGY: Ask for feedback naturally. Offer additional information if needed. Move conversation toward ordering.
KEY POINTS: Reference that the sample was sent. Ask about their cupping experience. Offer to adjust or provide more details.
CTA SOFT: "Did your roasting team have a chance to evaluate the sample? I would be happy to provide more details or adjust based on your preferences."`,

      QUOTATION: `PURPOSE: Send a formal quotation after sample approval.
STRATEGY: Reference the positive feedback or cupping results. Present pricing and terms clearly. Create gentle urgency if applicable.
KEY POINTS: Mention the price, incoterm (FOB/CIF), quantity, validity period. Reference the product they approved.
CTA SOFT: "This offer is valid until [date]. Would you like to proceed with a trial order to confirm quality before committing to a full container?"`,

      NEGOTIATION: `PURPOSE: Respond to buyer's counteroffer or negotiate terms.
STRATEGY: Be flexible but protect margins. Offer alternatives (different volumes, payment terms, incoterms). Find win-win.
KEY POINTS: Acknowledge their position. Offer structured options. Maintain professionalism.
CTA SOFT: "Would adjusting the volume or shipping terms work better for your current procurement cycle?"`,

      PRICE_UPDATE: `PURPOSE: Inform existing buyer of price changes.
STRATEGY: Be transparent about market factors. Give advance notice. Offer to lock current pricing if possible.
KEY POINTS: Explain market reasons (C-price movement, harvest yields, freight). Give clear new pricing. Offer a window at current pricing.
CTA SOFT: "I can hold the current pricing for orders confirmed within the next 7 days."`,

      NEW_HARVEST: `PURPOSE: Announce new crop availability to existing contacts.
STRATEGY: Create excitement about the new harvest. Share cupping notes and quality highlights. Offer early access.
KEY POINTS: Mention harvest timing, cup scores, flavor notes. Compare to previous crop if relevant.
CTA SOFT: "Would you like to be among the first to receive a pre-shipment sample of the new crop?"`,

      REENGAGEMENT: `PURPOSE: Reconnect with inactive buyer (30+ days no contact).
STRATEGY: Warm and gentle. Reference the past relationship. Share something new (new crop, new certification, market update). No hard sell.
KEY POINTS: Acknowledge time passed. Add value — new information, not just a check-in. Keep it light.
CTA SOFT: "It has been some time. I wanted to share our latest harvest results in case your sourcing needs have opened up."`,

      MEETING_THANKYOU: `PURPOSE: Thank buyer after a meeting or expo interaction.
STRATEGY: Personal and specific. Reference something discussed in the meeting. Provide any promised follow-up information.
KEY POINTS: Mention specific discussion points. Deliver on any promises made during the meeting.
CTA SOFT: "As discussed, I have attached the information we covered. Let me know if you would like to arrange a cupping session."`,

      SHIPMENT_READY: `PURPOSE: Notify that order is ready for shipment.
STRATEGY: Professional and logistical. Confirm order details, shipping timeline, and documentation status.
KEY POINTS: Order reference, container number, ETD, ETA. Documents prepared (BL, COO, Phyto, Invoice).
CTA SOFT: "Please confirm your shipping instructions so we can proceed with the booking."`,

      SHIPMENT_SENT: `PURPOSE: Confirm shipment has departed.
STRATEGY: Provide shipping confirmation and tracking. Reassure on quality and documentation.
KEY POINTS: Vessel name, departure date, estimated arrival. BL copy attached.
CTA SOFT: "Our team will monitor the shipment and keep you updated on arrival status."`,

      CONTRACT_REMINDER: `PURPOSE: Remind about upcoming contract renewal or volume commitment.
STRATEGY: Professional reminder. Emphasize partnership value. Offer to discuss terms for next cycle.
KEY POINTS: Reference current contract terms. Mention upcoming renewal date. Propose discussion.
CTA SOFT: "Would you like to schedule a discussion about the terms for the upcoming contract period?"`,

      LONG_TERM_PARTNERSHIP: `PURPOSE: Propose long-term partnership to established buyer.
STRATEGY: Relationship-focused. Mutual benefit. Volume commitments with preferential terms.
KEY POINTS: Proposed volume, pricing structure, commitment period. Benefits of partnership approach.
CTA SOFT: "I would be happy to prepare a proposal for your team to review at your convenience."`
    };

    return instructions[emailType] || instructions.FIRST_CONTACT;
  }

  /**
   * Parses the structured AI response into components
   */
  private static parseEmailResponse(text: string): {
    subject: string;
    subjects: string[];
    body: string;
    attachments: string;
  } {
    let subjects: string[] = [];
    let body = '';
    let attachments = '';

    // Extract subject alternatives section
    const subjectMatch = text.match(/---SUBJECT_ALTERNATIVES---\n([\s\S]*?)(?=---EMAIL_BODY---)/);
    if (subjectMatch) {
      const subjectText = subjectMatch[1].trim();
      subjects = subjectText.split('\n')
        .map(line => line.replace(/^Subject\s*\d+\s*:\s*/i, '').trim())
        .filter(line => line.length > 0);
    }

    // Extract email body
    const bodyMatch = text.match(/---EMAIL_BODY---\n([\s\S]*?)(?=---RECOMMENDED_ATTACHMENTS---)/);
    if (bodyMatch) {
      body = bodyMatch[1].trim();
    }

    // Extract attachment recommendations
    const attachMatch = text.match(/---RECOMMENDED_ATTACHMENTS---\n([\s\S]*)/);
    if (attachMatch) {
      attachments = attachMatch[1].trim();
    }

    // Use first subject as primary or generate one
    const primarySubject = subjects[0] || `Partnership Inquiry: Premium Indonesian Coffee`;

    return {
      subject: primarySubject,
      subjects: subjects.slice(0, 5),
      body: body || this.getFallbackBody(),
      attachments: attachments || 'Company Profile (PDF)\nProduct Catalogue\nPrice List FOB Belawan'
    };
  }

  private static getFallbackBody(): string {
    return `Dear Procurement Team,

I hope this message finds you well.

My name is Fahril F. from PT Nandara Nusa Montierra, an Indonesian specialty coffee exporter based in Jakarta. We work directly with smallholder cooperatives across the Gayo Highlands, Toraja, Java Preanger, and Flores to bring single-origin specialty coffee to the global market.

I would be pleased to share our current crop availability and price list with you. We take pride in our quality control — every batch is hand-sorted, moisture-tested, and packed in GrainPro hermetic lining to ensure freshness during transit.

Would you be interested in receiving our latest offers?

Best regards,

Fahril F.
Export Relations
PT Nandara Nusa Montierra
marketing@nandaranusamontierra.com
+62 852 8348 0478
www.nandaranusamontierra.com`;
  }

  static getFallbackDraft(importerName: string, emailType: string, extraParams?: Record<string, any>): {
    subject: string;
    subjects: string[];
    body: string;
    attachments: string;
  } {
    const contactName = extraParams?.contactName || 'Procurement Team';
    const product = extraParams?.coffeeInterest || 'Premium Indonesian Coffee';
    return {
      subject: `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`,
      subjects: [
        `Partnership Inquiry: Premium Indonesian Coffee for ${importerName}`,
        `Exploring a Coffee Partnership with ${importerName}`,
        `Indonesian Specialty Coffee — Direct from Origin to ${importerName}`,
        `${product} — Sourcing Opportunity for ${importerName}`,
        `Direct Trade Coffee: ${importerName} & PT Nandara Nusa Montierra`
      ],
      body: `Dear ${contactName},

I hope this message finds you well.

My name is Fahril F. from PT Nandara Nusa Montierra, an Indonesian specialty coffee exporter. We work directly with smallholder farming cooperatives across Indonesia's premier growing regions, including the Gayo Highlands, Toraja, Java Preanger, and Flores.

What sets us apart is our commitment to quality at every stage. Each lot is hand-sorted, moisture-tested, and packed in GrainPro hermetic lining to preserve freshness during ocean transit. We provide full traceability from farm to port.

Our current inventory includes single-origin Arabica and Fine Robusta lots scoring 83-87 SCA points. We would be delighted to send you a pre-shipment sample for your team's evaluation.

Would you be interested in receiving our current price list and availability?

Best regards,

Fahril F.
Export Relations
PT Nandara Nusa Montierra
marketing@nandaranusamontierra.com
+62 852 8348 0478
www.nandaranusamontierra.com`,
      attachments: `Company Profile (PDF)\nProduct Catalogue\nLatest Price List FOB Belawan\nCertificate of Analysis (COA)`
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
    const TIMEOUT_MS = 25000; // 25 second timeout to prevent hanging
    try {
      logger.info('Attempting AI generation with Gemini...');
      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      
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

      // Race Gemini against a timeout to prevent indefinite hanging on Render
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timed out after 25s')), TIMEOUT_MS)
        )
      ]);

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