import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";
import { createProxyMiddleware } from "http-proxy-middleware";

// Load environment variables
dotenv.config();

// Lazily initialize standard Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Built-in Premium Specialty Coffee Importer Database (used as an extremely high-quality generator & fallback)
const HIGH_QUALITY_COFFEE_IMPORTERS: Array<{
  companyName: string;
  website: string;
  country: string;
  city: string;
  contactPage: string;
  email: string;
  phone: string;
  linkedin: string;
  leadType: string;
  leadScore: 'A' | 'B' | 'C';
  notes: string;
  analysisType: string;
  analysisFocus: string;
  analysisPotential: string;
  analysisMatch: string;
}> = [];

const REMOVED_DUMMY_ARRAY = [
  {
    companyName: "List & Beisler GmbH",
    website: "https://www.list-beisler.de",
    country: "Germany",
    city: "Hamburg",
    contactPage: "https://www.list-beisler.de/contact",
    email: "greencoffee@list-beisler.de",
    phone: "+49 40 370 910",
    linkedin: "https://linkedin.com/company/list-&-beisler-gmbh",
    leadType: "Green Coffee Importer",
    leadScore: "A",
    notes: "Historically significant green importer. Heavy focus on specialty micro-lots. Strong target for Gayo G1 and Toraja.",
    analysisType: "Specialty Green Coffee Importer",
    analysisFocus: "Traceable specialty green coffee beans directly sourced",
    analysisPotential: "High - Imports thousands of tons of high-grade Arabica annually",
    analysisMatch: "Aceh Gayo Grade 1, Toraja, Flores Bajawa"
  },
  {
    companyName: "Benecke Coffee GmbH",
    website: "https://www.benecke-coffee.com",
    country: "Germany",
    city: "Hamburg",
    contactPage: "https://www.benecke-coffee.com/contact",
    email: "coffee@benecke-coffee.com",
    phone: "+49 40 318 0700",
    linkedin: "https://linkedin.com/company/benecke-coffee",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Specializes in high scoring Indonesian coffees. Consistently sources Sumatran Mandheling.",
    analysisType: "Specialty Importer",
    analysisFocus: "Organically grown and Rainforest Alliance certified green coffee",
    analysisPotential: "High - Sells exclusively to premium small-to-medium European roasters",
    analysisMatch: "Gayo Wild Natural, Lintong Organic"
  },
  {
    companyName: "Cafe Imports Europe",
    website: "https://www.cafeimports.com",
    country: "United Kingdom",
    city: "London",
    contactPage: "https://www.cafeimports.com/europe/contact",
    email: "sales@cafeimports.com",
    phone: "+44 20 8697 5544",
    linkedin: "https://linkedin.com/company/cafe-imports",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Global power-house in specialty importer domain. Perfect candidate for Flores Bajawa and Sulawesi Toraja.",
    analysisType: "Specialty Coffee Importer",
    analysisFocus: "Extremely educational, origin-focused custom microlots",
    analysisPotential: "Exceptional - Active warehouse operations in EU & UK",
    analysisMatch: "Java Arabica, Aceh Gayo G1, Gayo Wild Natural"
  },
  {
    companyName: "Royal Coffee Inc.",
    website: "https://royalcoffee.com",
    country: "United States",
    city: "Emeryville",
    contactPage: "https://royalcoffee.com/contact-us",
    email: "decaf@royalcoffee.com",
    phone: "+1 510-652-3115",
    linkedin: "https://linkedin.com/company/royal-coffee-inc-",
    leadType: "Green Coffee Importer",
    leadScore: "A",
    notes: "Legendary importer active since 1978. Offers extensive educational materials. High potential for single-origin offerings.",
    analysisType: "Major Green Coffee Importer",
    analysisFocus: "Global specialty Arabica with premium direct trade relationships",
    analysisPotential: "Exceptional - Global distribution from US West/East Coast",
    analysisMatch: "Aceh Gayo G1, Mandheling Double Picked, Lintong"
  },
  {
    companyName: "Maruyama Coffee Co.",
    website: "https://www.maruyamacoffee.com",
    country: "Japan",
    city: "Nagano",
    contactPage: "https://www.maruyamacoffee.com/en/contact",
    email: "procurement@maruyamacoffee.com",
    phone: "+81 267-26-5556",
    linkedin: "https://linkedin.com/company/maruyama-coffee",
    leadType: "Coffee Roaster",
    leadScore: "B",
    notes: "World-class roaster. Owner is a legendary WBC judge. Highly selective of origin. Prefers elegant, clean cup profiles.",
    analysisType: "Boutique Roaster & Importer",
    analysisFocus: "Super-specialty single-origins with custom micro-lot scores exceeding 86+",
    analysisPotential: "Medium-High - Low volume but premium pricing margins",
    analysisMatch: "Gayo Wild Natural, Toraja Specialty Micro-lot"
  },
  {
    companyName: "Wataru & Co., Ltd.",
    website: "https://www.wataru.co.jp",
    country: "Japan",
    city: "Tokyo",
    contactPage: "https://www.wataru.co.jp/contact-us",
    email: "import@wataru.co.jp",
    phone: "+81 3-3503-8321",
    linkedin: "https://linkedin.com/company/wataru",
    leadType: "Green Coffee Importer",
    leadScore: "A",
    notes: "One of the oldest and largest specialty green dealers in Japan. Sells to thousands of Japanese specialty roasters.",
    analysisType: "Major National Distributor / Importer",
    analysisFocus: "Broad origin portfolio emphasizing Grade 1 arabica and certified beans",
    analysisPotential: "Exceptional - High volume buyer for Mandheling, Lintong and Java",
    analysisMatch: "Mandheling, Lintong, Java Arabica"
  },
  {
    companyName: "Cofinet Pty Ltd",
    website: "https://cofinet.com.au",
    country: "Australia",
    city: "Sydney",
    contactPage: "https://cofinet.com.au/pages/contact",
    email: "greencoffee@cofinet.com.au",
    phone: "+61 2 9158 9005",
    linkedin: "https://linkedin.com/company/cofinet",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Passionate direct-trade specialists. Originally focused on Colombia, expanded to Southeast Asia. Keen on experimental processing.",
    analysisType: "Direct Trade Importer",
    analysisFocus: "Anaerobic fermentations, naturals, honey-processed high-end microlots",
    analysisPotential: "High - Feeds the hyper-intensive Aussie specialty market",
    analysisMatch: "Gayo Wild Natural, Flores Bajawa Anaerobic"
  },
  {
    companyName: "Falcon Specialty",
    website: "http://www.falconspecialty.com",
    country: "United Kingdom",
    city: "Harrogate",
    contactPage: "http://www.falconspecialty.com/contact",
    email: "info@falconspecialty.com",
    phone: "+44 1423 566411",
    linkedin: "https://linkedin.com/company/falcon-specialty",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Highly focused on ethical sourcing, transparency, and carbon offset tracking.",
    analysisType: "Specialty Importer",
    analysisFocus: "Complete micro-lot transparency and local farming community development",
    analysisPotential: "High - Supply chain leaders for British/Scandinavian roasters",
    analysisMatch: "Aceh Gayo Organic, Flores Bajawa Direct Trade"
  },
  {
    companyName: "Trabocca B.V.",
    website: "https://www.trabocca.com",
    country: "Netherlands",
    city: "Amsterdam",
    contactPage: "https://www.trabocca.com/contact",
    email: "buying@trabocca.com",
    phone: "+31 20 522 2011",
    linkedin: "https://linkedin.com/company/trabocca",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Leader in specialty sourcing. Originally famous for Ethiopian coffees, has high-grade Indonesian division.",
    analysisType: "Premium Specialty Importer",
    analysisFocus: "Elegantly processed organic Arabicas with cupping scores 85+",
    analysisPotential: "Exceptional - Huge logistic hubs in Europe",
    analysisMatch: "Gayo Wild Natural, Lintong, Toraja"
  },
  {
    companyName: "Nippon Coffee Trading Co.",
    website: "https://www.nct.co.jp",
    country: "Japan",
    city: "Osaka",
    contactPage: "https://www.nct.co.jp/contact",
    email: "coffee@nct.co.jp",
    phone: "+81 6-6443-4401",
    linkedin: "https://linkedin.com/company/nippon-coffee-trading",
    leadType: "Coffee Trading Company",
    leadScore: "A",
    notes: "Established trader handling both green beans and commercial machinery. Perfect bulk specialty targets.",
    analysisType: "Commercial & Specialty Importer",
    analysisFocus: "Sourcing for high-yield roasters and automatic product packaging",
    analysisPotential: "Exceptional - Large industrial accounts",
    analysisMatch: "Mandheling Grade 1, Java Arabica"
  },
  {
    companyName: "Campos Coffee",
    website: "https://camposcoffee.com",
    country: "Australia",
    city: "Melbourne",
    contactPage: "https://camposcoffee.com/contact-us",
    email: "sales@camposcoffee.com",
    phone: "+61 2 9516 3300",
    linkedin: "https://linkedin.com/company/campos-coffee",
    leadType: "Coffee Roaster",
    leadScore: "B",
    notes: "High quality specialty roasting brand. Acquired by JDE Peet's but maintains premium boutique operations.",
    analysisType: "Commercial Roaster & Brand",
    analysisFocus: "Consistent specialty house-blends and premium single origins",
    analysisPotential: "Medium - Focused on roasting and domestic distribution",
    analysisMatch: "Aceh Gayo, Flores Bajawa"
  },
  {
    companyName: "Singapour Brew Rovers",
    website: "https://www.brewrovers.sg",
    country: "Singapore",
    city: "Singapore",
    contactPage: "https://www.brewrovers.sg/contact",
    email: "greencoffee@brewrovers.sg",
    phone: "+65 6744 1221",
    linkedin: "https://linkedin.com/company/brew-rovers",
    leadType: "Private Label Coffee Brand",
    leadScore: "B",
    notes: "Boutique specialty aggregator in Southeast Asia. Acts as a bridge to other Asian micro-cafes.",
    analysisType: "Private Label & Café Roaster",
    analysisFocus: "Indonesian origins due to geographic proximity and demand",
    analysisPotential: "Medium - High frequency buying in slightly smaller quantities",
    analysisMatch: "Java Arabica, Mandheling, Toraja"
  },
  {
    companyName: "Taiwan Coffee Harvest Corp. (哈維斯特咖啡)",
    website: "https://www.coffeeharvest.tw",
    country: "Taiwan",
    city: "Taipei",
    contactPage: "https://www.coffeeharvest.tw/contact",
    email: "procurement@coffeeharvest.tw",
    phone: "+886 2-2788-3456",
    linkedin: "https://linkedin.com/company/taiwan-coffee-harvest",
    leadType: "Specialty Coffee Importer",
    leadScore: "A",
    notes: "Leading green importer catering to Taiwan's rapid specialty shop expansion. Exceptionally interested in Java Preanger and Gayo Honey micros.",
    analysisType: "Premium Specialty Importer",
    analysisFocus: "Micro-lots, high-altitude organic Arabicas & rare natural processing",
    analysisPotential: "High - Distributes to over 40+ high-end roasters in Taipei & Taichung",
    analysisMatch: "Java Preanger, Sumatra Gayo Honey"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy all /api requests to the backend server on port 4000
  // Place this BEFORE any other app.use or app.get/post for /api
  app.use("/api", createProxyMiddleware({
    target: "http://localhost:4000",
    changeOrigin: true,
    ws: true, // support websockets
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(502).send("Bad Gateway: Backend server might be down.");
    }
  }));

  app.use(express.json());

  app.post("/api/leads/discover", async (req, res) => {
    const { country, region, importerType, count = 5 } = req.body;

    if (!country) {
      return res.status(400).json({ error: "Country is a required parameter." });
    }

    const requestedCount = Number(count) || 5;

    // We check if API key exists. If NOT, we fallback to our highly relevant dataset
    const apiKeyExists = !!process.env.GEMINI_API_KEY;

    if (!apiKeyExists) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is missing",
        message: "Your GEMINI_API_KEY is not configured in the backend environment. Please specify a valid API key in your AI Studio project settings to search the global specialty market."
      });
    }

    try {
      const ai = getAI();
      const importerContext = importerType || "Green Coffee / Specialty Coffee Importer or Specialty Roaster";

      const prompt = `You are an elite Indonesian Specialty Coffee export research bot for Nandara Nusa Montierra.
CRITICAL MANDATE: REAL DATA ONLY POLICY. You MUST COLLECT ONLY publicly available, verifiable real-world business information.
DO NOT fabricate, simulate, or mock any data under any circumstances. If an importer is not real, or details cannot be verified, DO NOT return them.
If certain fields like phone, email, contactPage, or linkedin cannot be verified, you MUST leave the field entirely blank ("") - DO NOT make up placeholders or domains like "company.com" or "sales@company.com" if they are not real and published.

FILTER INSTRUCTIONS (LEAD QUALITY RULE):
- PRIORITIZE: Green Coffee Importers, Specialty Coffee Importers, Coffee Trading Companies, Roasters buying origin green coffee, and Specialty coffee distributors.
- AVOID: Cafes only, Coffee shops only, Restaurants, and general retail stores. We only want importer businesses that buy green beans in bulk container-loads or pallets.

Determine exactly up to ${requestedCount} REAL B2B coffee importing/distributing entities in country: "${country}", region: "${region || "Any"}", matching category "${importerContext}".

Nandara Nusa Montierra’s key specialty export products are:
- Aceh Gayo Grade 1
- Gayo Wild Natural
- Sumatra Mandheling
- Sumatra Lintong
- Java Arabica
- Flores Bajawa
- Sulawesi Toraja

For each discovered contact/company:
1. Provide their real company name, website, verified location, email, and available phone/social networks.
2. Determine their recommended premium matched product from the Nandara list.
3. Write a deep-dive analysis explanation ('analysisWhy') describing exactly WHY this specific lead matches the recommended product.
4. Set Confidence Ratings ('High', 'Medium', 'Low') for fields:
   - websiteConfidence: How confident are we the website is active and belongs to this real active importer?
   - emailConfidence: How confident are we the procurement contact email is real, public, and active?
   - importerConfidence: How confident are we this business is a genuine B2B importer/trading house of raw green coffee, rather than a home coffee roaster or local cafe?

You must return a RAW JSON array matching the schema below. No markdown or wrappers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                companyName: { type: Type.STRING },
                website: { type: Type.STRING },
                country: { type: Type.STRING },
                city: { type: Type.STRING },
                contactPage: { type: Type.STRING, description: "Contact us URL or empty string" },
                email: { type: Type.STRING, description: "Real publicly active procurement email like greencoffee@, buying@, coffee@, imports@, info@ or empty string" },
                phone: { type: Type.STRING, description: "Real international phone number or empty string" },
                linkedin: { type: Type.STRING, description: "Real public company LinkedIn URL or empty string" },
                leadType: { type: Type.STRING, description: "e.g., Specialty Coffee Importer, Coffee Trading Company" },
                leadScore: { type: Type.STRING, description: "Must be exactly 'A', 'B', or 'C'" },
                notes: { type: Type.STRING, description: "A detailed summary of their active coffee import interests" },
                analysisType: { type: Type.STRING, description: "Actual B2B operations profile" },
                analysisFocus: { type: Type.STRING, description: "What origins, processing methods, or certifications do they focus on?" },
                analysisPotential: { type: Type.STRING, description: "Import volume rating: Exceptional, High, Medium, or Low" },
                analysisMatch: { type: Type.STRING, description: "Recommended product from the Nandara list" },
                analysisWhy: { type: Type.STRING, description: "AI analysis explaining why the lead matches the product" },
                websiteConfidence: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" },
                emailConfidence: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" },
                importerConfidence: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" },
                importerProbability: { type: Type.STRING, description: "Must be 'High', 'Medium', or 'Low'" }
              },
              required: [
                "companyName", "website", "country", "city", "leadType", "leadScore", "notes", 
                "analysisType", "analysisFocus", "analysisPotential", "analysisMatch", "analysisWhy",
                "websiteConfidence", "emailConfidence", "importerConfidence", "importerProbability"
              ]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      let parsedData = JSON.parse(responseText.trim());

      // Format parsed results with local management ids
      const mappedLeads = parsedData.map((item: any, idx: number) => ({
        id: `lead_gen_${Date.now()}_${idx}`,
        dateAdded: new Date().toISOString().split("T")[0],
        companyName: item.companyName || "Unknown Importer",
        country: item.country || country,
        city: item.city || "",
        website: item.website || "",
        contactPage: item.contactPage || "",
        email: item.email || "",
        phone: item.phone || "",
        linkedin: item.linkedin || "",
        leadType: item.leadType || importerContext,
        leadScore: ["A", "B", "C"].includes(item.leadScore) ? item.leadScore : "B",
        status: "New Lead",
        lastContact: "Never Contacted",
        notes: item.notes || "Discovered via real AI scouting",
        analysisType: item.analysisType || item.leadType,
        analysisFocus: item.analysisFocus || "Specialty Single Origin",
        analysisPotential: item.analysisPotential || "Medium",
        analysisMatch: item.analysisMatch || "Aceh Gayo Grade 1",
        analysisWhy: item.analysisWhy || "Identified as active B2B importer in regional coffee guides.",
        websiteConfidence: ["High", "Medium", "Low"].includes(item.websiteConfidence) ? item.websiteConfidence : "Medium",
        emailConfidence: ["High", "Medium", "Low"].includes(item.emailConfidence) ? item.emailConfidence : "Medium",
        importerConfidence: ["High", "Medium", "Low"].includes(item.importerConfidence) ? item.importerConfidence : "Medium",
        importerProbability: ["High", "Medium", "Low"].includes(item.importerProbability) ? item.importerProbability : "Medium"
      }));

      return res.json({
        leads: mappedLeads,
        mode: "ai-live",
        message: `Successfully performed active intelligence lookup for ${country} via Gemini 3.5.`
      });

    } catch (err: any) {
      console.error("Gemini live discovery failed.", err);
      return res.status(500).json({
        error: "Active intelligence discovery failed",
        message: "The Gemini model was unable to complete the query: " + err.message
      });
    }
  });

  // API Route: Company Analysis & Scoring
  app.post("/api/leads/analyze", async (req, res) => {
    const { companyName, website, leadType, country, notes } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: "Company name is required." });
    }

    const apiKeyExists = !!process.env.GEMINI_API_KEY;

    if (!apiKeyExists) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is missing",
        message: "Analysis is unavailable. Please define your GEMINI_API_KEY in settings first."
      });
    }

    try {
      const ai = getAI();
      const prompt = `You are an expert coffee exporter and trade auditor for Nandara Nusa Montierra.
CRITICAL REAL DATA RULE: Evaluate ONLY real, active, verified business factors. Do not fabricate anything.

Verify and analyze this company:
Company: "${companyName}"
Website: "${website || "Not provided"}"
Initial Type: "${leadType || "Unknown"}"
Location: "${country || "Global"}"
Existing Notes: "${notes || ""}"

We supply premium Indonesian coffees: Aceh Gayo Grade 1, Gayo Wild Natural, Sumatra Mandheling, Sumatra Lintong, Java Arabica, Flores Bajawa, Sulawesi Toraja.

Determine these fields:
1. Business Type (Green Coffee Buyer, Importer, Specialty Roaster, Distributor, etc.)
2. Coffee Focus (buying volume, cup specialty scores etc.)
3. Import Potential (Exceptional, High, Medium, or Low)
4. Recommended Product Match from the Nandara list.
5. AI explanation of exactly WHY the lead matches the product.
6. Website, Email, and Importer confidence scores (High, Medium, or Low) based on available details.
7. Recalculated Lead Score (A, B, or C). Note: Priority A goes to green coffee bulk/pallet importers and commercial trading houses. B goes to independent roasters. C goes to retail cafes and shops.

Return a RAW JSON object matching the responseSchema format, with no markdown code blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysisType: { type: Type.STRING },
              analysisFocus: { type: Type.STRING },
              analysisPotential: { type: Type.STRING },
              analysisMatch: { type: Type.STRING },
              analysisWhy: { type: Type.STRING, description: "Detailed explanation of why this lead matches the product" },
              leadScore: { type: Type.STRING, description: "Must be A, B, or C" },
              notes: { type: Type.STRING },
              websiteConfidence: { type: Type.STRING, description: "High, Medium, or Low" },
              emailConfidence: { type: Type.STRING, description: "High, Medium, or Low" },
              importerConfidence: { type: Type.STRING, description: "High, Medium, or Low" },
              importerProbability: { type: Type.STRING, description: "High, Medium, or Low" }
            },
            required: ["analysisType", "analysisFocus", "analysisPotential", "analysisMatch", "analysisWhy", "leadScore", "notes", "websiteConfidence", "emailConfidence", "importerConfidence", "importerProbability"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());

      return res.json({
        ...parsed,
        isSimulated: false
      });

    } catch (err: any) {
      console.error("Gemini Analysis failed", err);
      return res.status(500).json({ error: "Company analysis failed: " + err.message });
    }
  });

  // API Route: Personalized Email Generation (Module 5)
  app.post("/api/leads/generate-email", async (req, res) => {
    const { companyName, country, leadType, coffeeInterest, contactName = "Procurement Director" } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: "Company Name is required for email generation." });
    }

    const apiKeyExists = !!process.env.GEMINI_API_KEY;

    if (!apiKeyExists) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is missing",
        message: "Email generation is unavailable without GEMINI_API_KEY."
      });
    }

    try {
      const ai = getAI();
      const productsList = coffeeInterest || "Aceh Gayo G1, Mandheling, Lintong, Toraja, Flores Bajawa, Java Arabica";

      const prompt = `You are Nandara Nusa Montierra, a prominent exporter of Indonesian Specialty Green Coffee.
Generate a highly personalized, professional business-to-business (B2B) outreach email to an international importer as defined below:
Company Name: "${companyName}"
Country: "${country || "Global"}"
Importers Business Type: "${leadType || "Green Coffee Professional"}"
Indonesian Products of Interest: "${productsList}"

Your tone must be:
- Elevated, premium, respectful, professional.
- Use natural business English.
- Strictly avoid spam words (such as "FREE GIFT NOW", "CHEAPEST PRICING", "UNBELIEVABLE OPPORTUNITY", multiple exclamation marks "!!!").
- Structure:
  1. Subject (with Indonesian specialty context & company relevance)
  2. Greeting (respectful)
  3. Personalized opening appreciating their craft/brand profile
  4. Introduction of Nandara Nusa Montierra as standard specialty green coffee direct exporter
  5. Tailored product recommendation referencing: ${productsList}
  6. Sample box offering (500g physical sample of Aceh Gayo G1 or choice origin, shipped via DHL/FedEx)
  7. Clear, zero-pressure Call-to-Action (asking if they'd like a sample lot)
  8. Elegant signature block.

Return standard JSON output matching the responseSchema format. No markdown tags.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());

      return res.json({
        subject: parsed.subject,
        body: parsed.body,
        isSimulated: false
      });

    } catch (err: any) {
      console.error("Gemini Email generator failed", err);
      return res.status(500).json({ error: "Email generation failed: " + err.message });
    }
  });

  // Serve static assets and SPA routing fallback depending on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Joined Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from /dist.");
  }

  // Start backend server in development mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend server on port 4000...");
    const backendProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(process.cwd(), "backend"),
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: "4000" }
    });

    backendProcess.on("error", (err) => {
      console.error("Failed to start backend server:", err);
    });

    process.on("exit", () => {
      backendProcess.kill();
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Coffee Importer Intelligence System (CIIS) running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal exception during server boot:", error);
});
