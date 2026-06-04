"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailsByImporter = exports.syncInbox = exports.getInbox = exports.sendDirectEmail = exports.sendEmail = exports.approveEmail = exports.generateDraft = void 0;
const ai_service_1 = require("../services/ai.service");
const index_1 = require("../index");
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_sync_service_1 = require("../services/email-sync.service");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
        pass: process.env.SMTP_PASS || 'Ghfso#!@!5246!#!@g7',
    },
});
const generateDraft = async (req, res) => {
    try {
        const { importerId, context, tone } = req.body;
        const importer = await index_1.prisma.importer.findUnique({ where: { id: importerId } });
        if (!importer)
            return res.status(404).json({ message: 'Importer not found' });
        const draft = await ai_service_1.AiService.generateEmailDraft(importer.companyName, context, tone);
        const email = await index_1.prisma.email.create({
            data: {
                importerId: importerId,
                subject: draft.subject,
                body: draft.body,
                from: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
                to: importer.email || '',
                status: 'DRAFT',
                direction: 'OUTBOUND',
                isAiGenerated: true
            }
        });
        return res.json(email);
    }
    catch (error) {
        index_1.logger.error('Email draft generation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.generateDraft = generateDraft;
const approveEmail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const email = await index_1.prisma.email.update({
            where: { id: id },
            data: { status: 'APPROVED' }
        });
        return res.json(email);
    }
    catch (error) {
        index_1.logger.error('Email approval error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveEmail = approveEmail;
const sendEmail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const email = await index_1.prisma.email.findUnique({
            where: { id: id },
            include: { importer: true }
        });
        if (!email)
            return res.status(404).json({ message: 'Email not found' });
        if (email.status !== 'APPROVED') {
            return res.status(400).json({ message: 'Email must be approved before sending' });
        }
        // Send actual email via Hostinger SMTP
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
            to: email.to,
            subject: email.subject,
            text: email.body,
            html: email.body.replace(/\n/g, '<br>'),
        });
        await index_1.prisma.email.update({
            where: { id: id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                messageId: info.messageId
            }
        });
        if (email.importerId) {
            await index_1.prisma.activity.create({
                data: {
                    userId: req.user.id,
                    importerId: email.importerId,
                    type: 'EMAIL',
                    description: `Email sent to ${email.importer?.companyName || 'Unknown'}: ${email.subject}`
                }
            });
        }
        return res.json({ message: 'Email sent successfully', messageId: info.messageId });
    }
    catch (error) {
        index_1.logger.error('Email sending error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendEmail = sendEmail;
const sendDirectEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        if (!to || !subject || !body) {
            return res.status(400).json({ message: 'To, subject, and body are required' });
        }
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
            to,
            subject,
            text: body,
            html: body.replace(/\n/g, '<br>'),
        });
        // Log the sent email in DB
        await index_1.prisma.email.create({
            data: {
                subject,
                body,
                from: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
                to,
                status: 'SENT',
                direction: 'OUTBOUND',
                sentAt: new Date(),
                messageId: info.messageId
            }
        });
        return res.json({ message: 'Email sent successfully', messageId: info.messageId });
    }
    catch (error) {
        index_1.logger.error('Direct email sending error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendDirectEmail = sendDirectEmail;
const getInbox = async (req, res) => {
    try {
        const emails = await index_1.prisma.email.findMany({
            where: { direction: 'INBOUND' },
            orderBy: { receivedAt: 'desc' },
            take: 50
        });
        return res.json(emails);
    }
    catch (error) {
        index_1.logger.error('Error fetching inbox:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getInbox = getInbox;
const syncInbox = async (req, res) => {
    try {
        await email_sync_service_1.EmailSyncService.syncInbox();
        return res.json({ message: 'Inbox sync completed successfully' });
    }
    catch (error) {
        index_1.logger.error('Inbox sync error:', error);
        return res.status(500).json({ message: 'Internal server error during sync' });
    }
};
exports.syncInbox = syncInbox;
const getEmailsByImporter = async (req, res) => {
    try {
        const { importerId } = req.params;
        const emails = await index_1.prisma.email.findMany({
            where: { importerId: importerId },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(emails);
    }
    catch (error) {
        index_1.logger.error('Error fetching importer emails:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getEmailsByImporter = getEmailsByImporter;
//# sourceMappingURL=email.controller.js.map