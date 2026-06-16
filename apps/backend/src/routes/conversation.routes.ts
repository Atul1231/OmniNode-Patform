import { Router, Response } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { prisma } from '../config/db.js';

export const conversationRouter = Router();

/**
 * GET /api/conversations
 * 
 * Returns all conversations belonging to the authenticated agent's organization.
 * Includes the latest message snapshot for sidebar preview rendering.
 * Supports optional status filtering via ?status=QUEUED|ACTIVE|RESOLVED
 * 
 * Multi-tenant isolation: Only returns conversations matching req.tenant.organizationId.
 */
conversationRouter.get('/', protectRoute, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }

    const { organizationId } = req.tenant;
    const statusFilter = req.query.status as string | undefined;

    // Build dynamic where clause with optional status filter
    const whereClause: any = { organizationId };
    if (statusFilter && ['QUEUED', 'ACTIVE', 'RESOLVED'].includes(statusFilter)) {
      whereClause.status = statusFilter;
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        // Pull the single most recent message for sidebar preview display
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderType: true,
            createdAt: true
          }
        },
        // Include assigned agent info for display context
        agent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform into a clean response shape matching frontend Channel interface expectations
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      organizationId: conv.organizationId,
      visitorSessionId: conv.visitorSessionId,
      visitorName: conv.visitorName,
      status: conv.status,
      agentId: conv.agentId,
      agent: conv.agent,
      lastMessage: conv.messages[0]?.content || null,
      lastMessageAt: conv.messages[0]?.createdAt || null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
      // TODO: FUTURE_EXPANSION_HOOKS — AI-generated conversation summary field
      // TODO: FUTURE_EXPANSION_HOOKS — Web3 wallet address association on conversation metadata
      // TODO: FUTURE_EXPANSION_HOOKS — Sentiment analysis score from LLM pipeline
    }));

    res.status(200).json({ conversations: formattedConversations });

  } catch (error: any) {
    console.error('🚨 Failed to retrieve conversation list:', error.message);
    res.status(500).json({ error: 'Internal failure while retrieving conversation records.' });
  }
});

/**
 * GET /api/conversations/:id/messages
 * 
 * Returns paginated historical messages for a specific conversation.
 * Supports cursor-based pagination: ?cursor=<messageId>&limit=<number>
 * Default limit: 50 messages per page.
 * 
 * Multi-tenant isolation: Verifies the conversation belongs to the agent's organization
 * before returning any data.
 */
conversationRouter.get('/:id/messages', protectRoute, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }

    const { organizationId } = req.tenant;
    const conversationId = req.params.id;

    if (!conversationId) {
      res.status(400).json({ error: 'Missing required conversation ID parameter.' });
      return;
    }

    // Security guardrail: Verify the conversation belongs to this tenant's organization
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId: organizationId
      },
      select: { id: true, visitorName: true, visitorSessionId: true }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found or access denied for this tenant scope.' });
      return;
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        conversationId: true,
        senderType: true,
        senderId: true,
        content: true,
        createdAt: true
      }
    });

    // Compute next cursor for pagination continuity
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    res.status(200).json({
      messages,
      nextCursor,
      conversationMeta: {
        visitorName: conversation.visitorName,
        visitorSessionId: conversation.visitorSessionId
      }
      // TODO: FUTURE_EXPANSION_HOOKS — AI auto-summary of message thread
      // TODO: FUTURE_EXPANSION_HOOKS — Attachment/media message type support
    });

  } catch (error: any) {
    console.error(`🚨 Failed to retrieve messages for conversation ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Internal failure while retrieving message history.' });
  }
});
