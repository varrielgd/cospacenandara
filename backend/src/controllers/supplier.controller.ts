import { Response } from 'express';
import { prisma, logger } from '../index';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import xlsx from 'xlsx';

const upload = multer({ dest: 'uploads/' });

export const getAllSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        supplierContacts: true,
        _count: {
          select: { supplierNotes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(suppliers);
  } catch (error) {
    logger.error('Error fetching suppliers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSupplierById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });

    const supplier = await prisma.supplier.findUnique({
      where: { id: id as string },
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
  } catch (error) {
    logger.error('Error fetching supplier:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplierData = req.body;
    const supplier = await prisma.supplier.create({
      data: supplierData
    });

    await prisma.activity.create({
      data: {
        userId: req.user!.id,
        supplierId: supplier.id,
        type: 'SYSTEM',
        description: `Supplier ${supplier.companyName} created manually.`
      }
    });

    return res.status(201).json(supplier);
  } catch (error) {
    logger.error('Error creating supplier:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    const supplierData = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: id as string },
      data: supplierData
    });

    return res.json(supplier);
  } catch (error) {
    logger.error('Error updating supplier:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    await prisma.supplier.delete({ where: { id: id as string } });
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting supplier:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const importSuppliers = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const createdSuppliers = [];
    for (const row of data as any[]) {
      const existing = await prisma.supplier.findFirst({
        where: {
          OR: [
            { companyName: row.companyName || row.CompanyName || row.company_name },
            { website: row.website || row.Website },
            { email: row.email || row.Email }
          ].filter(cond => Object.values(cond).some(v => v)) as any
        }
      });

      if (!existing) {
        const created = await prisma.supplier.create({
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

        await prisma.activity.create({
          data: {
            userId: req.user!.id,
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
  } catch (error) {
    logger.error('Error importing suppliers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
