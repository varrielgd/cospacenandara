"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuotation = exports.updateQuotation = exports.createQuotation = exports.getAllQuotations = void 0;
const index_1 = require("../index");
const pdf_service_1 = require("../services/pdf.service");
const getAllQuotations = async (req, res) => {
    try {
        const quotations = await index_1.prisma.quotation.findMany({
            include: { importer: { select: { companyName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(quotations);
    }
    catch (error) {
        index_1.logger.error('Error fetching quotations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllQuotations = getAllQuotations;
const createQuotation = async (req, res) => {
    try {
        const { importerId, product, quantity, price, type, shipmentType, packaging, paymentTerms, incoterm, currency, validUntil } = req.body;
        const importer = await index_1.prisma.importer.findUnique({ where: { id: importerId } });
        if (!importer)
            return res.status(404).json({ message: 'Importer not found' });
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
        }
        else if (type === 'SAMPLE') {
            if (quantity < 1 || quantity > 5) {
                return res.status(400).json({ message: 'Sample Order MOQ is 1-5 KG' });
            }
        }
        const quotationNumber = `QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const quotation = await index_1.prisma.quotation.create({
            data: {
                quotationNumber,
                importerId: importerId,
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
            const pdfPath = await pdf_service_1.PdfService.generateQuotationPdf(quotation, importer);
            await index_1.prisma.quotation.update({
                where: { id: quotation.id },
                data: { pdfPath }
            });
        }
        catch (pdfError) {
            index_1.logger.error('Failed to generate PDF during quotation creation:', pdfError);
        }
        await index_1.prisma.activity.create({
            data: {
                userId: req.user.id,
                importerId: quotation.importerId,
                type: 'QUOTATION',
                description: `Quotation ${quotationNumber} created for ${product}.`
            }
        });
        return res.status(201).json(quotation);
    }
    catch (error) {
        index_1.logger.error('Error creating quotation:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createQuotation = createQuotation;
const updateQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const quotationData = req.body;
        const quotation = await index_1.prisma.quotation.update({
            where: { id: id },
            data: quotationData
        });
        return res.json(quotation);
    }
    catch (error) {
        index_1.logger.error('Error updating quotation:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateQuotation = updateQuotation;
const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        await index_1.prisma.quotation.delete({ where: { id: id } });
        return res.status(204).send();
    }
    catch (error) {
        index_1.logger.error('Error deleting quotation:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteQuotation = deleteQuotation;
//# sourceMappingURL=quotation.controller.js.map