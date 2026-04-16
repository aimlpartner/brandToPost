// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Swords, Skull, Mic, Trophy, ScanLine, Terminal, Code, Check } from 'lucide-react';

// --- Custom Hooks ---

// 3D Tilt Effect
const use3DTilt = (options = { max: 8, scale: 1.02, speed: 400 }) => {
  const ref = useRef(null);

  useEffect(() => {
    // Disable on mobile for better touch experience
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

// --- Game Data ---

const gameRounds = [
  {
      promo: '"IN TODAY\'S FAST-PACED DIGITAL LANDSCAPE, WE MUST LEVERAGE OUR SYNERGY TO UNLOCK B2B GROWTH."',
      optCorporate: "Agreed, let's align our KPIs on this.",
      optIntrusive: '"I WILL LITERALLY SH*T ON YOUR DESK."',
      optWrestling: "BODY SLAM THE JARGON!"
  },
  {
      promo: '"HEY TEAM, LOVE THIS DRAFT! CAN WE JUST MAKE IT POP A LITTLE MORE AND GO VIRAL?"',
      optCorporate: "Sure thing! I'll add more emojis and resend.",
      optIntrusive: '"WHAT THE F*** DOES \'POP\' EVEN MEAN, KAREN?!"',
      optWrestling: "HIT 'EM WITH THE STEEL CHAIR!"
  },
  {
      promo: '"WE ARE THRILLED TO ANNOUNCE A TAPESTRY OF LOW-HANGING FRUIT TO DISRUPT THE ECOSYSTEM."',
      optCorporate: "Exciting update! Looking forward to the rollout.",
      optIntrusive: '"I AM GOING TO THROW MYSELF OUT THE F***ING WINDOW."',
      optWrestling: "SUPLEX THE SYNERGY!"
  },
  {
      promo: '"LET\'S CIRCLE BACK AND TAKE THIS OFFLINE SO WE CAN DRILL DOWN ON BANDWIDTH ISSUES."',
      optCorporate: "Sounds good, sending a calendar invite now.",
      optIntrusive: '"IF YOU SAY \'CIRCLE BACK\' AGAIN I WILL CHOKE YOU."',
      optWrestling: "OFF THE TOP ROPE!!!"
  },
  {
      promo: '"I NEED A 14-PART TWITTER THREAD ABOUT B2B SAAS ARCHITECTURE, BUT MAKE IT SOUND LIKE WENDY\'S."',
      optCorporate: "I'll brainstorm some edgy concepts by EOD.",
      optIntrusive: '"EAT MY ENTIRE *SS, YOU ABSOLUTE PSYCHO."',
      optWrestling: "FINISHING MOVE: THE VIBE CHECK!"
  }
];

const particleEffects = {
  corporate: {
      texts: ["BOOOOO!", "WEAK!", "CROWD IS ASLEEP", "-1 DMG", "BORING!"],
      colors: ['#a1a1aa', '#71717a', '#52525b'] // Grays
  },
  intrusive: {
      texts: ["*BEEP!*", "HR IS CALLING!", "EMOTIONAL DAMAGE!", "CENSORED!", "RUTHLESS!"],
      colors: ['#ef4444', '#dc2626', '#b91c1c'] // Reds
  },
  wrestling: {
      texts: ["BAH GAWD!", "HE IS BROKEN IN HALF!", "WATCH OUT WATCH OUT!", "A SLOBBERKNOCKER!", "DEVASTATING!"],
      colors: ['#eab308', '#ffffff', '#ef4444'] // Yellows, white, red
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

// --- Main App Component ---

export default function Waitlist() {
  const [appState, setAppState] = useState('game'); // 'game' | 'reveal'
  const [currentRound, setCurrentRound] = useState(0);
  const [particles, setParticles] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const maxRounds = gameRounds.length;
  const currentData = gameRounds[currentRound] || gameRounds[maxRounds - 1];

  // Particle Generator
  const spawnParticles = useCallback((clientX, clientY, type, count = 1) => {
    const effectData = particleEffects[type] || particleEffects.wrestling;
    const newParticles = [];

    // Fallback to center screen if touch coordinates are missing
    const spawnX = clientX || window.innerWidth / 2;
    const spawnY = clientY || window.innerHeight / 2;
    const screenWidth = window.innerWidth;

    for (let i = 0; i < count; i++) {
      const randomText = effectData.texts[Math.floor(Math.random() * effectData.texts.length)];
      const randomColor = effectData.colors[Math.floor(Math.random() * effectData.colors.length)];
      
      const offsetX = (Math.random() - 0.5) * 150;
      let finalX = spawnX + offsetX;
      finalX = Math.max(20, Math.min(finalX, screenWidth - 250)); // Constrain to screen width

      newParticles.push({
        id: Date.now() + Math.random(),
        text: randomText,
        color: randomColor,
        x: finalX,
        y: Math.max(20, spawnY - 60)
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup particles
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  const handleChoice = (type, e) => {
    if (currentRound >= maxRounds || isFadingOut) return;

    // 1. Visual Feedback
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    setIsShaking(false);
    setTimeout(() => setIsShaking(true), 10);

    // 2. Spawn Particles
    const particleCount = type === 'corporate' ? 2 : 3; // More impact for aggressive choices
    spawnParticles(e.clientX, e.clientY, type, particleCount);

    // 3. Game Logic
    if (currentRound + 1 < maxRounds) {
      setCurrentRound(prev => prev + 1);
    } else {
      // End Game Sequence
      setCurrentRound(prev => prev + 1); // Max out health bar
      spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 'wrestling', 3);
      
      setIsFadingOut(true);
      setTimeout(() => {
        setAppState('reveal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#18181b] text-white font-sans selection:bg-yellow-500 selection:text-black overflow-x-hidden relative">
      
      {/* Global Styles for Animations & FluentForms */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&display=swap');
        
        .font-display { font-family: 'Teko', sans-serif; }
        
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(-5deg); }
          100% { opacity: 0; transform: translateY(-100px) scale(2) rotate(5deg); }
        }
        .particle-anim {
          animation: floatUp 1s ease-out forwards;
          font-family: 'Teko', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          text-shadow: 2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000;
          z-index: 100;
          font-size: 2rem;
          line-height: 1;
        }
        @media (min-width: 640px) {
          .particle-anim { font-size: 2.5rem; }
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
          40%, 60% { transform: translate3d(8px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        /* Fluent Forms specific overrides for dark theme */
        .fluentform-wrapper .fluentform { font-family: 'Inter', sans-serif !important; margin: 0 auto !important; }
        .fluentform-wrapper .ff-el-input--label { display: none !important; }
        .fluentform-wrapper form.ff-form { display: flex !important; flex-direction: column !important; gap: 12px !important; margin-bottom: 0 !important; }
        @media (min-width: 640px) { .fluentform-wrapper form.ff-form { flex-direction: row !important; align-items: stretch !important; } }
        
        .fluentform-wrapper input[type="text"], .fluentform-wrapper input[type="email"] {
          background-color: #ffffff !important; border: 2px solid #000000 !important; color: #000000 !important;
          padding: 16px 20px !important; border-radius: 0px !important; font-family: 'Inter', sans-serif !important;
          font-weight: 700 !important; font-size: 1.125rem !important; transform: skewX(-5deg) !important;
          box-shadow: none !important; width: 100% !important; transition: all 0.3s ease !important; flex-grow: 1 !important;
        }
        .fluentform-wrapper input[type="text"]:focus, .fluentform-wrapper input[type="email"]:focus {
          outline: none !important; border-color: #eab308 !important; box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.4) !important;
        }
        .fluentform-wrapper input[type="text"]::placeholder, .fluentform-wrapper input[type="email"]::placeholder {
          color: #a1a1aa !important; font-weight: 600 !important;
        }

        .fluentform-wrapper .ff-btn-submit {
          background-color: #000000 !important; color: #eab308 !important; border: 2px solid #000000 !important;
          font-family: 'Teko', sans-serif !important; font-weight: 700 !important; font-size: 1.5rem !important;
          text-transform: uppercase !important; letter-spacing: 0.05em !important; padding: 12px 32px !important;
          border-radius: 0px !important; transform: skewX(-5deg) !important; box-shadow: 4px 4px 0 rgba(255,255,255,1) !important;
          transition: all 0.2s ease !important; cursor: pointer !important; white-space: nowrap !important;
        }
        .fluentform-wrapper .ff-btn-submit:hover { background-color: #18181b !important; color: #eab308 !important; }
        .fluentform-wrapper .ff-btn-submit:active { transform: skewX(-5deg) scale(0.96) translateY(4px) !important; box-shadow: 0px 0px 0 rgba(255,255,255,1) !important; }
        .fluentform-wrapper .text-danger { color: #fca5a5 !important; font-size: 0.875rem !important; font-weight: 600 !important; margin-top: 4px !important; }
      `}</style>

      {/* Screen Flash Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-[9999] transition-colors duration-300"
        style={{ backgroundColor: isFlashing ? 'rgba(239, 68, 68, 0.4)' : 'transparent' }}
      ></div>

      {/* Render Particles */}
      {particles.map(p => (
        <div key={p.id} className="fixed particle-anim pointer-events-none" style={{ left: p.x, top: p.y, color: p.color }}>
          {p.text}
        </div>
      ))}

      {/* Arena Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-br from-blue-500/30 to-transparent transform rotate-12 blur-[80px]"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[80%] md:w-[50%] h-[100%] bg-gradient-to-bl from-red-500/30 to-transparent transform -rotate-12 blur-[80px]"></div>
      </div>
      <div className="fixed inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 100px, #fff 100px, #fff 102px)' }}></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-display font-bold text-2xl md:text-3xl tracking-wide uppercase italic">
            <Swords className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            <span>VibeOS <span className="text-red-500">Fed.</span></span>
        </div>
        <div className={`text-sm md:text-lg font-display font-bold px-3 py-1 md:px-4 rounded border-2 flex items-center gap-2 transition-colors uppercase tracking-widest ${appState === 'reveal' ? 'bg-white/10 text-white border-white' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'}`}>
            {appState === 'reveal' ? <Trophy className="w-4 h-4 md:w-5 md:h-5" /> : <Skull className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="hidden sm:inline">{appState === 'reveal' ? 'CHAMPION CROWNED' : 'Match in Progress'}</span>
            <span className="sm:hidden">{appState === 'reveal' ? 'WINNER' : `Round ${Math.min(currentRound + 1, maxRounds)}`}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 min-h-[80vh]">
        
        {/* === PHASE 1: THE GAME === */}
        {appState === 'game' && (
          <div className={`w-full flex flex-col items-center justify-center py-8 my-auto transition-opacity duration-700 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100'}`}>
              
              <div className="text-center mb-6 md:mb-8 max-w-2xl">
                  <div className="inline-block bg-red-500 text-white font-display font-bold text-xl md:text-2xl uppercase tracking-widest px-4 md:px-6 py-1 transform -rotate-2 mb-4 border-2 border-white">
                      Main Event
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-wide mb-2 text-white uppercase italic drop-shadow-[2px_2px_0_rgba(239,68,68,1)] md:drop-shadow-[4px_4px_0_rgba(239,68,68,1)] leading-none">
                      You vs. Corporate Cringe
                  </h1>
                  <p className="text-zinc-400 text-base md:text-xl font-medium mt-4">
                      Your client's copy is in the ring. Choose your attack to finish it.
                  </p>
              </div>

              {/* Health Bar */}
              <div className="w-full max-w-3xl mb-4 relative">
                  <div className="flex justify-between text-base md:text-xl font-display font-bold text-white mb-1 uppercase tracking-wider">
                      <span className="text-yellow-500 truncate mr-2">Opponent: AI Sludge</span>
                      <span className="text-red-500 shrink-0">{100 - ((currentRound / maxRounds) * 100)}% HP</span>
                  </div>
                  <div className="w-full h-4 md:h-6 bg-zinc-900 border-2 border-zinc-700 p-1 transform skew-x-[10deg] scale-x-[-1]"> {/* Flipped skew for a cooler look */}
                      <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300 transform scale-x-[-1]" style={{ width: `${100 - ((currentRound / maxRounds) * 100)}%` }}></div>
                  </div>
              </div>

              {/* The Target Card */}
              <TiltCard className={`w-full max-w-3xl bg-zinc-800 border-2 md:border-4 border-zinc-700 p-6 sm:p-8 md:p-12 shadow-2xl relative mb-6 md:mb-10 overflow-hidden group ${isShaking ? 'animate-shake' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
                  
                  <div className="absolute top-0 left-0 bg-zinc-700 text-zinc-300 text-[10px] md:text-sm font-bold uppercase tracking-widest px-3 py-1 md:px-4 flex items-center">
                      <Mic className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Opponent's Promo
                  </div>

                  <div className="mt-6 md:mt-8 min-h-[120px] md:min-h-[160px] flex items-center justify-center relative z-10">
                      <p key={currentRound} className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-center leading-none text-white uppercase tracking-wide animate-in fade-in zoom-in duration-300">
                          {currentRound >= maxRounds ? 'K.O.!!!' : currentData.promo}
                      </p>
                  </div>
              </TiltCard>

              {/* The Action Buttons */}
              {currentRound < maxRounds && (
                <div className="w-full max-w-3xl flex flex-col gap-3 md:gap-4 mt-2">
                    {/* Option 1: Corporate */}
                    <button onClick={(e) => handleChoice('corporate', e)} className="relative w-full text-left bg-zinc-800 border-2 border-zinc-600 text-zinc-300 font-sans font-semibold text-sm sm:text-base md:text-xl px-4 py-3 sm:px-6 sm:py-4 transform skew-x-[-2deg] md:skew-x-[-5deg] hover:bg-zinc-700 hover:text-white transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-1 sm:gap-4 active:scale-[0.98]">
                        <span>{currentData.optCorporate}</span>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 shrink-0 sm:ml-4 text-zinc-400">[Corporate Response]</span>
                    </button>

                    {/* Option 2: Intrusive */}
                    <button onClick={(e) => handleChoice('intrusive', e)} className="relative w-full text-left bg-black border-2 border-red-500 text-red-500 font-display font-bold text-xl sm:text-2xl md:text-3xl tracking-wide px-4 py-3 sm:px-6 sm:py-4 transform skew-x-[-2deg] md:skew-x-[-5deg] hover:bg-red-500 hover:text-white transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-1 sm:gap-4 shadow-[3px_3px_0_rgba(239,68,68,0.5)] md:shadow-[4px_4px_0_rgba(239,68,68,0.5)] hover:shadow-[4px_4px_0_rgba(239,68,68,1)] active:scale-[0.98]">
                        <span>{currentData.optIntrusive}</span>
                        <span className="text-[10px] md:text-xs font-sans uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 shrink-0 sm:ml-4">[Intrusive Thought]</span>
                    </button>

                    {/* Option 3: Wrestling */}
                    <button onClick={(e) => handleChoice('wrestling', e)} className="relative w-full text-left bg-yellow-500 border-2 md:border-4 border-white text-black font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-widest px-4 py-3 sm:px-6 sm:py-4 transform skew-x-[-2deg] md:skew-x-[-5deg] hover:bg-yellow-400 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-1 sm:gap-4 shadow-[4px_4px_0_rgba(255,255,255,1)] md:shadow-[6px_6px_0_rgba(255,255,255,1)] active:scale-[0.98]">
                        <span className="drop-shadow-sm md:drop-shadow-md">{currentData.optWrestling}</span>
                        <span className="text-[10px] md:text-xs font-sans uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 shrink-0 sm:ml-4">[Wrestling Move]</span>
                    </button>
                </div>
              )}
          </div>
        )}

        {/* === PHASE 2: THE REVEAL === */}
        {appState === 'reveal' && (
          <div className="w-full max-w-6xl py-10 md:py-16 my-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="text-center mb-12 md:mb-16">
                  <div className="inline-block bg-yellow-500 text-black font-display font-bold text-2xl md:text-4xl uppercase tracking-widest px-6 md:px-8 py-2 transform -rotate-3 mb-6 border-2 md:border-4 border-white shadow-[4px_4px_0_rgba(239,68,68,1)] md:shadow-[8px_8px_0_rgba(239,68,68,1)] animate-pulse">
                      K.O.! YOU ARE THE CHAMPION!
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold tracking-wide text-white uppercase max-w-4xl mx-auto italic leading-tight md:leading-none">
                      You just destroyed 5 hours of bad copywriting in 5 seconds.<br/>
                      <span className="text-zinc-400 text-2xl sm:text-3xl">Now let VibeOS do it for real.</span>
                  </h2>
              </div>

              {/* Bento Box Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12">
                  
                  {/* Main Value Prop */}
                  <TiltCard className="lg:col-span-7 bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-center shadow-xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <Trophy className="w-10 h-10 md:w-12 md:h-12 text-yellow-500 mb-6" />
                      <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 uppercase tracking-wide">Stop forcing AI to wrestle with your tone.</h3>
                      <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-6 font-medium">
                          You're drowning in tabs, fighting ChatGPT to stop saying "delve," and managing clients who think "make it pop" is actual feedback. It's a losing battle.
                      </p>
                      <div className="bg-zinc-800 p-4 rounded-lg border-l-4 border-red-500">
                          <p className="text-white font-bold text-base md:text-lg">
                              VibeOS instantly extracts a brand's exact tone from their URL and generates campaigns that hit harder than a steel chair. No generic AI slop allowed.
                          </p>
                      </div>
                  </TiltCard>

                  {/* Features Grid (Right Side) */}
                  <div className="lg:col-span-5 grid grid-rows-2 gap-6">
                      <TiltCard className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <ScanLine className="w-8 h-8 text-yellow-500 mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">Brand DNA Extractor</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Drop a client's link. We scrape their vibe, humor level, and banned buzzwords in 4 seconds.</p>
                      </TiltCard>

                      <TiltCard className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-center h-full">
                          <Swords className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                          <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest">The 1-Tab Arena</h4>
                          <p className="text-zinc-400 font-medium text-sm md:text-base">Review, tweak, and schedule natively to LinkedIn, Twitter, and Reddit from a single dashboard.</p>
                      </TiltCard>
                  </div>
              </div>

              {/* The Fluent Forms Trap */}
              <TiltCard className="max-w-3xl mx-auto bg-gradient-to-br from-red-500 to-red-900 border-2 md:border-4 border-white p-6 sm:p-8 md:p-12 text-center shadow-[6px_6px_0_rgba(0,0,0,1)] md:shadow-[12px_12px_0_rgba(0,0,0,1)] relative">
                  
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 uppercase tracking-wide drop-shadow-md">Defend Your Title.</h3>
                  <p className="text-red-100 mb-8 font-bold text-base md:text-lg">
                      Join the waitlist to lock in early access and get <span className="text-yellow-500 underline">free onboarding</span> when we launch. Limited to the first 500 agencies.
                  </p>
                  
                  {/* Fluent Forms Container */}
                  <div className="fluentform-wrapper max-w-xl mx-auto mt-4">
                      
                      {/* NOTE TO DEVELOPER: In a real WordPress/React environment, 
                          you would render your Shortcode component here. 
                          For the preview, we show the mock container. */}
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/30 bg-black/20 rounded-lg">
                          <Terminal className="w-8 h-8 text-yellow-500 mb-3" />
                          <p className="text-white font-mono font-bold mb-1">Paste your Shortcode Here</p>
                          <code className="text-yellow-500 bg-black px-3 py-1 rounded text-lg">[fluentform id="2"]</code>
                          <p className="text-red-200 text-xs mt-3 opacity-80 text-center">Our injected CSS will automatically hijack Fluent Forms to match this brutalist theme.</p>
                      </div>
                      
                  </div>
              </TiltCard>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-6 px-4 text-center text-zinc-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-auto bg-black">
          <p>© 2024 VibeOS Federation. No actual keyboards were harmed.</p>
      </footer>

    </div>
  );
}