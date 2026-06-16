import React from 'react';
import { Channel } from '../types/chat';

interface ConversationListProps {
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel
}) => {
  
  // Helper to prevent long strings from breaking our enterprise layout
  const truncateMessage = (text?: string, maxLength = 32) => {
    if (!text) return 'No messages yet...';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-900/60 bg-slate-900/10 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Conversations</h3>
        <span className="badge bg-slate-800 text-slate-400 border-none font-mono text-2xs px-2 py-0.5">
          {channels.length}
        </span>
      </div>

      {/* Dynamic Scroll Container Box */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40 custom-scrollbar">
        {/* EDGE CASE 1: Empty Queue State Verification */}
        {channels.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center h-48 text-slate-500">
            <span className="text-lg mb-1">📬</span>
            <p className="text-xs font-medium">Queue completely clear.</p>
            <p className="text-2xs text-slate-600 mt-0.5">No inbound streams detected.</p>
          </div>
        ) : (
          channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full text-left p-4 flex flex-col gap-1 transition-all duration-150 outline-none border-none cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 border-l-2 border-indigo-500' 
                    : 'bg-transparent hover:bg-slate-900/40 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                    {channel.customerName}
                    {channel.status === 'RESOLVED' && (
                      <span className="bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 text-[10px] px-1.5 py-0.5 rounded-sm font-mono tracking-wider">
                        RESOLVED
                      </span>
                    )}
                  </span>
                  <span className="text-2xs text-slate-500 font-mono">
                    {new Date(channel.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full gap-2">
                  {/* EDGE CASE 2: Text Overflow Protection */}
                  <span className={`text-xs ${channel.unreadCount > 0 && !isSelected ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {truncateMessage(channel.lastMessage)}
                  </span>

                  {/* EDGE CASE 3: Active Unread Counters */}
                  {channel.unreadCount > 0 && !isSelected && (
                    <span className="bg-indigo-600 text-white font-mono font-bold text-3xs w-4 h-4 rounded-full flex items-center justify-center shrink-0 animate-pulse">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};