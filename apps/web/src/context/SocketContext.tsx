import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// 1. Establish the explicit TypeScript contract defining our Context state properties
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null
});

interface SocketProviderProps {
  children: React.ReactNode;
  token?: string;            // The Agent's secure multi-tenant JWT token
  organizationId: string;    // The unique organization ID mapping boundaries
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, token, organizationId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use a mutable reference pointer to hold our single, persistent socket connection instance across re-renders
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    // 2. Initialize the real-time websocket client handshake link parameters
    socketRef.current = io('http://localhost:5000', {
      auth: {
        token,
        organizationId
      },
      transports: ['websocket'], // Enforce pure WebSockets instantly, skipping costly HTTP polling fallbacks
      autoConnect: true,
      reconnectionAttempts: 5,   // Gracefully attempt reconnection 5 times if network drops
      reconnectionDelay: 2000    // Wait 2 seconds between retry loops to avoid overwhelming the cluster
    });

    const socket = socketRef.current;

    // 3. Bind core system connection lifestyle hooks
    socket.on('connect', () => {
      console.log(`⚡ Handshake verified: Connected to backend with Socket ID: ${socket.id}`);
      setIsConnected(true);
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('🚨 Real-time channel handshake connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Severed socket connection link. Reason: ${reason}`);
      setIsConnected(false);
    });

    // 4. Cleanup loop execution to protect client device hardware from memory leaks
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, organizationId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, error }}>
      {children}
    </SocketContext.Provider>
  );
};

// 5. Custom hook wrapper so consumer components can grab this real-time pipeline effortlessly
export const useOmniSocket = () => useContext(SocketContext);