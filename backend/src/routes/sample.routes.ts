import { Router } from 'express';
import * as sampleController from '../controllers/sample.controller';
import { authenticate } from '../middleware/auth';
import { sampleValidator } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', sampleController.getAllSamples);
router.post('/', sampleValidator, sampleController.createSample);
router.put('/:id', sampleValidator, sampleController.updateSample);
router.delete('/:id', sampleController.deleteSample);

export default router;
