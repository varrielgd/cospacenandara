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
        secure: process.env.IMAP_SECURE === 'true',
        auth: {
            user: process.env.IMAP_USER || '',
            pass: process.env.IMAP_PASS || '',
        },
    };
    static async syncInbox() {
        const client = new imapflow_1.ImapFlow({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: this.config.auth,
            logger: false,
        });
        try {
            await client.connect();
            const lock = await client.getMailboxLock('INBOX');
            try {
                const mailbox = client.mailbox;
                if (!mailbox)
                    throw new Error('Mailbox not found');
                // Fetch last 50 emails to sync
                const startSeq = Math.max(1, mailbox.exists - 49);
                const sequence = `${startSeq}:*`;
                for await (const message of client.fetch(sequence, { source: true, envelope: true })) {
                    if (!message.envelope || !message.source)
                        continue;
                    const messageId = message.envelope.messageId;
                    if (!messageId)
                        continue;
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
                                receivedAt: message.envelope.date,
                            }
                        });
                        index_1.logger.info(`Synced new inbound email: ${message.envelope.subject}`);
                    }
                }
            }
            finally {
                lock.release();
            }
            await client.logout();
        }
        catch (error) {
            index_1.logger.error('IMAP Sync Error:', error);
            throw error;
        }
    }
}
exports.EmailSyncService = EmailSyncService;
//# sourceMappingURL=email-sync.service.js.map