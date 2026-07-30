import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AgentSolitaireCards } from '../components/AgentSolitaireCards';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { 
  Target, ArrowRight, Sparkles, 
  CheckCircle2, MessageSquare, TrendingUp, 
  PenTool, Loader2, Zap,
  X, XCircle, Bot, ZapOff, Activity,
  Lock, Check, HelpCircle, Crown, Star
} from 'lucide-react';





const PLAN_AGENTS = {
  starter: [
    { name: "Sarah", avatar: "/agents_img/sarah.png", active: true },
    { name: "Alex", avatar: "/agents_img/alex.png", active: true },
    { name: "Chloe", avatar: "/agents_img/chloe.png", active: true },
    { name: "Julian", avatar: "/agents_img/julian.png", active: true },
    { name: "Elena", avatar: "/agents_img/elena.png", active: true },
    { name: "Arthur", avatar: "/agents_img/arthur.png", active: false },
    { name: "Maya", avatar: "/agents_img/maya.png", active: false },
    { name: "Zack", avatar: "/agents_img/zack.png", active: false },
    { name: "Victor", avatar: "/agents_img/victor.png", active: false },
    { name: "Max", avatar: "/agents_img/max.png", active: false }
  ],
  growth: [
    { name: "Sarah", avatar: "/agents_img/sarah.png", active: true },
    { name: "Alex", avatar: "/agents_img/alex.png", active: true },
    { name: "Chloe", avatar: "/agents_img/chloe.png", active: true },
    { name: "Julian", avatar: "/agents_img/julian.png", active: true },
    { name: "Elena", avatar: "/agents_img/elena.png", active: true },
    { name: "Arthur", avatar: "/agents_img/arthur.png", active: true },
    { name: "Maya", avatar: "/agents_img/maya.png", active: true },
    { name: "Zack", avatar: "/agents_img/zack.png", active: true },
    { name: "Victor", avatar: "/agents_img/victor.png", active: false },
    { name: "Max", avatar: "/agents_img/max.png", active: false }
  ],
  agency: [
    { name: "Sarah", avatar: "/agents_img/sarah.png", active: true },
    { name: "Alex", avatar: "/agents_img/alex.png", active: true },
    { name: "Chloe", avatar: "/agents_img/chloe.png", active: true },
    { name: "Julian", avatar: "/agents_img/julian.png", active: true },
    { name: "Elena", avatar: "/agents_img/elena.png", active: true },
    { name: "Arthur", avatar: "/agents_img/arthur.png", active: true },
    { name: "Maya", avatar: "/agents_img/maya.png", active: true },
    { name: "Zack", avatar: "/agents_img/zack.png", active: true },
    { name: "Victor", avatar: "/agents_img/victor.png", active: true },
    { name: "Max", avatar: "/agents_img/max.png", active: true }
  ]
};

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkNavbar, setIsDarkNavbar] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState("/whatsapp/login");
  const [isDefaultWhatsAppUrl, setIsDefaultWhatsAppUrl] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [botPhoneNumberInput, setBotPhoneNumberInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [pipelineImpressions, setPipelineImpressions] = useState(1280);

  // Early Founder Testimonials active index & auto-rotate timer
  const [activeFounderTestimonial, setActiveFounderTestimonial] = useState(0);

  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setActiveFounderTestimonial(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(testimonialTimer);
  }, []);

  // Deliverables showcase state
  const [activeDeliverable, setActiveDeliverable] = useState<'linkedin' | 'x' | 'dna' | 'graphics'>('linkedin');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHoveredDeliverable, setIsHoveredDeliverable] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying || isHoveredDeliverable) return;
    const interval = setInterval(() => {
      const order: ('linkedin' | 'x' | 'dna' | 'graphics')[] = ['linkedin', 'x', 'dna', 'graphics'];
      setActiveDeliverable(prev => {
        const idx = order.indexOf(prev);
        return order[(idx + 1) % order.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isHoveredDeliverable]);

  // Metrics animation state
  const [metrics, setMetrics] = useState({ prompts: 99, voice: 0, time: 20, channels: 0 });
  const [metricsRef, setMetricsRef] = useState<HTMLElement | null>(null);
  const [metricsVisible, setMetricsVisible] = useState(false);

  // Refs for Section 5 Mascot split refraction bleed interaction
  const section5Ref = React.useRef<HTMLDivElement>(null);
  const mascotTopRef = React.useRef<HTMLImageElement>(null);
  const mascotBottomRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!section5Ref.current || !mascotTopRef.current || !mascotBottomRef.current) return;
    
    const ctx = gsap.context(() => {
      // Diagonal split lock-in entrance on scroll
      gsap.fromTo(mascotTopRef.current,
        { x: -60, y: -60, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 1.6,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section5Ref.current,
            start: "top 80%"
          }
        }
      );

      gsap.fromTo(mascotBottomRef.current,
        { x: 60, y: 60, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 1.6,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section5Ref.current,
            start: "top 80%"
          }
        }
      );

      // Text lines fade in stagger
      gsap.fromTo(".gsap-reveal-text", 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1.2, 
          stagger: 0.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: section5Ref.current,
            start: "top 75%"
          }
        }
      );
    }, section5Ref);

    // Mouse interactive split refraction drift
    const handleMouseMove = (e: MouseEvent) => {
      if (!section5Ref.current || !mascotTopRef.current || !mascotBottomRef.current) return;
      const rect = section5Ref.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

      // Top-left slice drifts slightly differently than bottom-right slice to create refraction
      gsap.to(mascotTopRef.current, {
        x: mouseX * -25 - 6,
        y: mouseY * -25 - 6,
        rotation: mouseX * -3,
        duration: 1,
        ease: "power2.out"
      });

      gsap.to(mascotBottomRef.current, {
        x: mouseX * -25 + 6,
        y: mouseY * -25 + 6,
        rotation: mouseX * -3,
        duration: 1,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      if (!mascotTopRef.current || !mascotBottomRef.current) return;
      // Snap back to clean lock-in
      gsap.to([mascotTopRef.current, mascotBottomRef.current], {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 1.2,
        ease: "power4.out"
      });
    };

    const container = section5Ref.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      ctx.revert();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      // Evaluate sections under the navbar header (navCheckY = 60px)
      const navCheckY = 60;
      const sections = document.querySelectorAll('[data-nav-theme]');
      let foundTheme = 'dark'; // default to dark for hero top

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= navCheckY && rect.bottom >= navCheckY) {
          foundTheme = sec.getAttribute('data-nav-theme') || 'dark';
        }
      });

      setIsDarkNavbar(foundTheme === 'dark');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount

    // Fetch dynamic onboarding WhatsApp link
    fetch('/api/whatsapp/public-link')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setWhatsappUrl(data.url);
        }
        setIsDefaultWhatsAppUrl(!!data.isDefault);
      })
      .catch(err => {
        console.error("Failed to load WhatsApp link", err);
        setIsDefaultWhatsAppUrl(true);
      });

    // Hero Mockup step loop
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 5);
    }, 3000);

    // Impressions ticker loop
    const tickerInterval = setInterval(() => {
      setPipelineImpressions(prev => prev + Math.floor(Math.random() * 8) + 3);
    }, 1500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(stepInterval);
      clearInterval(tickerInterval);
    };
  }, []);

  useEffect(() => {
    if (!metricsRef) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setMetricsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(metricsRef);
    return () => observer.disconnect();
  }, [metricsRef]);

  useEffect(() => {
    if (!metricsVisible) return;
    
    // Animate prompts from 99 to 0
    let promptVal = 99;
    const pInterval = setInterval(() => {
      if (promptVal > 0) {
        promptVal = Math.max(0, promptVal - 3);
        setMetrics(prev => ({ ...prev, prompts: promptVal }));
      } else {
        clearInterval(pInterval);
      }
    }, 30);

    // Animate voice from 0 to 98.7
    let voiceVal = 0;
    const vInterval = setInterval(() => {
      if (voiceVal < 98.7) {
        voiceVal = Math.min(98.7, voiceVal + 2.5);
        setMetrics(prev => ({ ...prev, voice: parseFloat(voiceVal.toFixed(1)) }));
      } else {
        clearInterval(vInterval);
      }
    }, 25);

    // Animate setup time from 20 to 3
    let timeVal = 20;
    const tInterval = setInterval(() => {
      if (timeVal > 3) {
        timeVal = Math.max(3, timeVal - 1);
        setMetrics(prev => ({ ...prev, time: timeVal }));
      } else {
        clearInterval(tInterval);
      }
    }, 40);

    // Animate channels from 0 to 5
    let channelsVal = 0;
    const cInterval = setInterval(() => {
      if (channelsVal < 5) {
        channelsVal += 1;
        setMetrics(prev => ({ ...prev, channels: channelsVal }));
      } else {
        clearInterval(cInterval);
      }
    }, 150);

    return () => {
      clearInterval(pInterval);
      clearInterval(vInterval);
      clearInterval(tInterval);
      clearInterval(cInterval);
    };
  }, [metricsVisible]);


  const handleQuickSetupInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botPhoneNumberInput.trim()) {
      setLinkError("Please enter your WhatsApp bot number first.");
      return;
    }
    const cleanNum = botPhoneNumberInput.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 8) {
      setLinkError("Invalid formatting. Please enter numbers containing your country code.");
      return;
    }

    setIsLinking(true);
    setLinkError("");
    try {
      const response = await fetch('/api/whatsapp/quick-setup-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botPhoneNumber: cleanNum })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to link number. Please make sure your server is running.");
      }
      setWhatsappUrl(data.url);
      setIsDefaultWhatsAppUrl(false);
      setLinkSuccess(true);
      setTimeout(() => {
        setShowSetupModal(false);
        setLinkSuccess(false);
        setBotPhoneNumberInput("");
        window.open(data.url, '_blank');
      }, 1500);
    } catch (err: any) {
      setLinkError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLinking(false);
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans selection:bg-[#7C3AED]/30 selection:text-[#7C3AED] overflow-x-hidden relative">
      
      {/* 1. NAVIGATION BAR (Smart Translucent Glass Theme Transition) */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? (isDarkNavbar 
              ? 'bg-transparent border-b border-white/10 py-3.5 backdrop-blur-md text-white' 
              : 'bg-transparent border-b border-slate-900/10 py-3.5 backdrop-blur-md text-slate-900')
          : 'bg-transparent py-5 text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 group shrink-0">
              <img src="/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className={`text-xl tracking-tight font-display font-bold transition-colors duration-300 ${isDarkNavbar ? 'text-white' : 'text-slate-900'}`}>BrandToPost</span>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Clean Corporate Founder Mode Navbar Link */}
              <Link 
                to="/master-founder" 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shrink-0 ${
                  isDarkNavbar 
                    ? 'bg-white/5 border border-[#C084FC]/40 text-purple-200 hover:bg-white/10'
                    : 'bg-purple-50 border border-purple-300 text-purple-950 hover:bg-purple-100'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isDarkNavbar ? 'text-[#C084FC]' : 'text-purple-700'}`} />
                <span>Founder Mode</span>
              </Link>

              <Link to="/blog" className={`text-sm font-medium transition-colors duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Blog</Link>
              <Link to="/login" className={`text-sm font-medium transition-colors hidden md:block duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Sign In</Link>
              <Link to="/login?mode=signup" className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all hover:bg-[#6D28D9] bg-[#7C3AED] text-white shadow-sm whitespace-nowrap">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. PROFESSIONAL HERO SECTION (Dark Theme Contrast - Left-Aligned & Mirror Video Background) */}
      <section data-nav-theme="dark" className="relative w-full min-h-screen pt-36 pb-24 px-6 lg:px-8 flex items-center bg-[#08080C] border-b border-slate-950 overflow-hidden">
        
        {/* Mirror Background Video (Horizontal flip using scaleX(-1)) */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          >
            <source src="/hero-section-vid.mp4" type="video/mp4" />
          </video>
          {/* Readability Overlay Gradient (Dark gradient on left for contrast with white text, fading to transparent on the right) */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
        </div>

        {/* Hero Copy Content Container */}
        <div className="max-w-7xl mx-auto w-full relative z-10 text-left">
          <div className="max-w-3xl space-y-6">
            
            {/* Main Headline */}
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extralight tracking-tight leading-[1.1] font-display"
              style={{ color: '#FFFFFF', fontWeight: 200 }}
            >
              If Your Content Could Be Anyone’s, <br />
              <span style={{ color: '#C084FC', fontWeight: 300 }}>Your Brand Is No One’s.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-base sm:text-xl font-light leading-relaxed max-w-2xl pt-2" style={{ color: '#E2E8F0' }}>
              Agents transform your ideas, expertise, and brand DNA into daily content for your profile, your company, and your clients.
            </p>
            
            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row justify-start items-center gap-4 pt-3">
              <Link to="/login?mode=signup" className="group flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all shadow-sm w-full sm:w-auto text-center">
                Start Your Brand DNA
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href={isDefaultWhatsAppUrl ? "#" : whatsappUrl}
                onClick={(e) => {
                  if (isDefaultWhatsAppUrl) {
                    e.preventDefault();
                    setShowSetupModal(true);
                  }
                }}
                {...(!isDefaultWhatsAppUrl && whatsappUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-sm transition-all shadow-sm w-full sm:w-auto"
              >
                See How It Works
              </a>
            </div>

            {/* Clean Corporate Founder Mode Callout Banner */}
            <div className="pt-2">
              <Link 
                to="/master-founder" 
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs font-normal text-slate-300 hover:text-white transition-all group shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]" />
                <span>Building a personal founder brand?</span>
                <span className="text-[#C084FC] font-semibold group-hover:underline flex items-center gap-1">
                  Try Founder Mode <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Trusted Company Logos Row (Spreads Across Full Max-W-7XL Width) */}
          <div className="pt-10 sm:pt-14 border-t border-white/10 mt-12 sm:mt-16 w-full max-w-7xl">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block mb-6 text-left">TRUSTED BY FOUNDERS & CATEGORY LEADERS</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 items-center justify-items-center gap-8 sm:gap-12 lg:gap-16">
              <img src="/MINIM-logo-primary.png" alt="MINIM" className="max-h-10 sm:max-h-14 md:max-h-16 lg:max-h-20 w-auto object-contain brightness-125 hover:opacity-100 opacity-80 transition-opacity" />
              <img src="/aimlpartner_logo.png" alt="AIMLPARTNER" className="max-h-12 sm:max-h-16 md:max-h-20 lg:max-h-24 w-auto object-contain brightness-125 hover:opacity-100 opacity-80 transition-opacity" />
              <img src="/superherogym_logo.png" alt="SUPERHERO GYM" className="max-h-11 sm:max-h-15 md:max-h-18 lg:max-h-22 w-auto object-contain brightness-125 hover:opacity-100 opacity-80 transition-opacity" />
              <img src="/weareknwn_logo.png" alt="WEAREKNWN" className="max-h-10 sm:max-h-14 md:max-h-16 lg:max-h-20 w-auto object-contain brightness-125 hover:opacity-100 opacity-80 transition-opacity" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. THE MANUAL VS AUTONOMOUS CONTRAST (Enterprise Typographic Presentation with Flowing Wave Art) */}
      <section data-nav-theme="light" className="py-28 md:py-36 w-full px-6 md:px-16 lg:px-24 bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left overflow-hidden">
        
        {/* Style block for path morphing and line animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes wave-morph-1 {
            0%, 100% { d: path("M0,60 C30,45 45,70 65,55 C85,40 90,65 100,50 L100,100 L0,100 Z"); }
            50% { d: path("M0,50 C25,65 35,50 60,65 C85,80 95,55 100,60 L100,100 L0,100 Z"); }
          }
          @keyframes wave-morph-2 {
            0%, 100% { d: path("M0,58 C30,48 40,68 60,53 C80,38 90,63 100,48"); }
            50% { d: path("M0,48 C25,63 35,48 60,63 C85,78 95,53 100,58"); }
          }
          .animate-wave-morph-fill {
            animation: wave-morph-1 16s ease-in-out infinite;
          }
          .animate-wave-morph-line {
            animation: wave-morph-2 20s ease-in-out infinite;
          }
        `}} />

        {/* Flowing Wave Vector Art Background */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <svg className="absolute w-[120%] h-[120%] -bottom-10 -left-[10%] opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="flow-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#2583EB" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#2583EB" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Morphing filled wave surface */}
            <path 
              d="M0,60 C30,45 45,70 65,55 C85,40 90,65 100,50 L100,100 L0,100 Z" 
              fill="url(#flow-wave-grad)"
              className="animate-wave-morph-fill"
            />
            {/* Morphing delicate trace line */}
            <path 
              d="M0,58 C30,48 40,68 60,53 C80,38 90,63 100,48" 
              fill="none" 
              stroke="url(#flow-line-grad)" 
              strokeWidth="0.8"
              className="animate-wave-morph-line"
            />
          </svg>
        </div>

        <div className="w-full mx-auto max-w-7xl relative z-10">
          
          {/* Section Heading */}
          <div className="max-w-4xl mb-16">
            <span className="text-xs font-sans font-semibold tracking-wider text-[#7C3AED] block mb-3 uppercase">The Problem With Today's Content</span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05] text-slate-900">
              Why Your Content <br />
              <span className="font-normal italic text-[#7C3AED]">Feels Like AI Slop.</span>
            </h2>
          </div>

          {/* 6 Direct Problem Bullets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">01 — Template Conformity</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Generic AI Outputs</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Your posts all sound the same, like they came from the same generic AI template — no personality, no story, no competitive edge.
              </p>
            </div>

            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">02 — Tool Friction</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Tool Juggling & Blank Canvas</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                You’re starting from a blank page every day, or juggling Notion docs, Google Docs, and Slack threads to piece together something "good enough."
              </p>
            </div>

            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">03 — Agency Drift</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Agency Prompt Copy-Pasting</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Agencies are copy-pasting prompts across clients; everything looks like a slightly tweaked version of the last campaign.
              </p>
            </div>

            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">04 — Inconsistent Frequency</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Burst Posting & Disappearing</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Founders and operators post in bursts, then disappear for weeks because "content day" keeps losing priority to real work.
              </p>
            </div>

            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">05 — Editing Bottleneck</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Endless Editing Overhead</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Your team spends hours editing AI output to make it sound human, only to still ship content that your audience scrolls past.
              </p>
            </div>

            <div className="border-t border-slate-900/10 pt-6 space-y-2">
              <span className="text-xs font-sans font-medium text-slate-400 block mb-1 tracking-wide uppercase">06 — Brand Fragmentation</span>
              <h3 className="text-lg font-display font-medium text-slate-900">Disconnected Brand Voice</h3>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                No one inside the company owns the full brand story, so every channel — website, LinkedIn, email, ads — feels disconnected and random.
              </p>
            </div>

          </div>

          {/* Corporate Pull Quote */}
          <div className="mt-14 p-8 rounded-xl bg-white border border-slate-200/80 shadow-sm text-left">
            <p className="text-xl sm:text-2xl font-display font-light text-slate-900 italic leading-snug">
              “Are you consistent? Or is your brand invisible between launches, meetings, and investor calls?”
            </p>
          </div>

        </div>
      </section>

      {/* 3.5. EARLY CREATIVE ANIMATED FOUNDER PROOF & TESTIMONIALS (EDITORIAL CANVAS) */}
      <section data-nav-theme="dark" className="py-24 md:py-32 w-full bg-[#08080C] text-white border-y border-white/10 relative z-10 text-left overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10">
          
          {/* Header */}
          <div className="max-w-3xl mb-16 space-y-3">
            <span className="text-xs font-sans font-semibold tracking-wider text-slate-400 uppercase block">
              Founder Proof & Case Studies
            </span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-white leading-tight" style={{ color: '#FFFFFF' }}>
              Proven Results. <br />
              <span className="font-normal italic text-slate-300">Zero Empty Promises.</span>
            </h2>
            <p className="text-base text-slate-400 font-light leading-relaxed max-w-2xl pt-1">
              Real growth metrics and unedited word-of-mouth feedback from founders who stopped writing manual posts and deployed our AI doppelganger engine.
            </p>
          </div>

          {/* Interactive Editorial Founder Showcase Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch border-t border-b border-white/10 py-10">
            
            {/* Left: Founder Story Selector Column */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2 border-r border-white/10 pr-0 lg:pr-8">
              {[
                { 
                  name: "Alex Rivera", 
                  role: "Founder & CEO • MINIM", 
                  metric: "+340% Inbound Demos",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"
                },
                { 
                  name: "Sarah Chen", 
                  role: "Co-Founder • AIMLPARTNER", 
                  metric: "2-Min Monday Review",
                  avatar: "/agents_img/sarah.png"
                },
                { 
                  name: "Marcus Vance", 
                  role: "Founder • Superhero Gym", 
                  metric: "Saved $6,000 / mo",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
                },
                { 
                  name: "David K.", 
                  role: "Managing Director • WEAREKNWN", 
                  metric: "+410% Impression Reach",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
                }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFounderTestimonial(idx)}
                  className={`w-full py-3.5 px-4 text-left transition-all flex items-center justify-between cursor-pointer border-l-2 ${
                    activeFounderTestimonial === idx
                      ? 'border-white bg-white/[0.04] text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-full object-cover grayscale opacity-90" />
                    <div>
                      <h4 className="text-sm font-medium text-white" style={{ color: '#FFFFFF' }}>{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{item.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300">
                    {item.metric}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Active Animated Testimonial Canvas */}
            <div className="lg:col-span-7 flex flex-col justify-between relative pl-0 lg:pl-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFounderTestimonial}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8 relative z-10"
                >
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>CASE STUDY 0{activeFounderTestimonial + 1}</span>
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Founder Metrics
                    </span>
                  </div>

                  {/* Quote Content */}
                  <p className="text-xl sm:text-2xl font-light font-display leading-snug text-slate-100 italic">
                    {activeFounderTestimonial === 0 && (
                      <>"We went from posting once every 3 weeks to <strong className="font-semibold not-italic text-white">5 high-converting posts a week</strong> on LinkedIn and X. Our inbound demos jumped by <span className="underline decoration-white/40 underline-offset-4 font-semibold not-italic text-white">+340% in 30 days</span> without me spending a single hour drafting copy."</>
                    )}
                    {activeFounderTestimonial === 1 && (
                      <>"The <strong className="font-semibold not-italic text-white">2-minute Monday approval deck</strong> is a total game changer. I review the queued campaign deck on my phone, click Approve All, and our channels run on autopilot. <span className="underline decoration-white/40 underline-offset-4 font-semibold not-italic text-white">Nothing posts without my green light.</span>"</>
                    )}
                    {activeFounderTestimonial === 2 && (
                      <>"I used to pay an agency <strong className="font-semibold not-italic text-white">$6,000/month for generic posts</strong> that got 5 likes. BrandToPost's Arthur voice clone captures my exact founder story and positioning for a fraction of the cost."</>
                    )}
                    {activeFounderTestimonial === 3 && (
                      <>"Our organic LinkedIn impressions <strong className="font-semibold not-italic text-white">quadrupled in 3 weeks</strong>. The market research agents pull actual customer pain points directly into copy that converts."</>
                    )}
                  </p>

                  {/* Founder Profile Details */}
                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-medium text-base text-white" style={{ color: '#FFFFFF' }}>
                        {activeFounderTestimonial === 0 && "Alex Rivera"}
                        {activeFounderTestimonial === 1 && "Sarah Chen"}
                        {activeFounderTestimonial === 2 && "Marcus Vance"}
                        {activeFounderTestimonial === 3 && "David K."}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {activeFounderTestimonial === 0 && "CEO • MINIM SaaS"}
                        {activeFounderTestimonial === 1 && "Co-Founder • AIMLPARTNER"}
                        {activeFounderTestimonial === 2 && "Founder • Superhero Gym"}
                        {activeFounderTestimonial === 3 && "Managing Director • WEAREKNWN"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>
                        {activeFounderTestimonial === 0 && "+340% Demos"}
                        {activeFounderTestimonial === 1 && "2 Mins / Wk"}
                        {activeFounderTestimonial === 2 && "$6,000 / Mo Saved"}
                        {activeFounderTestimonial === 3 && "+410% Reach"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Verified Impact</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

            </div>

          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 text-left">
            <div>
              <span className="text-3xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>+340%</span>
              <span className="text-xs text-slate-400 font-mono">Avg Inbound Demo Growth</span>
            </div>
            <div>
              <span className="text-3xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>2 Mins</span>
              <span className="text-xs text-slate-400 font-mono">Weekly Founder Review Time</span>
            </div>
            <div>
              <span className="text-3xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>$6,000</span>
              <span className="text-xs text-slate-400 font-mono">Avg Monthly Agency Savings</span>
            </div>
            <div>
              <span className="text-3xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>100%</span>
              <span className="text-xs text-slate-400 font-mono">Human Voice Authenticity</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. SOLUTION: FROM RANDOM POSTS TO BRAND DNA */}
      <section data-nav-theme="dark" className="py-24 md:py-32 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          
          <div className="max-w-3xl mb-16 space-y-4">
            <span className="text-xs font-sans font-semibold tracking-wider uppercase block mb-3 text-slate-400">
              The Solution
            </span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              From Random Posts <br />
              <span className="font-normal italic text-slate-300">To Brand DNA.</span>
            </h2>
            <p className="text-base sm:text-lg font-light leading-relaxed max-w-2xl pt-2" style={{ color: '#E2E8F0' }}>
              BrandToPost is a content operating system built around your personal and company DNA. Instead of generating generic AI copy, it captures how you think, speak, and sell — then uses agents to create daily content and research tailored to that DNA across all your channels.
            </p>
          </div>

          {/* 4 Key Value Bullets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            <div className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-xl space-y-3 transition-colors">
              <span className="text-xs font-sans font-semibold tracking-wide uppercase block text-slate-400">01 — Brand Architecture</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Personal & Company DNA Engine</h3>
              <p className="text-sm font-light leading-relaxed text-slate-300">
                Capture your tone, story, values, offers, examples, and customer language once — our DNA engine becomes your always‑on brand brain.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-xl space-y-3 transition-colors">
              <span className="text-xs font-sans font-semibold tracking-wide uppercase block text-slate-400">02 — Multi-Channel Distribution</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Multi‑Channel High-Signal Output</h3>
              <p className="text-sm font-light leading-relaxed text-slate-300">
                Turn your DNA into posts, threads, emails, landing copy, scripts, and visuals that sound like you and match your market, not like generic AI outputs.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-xl space-y-3 transition-colors">
              <span className="text-xs font-sans font-semibold tracking-wide uppercase block text-slate-400">03 — Autonomous Consistency</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Agent‑Driven Consistency</h3>
              <p className="text-sm font-light leading-relaxed text-slate-300">
                Autonomous agents analyze performance, trends, and audience reactions, then propose and generate daily content so you never “fall off” again.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-xl space-y-3 transition-colors">
              <span className="text-xs font-sans font-semibold tracking-wide uppercase block text-slate-400">04 — Market Intelligence</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Built‑in Market Intelligence</h3>
              <p className="text-sm font-light leading-relaxed text-slate-300">
                Each piece of content is informed by ongoing research on your ICP, competitors, and industry — you get sharp, relevant messaging, not filler.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. TAILORED USE CASES: AGENCIES, STARTUPS & EXPERTS */}
      <section data-nav-theme="light" className="py-28 md:py-36 w-full px-6 md:px-16 lg:px-24 bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Use Case 1: Agencies */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-sans tracking-wider text-[#7C3AED] uppercase block font-semibold">For Marketing Agencies</span>
              <h2 className="text-3xl sm:text-5xl font-light font-display tracking-tight text-slate-900 leading-tight">
                Agencies: One Place <br />
                <span className="font-normal italic text-[#7C3AED]">For All Your Clients.</span>
              </h2>
              <div className="pt-2 space-y-2 text-xs font-sans text-slate-500">
                <p className="border-l-2 border-[#7C3AED] pl-3 font-light">“Every client, a distinct voice — not a recycled prompt.”</p>
                <p className="border-l-2 border-[#7C3AED] pl-3 font-light">“Scale content without scaling genericness.”</p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Multi-Client Workspaces</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Run multiple brands and clients from a single workspace, each with its own DNA and content agents.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Structured Agent Workflows</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Swap “prompt‑and‑pray” workflows for a structured system: strategy in the DNA, execution by agents, editing by your team.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Faster Campaign Launches</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Launch campaigns, nurture sequences, and social calendars faster, with outputs that feel bespoke to each client instead of AI‑generated templates.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Defendable Premium Service</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Show clients not just content, but the underlying brand DNA and research that drives it — this becomes a defendable, premium service line.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Use Case 2: Startups */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-sans tracking-wider text-[#7C3AED] uppercase block font-semibold">For Startups & Operators</span>
              <h2 className="text-3xl sm:text-5xl font-light font-display tracking-tight text-slate-900 leading-tight">
                Startups: Stay Visible <br />
                <span className="font-normal italic text-[#7C3AED]">While You Build.</span>
              </h2>
              <div className="pt-2 space-y-2 text-xs font-sans text-slate-500">
                <p className="border-l-2 border-[#7C3AED] pl-3 font-light">“Ship product and content at the same time.”</p>
                <p className="border-l-2 border-[#7C3AED] pl-3 font-light">“Your brand shouldn’t go quiet between releases.”</p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Living Founder Narrative</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Turn your founding story, product insight, and customer learnings into a living DNA that agents use to publish for you daily.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Unified Multi-Channel Alignment</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Align website, investor updates, launch posts, and customer education around one consistent narrative.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Turn Progress into Content</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Replace “we’ll write later” with a system that turns each day’s progress into content your users, investors, and team can see.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Portable Brand Story</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Never rely on a junior marketer to “figure out” your voice from random docs again — DNA makes your brand portable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Use Case 3: Experts & Founders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-sans tracking-wider text-[#7C3AED] uppercase block font-semibold">For Founders & Experts</span>
              <h2 className="text-3xl sm:text-5xl font-light font-display tracking-tight text-slate-900 leading-tight">
                Experts: Own Your <br />
                <span className="font-normal italic text-[#7C3AED]">Public Voice.</span>
              </h2>
              <div className="pt-2 p-4 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/20 text-xs font-display text-slate-800 italic">
                “Users love reading your point of view. Someone out there is waiting for your next post. Don’t let ‘I’ll write later’ kill your brand.”
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Authentic Public Persona</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Build a public persona that feels like you, not like a ghostwritten thought‑leader template.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Framework & Story Remixing</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Capture your opinions, frameworks, and stories; agents remix them into posts, newsletters, and scripts that stay true to your point of view.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Burnout-Free Consistency</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Show up daily without burning out: your DNA drives the ideas, agents draft them, you approve in minutes.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h4 className="font-display font-medium text-slate-900 text-base">Follow the Real You</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Let people follow *you* — your style, your blunt takes, your niche expertise — instead of another polished but forgettable voice.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. HOW BRANDTOPOST WORKS (3-Step Flow) */}
      <section data-nav-theme="dark" className="py-24 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-sans font-semibold tracking-wider uppercase block mb-3 text-slate-400">
              Simple Workflow
            </span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              How BrandToPost <br />
              <span className="font-normal italic text-slate-300">Actually Works.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <div className="border border-white/10 bg-white/[0.02] p-8 rounded-xl space-y-3 relative">
              <span className="text-xs font-sans uppercase font-semibold tracking-wide block text-slate-400">Step 01 — Setup</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>1. Create Your DNA Sheet</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Answer guided questions, upload past content, and connect your channels. We map your tone, story, offers, and audience into a structured personal + company DNA graph.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.04] p-8 rounded-xl space-y-3 relative">
              <span className="text-xs font-sans uppercase font-semibold tracking-wide block text-slate-400">Step 02 — Channels</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>2. Connect Distribution Channels</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Plug in LinkedIn, X, email, blogs, and other outputs. Set your posting cadence, content themes, and goals (lead gen, authority, nurture, launches).
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-8 rounded-xl space-y-3 relative">
              <span className="text-xs font-sans uppercase font-semibold tracking-wide block text-emerald-400">Step 03 — Autopilot</span>
              <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>3. Autonomous Agent Execution</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Agents propose daily content and campaigns based on your DNA + live market research. You review, approve, or tweak — and the system learns from what you ship.
              </p>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link to="/login?mode=signup" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all shadow-sm">
              Build My Brand DNA
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* UNDER CONSTRUCTION & HEAVY ENGINEERING SUITE */}
      <section data-nav-theme="dark" className="py-24 md:py-32 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        {/* Subtle Traffic Caution Grid Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 opacity-80" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10">
          
          {/* Status Header Badge & Title */}
          <div className="max-w-3xl mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-sans font-semibold tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>🚧 Active Engineering & Construction Zone</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              3 Next-Gen Modules <br />
              <span className="font-normal italic text-amber-400">Under Active Construction.</span>
            </h2>

            <p className="text-base sm:text-lg font-light leading-relaxed max-w-2xl text-slate-300">
              We’re shipping fast. Our engineering team is calibrating these 3 power modules under strict security lockdown before public unlock.
            </p>
          </div>

          {/* 3 Creative Traffic Construction Cards: WhatsApp, Script Studio, Visual Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Card 1: WhatsApp Bot */}
            <div className="border border-white/10 bg-white/[0.03] p-8 rounded-2xl space-y-4 relative group hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    📱
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-sans font-semibold tracking-wide uppercase">
                    🚧 Under Construction
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-semibold text-emerald-400 uppercase tracking-wider block">MODULE 01 — MOBILE COMMAND</span>
                  <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>WhatsApp Autonomous Bot</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-300">
                    Command your 10-agent team via WhatsApp voice notes. Approve Monday campaign decks and auto-publish from your pocket with 1-tap quick replies.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-[11px] font-sans text-slate-400 flex items-center justify-between">
                <span>Status: API Webhooks Calibrating</span>
                <span className="text-emerald-400 font-medium">Q3 Release</span>
              </div>
            </div>

            {/* Card 2: Script Studio */}
            <div className="border border-amber-500/30 bg-amber-950/10 p-8 rounded-2xl space-y-4 relative shadow-lg shadow-amber-500/5 group hover:border-amber-400 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg">
                    🎬
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-sans font-semibold tracking-wide uppercase">
                    🔒 Lab Locked
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-semibold text-amber-300 uppercase tracking-wider block">MODULE 02 — VIDEO ENGINE</span>
                  <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Script Studio & B2B Screenwriter</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-200">
                    Zack (Video Screenwriter) auto-generates B2B video scripts, Luma/Sora B-roll prompts, scene timing, and objection handling hooks.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-amber-500/20 text-[11px] font-sans text-slate-300 flex items-center justify-between">
                <span>Status: Screenplay Engine Locked</span>
                <span className="text-amber-400 font-medium">In Calibration</span>
              </div>
            </div>

            {/* Card 3: Visual Canvas Editor */}
            <div className="border border-white/10 bg-white/[0.03] p-8 rounded-2xl space-y-4 relative group hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg">
                    🎨
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-sans font-semibold tracking-wide uppercase">
                    🚧 Under Construction
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-semibold text-purple-400 uppercase tracking-wider block">MODULE 03 — GRAPHIC CANVAS</span>
                  <h3 className="text-xl font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Visual Graphic Canvas Editor</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-300">
                    Chloe & Julian headless graphics engine for custom brand overlays, dynamic layout cards, typography specs, and PNG export templates.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-[11px] font-sans text-slate-400 flex items-center justify-between">
                <span>Status: Canvas v3 Renderer Sealed</span>
                <span className="text-purple-400 font-medium">Coming Soon</span>
              </div>
            </div>

          </div>

          {/* Waitlist Callout Box */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-left">
              <h4 className="text-lg font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Want early beta access to our Under Construction Suite?</h4>
              <p className="text-xs text-slate-300 font-light">Join the construction waitlist to get early developer access when these modules unlock.</p>
            </div>
            
            <a 
              href={isDefaultWhatsAppUrl ? "#" : whatsappUrl}
              onClick={(e) => {
                if (isDefaultWhatsAppUrl) {
                  e.preventDefault();
                  setShowSetupModal(true);
                }
              }}
              target={isDefaultWhatsAppUrl ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>🚧 Request Beta Access</span>
            </a>
          </div>

        </div>
      </section>

      {/* 7. WHY THIS BEATS "JUST USING AI" (Not Another AI Content Button) */}
      <section data-nav-theme="light" className="py-24 md:py-32 w-full bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono tracking-widest text-[#7C3AED] uppercase block font-semibold">THE UNFAIR ADVANTAGE</span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-slate-900 leading-tight">
              Not Another <br />
              <span className="font-normal italic text-[#7C3AED]">AI Content Button.</span>
            </h2>
            <div className="space-y-4 text-sm text-slate-600 font-light leading-relaxed">
              <p>
                Most AI tools optimize for speed and volume, not quality or authenticity — that’s how AI slop took over feeds and search.
              </p>
              <p>
                BrandToPost optimizes for <strong className="text-slate-900 font-medium">you</strong>: your voice, your brand, your market position, and your audience’s trust.
              </p>
              <p>
                Instead of prompt-vomit, you get a persistent content brain trained on your DNA and guided by agents that care about performance and coherence. You stay in control: approve, decline, or edit every output.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Contrast Box */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md space-y-6">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-mono space-y-1">
                <span className="font-bold text-rose-600 uppercase">Generic AI Tools</span>
                <p className="text-slate-700">“Write a LinkedIn post about X.”</p>
              </div>

              <div className="p-4 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-xs font-mono space-y-1">
                <span className="font-bold text-[#7C3AED] uppercase">BrandToPost DNA System</span>
                <p className="text-slate-900 font-semibold">“Publish from MY DNA about X, for MY audience, with MY positioning.”</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. WHAT YOU GET EVERY WEEK */}
      <section data-nav-theme="dark" className="py-24 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-sans font-semibold tracking-wider uppercase block mb-3 text-slate-400">
              Compounding Brand Asset
            </span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              What You Get <br />
              <span className="font-normal italic text-slate-300">Every Single Week.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="border border-white/10 bg-white/5 p-6 rounded-xl space-y-2">
              <h4 className="font-display font-medium text-white text-base" style={{ color: '#FFFFFF' }}>Daily Multi-Channel Calendar</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                A calendar of daily posts across your key channels, all rooted directly in your DNA.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 rounded-xl space-y-2">
              <h4 className="font-display font-medium text-white text-base" style={{ color: '#FFFFFF' }}>Human Experience Copy</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Content that sounds like a real person with real experience — not a bot guessing what “professional” means.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 rounded-xl space-y-2">
              <h4 className="font-display font-medium text-white text-base" style={{ color: '#FFFFFF' }}>Research-Backed ICP Messaging</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Research‑backed messaging that positions you clearly against competitors and speaks directly to your ICP.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 rounded-xl space-y-2">
              <h4 className="font-display font-medium text-white text-base" style={{ color: '#FFFFFF' }}>Clear Idea & Format Visibility</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                See which ideas, formats, and narratives land, and let agents double down on what works.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 rounded-xl space-y-2 md:col-span-2 lg:col-span-2">
              <h4 className="font-display font-medium text-white text-base" style={{ color: '#FFFFFF' }}>Compounding DNA Asset</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                A growing, compounding brand asset — your DNA — that makes every future campaign faster, sharper, and more authentic.
              </p>
            </div>
          </div>

          <div className="mt-12 text-left">
            <Link to="/login?mode=signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-base transition-all hover:scale-105 shadow-lg shadow-[#7C3AED]/20">
              Get Consistent, Non‑Slop Content
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. MEET TROR: THE MASTER ORCHESTRATOR (Sleek Modernist Cropped Bleed Stage) */}
      <section 
        data-nav-theme="dark"
        ref={section5Ref} 
        className="py-32 md:py-48 w-full bg-black text-left relative z-10 border-y border-white/[0.05] overflow-hidden min-h-[500px] lg:min-h-[650px] flex items-center"
      >
        <div className="w-full mx-auto max-w-7xl px-6 md:px-16 lg:px-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* Left Column: Stark Typographic Statement & Elite Styled Copywriting */}
          <div className="lg:col-span-7 space-y-8 select-none relative z-20">
            <span className="text-xs font-sans font-semibold tracking-wider text-slate-400 uppercase block mb-3">The Single Orchestrator</span>
            <h2 className="gsap-reveal-text text-4xl md:text-6xl font-light font-display text-white tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
              Managing 5 Different Tools <br />
              <span className="font-normal italic text-slate-300">Is Ruining Your Focus.</span>
            </h2>
            <div className="space-y-6 max-w-xl gsap-reveal-text">
              <p className="text-xl md:text-2xl text-slate-200 font-light tracking-wide leading-snug">
                Meet <span className="font-semibold text-white">TROR</span>. The quiet brain of your AI marketing team.
              </p>
              <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed border-l-2 border-white/20 pl-5">
                Stop switching between ChatGPT, Canva, Buffer, and Notion. TROR coordinates your entire 10-specialist network behind the scenes—locking your brand voice, running web research, rendering graphics, and managing schedules automatically.
              </p>
            </div>
          </div>

          {/* Right Column: Giant Cropped Mascot Bleed with Split Refraction Slices */}
          <div className="lg:col-span-5 w-full flex justify-end items-end relative h-[300px] lg:h-full lg:absolute lg:top-0 lg:right-0 lg:w-[45%] pointer-events-none overflow-visible">
            
            {/* Top-Left Diagonal Slice */}
            <img 
              ref={mascotTopRef}
              src="/Mascot.png" 
              className="w-auto h-[120%] lg:h-[135%] object-contain absolute right-[-5%] bottom-[-15%] origin-bottom-right opacity-90 transition-opacity duration-300"
              style={{
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
                WebkitClipPath: "polygon(0 0, 100% 0, 0 100%)"
              }}
              alt="TROR Mascot Refraction Top" 
            />

            {/* Bottom-Right Diagonal Slice */}
            <img 
              ref={mascotBottomRef}
              src="/Mascot.png" 
              className="w-auto h-[120%] lg:h-[135%] object-contain absolute right-[-5%] bottom-[-15%] origin-bottom-right opacity-90 transition-opacity duration-300"
              style={{
                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                WebkitClipPath: "polygon(100% 0, 100% 100%, 0 100%)"
              }}
              alt="TROR Mascot Refraction Bottom" 
            />

          </div>

        </div>
      </section>

      {/* 6. AGENT SOLITAIRE CARDS */}
      <AgentSolitaireCards />

      {/* 7. THE POST GROWTH METHODOLOGY (Editorial Timeline) */}
      <section className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
        <div className="pt-24 md:pt-32 pb-12 md:pb-16 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-16 text-left">
            <p className="text-sm font-medium text-[#7C3AED] mb-4 font-sans">Growth framework</p>
            <h2 className="text-4xl md:text-7xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
              Proven POST Framework, <br />
              <span className="font-normal italic text-[#7C3AED]">Executed Daily.</span>
            </h2>
            <p className="text-base text-slate-655 max-w-xl font-light leading-relaxed">
              Organic distribution fails when content is random. Our agent network is engineered to execute the rigorous POST methodology used by category-leading brands.
            </p>
          </div>
          
          {/* Flat Editorial Typographic Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 text-left">
            {[
              { 
                l: "P", 
                t: "Positioning DNA", 
                d: "Arthur locks down your ICPs, objection maps, and unique mechanisms so copy never drifts off-brand.", 
                color: "text-[#FF7778]", // Coral
                bgLight: "rgba(255, 119, 120, 0.3)"
              },
              { 
                l: "O", 
                t: "Outreach Routing", 
                d: "Sarah searches for real-time market triggers, and Alex drafts platform-native structures tailored to algorithms.", 
                color: "text-[#2583EB]", // Blue
                bgLight: "rgba(37, 131, 235, 0.3)"
              },
              { 
                l: "S", 
                t: "Signal & Cards", 
                d: "Chloe & Julian build custom typography layouts and logo placements directly into scroll-stopping graphic cards.", 
                color: "text-[#7C3AED]", // Purple
                bgLight: "rgba(124, 58, 237, 0.3)"
              },
              { 
                l: "T", 
                t: "Traction Autopilot", 
                d: "Maya schedules drafts, and Max handles API publishing automatically, transforming content into revenue pipelines.", 
                color: "text-[#10B981]", // Green
                bgLight: "rgba(16, 185, 129, 0.3)"
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`relative space-y-4 pt-4 text-left ${
                  idx > 0 ? "lg:border-l lg:border-slate-900/10 lg:pl-8" : ""
                }`}
              >
                {/* Large Background Watermark Letter */}
                <span 
                  className={`text-8xl font-black font-display select-none leading-none block`}
                  style={{ color: item.bgLight }}
                >
                  {item.l}
                </span>

                <div className="space-y-2">
                  <h3 className="text-lg font-display font-normal text-slate-900">
                    {item.t}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    {item.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 8. CLIENT DELIVERABLES SHOWCASE (Interactive Workspace Console) */}
      <section className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10 overflow-hidden">
        {/* Flowing Wave Vector Art Background */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <svg className="absolute w-[120%] h-[120%] -bottom-10 -left-[10%] opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              d="M0,80 C30,70 50,90 70,75 C90,60 95,85 100,70 L100,100 L0,100 Z" 
              fill="url(#flow-wave-grad)"
            />
            <path 
              d="M0,78 C30,73 45,88 65,73 C85,58 95,83 100,68" 
              fill="none" 
              stroke="url(#flow-line-grad)" 
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className="pt-12 md:pt-16 pb-12 md:pb-16 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="max-w-3xl mb-16 text-left">
            <p className="text-xs font-sans font-semibold tracking-wider text-[#7C3AED] uppercase mb-3">Actual Deliverables Proof</p>
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
              No Generic Advice. <br />
              <span className="font-normal italic text-[#7C3AED]">Here Is What Your Channels Will Actually Look Like.</span>
            </h2>
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              We don't sell blank templates or prompt ebooks. Our AI team writes, designs, and formats ready-to-publish campaigns tailored specifically to your ideal clients.
            </p>
          </div>

          {/* Interactive Console Workspace Grid */}
          <div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
            onMouseEnter={() => setIsHoveredDeliverable(true)}
            onMouseLeave={() => setIsHoveredDeliverable(false)}
          >
            
            {/* Left Sidebar Menu: Flat Typographic Toggles */}
            <div className="lg:col-span-5 space-y-0 text-left border-t border-slate-900/10">
              {[
                { 
                  id: 'linkedin', 
                  num: '01', 
                  title: 'Authority Campaigns', 
                  sub: 'LinkedIn thought leadership',
                  desc: 'Crafted by Alex using hook-story-lesson sequencing and industry-proof objection counters to build voice authority.',
                  color: 'text-[#7C3AED]',
                  border: 'border-[#7C3AED]/40'
                },
                { 
                  id: 'x', 
                  num: '02', 
                  title: 'Multi-Tweet Threads', 
                  sub: 'X platform native',
                  desc: 'Punchy, hook-driven tweet sequences optimized to stop the scroll, break concepts down, and build massive traction.',
                  color: 'text-[#2583EB]',
                  border: 'border-[#2583EB]/40'
                },
                { 
                  id: 'dna', 
                  num: '03', 
                  title: 'Brand DNA Reports', 
                  sub: 'Positioning strategy',
                  desc: 'Arthur maps out your ideal customer profiles, key objections, tone rules, and decision structures so copy sounds authentic.',
                  color: 'text-[#FF7778]',
                  border: 'border-[#FF7778]/40'
                },
                { 
                  id: 'graphics', 
                  num: '04', 
                  title: 'Magazine Graphics', 
                  sub: 'Creative studio overlay',
                  desc: 'Chloe & Julian render custom background graphics and stamp your logo cleanly into high-DPI scroll-stopping card designs.',
                  color: 'text-[#10B981]',
                  border: 'border-[#10B981]/40'
                }
              ].map((item) => {
                const isActive = activeDeliverable === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveDeliverable(item.id as any);
                      setIsAutoPlaying(false); // Stop autoplay when clicked
                    }}
                    className="w-full text-left py-6 border-b border-slate-900/10 group cursor-pointer block transition-all"
                  >
                    <div className="flex justify-between items-baseline">
                      <span className={`font-sans text-xs font-bold ${isActive ? item.color : 'text-slate-400'}`}>
                        {item.num}
                      </span>
                      <span className={`font-sans text-[10px] font-light ${isActive ? item.color : 'text-slate-400'}`}>
                        {item.sub}
                      </span>
                    </div>
                    <h3 className={`text-xl font-display mt-2 ${isActive ? 'font-normal text-slate-900' : 'font-light text-slate-400'}`}>
                      {item.title}
                    </h3>
                    {isActive && (
                      <p className={`text-xs text-slate-500 leading-relaxed font-light mt-3 pl-6 border-l ${item.border}`}>
                        {item.desc}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Main Screen: High-fidelity Output Preview Container (Completely Boxless) */}
            <div className="lg:col-span-7 flex items-center min-h-[340px] relative">
              <AnimatePresence mode="wait">
                {activeDeliverable === 'linkedin' && (
                  <motion.div
                    key="linkedin"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                  >
                    {/* Realistic B2B LinkedIn Post Mockup - Flat Editorial style */}
                    <div className="pl-6 md:pl-10 border-l-2 border-[#7C3AED] py-2 max-w-xl mx-auto lg:mr-0 text-left space-y-4">
                      <div className="flex items-center gap-3">
                        {/* Minimalist Headshot avatar */}
                        <div className="w-10 h-10 bg-[#7C3AED]/10 flex items-center justify-center text-[10px] font-mono text-[#7C3AED] select-none">
                          B2P
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 leading-tight">Your AI Doppelganger</div>
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">Founder & CEO • 1st</div>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-slate-800 font-light leading-relaxed font-sans whitespace-pre-line">
                        We spent $40k on ads last month. Net pipeline generated: $0.
                        {"\n\n"}
                        Then we shut down the ad account and had our founders write about our engineering secrets organic on LinkedIn.
                        {"\n\n"}
                        In 30 days: 3 Enterprise demos booked.
                        {"\n\n"}
                        Paid ads capture demand. Organic thought leadership creates it. If your buyers don't trust you, no ad budget will save you.
                      </p>
                      <div className="text-[10px] text-slate-400 font-sans pt-2 border-t border-slate-900/5 uppercase tracking-wider">
                        142 likes • 12 comments
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeDeliverable === 'x' && (
                  <motion.div
                    key="x"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                  >
                    {/* Realistic B2B Twitter Thread Blueprint - Connected Tweet feed */}
                    <div className="pl-6 md:pl-10 border-l-2 border-[#2583EB] py-2 max-w-xl mx-auto lg:mr-0 text-left space-y-6">
                      
                      {/* Tweet 1 */}
                      <div className="flex gap-4 relative">
                        {/* Vertical line connecting tweet chain */}
                        <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-[#2583EB]/15" />
                        
                        <div className="w-10 h-10 bg-[#2583EB]/10 flex items-center justify-center text-[10px] font-mono text-[#2583EB] select-none shrink-0 z-10">
                          B2P
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center text-xs">
                            <span className="font-semibold text-slate-900">Your Brand Voice</span>
                            <span className="text-slate-400">@founder</span>
                          </div>
                          <p className="text-sm text-slate-800 font-light leading-relaxed font-sans">
                            How we scale B2B SaaS organic channels with zero ad spend. The exact playbook we use for our portfolio companies: 🧵👇
                          </p>
                        </div>
                      </div>

                      {/* Tweet 2 */}
                      <div className="flex gap-4 relative">
                        <div className="w-10 h-10 bg-[#2583EB]/10 flex items-center justify-center text-[10px] font-mono text-[#2583EB] select-none shrink-0 z-10">
                          B2P
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center text-xs">
                            <span className="font-semibold text-slate-900">Your Brand Voice</span>
                            <span className="text-slate-400">@founder</span>
                          </div>
                          <p className="text-sm text-slate-800 font-light leading-relaxed font-sans">
                            The secret is Earned Secrets. If you repeat what's in standard blogs, you are noise. You must extract unique compliance insights from your team.
                          </p>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {activeDeliverable === 'dna' && (
                  <motion.div
                    key="dna"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                  >
                    {/* Realistic B2B DNA Specification Sheet Table */}
                    <div className="pl-6 md:pl-10 border-l-2 border-[#FF7778] py-2 max-w-xl mx-auto lg:mr-0 text-left space-y-4">
                      <div className="text-xs text-[#FF7778] font-sans block">DNA positioning sheet // Archive 2.0</div>
                      <table className="w-full text-xs font-sans text-slate-700 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900/10 text-left text-[10px] text-slate-400 font-medium">
                            <th className="py-2 pr-4">Key metric</th>
                            <th className="py-2">Calibration value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-900/5">
                            <td className="py-3 pr-4 font-mono text-[10px] text-slate-900">TARGET AUDIENCE</td>
                            <td className="py-3 font-light">AWS/GCP Infrastructure SaaS Founders</td>
                          </tr>
                          <tr className="border-b border-slate-900/5">
                            <td className="py-3 pr-4 font-mono text-[10px] text-slate-900">CORE OBJECTION</td>
                            <td className="py-3 font-light">"We already use manual compliance audits"</td>
                          </tr>
                          <tr className="border-b border-slate-900/5">
                            <td className="py-3 pr-4 font-mono text-[10px] text-slate-900">OBJECTION HANDLING</td>
                            <td className="py-3 font-light text-slate-800">Audits are reactive; real-time monitors catch errors early</td>
                          </tr>
                          <tr>
                            <td className="py-3 pr-4 font-mono text-[10px] text-slate-900">TONE RULES</td>
                            <td className="py-3 font-light">Direct, Technical, Jargon-Free, Authoritative</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeDeliverable === 'graphics' && (
                  <motion.div
                    key="graphics"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                  >
                    {/* Realistic Graphic Slide Spec */}
                    <div className="pl-6 md:pl-10 border-l-2 border-[#10B981] py-2 max-w-xl mx-auto lg:mr-0 text-left space-y-6">
                      <span className="text-xs text-[#10B981] font-sans block">Canvas overlay spec</span>
                      <div className="w-full max-w-sm border border-slate-900/10 p-8 bg-white flex flex-col justify-between h-44 text-left shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">PLATE NO. 04</span>
                          <span className="font-mono text-[9px] text-slate-400">5120 × 2880 PX</span>
                        </div>
                        <div>
                          <h4 className="font-display text-xl font-light tracking-tight text-slate-900 leading-tight">
                            The B2B Organic Pipeline: <span className="italic font-serif">15 minutes to configure</span>, 30 days to execute.
                          </h4>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-900/10 pt-3 mt-4">
                          <img src="/B2PLOGO.png" className="w-4.5 h-4.5 opacity-80" alt="B2P" />
                          <span className="font-mono text-[8px] text-slate-400">CALIBRATED SECRETS INDEX</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Closing Bottom Rule */}
          <div className="border-t border-slate-900/10 mt-16" />
        </div>
      </section>

      {/* 8.5. VERIFIED FOUNDER TESTIMONIALS & TRUST PROOF */}
      <section data-nav-theme="dark" className="py-24 md:py-32 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
          
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-sans font-semibold tracking-wider text-slate-400 uppercase block mb-3">
              Verified Founder Results
            </span>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              What Happens When Founders <br />
              <span className="font-normal italic text-slate-300">Automate Their Authority.</span>
            </h2>
            <p className="text-base font-light mt-4 leading-relaxed max-w-xl text-slate-300">
              Real growth metrics from founders who stopped writing manual posts and deployed our virtual AI doppelganger engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="border border-white/10 bg-white/5 p-8 rounded-2xl space-y-6 relative hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-light leading-relaxed text-slate-200">
                  "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound demos jumped by <strong className="font-semibold text-white">+340% in 30 days</strong> without me spending a single hour drafting copy."
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-white">Alex Rivera</h4>
                  <p className="text-xs text-slate-400 font-sans">Founder & CEO • MINIM</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold bg-white/10 text-slate-300 border border-white/20">
                  Master Founder
                </span>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="border border-white/10 bg-white/5 p-8 rounded-2xl space-y-6 relative hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-light leading-relaxed text-slate-200">
                  "The 2-minute Monday approval deck is a total game changer. I review the queued campaign deck on my phone, click Approve All, and our channels run on autopilot. <strong className="font-semibold text-white">Nothing posts without my green light.</strong>"
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-white">Sarah Chen</h4>
                  <p className="text-xs text-slate-400 font-sans">Co-Founder • AIMLPARTNER</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Autopilot Active
                </span>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="border border-white/10 bg-white/5 p-8 rounded-2xl space-y-6 relative hover:border-white/20 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-light leading-relaxed" style={{ color: '#E2E8F0' }}>
                  "I used to pay an agency $6,000/month for generic posts that got 5 likes. BrandToPost's Arthur voice clone captures my exact founder story and positioning for a fraction of the cost."
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-white">Marcus Vance</h4>
                  <p className="text-xs text-slate-400 font-sans">Founder • Superhero Gym</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold bg-white/10 text-slate-300 border border-white/20">
                  Saved $6k/mo
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 9. THE SUBSCRIPTION MATRIX (Pricing Selectors - Light Theme) */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
      <div className="pt-12 md:pt-16 pb-24 md:pb-32 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <p className="text-xs font-sans font-semibold tracking-wider text-[#7C3AED] uppercase mb-3">Transparent Tiering</p>
          <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Stop Throwing Money At Courses & Tools <br />
            <span className="font-normal italic text-[#7C3AED]">That Don't Fix Your Consistency.</span>
          </h2>
          <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed mt-4">
            Select a configuration tier based on the size of the AI marketing specialists you want active. Less than the cost of 1 hour of your time per month.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left items-stretch">
          
          {/* Plan 1: Solo Founder */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <span className="text-xs text-slate-400 font-sans font-light block">Tier 01</span>
                <h3 className="text-2xl font-display font-light text-slate-900 mt-1">Solo Founder</h3>
                <div className="flex items-baseline gap-1 text-slate-950 mt-4">
                  <span className="text-4xl font-light font-display">₹2,499</span>
                  <span className="text-xs text-slate-400 font-sans font-light">/ mo</span>
                </div>
                <p className="text-xs text-slate-500 font-sans font-light mt-3 leading-relaxed">
                  Deploy a standard content engine to get campaigns written, designed, and queued automatically on your primary social channels.
                </p>
              </div>

              {/* Active Specialists list */}
              <div className="border-t border-slate-100 pt-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block mb-4">Active Roster Specialists</span>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah", role: "Research & Strategy", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Alex", role: "Copywriter & Hook Spec", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Chloe", role: "Visual Aesthetics", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Julian", role: "Graphics & Logo Layout", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Elena", role: "Publishing Router", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100" }
                    ].map((agent, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={agent.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                          <span className="font-sans font-medium text-slate-800">{agent.name}</span>
                        </div>
                        <span className="text-slate-400 font-sans font-light text-[11px]">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link 
              to="/login?mode=signup" 
              className="w-full mt-8 py-3 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-sans font-semibold text-center rounded-lg shadow-sm block"
            >
              Deploy Starter Grid
            </Link>
          </div>

          {/* Plan 2: Growth Autopilot (Flagship Highlight) */}
          <div className="bg-white border-2 border-[#7C3AED] rounded-2xl p-8 flex flex-col justify-between relative shadow-md shadow-[#7C3AED]/5">
            {/* Top Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7C3AED] rounded-t-xl" />
            
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <span className="text-[11px] text-[#7C3AED] font-sans font-medium block mb-1">Recommended configuration</span>
                <span className="text-xs text-slate-400 font-sans font-light block">Tier 02</span>
                <h3 className="text-2xl font-display font-light text-slate-900 mt-1">Growth Autopilot</h3>
                <div className="flex items-baseline gap-1 text-slate-955 mt-4">
                  <span className="text-4xl font-light font-display">₹4,499</span>
                  <span className="text-xs text-slate-400 font-sans font-light">/ mo</span>
                </div>
                <p className="text-xs text-slate-500 font-sans font-light mt-3 leading-relaxed">
                  Clone your personal voice signature and let the system run automated compliance campaigns in the background hands-free.
                </p>
              </div>

              {/* Active Specialists list */}
              <div className="border-t border-slate-100 pt-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#7C3AED] font-sans uppercase tracking-wider block mb-4">Active Roster Specialists</span>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah", role: "Research & Strategy", avatar: "/agents_img/sarah.png" },
                      { name: "Alex", role: "Copywriter & Hook Spec", avatar: "/agents_img/alex.png" },
                      { name: "Chloe", role: "Visual Aesthetics", avatar: "/agents_img/chloe.png" },
                      { name: "Julian", role: "Graphics & Logo Layout", avatar: "/agents_img/julian.png" },
                      { name: "Elena", role: "Publishing Router", avatar: "/agents_img/elena.png" },
                      { name: "Arthur", role: "Voice & DNA Clone", avatar: "/agents_img/arthur.png" },
                      { name: "Maya", role: "Campaign Scheduler", avatar: "/agents_img/maya.png" },
                      { name: "Zack", role: "Objection Handling", avatar: "/agents_img/zack.png" }
                    ].map((agent, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={agent.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                          <span className="font-sans font-medium text-slate-800">{agent.name}</span>
                        </div>
                        <span className="text-slate-400 font-sans font-light text-[11px]">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Link 
              to="/login?mode=signup" 
              className="w-full mt-8 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all text-xs font-sans font-semibold text-center rounded-lg shadow-md shadow-[#7C3AED]/15 block"
            >
              Deploy Growth Autopilot
            </Link>
          </div>

          {/* Plan 3: Agency Partner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <span className="text-xs text-slate-400 font-sans font-light block">Tier 03</span>
                <h3 className="text-2xl font-display font-light text-slate-900 mt-1">Agency Partner</h3>
                <div className="flex items-baseline gap-1 text-slate-955 mt-4">
                  <span className="text-4xl font-light font-display">₹12,499</span>
                  <span className="text-xs text-slate-400 font-sans font-light">/ mo</span>
                </div>
                <p className="text-xs text-slate-500 font-sans font-light mt-3 leading-relaxed">
                  Connect your WhatsApp number to command client campaign reviews, edits, and schedule auto-publishing in real-time.
                </p>
              </div>

              {/* Active Specialists list */}
              <div className="border-t border-slate-100 pt-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider block mb-4">Active Roster Specialists</span>
                  <div className="space-y-3">
                    {[
                      { name: "Sarah", role: "Research & Strategy", avatar: "/agents_img/sarah.png" },
                      { name: "Alex", role: "Copywriter & Hook Spec", avatar: "/agents_img/alex.png" },
                      { name: "Chloe", role: "Visual Aesthetics", avatar: "/agents_img/chloe.png" },
                      { name: "Julian", role: "Graphics & Logo Layout", avatar: "/agents_img/julian.png" },
                      { name: "Elena", role: "Publishing Router", avatar: "/agents_img/elena.png" },
                      { name: "Arthur", role: "Voice & DNA Clone", avatar: "/agents_img/arthur.png" },
                      { name: "Maya", role: "Campaign Scheduler", avatar: "/agents_img/maya.png" },
                      { name: "Zack", role: "Objection Handling", avatar: "/agents_img/zack.png" },
                      { name: "Victor", role: "WhatsApp Commander", avatar: "/agents_img/victor.png" },
                      { name: "Max", role: "Autopilot Monitor", avatar: "/agents_img/max.png" }
                    ].map((agent, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={agent.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                          <span className="font-sans font-medium text-slate-800">{agent.name}</span>
                        </div>
                        <span className="text-slate-400 font-sans font-light text-[11px]">{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            <Link 
              to="/login?mode=signup" 
              className="w-full mt-8 py-3 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-all text-xs font-sans font-semibold text-center rounded-lg shadow-sm block"
            >
              Deploy Agency Console
              </Link>
            </div>

          </div>

          {/* Closing divider rule */}
          <div className="border-t border-slate-900/10" />

        </div>
      </div>
      </section>

      {/* 10. FAQ ACCORDION (Editorial Minimalist Design) */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
      <div className="py-24 md:py-32 px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <p className="text-xs font-mono tracking-widest text-[#7C3AED] uppercase mb-3">CLEAR ANSWERS</p>
          <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Still Wondering If This Will <br />
            <span className="font-normal italic text-[#7C3AED]">Actually Work For Your Brand?</span>
          </h2>
          <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
            Direct answers to the questions every founder asks before handing over their content pipeline.
          </p>
        </div>

        <div className="space-y-6 text-left">
          {[
            { q: "Do I approve what gets posted before it goes live?", a: "Yes. 100% control. Every Monday you receive a 1-click review deck. You can edit any sentence, swap graphic cards, or approve all in under 2 minutes. Nothing posts without your green light unless you explicitly turn on full autopilot." },
            { q: "What happens in the first 10 minutes after I sign up?", a: "Min 0-3: Paste your site URL to extract Brand DNA and ICP objections. Min 3-8: Review your first 30-day campaign queue. Min 8-10: Connect your LinkedIn/X accounts and launch native autopilot publishing." },
            { q: "Will this sound like robotic, generic AI slop?", a: "No. Arthur clones your exact founder personality, vocabulary constraints, and objection handlers from your Brand DNA sheet. Copy reads like a human founder wrote it, not a generic prompt box." },
            { q: "How does Victor's WhatsApp integration work?", a: "Under the Agency plan, Victor sends campaign review decks directly to your WhatsApp app. Reply with text edits or click approve right from your phone without logging into any web browser." }
          ].map((item, index) => {
            const isFaqActive = activeFaq === index;
            const stepNum = String(index + 1).padStart(2, '0');
            return (
              <div key={index} className="border-b border-slate-900/10 pb-4">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between py-4 text-sm sm:text-base font-semibold text-slate-800 hover:text-[#7C3AED] transition-colors cursor-pointer text-left font-display"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[#7C3AED] text-xs font-bold">{stepNum}.</span>
                    <span>{item.q}</span>
                  </div>
                  <span className="text-xl font-mono text-slate-400 select-none ml-4">
                    {isFaqActive ? '−' : '+'}
                  </span>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFaqActive ? 'max-h-[300px] opacity-100 py-3' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-8 border-l-2 border-[#7C3AED] text-xs sm:text-sm text-slate-655 leading-relaxed font-light bg-white p-4 rounded-r-lg shadow-sm">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </section>

      {/* 11. CTA SECTION (Tech Luxury Dark Editorial Layout) */}
      <section data-nav-theme="dark" className="py-32 md:py-44 px-6 md:px-16 lg:px-24 relative z-10 w-full bg-[#08080C] text-slate-300 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Bold Typographic Statement */}
          <div className="lg:col-span-7 text-left space-y-4">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              Ready to Stop <br />
              <span className="font-normal italic text-[#C084FC]">Posting AI Slop?</span>
            </h2>
          </div>

          {/* Right Column: Active Pilot & CTAs */}
          <div className="lg:col-span-5 text-left space-y-8">
            
            {/* Active pilot node */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/B2P AVATAR.png" 
                  alt="Tror" 
                  className="w-10 h-10 rounded-full border border-white/15 object-cover" 
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-[#08080C] rounded-full" />
              </div>
              <div>
                <span className="text-xs text-white font-sans font-medium block">TROR Conductor</span>
                <span className="text-[10px] text-slate-400 font-sans font-light">Orchestration Active</span>
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-md">
              You already have the stories, opinions, and expertise your audience wants. BrandToPost turns that into a living DNA and agents that publish for you, every day, across every channel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to="/login?mode=signup"
                className="px-7 py-3.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all shadow-sm text-center block"
              >
                Start Free DNA Setup
              </Link>
              
              <a 
                href={isDefaultWhatsAppUrl ? "#" : whatsappUrl} 
                onClick={(e) => {
                  if (isDefaultWhatsAppUrl) {
                    e.preventDefault();
                    setShowSetupModal(true);
                  }
                }}
                {...(!isDefaultWhatsAppUrl && whatsappUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="px-7 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-sm transition-all text-center flex items-center justify-center gap-2"
              >
                Book a 15‑Minute Walkthrough
              </a>
            </div>

            <span className="block text-xs text-slate-500 font-sans font-light pt-2">
              Instantly onboard your brand profile in under 60 seconds.
            </span>

          </div>

        </div>
      </section>

      {/* Light-Themed Footer resting flush at the bottom */}
      <footer className="w-full bg-[#FAF8F5] pt-16 relative z-10 border-t border-slate-200/60 overflow-hidden flex flex-col justify-between mb-0 pb-0">
        
        {/* Top Link Columns */}
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/50">
          
          {/* Column 1: Platform */}
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Platform</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Growth Autopilot</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Solo Founder Engine</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Agency Partner Console</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">API Distribution</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">WhatsApp Bot Link</span>
            </div>
          </div>

          {/* Column 2: Roster */}
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">AI Specialists</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Arthur (Voice Clone)</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Sarah (Research)</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Alex (Copywriting)</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Chloe (Visuals)</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Julian (Graphics)</span>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Resources</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Manifesto</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Brand Guides</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Social Frameworks</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Case Studies</span>
            </div>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Company</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">Twitter / X</a>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">About Us</span>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Column 5: Subscribe */}
          <div className="flex flex-col gap-3.5 lg:col-span-1 md:col-span-2">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Subscribe</span>
            <p className="text-xs text-slate-500 font-sans font-light leading-relaxed mb-1">
              Get the weekly dispatch of autonomous growth insights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white/70 text-xs font-sans focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 w-full text-slate-800 placeholder-slate-400"
                required
              />
              <button 
                type="submit" 
                className="px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Row 2: Copyright & Meta */}
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-sans pt-8">
          <p className="font-light font-mono text-[9.5px]">
            &copy; {new Date().getFullYear()} BrandToPost Systems. All rights reserved.
          </p>
          <div className="flex gap-8 font-light">
            <Link to="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
          </div>
          <p className="font-light font-mono text-[9.5px]">Built by AiMlPartner.</p>
        </div>

        {/* Massive Wordmark Logo Overlay with Color & Firecracker Glowing Border Animation */}
        <div className="w-full overflow-hidden mt-12 sm:mt-16 select-none pointer-events-none mb-0 pb-0 leading-none block">
          <svg viewBox="0 0 1600 200" className="w-full h-auto block mb-0 pb-0">
            <style>{`
              @keyframes firecracker-flow {
                0% {
                  stroke-dashoffset: 2000;
                }
                100% {
                  stroke-dashoffset: 0;
                }
              }
              .animate-firecracker-line {
                animation: firecracker-flow 14s linear infinite;
              }
            `}</style>
            <defs>
              <linearGradient id="footerTextGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#C084FC" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#2583EB" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="firecrackerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="35%" stopColor="#C084FC" />
                <stop offset="70%" stopColor="#2583EB" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            
            {/* Clear, High-Fidelity Brand Logo Icon (Original Vibrant Colors) */}
            <image
              href="/B2PLOGO.png"
              x="170"
              y="30"
              width="140"
              height="140"
              style={{
                opacity: 0.95,
              }}
            />

            {/* Giant solid wordmark fading into background */}
            <text
              x="330"
              y="60%"
              dominantBaseline="middle"
              className="font-display font-extrabold uppercase tracking-tighter"
              style={{
                fontSize: '145px',
                fill: 'url(#footerTextGradient)',
                letterSpacing: '-0.04em'
              }}
            >
              brandtopost
            </text>
            
            {/* Traced outline spark line (firecracker spark) */}
            <text
              x="330"
              y="60%"
              dominantBaseline="middle"
              className="font-display font-extrabold uppercase tracking-tighter animate-firecracker-line"
              style={{
                fontSize: '145px',
                fill: 'none',
                stroke: 'url(#firecrackerGradient)',
                strokeWidth: '1.2px',
                strokeDasharray: '160 840',
                letterSpacing: '-0.04em',
                filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.45))'
              }}
            >
              brandtopost
            </text>
          </svg>
        </div>
      </footer>

      {/* WhatsApp Quick Setup Overlay Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#060608]/80 backdrop-blur-sm" onClick={() => setShowSetupModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-hidden text-slate-800">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mt-2 relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                <MessageSquare className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">🔗 Link Your Onboarding Bot</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed font-light">
                To onboard your business directly through WhatsApp Messenger, link your live WhatsApp phone number below.
              </p>

              {linkSuccess ? (
                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl w-full flex flex-col items-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-8 h-8 animate-bounce shrink-0" />
                  <span className="text-sm font-semibold">Verification Successful!</span>
                  <span className="text-xs text-emerald-600/70">Opening WhatsApp Messenger...</span>
                </div>
              ) : (
                <form onSubmit={handleQuickSetupInput} className="mt-8 w-full space-y-4">
                  <div className="text-left font-sans">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 919876543210"
                      value={botPhoneNumberInput}
                      onChange={(e) => setBotPhoneNumberInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] transition-colors"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-light">
                      Only input numbers with country code. Do not include spaces, +, brackets or dashes (e.g. use <strong>919876543210</strong>, not +91 98765-43210).
                    </p>
                  </div>

                  {linkError && (
                    <div className="text-xs text-rose-600 text-left bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl">
                      {linkError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLinking}
                    className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-none"
                  >
                    {isLinking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Linking Bot...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white animate-bounce" />
                        <span>Activate & Launch Tror Bot</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
