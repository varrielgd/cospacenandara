import { PrismaClient } from '@prisma/client';

// Prefer DIRECT_URL (direct Postgres) at runtime to avoid PgBouncer transaction-pooling
// prepared-statement issues. FALLBACK to DATABASE_URL if DIRECT_URL is not provided.
const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

export const prisma = new PrismaClient({
	datasources: { db: { url: connectionUrl } }
});
