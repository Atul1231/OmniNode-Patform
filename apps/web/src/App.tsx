import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { LoginForm } from './components/LoginForm';
import { AgentDashboard } from './components/AgentDashboard';
import { useTheme } from './hooks/useTheme';

export const App = () => {
  const { theme, toggleTheme } = useTheme();

  // Initialize our state by checking:
  // 1. URL params (for cross-app auth sync from widget site)
  // 2. localStorage (for returning users)
  const [authState, setAuthState] = useState<{ token: string; organizationId: string } | null>(() => {
    // Check URL params first — the widget onboarding site passes auth via ?token=X&orgId=Y
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlOrgId = urlParams.get('orgId');

    if (urlToken && urlOrgId) {
      // Save to localStorage and clean the URL
      localStorage.setItem('omninode_token', urlToken);
      localStorage.setItem('omninode_org_id', urlOrgId);
      window.history.replaceState({}, '', window.location.pathname);
      return { token: urlToken, organizationId: urlOrgId };
    }

    // Fallback: check localStorage
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
    return <LoginForm onAuthSuccess={handleAuthSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <SocketProvider token={authState.token} organizationId={authState.organizationId}>
      <AgentDashboard onSignOut={handleSignOut} theme={theme} onToggleTheme={toggleTheme} />
    </SocketProvider>
  );
};