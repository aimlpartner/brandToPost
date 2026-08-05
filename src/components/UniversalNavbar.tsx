import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, Building2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface UniversalNavbarProps {
  forcedTheme?: 'dark' | 'light';
}

export function UniversalNavbar({ forcedTheme }: UniversalNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkNavbar, setIsDarkNavbar] = useState(true);

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
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className={`text-xl tracking-tight font-display font-bold transition-colors duration-300 ${isDarkNavbar ? 'text-white' : 'text-slate-900'}`}>BrandToPost</span>
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Agency OS Link */}
            <Link 
              to="/agency" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shrink-0 ${
                isDarkNavbar 
                  ? 'bg-white/5 border border-emerald-400/40 text-emerald-300 hover:bg-white/10'
                  : 'bg-emerald-50 border border-emerald-300 text-emerald-950 hover:bg-emerald-100'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isDarkNavbar ? 'text-emerald-400' : 'text-emerald-700'}`} />
              <span>Agency OS</span>
            </Link>

            {/* Clean Corporate Founder Studio Link */}
            <Link 
              to="/founder" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shrink-0 ${
                isDarkNavbar 
                  ? 'bg-white/5 border border-[#C084FC]/40 text-purple-200 hover:bg-white/10'
                  : 'bg-purple-50 border border-purple-300 text-purple-950 hover:bg-purple-100'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${isDarkNavbar ? 'text-[#C084FC]' : 'text-purple-700'}`} />
              <span>Founder Studio</span>
            </Link>

            <Link to="/blog" className={`text-sm font-medium transition-colors duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Blog</Link>
            <Link to="/login" className={`text-sm font-medium transition-colors hidden md:block duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Sign In</Link>
            <Link to="/login?mode=signup" className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all hover:bg-[#6D28D9] bg-[#7C3AED] text-white shadow-sm whitespace-nowrap">
              Start free trial
            </Link>

            {/* Utility Theme Toggle — Far Right Border Separated */}
            <div className={`border-l pl-3 sm:pl-4 flex items-center ${isDarkNavbar ? 'border-white/15' : 'border-slate-300'}`}>
              <ThemeToggle variant="icon" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
