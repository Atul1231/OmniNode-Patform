import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { LoginForm } from './components/LoginForm';
import { AgentDashboard } from './components/AgentDashboard';

export const App = () => {
  // Initialize our state by checking if a valid session was already saved in localStorage
  const [authState, setAuthState] = useState<{ token: string; organizationId: string } | null>(() => {
    const savedToken = localStorage.getItem('omninode_token');
    const savedOrgId = localStorage.getItem('omninode_org_id');
    
    if (savedToken && savedOrgId) {
      return { token: savedToken, organizationId: savedOrgId };
    }
    return null;
  });

  const handleAuthSuccess = (token: string, organizationId: string) => {
    console.log('🔒 Security Clearance: Syncing tokens to local persistence storage.');
    
    // Commit the credentials to persistent storage layers before flipping state
    localStorage.setItem('omninode_token', token);
    localStorage.setItem('omninode_org_id', organizationId);
    
    setAuthState({ token, organizationId });
  };

  const handleSignOut = () => {
    console.log('🔌 Session Terminated: Purging local credentials.');
    
    // Completely clear out the browser's storage tracks
    localStorage.removeItem('omninode_token');
    localStorage.removeItem('omninode_org_id');
    
    setAuthState(null);
  };

  if (!authState) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-950">
        <LoginForm onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <SocketProvider token={authState.token} organizationId={authState.organizationId}>
      {/* We pass the handleSignOut function straight down to our dashboard panel header */}
      <AgentDashboard onSignOut={handleSignOut} />
    </SocketProvider>
  );
};