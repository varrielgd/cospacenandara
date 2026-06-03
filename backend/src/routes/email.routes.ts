import { Router } from 'express';
import * as emailController from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/generate', emailController.generateDraft);
router.post('/approve/:id', emailController.approveEmail);
router.post('/send/:id', emailController.sendEmail);
router.post('/sync', emailController.syncInbox);
router.get('/importer/:importerId', emailController.getEmailsByImporter);

export default router;
