export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderType: 'USER' | 'AGENT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface Channel {
  id: string;
  organizationId: string;
  customerName: string;
  customerEmail: string;
  status: 'OPEN' | 'RESOLVED' | 'PENDING';
  lastMessage?: string;
  updatedAt: string;
  unreadCount: number;
}