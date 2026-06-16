import React, { useState } from 'react';

interface LoginFormProps {
  onAuthSuccess: (token: string, organizationId: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onAuthSuccess }) => {
  // Toggle state to switch layouts smoothly without disrupting the master application flow
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Shared structural form variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Determine target URL route depending on active form mode
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignUp 
      ? { email, password, name, organizationName: orgName }
      : { email, password };

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

      // Hand the valid authentication token back up to the master tree
      onAuthSuccess(data.token, data.user.organizationId);

    } catch (err: any) {
      console.error('🚨 Authentication interaction crash:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-md bg-slate-900 border border-slate-800/80 shadow-2xl p-8 rounded-xl transition-all duration-300">
      <div className="flex flex-col items-center mb-6">
        {/* Subtle, non-vibrant tech-branding logo accent */}
        <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3">
          <span className="text-indigo-400 font-bold text-xl">Ω</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
          {isSignUp ? 'Create Corporate Space' : 'Access Workspace'}
        </h2>
        <p className="text-sm text-slate-400 mt-1 text-center">
          {isSignUp 
            ? 'Deploy a secure multi-tenant cloud context instance.' 
            : 'Sign in to access your tenant dashboard routes.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error bg-red-950/40 border border-red-900/50 text-red-400 text-sm py-3 px-4 rounded-lg mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="form-control">
              <label className="label-text text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input input-bordered w-full bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 text-sm px-3 py-2.5 outline-none rounded-md"
                placeholder="Atul Singh"
              />
            </div>

            <div className="form-control">
              <label className="label-text text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Organization Entity Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="input input-bordered w-full bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 text-sm px-3 py-2.5 outline-none rounded-md"
                placeholder="OmniNode Inc."
              />
            </div>
          </>
        )}

        <div className="form-control">
          <label className="label-text text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Workspace Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input input-bordered w-full bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 text-sm px-3 py-2.5 outline-none rounded-md"
            placeholder="name@company.com"
          />
        </div>

        <div className="form-control">
          <label className="label-text text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Secure Password Passkey
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input input-bordered w-full bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 text-sm px-3 py-2.5 outline-none rounded-md"
            placeholder="••••••••"
          />
        </div>

        <button
  type="submit"
  disabled={isLoading}
  className="btn w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium border-none tracking-wide transition-all duration-200 shadow-lg shadow-indigo-950/20 py-2.5 rounded-md mt-2 text-sm flex items-center justify-center gap-2"
>
  {isLoading ? (
    <>
      {/* Safe inline explicit CSS fallback to guarantee the spinner paints correctly in Tailwind v4 */}
      <span 
        className="loading loading-spinner text-white" 
        style={{ width: '1rem', height: '1rem' }} 
      />
      <span className="opacity-90 animate-pulse">
        {isSignUp ? 'Initializing Onboarding...' : 'Logging in...'}
      </span>
    </>
  ) : (
    <span>{isSignUp ? 'Initialize Onboarding' : 'Verify & Sign In'}</span>
  )}
</button>
      </form>

      <div className="divider border-slate-800 my-6 before:bg-slate-800 after:bg-slate-800 text-xs text-slate-500">
        OR OPTIONS
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsSignUp(!isSignUp);
          }}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4 bg-transparent border-none cursor-pointer"
        >
          {isSignUp 
            ? 'Already have an active tenant account? Sign in' 
            : 'Need a multi-tenant corporate environment? Sign up'}
        </button>
      </div>
    </div>
  );
};