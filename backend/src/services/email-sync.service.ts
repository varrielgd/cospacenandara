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
      
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        const mailbox = client.mailbox;
        if (!mailbox) {
          logger.error('Mailbox INBOX not found after connection');
          throw new Error('Mailbox not found');
        }

        logger.info(`Inbox found. Total messages: ${mailbox.exists}`);

        // Fetch last 50 emails to sync
        const startSeq = Math.max(1, mailbox.exists - 49);
        const sequence = `${startSeq}:*`;

        let syncedCount = 0;
        for await (const message of client.fetch(sequence, { source: true, envelope: true })) {
          if (!message.envelope || !message.source) continue;

          const messageId = message.envelope.messageId || `gen-${Date.now()}-${syncedCount}`;
          
          // Check if already exists in DB
          const existing = await prisma.email.findUnique({
            where: { messageId }
          });

          if (!existing) {
            const parsed = await simpleParser(message.source);
            const fromEmail = message.envelope.from?.[0]?.address || '';
            
            // Try to find matching importer by email
            const importer = await prisma.importer.findFirst({
              where: { email: fromEmail }
            });

            await prisma.email.create({
              data: {
                messageId,
                importerId: importer?.id || null,
                subject: message.envelope.subject || '(No Subject)',
                body: parsed.text || parsed.html || '',
                from: fromEmail,
                to: this.config.auth.user,
                status: 'RECEIVED',
                direction: 'INBOUND',
                receivedAt: message.envelope.date || new Date(),
              }
            });
            syncedCount++;
          }
        }
        logger.info(`IMAP Sync completed. ${syncedCount} new emails added.`);
      } finally {
        lock.release();
      }

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
