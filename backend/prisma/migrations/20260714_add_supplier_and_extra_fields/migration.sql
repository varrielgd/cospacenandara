
-- Add missing columns to Importer table
ALTER TABLE "Importer" 
ADD COLUMN IF NOT EXISTS "state" TEXT,
ADD COLUMN IF NOT EXISTS "businessType" TEXT,
ADD COLUMN IF NOT EXISTS "primaryContactName" TEXT,
ADD COLUMN IF NOT EXISTS "primaryContactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "importLicenseNumber" TEXT,
ADD COLUMN IF NOT EXISTS "annualVolumeBags" INTEGER,
ADD COLUMN IF NOT EXISTS "estimatedBuyingCapacity" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetMoqBags" INTEGER,
ADD COLUMN IF NOT EXISTS "preferredIncoterm" "Incoterm",
ADD COLUMN IF NOT EXISTS "isRepeatClient" BOOLEAN NOT NULL DEFAULT false;

-- Create Supplier table
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "coffeeTypes" TEXT,
    "certifications" TEXT,
    "minimumOrderQty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- Create SupplierContact table
CREATE TABLE IF NOT EXISTS "SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- Add supplierId to Activity, Note, Task
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Note" ALTER COLUMN "importerId" DROP NOT NULL;
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;

-- Add indexes for Supplier
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_website_key" ON "Supplier"("website");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_email_key" ON "Supplier"("email");

-- Add foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SupplierContact_supplierId_fkey'
    ) THEN
        ALTER TABLE "SupplierContact"
            ADD CONSTRAINT "SupplierContact_supplierId_fkey"
            FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Activity_supplierId_fkey'
    ) THEN
        ALTER TABLE "Activity"
            ADD CONSTRAINT "Activity_supplierId_fkey"
            FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Note_supplierId_fkey'
    ) THEN
        ALTER TABLE "Note"
            ADD CONSTRAINT "Note_supplierId_fkey"
            FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Task_supplierId_fkey'
    ) THEN
        ALTER TABLE "Task"
            ADD CONSTRAINT "Task_supplierId_fkey"
            FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
