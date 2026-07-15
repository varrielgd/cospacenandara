import { Router } from 'express';
import * as sampleController from '../controllers/sample.controller.js';
import { authenticate } from '../middleware/auth.js';
import { sampleValidator } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', sampleController.getAllSamples);
router.post('/', sampleValidator, sampleController.createSample);
router.put('/:id', sampleValidator, sampleController.updateSample);
router.delete('/:id', sampleController.deleteSample);

export default router;
