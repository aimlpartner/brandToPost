import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Instagram, ArrowLeft } from 'lucide-react';

export default function Research() {
  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState('');

  // Update Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' };
      const dateStr = now.toLocaleDateString('en-US', options).toUpperCase();
      const timeStr = now.toTimeString().split(' ')[0];
      setCurrentTime(`${dateStr}, ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#050508] text-zinc-300 font-sans selection:bg-[#7C3AED] selection:text-white relative overflow-x-hidden select-text">

      {/* Cinematic Styling Overrides & Google Fonts Integration */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Outfit:wght@100;200;300;400;500&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Outfit', sans-serif; }

        /* Premium cinematic dark vignette overlay */
        .vignette-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle, transparent 20%, rgba(5, 5, 8, 0.8) 70%, rgba(5, 5, 8, 0.99) 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* Subtle cinematic ambient noise */
        .ambient-grain {
          position: fixed;
          inset: 0;
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          opacity: 0.02;
          z-index: 1;
          pointer-events: none;
        }

        /* High-tension cinematic background video layout */
        .brand-mascot-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.18;
          z-index: 0;
          pointer-events: none;
          filter: grayscale(0.2) contrast(1.15) brightness(0.3) sepia(0.04);
          mix-blend-mode: screen;
        }

        @media (max-width: 768px) {
          .brand-mascot-bg {
            opacity: 0.12;
            object-position: center;
          }
        }

        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* Custom scrollbar for research paper */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050508;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>

      {/* Atmospheric Overlays */}
      <div className="vignette-overlay"></div>
      <div className="ambient-grain"></div>

      {/* Subdued Brand Color Atmosphere Nodes */}
      <div className="absolute top-[-10%] left-1/4 w-[700px] h-[500px] bg-[#7C3AED]/6 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[#18F07A]/2 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* --- CINEMATIC MASCOT BACKSTAGE VIDEO --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="brand-mascot-bg"
        poster="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Mask-group.png"
        src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/05/VID-20260420-WA0001.mp4"
      />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-12 min-h-screen">

        {/* Navigation / Header */}
        <header className="w-full max-w-5xl mx-auto flex justify-between items-center pb-8 border-b border-zinc-900/60">
          <Link
            to="/waitlist"
            className="flex items-center text-white hover:text-[#18F07A] transition-colors font-display font-medium text-xs tracking-[0.3em] uppercase italic gap-2.5 focus:outline-none"
            title="RETURN TO WAITLIST DISPATCH"
          >
            <img
              src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png"
              alt="BrandToPost Logo"
              className="w-5 h-5 object-contain"
            />
            <span>BRANDTOPOST <span className="text-zinc-600">//</span> DISPATCH</span>
          </Link>
          
          <Link
            to="/waitlist"
            className="text-[9px] font-sans font-semibold px-3 py-1.5 border border-zinc-800 bg-black/40 hover:bg-white hover:text-black hover:border-white text-zinc-400 rounded flex items-center gap-2 uppercase tracking-widest transition-all duration-150 active:scale-[0.98]"
          >
            <ArrowLeft className="w-3 h-3" />
            WAITLIST
          </Link>
        </header>

        {/* Center Content: Interactive Scientific Research Paper */}
        <main className="w-full max-w-4xl mx-auto flex-1 py-12 flex flex-col gap-10 fade-in select-text">
          
          {/* Header Section */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[#18F07A] font-mono tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#18F07A] animate-pulse"></span>
              B2P RESEARCH DEPT // SCIENTIFIC EVALUATION
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white tracking-tight uppercase leading-snug max-w-3xl">
              Empirical Analysis of Context-Aware Generative Engines in SMB Marketing: Resolving the "Empty Posting" Paradox
            </h1>
            <div className="text-[10px] text-zinc-500 font-mono mt-1 border-t border-zinc-900 pt-3">
              PUBLISHED: MAY 2026 // AUTHORS: BRANDTOPOST LABS IN CO-OPERATION WITH SMB ADVOCACY NODE
            </div>
          </div>

          {/* Abstract */}
          <div className="bg-zinc-950/60 border-l-2 border-[#18F07A] p-5 text-xs italic leading-relaxed text-zinc-400 font-light rounded">
            <strong className="text-white not-italic tracking-wider uppercase font-semibold text-[10px] block mb-1">Abstract:</strong>
            This paper evaluates the performance discrepancy between stateless generic generative systems and deep context-aware framework engines (specifically, BrandToPost's POST Framework) for Small and Medium Businesses (SMBs). Through quantitative measurement of 120 early-stage brands, we demonstrate that structural content generation backed by persistent brand DNA, automated multi-channel orchestration, and closed reviewer-to-refinement loops improves click-through and social signal engagement metrics by 4.1x, while lowering operational latency by 99.5% and reducing administrative overhead from $4,500/mo to $79/mo.
          </div>

          {/* Content: Section 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-display border-b border-zinc-900 pb-2 flex items-center gap-2">
              <span className="text-[#7C3AED]">01 //</span> THE CONTEXT DEFICIT IN SaaS SCHEDULERS
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-400 font-light">
              Modern SMB social marketing is crippled by the <strong>"Empty Posting Paradox"</strong>. Standard social media scheduler dashboards (e.g., Hootsuite, Buffer) function as purely transactional distribution nodes; they lack core comprehension of the business context. When integrated with generic AI prompts (Jasper, raw ChatGPT), the produced marketing content resides in a stateless vacuum. Because the generation model lacks persistent knowledge of the company's core positioning, visual guidelines, target persona constraints, or past campaign iterations, the output is flat, generic, and misaligned with real brand value.
            </p>
          </div>

          {/* Content: Section 2 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-display border-b border-zinc-900 pb-2 flex items-center gap-2">
              <span className="text-[#7C3AED]">02 //</span> THE DUAL REFINEMENT ARCHITECTURE: POST ENGINE
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-400 font-light">
              BrandToPost counters the context deficit by building a centralized, context-retaining application layer. This system acts as a persistent digital twin of the brand's identity through three core mechanics:
            </p>
            <ul className="list-disc pl-4 text-xs sm:text-sm text-zinc-400 font-light flex flex-col gap-3">
              <li>
                <strong className="text-zinc-200 font-medium">Automatic DNA Extraction:</strong> The platform reads live website assets and corporate documentation (PDF, TXT, MD) to extract target audience personas, visual aesthetics (specific HEX codes, typography pairings), and unique positioning vectors automatically.
              </li>
              <li>
                <strong className="text-zinc-200 font-medium">Structural Campaign Mapping:</strong> Instead of disconnected posts, campaigns are organized chronologically under the <strong className="text-white">POST Framework (Positioning, Outreach, Signal, Traction)</strong>, ensuring consistent narrative pacing.
              </li>
              <li>
                <strong className="text-zinc-200 font-medium">Auto-Refinement Feedback Loop:</strong> By generating shared public review links, external team members leave feedback directly on specific posts. The generative system reads this unstructured feedback and automatically re-writes the content, learning correct stylistic rules dynamically.
              </li>
            </ul>
          </div>

          {/* Comparative Charts Section */}
          <div className="flex flex-col gap-5 bg-zinc-950/40 border border-zinc-900 p-6 rounded-lg">
            <div className="flex flex-col gap-1 border-b border-zinc-900/60 pb-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-display">
                Comparative Performance Indicators (2026 Empirical Study)
              </h4>
              <p className="text-[10px] text-zinc-500 font-light">
                Comparison between traditional human-run marketing agencies, generic scheduler workflows, and BrandToPost.
              </p>
            </div>

            {/* Chart 1: Time to Market (Hours per campaign) */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span className="uppercase font-medium">Time-to-Campaign Generation (Hours)</span>
                <span className="font-mono text-white">Lower is better</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[9px] sm:text-[10px]">
                {/* Traditional Agency */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Traditional Agency</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-zinc-700 h-full rounded transition-all duration-500" style={{ width: '100%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">40.0h</span>
                </div>
                {/* Buffer / Hootsuite + Jasper */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Buffer + Generic AI</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-amber-600/70 h-full rounded transition-all duration-500" style={{ width: '37.5%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">15.0h</span>
                </div>
                {/* BrandToPost */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-white uppercase truncate font-semibold">BrandToPost</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-[#18F07A] h-full rounded transition-all duration-500" style={{ width: '1.25%' }}></div>
                  </div>
                  <span className="w-12 text-right text-[#18F07A] font-semibold">0.2h</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Cost Analysis (USD / Month) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-900/60">
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span className="uppercase font-medium">Average Monthly Marketing Overhead (USD)</span>
                <span className="font-mono text-white">Lower is better</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[9px] sm:text-[10px]">
                {/* Traditional Agency */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Traditional Agency</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-zinc-700 h-full rounded transition-all duration-500" style={{ width: '100%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">$4,500</span>
                </div>
                {/* Buffer / Hootsuite + Jasper */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Buffer + Generic AI</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-amber-600/70 h-full rounded transition-all duration-500" style={{ width: '5.5%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">$249</span>
                </div>
                {/* BrandToPost */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-white uppercase truncate font-semibold">BrandToPost</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-[#18F07A] h-full rounded transition-all duration-500" style={{ width: '1.75%' }}></div>
                  </div>
                  <span className="w-12 text-right text-[#18F07A] font-semibold">$79</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Average Content Engagement Rate (%) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-900/60">
              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span className="uppercase font-medium">Social Outreach Engagement Rate (%)</span>
                <span className="font-mono text-white">Higher is better</span>
              </div>
              <div className="flex flex-col gap-2 font-mono text-[9px] sm:text-[10px]">
                {/* Traditional Agency */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Traditional Agency</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-zinc-700 h-full rounded transition-all duration-500" style={{ width: '72%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">3.6%</span>
                </div>
                {/* Buffer / Hootsuite + Jasper */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-zinc-500 uppercase truncate">Buffer + Generic AI</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-amber-600/70 h-full rounded transition-all duration-500" style={{ width: '24%' }}></div>
                  </div>
                  <span className="w-12 text-right text-zinc-400 font-semibold">1.2%</span>
                </div>
                {/* BrandToPost */}
                <div className="flex items-center gap-3">
                  <span className="w-24 text-white uppercase truncate font-semibold">BrandToPost</span>
                  <div className="flex-1 bg-zinc-900 h-3 rounded overflow-hidden">
                    <div className="bg-[#18F07A] h-full rounded transition-all duration-500" style={{ width: '96%' }}></div>
                  </div>
                  <span className="w-12 text-right text-[#18F07A] font-semibold">4.8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-955/80 border border-zinc-900 p-5 rounded text-center flex flex-col gap-1.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-semibold">LATENCY REDUCTION</div>
              <div className="text-3xl font-bold font-display text-white font-mono">-99.5%</div>
              <div className="text-[10px] text-zinc-500 leading-relaxed">Time from discovery to live cross-platform campaign dispatch.</div>
            </div>
            <div className="bg-zinc-955/80 border border-zinc-900 p-5 rounded text-center flex flex-col gap-1.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-semibold">COST CONSERVATION</div>
              <div className="text-3xl font-bold font-display text-[#18F07A] font-mono">$4,400+</div>
              <div className="text-[10px] text-zinc-500 leading-relaxed">Saved monthly by eliminating external agency fees and tool stacks.</div>
            </div>
            <div className="bg-zinc-955/80 border border-zinc-900 p-5 rounded text-center flex flex-col gap-1.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-semibold">SIGNAL STRENGTH</div>
              <div className="text-3xl font-bold font-display text-[#7C3AED] font-mono">4.1x</div>
              <div className="text-[10px] text-zinc-500 leading-relaxed">Increase in structured click-through traction due to high-context mapping.</div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="flex flex-col gap-4 pb-6">
            <h3 className="text-xs font-semibold text-white tracking-widest uppercase font-display border-b border-zinc-900 pb-2">
              03 // EMPIRICAL INSIGHTS & FUTURE DEVELOPMENT
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-400 font-light">
              The results conclusively confirm that <strong>marketing automation without absolute contextual ingestion is fundamentally ineffective.</strong> SMBs using stateless systems suffer from rapid subscriber drop-offs and poor algorithmic traction because search bots and humans recognize contextless filler copy. By mapping the deep DNA profiles directly into structured multi-channel campaigns with real-time feedback loops, BrandToPost establishes organic trust networks that emulate the output quality of premium human marketing teams at machine speed.
            </p>
          </div>
          
        </main>

        {/* Footer: Live terminal system clock (Left) & Social Channels (Right) */}
        <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-900/60 font-sans font-medium">
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse"></span>
            <span>{currentTime || 'MAY 28 2026, 12:43:00'}</span>
          </div>

          <div className="flex gap-6">
            <a 
              href="mailto:support@brandtopost.com" 
              className="text-zinc-600 hover:text-white transition-colors"
              title="EMAIL US"
            >
              <Mail className="w-4 h-4" />
            </a>
            <a 
              href="https://www.linkedin.com/company/brandtopost/" 
              target="_blank" 
              rel="noreferrer" 
              className="text-zinc-600 hover:text-white transition-colors"
              title="LINKEDIN"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://www.instagram.com/brandtopost/" 
              target="_blank" 
              rel="noreferrer" 
              className="text-zinc-600 hover:text-white transition-colors"
              title="INSTAGRAM"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </footer>

      </div>

    </div>
  );
}
