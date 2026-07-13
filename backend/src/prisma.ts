import { PrismaClient } from '@prisma/client';

// Prefer DIRECT_DATABASE_URL (direct Postgres, bypass PgBouncer) at runtime 
// to avoid prepared statement issues. FALLBACK to DATABASE_URL if not available.
let connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

// If using DATABASE_URL (PgBouncer), add necessary query params
if (connectionUrl && !process.env.DIRECT_DATABASE_URL) {
  const url = new URL(connectionUrl);
  url.searchParams.set('pgbouncer', 'true');
  url.searchParams.set('statement_cache_size', '0');
  connectionUrl = url.toString();
}

export const prisma = new PrismaClient({
	datasources: { db: { url: connectionUrl } }
});
