import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import agentRoutes from './routes/agent.routes.js';
import { initSocketServer } from './sockets/socket.server.js';
import { pubClient, subClient } from './config/redis.js';
import { prisma } from './config/db.js';
import './queues/ticket.worker.js';
import { webrtcRouter } from './routes/webrtc.routes.js';
import { chatRouter } from './routes/chat.routes.js';
// Load environment configurations safely
dotenv.config();

// Edge Case Guardrail: Enforce type safety for process.env at compile-time
interface ProcessEnv {
  PORT?: string;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const env = process.env as unknown as ProcessEnv;

if (!env.JWT_SECRET) {
  console.error('CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is completely undefined!');
  process.exit(1);
}

const app = express();
const PORT: number = parseInt(env.PORT || '5000', 10);

// Establish the shared underlying HTTP engine
const httpServer: HTTPServer = createServer(app);

// Edge Case Guardrail: Strict payload constraints to prevent memory exhaustion DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Set up granular multi-origin CORS arrays
const allowedOrigins: string[] = env.ALLOWED_ORIGINS 
  ? env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or local automated checks (where origin is undefined)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Security Warning: Request blocked by CORS from unauthorized origin: ${origin}`);
      callback(new Error('Blocked by OmniNode CORS security restrictions'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/webrtc', webrtcRouter);
app.use('/api/chat', chatRouter);
// Strictly typed health check route
app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});


// Global Error Catching Middleware Layer
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(`🚨 Global Operational Intercept: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected exception occurred'
  });
});
// Initialize the Socket.io server with the shared HTTP engine
initSocketServer(httpServer);
// Boot the underlying HTTP listener
const server = httpServer.listen(PORT, (): void => {
  console.log(`OmniNode Engine running on port: ${PORT}`);
});

// Edge Case Guardrail: Gracefully sever platform processes on infrastructure cycles
const handleGracefulShutdown = (signal: string): void => {
  console.log(`\n System intercept: Received ${signal}. Disconnecting connections gracefully...`);
  
  server.close(async (): Promise<void> => {
    console.log('Core network ports closed. Clean environment shutdown complete.');
    const { ticketWorker } = await import('./queues/ticket.worker.js');
    await ticketWorker.close();
    await pubClient.quit();
    await subClient.quit();
    await prisma.$disconnect();
    
    console.log('Redis cluster links and PostgreSQL connection pools severed cleanly.');
    process.exit(0);
  });
  
  // Force close after 10 seconds if connections are stuck
  setTimeout((): void => {
    console.error('Timeout failure: Connections failed to detach in time. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  console.error('UNHANDLED SYSTEM EXCEPTION EXPOSED:', error);
  handleGracefulShutdown('UNCAUGHT_EXCEPTION');
});