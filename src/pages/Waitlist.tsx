import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Zap, CheckCircle2, ArrowRight, Layers, ScanLine, Activity, Sparkles, Lock, ArrowUpRight, ShieldCheck, ArrowUp, Send, MessageSquare } from 'lucide-react';

// --- Custom Hooks ---
const use3DTilt = (options = { max: 10, scale: 1.02, speed: 400 }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (window.innerWidth < 768) return; 
    const element = ref.current;
    if (!element) return;
    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -options.max;
      const rotateY = ((x - centerX) / centerX) * options.max;
      element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${options.scale}, ${options.scale}, ${options.scale})`;
      element.style.transition = 'transform 0.1s ease-out';
    };
    const handleMouseLeave = () => {
      element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      element.style.transition = `transform ${options.speed}ms ease-out`;
    };
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [options]);
  return ref;
};

// --- Reusable Components ---
const TiltCard = ({ children, className = '' }) => {
  const tiltRef = use3DTilt();
  return (
    <div ref={tiltRef} className={`will-change-transform transform-style-3d ${className}`}>
      {children}
    </div>
  );
};

const BrandLogo = () => (
  <img 
    src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" 
    alt="BrandToPost Logo" 
    className="w-8 h-8 md:w-10 md:h-10 object-contain shrink-0 mr-2" 
  />
);

// --- Main App Component ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmMybk6WP283pvxNDwv1Bgfb_au5VQxoRrQwZZbh6Kf_rsPZBiQx2rVMSSV650lXPHiw/exec";

export default function App() {
  // Tracking State
  const [userId] = useState(() => {
    let id = localStorage.getItem('b2p_visitor_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('b2p_visitor_id', id);
    }
    return id;
  });

  const [deviceType, setDeviceType] = useState('Desktop');
  const [interactions, setInteractions] = useState([]);
  
  // --- SUPERHUMAN PLAYBOOK STATES ---
  const [formState, setFormState] = useState('capture'); // 'capture' | 'survey' | 'completed'
  const [waitlistNumber, setWaitlistNumber] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Survey Data
  const [surveyData, setSurveyData] = useState({
    agencyFocus: '',
    clientCount: '',
    biggestPain: ''
  });

  // Check Device
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setDeviceType(isMobile ? 'Mobile' : 'Desktop');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Tracking Function
  const trackEvent = useCallback((eventName, userEmail = "No Email", extraData = {}) => {
    try {
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('interactions', JSON.stringify({
        userId: userId,
        device: deviceType,
        event: eventName,
        data: extraData,
        timestamp: new Date().toISOString()
      }));
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData });
    } catch (err) {
      console.error("Tracking Error:", err);
    }
  }, [userId, deviceType]);

  // Initial Page Visit
  useEffect(() => {
    if (!sessionStorage.getItem('b2p_visit_tracked')) {
      trackEvent('page_visit');
      sessionStorage.setItem('b2p_visit_tracked', 'true');
    }
  }, [trackEvent]);

  // Handle Step 1: Email Submit
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    
    // Log initial capture
    trackEvent('waitlist_email_captured', email);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX delay
      // Since 36 spots are taken, they get spot #37
      setWaitlistNumber(37);
      setFormState('survey');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for survey focus
    } catch (err) {
      setFormState('survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2: Survey Submit
  const handleSurveySubmit = async () => {
    // Basic validation
    if (!surveyData.agencyFocus || !surveyData.clientCount || !surveyData.biggestPain) return;
    
    setIsSubmitting(true);
    
    // Log survey completion
    trackEvent('survey_completed', email, surveyData);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setFormState('completed');
    } catch (err) {
      setFormState('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tiltRef = use3DTilt();

  // Helper for Survey Radio Buttons
  const SurveyOption = ({ field, value, label }) => (
    <button
      type="button"
      onClick={() => setSurveyData(prev => ({ ...prev, [field]: value }))}
      className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
        surveyData[field] === value
          ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.2)]'
          : 'bg-[#1C1C22] border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-[#272730]'
      }`}
    >
      <span className="font-medium text-sm md:text-base">{label}</span>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${surveyData[field] === value ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-zinc-600'}`}>
        {surveyData[field] === value && <div className="w-2 h-2 rounded-full bg-white"></div>}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050508] text-white font-sans selection:bg-[#7C3AED] selection:text-white relative overflow-x-hidden">
      
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .font-display { font-family: 'Outfit', sans-serif; }
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        /* Smooth Entrances */
        .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        
        @keyframes fadeInUp { 
            from { opacity: 0; transform: translateY(20px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
        }

        /* Floating Element */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        /* Glow Pulse */
        @keyframes glowPulse {
            0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
            100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
        .glow-btn { animation: glowPulse 2s infinite; }
      `}</style>

      {/* --- CENTRAL AURORA GLOW --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[80vh] pointer-events-none z-0 flex justify-center items-start overflow-hidden">
          <div className="absolute top-[-10%] w-[600px] h-[500px] bg-[#7C3AED]/30 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute top-[10%] w-[500px] h-[400px] bg-[#2583EB]/20 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex justify-between items-center fade-in-up">
        <div className="flex items-center text-white font-display font-bold text-2xl md:text-3xl tracking-tight uppercase italic gap-2">
            <BrandLogo />
            <span>Brand<span className="text-[#7C3AED]">To</span>Post</span>
        </div>
        <div className="text-xs md:text-sm font-sans font-bold px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-full flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300">Beta v1.0</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-4 md:pt-10 pb-20">
        
        {/* --- HIGH-CONVERTING HERO & SURVEY AREA --- */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-24">
            
            {/* Left Side: Dynamic Flow (Capture -> Survey -> Completed) */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
                
                {/* STATE 1: INITIAL CAPTURE */}
                {formState === 'capture' && (
                  <div className="fade-in">
                    <div className="inline-flex items-center gap-2 bg-[#18F07A]/10 text-[#18F07A] font-sans font-bold text-xs md:text-sm uppercase tracking-widest px-5 py-2 rounded-full mb-8 border border-[#18F07A]/30 shadow-[0_0_20px_rgba(24,240,122,0.15)] mx-auto lg:mx-0">
                        <span className="w-2 h-2 rounded-full bg-[#18F07A] animate-pulse"></span>
                        Top Secret Beta
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-display font-extrabold tracking-tight mb-6 text-white leading-[1.05]">
                        We cracked the code on <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#2583EB]">human AI copy.</span>
                    </h1>
                    
                    <p className="text-zinc-400 text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed mx-auto lg:mx-0">
                        You're wasting hours trying to make AI sound like your clients, only to get robotic garbage they hate. We built a system that generates 30 days of authentic, high-traction campaigns that get approved on the first draft. How? That's our secret.
                    </p>

                    <div className="w-full max-w-lg relative z-30 mb-8 mx-auto lg:mx-0">
                        <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row bg-[#1C1C22]/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl focus-within:border-[#7C3AED]/50 focus-within:bg-[#1C1C22]/80 transition-all">
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address..." 
                                className="flex-1 bg-transparent border-none px-5 py-4 sm:py-0 text-white focus:outline-none transition-all text-base md:text-lg font-medium placeholder:text-zinc-600"
                                disabled={isSubmitting}
                            />
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-[#7C3AED] to-[#2583EB] text-white font-display font-bold text-base md:text-lg uppercase tracking-widest px-8 py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] glow-btn disabled:opacity-50"
                            >
                                {isSubmitting ? 'JOINING...' : 'JOIN WAITLIST'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 opacity-90 mx-auto lg:mx-0 justify-center lg:justify-start">
                        <div className="flex -space-x-3">
                            <img className="w-10 h-10 rounded-full border-2 border-[#050508] bg-zinc-800" src="https://i.pravatar.cc/100?img=33" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-[#050508] bg-zinc-800" src="https://i.pravatar.cc/100?img=47" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-[#050508] bg-zinc-800" src="https://i.pravatar.cc/100?img=12" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-[#050508] bg-zinc-800" src="https://i.pravatar.cc/100?img=68" alt="User" />
                            <div className="w-10 h-10 rounded-full border-2 border-[#050508] bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                +32
                            </div>
                        </div>
                        <p className="text-sm font-medium text-zinc-400 text-center sm:text-left">
                            Join <span className="text-white font-bold">36</span> founding agencies. <span className="text-red-400 font-bold animate-pulse">Only 14 VIP spots left.</span>
                        </p>
                    </div>
                  </div>
                )}

                {/* STATE 2: THE SURVEY (Fast-Track) */}
                {formState === 'survey' && (
                  <div className="fade-in w-full max-w-lg mx-auto lg:mx-0 bg-[#1C1C22]/80 backdrop-blur-xl border border-[#7C3AED]/30 rounded-3xl p-6 md:p-10 shadow-[0_0_60px_rgba(124,58,237,0.15)] text-left">
                      
                      <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4 mb-8 flex items-start gap-4">
                          <div className="bg-[#7C3AED] text-white rounded-full w-10 h-10 flex items-center justify-center font-display font-bold text-lg shrink-0 mt-1">
                              #
                          </div>
                          <div>
                              <p className="text-white font-display font-bold text-xl leading-tight">You just claimed spot #{waitlistNumber} out of 50.</p>
                              <p className="text-[#a78bfa] text-sm mt-1">Want to skip the line? Tell us about your agency to request fast-track VIP access.</p>
                          </div>
                      </div>

                      <div className="space-y-8">
                          {/* Question 1 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">1. What is your agency's primary focus?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="agencyFocus" value="B2B SaaS" label="B2B SaaS / Tech" />
                                  <SurveyOption field="agencyFocus" value="Personal Branding" label="Personal Branding / Founders" />
                                  <SurveyOption field="agencyFocus" value="E-commerce" label="E-commerce / D2C" />
                                  <SurveyOption field="agencyFocus" value="Other" label="Other / Generalist" />
                              </div>
                          </div>

                          {/* Question 2 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">2. How many clients do you currently manage?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="clientCount" value="1-5" label="1 - 5 clients" />
                                  <SurveyOption field="clientCount" value="6-15" label="6 - 15 clients" />
                                  <SurveyOption field="clientCount" value="16+" label="16+ clients" />
                              </div>
                          </div>

                          {/* Question 3 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">3. What is your biggest content bottleneck?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="biggestPain" value="Writing" label="Writing quality / Sounding human" />
                                  <SurveyOption field="biggestPain" value="Approvals" label="Client revisions & approvals" />
                                  <SurveyOption field="biggestPain" value="Strategy" label="Coming up with campaign ideas" />
                              </div>
                          </div>

                          {/* Submit Survey */}
                          <button 
                              onClick={handleSurveySubmit}
                              disabled={!surveyData.agencyFocus || !surveyData.clientCount || !surveyData.biggestPain || isSubmitting}
                              className="w-full mt-4 bg-[#18F07A] text-black font-display font-bold text-lg uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(24,240,122,0.3)]"
                          >
                              {isSubmitting ? 'SUBMITTING...' : 'REQUEST FAST-TRACK'} <Send className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                )}

                {/* STATE 3: COMPLETED */}
                {formState === 'completed' && (
                  <div className="fade-in w-full max-w-lg mx-auto lg:mx-0 flex flex-col items-center lg:items-start text-center lg:text-left mt-10">
                      <div className="w-20 h-20 bg-[#18F07A]/20 border-2 border-[#18F07A] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(24,240,122,0.3)]">
                          <CheckCircle2 className="w-10 h-10 text-[#18F07A]" />
                      </div>
                      <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
                          Priority Access <span className="text-[#18F07A]">Requested.</span>
                      </h1>
                      <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                          Your application has been received. If your agency is a fit for the Beta, our team will email you shortly with an onboarding link.
                      </p>
                  </div>
                )}
            </div>

            {/* Right Side: The Visual Anticipation (Reward Preview - Now a Curiosity Trap) */}
            <div className={`lg:col-span-6 w-full flex justify-center lg:justify-end slide-up relative z-10 hidden md:flex ${formState !== 'capture' ? 'opacity-50 blur-sm pointer-events-none transition-all duration-700' : 'transition-all duration-700'}`}>
                <div className="animate-float w-full max-w-[500px]">
                    <TiltCard className="w-full bg-[#111116] border border-white/10 rounded-3xl p-4 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative overflow-hidden will-change-transform transform-style-3d">
                        
                        {/* Browser Mockup Header */}
                        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <div className="mx-auto bg-black/50 px-4 py-1 rounded-md text-xs font-mono text-zinc-500 flex items-center gap-2 border border-white/5">
                                <Lock className="w-3 h-3" /> app.brandtopost.com
                            </div>
                        </div>

                        {/* Top: DNA Analysis (The Tease) */}
                        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="TROR" className="w-10 h-10 rounded-full border border-[#7C3AED] bg-black" />
                                <div>
                                    <h4 className="text-white font-display font-bold text-sm">TROR Analysis</h4>
                                    <span className="text-[#18F07A] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> DNA Extracted</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                                <div>
                                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1 block">Extracted Tone</label>
                                    <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-lg p-2 text-[#a78bfa] text-sm font-medium">
                                        Witty, Direct, Authority
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1 block">Banned Jargon</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded line-through">Synergy</span>
                                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded line-through">Delve</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: The Blurred Output (The Trap) */}
                        <div className="bg-black/40 rounded-2xl p-5 md:p-6 border border-white/5 relative overflow-hidden">
                            
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-white font-display font-bold text-lg">Generated Campaign</h4>
                                <span className="bg-[#18F07A]/10 text-[#18F07A] text-xs font-bold px-3 py-1 rounded-full border border-[#18F07A]/30">30 Posts Ready</span>
                            </div>

                            <div className="bg-[#1C1C22] border border-zinc-800 rounded-xl p-6 shadow-inner relative z-10 overflow-hidden">
                                
                                {/* LOCKED OVERLAY (Curiosity Trigger) */}
                                <div className="absolute inset-0 bg-[#1C1C22]/60 backdrop-blur-[3px] z-20 flex flex-col items-center justify-center border border-white/5">
                                    <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-full flex items-center justify-center mb-3 border border-[#7C3AED]/50">
                                        <Lock className="w-5 h-5 text-[#a78bfa]" />
                                    </div>
                                    <span className="text-white font-display font-bold text-lg tracking-wide uppercase">Output Locked</span>
                                    <span className="text-zinc-400 text-xs font-medium mt-1">Join waitlist to reveal the magic.</span>
                                </div>

                                {/* Blurred Content */}
                                <div className="flex items-center gap-2 mb-4 opacity-30">
                                    <div className="w-8 h-8 rounded bg-[#0A66C2] flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    </div>
                                    <span className="text-zinc-400 text-sm font-medium">LinkedIn Post</span>
                                </div>
                                <div className="space-y-3 opacity-30">
                                    <div className="w-3/4 h-3 bg-zinc-700 rounded"></div>
                                    <div className="w-full h-3 bg-zinc-700 rounded"></div>
                                    <div className="w-5/6 h-3 bg-zinc-700 rounded"></div>
                                    <div className="w-1/2 h-3 bg-zinc-700 rounded"></div>
                                </div>
                                <div className="w-full h-20 bg-zinc-800 rounded-lg border border-zinc-700 mt-5 opacity-30"></div>
                            </div>
                        </div>
                    </TiltCard>
                </div>
            </div>
        </div>

        {/* --- HOW IT WORKS (The Unfair Advantage) --- */}
        <div className={`w-full max-w-6xl mx-auto mt-10 md:mt-20 transition-opacity duration-500 ${formState !== 'capture' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white uppercase tracking-wide">The Unfair Advantage</h3>
                <p className="text-zinc-400 mt-2 font-medium text-lg">We handle the heavy lifting. You take the credit.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-colors">
                    <div className="w-12 h-12 bg-[#7C3AED]/10 text-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 border border-[#7C3AED]/30 group-hover:scale-110 transition-transform">
                        <span className="font-display font-bold text-2xl">01</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">The Black Box</h4>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Give us whatever you have—a rough brief, past posts, or just an idea. We extract the exact psychology and tone needed to make them stand out.</p>
                </TiltCard>

                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#2583EB]/50 transition-colors">
                    <div className="w-12 h-12 bg-[#2583EB]/10 text-[#2583EB] rounded-2xl flex items-center justify-center mb-6 border border-[#2583EB]/30 group-hover:scale-110 transition-transform">
                        <span className="font-display font-bold text-2xl">02</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">The Vault</h4>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Our system automatically bans corporate cringe and generic AI buzzwords. It outputs omnichannel campaigns that perfectly match the brand's unique voice.</p>
                </TiltCard>

                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#18F07A]/50 transition-colors">
                    <div className="w-12 h-12 bg-[#18F07A]/10 text-[#18F07A] rounded-2xl flex items-center justify-center mb-6 border border-[#18F07A]/30 group-hover:scale-110 transition-transform">
                        <span className="font-display font-bold text-2xl">03</span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">The Edge</h4>
                    <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Agencies using our beta have eliminated client revisions and cut content creation time by 80%. We're only letting 50 more in.</p>
                </TiltCard>
            </div>
        </div>

      </main>

      {/* Sticky Bottom Form for Mobile (Ensures action is ALWAYS accessible) */}
      <div className={`fixed bottom-0 left-0 w-full z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-zinc-800 p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ${formState === 'completed' ? 'translate-y-full' : 'translate-y-0'}`}>
          {formState === 'capture' && (
              <form onSubmit={handleWaitlistSubmit} className="flex gap-2 max-w-md mx-auto">
                  <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@agency.com" 
                      className="flex-1 bg-[#1C1C22] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] transition-all text-sm font-medium placeholder:text-zinc-500"
                      disabled={isSubmitting}
                  />
                  <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-[#7C3AED] text-white font-display font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-[#6D28D9] transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  >
                      {isSubmitting ? '...' : 'JOIN'}
                  </button>
              </form>
          )}
          {formState === 'survey' && (
              <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full bg-[#18F07A] text-black font-display font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-lg flex justify-center items-center gap-2"
              >
                  <ArrowUp className="w-4 h-4" /> FINISH SURVEY TO FAST-TRACK
              </button>
          )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 flex flex-col sm:flex-row justify-center items-center gap-4 text-zinc-500 text-sm font-medium mt-10 pb-28 md:pb-8">
          <span>© 2026 BrandToPost. All rights reserved.</span>
          <span className="hidden sm:block">•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="hidden sm:block">•</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
      </footer>

    </div>
  );
}
