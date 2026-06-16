import { Router } from 'express';
import { getOrganizationDetails, regenerateApiKey } from '../controllers/organization.controller.js';

const router = Router();

// Endpoint paths: GET /api/v1/organization & POST /api/v1/organization/rotate-api-key
router.get('/', getOrganizationDetails);
router.post('/rotate-api-key', regenerateApiKey);

export default router;
