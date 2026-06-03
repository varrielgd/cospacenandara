import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', auditController.getAuditLogs);

export default router;
