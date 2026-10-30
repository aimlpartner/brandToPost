import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, X, ArrowRight, CheckCircle2, Globe, 
  Layers, Cpu, ArrowUpRight, Check, Fingerprint, Palette,
  PenTool, Video, FileText, Bookmark, Repeat2, Heart, MessageCircle, Play
} from 'lucide-react';
import { AGENTS_LIST, getAgentBySlug, renderAgentIcon, AgentData } from '../data/agentsData';
import { SOLUTIONS_LIST, renderSolutionIcon } from '../data/solutionsData';
import { CloudShader } from '../components/ui/cloud-shader';

function renderAgentVisualShowcase(agent: AgentData) {
  switch (agent.slug) {
    case 'linkedin':
      return (
        <div className="space-y-5">
          {/* Post Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0A66C2]/20 border border-[#0A66C2]/40 flex items-center justify-center text-white font-serif text-sm">
                F
              </div>
              <div>
                <div className="text-xs font-medium text-white">Founder &amp; CEO · 1st</div>
                <div className="text-[10px] font-mono text-slate-400">Personal + Company Stream · 2h</div>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded border border-[#0A66C2]/40 bg-[#0A66C2]/15 text-[#60A5FA]">
              PDF Carousel
            </span>
          </div>

          {/* Hook Line */}
          <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
            "We replaced a $6,000/mo retainer with an autonomous 7-slide system. Here is the exact architecture:"
          </p>

          {/* Visual 4:5 Carousel Slide Preview */}
          <div className="border border-white/15 bg-gradient-to-br from-white/[0.04] to-transparent p-5 sm:p-6 relative">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-4">
              <span className="text-[#C084FC]">SLIDE 01 / 10</span>
              <span>1080 × 1350 PDF</span>
            </div>
            <div className="text-lg sm:text-2xl font-serif text-white leading-snug mb-5">
              The Autonomous B2B Distribution Playbook
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded-full bg-[#C084FC]"></span>
                <span className="w-1.5 h-1 rounded-full bg-white/20"></span>
                <span className="w-1.5 h-1 rounded-full bg-white/20"></span>
                <span className="w-1.5 h-1 rounded-full bg-white/20"></span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Swipe Velocity: 3.4x →</span>
            </div>
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300"><Heart className="w-3.5 h-3.5 text-[#C084FC]" /> 184</span>
              <span className="flex items-center gap-1.5 text-slate-300"><MessageCircle className="w-3.5 h-3.5 text-slate-400" /> 42</span>
            </div>
            <span className="text-emerald-400">✓ Zero-Click Formatted</span>
          </div>
        </div>
      );

    case 'x':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
              CONNECTED THREAD ARCHITECTURE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Hook Score: 96/100</span>
          </div>

          {/* Tweet 1 */}
          <div className="relative pl-6 border-l border-white/20 space-y-2 pb-3">
            <span className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-[#08080C] border border-[#C084FC] flex items-center justify-center text-[10px] font-mono text-[#C084FC]">
              1
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white">@founder · Opening Hook</span>
              <span className="text-[10px] font-mono text-slate-500">Tweet 1/8</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
              Most teams spend 80% of their time formatting content and 20% on strategy. Here is how we flipped that ratio in 60 seconds: 🧵👇
            </p>
          </div>

          {/* Tweet 2 */}
          <div className="relative pl-6 border-l border-white/20 space-y-2 pb-3">
            <span className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-[#08080C] border border-white/30 flex items-center justify-center text-[10px] font-mono text-slate-300">
              2
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white">Framework Breakdown</span>
              <span className="text-[10px] font-mono text-slate-500">Tweet 2/8</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
              <span className="border border-white/10 px-2.5 py-1.5 text-slate-300">01. Crawl URL</span>
              <span className="border border-[#C084FC]/30 px-2.5 py-1.5 text-[#C084FC]">02. Clone Voice</span>
              <span className="border border-emerald-500/30 px-2.5 py-1.5 text-emerald-400">03. Auto-Post</span>
            </div>
          </div>

          {/* Metrics Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 text-slate-300"><Repeat2 className="w-3.5 h-3.5 text-emerald-400" /> 94</span>
              <span className="flex items-center gap-1.5 text-slate-300"><Bookmark className="w-3.5 h-3.5 text-[#C084FC]" /> 420 Saves</span>
            </div>
            <span className="text-emerald-400">4.2x Bookmark Rate</span>
          </div>
        </div>
      );

    case 'instagram':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400">
              4:5 PORTRAIT EDITORIAL SUITE
            </span>
            <span className="text-[10px] font-mono text-slate-400">1080 × 1350 Native</span>
          </div>

          {/* 2 Visual 4:5 Artboards Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Artboard 1: Cover Slide */}
            <div className="aspect-[4/5] border border-white/15 bg-gradient-to-b from-[#7C3AED]/15 via-transparent to-transparent p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>01 / 07</span>
                <span className="text-pink-400">CAROUSEL</span>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC] mb-1">Architecture</div>
                <div className="text-sm sm:text-base font-serif text-white leading-snug">
                  5 Shifts Replacing Retainer Agencies
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-slate-400">
                <span>Swipe</span>
                <span>→</span>
              </div>
            </div>

            {/* Artboard 2: Quote Card */}
            <div className="aspect-[4/5] border border-white/15 bg-white/[0.02] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>QUOTE CARD</span>
                <Bookmark className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <div className="text-xs sm:text-sm font-serif italic text-slate-200 leading-relaxed">
                "The best marketing looks like high-velocity conviction shared in public."
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                <span className="text-[10px] font-mono text-slate-400">Brand DNA Locked</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'writing':
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
              ARTHUR VOICE CLONE ENGINE
            </span>
            <span className="text-[10px] font-mono text-emerald-400">99.4% Voice Accuracy</span>
          </div>

          {/* Step 1: Voice Fingerprint */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-[#C084FC] shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">Linguistic Cadence Mapped</div>
                <div className="text-[11px] font-mono text-slate-400">Direct · First-Person · High Conviction</div>
              </div>
            </div>
            <div className="flex items-center gap-1 h-6">
              {[45, 80, 60, 100, 70, 90, 55, 85].map((h, i) => (
                <span key={i} className="w-1 rounded-full bg-[#C084FC]" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Step 2: Banned Slop vs Approved Voice */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-rose-400 block mb-1.5">× Blocked AI Clichés</span>
              <div className="space-y-1 font-mono text-[11px] text-slate-500 line-through decoration-rose-500/60">
                <div>"In today's fast-paced..."</div>
                <div>"Unleash synergy..."</div>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1.5">✓ Your Cloned Heuristics</span>
              <div className="space-y-1 font-mono text-[11px] text-slate-200">
                <div>Short, punchy hooks</div>
                <div>Real unit-economics proof</div>
              </div>
            </div>
          </div>

          {/* Output Sample Line */}
          <div className="border-l-2 border-[#C084FC] pl-3.5 py-0.5">
            <div className="text-[10px] font-mono text-slate-400 mb-1">DRAFTED IN YOUR VOICE:</div>
            <p className="text-xs sm:text-sm text-white font-light italic">
              "We cut our customer acquisition cost by 62% the week we stopped writing generic corporate posts."
            </p>
          </div>
        </div>
      );

    case 'designer':
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
              AUTOMATED BRAND DESIGN SYSTEM
            </span>
            <span className="text-[10px] font-mono text-emerald-400">0 Hrs in Figma</span>
          </div>

          {/* Extracted Tokens Bar */}
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">Extracted Palette</span>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#08080C] border border-white/40" />
                <span className="w-5 h-5 rounded-full bg-[#7C3AED]" />
                <span className="w-5 h-5 rounded-full bg-[#38BDF8]" />
                <span className="w-5 h-5 rounded-full bg-[#10B981]" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Typography Lock</span>
              <div className="text-xs font-serif text-white">EB Garamond + Inter Tight</div>
              <div className="text-[10px] font-mono text-sky-400">Auto-paired from URL</div>
            </div>
          </div>

          {/* 3 Multi-Ratio Artboards */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2.5">Simultaneous Multi-Ratio Output</span>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="aspect-[4/5] border border-sky-400/40 bg-sky-500/10 p-2.5 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-sky-300">4:5 DECK</span>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/40 rounded-full" />
                  <div className="w-2/3 h-1.5 bg-white/20 rounded-full" />
                </div>
              </div>
              <div className="aspect-square border border-white/15 bg-white/[0.03] p-2.5 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-300">1:1 CARD</span>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-[#C084FC]/50 rounded-full" />
                  <div className="w-3/4 h-1.5 bg-white/20 rounded-full" />
                </div>
              </div>
              <div className="aspect-[9/12] border border-white/15 bg-white/[0.03] p-2.5 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-emerald-400">9:16 STORY</span>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-emerald-400/50 rounded-full" />
                  <div className="w-1/2 h-1.5 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'blog':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              SEO + AI SEARCH CITATION ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">2,140 Words · Auto-CMS</span>
          </div>

          {/* Search Intent Header */}
          <div className="flex items-center justify-between gap-2 text-xs border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-slate-200">/blog/autonomous-b2b-growth-2026</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Rank Ready
            </span>
          </div>

          {/* Structured Article Outline Preview */}
          <div className="space-y-3 py-1">
            <div>
              <span className="text-[10px] font-mono text-[#C084FC] block">H1 · PILLAR GUIDE</span>
              <div className="text-sm sm:text-base font-serif text-white">
                Autonomous Marketing Systems vs. Retainer Agencies: 2026 Benchmark
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="border-l-2 border-emerald-400/60 pl-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">H2 · DATA TABLE</span>
                <span className="text-xs text-slate-200">Cost-Per-Asset Breakdown</span>
              </div>
              <div className="border-l-2 border-[#C084FC]/60 pl-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">FAQ SCHEMA</span>
                <span className="text-xs text-slate-200">Cited by Perplexity &amp; Search</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
            <span>WordPress · Webflow · Ghost</span>
            <span className="text-emerald-400">✓ Webhook Synced</span>
          </div>
        </div>
      );

    case 'research':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              LIVE MARKET &amp; ICP INTELLIGENCE
            </span>
            <span className="text-[10px] font-mono text-slate-400">60s Deep Crawl</span>
          </div>

          {/* Domain Crawl Row */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
            <span className="font-mono text-white">https://yourcompany.com</span>
            <span className="text-[10px] font-mono text-emerald-400">● 14 Pages Indexed</span>
          </div>

          {/* Extracted Intelligence Matrix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-l-2 border-[#C084FC] pl-3 py-0.5">
              <span className="text-[10px] font-mono uppercase text-[#C084FC] block">Buyer Pain Points</span>
              <span className="text-xs text-white">High agency retainers &amp; slow 4-week turnarounds</span>
            </div>
            <div className="border-l-2 border-emerald-400 pl-3 py-0.5">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Competitor Gap</span>
              <span className="text-xs text-white">84% post generic tips—win with real ROI teardowns</span>
            </div>
          </div>

          {/* Output Topic Matrix Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">Output: 30 Buyer-Aligned Topic Angles</span>
            <span className="text-emerald-400">100% ICP Grounded</span>
          </div>
        </div>
      );

    default:
      // Video / TikTok / Reels Agent
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
              9:16 RETENTION STORYBOARD
            </span>
            <span className="text-[10px] font-mono text-emerald-400">68% Avg Watch-Through</span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            {/* 9:16 Frame */}
            <div className="col-span-5 aspect-[9/13] border border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-transparent p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[9px] font-mono text-amber-300">
                <span>9:16 REEL</span>
                <span>0:45s</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-white/30 bg-white/10 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="text-[10px] font-mono text-white leading-tight border-t border-white/10 pt-2">
                "Look at this exact number..."
              </div>
            </div>

            {/* 3-Step Pacing Timeline */}
            <div className="col-span-7 space-y-3">
              <div className="border-l-2 border-amber-400 pl-3">
                <div className="text-[10px] font-mono text-amber-400">00:00 – 00:03 · VISUAL HOOK</div>
                <div className="text-xs text-white">Point at chaotic agency spreadsheet</div>
              </div>
              <div className="border-l-2 border-[#C084FC] pl-3">
                <div className="text-[10px] font-mono text-[#C084FC]">00:03 – 00:35 · CORE VALUE</div>
                <div className="text-xs text-white">Teleprompter script + 3 B-roll cuts</div>
              </div>
              <div className="border-l-2 border-emerald-400 pl-3">
                <div className="text-[10px] font-mono text-emerald-400">00:35 – 00:45 · PAYOFF CTA</div>
                <div className="text-xs text-white">Direct profile conversion trigger</div>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

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

  const handleSolutionsMouseEnter = () => {
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    setAgentsOpen(false);
    setIntegrationsOpen(false);
    setSolutionsOpen(true);
  };

  const handleSolutionsMouseLeave = () => {
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    solutionsTimerRef.current = setTimeout(() => {
      setSolutionsOpen(false);
    }, 200);
  };

  const handleAgentsMouseEnter = () => {
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    setSolutionsOpen(false);
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
    if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    setSolutionsOpen(false);
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
        solutionsDropdownRef.current &&
        !solutionsDropdownRef.current.contains(event.target as Node) &&
        solutionsBtnRef.current &&
        !solutionsBtnRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
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
      if (solutionsTimerRef.current) clearTimeout(solutionsTimerRef.current);
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
           NAVIGATION BAR (With Solutions, Agents & Integrations Dropdowns)
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
                aria-expanded={solutionsOpen}
                aria-label="Toggle solutions dropdown"
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
                  setSolutionsOpen(false);
                  setAgentsOpen(false);
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
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
                      sol.isFlagship
                        ? 'bg-[#7C3AED]/10 border-[#C084FC]/40 hover:bg-[#7C3AED]/15 hover:border-[#C084FC]'
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
           1. HERO SECTION (With Cloud Shader & Command Bar)
           ========================================== */}
      <section data-nav-theme="dark" className="relative w-full min-h-[92vh] bg-[#08080C] text-white pt-36 pb-20 px-6 sm:px-10 lg:px-16 flex flex-col justify-between border-b border-white/10 overflow-hidden">
        {/* Aceternity UI Cloud Shader Procedural Background */}
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
            <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
              <span className="flex items-center gap-2">
                <span className="text-white font-semibold">{activeAgent.name.toUpperCase()}</span>
                <span>·</span>
                <span>{activeAgent.role.toUpperCase()}</span>
              </span>
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
            </div>

            {/* Headline with Rotating Words */}
            <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-serif font-normal tracking-tight text-white leading-[1.04] drop-shadow-[0_4px_28px_rgba(0,0,0,0.7)]">
              {activeAgent.heroHeadline} <br className="hidden sm:block" />
              <span className={`word-rotate text-[#C084FC] italic font-normal ${isWordIn ? 'in' : 'out'}`}>
                {words[wordIdx]}
              </span>
            </h1>

            {/* Concise 1-Line Subtitle */}
            <p className="text-base sm:text-xl text-white/90 font-light max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Drop your URL. Get 30 native {activeAgent.platform} assets in your exact voice, scheduled automatically.
            </p>

            {/* Centered Command URL Input Bar */}
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

              {/* Trust Badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-300">
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mr-2">FLEET:</span>
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
           2. BALANCED VISUAL CAPABILITIES (Left: Concise Capabilities · Right: Simple Visual Preview)
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                WHAT IT DOES FOR YOU
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                Inside the <em className="italic text-[#C084FC]">{activeAgent.name}.</em>
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activeAgent.tagline}
            </span>
          </div>

          {/* Balanced 2-Column Split: 4 Concise Capabilities on Left + Simple Visual Showcase on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center border-t border-white/10 pt-10">
            
            {/* Left Column (6 cols): 2x2 Minimal Capabilities Grid */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {activeAgent.whatIsItFor.capabilities.map((cap, i) => (
                <div key={i} className="border-l border-white/15 pl-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC]">
                        {cap.tag}
                      </span>
                      <span className="text-[11px] font-mono text-white/30">0{i + 1}</span>
                    </div>
                    <h3 className="text-base font-medium text-white mb-1.5">
                      {cap.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column (6 cols): Agent-Specific Simple Visual Showcase */}
            <div className="lg:col-span-6 lg:pl-10 lg:border-l lg:border-white/10">
              {renderAgentVisualShowcase(activeAgent)}
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           3. HOW IT WORKS: BALANCED 3-STEP VISUAL FLOW
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                3-STEP AUTONOMOUS FLOW
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                From your URL to live <em className="italic text-[#C084FC]">{activeAgent.platform}</em> reach.
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>~60s Setup · Zero Manual Effort</span>
            </span>
          </div>

          {/* 3 Balanced Steps: Visual Help on Top + 1-Line Copy Below */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            
            {/* Step 01 */}
            <div className="py-8 md:pr-8 lg:pr-10 flex flex-col justify-between gap-7">
              <div className="h-32 flex flex-col justify-center gap-3 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C084FC]" />
                    <span className="text-xs font-mono text-white">yourcompany.com</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">3.2s Crawl</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-slate-300">Voice &amp; Brand DNA</span>
                  <div className="flex items-center gap-1 h-5">
                    {[40, 80, 55, 95, 70, 100, 65, 85].map((h, i) => (
                      <span key={i} className="w-1 rounded-full bg-[#C084FC]" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl font-serif text-[#C084FC] font-light">01</span>
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    Sync your Brand &amp; Voice DNA
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  Paste your link—we extract your positioning, palette, and exact founder tone.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="py-8 md:px-8 lg:px-10 flex flex-col justify-between gap-7">
              <div className="h-32 flex flex-col justify-center gap-3 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg border border-white/15 bg-white/[0.04] flex items-center justify-center">
                      {renderAgentIcon(activeAgent, "w-4 h-4")}
                    </span>
                    <span className="text-xs font-medium text-white">{activeAgent.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C084FC]">30 Assets Built</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="w-11/12 h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C084FC]" />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>✓ {activeAgent.whatIsItFor.capabilities[0]?.tag}</span>
                  <span>·</span>
                  <span>✓ {activeAgent.whatIsItFor.capabilities[1]?.tag}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl font-serif text-[#C084FC] font-light">02</span>
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    30 native assets generated
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  Builds a full month of ready-to-publish {activeAgent.platform} copy and visuals.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="py-8 md:pl-8 lg:pl-10 flex flex-col justify-between gap-7">
              <div className="h-32 flex flex-col justify-center gap-2.5 border-b border-white/10 pb-5">
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                  <div className="border border-white/15 py-2 text-slate-300">
                    <div className="text-white font-semibold">MON</div>
                    <div className="text-emerald-400 mt-0.5">● 09:00</div>
                  </div>
                  <div className="border border-[#C084FC]/40 bg-[#7C3AED]/10 py-2 text-white">
                    <div className="font-semibold">WED</div>
                    <div className="text-[#C084FC] mt-0.5">● 09:00</div>
                  </div>
                  <div className="border border-white/15 py-2 text-slate-300">
                    <div className="text-white font-semibold">FRI</div>
                    <div className="text-emerald-400 mt-0.5">● 09:00</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 pt-0.5">
                  <span>1-Click Queue Approval</span>
                  <span>Auto-Published ✓</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl font-serif text-emerald-400 font-light">03</span>
                  <h3 className="text-base sm:text-lg font-medium text-white">
                    Review, tweak &amp; auto-schedule
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  Approve your 30-day calendar in one click and let it publish on autopilot.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           4. WHY USE IT: VISUAL METRICS & SIDE-BY-SIDE COMPARISON
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                MEASURABLE ROI
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                Why teams deploy the <em className="italic text-[#C084FC]">{activeAgent.name}.</em>
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activeAgent.whyShouldYouUseIt.lead}
            </span>
          </div>

          {/* 3 Visual Metric Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10 mb-16">
            {activeAgent.whyShouldYouUseIt.benefits.map((b, i) => (
              <div 
                key={i} 
                className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="text-4xl sm:text-6xl font-serif text-white mb-2 tracking-tight">
                    {b.metric}
                  </div>
                  <div className="text-base font-medium text-[#C084FC] mb-1.5">
                    {b.title}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                    {b.desc}
                  </p>
                </div>
                <div className="w-full h-1 bg-white/10 overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-emerald-400"
                    style={{ width: i === 0 ? '94%' : i === 1 ? '88%' : '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Clean Visual Comparison: Manual Way vs. Autonomous Agent */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-white/15 text-xs font-mono uppercase tracking-wider text-slate-400">
              <div className="md:col-span-3">Workflow Dimension</div>
              <div className="md:col-span-4 text-rose-400/90">× Old Manual Way</div>
              <div className="md:col-span-5 text-emerald-400">✓ With {activeAgent.name}</div>
            </div>

            <div className="divide-y divide-white/10 border-b border-white/10">
              {activeAgent.whyShouldYouUseIt.comparison.map((comp, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5 items-center text-xs sm:text-sm">
                  <div className="md:col-span-3 font-medium text-white">
                    {comp.feature}
                  </div>
                  <div className="md:col-span-4 text-slate-400 line-through decoration-rose-500/50 font-light">
                    {comp.manual}
                  </div>
                  <div className="md:col-span-5 text-slate-100 font-normal flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{comp.withAgent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
           5. LIVE SAMPLE OUTPUT SHOWCASE
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                LIVE SAMPLE OUTPUTS
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
                What the <em className="italic text-[#C084FC]">{activeAgent.name}</em> drafts.
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Calibrated for {activeAgent.platform}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 border-t border-b border-white/10">
            {activeAgent.sampleOutputs.map((sample, idx) => (
              <div 
                key={idx}
                className="py-8 md:px-8 first:md:pl-0 last:md:pr-0 flex flex-col justify-between gap-6"
              >
                <div>
                  {/* Visual Platform Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-white/[0.06] border border-white/10 flex items-center justify-center">
                        {renderAgentIcon(activeAgent, "w-3.5 h-3.5")}
                      </span>
                      <span className="text-xs font-mono text-slate-300">{sample.type}</span>
                    </div>
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
                  <span>{sample.previewMeta}</span>
                  <span className="text-emerald-400 font-medium">✓ Ready to Publish</span>
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
              <span>1-click auto-scheduling</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
