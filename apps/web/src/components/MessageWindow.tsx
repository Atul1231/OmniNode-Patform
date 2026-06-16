import React, { useState, useEffect, useRef } from 'react';
import { Message, Channel } from '../types/chat';

interface MessageWindowProps {
  channel: Channel;
  messages: Message[];
  onSendMessage: (content: string) => void;
  activeCallChannelId: string | null;
  onStartCallGlobal: () => void;
  isLoadingMessages?: boolean;
}

export const MessageWindow: React.FC<MessageWindowProps> = ({
  channel,
  messages,
  onSendMessage,
  activeCallChannelId,
  onStartCallGlobal,
  isLoadingMessages = false
}) => {
  const [typedMessage, setTypedMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Force scroll mechanics to fire cleanly when a new history chunk maps into focus
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isUserScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 150;
    if (!isUserScrolledUp) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    onSendMessage(typedMessage.trim());
    setTypedMessage('');
  };

  const isCurrentChannelOnCall = activeCallChannelId === channel.id;

  // Helper: detect call lifecycle system messages for enhanced rendering
  const isCallSystemMessage = (content: string) => {
    return content.startsWith('📹') || content.startsWith('🛑') || content.startsWith('⚠️');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden w-full">
      
      {/* Header Container Element Banner */}
      <div className="h-14 border-b border-slate-900 bg-slate-900/40 px-6 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">{channel.customerName}</h2>
          <p className="text-2xs text-slate-500 font-mono">{channel.customerEmail}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Renders dynamic status button state links depending on core system locations */}
          {!isCurrentChannelOnCall ? (
            <button
              onClick={onStartCallGlobal}
              className="btn btn-xs bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-medium border border-indigo-500/20 px-3 py-1 rounded transition-all duration-200 cursor-pointer"
            >
              📹 Initialize Remote Video Session
            </button>
          ) : (
            <span className="text-3xs font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded animate-pulse">
              🎥 LINE_LIVE_OVERLAY_ACTIVE
            </span>
          )}
          <span className="badge badge-sm bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 font-mono text-3xs py-2">
            STATUS_{channel.status}
          </span>
        </div>
      </div>

      {/* Main Scroll Box Section Timeline Feed */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950"
      >
        {/* Loading state when messages are being fetched from API */}
        {isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <span className="loading loading-spinner text-indigo-500 mb-2" style={{ width: '1.5rem', height: '1.5rem' }} />
            <span className="text-2xs font-mono animate-pulse">LOADING_MESSAGE_HISTORY...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
            <span className="text-xl mb-1">🛡️</span>
            <p className="text-xs font-medium">Secure Stream Channel Active</p>
            <p className="text-2xs text-slate-700">Send an initial response string message to connect routing logic.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAgent = msg.senderType === 'AGENT';
            const isSystem = msg.senderType === 'SYSTEM';

            if (isSystem) {
              const isCallEvent = isCallSystemMessage(msg.content);
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className={`text-3xs font-mono px-3 py-1 rounded-full uppercase tracking-wider ${
                    isCallEvent 
                      ? 'bg-indigo-950/30 border border-indigo-800/40 text-indigo-400'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}>
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[75%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-3xs text-slate-500 font-medium mb-1 px-1">
                  {isAgent ? 'You' : msg.senderName}
                </span>
                <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                  isAgent 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-950/20' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}>
                  <p className="margin-0 whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="text-3xs text-slate-600 font-mono mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Message Action Row Bar */}
      <div className="p-4 border-t border-slate-900 bg-slate-900/10 shrink-0">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            placeholder={`Message ${channel.customerName}...`}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none rounded-md px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-colors"
          />
          <button 
            type="submit" 
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white font-medium border-none text-xs px-4 h-10 min-h-10 rounded-md tracking-wide transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
};