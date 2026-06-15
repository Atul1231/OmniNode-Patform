import { Worker, Job } from 'bullmq';
import { prisma } from '../config/db.js';
import { getSocketServer } from '../sockets/socket.server.js';
import { TicketJobData } from './ticket.queue.js'; 

// Instantiate the background worker pool
export const ticketWorker = new Worker<TicketJobData>(
  'ticket-distribution',
  async (job: Job<TicketJobData>) => {
    const { visitorSessionId, organizationId, initialMessage } = job.data;
    console.log(`Worker Processing Job [${job.id}]: Allocating ticket for visitor ${visitorSessionId}`);

    try {
      // ACID Database Transaction: Ensures thread safety when matching agents under high traffic
      const allocationResult = await prisma.$transaction(async (tx) => {
        
        // 1. Query Neon Postgres for all agents within this organization who are currently ONLINE
        const onlineAgents = await tx.user.findMany({
          where: {
            organizationId,
            role: 'AGENT',
            status: 'ONLINE'
          },
          include: {
            // Fix 1: Map status to your 'ACTIVE' TicketStatus enum instead of 'OPEN'
            conversations: {
              where: { status: 'ACTIVE' }
            }
          }
        });

        // Traffic Edge Case: If zero agents are available, fail the job step to trigger backoff retries
        if (onlineAgents.length === 0) {
          throw new Error('Routing Delay: No online support agents are available. Keeping job in queue.');
        }

        // 2. Least-Load Routing Sort: Find the agent with the lowest number of active chats
        const targetAgent = onlineAgents.sort((a, b) => a.conversations.length - b.conversations.length)[0];

        // 3. Create the permanent conversation log assigned to our selected agent
        const conversation = await tx.conversation.create({
          data: {
            organizationId,
            // Fix 2: Changed 'visitorId' to 'visitorSessionId' to match schema field mapping
            visitorSessionId, 
            agentId: targetAgent.id,
            // Fix 3: Changed status from 'OPEN' to your exact schema enum value 'ACTIVE'
            status: 'ACTIVE'
          }
        });

        // 4. Append the visitor's opening message to the new conversation thread
        const message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            // Fix 4: Added required schema parameter 'senderType' using 'VISITOR' enum
            senderType: 'VISITOR', 
            senderId: visitorSessionId,
            content: initialMessage
          }
        });

        return { conversation, targetAgent, message };
      });

      // 5. Real-Time Socket Push Step
      const io = getSocketServer();

      // Broadcast a live event straight to the chosen agent's unique socket space room
      io.to(`agent:${allocationResult.targetAgent.id}`).emit('new-ticket-assigned', {
        conversationId: allocationResult.conversation.id,
        visitorSessionId: visitorSessionId,
        initialMessage: allocationResult.message
      });

      console.log(`Job Success: Ticket allocated to ${allocationResult.targetAgent.name} (Active Load: ${allocationResult.targetAgent.conversations.length} chats)`);
      
    } catch (error: any) {
      // Forward the error back to BullMQ monitoring framework to trigger exponential retry loop backoffs
      console.error(`Retrying Job [${job.id}] due to error: ${error.message}`);
      throw error; 
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL
    },
    concurrency: 5, // Process up to 5 incoming tickets simultaneously in parallel lines
    autorun: true
  }
);

// Monitor runtime worker status
ticketWorker.on('completed', (job) => console.log(`Worker Job ${job.id} completed successfully.`));
ticketWorker.on('failed', (job, err) => console.error(`Worker Job ${job?.id} failed to distribute:`, err.message));