-- CreateTable: BuyerIntelligence (website analysis results)
CREATE TABLE IF NOT EXISTS "BuyerIntelligence" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "companyProfile" TEXT,
    "products" TEXT,
    "brands" TEXT,
    "roastingCapability" TEXT,
    "importingActivity" TEXT,
    "sustainabilityInfo" TEXT,
    "sourcingInfo" TEXT,
    "targetMarket" TEXT,
    "businessPersonality" TEXT,
    "companySize" TEXT,
    "estimatedBuyingVolume" TEXT,
    "possibleDecisionMaker" TEXT,
    "buyingInterestScore" INTEGER DEFAULT 50,
    "riskScore" INTEGER DEFAULT 50,
    "opportunityScore" INTEGER DEFAULT 50,
    "rawAnalysis" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerIntelligence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BuyerIntelligence_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BuyerIntelligence_importerId_key" ON "BuyerIntelligence"("importerId");

-- CreateTable: ProductMatch (AI product matching results)
CREATE TABLE IF NOT EXISTS "ProductMatch" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "matchLevel" TEXT NOT NULL DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    "matchReason" TEXT,
    "confidenceScore" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMatch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductMatch_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: EmailMemory (persistent history of all AI email generations)
CREATE TABLE IF NOT EXISTS "EmailMemory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "importerId" TEXT NOT NULL,
    "emailId" TEXT,
    "emailType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" TEXT,
    "aiStrategy" TEXT,
    "aiReason" TEXT,
    "confidenceScore" INTEGER DEFAULT 50,
    "selectedEmailType" TEXT,
    "sequenceStep" INTEGER DEFAULT 0,
    "nextRecommendedAction" TEXT,
    "buyerIntelligenceSummary" TEXT,
    "productMatchSummary" TEXT,
    "metadata" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMemory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EmailMemory_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailMemory_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmailMemory_importerId_idx" ON "EmailMemory"("importerId");
CREATE INDEX IF NOT EXISTS "EmailMemory_emailType_idx" ON "EmailMemory"("emailType");
CREATE INDEX IF NOT EXISTS "EmailMemory_generatedAt_idx" ON "EmailMemory"("generatedAt");