import { Router, Response } from 'express';
import { protectRoute, restrictTo } from '../middlewares/auth.middleware.js';
import { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

// Test Route: GET /api/v1/agent/dashboard-stats
// Notice how we stack our shields: first verify token, then verify role
router.get(
  '/dashboard-stats', 
  protectRoute, 
  restrictTo('ADMIN'), 
  (req: AuthenticatedRequest, res: Response) => {
    // Because of our middleware logic, we can completely trust this context data!
    res.status(200).json({
      message: 'Secure data pulled successfully from the isolation matrix.',
      tenantContext: req.tenant // Displays your verified userId and organizationId cleanly
    });
});

export default router;