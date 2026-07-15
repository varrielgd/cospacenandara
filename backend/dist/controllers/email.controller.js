"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchGoogleDriveFile = exports.generateLeadEmail = exports.updateEmail = exports.createEmail = exports.getEmailsByImporter = exports.syncInbox = exports.getInbox = exports.sendDirectEmail = exports.getAllEmails = exports.sendEmail = exports.approveEmail = exports.generateDraft = void 0;
const ai_service_js_1 = require("../services/ai.service.js");
const index_js_1 = require("../index.js");
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_sync_service_js_1 = require("../services/email-sync.service.js");
const axios_1 = __importDefault(require("axios"));
// SMTP Configuration for Hostinger
// FIX: Cloud hosting platforms (Render, Heroku, etc.) commonly block outbound port 465 (SMTP SSL)
// to prevent spam. Use port 587 with STARTTLS (secure: false + requireTLS: true) instead.
//
// Port 465 → SSL/TLS directly (often BLOCKED by cloud providers)
// Port 587 → STARTTLS (upgrades to TLS after connection — usually ALLOWED)
//
// If smtp.hostinger.com still times out, it may be behind a Cloudflare proxy.
// In that case, check Hostinger hPanel → Email Accounts for the raw server hostname.
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
// Port 587 uses STARTTLS: secure must be false, requireTLS ensures upgrade happens
const smtpSecure = smtpPort === 465;
const smtpConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true only for port 465 (direct SSL)
    requireTLS: !smtpSecure, // force STARTTLS upgrade on port 587
    auth: {
        user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
        pass: process.env.SMTP_PASS || '',
    },
    tls: {
        rejectUnauthorized: false, // allow self-signed certs (common on shared hosting)
        minVersion: 'TLSv1.2',
    },
    // Generous timeout settings for cloud-hosted backend
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 45000,
};
const transporter = nodemailer_1.default.createTransport(smtpConfig);
/**
 * Maps frontend status strings to valid Prisma EmailStatus enum values
 */
function mapEmailStatus(status) {
    const statusMap = {
        'Draft Generated': 'DRAFT',
        'Pending Review': 'DRAFT',
        'Edited By User': 'DRAFT',
        'DRAFT': 'DRAFT',
        'APPROVED': 'APPROVED',
        'SENT': 'SENT',
        'RECEIVED': 'RECEIVED',
        'BOUNCED': 'BOUNCED'
    };
    return statusMap[status] || 'DRAFT';
}
/**
 * Maps Prisma EmailStatus enum values back to frontend-friendly format
 */
