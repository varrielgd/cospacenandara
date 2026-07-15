import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authValidator } from '../validators/index.js';

const router = Router();

router.post('/register', authValidator, authController.register);
router.post('/verify-2fa', authController.verify2FA);
router.post('/login', authValidator, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
