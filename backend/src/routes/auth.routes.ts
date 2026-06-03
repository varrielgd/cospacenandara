import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authValidator } from '../validators';

const router = Router();

router.post('/register', authValidator, authController.register);
router.post('/login', authValidator, authController.login);
router.get('/me', authenticate, authController.me);

export default router;
