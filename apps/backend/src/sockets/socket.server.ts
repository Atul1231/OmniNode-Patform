import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { authenticateSocket, AuthenticatedSocket } from './socket.middleware.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../config/redis.js';
// Explicitly define custom metadata extensions for our authenticated sockets
interface OmniNodeSocket extends Socket {
  organizationId?: string;
  userId?: string;
  role?: 'ADMIN' | 'AGENT' | 'VISITOR';
}

let io: Server | null = null;

export const initSocketServer = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      // Inherit or look up authorized multi-tenant client domains
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Edge Case Guardrail: Optimize connection performance metrics
    pingTimeout: 60000, // Drop dead connections after 60 seconds of silent inactivity
    pingInterval: 25000 // Send a heartbeat pulse every 25 seconds to keep the pipe open
  });
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Pub/Sub horizontal scaling adapter mounted successfully.');
  console.log('Socket.io Real-Time Engine initialized smoothly.');
  io.use(authenticateSocket);
  // Core Connection Event Listener
 io.on('connection', (socket: AuthenticatedSocket) => {
    // Edge Case Guardrail: Automatically force the client into an isolated room matching their organizationId
    const tenantRoomId = `tenant:${socket.organizationId}`;
    socket.join(tenantRoomId);
    console.log(`Authenticated client ${socket.id} joined secure isolating space: ${tenantRoomId}`);
    // We will attach multi-tenant room joiners and message handlers here in the next steps!

    // Edge Case Guardrail: Clean up socket mappings upon client disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected (${socket.id}). Reason: ${reason}`);
    });
  });

  return io;
};

// Singleton getter function to share the "io" reference across other background controllers safely
export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error('System Execution Failure: Attempted to fetch Socket instance before initialization.');
  }
  return io;
};