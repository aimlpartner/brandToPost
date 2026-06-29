import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AgentFlipbook } from '../components/AgentFlipbook';
import '../components/AgentFlipbook.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { 
  Target, ArrowRight, Sparkles, 
  CheckCircle2, MessageSquare, TrendingUp, 
  PenTool, Loader2, Zap,
  X, XCircle, Bot, ZapOff, Activity,
  Lock, Check, HelpCircle
} from 'lucide-react';





const PLAN_AGENTS = {
  starter: [
    { name: "Sarah", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Alex", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Chloe", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Julian", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Elena", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Arthur", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100", active: false },
    { name: "Maya", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100", active: false },
    { name: "Zack", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100", active: false },
    { name: "Victor", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100", active: false },
    { name: "Max", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=100&h=100", active: false }
  ],
  growth: [
    { name: "Sarah", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Alex", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Chloe", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Julian", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Elena", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Arthur", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Maya", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Zack", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Victor", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100", active: false },
    { name: "Max", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=100&h=100", active: false }
  ],
  agency: [
    { name: "Sarah", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Alex", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Chloe", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Julian", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Elena", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Arthur", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Maya", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Zack", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Victor", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100", active: true },
    { name: "Max", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=100&h=100", active: true }
  ]
};

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#7C3AED]/30 selection:text-[#7C3AED] overflow-x-hidden relative">
      
      {/* 1. NAVIGATION BAR (Dynamic Light/Dark Theme transition) */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 border-b border-slate-200 py-3.5 backdrop-blur-md shadow-sm text-slate-800' 
          : 'bg-transparent py-5 text-white'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 group shrink-0">
              <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className={`text-xl tracking-tight font-display font-bold ${isScrolled ? 'text-slate-900' : 'text-white'}`}>BrandToPost</span>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6">
              <Link to="/whatsapp/login" className="text-sm font-semibold text-emerald-450 hover:text-emerald-350 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span> WhatsApp Bot
              </Link>
              <Link to="/login" className={`text-sm font-semibold transition-colors hidden md:block ${isScrolled ? 'text-slate-655 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}>Sign In</Link>
              <Link to="/login" className="px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all hover:scale-105 active:scale-95 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md whitespace-nowrap">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. PROFESSIONAL HERO SECTION (Dark Theme Contrast - Left-Aligned & Mirror Video Background) */}
      <section className="relative w-full min-h-screen pt-36 pb-24 px-6 lg:px-8 flex items-center bg-[#08080C] border-b border-slate-950 overflow-hidden">
        
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
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tight leading-[1.1] font-display"
              style={{ color: '#FFFFFF' }}
            >
              Marketing <br />
              that <span style={{ color: '#C084FC' }}>runs itself.</span>
            </h1>
            
            <p className="text-base sm:text-lg font-normal leading-relaxed max-w-xl" style={{ color: '#E2E8F0' }}>
              Deploy your virtual AI marketing department starting at <span className="font-bold" style={{ color: '#FFFFFF' }}>₹2,499/mo</span>. We auto-publish your content while you scale.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-start items-center gap-4 pt-2">
              <Link to="/login" className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#7C3AED]/20 w-full sm:w-auto text-center">
                Start Distribution
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
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-sm w-full sm:w-auto"
              >
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. METRICS BOARD (Tech Luxury Dark Transition Strip) */}
      <section ref={setMetricsRef} className="py-14 border-y border-white/5 bg-[#08080C] text-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y-0 md:divide-x divide-white/10">
            <div className="flex flex-col items-center">
               <div className="text-3xl md:text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-1.5 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                 {metrics.prompts}
               </div>
               <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Prompts Required</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-3xl md:text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] to-[#7C3AED] mb-1.5 drop-shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                 {metrics.voice}%
               </div>
               <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Arthur Voice Match</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-3xl md:text-5xl font-extrabold font-mono text-[#2583EB] mb-1.5 drop-shadow-[0_0_15px_rgba(37,131,235,0.2)]">
                 &lt; {metrics.time}m
               </div>
               <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Total Setup Time</div>
            </div>
            <div className="flex flex-col items-center">
               <div className="text-3xl md:text-5xl font-extrabold font-mono text-[#10B981] mb-1.5 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 {metrics.channels}+
               </div>
               <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Publishing Channels</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE MANUAL VS AUTONOMOUS CONTRAST (Enterprise Typographic Presentation with Flowing Wave Art) */}
      <section className="py-28 md:py-36 w-full px-6 md:px-16 lg:px-24 bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left overflow-hidden">
        
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
          <div className="max-w-4xl mb-24">
            <h2 className="text-4xl md:text-7xl font-light font-display tracking-tight leading-[1.05] text-slate-900">
              Stop prompting boxes. <br />
              <span className="font-normal italic text-[#7C3AED]">Build a distribution engine.</span>
            </h2>
          </div>

          {/* Enterprise Comparative Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            
            {/* Left Column: The Prompter's Grind */}
            <div className="border-t border-slate-900/10 pt-10 space-y-6">
              <h3 className="text-2xl md:text-3xl font-light font-display text-slate-900">The Prompter's Grind</h3>
              <p className="text-base text-slate-600 font-light leading-relaxed">
                Repeating brand context, manually editing generic AI vocabulary, formatting layouts for multiple channels, and copy-pasting posts between browser tabs daily. It introduces a new administrative workload under the promise of speed.
              </p>
            </div>

            {/* Right Column: The Autonomous Pipeline */}
            <div className="border-t border-slate-900/10 pt-10 space-y-6">
              <h3 className="text-2xl md:text-3xl font-light font-display text-[#7C3AED]">The Autonomous Pipeline</h3>
              <p className="text-base text-slate-655 text-slate-600 font-light leading-relaxed">
                Provide your product link once. Our agent system processes your brand positioning rules, analyzes live market changes, creates native post formats, and schedules native uploads automatically.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. MEET TROR: THE MASTER ORCHESTRATOR (Sleek Modernist Cropped Bleed Stage) */}
      <section 
        ref={section5Ref} 
        className="py-32 md:py-48 w-full bg-black text-left relative z-10 border-y border-white/[0.05] overflow-hidden min-h-[500px] lg:min-h-[650px] flex items-center"
      >
        <div className="w-full mx-auto max-w-7xl px-6 md:px-16 lg:px-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* Left Column: Stark Typographic Statement & Elite Styled Copywriting */}
          <div className="lg:col-span-7 space-y-8 select-none relative z-20">
            <h2 className="gsap-reveal-text text-6xl md:text-9xl font-light font-display text-white tracking-tighter leading-none" style={{ color: '#FFFFFF' }}>
              Meet <span className="font-semibold text-[#C084FC]">TROR</span>.
            </h2>
            <div className="space-y-6 max-w-xl gsap-reveal-text">
              <p className="text-xl md:text-2xl text-slate-200 font-light tracking-wide leading-snug">
                The quiet center of a <span className="italic font-serif text-[#C084FC]">loud</span> brand engine.
              </p>
              <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed border-l-2 border-[#C084FC]/30 pl-5">
                TROR coordinates your custom agent network to execute campaigns with <span className="text-white font-medium">zero prompt engineering</span>. It locks your brand voice guidelines, crawls real-time competitive signals, and deploys platform-optimized formats automatically.
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

      {/* 6. SCROLL-LOCKED CREATIVE TEAM FLIPBOOK */}
      <AgentFlipbook />      {/* 7. THE POST GROWTH METHODOLOGY (Editorial Timeline) */}
      <section className="py-24 md:py-32 px-6 lg:px-8 max-w-6xl mx-auto relative z-10 border-b border-slate-200/60 bg-slate-50">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">B2B Content Blueprint</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 mb-6 tracking-tight">
            Proven <span className="text-[#7C3AED]">POST Framework</span>, Executed Daily.
          </h2>
          <p className="text-base sm:text-lg text-slate-655 max-w-2xl mx-auto font-light leading-relaxed">
            Organic distribution fails when content is random. Our agent network is engineered to execute the rigorous POST methodology used by category-leading brands.
          </p>
        </div>
        
        {/* Horizontal Timeline on Desktop, Vertical on Mobile */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute top-[40px] left-8 right-8 h-0.5 bg-gradient-to-r from-[#7C3AED] via-[#2583EB] via-[#FF7778] to-[#10B981] hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
            {[
              { l: "P", t: "Positioning DNA", d: "Arthur locks down your ICPs, objection maps, and unique mechanisms so copy never drifts off-brand.", icon: <Target className="h-5 w-5" />, color: "#7C3AED", bgLight: "rgba(124, 58, 237, 0.1)" },
              { l: "O", t: "Outreach Routing", d: "Sarah searches for real-time market triggers, and Alex drafts platform-native structures tailored to algorithms.", icon: <PenTool className="h-5 w-5" />, color: "#2583EB", bgLight: "rgba(37, 131, 235, 0.1)" },
              { l: "S", t: "Signal & Cards", d: "Chloe & Julian build custom typography layouts and logo placements directly into scroll-stopping graphic cards.", icon: <Sparkles className="h-5 w-5" />, color: "#FF7778", bgLight: "rgba(255, 119, 120, 0.1)" },
              { l: "T", t: "Traction Autopilot", d: "Maya schedules drafts, and Max handles API publishing automatically, transforming content into revenue pipelines.", icon: <TrendingUp className="h-5 w-5" />, color: "#10B981", bgLight: "rgba(16, 185, 129, 0.1)" }
            ].map((item, idx) => (
              <div key={idx} className="relative flex flex-col items-center lg:items-start text-center lg:text-left group">
                
                {/* Timeline node circle */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-20 shadow-md group-hover:scale-110 mb-6 bg-white"
                  style={{ borderColor: item.color, boxShadow: `0 0 15px ${item.color}20` }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: item.bgLight, color: item.color }}>
                    {item.icon}
                  </div>
                  {/* Small step number */}
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center border border-white/10">
                    {idx + 1}
                  </span>
                </div>

                {/* Content Card using glass-card properties */}
                <div className="glass-card border-[#7C3AED]/10 p-6 rounded-xl relative overflow-hidden w-full min-h-[160px] flex flex-col justify-start">
                  {/* Large background letter overlay */}
                  <span 
                    className="absolute -right-4 -bottom-6 text-8xl font-black font-display opacity-5 select-none pointer-events-none"
                    style={{ color: item.color }}
                  >
                    {item.l}
                  </span>

                  <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center justify-center lg:justify-start gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.t}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed font-light relative z-10">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CLIENT DELIVERABLES BENTO GRID (Editorial Redesign) */}
      <section className="py-24 px-6 lg:px-8 max-w-6xl mx-auto relative z-10 border-b border-slate-200/60 bg-white">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-[10px] uppercase font-semibold tracking-widest px-4 py-1.5 rounded-full shadow-sm">AI Deliverables</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 mb-6 tracking-tight">
            1 URL in. A Month of Pipeline out.
          </h2>
          <p className="text-base sm:text-lg text-slate-655 max-w-xl mx-auto font-light leading-relaxed">
            We don't give you template libraries. Our AI employees write, design, and assemble ready-to-publish campaigns specifically tailored to your ideal clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          
          {/* LinkedIn Posts (Span 2) */}
          <div className="glass-card border-[#7C3AED]/10 p-6 md:col-span-2 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#7C3AED] font-mono text-[9px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                LINKEDIN THOUGHT LEADERSHIP
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">Authority Campaigns</h3>
              <p className="text-slate-500 text-xs font-light mb-6 max-w-md leading-relaxed">
                Crafted by Alex using hook-story-lesson sequencing. Formatted with generous paragraph spacing and industry-proof objection counters.
              </p>
            </div>
            
            {/* Real LinkedIn Preview Graphic */}
            <div className="bg-[#FCFBF9] border border-slate-200/85 rounded-xl p-5 relative z-10 shadow-sm">
              <div className="flex gap-3 mb-4">
                <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" className="w-8 h-8 rounded-full border border-[#7C3AED]" alt="Avatar" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Your AI Doppelganger</div>
                  <div className="text-[9px] text-slate-400">Founder & CEO | 2m ago</div>
                </div>
              </div>
              <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed font-sans">
                <p className="font-semibold text-slate-900">Stop prompting boxes to write generic marketing text.</p>
                <p>B2B distribution is broken because prompt tools don't know your buyers' hell states or heaven states.</p>
                <p>Arthur locks down your Positioning DNA. Sarah maps active market triggers. Max auto-publishes. Marketing that runs itself.</p>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold font-mono">
                <span>👍 142 Likes</span>
                <span>💬 38 Comments</span>
              </div>
            </div>
          </div>

          {/* X Threads (Span 1) */}
          <div className="glass-card border-[#7C3AED]/10 p-6 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#2583EB] font-mono text-[9px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2583EB]" />
                X PLATFORM NATIVE
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">Multi-Tweet Threads</h3>
              <p className="text-slate-500 text-xs font-light mb-6 leading-relaxed">
                Punchy, hook-driven tweet sequences optimized to stop the scroll and build massive traction.
              </p>
            </div>
            
            {/* Real X Thread Preview */}
            <div className="space-y-3 bg-[#FCFBF9] border border-slate-200/85 rounded-xl p-4 shadow-sm text-[11px]">
              <div className="flex gap-2 items-start border-l-2 border-[#7C3AED]/40 pl-3">
                 <div className="font-bold text-slate-800">1/</div>
                 <p className="text-slate-700 leading-relaxed">B2B organic growth isn't dead. Your templates are. Here is the blueprint to fix it: 👇</p>
              </div>
              <div className="flex gap-2 items-start border-l-2 border-[#7C3AED]/40 pl-3">
                 <div className="font-bold text-slate-800">2/</div>
                 <p className="text-slate-700 leading-relaxed">Map psychographics: Find the "Enemy," the "Hell State," and the "Earned Secret" before drafting copy.</p>
              </div>
            </div>
          </div>

          {/* DNA Reports (Span 1) */}
          <div className="glass-card border-[#7C3AED]/10 p-6 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF7778] font-mono text-[9px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7778]" />
                POSITIONING STRATEGY
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">Brand DNA Reports</h3>
              <p className="text-slate-500 text-xs font-light mb-6 leading-relaxed">
                Arthur maps out your ideal customer profiles, key objections, and tone rules.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-[#FCFBF9] border border-slate-200/85 rounded-xl">
              <span className="px-2 py-1 bg-white border border-[#7C3AED]/15 rounded text-[9px] font-bold text-[#7C3AED] font-mono">ICP Objection Mapping</span>
              <span className="px-2 py-1 bg-white border border-[#2583EB]/15 rounded text-[9px] font-bold text-[#2583EB] font-mono">Vocabulary Lock</span>
              <span className="px-2 py-1 bg-white border border-[#10B981]/15 rounded text-[9px] font-bold text-[#10B981] font-mono">Buyer Hell/Heaven State</span>
              <span className="px-2 py-1 bg-white border border-[#FF7778]/15 rounded text-[9px] font-bold text-[#FF7778] font-mono">Earned Secrets</span>
            </div>
          </div>

          {/* Image Cards (Span 2) */}
          <div className="glass-card border-[#7C3AED]/10 p-6 md:col-span-2 relative overflow-hidden group flex flex-col md:flex-row items-center gap-6">
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-2 text-[#10B981] font-mono text-[9px] font-bold uppercase tracking-wider">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                 CREATIVE STUDIO
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-1.5">Magazine-Grade Graphics</h3>
               <p className="text-slate-500 text-xs font-light leading-relaxed mb-4 md:mb-0">
                 Chloe & Julian render custom background canvas prompt graphics and stamp your logo cleanly into high-DPI scroll-stopping marketing cards.
               </p>
             </div>
             
             {/* Realistic Image Mockup */}
             <div className="w-full md:w-48 h-32 rounded-xl bg-slate-900 flex items-center justify-center shadow-inner relative overflow-hidden shrink-0 border border-white/10">
                {/* Simulated canvas background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/30 via-[#2583EB]/20 to-transparent" />
                <div className="relative z-10 text-center px-4">
                  <div className="text-[10px] font-bold text-white uppercase tracking-widest font-display mb-1">MARKETING THAT RUNS ITSELF.</div>
                  <div className="w-12 h-0.5 bg-[#7C3AED] mx-auto mb-2" />
                  <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" className="w-5 h-5 mx-auto opacity-80" alt="B2P" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 9. THE SUBSCRIPTION MATRIX (Pricing Selectors - Light Theme) */}
      <section className="py-24 md:py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-b border-slate-200/60 bg-slate-50">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">Pricing Plans</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 mb-6 tracking-tight">Choose Your Virtual Team.</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-light leading-relaxed">
            Select a subscription plan based on the size of the AI marketing team you want active. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left items-stretch">
          
          {/* Plan 1: Starter */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-xs text-[#7C3AED] font-mono font-bold uppercase tracking-wider mb-2">Solo Founder Tier</div>
              <div className="flex items-baseline gap-1 text-slate-900 mb-4">
                <span className="text-4xl font-light font-display">₹2,499</span>
                <span className="text-xs text-slate-400 font-mono">/ month</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-light mb-6">Deploy a standard content engine to get campaigns written and designed on all social channels.</p>
              
              {/* Agent Grid */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Active AI Specialists:</span>
                
                <div className="flex flex-wrap gap-2">
                  {PLAN_AGENTS.starter.map((agent, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border font-medium ${
                        agent.active 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40'
                      }`}
                    >
                      <img src={agent.avatar} className="w-3.5 h-3.5 rounded-full object-cover grayscale-0" alt="" />
                      <span>{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/login" className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-center text-xs font-semibold tracking-wide border border-slate-200 transition-colors mt-8 inline-block">Deploy Starter Grid</Link>
          </div>

          {/* Plan 2: Growth (Dark Card Accent) */}
          <div className="bg-[#08080C] border-2 border-[#7C3AED] rounded-xl p-6 sm:p-8 flex flex-col justify-between relative shadow-xl shadow-[#7C3AED]/10 text-white">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-[#7C3AED] to-[#C084FC] text-white text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">Most Popular</div>
            <div>
              <div className="text-xs text-[#C084FC] font-mono font-bold uppercase tracking-wider mb-2">Growth Autopilot Tier</div>
              <div className="flex items-baseline gap-1 text-white mb-4">
                <span className="text-4xl font-light font-display">₹4,499</span>
                <span className="text-xs text-slate-400 font-mono">/ month</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-light mb-6">Clone your exact personal voice and let the system run automated campaigns in the background hands-free.</p>
              
              {/* Agent Grid */}
              <div className="border-t border-white/10 pt-6 space-y-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Active AI Specialists:</span>
                
                <div className="flex flex-wrap gap-2">
                  {PLAN_AGENTS.growth.map((agent, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border font-medium ${
                        agent.active 
                          ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#C084FC]' 
                          : 'bg-white/5 border-white/5 text-white/20 opacity-30'
                      }`}
                    >
                      <img src={agent.avatar} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                      <span>{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/login" className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-center text-xs font-semibold tracking-wide shadow-md shadow-[#7C3AED]/20 transition-all mt-8 inline-block">Deploy Growth Autopilot</Link>
          </div>

          {/* Plan 3: Agency */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-xs text-[#7C3AED] font-mono font-bold uppercase tracking-wider mb-2">Agency Partner Tier</div>
              <div className="flex items-baseline gap-1 text-slate-900 mb-4">
                <span className="text-4xl font-light font-display">₹12,499</span>
                <span className="text-xs text-slate-400 font-mono">/ month</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-light mb-6">Connect your WhatsApp number to command client campaign reviews, edits, and schedule auto-publishing.</p>
              
              {/* Agent Grid */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Active AI Specialists:</span>
                
                <div className="flex flex-wrap gap-2">
                  {PLAN_AGENTS.agency.map((agent, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border font-medium ${
                        agent.active 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 opacity-40'
                      }`}
                    >
                      <img src={agent.avatar} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                      <span>{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/login" className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-center text-xs font-semibold tracking-wide border border-slate-200 transition-colors mt-8 inline-block">Deploy Agency Console</Link>
          </div>

        </div>
      </section>

      {/* 10. FAQ ACCORDION (Editorial Minimalist Design) */}
      <section className="py-24 md:py-32 px-6 lg:px-8 max-w-4xl mx-auto relative z-10 border-b border-slate-200/60 bg-white">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 mb-6 tracking-tight">Frequently Asked Questions.</h2>
          <p className="text-base sm:text-lg text-slate-655 max-w-xl mx-auto font-light leading-relaxed">
            Everything you need to know about cloning your voice, resources, and automation.
          </p>
        </div>

        <div className="space-y-6 text-left">
          {[
            { q: "How accurate is Arthur at cloning my voice?", a: "Extremely accurate. Arthur doesn't just read your website; he reviews your Founder DNA profile—mapping behavioral traits, core values, vocabulary constraints, and decision heuristics. This allows Arthur to draft copy that sounds exactly like you." },
            { q: "Do I need to type prompts to run the system?", a: "No. Tror acts as the Orchestrator. When you set up a Product Profile (DNA), Sarah scans your website and coordinates the copywriting, graphic designs, and calendar schedules automatically without you having to enter prompt parameters." },
            { q: "How does Victor's WhatsApp integration work?", a: "Under the Agency plan, you link your business phone number to our bot. Victor sends campaign drafts directly to your mobile chat. You can reply with textual edits or schedule them live onto social queues directly from your WhatsApp app." },
            { q: "What is the cost of running campaign generations?", a: "Each week-long multi-platform campaign costs approximately ₹96 in backend GPU rendering and API queries. We have priced our subscription tiers (Solo, Growth, Agency) to comfortably absorb these operational costs while giving you full profit margins." }
          ].map((item, index) => {
            const isFaqActive = activeFaq === index;
            const stepNum = String(index + 1).padStart(2, '0');
            return (
              <div key={index} className="border-b border-slate-100 pb-4">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between py-4 text-sm sm:text-base font-semibold text-slate-800 hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
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
                  <div className="pl-8 border-l-2 border-[#7C3AED] text-xs sm:text-sm text-slate-600 leading-relaxed font-light bg-slate-50/50 p-4 rounded-r-lg">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. CTA SECTION & FOOTER (Tech Luxury Dark Redesign) */}
      <section className="py-28 px-6 lg:px-8 relative overflow-hidden z-10 w-full bg-[#08080C] text-slate-300 border-t border-white/5">
        
        {/* Animated Background Blobs for depth */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#7C3AED]/15 rounded-full blur-[100px] animate-blob-1 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#2583EB]/10 rounded-full blur-[120px] animate-blob-2 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 bg-[#0E0E12]/80 border border-white/5 rounded-2xl p-12 md:p-20 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
          
          <div className="flex justify-center mb-8 relative">
             <div className="absolute inset-0 bg-[#7C3AED]/20 blur-[40px] rounded-full w-24 h-24 mx-auto"></div>
             <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror" className="w-20 h-20 rounded-full border-4 border-[#08080C] shadow-lg relative z-10" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-6 tracking-tight leading-[1.1]">
            Get your 20 hours<br/>a week back.
          </h2>
          <p className="text-base text-slate-400 mb-10 max-w-lg mx-auto font-light leading-relaxed">
            Join the next wave of founders who treat organic social not as a chore, but as a fully automated revenue engine.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <Link 
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm tracking-wide uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#7C3AED]/20 text-center"
            >
              Start Free Trial
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
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm tracking-wide uppercase transition-all hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
          <span className="block text-[11px] text-slate-500 mt-6 font-mono uppercase tracking-wider">Instantly onboard your brand profile in under 60 seconds.</span>
        </div>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 pt-20 mt-10 border-t border-white/5 relative z-10">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden opacity-95">
                <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" className="w-5 h-5 object-contain" alt="logo"/>
             </div>
             <span className="font-bold text-white font-display text-base tracking-tight">BrandToPost</span>
           </div>
           
           <div className="flex gap-8">
             <span className="hover:text-white transition-colors cursor-pointer">Manifesto</span>
             <span className="hover:text-white transition-colors cursor-pointer">Twitter</span>
             <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
             <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
           </div>
           
           <p className="font-light font-mono text-[10px]">&copy; {new Date().getFullYear()} BrandToPost Systems. Built by AiMlPartner.</p>
        </footer>      </section>

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
