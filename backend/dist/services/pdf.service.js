"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_js_1 = require("../index.js");
class PdfService {
    static async generateQuotationPdf(quotation, importer) {
        return new Promise((resolve, reject) => {
            try {
                const fileName = `quotation-${quotation.quotationNumber}.pdf`;
                const filePath = path_1.default.join(process.cwd(), 'uploads', fileName);
                const doc = new pdfkit_1.default();
                const stream = fs_1.default.createWriteStream(filePath);
                doc.pipe(stream);
                // Header
                doc.fontSize(25).text('COFFEE QUOTATION', { align: 'center' });
                doc.moveDown();
                // Info
                doc.fontSize(12).text(`Quotation Number: ${quotation.quotationNumber}`);
                doc.text(`Date: ${new Date().toLocaleDateString()}`);
                doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`);
                doc.moveDown();
                // Buyer Info
                doc.fontSize(14).text('BUYER INFO:', { underline: true });
                doc.fontSize(12).text(`Company: ${importer.companyName}`);
                doc.text(`Website: ${importer.website || 'N/A'}`);
                doc.moveDown();
                // Details
                doc.fontSize(14).text('PRODUCT & SHIPMENT DETAILS:', { underline: true });
                doc.fontSize(12).text(`Product: ${quotation.product}`);
                doc.text(`Quantity: ${quotation.quantity} KG`);
                doc.text(`Price: ${quotation.price} ${quotation.currency}`);
                doc.text(`Incoterm: ${quotation.incoterm}`);
                doc.text(`Shipment: ${quotation.shipmentType.replace('_', ' ')}`);
                doc.text(`Packaging: ${quotation.packaging.replace(/_/g, ' ')}`);
                doc.text(`Payment Terms: ${quotation.paymentTerms.replace(/_/g, ' ')}`);
                doc.text(`Est. Lead Time: ${quotation.leadTimeDays} days`);
                doc.moveDown();
                // Footer
                doc.fontSize(10).text('Quality Standards: Export-grade sorted, controlled moisture.', { align: 'center' });
                doc.text('Documents included: Invoice, Packing List, B/L, CO, Phytosanitary, ICO.', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text('Thank you for your business!', { align: 'center', oblique: true });
                doc.end();
                stream.on('finish', () => {
                    resolve(fileName);
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            }
            catch (error) {
                index_js_1.logger.error('PDF Generation error:', error);
                reject(error);
            }
        });
    }
}
exports.PdfService = PdfService;
//# sourceMappingURL=pdf.service.js.map