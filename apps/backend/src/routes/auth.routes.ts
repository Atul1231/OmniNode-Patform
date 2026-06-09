import { Router } from 'express';
import { registerTenant, login } from '../controllers/auth.controller.js';

const router = Router();

// Endpoint paths: POST /api/v1/auth/register & POST /api/v1/auth/login
router.post('/register', registerTenant);
router.post('/login', login);

export default router;