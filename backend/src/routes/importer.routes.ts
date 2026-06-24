import { Router } from 'express';
import * as importerController from '../controllers/importer.controller';       
import { authenticate } from '../middleware/auth';
import { importerValidator } from '../validators';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication to all importer routes
router.use(authenticate);

router.get('/', importerController.getAllImporters);
router.get('/:id', importerController.getImporterById);
router.post('/', importerValidator, importerController.createImporter);
router.post('/bulk', importerController.bulkCreateImporters);
router.post('/sync-sheets', importerController.syncToSheets);
router.post('/import', upload.single('file'), importerController.importImportersFromExcel);
router.put('/:id', importerValidator, importerController.updateImporter);       
router.delete('/:id', importerController.deleteImporter);

export default router;
