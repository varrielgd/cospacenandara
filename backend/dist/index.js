"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.prisma = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables immediately
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = require("express-rate-limit");
const prisma_1 = require("./prisma");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_1.prisma; } });
const winston_1 = __importDefault(require("winston"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const importer_routes_1 = __importDefault(require("./routes/importer.routes"));
const sample_routes_1 = __importDefault(require("./routes/sample.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const discovery_routes_1 = __importDefault(require("./routes/discovery.routes"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const error_1 = require("./middleware/error");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 4000;
// Logger configuration
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple(),
        })
    ],
});
exports.logger = logger;
// Security Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cors_1.default)({
    origin: [
        'https://nandaracorporation.vercel.app',
        'https://nandaracorporation-8yzm3o79w.vercel.app',
        'https://cospace.nandaranusamontierra.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, compression_1.default)());
// Static files for uploads
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/importers', importer_routes_1.default);
app.use('/api/samples', sample_routes_1.default);
app.use('/api/quotations', quotation_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/discovery', discovery_routes_1.default);
app.use('/api/emails', email_routes_1.default);
app.use('/api/audit', audit_routes_1.default);
app.use('/api/suppliers', supplier_routes_1.default);
// Basic Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use(error_1.errorHandler);
// Initialize permanent admin user and handle demo users
const auth_1 = require("./config/auth");
async function initializeAdminUser() {
    try {
        const hashedPassword = await bcryptjs_1.default.hash('Ghfso#!@!5246!#!@g7', 10);
        for (const email of auth_1.ALLOWED_EMAILS) {
            const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
            const firstName = email.includes('nandara') ? 'Nandara' : 'Nanda';
            const lastName = email.includes('nandara') ? 'Nusa' : 'Latifani';
            if (!existing) {
                await prisma_1.prisma.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        password: hashedPassword,
                        role: 'SUPER_ADMIN',
                        isVerified: true
                    }
                });
                logger.info(`SUPER_ADMIN ${email} created`);
            }
            else {
                await prisma_1.prisma.user.update({
                    where: { email },
                    data: { role: 'SUPER_ADMIN', password: hashedPassword, isVerified: true }
                });
                logger.info(`SUPER_ADMIN ${email} credentials synchronized`);
            }
        }
    }
    catch (error) {
        logger.error('Error initializing users:', error);
    }
}
// Start server (Final stabilization for Supabase Pooler)
app.listen(port, async () => {
    try {
        let dbUrl = process.env.DATABASE_URL || '';
        // Robust cleanup: Remove "DATABASE_URL=" prefix if accidentally included   
        if (dbUrl.startsWith('DATABASE_URL=')) {
            dbUrl = dbUrl.replace('DATABASE_URL=', '');
            process.env.DATABASE_URL = dbUrl;
        }
        const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
        logger.info(`Attempting to connect to database: ${maskedUrl}`);
        await prisma_1.prisma.$connect();
        logger.info('Database connection established successfully');
        await prisma_1.prisma.$connect();
        logger.info('Database connection established successfully');
        // initializeAdminUser disabled for production
        // await initializeAdminUser();
        console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
        logger.info(`Server started on port ${port}`);
        console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
        logger.info(`Server started on port ${port}`);
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
});
//# sourceMappingURL=index.js.map