import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, X, ArrowRight, CheckCircle2, Sparkles, Globe, 
  ExternalLink, Layers, Cpu, ArrowUpRight, Check
} from 'lucide-react';
import { AGENTS_LIST, getAgentBySlug, renderAgentIcon, AgentData } from '../data/agentsData';

export function AgentDetailPage() {
  const { agentSlug } = useParams<{ agentSlug?: string }>();
  const navigate = useNavigate();

  // Find agent or default to LinkedIn
  const activeAgent: AgentData = getAgentBySlug(agentSlug || 'linkedin') || AGENTS_LIST[0];

  // Rotating words in hero
  const words = activeAgent.heroRotatingWords || ["founders.", "consultancies.", "agencies.", "executives."];
  const [wordIdx, setWordIdx] = useState(0);
  const [isWordIn, setIsWordIn] = useState(true);

  useEffect(() => {
    setWordIdx(0);
    setIsWordIn(true);
    const interval = setInterval(() => {
      setIsWordIn(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % words.length);
        setIsWordIn(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, [activeAgent.slug]);

  // Command bar input state
  const [heroUrl, setHeroUrl] = useState('');
  const [heroBtnText, setHeroBtnText] = useState('Generate 30 Free Posts');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) return;
    setHeroBtnText('Calibrating Agent...');
    setTimeout(() => {
      setHeroBtnText('Redirecting...');
      navigate(`/login?mode=signup&url=${encodeURIComponent(heroUrl)}&agent=${activeAgent.slug}`);
    }, 850);
  };

  // Dropdown States
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const agentsBtnRef = useRef<HTMLButtonElement>(null);
  const agentsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const integrationsDropdownRef = useRef<HTMLDivElement>(null);
  const integrationsBtnRef = useRef<HTMLButtonElement>(null);
  const integrationsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAgentsMouseEnter = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    setIntegrationsOpen(false);
    setAgentsOpen(true);
  };

  const handleAgentsMouseLeave = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    agentsTimerRef.current = setTimeout(() => {
      setAgentsOpen(false);
    }, 200);
  };

  const handleIntegrationsMouseEnter = () => {
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    setAgentsOpen(false);
    setIntegrationsOpen(true);
  };

  const handleIntegrationsMouseLeave = () => {
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    integrationsTimerRef.current = setTimeout(() => {
      setIntegrationsOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        agentsDropdownRef.current &&
        !agentsDropdownRef.current.contains(event.target as Node) &&
        agentsBtnRef.current &&
        !agentsBtnRef.current.contains(event.target as Node)
      ) {
        setAgentsOpen(false);
      }
      if (
        integrationsDropdownRef.current &&
        !integrationsDropdownRef.current.contains(event.target as Node) &&
        integrationsBtnRef.current &&
        !integrationsBtnRef.current.contains(event.target as Node)
      ) {
        setIntegrationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAgentsOpen(false);
        setIntegrationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
      if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#08080C] text-slate-100 selection:bg-[#7C3AED]/20 selection:text-[#C084FC] font-sans">
      <style>{`
        .font-serif { font-family: "EB Garamond", Georgia, serif; }
        .word-rotate {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        }
        .word-rotate.out { transform: translateY(18px); opacity: 0; }
        .word-rotate.in { transform: translateY(0); opacity: 1; }
        @keyframes orbit-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orbit-reverse {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes breathe-glow {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.96); }
          50% { opacity: 0.65; transform: translate(-50%, -50%) scale(1.04); }
        }
        .hero-orbit-cw { animation: orbit-slow 90s linear infinite; }
        .hero-orbit-ccw { animation: orbit-reverse 120s linear infinite; }
        .hero-halo-pulse { animation: breathe-glow 8s ease-in-out infinite; }
      `}</style>

      {/* ==========================================
           NAVIGATION BAR (With Both Agents & Integrations Dropdowns)
           ========================================== */}
      <nav id="main-nav" className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#08080C]/85 border-b border-white/[0.08] py-4 backdrop-blur-xl text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="flex justify-between items-center">
            {/* Brand Logo */}
            <Link className="flex items-center gap-2.5 group shrink-0" to="/">
              <img src="/B2PLOGO.png" alt="BrandToPost" className="w-8 h-8 object-contain" />
              <span className="text-base tracking-tight font-semibold">BrandToPost</span>
            </Link>

            {/* Nav Triggers & Links */}
            <div className="flex items-center gap-3 sm:gap-6 lg:gap-7">
              {/* Agents Dropdown Trigger */}
              <button
                ref={agentsBtnRef}
                onMouseEnter={handleAgentsMouseEnter}
                onMouseLeave={handleAgentsMouseLeave}
                onClick={() => {
                  setAgentsOpen(!agentsOpen);
                  setIntegrationsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  agentsOpen 
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]' 
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
                aria-expanded={agentsOpen}
                aria-label="Toggle agents dropdown"
              >
                <span className="tracking-tight font-medium">Agents</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${agentsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Integrations Dropdown Trigger */}
              <button
                ref={integrationsBtnRef}
                onMouseEnter={handleIntegrationsMouseEnter}
                onMouseLeave={handleIntegrationsMouseLeave}
                onClick={() => {
                  setIntegrationsOpen(!integrationsOpen);
                  setAgentsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  integrationsOpen 
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]' 
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
                aria-expanded={integrationsOpen}
                aria-label="Toggle integrations dropdown"
              >
                <span className="tracking-tight font-medium">Integrations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${integrationsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <Link className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity" to="/blog">Blog</Link>
              <Link className="px-4 py-2 text-xs font-medium tracking-wide transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white whitespace-nowrap" to="/login?mode=signup">
                Start free trial
              </Link>
            </div>
          </div>

          {/* Agents Mega Dropdown */}
          {agentsOpen && (
            <div
              ref={agentsDropdownRef}
              onMouseEnter={handleAgentsMouseEnter}
              onMouseLeave={handleAgentsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[680px] md:w-[780px] lg:w-[860px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></span>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Autonomous Agent Fleet</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                    Social + Creative
                  </span>
                </div>
                <button
                  onClick={() => setAgentsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close agents menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimalist Agents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 py-4">
                {AGENTS_LIST.map((agent) => (
                  <Link
                    key={agent.slug}
                    to={`/agents/${agent.slug}`}
                    onClick={() => setAgentsOpen(false)}
                    className={`group/agent p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                      agent.slug === activeAgent.slug 
                        ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40' 
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-[#7C3AED]/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      {renderAgentIcon(agent, "w-4 h-4")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-white group-hover/agent:text-[#C084FC] transition-colors truncate">
                          {agent.name}
                        </h4>
                        <ArrowUpRight className="w-3 h-3 text-white/25 group-hover/agent:text-[#C084FC] transition-colors shrink-0" />
                      </div>
                      <p className="text-[10px] font-mono text-white/45 truncate mt-0.5">
                        {agent.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>Synced to your central Brand DNA</span>
                </div>
                <Link
                  to="/"
                  onClick={() => setAgentsOpen(false)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors"
                >
                  <span>Launch full autonomous fleet free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Integrations Mega Dropdown */}
          {integrationsOpen && (
            <div
              ref={integrationsDropdownRef}
              onMouseEnter={handleIntegrationsMouseEnter}
              onMouseLeave={handleIntegrationsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[720px] md:w-[840px] lg:w-[940px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Direct Network Integrations</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                      11 Native Connectors
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Direct API sync with zero third-party zaps required. Schedule, format, and push live with 1 tap.
                  </p>
                </div>
                <button
                  onClick={() => setIntegrationsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close integrations menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3 Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-5">
                <div className="space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
                    Social & Professional Feeds
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "LinkedIn", type: "Company & Personal", icon: <img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" className="w-5 h-5 object-contain" />, desc: "Multi-slide PDF carousels, text thought-leadership & founder takes" },
                      { name: "X (Twitter)", type: "Viral Threads & Posts", icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, desc: "High-hook viral threads, commentary & direct founder insights" },
                      { name: "Instagram", type: "4:5 Visuals & Reels", icon: <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>, desc: "Layered 4:5 carousels, editorial branding & Reels video scripts" },
                      { name: "Facebook", type: "Pages & Groups", icon: <img src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" alt="Facebook" className="w-5 h-5 object-contain" />, desc: "Scheduled business announcements, case studies & discussion posts" }
                    ].map((item, i) => (
                      <div key={i} className="group/item flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white group-hover/item:text-[#A78BFA] transition-colors">{item.name}</span>
                            <span className="text-[9px] font-mono text-white/40 truncate">{item.type}</span>
                          </div>
                          <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
                    Video & Search Discovery
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "TikTok", type: "9:16 Video Scripts", icon: <svg className="w-4.5 h-4.5 fill-[#00F2FE]" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>, desc: "Hook-first vertical video scripts, audio pacing & prompt directives" },
                      { name: "YouTube", type: "Shorts & Community", icon: <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, desc: "Full video storyboards, description SEO & community tab posts" },
                      { name: "Pinterest", type: "Visual Search Pins", icon: <img src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" alt="Pinterest" className="w-5 h-5 object-contain" />, desc: "Infographic pins, visual authority assets & automated board routing" },
                      { name: "Threads", type: "Meta Text Feeds", icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12.001 2c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10 5.522 0 10-4.478 10-10 0-5.523-4.478-10-10-10zm4.57 13.916c-.516.897-1.321 1.572-2.327 1.954-1.006.381-2.115.421-3.208.115-1.092-.307-2.03-.974-2.712-1.928-.683-.955-1.05-2.114-1.06-3.307.01-1.194.377-2.353 1.06-3.308.682-.954 1.62-1.621 2.712-1.928 1.093-.306 2.202-.266 3.208.115 1.006.382 1.811 1.057 2.327 1.954.148.258.06.587-.198.736-.258.148-.588.06-.736-.198-.415-.721-1.062-1.264-1.87-1.57-1.189-.452-2.527-.294-3.578.423-1.05.717-1.688 1.905-1.706 3.176.018 1.27.656 2.458 1.706 3.175 1.051.717 2.389.875 3.578.423.808-.306 1.455-.849 1.87-1.57.148-.258.478-.346.736-.198.258.149.346.478.198.736z"/></svg>, desc: "Micro-blogging, rapid market observations & conversational replies" }
                    ].map((item, i) => (
                      <div key={i} className="group/item flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white group-hover/item:text-[#A78BFA] transition-colors">{item.name}</span>
                            <span className="text-[9px] font-mono text-white/40 truncate">{item.type}</span>
                          </div>
                          <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
                    Operations & Syndication
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "WhatsApp Bot", type: "Voice & 1-Tap", icon: <img src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" alt="WhatsApp" className="w-5 h-5 object-contain" />, desc: "20s voice notes turned into posts; reply '1' to publish live instantly" },
                      { name: "Reddit", type: "Niche Communities", icon: <svg className="w-5 h-5 fill-[#FF4500]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M16.5 13c0-.8-.6-1.5-1.5-1.5-.4 0-.8.2-1 .5-1-.7-2.4-1.1-3.9-1.1l.8-3.5 2.5.5c.1.6.6 1.1 1.3 1.1.7 0 1.3-.6 1.3-1.3S15.4 6.4 14.7 6.4c-.5 0-1 .3-1.2.8l-2.8-.6c-.2 0-.4.1-.5.3l-.9 4c-1.5.1-2.9.5-3.9 1.1-.3-.3-.6-.5-1-.5-.8 0-1.5.7-1.5 1.5 0 .6.4 1.1.9 1.4 0 .2 0 .4 0 .6 0 2.2 2.6 4 5.8 4s5.8-1.8 5.8-4c0-.2 0-.4 0-.6.6-.3 1.1-.8 1.1-1.4z"/></svg>, desc: "Zero-spam authentic value drops strictly tailored to subreddit rules" },
                      { name: "Blog & Webhooks", type: "SEO Articles & API", icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>, desc: "Long-form markdown blog articles, Ghost/WordPress feeds & webhooks" }
                    ].map((item, i) => (
                      <div key={i} className="group/item flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{item.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white group-hover/item:text-[#A78BFA] transition-colors">{item.name}</span>
                            <span className="text-[9px] font-mono text-white/40 truncate">{item.type}</span>
                          </div>
                          <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></span>
                  <span>Need custom enterprise CRM, Slack, or CMS webhooks?</span>
                </div>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setIntegrationsOpen(false)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors"
                >
                  <span>Connect all 11 platforms free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ==========================================
           1. HERO SECTION (Identical to Landing Page with Command Bar)
           ========================================== */}
      <section data-nav-theme="dark" className="relative w-full min-h-[92vh] bg-[#08080C] text-white pt-36 pb-20 px-6 sm:px-10 lg:px-16 flex flex-col justify-between border-b border-white/10 overflow-hidden">
        {/* Orbital Halo & Ambient Coordinate Frame */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="hero-halo-pulse absolute top-[44%] left-1/2 w-[540px] h-[540px] sm:w-[760px] sm:h-[760px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,rgba(192,132,252,0.04)_45%,transparent_70%)] blur-2xl"></div>
          
          <div className="hero-orbit-cw absolute top-[44%] left-1/2 w-[660px] h-[660px] sm:w-[920px] sm:h-[920px] lg:w-[1120px] lg:h-[1120px] rounded-full border border-white/[0.06]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#7C3AED] shadow-[0_0_14px_#7C3AED]"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#C084FC]/60"></div>
          </div>

          <div className="hero-orbit-ccw absolute top-[44%] left-1/2 w-[480px] h-[480px] sm:w-[680px] sm:h-[680px] rounded-full border border-dashed border-[#C084FC]/[0.12]">
            <div className="absolute top-[14%] right-[14%] w-1.5 h-1.5 bg-[#C084FC] shadow-[0_0_10px_#C084FC]"></div>
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"></div>
        </div>

        {/* Centered Main Content Stage */}
        <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto py-10 space-y-8">
          
          <div className="space-y-6 flex flex-col items-center w-full">
            {/* Top Tag */}
            <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-400">
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
              <span className="flex items-center gap-2">
                <span className="text-white font-semibold">{activeAgent.name.toUpperCase()}</span>
                <span>·</span>
                <span>AUTONOMOUS ENGINE</span>
              </span>
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
            </div>

            {/* Headline with Rotating Words */}
            <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-serif font-normal tracking-tight text-white leading-[1.04]">
              {activeAgent.heroHeadline} <br className="hidden sm:block" />
              <span className={`word-rotate text-[#C084FC] italic font-normal ${isWordIn ? 'in' : 'out'}`}>
                {words[wordIdx]}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              {activeAgent.heroSubtitle}
            </p>

            {/* Centered Command URL Input Bar (Identical to Landing Page) */}
            <form onSubmit={handleHeroSubmit} className="pt-3 max-w-xl w-full mx-auto">
              <div className="flex flex-col sm:flex-row items-stretch bg-[#0D0D14]/90 border border-white/15 p-1.5 transition-all duration-300 focus-within:border-[#7C3AED] shadow-[0_0_50px_rgba(124,58,237,0.18)] backdrop-blur-xl">
                <div className="flex items-center gap-2 pl-3.5 pr-1 text-slate-500">
                  <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-mono text-slate-500 select-none">https://</span>
                </div>
                <input 
                  type="text" 
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="yourcompany.com" 
                  required 
                  className="flex-1 bg-transparent px-2 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-sans" 
                />
                <button 
                  type="submit" 
                  className="px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 group shadow-sm"
                >
                  <span>{heroBtnText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-400">
                <span>2-min setup</span>
                <span>·</span>
                <span>Founder + Company streams</span>
                <span>·</span>
                <span>No card required</span>
              </div>
            </form>
          </div>
        </div>

        {/* Fleet Quick Selector Bar */}
        <div className="max-w-5xl mx-auto w-full relative z-10 pt-6 border-t border-white/[0.08] overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 min-w-max">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-2">FLEET:</span>
            {AGENTS_LIST.map((agent) => (
              <Link
                key={agent.slug}
                to={`/agents/${agent.slug}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  agent.slug === activeAgent.slug
                    ? 'bg-white/10 text-white font-medium border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {renderAgentIcon(agent, "w-3.5 h-3.5")}
                </span>
                <span>{agent.name.replace(' Agent', '')}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
           2. WHAT IS IT FOR? SECTION
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          
          <div className="mb-14">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
              <span>CORE PURPOSE &amp; CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight mb-4">
              What is the {activeAgent.name} for?
            </h2>
            <p className="text-base sm:text-xl text-slate-300 font-light max-w-3xl leading-relaxed">
              {activeAgent.whatIsItFor.lead}
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed mb-10 max-w-3xl">
            {activeAgent.whatIsItFor.description}
          </p>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
            {activeAgent.whatIsItFor.capabilities.map((cap, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#C084FC]">
                      {cap.tag}
                    </span>
                    <span className="text-xs font-mono text-slate-500">0{i + 1}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                    {cap.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Checklist Bullet Strip */}
          <div className="p-6 rounded-xl border border-white/10 bg-[#0F1017]/80">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
              NATIVE FORMAT DELIVERABLES:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeAgent.whatIsItFor.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
           3. WHY SHOULD YOU USE IT? SECTION
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          <div className="mb-14">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
              <span>ROI &amp; REASON TO DEPLOY</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight mb-4">
              Why you should use the {activeAgent.name}.
            </h2>
            <p className="text-base sm:text-xl text-slate-300 font-light max-w-3xl leading-relaxed">
              {activeAgent.whyShouldYouUseIt.lead}
            </p>
          </div>

          {/* 3 Metric High-Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {activeAgent.whyShouldYouUseIt.benefits.map((b, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl sm:text-5xl font-serif text-white mb-2">
                    {b.metric}
                  </div>
                  <div className="text-sm font-medium text-white mb-1.5">
                    {b.title}
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table: Doing It Manually vs. With Agent */}
          <div className="rounded-2xl border border-white/15 bg-[#0C0D14]/90 overflow-hidden shadow-2xl">
            <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-white">Manual Bottleneck vs. {activeAgent.name}</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">How your workflow fundamentally changes once autonomous execution is turned on.</p>
              </div>
              <span className="text-[11px] font-mono uppercase px-3 py-1 rounded bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30 w-fit">
                Zero Retainers
              </span>
            </div>

            <div className="divide-y divide-white/[0.08]">
              {activeAgent.whyShouldYouUseIt.comparison.map((comp, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 sm:p-6 text-xs sm:text-sm">
                  <div className="font-medium text-slate-300 md:col-span-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <span>{comp.feature}</span>
                  </div>
                  <div className="text-slate-400 md:col-span-1 line-through decoration-red-500/60 font-light">
                    {comp.manual}
                  </div>
                  <div className="text-emerald-300 md:col-span-1 font-medium flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{comp.withAgent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
           4. HOW IT WORKS: 4-STEP PIPELINE
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          
          <div className="mb-14">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
              <span>4-STEP AUTONOMOUS PIPELINE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight mb-2">
              From your link to live {activeAgent.platform} reach.
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-10">
            {activeAgent.workflowSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-6 sm:gap-10 group">
                <span className="text-3xl sm:text-5xl font-serif text-white/20 group-hover:text-[#C084FC] transition-colors shrink-0 font-light select-none">
                  {step.step}
                </span>
                <div className="flex-1 pt-1 border-b border-white/10 pb-8 sm:pb-10">
                  <h3 className="text-lg sm:text-2xl font-medium text-white tracking-tight mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400 font-light mb-3 leading-relaxed">
                    {step.desc}
                  </p>
                  <div className="font-mono text-xs text-emerald-400 flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-lg w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{step.codePreview}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
           5. LIVE SAMPLE OUTPUT SHOWCASE
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          
          <div className="mb-12">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
              <span>OUTPUT SHOWCASE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight mb-2">
              What the {activeAgent.name} drafts for you.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-light max-w-2xl">
              Real-world formatting calibrated specifically to satisfy {activeAgent.platform}'s latest recommendation algorithm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeAgent.sampleOutputs.map((sample, idx) => (
              <div 
                key={idx}
                className="p-6 sm:p-7 rounded-2xl border border-white/10 bg-[#0F1017]/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                      {sample.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{sample.type}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-white mb-3">
                    {sample.title}
                  </h3>

                  <div className="p-4 rounded-xl bg-black/60 border border-white/5 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-4">
                    "{sample.hook}"
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{sample.previewMeta}</span>
                  <span className="text-emerald-400 font-medium">✓ Ready to Post</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
           6. FINAL CALL TO ACTION (With Command URL Bar)
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/15 rounded-full blur-[180px] pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC]">
            <span>GET STARTED TODAY</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight">
            Deploy your {activeAgent.name} in 2 minutes.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Drop your website link. Receive 30 posts drafted in your exact voice, formatted for {activeAgent.platform}.
          </p>

          <form onSubmit={handleHeroSubmit} className="pt-2 max-w-xl w-full mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch bg-[#0D0D14]/90 border border-white/15 p-1.5 transition-all duration-300 focus-within:border-[#7C3AED] shadow-[0_0_50px_rgba(124,58,237,0.18)] backdrop-blur-xl">
              <div className="flex items-center gap-2 pl-3.5 pr-1 text-slate-500">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs font-mono text-slate-500 select-none">https://</span>
              </div>
              <input 
                type="text" 
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="yourcompany.com" 
                required 
                className="flex-1 bg-transparent px-2 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-sans" 
              />
              <button 
                type="submit" 
                className="px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 group"
              >
                <span>{heroBtnText}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-400">
              <span>2-min setup</span>
              <span>·</span>
              <span>No card required</span>
              <span>·</span>
              <span>Review on WhatsApp</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
