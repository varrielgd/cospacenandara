import { Router } from 'express';
import * as quotationController from '../controllers/quotation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', quotationController.getAllQuotations);
router.post('/', quotationController.createQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);

export default router;
