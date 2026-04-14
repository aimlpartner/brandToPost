import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-[#fafafa]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel rounded-none border-x-0 border-t-0 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center shadow-sm">
            <span className="text-[#111827] font-bold text-lg">A</span>
          </div>
          <span className="text-xl tracking-tight font-display text-[#111827]">
            <span className="font-extrabold">Brand</span>
            <span className="font-light text-[#ff6347]">ToPost</span>
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#111827] hover:bg-white/20 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        p-4 md:p-6 md:pr-0 flex-shrink-0 w-72 md:w-auto
      `}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6">
        <div className="w-full max-w-7xl mx-auto pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
