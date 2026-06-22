import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  route: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: ".tour-welcome-card",
    title: "Dashboard Command Center",
    content: "Welcome to your command center! Here you get a bird's-eye view of your brand's growth and recommendations from Tror.",
    placement: "bottom",
    route: "/dashboard"
  },
  {
    target: ".tour-dna-extract-btn",
    title: "Extract Brand DNA",
    content: "Use AI to instantly extract your Brand DNA by providing your website URL, product description, or documents. Tror will reverse-engineer your positioning, audience, and unique tone of voice.",
    placement: "left",
    route: "/dashboard/dna"
  },
  {
    target: ".tour-drive-section",
    title: "Google Drive Assets",
    content: "Connect your Google Drive to import your own custom logos, screenshots, or brand images. Tror overlays campaign text and logos directly onto these assets for automated social publishing.",
    placement: "bottom",
    route: "/dashboard/creatives"
  },
  {
    target: ".tour-campaigns-generate-btn",
    title: "Generate Campaigns",
    content: "Click 'Generate' to research custom focus areas and generate weekly campaigns. You can view platform-specific posts, customize overlay styling, and approve them to queue for publishing.",
    placement: "bottom",
    route: "/dashboard/campaigns"
  },
  {
    target: ".tour-generate-script-btn",
    title: "Script Playbook Generator",
    content: "Click 'Generate Screenplay & Video Script' to draft cinematic video scripts, hook screenplays, or podcast text based directly on your custom brand positioning variables.",
    placement: "top",
    route: "/dashboard/scripts"
  },
  {
    target: ".tour-posting-time-input",
    title: "Queue Schedule",
    content: "Set your daily posting time here. Tror will automatically publish the top post in your queue every day at this selected time.",
    placement: "bottom",
    route: "/dashboard/schedule"
  },
  {
    target: ".tour-linkedin-card",
    title: "Social Integrations",
    content: "Connect your LinkedIn profile or company pages here to publish posts directly. You can also connect Facebook, Instagram, or Reddit pages.",
    placement: "top",
    route: "/dashboard/settings"
  }
];

export function GuidedTour() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const isProgrammaticNav = useRef(false);

  // Custom event listener to trigger tour from settings
  useEffect(() => {
    const handleStartTour = () => {
      isProgrammaticNav.current = true;
      navigate("/dashboard");
      setTimeout(() => {
        isProgrammaticNav.current = true;
        setIsActive(true);
        setCurrentStep(0);
      }, 150);
    };
    window.addEventListener("start-tror-tour", handleStartTour);
    return () => window.removeEventListener("start-tror-tour", handleStartTour);
  }, [navigate]);

  // Trigger tour on tour=true search param (usually after onboarding redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tour") === "true" && user) {
      isProgrammaticNav.current = true;
      navigate("/dashboard", { replace: true });
      const timer = setTimeout(() => {
        isProgrammaticNav.current = true;
        setIsActive(true);
        setCurrentStep(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.search, user, navigate]);

  // Synchronize route when step changes programmatically
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    if (step && location.pathname !== step.route) {
      isProgrammaticNav.current = true;
      navigate(step.route);
    }
  }, [currentStep, isActive, location.pathname, navigate]);

  // Auto-sync step if user navigates manually in the sidebar
  useEffect(() => {
    if (!isActive) return;
    
    const step = TOUR_STEPS[currentStep];
    if (step && location.pathname === step.route) {
      isProgrammaticNav.current = false;
      return;
    }

    if (isProgrammaticNav.current) {
      return;
    }

    const matchedStepIndex = TOUR_STEPS.findIndex(s => s.route === location.pathname);
    if (matchedStepIndex !== -1 && matchedStepIndex !== currentStep) {
      setCurrentStep(matchedStepIndex);
    }
  }, [location.pathname, isActive, currentStep]);

  // Recalculate target rect when step, route, or window size changes
  useEffect(() => {
    if (!isActive) {
      setHighlightRect(null);
      return;
    }

    let trackingInterval: any;
    
    // Hide spotlight during transition
    setHighlightRect(null);

    const step = TOUR_STEPS[currentStep];
    
    // Wait for the 300ms page slide animation to complete
    const transitionTimer = setTimeout(() => {
      let hasScrolled = false;
      const updateRect = () => {
        if (location.pathname !== step.route) return;

        const element = document.querySelector(step.target);
        if (element) {
          if (!hasScrolled) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            hasScrolled = true;
          }
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        } else {
          setHighlightRect(null);
        }
      };

      // Initial check after transition
      updateRect();

      // Continuously update the rect for 1 second to handle layout shifts smoothly
      let elapsed = 0;
      trackingInterval = setInterval(() => {
        updateRect();
        elapsed += 100;
        if (elapsed > 1000) {
          clearInterval(trackingInterval);
        }
      }, 100);
    }, 350);

    const handleResize = () => {
      const step = TOUR_STEPS[currentStep];
      if (location.pathname !== step.route) return;
      const element = document.querySelector(step.target);
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      clearTimeout(transitionTimer);
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [currentStep, isActive, location.pathname]);

  if (!isActive || !highlightRect) return null;

  const step = TOUR_STEPS[currentStep];

  const getTooltipStyle = (): React.CSSProperties => {
    const gap = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let top = highlightRect.bottom + gap;
    let left = highlightRect.left + (highlightRect.width - tooltipWidth) / 2;

    if (step.placement === "top") {
      top = highlightRect.top - tooltipHeight - gap;
    } else if (step.placement === "left") {
      top = highlightRect.top + (highlightRect.height - tooltipHeight) / 2;
      left = highlightRect.left - tooltipWidth - gap;
    } else if (step.placement === "right") {
      top = highlightRect.top + (highlightRect.height - tooltipHeight) / 2;
      left = highlightRect.right + gap;
    }

    // Boundary protection
    left = Math.max(16, Math.min(left, winWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, winHeight - tooltipHeight - 16));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 99999
    };
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      isProgrammaticNav.current = true;
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      isProgrammaticNav.current = true;
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    localStorage.setItem(`dashboardTourCompleted_${user?.uid}`, "true");
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
      {/* Background Spotlight Cutout */}
      <div
        className="fixed border-2 border-[#7C3AED] rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.68)] pointer-events-auto transition-all duration-300"
        style={{
          top: `${highlightRect.top - 4}px`,
          left: `${highlightRect.left - 4}px`,
          width: `${highlightRect.width + 8}px`,
          height: `${highlightRect.height + 8}px`,
          zIndex: 99998
        }}
      />

      {/* Floating Tooltip Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={getTooltipStyle()}
        className="pointer-events-auto bg-slate-900 border border-[#7C3AED]/25 rounded-2xl p-5 shadow-[0_20px_50px_rgba(124,58,237,0.25)] text-white select-none relative"
      >
        <div className="absolute -inset-0.5 bg-[#7C3AED] rounded-2xl opacity-10 blur-md pointer-events-none" />

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#a78bfa] animate-pulse" />
          <h4 className="font-bold font-display text-sm text-slate-100">{step.title}</h4>
        </div>

        <p className="text-xs text-slate-350 leading-relaxed font-light mb-5">{step.content}</p>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentStep ? "bg-[#7C3AED] w-3" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-1.5 text-slate-450 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#7C3AED]/20 active:scale-95 transition-all cursor-pointer"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
