import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

// Use DIRECT_DATABASE_URL for direct PostgreSQL connection (bypass PgBouncer)
// FALLBACK to DATABASE_URL if not available
const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

// Parse the connection URL to extract SSL mode
let sslMode = 'require';
try {
  const urlObj = new URL(connectionUrl);
  sslMode = urlObj.searchParams.get('sslmode') || 'require';
} catch {
  // If URL parsing fails, default to SSL required
  sslMode = 'require';
}

// Create a pg Pool with explicit SSL configuration
// Supabase uses self-signed certificates, so we need rejectUnauthorized: false
const pool = new pg.Pool({
  connectionString: connectionUrl,
  ssl: sslMode !== 'disable'
    ? {
        rejectUnauthorized: false, // Allow self-signed Supabase SSL certificate
      }
    : false,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});