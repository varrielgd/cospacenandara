-- Add missing cc/bcc columns to Email table for outbound email composer compatibility
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "cc" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "bcc" TEXT;
