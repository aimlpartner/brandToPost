import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { auth } from "../firebase";
import {
  MessageSquare,
  Search,
  Filter,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  RefreshCw,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  Smartphone,
  Send,
  Check,
  Zap,
  HelpCircle,
  X,
  LogOut,
  Sliders,
  Settings as SettingsIcon,
  Activity,
  User,
  KeyRound,
  Link2,
  Eye,
  Calendar
} from "lucide-react";

interface ChatSession {
  id: string; // "phoneNumberId_from"
  history: Array<{
    role: "user" | "model";
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  lastUpdated: string;
  from?: string;
  phoneNumberId?: string;
  businessProfile?: {
    businessName: string;
    address: string;
    phoneNumber: string;
    logoUrl?: string;
    logoBase64?: string;
    logoMime?: string;
  };
}

interface CampaignDocument {
  id: string;
  theme: string;
  targetAudience: string;
  coreMessage: string;
  hook: string;
  cta: string;
  repurposingNotes?: string;
  createdAt: string;
  platformVersions?: Array<{
    platform: string;
    copy: string;
    imageUrl?: string;
    imagePrompt?: string;
  }>;
}

export function WhatsAppDashboard() {
  const { user, logout } = useAuth();
  const { activeProduct } = useProducts();
  const navigate = useNavigate();

  // Route protection - check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate('/whatsapp/login');
    }
  }, [user, navigate]);

  // Real config settings
  const [whatsappBotNumber, setWhatsappBotNumber] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [waWebhookKey, setWaWebhookKey] = useState("TROR_WEBHOOK_SECURE_KEY");
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [whatsappSuccessMsg, setWhatsappSuccessMsg] = useState<string | null>(null);
  
  const [liveBotUrl, setLiveBotUrl] = useState("");
  const [activeConfigTab, setActiveConfigTab] = useState<"credentials" | "integrations">("credentials");

  // Live retrieved data
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [liveCampaigns, setLiveCampaigns] = useState<CampaignDocument[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Connection Diagnostics Live
  const [diagLogs, setDiagLogs] = useState<any[]>([]);
  const [diagTokens, setDiagTokens] = useState<any[]>([]);
  const [isDiagLoading, setIsDiagLoading] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setIsDiagLoading(true);
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setDiagLogs(data.logs || []);
          setDiagTokens(data.tokens || []);
        } else {
          console.warn('[Diagnostics] Non-JSON response received');
        }
      }
    } catch (e) {
      console.error("Could not fetch connection diagnostics", e);
    } finally {
      setIsDiagLoading(false);
    }
  };

  // Load backend WhatsApp config
  const fetchConfig = async () => {
    try {
      const prodId = activeProduct?.id || 'sandbox_id';
      const token = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/whatsapp/config?productId=${prodId}`, { headers });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setWhatsappBotNumber(data.botPhoneNumber || "");
          setWhatsappPhoneId(data.phoneNumberId || "");
          setWhatsappToken(data.token || "");
          setWaWebhookKey(data.webhookVerifyToken || "TROR_WEBHOOK_SECURE_KEY");
        } else {
          console.warn('[WA Config] Non-JSON response received');
        }
      }
    } catch (e) {
      console.error("Could not fetch WA config", e);
    }
  };

  // Load live messages and chats from backend
  const fetchChats = async (silent = false) => {
    if (!silent) setIsLoadingChats(true);
    try {
      const res = await fetch('/api/whatsapp/chats');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.chats) {
            setActiveSessions(data.chats);
            // Auto-select first chat session if none selected
            if (data.chats.length > 0 && !selectedSessionId) {
              setSelectedSessionId(data.chats[0].id);
            }
          }
        } else {
          console.warn('[Chats] Non-JSON response received');
        }
      }
    } catch (e) {
      console.error("Error loading live conversations history", e);
    } finally {
      if (!silent) setIsLoadingChats(false);
    }
  };

  // Load WhatsApp sync campaigns
  const fetchWhatsAppCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          // Filter campaigns generated via WhatsApp Outbox / Chat
          const waCamps = data.filter((c: any) => 
            c.subCategory === 'WhatsApp Chat' || 
            c.theme?.toLowerCase().includes('whatsapp') ||
            c.repurposingNotes?.toLowerCase().includes('whatsapp')
          );
          setLiveCampaigns(waCamps);
        } else {
          console.warn('[Campaigns] Non-JSON response received');
        }
      }
    } catch (e) {
      console.error("Error loading synced campaigns", e);
    }
  };

  // Setup periodic refresh (5s polling) to capture incoming whatsapp texts live!
  useEffect(() => {
    fetchConfig();
    fetchChats();
    fetchWhatsAppCampaigns();
    fetchDiagnostics();

    const interval = setInterval(() => {
      fetchChats(true);
      fetchWhatsAppCampaigns();
      fetchDiagnostics();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeProduct]);

  useEffect(() => {
    fetch('/api/whatsapp/public-link')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setLiveBotUrl(data.url);
        } else if (whatsappBotNumber) {
          const clean = whatsappBotNumber.replace(/\D/g, '');
          setLiveBotUrl(`https://wa.me/${clean}?text=${encodeURIComponent("Hi Tror, I want to write a dynamic marketing post copy layout!")}`);
        }
      })
      .catch(err => console.error("Could not fetch public bot link", err));
  }, [whatsappBotNumber]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchConfig(), fetchChats(), fetchWhatsAppCampaigns(), fetchDiagnostics()]);
    setIsRefreshing(false);
  };

  const handleSaveWhatsappConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWhatsapp(true);
    setWhatsappSuccessMsg(null);

    try {
      const prodId = activeProduct?.id || 'sandbox_id';
      const token = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: prodId,
          token: whatsappToken,
          phoneNumberId: whatsappPhoneId,
          webhookVerifyToken: waWebhookKey,
          botPhoneNumber: whatsappBotNumber.replace(/\D/g, '')
        })
      });

      if (!res.ok) throw new Error("Failed to save credentials.");
      
      setWhatsappSuccessMsg("Credentials saved successfully! Your Tror Bot is now active.");
      setTimeout(() => setWhatsappSuccessMsg(null), 4000);

      // Reload configurations
      fetchConfig();
    } catch (err: any) {
      alert(err.message || "Failed to update configuration settings.");
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleDeleteConversation = async (sessId: string) => {
    if (!window.confirm("Are you sure you want to clear this WhatsApp chat memory document?")) return;
    try {
      const res = await fetch(`/api/whatsapp/chats/${sessId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessId));
        if (selectedSessionId === sessId) {
          setSelectedSessionId(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete chat doc", e);
    }
  };

  const handleSystemLogout = async () => {
    try {
      await logout();
      navigate('/whatsapp/login');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isConfigured = !!(whatsappPhoneId && whatsappToken && whatsappBotNumber);
  const selectedSession = activeSessions.find(s => s.id === selectedSessionId);

  // Helper to retrieve cleaner telephone sequence or wa_id
  const getCleanSessionPhone = (sessId: string) => {
    const parts = sessId.split('_');
    return parts.length > 1 ? `+${parts[1]}` : sessId;
  };

  return (
    <div className="min-h-screen bg-[#060a0c] text-[#F3F4F6] font-sans flex flex-col antialiased">
      
      {/* Visual Header Console Banner */}
      <header className="bg-[#0b1114] border-b border-emerald-500/10 px-6 py-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#00A884] font-bold">Standalone Bot Sandbox</span>
            <h1 className="text-sm font-bold text-white tracking-tight">TROR WhatsApp Outreach CRM Console</h1>
          </div>
        </div>

        {/* Real Dynamic System Monitoring Info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#0e1619] border border-white/5 py-1 px-3 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"}`} />
            <span className="text-[10px] font-mono text-gray-400">
              {isConfigured ? "MAPPING: ACTIVE & ONLINE" : "AWAITING CREDENTIALS SETUP"}
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
            title="Force refresh database collections"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <button
            onClick={handleSystemLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold font-sans inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* LEFT COLUMN: CONTROLS & API LINKING INTEGRATION (width: 5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#0e1518] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="border-b border-white/5 flex">
              <button
                onClick={() => setActiveConfigTab("credentials")}
                className={`flex-1 text-center py-3.5 text-xs uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                  activeConfigTab === "credentials" 
                    ? "bg-[#0b1114] text-emerald-400 border-b-2 border-emerald-500" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                1. Mappings & API Keys
              </button>
              <button
                onClick={() => setActiveConfigTab("integrations")}
                className={`flex-1 text-center py-3.5 text-xs uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                  activeConfigTab === "integrations" 
                    ? "bg-[#0b1114] text-emerald-400 border-b-2 border-emerald-500" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                2. Live Testing Info
              </button>
            </div>

            <div className="p-6">
              {activeConfigTab === "credentials" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <KeyRound className="w-4 h-4" />
                    <h3 className="text-xs uppercase font-mono tracking-wider font-bold">Meta Cloud API Credentials Setup</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Provide your system credentials to enable Tror to intercept and reply to live users with customized copy drafts dynamically saved directly inside your campaigns pipeline.
                  </p>

                  <form onSubmit={handleSaveWhatsappConfig} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1.5">WhatsApp Bot Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 919876543210 (include country code, digits only)"
                        value={whatsappBotNumber}
                        onChange={(e) => setWhatsappBotNumber(e.target.value)}
                        className="w-full bg-[#131b1e] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      />
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Input only digits. Use <strong>919876543210</strong>, not +91 98765-43210.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1.5">Phone Number ID</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3845914598102"
                          value={whatsappPhoneId}
                          onChange={(e) => setWhatsappPhoneId(e.target.value)}
                          className="w-full bg-[#131b1e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1.5">Verify Signature Key</label>
                        <input
                          type="text"
                          required
                          value={waWebhookKey}
                          onChange={(e) => setWaWebhookKey(e.target.value)}
                          className="w-full bg-[#131b1e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1.5">Meta Access Token (System User)</label>
                      <input
                        type="password"
                        required
                        placeholder="EAAGb34f2..."
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                        className="w-full bg-[#131b1e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={isSavingWhatsapp}
                        className="w-full font-sans text-xs font-bold py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black rounded-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{isSavingWhatsapp ? "Linking Configurations..." : "Sync & Activate Bot Agent"}</span>
                      </button>
                      
                      {whatsappSuccessMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-400 text-center text-xs font-semibold">
                          {whatsappSuccessMsg}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                    <h3 className="text-xs uppercase font-mono tracking-wider font-bold">Testing & Connection Guides</h3>
                  </div>
                  <p className="text-xs text-gray-450 leading-relaxed">
                    Once credentials are in place, test the dynamic "ditto campaign copy drafting" live via WhatsApp and let Tror sync results to your dashboard.
                  </p>

                  <div className="bg-[#0b1114] p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase">Step 1: Set Webhook url in Meta Developer Dashboard</span>
                    <p className="text-[10px] text-gray-500 font-sans leading-normal">
                      Copy the verified callback endpoint and configure it under Webhook Subscription Products on Meta's developer dashboard:
                    </p>
                    <code className="block bg-black/60 p-2.5 rounded text-emerald-400 font-mono text-[10px] select-all break-all border border-white/5">
                      {window.location.origin}/api/whatsapp
                    </code>
                  </div>

                  <div className="bg-[#0b1114] p-4 rounded-xl border border-white/5 space-y-2.5 text-left">
                    <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase">Step 2: Start Testing Conversational Drafts</span>
                    <p className="text-[10px] text-gray-500 font-sans leading-normal">
                      Press the button below to open your bot, greet Tror, and request a social media post copy or upload an image asset!
                    </p>
                    <a
                      href={liveBotUrl || `https://wa.me/?text=${encodeURIComponent("Create a post!")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 py-3 bg-[#00a884] hover:bg-[#008f72] rounded-xl text-xs font-bold text-black hover:brightness-105 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Launch WhatsApp Chat & Test Bot</span>
                    </a>
                  </div>

                  {/* Dynamic diagnostic debugger box */}
                  <div className="bg-[#05080a] p-4 rounded-xl border border-dashed border-emerald-500/20 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#00A884] font-mono font-bold uppercase">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        <span>Live Connection Diagnostic Logs</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchDiagnostics}
                        disabled={isDiagLoading}
                        className="text-[10px] uppercase font-mono font-bold text-gray-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                        title="Force refresh database connection check"
                      >
                        <RefreshCw className={`w-3 h-3 ${isDiagLoading ? "animate-spin" : ""}`} />
                        <span>{isDiagLoading ? "Scanning..." : "Scan Logs"}</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-[10px] font-mono leading-normal text-gray-400">
                      <div>
                        <span className="text-gray-500 uppercase">Configured Active Token Check: </span>
                        {diagTokens.length > 0 ? (
                          <span className="text-emerald-400 font-bold">🟢 Active Credential Saved in database</span>
                        ) : (
                          <span className="text-amber-400 font-bold">🟡 No configurations saved. Fill Mappings & API Keys first</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase">Live Webhook Event Stream (Latest payloads):</span>
                      </div>
                    </div>

                    <div className="bg-black/60 p-3 rounded-lg border border-white/5 font-mono text-[9px] text-[#00E676] max-h-36 overflow-y-auto space-y-2 leading-relaxed">
                      {diagLogs.length === 0 ? (
                        <div className="text-center text-gray-600 py-3">
                          No webhook payloads received yet.<br/>
                          1. Send "hi tror" to your WhatsApp number.<br/>
                          2. Click "Scan Logs" to poll for Meta payloads.
                        </div>
                      ) : (
                        diagLogs.slice(0, 4).map((log, lIdx) => {
                          const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
                          return (
                            <div key={log.id || lIdx} className="border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between text-gray-400 font-bold mb-1">
                                <span className="text-emerald-400">[{dateStr}] EVENT: {log.type || "webhook_ping"}</span>
                                <span className="text-gray-600">ID: {(log.id || "").substring(0, 8)}</span>
                              </div>
                              <div className="text-gray-300 break-all bg-black/40 p-1.5 rounded select-all font-mono">
                                {log.bodySnapshot ? log.bodySnapshot : JSON.stringify(log).substring(0, 200)}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* REAL SYNCHRONIZED CAMPAIGNS CREATED VIA WHATSAPP CHAT */}
          <div className="bg-[#0e1518] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Calendar className="w-4 h-4" />
                <h3 className="text-xs uppercase font-mono tracking-wider font-bold">WhatsApp Post Creations Sync</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase">{liveCampaigns.length} Saved Posts</span>
            </div>

            <p className="text-xs text-gray-400 leading-normal">
              These campaigns were auto-saved straight to standard Campaigns database collection via Tror WhatsApp discussions:
            </p>

            <div className="space-y-3.5 max-h-[340px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {liveCampaigns.length === 0 ? (
                <div className="p-6 text-center border border-white/5 bg-[#0b1114] rounded-xl">
                  <FileImage className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-xs text-gray-500 font-sans">No WhatsApp Generated Posts created yet. Message Tror to auto-draft one!</span>
                </div>
              ) : (
                liveCampaigns.map(camp => (
                  <div key={camp.id} className="bg-[#0b1114] p-3.5 border border-white/5 rounded-xl space-y-2 relative group hover:border-[#00a884]/40 transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">{camp.theme}</h4>
                      <span className="text-[7px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                        CRM SYNCED
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 line-clamp-3 font-sans italic leading-relaxed">
                      "{camp.platformVersions?.[0]?.copy || "No copywriting generated yet."}"
                    </div>

                    {camp.platformVersions?.[0]?.imageUrl && (
                      <div className="w-full h-24 rounded bg-black/40 border border-white/5 overflow-hidden">
                        <img 
                          referrerPolicy="no-referrer"
                          src={camp.platformVersions[0].imageUrl} 
                          alt="Creative asset generated" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1.5 text-[8px] font-mono text-gray-500">
                      <span>Saved: {camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : "Just now"}</span>
                      <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Saved & Delivered</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME CONVERSATIONAL LOG VISUALIZER (width: 7 columns) */}
        <div className="lg:col-span-7 bg-[#0e1518] border border-white/5 rounded-2xl flex flex-col h-[740px] shadow-xl overflow-hidden">
          
          {/* Header toolbar */}
          <div className="bg-[#0b1114] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white">Active Merchant Business Profiles</h3>
                <p className="text-[10px] text-gray-400">
                  {activeSessions.filter(s => !!s.businessProfile?.businessName).length} Active Profile{activeSessions.filter(s => !!s.businessProfile?.businessName).length !== 1 ? "s" : ""} Onboarded
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-[#00A884] font-semibold bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              ⚡ {activeSessions.filter(s => !!s.businessProfile?.businessName).length} profile{activeSessions.filter(s => !!s.businessProfile?.businessName).length !== 1 ? "s" : ""} created
            </span>
          </div>

          <div className="flex-1 flex overflow-hidden">
            
            {/* Conversations Sidebar List */}
            <div className="w-1/3 border-r border-white/5 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isLoadingChats && activeSessions.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                  <span className="text-[10px] text-gray-550 font-mono">Connecting Firestore...</span>
                </div>
              ) : activeSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-2.5">
                  <Smartphone className="w-8 h-8 mx-auto text-gray-700 mt-6" />
                  <p className="text-xs leading-normal font-sans">No user inquiries found. Ready for testing triggers!</p>
                </div>
              ) : (
                activeSessions.map((sess) => {
                  const cleanedPhone = getCleanSessionPhone(sess.id);
                  const isSelected = selectedSessionId === sess.id;
                  const lastMessage = sess.history?.[sess.history.length - 1];
                  const lastText = lastMessage?.parts?.[0]?.text || "Uploaded image content";

                  return (
                    <div
                      key={sess.id}
                      onClick={() => setSelectedSessionId(sess.id)}
                      className={`p-4 border-b border-white/5 text-left cursor-pointer transition-colors relative group ${
                        isSelected ? "bg-emerald-500/5 border-l-2 border-l-emerald-500" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-1">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate">
                            {sess.businessProfile?.businessName ? `🏢 ${sess.businessProfile.businessName}` : `👤 ${cleanedPhone}`}
                          </span>
                          <span className="text-[8px] font-mono uppercase mt-0.5">
                            {sess.businessProfile?.businessName ? (
                              <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.2 rounded">BOARDED</span>
                            ) : (
                              <span className="text-amber-400 font-semibold bg-amber-500/10 px-1 py-0.2 rounded">ONBOARDING</span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(sess.id);
                          }}
                          className="opacity-0 group-hover:opacity-150 transition-opacity p-0.5 hover:bg-rose-500/10 text-rose-400 rounded cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-gray-450 line-clamp-1 font-sans mt-1">
                        {lastText}
                      </div>

                      <div className="text-[8px] font-mono text-gray-500 text-right mt-1.5">
                        {sess.lastUpdated ? new Date(sess.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Conversation Active Chat Body */}
            <div className="flex-1 flex flex-col bg-[#080d0f] overflow-hidden">
              
              {selectedSession ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Info Header */}
                  <div className="bg-[#0e1518] p-4 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3">
                    <div className="flex items-start gap-4">
                      {selectedSession.businessProfile?.logoBase64 && (
                        <div className="relative w-14 h-14 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                          <img 
                            src={`data:${selectedSession.businessProfile.logoMime || 'image/png'};base64,${selectedSession.businessProfile.logoBase64}`}
                            alt="Merchant Logo" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div>
                        <span className="block text-[8px] font-mono uppercase text-emerald-400 font-bold tracking-wider">STANDALONE MERCHANT WHATSAPP PROFILE</span>
                        {selectedSession.businessProfile ? (
                          <div className="mt-1.5 space-y-0.5">
                            <span className="text-sm font-extrabold text-white tracking-wide block">🏢 {selectedSession.businessProfile.businessName}</span>
                            <span className="text-[10px] text-gray-400 font-sans block">📍 {selectedSession.businessProfile.address || "No Address Provided"}</span>
                            <span className="text-[10px] text-gray-400 font-mono block">📞 {selectedSession.businessProfile.phoneNumber || getCleanSessionPhone(selectedSession.id)}</span>
                          </div>
                        ) : (
                          <div className="mt-1 space-y-1">
                            <span className="text-xs font-bold font-mono text-white tracking-wide block">{getCleanSessionPhone(selectedSession.id)}</span>
                            <span className="text-[9px] text-[#FBBF24] font-sans block font-semibold">⚠️ Standalone setup in progress. Greet the bot with Business Name, Address & Phone to auto-initialize profile details!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">ACTIVE SESSION MEMORY</span>
                    </div>
                  </div>

                  {/* Messages Bubble Loops */}
                  {selectedSession.history?.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const hasAttachment = msg.parts?.some(p => p.inlineData);
                    const promptText = msg.parts?.find(p => p.text)?.text || "";

                    return (
                      <div key={index} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 whitespace-pre-wrap text-left shadow-md ${
                          isUser
                            ? "bg-[#0b6656] text-white rounded-tr-none"
                            : "bg-[#182329] text-gray-100 rounded-tl-none border border-white/5"
                        }`}>
                          
                          {/* Image Attachment Rendering */}
                          {hasAttachment && (
                            <div className="p-1 border border-white/10 rounded-xl bg-black/40 space-y-1.5">
                              <div className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider">ATTACHED WHATSAPP MEDIA</div>
                              <div className="w-full h-36 rounded-lg overflow-hidden bg-[#070b0d] flex items-center justify-center">
                                {msg.parts.find(p => p.inlineData)?.inlineData?.data ? (
                                  <img
                                    referrerPolicy="no-referrer"
                                    src={`data:${msg.parts.find(p => p.inlineData)?.inlineData?.mimeType || 'image/png'};base64,${msg.parts.find(p => p.inlineData)?.inlineData?.data}`}
                                    alt="Client attachment"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FileImage className="w-8 h-8 text-gray-600 animate-pulse" />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Normal Text response body */}
                          {promptText && (
                            <div className="font-sans whitespace-pre-line">
                              {promptText}
                            </div>
                          )}

                        </div>
                        <span className="text-[8px] font-mono text-gray-500 mt-1 px-1">
                          {isUser ? "User" : "Tror Outbox Agent"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
                  <Smartphone className="w-12 h-12 text-gray-700 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono uppercase mb-1">Awaiting active tester chats</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Launch your testing thread and say hello. Live texts and image attachments from Whatsapp will display here instantly!
                    </p>
                  </div>
                </div>
              )}

              {/* Live Info Footer */}
              <div className="p-4 bg-[#0b1114] border-t border-white/5 text-center shrink-0">
                <span className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  ⚡ Live WhatsApp Feed Console | Reading Real Incoming Messages
                </span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
