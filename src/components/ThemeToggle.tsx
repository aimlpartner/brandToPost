import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'sidebar' | 'cards';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'relative inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 focus:outline-none cursor-pointer',
          resolvedTheme === 'dark'
            ? 'bg-slate-900 border-slate-700/80 text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-sm'
            : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
          className
        )}
      >
        <span className="sr-only">Toggle theme</span>
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-90" />
        ) : (
          <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer border',
          resolvedTheme === 'dark'
            ? 'bg-slate-900/60 border-slate-700/70 text-slate-200 hover:bg-slate-800/80'
            : 'bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-100/90 hover:text-slate-900',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-[18px] w-[18px] text-amber-300 shrink-0" strokeWidth={1.8} />
          ) : (
            <Sun className="h-[18px] w-[18px] text-amber-500 shrink-0" strokeWidth={1.8} />
          )}
          <span>{resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
        </div>
        <span className="text-[11px] font-sans text-slate-400 font-normal px-1.5 py-0.5 rounded border border-current/15">
          {theme === 'system' ? 'Auto' : resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  if (variant === 'cards') {
    const options: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
      {
        id: 'light',
        label: 'Light mode',
        desc: 'Warm off-white background with high-contrast text',
        icon: <Sun className="w-5 h-5 text-amber-500" />,
      },
      {
        id: 'dark',
        label: 'Dark mode',
        desc: 'Pitch black #08080C aesthetic for low-light focus',
        icon: <Moon className="w-5 h-5 text-amber-300" />,
      },
      {
        id: 'system',
        label: 'System default',
        desc: 'Automatically follow your operating system appearance',
        icon: <Monitor className="w-5 h-5 text-[#7C3AED]" />,
      },
    ];

    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4 w-full', className)}>
        {options.map((option) => {
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative group',
                isSelected
                  ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-sm ring-1 ring-[#7C3AED]/20'
                  : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-white'
              )}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="p-2 rounded-xl bg-slate-100/80 group-hover:bg-slate-200/50 transition-colors">
                  {option.icon}
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED]">
                    <Check className="w-3.5 h-3.5" />
                    Active
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-800">{option.label}</span>
              <span className="text-xs text-slate-500 mt-1 leading-relaxed">{option.desc}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
