import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PenTool,
  Volume2,
  LogOut,
  Sparkles,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

const LinkedinLogo = ({ className = "h-[18px] w-[18px]" }: { className?: string }) => (
  <svg className={cn("shrink-0", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.7 19H4.9V10H7.7V19ZM6.3 8.8C5.4 8.8 4.7 8.1 4.7 7.2C4.7 6.3 5.4 5.6 6.3 5.6C7.2 5.6 7.9 6.3 7.9 7.2C7.9 8.1 7.2 8.8 6.3 8.8ZM19 19H16.2V14.6C16.2 13.5 16.2 12.1 14.7 12.1C13.1 12.1 12.9 13.3 12.9 14.5V19H10.1V10H12.8V11.2H12.8C13.2 10.5 14.1 9.8 15.4 9.8C18.2 9.8 18.7 11.6 18.7 14V19H19Z" fill="white" />
  </svg>
);

const navItems = [
  { name: 'Dashboard', href: '/individual', icon: LayoutDashboard, exact: true },
  { name: 'Post Creator', href: '/individual/creator', icon: PenTool },
  { name: 'Founder Voice', href: '/individual/voice', icon: Volume2 },
  { name: 'LinkedIn Connection', href: '/individual/linkedin', icon: LinkedinLogo },
];

export function IndividualLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="flex h-full w-full flex-col bg-white border-r border-slate-200/80 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Brand Header */}
      <div className="px-4 py-5">
        <div className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100">
          <img src="/B2PLOGO.png" alt="B2P" className="h-8 w-8 rounded-lg shrink-0 object-contain" />
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-800 truncate w-full text-left font-display">
              BrandToPost
            </span>
            <span className="text-[10px] font-bold text-[#7C3AED] tracking-wider uppercase">
              Founder Persona
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-white fill-white" : "text-slate-400"
                )}
              />
              <span className="flex-1 text-left">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Persona Mode Indicator */}
        <div className="pt-6 px-1">
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#7C3AED]" />
              <span>Personal Brand Mode</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Calibrated for executive thought leadership & founder ghostwriting.
            </p>
            <div
              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
              title="Marketing Mode is locked for Individual Founder accounts"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Marketing Mode</span>
              <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-bold">Locked</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-[#7C3AED]/30 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Founder'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <ThemeToggle variant="icon" />
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent text-[#0F172A] relative">
      {/* Universal background container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-white" />

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/85 border-b border-[#7C3AED]/15 z-40 flex items-center justify-between px-4 shadow-sm backdrop-blur-md">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-9 w-9 rounded-full border border-[#7C3AED]/50 object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-bold text-white shadow-sm border border-[#7C3AED]/50">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
          )}
          <span className="font-bold text-slate-900 text-sm font-display tracking-tight">
            BrandToPost <span className="text-[#7C3AED] text-xs font-normal">Persona</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <button
            onClick={() => navigate('/individual/creator', { state: { openModal: true } })}
            className="p-2 text-[#7C3AED] hover:bg-[#7C3AED]/10 rounded-lg transition-colors cursor-pointer"
            title="Create Post"
          >
            <PenTool className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex relative flex-shrink-0 w-[220px] h-full z-10">
        {renderSidebarContent()}
      </div>

      {/* Mobile Overlay & Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[280px] md:hidden will-change-transform shadow-2xl overflow-hidden rounded-r-2xl border-r border-[#7C3AED]/20"
            >
              {renderSidebarContent(() => setIsMobileMenuOpen(false))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <main className="flex-1 relative w-full overflow-hidden bg-transparent">
        <div
          id="main-scrollable-container"
          className="absolute inset-0 w-full h-full overflow-x-hidden overflow-y-auto pt-16 pb-[60px] md:pb-6 md:p-6 md:pt-6 touch-pan-y scroll-smooth"
        >
          <div className="w-full max-w-7xl mx-auto min-h-full box-border relative">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/50 h-[55px] pb-safe flex items-center justify-around shadow-[0_-2px_10px_rgba(124,58,237,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={cn(
                "flex items-center justify-center transition-all duration-300 w-11 h-11",
                isActive
                  ? "text-white bg-[#7C3AED] rounded-xl shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
              )}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
