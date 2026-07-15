import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import { prisma, logger } from '../index';
import nodemailer from 'nodemailer';
import { EmailSyncService } from '../services/email-sync.service';
import axios from 'axios';

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
  secure: smtpSecure,        // true only for port 465 (direct SSL)
  requireTLS: !smtpSecure,   // force STARTTLS upgrade on port 587
  auth: {
    user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs (common on shared hosting)
    minVersion: 'TLSv1.2' as const,
  },
  // Generous timeout settings for cloud-hosted backend
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 45000,
};

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Maps frontend status strings to valid Prisma EmailStatus enum values
 */
function mapEmailStatus(status: string): string {
  const statusMap: Record<string, string> = {
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
function mapStatusToFrontend(status: string): string {
  const frontendMap: Record<string, string> = {
    'DRAFT': 'Draft Generated',
    'APPROVED': 'Approved',
    'SENT': 'Sent',
    'RECEIVED': 'Received',
    'BOUNCED': 'Bounced'
  };
  return frontendMap[status] || status;
}

export const generateDraft = async (req: AuthRequest, res: Response) => {
  try {
    const { importerId, context, tone } = req.body;
    
    const importer = await prisma.importer.findUnique({ where: { id: importerId as string } });
    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    const draft = await AiService.generateEmailDraft(importer.companyName, context, tone);

    const email = await prisma.email.create({
      data: {
        importerId: importerId as string,
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
  } catch (error) {
    logger.error('Email draft generation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const email = await prisma.email.update({
      where: { id: id as string },
      data: { status: 'APPROVED' }
    });
    return res.json({ ...email, status: 'Approved' });
  } catch (error) {
    logger.error('Email approval error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const email = await prisma.email.findUnique({ 
      where: { id: id as string },
      include: { importer: true }
    });

    if (!email) return res.status(404).json({ message: 'Email not found' });
    if (email.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Email must be approved before sending' });
    }

    // Send actual email via Hostinger SMTP
    const info: any = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
      to: email.to,
      subject: email.subject,
      text: email.body,
      html: email.body.replace(/\n/g, '<br>'),
    });

    await prisma.email.update({
      where: { id: id as string },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
        messageId: info.messageId
      }
    });

    if (email.importerId) {
      await prisma.activity.create({
        data: {
          userId: req.user!.id,
          importerId: email.importerId,
          type: 'EMAIL',
          description: `Email sent to ${email.importer?.companyName || 'Unknown'}: ${email.subject}`
        }
      });
    }

    return res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    logger.error('Email sending error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllEmails = async (_req: AuthRequest, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      include: { importer: true },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = emails.map(email => ({
      ...email,
      status: mapStatusToFrontend(email.status)
    }));
    return res.json(mapped);
  } catch (error) {
    logger.error('Get all emails error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP-based email helpers (bypass SMTP port blocking on cloud platforms)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send via Resend API (https://resend.com) — free 3,000 emails/month.
 * Requires RESEND_API_KEY env var. Domain must be verified in Resend dashboard.
 */
async function sendViaResend(
  to: string, subject: string, body: string,
  fromName: string, fromEmail: string
): Promise<string> {
  const response = await axios.post(
    'https://api.resend.com/emails',
    {
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html: body.replace(/\n/g, '<br>'),
      text: body,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
  return (response.data as any).id || 'resend-sent';
}

/**
 * Send via Brevo (Sendinblue) API — free 300 emails/day.
 * Requires BREVO_API_KEY env var.
 */
async function sendViaBrevo(
  to: string, subject: string, body: string,
  fromName: string, fromEmail: string
): Promise<string> {
  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: body.replace(/\n/g, '<br>'),
      textContent: body,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
  return (response.data as any).messageId || 'brevo-sent';
}

export const sendDirectEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'To, subject, and body are required' });
    }

    const smtpUser  = process.env.SMTP_USER  || 'marketing@nandaranusamontierra.com';
    const smtpPass  = process.env.SMTP_PASS;
    const fromName  = process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra';

    let messageId: string;
    let method: string;

    // ── Priority 1: Resend HTTP API (recommended for cloud hosting) ──────────
    if (process.env.RESEND_API_KEY) {
      logger.info(`Sending via Resend API to ${to}`);
      messageId = await sendViaResend(to, subject, body, fromName, smtpUser);
      method = 'resend';

    // ── Priority 2: Brevo HTTP API ───────────────────────────────────────────
    } else if (process.env.BREVO_API_KEY) {
      logger.info(`Sending via Brevo API to ${to}`);
      messageId = await sendViaBrevo(to, subject, body, fromName, smtpUser);
      method = 'brevo';

    // ── Priority 3: SMTP (may be blocked on Render/Heroku/etc.) ─────────────
    } else if (smtpPass) {
      const resolvedPort   = parseInt(process.env.SMTP_PORT || '587');
      const resolvedSecure = resolvedPort === 465;
      const smtpHost       = process.env.SMTP_HOST || 'smtp.hostinger.com';

      logger.info(`Sending via SMTP ${smtpHost}:${resolvedPort} (secure=${resolvedSecure}) to ${to}`);

      const tempTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: resolvedPort,
        secure: resolvedSecure,
        requireTLS: !resolvedSecure,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' as const },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 45000,
      });

      const info: any = await tempTransporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to, subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });
      tempTransporter.close();
      messageId = info.messageId;
      method = 'smtp';

    // ── Fallback: Simulate (dev/no credentials) ──────────────────────────────
    } else {
      logger.warn('No email credentials configured — simulating send');
      await prisma.email.create({
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
    await prisma.email.create({
      data: {
        subject, body,
        from: smtpUser, to,
        status: 'SENT', direction: 'OUTBOUND',
        sentAt: new Date(),
        messageId,
      }
    });

    logger.info(`Email sent successfully via ${method}. messageId=${messageId}`);
    return res.json({ message: 'Email sent successfully', messageId, method });

  } catch (error: any) {
    // Log full error details to help diagnose issues
    logger.error('Direct email sending error', {
      message: error.message,
      code:    error.code,
      response: error.response?.data,
      status:   error.response?.status,
      stack:    error.stack,
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

export const getInbox = async (_req: AuthRequest, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      where: { direction: 'INBOUND' },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });
    const mapped = emails.map(email => ({
      ...email,
      status: mapStatusToFrontend(email.status)
    }));
    return res.json(mapped);
  } catch (error) {
    logger.error('Error fetching inbox:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const syncInbox = async (_req: AuthRequest, res: Response) => {
  try {
    await EmailSyncService.syncInbox();
    return res.json({ message: 'Inbox sync completed successfully' });
  } catch (error) {
    logger.error('Inbox sync error:', error);
    return res.status(500).json({ message: 'Internal server error during sync' });
  }
};

export const getEmailsByImporter = async (req: AuthRequest, res: Response) => {
  try {
    const { importerId } = req.params;
    const emails = await prisma.email.findMany({
      where: { importerId: importerId as string },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = emails.map(email => ({
      ...email,
      status: mapStatusToFrontend(email.status)
    }));
    return res.json(mapped);
  } catch (error) {
    logger.error('Error fetching importer emails:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { leadId, emailSubject, emailBody, recipientEmail, cc, bcc, status } = req.body;

    const mappedStatus = mapEmailStatus(status || 'DRAFT');

    const email = await prisma.email.create({
      data: {
        importerId: leadId,
        subject: emailSubject || '',
        body: emailBody || '',
        to: recipientEmail || '',
        from: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
        status: mappedStatus as any,
        direction: 'OUTBOUND',
        cc: cc || null,
        bcc: bcc || null
      },
      include: { importer: true }
    });

    // Map status back to frontend-friendly format
    const frontendStatus = status || 'Draft Generated';
    return res.json({ ...email, status: frontendStatus });
  } catch (error) {
    logger.error('Create email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const {
      leadId,
      emailSubject,
      emailBody,
      recipientEmail,
      cc,
      bcc,
      status
    } = req.body;

    const mappedStatus = mapEmailStatus(status || 'DRAFT');

    const email = await prisma.email.update({
      where: { id: id as string },
      data: {
        ...(leadId ? { importerId: leadId } : {}),
        ...(emailSubject !== undefined ? { subject: emailSubject } : {}),
        ...(emailBody !== undefined ? { body: emailBody } : {}),
        ...(recipientEmail !== undefined ? { to: recipientEmail } : {}),
        ...(cc !== undefined ? { cc: cc || null } : {}),
        ...(bcc !== undefined ? { bcc: bcc || null } : {}),
        ...(status !== undefined ? { status: mappedStatus as any } : {}),
      },
      include: { importer: true }
    });

    const frontendStatus = status || mapStatusToFrontend(email.status);
    return res.json({ ...email, status: frontendStatus });
  } catch (error) {
    logger.error('Update email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const generateLeadEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, country, leadType, coffeeInterest, contactName } = req.body;
    
    // Create context string for AI
    const context = `Lead Type: ${leadType}, Country: ${country}, Coffee Interest: ${coffeeInterest}, Contact Name: ${contactName}`;
    
    const draft = await AiService.generateEmailDraft(companyName, context, 'professional');
    
    return res.json({ subject: draft.subject, body: draft.body });
  } catch (error) {
    logger.error('Lead email generation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const fetchGoogleDriveFile = async (req: AuthRequest, res: Response) => {
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
    
    const initialResponse = await axios.get(metadataUrl, {
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
    const fileResponse = await axios.get(downloadUrl, {
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
    
    res.setHeader('Content-Type', contentType as string);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(fileResponse.data);
    
  } catch (error: any) {
    logger.error('Google Drive file fetch error:', error);
    
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