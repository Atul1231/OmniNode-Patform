import React, { useEffect, useState } from 'react';
import { fetchOrganizationDetails, rotateApiKey } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [orgDetails, setOrgDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key state
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Rotation states
  const [isRotating, setIsRotating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await fetchOrganizationDetails();
        setOrgDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, []);

  const handleCopy = async () => {
    if (!orgDetails?.apiKey) return;
    try {
      await navigator.clipboard.writeText(orgDetails.apiKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = orgDetails.apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      const data = await rotateApiKey();
      setOrgDetails((prev: any) => ({ ...prev, apiKey: data.apiKey }));
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative glass-card w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl animate-scale-in flex flex-col max-h-[90vh] bg-slate-900 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400 font-bold text-lg">⚙️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Workspace Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage your organization and integration keys.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <span className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-sm">Fetching workspace details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Organization Meta */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Organization Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4">
                    <p className="text-[10px] uppercase text-slate-500 mb-1 font-semibold">Entity Name</p>
                    <p className="text-sm text-slate-200 font-medium">{orgDetails?.name}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4">
                    <p className="text-[10px] uppercase text-slate-500 mb-1 font-semibold">Workspace ID</p>
                    <p className="text-xs text-slate-400 font-mono truncate" title={orgDetails?.id}>{orgDetails?.id}</p>
                  </div>
                </div>
              </section>

              {/* API Integration */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">API Integration</h3>
                  {orgDetails?.apiKey && !showConfirm && (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="text-xs font-medium text-amber-500 hover:text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Roll API Key
                    </button>
                  )}
                </div>

                {showConfirm ? (
                  <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-5 mb-4 animate-scale-in">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-400 mb-1">DANGER: Destructive Action</h4>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">
                          Regenerating your API key will immediately invalidate your current key. Any live websites using the OmniNode widget with the old key will <strong>instantly stop functioning</strong> until you update their source code.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleRotate}
                            disabled={isRotating}
                            className="text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isRotating ? 'Rotating...' : 'Yes, Regenerate Key'}
                          </button>
                          <button
                            onClick={() => setShowConfirm(false)}
                            disabled={isRotating}
                            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border-none cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      This key authenticates your widget with the backend server. Keep it private. You can also provide this key to your team members so they can register as Agents.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-900 border border-slate-800 rounded-lg px-4 py-3 font-mono text-sm text-indigo-300 truncate">
                        {isKeyVisible ? orgDetails?.apiKey : '••••••••••••••••••••••••••••••••••••'}
                      </div>
                      <button
                        onClick={() => setIsKeyVisible(!isKeyVisible)}
                        className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors border-none cursor-pointer"
                        title={isKeyVisible ? "Hide Key" : "Reveal Key"}
                      >
                        {isKeyVisible ? '🙈' : '👁️'}
                      </button>
                      <button
                        onClick={handleCopy}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer flex items-center gap-2 ${
                          isCopied 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40'
                        }`}
                      >
                        {isCopied ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
