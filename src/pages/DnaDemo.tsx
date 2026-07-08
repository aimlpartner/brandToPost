import { useState, useEffect } from "react";
import { DnaModel } from "../components/DnaModel";
import { Sparkles, Play, RotateCcw, Database, ArrowLeft, Globe, Zap, Target, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export function DnaDemo() {
  const [progress, setProgress] = useState(40);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Initializing DNA mapping...",
    "Scanning URL structure...",
  ]);

  const mockDna = {
    name: "B2P Growth Engine",
    website: "https://b2p-growth-engine.io",
    positioning: "A modern, asynchronous campaign manager for solo B2B founders.",
    audience: "SaaS Founders, Agency Owners, and Growth Managers.",
    visualStyle: "Warm off-white theme with Indigo/Coral vector aesthetics.",
    tone: "Insightful, professional, precise",
    visualData: {
      colors: ["#6366F1", "#EC4899", "#10B981"], // Custom Indigo/Pink brand palette
      fonts: { primary: "Outfit", secondary: "Inter" },
      typographyHierarchy: "sans-serif",
      imageStyle: "minimalist"
    },
    // Advanced Psychographic DNA fields
    enemy: "Manual content production loops and generic, robotic templates.",
    earnedSecret: "Most audience engagement comes from showing specific local references and custom visual elements, not generic high-level statements.",
    hellState: "Overwhelmed by spending hours writing drafts that get zero engagement or look like basic SaaS boilerplate.",
    heavenState: "Launching high-impact LinkedIn and X campaigns in 2 minutes that feel highly personal and look visually stunning.",
    uniqueMechanism: "An automated multi-agent scraper that extracts your landing page's custom branding, fonts, colors, and voice DNA instantly.",
    contentPillars: [
      "Scraping & Visual Branding Secrets",
      "How to Write Copy like a Human",
      "Automating Campaigns without losing your Soul",
      "B2B Growth Strategy for Indie Founders"
    ]
  };

  // Mock simulation process
  useEffect(() => {
    if (!isSimulating) return;

    setProgress(0);
    setLogs(["Initializing DNA mapping..."]);

    const steps = [
      { p: 10, log: "Booting extraction agents (Sarah & Julian)..." },
      { p: 20, log: "Scraping landing page elements & visual assets..." },
      { p: 35, log: "quantifying customer JTBD & objections..." },
      { p: 50, log: "Synthesizing founder tone of voice mapping..." },
      { p: 65, log: "Extracting font families & color hex values..." },
      { p: 80, log: "Analyzing content pillars & campaign directions..." },
      { p: 90, log: "Compiling semantic memory graph payload..." },
      { p: 100, log: "DNA Extraction complete. Matrix locked." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setIsSimulating(false);
        return;
      }

      const next = steps[currentStep];
      setProgress(next.p);
      setLogs((prev) => [...prev, next.log]);
      currentStep++;
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="h-screen w-screen bg-[#FAF9F6] p-6 text-slate-800 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        
        {/* Back Link & Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-900/10">
          <Link
            to="/dashboard/dna"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Position
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 font-mono">
            <span>THREE.JS VISUAL PREVIEW STUDIO</span>
          </div>
        </div>

        {/* Title block - Compact */}
        <div className="py-3">
          <h1 className="text-xl font-light tracking-tight text-slate-900 font-sans mb-0.5">
            Brand DNA Visualizer Studio
          </h1>
          <p className="text-slate-600 font-light text-[11px] max-w-2xl leading-relaxed">
            Preview the custom Three.js double-helix visualizer. Adjust the progression to see how the wireframe backbone lights up and projects metadata into the active floating HUD overlays.
          </p>
        </div>

        {/* 60/40 Asymmetric Workspace - flex-1 min-h-0 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-2">
          
          {/* Left panel: Controls (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-full min-h-0 overflow-y-auto">
            
            <div className="space-y-5">
              {/* Simulation Status Card */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Simulated Progress
                </h3>
                <div className="h-px bg-slate-100 mb-3" />
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">Completion Level</span>
                  <span className="text-xl font-bold font-mono text-[#7C3AED]">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#7C3AED] h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Simulated Logs Terminal */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Simulated Agent Logs
                </h3>
                <div className="h-px bg-slate-100 mb-3" />
                <div className="bg-slate-950 text-slate-300 font-mono text-[10px] rounded-xl p-3 h-36 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-1.5 items-start">
                      <span className="text-slate-600 select-none">[{index + 1}]</span>
                      <span className={log.includes("complete") ? "text-[#a78bfa] font-semibold" : ""}>
                        {log}
                      </span>
                    </div>
                  ))}
                  {isSimulating && (
                    <div className="flex items-center gap-1.5 text-[#a78bfa] opacity-80 mt-1.5 animate-pulse">
                      <span className="w-1 h-2.5 bg-[#a78bfa]" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive sliders */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Manual Override
                </h3>
                <div className="h-px bg-slate-100 mb-3" />
                
                <div className="space-y-3">
                  <div>
                    <label className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                      <span>Set Progress</span>
                      <span>{progress}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      disabled={isSimulating}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full accent-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="pt-4 flex gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsSimulating(true)}
                disabled={isSimulating}
                className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3 h-3" /> Simulate Flow
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgress(40);
                  setLogs(["Initialized DNA mapping...", "Scanning URL structure..."]);
                  setIsSimulating(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

          </div>

          {/* Right panel: DNA Canvas (8 cols) - fits viewport flex space */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0">
            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-[#FAF9F6] relative min-h-0">
              <DnaModel 
                progress={progress} 
                dna={mockDna} 
                isComplete={progress === 100} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
