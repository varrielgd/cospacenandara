import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import { prisma, logger } from '../index';
import nodemailer from 'nodemailer';
import { EmailSyncService } from '../services/email-sync.service';
import axios from 'axios';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
    pass: process.env.SMTP_PASS || 'Ghfso#!@!5246!#!@g7',
  },
});

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

    return res.json(email);
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
    return res.json(email);
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
    const info = await transporter.sendMail({
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
    return res.json(emails);
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

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    // Log the sent email in DB
    await prisma.email.create({
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
  } catch (error) {
    logger.error('Direct email sending error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInbox = async (_req: AuthRequest, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      where: { direction: 'INBOUND' },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });
    return res.json(emails);
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
    return res.json(emails);
  } catch (error) {
    logger.error('Error fetching importer emails:', error);
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
    
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Fetch the file with axios
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    });
    
    // Get filename from Content-Disposition if available, otherwise default
    let filename = 'downloaded_file';
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Get content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // Return the file data
    res.setHeader('Content-Type', contentType as string);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(response.data);
    
  } catch (error) {
    logger.error('Google Drive file fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
