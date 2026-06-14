import { Redis } from 'ioredis';

// Edge Case Guardrail: Ensure the platform refuses to boot if the Redis cluster URL is missing
if (!process.env.REDIS_URL) {
  console.error('CRITICAL CONFIGURATION ERROR: REDIS_URL environment variable is completely undefined!');
  process.exit(1);
}

const REDIS_URL = process.env.REDIS_URL;

// Socket.io's Redis adapter requires two entirely separate client connections:
// One connection exclusively for publishing events, and one exclusively for subscribing to channels.
export const pubClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Critical constraint requirement forced by modern queue systems like BullMQ
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.warn(`Redis Connection Warning: Retrying connection attempt #${times} in ${delay}ms...`);
    return delay;
  }
});

export const subClient = pubClient.duplicate();

// Monitor connection lifecycles to catch infrastructure drops early
pubClient.on('connect', () => console.log('Redis Pub Client connected successfully.'));
subClient.on('connect', () => console.log('Redis Sub Client connected successfully.'));

pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err.message));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err.message));