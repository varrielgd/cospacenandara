import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, logger } from '../index';
import { AuthRequest } from '../middleware/auth';
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify your email.', requiresVerification: true });
    }

    // For permanent admin or verified users, we could also enforce another 2FA check here if needed.
    // For now, let's just proceed with token generation.

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'nandara_secret_fallback_2026',
      { expiresIn: '7d' }
    );

    const decoded = jwt.decode(token) as any;
    logger.info(`Token generated for user: ${user.email}`, {
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      secretUsed: process.env.JWT_SECRET ? 'ENV_SECRET' : 'FALLBACK_SECRET'
    });

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
  } catch (error: any) {
    logger.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });
    return res.status(500).json({ 
       message: 'Internal server error',
       details: error.message // Selalu kirim message error asli untuk debug
     });
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

export const debugToken = async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ authenticated: false, message: 'No Bearer token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'nandara_secret_fallback_2026';
    
    const decoded = jwt.verify(token, secret) as any;
    
    return res.json({
      authenticated: true,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
      expIso: new Date(decoded.exp * 1000).toISOString(),
      now: Math.floor(Date.now() / 1000),
      timeLeft: decoded.exp - Math.floor(Date.now() / 1000),
      envSecretExists: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error: any) {
    return res.status(401).json({ 
      authenticated: false,
      message: 'Token verification failed', 
      error: error.message,
      envSecretExists: !!process.env.JWT_SECRET 
    });
  }
};
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

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });
    return res.json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (id === req.user?.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id: id as string } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect permanent admins (from index.ts)
    const permanentEmails = ['nandaranusamontierra@gmail.com', 'nandalatifanibudiarti97@gmail.com'];
    if (permanentEmails.includes(user.email)) {
      return res.status(403).json({ message: 'Cannot delete a permanent system administrator' });
    }

    // Delete related data first (cascading manual delete for SQLite compatibility if needed, 
    // but schema uses onDelete: Cascade mostly)
    await prisma.activity.deleteMany({ where: { userId: id as string } });
    await prisma.note.deleteMany({ where: { userId: id as string } });
    await prisma.task.deleteMany({ where: { userId: id as string } });
    await prisma.discoverySession.deleteMany({ where: { userId: id as string } });
    await prisma.auditLog.deleteMany({ where: { userId: id as string } });

    await prisma.user.delete({ where: { id: id as string } });
    
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
