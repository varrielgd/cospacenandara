"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg = __importStar(require("pg"));
// Use DIRECT_DATABASE_URL for direct PostgreSQL connection (bypass PgBouncer)
// FALLBACK to DATABASE_URL if not available
const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';
// Parse the connection URL to extract SSL mode
let sslMode = 'require';
try {
    const urlObj = new URL(connectionUrl);
    sslMode = urlObj.searchParams.get('sslmode') || 'require';
}
catch {
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
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({
    adapter,
});
//# sourceMappingURL=prisma.js.map