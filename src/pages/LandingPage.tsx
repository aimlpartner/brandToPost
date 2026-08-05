import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AgentSolitaireCards } from '../components/AgentSolitaireCards';
import { ThemeToggle } from '../components/ThemeToggle';
import { UniversalNavbar } from '../components/UniversalNavbar';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { 
  Target, ArrowRight, Sparkles, 
  CheckCircle2, MessageSquare, TrendingUp, 
  PenTool, Loader2, Zap,
  X, XCircle, Bot, ZapOff, Activity,
  Lock, Check, HelpCircle, Crown, Star,
  Building2, Rocket, UserCheck, Layers
} from 'lucide-react';





const COMPANY_LOGOS = [
  { name: "MINIM", src: "/MINIM-logo-primary.png", className: "h-4 sm:h-5 md:h-6" },
  { name: "AIMLPARTNER", src: "/aimlpartner_logo.png", className: "h-7 sm:h-9 md:h-10" },
  { name: "SUPERHERO GYM", src: "/superherogym_logo.png", className: "h-5 sm:h-6 md:h-7" },
  { name: "WEAREKNWN", src: "/weareknwn_logo.png", className: "h-4 sm:h-5 md:h-6" },
  { name: "AVENOIR", src: "/avenoirlogo.png", className: "h-7 sm:h-9 md:h-11" },
  { name: "GVRG INDUSTRIES", src: "/gvrgindustrieslogo.png", className: "h-6 sm:h-8 md:h-9" },
  { name: "LOHIA TRADERS", src: "/lohiatraderslogo.png", className: "h-6 sm:h-8 md:h-9" },
  { name: "EQUESTRIAN", src: "/equestrianlogo.png", className: "h-6 sm:h-8 md:h-9" },
];

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

  // Section 4 Brand DNA Vault interactive state & auto-play timer
  const [activeDnaPillar, setActiveDnaPillar] = useState<number>(0);
  const [isDnaHovered, setIsDnaHovered] = useState<boolean>(false);

  useEffect(() => {
    if (isDnaHovered) return;
    const interval = setInterval(() => {
      setActiveDnaPillar(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isDnaHovered]);

  // Section 5 Tailored Use Cases tab state
  const [activeUseCaseTab, setActiveUseCaseTab] = useState<'agencies' | 'startups' | 'experts'>('agencies');

  // Section 10 Master Orchestrator interactive tab state
  const [activeOrchestratorTab, setActiveOrchestratorTab] = useState<'arthur' | 'sarah' | 'chloe' | 'maya'>('arthur');

  // Metrics animation state
  const [metrics, setMetrics] = useState({ prompts: 99, voice: 0, time: 20, channels: 0 });
  const [metricsRef, setMetricsRef] = useState<HTMLElement | null>(null);
  const [metricsVisible, setMetricsVisible] = useState(false);

  // Refs for Section 2 Laser Diagnostic Timeline GSAP Sequence
  const section2LaserRef = React.useRef<HTMLDivElement>(null);
  const laserBeamRef = React.useRef<HTMLDivElement>(null);

  // Section 2 Laser Beam & Node Activation GSAP ScrollTrigger Sequence
  useEffect(() => {
    if (!section2LaserRef.current || !laserBeamRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Animate vertical laser beam height tracking scroll position
      gsap.fromTo(
        laserBeamRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: section2LaserRef.current,
            start: "top 65%",
            end: "bottom 80%",
            scrub: 0.5,
          }
        }
      );

      // 2. Stagger node reveals & card entrance along the laser beam
      const nodes = gsap.utils.toArray<HTMLElement>(".gsap-laser-node");
      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, x: 35, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: node,
              start: "top 78%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    }, section2LaserRef);

    return () => ctx.revert();
  }, []);

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
      
      {/* 1. UNIVERSAL SHARED NAVIGATION BAR */}
      <UniversalNavbar />

      {/* 2. PROFESSIONAL HERO SECTION (Dark Theme Contrast - Left-Aligned & Single Viewport) */}
      <section data-nav-theme="dark" className="relative w-full h-screen overflow-hidden bg-[#08080C] border-b border-slate-950 px-6 lg:px-8 pt-28 pb-8 flex flex-col justify-between">
        
        {/* Background Video */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/hero-section-vid.mp4" type="video/mp4" />
          </video>
          {/* Readability Overlay Gradient (Dark gradient on left for contrast with white text, fading to transparent on the right) */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
        </div>

        {/* Hero Copy Content Container (Vertically Centered in Available Viewport Space) */}
        <div className="max-w-7xl mx-auto w-full relative z-10 text-left flex-1 flex flex-col justify-center">
          <div className="max-w-3xl space-y-5 lg:space-y-6">
            
            {/* Main Headline */}
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.12] font-display"
              style={{ color: '#FFFFFF', fontWeight: 600 }}
            >
              If Your Content <br />
              Could Be Anyone’s, <br />
              <span style={{ color: '#C084FC', fontWeight: 600 }}>Your Brand Is No One’s.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-base sm:text-xl font-light leading-relaxed max-w-2xl pt-1" style={{ color: '#E2E8F0' }}>
              Agents transform your ideas, expertise, and brand DNA into daily content for your profile, your company, and your clients.
            </p>
            
            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row justify-start items-center gap-4 pt-2">
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

          </div>
        </div>

        {/* Trusted Company Logos Carousel Strip (Anchored at Bottom of Viewport) */}
        <div className="w-full max-w-7xl mx-auto relative z-10 pt-4 pb-2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="animate-marquee flex items-center gap-8 sm:gap-12 lg:gap-16 shrink-0">
            {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((logo, idx) => (
              <div key={idx} className="flex-shrink-0 min-w-[130px] sm:min-w-[160px] h-12 sm:h-16 flex items-center justify-center px-4">
                <img 
                  src={logo.src} 
                  alt={logo.name} 
                  className={`${logo.className} w-auto object-contain brightness-0 invert opacity-85 hover:opacity-100 transition-all duration-300`} 
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE MANUAL VS AUTONOMOUS CONTRAST (Light Theme Laser Diagnostic Timeline with Simple Copy) */}
      <section ref={section2LaserRef} data-nav-theme="light" className="py-28 md:py-36 w-full bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left overflow-hidden">
        
        {/* Ambient light purple background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(192,132,252,0.04),transparent_70%)] pointer-events-none" />

        <div className="w-full mx-auto max-w-6xl px-6 md:px-12 lg:px-16 relative z-10">
          
          {/* Header */}
          <div className="max-w-3xl mb-16 space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-purple-400 rounded-full" />
              <span>THE PROBLEM WITH TODAY'S CONTENT</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-slate-900 leading-[1.08]">
              Why Your Content <br />
              <span className="font-normal italic text-[#7C3AED]">Feels Like AI Slop.</span>
            </h2>
            
            <p className="text-base text-slate-600 font-light leading-relaxed max-w-xl">
              6 simple reasons why generic AI content fails founders and holds back your reach every single day.
            </p>
          </div>

          {/* Timeline Container with Light Laser Line Channel */}
          <div className="relative pl-8 md:pl-16 lg:pl-20 space-y-10 md:space-y-12">
            
            {/* Background Laser Channel Track Line (Muted Guide) */}
            <div className="absolute left-2 md:left-4 lg:left-6 top-4 bottom-4 w-1 bg-slate-300/60 rounded-full -translate-x-1/2" />
            
            {/* Illuminated Animated Laser Beam Line */}
            <div 
              ref={laserBeamRef}
              className="absolute left-2 md:left-4 lg:left-6 top-4 bottom-4 w-1 bg-gradient-to-b from-[#7C3AED] via-[#9333EA] to-[#2563EB] rounded-full -translate-x-1/2 shadow-[0_0_12px_rgba(124,58,237,0.4)] origin-top"
            />

            {[
              {
                stage: "01",
                label: "01 — TEMPLATE CONFORMITY",
                title: "Generic AI Outputs",
                copy: "Your posts all sound the same, like they came from the same generic AI template — no personality, no story, no competitive edge.",
                tag: "Generic AI Template"
              },
              {
                stage: "02",
                label: "02 — TOOL FRICTION",
                title: "Tool Juggling & Blank Canvas",
                copy: "You’re starting from a blank page every day, or juggling Notion docs, Google Docs, and Slack threads to piece together something 'good enough.'",
                tag: "Tool Overhead"
              },
              {
                stage: "03",
                label: "03 — AGENCY DRIFT",
                title: "Agency Prompt Copy-Pasting",
                copy: "Agencies are copy-pasting prompts across clients; everything looks like a slightly tweaked version of the last campaign.",
                tag: "Recycled Prompts"
              },
              {
                stage: "04",
                label: "04 — INCONSISTENT FREQUENCY",
                title: "Burst Posting & Disappearing",
                copy: "Founders and operators post in bursts, then disappear for weeks because 'content day' keeps losing priority to real work.",
                tag: "Inconsistent Reach"
              },
              {
                stage: "05",
                label: "05 — EDITING BOTTLENECK",
                title: "Endless Editing Overhead",
                copy: "Your team spends hours editing AI output to make it sound human, only to still ship content that your audience scrolls past.",
                tag: "Wasted Editing Time"
              },
              {
                stage: "06",
                label: "06 — BRAND FRAGMENTATION",
                title: "Disconnected Brand Voice",
                copy: "No one inside the company owns the full brand story, so every channel — website, LinkedIn, email, ads — feels disconnected and random.",
                tag: "Disconnected Channels"
              }
            ].map((item, idx) => (
              <div key={idx} className="gsap-laser-node relative flex flex-col md:flex-row md:items-start justify-between gap-6 group">
                
                {/* Node Target Anchor on Laser Beam */}
                <div className="absolute -left-8 md:-left-16 lg:-left-20 top-6 w-5 h-5 rounded-full bg-[#FAF9F6] border-2 border-[#7C3AED] group-hover:border-purple-900 transition-colors duration-300 shadow-[0_0_10px_rgba(124,58,237,0.3)] flex items-center justify-center -translate-x-1/2 z-20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] group-hover:scale-125 transition-transform" />
                </div>

                {/* Node Diagnostic Content Box (Light Theme Card) */}
                <div className="w-full bg-white border border-slate-200/90 hover:border-[#7C3AED]/40 rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className="text-[11px] font-sans font-semibold tracking-wider text-[#7C3AED] uppercase">
                      {item.label}
                    </span>
                    <span className="text-xl font-mono font-bold text-slate-300 group-hover:text-[#7C3AED] transition-colors">
                      {item.stage}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-display font-medium text-slate-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 font-light leading-relaxed mb-4 max-w-2xl">
                    {item.copy}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
                    <span>Main Issue:</span>
                    <span className="text-[#7C3AED] font-semibold">{item.tag}</span>
                  </div>
                </div>

              </div>
            ))}

            {/* Closing Termination Quote Node */}
            <div className="gsap-laser-node relative pt-4">
              <div className="absolute -left-8 md:-left-16 lg:-left-20 top-8 w-6 h-6 rounded-full bg-[#7C3AED] border-2 border-white shadow-[0_0_12px_rgba(124,58,237,0.5)] flex items-center justify-center -translate-x-1/2 z-20">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>

              <div className="p-8 rounded-xl bg-white border border-slate-200/90 shadow-sm text-left">
                <p className="text-xl sm:text-2xl font-display font-light text-slate-900 italic leading-snug">
                  “Are you consistent? Or is your brand invisible between launches, meetings, and investor calls?”
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SOCIAL PROOF MARQUEE: LUXURY CREATOR STUDIO (ZERO MONOSPACE SLOP) */}
      <section data-nav-theme="dark" className="py-28 md:py-40 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Style block for GPU-accelerated dual-row marquee animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-row-left {
            0% { transform: translate3d(0%, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes marquee-row-right {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0%, 0, 0); }
          }
          .animate-marquee-left {
            animation: marquee-row-left 38s linear infinite;
            will-change: transform;
            backface-visibility: hidden;
          }
          .animate-marquee-left:hover,
          .animate-marquee-right:hover {
            animation-play-state: paused;
          }
        `}} />
        
        {/* Glow Mesh Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,58,237,0.12),transparent_70%)] pointer-events-none" />

        <div className="w-full relative z-10 space-y-16">
          
          {/* Header */}
          <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-300 uppercase">
                  <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                  <span>FOUNDER PROOF & CASE STUDIES</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-white leading-tight" style={{ color: '#FFFFFF' }}>
                  Proven Results. <br />
                  <span className="font-normal italic text-slate-300">Zero Empty Promises.</span>
                </h2>
                <p className="text-base text-slate-400 font-light leading-relaxed max-w-2xl pt-1">
                  Real growth metrics and unedited word-of-mouth feedback from founders who deployed our AI doppelganger engine.
                </p>
              </div>

              {/* Quantified Proof Counter */}
              <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-wider text-emerald-300 uppercase shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>12+ VERIFIED FOUNDERS • ACTIVE AUTOPILOT CAMPAIGNS</span>
              </div>
            </div>

            {/* Top Live Impact Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-b border-white/10 pb-12 mt-8">
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>1,280+</span>
                <span className="text-xs text-slate-400 font-sans font-medium">Posts Published Automatically</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-light font-display text-purple-300 block">+340%</span>
                <span className="text-xs text-slate-400 font-sans font-medium">Avg Inbound Demo Growth</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-light font-display text-white block" style={{ color: '#FFFFFF' }}>$6,000</span>
                <span className="text-xs text-slate-400 font-sans font-medium">Avg Monthly Agency Savings</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-light font-display text-emerald-400 block">98.7%</span>
                <span className="text-xs text-slate-400 font-sans font-medium">Human Voice Authenticity</span>
              </div>
            </div>
          </div>

          {/* DUAL-ROW ANIMATED MOVING MARQUEE SHOWCASE */}
          <div className="space-y-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            
            {/* ROW 1: Moving Left */}
            <div className="flex w-max animate-marquee-left gap-6 items-center">
              {[
                {
                  name: "Alex Rivera",
                  role: "Founder & CEO • MINIM",
                  metric: "+340% Inbound Demos",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound demos jumped by +340% in 30 days."
                },
                {
                  name: "Sarah Chen",
                  role: "Co-Founder • AIMLPARTNER",
                  metric: "2-Min Monday Review",
                  avatar: "/agents_img/sarah.png",
                  quote: "The 2-minute Monday approval deck is a total game changer. I review the queued campaign on my phone, click Approve All, and our channels run on autopilot."
                },
                {
                  name: "Marcus Vance",
                  role: "Founder • Superhero Gym",
                  metric: "Saved $6,000 / Mo",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "I used to pay an agency $6,000/month for generic posts that got 5 likes. Arthur's voice clone captures my exact founder story for a fraction of the cost."
                },
                {
                  name: "David K.",
                  role: "Managing Director • WEAREKNWN",
                  metric: "+410% Impression Reach",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our organic LinkedIn impressions quadrupled in 3 weeks. The market research agents pull actual customer pain points directly into copy."
                },
                {
                  name: "Elena Rostova",
                  role: "Founder • Avenoir Tech",
                  metric: "10x Content Speed",
                  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We scaled from 1 channel to 5 active social channels without adding headcount. BrandToPost feels like hiring a full 6-person marketing team."
                },
                {
                  name: "Vikram Patel",
                  role: "Co-Founder • GVRG Industries",
                  metric: "Zero Writing Friction",
                  avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "I used to dread 'content day'. Now I drop a 30-second voice note into the dashboard and our agents generate a week of polished, multi-format posts."
                }
              ].concat([
                {
                  name: "Alex Rivera",
                  role: "Founder & CEO • MINIM",
                  metric: "+340% Inbound Demos",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound demos jumped by +340% in 30 days."
                },
                {
                  name: "Sarah Chen",
                  role: "Co-Founder • AIMLPARTNER",
                  metric: "2-Min Monday Review",
                  avatar: "/agents_img/sarah.png",
                  quote: "The 2-minute Monday approval deck is a total game changer. I review the queued campaign on my phone, click Approve All, and our channels run on autopilot."
                },
                {
                  name: "Marcus Vance",
                  role: "Founder • Superhero Gym",
                  metric: "Saved $6,000 / Mo",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "I used to pay an agency $6,000/month for generic posts that got 5 likes. Arthur's voice clone captures my exact founder story for a fraction of the cost."
                },
                {
                  name: "David K.",
                  role: "Managing Director • WEAREKNWN",
                  metric: "+410% Impression Reach",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our organic LinkedIn impressions quadrupled in 3 weeks. The market research agents pull actual customer pain points directly into copy."
                },
                {
                  name: "Elena Rostova",
                  role: "Founder • Avenoir Tech",
                  metric: "10x Content Speed",
                  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We scaled from 1 channel to 5 active social channels without adding headcount. BrandToPost feels like hiring a full 6-person marketing team."
                },
                {
                  name: "Vikram Patel",
                  role: "Co-Founder • GVRG Industries",
                  metric: "Zero Writing Friction",
                  avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "I used to dread 'content day'. Now I drop a 30-second voice note into the dashboard and our agents generate a week of polished, multi-format posts."
                }
              ]).map((item, idx) => (
                <div 
                  key={idx}
                  className="w-[340px] sm:w-[400px] shrink-0 bg-white/[0.03] border border-white/10 hover:border-purple-400/40 rounded-2xl p-6 flex flex-col justify-between transition-colors duration-200 group hover:bg-white/[0.06] space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-purple-200 transition-colors font-sans" style={{ color: '#FFFFFF' }}>{item.name}</h4>
                        <p className="text-xs text-slate-400 font-sans">{item.role}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                      {item.metric}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed italic">
                    "{item.quote}"
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-sans text-slate-400 font-medium">
                    <span>Verified Result</span>
                    <span className="text-purple-300">
                      Case Study ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ROW 2: Moving Right */}
            <div className="flex w-max animate-marquee-right gap-6 items-center">
              {[
                {
                  name: "Jessica Taylor",
                  role: "Managing Partner • Lohia Traders",
                  metric: "100% Voice Match",
                  avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our investors literally thought I hired a top-tier ghostwriter. The voice clone captures my exact tone, heuristics, and technical terminology."
                },
                {
                  name: "Michael Chang",
                  role: "Founder • Apex Cyber",
                  metric: "+280% X Engagement",
                  avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "X threads used to take me 3 hours to write and structure. Alex generates platform-native threads that get bookmark after bookmark."
                },
                {
                  name: "Priya Sharma",
                  role: "Head of Brand • Equestrian Global",
                  metric: "Saved 20 Hrs / Wk",
                  avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our marketing team went from constantly firefighting draft revisions to approving campaign decks in minutes. The visual editor is incredible."
                },
                {
                  name: "Dan Sterling",
                  role: "Founder • LaunchPad VC",
                  metric: "Replaced $8k Agency",
                  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We fired our social agency within 14 days of deploying BrandToPost. Higher quality, zero missed deadlines, and complete brand control."
                },
                {
                  name: "Rachel Vance",
                  role: "Co-Founder • Velocity AI",
                  metric: "Autopilot Posting",
                  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Consistency is the #1 growth lever on social. BrandToPost ensures our profile stays active even during 14-hour product launch weeks."
                },
                {
                  name: "Liam O'Connor",
                  role: "CEO • Pulse Media",
                  metric: "+520% Organic Leads",
                  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our inbound pipeline directly correlates to post frequency. BrandToPost tripled our qualified lead volume in less than 45 days."
                }
              ].concat([
                {
                  name: "Jessica Taylor",
                  role: "Managing Partner • Lohia Traders",
                  metric: "100% Voice Match",
                  avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our investors literally thought I hired a top-tier ghostwriter. The voice clone captures my exact tone, heuristics, and technical terminology."
                },
                {
                  name: "Michael Chang",
                  role: "Founder • Apex Cyber",
                  metric: "+280% X Engagement",
                  avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "X threads used to take me 3 hours to write and structure. Alex generates platform-native threads that get bookmark after bookmark."
                },
                {
                  name: "Priya Sharma",
                  role: "Head of Brand • Equestrian Global",
                  metric: "Saved 20 Hrs / Wk",
                  avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our marketing team went from constantly firefighting draft revisions to approving campaign decks in minutes. The visual editor is incredible."
                },
                {
                  name: "Dan Sterling",
                  role: "Founder • LaunchPad VC",
                  metric: "Replaced $8k Agency",
                  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "We fired our social agency within 14 days of deploying BrandToPost. Higher quality, zero missed deadlines, and complete brand control."
                },
                {
                  name: "Rachel Vance",
                  role: "Co-Founder • Velocity AI",
                  metric: "Autopilot Posting",
                  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Consistency is the #1 growth lever on social. BrandToPost ensures our profile stays active even during 14-hour product launch weeks."
                },
                {
                  name: "Liam O'Connor",
                  role: "CEO • Pulse Media",
                  metric: "+520% Organic Leads",
                  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&h=150",
                  quote: "Our inbound pipeline directly correlates to post frequency. BrandToPost tripled our qualified lead volume in less than 45 days."
                }
              ]).map((item, idx) => (
                <div 
                  key={idx}
                  className="w-[340px] sm:w-[400px] shrink-0 bg-white/[0.03] border border-white/10 hover:border-purple-400/40 rounded-2xl p-6 flex flex-col justify-between transition-colors duration-200 group hover:bg-white/[0.06] space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-purple-200 transition-colors font-sans" style={{ color: '#FFFFFF' }}>{item.name}</h4>
                        <p className="text-xs text-slate-400 font-sans">{item.role}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-sans font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full shrink-0">
                      {item.metric}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed italic">
                    "{item.quote}"
                  </p>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-sans text-slate-400 font-medium">
                    <span>Verified Result</span>
                    <span className="text-purple-300">
                      Case Study ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* 4. BRAND DNA ARCHITECTURE: LUXURY CREATOR STUDIO CONSOLE (ZERO MONOSPACE SLOP) */}
      <section data-nav-theme="dark" className="py-28 md:py-40 w-full px-6 md:px-16 lg:px-24 bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Glow Mesh Accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-300 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
              <span>THE BRAND DNA ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              From Random Posts <br />
              <span className="font-normal italic text-[#C084FC]">To Brand DNA.</span>
            </h2>
            <p className="text-base sm:text-lg font-light leading-relaxed max-w-2xl pt-2 text-slate-300">
              BrandToPost replaces disjointed writing with 4 structural pillars. Each column represents a specialist agent engine extracting your voice, market research, platform copy, and visual designs.
            </p>
          </div>

          {/* 1. THE ARCHITECTURAL TEMPLE (SVG BACKDROP + 4 INTERACTIVE COLUMNS) */}
          <div 
            onMouseEnter={() => setIsDnaHovered(true)}
            onMouseLeave={() => setIsDnaHovered(false)}
            className="relative py-4 min-h-[460px] flex flex-col justify-between"
          >
            {/* PURE VECTOR SVG TEMPLE ARCHITECTURE */}
            <svg 
              className="absolute inset-0 w-full h-full text-white/20 pointer-events-none z-0 overflow-visible" 
              viewBox="0 0 1000 460" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* TRIANGULAR TEMPLE ROOF PEDIMENT (TOP) */}
              <polygon points="500,10 20,130 980,130" stroke="#C084FC" strokeWidth="3" strokeOpacity="0.7" fill="rgba(192, 132, 252, 0.03)" />
              <polygon points="500,28 45,120 955,120" stroke="#C084FC" strokeWidth="1.5" strokeOpacity="0.35" fill="none" />
              
              {/* Glowing Apex Center Beacon Node */}
              <circle cx="500" cy="10" r="7" fill="#C084FC" className="animate-pulse" />
              <circle cx="500" cy="10" r="16" fill="#C084FC" fillOpacity="0.35" className="animate-ping" />

              {/* Pediment Frieze Text */}
              <text x="500" y="82" textAnchor="middle" fill="#F8FAFC" fontSize="13" fontFamily="sans-serif" letterSpacing="3" fontWeight="600">
                THE BRAND DNA ARCHITECTURAL SYSTEM
              </text>
              <text x="500" y="104" textAnchor="middle" fill="#C084FC" fontSize="11" fontFamily="sans-serif" letterSpacing="2" fontWeight="500">
                4 SPECIALIST CREATOR PILLARS
              </text>

              {/* Top Architrave Beam connecting the 4 columns */}
              <rect x="10" y="130" width="980" height="20" stroke="#C084FC" strokeWidth="2" strokeOpacity="0.8" fill="rgba(255, 255, 255, 0.04)" />

              {/* THE 4 CLASSICAL IONIC SVG COLUMNS */}
              {[
                { x: 140, active: activeDnaPillar === 0 },
                { x: 380, active: activeDnaPillar === 1 },
                { x: 620, active: activeDnaPillar === 2 },
                { x: 860, active: activeDnaPillar === 3 }
              ].map((col, idx) => (
                <g key={idx}>
                  {/* Column Capital */}
                  <rect x={col.x - 55} y="150" width="110" height="16" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.95" : "0.35"} strokeWidth="2" fill="#08080C" />
                  <circle cx={col.x - 42} cy="158" r="6" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.5" : "0.35"} fill="none" />
                  <circle cx={col.x + 42} cy="158" r="6" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.5" : "0.35"} fill="none" />

                  {/* Column Shaft */}
                  <rect x={col.x - 50} y="166" width="100" height="260" stroke={col.active ? "#C084FC" : "white"} strokeWidth={col.active ? "2.5" : "1"} strokeOpacity={col.active ? "0.9" : "0.3"} fill="#08080C" />
                  
                  {/* Column Flutes */}
                  <line x1={col.x - 42} y1="166" x2={col.x - 42} y2="426" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.6" : "0.15"} strokeWidth="1" strokeDasharray="4 2" />
                  <line x1={col.x + 42} y1="166" x2={col.x + 42} y2="426" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.6" : "0.15"} strokeWidth="1" strokeDasharray="4 2" />

                  {/* Glowing Laser */}
                  {col.active && (
                    <line x1={col.x} y1="166" x2={col.x} y2="426" stroke="#C084FC" strokeWidth="4" strokeOpacity="0.8" className="filter drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]" />
                  )}

                  {/* Column Base */}
                  <rect x={col.x - 55} y="426" width="110" height="20" stroke={col.active ? "#C084FC" : "white"} strokeOpacity={col.active ? "0.95" : "0.35"} strokeWidth="2" fill="#08080C" />
                </g>
              ))}

              {/* TEMPLE FOUNDATION BASE */}
              <rect x="10" y="446" width="980" height="14" stroke="#C084FC" strokeWidth="2.5" strokeOpacity="0.8" fill="rgba(192, 132, 252, 0.08)" />
            </svg>

            {/* FOREGROUND INTERACTIVE COLUMNS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch relative z-10 pt-36">
              {[
                {
                  id: 0,
                  badge: "PILLAR 01",
                  title: "Founder Voice & Tone",
                  agent: "Arthur (Voice Clone)",
                  metric: "98.7% Voice Match",
                  desc: "Captures founder tone, vocabulary, and authentic story."
                },
                {
                  id: 1,
                  badge: "PILLAR 02",
                  title: "Market Research",
                  agent: "Sarah (Research)",
                  metric: "Live Audience Research",
                  desc: "Extracts customer pain points, stats, and competitor gaps."
                },
                {
                  id: 2,
                  badge: "PILLAR 03",
                  title: "Multi-Channel Copy",
                  agent: "Alex (Copywriting)",
                  metric: "Platform-Native",
                  desc: "Formats high-signal copy for LinkedIn, X threads, and email."
                },
                {
                  id: 3,
                  badge: "PILLAR 04",
                  title: "Visual Systems",
                  agent: "Chloe & Julian (Design)",
                  metric: "Custom Graphics",
                  desc: "Applies typography, palette, and visual graphic templates."
                }
              ].map((pillar) => {
                const isActive = activeDnaPillar === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setActiveDnaPillar(pillar.id)}
                    className={`group cursor-pointer flex flex-col justify-between items-center text-center relative select-none p-5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-[#08080C] shadow-[0_0_30px_rgba(192,132,252,0.3)] border border-[#C084FC]/80 -translate-y-1" 
                        : "bg-[#08080C]/80 hover:bg-[#08080C] border border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="space-y-1.5 w-full">
                      {/* Column Badge */}
                      <span className={`text-[11px] font-sans tracking-wider uppercase font-bold block ${isActive ? "text-[#C084FC]" : "text-purple-300/80"}`}>
                        {pillar.badge}
                      </span>

                      {/* Column Title */}
                      <h3 className="text-base sm:text-lg font-display font-semibold text-white group-hover:text-purple-200 transition-colors leading-snug" style={{ color: '#FFFFFF' }}>
                        {pillar.title}
                      </h3>

                      {/* Agent Subtitle */}
                      <span className="text-xs font-sans text-slate-300 block font-medium">
                        {pillar.agent}
                      </span>
                    </div>

                    <div className="space-y-3 pt-3 w-full flex flex-col items-center">
                      {/* Metric Pill */}
                      <span className={`text-xs font-sans px-3.5 py-1 rounded-full border transition-all ${
                        isActive 
                          ? "bg-[#C084FC] text-black font-bold border-white shadow-md" 
                          : "bg-[#141424] text-purple-200 border-white/20 group-hover:border-white/40"
                      }`}>
                        {pillar.metric}
                      </span>

                      {/* Column Description */}
                      <p className="text-xs text-slate-200 font-light leading-relaxed max-w-[210px]">
                        {pillar.desc}
                      </p>

                      {/* Selection Action Indicator */}
                      <span className={`text-xs font-sans block pt-1 ${isActive ? "text-[#C084FC] font-semibold" : "text-slate-400 group-hover:text-slate-200"}`}>
                        {isActive ? "Active Pillar" : "Select Pillar"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* 2. LIVE GENERATED OUTPUT CONSOLE */}
          <div className="w-full relative z-20 space-y-4 text-left pt-6">
            
            {/* Console Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-slate-300 border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-white font-semibold text-sm tracking-wider uppercase" style={{ color: '#FFFFFF' }}>
                  SPECIALIST CREATOR CONSOLE — PILLAR 0{activeDnaPillar + 1}
                </span>
              </div>
              <span className="text-[#C084FC] font-semibold text-xs tracking-wider uppercase px-3 py-1 rounded-full bg-[#C084FC]/10 border border-[#C084FC]/30">
                {activeDnaPillar === 0 && "Arthur Voice Synced ✓"}
                {activeDnaPillar === 1 && "Sarah Research Synced ✓"}
                {activeDnaPillar === 2 && "Alex Copy Engine Synced ✓"}
                {activeDnaPillar === 3 && "Chloe Visual Systems Synced ✓"}
              </span>
            </div>

            {/* Master Output Presentation Console Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDnaPillar}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-[#0C0C14] border border-white/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl"
              >
                {activeDnaPillar === 0 && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <h4 className="text-lg font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Arthur • Founder Voice Clone Engine</h4>
                        <p className="text-xs text-slate-400 font-sans">Calibrated to Founder Tone & Authentic Personal Story</p>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 text-xs font-sans text-[#C084FC] font-semibold">
                        <span>Voice Synthesizer Active (98.7%)</span>
                      </div>
                    </div>

                    <p className="text-base sm:text-lg font-sans text-slate-100 leading-relaxed italic border-l-4 border-[#C084FC] pl-5 py-1">
                      "Most founders over-complicate brand positioning. They hire expensive agencies to write vague buzzwords that nobody remembers. Here is the exact 3-step framework we used to scale inbound demos without spending a dime on ads..."
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-sans">
                      <span className="px-3.5 py-1.5 rounded-lg bg-purple-950/80 border border-[#7C3AED]/60 text-[#C084FC] font-semibold">Tone: Founder Direct</span>
                      <span className="px-3.5 py-1.5 rounded-md bg-purple-950/80 border border-[#7C3AED]/60 text-[#C084FC] font-semibold">High-Signal Copy</span>
                      <span className="px-3.5 py-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-semibold">Zero Buzzwords ✓</span>
                    </div>
                  </div>
                )}

                {activeDnaPillar === 1 && (
                  <div className="space-y-5">
                    <div className="border-b border-white/10 pb-4">
                      <h4 className="text-lg font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Sarah • Audience Research Specialist</h4>
                      <p className="text-xs text-slate-400 font-sans">Real-Time Web Research & Competitor Gap Intelligence</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                        <span className="text-emerald-300 font-semibold block uppercase tracking-wider">Audience Pain Point</span>
                        <p className="text-slate-200 text-xs font-sans">"Agencies take 3 weeks and deliver generic regurgitated AI content."</p>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
                        <span className="text-[#C084FC] font-semibold block uppercase tracking-wider">Verified Insight</span>
                        <p className="text-slate-200 text-xs font-sans">"74% of B2B buyers ignore cold generic sales pitches on social."</p>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2">
                        <span className="text-blue-300 font-semibold block uppercase tracking-wider">Content Focus</span>
                        <p className="text-slate-200 text-xs font-sans">'Speed, Unedited Founder Voice & Zero Empty Promises'</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDnaPillar === 2 && (
                  <div className="space-y-5">
                    <div className="border-b border-white/10 pb-4">
                      <h4 className="text-lg font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Alex • Multi-Channel Copywriting Engine</h4>
                      <p className="text-xs text-slate-400 font-sans">Platform-Native Formatting (LinkedIn Long-form & X Threads)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans text-xs">
                      <div className="p-5 bg-white/[0.03] rounded-xl border border-white/15 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[#C084FC] font-semibold text-xs">LinkedIn Post</span>
                          <span className="text-slate-400 text-[11px]">1,240 Characters</span>
                        </div>
                        <p className="text-slate-200 text-xs font-sans leading-relaxed">
                          How we saved 20 hours a week by moving from random Notion drafts to a central Brand DNA engine. Most founders fail at content because they write when inspired instead of building a system...
                        </p>
                      </div>

                      <div className="p-5 bg-white/[0.03] rounded-xl border border-white/15 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-blue-300 font-semibold text-xs">X Thread</span>
                          <span className="text-slate-400 text-[11px]">280 Characters</span>
                        </div>
                        <p className="text-slate-200 text-xs font-sans leading-relaxed">
                          If your brand content could belong to anyone, your positioning is invisible. Here is why 90% of SaaS founders sound identical on social media (and how to fix it)...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDnaPillar === 3 && (
                  <div className="space-y-5">
                    <div className="border-b border-white/10 pb-4">
                      <h4 className="text-lg font-display font-medium text-white" style={{ color: '#FFFFFF' }}>Chloe & Julian • Visual Systems Render Engine</h4>
                      <p className="text-xs text-slate-400 font-sans">Custom Graphic Templates (Typography, Layout & Palette)</p>
                    </div>

                    <div className="h-40 rounded-xl bg-gradient-to-r from-purple-950/80 via-[#181826] to-[#0A0A10] border border-purple-500/40 p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
                      <div className="flex justify-between items-center text-xs font-sans text-[#C084FC] font-semibold">
                        <span>BRAND DNA VISUAL SYSTEM</span>
                        <span>1080 x 1080 PNG</span>
                      </div>
                      <p className="text-xl font-display font-semibold text-white tracking-tight">
                        "From Random Posts To Brand DNA."
                      </p>
                      <div className="flex items-center justify-between text-xs font-sans text-slate-300">
                        <span>Autogenerated Graphic Asset</span>
                        <span className="text-emerald-400 font-medium">Rendered ✓</span>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

          </div>

        </div>
      </section>

      {/* 5. TAILORED USE CASES: LUXURY WORKFLOW TRACKS (ZERO MONOSPACE, ZERO TECH SLOP) */}
      <section data-nav-theme="light" className="py-28 md:py-40 w-full px-6 md:px-16 lg:px-24 bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span className="text-xs font-sans font-semibold tracking-wider text-[#7C3AED] uppercase">
                TAILORED CREATOR WORKFLOWS
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-slate-900 leading-[1.08]">
              Three Workflows. <br />
              <span className="font-normal italic text-[#7C3AED]">Zero Writing Friction.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-2xl pt-1">
              Whether you manage 50 client accounts, launch product features weekly, or grow a personal brand as a founder — BrandToPost fits naturally into your routine.
            </p>
          </div>

          {/* 3 WORKFLOW TRACKS */}
          <div className="space-y-28">
            
            {/* WORKFLOW 01 :: MARKETING AGENCIES */}
            <div className="space-y-10 pt-10 border-t border-slate-900/10 relative">
              
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] tracking-wider uppercase block">
                    AGENCIES & CONTENT STUDIOS
                  </span>
                  <h3 className="text-3xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight">
                    For Marketing Agencies
                  </h3>
                  <p className="text-base text-slate-600 font-light pt-1">
                    Manage 50+ client accounts effortlessly with complete voice separation. Never mix up client tones or reuse cookie-cutter templates.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-sans shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Client Voice Separation</span>
                    <strong className="text-slate-900 text-sm font-semibold">100% Isolated</strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium font-sans">Retainer Margins</span>
                    <strong className="text-[#7C3AED] text-sm font-semibold">+340% Margin Boost</strong>
                  </div>
                </div>
              </div>

              {/* 4 Linear Steps Across Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
                
                {/* Step 1 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] uppercase tracking-wider block">STEP 1</span>
                  <h4 className="text-base font-semibold text-slate-900">Upload Client Guidelines</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Set up individual brand rules, audience details, and style guides for each client in isolated workspaces.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3 pl-6 border-l-2 border-[#7C3AED] relative">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] uppercase tracking-wider block">STEP 2</span>
                  <h4 className="text-base font-semibold text-slate-900">AI Agents Research & Draft</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Sarah finds market gaps, Alex writes platform-native copy, and Chloe creates matching graphics.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider block">STEP 3</span>
                  <h4 className="text-base font-semibold text-slate-900">30-Day Campaign Generated</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Get a complete monthly calendar of ready-to-publish posts and newsletter drafts in under 5 minutes.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-3 pl-6 border-l-2 border-emerald-500 relative">
                  <span className="text-xs font-sans font-bold text-emerald-600 uppercase tracking-wider block">STEP 4</span>
                  <h4 className="text-base font-semibold text-slate-900">Higher Retainers & Margins</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Show clients real market research and custom creative output — justifying premium monthly retainer fees.
                  </p>
                </div>

              </div>

              {/* Callout Quote */}
              <div className="pl-6 border-l-2 border-slate-900/20 text-slate-700 text-sm font-sans italic pt-2">
                "Every client brand gets its own distinct voice graph — zero cross-pollination or recycled prompt templates."
              </div>

            </div>


            {/* WORKFLOW 02 :: STARTUPS & PRODUCT TEAMS */}
            <div className="space-y-10 pt-10 border-t border-slate-900/10 relative">
              
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] tracking-wider uppercase block">
                    STARTUPS & PRODUCT TEAMS
                  </span>
                  <h3 className="text-3xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight">
                    For Startups & Product Teams
                  </h3>
                  <p className="text-base text-slate-600 font-light pt-1">
                    Turn product updates, feature releases, and engineering changelogs into engaging marketing content automatically.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-sans shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Channel Inactivity</span>
                    <strong className="text-emerald-600 text-sm font-semibold">Zero Brand Silence</strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Product Changelogs</span>
                    <strong className="text-slate-900 text-sm font-semibold">Auto-Converted</strong>
                  </div>
                </div>
              </div>

              {/* 4 Linear Steps Across Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
                
                {/* Step 1 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider block">STEP 1</span>
                  <h4 className="text-base font-semibold text-slate-900">Connect Product Updates</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Feed release notes, product specs, or changelogs straight into your brand story hub.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3 pl-6 border-l-2 border-[#7C3AED] relative">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] uppercase tracking-wider block">STEP 2</span>
                  <h4 className="text-base font-semibold text-slate-900">Sync All Marketing Channels</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Keep website copy, launch announcements, investor updates, and social threads perfectly aligned.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider block">STEP 3</span>
                  <h4 className="text-base font-semibold text-slate-900">Turn Milestones into Content</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Automatically convert new feature releases into clear social posts and visuals while your team builds.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-3 pl-6 border-l-2 border-emerald-500 relative">
                  <span className="text-xs font-sans font-bold text-emerald-600 uppercase tracking-wider block">STEP 4</span>
                  <h4 className="text-base font-semibold text-slate-900">Constant Brand Momentum</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Never let your social channels go dark between product releases — stay top of mind for users and investors.
                  </p>
                </div>

              </div>

              {/* Callout Quote */}
              <div className="pl-6 border-l-2 border-slate-900/20 text-slate-700 text-sm font-sans italic pt-2">
                "Your company brand shouldn't go dark for three weeks every time your team focuses on building."
              </div>

            </div>


            {/* WORKFLOW 03 :: FOUNDERS & DOMAIN EXPERTS */}
            <div className="space-y-10 pt-10 border-t border-slate-900/10 relative">
              
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] tracking-wider uppercase block">
                    FOUNDER PERSONAL BRAND
                  </span>
                  <h3 className="text-3xl md:text-5xl font-display font-semibold text-slate-900 tracking-tight">
                    For Founders & Experts
                  </h3>
                  <p className="text-base text-slate-600 font-light pt-1">
                    Build an authentic personal brand in 5 minutes a day. Record a quick voice note; AI turns it into posts that sound just like you.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-sans shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Voice Matching</span>
                    <strong className="text-[#7C3AED] text-sm font-semibold">Authentic Tone</strong>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Daily Phone Review</span>
                    <strong className="text-slate-900 text-sm font-semibold">5 Minutes</strong>
                  </div>
                </div>
              </div>

              {/* 4 Linear Steps Across Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
                
                {/* Step 1 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider block">STEP 1</span>
                  <h4 className="text-base font-semibold text-slate-900">Clone Your Unique Voice</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Arthur captures your vocabulary, favorite expressions, real anecdotes, and decision rules.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-3 pl-6 border-l-2 border-[#7C3AED] relative">
                  <span className="text-xs font-sans font-bold text-[#7C3AED] uppercase tracking-wider block">STEP 2</span>
                  <h4 className="text-base font-semibold text-slate-900">Record a 30-Second Note</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Speak your raw thoughts on the go; specialist agents format them into structured posts, threads, and emails.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-3 pl-6 border-l-2 border-slate-200 relative">
                  <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-wider block">STEP 3</span>
                  <h4 className="text-base font-semibold text-slate-900">5-Minute Phone Review</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Review queued drafts on your phone, tweak any word if desired, and publish — zero writing burnout.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="space-y-3 pl-6 border-l-2 border-emerald-500 relative">
                  <span className="text-xs font-sans font-bold text-emerald-600 uppercase tracking-wider block">STEP 4</span>
                  <h4 className="text-base font-semibold text-slate-900">Inbound Lead & Trust Gravity</h4>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Build domain authority and direct trust with an authentic, un-edited personal brand presence.
                  </p>
                </div>

              </div>

              {/* Callout Quote */}
              <div className="pl-6 border-l-2 border-slate-900/20 text-slate-700 text-sm font-sans italic pt-2">
                "Build an authentic public voice that sounds like you — not a ghostwritten PR template."
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. HOW BRANDTOPOST WORKS: LUXURY SOCIAL MEDIA CREATOR STUDIO */}
      <section data-nav-theme="dark" className="py-28 md:py-40 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Warm Velvet Glow Canvas */}
        <div className="absolute top-1/4 left-1/4 w-[36rem] h-[36rem] bg-gradient-to-tr from-purple-900/30 via-pink-900/20 to-transparent rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-gradient-to-tr from-emerald-900/20 via-teal-900/20 to-transparent rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10 space-y-20">
          
          {/* Elegant Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-sans font-semibold text-purple-300 tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>SOCIAL CONTENT PIPELINE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              How Content Ships <br />
              <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-emerald-300">Across All Your Channels.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-2xl pt-1">
              From quick voice notes to polished LinkedIn posts, X threads, and carousels — published across all your channels in three simple steps.
            </p>
          </div>

          {/* 3 LUXURY CREATOR STUDIO CARDS (ZERO TECH MONOSPACE) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CARD 01 :: BRAND VOICE & TONE */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-400/50 transition-all duration-500 space-y-6 group relative overflow-hidden flex flex-col justify-between transform-gpu"
            >
              <div className="space-y-6">
                
                {/* Social Card Preview */}
                <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 shadow-lg">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      VB
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">Your Personal Brand</span>
                      <span className="text-[11px] text-purple-300 font-sans">Authentic Writing Tone</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed italic">
                    "We turned 3 casual voice notes into a week of high-converting LinkedIn posts and newsletters. Here is the exact framework..."
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-300 font-sans font-medium pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">4,200 Impressions</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">48 Comments</span>
                  </div>
                </div>

                {/* Step Text */}
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-purple-300 tracking-wider uppercase block">STEP 01</span>
                  <h3 className="text-2xl font-display font-semibold text-white">1. Share Your Voice & Style</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Record a 30-second voice note, upload past top posts, or share guidelines. Our system builds a content voice that sounds 100% authentic to you.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Personal Voice Graph</span>
                <span className="text-purple-300 font-semibold">Ready</span>
              </div>
            </motion.div>


            {/* CARD 02 :: MULTI-CHANNEL DISTRIBUTION */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-blue-400/50 transition-all duration-500 space-y-6 group relative overflow-hidden flex flex-col justify-between transform-gpu"
            >
              <div className="space-y-6">
                
                {/* Social Card Preview */}
                <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-sans text-blue-300 font-semibold uppercase tracking-wider">Connected Networks</span>
                    <span className="text-[11px] font-sans px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">4 Channels</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                    {/* LinkedIn Logo Badge */}
                    <div className="p-3 rounded-xl bg-[#0A66C2]/15 border border-[#0A66C2]/40 text-white flex items-center justify-center gap-2.5 hover:border-[#0A66C2] transition-all">
                      <svg className="w-4 h-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                      <span className="font-semibold text-slate-100">LinkedIn</span>
                    </div>

                    {/* X (Twitter) Logo Badge */}
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center gap-2.5 hover:border-white/50 transition-all">
                      <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="font-semibold text-slate-100">X (Twitter)</span>
                    </div>

                    {/* Instagram Logo Badge */}
                    <div className="p-3 rounded-xl bg-pink-500/15 border border-pink-500/40 text-white flex items-center justify-center gap-2.5 hover:border-pink-400 transition-all">
                      <svg className="w-4 h-4 fill-pink-400 shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="font-semibold text-slate-100">Instagram</span>
                    </div>

                    {/* Newsletter Logo Badge */}
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-white flex items-center justify-center gap-2.5 hover:border-emerald-400 transition-all">
                      <svg className="w-4 h-4 fill-emerald-400 shrink-0" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <span className="font-semibold text-slate-100">Newsletter</span>
                    </div>
                  </div>
                </div>

                {/* Step Text */}
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-blue-300 tracking-wider uppercase block">STEP 02</span>
                  <h3 className="text-2xl font-display font-semibold text-white">2. Connect Your Channels</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Link LinkedIn, X, Instagram, and newsletters. Choose your posting schedule, content themes, and target goals (leads, authority, launches).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Distribution Schedule</span>
                <span className="text-blue-300 font-semibold">Synced</span>
              </div>
            </motion.div>


            {/* CARD 03 :: 1-TAP PUBLISHING */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/50 transition-all duration-500 space-y-6 group relative overflow-hidden flex flex-col justify-between transform-gpu"
            >
              <div className="space-y-6">
                
                {/* Social Card Preview */}
                <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-sans text-emerald-300 font-semibold uppercase tracking-wider">Phone Review</span>
                    <span className="text-[11px] font-sans text-emerald-300 font-semibold">1-Tap Approve</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                    <span className="text-xs font-semibold text-slate-200 block">Weekly Content Deck Drafted</span>
                    <button className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-md transition-all">
                      Publish Posts to All Channels →
                    </button>
                  </div>
                </div>

                {/* Step Text */}
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-emerald-300 tracking-wider uppercase block">STEP 03</span>
                  <h3 className="text-2xl font-display font-semibold text-white">3. Review & Ship in 1 Click</h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Specialist AI copywriters and visual designers draft your posts and graphics. Review queued content on your phone, hit publish, and watch your audience grow.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Automated Publishing</span>
                <span className="text-emerald-300 font-semibold">Active</span>
              </div>
            </motion.div>

          </div>

          {/* Primary Call to Action */}
          <div className="pt-8 text-center">
            <Link to="/login?mode=signup" className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all shadow-xl shadow-[#7C3AED]/30 hover:shadow-2xl hover:shadow-[#7C3AED]/50 hover:scale-[1.02] transform-gpu">
              <span>Start Distributing My Content</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 7. NEXT-GEN MODULES: VIBRANT LUXURY CREATOR LAB & FUTURE ROADMAP */}
      <section data-nav-theme="dark" className="py-28 md:py-40 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Vibrant Gradient Background Mesh Circles */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-gradient-to-tr from-[#7C3AED]/30 via-pink-500/20 to-rose-500/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-gradient-to-tr from-pink-500/25 via-rose-500/20 to-amber-500/20 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10 space-y-16">
          
          {/* Status Header Badge & Title */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-pink-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-pink-500 via-purple-400 to-rose-500 rounded-full" />
              <span>VIBRANT CREATOR LAB</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              4 Next-Gen Power Modules <br />
              <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300">Unlocking in the Creator Lab.</span>
            </h2>

            <p className="text-base sm:text-lg font-light leading-relaxed max-w-2xl text-slate-300">
              Our engineering team is shipping fast. These 4 power modules are in final calibration before public unlock.
            </p>
          </div>

          {/* 4 Vibrant Creator Lab Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Module 1: Mobile Command */}
            <div className="border border-white/10 bg-white/[0.03] p-7 rounded-3xl space-y-6 relative group hover:border-purple-400/50 transition-all duration-500 flex flex-col justify-between transform-gpu">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="5" y="2" width="14" height="20" rx="3" />
                      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Beta Access</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-emerald-400 uppercase tracking-wider block">MODULE 01 — MOBILE</span>
                  <h3 className="text-xl font-display font-semibold text-white">Mobile Command Bot</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-300">
                    Command your 10-agent team via quick voice notes. Review Monday decks and auto-publish from your pocket.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Webhook Bot</span>
                <span className="text-emerald-300 font-semibold">Synced ✓</span>
              </div>
            </div>

            {/* Module 2: Video Engine */}
            <div className="border border-white/10 bg-white/[0.03] p-7 rounded-3xl space-y-6 relative group hover:border-purple-400/50 transition-all duration-500 flex flex-col justify-between transform-gpu">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-purple-300 tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Lab Locked</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-purple-400 uppercase tracking-wider block">MODULE 02 — VIDEO</span>
                  <h3 className="text-xl font-display font-semibold text-white">B2B Video Screenwriter</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-300">
                    Zack (Video Screenwriter) auto-generates B2B video scripts, Luma/Sora B-roll prompts, and scene timing.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Screenplay Engine</span>
                <span className="text-purple-300 font-semibold">Testing ✓</span>
              </div>
            </div>

            {/* Module 3: Visual Graphic Canvas */}
            <div className="border border-white/10 bg-white/[0.03] p-7 rounded-3xl space-y-6 relative group hover:border-blue-400/50 transition-all duration-500 flex flex-col justify-between transform-gpu">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-blue-300 tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Coming Soon</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-blue-300 uppercase tracking-wider block">MODULE 03 — CANVAS</span>
                  <h3 className="text-xl font-display font-semibold text-white">Visual Graphic Canvas</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-300">
                    Chloe & Julian headless graphics engine for custom brand overlays, dynamic cards, and PNG templates.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-sans text-slate-400 flex items-center justify-between font-medium">
                <span>Canvas Renderer</span>
                <span className="text-blue-300 font-semibold">Sealed ✓</span>
              </div>
            </div>

            {/* Module 4: UGC CREATOR STUDIO (NEW VIBRANT FEATURE!) */}
            <div className="border-2 border-pink-500/50 bg-gradient-to-b from-pink-950/30 via-slate-900/60 to-slate-950/90 p-7 rounded-3xl space-y-6 relative group hover:border-pink-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.35)] transition-all duration-500 flex flex-col justify-between transform-gpu">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/30">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-bold text-pink-300 tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                    <span>Vibrant Unlock</span>
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-sans font-bold text-pink-400 uppercase tracking-wider block">MODULE 04 — UGC CREATOR</span>
                  <h3 className="text-xl font-display font-semibold text-white">UGC Creator Studio</h3>
                  <p className="text-xs font-light leading-relaxed text-slate-200">
                    Autonomously converts blog posts, customer testimonials, and voice notes into organic, human-first UGC video hooks and creator assets.
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs font-sans text-pink-300 flex items-center justify-between font-bold">
                <span>TikTok • Shorts • Brand UGC</span>
                <span className="text-pink-400">UNLOCKING ⚡</span>
              </div>
            </div>

          </div>

          {/* Beta Access Callout Box */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/20 via-slate-900 to-pink-950/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-left">
              <h4 className="text-lg font-display font-semibold text-white" style={{ color: '#FFFFFF' }}>Want early beta access to our Creator Lab & UGC Engine?</h4>
              <p className="text-xs text-slate-300 font-light">Join the priority queue to unlock developer access when these modules release.</p>
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
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-600 to-pink-600 text-white font-bold text-xs transition-all shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.02] shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Request Beta Access →</span>
            </a>
          </div>

        </div>
      </section>

      {/* 8. WHY THIS BEATS "JUST USING AI" (STUNNING LIGHT-THEME CREATOR CONTRAST CONSOLE) */}
      <section data-nav-theme="light" className="py-28 md:py-40 w-full bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left overflow-hidden">
        
        {/* Soft Purple Ambient Light Mesh */}
        <div className="absolute top-1/2 left-0 w-[36rem] h-[36rem] bg-purple-200/50 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[30rem] h-[30rem] bg-pink-200/40 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10 space-y-16">
          
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-purple-400 rounded-full" />
              <span>THE UNFAIR ADVANTAGE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight text-slate-900 leading-[1.08]">
              Not Another <br />
              <span className="font-normal italic text-[#7C3AED]">AI Content Button.</span>
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-2xl">
              Most AI tools optimize for speed and volume, not quality or authenticity — that’s how AI slop took over social feeds and search algorithms. Here is how BrandToPost safeguards your authority.
            </p>
          </div>

          {/* Side-by-Side Visual Comparison Console (Light Theme) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left items-stretch">
            
            {/* COLUMN 1: Generic AI Tools (The AI Slop Trap) */}
            <div className="p-8 rounded-3xl bg-rose-500/[0.04] border border-rose-200/80 space-y-6 relative flex flex-col justify-between group hover:border-rose-300 transition-all duration-500 shadow-sm">
              <div className="space-y-6">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-sm font-sans font-bold text-rose-700 uppercase tracking-wider">Generic AI Prompt Box</span>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-rose-600 bg-rose-100/80 border border-rose-200 px-3 py-1 rounded-full">
                    AI Slop Trap
                  </span>
                </div>

                {/* Prompt Box */}
                <div className="space-y-2">
                  <span className="text-xs font-sans text-slate-500 font-medium block">User Prompt Input:</span>
                  <div className="p-4 rounded-2xl bg-white border border-rose-200/60 text-xs text-slate-600 italic font-sans shadow-xs">
                    “Write a viral LinkedIn post about B2B growth secrets.”
                  </div>
                </div>

                {/* Output Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-sans text-rose-600 font-semibold block">Generated Output Preview:</span>
                  <div className="p-5 rounded-2xl bg-white border border-rose-200/60 text-xs text-slate-500 font-sans leading-relaxed space-y-3 shadow-xs">
                    <p className="line-through opacity-75">
                      “In today’s fast-paced digital landscape, business leaders must leverage innovative synergies to scale growth exponential!”
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-rose-500 font-medium">
                      <span>#marketing</span>
                      <span>#growth</span>
                      <span>#leadership</span>
                      <span>#success</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Disadvantage Readouts */}
              <div className="pt-6 border-t border-rose-200/60 grid grid-cols-2 gap-3 text-xs font-sans font-medium text-rose-700">
                <div className="flex items-center gap-2">
                  <span>✕ Zero Brand Context</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✕ Generic Corporate Buzzwords</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✕ Lost Founder Voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✕ Zero Audience Trust</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: BrandToPost DNA Engine (The Founder Solution) */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#7C3AED] shadow-2xl shadow-[#7C3AED]/15 space-y-6 relative flex flex-col justify-between group hover:border-[#6D28D9] transition-all duration-500 transform-gpu overflow-hidden">
              
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-sans font-bold text-slate-900 uppercase tracking-wider">BrandToPost DNA Engine</span>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-[#7C3AED] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    100% Authentic Voice
                  </span>
                </div>

                {/* Autopilot Routing Box */}
                <div className="space-y-2">
                  <span className="text-xs font-sans text-[#7C3AED] font-semibold block">Autopilot Agent Routing:</span>
                  <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs text-slate-900 font-sans font-medium leading-relaxed">
                    Arthur + Sarah pulled 3 live ICP objections from last week’s market audit and formatted them into your exact founder voice clone.
                  </div>
                </div>

                {/* Output Preview */}
                <div className="space-y-2">
                  <span className="text-xs font-sans text-emerald-600 font-semibold block">Ready-To-Publish Output:</span>
                  <div className="p-5 rounded-2xl bg-[#08080C] text-white text-xs font-sans leading-relaxed space-y-3 shadow-xl">
                    <p className="font-medium text-white">
                      “We killed our $40,000 ad budget last month. Net pipeline generated: $0.”
                    </p>
                    <p className="text-slate-300 font-light">
                      Then we shut down the ad account and had our engineering team post organic breakdowns on LinkedIn. In 30 days: 3 Enterprise deals booked.
                    </p>
                  </div>
                </div>

              </div>

              {/* Advantage Readouts */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs font-sans font-semibold text-[#7C3AED] relative z-10">
                <div className="flex items-center gap-2">
                  <span>✓ 100% Founder Voice Clone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓ Real Market Intelligence</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓ 1-Tap Mobile Approvals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓ High-Converting ICP Copy</span>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Summary Bar */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1 text-left">
              <h4 className="text-lg font-display font-semibold text-slate-900">Stop wasting hours tweaking robotic AI output.</h4>
              <p className="text-xs text-slate-600 font-light">Deploy your Brand DNA engine in 60 seconds and approve content from your phone.</p>
            </div>
            
            <Link 
              to="/login?mode=signup"
              className="px-8 py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs transition-all shadow-lg shadow-[#7C3AED]/25 hover:scale-[1.02] shrink-0 flex items-center gap-2"
            >
              <span>Build My Brand DNA Engine →</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 9. WHAT YOU GET EVERY WEEK: WORLD-CLASS CREATOR BENTO GRID */}
      <section data-nav-theme="dark" className="py-28 md:py-40 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Soft Ambient Mesh Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-purple-900/15 rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-emerald-900/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10 space-y-16">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-300 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 rounded-full" />
              <span>COMPOUNDING BRAND ASSET</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05]" style={{ color: '#FFFFFF' }}>
              What You Get <br />
              <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-emerald-300">Every Single Week.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-2xl">
              An autonomous content engine that turns your raw ideas into ready-to-publish campaigns across all your primary channels.
            </p>
          </div>

          {/* ASYMMETRIC BENTO GRID SHOWCASE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left items-stretch">
            
            {/* BENTO BOX 1: Hero Lead Bento Box (Spans md:col-span-8) */}
            <div className="md:col-span-8 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-950/50 via-[#0D0D15] to-[#08080C] border-2 border-purple-500/50 relative overflow-hidden flex flex-col justify-between group hover:border-purple-400 transition-all duration-500 shadow-2xl transform-gpu">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-sm font-sans font-bold text-white uppercase tracking-wider">Compounding Brand DNA Vault</span>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    <span>01 // EVERGREEN DNA</span>
                  </span>
                </div>

                <div className="space-y-3 max-w-xl">
                  <h3 className="text-2xl sm:text-3xl font-display font-semibold text-white leading-snug">
                    A persistent digital brain that gets smarter with every post.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                    Unlike standard AI tools that start from scratch every prompt, your Brand DNA vault stores your founder heuristics, positioning rules, and ICP objection responses — making future content 10x faster and 100% on-brand.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-sans font-semibold text-purple-300 relative z-10">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Continuous Voice Calibration Active
                </span>
                <span className="text-purple-400 uppercase tracking-wider">Compounding Vault Asset ⚡</span>
              </div>
            </div>

            {/* BENTO BOX 2: Daily Multi-Channel Calendar (Spans md:col-span-4) */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 relative flex flex-col justify-between group hover:border-purple-400/50 transition-all duration-500 transform-gpu">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-purple-300 tracking-wider uppercase">02 // CALENDAR</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-display font-semibold text-white">Daily Multi-Channel Calendar</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    A synchronized calendar of daily posts across LinkedIn, X, Instagram, and newsletters — customized for each network.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-sans text-purple-300 font-semibold">
                <span>4 Primary Channels</span>
                <span>Active Sync ✓</span>
              </div>
            </div>

            {/* BENTO BOX 3: Human Experience Copy (Spans md:col-span-4) */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 relative flex flex-col justify-between group hover:border-emerald-400/50 transition-all duration-500 transform-gpu">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-emerald-400 tracking-wider uppercase">03 // COPYWRITING</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-display font-semibold text-white">Human Experience Copy</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Content that reads like a real founder with real industry experience — eliminating robotic corporate buzzwords.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-sans text-emerald-300 font-semibold">
                <span>Arthur Voice Clone</span>
                <span>100% Match ✓</span>
              </div>
            </div>

            {/* BENTO BOX 4: Research-Backed ICP Messaging (Spans md:col-span-4) */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 relative flex flex-col justify-between group hover:border-blue-400/50 transition-all duration-500 transform-gpu">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-blue-300 tracking-wider uppercase">04 // POSITIONING</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-display font-semibold text-white">Research-Backed Messaging</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    Sarah conducts live market research to extract real customer pain points and competitor complaints directly into your copy.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-sans text-blue-300 font-semibold">
                <span>Live Web Scraping</span>
                <span>Live Intelligence ✓</span>
              </div>
            </div>

            {/* BENTO BOX 5: Performance Analytics (Spans md:col-span-4) */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 relative flex flex-col justify-between group hover:border-pink-400/50 transition-all duration-500 transform-gpu">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-pink-400 tracking-wider uppercase">05 // ANALYTICS</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-display font-semibold text-white">Performance Analytics</h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    See exactly which hooks, narratives, and formats drive highest engagement, allowing agents to double down on winning angles.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-sans text-pink-300 font-semibold">
                <span>Hook Tuning</span>
                <span>Automated ✓</span>
              </div>
            </div>

          </div>

          {/* Bottom Action Bar */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-left">
              <h4 className="text-lg font-display font-semibold text-white" style={{ color: '#FFFFFF' }}>Ready to automate your weekly content deliverables?</h4>
              <p className="text-xs text-slate-300 font-light">Set up your Brand DNA vault in 60 seconds and launch your 10-agent team.</p>
            </div>
            
            <Link to="/login?mode=signup" className="px-8 py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs transition-all shadow-lg shadow-[#7C3AED]/30 hover:scale-[1.02] shrink-0 flex items-center gap-2">
              <span>Get Consistent, Non‑Slop Content →</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 10. MEET TROR: THE MASTER ORCHESTRATOR (SOCIAL MEDIA DISTRIBUTION BROADCAST STAGE) */}
      <section 
        data-nav-theme="dark"
        ref={section5Ref} 
        className="py-32 md:py-48 w-full bg-[#07070B] text-left relative z-10 border-y border-white/10 overflow-hidden flex items-center min-h-[750px]"
      >
        {/* Ambient Pulsing Signal Beams */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-purple-600/15 rounded-full blur-[240px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[35rem] h-[35rem] bg-blue-600/10 rounded-full blur-[200px] pointer-events-none" />

        <div className="w-full mx-auto max-w-7xl px-6 md:px-16 lg:px-24 relative z-10 space-y-16">
          
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-300 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full" />
              <span>THE SINGLE ORCHESTRATOR</span>
            </div>
            
            <h2 className="gsap-reveal-text text-4xl md:text-6xl font-light font-display text-white tracking-tight leading-[1.08]" style={{ color: '#FFFFFF' }}>
              One Engine. <br />
              <span className="font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">Infinite Social Distribution.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-2xl">
              TROR coordinates your entire specialist team behind the scenes — taking your raw Brand DNA and broadcasting platform-native posts across all your primary channels simultaneously.
            </p>
          </div>

          {/* CREATIVE SOCIAL MEDIA BROADCAST MATRIX (NO CARDS / NO TABS) */}
          <div className="relative w-full py-12 flex flex-col items-center justify-center min-h-[500px]">
            
            {/* Center Broadcast Core: TROR Mascot & Signal Pulse */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
              <div className="absolute w-96 h-96 rounded-full border border-purple-500/20 animate-ping-slow pointer-events-none" />
              
              <img 
                src="/Mascot.png" 
                className="w-56 md:w-72 h-auto object-contain relative z-10 drop-shadow-[0_0_60px_rgba(124,58,237,0.6)] transform-gpu hover:scale-105 transition-all duration-700" 
                alt="TROR Broadcast Core" 
              />

              <div className="mt-4 px-5 py-2 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-sans font-semibold text-white flex items-center gap-2.5 shadow-2xl backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>TROR BROADCAST CORE: ACTIVE</span>
              </div>
            </div>

            {/* 4 LIVE SOCIAL MEDIA DISTRIBUTION STREAMS (FLOATING NETWORK BROADCAST NODES) */}
            
            {/* NETWORK STREAM 1: LINKEDIN (Top-Left) */}
            <div className="absolute top-0 left-0 md:left-8 z-30 max-w-xs space-y-2 transform-gpu hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-2.5 text-xs font-sans font-bold text-blue-400">
                <div className="w-7 h-7 rounded-lg bg-[#0077B5]/20 border border-[#0077B5]/40 flex items-center justify-center p-1.5 shrink-0">
                  <svg className="w-full h-full fill-current text-[#0077B5]" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z" />
                  </svg>
                </div>
                <span>LINKEDIN EXECUTIVE FEED</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-blue-500/30 text-xs text-slate-200 font-sans leading-relaxed backdrop-blur-md shadow-xl">
                “We killed our $40k ad spend. Net pipeline generated: $0. Here is how organic authority took over...”
                <span className="block pt-2 text-[10px] text-emerald-400 font-semibold">✓ Arthur Voice Matched</span>
              </div>
            </div>

            {/* NETWORK STREAM 2: X / TWITTER (Top-Right) */}
            <div className="absolute top-0 right-0 md:right-8 z-30 max-w-xs space-y-2 transform-gpu hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-2.5 text-xs font-sans font-bold text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shrink-0">
                  <svg className="w-full h-full fill-current text-white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span>X / TWITTER VIRAL STREAM</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/20 text-xs text-slate-200 font-sans leading-relaxed backdrop-blur-md shadow-xl">
                “1/7 B2B distribution secrets category leaders don't discuss in public threads 🧵👇”
                <span className="block pt-2 text-[10px] text-purple-300 font-semibold">✓ Alex Multi-Channel Thread</span>
              </div>
            </div>

            {/* NETWORK STREAM 3: INSTAGRAM (Bottom-Left) */}
            <div className="absolute bottom-0 left-0 md:left-8 z-30 max-w-xs space-y-2 transform-gpu hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-2.5 text-xs font-sans font-bold text-pink-400">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center p-1.5 shrink-0">
                  <svg className="w-full h-full fill-current text-pink-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <span>INSTAGRAM CREATIVE FEED</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-pink-500/30 text-xs text-slate-200 font-sans leading-relaxed backdrop-blur-md shadow-xl">
                High-contrast typography carousel slides rendered with brand design system tokens.
                <span className="block pt-2 text-[10px] text-pink-300 font-semibold">✓ Chloe Graphic Layout</span>
              </div>
            </div>

            {/* NETWORK STREAM 4: NEWSLETTER (Bottom-Right) */}
            <div className="absolute bottom-0 right-0 md:right-8 z-30 max-w-xs space-y-2 transform-gpu hover:scale-105 transition-all duration-500">
              <div className="flex items-center gap-2.5 text-xs font-sans font-bold text-amber-400">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1.5 shrink-0">
                  <svg className="w-full h-full fill-none stroke-current stroke-2 text-amber-400" viewBox="0 0 24 24">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span>FOUNDER NEWSLETTER DISPATCH</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-amber-500/30 text-xs text-slate-200 font-sans leading-relaxed backdrop-blur-md shadow-xl">
                “Issue #42: Why positioning beats paid acquisition in early stage B2B startups.”
                <span className="block pt-2 text-[10px] text-amber-300 font-semibold">✓ Direct Inbox Broadcast</span>
              </div>
            </div>

          </div>

          {/* Bottom Broadcast Performance Metrics Bar */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-left">
              <h4 className="text-lg font-display font-semibold text-white" style={{ color: '#FFFFFF' }}>Stop managing fragmented social tools.</h4>
              <p className="text-xs text-slate-300 font-light">Deploy TROR to broadcast your authentic brand voice across all networks automatically.</p>
            </div>
            
            <Link to="/login?mode=signup" className="px-8 py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs transition-all shadow-lg shadow-[#7C3AED]/30 hover:scale-[1.02] shrink-0 flex items-center gap-2">
              <span>Launch TROR Broadcast Engine →</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 6. AGENT SOLITAIRE CARDS */}
      <AgentSolitaireCards />

      {/* 11. THE POST GROWTH METHODOLOGY (LIGHT-THEME EMOJI-FREE VIBRANT POST PIPELINE) */}
      <section className="py-28 md:py-40 w-full bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left overflow-hidden">
        
        {/* Soft Ambient Light Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-200/50 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[35rem] h-[35rem] bg-rose-200/40 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 relative z-10 space-y-16">
          
          {/* Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] via-pink-400 to-blue-400 rounded-full" />
              <span>GROWTH FRAMEWORK</span>
            </div>
            
            <h2 className="text-4xl md:text-7xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Proven POST Framework, <br />
              <span className="font-normal italic text-[#7C3AED]">Executed Daily On Autopilot.</span>
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-2xl">
              Organic distribution fails when content is random. Our agent network is engineered to execute the rigorous 4-stage POST methodology with zero friction.
            </p>
          </div>

          {/* Connected Laser Connector Line (Desktop) */}
          <div className="hidden lg:block relative w-full h-1 bg-gradient-to-r from-rose-400 via-purple-400 via-blue-400 to-emerald-400 rounded-full opacity-40 my-8" />
          
          {/* 4 VIBRANT LIGHT-THEME STAGE MODULES (ZERO EMOJIS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left items-stretch">
            
            {/* STAGE 01: P // Positioning DNA */}
            <div className="p-8 rounded-3xl bg-white border-2 border-rose-300 shadow-xl shadow-rose-500/10 space-y-6 flex flex-col justify-between group hover:border-rose-500 hover:-translate-y-1.5 transition-all duration-500 transform-gpu relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zM9 7a3 3 0 0 1 6 0v3H9V7z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-rose-600">
                    STAGE 01 // POSITIONING
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-semibold text-slate-900">
                    Positioning DNA
                  </h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Arthur locks down your ICP objections and founder voice heuristics so copy never drifts off-brand.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans font-semibold text-rose-600 relative z-10">
                <span className="text-slate-500 font-normal">Arthur Voice Clone</span>
                <span className="bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  100% Voice Match ✓
                </span>
              </div>
            </div>

            {/* STAGE 02: O // Outreach Routing */}
            <div className="p-8 rounded-3xl bg-white border-2 border-blue-300 shadow-xl shadow-blue-500/10 space-y-6 flex flex-col justify-between group hover:border-blue-500 hover:-translate-y-1.5 transition-all duration-500 transform-gpu relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-blue-600">
                    STAGE 02 // OUTREACH
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-semibold text-slate-900">
                    Outreach Routing
                  </h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Sarah searches for real-time market triggers, while Alex formats platform-native post structures.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans font-semibold text-blue-600 relative z-10">
                <span className="text-slate-500 font-normal">Sarah & Alex</span>
                <span className="bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  Live Market Audit ✓
                </span>
              </div>
            </div>

            {/* STAGE 03: S // Signal & Cards */}
            <div className="p-8 rounded-3xl bg-white border-2 border-purple-300 shadow-xl shadow-purple-500/10 space-y-6 flex flex-col justify-between group hover:border-purple-500 hover:-translate-y-1.5 transition-all duration-500 transform-gpu relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-purple-600">
                    STAGE 03 // SIGNAL & CARDS
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-semibold text-slate-900">
                    Signal & Cards
                  </h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Chloe & Julian build custom typography layouts and logo placements directly into scroll-stopping graphic slides.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans font-semibold text-purple-600 relative z-10">
                <span className="text-slate-500 font-normal">Chloe & Julian</span>
                <span className="bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  4K Visual Render ✓
                </span>
              </div>
            </div>

            {/* STAGE 04: T // Traction Autopilot */}
            <div className="p-8 rounded-3xl bg-white border-2 border-emerald-300 shadow-xl shadow-emerald-500/10 space-y-6 flex flex-col justify-between group hover:border-emerald-500 hover:-translate-y-1.5 transition-all duration-500 transform-gpu relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-600">
                    STAGE 04 // TRACTION
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-semibold text-slate-900">
                    Traction Autopilot
                  </h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Maya handles peak window scheduling and API publishing, transforming daily content into pipeline revenue.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans font-semibold text-emerald-600 relative z-10">
                <span className="text-slate-500 font-normal">Maya Dispatcher</span>
                <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  1-Tap Mobile Review ✓
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>
      {/* 12. CLIENT DELIVERABLES SHOWCASE (REAL CLIENT LOGOS & AUTHENTIC PREVIEWS) */}
      <section className="w-full bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 overflow-hidden">
        
        {/* Soft Ambient Studio Lighting */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-purple-200/40 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-[35rem] h-[35rem] bg-indigo-200/40 rounded-full blur-[180px] pointer-events-none" />

        <div className="pt-24 md:pt-36 pb-24 md:pb-36 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto relative z-10 space-y-16">
          
          {/* Section Header */}
          <div className="max-w-3xl text-left space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] via-pink-400 to-indigo-500 rounded-full" />
              <span>ACTUAL DELIVERABLES PROOF</span>
            </div>
            
            <h2 className="text-4xl md:text-7xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Real GTM Campaigns. <br />
              <span className="font-normal italic text-[#7C3AED]">Broadcasted For Category Leaders.</span>
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-2xl">
              We don't sell blank templates or prompt ebooks. Here is what live doppelganger campaign outputs actually look like across our client feeds.
            </p>
          </div>

          {/* 4 ULTRA-AUTHENTIC SOCIAL MEDIA FEED PREVIEWS WITH CLIENT LOGOS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left items-stretch">
            
            {/* 01. AUTHENTIC LINKEDIN POST FEED MOCKUP (AIMLPartner Brand) */}
            <div className="md:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 space-y-5 flex flex-col justify-between group hover:border-[#0077B5]/60 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                
                {/* LinkedIn Authentic Profile Header with AIML Partner Logo */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 p-1.5 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <img src="/aimlpartner_logo.png" alt="AIML Partner" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 font-sans">AIMLPartner Lead</span>
                        <span className="text-[10px] text-[#0077B5] font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">1st</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans">Founder & CEO @ AIMLPartner</div>
                      <div className="text-[10px] text-slate-400 font-sans">2h • Edited • 🌐</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#0077B5] bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z" />
                    </svg>
                    <span>LINKEDIN</span>
                  </div>
                </div>

                {/* LinkedIn Authentic Content Body & Real HD PDF Media Attachment */}
                <div className="text-xs sm:text-sm text-slate-800 font-sans leading-relaxed space-y-3 pt-1">
                  <p className="font-semibold text-slate-900">We spent $40k on ads last month. Net pipeline generated: $0.</p>
                  
                  {/* Authentic LinkedIn PDF Carousel Slide Attachment */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group-hover:border-[#0077B5]/40 transition-all shadow-sm">
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img 
                        src="/campaign_images/img_camp_2udj8fo6.png" 
                        alt="LinkedIn PDF Carousel Render" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-mono px-2.5 py-0.5 rounded border border-white/20">
                        PDF • 8 PAGES
                      </div>
                      <div className="absolute top-2 right-2 bg-[#0077B5] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                        Slide 1/8
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900 text-white space-y-1 text-left">
                      <div className="text-[10px] text-blue-400 font-mono">AIMLPartner Doppelganger Engine</div>
                      <div className="text-xs font-semibold text-white font-sans truncate">
                        Organic Doppelganger Growth Framework (30-Day B2B Playbook)
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-700 font-light text-xs">
                    In 30 days: 3 Enterprise demos booked. Paid ads capture demand. Organic thought leadership creates it.
                  </p>
                </div>
              </div>

              {/* LinkedIn Authentic Reaction & Action Bar */}
              <div className="pt-3 border-t border-slate-100 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0077B5] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                    <span>142 Reactions</span>
                  </span>
                  <span>18 comments • 4 reposts</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 text-slate-600 font-semibold text-[11px]">
                  <span className="hover:text-[#0077B5] cursor-pointer">Like</span>
                  <span className="hover:text-[#0077B5] cursor-pointer">Comment</span>
                  <span className="hover:text-[#0077B5] cursor-pointer">Repost</span>
                  <span className="hover:text-[#0077B5] cursor-pointer">Send</span>
                </div>
              </div>
            </div>

            {/* 02. AUTHENTIC X / TWITTER VIRAL THREAD MOCKUP (We Are KNWN Brand) */}
            <div className="md:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 space-y-5 flex flex-col justify-between group hover:border-slate-900/80 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                
                {/* Authentic X Profile Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 p-1.5 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <img src="/weareknwn_logo.png" alt="We Are KNWN" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 font-sans">KNWN Media</span>
                        <svg className="w-3.5 h-3.5 fill-[#1D9BF0]" viewBox="0 0 24 24">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM9.8 17.1l-4.2-4.2 1.4-1.4 2.8 2.8 7.4-7.4 1.4 1.4-8.8 8.8z"/>
                        </svg>
                        <span className="text-[11px] text-slate-500 font-normal">@weareknwn • 1h</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">Multi-Channel Thread Campaign</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-sans font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>POST THREAD</span>
                  </div>
                </div>

                {/* Authentic X Thread Body */}
                <div className="space-y-3 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
                  <p className="font-normal text-slate-900">
                    1/7 B2B distribution secrets category leaders don't discuss in public threads:
                  </p>
                  
                  {/* Authentic Native X Link Preview Attachment with Real HD Campaign Image */}
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group-hover:border-slate-400/60 transition-all shadow-sm">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                      <img 
                        src="/campaign_images/img_camp_3vtkqo0u.png" 
                        alt="B2B Doppelganger Engine Render" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[9px] font-mono px-2 py-0.5 rounded border border-white/20">
                        4K Graphic Render ✓
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-200/80 bg-slate-100/60 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans tracking-wide uppercase">brandtopost.ai</div>
                      <div className="text-xs font-bold text-slate-900 font-sans leading-snug">
                        B2B Doppelganger Engine: Extract & Auto-Broadcast Earned Secrets
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 font-light text-xs pt-1">
                    2/7 The secret is Earned Secrets. If you repeat standard blogs, you are noise. Extract unique insights from your team instead.
                  </p>
                </div>
              </div>

              {/* X Authentic Action Metrics Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  120
                </span>
                <span className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                  4.2k
                </span>
                <span className="flex items-center gap-1.5 hover:text-pink-500 cursor-pointer">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  842
                </span>
                <span className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  42.8k
                </span>
                <span className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  310
                </span>
              </div>
            </div>

            {/* 03. AUTHENTIC NATIVE INSTAGRAM POST PREVIEW (MINIM Brand) */}
            <div className="md:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#08080E] text-white border border-slate-800 shadow-2xl shadow-slate-950/60 space-y-4 flex flex-col justify-between group hover:border-pink-500/60 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                
                {/* Authentic Instagram Profile Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px] shrink-0 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#08080E] p-1.5 flex items-center justify-center overflow-hidden">
                        <img src="/MINIM-logo-primary.png" alt="MINIM" className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white font-sans">minim.official</span>
                        <svg className="w-3.5 h-3.5 fill-pink-500" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">Original audio • Chloe Studio Render</div>
                    </div>
                  </div>

                  <div className="text-slate-400 hover:text-white cursor-pointer font-bold tracking-widest text-xs">
                    •••
                  </div>
                </div>

                {/* Authentic Instagram Carousel Real Image Media Frame */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group-hover:border-pink-500/40 transition-all shadow-xl">
                  {/* Real HD Campaign Render Background Image */}
                  <img 
                    src="/campaign_images/img_camp_1ad1i7zu.png" 
                    alt="Organic B2B Pipeline Render" 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  />
                  
                  {/* Subtle Dark Gradient Overlay for Maximum Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 p-5 flex flex-col justify-between" />

                  {/* Top Slide Meta Tag */}
                  <div className="relative z-10 flex justify-between items-center text-[10px] text-pink-400 font-mono">
                    <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white font-semibold">SLIDE 01 OF 05</span>
                    <span className="bg-pink-500/80 text-white px-2.5 py-1 rounded-full text-[9px] font-semibold shadow-lg">4K Render ✓</span>
                  </div>
                  
                  {/* Bottom Typography & Stamped Logo */}
                  <div className="relative z-10 space-y-2 text-left">
                    <p className="text-white font-display text-base font-semibold leading-snug drop-shadow-md">
                      “The Organic B2B Pipeline: 15 minutes to configure, 30 days to scale.”
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-white/20">
                      <span className="text-[10px] text-slate-300 font-mono">Chloe Visual Tokens</span>
                      <img src="/MINIM-logo-primary.png" alt="MINIM Stamp" className="h-4 w-auto object-contain bg-white/90 p-1 rounded backdrop-blur-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Instagram Authentic Action Bar & Caption */}
              <div className="space-y-2 pt-2 border-t border-white/10 font-sans text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 fill-pink-500 stroke-none cursor-pointer hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <svg className="w-5 h-5 stroke-current fill-none stroke-2 cursor-pointer hover:text-white" viewBox="0 0 24 24">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <svg className="w-5 h-5 stroke-current fill-none stroke-2 cursor-pointer hover:text-white" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </div>

                  {/* Carousel Pagination Dots */}
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  </div>

                  <svg className="w-5 h-5 stroke-current fill-none stroke-2 cursor-pointer hover:text-white" viewBox="0 0 24 24">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>

                <div className="text-[11px] text-white font-semibold pt-1">
                  Liked by alex_b2p and 3,109 others
                </div>

                <div className="text-[11px] text-slate-300 font-light leading-snug">
                  <span className="font-semibold text-white mr-1.5">minim.official</span>
                  The Organic B2B Pipeline: 15 minutes to configure, 30 days to scale...
                </div>

                <div className="text-[10px] text-slate-500">
                  View all 84 comments • 2 hours ago
                </div>
              </div>
            </div>

            {/* 04. AUTHENTIC SUBSTACK / NEWSLETTER MOCKUP (Avenoir Brand) */}
            <div className="md:col-span-6 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/60 space-y-4 flex flex-col justify-between group hover:border-emerald-500/60 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                
                {/* Substack Inbox Header with Avenoir Logo */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 p-1.5 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                      <img src="/avenoirlogo.png" alt="Avenoir" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-sans">Avenoir Founder Insider</div>
                      <div className="text-[11px] text-slate-500 font-sans">Direct Inbox Broadcast • Issue #42</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-sans font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>NEWSLETTER</span>
                  </div>
                </div>

                {/* Substack Email Content Body with Real 4:3 HD Campaign Cover Image */}
                <div className="space-y-3 pt-1">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 group-hover:border-emerald-500/40 transition-all shadow-md">
                    <img 
                      src="/campaign_images/img_camp_6tvuaabo.png" 
                      alt="Avenoir Newsletter Cover" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px] text-emerald-300 font-mono">
                        <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white font-semibold">ISSUE #42 COVER</span>
                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-bold">54% Open Rate</span>
                      </div>
                      <div className="text-white text-xs font-bold font-sans drop-shadow-md">
                        Why positioning beats paid acquisition in early stage B2B startups
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 font-light text-xs leading-relaxed">
                    “If you don't own your category positioning, no paid ad spend will generate long-term brand equity...”
                  </p>
                </div>
              </div>

              {/* Substack Delivery Metrics Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500 font-medium">
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  54.2% Open Rate • 99.8% Inbox Rate
                </span>
                <span className="text-emerald-600 font-semibold">Maya Dispatch Autopilot</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 13. VERIFIED FOUNDER RESULTS & CASE STUDY PROOF (DYNAMIC INFINITE MARQUEE STREAM) */}
      <section data-nav-theme="dark" className="py-24 md:py-36 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        
        {/* Ambient Dark Studio Laser Glows */}
        <div className="absolute top-1/3 right-1/4 w-[45rem] h-[45rem] bg-purple-900/20 rounded-full blur-[220px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-pink-900/15 rounded-full blur-[200px] pointer-events-none" />

        <div className="space-y-16 relative z-10">
          
          {/* Section Header Container */}
          <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase">
                <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
                <span>VERIFIED FOUNDER RESULTS</span>
              </div>
              
              <h2 className="text-4xl md:text-7xl font-light font-display tracking-tight leading-[1.05] text-white">
                What Happens When Founders <br />
                <span className="font-normal italic text-purple-300">Automate Their Authority.</span>
              </h2>
              
              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
                Real growth metrics from category leaders who deployed our doppelganger distribution engine. Hover over any card to pause the live broadcast stream.
              </p>
            </div>
          </div>

          {/* DYNAMIC DUAL-ROW INFINITE ANIMATED BROADCAST STAGE */}
          <div className="relative w-full overflow-hidden space-y-8 py-4">
            
            {/* Left & Right Edge Gradient Mask for Smooth Seamless Dissolve */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#08080C] to-transparent z-20" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#08080C] to-transparent z-20" />

            {/* TRACK A: LEFTWARD INFINITE SCROLL */}
            <div className="flex w-full overflow-hidden">
              <div className="animate-marquee flex gap-8 shrink-0 py-2">
                {[
                  {
                    logo: "/MINIM-logo-primary.png",
                    name: "MINIM",
                    metric: "+340% Inbound Demos",
                    quote: "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound enterprise demos jumped by +340% in 30 days.",
                    founder: "Alex Rivera",
                    role: "Founder & CEO • MINIM",
                    badge: "Voice Clone Verified ✓",
                    color: "border-purple-500/40 text-purple-300 bg-purple-500/10"
                  },
                  {
                    logo: "/aimlpartner_logo.png",
                    name: "AIMLPartner",
                    metric: "2-Min Weekly Approval",
                    quote: "The 2-minute Monday approval deck is a total game changer. I review the queued campaign deck on my phone, click Approve All, and our channels run on autopilot.",
                    founder: "Sarah Chen",
                    role: "Co-Founder • AIMLPartner",
                    badge: "Autopilot Active ✓",
                    color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  },
                  {
                    logo: "/weareknwn_logo.png",
                    name: "KNWN Media",
                    metric: "4.2k Viral Retweets",
                    quote: "Our engineering secrets threads went viral on X three weeks in a row. The doppelganger engine turned our tech conversations into high-yield category authority content.",
                    founder: "David Miller",
                    role: "Head of Growth • KNWN Media",
                    badge: "Viral Pipeline ✓",
                    color: "border-blue-500/40 text-blue-300 bg-blue-500/10"
                  },
                  // Duplicate set for 100% infinite seamless loop
                  {
                    logo: "/MINIM-logo-primary.png",
                    name: "MINIM",
                    metric: "+340% Inbound Demos",
                    quote: "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound enterprise demos jumped by +340% in 30 days.",
                    founder: "Alex Rivera",
                    role: "Founder & CEO • MINIM",
                    badge: "Voice Clone Verified ✓",
                    color: "border-purple-500/40 text-purple-300 bg-purple-500/10"
                  },
                  {
                    logo: "/aimlpartner_logo.png",
                    name: "AIMLPartner",
                    metric: "2-Min Weekly Approval",
                    quote: "The 2-minute Monday approval deck is a total game changer. I review the queued campaign deck on my phone, click Approve All, and our channels run on autopilot.",
                    founder: "Sarah Chen",
                    role: "Co-Founder • AIMLPartner",
                    badge: "Autopilot Active ✓",
                    color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  },
                  {
                    logo: "/weareknwn_logo.png",
                    name: "KNWN Media",
                    metric: "4.2k Viral Retweets",
                    quote: "Our engineering secrets threads went viral on X three weeks in a row. The doppelganger engine turned our tech conversations into high-yield category authority content.",
                    founder: "David Miller",
                    role: "Head of Growth • KNWN Media",
                    badge: "Viral Pipeline ✓",
                    color: "border-blue-500/40 text-blue-300 bg-blue-500/10"
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="w-[380px] sm:w-[440px] shrink-0 border border-white/10 bg-[#0E0E17] p-8 rounded-3xl space-y-6 flex flex-col justify-between group hover:border-purple-500/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between border-b border-white/10 pb-5">
                        <img src={item.logo} alt={item.name} className="h-8 sm:h-9 max-w-[140px] w-auto object-contain brightness-110" />
                        <span className={`border px-3 py-1 rounded-full text-xs font-sans font-bold ${item.color}`}>
                          {item.metric}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-200 font-light leading-relaxed">
                        "{item.quote}"
                      </p>
                    </div>
                    <div className="pt-5 border-t border-white/10 flex items-center justify-between font-sans text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.founder}</h4>
                        <p className="text-slate-400">{item.role}</p>
                      </div>
                      <span className="text-purple-400 font-semibold text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRACK B: RIGHTWARD INFINITE SCROLL */}
            <div className="flex w-full overflow-hidden">
              <div className="animate-marquee-reverse flex gap-8 shrink-0 py-2">
                {[
                  {
                    logo: "/superherogym_logo.png",
                    name: "Superhero Gym",
                    metric: "$6,000/mo Saved",
                    quote: "I used to pay an agency $6,000/month for generic posts that got 5 likes. BrandToPost's voice clone captures my exact founder story for a fraction of the cost.",
                    founder: "Marcus Vance",
                    role: "Founder • Superhero Gym",
                    badge: "Agency Replaced ✓",
                    color: "border-pink-500/40 text-pink-300 bg-pink-500/10"
                  },
                  {
                    logo: "/avenoirlogo.png",
                    name: "Avenoir",
                    metric: "54.2% Open Rate",
                    quote: "Our founder newsletter open rates doubled once Maya automated our Substack dispatches. The copy reads like a personal letter from our CEO to every customer.",
                    founder: "Elena Rostova",
                    role: "Managing Director • Avenoir",
                    badge: "Inbox Verified ✓",
                    color: "border-amber-500/40 text-amber-300 bg-amber-500/10"
                  },
                  {
                    logo: "/lohiatraderslogo.png",
                    name: "Lohia Traders",
                    metric: "100% Brand Voice",
                    quote: "Scaling multi-channel content without diluting our brand voice was impossible until BrandToPost. Now 5 networks run in perfect synergy with zero tone drift.",
                    founder: "Vikram Lohia",
                    role: "Founder • Lohia Traders",
                    badge: "5 Channels Synced ✓",
                    color: "border-indigo-500/40 text-indigo-300 bg-indigo-500/10"
                  },
                  // Duplicate set for 100% infinite seamless loop
                  {
                    logo: "/superherogym_logo.png",
                    name: "Superhero Gym",
                    metric: "$6,000/mo Saved",
                    quote: "I used to pay an agency $6,000/month for generic posts that got 5 likes. BrandToPost's voice clone captures my exact founder story for a fraction of the cost.",
                    founder: "Marcus Vance",
                    role: "Founder • Superhero Gym",
                    badge: "Agency Replaced ✓",
                    color: "border-pink-500/40 text-pink-300 bg-pink-500/10"
                  },
                  {
                    logo: "/avenoirlogo.png",
                    name: "Avenoir",
                    metric: "54.2% Open Rate",
                    quote: "Our founder newsletter open rates doubled once Maya automated our Substack dispatches. The copy reads like a personal letter from our CEO to every customer.",
                    founder: "Elena Rostova",
                    role: "Managing Director • Avenoir",
                    badge: "Inbox Verified ✓",
                    color: "border-amber-500/40 text-amber-300 bg-amber-500/10"
                  },
                  {
                    logo: "/lohiatraderslogo.png",
                    name: "Lohia Traders",
                    metric: "100% Brand Voice",
                    quote: "Scaling multi-channel content without diluting our brand voice was impossible until BrandToPost. Now 5 networks run in perfect synergy with zero tone drift.",
                    founder: "Vikram Lohia",
                    role: "Founder • Lohia Traders",
                    badge: "5 Channels Synced ✓",
                    color: "border-indigo-500/40 text-indigo-300 bg-indigo-500/10"
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="w-[380px] sm:w-[440px] shrink-0 border border-white/10 bg-[#0E0E17] p-8 rounded-3xl space-y-6 flex flex-col justify-between group hover:border-pink-500/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between border-b border-white/10 pb-5">
                        <img src={item.logo} alt={item.name} className="h-8 sm:h-9 max-w-[140px] w-auto object-contain brightness-110" />
                        <span className={`border px-3 py-1 rounded-full text-xs font-sans font-bold ${item.color}`}>
                          {item.metric}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-200 font-light leading-relaxed">
                        "{item.quote}"
                      </p>
                    </div>
                    <div className="pt-5 border-t border-white/10 flex items-center justify-between font-sans text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.founder}</h4>
                        <p className="text-slate-400">{item.role}</p>
                      </div>
                      <span className="text-pink-400 font-semibold text-[11px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 14. THE UNFAIR ADVANTAGE — VISITOR PSYCHOLOGY COMPARISON MATRIX (Light Theme) */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10 text-left">
        <div className="pt-20 md:pt-28 pb-24 md:pb-32 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto space-y-16">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-emerald-400 rounded-full" />
              <span>THE UNFAIR FOUNDER ADVANTAGE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Why Founders Are Firing $6,000/mo Agencies <br />
              <span className="font-normal italic text-[#7C3AED]">And 5-Person Freelancer Teams.</span>
            </h2>
            
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              Traditional marketing agencies charge for headcount, bloated retainer hours, and endless status meetings. BrandToPost charges for automated outcome velocity.
            </p>
          </div>

          {/* PSYCHOLOGICAL COMPARISON MATRIX (3 COLUMNS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* COLUMN 01: TRADITIONAL MARKETING AGENCY */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-slate-200/50 hover:border-red-300 transition-all duration-300">
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <span className="text-xs text-red-500 font-sans font-semibold tracking-wider uppercase block">Outdated Model</span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">Marketing Agency</h3>
                  <div className="flex items-baseline gap-1 text-slate-950 mt-4">
                    <span className="text-3xl font-light font-display font-bold text-slate-900">$4,000 – $8,000</span>
                    <span className="text-xs text-slate-500 font-sans font-light">/ mo</span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans font-light mt-3 leading-relaxed">
                    Heavy monthly retainer fee covering account manager salaries and agency overheads.
                  </p>
                </div>

                {/* Economic Breakdown Rows */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-xs font-sans">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500 font-medium">Onboarding Overhead</span>
                    <span className="font-semibold text-slate-900 text-right">3 - 4 Weeks of Calls</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Weekly Founder Friction</span>
                    <span className="font-semibold text-red-600 text-right">10+ Hours Review Meetings</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Monthly Post Output</span>
                    <span className="font-semibold text-slate-900 text-right">4 - 6 Posts (Slow)</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Tone Accuracy</span>
                    <span className="font-semibold text-red-600 text-right">❌ High Risk (Junior Copy)</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Scalability</span>
                    <span className="font-semibold text-slate-700 text-right">Requires Higher Tier Retainer</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                <span className="text-xs font-sans font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full block">
                  Outdated Agency Retainer
                </span>
              </div>
            </div>

            {/* COLUMN 02: IN-HOUSE TEAM & FREELANCERS */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-slate-200/50 hover:border-amber-300 transition-all duration-300">
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <span className="text-xs text-amber-600 font-sans font-semibold tracking-wider uppercase block">High Overhead</span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">Freelancers / Hires</h3>
                  <div className="flex items-baseline gap-1 text-slate-950 mt-4">
                    <span className="text-3xl font-light font-display font-bold text-slate-900">$2,500 – $4,500</span>
                    <span className="text-xs text-slate-500 font-sans font-light">/ mo</span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans font-light mt-3 leading-relaxed">
                    Hiring copywriters, graphic designers, and social managers requiring constant oversight.
                  </p>
                </div>

                {/* Economic Breakdown Rows */}
                <div className="border-t border-slate-100 pt-6 space-y-4 text-xs font-sans">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500 font-medium">Onboarding Overhead</span>
                    <span className="font-semibold text-slate-900 text-right">2 - 3 Weeks Training</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Weekly Founder Friction</span>
                    <span className="font-semibold text-amber-600 text-right">6+ Hours Management</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Monthly Post Output</span>
                    <span className="font-semibold text-slate-900 text-right">8 - 10 Posts</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Tone Accuracy</span>
                    <span className="font-semibold text-amber-600 text-right">⚠️ Constant Tone Drift</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-500 font-medium">Scalability</span>
                    <span className="font-semibold text-slate-700 text-right">Limited by Human Hours</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                <span className="text-xs font-sans font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full block">
                  High Management Overhead
                </span>
              </div>
            </div>

            {/* COLUMN 03: BRANDTOPOST AI DOPPELGANGER STUDIO (FLAGSHIP HIGHLIGHT) */}
            <div className="bg-white border-2 border-[#7C3AED] rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-[#7C3AED]/15 transform md:-translate-y-2">
              
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md">
                Automated Founder Engine
              </div>

              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <span className="text-xs text-[#7C3AED] font-sans font-semibold tracking-wider uppercase block mt-1">Virtual Studio</span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">BrandToPost Studio</h3>
                  <div className="flex items-baseline gap-1 text-slate-950 mt-4">
                    <span className="text-3xl font-light font-display font-bold text-[#7C3AED]">₹2,499 – ₹4,499</span>
                    <span className="text-xs text-slate-500 font-sans font-light">/ mo</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans font-light mt-3 leading-relaxed">
                    Deploy your virtual AI specialist roster trained on your founder voice and positioning.
                  </p>
                </div>

                {/* Economic Breakdown Rows */}
                <div className="border-t border-purple-100 pt-6 space-y-4 text-xs font-sans">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-600 font-medium">Onboarding Overhead</span>
                    <span className="font-bold text-[#7C3AED] text-right">Instant 15-Min DNA Sync</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-600 font-medium">Weekly Founder Friction</span>
                    <span className="font-bold text-emerald-600 text-right">2-Min Monday Mobile Approval</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-600 font-medium">Monthly Post Output</span>
                    <span className="font-bold text-slate-900 text-right">20 - 30 Multi-Channel Campaigns</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-600 font-medium">Tone Accuracy</span>
                    <span className="font-bold text-emerald-600 text-right">✅ 100% Arthur Voice Clone</span>
                  </div>
                  <div className="flex items-start justify-between border-t border-slate-100/60 pt-3">
                    <span className="text-slate-600 font-medium">Scalability</span>
                    <span className="font-bold text-purple-700 text-right">Unlimited Autopilot Broadcast</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Link 
                  to="/login?mode=signup" 
                  className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all text-xs font-sans font-bold text-center rounded-xl shadow-lg shadow-[#7C3AED]/20 block"
                >
                  Deploy Doppelganger Engine — Replace Retainers
                </Link>
                <div className="text-center">
                  <span className="text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                    Saves $54,000+ / Year ✓
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* PSYCHOLOGICAL ROI PROOF CALLOUT BAR */}
          <div className="max-w-6xl mx-auto p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 font-sans">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">100% Control Guarantee</h4>
              <p className="text-xs text-slate-500 font-light max-w-lg">
                Nothing ever posts to your live channels without your explicit mobile approval. Review the weekly deck in 2 minutes, edit copy inline, or hit Approve All.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0 text-left">
              <div>
                <div className="text-2xl font-bold text-slate-900 font-display">240+ Hours</div>
                <div className="text-[11px] text-slate-500">Founder Time Reclaimed / Yr</div>
              </div>
              <div className="w-[1px] h-8 bg-slate-200" />
              <div>
                <div className="text-2xl font-bold text-emerald-600 font-display">0% Tone Drift</div>
                <div className="text-[11px] text-slate-500">Arthur Voice DNA Clone</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. FAQ ACCORDION (Editorial Minimalist Design) */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
      <div className="py-24 md:py-32 px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase mb-4">
            <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-purple-400 rounded-full" />
            <span>CLEAR ANSWERS</span>
          </div>
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

      {/* 16. HORIZONTAL 2-COLUMN HIGH-VOLTAGE FINAL CTA STAGE (WITH 4K BACKDROP RENDER) */}
      <section data-nav-theme="dark" className="py-32 md:py-48 px-6 md:px-16 lg:px-24 relative z-10 w-full bg-[#08080C] text-white border-t border-white/10 overflow-hidden">
        
        {/* ATTENTION-GRABBING 4K BACKDROP IMAGE RENDER WITH GRADIENT OVERLAY */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/brand_dna_temple_bg_1785868729158.png" 
            alt="Studio Engine Backdrop" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/85 to-[#08080C]/90" />
        </div>

        {/* Ambient Studio Laser Radial Glow Halos */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[70rem] h-[70rem] bg-purple-700/30 rounded-full blur-[280px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[45rem] h-[45rem] bg-pink-600/20 rounded-full blur-[220px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 text-left">
          
          {/* LEFT COLUMN (7 COLS): HERO STATEMENT */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase mb-4">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>THE AUTOMATED FOUNDER ERA</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-light font-display tracking-tight leading-[1.05] text-white">
              Ready to Stop Writing Manual Posts <br />
              <span className="font-normal italic text-purple-300">And Deploy Your Doppelganger Studio?</span>
            </h2>

            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl mt-4">
              Replace $6,000/mo agency retainers and 10+ hours of weekly drafting grind. Claim your virtual AI specialist roster and launch native autopilot distribution today.
            </p>
          </div>

          {/* RIGHT COLUMN (5 COLS): HIGH-CONVERSION CONSOLE CARD */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#12111D]/90 to-[#0A0A12]/95 border border-purple-500/40 p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl shadow-purple-950/60 backdrop-blur-xl relative overflow-hidden text-left">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">Instant Activation</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Launch Your Doppelganger Studio</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Paste your site URL, sync your founder voice DNA, and receive your first 30-day campaign queue in under 60 seconds.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link 
                to="/login?mode=signup"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-600 to-pink-600 hover:from-[#6D28D9] hover:to-pink-700 text-white font-bold text-sm transition-all shadow-xl shadow-purple-600/30 text-center block hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Brand DNA Setup — Onboard in 60s
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
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-xs transition-all text-center flex items-center justify-center gap-2"
              >
                Book a 15‑Minute Founder Walkthrough
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/10 text-center space-y-1">
              <span className="text-[11px] text-emerald-400 font-sans font-semibold block">
                100% Mobile Control Guarantee ✓
              </span>
              <span className="text-[10px] text-slate-500 font-sans block">
                No Credit Card Required • Instant Cancel Anytime
              </span>
            </div>

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
