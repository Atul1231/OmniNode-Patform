import React from 'react';

interface DocsModalProps {
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-sm">Ω</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Integration Documentation</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-transparent hover:bg-white/10 rounded-lg p-2 transition-colors border-none cursor-pointer text-xl flex items-center justify-center w-10 h-10"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="prose prose-invert prose-indigo max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">OmniNode Live Chat & Video Integration Guide</h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Welcome to OmniNode! Adding real-time chat, crystal-clear video calling, and advanced agent support to your website takes less than 60 seconds.
              Our widget is built to be <strong>Zero-Config</strong>—meaning you don't need to write a single line of JavaScript.
            </p>

            <hr className="border-slate-800 my-8" />

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🚀</span> Quick Start (HTML / Vanilla JS)
            </h2>
            <p className="text-slate-400 mb-4">
              If you have a standard website (WordPress, Webflow, Shopify, or custom HTML), simply copy and paste the snippet below right before your closing <code>&lt;/body&gt;</code> tag.
            </p>
            
            <div className="bg-gray-950 border border-slate-800 rounded-xl p-4 mb-6 font-mono text-sm overflow-x-auto text-slate-300">
              <span className="text-slate-500">{'<!-- OmniNode Live Chat Widget -->'}</span><br/>
              <span className="text-pink-400">{'<'}</span><span className="text-blue-400">script</span><br/>
              &nbsp;&nbsp;<span className="text-violet-400">src</span><span className="text-slate-500">=</span><span className="text-emerald-400">"https://your-domain.com/widget.js"</span><br/>
              &nbsp;&nbsp;<span className="text-violet-400">data-api-key</span><span className="text-slate-500">=</span><span className="text-emerald-400">"YOUR_WORKSPACE_API_KEY"</span><br/>
              &nbsp;&nbsp;<span className="text-violet-400">data-theme</span><span className="text-slate-500">=</span><span className="text-emerald-400">"dark"</span><br/>
              &nbsp;&nbsp;<span className="text-violet-400">data-position</span><span className="text-slate-500">=</span><span className="text-emerald-400">"bottom-right"</span><br/>
              &nbsp;&nbsp;<span className="text-violet-400">defer</span><br/>
              <span className="text-pink-400">{'>'}</span><span className="text-pink-400">{'</'}</span><span className="text-blue-400">script</span><span className="text-pink-400">{'>'}</span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-3">Setup Instructions</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-400 mb-8 marker:text-indigo-500">
              <li><strong>Get your API Key:</strong> Log into your OmniNode Agent Dashboard, navigate to the settings, and copy your Workspace API Key.</li>
              <li><strong>Replace the placeholder:</strong> Swap out <code>YOUR_WORKSPACE_API_KEY</code> in the snippet above with your actual key.</li>
              <li><strong>Deploy:</strong> Save and publish your website. The chat bubble will immediately appear in the bottom right corner!</li>
            </ol>

            <hr className="border-slate-800 my-8" />

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>⚛️</span> Advanced Integration (React / Next.js)
            </h2>
            <p className="text-slate-400 mb-4">
              If you are building a modern Single Page Application, you can easily inject the script tag within your application lifecycle.
            </p>

            <h3 className="text-lg font-semibold text-white mb-3">Next.js Example (App Router)</h3>
            <p className="text-slate-400 mb-4">Add the script tag in your <code>app/layout.tsx</code>:</p>
            
            <div className="bg-gray-950 border border-slate-800 rounded-xl p-4 mb-8 font-mono text-sm overflow-x-auto text-slate-300">
              <span className="text-violet-400">import</span> Script <span className="text-violet-400">from</span> <span className="text-emerald-400">'next/script'</span>;<br/><br/>
              <span className="text-violet-400">export default function</span> <span className="text-blue-400">RootLayout</span>({'{'} children {'}'}) {'{'}<br/>
              &nbsp;&nbsp;<span className="text-violet-400">return</span> (<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'<'}</span><span className="text-blue-400">html</span> <span className="text-violet-400">lang</span><span className="text-slate-500">=</span><span className="text-emerald-400">"en"</span><span className="text-pink-400">{'>'}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'<'}</span><span className="text-blue-400">body</span><span className="text-pink-400">{'>'}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{'{'}children{'}'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'<'}</span><span className="text-blue-400">Script</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">src</span><span className="text-slate-500">=</span><span className="text-emerald-400">"https://your-domain.com/widget.js"</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">data-api-key</span><span className="text-slate-500">=</span><span className="text-emerald-400">"YOUR_WORKSPACE_API_KEY"</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">strategy</span><span className="text-slate-500">=</span><span className="text-emerald-400">"lazyOnload"</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'/>'}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'</'}</span><span className="text-blue-400">body</span><span className="text-pink-400">{'>'}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">{'</'}</span><span className="text-blue-400">html</span><span className="text-pink-400">{'>'}</span><br/>
              &nbsp;&nbsp;);<br/>
              {'}'}
            </div>

            <hr className="border-slate-800 my-8" />

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🎨</span> Customization Options
            </h2>
            <p className="text-slate-400 mb-4">
              You can customize the appearance of the widget by adding extra <code>data-</code> attributes to the script tag.
            </p>

            <div className="overflow-x-auto mb-8 rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950 text-slate-300 text-sm">
                    <th className="p-4 border-b border-slate-800">Attribute</th>
                    <th className="p-4 border-b border-slate-800">Default</th>
                    <th className="p-4 border-b border-slate-800">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-400">
                  <tr className="border-b border-slate-800/50 bg-gray-900/50">
                    <td className="p-4 font-mono text-violet-300">data-api-key</td>
                    <td className="p-4 text-slate-500 italic">(Required)</td>
                    <td className="p-4">Your unique OmniNode workspace identifier.</td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="p-4 font-mono text-violet-300">data-theme</td>
                    <td className="p-4 font-mono text-emerald-400">"dark"</td>
                    <td className="p-4">Choose between <code>"dark"</code> or <code>"light"</code> modes.</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono text-violet-300">data-position</td>
                    <td className="p-4 font-mono text-emerald-400">"bottom-right"</td>
                    <td className="p-4">Where the widget floats. Options: <code>"bottom-right"</code>, <code>"bottom-left"</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <hr className="border-slate-800 my-8" />

            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🛡️</span> Security & Performance
            </h2>
            <ul className="space-y-4 text-slate-400 mb-8">
              <li className="flex gap-3">
                <span className="text-indigo-500 shrink-0 mt-0.5">⚡</span>
                <span><strong>Asynchronous Loading:</strong> The <code>defer</code> attribute guarantees that the widget will never block your page from rendering. It loads silently in the background.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-500 shrink-0 mt-0.5">🎨</span>
                <span><strong>Isolated CSS:</strong> The widget uses completely scoped CSS. It will not conflict with Tailwind, Bootstrap, or any custom stylesheets you have on your site.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-500 shrink-0 mt-0.5">🔒</span>
                <span><strong>Hardware Agnostic:</strong> WebRTC video calls automatically negotiate hardware permissions securely and elegantly, dropping gracefully if the user declines camera access.</span>
              </li>
            </ul>

          </div>
        </div>
      </div>
    </div>
  );
};
