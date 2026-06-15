import { Queue } from 'bullmq';
import { pubClient } from '../config/redis.js';

// 1. Strict TypeScript type contract declaring what a queued ticket must contain
export interface TicketJobData {
  visitorSessionId: string;
  organizationId: string;
  initialMessage: string;
}

// 2. Instantiate the centralized Ticket Queue backed by our Upstash cloud link
export const ticketQueue = new Queue<TicketJobData>('ticket-distribution', {
  connection: {
      url: process.env.REDIS_URL
    },
  defaultJobOptions: {
    // High-Concurrency Guardrails:
    attempts: 3, // If processing fails, retry up to 3 times automatically
    backoff: {
      type: 'exponential',
      delay: 2000 // Progressive waiting times: 2s, then 4s, then 8s between retries
    },
    removeOnComplete: { age: 3600 }, // Clear completed ticket logs after 1 hour to save Upstash memory space
    removeOnFail: { age: 86400 }     // Preserve failed ticket logs for 24 hours for analytics
  }
});

console.log('BullMQ Ticket Distribution Queue initialized successfully.');