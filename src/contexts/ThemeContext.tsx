import React, { createContext, useContext, useEffect, useState } from 'react';
import { enable, disable, isEnabled } from 'darkreader';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'b2p_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === 'light' || theme === 'dark') return theme;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to DOM and DarkReader
  const applyTheme = (mode: ResolvedTheme) => {
    const root = document.documentElement;

    if (mode === 'dark') {
      enable({
        brightness: 100,
        contrast: 100,
        sepia: 0,
        darkSchemeBackgroundColor: '#08080C',
        darkSchemeTextColor: '#FAF9F6',
      });
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      if (isEnabled()) {
        disable();
      }
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const getResolvedTheme = (): ResolvedTheme => {
      if (theme === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return theme;
    };

    const nextResolved = getResolvedTheme();
    setResolvedTheme(nextResolved);
    applyTheme(nextResolved);

    // If in system mode, listen for OS theme preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const osTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(osTheme);
        applyTheme(osTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
