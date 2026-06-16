import React, { useState } from 'react';

interface RegisterFormProps {
  onSuccess: (data: {
    token: string;
    apiKey: string;
    user: { id: string; name: string; email: string; role: string; organizationId: string };
  }) => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

type FormMode = 'login' | 'register_admin' | 'register_agent';

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onBack, theme, onToggleTheme }) => {
  const [formMode, setFormMode] = useState<FormMode>('register_admin'); // Default to org creation in widget
  
  // Shared structural form variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [workspaceKey, setWorkspaceKey] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = 
      formMode === 'login' ? '/api/auth/login' :
      formMode === 'register_admin' ? '/api/auth/register' :
      '/api/auth/register-agent';

    const payload = 
      formMode === 'login' ? { email, password } :
      formMode === 'register_admin' ? { email, password, adminName: name, companyName: orgName } :
      { email, password, name, workspaceKey };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication sequence failed.');
      }

      onSuccess({
        token: data.token,
        apiKey: data.apiKey || 'Retrieve from organization settings',
        user: data.user
      });

    } catch (err: any) {
      console.error('🚨 Authentication interaction crash:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer group"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">←</span>
            Back to Home
          </button>
          
          <button
            onClick={onToggleTheme}
            className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 animate-pulse-glow">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center mb-4">
              <span className="text-indigo-400 font-bold text-xl">Ω</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white text-center">
              {formMode === 'login' ? 'Access Workspace' :
               formMode === 'register_admin' ? 'Create Your Workspace' :
               'Join Workspace'}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 text-center">
              {formMode === 'login' ? 'Sign in to access your organization dashboard.' :
               formMode === 'register_admin' ? 'Set up a multi-tenant namespace in under 30 seconds.' :
               'Join your team to start answering customer queries.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3 mb-6 animate-fade-in">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {formMode === 'register_admin' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  placeholder="Acme Corp"
                  className="w-full bg-gray-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors"
                />
              </div>
            )}

            {formMode === 'register_agent' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Workspace Access Key
                </label>
                <input
                  type="text"
                  value={workspaceKey}
                  onChange={(e) => setWorkspaceKey(e.target.value)}
                  required
                  placeholder="Ask your admin for the API Key"
                  className="w-full bg-gray-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors font-mono"
                />
              </div>
            )}

            {formMode !== 'login' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="w-full bg-gray-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@acmecorp.com"
                className="w-full bg-gray-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-gray-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border-none transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-950/40 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="animate-pulse">
                    {formMode === 'login' ? 'Authenticating...' : 'Provisioning...'}
                  </span>
                </>
              ) : (
                <span>
                  {formMode === 'login' ? 'Sign In' :
                   formMode === 'register_admin' ? 'Create Workspace & Get API Key' :
                   'Join Workspace'}
                </span>
              )}
            </button>
          </form>

          {/* Toggle Links */}
          <div className="mt-6 pt-6 border-t border-slate-800/60 flex flex-col gap-3 text-center">
            {formMode === 'login' ? (
              <>
                <button type="button" onClick={() => { setError(null); setFormMode('register_agent'); }} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer">
                  Join an existing team? Register as Agent
                </button>
                <button type="button" onClick={() => { setError(null); setFormMode('register_admin'); }} className="text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors bg-transparent border-none cursor-pointer">
                  Need a new workspace? Create an organization
                </button>
              </>
            ) : formMode === 'register_admin' ? (
              <>
                <button type="button" onClick={() => { setError(null); setFormMode('login'); }} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer">
                  Already have an account? Sign in
                </button>
                <button type="button" onClick={() => { setError(null); setFormMode('register_agent'); }} className="text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors bg-transparent border-none cursor-pointer">
                  Join an existing team? Register as Agent
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setError(null); setFormMode('login'); }} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer">
                  Already have an account? Sign in
                </button>
                <button type="button" onClick={() => { setError(null); setFormMode('register_admin'); }} className="text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors bg-transparent border-none cursor-pointer">
                  Need a new workspace? Create an organization
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
