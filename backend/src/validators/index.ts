import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

export const importerValidator = [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('website').optional().isURL().withMessage('Invalid website URL'),
  validateRequest
];

export const quotationValidator = [
  body('importerId').notEmpty().withMessage('Importer ID is required'),
  body('product').notEmpty().withMessage('Product is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('type').optional().isIn(['SAMPLE', 'COMMERCIAL']).withMessage('Invalid quotation type'),
  body('shipmentType').optional().isIn(['AIR_FREIGHT', 'LCL_SHIPMENT', 'FCL_SHIPMENT', 'SAMPLE_ORDER']).withMessage('Invalid shipment type'),
  body('packaging').optional().isIn(['VACUUM_GRAINPRO_5KG', 'GRAINPRO_10_15KG', 'GRAINPRO_JUTE_30_60KG']).withMessage('Invalid packaging option'),
  body('paymentTerms').optional().isIn(['TT_50_DEPOSIT_50_BEFORE_SHIPMENT', 'LC_AT_SIGHT']).withMessage('Invalid payment terms'),
  body('incoterm').optional().isIn(['FOB', 'CIF', 'EXW', 'CNF']).withMessage('Invalid incoterm'),
  validateRequest
];

export const authValidator = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest
];

export const sampleValidator = [
  body('importerId').notEmpty().withMessage('Importer ID is required'),
  body('product').notEmpty().withMessage('Product is required'),
  body('format').optional().isIn(['GREEN_BEANS', 'ROASTED_BEANS', 'GROUND_COFFEE']).withMessage('Invalid sample format'),
  body('weight').isIn(['300g', '500g', '1kg']).withMessage('Standard weights are 300g, 500g, or 1kg'),
  body('destination').notEmpty().withMessage('Destination is required'),
  validateRequest
];
