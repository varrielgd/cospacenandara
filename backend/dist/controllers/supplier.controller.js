"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSuppliers = exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getAllSuppliers = void 0;
const index_js_1 = require("../index.js");
const multer_1 = __importDefault(require("multer"));
const xlsx_1 = __importDefault(require("xlsx"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await index_js_1.prisma.supplier.findMany({
            include: {
                supplierContacts: true,
                _count: {
                    select: { supplierNotes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(suppliers);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching suppliers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllSuppliers = getAllSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const supplier = await index_js_1.prisma.supplier.findUnique({
            where: { id: id },
            include: {
                supplierContacts: true,
                supplierNotes: true,
                activities: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        return res.json(supplier);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching supplier:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSupplierById = getSupplierById;
const createSupplier = async (req, res) => {
    try {
        const supplierData = req.body;
        const supplier = await index_js_1.prisma.supplier.create({
            data: supplierData
        });
        await index_js_1.prisma.activity.create({
            data: {
                userId: req.user.id,
                supplierId: supplier.id,
                type: 'SYSTEM',
                description: `Supplier ${supplier.companyName} created manually.`
            }
        });
        return res.status(201).json(supplier);
    }
    catch (error) {
        index_js_1.logger.error('Error creating supplier:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        const supplierData = req.body;
        const supplier = await index_js_1.prisma.supplier.update({
            where: { id: id },
            data: supplierData
        });
        return res.json(supplier);
    }
    catch (error) {
        index_js_1.logger.error('Error updating supplier:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: 'ID is required' });
        // Delete related records first
        await index_js_1.prisma.supplierContact.deleteMany({ where: { supplierId: id } });
        await index_js_1.prisma.note.deleteMany({ where: { supplierId: id } });
        await index_js_1.prisma.activity.deleteMany({ where: { supplierId: id } });
        await index_js_1.prisma.task.deleteMany({ where: { supplierId: id } });
        await index_js_1.prisma.supplier.delete({ where: { id: id } });
        return res.status(204).send();
    }
    catch (error) {
        index_js_1.logger.error('Error deleting supplier:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteSupplier = deleteSupplier;
const importSuppliers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const workbook = xlsx_1.default.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx_1.default.utils.sheet_to_json(sheet);
        const createdSuppliers = [];
        for (const row of data) {
            const existing = await index_js_1.prisma.supplier.findFirst({
                where: {
                    OR: [
                        { companyName: row.companyName || row.CompanyName || row.company_name },
                        { website: row.website || row.Website },
                        { email: row.email || row.Email }
                    ].filter(cond => Object.values(cond).some(v => v))
                }
            });
            if (!existing) {
                const created = await index_js_1.prisma.supplier.create({
                    data: {
                        companyName: row.companyName || row.CompanyName || row.company_name || '',
                        website: row.website || row.Website || null,
                        email: row.email || row.Email || null,
                        phone: row.phone || row.Phone || row.phone_number || null,
                        whatsapp: row.whatsapp || row.Whatsapp || null,
                        country: row.country || row.Country || null,
                        city: row.city || row.City || null,
                        address: row.address || row.Address || null,
                        coffeeTypes: row.coffeeType || row.CoffeeType || row.coffee_type || row.coffeeTypes || row.CoffeeTypes || null,
                        certifications: row.certifications || row.Certifications || null,
                        minimumOrderQty: row.minimumOrderQty || row.MinimumOrderQty || row.min_order_qty || null,
                    }
                });
                createdSuppliers.push(created);
                await index_js_1.prisma.activity.create({
                    data: {
                        userId: req.user.id,
                        supplierId: created.id,
                        type: 'SYSTEM',
                        description: `Supplier ${created.companyName} imported from Excel.`
                    }
                });
            }
        }
        return res.status(201).json({
            message: `Successfully processed ${data.length} suppliers. ${createdSuppliers.length} new records created.`,
            count: createdSuppliers.length,
            suppliers: createdSuppliers
        });
    }
    catch (error) {
        index_js_1.logger.error('Error importing suppliers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.importSuppliers = importSuppliers;
//# sourceMappingURL=supplier.controller.js.map