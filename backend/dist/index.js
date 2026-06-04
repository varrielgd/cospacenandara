"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = require("express-rate-limit");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const winston_1 = __importDefault(require("winston"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const importer_routes_1 = __importDefault(require("./routes/importer.routes"));
const sample_routes_1 = __importDefault(require("./routes/sample.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const discovery_routes_1 = __importDefault(require("./routes/discovery.routes"));
const email_routes_1 = __importDefault(require("./routes/email.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const error_1 = require("./middleware/error");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 4000;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Logger configuration
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
exports.logger = logger;
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple(),
    }));
}
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
// Basic Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Error handling
app.use(error_1.errorHandler);
// Initialize permanent admin user and handle demo users
const initializeAdminUser = async () => {
    try {
        const adminEmail = 'nandaranusamontierra@gmail.com';
        const adminPassword = 'Ghfso#!@!5246!#!@g7';
        // Check if permanent admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
            // @ts-ignore - isVerified exists in DB but client might need regeneration
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    firstName: 'Permanent',
                    lastName: 'Admin',
                    role: 'ADMIN',
                    isVerified: true,
                    twoFactorEnabled: false
                }
            });
            logger.info('Permanent admin user created successfully');
        }
        else if (!existingAdmin.isVerified) {
            // Ensure permanent admin is always verified
            // @ts-ignore
            await prisma.user.update({
                where: { email: adminEmail },
                data: { isVerified: true }
            });
        }
        // Initialize demo user if needed
        const demoEmail = 'demo@nandaracoffee.com';
        const demoPassword = 'demo123456';
        const existingDemo = await prisma.user.findUnique({
            where: { email: demoEmail }
        });
        if (!existingDemo) {
            const hashedDemoPassword = await bcrypt_1.default.hash(demoPassword, 10);
            // @ts-ignore
            await prisma.user.create({
                data: {
                    email: demoEmail,
                    password: hashedDemoPassword,
                    firstName: 'Demo',
                    lastName: 'User',
                    role: 'ADMIN',
                    isVerified: true
                }
            });
            logger.info('Demo user created successfully');
        }
    }
    catch (error) {
        logger.error('Error initializing users:', error);
    }
};
// Start server
app.listen(port, async () => {
    await initializeAdminUser();
    console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
    logger.info(`Server started on port ${port}`);
});
//# sourceMappingURL=index.js.map