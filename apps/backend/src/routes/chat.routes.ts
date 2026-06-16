import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';

export const chatRouter = Router();

/**
 * GET /api/chat/history/:conversationId
 * Description: Fetches paginated past historical messages for a specific conversation container.
 */
chatRouter.get('/history/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // Parse pagination variables cleanly
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string; 

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing required conversationId parameter.' });
    }

    // Fetch messages from Neon PostgreSQL ordered chronologically
    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0, 
      // Fully type-safe cursor assignment pointing to the unique ID string property
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' } 
    });

    // Calculate next pagination cursor checkpoint metric
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return res.status(200).json({
      messages: messages.reverse(), // Ascending chronological order for seamless UI rendering
      nextCursor
    });

  } catch (error: any) {
    console.error('Error recovering persistent chat history logs:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve conversation history records.' });
  }
});