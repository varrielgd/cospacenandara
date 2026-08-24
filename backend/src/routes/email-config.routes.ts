import { Router, Request, Response } from 'express';
import * as emailConfigController from '../controllers/email-config.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get current email configuration
router.get('/', emailConfigController.getEmailConfig);

// Update email configuration
router.post('/update', emailConfigController.updateEmailConfig);

// Test email configuration (IMAP connection)
router.post('/test', emailConfigController.testEmailConfig);

// Manually trigger email sync
router.post('/sync', emailConfigController.syncEmails);

export default router;
