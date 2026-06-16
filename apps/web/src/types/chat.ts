export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderType: 'VISITOR' | 'AGENT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  organizationId: string;
  customerName: string;
  customerEmail: string;
  visitorSessionId?: string;
  status: 'OPEN' | 'RESOLVED' | 'PENDING';
  lastMessage?: string;
  updatedAt: string;
  unreadCount: number;
  // TODO: FUTURE_EXPANSION_HOOKS — AI summary preview field
  // TODO: FUTURE_EXPANSION_HOOKS — Web3 wallet address field
  // TODO: FUTURE_EXPANSION_HOOKS — Sentiment score indicator
}