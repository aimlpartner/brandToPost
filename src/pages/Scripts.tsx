import React from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";

export function Scripts() {
  const { activeProduct } = useProducts();

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-800 p-4 md:p-8" id="scripts-studio-container">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 border-b border-slate-200 pb-6 w-full max-w-7xl mx-auto">
        <div className="tour-scripts-header">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-sans font-semibold text-amber-600 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              🚧 Under Construction Zone
            </span>
          </div>
          <h1 className="text-4xl font-display font-light text-slate-900 tracking-tight">
            Script Studio
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Co-directed by <span className="font-medium text-slate-800">Zack (Video Screenwriter)</span> and <span className="font-medium text-slate-800">Chloe (Creative Director)</span>. Translate your active brand position DNA into high-converting screenplay briefs, scene dialogues, and asset specifications.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-slate-200 py-2.5 px-4 rounded-lg shadow-sm shrink-0">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Module Status</span>
            <span className="text-xs font-semibold text-amber-700 truncate max-w-[150px]">🔒 Lab Calibrating</span>
          </div>
        </div>
      </div>

      {/* Secure Construction Banner Container */}
      <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-950 min-h-[500px] flex flex-col items-center justify-center p-8 md:p-16 text-center space-y-6">
        {/* Subtle Caution Bar Top */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-3xl shadow-xl shadow-amber-500/10">
          🚧
        </div>

        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-sans font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🚧 Active Engineering & Construction Zone</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-light font-display text-white tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
            Script Studio Is Locked For <br />
            <span className="font-normal italic text-amber-400">Heavy Safety Calibration.</span>
          </h2>

          <p className="text-sm font-light text-slate-200 leading-relaxed max-w-md mx-auto">
            Zack (Video Screenwriter) and the B2B video screenplay generator are sealed under safety calibration and API lockdown. Full public release coming in Q3.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Link 
            to="/dashboard" 
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
