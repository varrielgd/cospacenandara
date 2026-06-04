"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoLogin = exports.me = exports.login = exports.verify2FA = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
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
        const userCount = await index_1.prisma.user.count();
        if (userCount >= 4) {
            return res.status(403).json({ message: 'Registration limit reached (Maximum 4 admin accounts)' });
        }
        const existingUser = await index_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Generate 2FA verification code
        const verificationCode = crypto_1.default.randomInt(100000, 999999).toString();
        const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        const user = await index_1.prisma.user.create({
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
            index_1.logger.info(`Verification code sent to ${email}`);
        }
        catch (mailError) {
            index_1.logger.error('Failed to send verification email:', mailError);
            // We still created the user, they can request a resend or try again if we add that logic
        }
        return res.status(201).json({
            message: 'Registration successful. Please check your email for the verification code.',
            email: user.email
        });
    }
    catch (error) {
        index_1.logger.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.register = register;
const verify2FA = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await index_1.prisma.user.findUnique({ where: { email } });
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
        const updatedUser = await index_1.prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                verificationCode: null,
                verificationExpiry: null,
                twoFactorEnabled: true // Enable 2FA by default after verification
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
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
        index_1.logger.error('2FA Verification error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.verify2FA = verify2FA;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await index_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Account not verified. Please verify your email.', requiresVerification: true });
        }
        // For permanent admin or verified users, we could also enforce another 2FA check here if needed.
        // For now, let's just proceed with token generation.
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        index_1.logger.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await index_1.prisma.user.findUnique({
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
        index_1.logger.error('Me error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.me = me;
const demoLogin = async (req, res) => {
    try {
        const demoEmail = 'demo@nandaracoffee.com';
        const user = await index_1.prisma.user.findUnique({ where: { email: demoEmail } });
        if (!user) {
            return res.status(404).json({ message: 'Demo user not found. Server may not be initialized.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    }
    catch (error) {
        index_1.logger.error('Demo login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.demoLogin = demoLogin;
//# sourceMappingURL=auth.controller.js.map