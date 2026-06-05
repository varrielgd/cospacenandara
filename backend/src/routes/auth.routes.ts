import { Router, Request, Response } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authValidator } from '../validators';

const router = Router();

router.post('/register', authValidator, authController.register);
router.post('/verify-2fa', authController.verify2FA);
router.post('/login', authValidator, authController.login);
router.get('/me', authenticate, authController.me);
router.get('/debug', authController.debugAuth);
router.get('/headers', (req: Request, res: Response) => {
  res.json({
    headers: req.headers,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
});
router.get('/users', authenticate, authController.getAllUsers);
router.delete('/users/:id', authenticate, authController.deleteUser);

export default router;
