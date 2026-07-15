import { Request, Response } from 'express';
import { prisma, logger } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { PdfService } from '../services/pdf.service';
import { MarketDataService } from '../services/market-data.service';

export const suggestPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { product, incoterm } = req.body;
    const snap = await MarketDataService.getSnapshot();
    
    if (!snap.arabicaPrice) {
      return res.status(503).json({ message: 'Live market data temporarily unavailable' });
    }

    const basePricePerKg = snap.arabicaPrice * 2.2046; // Convert USD/lb to USD/kg
    let margin = 0.80; // Default margin
    
    // Adjust margin based on product string match
    const pLower = (product || '').toLowerCase();
    if (pLower.includes('gayo') || pLower.includes('toraja') || pLower.includes('lintong') || pLower.includes('mandheling')) {
      margin = 1.00; // Higher margin for premium origins
    } else if (pLower.includes('robusta')) {
      // Robusta pricing logic (using flat rate or lower margin from Arabica base if robusta futures not tracked yet)
      margin = -0.50; // Hack: price robusta lower than arabica base
    }

    let calculatedPrice = basePricePerKg + margin;

    // Adjust for incoterm
    const iLower = (incoterm || '').toLowerCase();
    if (iLower.includes('cif')) {
      calculatedPrice += 0.50; // Add freight estimate
    }

    return res.json({
      suggestedPrice: parseFloat(calculatedPrice.toFixed(2)),
      arabicaPrice: snap.arabicaPrice,
      marginApplied: margin,
      message: `Suggested price calculated based on live Arabica futures ($${snap.arabicaPrice}/lb).`
    });
  } catch (error) {
    logger.error('Error suggesting price:', error);
    return res.status(500).json({ message: 'Internal server error calculating dynamic price' });
  }
};

export const getAllQuotations = async (_req: AuthRequest, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { importer: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(quotations);
  } catch (error) {
    logger.error('Error fetching quotations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      importerId, product, quantity, price, 
      type, shipmentType, packaging, paymentTerms, incoterm,
      currency, validUntil 
    } = req.body;
    
    const importer = await prisma.importer.findUnique({ where: { id: importerId as string } });
    if (!importer) return res.status(404).json({ message: 'Importer not found' });

    // Business Logic: MOQ Check based on infographic
    if (type === 'COMMERCIAL') {
      if (shipmentType === 'AIR_FREIGHT' && quantity < 10) {
        return res.status(400).json({ message: 'Air Freight MOQ is 10 KG+' });
      }
      if (shipmentType === 'LCL_SHIPMENT' && quantity < 100) {
        return res.status(400).json({ message: 'LCL Shipment MOQ is 100 KG+' });
      }
      if (shipmentType === 'FCL_SHIPMENT' && quantity < 10000) {
        return res.status(400).json({ message: 'FCL Shipment MOQ is 10 MT+' });
      }
    } else if (type === 'SAMPLE') {
      if (quantity < 1 || quantity > 5) {
        return res.status(400).json({ message: 'Sample Order MOQ is 1-5 KG' });
      }
    }

    const quotationNumber = `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        importerId: importerId as string,
        product,
        quantity,
        price,
        type: type || 'COMMERCIAL',
        shipmentType: shipmentType || (type === 'SAMPLE' ? 'SAMPLE_ORDER' : 'LCL_SHIPMENT'),
        packaging: packaging || 'GRAINPRO_JUTE_30_60KG',
        paymentTerms: paymentTerms || 'TT_50_DEPOSIT_50_BEFORE_SHIPMENT',
        incoterm: incoterm || 'FOB',
        currency: currency || 'USD',
        leadTimeDays: type === 'SAMPLE' ? 5 : 21,
        validUntil: new Date(validUntil),
        status: 'DRAFT'
      }
    });

    // Generate PDF
    try {
      const pdfPath = await PdfService.generateQuotationPdf(quotation, importer);
      await prisma.quotation.update({
        where: { id: quotation.id },
        data: { pdfPath }
      });
    } catch (pdfError) {
      logger.error('Failed to generate PDF during quotation creation:', pdfError);
    }

    if (req.user) {
      await prisma.activity.create({
        data: {
          userId: req.user.id,
          importerId: quotation.importerId,
          type: 'QUOTATION',
          description: `Quotation ${quotationNumber} created for ${product}.`
        }
      });
    }

    return res.status(201).json(quotation);
  } catch (error) {
    logger.error('Error creating quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    const quotationData = req.body;

    const quotation = await prisma.quotation.update({
      where: { id: id as string },
      data: quotationData
    });

    return res.json(quotation);
  } catch (error) {
    logger.error('Error updating quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    await prisma.quotation.delete({ where: { id: id as string } });
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
