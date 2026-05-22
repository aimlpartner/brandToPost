import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Zap, CheckCircle2, ArrowRight, Layers, ScanLine, Activity, Sparkles, Lock, ShieldCheck, ShieldAlert, ArrowUp, Send, AlertTriangle, Sliders, MessageSquare } from 'lucide-react';

// --- Custom Hooks ---
const use3DTilt = (options = { max: 6, scale: 1.01, speed: 400 }) => {
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
  const [locationData, setLocationData] = useState(() => {
    const saved = localStorage.getItem('b2p_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [interactions, setInteractions] = useState([]);
  
  // --- INTERACTIVE SLOP SLIDER STATE ---
  const [sliderPos, setSliderPos] = useState(25); // Percentage (0 - 100)
  const [isCleaned, setIsCleaned] = useState(false);
  const sliderTrackRef = useRef(null);
  const isDragging = useRef(false);

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
  const trackEvent = useCallback((eventName, userEmail = "No Email", extraData = {}, locOverride = null) => {
    try {
      const currentLoc = locOverride || locationData || JSON.parse(localStorage.getItem('b2p_location')) || 'Unknown';
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('interactions', JSON.stringify({
        userId: userId,
        device: deviceType,
        location: currentLoc,
        event: eventName,
        data: extraData,
        timestamp: new Date().toISOString()
      }));
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData });
    } catch (err) {
      console.error("Tracking Error:", err);
    }
  }, [userId, deviceType, locationData]);

  // Reliable Silent Location Fetch & Visit Tracking
  useEffect(() => {
    const initializeTracker = async () => {
      let loc = locationData;

      if (!loc) {
        try {
          let res = await fetch('https://ipapi.co/json/');
          let data = await res.json();
          
          if (data && data.city) {
            loc = { city: data.city, region: data.region, country: data.country_name };
          } else {
            res = await fetch('https://ipwho.is/');
            data = await res.json();
            if (data && data.city) {
              loc = { city: data.city, region: data.region, country: data.country };
            }
          }

          if (loc) {
            setLocationData(loc);
            localStorage.setItem('b2p_location', JSON.stringify(loc));
          }
        } catch (err) {
          console.log('Location fetch blocked or failed silently.');
        }
      }

      if (!sessionStorage.getItem('b2p_visit_tracked')) {
        trackEvent('page_visit', 'No Email', {}, loc);
        sessionStorage.setItem('b2p_visit_tracked', 'true');
      }
    };

    initializeTracker();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- SLIDER INTERACTION LOGIC ---
  const updateSlider = (clientX) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const width = rect.width;
    const offset = clientX - rect.left;
    let percentage = (offset / width) * 100;
    percentage = Math.max(0, Math.min(percentage, 100));
    setSliderPos(Math.round(percentage));

    if (percentage > 92 && !isCleaned) {
      setIsCleaned(true);
      trackEvent('cringe_cleaned_demo');
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    updateSlider(e.clientX);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    updateSlider(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    updateSlider(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Handle Step 1: Email Submit
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    
    trackEvent('waitlist_email_captured', email);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setWaitlistNumber(37); // Consistent 37th spot of 50
      setFormState('survey');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormState('survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2: Survey Submit
  const handleSurveySubmit = async () => {
    if (!surveyData.agencyFocus || !surveyData.clientCount || !surveyData.biggestPain) return;
    setIsSubmitting(true);
    
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

  // Helper for Survey Options
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
        
        @keyframes fadeInUp { 
            from { opacity: 0; transform: translateY(20px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes glowPulse {
            0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
            100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
        .glow-btn { animation: glowPulse 2s infinite; }

        @keyframes pulseSwipe {
            0%, 100% { transform: translateX(0); opacity: 0.8; }
            50% { transform: translateX(10px); opacity: 1; }
        }
        .animate-swipe-hint { animation: pulseSwipe 1.5s infinite ease-in-out; }
      `}</style>

      {/* --- RADIAL AURORA GLOW (Centered Backdrop) --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[85vh] pointer-events-none z-0 flex justify-center items-start overflow-hidden">
          <div className="absolute top-[-15%] w-[700px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px] mix-blend-screen"></div>
          <div className="absolute top-[10%] w-[500px] h-[400px] bg-[#2583EB]/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex justify-between items-center fade-in-up">
        <div className="flex items-center text-white font-display font-bold text-2xl md:text-3xl tracking-tight uppercase italic gap-2">
            <BrandLogo />
            <span>Brand<span className="text-[#7C3AED]">To</span>Post</span>
        </div>
        <div className="text-xs md:text-sm font-sans font-bold px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-full flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#18F07A]" />
            <span className="text-zinc-300 font-semibold">Classified Beta</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 pt-4 md:pt-12 pb-20">
        
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-24">
            
            {/* Left Side: Dynamic Flow (Capture -> Survey -> Completed) */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left z-20">
                
                {/* STATE 1: INITIAL EMAIL CAPTURE */}
                {formState === 'capture' && (
                  <div className="fade-in">
                    <div className="inline-flex items-center gap-2 bg-[#7C3AED]/15 text-[#a78bfa] font-sans font-bold text-xs md:text-sm uppercase tracking-widest px-5 py-2 rounded-full mb-8 border border-[#7C3AED]/30">
                        <Sparkles className="w-4 h-4 text-[#a78bfa] animate-pulse" />
                        Autonomous Marketing Agents
                    </div>
                    
                    {/* The Clean, Blueprint-driven Headline */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight mb-6 text-white leading-[1.05]">
                        You are a founder, not a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#2583EB]">full-time creator.</span>
                    </h1>
                    
                    {/* Hitting the client retainer/revision pain point directly */}
                    <p className="text-zinc-400 text-lg md:text-xl font-medium mb-10 max-w-lg leading-relaxed mx-auto lg:mx-0">
                        Hand off your organic social pipeline to a team of autonomous marketing agents. No prompts to write, no robotic templates to configure. Just high-traction campaigns that sound completely human—built from your website, and put on autopilot.
                    </p>

                    {/* Highly-visible Waitlist Trigger */}
                    <div className="w-full max-w-lg relative z-30 mb-8 mx-auto lg:mx-0">
                        <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row bg-[#1C1C22]/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl focus-within:border-[#7C3AED]/50 focus-within:bg-[#1C1C22]/85 transition-all">
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your work email..." 
                                className="flex-1 bg-transparent border-none px-5 py-4 sm:py-0 text-white focus:outline-none transition-all text-base md:text-lg font-medium placeholder:text-zinc-600"
                                disabled={isSubmitting}
                            />
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-[#7C3AED] to-[#2583EB] text-white font-display font-bold text-base md:text-lg uppercase tracking-widest px-8 py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] glow-btn disabled:opacity-50"
                            >
                                {isSubmitting ? 'SECURING...' : 'GET ACCESS'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                    {/* Hyper-believable Scarcity */}
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

                {/* STATE 2: THE SURVEY (The Superhuman Qualification Loop) */}
                {formState === 'survey' && (
                  <div className="fade-in w-full max-w-lg mx-auto lg:mx-0 bg-[#1C1C22]/80 backdrop-blur-xl border border-[#7C3AED]/30 rounded-3xl p-6 md:p-10 shadow-[0_0_60px_rgba(124,58,237,0.15)] text-left">
                      
                      <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl p-4 mb-8 flex items-start gap-4">
                          <div className="bg-[#7C3AED] text-white rounded-full w-10 h-10 flex items-center justify-center font-display font-bold text-lg shrink-0 mt-1">
                              #
                          </div>
                          <div>
                              <p className="text-white font-display font-bold text-xl leading-tight font-extrabold">You claimed spot #{waitlistNumber} of 50.</p>
                              <p className="text-[#a78bfa] text-sm mt-1">Want to bypass the waiting list? Tell us a bit about your agency to fast-track your priority account.</p>
                          </div>
                      </div>

                      <div className="space-y-8">
                          {/* Question 1 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">1. What is your agency's primary focus?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="agencyFocus" value="B2B SaaS" label="B2B SaaS / Tech clients" />
                                  <SurveyOption field="agencyFocus" value="Personal Branding" label="Personal Branding / Founders" />
                                  <SurveyOption field="agencyFocus" value="E-commerce" label="E-commerce / Brand Campaigns" />
                                  <SurveyOption field="agencyFocus" value="Other" label="Other / General Agency Copy" />
                              </div>
                          </div>

                          {/* Question 2 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">2. How many clients do you currently write for?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="clientCount" value="1-5" label="1 - 5 clients" />
                                  <SurveyOption field="clientCount" value="6-15" label="6 - 15 clients" />
                                  <SurveyOption field="clientCount" value="16+" label="16+ clients" />
                              </div>
                          </div>

                          {/* Question 3 */}
                          <div>
                              <label className="text-white font-display font-bold text-lg mb-3 block">3. What is your biggest content pain point?</label>
                              <div className="space-y-2">
                                  <SurveyOption field="biggestPain" value="Writing" label="AI sounding too robotic and generic" />
                                  <SurveyOption field="biggestPain" value="Approvals" label="Too many revisions from picky clients" />
                                  <SurveyOption field="biggestPain" value="Strategy" label="Spending hours writing prompts" />
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

                {/* STATE 3: SURVEY COMPLETED */}
                {formState === 'completed' && (
                  <div className="fade-in w-full max-w-lg mx-auto lg:mx-0 flex flex-col items-center lg:items-start text-center lg:text-left mt-10">
                      <div className="w-20 h-20 bg-[#18F07A]/20 border-2 border-[#18F07A] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(24,240,122,0.3)]">
                          <CheckCircle2 className="w-10 h-10 text-[#18F07A]" />
                      </div>
                      <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-4">
                          Priority Access <span className="text-[#18F07A]">Requested.</span>
                      </h1>
                      <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                          Your profile has been prioritized. If your agency is selected for the private beta, our team will reach out directly with your onboarding invitation.
                      </p>
                  </div>
                )}
            </div>

            {/* Right Side: The Ultra-Interactive "Slop Eraser" Slider */}
            <div className={`lg:col-span-6 w-full flex justify-center lg:justify-end slide-up relative z-10 hidden md:flex ${formState !== 'capture' ? 'opacity-30 blur-sm pointer-events-none transition-all duration-700' : 'transition-all duration-700'}`}>
                <div className="animate-float w-full max-w-[530px]">
                    <TiltCard className="w-full bg-[#111116] border border-white/10 rounded-3xl p-5 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative overflow-hidden will-change-transform transform-style-3d">
                        
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Top Browser Bar Header */}
                        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <div className="mx-auto bg-black/50 px-4 py-1 rounded-md text-xs font-mono text-zinc-500 flex items-center gap-2 border border-white/5">
                                <Lock className="w-3 h-3" /> app.brandtopost.com
                            </div>
                        </div>

                        {/* SLOP ERASER CANVAS CONTAINER */}
                        <div className="relative h-[280px] w-full bg-black/40 rounded-2xl border border-zinc-800/80 overflow-hidden select-none">
                            
                            {/* Layer 1 (Underneath): CLEAN HUMANIZED TROR COPY (revealed when slid) */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-2 text-[#18F07A] text-xs font-bold uppercase tracking-widest">
                                    <Sparkles className="w-4 h-4 text-[#18F07A]" /> Humanredraft (TROR Engine)
                                </div>
                                <div className="text-white font-sans text-[15px] leading-relaxed font-semibold mt-4">
                                    <p className="mb-2 text-[#18F07A]">Stop buying more software to fix broken team communication.</p>
                                    <p className="text-zinc-200">Adding Slack on top of Teams doesn't build alignment. It creates notification fatigue. The most productive teams we tracked didn't have more tools. They had stricter writing protocols.</p>
                                </div>
                                <div className="border-t border-[#18F07A]/10 pt-3 flex justify-between text-[11px] text-zinc-500 font-medium">
                                    <span>APPROVED INSTANTLY</span>
                                    <span>0 AI TRIGGER WORDS</span>
                                </div>
                            </div>

                            {/* Layer 2 (Slid/Clipped): ROBOTIC LLM SLOP CARD */}
                            <div 
                                className="absolute inset-0 bg-[#161116] p-5 flex flex-col justify-between border-r border-[#FF4444]/40 overflow-hidden"
                                style={{ width: `${sliderPos}%` }}
                            >
                                <div className="w-[450px] flex flex-col justify-between h-full">
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-widest">
                                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> AI Jargon Alert (Typical GPT)
                                    </div>
                                    <div className="text-zinc-500 font-sans text-[15px] leading-relaxed mt-4 italic">
                                        "In today's fast-paced digital{" "}
                                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-1 rounded line-through">tapestry</span>, 
                                        it is imperative to{" "}
                                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-1 rounded line-through">delve</span>{" "}
                                        into key workflows to leverage paradigm-shifting{" "}
                                        <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-1 rounded line-through">synergy</span>..."
                                    </div>
                                    <div className="border-t border-red-500/10 pt-3 flex justify-between text-[11px] text-red-400/50 font-medium">
                                        <span>REJECTED BY CLIENT</span>
                                        <span>8 AI TRIGGER WORDS FOUND</span>
                                    </div>
                                </div>
                            </div>

                            {/* The Interactive Slider Line (Erase Beam) */}
                            <div 
                                className="absolute top-0 bottom-0 w-[2px] bg-[#7C3AED] shadow-[0_0_15px_#7C3AED] pointer-events-none"
                                style={{ left: `${sliderPos}%` }}
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#7C3AED] border-2 border-white flex items-center justify-center shadow-lg pointer-events-auto cursor-ew-resize">
                                    <Sliders className="w-4 h-4 text-white" />
                                </div>
                            </div>

                        </div>

                        {/* Slider Controller Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                <span>Slop ({100 - sliderPos}%)</span>
                                <span className={isCleaned ? 'text-[#18F07A]' : 'text-zinc-400'}>{isCleaned ? 'Fully Humanized! 🚀' : 'Drag to humanize'}</span>
                            </div>
                            <div 
                                ref={sliderTrackRef}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                className="h-4 bg-zinc-900 border border-zinc-800 rounded-full relative cursor-ew-resize overflow-hidden flex items-center"
                            >
                                <div 
                                    className="h-full bg-gradient-to-r from-red-500 via-[#7C3AED] to-[#18F07A]" 
                                    style={{ width: `${sliderPos}%` }}
                                ></div>
                                <div 
                                    className="absolute w-4 h-4 rounded-full bg-white shadow-md border border-zinc-300 pointer-events-none"
                                    style={{ left: `calc(${sliderPos}% - 8px)` }}
                                ></div>
                            </div>
                        </div>

                        {/* Floating Interaction Hint */}
                        {!isCleaned && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 animate-swipe-hint">
                                <ArrowRight className="w-4 h-4" /> <span>Swipe the purple handle to humanize</span>
                            </div>
                        )}

                        {/* Cringe Warning Box */}
                        <div className="mt-6 bg-black/30 rounded-xl p-4 border border-zinc-800 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                            </div>
                            <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                                Marketers spent hours rewriting standard LLM drafts in 2025. TROR's custom system bypasses vocabulary patterns completely to preserve agency margins.
                            </p>
                        </div>

                    </TiltCard>
                </div>
            </div>
        </div>

        {/* --- THE BLUEPRINT OUTLINE --- */}
        <div className={`w-full max-w-6xl mx-auto mt-10 md:mt-16 transition-opacity duration-500 ${formState !== 'capture' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white uppercase tracking-wider">The Blueprint</h3>
                <p className="text-zinc-400 mt-2 font-medium text-base md:text-lg">How premium agencies are quietly maintaining their edge.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Blueprint Row 1 */}
                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-colors">
                    <div className="w-11 h-11 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl flex items-center justify-center mb-6 border border-[#7C3AED]/30">
                        <span className="font-display font-bold text-xl">01</span>
                    </div>
                    <h4 className="text-lg md:text-xl font-display font-bold text-white mb-3 uppercase tracking-wider">🧬 Brand DNA & Psychographics</h4>
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">No more prompts. Our system automatically establishes your customer's "Heaven" & "Hell" psychographic states, resolving painful objections in marketing copy before any draft is even written.</p>
                </TiltCard>

                {/* Blueprint Row 2 */}
                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#2583EB]/50 transition-colors">
                    <div className="w-11 h-11 bg-[#2583EB]/10 text-[#2583EB] rounded-xl flex items-center justify-center mb-6 border border-[#2583EB]/30">
                        <span className="font-display font-bold text-xl">02</span>
                    </div>
                    <h4 className="text-lg md:text-xl font-display font-bold text-white mb-3 uppercase tracking-wider">🤖 Tror, The Autonomous CMO</h4>
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">Your digital CMO coordinating specialized autonomous backend agents—The Strategist, The Copywriter, The Designer, and The Publisher—to drive multi-platform campaigns.</p>
                </TiltCard>

                {/* Blueprint Row 3 */}
                <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#18F07A]/50 transition-colors">
                    <div className="w-11 h-11 bg-[#18F07A]/10 text-[#18F07A] rounded-xl flex items-center justify-center mb-6 border border-[#18F07A]/30">
                        <span className="font-display font-bold text-xl">03</span>
                    </div>
                    <h4 className="text-lg md:text-xl font-display font-bold text-white mb-3 uppercase tracking-wider">📅 1-Tab Social Queue</h4>
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">Instantly review, edit, and schedule natively across all platforms (LinkedIn, X, Instagram, Facebook, Reddit) from a single interactive queue. Stop juggling different tools.</p>
                </TiltCard>
            </div>
        </div>

      </main>

      {/* Sticky Bottom Form for Mobile (Frictionless navigation) */}
      <div className={`fixed bottom-0 left-0 w-full z-50 bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-zinc-800 p-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ${formState === 'completed' ? 'translate-y-full' : 'translate-y-0'}`}>
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
                  className="w-full bg-[#18F07A] text-black font-display font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-lg flex justify-center items-center gap-2 animate-pulse"
              >
                  <ArrowUp className="w-4 h-4" /> COMPLETE SURVEY TO SKIP
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
