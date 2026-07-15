"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importImportersFromExcel = exports.syncToSheets = exports.bulkCreateImporters = exports.deleteImporter = exports.updateImporter = exports.createImporter = exports.getImporterById = exports.getAllImporters = void 0;
const index_js_1 = require("../index.js");
const google_sheets_service_1 = require("../services/google-sheets.service");
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
const getAllImporters = async (req, res) => {
    try {
        const importers = await index_js_1.prisma.importer.findMany({
            include: {
                contacts: true,
                _count: {
                    select: { samples: true, quotations: true, emails: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(importers);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching importers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllImporters = getAllImporters;
const getImporterById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const importer = await index_js_1.prisma.importer.findUnique({
            where: { id: id },
            include: {
                contacts: true,
                samples: true,
                quotations: true,
                emails: true,
                activities: {
                    orderBy: { createdAt: 'desc' }
                },
                importerNotes: true,
                tasks: true,
                attachments: true
            }
        });
        if (!importer) {
            return res.status(404).json({ message: 'Importer not found' });
        }
        return res.json(importer);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching importer:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getImporterById = getImporterById;
const createImporter = async (req, res) => {
    try {
        const importerData = req.body;
        const cleanData = {
            ...importerData,
            website: importerData.website && importerData.website.trim() !== '' ? importerData.website : null,
            email: importerData.email && importerData.email.trim() !== '' ? importerData.email : null,
            phone: importerData.phone && importerData.phone.trim() !== '' ? importerData.phone : null,
            linkedin: importerData.linkedin && importerData.linkedin.trim() !== '' ? importerData.linkedin : null,
        };
        const importer = await index_js_1.prisma.importer.create({
            data: cleanData
        });
        // Log activity
        await index_js_1.prisma.activity.create({
            data: {
                userId: req.user.id,
                importerId: importer.id,
                type: 'SYSTEM',
                description: `Importer ${importer.companyName} created manually.`
            }
        });
        // Sync to Google Sheets
        await google_sheets_service_1.GoogleSheetsService.syncImporter(importer);
        return res.status(201).json(importer);
    }
    catch (error) {
        index_js_1.logger.error('Error creating importer:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createImporter = createImporter;
const updateImporter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const importerData = req.body;
        const importer = await index_js_1.prisma.importer.update({
            where: { id: id },
            data: importerData
        });
        return res.json(importer);
    }
    catch (error) {
        index_js_1.logger.error('Error updating importer:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateImporter = updateImporter;
const deleteImporter = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        await index_js_1.prisma.importer.delete({ where: { id: id } });
        return res.status(204).send();
    }
    catch (error) {
        index_js_1.logger.error('Error deleting importer:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteImporter = deleteImporter;
const bulkCreateImporters = async (req, res) => {
    try {
        const { importers } = req.body;
        if (!importers || !Array.isArray(importers)) {
            return res.status(400).json({ message: 'Importers array is required' });
        }
        const createdImporters = [];
        for (const data of importers) {
            // Basic check for existing
            const existing = await index_js_1.prisma.importer.findFirst({
                where: {
                    OR: [
                        { companyName: data.companyName },
                        { website: data.website || undefined },
                        { email: data.email || undefined }
                    ].filter(cond => cond.companyName || cond.website || cond.email)
                }
            });
            if (!existing) {
                const created = await index_js_1.prisma.importer.create({
                    data: {
                        companyName: data.companyName,
                        website: data.website && data.website.trim() !== '' ? data.website : null,
                        email: data.email && data.email.trim() !== '' ? data.email : null,
                        phone: data.phone && data.phone.trim() !== '' ? data.phone : null,
                        country: data.country,
                        city: data.city,
                        leadScore: data.leadScore,
                        status: data.status || 'NEW',
                        notes: data.notes,
                        linkedin: data.linkedin && data.linkedin.trim() !== '' ? data.linkedin : null
                    }
                });
                createdImporters.push(created);
                // Activity log
                await index_js_1.prisma.activity.create({
                    data: {
                        userId: req.user.id,
                        importerId: created.id,
                        type: 'SYSTEM',
                        description: `Importer ${created.companyName} added via Discovery.`
                    }
                });
                // Sheets sync
                await google_sheets_service_1.GoogleSheetsService.syncImporter(created).catch(() => { });
            }
        }
        return res.status(201).json({
            message: `Successfully processed ${importers.length} importers. ${createdImporters.length} new records created.`,
            count: createdImporters.length
        });
    }
    catch (error) {
        index_js_1.logger.error('Error bulk creating importers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.bulkCreateImporters = bulkCreateImporters;
const syncToSheets = async (req, res) => {
    try {
        const { importerId } = req.body;
        if (!importerId)
            return res.status(400).json({ message: 'Importer ID is required' });
        const importer = await index_js_1.prisma.importer.findUnique({
            where: { id: importerId }
        });
        if (!importer)
            return res.status(404).json({ message: 'Importer not found' });
        await google_sheets_service_1.GoogleSheetsService.syncImporter(importer);
        return res.json({ message: 'Successfully synced to Google Sheets' });
    }
    catch (error) {
        index_js_1.logger.error('Error syncing to sheets:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.syncToSheets = syncToSheets;
const importImportersFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }
        // Read and parse Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        const createdImporters = [];
        for (const row of data) {
            const existing = await index_js_1.prisma.importer.findFirst({
                where: {
                    OR: [
                        { companyName: row.companyName },
                        { website: row.website || undefined },
                        { email: row.email || undefined }
                    ].filter(Boolean)
                }
            });
            if (!existing) {
                const created = await index_js_1.prisma.importer.create({
                    data: {
                        companyName: row.companyName,
                        website: row.website || null,
                        email: row.email || null,
                        phone: row.phone || null,
                        whatsapp: row.whatsapp || null,
                        linkedin: row.linkedin || null,
                        country: row.country || null,
                        city: row.city || null,
                        address: row.address || null,
                        coffeeType: row.coffeeType || null,
                        greenBeanInterest: row.greenBeanInterest || false,
                        roastedBeanInterest: row.roastedBeanInterest || false,
                        status: row.status || 'NEW'
                    }
                });
                createdImporters.push(created);
                await index_js_1.prisma.activity.create({
                    data: {
                        userId: req.user.id,
                        importerId: created.id,
                        type: 'SYSTEM',
                        description: `Importer ${created.companyName} imported from Excel`
                    }
                });
            }
        }
        fs.unlinkSync(req.file.path);
        return res.status(201).json({
            message: `Successfully imported ${createdImporters.length} new importers`,
            count: createdImporters.length,
            importers: createdImporters
        });
    }
    catch (error) {
        index_js_1.logger.error('Error importing importers:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
exports.importImportersFromExcel = importImportersFromExcel;
//# sourceMappingURL=importer.controller.js.map