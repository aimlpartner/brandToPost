import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export function UniversalFloatingThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();

  // If we are inside the dashboard, the dashboard already has dedicated theme toggles
  // in the sidebar and top mobile header.
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-[9999] animate-in fade-in duration-300">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle dark and light mode"
        title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'group flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-sans text-xs font-semibold',
          resolvedTheme === 'dark'
            ? 'bg-slate-900/95 border-slate-700/80 text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-black/50'
            : 'bg-white/95 border-slate-200/90 text-slate-800 hover:bg-white hover:text-slate-950 shadow-slate-300/60'
        )}
      >
        <div className="relative flex items-center justify-center">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 group-hover:rotate-90" />
          ) : (
            <Moon className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </div>
        <span>{resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
      </button>
    </div>
  );
}
