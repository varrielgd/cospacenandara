import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authValidator } from '../validators';

const router = Router();

router.post('/register', authValidator, authController.register);
router.post('/verify-2fa', authController.verify2FA);
router.post('/login', authValidator, authController.login);
router.post('/demo-login', authController.demoLogin);
router.get('/me', authenticate, authController.me);

export default router;
