import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Zap, ShieldAlert, CheckCircle2, Terminal, Activity, Layers, ArrowRight, Swords, Skull, Trophy, Mic, Code, ScanLine } from 'lucide-react';

// --- Custom Hooks ---

// 3D Tilt Effect
const use3DTilt = (options = { max: 8, scale: 1.02, speed: 400 }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (window.innerWidth < 768) return; // Disable on mobile

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

// --- Game Data (The Wrestling Smackdown) ---

const gameRounds = [
  {
      promo: '"IN THIS EVER-EVOLVING DIGITAL TAPESTRY, WE MUST DELVE INTO THE NUANCES OF OUR SYNERGY..."',
      optCorporate: "Great intro, sounds very professional.",
      optIntrusive: '"IF I READ \'DELVE\' ONE MORE TIME I\'M QUITTING."',
      optWrestling: "DROPKICK THE DICTIONARY!"
  },
  {
      promo: '"CAN WE MAKE THE LOGO BIGGER, BUT ALSO INVISIBLE? AND MAKE THIS POST GO VIRAL BY 5PM?"',
      optCorporate: "Sure thing! I'll ping the design team.",
      optIntrusive: '"I HOPE YOUR WIFI DISCONNECTS FOREVER."',
      optWrestling: "HIT 'EM WITH THE STEEL CHAIR!"
  },
  {
      promo: '"I WOKE UP AT 3AM, TOOK AN ICE BATH, AND FIRED MY TEAM. HERE ARE 5 SECRETS TO B2B SALES:"',
      optCorporate: "So inspiring, thanks for sharing! 🚀",
      optIntrusive: '"YOU ARE THE REASON MY THERAPIST BOUGHT A YACHT."',
      optWrestling: "SUPLEX THE LINKEDIN LUNATIC!"
  },
  {
      promo: '"GREETINGS FELLOW MILLENNIALS. OUR NEW ENTERPRISE COMPLIANCE SAAS IS TOTALLY \'LIT\' AND \'NO CAP\'."',
      optCorporate: "Spot on demographic targeting.",
      optIntrusive: '"MY EYES ARE ACTUALLY BLEEDING."',
      optWrestling: "OFF THE TOP ROPE!!!"
  },
  {
      promo: '"WE SELL ACCOUNTING SOFTWARE. CAN YOU MAKE OUR TIKTOKS FEEL MORE LIKE APPLE OR NIKE?"',
      optCorporate: "We will pivot our visual strategy.",
      optIntrusive: '"YOU SELL SPREADSHEETS, KEVIN."',
      optWrestling: "TAG TEAM WITH BEACON! (FINISHING MOVE)"
  }
];

const particleEffects = {
  corporate: {
      texts: ["BOOOOO!", "WEAK!", "CROWD IS ASLEEP", "-1 DMG", "BORING!"],
      colors: ['#71717A', '#52525B'] // Grays
  },
  intrusive: {
      texts: ["*BEEP!*", "HR IS CALLING!", "EMOTIONAL DAMAGE!", "CENSORED!", "RUTHLESS!"],
      colors: ['#FF7778', '#EF4444', '#DC2626'] // BrandToPost reds
  },
  wrestling: {
      texts: ["BAH GAWD!", "BROKEN IN HALF!", "WATCH OUT WATCH OUT!", "A SLOBBERKNOCKER!", "SIGNAL ACQUIRED!"],
      colors: ['#7C3AED', '#2583EB', '#18F07A', '#FFFFFF'] 
  }
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

// Custom Brand Logo Component
const BrandLogo = () => (
  <img 
    src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" 
    alt="BrandToPost Logo" 
    className="w-8 h-8 md:w-10 md:h-10 object-contain shrink-0 mr-2" 
  />
);

// --- Main App Component ---

export default function App() {
  // App States
  const [appState, setAppState] = useState('game'); // 'game' | 'reveal'
  const [currentRound, setCurrentRound] = useState(0);
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const maxRounds = gameRounds.length;
  // SAFE FALLBACK: Prevents out of bounds errors
  const currentData = gameRounds[Math.min(currentRound, maxRounds - 1)];

  // Handle Waitlist Submission
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      // Mock API call - Replace this with your actual form submission logic in your IDE
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      console.error("Error saving email:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Particle Generator
  const spawnParticles = useCallback((clientX, clientY, type, count = 1) => {
    const effectData = particleEffects[type] || particleEffects.wrestling;
    const newParticles = [];

    const spawnX = clientX || window.innerWidth / 2;
    const spawnY = clientY || window.innerHeight / 2;
    const screenWidth = window.innerWidth;

    for (let i = 0; i < count; i++) {
      const randomText = effectData.texts[Math.floor(Math.random() * effectData.texts.length)];
      const randomColor = effectData.colors[Math.floor(Math.random() * effectData.colors.length)];
      
      const offsetX = (Math.random() - 0.5) * 150;
      let finalX = spawnX + offsetX;
      finalX = Math.max(20, Math.min(finalX, screenWidth - 250)); // Constrain to screen

      newParticles.push({
        id: Date.now() + Math.random(),
        text: randomText,
        color: randomColor,
        x: finalX,
        y: Math.max(20, spawnY - 60)
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  const handleChoice = (type, e) => {
    if (currentRound >= maxRounds || isFadingOut) return;

    // 1. Visual Feedback
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    setIsShaking(false);
    setTimeout(() => setIsShaking(true), 10);

    // 2. Spawn Particles
    const particleCount = type === 'corporate' ? 2 : 3; 
    spawnParticles(e.clientX, e.clientY, type, particleCount);

    // 3. Game Logic
    if (currentRound + 1 < maxRounds) {
      setCurrentRound(prev => prev + 1);
    } else {
      // End Game Sequence
      setCurrentRound(maxRounds); // Safely caps out at 5
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 'wrestling', 5);
      
      setIsFadingOut(true);
      setTimeout(() => {
        setAppState('reveal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 900); // Gives time to see the "K.O." text
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F] text-white font-sans selection:bg-[#7C3AED] selection:text-white overflow-x-hidden relative">
      
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
        
        .font-display { font-family: 'Outfit', sans-serif; }
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-handwriting { font-family: 'Caveat', cursive; }
        
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.9) rotate(-2deg); }
          20% { opacity: 1; transform: translateY(0px) scale(1.1) rotate(2deg); }
          100% { opacity: 0; transform: translateY(-80px) scale(1) rotate(-5deg); }
        }
        .particle-anim {
          animation: floatUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(0,0,0,0.8);
          z-index: 100;
          font-size: 1.5rem;
        }
        @media (min-width: 640px) { .particle-anim { font-size: 2.2rem; } }

        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
          40%, 60% { transform: translate3d(8px, 0, 0); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      {/* Screen Flash Overlay (Red impact) */}
      <div 
        className="pointer-events-none fixed inset-0 z-[9999] transition-colors duration-200"
        style={{ backgroundColor: isFlashing ? 'rgba(239, 68, 68, 0.25)' : 'transparent' }}
      ></div>

      {/* Render Particles */}
      {particles.map(p => (
        <div key={p.id} className="fixed particle-anim pointer-events-none" style={{ left: p.x, top: p.y, color: p.color }}>
          {p.text}
        </div>
      ))}

      {/* Sleek Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-br from-[#7C3AED]/40 to-transparent transform rotate-12 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-tl from-[#2583EB]/40 to-transparent transform -rotate-12 blur-[100px]"></div>
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex justify-between items-center border-b border-white/5">
        <div className="flex items-center text-white font-display font-bold text-2xl md:text-3xl tracking-tight uppercase italic">
            <BrandLogo />
            <span>Brand<span className="text-[#7C3AED]">To</span>Post</span>
        </div>
        <div className={`text-xs md:text-sm font-display font-bold px-4 py-2 border-2 flex items-center gap-2 transition-colors uppercase tracking-widest ${appState === 'reveal' ? 'bg-[#18F07A]/10 text-[#18F07A] border-[#18F07A]/50' : 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/50'}`}>
            {appState === 'reveal' ? <Trophy className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
            <span className="hidden sm:inline">{appState === 'reveal' ? 'CHAMPION CROWNED' : 'MATCH IN PROGRESS'}</span>
            <span className="sm:hidden">{appState === 'reveal' ? 'WINNER' : `${Math.min(currentRound + 1, maxRounds)}/${maxRounds}`}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 min-h-[80vh]">
        
        {/* === PHASE 1: THE GAME (Marketing Smackdown) === */}
        {appState === 'game' && (
          <div className={`w-full flex flex-col items-center justify-center py-8 my-auto transition-opacity duration-700 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100'}`}>
              
              <div className="text-center mb-6 md:mb-10 max-w-2xl">
                  <div className="inline-block bg-[#7C3AED] text-white font-display font-bold text-xl md:text-2xl uppercase tracking-widest px-4 md:px-6 py-1 transform -rotate-2 mb-4 border-2 border-white shadow-[4px_4px_0_#2583EB]">
                      Main Event
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold tracking-wide mb-4 text-white leading-none uppercase italic drop-shadow-[2px_2px_0_#7C3AED] md:drop-shadow-[4px_4px_0_#7C3AED]">
                      You vs. Corporate Cringe
                  </h1>
                  <p className="text-zinc-400 text-base md:text-xl font-medium mt-4">
                      Your client's copy is in the ring. Choose your attack to finish it.
                  </p>
              </div>

              {/* Health Bar with Avatar */}
              <div className="w-full max-w-3xl mb-4 relative flex items-end justify-between">
                  <div className="flex items-center gap-3">
                      <div className="relative">
                          <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Beacon Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#7C3AED] object-cover bg-black" />
                          <div className="absolute -bottom-1 -right-1 bg-[#18F07A] w-3 h-3 rounded-full border-2 border-[#0A0A0F]"></div>
                      </div>
                      <span className="text-sm md:text-lg font-display font-bold text-white uppercase tracking-widest hidden sm:block">Beacon (You)</span>
                  </div>
                  
                  <div className="flex flex-col items-end w-2/3 md:w-1/2">
                      <div className="flex justify-between w-full text-xs md:text-sm font-display font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                          <span>Opponent: AI Sludge</span>
                          <span className="text-[#FF7778] font-bold">{100 - ((currentRound / maxRounds) * 100)}% HP</span>
                      </div>
                      <div className="w-full h-3 md:h-4 bg-[#1C1C22] border border-white/10 p-0.5 transform skew-x-[-10deg]"> 
                          <div className="h-full bg-gradient-to-r from-[#FF7778] to-[#EF4444] transition-all duration-300" style={{ width: `${100 - ((currentRound / maxRounds) * 100)}%` }}></div>
                      </div>
                  </div>
              </div>

              {/* The Target Card */}
              <TiltCard className={`w-full max-w-3xl bg-[#1C1C22] border-2 border-[#7C3AED]/50 rounded-lg p-6 sm:p-8 md:p-12 shadow-2xl relative mb-6 md:mb-8 overflow-hidden ${isShaking ? 'animate-shake' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
                  
                  <div className="absolute top-0 left-0 bg-[#7C3AED] text-white text-[10px] md:text-sm font-bold uppercase tracking-widest px-3 py-1 md:px-4 flex items-center shadow-[2px_2px_0_#2583EB]">
                      <Mic className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Opponent's Promo
                  </div>

                  <div className="mt-6 md:mt-8 min-h-[120px] md:min-h-[160px] flex items-center justify-center relative z-10">
                      <p key={currentRound} className="text-xl sm:text-2xl md:text-4xl font-display font-extrabold text-center leading-tight text-white uppercase tracking-wide animate-in fade-in zoom-in duration-300">
                          {currentRound >= maxRounds ? 'K.O.!!!' : currentData.promo}
                      </p>
                  </div>
              </TiltCard>

              {/* The Action Buttons */}
              {currentRound < maxRounds && (
                <div className="w-full max-w-3xl flex flex-col gap-3 mt-2">
                    
                    {/* Wrestling Move (Brand Primary CTA) */}
                    <button onClick={(e) => handleChoice('wrestling', e)} className="relative w-full text-left bg-gradient-to-r from-[#7C3AED] to-[#2583EB] border-2 border-white text-white font-display font-bold text-xl md:text-2xl px-5 py-4 rounded-xl hover:brightness-110 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-2 shadow-[4px_4px_0_#FFFFFF] active:scale-[0.98] active:translate-y-1 active:shadow-none">
                        <span className="flex items-center gap-3 drop-shadow-md">{currentData.optWrestling}</span>
                        <span className="text-[10px] md:text-xs font-sans uppercase tracking-widest opacity-80 text-white drop-shadow-none">[Wrestling Move]</span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {/* Corporate Move */}
                        <button onClick={(e) => handleChoice('corporate', e)} className="relative w-full text-left bg-[#1C1C22] border-2 border-zinc-600 text-zinc-400 font-sans font-medium text-sm md:text-base px-5 py-4 rounded-xl hover:bg-white/5 hover:text-white transition-colors flex flex-col justify-between group gap-2 active:scale-[0.98]">
                            <span>{currentData.optCorporate}</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">[Corporate Response]</span>
                        </button>

                        {/* Intrusive Move */}
                        <button onClick={(e) => handleChoice('intrusive', e)} className="relative w-full text-left bg-[#0A0A0F] border-2 border-[#EF4444] text-[#FF7778] font-display font-bold text-lg md:text-xl tracking-wide px-5 py-4 rounded-xl hover:bg-[#EF4444] hover:text-white transition-colors flex flex-col justify-between group gap-2 shadow-[3px_3px_0_rgba(239,68,68,0.5)] active:scale-[0.98] active:translate-y-1 active:shadow-none">
                            <span>{currentData.optIntrusive}</span>
                            <span className="text-[10px] font-sans uppercase tracking-widest font-bold opacity-60">[Intrusive Thought]</span>
                        </button>
                    </div>

                </div>
              )}
          </div>
        )}

        {/* === PHASE 2: THE REVEAL === */}
        {appState === 'reveal' && (
          <div className="w-full max-w-6xl py-10 md:py-16 my-auto animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
              
              <div className="text-center mb-12 md:mb-16">
                  <div className="inline-flex items-center gap-3 bg-[#18F07A] text-black font-display font-bold text-2xl md:text-4xl uppercase tracking-widest px-6 md:px-8 py-2 transform -rotate-3 mb-6 border-2 md:border-4 border-white shadow-[4px_4px_0_#2583EB] md:shadow-[8px_8px_0_#2583EB] animate-pulse">
                      <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Beacon" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black object-cover" />
                      K.O.! BEACON WINS!
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-wide text-white uppercase max-w-4xl mx-auto italic leading-[1.1]">
                      You just destroyed 5 hours of bad copywriting in 5 seconds.<br/>
                      <span className="text-zinc-500 text-2xl sm:text-3xl md:text-4xl mt-2 block font-medium not-italic normal-case tracking-tight">Now let BrandToPost do it for real.</span>
                  </h2>
              </div>

              {/* Bento Box Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12 relative">
                  
                  {/* Decorative Sticky Note from Moodboard */}
                  <div className="hidden lg:block absolute -right-8 -top-10 z-30 transform rotate-6 bg-[#7C3AED] p-6 shadow-[8px_8px_0_#2583EB] w-48 border-2 border-white">
                      <p className="font-handwriting text-white text-xl font-bold leading-snug">
                          Make them notice. <br/>Make it stick.
                      </p>
                  </div>

                  {/* Main Value Prop WITH FULL MASCOT */}
                  <TiltCard className="lg:col-span-7 bg-[#1C1C22] border-2 border-zinc-800 rounded-2xl relative overflow-hidden flex flex-col md:flex-row shadow-xl group">
                      
                      {/* Content Side */}
                      <div className="p-6 sm:p-8 md:p-10 flex-1 relative z-10 flex flex-col justify-center w-full md:w-3/5">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2583EB] flex items-center justify-center shadow-[4px_4px_0_#FFFFFF] border border-white shrink-0">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl md:text-3xl font-display font-extrabold uppercase text-white tracking-wide">Tag Team with Beacon.</h3>
                        </div>
                        
                        <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-6 font-medium relative z-10">
                            Beacon is your Brand Strategist & Signal Spotter. He sees what others miss, extracting your client's exact brand DNA to turn starting into momentum.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-auto relative z-10">
                          <span className="text-[10px] sm:text-xs font-bold text-white bg-white/10 px-2 py-1 rounded uppercase tracking-widest border border-white/20">Positioning</span>
                          <span className="text-[10px] sm:text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-1 rounded uppercase tracking-widest border border-[#7C3AED]/30">Signal</span>
                          <span className="text-[10px] sm:text-xs font-bold text-[#18F07A] bg-[#18F07A]/10 px-2 py-1 rounded uppercase tracking-widest border border-[#18F07A]/30">Traction</span>
                        </div>
                      </div>

                      {/* Full Mascot Side */}
                      <div className="w-full h-56 md:w-2/5 md:h-auto relative bg-gradient-to-t from-[#7C3AED]/10 to-transparent flex items-end justify-center md:justify-end mt-4 md:mt-0 pt-8 overflow-hidden">
                          <img 
                              src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Mask-group.png" 
                              alt="Beacon Full Mascot" 
                              className="absolute bottom-[-10%] md:bottom-0 h-[120%] md:h-[110%] w-auto object-contain transform md:translate-x-4 group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-500 drop-shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                              onError={(e) => e.target.style.display = 'none'}
                          />
                      </div>
                  </TiltCard>

                  {/* Features Grid (Right Side) */}
                  <div className="lg:col-span-5 grid grid-rows-2 gap-6">
                      <TiltCard className="bg-[#1C1C22] border-2 border-zinc-800 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <ScanLine className="w-8 h-8 text-[#7C3AED] mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">Signal Spotting</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Drop a client's link. We map their exact positioning and tone in seconds.</p>
                      </TiltCard>

                      <TiltCard className="bg-[#1C1C22] border-2 border-zinc-800 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <Activity className="w-8 h-8 text-[#2583EB] mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">Momentum Engine</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Generate full-stack omnichannel campaigns without the generic AI slop.</p>
                      </TiltCard>
                  </div>
              </div>

              {/* Secure Native Waitlist Form */}
              <TiltCard className="max-w-3xl mx-auto bg-gradient-to-br from-[#7C3AED] to-[#2583EB] border-4 border-white p-6 sm:p-8 md:p-12 text-center shadow-[8px_8px_0_#18F07A] relative">
                  
                  <h3 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-2 uppercase tracking-widest drop-shadow-md">Defend Your Title.</h3>
                  <p className="text-white/90 mb-8 font-medium text-base md:text-lg">
                      Join the waitlist to lock in early access and get <span className="text-[#18F07A] font-bold underline">free onboarding</span> when we launch. Limited to the first 500 agencies.
                  </p>
                  
                  <div className="max-w-xl mx-auto mt-4">
                      {isSuccess ? (
                          <div className="flex flex-col items-center justify-center p-6 bg-[#0A0A0F]/80 rounded-lg backdrop-blur-sm border border-[#18F07A]/30">
                              <div className="w-12 h-12 bg-[#18F07A]/20 text-[#18F07A] rounded-full flex items-center justify-center mb-4">
                                  <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <h4 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-wide">Spot Secured!</h4>
                              <p className="text-zinc-400 text-sm">You're officially on the roster. Watch your inbox.</p>
                          </div>
                      ) : (
                          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                              <input 
                                  type="email" 
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="name@youragency.com" 
                                  className="flex-1 bg-[#0A0A0F] border-2 border-[#1C1C22] px-5 py-4 text-white focus:outline-none focus:border-[#7C3AED] transition-all text-lg font-medium placeholder:text-zinc-600 transform skew-x-[-5deg]"
                                  disabled={isSubmitting}
                              />
                              <button 
                                  type="submit" 
                                  disabled={isSubmitting}
                                  className="bg-white text-black font-display font-bold text-xl uppercase tracking-widest px-8 py-4 hover:bg-[#18F07A] transition-colors active:scale-[0.98] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 shrink-0 transform skew-x-[-5deg] shadow-[4px_4px_0_#0A0A0F] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {isSubmitting ? 'CLAIMING...' : 'CLAIM SPOT'} <ArrowRight className="w-5 h-5" />
                              </button>
                          </form>
                      )}
                  </div>
              </TiltCard>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-4 text-center mt-auto">
          <p className="text-zinc-500 text-xs md:text-sm font-medium uppercase tracking-widest">Designed with intent. Built for brands that lead. © 2026 BrandToPost.</p>
      </footer>

    </div>
  );
}
