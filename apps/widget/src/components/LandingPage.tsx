import React, { useState } from 'react';
import { DocsModal } from './DocsModal';

interface LandingPageProps {
  onGetStarted: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, theme, onToggleTheme }) => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION BAR
          ═══════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <img src="/logo.svg" alt="OmniNode Logo" className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">OmniNode</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">Features</a>
            <a href="#integration" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">Integration</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors duration-200">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer px-2"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg transition-all duration-200 border-none cursor-pointer shadow-lg shadow-indigo-950/50 hover:shadow-indigo-900/50"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Gradient Mesh Background */}
        <div className="hero-gradient-mesh" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl animate-float-gentle" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Chip badge */}
            <div className="animate-slide-up inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-indigo-300">Now with WebRTC Video Calls & AI Automation</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <span className="text-white">Customer support </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                that never sleeps.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Add live chat, video calls, and intelligent ticket routing to your app 
              in under 5 minutes. One script tag. Zero infrastructure headaches.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
              <button 
                onClick={onGetStarted}
                className="group relative text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl transition-all duration-300 border-none cursor-pointer shadow-xl shadow-indigo-950/40 hover:shadow-indigo-800/40 hover:-translate-y-0.5"
              >
                Start Building Free
                <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
              <button 
                onClick={() => setShowDocs(true)}
                className="text-base font-medium text-slate-400 hover:text-white px-6 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 bg-transparent cursor-pointer hover:bg-white/5"
              >
                View Documentation
              </button>
            </div>

            {/* Mini code preview */}
            <div className="mt-16 max-w-lg mx-auto animate-slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <div className="code-block p-4 text-left animate-pulse-glow">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="text-[10px] text-slate-600 ml-2 font-mono">index.html</span>
                </div>
                <code className="text-[13px] leading-relaxed">
                  <span className="text-slate-500">{'<!-- One script. Infinite support. -->'}</span>{'\n'}
                  <span className="text-pink-400">{'<'}</span>
                  <span className="text-blue-400">script</span>
                  <span className="text-pink-400"> </span>
                  <span className="text-violet-400">src</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-emerald-400">"omninode.js"</span>{'\n'}
                  {'  '}
                  <span className="text-violet-400">data-key</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-emerald-400">"your-api-key"</span>
                  <span className="text-pink-400">{' />'}</span>
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRUSTED BY / SOCIAL PROOF
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 mb-8">
            Trusted by engineering teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['TechFlow', 'NexaLabs', 'QuantumOS', 'CloudForge', 'BuildStack', 'DataPrime'].map((name, i) => (
              <span 
                key={name}
                className="text-lg font-bold text-slate-700 hover:text-slate-500 transition-colors duration-300 cursor-default tracking-tight"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES GRID
          ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3 block">Platform Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built for scale from day one. Every feature is multi-tenant isolated, 
              horizontally scalable, and production-hardened.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'Real-Time Live Chat',
                description: 'Socket.io powered messaging with Redis Pub/Sub for horizontal scaling. Messages persist instantly to PostgreSQL.',
                accent: 'from-amber-500/20 to-orange-500/20',
                border: 'hover:border-amber-500/30'
              },
              {
                icon: '📹',
                title: 'WebRTC Video Calls',
                description: 'Peer-to-peer video with STUN/TURN server support. Agents can video call visitors directly from the dashboard.',
                accent: 'from-indigo-500/20 to-violet-500/20',
                border: 'hover:border-indigo-500/30'
              },
              {
                icon: '🎯',
                title: 'Smart Ticket Routing',
                description: 'BullMQ job queues auto-assign conversations to available agents using least-load optimization algorithms.',
                accent: 'from-emerald-500/20 to-teal-500/20',
                border: 'hover:border-emerald-500/30'
              },
              {
                icon: '🏢',
                title: 'Multi-Tenant Architecture',
                description: 'Complete tenant isolation at every layer — database, sockets, and API routes. Each org gets their own secure namespace.',
                accent: 'from-blue-500/20 to-cyan-500/20',
                border: 'hover:border-blue-500/30'
              },
              {
                icon: '🤖',
                title: 'AI-Ready Pipeline',
                description: 'Pre-built webhook slots for LLM integration. Auto-respond to queued visitors with AI-generated answers.',
                accent: 'from-purple-500/20 to-pink-500/20',
                border: 'hover:border-purple-500/30'
              },
              {
                icon: '📊',
                title: 'Real-Time Analytics',
                description: 'Agent presence tracking, conversation metrics, and response time analytics — all powered by live socket events.',
                accent: 'from-rose-500/20 to-red-500/20',
                border: 'hover:border-rose-500/30'
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-default group ${feature.border}`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-4 text-xl group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INTEGRATION STEPS
          ═══════════════════════════════════════════════════════ */}
      <section id="integration" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3 block">Integration</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Live in production in 3 steps.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              No complex SDKs or build tooling. Just register, copy, and deploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register Your Organization',
                description: 'Create a free account and get your unique API key. Your tenant namespace is provisioned instantly.',
                icon: '🔐'
              },
              {
                step: '02',
                title: 'Copy The Script Tag',
                description: 'Drop a single <script> tag into your HTML. The widget auto-initializes with your branding.',
                icon: '📋'
              },
              {
                step: '03',
                title: 'Start Engaging',
                description: 'Your agents see live conversations in the dashboard. Visitors get instant support. That\'s it.',
                icon: '🚀'
              }
            ].map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-slate-800 to-transparent" />
                )}
                
                <div className="w-24 h-24 rounded-2xl bg-gray-900 border border-slate-800 group-hover:border-indigo-500/30 flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:-translate-y-1">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 mb-2 block">Step {item.step}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA under steps */}
          <div className="text-center mt-14">
            <button
              onClick={onGetStarted}
              className="text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl transition-all duration-300 border-none cursor-pointer shadow-xl shadow-indigo-950/40 hover:shadow-indigo-800/40 hover:-translate-y-0.5"
            >
              Create Free Account →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRICING
          ═══════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-3 block">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Start free. Scale when you're ready. No hidden fees. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Starter Tier */}
            <div className="glass-card rounded-2xl p-8 flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Starter</span>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">Perfect for indie hackers and small teams testing the waters.</p>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '2 Agent Seats',
                  '500 Conversations / mo',
                  'Real-Time Live Chat',
                  'Basic Ticket Routing',
                  'Community Support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                className="w-full py-3 rounded-xl text-sm font-semibold border border-slate-700 hover:border-slate-600 text-white bg-transparent hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative glass-card rounded-2xl p-8 flex flex-col border-indigo-500/30 animate-pulse-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-indigo-600 text-white px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1">Pro</span>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">$49</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">For growing businesses that need full engagement firepower.</p>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Unlimited Agent Seats',
                  'Unlimited Conversations',
                  'WebRTC Video Calls',
                  'AI Auto-Response Pipeline',
                  'Advanced Analytics Dashboard',
                  'Priority Support + SLA',
                  'Custom Branding on Widget'
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-indigo-950/60 flex items-center justify-center shrink-0">
                      <span className="text-indigo-400 text-[10px]">✓</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border-none transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-950/40"
              >
                Start Pro Trial →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-5">
            Ready to transform your<br />customer experience?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Join hundreds of teams using OmniNode to deliver real-time, human-first customer engagement at scale.
          </p>
          <button
            onClick={onGetStarted}
            className="text-base font-semibold bg-white hover:bg-slate-100 text-gray-950 px-8 py-3.5 rounded-xl transition-all duration-300 border-none cursor-pointer shadow-xl hover:-translate-y-0.5"
          >
            Get Started — It's Free →
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <img src="/logo.svg" alt="OmniNode Logo" className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-400">OmniNode Platform</span>
          </div>

          <div className="flex items-center gap-6">
            {['Documentation', 'GitHub', 'Support', 'Privacy'].map(link => (
              <a key={link} href="#" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {link}
              </a>
            ))}
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} OmniNode Inc. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Docs Modal Portal */}
      {showDocs && <DocsModal onClose={() => setShowDocs(false)} />}
    </div>
  );
};
