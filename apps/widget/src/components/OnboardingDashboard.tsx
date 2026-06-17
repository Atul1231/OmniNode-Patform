import React, { useState } from 'react';

interface OnboardingDashboardProps {
  authData: {
    token: string;
    apiKey: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      organizationId: string;
    };
  };
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const OnboardingDashboard: React.FC<OnboardingDashboardProps> = ({ authData, onSignOut, theme, onToggleTheme }) => {
  const [isApiKeyRevealed, setIsApiKeyRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const scriptSnippet = `<!-- OmniNode Live Chat Widget -->
<script
  src="${import.meta.env.VITE_WIDGET_URL}"
  data-api-key="${authData.apiKey}"
  data-theme="dark"
  data-position="bottom-right"
  defer
></script>`;

  const npmSnippet = `npm install @omninode/widget

// In your app entry file:
import { OmniNode } from '@omninode/widget';

OmniNode.init({
  apiKey: '${authData.apiKey}',
  theme: 'dark',
  position: 'bottom-right'
});`;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const maskedApiKey = authData.apiKey.length > 8
    ? authData.apiKey.substring(0, 4) + '••••••••' + authData.apiKey.substring(authData.apiKey.length - 4)
    : '••••••••';

  // Track active tab for script snippet
  const [activeTab, setActiveTab] = useState<'html' | 'npm'>('html');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <img src="/logo.svg" alt="OmniNode Logo" className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">OmniNode</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              onClick={onSignOut}
              className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* ════════════ Welcome Banner ════════════ */}
        <div className="animate-slide-up mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎉</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome aboard, {authData.user.name}!</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Your workspace is live. Follow the steps below to integrate OmniNode into your app.
              </p>
            </div>
          </div>
        </div>

        {/* ════════════ Progress Steps ════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
          {[
            { step: 1, label: 'Account Created', status: 'done', icon: '✓' },
            { step: 2, label: 'Copy Integration Code', status: 'current', icon: '2' },
            { step: 3, label: 'Go Live', status: 'pending', icon: '3' }
          ].map(item => (
            <div
              key={item.step}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                item.status === 'done'
                  ? 'border-emerald-500/30 bg-emerald-950/15'
                  : item.status === 'current'
                  ? 'border-indigo-500/30 bg-indigo-950/15 animate-pulse-glow'
                  : 'border-slate-800 bg-gray-900/40'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                item.status === 'done'
                  ? 'bg-emerald-600 text-white'
                  : item.status === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {item.icon}
              </div>
              <span className={`text-sm font-medium ${
                item.status === 'done' ? 'text-emerald-400' : item.status === 'current' ? 'text-white' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ════════════ API Key Card ════════════ */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔑</span>
              <h3 className="text-base font-semibold text-white">Your API Key</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">This key authenticates your widget with our backend. Keep it private.</p>

            <div className="bg-gray-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <code className="text-sm font-mono text-indigo-300 truncate flex-1">
                {isApiKeyRevealed ? authData.apiKey : maskedApiKey}
              </code>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsApiKeyRevealed(!isApiKeyRevealed)}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-all border-none cursor-pointer"
                >
                  {isApiKeyRevealed ? '🙈 Hide' : '👁️ Reveal'}
                </button>
                <button
                  onClick={() => handleCopy(authData.apiKey, 'apiKey')}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    copiedField === 'apiKey'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40'
                  }`}
                >
                  {copiedField === 'apiKey' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Org metadata */}
            <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 block mb-0.5">Organization ID</span>
                <span className="text-xs font-mono text-slate-400 truncate block">{authData.user.organizationId}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 block mb-0.5">Role</span>
                <span className="text-xs font-mono text-slate-400">{authData.user.role}</span>
              </div>
            </div>
          </div>

          {/* ════════════ Quick Links Card ════════════ */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧭</span>
              <h3 className="text-base font-semibold text-white">Next Steps</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Everything you need to get up and running.</p>

            <div className="space-y-3">
              {[
                {
                  icon: '🖥️',
                  title: 'Open Agent Dashboard',
                  description: 'Manage conversations, monitor agents, and handle live tickets.',
                  href: `${import.meta.env.VITE_APP_URL}?token=${authData.token}&orgId=${authData.user.organizationId}`,
                  accent: 'group-hover:border-indigo-500/30'
                },
                {
                  icon: '📖',
                  title: 'Read Documentation',
                  description: 'Comprehensive guides for widget customization and API usage.',
                  href: '#',
                  accent: 'group-hover:border-violet-500/30'
                },
                {
                  icon: '💬',
                  title: 'Join Community',
                  description: 'Connect with other developers building on OmniNode.',
                  href: '#',
                  accent: 'group-hover:border-emerald-500/30'
                },
                {
                  icon: '🛡️',
                  title: 'Security & Compliance',
                  description: 'Review our security practices, SOC 2 readiness, and data policies.',
                  href: '#',
                  accent: 'group-hover:border-amber-500/30'
                }
              ].map(item => (
                <a
                  key={item.title}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-3 p-3 rounded-xl border border-slate-800/60 hover:bg-gray-900/60 transition-all duration-200 no-underline ${item.accent}`}
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-white block">{item.title}</span>
                    <span className="text-[11px] text-slate-500 block">{item.description}</span>
                  </div>
                  <span className="text-slate-600 ml-auto shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════ Script Snippet Card (Full Width) ════════════ */}
        <div className="glass-card rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <h3 className="text-base font-semibold text-white">Integration Code</h3>
              </div>
              <p className="text-xs text-slate-500">
                Paste this snippet into your website. The chat widget will appear automatically.
              </p>
            </div>
            <button
              onClick={() => handleCopy(activeTab === 'html' ? scriptSnippet : npmSnippet, 'script')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all border-none cursor-pointer shrink-0 ${
                copiedField === 'script'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40'
              }`}
            >
              {copiedField === 'script' ? '✓ Copied to Clipboard!' : '📋 Copy Code'}
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex gap-1 mb-4 bg-gray-900 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('html')}
              className={`text-xs font-medium px-4 py-2 rounded-md transition-all border-none cursor-pointer ${
                activeTab === 'html'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              HTML Script Tag
            </button>
            <button
              onClick={() => setActiveTab('npm')}
              className={`text-xs font-medium px-4 py-2 rounded-md transition-all border-none cursor-pointer ${
                activeTab === 'npm'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-transparent text-slate-400 hover:text-white'
              }`}
            >
              NPM Package
            </button>
          </div>

          {/* Code block */}
          <div className="code-block p-5 relative">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800/60">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] text-slate-600 ml-2 font-mono">
                {activeTab === 'html' ? 'index.html' : 'terminal / app.ts'}
              </span>
            </div>

            {activeTab === 'html' ? (
              <pre className="text-[13px] leading-[1.8] overflow-x-auto whitespace-pre text-slate-300">
<span className="text-slate-600">{'<!-- OmniNode Live Chat Widget -->'}</span>{'\n'}
<span className="text-pink-400">{'<'}</span><span className="text-blue-400">script</span>{'\n'}
{'  '}<span className="text-violet-400">src</span><span className="text-slate-500">=</span><span className="text-emerald-400">"{import.meta.env.VITE_WIDGET_URL}"</span>{'\n'}
{'  '}<span className="text-violet-400">data-api-key</span><span className="text-slate-500">=</span><span className="text-emerald-400">"{authData.apiKey}"</span>{'\n'}
{'  '}<span className="text-violet-400">data-theme</span><span className="text-slate-500">=</span><span className="text-emerald-400">"dark"</span>{'\n'}
{'  '}<span className="text-violet-400">data-position</span><span className="text-slate-500">=</span><span className="text-emerald-400">"bottom-right"</span>{'\n'}
{'  '}<span className="text-violet-400">defer</span>{'\n'}
<span className="text-pink-400">{'/>'}</span><span className="text-pink-400">{'</'}</span><span className="text-blue-400">script</span><span className="text-pink-400">{'>'}</span>
              </pre>
            ) : (
              <pre className="text-[13px] leading-[1.8] overflow-x-auto whitespace-pre text-slate-300">
<span className="text-emerald-400">$</span> <span className="text-white">npm install</span> <span className="text-amber-300">@omninode/widget</span>{'\n\n'}
<span className="text-slate-600">{'// In your app entry file:'}</span>{'\n'}
<span className="text-violet-400">import</span> {'{ '}<span className="text-blue-400">OmniNode</span>{' }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'@omninode/widget'</span><span className="text-slate-500">;</span>{'\n\n'}
<span className="text-blue-400">OmniNode</span><span className="text-slate-500">.</span><span className="text-amber-300">init</span><span className="text-slate-500">{'({'}</span>{'\n'}
{'  '}<span className="text-white">apiKey</span><span className="text-slate-500">:</span> <span className="text-emerald-400">'{authData.apiKey}'</span><span className="text-slate-500">,</span>{'\n'}
{'  '}<span className="text-white">theme</span><span className="text-slate-500">:</span> <span className="text-emerald-400">'dark'</span><span className="text-slate-500">,</span>{'\n'}
{'  '}<span className="text-white">position</span><span className="text-slate-500">:</span> <span className="text-emerald-400">'bottom-right'</span>{'\n'}
<span className="text-slate-500">{'});'}</span>
              </pre>
            )}
          </div>

          {/* Info callout */}
          <div className="mt-4 flex items-start gap-3 bg-indigo-950/20 border border-indigo-500/15 rounded-xl p-4">
            <span className="text-lg shrink-0">💡</span>
            <div>
              <p className="text-xs text-indigo-300 font-medium mb-0.5">Pro Tip</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Place the script tag just before your closing <code className="text-indigo-400/80">&lt;/body&gt;</code> tag for 
                optimal page load performance. The widget loads asynchronously and won't block your page render.
              </p>
            </div>
          </div>
        </div>

        {/* ════════════ Footer ════════════ */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-xs text-slate-600">
          <span>© {new Date().getFullYear()} OmniNode Platform</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Docs</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Support</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Status</a>
          </div>
        </div>
      </div>
    </div>
  );
};
