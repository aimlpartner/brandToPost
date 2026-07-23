import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ProductDNA } from "../types";

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
  deskLabel: string;
  nudgeLines: string[];
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
  const agents: AgentDef[] = useMemo(
    () => [
      {
        id: "sarah",
        name: "Sarah",
        role: "Researcher",
        avatar: "/agents_img/Gemini_Generated_Image_93efim93efim93ef.png",
        color: "#2583EB",
        deskLabel: "Research Lab",
        nudgeLines: [
          "Radar sweeping Objections matrix... scanning complete.",
          "Crawling competitor copy. It's extremely weak. Easy positioning gap here.",
          "Standby, parsing raw psychological data fields.",
        ],
      },
      {
        id: "arthur",
        name: "Arthur",
        role: "Doppelganger",
        avatar: "/agents_img/Gemini_Generated_Image_u72h5uu72h5uu72h.png",
        color: "#7C3AED",
        deskLabel: "DNA Vault",
        nudgeLines: [
          "Tone check: set to maximum authenticity. No generic AI templates allowed here.",
          "I am checking that we don't use forbidden words like 'delve' or 'synergy'. Never!",
          "Founder speech rhythms aligned at 99.2%. Sounds exactly like a real founder.",
        ],
      },
      {
        id: "alex",
        name: "Alex",
        role: "Platform Copywriter",
        avatar: "/agents_img/Gemini_Generated_Image_5ru7d25ru7d25ru7.png",
        color: "#EC4899",
        deskLabel: "Writing Desk",
        nudgeLines: [
          "Why do LinkedIn humans like so much whitespace? I am formatting spacing now.",
          "Reddit humans get angry when they see hashtags. I stripped them all to keep the peace.",
          "Keeping X copy under 280 characters so attention-deficit humans read it.",
        ],
      },
      {
        id: "chloe",
        name: "Chloe",
        role: "Creative Director",
        avatar: "/agents_img/Gemini_Generated_Image_zbywuuzbywuuzbyw.png",
        color: "#E1306C",
        deskLabel: "Art Board",
        nudgeLines: [
          "Spacing locked at 24px margins. Human faces on images are safe from overlap.",
          "Setting brand colors. Layout balance is looking wobbly but cute!",
          "No blue-to-purple SaaS gradients. Pitch black and off-white only.",
        ],
      },
      {
        id: "julian",
        name: "Julian",
        role: "Visual Publisher",
        avatar: "/agents_img/Gemini_Generated_Image_d6k1gd6k1gd6k1gd.png",
        color: "#10B981",
        deskLabel: "Press Room",
        nudgeLines: [
          "Chromium cluster is humming. Running headless stamp engine.",
          "Vector logo stamped. Visual templates compiled and finalized.",
          "Anti-alias shaders applied. Every graphic is clean and print-ready.",
        ],
      },
    ],
    []
  );

  const brandName = activeProduct?.name || "the brand";
  const enemy = activeProduct?.enemy || "manual inefficiency";
  const hellState = activeProduct?.hellState || "wasted hours";
  const heavenState = activeProduct?.heavenState || "streamlined growth";
  const uniqueMechanism = activeProduct?.uniqueMechanism || "AI specialist agents";
  const objections = activeProduct?.objections || "setup complexity";
  const tone = activeProduct?.tone || "professional";
  const colors = activeProduct?.visualData?.colors?.join(", ") || "#7C3AED, #FAF9F6";
  const fonts = activeProduct?.visualData?.fonts
    ? `${activeProduct.visualData.fonts.primary} / ${activeProduct.visualData.fonts.secondary}`
    : "Inter / Outfit";
  const visualStyle = activeProduct?.visualStyle || "modern clean aesthetic";
  const website = activeProduct?.website || "your site";

  const [meetingLog, setMeetingLog] = useState<{ agent: string; text: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const dialogueIndexRef = useRef(0);
  const lastPhaseRef = useRef<string | null>(null);

  const activeAgentId = useMemo(() => {
    const s = generationStatus.toLowerCase();
    if (s.includes("research") || s.includes("gathering market") || s.includes("market intelligence") || s.includes("crawl") || s.includes("scraping") || s.includes("extracting")) return "sarah";
    if (s.includes("brand dna") || s.includes("reviewing your brand") || s.includes("voice") || s.includes("doppelganger") || s.includes("calibrat") || s.includes("analyzing your feedback") || s.includes("mapping")) return "arthur";
    if (s.includes("drafting") || s.includes("copy") || s.includes("formatting") || s.includes("structuring") || s.includes("readability")) return "alex";
    if (s.includes("designer") || s.includes("creative") || s.includes("visual") || s.includes("canvas") || s.includes("layout")) return "chloe";
    if (s.includes("rendering") || s.includes("stamping") || s.includes("headless") || s.includes("overlay") || s.includes("sandbox") || s.includes("initializing")) return "julian";
    
    const pct = generationStep / generationTotal;
    if (pct <= 0.25) return "sarah";
    if (pct <= 0.5) return "arthur";
    if (pct <= 0.75) return "alex";
    if (pct <= 0.9) return "chloe";
    return "julian";
  }, [generationStatus, generationStep, generationTotal]);

  const dialogueScript = useMemo(() => [
    { agentId: "sarah", phase: "sarah", text: `Radar active on "${focus || "target niche"}". Wait, do humans actually purchase to satisfy feelings? Intriguing.` },
    { agentId: "sarah", phase: "sarah", text: `I crawled competitor headers and they look like robotic templates! Let's build a gap around: "${hellState}".` },
    { agentId: "sarah", phase: "sarah", text: `Objections mapped: "${objections}". Sending parameters down to Arthur's calibration deck.` },
    { agentId: "arthur", phase: "arthur", text: `Calibrating voice clone for ${brandName}. Let's tune tone rules: "${tone}".` },
    { agentId: "arthur", phase: "arthur", text: `We are targeting the status quo: "${enemy}". Alex, focus copy on our mechanism: "${uniqueMechanism}".` },
    { agentId: "alex", phase: "arthur", text: `Yes, Arthur. Spacing out text. I promise not to write 'delve' or 'synergize' like a robot!` },
    { agentId: "alex", phase: "alex", text: `Drafting weekly posts for channels: ${selectedChannels.join(", ")}. Highlighting the shift into: "${heavenState}".` },
    { agentId: "alex", phase: "alex", text: `LinkedIn copy done. Generous line spacing included. Ready for Chloe's visual check.` },
    { agentId: "chloe", phase: "alex", text: `Creative rules loaded. Using brand colors: [${colors}] and fonts: ${fonts}.` },
    { agentId: "chloe", phase: "chloe", text: `Style is locked to: "${visualStyle}". Setting bounding margins. Julian, trigger press rollers.` },
    { agentId: "julian", phase: "julian", text: `Headless press room active. Stamping brand logo for ${website} at safe borders.` },
    { agentId: "julian", phase: "julian", text: `Visual card template finalized. Anti-alias shaders applied. Dispatching card on conveyor!` },
  ], [focus, hellState, objections, brandName, tone, enemy, uniqueMechanism, selectedChannels, heavenState, colors, fonts, visualStyle, website]);

  const pushLog = useCallback((agentId: string, text: string) => {
    const agentObj = agents.find(a => a.id === agentId);
    setMeetingLog(prev => [...prev, { agent: agentObj?.name || agentId, text }]);
  }, [agents]);

  useEffect(() => {
    const currentPhase = activeAgentId;
    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      dialogueIndexRef.current = 0;
    }

    const phaseMessages = dialogueScript.filter(m => m.phase === currentPhase);
    const idx = dialogueIndexRef.current;

    if (idx < phaseMessages.length) {
      const msg = phaseMessages[idx];
      const timer = setTimeout(() => {
        pushLog(msg.agentId, msg.text);
        dialogueIndexRef.current = idx + 1;
      }, idx === 0 ? 1000 : 4500);

      return () => clearTimeout(timer);
    }
  }, [activeAgentId, dialogueScript, pushLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [meetingLog]);

  return (
    <div className="flex flex-col bg-[#FAF9F6] text-[#08080C] rounded-xl border border-slate-900/10 overflow-hidden relative shadow-sm">
      {/* Progress status banner */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#FAF9F6] border-b border-slate-900/10">
        <div className="flex items-center space-x-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse border border-black/5" />
          <span className="text-[12px] font-bold text-slate-800 tracking-wide font-display">
            Step {generationStep} of {generationTotal} — {generationStatus}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500">
          {Math.round((generationStep / generationTotal) * 100)}%
        </span>
      </div>
      <div className="h-1 w-full bg-slate-200/50">
        <div
          className="h-full bg-slate-900 transition-all duration-700 ease-out"
          style={{ width: `${(generationStep / generationTotal) * 100}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px] border-t border-slate-900/10">
        {/* Left Arena: HTML/CSS Schematic Dashboard with Blueprint Theme */}
        <div 
          className="flex-1 relative bg-[#FAF9F6] p-6 flex flex-col items-center justify-center min-h-[500px] overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(15, 23, 42, 0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/90 backdrop-blur text-xs font-mono px-3 py-1.5 rounded border border-slate-200 text-slate-600 shadow-sm font-bold">
              Autopilot Core Node
            </span>
          </div>

          {/* Connected Agent Flow Diagram */}
          <div className="w-full max-w-4xl flex flex-col items-center gap-10 z-10 relative px-4">
            
            {/* The Synthesis Center Hub */}
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white border border-slate-900/10 flex items-center justify-center shadow-md relative z-20">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-500/10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 animate-ping absolute opacity-30" />
                  <span className="text-[10px] font-bold text-indigo-600 tracking-wider font-mono">B2P CORE</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-900/10 relative z-10" />
            </div>

            {/* 5 Specialist Nodes Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
              {agents.map((agent) => {
                const active = activeAgentId === agent.id;
                const nudgeLine = agent.nudgeLines[0];

                return (
                  <div 
                    key={agent.id}
                    className={`bg-white border rounded-xl p-4 flex flex-col relative transition-all duration-300 ${
                      active 
                        ? "border-[#7C3AED] shadow-lg ring-2 ring-[#7C3AED]/5 scale-105 z-10" 
                        : "border-slate-900/10 opacity-60"
                    }`}
                  >
                    {/* Active glow dot */}
                    {active && (
                      <span className="absolute top-3 right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        className={`w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm transition-transform duration-300 ${active ? "scale-105" : ""}`} 
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight font-display">{agent.name}</h4>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold font-mono truncate">{agent.role}</p>
                      </div>
                    </div>

                    {/* Agent status thought bubble */}
                    <div className={`text-[10px] leading-relaxed p-2 rounded-lg font-sans flex-1 mb-3 transition-colors ${active ? "bg-indigo-50/50 text-indigo-950 font-medium" : "bg-slate-50 text-slate-500 italic"}`}>
                      {active ? nudgeLine : "Waiting for instructions..."}
                    </div>

                    <div className="mt-auto space-y-0.5 pt-2 border-t border-slate-100 font-mono text-[9px] text-slate-400">
                      <div className="flex justify-between">
                        <span>MODULE:</span>
                        <span className="font-bold text-slate-600">{agent.deskLabel.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>THREAD:</span>
                        <span className={`font-bold ${active ? "text-[#7C3AED] animate-pulse" : "text-slate-400"}`}>
                          {active ? "RUNNING" : "STANDBY"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Sleek Timeline Log */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-900/10 flex flex-col bg-white z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="px-4 py-3 border-b border-slate-900/10 bg-[#FAF9F6]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
              Dialogue logs
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[550px]">
            {meetingLog.length === 0 && (
              <p className="text-[11px] text-slate-400 italic text-center py-6 select-none font-mono">
                Handshaking with office motherboard...
              </p>
            )}
            {meetingLog.map((log, idx) => {
              const robotObj = agents.find(r => r.name === log.agent);
              return (
                <div key={idx} className="flex items-start space-x-2.5 animate-fadeIn">
                  {robotObj ? (
                    <img
                      src={robotObj.avatar}
                      alt={robotObj.name}
                      className="w-6 h-6 rounded-md object-cover border border-slate-200 mt-0.5"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center mt-0.5 border border-slate-200">
                      <span className="text-[9px] font-mono text-slate-400">🤖</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 bg-[#FAF9F6] border border-slate-900/5 rounded-xl px-3 py-2 text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-800 block mb-0.5 font-display">
                      {log.agent}
                    </span>
                    <p className="text-slate-600 font-sans">{log.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
