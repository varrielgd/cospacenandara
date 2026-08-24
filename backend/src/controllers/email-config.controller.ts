import { Request, Response } from 'express';
import { prisma, logger } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { EmailSyncService } from '../services/email-sync.service.js';

/**
 * Get current email configuration
 */
export const getEmailConfig = async (_req: AuthRequest, res: Response) => {
  try {
    const config = await prisma.emailConfig.findFirst();

    if (!config) {
      return res.status(404).json({ message: 'Email configuration not found' });
    }

    // Don't return sensitive credentials
    const safeConfig = {
      id: config.id,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpFromName: config.smtpFromName,
      smtpSecure: config.smtpSecure,
      imapHost: config.imapHost,
      imapPort: config.imapPort,
      imapUser: config.imapUser,
      imapSecure: config.imapSecure,
      useResendApi: config.useResendApi,
      useBrevoApi: config.useBrevoApi,
      isConfigured: config.isConfigured,
      lastTestedAt: config.lastTestedAt,
      testStatus: config.testStatus,
      testError: config.testError,
    };

    return res.json(safeConfig);
  } catch (error) {
    logger.error('Get email config error:', error);
    return res.status(500).json({ message: 'Failed to get email configuration' });
  }
};

/**
 * Update email configuration
 */
export const updateEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFromName,
      smtpSecure,
      imapHost,
      imapPort,
      imapUser,
      imapPass,
      imapSecure,
      useResendApi,
      resendApiKey,
      useBrevoApi,
      brevoApiKey,
    } = req.body;

    let config = await prisma.emailConfig.findFirst();

    if (!config) {
      config = await prisma.emailConfig.create({
        data: {
          smtpHost: smtpHost || 'smtp.hostinger.com',
          smtpPort: smtpPort || 587,
          smtpUser: smtpUser || '',
          smtpPass: smtpPass || '',
          smtpFromName: smtpFromName || 'Nandara Nusa Montierra',
          smtpSecure: smtpSecure ?? false,
          imapHost: imapHost || 'imap.hostinger.com',
          imapPort: imapPort || 993,
          imapUser: imapUser || '',
          imapPass: imapPass || '',
          imapSecure: imapSecure ?? true,
          useResendApi: useResendApi ?? false,
          resendApiKey: resendApiKey || '',
          useBrevoApi: useBrevoApi ?? false,
          brevoApiKey: brevoApiKey || '',
          isConfigured: false,
        },
      });
    } else {
      config = await prisma.emailConfig.update({
        where: { id: config.id },
        data: {
          ...(smtpHost && { smtpHost }),
          ...(smtpPort && { smtpPort }),
          ...(smtpUser && { smtpUser }),
          ...(smtpPass && { smtpPass }),
          ...(smtpFromName && { smtpFromName }),
          ...(smtpSecure !== undefined && { smtpSecure }),
          ...(imapHost && { imapHost }),
          ...(imapPort && { imapPort }),
          ...(imapUser && { imapUser }),
          ...(imapPass && { imapPass }),
          ...(imapSecure !== undefined && { imapSecure }),
          ...(useResendApi !== undefined && { useResendApi }),
          ...(resendApiKey && { resendApiKey }),
          ...(useBrevoApi !== undefined && { useBrevoApi }),
          ...(brevoApiKey && { brevoApiKey }),
          isConfigured: false, // Mark as unconfigured until tested
        },
      });
    }

    // Don't return sensitive data
    const safeConfig = {
      id: config.id,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpFromName: config.smtpFromName,
      smtpSecure: config.smtpSecure,
      imapHost: config.imapHost,
      imapPort: config.imapPort,
      imapUser: config.imapUser,
      imapSecure: config.imapSecure,
      useResendApi: config.useResendApi,
      useBrevoApi: config.useBrevoApi,
      isConfigured: config.isConfigured,
      message: 'Email configuration updated. Please test the connection.',
    };

    return res.json(safeConfig);
  } catch (error) {
    logger.error('Update email config error:', error);
    return res.status(500).json({ message: 'Failed to update email configuration' });
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    const result = await EmailSyncService.testConnection();

    // Update test status in database
    let config = await prisma.emailConfig.findFirst();
    if (!config) {
      config = await prisma.emailConfig.create({
        data: {
          testStatus: result.success ? 'SUCCESS' : 'FAILED',
          testError: result.error || null,
          lastTestedAt: new Date(),
          isConfigured: result.success,
        },
      });
    } else {
      config = await prisma.emailConfig.update({
        where: { id: config.id },
        data: {
          testStatus: result.success ? 'SUCCESS' : 'FAILED',
          testError: result.error || null,
          lastTestedAt: new Date(),
          isConfigured: result.success,
        },
      });
    }

    return res.json(result);
  } catch (error: any) {
    logger.error('Test email config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
    });
  }
};

/**
 * Sync emails manually
 */
export const syncEmails = async (req: AuthRequest, res: Response) => {
  try {
    const result = await EmailSyncService.syncInbox();
    return res.json({
      success: result.success,
      totalSynced: result.totalSynced,
      message: `Successfully synced ${result.totalSynced} emails`,
    });
  } catch (error: any) {
    logger.error('Email sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email sync failed',
      error: error.message,
    });
  }
};
