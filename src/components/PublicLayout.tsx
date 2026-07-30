import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, MessageSquare, Loader2, Zap, CheckCircle2, Crown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function PublicLayout({ children, transparentNavbar = false }: { children: React.ReactNode; transparentNavbar?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkNavbar, setIsDarkNavbar] = useState(!transparentNavbar ? false : true);
  const [whatsappUrl, setWhatsappUrl] = useState("/whatsapp/login");
  const [isDefaultWhatsAppUrl, setIsDefaultWhatsAppUrl] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [botPhoneNumberInput, setBotPhoneNumberInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      const navCheckY = 60;
      const sections = document.querySelectorAll('[data-nav-theme]');
      let foundTheme = transparentNavbar ? 'dark' : 'light';

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= navCheckY && rect.bottom >= navCheckY) {
          foundTheme = sec.getAttribute('data-nav-theme') || foundTheme;
        }
      });

      setIsDarkNavbar(foundTheme === 'dark');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    fetch('/api/whatsapp/public-link')
      .then(res => res.json())
      .then(data => {
        if (data.url) setWhatsappUrl(data.url);
        setIsDefaultWhatsAppUrl(!!data.isDefault);
      })
      .catch(err => console.error("Failed to load WhatsApp link", err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparentNavbar]);

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
        throw new Error(data.error || "Failed to link number.");
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
      setLinkError(err.message || "An error occurred.");
    } finally {
      setIsLinking(false);
    }
  };

  const navbarBgClass = isScrolled
    ? (isDarkNavbar 
        ? 'bg-transparent border-b border-white/10 py-3.5 backdrop-blur-md text-white'
        : 'bg-transparent border-b border-slate-900/10 py-3.5 backdrop-blur-md text-slate-900')
    : transparentNavbar
      ? 'bg-transparent py-5 border-b border-transparent text-white'
      : 'bg-[#FAF9F6] py-5 border-b border-transparent text-slate-800';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans selection:bg-[#7C3AED]/30 selection:text-[#7C3AED] overflow-x-hidden relative flex flex-col justify-between">
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBgClass}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <img src="/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className={`text-xl tracking-tight font-display font-bold transition-colors duration-300 ${isDarkNavbar ? 'text-white' : 'text-slate-900'}`}>BrandToPost</span>
            </Link>
            
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Clean Corporate Founder Mode Link */}
              <Link 
                to="/master-founder" 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shrink-0 ${
                  isDarkNavbar 
                    ? 'bg-white/5 border border-white/20 text-slate-200 hover:bg-white/10'
                    : 'bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isDarkNavbar ? 'text-slate-300' : 'text-slate-700'}`} />
                <span>Founder Mode</span>
              </Link>
              <Link to="/blog" className={`text-sm font-semibold transition-colors duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Blog</Link>
              <Link to="/login" className={`text-sm font-semibold transition-colors hidden md:block duration-300 ${isDarkNavbar ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Sign In</Link>
              <ThemeToggle variant="icon" />
              <Link to="/login?mode=signup" className="px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm whitespace-nowrap">
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content (padded top to ensure content doesn't get blocked by fixed navbar) */}
      <div className="w-full pt-[73px] flex-grow">{children}</div>

      {/* FOOTER */}
      <footer className="bg-[#FAF9F6] border-t border-slate-900/10 pt-20 pb-0 relative overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 text-left">
          
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/B2PLOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold font-display tracking-tight text-slate-900">BrandToPost</span>
            </div>
            <p className="text-xs font-light text-slate-500 leading-relaxed max-w-sm">
              The autonomous B2B marketing department for founders. We scrape your site, align with your personal heuristics, format campaign assets, and auto-publish content daily.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2 text-xs font-light text-slate-600">
              <li><Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link></li>
              <li><Link to="/login?mode=signup" className="hover:text-slate-900 transition-colors">Start Free Trial</Link></li>
              <li><Link to="/blog" className="hover:text-slate-900 transition-colors">Insights Blog</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outreach</h4>
            <ul className="space-y-2 text-xs font-light text-slate-600">
              <li>
                <a 
                  href={isDefaultWhatsAppUrl ? "#" : whatsappUrl}
                  onClick={(e) => {
                    if (isDefaultWhatsAppUrl) {
                      e.preventDefault();
                      setShowSetupModal(true);
                    }
                  }}
                  {...(!isDefaultWhatsAppUrl && whatsappUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="hover:text-slate-900 transition-colors"
                >
                  WhatsApp Bot
                </a>
              </li>
              <li><Link to="/dna-demo" className="hover:text-slate-900 transition-colors">Interactive Demo</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Join Insights List</h4>
            <p className="text-xs font-light text-slate-500 leading-relaxed">
              Real-world distribution breakdowns. Straight from our copywriting doppelganger Sarah. No fluff, once a week.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Verification link sent!"); }} className="flex gap-2 max-w-sm">
              <input
                type="email"
                required
                placeholder="founder@yourdomain.com"
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED] flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer border-none"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-sans pt-8 border-t border-slate-900/10">
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

        {/* Wordmark logo */}
        <div className="w-full overflow-hidden mt-12 sm:mt-16 select-none pointer-events-none mb-0 pb-0 leading-none block">
          <svg viewBox="0 0 1600 200" className="w-full h-auto block mb-0 pb-0">
            <style>{`
              @keyframes firecracker-flow {
                0% { stroke-dashoffset: 2000; }
                100% { stroke-dashoffset: 0; }
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
            <image
              href="/B2PLOGO.png"
              x="170"
              y="30"
              width="140"
              height="140"
              style={{ opacity: 0.95 }}
            />
            <text
              x="330"
              y="60%"
              dominantBaseline="middle"
              className="font-display font-extrabold uppercase tracking-tighter"
              style={{ fontSize: '145px', fill: 'url(#footerTextGradient)', letterSpacing: '-0.04em' }}
            >
              brandtopost
            </text>
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
          <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-hidden text-slate-805">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-slate-500 transition-colors cursor-pointer w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center mt-2 relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                <MessageSquare className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">🔗 Link Your Onboarding Bot</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed font-light font-sans">
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
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">WhatsApp Phone Number</label>
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
