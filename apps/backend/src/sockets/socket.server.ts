import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../config/redis.js';
import { authenticateSocket, AuthenticatedSocket } from './socket.middleware.js';
import { prisma } from '../config/db.js';
import { Message } from '@prisma/client';
let io: Server | null = null;

export const initSocketServer = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, 
    pingInterval: 25000 
  });

  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Pub/Sub horizontal scaling adapter mounted successfully.');
  console.log('Socket.io Real-Time Engine initialized smoothly.');

  io.use(authenticateSocket);

// Core Connection Event Listener
  io.on('connection', async (socket: AuthenticatedSocket) => {
    // Structural Isolation: Force the incoming socket channel into an isolated room matching their organization ID
    const tenantRoomId = `tenant:${socket.organizationId}`;
    await socket.join(tenantRoomId);
    
    // --- PRESENCE ENGINE: AGENT ONLINE TRIGGER ---
    if (socket.role === 'AGENT' || socket.role === 'ADMIN') {
      await socket.join(`agent:${socket.userId}`);
      console.log(`👷 Agent ${socket.userId} registered to real-time notification target channel.`);

      try {
        // Automatically sync with Neon Postgres to mark this user as ONLINE
        await prisma.user.update({
          where: { id: socket.userId },
          data: { status: 'ONLINE' }
        });

        // Broadcast a live message to everyone else in the organization dashboard
        socket.to(tenantRoomId).emit('agent-status-updated', {
          userId: socket.userId,
          status: 'ONLINE'
        });
        console.log(`🟢 Presence Sync: Agent ${socket.userId} marked ONLINE in database.`);
      } catch (dbErr: any) {
        console.error(`🚨 Failed to sync online presence for agent ${socket.userId}:`, dbErr.message);
      }
    }

    // --- VISITOR INITIALIZATION ROUTINE ---
    if (socket.role === 'VISITOR' && socket.organizationId && socket.visitorSessionId) {
      try {
        let conversation = await prisma.conversation.findFirst({
          where: {
            organizationId: socket.organizationId,
            visitorSessionId: socket.visitorSessionId
          }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              organizationId: socket.organizationId,
              visitorSessionId: socket.visitorSessionId,
              visitorName: 'Site Visitor ' + socket.visitorSessionId.substring(socket.visitorSessionId.length - 4),
              status: 'QUEUED'
            }
          });
        }

        socket.emit('channel-allocated', {
          id: conversation.id,
          organizationId: socket.organizationId,
          visitorSessionId: socket.visitorSessionId
        });

        socket.to(tenantRoomId).emit('channel-allocated', {
          id: conversation.id,
          organizationId: socket.organizationId,
          visitorSessionId: socket.visitorSessionId,
          visitorName: conversation.visitorName
        });

      } catch (dbErr: any) {
        console.error('Failed to provision visitor conversation:', dbErr.message);
        socket.emit('error-alert', { error: 'Failed to provision conversation channel.' });
      }
    }

    console.log(`📡 Authenticated client ${socket.id} (${socket.role}) joined secure isolating space: ${tenantRoomId}`);

    // --- PHASE 5: WebRTC SIGNALING LISTENERS ---
    socket.on('webrtc-offer', (payload: { targetRoomId: string; offer: any }) => {
      const { targetRoomId, offer } = payload;
      if (!targetRoomId || !offer) {
        return socket.emit('error-alert', { error: 'Signaling Failure: Missing target destination or SDP offer data.' });
      }
      console.log(`WebRTC Signaling: Relaying Offer from ${socket.id} into room: ${targetRoomId}`);
      socket.to(targetRoomId).emit('webrtc-offer', { senderSocketId: socket.id, offer });
    });

    socket.on('webrtc-answer', (payload: { targetRoomId: string; answer: any }) => {
      const { targetRoomId, answer } = payload;
      if (!targetRoomId || !answer) {
        return socket.emit('error-alert', { error: 'Signaling Failure: Missing target destination or SDP answer data.' });
      }
      console.log(`WebRTC Signaling: Relaying Answer from ${socket.id} into room: ${targetRoomId}`);
      socket.to(targetRoomId).emit('webrtc-answer', { senderSocketId: socket.id, answer });
    });

    socket.on('webrtc-ice-candidate', (payload: { targetRoomId: string; candidate: any }) => {
      const { targetRoomId, candidate } = payload;
      if (!targetRoomId || !candidate) {
        return socket.emit('error-alert', { error: 'Signaling Failure: Missing target destination or ICE candidate data.' });
      }
      socket.to(targetRoomId).emit('webrtc-ice-candidate', { senderSocketId: socket.id, candidate });
    });

    // --- PHASE 5: WebRTC ROOM LIFECYCLE LISTENERS ---
    socket.on('join-call-room', (payload: { conversationId: string }) => {
      const { conversationId } = payload;
      if (!conversationId) {
        return socket.emit('error-alert', { error: 'Room Failure: Missing required conversation identifier coordinate.' });
      }
      const callRoomId = `call:${conversationId}`;
      socket.join(callRoomId);
      console.log(`WebRTC Room: Peer ${socket.id} successfully joined active media room: ${callRoomId}`);
      socket.to(callRoomId).emit('user-joined-call', { joinedSocketId: socket.id, role: socket.role });
    });

    socket.on('leave-call-room', async (payload: { conversationId: string }) => {
      const { conversationId } = payload;
      if (!conversationId) {
        return socket.emit('error-alert', { error: 'Room Failure: Missing required conversation identifier coordinate.' });
      }
      const callRoomId = `call:${conversationId}`;
      socket.leave(callRoomId);
      console.log(`WebRTC Room: Peer ${socket.id} left call room: ${callRoomId}`);
      io?.to(`conversation:${conversationId}`).emit('user-left-call', { leftSocketId: socket.id });
    });
    // --- PHASE 6: AGENT PRESENCE ADAPTIVE STATUS TOGGLE ---
    socket.on('presence-status-change', async (payload: { status: 'AVAILABLE' | 'BUSY' }) => {
      try {
        const { status } = payload;
        if (socket.role !== 'AGENT' && socket.role !== 'ADMIN') return;

        console.log(`🎯 Presence Event: Agent ${socket.userId} shifted status manually to ${status}`);

        // Update the agent status inside your Neon Postgres database instance
        await prisma.user.update({
          where: { id: socket.userId },
          data: { status: status === 'AVAILABLE' ? 'ONLINE' : 'BUSY' } // Map to your schema status values
        });

        // Broadcast the real-time update to all other agents active within this specific tenant mapping room
        io?.to(tenantRoomId).emit('agent-status-updated', {
          userId: socket.userId,
          status: status === 'AVAILABLE' ? 'ONLINE' : 'BUSY'
        });

      } catch (dbErr: any) {
        console.error(`🚨 Failed to update manual presence status for agent ${socket.userId}:`, dbErr.message);
        socket.emit('error-alert', { error: 'Database Synchronization Failure: Status update rejected.' });
      }
    });
    // --- PHASE 6: REAL-TIME MESSAGE PERSISTENCE ---
    socket.on('send-chat-message', async (payload: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = payload;

        if (!conversationId || !content || content.trim() === '') {
          return socket.emit('error-alert', { error: 'Validation Failure: Invalid conversation ID or empty message content.' });
        }

        const senderId = socket.role === 'VISITOR' ? (socket.visitorSessionId as string) : (socket.userId as string);
        const senderType = (socket.role === 'ADMIN' ? 'AGENT' : socket.role) as 'VISITOR' | 'AGENT' | 'SYSTEM';
        const targetRoomId = `conversation:${conversationId}`;

        // Immediate real-time broadcast for high-speed client interfaces
        socket.to(targetRoomId).emit('new-chat-message', {
          conversationId,
          senderId,
          senderType,
          content,
          createdAt: new Date().toISOString()
        });

        // Non-blocking asynchronous persistent storage routine
        prisma.message.create({
          data: { conversationId, senderType, senderId, content }
        }).then((savedMessage: Message) => {
          socket.emit('message-delivered', { messageId: savedMessage.id, conversationId });
        }).catch((dbError: any) => { // <--- Explicit type definition binds error properties cleanly
          console.error(`Critical Database Write Failure for conversation ${conversationId}:`, dbError.message);
          socket.emit('error-alert', { error: 'Storage Alert: Message delivered but failed to save permanently to server history.' });
        });

      } catch (error: any) {
        console.error('Exception caught in send-chat-message handler:', error.message);
        socket.emit('error-alert', { error: 'Internal real-time persistence pipeline failure.' });
      }
    });

    // --- PHASE 6: CONVERSATION ROOM LIFECYCLE ---
    socket.on('join-conversation-room', (payload: { conversationId: string }) => {
      const { conversationId } = payload;
      if (!conversationId) return;

      const targetRoomId = `conversation:${conversationId}`;
      socket.join(targetRoomId);
      console.log(`Room Routine: Client ${socket.id} joined conversation stream room: ${targetRoomId}`);
    });

    socket.on('disconnecting', () => {
      // Auto-cleanup calls if client closes tab or loses network
      socket.rooms.forEach(async room => {
        if (room.startsWith('call:')) {
          const conversationId = room.split(':')[1];
          io?.to(`conversation:${conversationId}`).emit('user-left-call', { leftSocketId: socket.id });
        }
      });
    });

  socket.on('disconnect', async (reason) => {
      console.log(`🔌 Client disconnected (${socket.id}). Reason: ${reason}`);

      if (socket.role === 'AGENT' || socket.role === 'ADMIN') {
        try {
          const activeConnections = await io
            ?.in(`agent:${socket.userId}`)
            .fetchSockets();

          if (!activeConnections || activeConnections.length === 0) {
            await prisma.user.update({
              where: { id: socket.userId },
              data: { status: 'OFFLINE' }
            });

            socket.to(tenantRoomId).emit('agent-status-updated', {
              userId: socket.userId,
              status: 'OFFLINE'
            });

            console.log(
              `🔴 Presence Sync: Agent ${socket.userId} dropped completely. Status set to OFFLINE.`
            );
          } else {
            console.log(
              `🟡 Presence Routine: Agent ${socket.userId} closed a tab, but remains ONLINE via other open windows.`
            );
          }
        } catch (dbErr: any) {
          console.error(
            `🚨 Failed to sync offline presence status for agent ${socket.userId}:`,
            dbErr.message
          );
        }
      }
    });
  });

  return io;
};

export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error(
      'System Execution Failure: Attempted to fetch Socket instance before initialization.'
    );
  }

  return io;
};