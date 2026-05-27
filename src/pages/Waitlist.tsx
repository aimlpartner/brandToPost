import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Twitter, Instagram, ArrowRight, Check } from 'lucide-react';

// --- Google Sheets Sync Gateway ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmMybk6WP283pvxNDwv1Bgfb_au5VQxoRrQwZZbh6Kf_rsPZBiQx2rVMSSV650lXPHiw/exec";

export default function App() {
  // Silent tracking state
  const [userId] = useState(() => {
    let id = localStorage.getItem('b2p_visitor_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('b2p_visitor_id', id);
    }
    return id;
  });

  const [deviceType, setDeviceType] = useState('DESKTOP');
  const [locationData, setLocationData] = useState(() => {
    const saved = localStorage.getItem('b2p_location');
    return saved ? JSON.parse(saved) : null;
  });

  // Waitlist Form State
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState('capture'); // 'capture' | 'completed'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState('');

  // Detect Device Type
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setDeviceType(isMobile ? 'MOBILE' : 'DESKTOP');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Update Live Clock (Mimicking bottom left of reference screenshot)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' };
      const dateStr = now.toLocaleDateString('en-US', options).toUpperCase();
      const timeStr = now.toTimeString().split(' ')[0];
      setCurrentTime(`${dateStr}, ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Silent Tracking Dispatcher
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

  // Silent Location Fetch (ipapi + ipwho.is backup)
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
          console.log('Location tracking resolved silently.');
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

  // Form Submit Handler
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);

    trackEvent('waitlist_email_captured', email);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth cinematic delay
      setFormState('completed');
    } catch (err) {
      setFormState('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050508] text-zinc-300 font-sans selection:bg-[#7C3AED] selection:text-white relative overflow-hidden select-none">

      {/* Cinematic Styling Overrides & Google Fonts Integration */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Outfit:wght@100;200;300;400;500&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Outfit', sans-serif; }

        /* Premium cinematic dark vignette overlay */
        .vignette-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle, transparent 20%, rgba(5, 5, 8, 0.75) 70%, rgba(5, 5, 8, 0.98) 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* Subtle cinematic ambient noise */
        .ambient-grain {
          position: fixed;
          inset: 0;
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          opacity: 0.02;
          z-index: 1;
          pointer-events: none;
        }

        /* Input interaction glow */
        .brutalist-input:focus {
          border-color: #ffffff !important;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
        }

        /* High-tension cinematic background video layout */
        .brand-mascot-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 90%;
          max-width: 800px;
          height: 100%;
          object-fit: cover;
          object-position: right top;
          opacity: 0.35;
          z-index: 0;
          pointer-events: none;
          filter: grayscale(0.15) contrast(1.2) brightness(0.38) sepia(0.05);
          mix-blend-mode: screen;
        }

        @media (max-width: 768px) {
          .brand-mascot-bg {
            width: 100%;
            opacity: 0.25;
            object-position: 70% center;
          }
        }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Atmospheric Overlays */}
      <div className="vignette-overlay"></div>
      <div className="ambient-grain"></div>

      {/* Subdued Brand Color Atmosphere Nodes */}
      <div className="absolute top-[-10%] left-1/4 w-[700px] h-[500px] bg-[#7C3AED]/8 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[#18F07A]/3 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* --- CINEMATIC MASCOT BACKSTAGE VIDEO --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="brand-mascot-bg"
        poster="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Mask-group.png"
        src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/05/VID-20260420-WA0001.mp4"
      />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-12">

        {/* Navigation / Header */}
        <header className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center text-white font-display font-medium text-xs tracking-[0.3em] uppercase italic gap-2.5">
            <img
              src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png"
              alt="BrandToPost Logo"
              className="w-5 h-5 object-contain"
            />
            <span>BRANDTOPOST <span className="text-zinc-600">//</span> DISPATCH</span>
          </div>
          <div className="text-[9px] font-sans font-medium px-3 py-1 border border-zinc-800 bg-black/40 text-zinc-500 rounded flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-1 rounded-full bg-[#18F07A] animate-pulse"></span>
            PILOT NODE
          </div>
        </header>

        {/* Center Content: Exact composition of reference screen */}
        <main className="w-full max-w-7xl mx-auto flex flex-col justify-end items-start h-full pb-16 pt-24">
          <div className="w-full max-w-lg flex flex-col gap-8">

            {formState === 'capture' ? (
              <div className="fade-in flex flex-col gap-6">

                {/* Clean Outfit & Inter Typography Headline with updated simple announcement */}
                <div className="flex flex-col gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-white tracking-[-0.02em] leading-[1.15] uppercase">
                    THE AGE OF BUSINESS CONTEXT<br />
                    IS COMING.
                  </h1>
                </div>

                {/* Clean Brutalist Input & Submit Panels using Inter (font-sans) */}
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3 w-full font-sans">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EMAIL ADDRESS"
                    className="brutalist-input w-full bg-black/60 backdrop-blur-md border border-zinc-800 px-5 py-4 text-white placeholder-zinc-700 focus:outline-none transition-all duration-150 uppercase text-xs tracking-wider font-light"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-transparent hover:bg-white hover:text-black text-white font-medium text-xs tracking-[0.25em] py-4 transition-all uppercase flex items-center justify-center gap-2 active:scale-[0.99] border border-zinc-800 hover:border-white"
                  >
                    {isSubmitting ? 'SECURING...' : 'JOIN WAITLIST'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Micro Scarcity Status Indicator using Inter (font-sans) */}
                <div className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-sans font-medium flex items-center gap-2">
                  <span>INITIAL NODES: 50 BRANDS</span>
                  <span className="text-zinc-800">//</span>
                  <span className="text-[#18F07A] animate-pulse">14 SPOTS LEFT</span>
                </div>

              </div>
            ) : (
              <div className="fade-in flex flex-col gap-4 text-left">
                <div className="w-10 h-10 border border-[#18F07A]/40 bg-[#18F07A]/5 flex items-center justify-center text-[#18F07A] mb-2">
                  <Check className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-display font-medium text-white uppercase tracking-[-0.02em]">
                  DISPATCH SECURED.
                </h2>
                <p className="text-zinc-500 text-xs leading-relaxed font-sans font-light">
                  Your position has been recorded. Your unique pilot access ticket will be dispatched immediately to <span className="text-white underline">{email}</span>.
                </p>
              </div>
            )}

          </div>
        </main>

        {/* Footer: Live terminal system clock (Left) & Social Channels (Right) */}
        <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-900/60 font-sans font-medium">
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse"></span>
            <span>{currentTime || 'MAY 24 2026, 14:43:00'}</span>
          </div>

          <div className="flex gap-6">
            <a href="mailto:team@brandtopost.com" className="text-zinc-600 hover:text-white transition-colors"><Mail className="w-4 h-4" /></a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
          </div>
        </footer>

      </div>

    </div>
  );
}