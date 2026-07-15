import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma, logger } from '../index.js';

export class EmailSyncService {
  private static config = {
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: process.env.IMAP_SECURE === 'true' || process.env.IMAP_SECURE === 'true', // Handle both boolean and string
    auth: {
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASS || '',
    },
  };

  private static async syncMailbox(client: ImapFlow, folder: string, direction: 'INBOUND' | 'OUTBOUND') {
    const lock = await client.getMailboxLock(folder);

    try {
      const mailbox = client.mailbox;
      if (!mailbox) {
        throw new Error(`Mailbox ${folder} not found`);
      }

      logger.info(`Syncing ${folder}: ${mailbox.exists} messages`);

      const startSeq = Math.max(1, mailbox.exists - 49);
      const sequence = `${startSeq}:*`;

      let syncedCount = 0;
      for await (const message of client.fetch(sequence, { source: true, envelope: true })) {
        if (!message.envelope || !message.source) continue;

        const messageId = message.envelope.messageId || `gen-${folder}-${Date.now()}-${syncedCount}`;
        const existing = await prisma.email.findUnique({ where: { messageId } });

        if (!existing) {
          const parsed = await simpleParser(message.source);
          const firstFrom = message.envelope.from?.[0]?.address || '';
          const firstTo = message.envelope.to?.[0]?.address || this.config.auth.user;

          if (direction === 'INBOUND') {
            const importer = await prisma.importer.findFirst({ where: { email: firstFrom } });
            await prisma.email.create({
              data: {
                messageId,
                importerId: importer?.id || null,
                subject: message.envelope.subject || '(No Subject)',
                body: parsed.text || parsed.html || '',
                from: firstFrom,
                to: this.config.auth.user,
                status: 'RECEIVED',
                direction: 'INBOUND',
                receivedAt: message.envelope.date || new Date(),
              }
            });
          } else {
            await prisma.email.create({
              data: {
                messageId,
                subject: message.envelope.subject || '(No Subject)',
                body: parsed.text || parsed.html || '',
                from: this.config.auth.user,
                to: firstTo,
                status: 'SENT',
                direction: 'OUTBOUND',
                sentAt: message.envelope.date || new Date(),
              }
            });
          }

          syncedCount++;
        }
      }

      logger.info(`${folder} sync completed. ${syncedCount} new emails added.`);
      return syncedCount;
    } finally {
      lock.release();
    }
  }

  static async syncInbox() {
    logger.info(`Attempting IMAP sync for ${this.config.auth.user} at ${this.config.host}:${this.config.port}`);

    const client = new ImapFlow({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      logger: false,
      tls: {
        rejectUnauthorized: false // Often needed for some mail servers
      }
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
          totalSynced += await this.syncMailbox(client, entry.folder, entry.direction);
        } catch (error: any) {
          logger.warn(`Skipping ${entry.folder}: ${error.message}`);
        }
      }

      logger.info(`IMAP sync completed. Total new emails added: ${totalSynced}`);
      await client.logout();
    } catch (error: any) {
      logger.error('IMAP Sync Error Details:', {
        message: error.message,
        stack: error.stack,
        config: { ...this.config, pass: '***' }
      });
      throw error;
    }
  }
}
