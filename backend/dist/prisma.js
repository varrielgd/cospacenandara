"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Prefer DIRECT_URL (direct Postgres) at runtime to avoid PgBouncer transaction-pooling
// prepared-statement issues. FALLBACK to DATABASE_URL if DIRECT_URL is not provided.
const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
exports.prisma = new client_1.PrismaClient({
    datasources: { db: { url: connectionUrl } }
});
//# sourceMappingURL=prisma.js.map