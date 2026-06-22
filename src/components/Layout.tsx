import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu, X, Calendar, FileText, ImageIcon, Megaphone, LayoutDashboard, HelpCircle, RefreshCw, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { GuidedTour } from "./GuidedTour";

const bottomNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Creatives", href: "/dashboard/creatives", icon: ImageIcon },
  { name: "Schedule", href: "/dashboard/schedule", icon: Calendar },
  { name: "DNA", href: "/dashboard/dna", icon: FileText },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
];

const variants = {
  enter: {
    opacity: 0,
    y: 6,
  },
  center: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -6,
  },
};

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { activeProduct, isLoaded } = useProducts();
  
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (isLoaded && !authLoading && user) {
      const onboardingCompleted = localStorage.getItem(`onboardingCompleted_${user.uid}`) === "true" || userProfile?.onboarded === true;
      const hasNoWebsite = !activeProduct || !activeProduct.website || activeProduct.website.trim() === "";
      if (!onboardingCompleted && hasNoWebsite) {
        navigate("/onboarding");
      }
    }
  }, [isLoaded, authLoading, activeProduct, user, userProfile, navigate]);

  const navigateTo = (path: string) => {
    const currentIndex = bottomNavItems.findIndex(
      (item) =>
        location.pathname.startsWith(item.href) ||
        (item.href === "/dashboard" && location.pathname === "/dashboard")
    );
    const nextIndex = bottomNavItems.findIndex(
      (item) =>
        path.startsWith(item.href) ||
        (item.href === "/dashboard" && path === "/dashboard")
    );
    setDirection(nextIndex > currentIndex ? 1 : -1);
    navigate(path);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent text-[#0F172A] relative">
      <GuidedTour />
      {/* Universal background container */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-white">
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/85 border-b border-[#7C3AED]/15 z-40 flex items-center justify-between px-4 shadow-sm backdrop-blur-md">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL || undefined}
              alt={user.displayName || "User"}
              className="h-9 w-9 rounded-full border border-[#7C3AED]/50 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-bold text-white shadow-sm border border-[#7C3AED]/50">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate("/dashboard/campaigns?create=true")}
          className="p-2 text-gray-300 hover:text-white hover:bg-[#7C3AED]/20 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-plus"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex relative flex-shrink-0 w-[220px] h-full z-10">
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
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
              drag="x"
              dragConstraints={{ right: 0 }}
              dragElastic={0}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -300) {
                  setIsMobileMenuOpen(false);
                }
              }}
              className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] md:hidden will-change-transform touch-none shadow-2xl overflow-hidden rounded-r-2xl border-r border-[#7C3AED]/20"
            >
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative w-full overflow-hidden bg-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.15,
              ease: "easeInOut",
            }}
            id="main-scrollable-container"
            className="absolute inset-0 w-full h-full overflow-x-hidden overflow-y-auto pt-16 pb-[60px] md:pb-6 md:p-6 md:pt-6 touch-pan-y will-change-transform"
          >
            <div className="w-full max-w-7xl mx-auto min-h-full box-border relative">
              <Outlet />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>


      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/50 h-[55px] pb-safe flex items-center justify-around shadow-[0_-2px_10px_rgba(124,58,237,0.05)]">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/dashboard"}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(item.href);
            }}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-center transition-all duration-300 w-11 h-11",
                isActive
                  ? "text-white bg-[#7C3AED] rounded-xl shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
              )
            }
          >
            {({ isActive }) => (
              <item.icon
                className="h-6 w-6"
                strokeWidth={isActive ? 2.5 : 2}
                {...(isActive ? { fill: "currentColor", fillOpacity: 0.16 } : {})}
              />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
