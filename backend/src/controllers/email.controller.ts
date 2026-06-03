import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import { prisma, logger } from '../index';
import nodemailer from 'nodemailer';
import { EmailSyncService } from '../services/email-sync.service';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
        from: process.env.SMTP_FROM || '',
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
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER}>`,
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

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        importerId: email.importerId,
        type: 'EMAIL',
        description: `Email sent to ${email.importer?.companyName || 'Unknown'}: ${email.subject}`
      }
    });

    return res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    logger.error('Email sending error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const syncInbox = async (req: AuthRequest, res: Response) => {
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
