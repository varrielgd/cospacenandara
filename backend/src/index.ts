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
import bcrypt from 'bcrypt';
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
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    
    // Check if permanent admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
    } else if (!(existingAdmin as any).isVerified) {
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
      const hashedDemoPassword = await bcrypt.hash(demoPassword, 10);
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
  } catch (error) {
    logger.error('Error initializing users:', error);
  }
};

// Start server
app.listen(port, async () => {
  await initializeAdminUser();
  console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
  logger.info(`Server started on port ${port}`);
});

export { app, prisma, logger };