function mapStatusToFrontend(status) {
    const frontendMap = {
        'DRAFT': 'Draft Generated',
        'APPROVED': 'Approved',
        'SENT': 'Sent',
        'RECEIVED': 'Received',
        'BOUNCED': 'Bounced'
    };
    return frontendMap[status] || status;
}
const generateDraft = async (req, res) => {
    try {
        const { importerId, context, tone } = req.body;
        const importer = await index_js_1.prisma.importer.findUnique({ where: { id: importerId } });
        if (!importer)
            return res.status(404).json({ message: 'Importer not found' });
        const draft = await ai_service_js_1.AiService.generateEmailDraft(importer.companyName, context, tone);
        const email = await index_js_1.prisma.email.create({
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
        return res.json({ ...email, status: 'Draft Generated' });
    }
    catch (error) {
        index_js_1.logger.error('Email draft generation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.generateDraft = generateDraft;
const approveEmail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const email = await index_js_1.prisma.email.update({
            where: { id: id },
            data: { status: 'APPROVED' }
        });
        return res.json({ ...email, status: 'Approved' });
    }
    catch (error) {
        index_js_1.logger.error('Email approval error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveEmail = approveEmail;
const sendEmail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const email = await index_js_1.prisma.email.findUnique({
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
        await index_js_1.prisma.email.update({
            where: { id: id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                messageId: info.messageId
            }
        });
        if (email.importerId) {
            await index_js_1.prisma.activity.create({
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
        index_js_1.logger.error('Email sending error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.sendEmail = sendEmail;
const getAllEmails = async (_req, res) => {
    try {
        const emails = await index_js_1.prisma.email.findMany({
            include: { importer: true },
            orderBy: { createdAt: 'desc' }
        });
        const mapped = emails.map(email => ({
            ...email,
            status: mapStatusToFrontend(email.status)
        }));
        return res.json(mapped);
    }
    catch (error) {
        index_js_1.logger.error('Get all emails error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllEmails = getAllEmails;
// ─────────────────────────────────────────────────────────────────────────────
// HTTP-based email helpers (bypass SMTP port blocking on cloud platforms)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Send via Resend API (https://resend.com) — free 3,000 emails/month.
 * Requires RESEND_API_KEY env var. Domain must be verified in Resend dashboard.
 */
async function sendViaResend(to, subject, body, fromName, fromEmail) {
    const response = await axios_1.default.post('https://api.resend.com/emails', {
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: body.replace(/\n/g, '<br>'),
        text: body,
    }, {
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        timeout: 15000,
    });
    return response.data.id || 'resend-sent';
}
/**
 * Send via Brevo (Sendinblue) API — free 300 emails/day.
 * Requires BREVO_API_KEY env var.
 */
async function sendViaBrevo(to, subject, body, fromName, fromEmail) {
    const response = await axios_1.default.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: body.replace(/\n/g, '<br>'),
        textContent: body,
    }, {
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
        },
        timeout: 15000,
    });
    return response.data.messageId || 'brevo-sent';
}
const sendDirectEmail = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        if (!to || !subject || !body) {
            return res.status(400).json({ message: 'To, subject, and body are required' });
        }
        const smtpUser = process.env.SMTP_USER || 'marketing@nandaranusamontierra.com';
        const smtpPass = process.env.SMTP_PASS;
        const fromName = process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra';
        let messageId;
        let method;
        // ── Priority 1: Resend HTTP API (recommended for cloud hosting) ──────────
        if (process.env.RESEND_API_KEY) {
            index_js_1.logger.info(`Sending via Resend API to ${to}`);
            messageId = await sendViaResend(to, subject, body, fromName, smtpUser);
            method = 'resend';
            // ── Priority 2: Brevo HTTP API ───────────────────────────────────────────
        }
        else if (process.env.BREVO_API_KEY) {
            index_js_1.logger.info(`Sending via Brevo API to ${to}`);
            messageId = await sendViaBrevo(to, subject, body, fromName, smtpUser);
            method = 'brevo';
            // ── Priority 3: SMTP (may be blocked on Render/Heroku/etc.) ─────────────
        }
        else if (smtpPass) {
            const resolvedPort = parseInt(process.env.SMTP_PORT || '587');
            const resolvedSecure = resolvedPort === 465;
            const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
            index_js_1.logger.info(`Sending via SMTP ${smtpHost}:${resolvedPort} (secure=${resolvedSecure}) to ${to}`);
            const tempTransporter = nodemailer_1.default.createTransport({
                host: smtpHost,
                port: resolvedPort,
                secure: resolvedSecure,
                requireTLS: !resolvedSecure,
                auth: { user: smtpUser, pass: smtpPass },
                tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 45000,
            });
            const info = await tempTransporter.sendMail({
                from: `"${fromName}" <${smtpUser}>`,
                to, subject,
                text: body,
                html: body.replace(/\n/g, '<br>'),
            });
            tempTransporter.close();
            messageId = info.messageId;
            method = 'smtp';
            // ── Fallback: Simulate (dev/no credentials) ──────────────────────────────
        }
        else {
            index_js_1.logger.warn('No email credentials configured — simulating send');
            await index_js_1.prisma.email.create({
                data: {
                    subject, body,
                    from: smtpUser, to,
                    status: 'SENT', direction: 'OUTBOUND',
                    sentAt: new Date(),
                    messageId: `simulated-${Date.now()}`,
                }
            });
            return res.json({ message: 'Email simulated (no credentials configured)', messageId: 'simulated' });
        }
        // ── Save to DB ───────────────────────────────────────────────────────────
        await index_js_1.prisma.email.create({
            data: {
                subject, body,
                from: smtpUser, to,
                status: 'SENT', direction: 'OUTBOUND',
                sentAt: new Date(),
                messageId,
            }
        });
        index_js_1.logger.info(`Email sent successfully via ${method}. messageId=${messageId}`);
        return res.json({ message: 'Email sent successfully', messageId, method });
    }
    catch (error) {
        // Log full error details to help diagnose issues
        index_js_1.logger.error('Direct email sending error', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack,
        });
        if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.message?.includes('connect')) {
            return res.status(502).json({
                message: `SMTP connection failed: ${error.message}. ` +
                    'Tip: Set RESEND_API_KEY or BREVO_API_KEY environment variable to bypass SMTP blocking.',
            });
        }
        if (error.code === 'EAUTH') {
            return res.status(502).json({ message: 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS.' });
        }
        if (error.response?.status === 422 || error.response?.status === 403) {
            return res.status(502).json({
                message: `Email API error: ${JSON.stringify(error.response?.data)}. ` +
                    'If using Resend, make sure the domain is verified in the Resend dashboard.',
            });
        }
        return res.status(500).json({ message: `Email send failed: ${error.message}` });
    }
};
exports.sendDirectEmail = sendDirectEmail;
const getInbox = async (_req, res) => {
    try {
        const emails = await index_js_1.prisma.email.findMany({
            where: { direction: 'INBOUND' },
            orderBy: { receivedAt: 'desc' },
            take: 50
        });
        const mapped = emails.map(email => ({
            ...email,
            status: mapStatusToFrontend(email.status)
        }));
        return res.json(mapped);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching inbox:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getInbox = getInbox;
const syncInbox = async (_req, res) => {
    try {
        await email_sync_service_js_1.EmailSyncService.syncInbox();
        return res.json({ message: 'Inbox sync completed successfully' });
    }
    catch (error) {
        index_js_1.logger.error('Inbox sync error:', error);
        return res.status(500).json({ message: 'Internal server error during sync' });
    }
};
exports.syncInbox = syncInbox;
const getEmailsByImporter = async (req, res) => {
    try {
        const { importerId } = req.params;
        const emails = await index_js_1.prisma.email.findMany({
            where: { importerId: importerId },
            orderBy: { createdAt: 'desc' }
        });
        const mapped = emails.map(email => ({
            ...email,
            status: mapStatusToFrontend(email.status)
        }));
        return res.json(mapped);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching importer emails:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getEmailsByImporter = getEmailsByImporter;
const createEmail = async (req, res) => {
    try {
        const { leadId, emailSubject, emailBody, recipientEmail, cc, bcc, status } = req.body;
        const mappedStatus = mapEmailStatus(status || 'DRAFT');
        const email = await index_js_1.prisma.email.create({
            data: {
                importerId: leadId,
                subject: emailSubject || '',
                body: emailBody || '',
                to: recipientEmail || '',
                from: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
                status: mappedStatus,
                direction: 'OUTBOUND',
                cc: cc || null,
                bcc: bcc || null
            },
            include: { importer: true }
        });
        // Map status back to frontend-friendly format
        const frontendStatus = status || 'Draft Generated';
        return res.json({ ...email, status: frontendStatus });
    }
    catch (error) {
        index_js_1.logger.error('Create email error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createEmail = createEmail;
const updateEmail = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const { leadId, emailSubject, emailBody, recipientEmail, cc, bcc, status } = req.body;
        const mappedStatus = mapEmailStatus(status || 'DRAFT');
        const email = await index_js_1.prisma.email.update({
            where: { id: id },
            data: {
                ...(leadId ? { importerId: leadId } : {}),
                ...(emailSubject !== undefined ? { subject: emailSubject } : {}),
                ...(emailBody !== undefined ? { body: emailBody } : {}),
                ...(recipientEmail !== undefined ? { to: recipientEmail } : {}),
                ...(cc !== undefined ? { cc: cc || null } : {}),
                ...(bcc !== undefined ? { bcc: bcc || null } : {}),
                ...(status !== undefined ? { status: mappedStatus } : {}),
            },
            include: { importer: true }
        });
        const frontendStatus = status || mapStatusToFrontend(email.status);
        return res.json({ ...email, status: frontendStatus });
    }
    catch (error) {
        index_js_1.logger.error('Update email error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateEmail = updateEmail;
const generateLeadEmail = async (req, res) => {
    try {
        const { companyName, country, leadType, coffeeInterest, contactName, leadId } = req.body;
        // ── Phase 1: Retrieve internal historical context (RAG) ──────────────────
        let ragContext = '';
        if (leadId) {
            try {
                const [pastEmails, quotations, samples, notes, activities] = await Promise.all([
                    index_js_1.prisma.email.findMany({
                        where: { importerId: leadId },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { subject: true, direction: true, status: true, createdAt: true, body: true }
                    }),
                    index_js_1.prisma.quotation.findMany({
                        where: { importerId: leadId },
                        orderBy: { createdAt: 'desc' },
                        take: 3,
                        select: { quotationNumber: true, product: true, quantity: true, price: true, currency: true, incoterm: true, status: true, validUntil: true }
                    }),
                    index_js_1.prisma.sample.findMany({
                        where: { importerId: leadId },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { product: true, format: true, weight: true, destination: true, status: true, feedback: true, createdAt: true }
                    }),
                    index_js_1.prisma.note.findMany({
                        where: { importerId: leadId },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { content: true, createdAt: true }
                    }),
                    index_js_1.prisma.activity.findMany({
                        where: { importerId: leadId },
                        orderBy: { createdAt: 'desc' },
                        take: 8,
                        select: { type: true, description: true, createdAt: true }
                    })
                ]);
                const ragParts = [];
                if (pastEmails.length > 0) {
                    ragParts.push(`PREVIOUS EMAIL HISTORY (${pastEmails.length} emails):\n` +
                        pastEmails.map(e => {
                            const date = new Date(e.createdAt).toLocaleDateString('en-GB');
                            const dir = e.direction === 'OUTBOUND' ? 'Sent' : 'Received';
                            return `  [${date}] ${dir}: "${e.subject}" (Status: ${e.status})`;
                        }).join('\n'));
                }
                if (quotations.length > 0) {
                    ragParts.push(`QUOTATION HISTORY (${quotations.length} quotations):\n` +
                        quotations.map(q => {
                            const valid = new Date(q.validUntil).toLocaleDateString('en-GB');
                            return `  ${q.quotationNumber}: ${q.product} ${q.quantity}kg @ $${q.price}/${q.currency} ${q.incoterm} — Status: ${q.status} — Valid Until: ${valid}`;
                        }).join('\n'));
                }
                if (samples.length > 0) {
                    ragParts.push(`SAMPLE SHIPMENT HISTORY (${samples.length} samples):\n` +
                        samples.map(s => {
                            const fb = s.feedback ? ` — Buyer Feedback: "${s.feedback}"` : '';
                            return `  ${s.product} (${s.format}, ${s.weight}) shipped to ${s.destination} — Status: ${s.status}${fb}`;
                        }).join('\n'));
                }
                if (notes.length > 0) {
                    ragParts.push(`INTERNAL NOTES:\n` +
                        notes.map(n => {
                            const date = new Date(n.createdAt).toLocaleDateString('en-GB');
                            return `  [${date}] ${n.content}`;
                        }).join('\n'));
                }
                if (activities.length > 0) {
                    ragParts.push(`RECENT ACTIVITIES:\n` +
                        activities.map(a => {
                            const date = new Date(a.createdAt).toLocaleDateString('en-GB');
                            return `  [${date}] ${a.type}: ${a.description}`;
                        }).join('\n'));
                }
                if (ragParts.length > 0) {
                    ragContext = `\n=== HISTORICAL CONTEXT FOR THIS LEAD ===\n${ragParts.join('\n\n')}\n=== END HISTORICAL CONTEXT ===\n`;
                    index_js_1.logger.info(`[RAG] Built context for lead ${leadId}: ${ragParts.length} sections`);
                }
                else {
                    index_js_1.logger.info(`[RAG] No historical data found for lead ${leadId} — using generic intro`);
                }
            }
            catch (ragErr) {
                index_js_1.logger.warn('[RAG] Failed to build historical context, proceeding without it:', ragErr);
            }
        }
        // ── Phase 2: Retrieve market context ─────────────────────────────────────
        let marketContext = '';
        try {
            const { MarketDataService } = await import('../services/market-data.service.js');
            const snap = await MarketDataService.getSnapshot();
            marketContext = MarketDataService.formatAsRagContext(snap);
            if (marketContext) {
                index_js_1.logger.info('[RAG] Market context injected into prompt');
            }
        }
        catch (mktErr) {
            index_js_1.logger.warn('[RAG] Market data unavailable, proceeding without it:', mktErr);
        }
        // ── Generate email with enriched context ──────────────────────────────────
        const baseContext = `Lead Type: ${leadType}, Country: ${country}, Coffee Interest: ${coffeeInterest}, Contact Name: ${contactName}`;
        const draft = await ai_service_js_1.AiService.generateEmailDraft(companyName, baseContext, 'professional', ragContext, marketContext);
        return res.json({ subject: draft.subject, body: draft.body });
    }
    catch (error) {
        index_js_1.logger.error('Lead email generation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.generateLeadEmail = generateLeadEmail;
const fetchGoogleDriveFile = async (req, res) => {
    try {
        const { driveLink } = req.body;
        if (!driveLink) {
            return res.status(400).json({ message: 'Google Drive link is required' });
        }
        // Extract file ID from various Google Drive link formats
        let fileId = '';
        const patterns = [
            /\/d\/([a-zA-Z0-9-_]+)/, // https://drive.google.com/file/d/FILE_ID/view...
            /id=([a-zA-Z0-9-_]+)/, // https://drive.google.com/open?id=FILE_ID
            /\/file\/d\/([a-zA-Z0-9-_]+)/ // Another pattern
        ];
        for (const pattern of patterns) {
            const match = driveLink.match(pattern);
            if (match) {
                fileId = match[1];
                break;
            }
        }
        if (!fileId) {
            return res.status(400).json({ message: 'Invalid Google Drive link' });
        }
        // Step 1: Check if Google Drive requires a virus scan confirmation
        const metadataUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const initialResponse = await axios_1.default.get(metadataUrl, {
            responseType: 'text',
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        let confirmToken = '';
        let downloadUrl = metadataUrl;
        // Look for confirm= token in the HTML (virus scan warning page)
        const htmlContent = typeof initialResponse.data === 'string' ? initialResponse.data : '';
        const confirmMatch = htmlContent.match(/confirm=([a-zA-Z0-9-_]+)/);
        if (confirmMatch) {
            confirmToken = confirmMatch[1];
            downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
        }
        // Step 2: Download the file
        const fileResponse = await axios_1.default.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 5
        });
        // Determine filename safely
        let filename = `google_drive_file_${fileId}`;
        const hdrs = fileResponse.headers || {};
        const contentDisposition = hdrs['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = String(contentDisposition).match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        const contentType = hdrs['content-type'] || 'application/octet-stream';
        // Check if response is HTML (virus scan page bypassed)
        const responseBuffer = Buffer.from(fileResponse.data);
        const isHtml = responseBuffer.slice(0, 200).includes('<html') || responseBuffer.slice(0, 200).includes('<!DOCTYPE');
        if (isHtml) {
            return res.status(502).json({
                message: 'File tidak dapat didownload langsung. Google Drive memerlukan konfirmasi. Pastikan file bisa diakses publik dan berukuran < 100MB.',
                hint: 'Coba download manual dari Google Drive'
            });
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(fileResponse.data);
    }
    catch (error) {
        index_js_1.logger.error('Google Drive file fetch error:', error);
        if (error.code === 'ERR_FR_TOO_MANY_REDIRECTS') {
            return res.status(502).json({
                message: 'Google Drive redirect loop. File mungkin terlalu besar atau memerlukan autentikasi.',
                hint: 'Download manual dari Google Drive, pastikan link bisa diakses publik'
            });
        }
        if (error.response?.status === 404) {
            return res.status(404).json({ message: 'Google Drive file tidak ditemukan. Periksa link.' });
        }
        return res.status(500).json({ message: 'Gagal mendownload file dari Google Drive. Coba download manual.' });
    }
};
exports.fetchGoogleDriveFile = fetchGoogleDriveFile;
//# sourceMappingURL=email.controller.js.map