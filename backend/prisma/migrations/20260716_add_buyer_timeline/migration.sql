-- CreateTable: BuyerTimeline (chronological event log for each importer)
CREATE TABLE IF NOT EXISTS "BuyerTimeline" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'AI',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "score" INTEGER,
    "confidence" INTEGER DEFAULT 50,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerTimeline_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BuyerTimeline_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BuyerTimeline_importerId_idx" ON "BuyerTimeline"("importerId");
CREATE INDEX IF NOT EXISTS "BuyerTimeline_eventDate_idx" ON "BuyerTimeline"("eventDate" DESC);
CREATE INDEX IF NOT EXISTS "BuyerTimeline_eventType_idx" ON "BuyerTimeline"("eventType");

-- CreateTable: BuyerAiAnalysis (AI-generated buyer profile & relevance)
CREATE TABLE IF NOT EXISTS "BuyerAiAnalysis" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "industry" TEXT,
    "companyType" TEXT,
    "importerScore" INTEGER DEFAULT 50,
    "coffeeMatchScore" INTEGER DEFAULT 50,
    "specialtyPotential" TEXT,
    "originPreference" TEXT,
    "preferredProcessing" TEXT,
    "likelyBuyingVolume" TEXT,
    "decisionMakerConfidence" TEXT,
    "communicationStyle" TEXT,
    "estimatedPurchaseFrequency" TEXT,
    "riskLevel" TEXT DEFAULT 'Medium',
    "opportunityLevel" TEXT DEFAULT 'Medium',
    "relationshipScore" TEXT DEFAULT 'Cold',
    "nextBestAction" TEXT,
    "nextActionReason" TEXT,
    "productRelevance" JSONB,
    "rawAnalysis" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerAiAnalysis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BuyerAiAnalysis_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BuyerAiAnalysis_importerId_key" ON "BuyerAiAnalysis"("importerId");

-- CreateTable: BuyerReplyAnalysis (AI-classified buyer replies)
CREATE TABLE IF NOT EXISTS "BuyerReplyAnalysis" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "emailId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'Unknown',
    "intent" TEXT,
    "questions" TEXT,
    "concerns" TEXT,
    "urgency" TEXT DEFAULT 'Normal',
    "sentiment" TEXT DEFAULT 'Neutral',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerReplyAnalysis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BuyerReplyAnalysis_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuyerReplyAnalysis_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BuyerReplyAnalysis_importerId_idx" ON "BuyerReplyAnalysis"("importerId");
CREATE INDEX IF NOT EXISTS "BuyerReplyAnalysis_classification_idx" ON "BuyerReplyAnalysis"("classification");

-- CreateTable: WebsiteAnalysisCache (cached website analysis results)
CREATE TABLE IF NOT EXISTS "WebsiteAnalysisCache" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "businessModel" TEXT,
    "products" TEXT,
    "coffeeTypes" TEXT,
    "roastingCapability" TEXT,
    "importActivity" TEXT,
    "wholesale" TEXT,
    "retail" TEXT,
    "cafe" TEXT,
    "distributor" TEXT,
    "manufacturer" TEXT,
    "companySize" TEXT,
    "targetMarket" TEXT,
    "country" TEXT,
    "buyingPotential" TEXT,
    "importsGreenCoffee" BOOLEAN DEFAULT false,
    "certifications" TEXT,
    "brands" TEXT,
    "rawHtml" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteAnalysisCache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WebsiteAnalysisCache_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteAnalysisCache_importerId_key" ON "WebsiteAnalysisCache"("importerId");