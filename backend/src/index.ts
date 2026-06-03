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

// Start server
app.listen(port, () => {
  console.log(`[server]: CIIS Backend is running at http://localhost:${port}`);
  logger.info(`Server started on port ${port}`);
});

export { app, prisma, logger };
