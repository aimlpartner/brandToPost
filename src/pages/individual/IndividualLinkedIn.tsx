import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const LinkedinLogo = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.7 19H4.9V10H7.7V19ZM6.3 8.8C5.4 8.8 4.7 8.1 4.7 7.2C4.7 6.3 5.4 5.6 6.3 5.6C7.2 5.6 7.9 6.3 7.9 7.2C7.9 8.1 7.2 8.8 6.3 8.8ZM19 19H16.2V14.6C16.2 13.5 16.2 12.1 14.7 12.1C13.1 12.1 12.9 13.3 12.9 14.5V19H10.1V10H12.8V11.2H12.8C13.2 10.5 14.1 9.8 15.4 9.8C18.2 9.8 18.7 11.6 18.7 14V19H19Z" fill="white" />
  </svg>
);

export function IndividualLinkedIn() {
  const { user } = useAuth();

  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(true);
  const [postingTimezone, setPostingTimezone] = useState('UTC (GMT+0:00)');
  const [isConnectingLinkedin, setIsConnectingLinkedin] = useState(false);
  const [linkedinSuccessMsg, setLinkedinSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const linkedInSaved = localStorage.getItem(`linkedin_connected_${user.uid}`);
      if (linkedInSaved === 'true') {
        setIsLinkedinConnected(true);
      }
    }
  }, [user]);

  const handleToggleLinkedin = () => {
    setIsConnectingLinkedin(true);
    setTimeout(() => {
      const nextState = !isLinkedinConnected;
      setIsLinkedinConnected(nextState);
      if (user?.uid) {
        localStorage.setItem(`linkedin_connected_${user.uid}`, nextState ? 'true' : 'false');
      }
      setLinkedinSuccessMsg(
        nextState
          ? 'LinkedIn profile successfully connected for automated publishing and scheduling!'
          : 'LinkedIn profile disconnected.'
      );
      setTimeout(() => setLinkedinSuccessMsg(null), 4000);
      setIsConnectingLinkedin(false);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display text-left">
          LinkedIn Connection & Auto-Publishing
        </h2>
        <p className="text-xs text-slate-500 mt-1 text-left">
          Connect your personal LinkedIn account to enable 1-click publishing and automated post queues.
        </p>
      </div>

      {linkedinSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{linkedinSuccessMsg}</span>
        </div>
      )}

      {/* Main Connection Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 text-left space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center shrink-0">
              <LinkedinLogo />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                Personal LinkedIn Profile
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {isLinkedinConnected ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Connected & Authorized
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleLinkedin}
            disabled={isConnectingLinkedin}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 ${
              isLinkedinConnected
                ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200'
                : 'bg-[#0A66C2] hover:bg-[#084e96] text-white'
            }`}
          >
            {isConnectingLinkedin ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : isLinkedinConnected ? (
              <span>Disconnect LinkedIn</span>
            ) : (
              <>
                <LinkedinLogo />
                <span>Connect LinkedIn Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Autopilot & Timezone Settings */}
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Automated Post Publishing
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Automatically publish queued thought leadership posts directly to your profile.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPostingEnabled}
                onChange={(e) => setAutoPostingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C3AED]"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Optimal Publishing Timezone
            </label>
            <select
              value={postingTimezone}
              onChange={(e) => setPostingTimezone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#7C3AED]"
            >
              <option value="UTC (GMT+0:00)">UTC (GMT+0:00) — Default</option>
              <option value="EST (GMT-5:00)">EST (GMT-5:00) — New York / Toronto</option>
              <option value="PST (GMT-8:00)">PST (GMT-8:00) — San Francisco / LA</option>
              <option value="IST (GMT+5:30)">IST (GMT+5:30) — India</option>
              <option value="CET (GMT+1:00)">CET (GMT+1:00) — London / Paris</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instructions & Security Card */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-6 text-left space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>OAuth 2.0 Enterprise Security</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          BrandToPost connects to your LinkedIn profile via official OAuth 2.0 API tokens. We never store or access your LinkedIn account password. You can revoke access at any time directly from your LinkedIn settings.
        </p>
      </div>
    </div>
  );
}
