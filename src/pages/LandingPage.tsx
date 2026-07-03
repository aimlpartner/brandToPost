import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AgentFlipbook } from '../components/AgentFlipbook';
import { RevolvingAgents } from '../components/RevolvingAgents';
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
      <AgentFlipbook />

      {/* 6.5. REVOLVING 3D AGENTS CYLINDER */}
      <RevolvingAgents />

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
            <p className="text-sm font-medium text-slate-400 mb-4 font-sans">Our output</p>
            <h2 className="text-4xl md:text-7xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
              1 URL in. <br />
              <span className="font-normal italic text-[#7C3AED]">A month of pipeline out.</span>
            </h2>
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              We don't give you template libraries. Our AI employees write, design, and assemble ready-to-publish campaigns specifically tailored to your ideal clients.
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
                          <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" className="w-4.5 h-4.5 opacity-80" alt="B2P" />
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

      {/* 9. THE SUBSCRIPTION MATRIX (Pricing Selectors - Light Theme) */}
      <section className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
      <div className="pt-12 md:pt-16 pb-24 md:pb-32 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <p className="text-sm font-medium text-[#7C3AED] mb-4 font-sans">Pricing structure</p>
          <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Choose your <br />
            <span className="font-normal italic text-[#7C3AED]">Virtual Team.</span>
          </h2>
          <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed mt-4">
            Select a configuration tier based on the size of the AI marketing specialists you want active. Scale up or down as required.
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
              to="/login" 
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
                      { name: "Sarah", role: "Research & Strategy", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Alex", role: "Copywriter & Hook Spec", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Chloe", role: "Visual Aesthetics", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Julian", role: "Graphics & Logo Layout", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Elena", role: "Publishing Router", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Arthur", role: "Voice & DNA Clone", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Maya", role: "Campaign Scheduler", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Zack", role: "Objection Handling", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100" }
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
              to="/login" 
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
                      { name: "Sarah", role: "Research & Strategy", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Alex", role: "Copywriter & Hook Spec", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Chloe", role: "Visual Aesthetics", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Julian", role: "Graphics & Logo Layout", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Elena", role: "Publishing Router", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Arthur", role: "Voice & DNA Clone", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Maya", role: "Campaign Scheduler", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Zack", role: "Objection Handling", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Victor", role: "WhatsApp Commander", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100" },
                      { name: "Max", role: "Autopilot Monitor", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=100&h=100" }
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
              to="/login" 
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
      <section className="w-full bg-[#FAF9F6] border-b border-slate-200/60 relative z-10">
      <div className="py-24 md:py-32 px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <p className="text-sm font-medium text-[#7C3AED] mb-4 font-sans">Questions</p>
          <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
            Frequently Asked <br />
            <span className="font-normal italic text-[#7C3AED]">Questions.</span>
          </h2>
          <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
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
      <section className="py-32 md:py-44 px-6 md:px-16 lg:px-24 relative z-10 w-full bg-[#08080C] text-slate-300 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Bold Typographic Statement */}
          <div className="lg:col-span-7 text-left space-y-4">
            <h2 className="text-5xl sm:text-6xl md:text-8xl font-light font-display tracking-tighter leading-[1.02]" style={{ color: '#FFFFFF' }}>
              Get your <br className="hidden md:block" />
              20 hours <br />
              <span className="font-normal italic text-[#C084FC]">a week back.</span>
            </h2>
          </div>

          {/* Right Column: Active Pilot & CTAs */}
          <div className="lg:col-span-5 text-left space-y-8">
            
            {/* Active pilot node */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" 
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

            <p className="text-base sm:text-lg text-slate-400 font-light leading-relaxed max-w-md">
              Join the next wave of founders who treat organic social not as a manual chore, but as a fully autonomous customer acquisition engine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to="/login"
                className="px-8 py-4 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#7C3AED]/20 text-center block"
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
                className="px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-center flex items-center justify-center gap-2"
              >
                💬 Chat on WhatsApp
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
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-900 transition-colors cursor-pointer">Terms of Service</span>
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
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Terms of Service</span>
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
              href="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png"
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
