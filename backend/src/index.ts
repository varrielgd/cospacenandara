import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { prisma } from './prisma';
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.routes';
import importerRoutes from './routes/importer.routes';
import sampleRoutes from './routes/sample.routes';
import quotationRoutes from './routes/quotation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import discoveryRoutes from './routes/discovery.routes';
import emailRoutes from './routes/email.routes';
import auditRoutes from './routes/audit.routes';
import supplierRoutes from './routes/supplier.routes';
import { errorHandler } from './middleware/error';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 4000;

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
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ],
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'https://nandaracorporation.vercel.app',
      'https://nandaracorporation-8yzm3o79w.vercel.app',
      'https://cospacenandara.vercel.app',
      'https://cospace.nandaranusamontierra.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    // Allow requests with no origin (like curl, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

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
app.use('/api/suppliers', supplierRoutes);

// Basic Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });  
});

// Error handling
app.use(errorHandler);

// Initialize permanent admin user and handle demo users
import { ALLOWED_EMAILS } from './config/auth';

async function initializeAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('Ghfso#!@!5246!#!@g7', 10);        

    for (const email of ALLOWED_EMAILS) {
      const existing = await prisma.user.findUnique({ where: { email } });      

      const firstName = email.includes('nandara') ? 'Nandara' : 'Nanda';        
      const lastName = email.includes('nandara') ? 'Nusa' : 'Latifani';

      if (!existing) {
        await prisma.user.create({
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
      } else {
        await prisma.user.update({
          where: { email },
          data: { role: 'SUPER_ADMIN', password: hashedPassword, isVerified: true }
        });
        logger.info(`SUPER_ADMIN ${email} credentials synchronized`);
      }
    }
  } catch (error) {
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

    await prisma.$connect();
    logger.info('Database connection established successfully');
    await prisma.$connect();
logger.info('Database connection established successfully');

// initializeAdminUser disabled for production
// await initializeAdminUser();

console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
logger.info(`Server started on port ${port}`);
    console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
    logger.info(`Server started on port ${port}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

export { app, prisma, logger };
