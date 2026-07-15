import { Router } from 'express';
import * as quotationController from '../controllers/quotation.controller';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', quotationController.getAllQuotations);
router.post('/suggest-price', quotationController.suggestPrice); // POST to pass product & incoterm in body
router.post('/', quotationController.createQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);

export default router;
