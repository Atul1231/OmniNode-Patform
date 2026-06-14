import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { JWTPayload } from '../types/auth.js';

// Strict type extension for authenticated connection pipes
export interface AuthenticatedSocket extends Socket {
  organizationId?: string;
  userId?: string;
  role?: 'ADMIN' | 'AGENT' | 'VISITOR';
  visitorSessionId?: string;
}

type SocketNextFunction = (err?: Error) => void;

export const authenticateSocket = async (
  socket: AuthenticatedSocket, 
  next: SocketNextFunction
): Promise<void> => {
  try {
    // Extract credentials passed via the client's connection payload properties
    const token = socket.handshake.auth.token;
    const apiKey = socket.handshake.auth.apiKey;
    const visitorSessionId = socket.handshake.auth.visitorSessionId;

    // --- CASE 1: AUTHENTICATING A DASHBOARD AGENT/ADMIN ---
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        
        // Inject the verified agent identity parameters into the socket channel context
        socket.organizationId = decoded.organizationId;
        socket.userId = decoded.userId;
        socket.role = decoded.role;
        
        console.log(`Socket Auth: Verified Agent ${socket.userId} inside Organization ${socket.organizationId}`);
        return next(); // Successfully authenticated. Open the real-time pipe.
      } catch (jwtError) {
        return next(new Error('Authentication Failed: Provided session token is invalid or expired.'));
      }
    }

    // --- CASE 2: AUTHENTICATING AN EMBEDDED SITE VISITOR ---
    if (apiKey && visitorSessionId) {
      // Edge Case Guardrail: Verify the external widget's API key against active tenants in Neon Postgres
      const organization = await prisma.organization.findUnique({
        where: { apiKey }
      });

      if (!organization) {
        console.warn(`Socket Security Alert: Connection blocked due to an unverified API Key: ${apiKey}`);
        return next(new Error('Authentication Failed: The provided deployment API key is completely invalid.'));
      }

      // Inject visitor identities into the socket context map
      socket.organizationId = organization.id;
      // For anonymous visitors, their session ID serves as their unique identification coordinate
      socket.userId = visitorSessionId; 
      socket.role = 'VISITOR';
      socket.visitorSessionId = visitorSessionId;

      console.log(`Socket Auth: Connected Visitor Session ${visitorSessionId} under Tenant ${organization.name}`);
      return next(); // Successfully authenticated. Open the real-time pipe.
    }

    // --- CASE 3: NO AUTHENTICATION CREDENTIALS PROVIDED ---
    return next(new Error('Authentication Failed: Access denied due to missing credentials.'));

  } catch (error: any) {
    console.error('Critical Exception within Socket Handshake Middleware:', error.message);
    return next(new Error('Internal Authentication Subsystem Failure'));
  }
};