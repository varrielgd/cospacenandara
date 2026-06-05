import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, JWT_EXPIRES_IN, ALLOWED_EMAILS } from '../config/auth';

const prisma = new PrismaClient();

// Simple logger implementation since ../utils/logger is missing
const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  error: (msg: string, meta?: any) => console.error(`[ERROR] ${msg}`, meta || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || '')
};

interface AuthRequest extends Request {
  user?: any;
}
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
    pass: process.env.SMTP_PASS || 'Ghfso#!@!5246!#!@g7',
  },
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if total users >= 4 (limit to 4 admin emails)
    const userCount = await prisma.user.count();
    if (userCount >= 4) {
      return res.status(403).json({ message: 'Registration limit reached (Maximum 4 admin accounts)' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate 2FA verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const user = await prisma.user.create({
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
    } catch (mailError) {
      logger.error('Failed to send verification email:', mailError);
      // We still created the user, they can request a resend or try again if we add that logic
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email for the verification code.',
      email: user.email
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
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
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpiry: null,
        twoFactorEnabled: true // Enable 2FA by default after verification
      }
    });

    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET || 'nandara_secret_fallback_2026',
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    logger.error('2FA Verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // PHASE 2: Whitelist Super Admin
    if (!ALLOWED_EMAILS.includes(email)) {
      logger.warn(`LOGIN BLOCKED: Email ${email} is not in whitelist`);
      return res.status(403).json({ message: 'ACCESS_DENIED' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

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
  } catch (error: any) {
    logger.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    logger.error('Me error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const debugAuth = async (req: Request, res: Response) => {
  return res.json({
    jwtLoaded: true,
    jwtLength: JWT_SECRET.length,
    databaseConnected: true,
    serverTime: new Date(),
    nodeEnv: process.env.NODE_ENV
  });
};
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    logger.error('GetAllUsers error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('DeleteUser error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
