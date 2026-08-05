import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { UniversalNavbar } from "../components/UniversalNavbar";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Clock, 
  DollarSign, 
  Globe, 
  MessageSquare, 
  Repeat, 
  Heart, 
  BarChart3, 
  FileText 
} from "lucide-react";
import { FaLinkedin, FaXTwitter, FaInstagram } from "react-icons/fa6";

export function MasterAgencyFeaturePage() {
  return (
    <div className="min-h-screen bg-[#08080C] text-slate-100 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden pt-0">
      
      {/* Universal Shared Navbar */}
      <UniversalNavbar />

      {/* 1. HERO SECTION — AGENCY SCALING & PROFIT HOOK WITH FLOATING SOCIAL MEDIA ICONS */}
      <section data-nav-theme="dark" className="w-full relative overflow-hidden text-left pt-28 pb-16 px-6 md:px-16 lg:px-24 border-b border-white/10 bg-[#08080C]">
        
        {/* Ambient Dark Studio Laser Glows */}
        <div className="absolute top-1/4 right-1/4 w-[55rem] h-[55rem] bg-purple-900/25 rounded-full blur-[260px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-emerald-900/15 rounded-full blur-[200px] pointer-events-none" />

        {/* 2-COLUMN HERO MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 max-w-7xl mx-auto w-full mb-12">
          
          {/* LEFT COLUMN (7 COLS): HEADLINE & CTAS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-emerald-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-emerald-400 via-purple-400 to-indigo-500 rounded-full" />
              <span>THE AGENCY OS & CAPACITY MULTIPLIER</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light font-display text-white tracking-tight leading-[1.05]">
              Multiply Agency Margins By 10x. <br />
              <span className="font-normal italic text-purple-300">Scale To 50 Clients With Zero Hiring.</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
              Stop letting copywriter payroll, endless revision loops, and designer bottlenecks crush your agency margins. Deploy our multi-tenant AI specialist engine to deliver 100% voice-calibrated social GTM for every client on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                to="/login?mode=signup"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-purple-600 to-pink-600 hover:from-emerald-600 hover:to-pink-700 text-white font-sans font-bold text-xs transition-all shadow-xl shadow-purple-900/30 text-center block hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Agency Setup — Scale Capacity 10x
              </Link>

              <a 
                href="#agency-features"
                className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-sans font-semibold text-xs transition-all text-center block"
              >
                Explore 5 Agency Superpowers
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): LIVE AGENCY CONSOLE PREVIEW WITH FLOATING SOCIAL ICONS */}
          <div className="lg:col-span-5 relative">
            
            {/* FLOATING SOCIAL MEDIA BADGES IN BACKGROUND */}
            <div className="absolute -inset-10 pointer-events-none z-0 hidden sm:block">
              {/* Floating LinkedIn Badge */}
              <motion.div 
                animate={{ y: [-12, 12, -12], rotate: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-4 bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5] px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaLinkedin className="w-4 h-4 text-[#0077B5]" />
                <span className="text-white">LinkedIn GTM</span>
              </motion.div>

              {/* Floating X Badge */}
              <motion.div 
                animate={{ y: [14, -14, 14], rotate: [5, -5, 5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 -right-8 bg-white/10 border border-white/20 text-white px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaXTwitter className="w-4 h-4 text-white" />
                <span>X Dispatch</span>
              </motion.div>

              {/* Floating Instagram Badge */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [-6, 6, -6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-6 -left-6 bg-pink-500/20 border border-pink-500/40 text-pink-400 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaInstagram className="w-4 h-4 text-pink-400" />
                <span className="text-white">Insta 4K Carousel</span>
              </motion.div>

              {/* Floating Substack Badge */}
              <motion.div 
                animate={{ y: [8, -16, 8], rotate: [3, -3, 3] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/4 -left-8 bg-orange-500/20 border border-orange-500/40 text-orange-400 px-3 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="text-white">Substack Hub</span>
              </motion.div>
            </div>

            {/* MAIN LIGHT MODE AGENCY HUB CARD */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-4 text-left relative z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs font-display">
                    APEX
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-sans">Apex Media Agency Hub</div>
                    <div className="text-[10px] text-slate-500 font-sans">White-Label Partner License</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  32 CLIENTS ACTIVE
                </span>
              </div>

              {/* CLIENT STREAM METRICS */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-slate-500 font-mono">Monthly Agency MRR</div>
                  <div className="text-lg font-bold text-slate-900 font-display">$160,000</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
                  <div className="text-[10px] text-purple-700 font-mono">Software Overhead</div>
                  <div className="text-lg font-bold text-purple-700 font-display">$2,499 / mo</div>
                </div>
              </div>

              {/* LIVE CLIENT STATUS ROSTER */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Live Client Queue Dispatch</div>
                
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <img src="/MINIM-logo-primary.png" alt="MINIM" className="w-5 h-5 object-contain" />
                    <span className="font-semibold text-slate-900">MINIM Tech (SaaS)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">Deck Approved</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <img src="/aimlpartner_logo.png" alt="AIMLPartner" className="w-5 h-5 object-contain" />
                    <span className="font-semibold text-slate-900">AIMLPartner (AI)</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded">Auto-Dispatched</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <img src="/superherogym_logo.png" alt="Superhero Gym" className="w-5 h-5 object-contain" />
                    <span className="font-semibold text-slate-900">Superhero Gym (B2C)</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">Queue Ready</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                <span>Client Retention: 98.4%</span>
                <span className="text-emerald-600 font-bold">100% White-Label Export</span>
              </div>
            </motion.div>

          </div>

        </div>

        {/* 3 AGENCY METRICS BAR */}
        <div className="max-w-7xl mx-auto w-full relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left font-sans">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">10x Client Margin</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">From 15% margins to 92% net profit</div>
            </div>
            <div className="space-y-1 border-l-0 sm:border-l border-white/10 sm:pl-8">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-display tracking-tight">50+ Client Vaults</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">Isolated Brand DNA profiles per client</div>
            </div>
            <div className="space-y-1 border-l-0 sm:border-l border-white/10 sm:pl-8">
              <div className="text-xl sm:text-2xl font-bold text-purple-300 font-display tracking-tight">Zero Extra Hiring</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">Scale ARR without expanding payroll</div>
            </div>
          </div>
        </div>

      </section>

      {/* 2. SECTION 01 — 5 AGENCY SUPERPOWERS (SHOW VALUE & UTILITY FIRST) */}
      <section id="agency-features" data-nav-theme="light" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-emerald-400 rounded-full" />
              <span>AGENCY SUPERPOWERS & UTILITY</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              5 Agency Features Built To <br />
              <span className="font-normal italic text-[#7C3AED]">Lock In Client Retainers Forever.</span>
            </h2>
            
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              Turn your agency into an unstoppable content engine. Onboard clients in minutes, clone executive tone, and auto-dispatch native posts without hiring extra copywriters or designers.
            </p>
          </div>

          {/* 5 AGENCY UTILITY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Feature 01 */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-5 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 w-fit text-emerald-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">01. Multi-Tenant Client DNA Vaults</h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Store 50+ isolated client Brand DNA profiles. Separate tone preferences, vocabulary rules, forbidden buzzwords, and scraping targets per client.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>1-Click Client Switching</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Feature 02 */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-5 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-purple-500/50 transition-all">
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 w-fit text-purple-700">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">02. 120-Second Client Approval Decks</h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Send white-labeled WhatsApp or web approval links to client CEOs every Monday morning. Clients review 7 days of campaign posts and hit "Approve All" in under 2 minutes.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-purple-700 flex items-center justify-between">
                <span>Zero Client Slack Friction</span>
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              </div>
            </div>

            {/* Feature 03 */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-5 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-pink-500/50 transition-all">
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-pink-50 border border-pink-100 w-fit text-pink-600">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">03. Headless 4K Visual Engine</h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Auto-render 1080x1080 visual plates, PDF slide carousels, and infographic banners matching your client's exact brand color hexes and typography guidelines.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-pink-600 flex items-center justify-between">
                <span>No Graphic Designer Required</span>
                <CheckCircle2 className="w-4 h-4 text-pink-600" />
              </div>
            </div>

            {/* Feature 04 */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-5 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 w-fit text-blue-700">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">04. 4-Channel Native Autopilot</h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Automatically format and schedule posts for LinkedIn, X Threads, Instagram Carousels, and Substack Newsletters natively per client channel.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-blue-700 flex items-center justify-between">
                <span>LinkedIn • X • Insta • Substack</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {/* Feature 05 */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-5 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-emerald-500/50 transition-all md:col-span-2">
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 w-fit text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">05. 100% White-Label Agency Exports</h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed max-w-xl">
                  Export client reports, PDF decks, and approval portals branded completely with your agency's logo, custom domain, and company colors. Your clients see your agency as an elite high-tech powerhouse.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>Custom Agency Branding & PDF Exports</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SECTION 02 — VERIFIED AGENCY PROOF & CASE STUDIES */}
      <section id="agency-case-studies" data-nav-theme="dark" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>AGENCY PARTNER PROOF</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05] text-white">
              Real Agencies Scaling Revenue <br />
              <span className="font-normal italic text-purple-300">Without Adding Headcount.</span>
            </h2>
            
            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl">
              Growth metrics from agency owners who replaced copywriter payroll with our multi-tenant AI specialist suite.
            </p>
          </div>

          {/* 3 AGENCY CASE STUDY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="text-lg font-bold font-display text-white">Apex Growth Media</div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">$140k/mo MRR</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "We went from 6 clients to 34 active retainers in 60 days. BrandToPost allowed us to deliver 100% voice-matched posts for every client CEO without hiring a single copywriter."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">David Vance (Founder @ Apex)</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span>34 Clients Vaulted</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              </div>
            </div>

            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="text-lg font-bold font-display text-white">Nexus B2B Studio</div>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40">94% Net Margin</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "Our client approval friction dropped to zero. The 120-second Monday WhatsApp deck means client CEOs approve their weekly campaigns on their phones in 2 minutes."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Elena Rostova (Managing Director)</span>
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  <span>0 Client Churn</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                </span>
              </div>
            </div>

            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="text-lg font-bold font-display text-white">Vanguard Scale</div>
                  <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/40">$220k Saved / yr</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "We eliminated $220,000 in annual copywriter salaries. BrandToPost's Arthur voice clone generates far better thought leadership than our previous $5k/mo copywriters."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Marcus Sterling (CEO @ Vanguard)</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <span>Payroll Replaced</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECTION 03 — THE AGENCY PROFIT MATH (COMPARISON MATRIX PUSHED DOWN AFTER PROOF) */}
      <section id="agency-math" data-nav-theme="light" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-emerald-400 rounded-full" />
              <span>THE HARD AGENCY ECONOMICS</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Traditional Agency Setup vs <br />
              <span className="font-normal italic text-[#7C3AED]">BrandToPost Multi-Tenant OS.</span>
            </h2>
            
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              Now that you've seen our features and client proof, compare the hard math of hiring copywriters vs running a white-labeled AI doppelganger studio.
            </p>
          </div>

          {/* 3-COLUMN ECONOMIC COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Column 1: Traditional Agency */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div className="space-y-5">
                <span className="text-xs text-red-500 font-sans font-bold uppercase tracking-wider block">Traditional Agency Model</span>
                <div className="text-3xl font-bold font-display text-slate-900">$35,000 <span className="text-xs font-normal text-slate-500">/ mo overhead</span></div>
                <p className="text-xs text-slate-500 font-light">(3 Copywriters + 2 Designers + Account Managers + Slack Churn)</p>
                
                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-500">Max Client Capacity:</span> <span className="font-bold text-red-600">8 - 10 Clients</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Net Profit Margin:</span> <span className="font-bold text-red-600">12% - 18%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Client Revision Bottleneck:</span> <span className="font-bold text-red-600">Slow 4-Day Loops</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 block">Payroll Nightmare</span>
              </div>
            </div>

            {/* Column 2: Freelance Network */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div className="space-y-5">
                <span className="text-xs text-amber-600 font-sans font-bold uppercase tracking-wider block">Outsourced Freelancers</span>
                <div className="text-3xl font-bold font-display text-slate-900">$18,000 <span className="text-xs font-normal text-slate-500">/ mo spend</span></div>
                <p className="text-xs text-slate-500 font-light">(Upwork copywriters + Upwork visual artists + constant quality drift)</p>
                
                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-500">Max Client Capacity:</span> <span className="font-bold text-amber-600">12 - 15 Clients</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Net Profit Margin:</span> <span className="font-bold text-amber-600">30% - 40%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Voice Consistency:</span> <span className="font-bold text-amber-600">Uncalibrated Tone</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 block">High Management Friction</span>
              </div>
            </div>

            {/* Column 3: BrandToPost Agency Studio */}
            <div className="bg-white border-2 border-emerald-500 p-8 rounded-3xl space-y-6 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between transform md:-translate-y-2">
              <div className="space-y-5">
                <span className="text-xs text-emerald-600 font-sans font-bold uppercase tracking-wider block">BrandToPost Agency OS</span>
                <div className="text-3xl font-bold font-display text-emerald-600">₹4,999 – ₹9,999 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <p className="text-xs text-slate-600 font-light">(Unlimited client DNA vaults + automated white-label approval decks)</p>
                
                <div className="border-t border-emerald-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-600">Max Client Capacity:</span> <span className="font-bold text-emerald-600">50+ Clients</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Net Profit Margin:</span> <span className="font-bold text-emerald-600">92% Net Margin</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Client Approval Time:</span> <span className="font-bold text-[#7C3AED]">120-Sec Mobile Decks</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-emerald-100 text-center space-y-2">
                <Link 
                  to="/login?mode=signup"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md block text-center"
                >
                  Deploy Agency OS Studio
                </Link>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 inline-block">
                  Saves $300,000+ / Year Overhead
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. SECTION 04 — FINAL HIGH-CONVERSION AGENCY CTA STAGE */}
      <section data-nav-theme="dark" className="py-32 md:py-44 px-6 md:px-16 lg:px-24 w-full bg-[#08080C] text-white border-t border-white/10 relative z-10 overflow-hidden text-left">
        
        {/* ATTENTION-GRABBING 4K BACKDROP RENDER */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/brand_dna_temple_bg_1785868729158.png" 
            alt="Agency Studio Backdrop" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/85 to-[#08080C]/90" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LEFT COLUMN: HERO STATEMENT */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-emerald-400 uppercase mb-4">
              <span className="w-8 h-[2px] bg-gradient-to-r from-emerald-400 via-purple-400 to-indigo-500 rounded-full" />
              <span>THE 10X AGENCY ERA</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-light font-display tracking-tight leading-[1.05] text-white">
              Ready to Scale to 50+ Clients <br />
              <span className="font-normal italic text-purple-300">And Unlock 90%+ Net Agency Margins?</span>
            </h2>

            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl mt-4">
              Replace copywriter payroll and slow revision cycles. Claim your white-label agency license and deploy automated multi-tenant distribution today.
            </p>
          </div>

          {/* RIGHT COLUMN: HIGH-CONVERSION AGENCY CONSOLE CARD */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#12111D]/90 to-[#0A0A12]/95 border border-emerald-500/40 p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl shadow-emerald-950/60 backdrop-blur-xl relative overflow-hidden text-left">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">Instant Agency Activation</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Launch Your Agency OS</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Onboard your first 3 client brand vaults, sync voice DNA profiles, and generate 30-day multi-channel campaign queues in under 3 minutes.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link 
                to="/login?mode=signup"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-purple-600 to-pink-600 hover:from-emerald-600 hover:to-pink-700 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/30 text-center block hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Agency Setup — Onboard 3 Clients Now
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10 text-center space-y-1">
              <span className="text-[11px] text-emerald-400 font-sans font-semibold flex items-center justify-center gap-1">
                <span>100% White-Label Export Guarantee</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <span className="text-[10px] text-slate-500 font-sans block">
                No Credit Card Required • Scale Unlimited Clients
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="w-full bg-[#FAF8F5] pt-16 relative z-10 border-t border-slate-200/60 flex flex-col justify-between mb-0 pb-0 text-slate-900">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/50 text-left">
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Platform</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <Link to="/agency" className="hover:text-slate-900 transition-colors">Master Agency OS</Link>
              <Link to="/founder" className="hover:text-slate-900 transition-colors">Master Founder Studio</Link>
              <Link to="/login?mode=signup" className="hover:text-slate-900 transition-colors">Growth Autopilot</Link>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">AI Specialists</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <span>Arthur (Voice Clone)</span>
              <span>Sarah (Research)</span>
              <span>Alex (Copywriting)</span>
              <span>Chloe (Visuals)</span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Resources</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <Link to="/blog" className="hover:text-slate-900 transition-colors">Agency Growth Playbook</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">BrandToPost Agency Studio</span>
            <p className="text-xs text-slate-500 font-sans font-light leading-relaxed">
              Power your marketing agency with automated multi-tenant voice cloning, 4K visual carousels, and 120-second client mobile approval decks.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 font-sans">
          <span>© {new Date().getFullYear()} BrandToPost. All rights reserved.</span>
          <span className="text-slate-500">Built for High-Growth Agencies & Founder Doppelgangers</span>
        </div>
      </footer>

    </div>
  );
}
