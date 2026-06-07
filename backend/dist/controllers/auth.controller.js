"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getAllUsers = exports.debugAuth = exports.me = exports.login = exports.verify2FA = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const auth_1 = require("../config/auth");
// Simple logger implementation since ../utils/logger is missing
const logger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || '')
};
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
        pass: process.env.SMTP_PASS || 'Ghfso#!@!5246!#!@g7',
    },
});
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        // Check if total users >= 4 (limit to 4 admin emails)
        const userCount = await prisma_1.prisma.user.count();
        if (userCount >= 4) {
            return res.status(403).json({ message: 'Registration limit reached (Maximum 4 admin accounts)' });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Generate 2FA verification code
        const verificationCode = crypto_1.default.randomInt(100000, 999999).toString();
        const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: 'ADMIN',
                isVerified: false,
                verificationCode,
                verificationExpiry
            }
        });
        // Send verification email
        try {
            await transporter.sendMail({
                from: `"CIIS Security" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
                to: email,
                subject: 'CIIS Admin Verification Code',
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Admin Verification Required</h2>
            <p>You are registering as an admin for the Coffee Importer Intelligence System.</p>
            <p>Please use the following code to verify your account:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 20px; background: #f4f4f4; text-align: center; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
            });
            logger.info(`Verification code sent to ${email}`);
        }
        catch (mailError) {
            logger.error('Failed to send verification email:', mailError);
            // We still created the user, they can request a resend or try again if we add that logic
        }
        return res.status(201).json({
            message: 'Registration successful. Please check your email for the verification code.',
            email: user.email
        });
    }
    catch (error) {
        logger.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.register = register;
const verify2FA = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        if (user.verificationExpiry && user.verificationExpiry < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }
        // Mark as verified
        const updatedUser = await prisma_1.prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationExpiry: null,
                twoFactorEnabled: true // Enable 2FA by default after verification
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, process.env.JWT_SECRET || 'nandara_secret_fallback_2026', { expiresIn: '7d' });
        return res.json({
            message: 'Verification successful',
            token,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: updatedUser.role
            }
        });
    }
    catch (error) {
        logger.error('2FA Verification error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.verify2FA = verify2FA;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // PHASE 2: Whitelist Super Admin
        if (!auth_1.ALLOWED_EMAILS.includes(email)) {
            logger.warn(`LOGIN BLOCKED: Email ${email} is not in whitelist`);
            return res.status(403).json({ message: 'ACCESS_DENIED' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, auth_1.JWT_SECRET, { expiresIn: auth_1.JWT_EXPIRES_IN });
        logger.info(`LOGIN SUCCESS: Token generated for ${user.email}`);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        logger.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            email: req.body.email
        });
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true
            }
        });
        return res.json(user);
    }
    catch (error) {
        logger.error('Me error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.me = me;
const debugAuth = async (req, res) => {
    return res.json({
        jwtLoaded: true,
        jwtLength: auth_1.JWT_SECRET.length,
        databaseConnected: true,
        serverTime: new Date(),
        nodeEnv: process.env.NODE_ENV
    });
};
exports.debugAuth = debugAuth;
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true
            }
        });
        return res.json(users);
    }
    catch (error) {
        logger.error('GetAllUsers error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.user.delete({ where: { id } });
        return res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        logger.error('DeleteUser error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=auth.controller.js.map