import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import { prisma, logger } from '../index';
import nodemailer from 'nodemailer';
import { EmailSyncService } from '../services/email-sync.service';
import axios from 'axios';

// SMTP Configuration for Hostinger
// IMPORTANT: If Cloudflare proxy is active on smtp.hostinger.com domain,
// SMTP connections will TIMEOUT because Cloudflare only proxies HTTP/HTTPS (ports 80, 443),
// NOT SMTP (ports 25, 465, 587).
//
// Solution: Use the direct Hostinger mail server hostname that bypasses Cloudflare.
// Common Hostinger direct mail server hostnames:
//   - mx1.hostinger.com
//   - mx2.hostinger.com  
//   - The server hostname from your Hostinger control panel (e.g., srv1.hostinger.com or similar)
//
// To find your direct mail server:
// 1. Login to Hostinger hPanel → Emails → Email Accounts
// 2. Look for "Mail Server" or "Incoming/Outgoing Server" settings
// 3. Use that hostname here instead of smtp.hostinger.com
//
// Alternatively, in Cloudflare DNS:
// - Change the mail subdomain record from Proxied (orange cloud) to DNS Only (grey cloud)
// - Or add a separate record like "mail.yourdomain.com" pointing to Hostinger IP (DNS Only)
const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';

const smtpConfig = {
  host: smtpHost,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
    pass: process.env.SMTP_PASS || 'Ghfso#!@!5246!#!@g7',
  },
  // Timeout settings to prevent hanging
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
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

export const sendDirectEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'To, subject, and body are required' });
    }

    // Verify SMTP is configured before attempting send
    const smtpUser = process.env.SMTP_USER || 'marketing@nandaranusamontierra.com';
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpPass) {
      logger.warn('SMTP_PASS not configured - simulating send for development');
      // Simulate sending for development
      await prisma.email.create({
        data: {
          subject,
          body,
          from: smtpUser,
          to,
          status: 'SENT',
          direction: 'OUTBOUND',
          sentAt: new Date(),
          messageId: `simulated-${Date.now()}`
        }
      });
      return res.json({ message: 'Email simulated (SMTP not configured)', messageId: 'simulated' });
    }

    // Create a transport with timeout
    const tempTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000, // 10 second timeout
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info: any = await tempTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${smtpUser}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    tempTransporter.close();

    // Log the sent email in DB
    await prisma.email.create({
      data: {
        subject,
        body,
        from: smtpUser,
        to,
        status: 'SENT',
        direction: 'OUTBOUND',
        sentAt: new Date(),
        messageId: info.messageId
      }
    });

    return res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error: any) {
    logger.error('Direct email sending error:', error.message);
    // Check for specific SMTP errors
    if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.message?.includes('connect')) {
      return res.status(502).json({ message: `SMTP connection failed: ${error.message}. Check SMTP credentials in environment variables.` });
    }
    if (error.code === 'EAUTH') {
      return res.status(502).json({ message: 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS in environment variables.' });
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