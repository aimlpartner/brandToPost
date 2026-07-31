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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

const LinkedinLogo = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.7 19H4.9V10H7.7V19ZM6.3 8.8C5.4 8.8 4.7 8.1 4.7 7.2C4.7 6.3 5.4 5.6 6.3 5.6C7.2 5.6 7.9 6.3 7.9 7.2C7.9 8.1 7.2 8.8 6.3 8.8ZM19 19H16.2V14.6C16.2 13.5 16.2 12.1 14.7 12.1C13.1 12.1 12.9 13.3 12.9 14.5V19H10.1V10H12.8V11.2H12.8C13.2 10.5 14.1 9.8 15.4 9.8C18.2 9.8 18.7 11.6 18.7 14V19H19Z" fill="white" />
  </svg>
);

export function IndividualLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/individual', icon: LayoutDashboard, exact: true },
    { name: 'Post Creator', href: '/individual/creator', icon: PenTool },
    { name: 'Founder Voice', href: '/individual/voice', icon: Volume2 },
    { name: 'LinkedIn Connection', href: '/individual/linkedin', icon: LinkedinLogo },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-[#0F172A] relative">
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            B
          </div>
          <span className="font-bold text-slate-900 text-sm font-display tracking-tight">
            BrandToPost <span className="text-[#7C3AED] text-xs font-normal">Persona</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-base shadow-sm">
                B
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base font-display tracking-tight leading-none">
                  BrandToPost
                </h1>
                <span className="text-[11px] font-semibold text-[#7C3AED] tracking-wide">
                  FOUNDER PERSONA
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED] font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Mode Switcher Banner */}
          <div className="mt-8 p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] mb-1">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Personal Brand Mode</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
              Calibrated for executive thought leadership & founder ghostwriting.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 px-3 rounded-xl bg-white border border-purple-200 text-[#7C3AED] hover:bg-purple-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Switch to Marketing</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
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
            className="w-full py-2 px-3 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
