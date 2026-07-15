import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Use DIRECT_DATABASE_URL for direct PostgreSQL connection (bypass PgBouncer)
// FALLBACK to DATABASE_URL if not available
const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

const adapter = new PrismaPg(connectionUrl);

export const prisma = new PrismaClient({
  adapter,
});
