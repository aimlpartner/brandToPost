import { useState, useEffect } from "react";
import { Play, RotateCcw, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CampaignLoaderConsole } from "../components/CampaignLoaderConsole";

export function DnaDemo() {
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [generationStatus, setGenerationStatus] = useState(
    "Sarah is crawling web indexes and gathering competitive insights..."
  );

  const mockDna = {
    id: "demo-id",
    name: "B2P Growth Engine",
    website: "https://b2p-growth-engine.io",
    positioning: "A modern, asynchronous campaign manager for solo B2B founders.",
    audience: "SaaS Founders, Agency Owners, and Growth Managers.",
    visualStyle: "Warm off-white theme with Indigo/Pink vector aesthetics.",
    tone: "Insightful, professional, precise",
    stage: "growth",
    visualData: {
      colors: ["#6366F1", "#EC4899", "#10B981"],
      fonts: { primary: "Outfit", secondary: "Inter" },
      typographyHierarchy: "sans-serif",
      imageStyle: "minimalist"
    },
    enemy: "Manual content production loops and generic, robotic templates.",
    earnedSecret: "Most audience engagement comes from showing specific local references and custom visual elements, not generic high-level statements.",
    hellState: "Overwhelmed by spending hours writing drafts that get zero engagement or look like basic SaaS boilerplate.",
    heavenState: "Launching high-impact LinkedIn and X campaigns in 2 minutes that feel highly personal and look visually stunning.",
    uniqueMechanism: "An automated multi-agent scraper that extracts your landing page's custom branding, fonts, colors, and voice DNA instantly.",
    objections: "high setup complexity, uncertainty of AI copy tone, lack of graphic tools",
    vocabularyAlways: "strategic automation, founder voice, native copywriting",
    vocabularyNever: "delve, synergy, revolutionise, game-changer",
    contentPillars: [
      "Scraping & Visual Branding Secrets",
      "How to Write Copy like a Human",
      "Automating Campaigns without losing your Soul"
    ]
  };

  // Mock simulation process
  useEffect(() => {
    if (!isSimulating) return;

    setProgress(0);
    setGenerationStep(1);
    setGenerationStatus(
      "Sarah is crawling web indexes and gathering competitive insights..."
    );

    const steps = [
      { p: 15, step: 1, log: "Sarah is extracting competitive messaging gaps on target niche..." },
      { p: 30, step: 2, log: "Arthur is calibrating founder voice clone and reviewing DNA..." },
      { p: 45, step: 2, log: "Arthur is calibrating vocabulary guidelines and restricting B2B tropes..." },
      { p: 60, step: 3, log: "Alex is drafting copy templates for LinkedIn, X, and Reddit..." },
      { p: 75, step: 3, log: "Alex is formatting channels readability scores..." },
      { p: 90, step: 4, log: "Julian is initializing headless sandbox and stamping vector layouts..." },
      { p: 100, step: 4, log: "Campaign generation complete! Weekly workspace templates ready." },
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
      setGenerationStep(next.step);
      setGenerationStatus(next.log);
      currentStep++;
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="h-screen w-screen bg-[#FAF9F6] p-4 text-[#08080C] flex flex-col overflow-hidden select-none font-sans">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-900/10">
          <Link
            to="/dashboard/dna"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Position
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono tracking-wider">
            <span>OFFICE FLOORPLAN SIMULATOR LAB</span>
          </div>
        </div>

        {/* Title & Simulation Control Panel */}
        <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 font-display">
              Office Floorplan Simulator
            </h1>
            <p className="text-slate-500 text-[11px] max-w-xl leading-relaxed">
              Watch the AI specialist agents collaborate in clean office cubicles. Click "Simulate Flow" or manually override step phases.
            </p>
          </div>

          {/* Simulation controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulating(true)}
              disabled={isSimulating}
              className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-[#FAF9F6] font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-950"
            >
              <Play className="w-3.5 h-3.5" /> Simulate Flow
            </button>
            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setGenerationStep(1);
                setGenerationStatus("Sarah is crawling web indexes and gathering competitive insights...");
                setIsSimulating(false);
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 border border-slate-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Step Override:</label>
              <select
                value={generationStep}
                disabled={isSimulating}
                onChange={(e) => {
                  const step = Number(e.target.value);
                  setGenerationStep(step);
                  setProgress(step * 25);
                  if (step === 1) setGenerationStatus("Sarah is crawling web indexes and gathering competitive insights...");
                  else if (step === 2) setGenerationStatus("Arthur is calibrating founder voice clone and reviewing DNA...");
                  else if (step === 3) setGenerationStatus("Alex is drafting copy templates for LinkedIn, X, and Reddit...");
                  else if (step === 4) setGenerationStatus("Julian is initializing headless sandbox and stamping vector layouts...");
                }}
                className="bg-white border border-slate-300 rounded p-1 text-xs font-bold"
              >
                <option value={1}>1: Research</option>
                <option value={2}>2: DNA Voice</option>
                <option value={3}>3: Copywriting</option>
                <option value={4}>4: Publisher</option>
              </select>
            </div>
          </div>
        </div>

        {/* Classroom Render Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <CampaignLoaderConsole
            activeProduct={mockDna}
            focus="B2B Growth Automation"
            subCategory="SaaS Outbound Marketing"
            campaignTheme="Scale with Specialised AI Agents"
            selectedChannels={["LinkedIn", "X", "Reddit"]}
            generationStep={generationStep}
            generationTotal={4}
            generationStatus={generationStatus}
            warmupStatus=""
          />
        </div>
      </div>
    </div>
  );
}
