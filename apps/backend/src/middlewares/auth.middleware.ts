import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '../types/auth.js';

export const protectRoute = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Edge Case Guardrail: Validate the existence and structured formatting of the Authorization Header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Security Intercept: Access denied due to a missing or malformed Authorization token header.');
      res.status(401).json({ 
        error: 'Unauthorized Access', 
        message: 'Authentication required. Please provide a valid HTTP Bearer token.' 
      });
      return;
    }

    // Safely extract the raw token string from the Bearer schema wrapper
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized Access', 
        message: 'Malformed token payload structure.' 
      });
      return;
    }

    // Verify token cryptographic signature against our environment's private key
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;

    // Edge Case Guardrail: Ensure token contains all necessary multi-tenant signature dimensions
    if (!decoded.userId || !decoded.organizationId || !decoded.role) {
      res.status(401).json({ 
        error: 'Unauthorized Access', 
        message: 'Token integrity validation failed: Missing tenant contextual metadata.' 
      });
      return;
    }

    // Inject the verified tenant identity context straight into the Express Request pipeline
    req.tenant = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role
    };

    // Explicitly pass execution control cleanly down to the next controller function
    next();

  } catch (error: any) {
    // Edge Case Guardrail: Catch specific JWT expiration anomalies gracefully
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'Authentication Expired', 
        message: 'Your active login session has expired. Please log in again to establish a new key.' 
      });
      return;
    }

    // Catch any other malicious signature tampering attempts
    console.error('Cryptographic Tamper Intercepted:', error.message);
    res.status(401).json({ 
      error: 'Unauthorized Access', 
      message: 'Token verification failed. Access signatures are invalid.' 
    });
  }
};

export const restrictTo = (...allowedRoles: ('ADMIN' | 'AGENT')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Defensive check: Ensure that the identity shield has already run before checking roles
    if (!req.tenant) {
      res.status(500).json({ 
        error: 'Internal System Failure', 
        message: 'Role authentication attempted out of procedural order. Identity shield required.' 
      });
      return;
    }

    // Edge Case Guardrail: Deny access if the tenant's role profile does not match execution allowances
    if (!allowedRoles.includes(req.tenant.role)) {
      console.warn(`Authorization Failure: User ${req.tenant.userId} attempted an unauthorized action requiring higher clearance level.`);
      res.status(403).json({ 
        error: 'Access Forbidden', 
        message: 'Permission Restricted: Your account does not possess the execution clearance required for this operation.' 
      });
      return;
    }

    next();
  };
};