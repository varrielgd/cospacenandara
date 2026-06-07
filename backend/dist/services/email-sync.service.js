"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSyncService = void 0;
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const index_1 = require("../index");
class EmailSyncService {
    static config = {
        host: process.env.IMAP_HOST || 'imap.hostinger.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        secure: process.env.IMAP_SECURE === 'true' || process.env.IMAP_SECURE === 'true', // Handle both boolean and string
        auth: {
            user: process.env.IMAP_USER || '',
            pass: process.env.IMAP_PASS || '',
        },
    };
    static async syncInbox() {
        index_1.logger.info(`Attempting IMAP sync for ${this.config.auth.user} at ${this.config.host}:${this.config.port}`);
        const client = new imapflow_1.ImapFlow({
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
            index_1.logger.info('IMAP connected successfully');
            const lock = await client.getMailboxLock('INBOX');
            try {
                const mailbox = client.mailbox;
                if (!mailbox) {
                    index_1.logger.error('Mailbox INBOX not found after connection');
                    throw new Error('Mailbox not found');
                }
                index_1.logger.info(`Inbox found. Total messages: ${mailbox.exists}`);
                // Fetch last 50 emails to sync
                const startSeq = Math.max(1, mailbox.exists - 49);
                const sequence = `${startSeq}:*`;
                let syncedCount = 0;
                for await (const message of client.fetch(sequence, { source: true, envelope: true })) {
                    if (!message.envelope || !message.source)
                        continue;
                    const messageId = message.envelope.messageId || `gen-${Date.now()}-${syncedCount}`;
                    // Check if already exists in DB
                    const existing = await index_1.prisma.email.findUnique({
                        where: { messageId }
                    });
                    if (!existing) {
                        const parsed = await (0, mailparser_1.simpleParser)(message.source);
                        const fromEmail = message.envelope.from?.[0]?.address || '';
                        // Try to find matching importer by email
                        const importer = await index_1.prisma.importer.findFirst({
                            where: { email: fromEmail }
                        });
                        await index_1.prisma.email.create({
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
                index_1.logger.info(`IMAP Sync completed. ${syncedCount} new emails added.`);
            }
            finally {
                lock.release();
            }
            await client.logout();
        }
        catch (error) {
            index_1.logger.error('IMAP Sync Error Details:', {
                message: error.message,
                stack: error.stack,
                config: { ...this.config, pass: '***' }
            });
            throw error;
        }
    }
}
exports.EmailSyncService = EmailSyncService;
//# sourceMappingURL=email-sync.service.js.map