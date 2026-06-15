import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../config/redis.js';
import { authenticateSocket, AuthenticatedSocket } from './socket.middleware.js';
import { ticketQueue } from '../queues/ticket.queue.js';

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

  // Attach the distributed scaling engine adapter
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Pub/Sub horizontal scaling adapter mounted successfully.');
  console.log('Socket.io Real-Time Engine initialized smoothly.');

  // Bind the secure multi-tenant handshake security barrier
  io.use(authenticateSocket);

  // Core Connection Event Listener
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Structural Isolation: Force the incoming socket channel into an isolated room matching their organization ID
    const tenantRoomId = `tenant:${socket.organizationId}`;
    socket.join(tenantRoomId);
    
    // Guardrail: If the socket connection belongs to an agent, join a dedicated agent room for targeted routing alerts
    if (socket.role === 'AGENT' || socket.role === 'ADMIN') {
      socket.join(`agent:${socket.userId}`);
      console.log(`Agent ${socket.userId} registered to real-time notification target channel.`);
    }

    console.log(`Authenticated client ${socket.id} (${socket.role}) joined secure isolating space: ${tenantRoomId}`);

    // --- PHASE 4: VISITOR EVENT LISTENER ---
    socket.on('send-visitor-message', async (payload: { message: string }) => {
      try {
        // Enforce structural data validation checks on runtime payload inputs
        if (!payload.message || payload.message.trim() === '') {
          return socket.emit('error-alert', { error: 'Payload Failure: Message text content cannot be completely empty.' });
        }

        // Edge Case: Prevent agents from accidentally triggering the ticket queue pipeline allocation loop
        if (socket.role !== 'VISITOR') {
          return socket.emit('error-alert', { error: 'Access Denied: Only external site visitors can generate support tickets.' });
        }

        console.log(`Received real-time ticket request from visitor session: ${socket.visitorSessionId}`);

        // Safely hand off the transaction payload metrics to our cloud Redis BullMQ queue pipeline
        await ticketQueue.add('distribute-ticket', {
          visitorSessionId: socket.visitorSessionId as string,
          organizationId: socket.organizationId as string,
          initialMessage: payload.message
        });

        // Acknowledge receipt back to the visitor's UI client wrapper cleanly
        socket.emit('message-queued', { 
          status: 'SUCCESS', 
          message: 'Your conversation ticket is safely queued for agent matching.' 
        });

      } catch (error: any) {
        console.error('Exception caught inside socket send-visitor-message handler:', error.message);
        socket.emit('error-alert', { error: 'Internal real-time messaging pipeline infrastructure failure.' });
      }
    });

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