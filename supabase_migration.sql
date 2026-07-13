
-- Supabase Migration Script - CIIS Database
-- ================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ImporterStatus" AS ENUM ('NEW', 'CONTACTED', 'REPLIED', 'SAMPLE_REQUESTED', 'SAMPLE_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
CREATE TYPE "SampleStatus" AS ENUM ('INQUIRY', 'QUALIFICATION', 'REQUESTED', 'QUOTED', 'PAYMENT_CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'FEEDBACK_RECEIVED', 'COMMERCIAL_ORDER', 'CANCELLED');
CREATE TYPE "SampleFormat" AS ENUM ('GREEN_BEANS', 'ROASTED_BEANS', 'GROUND_COFFEE');
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "QuotationType" AS ENUM ('SAMPLE', 'COMMERCIAL');
CREATE TYPE "ShipmentType" AS ENUM ('AIR_FREIGHT', 'LCL_SHIPMENT', 'FCL_SHIPMENT', 'SAMPLE_ORDER');
CREATE TYPE "PackagingOption" AS ENUM ('VACUUM_GRAINPRO_5KG', 'GRAINPRO_10_15KG', 'GRAINPRO_JUTE_30_60KG');
CREATE TYPE "PaymentTerms" AS ENUM ('TT_50_DEPOSIT_50_BEFORE_SHIPMENT', 'LC_AT_SIGHT');
CREATE TYPE "Incoterm" AS ENUM ('FOB', 'CIF', 'EXW', 'CNF');
CREATE TYPE "EmailValidationStatus" AS ENUM ('VALID', 'INVALID', 'CATCH_ALL', 'UNKNOWN');
CREATE TYPE "LeadScore" AS ENUM ('A+', 'A', 'B+', 'B', 'C');
CREATE TYPE "DiscoveryStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "EmailStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'RECEIVED', 'BOUNCED');
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Importer
CREATE TABLE "Importer" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "linkedin" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "coffeeType" TEXT,
    "greenBeanInterest" BOOLEAN NOT NULL DEFAULT false,
    "roastedBeanInterest" BOOLEAN NOT NULL DEFAULT false,
    "leadScore" "LeadScore",
    "confidenceScore" DOUBLE PRECISION,
    "status" "ImporterStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "emailValidation" "EmailValidationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "emailValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Importer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Contact
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "importerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Email
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "importerId" TEXT,
    "messageId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'DRAFT',
    "direction" "EmailDirection" NOT NULL DEFAULT 'OUTBOUND',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Sample
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "importerId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "format" "SampleFormat" NOT NULL DEFAULT 'GREEN_BEANS',
    "weight" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "courier" TEXT,
    "destination" TEXT NOT NULL,
    "status" "SampleStatus" NOT NULL DEFAULT 'INQUIRY',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shipmentDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "feedback" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Quotation
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "importerId" TEXT NOT NULL,
    "type" "QuotationType" NOT NULL DEFAULT 'COMMERCIAL',
    "shipmentType" "ShipmentType" NOT NULL DEFAULT 'LCL_SHIPMENT',
    "packaging" "PackagingOption" NOT NULL DEFAULT 'GRAINPRO_JUTE_30_60KG',
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'TT_50_DEPOSIT_50_BEFORE_SHIPMENT',
    "incoterm" "Incoterm" NOT NULL DEFAULT 'FOB',
    "product" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeDays" INTEGER NOT NULL DEFAULT 21,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Activity
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importerId" TEXT,
    "supplierId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Note
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importerId" TEXT,
    "supplierId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importerId" TEXT,
    "supplierId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Attachment
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "importerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Country
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LeadSource
CREATE TABLE "LeadSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Setting
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DiscoverySession
CREATE TABLE "DiscoverySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "status" "DiscoveryStatus" NOT NULL DEFAULT 'PENDING',
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "importerIds" TEXT NOT NULL,
    "resultsJson" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiscoverySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Supplier
CREATE TABLE "Supplier" (
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

-- CreateTable: SupplierContact
CREATE TABLE "SupplierContact" (
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

-- Create Unique Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Importer_website_key" ON "Importer"("website");
CREATE UNIQUE INDEX "Importer_email_key" ON "Importer"("email");
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");
CREATE UNIQUE INDEX "LeadSource_name_key" ON "LeadSource"("name");
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
CREATE UNIQUE INDEX "Supplier_website_key" ON "Supplier"("website");
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- Add Foreign Key Constraints
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Email" ADD CONSTRAINT "Email_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_importerId_fkey" FOREIGN KEY ("importerId") REFERENCES "Importer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiscoverySession" ADD CONSTRAINT "DiscoverySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
