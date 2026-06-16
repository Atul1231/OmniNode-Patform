import React, { useEffect, useState, useCallback } from 'react';
import { useOmniSocket } from '../context/SocketContext';
import { ConversationList } from './ConversationList';
import { MessageWindow } from './MessageWindow';
import { VideoCallOverlay } from './VideoCallOverlay';
import { SettingsModal } from './SettingsModal';
import { Channel, Message } from '../types/chat';
import { fetchConversations, fetchMessages } from '../services/api';

// TODO: FUTURE_EXPANSION_HOOKS — Import AI automation service for auto-response triggers
// TODO: FUTURE_EXPANSION_HOOKS — Import Solana wallet context provider

interface AgentDashboardProps {
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onSignOut, theme, onToggleTheme }) => {
  const { socket, isConnected } = useOmniSocket();
  const [agentStatus, setAgentStatus] = useState<'AVAILABLE' | 'BUSY'>('AVAILABLE');
  const [showSettings, setShowSettings] = useState(false);
  
  // Extract role from JWT token
  const token = localStorage.getItem('omninode_token') || '';
  let role = 'AGENT';
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = payload.role || 'AGENT';
    }
  } catch (e) {
    console.error('Failed to parse JWT payload', e);
  }
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  
  // PERSISTENCE MATRIX — Cache-first dictionary lookup mapping
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, Message[]>>({});
  
  // Loading state trackers for API fetch operations
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [loadingMessageChannels, setLoadingMessageChannels] = useState<Set<string>>(new Set());

  // VIDEO PERSISTENCE TRACKERS — Lifted to global layout shell
  const [activeCallChannelId, setActiveCallChannelId] = useState<string | null>(null);
  const [isCallExpanded, setIsCallExpanded] = useState<boolean>(true);

  // --- SYSTEM LOG INJECTION HELPER ---
  // Pushes a SYSTEM-type message into the messagesByChannel cache for call lifecycle events
  const injectSystemMessage = useCallback((channelId: string, content: string) => {
    const systemMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      senderId: 'SYSTEM',
      senderName: 'SYSTEM',
      senderType: 'SYSTEM',
      content,
      createdAt: new Date().toISOString()
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), systemMsg]
    }));
  }, []);

  // --- PHASE 1: HYDRATE CONVERSATIONS FROM BACKEND API ON MOUNT ---
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingChannels(true);
        const rawConversations = await fetchConversations();

        const mappedChannels: Channel[] = rawConversations.map((conv: any) => ({
          id: conv.id,
          organizationId: conv.organizationId,
          customerName: conv.visitorName || 'Anonymous Visitor',
          customerEmail: conv.agent?.email || 'unassigned@omninode.io',
          visitorSessionId: conv.visitorSessionId,
          status: conv.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
          lastMessage: conv.lastMessage || undefined,
          updatedAt: conv.updatedAt,
          unreadCount: 0
        }));

        setChannels(mappedChannels);
      } catch (err: any) {
        console.error('🚨 Failed to hydrate conversation list from API:', err.message);
        // Graceful degradation: leave channels empty, socket events will populate live data
      } finally {
        setIsLoadingChannels(false);
      }
    };

    loadConversations();
  }, []);

  // --- PHASE 2: LAZY-LOAD MESSAGES WHEN A CHANNEL IS SELECTED ---
  useEffect(() => {
    if (!selectedChannelId) return;

    // Cache-first: skip fetch if we already have messages for this channel
    if (messagesByChannel[selectedChannelId] && messagesByChannel[selectedChannelId].length > 0) {
      return;
    }

    const loadMessages = async () => {
      // Track loading state per-channel
      setLoadingMessageChannels(prev => new Set(prev).add(selectedChannelId));

      try {
        const data = await fetchMessages(selectedChannelId);

        const mappedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          channelId: msg.conversationId,
          senderId: msg.senderId,
          senderName: msg.senderType === 'AGENT' ? 'Agent' : msg.senderType === 'SYSTEM' ? 'SYSTEM' : 'Customer',
          senderType: msg.senderType,
          content: msg.content,
          createdAt: new Date(msg.createdAt).toISOString()
        }));

        setMessagesByChannel(prev => ({
          ...prev,
          [selectedChannelId]: mappedMessages
        }));
      } catch (err: any) {
        console.error(`🚨 Failed to load messages for channel ${selectedChannelId}:`, err.message);
        // Initialize empty array so we don't re-fetch on every tab switch
        setMessagesByChannel(prev => ({
          ...prev,
          [selectedChannelId]: prev[selectedChannelId] || []
        }));
      } finally {
        setLoadingMessageChannels(prev => {
          const next = new Set(prev);
          next.delete(selectedChannelId);
          return next;
        });
      }
    };

    loadMessages();
  }, [selectedChannelId]); // intentionally not including messagesByChannel to avoid infinite loops

  // --- PHASE 3: REAL-TIME SOCKET EVENT LISTENERS ---
  useEffect(() => {
    if (!socket) return;

    socket.on('new-chat-message', (payload: any) => {
      console.log('📥 Stream Packet Captured:', payload);
      const targetRoomId = payload.conversationId;

      const incomingMsg: Message = {
        id: payload.id || `msg-${Date.now()}`,
        channelId: targetRoomId,
        senderId: payload.senderId,
        senderName: payload.senderType === 'AGENT' ? 'Agent' : 'Customer',
        senderType: payload.senderType,
        content: payload.content,
        createdAt: payload.createdAt || new Date().toISOString()
      };

      setMessagesByChannel(prev => ({
        ...prev,
        [targetRoomId]: [...(prev[targetRoomId] || []), incomingMsg]
      }));

      if (targetRoomId !== selectedChannelId) {
        setChannels(prev => prev.map(ch => 
          ch.id === targetRoomId ? { ...ch, unreadCount: ch.unreadCount + 1 } : ch
        ));
      }

      setChannels(prev => prev.map(ch => 
        ch.id === targetRoomId ? { ...ch, lastMessage: payload.content, updatedAt: incomingMsg.createdAt } : ch
      ));
    });

    socket.on('channel-allocated', (payload: any) => {
      if (channels.some(ch => ch.id === payload.id)) return;
      
      const newChannel: Channel = {
        id: payload.id,
        organizationId: payload.organizationId,
        customerName: payload.visitorName || 'Anonymous Visitor',
        customerEmail: payload.customerEmail || 'no-email@context.io',
        visitorSessionId: payload.visitorSessionId,
        status: 'OPEN',
        lastMessage: 'Session initialized...',
        updatedAt: new Date().toISOString(),
        unreadCount: 1
      };

      setChannels(prev => [newChannel, ...prev]);
    });

    socket.on('conversation-resolved', (payload: { conversationId: string }) => {
      setChannels(prev => prev.map(ch => 
        ch.id === payload.conversationId ? { ...ch, status: 'RESOLVED' } : ch
      ));
    });

    return () => {
      socket.off('new-chat-message');
      socket.off('channel-allocated');
      socket.off('conversation-resolved');
    };
  }, [socket, selectedChannelId, channels]);

  // --- STATUS TOGGLE ---
  const toggleStatus = () => {
    const nextStatus = agentStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    setAgentStatus(nextStatus);
    if (socket) socket.emit('presence-status-change', { status: nextStatus });
  };

  // --- CHANNEL SELECTION ---
  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, unreadCount: 0 } : ch));
    if (socket) socket.emit('join-conversation-room', { conversationId: channelId });
  };

  // --- MESSAGE SEND ---
  const handleSendMessage = (content: string) => {
    if (!selectedChannelId || !socket) return;

    socket.emit('send-chat-message', {
      conversationId: selectedChannelId,
      content: content
    });

    const localAgentMsg: Message = {
      id: `msg-opt-${Date.now()}`,
      channelId: selectedChannelId,
      senderId: "current-agent",
      senderName: "You",
      senderType: "AGENT",
      content,
      createdAt: new Date().toISOString()
    };

    setMessagesByChannel(prev => ({
      ...prev,
      [selectedChannelId]: [...(prev[selectedChannelId] || []), localAgentMsg]
    }));

    setChannels(prev => prev.map(ch => 
      ch.id === selectedChannelId ? { ...ch, lastMessage: content, updatedAt: localAgentMsg.createdAt } : ch
    ));
  };

  // --- VIDEO CALL LIFECYCLE ---
  const handleStartCall = () => {
    if (activeChannel) {
      setActiveCallChannelId(activeChannel.id);
      setIsCallExpanded(true);
      // System log injection happens inside VideoCallOverlay via onSystemLog callback
    }
  };

  const handleTerminateCall = () => {
    // Inject termination system log into the call channel's message stream
    if (activeCallChannelId) {
      injectSystemMessage(activeCallChannelId, '🛑 Video call session terminated');
    }
    setActiveCallChannelId(null);
    setIsCallExpanded(true);
  };

  // System log callback passed down to VideoCallOverlay
  const handleCallSystemLog = (content: string) => {
    if (activeCallChannelId) {
      injectSystemMessage(activeCallChannelId, content);
    }
  };

  const activeChannel = channels.find(ch => ch.id === selectedChannelId);
  const activeCallChannel = channels.find(ch => ch.id === activeCallChannelId);
  const isLoadingCurrentMessages = selectedChannelId ? loadingMessageChannels.has(selectedChannelId) : false;

  // TODO: FUTURE_EXPANSION_HOOKS — AI automation panel state
  // TODO: FUTURE_EXPANSION_HOOKS — Web3 / Solana wallet connection status display
  // TODO: FUTURE_EXPANSION_HOOKS — Widget live visitor activity feed

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Upper Utility Header */}
      <header className="h-14 border-b border-slate-900 bg-slate-900/40 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-bold text-lg">Ω</span>
          <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-200">OmniNode Control Console</h1>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          {/* Subtle minimized call badge tracking at the header level if collapsed */}
          {activeCallChannelId && !isCallExpanded && (
            <div 
              onClick={() => setIsCallExpanded(true)}
              className="flex items-center gap-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-md cursor-pointer text-2xs font-mono animate-pulse transition-colors"
            >
              🟢 CALL LIVE ({activeCallChannel?.customerName}) ── CLICK TO EXPAND
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-slate-400 font-mono">{isConnected ? 'SYS_LINK_ACTIVE' : 'SYS_LINK_OFFLINE'}</span>
          </div>
          
          <button onClick={toggleStatus} className={`btn btn-xs border-none font-medium text-white px-3 py-1 rounded transition-colors ${agentStatus === 'AVAILABLE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
            STATUS: {agentStatus}
          </button>

          {role === 'ADMIN' && (
            <button 
              onClick={() => setShowSettings(true)} 
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors duration-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-md cursor-pointer ml-2 flex items-center gap-1.5"
            >
              <span>⚙️</span> Settings
            </button>
          )}

          <button onClick={onToggleTheme} className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors duration-200 bg-transparent border-none cursor-pointer px-2 ml-2" title="Toggle Theme">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button onClick={onSignOut} className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors duration-200 bg-transparent border-none cursor-pointer pl-2">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container Workspace layout */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        
        {/* Left Sidebar list column */}
        <aside className="w-80 border-r border-slate-900 bg-slate-900/10 flex flex-col shrink-0">
          {isLoadingChannels ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <span className="loading loading-spinner text-indigo-500" style={{ width: '1.5rem', height: '1.5rem' }} />
                <span className="text-2xs font-mono animate-pulse">LOADING_CHANNELS...</span>
              </div>
            </div>
          ) : (
            <ConversationList channels={channels} selectedChannelId={selectedChannelId} onSelectChannel={handleSelectChannel} />
          )}
        </aside>

        {/* Center Focus Feed */}
        <main className="flex-1 bg-slate-950 flex flex-col overflow-hidden min-w-0">
          {activeChannel ? (
            <MessageWindow 
              channel={activeChannel} 
              messages={messagesByChannel[activeChannel.id] || []} 
              onSendMessage={handleSendMessage}
              activeCallChannelId={activeCallChannelId}
              onStartCallGlobal={handleStartCall}
              isLoadingMessages={isLoadingCurrentMessages}
            />
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
              <div className="max-w-sm">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-4 mx-auto border border-slate-800">
                  <span className="text-slate-400 text-lg">💬</span>
                </div>
                <h2 className="text-md font-medium text-slate-300">No Conversation Focused</h2>
                <p className="text-xs text-slate-500 mt-1">Select a customer from the side index to interact.</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Global Persistent Video Call Panel */}
        {activeCallChannelId && (
          <aside className={`w-[380px] border-l border-slate-900 bg-slate-950 h-full shrink-0 animate-fadeIn ${isCallExpanded ? 'flex flex-col' : 'hidden'}`}>
            <div className="p-3 bg-slate-900/40 border-b border-slate-900 text-2xs font-semibold text-slate-400 flex items-center justify-between tracking-wider uppercase shrink-0">
              <span>📹 Media Stream Overlay</span>
              {/* Collapse Trigger Button Link */}
              <button 
                onClick={() => setIsCallExpanded(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer text-xs font-bold"
              >
                🗕 Collapse
              </button>
            </div>
            <VideoCallOverlay 
              socket={socket} 
              conversationId={activeCallChannelId} 
              onCloseCall={handleTerminateCall}
              onSystemLog={handleCallSystemLog}
            />
          </aside>
        )}
        
      </div>

      {/* Settings Modal Portal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};