import React, { useEffect, useState } from 'react';
import { useOmniSocket } from '../context/SocketContext';

// Define the clear contract interface mapping our sign out callback
interface AgentDashboardProps {
  onSignOut: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onSignOut }) => {
  const { socket, isConnected } = useOmniSocket();
  const [activeTickets, setActiveTickets] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<'AVAILABLE' | 'BUSY'>('AVAILABLE');

  useEffect(() => {
    if (!socket) return;

    socket.on('queue-metrics-updated', (payload: { activeCount: number }) => {
      setActiveTickets(payload.activeCount);
    });

    return () => {
      socket.off('queue-metrics-updated');
    };
  }, [socket]);

  const toggleStatus = () => {
    const nextStatus = agentStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    setAgentStatus(nextStatus);
    if (socket) {
      socket.emit('presence-status-change', { status: nextStatus });
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Global Application Control Header Banner */}
      <header className="h-14 border-b border-slate-900 bg-slate-900/40 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-bold text-lg">Ω</span>
          <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-200">OmniNode Control Console</h1>
        </div>
        
        {/* Real-time Infrastructure Pipeline Health Metrics & Logout */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-slate-400 font-mono">{isConnected ? 'SYS_LINK_ACTIVE' : 'SYS_LINK_OFFLINE'}</span>
          </div>
          
          <button 
            onClick={toggleStatus}
            className={`btn btn-xs border-none font-medium text-white px-3 py-1 rounded transition-colors ${
              agentStatus === 'AVAILABLE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            STATUS: {agentStatus}
          </button>

          {/* Subdued, highly professional enterprise Sign Out trigger */}
          <button
            onClick={onSignOut}
            className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors duration-200 bg-transparent border-none cursor-pointer pl-2"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout Grid split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pane A: Navigation & Metrics Bar */}
        <aside className="w-64 border-r border-slate-900 bg-slate-900/20 p-4 flex flex-col gap-6 shrink-0">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Live Allocations</h3>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Queue Load</span>
              <span className="text-xl font-mono font-bold text-indigo-400">{activeTickets}</span>
            </div>
          </div>
        </aside>

        {/* Pane B: Stream Thread Canvas */}
        <main className="flex-1 bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-sm">
            <h2 className="text-lg font-medium text-slate-300">No Active Chat Pipeline Allocated</h2>
            <p className="text-sm text-slate-500 mt-1">
              When a customer initiates an external widget conversation request, the backend BullMQ distribution worker will automatically route the channel stream to your view window.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};