import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { RegisterForm } from './components/RegisterForm';
import { OnboardingDashboard } from './components/OnboardingDashboard';
import { useTheme } from './hooks/useTheme';

type AppView = 'landing' | 'register' | 'dashboard';

interface AuthData {
  token: string;
  apiKey: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleNavigateToRegister = () => {
    setCurrentView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSuccess = (data: AuthData) => {
    setAuthData(data);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setAuthData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    setAuthData(null);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleNavigateToRegister} theme={theme} onToggleTheme={toggleTheme} />
      )}
      {currentView === 'register' && (
        <RegisterForm
          onSuccess={handleRegistrationSuccess}
          onBack={handleBackToLanding}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      {currentView === 'dashboard' && authData && (
        <OnboardingDashboard
          authData={authData}
          onSignOut={handleSignOut}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};
