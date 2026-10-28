import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, X, ArrowRight, ArrowUpRight } from "lucide-react";
import { AGENTS_LIST, renderAgentIcon } from "../data/agentsData";

interface UniversalNavbarProps {
  forcedTheme?: 'dark' | 'light';
}

export function UniversalNavbar({ forcedTheme }: UniversalNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkNavbar, setIsDarkNavbar] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const agentsBtnRef = useRef<HTMLButtonElement>(null);
  const agentsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAgentsMouseEnter = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    setAgentsOpen(true);
  };

  const handleAgentsMouseLeave = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    agentsTimerRef.current = setTimeout(() => {
      setAgentsOpen(false);
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
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAgentsOpen(false);
    };
    if (agentsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [agentsOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      if (forcedTheme) {
        setIsDarkNavbar(forcedTheme === 'dark');
        return;
      }

      // Check current section under nav header
      const navCheckY = 60;
      const sections = document.querySelectorAll('[data-nav-theme]');
      let foundTheme = 'dark';

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navCheckY && rect.bottom >= navCheckY) {
          foundTheme = section.getAttribute('data-nav-theme') || 'dark';
        }
      });

      setIsDarkNavbar(foundTheme === 'dark');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [forcedTheme]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? (isDarkNavbar 
            ? 'bg-[#08080C]/85 border-b border-white/10 py-3.5 backdrop-blur-xl text-white shadow-2xl shadow-black/50' 
            : 'bg-[#FAF9F6]/90 border-b border-slate-900/10 py-3.5 backdrop-blur-xl text-slate-900 shadow-lg shadow-slate-900/5')
        : 'bg-transparent py-5 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className={`text-xl tracking-tight font-display font-bold transition-colors duration-300 ${isDarkNavbar ? 'text-white' : 'text-slate-900'}`}>BrandToPost</span>
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Agents Dropdown Trigger */}
            <button
              ref={agentsBtnRef}
              onMouseEnter={handleAgentsMouseEnter}
              onMouseLeave={handleAgentsMouseLeave}
              onClick={() => setAgentsOpen(!agentsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                agentsOpen 
                  ? 'bg-white/15 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]' 
                  : (isDarkNavbar 
                      ? 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                      : 'bg-slate-900/[0.04] border-slate-900/10 text-slate-800 hover:text-slate-950 hover:bg-slate-900/[0.08]')
              }`}
              aria-expanded={agentsOpen}
              aria-label="Toggle agents dropdown"
            >
              <span className="tracking-tight font-medium">Agents</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${agentsOpen ? 'rotate-180' : 'opacity-60'}`} />
            </button>

            <Link to="/blog" className={`text-sm font-medium transition-colors duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Blog</Link>
            <Link to="/login" className={`text-sm font-medium transition-colors hidden md:block duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Sign In</Link>
            <Link to="/login?mode=signup" className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all hover:bg-[#6D28D9] bg-[#7C3AED] text-white shadow-sm whitespace-nowrap">
              Start free trial
            </Link>
          </div>
        </div>

        {/* Agents Mega Dropdown Panel */}
        {agentsOpen && (
          <div
            ref={agentsDropdownRef}
            onMouseEnter={handleAgentsMouseEnter}
            onMouseLeave={handleAgentsMouseLeave}
            className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-8 mt-2 sm:w-[680px] md:w-[780px] lg:w-[860px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="absolute -top-3 left-0 right-0 h-3" />
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></span>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Autonomous Platform Agents</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                    8 Dedicated Engines
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Each agent specializes in platform-native algorithms, formatting, and high-retention storytelling.
                </p>
              </div>
              <button
                onClick={() => setAgentsOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close agents menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Agents Grid (Clean Logos, Zero Boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 py-5">
              {AGENTS_LIST.map((agent) => (
                <Link
                  key={agent.slug}
                  to={`/agents/${agent.slug}`}
                  onClick={() => setAgentsOpen(false)}
                  className="group/agent p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Clean Logo: No box container */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        {renderAgentIcon(agent, "w-5 h-5")}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover/agent:text-white transition-colors" />
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover/agent:text-[#C084FC] transition-colors mb-1">
                      {agent.name}
                    </h4>
                    <p className="text-[10px] font-mono text-[#A78BFA] mb-2">
                      {agent.role}
                    </p>
                    <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                      {agent.tagline}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40 group-hover/agent:text-white/80 transition-colors">
                    <span>Explore Agent</span>
                    <span className="text-[#C084FC]">→</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dropdown Footer CTA */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span>All 8 agents synchronize with your central Brand DNA automatically</span>
              </div>
              <Link
                to="/login?mode=signup"
                onClick={() => setAgentsOpen(false)}
                className="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors group/cta"
              >
                <span>Deploy all agents free</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

