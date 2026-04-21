import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Zap, CheckCircle2, ArrowRight, Layers, ScanLine, Activity, ArrowUp, Skull, Sparkles } from 'lucide-react';

// --- The "Corporate BS" Feed ---
const swipeFeed = [
  {
      bad: '"We need to synergize our cross-functional bandwidth to deliver scalable growth."',
      truth: '"I literally just copy-pasted this from ChatGPT."',
      tag: "AI Slop Detected"
  },
  {
      bad: '"Per my last email, let\'s circle back offline to align on this."',
      truth: '"Read the damn email I already sent you. I want to end this meeting."',
      tag: "Passive Aggressive"
  },
  {
      bad: '"We are thrilled and humbled to announce a tapestry of low-hanging fruit."',
      truth: '"I have absolutely no idea what my company actually sells."',
      tag: "The LinkedIn Lunatic"
  }
];

const particleEffects = {
  texts: ["BS DESTROYED!", "VIBE CHECKED!", "TRUTH BOMB!", "NAILED IT!", "NO FLUFF."],
  colors: ['#18F07A', '#eab308', '#7C3AED', '#FF7778'] 
};

// --- Custom Hooks ---
const use3DTilt = (options = { max: 5, scale: 1.01, speed: 400 }) => {
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
  // Tracking
  const [userId] = useState(() => {
    let id = localStorage.getItem('b2p_visitor_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('b2p_visitor_id', id);
    }
    return id;
  });

  const [interactions, setInteractions] = useState([]);
  
  // App States
  const [appState, setAppState] = useState('feed'); // 'feed' | 'reveal'
  const [step, setStep] = useState(0); // 0: BS1, 1: Truth1, 2: BS2, 3: Truth2, 4: BS3, 5: Truth3
  
  // Swipe Mechanics
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const startY = useRef(null);
  
  // Visual FX States
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const roundIndex = Math.floor(step / 2);
  const isTruthState = step % 2 !== 0;
  const activeQuote = swipeFeed[Math.min(roundIndex, swipeFeed.length - 1)];

  // Tracking Function
  const trackEvent = useCallback((eventName, userEmail = "No Email", currentInteractions = interactions) => {
    try {
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('interactions', JSON.stringify({
        userId: userId,
        event: eventName,
        history: currentInteractions,
        timestamp: new Date().toISOString()
      }));
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData });
    } catch (err) {
      console.error("Tracking Error:", err);
    }
  }, [userId, interactions]);

  // Initial Page Visit Tracking
  useEffect(() => {
    if (!sessionStorage.getItem('b2p_visit_tracked')) {
      trackEvent('page_visit', 'No Email', []);
      sessionStorage.setItem('b2p_visit_tracked', 'true');
    }
  }, [trackEvent]);

  // Handle Waitlist Submission
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      trackEvent('waitlist_submitted', email, interactions);
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth UX delay
      setIsSuccess(true);
    } catch (err) {
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Particle Generator
  const spawnParticles = useCallback((count = 5) => {
    const newParticles = [];
    const screenWidth = window.innerWidth;
    const spawnY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const randomText = particleEffects.texts[Math.floor(Math.random() * particleEffects.texts.length)];
      const randomColor = particleEffects.colors[Math.floor(Math.random() * particleEffects.colors.length)];
      
      const offsetX = (Math.random() - 0.5) * 300;
      let finalX = (screenWidth / 2) + offsetX;
      finalX = Math.max(20, Math.min(finalX, screenWidth - 200));

      newParticles.push({
        id: Date.now() + Math.random(),
        text: randomText,
        color: randomColor,
        x: finalX,
        y: Math.max(20, spawnY - 100)
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1000);
  }, []);

  // --- SWIPE LOGIC ---
  const handlePointerDown = (e) => {
    setIsDragging(true);
    startY.current = e.clientY || e.touches?.[0]?.clientY;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentY = e.clientY || e.touches?.[0]?.clientY;
    if (!currentY || !startY.current) return;
    
    const diff = currentY - startY.current;
    
    // Only allow dragging upwards (negative Y), with slight resistance downwards
    if (diff < 0) {
      setDragY(diff);
    } else {
      setDragY(diff * 0.15); // Hard resistance pulling down
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If swiped up past threshold (100px)
    if (dragY < -100) {
      // Fire card out of screen
      setDragY(-window.innerHeight);
      
      setTimeout(() => {
        advanceFeed();
      }, 300); // Wait for card to fly away

    } else {
      // Snap back to center
      setDragY(0);
    }
  };

  const advanceFeed = () => {
    const nextStep = step + 1;
    
    // Log Interaction
    setInteractions(prev => [...prev, { step: step, state: isTruthState ? 'truth_swiped' : 'bs_decoded' }]);

    if (nextStep > 5) {
      // Game Complete! Go to Waitlist
      trackEvent('feed_completed', 'No Email', interactions);
      setAppState('reveal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Trigger Dopamine Hit if transitioning to TRUTH
    if (nextStep % 2 !== 0) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);
      spawnParticles(4);
    }

    setStep(nextStep);
    setDragY(0);
    
    // Animate new card in from bottom
    setIsAnimatingIn(true);
    setTimeout(() => setIsAnimatingIn(false), 400);
  };

  // Card Dynamic Styles
  const cardStyle = {
    transform: `translateY(${isAnimatingIn ? '100vh' : dragY + 'px'}) scale(${isDragging ? 1 - Math.abs(dragY)/2000 : 1}) rotate(${dragY/50}deg)`,
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    touchAction: 'none' // CRITICAL: Prevents mobile screen scrolling while dragging
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#0A0A0F] text-white font-sans selection:bg-[#7C3AED] selection:text-white relative ${appState === 'reveal' ? 'overflow-x-hidden pb-20 md:pb-0' : 'overflow-hidden fixed inset-0'}`}>
      
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
        
        .font-display { font-family: 'Outfit', sans-serif; }
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-handwriting { font-family: 'Caveat', cursive; }
        
        /* Particle Animation */
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.5) rotate(-5deg); }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2) rotate(5deg); }
          100% { opacity: 0; transform: translateY(-150px) scale(1) rotate(-10deg); }
        }
        .particle-anim {
          animation: floatUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-shadow: 2px 2px 0px rgba(0,0,0,1), -2px -2px 0px rgba(0,0,0,1);
          z-index: 100;
          font-size: 2rem;
        }
        @media (min-width: 640px) { .particle-anim { font-size: 3rem; } }

        /* Bouncing Up Arrow */
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-up { animation: bounceUp 1.5s infinite ease-in-out; }
        
        /* Reveal Animation */
        @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(50px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .reveal-animate { animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Screen Flash Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[9999] transition-colors duration-100"
        style={{ backgroundColor: isFlashing ? 'rgba(255, 255, 255, 0.4)' : 'transparent' }}
      ></div>

      {/* Render Particles */}
      {particles.map(p => (
        <div key={p.id} className="fixed particle-anim pointer-events-none text-center" style={{ left: p.x, top: p.y, color: p.color }}>
          {p.text}
        </div>
      ))}

      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-br from-[#7C3AED]/40 to-transparent transform rotate-12 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-tl from-[#2583EB]/40 to-transparent transform -rotate-12 blur-[100px]"></div>
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex justify-between items-center border-b border-white/5 shrink-0">
        <div className="flex items-center text-white font-display font-bold text-2xl md:text-3xl tracking-tight uppercase italic">
            <BrandLogo />
            <span>Brand<span className="text-[#7C3AED]">To</span>Post</span>
        </div>
        <div className="text-xs md:text-sm font-display font-bold px-4 py-2 border border-[#18F07A]/50 text-[#18F07A] bg-[#18F07A]/10 rounded-full flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#18F07A] animate-pulse"></span>
            VIP Waitlist
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 h-full">
        
        {/* === PHASE 1: THE REELS SWIPE FEED === */}
        {appState === 'feed' && (
          <div className="w-full flex-1 flex flex-col items-center justify-center relative pb-10">
              
              {/* Desktop Progress Bar */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
                  {swipeFeed.map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-12 rounded-full transition-all duration-300 ${idx === roundIndex ? 'bg-[#18F07A] scale-y-125 shadow-[0_0_10px_#18F07A]' : idx < roundIndex ? 'bg-[#7C3AED]' : 'bg-zinc-800'}`}></div>
                  ))}
              </div>

              {/* Swipe Instruction Overlay */}
              <div className="absolute top-4 text-center w-full z-0 opacity-50 flex flex-col items-center">
                  <ArrowUp className="w-8 h-8 text-zinc-500 animate-bounce-up mb-2" />
                  <span className="font-display font-bold uppercase tracking-widest text-zinc-500 text-sm">Swipe Up</span>
              </div>

              {/* The Draggable Swipe Card */}
              <div 
                  className="w-full max-w-lg cursor-grab active:cursor-grabbing z-20 relative select-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  style={cardStyle}
              >
                  <div className={`w-full bg-[#1C1C22] border-2 ${isTruthState ? 'border-[#18F07A]' : 'border-red-500/50'} rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col min-h-[350px] relative overflow-hidden`}>
                      
                      {/* Swipe Handle (Pill) */}
                      <div className="w-16 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50"></div>

                      {/* Card Content */}
                      <div className="flex-1 flex flex-col justify-center relative z-10">
                          
                          {!isTruthState ? (
                              // THE BS (Bad Copy)
                              <div className="flex flex-col items-center text-center">
                                  <span className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 font-display font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-6 border border-red-500/30">
                                      <Skull className="w-3 h-3" /> {activeQuote.tag}
                                  </span>
                                  <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-300 leading-tight uppercase pointer-events-none">
                                      {activeQuote.bad}
                                  </p>
                              </div>
                          ) : (
                              // THE TRUTH (Good Copy)
                              <div className="flex flex-col items-center text-center">
                                  <div className="flex items-center gap-3 mb-6">
                                      <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="TROR" className="w-10 h-10 rounded-full border-2 border-[#18F07A] bg-black shadow-[0_0_15px_rgba(24,240,122,0.4)] pointer-events-none" />
                                      <span className="text-[#18F07A] font-bold uppercase tracking-widest text-sm pointer-events-none">TROR Translation:</span>
                                  </div>
                                  <p className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight pointer-events-none">
                                      {activeQuote.truth}
                                  </p>
                              </div>
                          )}

                      </div>

                      {/* Swipe Up CTA Inside Card */}
                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center">
                          <span className={`font-display font-bold uppercase tracking-widest text-lg md:text-xl flex items-center gap-2 animate-bounce-up ${isTruthState ? 'text-white' : 'text-red-400'}`}>
                              <ArrowUp className="w-5 h-5" /> 
                              {isTruthState ? (step === 5 ? 'SWIPE UP TO UNLOCK' : 'SWIPE UP FOR NEXT') : 'SWIPE UP TO DECODE'}
                          </span>
                      </div>
                      
                      {/* Glow effects inside card */}
                      {isTruthState && <div className="absolute inset-0 bg-gradient-to-t from-[#18F07A]/10 to-transparent pointer-events-none rounded-3xl"></div>}
                      {!isTruthState && <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent pointer-events-none rounded-3xl"></div>}

                  </div>
              </div>

              {/* Mobile Progress Dots */}
              <div className="absolute bottom-6 flex lg:hidden gap-3 z-0 opacity-50">
                  {swipeFeed.map((_, idx) => (
                      <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === roundIndex ? 'bg-[#18F07A] scale-125' : idx < roundIndex ? 'bg-[#7C3AED]' : 'bg-zinc-700'}`}></div>
                  ))}
              </div>

          </div>
        )}

        {/* === PHASE 2: THE REVEAL (PRODUCT INFO & WAITLIST) === */}
        {appState === 'reveal' && (
          <div className="w-full max-w-6xl py-10 md:py-16 my-auto reveal-animate">
              
              <div className="text-center mb-12 md:mb-16">
                  <div className="inline-flex items-center gap-3 bg-[#18F07A] text-black font-display font-bold text-xl md:text-3xl uppercase tracking-widest px-6 md:px-8 py-2 transform -rotate-3 mb-6 border-2 md:border-4 border-white shadow-[4px_4px_0_#2583EB] md:shadow-[8px_8px_0_#2583EB]">
                      <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="TROR" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black object-cover" />
                      BS DESTROYED.
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-wide text-white uppercase max-w-4xl mx-auto italic leading-[1.1]">
                      Stop forcing AI to write generic slop.<br/>
                      <span className="text-zinc-500 text-2xl sm:text-3xl md:text-4xl mt-2 block font-medium not-italic normal-case tracking-tight">Let TROR extract your actual brand voice.</span>
                  </h2>
              </div>

              {/* 1. Hero Bento Box (The Hook) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-16 relative">
                  
                  {/* Decorative Sticky Note */}
                  <div className="hidden lg:block absolute -right-8 -top-10 z-30 transform rotate-6 bg-[#7C3AED] p-6 shadow-[8px_8px_0_#2583EB] w-48 border-2 border-white">
                      <p className="font-handwriting text-white text-xl font-bold leading-snug">
                          Make them notice. <br/>Make it stick.
                      </p>
                  </div>

                  {/* Main Value Prop WITH FULL MASCOT */}
                  <TiltCard className="lg:col-span-7 bg-[#1C1C22] border border-zinc-800 rounded-3xl relative overflow-hidden flex flex-col md:flex-row shadow-2xl group">
                      
                      {/* Content Side */}
                      <div className="p-6 sm:p-8 md:p-10 flex-1 relative z-10 flex flex-col justify-center w-full md:w-3/5">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2583EB] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)] shrink-0">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl md:text-3xl font-display font-extrabold uppercase text-white tracking-wide">Meet TROR.</h3>
                        </div>
                        
                        <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-6 font-medium relative z-10">
                            TROR is your AI Brand Strategist. He sees past the jargon, extracting your client's exact brand DNA to write and schedule high-traction campaigns that sound human.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-white/5 px-3 py-1.5 rounded-md uppercase tracking-widest border border-white/10">Positioning</span>
                          <span className="text-[10px] sm:text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1.5 rounded-md uppercase tracking-widest border border-[#7C3AED]/30">Signal</span>
                          <span className="text-[10px] sm:text-xs font-bold text-[#18F07A] bg-[#18F07A]/10 px-3 py-1.5 rounded-md uppercase tracking-widest border border-[#18F07A]/30">Traction</span>
                        </div>
                      </div>

                      {/* Full Mascot Side */}
                      <div className="w-full h-56 md:w-2/5 md:h-auto relative bg-gradient-to-t from-[#7C3AED]/10 to-transparent flex items-end justify-center md:justify-end mt-4 md:mt-0 pt-8 overflow-hidden">
                          <img 
                              src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Mask-group.png" 
                              alt="TROR Full Mascot" 
                              className="absolute bottom-[-10%] md:bottom-0 h-[120%] md:h-[110%] w-auto object-contain transform md:translate-x-4 group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-500 drop-shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                              onError={(e) => e.target.style.display = 'none'}
                          />
                      </div>
                  </TiltCard>

                  {/* Features Grid (Right Side) */}
                  <div className="lg:col-span-5 grid grid-rows-2 gap-6">
                      <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <ScanLine className="w-8 h-8 text-[#7C3AED] mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">Signal Spotting</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Drop a client's link. We map their exact positioning and tone in seconds.</p>
                      </TiltCard>

                      <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <Activity className="w-8 h-8 text-[#2583EB] mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">Momentum Engine</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Generate full-stack omnichannel campaigns without the generic AI slop.</p>
                      </TiltCard>
                  </div>
              </div>

              {/* 2. Expanded Product Info: How It Works */}
              <div className="w-full mb-16 mt-8">
                  <div className="text-center mb-10">
                      <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white uppercase tracking-wide">How BrandToPost Works</h3>
                      <p className="text-zinc-400 mt-2 font-medium text-lg">From a single URL or brief to a month of high-traction content.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Step 1 */}
                      <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#7C3AED]/50 transition-colors">
                          <div className="w-12 h-12 bg-[#7C3AED]/10 text-[#7C3AED] rounded-2xl flex items-center justify-center mb-6 border border-[#7C3AED]/30 group-hover:scale-110 transition-transform">
                              <span className="font-display font-bold text-2xl">01</span>
                          </div>
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">Extract The Signal</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Paste a URL, or drop a quick description/doc if you're pre-revenue. TROR analyzes the tone and builds a custom Brand DNA profile in seconds.</p>
                      </TiltCard>

                      {/* Step 2 */}
                      <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#2583EB]/50 transition-colors">
                          <div className="w-12 h-12 bg-[#2583EB]/10 text-[#2583EB] rounded-2xl flex items-center justify-center mb-6 border border-[#2583EB]/30 group-hover:scale-110 transition-transform">
                              <span className="font-display font-bold text-2xl">02</span>
                          </div>
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">Generate Momentum</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Turn that DNA into a 30-day omnichannel campaign. LinkedIn hooks, Twitter threads, and newsletters that actually sound like your client wrote them.</p>
                      </TiltCard>

                      {/* Step 3 */}
                      <TiltCard className="bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-[#18F07A]/50 transition-colors">
                          <div className="w-12 h-12 bg-[#18F07A]/10 text-[#18F07A] rounded-2xl flex items-center justify-center mb-6 border border-[#18F07A]/30 group-hover:scale-110 transition-transform">
                              <span className="font-display font-bold text-2xl">03</span>
                          </div>
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">Gain Traction</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base leading-relaxed">Review, edit, and schedule natively across all platforms from a single 1-Tab Arena. Stop juggling 10 different scheduling tools.</p>
                      </TiltCard>
                  </div>
              </div>

              {/* 3. Secure Native Waitlist Form connected to Google Sheets */}
              <div className="max-w-3xl mx-auto bg-[#1C1C22] border border-zinc-800 rounded-3xl p-6 sm:p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 to-[#2583EB]/10 pointer-events-none"></div>
                  
                  <div className="relative z-10">
                      <h3 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-2 uppercase tracking-wide">Claim Your Spot.</h3>
                      <p className="text-zinc-400 mb-8 font-medium text-base md:text-lg">
                          Join the waitlist to lock in early access and get <span className="text-[#18F07A] font-bold underline">free VIP onboarding</span>. Strictly limited to 50 founding agencies.
                      </p>
                      
                      <div className="max-w-xl mx-auto mt-4">
                          {isSuccess ? (
                              <div className="flex flex-col items-center justify-center p-8 bg-[#0A0A0F]/80 rounded-2xl backdrop-blur-sm border border-[#18F07A]/30">
                                  <div className="w-16 h-16 bg-[#18F07A]/20 text-[#18F07A] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(24,240,122,0.3)]">
                                      <CheckCircle2 className="w-8 h-8" />
                                  </div>
                                  <h4 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-wide">Spot Secured!</h4>
                                  <p className="text-zinc-400 text-base">You're officially on the roster. We will reach out to you soon.</p>
                              </div>
                          ) : (
                              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                                  <input 
                                      type="email" 
                                      required
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      placeholder="name@youragency.com" 
                                      className="flex-1 bg-[#0A0A0F] border border-zinc-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#7C3AED] transition-all text-lg font-medium placeholder:text-zinc-600 shadow-inner"
                                      disabled={isSubmitting}
                                  />
                                  <button 
                                      type="submit" 
                                      disabled={isSubmitting}
                                      className="bg-gradient-to-r from-[#7C3AED] to-[#2583EB] text-white font-display font-bold text-xl uppercase tracking-widest px-8 py-4 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 shadow-[0_4px_15px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      {isSubmitting ? 'CLAIMING...' : 'CLAIM VIP SPOT'} <ArrowRight className="w-5 h-5" />
                                  </button>
                              </form>
                          )}
                      </div>
                  </div>
              </div>
          </div>
        )}

      {/* Mobile Floating Waitlist Form (Only visible in 'reveal' phase) */}
      {appState === 'reveal' && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-[#1C1C22]/95 backdrop-blur-xl border-t border-zinc-800 p-3 pb-5 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500">
            {isSuccess ? (
                <div className="flex items-center justify-center gap-2 text-[#18F07A] font-display font-bold uppercase tracking-widest text-sm py-3">
                    <CheckCircle2 className="w-6 h-6" /> Spot Secured! We'll be in touch.
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[#18F07A] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse"><Target className="w-3 h-3" /> VIP Access</span>
                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">50 Spots Only</span>
                    </div>
                    <form onSubmit={handleWaitlistSubmit} className="flex gap-2 px-1">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@agency.com" 
                            className="flex-1 bg-[#0A0A0F] border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#7C3AED] transition-all text-sm font-medium placeholder:text-zinc-500"
                            disabled={isSubmitting}
                        />
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-[#7C3AED] to-[#2583EB] text-white font-display font-bold text-sm uppercase tracking-widest px-5 py-2.5 rounded-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                        >
                            {isSubmitting ? '...' : 'CLAIM'}
                        </button>
                    </form>
                </div>
            )}
        </div>
      )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center mt-auto pb-28 md:pb-8 shrink-0">
          <p className="text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-widest">Designed with intent. Built for brands that lead. © 2026 BrandToPost.</p>
      </footer>

    </div>
  );
}
