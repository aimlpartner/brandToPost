import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, X, ArrowRight, Globe, ArrowUpRight, Check,
  Fingerprint, Palette, Layers, Cpu, Bookmark, Repeat2
} from 'lucide-react';
import { AGENTS_LIST, renderAgentIcon } from '../data/agentsData';
import { SOLUTIONS_LIST, getSolutionBySlug, renderSolutionIcon, SolutionData } from '../data/solutionsData';
import { CloudShader } from '../components/ui/cloud-shader';

function renderSolutionVisualBlueprint(solution: SolutionData) {
  switch (solution.slug) {
    case 'founders':
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
              DUAL-STREAM FOUNDER ARCHITECTURE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">● 99.4% Voice Clone</span>
          </div>

          {/* Top Input: Arthur Voice + Owned Brand */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#C084FC]/40 bg-[#7C3AED]/15 flex items-center justify-center text-[#C084FC]">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Founder Voice + Owned Brand</div>
                <div className="text-[10px] font-mono text-slate-400">Arthur Engine + yourcompany.com</div>
              </div>
            </div>
            <div className="flex items-center gap-1 h-5">
              {[45, 85, 60, 100, 75, 95, 55, 80].map((h, i) => (
                <span key={i} className="w-1 rounded-full bg-[#C084FC]" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Dual Stream Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-l-2 border-[#C084FC] pl-3.5 py-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#C084FC] uppercase">Stream A · Personal</span>
                <span className="text-slate-400">LinkedIn + X</span>
              </div>
              <div className="text-xs font-medium text-white">1st-Person Founder Takes</div>
              <div className="text-[11px] text-slate-400 font-light">
                Contrarian stories &amp; quote cards written in your exact voice.
              </div>
            </div>

            <div className="border-l-2 border-emerald-400 pl-3.5 py-1 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400 uppercase">Stream B · Company</span>
                <span className="text-slate-400">11 Channels</span>
              </div>
              <div className="text-xs font-medium text-white">Product Proof &amp; SEO</div>
              <div className="text-[11px] text-slate-400 font-light">
                Multi-slide product carousels, visuals &amp; search-ranked articles.
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Weekly Founder Time: 60 Seconds</span>
            <span className="text-emerald-400">✓ Zero Hours Writing</span>
          </div>
        </div>
      );

    case 'b2b-saas':
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
              CHANGELOG-TO-PIPELINE ENGINE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">+340% Inbound Demos</span>
          </div>

          {/* Input Release */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono text-sky-300">
                SHIP v2.4
              </span>
              <span className="text-white font-medium">Zero-Config SSO &amp; Audit Logs</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Ingested in 3s</span>
          </div>

          {/* 3 Generated GTM Assets */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="border border-white/10 p-3 space-y-1.5">
              <span className="text-[9px] font-mono text-sky-400 uppercase block">LinkedIn PDF</span>
              <div className="text-xs font-medium text-white">8-Slide Enterprise Security Deck</div>
              <div className="text-[10px] font-mono text-slate-500">Targets CISOs</div>
            </div>
            <div className="border border-white/10 p-3 space-y-1.5">
              <span className="text-[9px] font-mono text-[#C084FC] uppercase block">X Launch Thread</span>
              <div className="text-xs font-medium text-white">7-Part Architecture Breakdown</div>
              <div className="text-[10px] font-mono text-slate-500">Targets CTOs</div>
            </div>
            <div className="border border-white/10 p-3 space-y-1.5">
              <span className="text-[9px] font-mono text-emerald-400 uppercase block">SEO Guide</span>
              <div className="text-xs font-medium text-white">2,100w TCO Comparison</div>
              <div className="text-[10px] font-mono text-slate-500">High-Intent Search</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Synced to Company + CEO Feeds</span>
            <span className="text-emerald-400">✓ Auto-Scheduled</span>
          </div>
        </div>
      );

    case 'boutique-agencies':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              MULTI-TENANT CLIENT WORKSPACES
            </span>
            <span className="text-[10px] font-mono text-slate-400">88% Gross Margin</span>
          </div>

          {/* 3 Client Rows */}
          <div className="divide-y divide-white/10 border-b border-white/10">
            {[
              { name: "Client 01 · FinTech SaaS", colors: ["#0EA5E9", "#10B981"], status: "30/30 Scheduled" },
              { name: "Client 02 · B2B Advisory", colors: ["#7C3AED", "#C084FC"], status: "30/30 Scheduled" },
              { name: "Client 03 · DevTool Infra", colors: ["#F59E0B", "#34D399"], status: "Client Approved ✓" }
            ].map((client, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1">
                    <span className="w-3.5 h-3.5 rounded-full border border-black" style={{ backgroundColor: client.colors[0] }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black" style={{ backgroundColor: client.colors[1] }} />
                  </div>
                  <span className="text-white font-medium">{client.name}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{client.status}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Isolated Voice &amp; Brand DNA per Client</span>
            <span className="text-[#C084FC]">10x Capacity</span>
          </div>
        </div>
      );

    case 'consultancies':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
              PROPRIETARY IP TO EXECUTIVE DECK
            </span>
            <span className="text-[10px] font-mono text-emerald-400">4.6x C-Suite Dwell Time</span>
          </div>

          {/* Executive Slide Deck Preview */}
          <div className="border border-white/15 p-5 bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-[#C084FC]">DIAGNOSTIC BRIEFING · SLIDE 01/08</span>
              <span>MANAGING PARTNER VOICE</span>
            </div>
            <div className="text-base sm:text-xl font-serif text-white leading-snug">
              The 4-Quadrant Post-Merger Integration Matrix
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-[10px] font-mono">
              <div className="border-l-2 border-[#C084FC] pl-2.5 py-0.5 text-slate-300">
                Q1: Day-1 Systems Consolidation
              </div>
              <div className="border-l-2 border-emerald-400 pl-2.5 py-0.5 text-slate-300">
                Q2: Margin Recovery (31% Avg)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Published Across 6 Partner Profiles</span>
            <span className="text-emerald-400">0 Billable Hours Used</span>
          </div>
        </div>
      );

    case 'fractional-executives':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
              RETAINER WAITLIST FLYWHEEL
            </span>
            <span className="text-[10px] font-mono text-emerald-400">4/4 Advisory Slots Full</span>
          </div>

          {/* Weekly Cadence Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-[10px] font-mono">
            <div className="border border-white/10 p-3">
              <span className="text-amber-400 block mb-1">MON · LINKEDIN</span>
              <span className="text-xs font-sans text-white font-medium block">90-Day Audit Playbook</span>
            </div>
            <div className="border border-white/10 p-3">
              <span className="text-[#C084FC] block mb-1">WED · X THREAD</span>
              <span className="text-xs font-sans text-white font-medium block">Series A Board Heuristics</span>
            </div>
            <div className="border border-white/10 p-3">
              <span className="text-emerald-400 block mb-1">FRI · CASE STUDY</span>
              <span className="text-xs font-sans text-white font-medium block">CAC Payback Teardown</span>
            </div>
          </div>

          {/* Retainer Status Bar */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">Active Pipeline: 3 Inbound CEO DMs / Wk</span>
            <span className="text-emerald-400">$10k/mo Avg Retainer</span>
          </div>
        </div>
      );

    case 'ai-dev-tools':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              BENCHMARK &amp; ARCHITECTURE ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">Zero Marketing Fluff</span>
          </div>

          {/* Technical Benchmark Visual */}
          <div className="space-y-2.5 border-b border-white/10 pb-4 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white">Your Engine (p99 Latency: 42ms)</span>
              <span className="text-emerald-400">-64% Faster</span>
            </div>
            <div className="w-full h-2 bg-white/10 overflow-hidden">
              <div className="w-1/3 h-full bg-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Legacy Stateless DAG (118ms)</span>
              <span>2.8x Overhead</span>
            </div>
            <div className="w-full h-2 bg-white/10 overflow-hidden">
              <div className="w-11/12 h-full bg-rose-500/50" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Bookmark className="w-3.5 h-3.5 text-[#C084FC]" /> 640 Developer Bookmarks
            </span>
            <span className="text-emerald-400">✓ Cited by AI Search</span>
          </div>
        </div>
      );

    case 'design-dev-studios':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400">
              SHIPPED URL TO 4:5 SHOWCASE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">5.8x Portfolio Saves</span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 aspect-[4/5] border border-pink-400/40 bg-gradient-to-b from-pink-500/10 to-transparent p-3.5 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-pink-300">01 / 07 · 4:5</span>
              <div className="text-sm font-serif text-white leading-snug">
                +48% Demo Lift After Hero Redesign
              </div>
              <span className="text-[9px] font-mono text-slate-400">Swipe Teardown →</span>
            </div>

            <div className="col-span-7 space-y-3">
              <div className="border-l-2 border-pink-400 pl-3">
                <div className="text-[10px] font-mono text-pink-400">EXTRACTED DESIGN TOKENS</div>
                <div className="text-xs text-white">Palette + Typography + Grid Ratios</div>
              </div>
              <div className="border-l-2 border-[#C084FC] pl-3">
                <div className="text-[10px] font-mono text-[#C084FC]">GENERATED CAMPAIGN</div>
                <div className="text-xs text-white">7-Slide 4:5 Deck + X Build Thread</div>
              </div>
              <div className="border-l-2 border-emerald-400 pl-3">
                <div className="text-[10px] font-mono text-emerald-400">INBOUND OUTCOME</div>
                <div className="text-xs text-white">Fills next month's $25k+ studio slots</div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      // Venture Studios & Solo GPs
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
              THESIS-TO-DEALFLOW ENGINE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">3.8x Inbound Founder DMs</span>
          </div>

          <div className="border-l-2 border-indigo-400 pl-3.5 py-1 space-y-1">
            <span className="text-[10px] font-mono text-indigo-300 uppercase">Internal Investment Memo</span>
            <div className="text-sm font-serif text-white">
              "Why Vertical AI Agents Are Unbundling Legacy $10B ERPs"
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-[10px] font-mono pt-1">
            <div className="border border-white/10 p-2.5">
              <span className="text-[#C084FC] block mb-1">X THESIS</span>
              <span className="text-white">7-Part Thread</span>
            </div>
            <div className="border border-white/10 p-2.5">
              <span className="text-indigo-400 block mb-1">LINKEDIN</span>
              <span className="text-white">Partner Essay</span>
            </div>
            <div className="border border-white/10 p-2.5">
              <span className="text-emerald-400 block mb-1">SUBSTACK</span>
              <span className="text-white">LP Dispatch</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Attracts Pre-Seed &amp; Seed Builders</span>
            <span className="text-emerald-400">✓ GP Voice Locked</span>
          </div>
        </div>
      );
  }
}

export function SolutionDetailPage() {
  const { solutionSlug } = useParams<{ solutionSlug?: string }>();
  const navigate = useNavigate();

  const activeSolution: SolutionData = getSolutionBySlug(solutionSlug || 'founders') || SOLUTIONS_LIST[0];

  const words = activeSolution.heroRotatingWords;
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
  }, [activeSolution.slug]);

  const [heroUrl, setHeroUrl] = useState('');
  const [heroBtnText, setHeroBtnText] = useState('Generate 30 Free Posts');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) return;
    setHeroBtnText('Calibrating Stack...');
    setTimeout(() => {
      setHeroBtnText('Redirecting...');
      navigate(`/login?mode=signup&url=${encodeURIComponent(heroUrl)}&solution=${activeSolution.slug}`);
    }, 850);
  };

  // Navbar Dropdown States (Solutions, Agents, Integrations)
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  const solutionsDropdownRef = useRef<HTMLDivElement>(null);
  const solutionsBtnRef = useRef<HTMLButtonElement>(null);
  const solutionsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const agentsBtnRef = useRef<HTMLButtonElement>(null);
  const agentsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const integrationsDropdownRef = useRef<HTMLDivElement>(null);
  const integrationsBtnRef = useRef<HTMLButtonElement>(null);
  const integrationsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeAllTimers = () => {
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
  };

  const handleSolutionsMouseEnter = () => {
    closeAllTimers();
    setAgentsOpen(false);
    setIntegrationsOpen(false);
    setSolutionsOpen(true);
  };

  const handleSolutionsMouseLeave = () => {
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    solutionsTimerRef.current = setTimeout(() => setSolutionsOpen(false), 200);
  };

  const handleAgentsMouseEnter = () => {
    closeAllTimers();
    setSolutionsOpen(false);
    setIntegrationsOpen(false);
    setAgentsOpen(true);
  };

  const handleAgentsMouseLeave = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    agentsTimerRef.current = setTimeout(() => setAgentsOpen(false), 200);
  };

  const handleIntegrationsMouseEnter = () => {
    closeAllTimers();
    setSolutionsOpen(false);
    setAgentsOpen(false);
    setIntegrationsOpen(true);
  };

  const handleIntegrationsMouseLeave = () => {
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    integrationsTimerRef.current = setTimeout(() => setIntegrationsOpen(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        solutionsDropdownRef.current &&
        !solutionsDropdownRef.current.contains(target) &&
        solutionsBtnRef.current &&
        !solutionsBtnRef.current.contains(target)
      ) {
        setSolutionsOpen(false);
      }
      if (
        agentsDropdownRef.current &&
        !agentsDropdownRef.current.contains(target) &&
        agentsBtnRef.current &&
        !agentsBtnRef.current.contains(target)
      ) {
        setAgentsOpen(false);
      }
      if (
        integrationsDropdownRef.current &&
        !integrationsDropdownRef.current.contains(target) &&
        integrationsBtnRef.current &&
        !integrationsBtnRef.current.contains(target)
      ) {
        setIntegrationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSolutionsOpen(false);
        setAgentsOpen(false);
        setIntegrationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      closeAllTimers();
    };
  }, []);

  const assignedAgentObjects = activeSolution.assignedAgents
    .map((slug) => AGENTS_LIST.find((a) => a.slug === slug))
    .filter(Boolean);

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
           NAVIGATION BAR (With Solutions, Agents & Integrations Dropdowns)
           ========================================== */}
      <nav id="main-nav" className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#08080C]/85 border-b border-white/[0.08] py-4 backdrop-blur-xl text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="flex justify-between items-center">
            <Link className="flex items-center gap-2.5 group shrink-0" to="/">
              <img src="/B2PLOGO.png" alt="BrandToPost" className="w-8 h-8 object-contain" />
              <span className="text-base tracking-tight font-semibold">BrandToPost</span>
            </Link>

            <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5">
              {/* Solutions Dropdown Trigger */}
              <button
                ref={solutionsBtnRef}
                onMouseEnter={handleSolutionsMouseEnter}
                onMouseLeave={handleSolutionsMouseLeave}
                onClick={() => {
                  setSolutionsOpen(!solutionsOpen);
                  setAgentsOpen(false);
                  setIntegrationsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  solutionsOpen
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <span className="tracking-tight font-medium">Solutions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${solutionsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Agents Dropdown Trigger */}
              <button
                ref={agentsBtnRef}
                onMouseEnter={handleAgentsMouseEnter}
                onMouseLeave={handleAgentsMouseLeave}
                onClick={() => {
                  setAgentsOpen(!agentsOpen);
                  setSolutionsOpen(false);
                  setIntegrationsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  agentsOpen
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
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
                  setSolutionsOpen(false);
                  setAgentsOpen(false);
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  integrationsOpen
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <span className="tracking-tight font-medium">Integrations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${integrationsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <Link className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity hidden md:block" to="/blog">Blog</Link>
              <Link className="px-4 py-2 text-xs font-medium tracking-wide transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white whitespace-nowrap" to="/login?mode=signup">
                Start free trial
              </Link>
            </div>
          </div>

          {/* Solutions Mega Dropdown */}
          {solutionsOpen && (
            <div
              ref={solutionsDropdownRef}
              onMouseEnter={handleSolutionsMouseEnter}
              onMouseLeave={handleSolutionsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[700px] md:w-[820px] lg:w-[900px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#C084FC] animate-pulse"></span>
                  <h3 className="text-sm font-semibold text-white tracking-tight">High-Conviction Niche Solutions</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/30">
                    Purpose-Built Playbooks
                  </span>
                </div>
                <button
                  onClick={() => setSolutionsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 py-4">
                {SOLUTIONS_LIST.map((sol) => (
                  <Link
                    key={sol.slug}
                    to={`/solutions/${sol.slug}`}
                    onClick={() => setSolutionsOpen(false)}
                    className={`group/sol p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      sol.slug === activeSolution.slug
                        ? 'bg-[#7C3AED]/15 border-[#7C3AED]/50'
                        : sol.isFlagship
                        ? 'bg-[#7C3AED]/[0.07] border-[#C084FC]/30 hover:border-[#C084FC]/60'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-[#7C3AED]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                        {renderSolutionIcon(sol.slug, "w-4 h-4")}
                      </div>
                      {sol.isFlagship ? (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#7C3AED] text-white font-semibold">
                          ★ Founder
                        </span>
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/25 group-hover/sol:text-[#C084FC] transition-colors shrink-0" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover/sol:text-[#C084FC] transition-colors">
                        {sol.shortName}
                      </h4>
                      <p className="text-[10px] font-mono text-white/50 truncate mt-0.5">
                        {sol.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Calibrated for high-trust B2B, founder, and operator workflows</span>
                </div>
                <Link
                  to="/founder"
                  onClick={() => setSolutionsOpen(false)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#C084FC] hover:text-white transition-colors"
                >
                  <span>Explore Master Founder Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Agents Mega Dropdown */}
          {agentsOpen && (
            <div
              ref={agentsDropdownRef}
              onMouseEnter={handleAgentsMouseEnter}
              onMouseLeave={handleAgentsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[680px] md:w-[780px] lg:w-[860px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 py-4">
                {AGENTS_LIST.map((agent) => (
                  <Link
                    key={agent.slug}
                    to={`/agents/${agent.slug}`}
                    onClick={() => setAgentsOpen(false)}
                    className="group/agent p-3.5 rounded-xl border bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-[#7C3AED]/50 transition-all flex items-center gap-3"
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
            </div>
          )}

          {/* Integrations Mega Dropdown */}
          {integrationsOpen && (
            <div
              ref={integrationsDropdownRef}
              onMouseEnter={handleIntegrationsMouseEnter}
              onMouseLeave={handleIntegrationsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[680px] bg-[#0A0A0F]/95 border border-white/15 shadow-2xl backdrop-blur-2xl rounded-2xl p-6 z-50 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white">11 Direct Network Integrations</span>
                <button onClick={() => setIntegrationsOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 pt-3">
                LinkedIn, X (Twitter), Instagram, Facebook, TikTok, YouTube, Pinterest, Threads, Reddit, WhatsApp, and CMS Webhooks connected natively.
              </p>
            </div>
          )}
        </div>
      </nav>

      {/* ==========================================
           1. HERO SECTION (With Cloud Shader & Niche Quick Switcher)
           ========================================== */}
      <section data-nav-theme="dark" className="relative w-full min-h-[92vh] bg-[#08080C] text-white pt-36 pb-20 px-6 sm:px-10 lg:px-16 flex flex-col justify-between border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <CloudShader
            className="w-full h-full"
            speed={0.8}
            count={4}
            cloudColor="#fbf8f2"
            skyTopColor="#3876ba"
            skyBottomColor="#8cbfe8"
            resolutionScale={0.55}
            maxFps={36}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080C]/75 via-[#08080C]/25 to-[#08080C]/90 pointer-events-none" />

          <div className="hero-halo-pulse absolute top-[44%] left-1/2 w-[540px] h-[540px] sm:w-[760px] sm:h-[760px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,rgba(192,132,252,0.04)_45%,transparent_70%)] blur-2xl"></div>
          <div className="hero-orbit-cw absolute top-[44%] left-1/2 w-[660px] h-[660px] sm:w-[920px] sm:h-[920px] lg:w-[1120px] lg:h-[1120px] rounded-full border border-white/[0.06]"></div>
        </div>

        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto py-10 space-y-8">
          <div className="space-y-6 flex flex-col items-center w-full">
            <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
              <span className="flex items-center gap-2">
                <span className="text-[#C084FC] font-semibold">{activeSolution.badge}</span>
                <span>·</span>
                <span>{activeSolution.role.toUpperCase()}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[74px] font-serif font-normal tracking-tight text-white leading-[1.04] drop-shadow-[0_4px_28px_rgba(0,0,0,0.7)]">
              {activeSolution.heroHeadline} <br className="hidden sm:block" />
              <span className={`word-rotate text-[#C084FC] italic font-normal ${isWordIn ? 'in' : 'out'}`}>
                {words[wordIdx]}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {activeSolution.heroSubtitle}
            </p>

            {/* Command URL Input Bar */}
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
                  className="px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 group shadow-sm"
                >
                  <span>{heroBtnText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-300">
                <span>60s URL calibration</span>
                <span>·</span>
                <span>Tailored for {activeSolution.shortName}</span>
                <span>·</span>
                <span>No card required</span>
              </div>
            </form>
          </div>
        </div>

        {/* Niche Solutions Quick Switcher Bar */}
        <div className="max-w-6xl mx-auto w-full relative z-10 pt-6 border-t border-white/[0.08] overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-2 py-1 min-w-max">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mr-1">NICHES:</span>
            {SOLUTIONS_LIST.map((sol) => (
              <Link
                key={sol.slug}
                to={`/solutions/${sol.slug}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  sol.slug === activeSolution.slug
                    ? 'bg-white/10 text-white font-medium border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  {renderSolutionIcon(sol.slug, "w-3.5 h-3.5")}
                </span>
                <span>{sol.shortName}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
           2. NICHE ARCHITECTURE & VISUAL BLUEPRINT (Balanced 2-Column)
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                BUILT FOR {activeSolution.name.toUpperCase()}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                Why <em className="italic text-[#C084FC]">{activeSolution.shortName}</em> run on BrandToPost.
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activeSolution.role}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center border-t border-white/10 pt-10">
            
            {/* Left (6 cols): 4 Concise Niche Bottlenecks Solved */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {activeSolution.painPointsSolved.map((item, i) => (
                <div key={i} className="border-l border-white/15 pl-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
                        {item.tag}
                      </span>
                      <span className="text-[11px] font-mono text-white/30">0{i + 1}</span>
                    </div>
                    <h3 className="text-base font-medium text-white mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right (6 cols): Bespoke Niche Visual Blueprint */}
            <div className="lg:col-span-6 lg:pl-10 lg:border-l lg:border-white/10">
              {renderSolutionVisualBlueprint(activeSolution)}
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           3. THE 3-STEP NICHE PLAYBOOK (Visual Help on Top + 1-Line Copy Below)
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                3-STEP NICHE PLAYBOOK
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                How it works for <em className="italic text-[#C084FC]">{activeSolution.shortName}.</em>
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Zero Hours Writing · Full Autopilot</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            {activeSolution.threeStepPlaybook.map((step, idx) => (
              <div
                key={idx}
                className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-7"
              >
                {/* Visual Diagram on Top */}
                <div className="h-32 flex flex-col justify-center gap-3 border-b border-white/10 pb-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      STEP 0{idx + 1}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#C084FC]"></span>
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-white truncate">
                    {step.visualTopLabel}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-emerald-400">
                      → {step.visualBottomLabel}
                    </span>
                  </div>
                </div>

                {/* Minimal Text Below */}
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl font-serif text-[#C084FC] font-light">0{idx + 1}</span>
                    <h3 className="text-base sm:text-lg font-medium text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
           4. ASSIGNED AGENT STACK FOR THIS NICHE
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-24 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                RECOMMENDED SPECIALIST ROSTER
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-normal text-white tracking-tight">
                Primary agents powering <em className="italic text-[#C084FC]">{activeSolution.shortName}.</em>
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              All 8 agents included in your workspace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            {assignedAgentObjects.map((agent, i) => (
              agent && (
                <Link
                  key={agent.slug}
                  to={`/agents/${agent.slug}`}
                  className="py-7 md:px-8 first:md:pl-0 last:md:pr-0 group flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg border border-white/15 bg-white/[0.04] flex items-center justify-center group-hover:border-[#C084FC]/50 transition-colors">
                        {renderAgentIcon(agent, "w-4 h-4")}
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-white group-hover:text-[#C084FC] transition-colors">
                          {agent.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">{agent.role}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-[#C084FC] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {agent.whatIsItFor.lead}
                  </p>
                </Link>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
           5. ROI METRICS & SIDE-BY-SIDE COMPARISON
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="mb-12">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
              NICHE ECONOMICS &amp; ROI
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
              The math for <em className="italic text-[#C084FC]">{activeSolution.shortName}.</em>
            </h2>
          </div>

          {/* 3 Visual Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10 mb-16">
            {activeSolution.roiMetrics.map((m, i) => (
              <div key={i} className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-4">
                <div>
                  <div className="text-4xl sm:text-6xl font-serif text-white mb-2 tracking-tight">
                    {m.metric}
                  </div>
                  <div className="text-base font-medium text-[#C084FC] mb-1.5">
                    {m.title}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="w-full h-1 bg-white/10 overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-emerald-400"
                    style={{ width: i === 0 ? '95%' : i === 1 ? '88%' : '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-Side Comparison */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-white/15 text-xs font-mono uppercase tracking-wider text-slate-400">
              <div className="md:col-span-3">Dimension</div>
              <div className="md:col-span-4 text-rose-400/90">× Legacy Bottleneck</div>
              <div className="md:col-span-5 text-emerald-400">✓ With BrandToPost</div>
            </div>

            <div className="divide-y divide-white/10 border-b border-white/10">
              {activeSolution.comparison.map((row, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5 items-center text-xs sm:text-sm">
                  <div className="md:col-span-3 font-medium text-white">
                    {row.dimension}
                  </div>
                  <div className="md:col-span-4 text-slate-400 line-through decoration-rose-500/50 font-light">
                    {row.oldWay}
                  </div>
                  <div className="md:col-span-5 text-slate-100 font-normal flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{row.withSolution}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
           6. LIVE NICHE OUTPUT SAMPLES
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                SAMPLE NICHE DELIVERABLES
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                Built for <em className="italic text-[#C084FC]">{activeSolution.shortName}.</em>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            {activeSolution.sampleOutputs.map((sample, idx) => (
              <div
                key={idx}
                className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <span className="text-xs font-mono text-slate-300">{sample.channel}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#7C3AED]/15 text-[#C084FC] border border-[#7C3AED]/30">
                      {sample.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-3">
                    {sample.title}
                  </h3>

                  <div className="border-l-2 border-[#C084FC] pl-4 py-1 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{sample.hook}"
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{sample.meta}</span>
                  <span className="text-emerald-400 font-medium">✓ Ready to Publish</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
           7. FINAL CALL TO ACTION
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/15 rounded-full blur-[180px] pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC]">
            <span>LAUNCH YOUR STACK</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight">
            Deploy for {activeSolution.shortName} in 60 seconds.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Drop your website link. Receive 30 native posts and visuals calibrated to your exact positioning and voice.
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
              <span>1-click auto-scheduling</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

