"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supplier_controller_1 = require("../controllers/supplier.controller");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.use(auth_1.authenticate);
router.get('/', supplier_controller_1.getAllSuppliers);
router.get('/:id', supplier_controller_1.getSupplierById);
router.post('/', supplier_controller_1.createSupplier);
router.put('/:id', supplier_controller_1.updateSupplier);
router.delete('/:id', supplier_controller_1.deleteSupplier);
router.post('/import', upload.single('file'), supplier_controller_1.importSuppliers);
exports.default = router;
//# sourceMappingURL=supplier.routes.js.map