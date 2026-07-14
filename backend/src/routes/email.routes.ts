import { Router, Request, Response } from 'express';
import * as emailController from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all email routes
router.use(authenticate);

router.get('/debug', (_req: Request, res: Response) => res.json({ message: 'Email routes reachable' }));
router.get('/', emailController.getAllEmails);
router.get('', emailController.getAllEmails);
router.post('/generate', emailController.generateDraft);
router.post('/approve/:id', emailController.approveEmail);
router.post('/send/:id', emailController.sendEmail);
router.post('/send-direct', emailController.sendDirectEmail);

router.post('/', emailController.createEmail);
router.get('/inbox', emailController.getInbox);
router.post('/sync', emailController.syncInbox);
router.get('/importer/:importerId', emailController.getEmailsByImporter);
router.post('/generate-email', emailController.generateLeadEmail);
router.post('/fetch-drive-file', emailController.fetchGoogleDriveFile);

export default router;
