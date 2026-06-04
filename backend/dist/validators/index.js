"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleValidator = exports.authValidator = exports.quotationValidator = exports.importerValidator = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return next();
};
exports.validateRequest = validateRequest;
exports.importerValidator = [
    (0, express_validator_1.body)('companyName').notEmpty().withMessage('Company name is required'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
    exports.validateRequest
];
exports.quotationValidator = [
    (0, express_validator_1.body)('importerId').notEmpty().withMessage('Importer ID is required'),
    (0, express_validator_1.body)('product').notEmpty().withMessage('Product is required'),
    (0, express_validator_1.body)('quantity').isNumeric().withMessage('Quantity must be a number'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('type').optional().isIn(['SAMPLE', 'COMMERCIAL']).withMessage('Invalid quotation type'),
    (0, express_validator_1.body)('shipmentType').optional().isIn(['AIR_FREIGHT', 'LCL_SHIPMENT', 'FCL_SHIPMENT', 'SAMPLE_ORDER']).withMessage('Invalid shipment type'),
    (0, express_validator_1.body)('packaging').optional().isIn(['VACUUM_GRAINPRO_5KG', 'GRAINPRO_10_15KG', 'GRAINPRO_JUTE_30_60KG']).withMessage('Invalid packaging option'),
    (0, express_validator_1.body)('paymentTerms').optional().isIn(['TT_50_DEPOSIT_50_BEFORE_SHIPMENT', 'LC_AT_SIGHT']).withMessage('Invalid payment terms'),
    (0, express_validator_1.body)('incoterm').optional().isIn(['FOB', 'CIF', 'EXW', 'CNF']).withMessage('Invalid incoterm'),
    exports.validateRequest
];
exports.authValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email format'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    exports.validateRequest
];
exports.sampleValidator = [
    (0, express_validator_1.body)('importerId').notEmpty().withMessage('Importer ID is required'),
    (0, express_validator_1.body)('product').notEmpty().withMessage('Product is required'),
    (0, express_validator_1.body)('format').optional().isIn(['GREEN_BEANS', 'ROASTED_BEANS', 'GROUND_COFFEE']).withMessage('Invalid sample format'),
    (0, express_validator_1.body)('weight').isIn(['300g', '500g', '1kg']).withMessage('Standard weights are 300g, 500g, or 1kg'),
    (0, express_validator_1.body)('destination').notEmpty().withMessage('Destination is required'),
    exports.validateRequest
];
//# sourceMappingURL=index.js.map