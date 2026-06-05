import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import authRoutes from './routes/auth.routes';
import importerRoutes from './routes/importer.routes';
import sampleRoutes from './routes/sample.routes';
import quotationRoutes from './routes/quotation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import discoveryRoutes from './routes/discovery.routes';
import emailRoutes from './routes/email.routes';
import auditRoutes from './routes/audit.routes';
import { errorHandler } from './middleware/error';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://nandaracorporation.vercel.app',
  'https://nandaracorporation-git-main-nanmontierras-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/importers', importerRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/audit', auditRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize permanent admin user and handle demo users
const initializeAdminUser = async () => {
  try {
    const adminEmail = 'nandaranusamontierra@gmail.com';
    const adminPassword = 'Ghfso#!@!5246!#!@g7';
    
    // Check and create permanent admins
    const permanentAdmins = [
      { email: 'nandaranusamontierra@gmail.com', firstName: 'Nandara', lastName: 'Admin' },
      { email: 'nandalatifanibudiarti97@gmail.com', firstName: 'Nanda', lastName: 'Latifani' }
    ];

    for (const admin of permanentAdmins) {
      const existing = await prisma.user.findUnique({
        where: { email: admin.email }
      });

      if (!existing) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // @ts-ignore
        await prisma.user.create({
          data: {
            email: admin.email,
            password: hashedPassword,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: 'ADMIN',
            isVerified: true,
            twoFactorEnabled: false
          }
        });
        logger.info(`Permanent admin ${admin.email} created successfully`);
      } else {
        // Always ensure password matches the one in .env and account is verified
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        // @ts-ignore
        await prisma.user.update({
          where: { email: admin.email },
          data: { 
            password: hashedPassword,
            isVerified: true 
          }
        });
        logger.info(`Permanent admin ${admin.email} credentials synchronized`);
      }
    }
  } catch (error) {
    logger.error('Error initializing users:', error);
  }
};

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

    await prisma.$connect();
    logger.info('Database connection established successfully');
    await initializeAdminUser();
    console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
    logger.info(`Server started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

export { app, prisma, logger };
