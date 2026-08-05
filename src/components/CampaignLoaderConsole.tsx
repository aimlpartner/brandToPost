import React, { useMemo, useState, useEffect } from "react";
import { ProductDNA } from "../types";
import { 
  Cpu, Sparkles, CheckCircle2, Activity, Terminal, 
  Layers, Bot, ChevronDown, ChevronUp, Search, 
  PenTool, Palette, Printer, MessageSquare, ShieldCheck, Zap
} from "lucide-react";

// -----------------------------------------------
// PROPS
// -----------------------------------------------
interface CampaignLoaderConsoleProps {
  activeProduct: ProductDNA | null;
  focus: string;
  subCategory: string;
  campaignTheme: string;
  selectedChannels: string[];
  generationStep: number;
  generationTotal: number;
  generationStatus: string;
  warmupStatus?: string;
}

interface AgentDef {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  badgeBg: string;
  deskLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  stepIndex: number;
  nudgeLines: string[];
  telemetryMetrics: { label: string; value: string }[];
}

export const CampaignLoaderConsole: React.FC<CampaignLoaderConsoleProps> = ({
  activeProduct,
  focus,
  subCategory,
  campaignTheme,
  selectedChannels,
  generationStep,
  generationTotal,
  generationStatus,
  warmupStatus,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [activeLogIndex, setActiveLogIndex] = useState<number>(0);

  const agents: AgentDef[] = useMemo(
    () => [
      {
        id: "sarah",
        name: "Sarah",
        role: "Market Researcher",
        avatar: "/agents_img/Gemini_Generated_Image_93efim93efim93ef.png",
        color: "#3B82F6",
        badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        deskLabel: "Research Lab",
        icon: Search,
        stepIndex: 1,
        nudgeLines: [
          "Crawling competitor copy & extracting friction points...",
          "Synthesizing target ICP objection matrix fields...",
          "Market gap identified: High demand for direct authentic proof."
        ],
        telemetryMetrics: [
          { label: "Sources Scraped", value: "24 Live Threads" },
          { label: "Objection Vectors", value: "8 Core Patterns" },
          { label: "Audience Sentiment", value: "94.8% Match" }
        ]
      },
      {
        id: "arthur",
        name: "Arthur",
        role: "Voice Doppelganger",
        avatar: "/agents_img/Gemini_Generated_Image_u72h5uu72h5uu72h.png",
        color: "#8B5CF6",
        badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        deskLabel: "DNA Vault",
        icon: Bot,
        stepIndex: 2,
        nudgeLines: [
          "Injecting founder vocabulary & speech rhythm parameters...",
          "Verifying zero corporate jargon ('delve', 'synergy' purged)...",
          "Brand DNA alignment locked at 99.4% precision."
        ],
        telemetryMetrics: [
          { label: "Tone Accuracy", value: "99.4% Calibrated" },
          { label: "Jargon Filter", value: "Strict Purge Active" },
          { label: "Founder Heuristics", value: "14 DNA Keys" }
        ]
      },
      {
        id: "alex",
        name: "Alex",
        role: "Platform Copywriter",
        avatar: "/agents_img/Gemini_Generated_Image_5ru7d25ru7d25ru7.png",
        color: "#EC4899",
        badgeBg: "bg-pink-500/10 text-pink-400 border-pink-500/30",
        deskLabel: "Writing Desk",
        icon: PenTool,
        stepIndex: 3,
        nudgeLines: [
          "Formatting platform-native breaks for LinkedIn & X...",
          "Stripping hashtags for Reddit compliance...",
          "Drafting 7-day high-converting post hooks..."
        ],
        telemetryMetrics: [
          { label: "Channels Scaled", value: selectedChannels.join(", ") || "Multi-Platform" },
          { label: "Hook Variation", value: "7 Unique Frameworks" },
          { label: "Formatting Engine", value: "Native Syntax" }
        ]
      },
      {
        id: "chloe",
        name: "Chloe",
        role: "Creative Director",
        avatar: "/agents_img/Gemini_Generated_Image_zbywuuzbywuuzbyw.png",
        color: "#F43F5E",
        badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        deskLabel: "Art Board",
        icon: Palette,
        stepIndex: 4,
        nudgeLines: [
          "Enforcing 24px negative space safety boundaries...",
          "Banning generic SaaS blue/purple gradient templates...",
          "Synthesizing editorial visual prompts & layout hierarchy..."
        ],
        telemetryMetrics: [
          { label: "Design System", value: "Minimalist Dark/Light" },
          { label: "Composition", value: "1:1 Editorial Ratio" },
          { label: "Asset Alignment", value: "Brand Palette Locked" }
        ]
      },
      {
        id: "julian",
        name: "Julian",
        role: "Visual Publisher",
        avatar: "/agents_img/Gemini_Generated_Image_d6k1gd6k1gd6k1gd.png",
        color: "#10B981",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        deskLabel: "Press Room",
        icon: Printer,
        stepIndex: 5,
        nudgeLines: [
          "Spinning Chromium headless render engine...",
          "Stamping vector brand logo & typography overlays...",
          "Exporting 300 DPI high-definition production assets..."
        ],
        telemetryMetrics: [
          { label: "Render Cluster", value: "Headless Chromium" },
          { label: "Logo Stamping", value: "Vector Pixel Perfect" },
          { label: "Final Status", value: "Ready for Queue" }
        ]
      },
    ],
    [selectedChannels]
  );

  const activeAgentId = useMemo(() => {
    const s = generationStatus.toLowerCase();
    if (s.includes("research") || s.includes("gathering market") || s.includes("market intelligence") || s.includes("crawl") || s.includes("scraping") || s.includes("extracting")) return "sarah";
    if (s.includes("brand dna") || s.includes("reviewing your brand") || s.includes("voice") || s.includes("doppelganger") || s.includes("calibrat") || s.includes("analyzing your feedback") || s.includes("mapping")) return "arthur";
    if (s.includes("drafting") || s.includes("copy") || s.includes("formatting") || s.includes("structuring") || s.includes("readability")) return "alex";
    if (s.includes("designer") || s.includes("creative") || s.includes("visual") || s.includes("canvas") || s.includes("layout")) return "chloe";
    if (s.includes("rendering") || s.includes("stamping") || s.includes("headless") || s.includes("overlay") || s.includes("sandbox") || s.includes("initializing")) return "julian";
    
    const pct = generationStep / Math.max(1, generationTotal);
    if (pct <= 0.2) return "sarah";
    if (pct <= 0.4) return "arthur";
    if (pct <= 0.6) return "alex";
    if (pct <= 0.8) return "chloe";
    return "julian";
  }, [generationStatus, generationStep, generationTotal]);

  // Selected agent or default to active
  const focusedAgent = agents.find(a => a.id === (selectedAgentId || activeAgentId)) || agents[0];
  const activeAgentObj = agents.find(a => a.id === activeAgentId) || agents[0];

  // Rotate simulated console line index
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const progressPct = Math.min(100, Math.round((generationStep / Math.max(1, generationTotal)) * 100));

  return (
    <div className="w-full flex flex-col bg-[#08080C] text-slate-100 rounded-xl sm:rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative font-sans">
      
      {/* 1. TOP TELEMETRY & PROGRESS HEADER */}
      <div className="p-4 sm:p-5 bg-[#0D0D12] border-b border-slate-800/80 flex flex-col gap-4">
        
        {/* Context Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="font-bold tracking-wider text-slate-200 uppercase text-[11px] font-display">
              Autonomous Boardroom Session Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {focus && (
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                Focus: <strong className="text-white">{focus}</strong>
              </span>
            )}
            {subCategory && (
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium">
                Niche: <strong className="text-white">{subCategory}</strong>
              </span>
            )}
            {campaignTheme && (
              <span className="px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-300 font-medium">
                Theme: <strong className="text-white">{campaignTheme}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Cpu className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Step {generationStep} of {generationTotal} — <strong className="text-white">{generationStatus}</strong></span>
            </div>
            <span className="font-mono font-bold text-purple-400 text-sm sm:text-base">
              {progressPct}%
            </span>
          </div>

          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(168,85,247,0.5)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. THE EXECUTIVE BOARDROOM ARENA */}
      <div 
        className="w-full relative p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-between gap-6 sm:gap-8 min-h-[480px] sm:min-h-[520px] overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 30%, rgba(124, 58, 237, 0.08) 0%, transparent 65%), radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 28px 28px"
        }}
      >
        
        {/* CENTER HUB: TROR AI CHIEF STRATEGIST */}
        <div className="relative flex flex-col items-center z-20 group cursor-pointer" onClick={() => setSelectedAgentId(null)}>
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 blur-md opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#0D0D12] border-2 border-purple-500/50 p-1 relative z-10 flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.4)]">
              <img
                src="/B2P AVATAR.png"
                alt="Tror AI Chief Strategist"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1.5 rounded-full border-2 border-[#08080C] shadow-sm">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-2 text-center">
            <h3 className="text-sm font-bold text-white font-display tracking-tight flex items-center gap-1.5 justify-center">
              <span>Tror</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">AI Chief</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Orchestrating Boardroom Execution</p>
          </div>

          {/* Live Tror Direction Speech Bubble */}
          <div className="mt-3 max-w-md bg-[#12121A]/95 border border-purple-500/30 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl text-center relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#12121A] border-t border-l border-purple-500/30 rotate-45" />
            <p className="text-xs text-purple-200 font-medium leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 inline-block mr-1.5" />
              "{activeAgentObj.name} is currently leading: <strong className="text-white">{activeAgentObj.nudgeLines[activeLogIndex]}</strong>"
            </p>
          </div>
        </div>

        {/* 5 SPECIALIST BOARDROOM DESKS GRID */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 z-20">
          {agents.map((agent) => {
            const isActive = activeAgentId === agent.id;
            const isSelected = (selectedAgentId || activeAgentId) === agent.id;
            const isCompleted = agent.stepIndex < activeAgentObj.stepIndex;
            const Icon = agent.icon;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`flex flex-col bg-[#0D0D14]/90 border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? "border-purple-500 shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-1 ring-purple-500/40 -translate-y-1 z-30"
                    : isActive
                    ? "border-purple-500/70 shadow-lg -translate-y-0.5"
                    : isCompleted
                    ? "border-emerald-500/30 bg-[#0B1015]/80 opacity-90"
                    : "border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700"
                }`}
              >
                {/* Active / Status Indicator Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${agent.badgeBg}`}>
                    STEP 0{agent.stepIndex}
                  </span>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      ACTIVE
                    </span>
                  ) : isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      DONE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">READY</span>
                  )}
                </div>

                {/* Avatar & Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className={`w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md ${
                        isActive ? "ring-2 ring-purple-400 scale-105" : ""
                      }`}
                    />
                    <span 
                      className="absolute -bottom-1 -right-1 p-1 rounded-md text-white text-[10px] shadow-sm"
                      style={{ backgroundColor: agent.color }}
                    >
                      <Icon className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white tracking-tight font-display flex items-center gap-1">
                      <span>{agent.name}</span>
                    </h4>
                    <p className="text-[9.5px] text-slate-400 truncate uppercase font-mono font-semibold tracking-wider">
                      {agent.role}
                    </p>
                  </div>
                </div>

                {/* Live Nudge Line */}
                <div className={`text-[11px] leading-relaxed p-2.5 rounded-lg mb-2 font-sans flex-1 transition-colors ${
                  isActive 
                    ? "bg-purple-950/40 text-purple-200 border border-purple-500/20 font-medium" 
                    : isCompleted
                    ? "bg-emerald-950/20 text-emerald-300/90 border border-emerald-500/20"
                    : "bg-slate-900/60 text-slate-400 italic border border-slate-800/50"
                }`}>
                  {isActive 
                    ? agent.nudgeLines[activeLogIndex] 
                    : isCompleted 
                    ? "Phase deliverables compiled & handed off." 
                    : agent.nudgeLines[0]}
                </div>

                {/* Module Desk Label */}
                <div className="mt-auto pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                  <span>MODULE:</span>
                  <span className="font-bold text-slate-200">{agent.deskLabel.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. INSPECTION TELEMETRY PANEL FOR FOCUSED AGENT */}
      <div className="bg-[#0B0B10] border-t border-slate-800/80 p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <img
            src={focusedAgent.avatar}
            alt={focusedAgent.name}
            className="w-11 h-11 rounded-xl object-cover border border-purple-500/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white font-display">{focusedAgent.name} Telemetry</h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${focusedAgent.badgeBg}`}>
                {focusedAgent.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Module: <strong className="text-slate-200">{focusedAgent.deskLabel}</strong>
            </p>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {focusedAgent.telemetryMetrics.map((metric, i) => (
            <div key={i} className="bg-[#12121C] border border-slate-800 px-3.5 py-2 rounded-lg flex flex-col justify-center">
              <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">{metric.label}</span>
              <span className="text-xs font-bold text-purple-300 font-display mt-0.5">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. LIVE DIAGNOSTIC TERMINAL LOGS CONSOLE */}
      <div className="bg-[#050508] border-t border-slate-800/80">
        <div 
          onClick={() => setShowTerminal(!showTerminal)}
          className="px-4 py-2.5 bg-[#09090E] flex items-center justify-between cursor-pointer hover:bg-[#0D0D14] transition-colors border-b border-slate-800/50 select-none"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white">Live Boardroom Output Console</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              STREAMING
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>{showTerminal ? "Hide Logs" : "Show Logs"}</span>
            {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showTerminal && (
          <div className="p-4 font-mono text-xs text-slate-300 space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 text-[11px] shrink-0">[12:48:01]</span>
              <span className="text-purple-400 font-bold shrink-0">[TROR]</span>
              <span>Initiating autonomous campaign boardroom sequence for target focus "{focus || 'Fitness'}".</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 text-[11px] shrink-0">[12:48:02]</span>
              <span className="text-blue-400 font-bold shrink-0">[SARAH]</span>
              <span>Scanning market objection vectors & customer sentiment for niche "{subCategory || 'General'}".</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 text-[11px] shrink-0">[12:48:04]</span>
              <span className="text-purple-300 font-bold shrink-0">[ARTHUR]</span>
              <span>Loaded active Product DNA parameters. Enforcing founder voice authenticity controls.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 text-[11px] shrink-0">[12:48:07]</span>
              <span className="text-pink-400 font-bold shrink-0">[ALEX]</span>
              <span>Drafting multi-channel copy across [{selectedChannels.join(", ") || 'LinkedIn, X, Instagram'}].</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 text-[11px] shrink-0">[12:48:10]</span>
              <span className="text-rose-400 font-bold shrink-0">[CHLOE]</span>
              <span>Configuring layout composition rules & 1:1 editorial visual templates.</span>
            </div>
            <div className="flex items-start gap-2 animate-pulse">
              <span className="text-slate-500 text-[11px] shrink-0">[LIVE]</span>
              <span className="text-emerald-400 font-bold shrink-0">[{activeAgentObj.name.toUpperCase()}]</span>
              <span className="text-emerald-300 font-semibold">{generationStatus}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
