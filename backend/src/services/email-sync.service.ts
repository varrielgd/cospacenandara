import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma, logger } from '../index.js';

export class EmailSyncService {
  /**
   * Get IMAP config from database or environment variables
   */
  private static async getImapConfig() {
    try {
      const config = await prisma.emailConfig.findFirst();
      if (config && config.isConfigured && config.imapUser && config.imapPass) {
        return {
          host: config.imapHost,
          port: config.imapPort,
          secure: config.imapSecure,
          auth: {
            user: config.imapUser,
            pass: config.imapPass,
          },
        };
      }
    } catch (error) {
      logger.warn('Failed to load IMAP config from database, falling back to env vars:', error);
    }

    // Fallback to environment variables
    return {
      host: process.env.IMAP_HOST || 'imap.hostinger.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      secure: process.env.IMAP_SECURE === 'true',
      auth: {
        user: process.env.IMAP_USER || '',
        pass: process.env.IMAP_PASS || '',
      },
    };
  }

  /**
   * Validate IMAP configuration
   */
  static validateConfig(config: any): { valid: boolean; error?: string } {
    if (!config.auth?.user) {
      return { valid: false, error: 'IMAP_USER is not configured' };
    }
    if (!config.auth?.pass) {
      return { valid: false, error: 'IMAP_PASS is not configured' };
    }
    if (!config.host) {
      return { valid: false, error: 'IMAP_HOST is not configured' };
    }
    return { valid: true };
  }

  /**
   * Sync a single mailbox folder
   */
  private static async syncMailbox(
    client: ImapFlow,
    folder: string,
    direction: 'INBOUND' | 'OUTBOUND',
    config: any
  ) {
    let lock;

    try {
      lock = await client.getMailboxLock(folder);
      const mailbox = client.mailbox;

      if (!mailbox) {
        logger.warn(`Mailbox "${folder}" not found or inaccessible`);
        return 0;
      }

      logger.info(`Syncing ${folder}: ${mailbox.exists} messages`);

      if (mailbox.exists === 0) {
        logger.info(`${folder} is empty`);
        return 0;
      }

      const startSeq = Math.max(1, mailbox.exists - 49);
      const sequence = `${startSeq}:*`;

      let syncedCount = 0;

      for await (const message of client.fetch(sequence, { source: true, envelope: true })) {
        if (!message.envelope || !message.source) continue;

        const messageId = message.envelope.messageId || `gen-${folder}-${Date.now()}-${syncedCount}`;

        try {
          const existing = await prisma.email.findUnique({ where: { messageId } });

          if (!existing) {
            const parsed = await simpleParser(message.source);
            const firstFrom = message.envelope.from?.[0]?.address || '';
            const firstTo = message.envelope.to?.[0]?.address || config.auth.user;

            if (direction === 'INBOUND') {
              const importer = await prisma.importer.findFirst({ where: { email: firstFrom } });
              await prisma.email.create({
                data: {
                  messageId,
                  importerId: importer?.id || null,
                  subject: message.envelope.subject || '(No Subject)',
                  body: parsed.text || parsed.html || '',
                  from: firstFrom,
                  to: config.auth.user,
                  status: 'RECEIVED',
                  direction: 'INBOUND',
                  receivedAt: message.envelope.date || new Date(),
                },
              });
            } else {
              await prisma.email.create({
                data: {
                  messageId,
                  subject: message.envelope.subject || '(No Subject)',
                  body: parsed.text || parsed.html || '',
                  from: config.auth.user,
                  to: firstTo,
                  status: 'SENT',
                  direction: 'OUTBOUND',
                  sentAt: message.envelope.date || new Date(),
                },
              });
            }

            syncedCount++;
          }
        } catch (msgError: any) {
          logger.warn(`Failed to process message ${messageId}:`, msgError.message);
          continue; // Continue with next message
        }
      }

      logger.info(`${folder} sync completed. ${syncedCount} new emails added.`);
      return syncedCount;
    } catch (error: any) {
      logger.warn(`Error syncing ${folder}:`, error.message);
      return 0;
    } finally {
      if (lock) {
        try {
          lock.release();
        } catch (unlockError) {
          logger.warn(`Failed to release lock for ${folder}:`, unlockError);
        }
      }
    }
  }

  /**
   * Test IMAP connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    const config = await this.getImapConfig();
    const validation = this.validateConfig(config);

    if (!validation.valid) {
      return { success: false, message: 'Configuration invalid', error: validation.error };
    }

    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      logger: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      logger.info(`Testing IMAP connection to ${config.host}:${config.port}`);
      await client.connect();
      await client.logout();
      return { success: true, message: 'IMAP connection successful' };
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      logger.error('IMAP connection test failed:', { message: errorMsg, code: error.code });

      return {
        success: false,
        message: 'IMAP connection failed',
        error: errorMsg,
      };
    }
  }

  /**
   * Main sync function
   */
  static async syncInbox(): Promise<{ success: boolean; totalSynced: number; error?: string }> {
    const config = await this.getImapConfig();
    const validation = this.validateConfig(config);

    if (!validation.valid) {
      const errorMsg = validation.error || 'Configuration invalid';
      logger.error('Email sync aborted:', errorMsg);
      throw new Error(errorMsg);
    }

    logger.info(`Attempting IMAP sync for ${config.auth.user} at ${config.host}:${config.port}`);

    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      logger: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await client.connect();
      logger.info('IMAP connected successfully');

      const folders = [
        { folder: 'INBOX', direction: 'INBOUND' as const },
        { folder: 'Sent', direction: 'OUTBOUND' as const },
        { folder: 'Sent Items', direction: 'OUTBOUND' as const },
        { folder: '[Gmail]/Sent Mail', direction: 'OUTBOUND' as const },
      ];

      let totalSynced = 0;
      for (const entry of folders) {
        try {
          totalSynced += await this.syncMailbox(client, entry.folder, entry.direction, config);
        } catch (error: any) {
          logger.warn(`Skipping ${entry.folder}:`, error.message);
        }
      }

      logger.info(`IMAP sync completed. Total new emails added: ${totalSynced}`);
      await client.logout();

      return { success: true, totalSynced };
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        stack: error.stack,
      };
      logger.error('IMAP Sync Error:', errorDetails);

      throw error;
    } finally {
      try {
        await client.logout();
      } catch (logoutError) {
        logger.warn('Failed to logout from IMAP:', logoutError);
      }
    }
  }
}
