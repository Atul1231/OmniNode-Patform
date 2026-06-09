import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  organizationId: string;
  role: 'ADMIN' | 'AGENT';
}

// Custom extension of Express Request to include our authenticated tenant context
export interface AuthenticatedRequest extends Request {
  tenant?: JWTPayload;
}