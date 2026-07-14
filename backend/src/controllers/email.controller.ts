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
    const recipientTo = email.to || undefined;
    if (!recipientTo) {
      return res.status(400).json({ message: 'Recipient email address is missing' });
    }

    const sendResult = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
      to: recipientTo,
      subject: email.subject,
      text: email.body,
      html: email.body.replace(/\n/g, '<br>'),
    });

    const resultMessageId = typeof sendResult === 'object' && sendResult !== null ? (sendResult as any).messageId || null : null;

    await prisma.email.update({
      where: { id: id as string },
      data: { 
        status: 'SENT',
        sentAt: new Date(),
        messageId: resultMessageId
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

    return res.json({ message: 'Email sent successfully', messageId: resultMessageId });
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

    const sendResult = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Nandara Nusa Montierra'}" <${process.env.SMTP_USER || 'marketing@nandaranusamontierra.com'}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    const resultMessageId = typeof sendResult === 'object' && sendResult !== null ? (sendResult as any).messageId || null : null;

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
        messageId: resultMessageId
      }
    });

    return res.json({ message: 'Email sent successfully', messageId: resultMessageId });
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

export const createEmail = async (req: AuthRequest, res: Response) => {
  try {
    const {
      leadId,
      emailSubject,
      emailBody,
      recipientEmail,
      cc,
      bcc,
      status,
      approved,
      attachPdfQuotation,
      attachCatalogue,
      catalogueDriveLink,
      attachSampleOffer,
      sampleOfferDriveLink,
      attachCompanyProfile,
      companyProfileDriveLink,
      attachPriceList,
      priceListDriveLink,
      attachSampleProgram,
      sampleProgramDriveLink,
      attachQuotation,
      quotationDriveLink,
      attachProformaInvoice,
      proformaInvoiceDriveLink,
      draftGeneratedAt,
      pendingReviewAt,
      editedByUserAt,
      approvedAt,
      readyToSendAt,
      sentAt,
      sentDate
    } = req.body;

    // Parse dates
    const parseDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr) : null;

    const email = await prisma.email.create({
      data: {
        importerId: leadId,
        subject: emailSubject,
        body: emailBody,
        to: recipientEmail,
        from: process.env.SMTP_USER || 'marketing@nandaranusamontierra.com',
        status: status as any,
        approved,
        attachPdfQuotation,
        attachCatalogue,
        catalogueDriveLink,
        attachSampleOffer,
        sampleOfferDriveLink,
        attachCompanyProfile,
        companyProfileDriveLink,
        attachPriceList,
        priceListDriveLink,
        attachSampleProgram,
        sampleProgramDriveLink,
        attachQuotation,
        quotationDriveLink,
        attachProformaInvoice,
        proformaInvoiceDriveLink,
        cc,
        bcc,
        draftGeneratedAt: parseDate(draftGeneratedAt),
        pendingReviewAt: parseDate(pendingReviewAt),
        editedByUserAt: parseDate(editedByUserAt),
        approvedAt: parseDate(approvedAt),
        readyToSendAt: parseDate(readyToSendAt),
        sentAt: parseDate(sentAt),
        sentDate
      },
      include: { importer: true }
    });

    return res.json(email);
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
      status,
      approved,
      attachPdfQuotation,
      attachCatalogue,
      catalogueDriveLink,
      attachSampleOffer,
      sampleOfferDriveLink,
      attachCompanyProfile,
      companyProfileDriveLink,
      attachPriceList,
      priceListDriveLink,
      attachSampleProgram,
      sampleProgramDriveLink,
      attachQuotation,
      quotationDriveLink,
      attachProformaInvoice,
      proformaInvoiceDriveLink,
      draftGeneratedAt,
      pendingReviewAt,
      editedByUserAt,
      approvedAt,
      readyToSendAt,
      sentAt,
      sentDate
    } = req.body;

    // Parse dates
    const parseDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr) : null;

    const email = await prisma.email.update({
      where: { id: id as string },
      data: {
        importerId: leadId,
        subject: emailSubject,
        body: emailBody,
        to: recipientEmail,
        status: status as any,
        approved,
        attachPdfQuotation,
        attachCatalogue,
        catalogueDriveLink,
        attachSampleOffer,
        sampleOfferDriveLink,
        attachCompanyProfile,
        companyProfileDriveLink,
        attachPriceList,
        priceListDriveLink,
        attachSampleProgram,
        sampleProgramDriveLink,
        attachQuotation,
        quotationDriveLink,
        attachProformaInvoice,
        proformaInvoiceDriveLink,
        cc,
        bcc,
        draftGeneratedAt: parseDate(draftGeneratedAt),
        pendingReviewAt: parseDate(pendingReviewAt),
        editedByUserAt: parseDate(editedByUserAt),
        approvedAt: parseDate(approvedAt),
        readyToSendAt: parseDate(readyToSendAt),
        sentAt: parseDate(sentAt),
        sentDate
      },
      include: { importer: true }
    });

    return res.json(email);
  } catch (error) {
    logger.error('Update email error:', error);
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
    
    // Step 1: Try to get the download confirmation token first
    // Google Drive often requires a confirmation token for virus scanning
    const metadataUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const initialResponse = await axios.get(metadataUrl, {
      responseType: 'text',
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    let confirmToken = '';
    let downloadUrl = metadataUrl;
    
    // Check if we need a confirmation token (virus scan warning page)
    const htmlContent = typeof initialResponse.data === 'string' ? initialResponse.data : '';
    const confirmMatch = htmlContent.match(/confirm=([a-zA-Z0-9-_]+)/);
    
    if (confirmMatch) {
      confirmToken = confirmMatch[1];
      downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
    }
    
    // Step 2: Download the actual file with the confirmation token if needed
    const fileResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      maxRedirects: 5
    });
    
    // Determine filename safely (headers may be undefined)
    let filename = `google_drive_file_${fileId}`;
    const contentDisposition = fileResponse.headers ? fileResponse.headers['content-disposition'] : undefined;
    
    if (contentDisposition) {
      try {
        const filenameMatch = String(contentDisposition).match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          const rawName = filenameMatch[1].replace(/['"]/g, '');
          // Decode URL-encoded filenames from Google Drive
          filename = decodeURIComponent(rawName);
        }
      } catch (parseErr) {
        // Ignore filename parsing errors, use default
      }
    }
    
    // Determine extension from content-type or sanitize filename
    const contentType = fileResponse.headers ? (fileResponse.headers['content-type'] as string || 'application/octet-stream') : 'application/octet-stream';
    
    // If filename has no extension, try to add one based on content type
    if (!filename.includes('.')) {
      const extMap: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-excel': '.xls',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'text/plain': '.txt',
        'text/csv': '.csv'
      };
      const ext = extMap[contentType] || '';
      filename += ext;
    }
    
    // Check if the response is actually an HTML page (error or virus scan)
    const responseBuffer = Buffer.from(fileResponse.data);
    const isHtml = responseBuffer.slice(0, 100).includes('<html') || responseBuffer.slice(0, 100).includes('<!DOCTYPE');
    
    if (isHtml && !confirmToken) {
      // Try once more with a confirm token from the error page
      const errorHtml = responseBuffer.toString('utf-8', 0, 2000);
      const retryMatch = errorHtml.match(/confirm=([a-zA-Z0-9-_]+)/);
      if (retryMatch) {
        const retryUrl = `https://drive.google.com/uc?export=download&confirm=${retryMatch[1]}&id=${fileId}`;
        const retryResponse = await axios.get(retryUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          maxRedirects: 5
        });
        
        const retryBuffer = Buffer.from(retryResponse.data);
        const retryIsHtml = retryBuffer.slice(0, 100).includes('<html') || retryBuffer.slice(0, 100).includes('<!DOCTYPE');
        
        if (!retryIsHtml) {
          const retryFilename = 'downloaded_file';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${retryFilename}"`);
          return res.send(retryResponse.data);
        }
      }
      
      return res.status(502).json({ 
        message: 'File tidak dapat didownload langsung. Google Drive memerlukan akses browser. Pastikan file berukuran < 100MB dan link bisa diakses publik.',
        hint: 'Coba download manual dari Google Drive, atau gunakan file yang lebih kecil'
      });
    }
    
    // Return the file data
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(fileResponse.data);
    
  } catch (error: any) {
    logger.error('Google Drive file fetch error:', error);
    
    // Provide more specific error messages
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
