import { Router } from 'express';
import { HealthController } from '@/controllers/healthController';

const router = Router();
const healthController = new HealthController();

// Routes
router.get('/', healthController.healthCheck);

export default router;