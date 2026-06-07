"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const prisma_1 = require("../prisma");
// Avoid importing `logger` from `index` to prevent circular imports during startup.
const logger = {
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    info: (...args) => console.log(...args),
};
const authenticate = async (req, res, next) => {
    try {
        // Standardize header access (Express does this but being explicit helps)
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader) {
            logger.warn(`AUTH MISSING: No authorization header for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!authHeader.startsWith('Bearer ')) {
            logger.warn(`AUTH INVALID FORMAT: Header does not start with Bearer for ${req.method} ${req.originalUrl}`);
            return res.status(401).json({ message: 'Authentication required' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            // CRITICAL FIX: Lookup by EMAIL as requested (Email is authoritative)
            const user = await prisma_1.prisma.user.findUnique({
                where: { email: decoded.email },
                select: { id: true, email: true, role: true }
            });
            if (!user) {
                logger.warn(`AUTH FAILED: User ${decoded.email} not found in database`);
                return res.status(401).json({ message: 'Invalid or expired token' });
            }
            req.user = user;
            return next();
        }
        catch (jwtError) {
            logger.error(`JWT VERIFY ERROR for ${req.method} ${req.originalUrl}:`, jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    }
    catch (error) {
        logger.error(`AUTH MIDDLEWARE ERROR:`, error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permission denied' });
        }
        return next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map