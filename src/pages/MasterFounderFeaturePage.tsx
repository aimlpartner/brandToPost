import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { UniversalNavbar } from "../components/UniversalNavbar";
import { Globe, MessageSquare, Repeat, Heart, BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import { FaLinkedin, FaXTwitter, FaInstagram } from "react-icons/fa6";

export function MasterFounderFeaturePage() {
  return (
    <div className="min-h-screen bg-[#08080C] text-slate-100 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden pt-0">
      
      {/* Universal Shared Navbar */}
      <UniversalNavbar />

      {/* 2. HERO SECTION — FLUID HIGH-IMPACT 2-COLUMN LAYOUT WITH LIGHT-MODE PREVIEW CARDS ON RIGHT */}
      <section data-nav-theme="dark" className="w-full relative overflow-hidden text-left pt-28 pb-16 px-6 md:px-16 lg:px-24 border-b border-white/10 bg-[#08080C]">
        
        {/* Ambient Dark Studio Laser Glows */}
        <div className="absolute top-1/4 right-1/4 w-[55rem] h-[55rem] bg-purple-900/25 rounded-full blur-[260px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[35rem] h-[35rem] bg-pink-900/15 rounded-full blur-[200px] pointer-events-none" />

        {/* 2-COLUMN HERO MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 max-w-7xl mx-auto w-full mb-12">
          
          {/* LEFT COLUMN (7 COLS): HEADLINE & CTAS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>THE FOUNDER BRAND ENGINE</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light font-display text-white tracking-tight leading-[1.05]">
              Architect Your Personal Authority. <br />
              <span className="font-normal italic text-purple-300">Automate Your Brand’s Reach.</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-light leading-relaxed max-w-xl">
              Turn your operational insights and hard-earned lessons into high-converting thought leadership—without spending 15 hours a week drafting copy or hiring $6,000/month agencies.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                to="/login?mode=signup"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-600 to-pink-600 hover:from-[#6D28D9] hover:to-pink-700 text-white font-sans font-bold text-xs transition-all shadow-xl shadow-purple-900/30 text-center block hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Founder DNA Setup — Onboard in 60s
              </Link>

              <a 
                href="#previews"
                className="px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-sans font-semibold text-xs transition-all text-center block"
              >
                Explore Live Doppelganger Previews
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): ANIMATED FLOATING LIGHT-MODE POST PREVIEWS WITH BACKGROUND FLOATING SOCIAL ICONS */}
          <div className="lg:col-span-5 relative">
            
            {/* FLOATING SOCIAL MEDIA CHANNEL ICONS IN BACKGROUND */}
            <div className="absolute -inset-10 pointer-events-none z-0 hidden sm:block">
              {/* Floating LinkedIn Icon Badge */}
              <motion.div 
                animate={{ y: [-12, 12, -12], rotate: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-4 bg-[#0077B5]/20 border border-[#0077B5]/40 text-[#0077B5] px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaLinkedin className="w-4 h-4 text-[#0077B5]" />
                <span className="text-white">LinkedIn GTM</span>
              </motion.div>

              {/* Floating X Icon Badge */}
              <motion.div 
                animate={{ y: [14, -14, 14], rotate: [5, -5, 5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 -right-8 bg-white/10 border border-white/20 text-white px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaXTwitter className="w-4 h-4 text-white" />
                <span>X Dispatch</span>
              </motion.div>

              {/* Floating Instagram Icon Badge */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [-6, 6, -6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-6 -left-6 bg-pink-500/20 border border-pink-500/40 text-pink-400 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <FaInstagram className="w-4 h-4 text-pink-400" />
                <span className="text-white">Insta 4K Carousel</span>
              </motion.div>

              {/* Floating Substack Icon Badge */}
              <motion.div 
                animate={{ y: [8, -16, 8], rotate: [3, -3, 3] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/4 -left-8 bg-orange-500/20 border border-orange-500/40 text-orange-400 px-3 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold font-sans"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="text-white">Substack Hub</span>
              </motion.div>
            </div>

            {/* MAIN LIGHT MODE PREVIEW CARDS */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="space-y-4 max-w-md mx-auto relative z-10"
            >
              
              {/* LIGHT MODE CARD 01: LINKEDIN POST PREVIEW */}
              <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-3.5 text-left transform lg:rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img src="/aimlpartner_logo.png" alt="AIML Partner" className="w-8 h-8 object-contain rounded-lg bg-slate-900 p-0.5 border border-slate-200" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-sans">AIMLPartner Lead • 1st</div>
                      <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                        <span>Founder & CEO • 2h</span>
                        <Globe className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0077B5] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">LINKEDIN</span>
                </div>

                <div className="text-xs text-slate-800 space-y-2">
                  <p className="font-semibold text-slate-900 leading-snug">We spent $40k on ads last month. Net pipeline generated: $0.</p>
                  
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 relative">
                    <img src="/campaign_images/img_camp_2udj8fo6.png" alt="LinkedIn PDF" className="w-full h-24 object-cover" />
                    <div className="p-2 bg-slate-900 text-white text-left">
                      <div className="text-[9px] text-blue-400 font-mono">Arthur Voice Clone Engine</div>
                      <div className="text-[10px] font-semibold text-white truncate">Organic Doppelganger Growth Playbook</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                  <span className="font-semibold text-slate-700">142 Reactions • 18 Comments</span>
                  <span className="text-purple-600 font-bold">100% Voice Accuracy</span>
                </div>
              </div>

              {/* LIGHT MODE CARD 02: X THREAD PREVIEW */}
              <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-3.5 text-left transform lg:-rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img src="/weareknwn_logo.png" alt="KNWN" className="w-8 h-8 object-contain rounded-full bg-slate-900 p-0.5 border border-slate-200" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-sans flex items-center gap-1">
                        <span>KNWN Media</span>
                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">@weareknwn • 1h</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">X THREAD</span>
                </div>

                <div className="text-xs text-slate-800 space-y-2">
                  <p className="font-normal text-slate-900 leading-snug">1/7 B2B distribution secrets category leaders don't discuss in public threads:</p>
                  
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative">
                    <img src="/campaign_images/img_camp_3vtkqo0u.png" alt="X Card Render" className="w-full h-24 object-cover" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans font-medium">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-slate-400" /> 120</span>
                  <span className="flex items-center gap-1"><Repeat className="w-3 h-3 text-slate-400" /> 4.2k</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-slate-400" /> 842</span>
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-slate-400" /> 42.8k</span>
                </div>
              </div>

            </motion.div>

          </div>

        </div>

        {/* 3 EXECUTIVE PROOF METRICS BAR (SELF-CONTAINED GLASS CARD WITH PADDING) */}
        <div className="max-w-7xl mx-auto w-full relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left font-sans">
            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">15+ Hours Saved</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">Weekly founder time reclaimed</div>
            </div>
            <div className="space-y-1 border-l-0 sm:border-l border-white/10 sm:pl-8">
              <div className="text-xl sm:text-2xl font-bold text-purple-300 font-display tracking-tight">0% Tone Drift</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">Arthur Voice DNA Calibration</div>
            </div>
            <div className="space-y-1 border-l-0 sm:border-l border-white/10 sm:pl-8">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-display tracking-tight">+340% Inbound Demos</div>
              <div className="text-xs sm:text-sm text-slate-400 font-light">Verified 30-day client growth</div>
            </div>
          </div>
        </div>

      </section>

      {/* 3. SECTION 01 — WHY THIS IS USEFUL TO YOU (FOUNDER PROBLEM & SOLUTION) */}
      <section id="usefulness" data-nav-theme="light" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#FAF9F6] text-slate-900 border-y border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-emerald-400 rounded-full" />
              <span>FOUNDER UTILITY & VALUE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Designed For Founders Who Have <br />
              <span className="font-normal italic text-[#7C3AED]">Zero Time To Waste On Drafts.</span>
            </h2>
            
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              Your audience buys from leaders they trust. BrandToPost ensures you remain consistently visible on every channel without stealing focus from building product.
            </p>
          </div>

          {/* 3 HIGH-IMPACT UTILITY CARDS WITH VISUAL PREVIEW HEADERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Utility 01: Arthur Voice Clone */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-[#7C3AED]/60 hover:shadow-2xl hover:shadow-purple-900/5 transition-all group">
              <div className="space-y-5">
                {/* Visual Header Badge */}
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#7C3AED]">
                    <span>VOICE DNA PROFILE</span>
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-[9px]">99.4% MATCH</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                    <div className="flex justify-between border-b border-purple-100 pb-1">
                      <span>Banned Jargon:</span>
                      <span className="text-red-500 font-semibold">"Synergy", "Paradigm"</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tone Calibration:</span>
                      <span className="text-purple-700 font-semibold">High-Signal Founder</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-[#7C3AED] font-bold uppercase tracking-wider block">01. Arthur Voice Clone</span>
                  <h3 className="text-2xl font-bold font-display text-slate-900 leading-snug">Writes Like You At 6 AM</h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Arthur extracts your past writing, preferred vocabulary constraints, forbidden buzzwords, and core business philosophies. Every post reads like a human founder wrote it.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] font-sans font-semibold text-[#7C3AED] flex items-center justify-between">
                <span>Zero Tone Drift Guarantee</span>
                <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
              </div>
            </div>

            {/* Utility 02: Mobile Approval Deck */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group">
              <div className="space-y-5">
                {/* Visual Header Badge */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-700">
                    <span>MONDAY APPROVAL ROUTINE</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[9px]">120 SECONDS</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-semibold text-emerald-900 font-sans">7 Campaigns Ready For Mobile Approval</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-wider block">02. Mobile Approval Deck</span>
                  <h3 className="text-2xl font-bold font-display text-slate-900 leading-snug">Review In 2 Minutes</h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Every Monday morning, review your 7-day multi-channel campaign deck on your phone. Make quick inline edits, swap visual plates, or hit Approve All in under 120 seconds.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] font-sans font-semibold text-emerald-700 flex items-center justify-between">
                <span>100% Mobile Control</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Utility 03: Multi-Channel Native */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/40 flex flex-col justify-between hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group">
              <div className="space-y-5">
                {/* Visual Header Badge */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-blue-700">
                    <span>NATIVE ADAPTATION ENGINE</span>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px]">4 CHANNELS</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 font-mono text-[10px] text-blue-900 font-semibold">
                    <span className="bg-white px-2 py-0.5 rounded border border-blue-200">LinkedIn</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-blue-200">X Thread</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-blue-200">Insta 4K</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-blue-200">Substack</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider block">03. Multi-Channel Native</span>
                  <h3 className="text-2xl font-bold font-display text-slate-900 leading-snug">4 Channels, 1 Click</h3>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    Convert strategic ideas into LinkedIn story-lesson posts, X threads, 4K Instagram visual carousels, and Substack newsletters formatted specifically for each platform.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] font-sans font-semibold text-blue-600 flex items-center justify-between">
                <span>Platform Native Formatting</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECTION 02 — SOCIAL MEDIA GTM DISTRIBUTION ENGINE (AUTHENTIC NATIVE OUTPUT) */}
      <section id="previews" data-nav-theme="dark" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>SOCIAL GTM DISTRIBUTION ENGINE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05] text-white">
              Platform-Native Social GTM: <br />
              <span className="font-normal italic text-purple-300">Dominating Every Audience Channel.</span>
            </h2>
            
            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl">
              Zero synthetic AI slop look. Native formatting, pixel-perfect visual plates, and high-impact founder copywriting built specifically for every social media GTM channel.
            </p>
          </div>

          {/* 4-CARD BALANCED SOCIAL MEDIA GTM SHOWCASE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* PREVIEW 01: LINKEDIN EXECUTIVE FEED */}
            <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-5 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/aimlpartner_logo.png" alt="AIML Partner" className="w-10 h-10 object-contain rounded-xl bg-slate-900 p-1 border border-slate-200" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-sans">AIMLPartner Lead • 1st</div>
                      <div className="text-[11px] text-slate-500 font-sans flex items-center gap-1">
                        <span>Founder & CEO @ AIMLPartner • 2h</span>
                        <Globe className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0077B5] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                    <FaLinkedin className="w-3 h-3 text-[#0077B5]" /> LINKEDIN GTM
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 space-y-3">
                  <p className="font-semibold text-slate-900">We spent $40k on ads last month. Net pipeline generated: $0.</p>
                  
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900">
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img src="/campaign_images/img_camp_2udj8fo6.png" alt="LinkedIn PDF" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-white/20">PDF • 8 PAGES</div>
                    </div>
                    <div className="p-3 bg-slate-900 text-white text-left">
                      <div className="text-[10px] text-blue-400 font-mono">AIMLPartner Doppelganger Engine</div>
                      <div className="text-xs font-semibold text-white truncate">Organic Doppelganger Growth Framework (30-Day B2B Playbook)</div>
                    </div>
                  </div>

                  <p className="text-slate-700 font-light text-xs">In 30 days: 3 Enterprise demos booked. Paid ads capture demand. Organic thought leadership creates it.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
                <span className="font-semibold text-slate-700">142 Reactions • 18 comments</span>
                <span className="text-blue-600 font-semibold">Like • Comment • Repost</span>
              </div>
            </div>

            {/* PREVIEW 02: X THREAD WITH IMAGE ATTACHMENT */}
            <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-5 flex flex-col justify-between hover:border-slate-400/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/weareknwn_logo.png" alt="KNWN" className="w-10 h-10 object-contain rounded-full bg-slate-900 p-1 border border-slate-200" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1">
                        <span>KNWN Media</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="text-[11px] text-slate-500 font-sans">@weareknwn • 1h</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                    <FaXTwitter className="w-3 h-3 text-slate-900" /> X THREAD GTM
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 space-y-3">
                  <p className="font-normal text-slate-900">1/7 B2B distribution secrets category leaders don't discuss in public threads:</p>
                  
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                      <img src="/campaign_images/img_camp_3vtkqo0u.png" alt="X Card Render" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-white/20">4K Graphic Render</div>
                    </div>
                    <div className="p-3 border-t border-slate-200/80 bg-slate-100/60 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans uppercase">brandtopost.ai</div>
                      <div className="text-xs font-bold text-slate-900 font-sans leading-snug">B2B Doppelganger Engine: Extract & Auto-Broadcast Earned Secrets</div>
                    </div>
                  </div>

                  <p className="text-slate-600 font-light text-xs">2/7 The secret is Earned Secrets. Extract unique insights from your team instead of noise.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
                <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /> 120</span>
                <span className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5 text-slate-400" /> 4.2k</span>
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-slate-400" /> 842</span>
                <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5 text-slate-400" /> 42.8k</span>
              </div>
            </div>

            {/* PREVIEW 03: INSTAGRAM 4K VISUAL CAROUSEL */}
            <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-5 flex flex-col justify-between hover:border-pink-500/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <img src="/superherogym_logo.png" alt="Superhero Gym" className="w-10 h-10 object-contain rounded-xl bg-slate-900 p-1 border border-slate-200" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-sans">superherogym</div>
                      <div className="text-[11px] text-slate-500 font-sans">Visual Story Series</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200 flex items-center gap-1">
                    <FaInstagram className="w-3 h-3 text-pink-600" /> INSTA CAROUSEL
                  </span>
                </div>

                <div className="text-xs text-slate-800 space-y-3">
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 relative aspect-square w-full">
                    <img src="/campaign_images/img_camp_2udj8fo6.png" alt="Insta Render" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                  </div>
                  <p className="font-light text-slate-700 text-xs">Swipe for the 4-step framework to turn personal story into customer trust. #FounderGrowth #SocialGTM</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
                <span className="font-semibold text-slate-700">842 Likes • 42 Shares</span>
                <span className="text-pink-600 font-bold">1080x1080 4K Render</span>
              </div>
            </div>

            {/* PREVIEW 04: SUBSTACK EXECUTIVE NEWSLETTER */}
            <div className="p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-base font-display">
                      S
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 font-sans">The Founder Dispatch</div>
                      <div className="text-[11px] text-slate-500 font-sans">Weekly Substack Newsletter</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">SUBSTACK GTM</span>
                </div>

                <div className="text-xs text-slate-800 space-y-3">
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
                    <div className="text-[10px] font-mono font-bold text-orange-700 uppercase">ISSUE #14 • 4 MIN READ</div>
                    <h4 className="text-base font-bold text-slate-900 font-display leading-snug">Why 90% of B2B Founders Fail at Organic Social Distribution</h4>
                    <p className="text-xs text-slate-600 font-light leading-relaxed">
                      "Most founders delegate social copy to junior marketers who don't understand the product. Here is how we automated authentic voice clone dispatches..."
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans font-medium">
                <span className="font-semibold text-slate-700">1,240 Executive Subscribers</span>
                <span className="text-orange-600 font-bold">Auto-Dispatched</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. SECTION 03 — IS IT WORTH THE INVESTMENT? (ROI & COST COMPARISON) */}
      <section id="investment-roi" data-nav-theme="light" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#FAF9F6] text-slate-900 border-b border-slate-200/60 relative z-10 text-left">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-[#7C3AED] uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-[#7C3AED] to-emerald-400 rounded-full" />
              <span>THE FINANCIAL & TIME MATH</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
              Is It Worth The Investment? <br />
              <span className="font-normal italic text-[#7C3AED]">Save $50,000+ Every Single Year.</span>
            </h2>
            
            <p className="text-base text-slate-600 max-w-xl font-light leading-relaxed">
              Compare the hard math of hiring traditional agencies or freelancers vs deploying your virtual AI doppelganger studio.
            </p>
          </div>

          {/* 3-COLUMN ECONOMIC PSYCHOLOGY MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Column 1: Agency */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
              <div className="space-y-5">
                <span className="text-xs text-red-500 font-sans font-semibold uppercase tracking-wider block">Traditional Agency</span>
                <div className="text-3xl font-bold font-display text-slate-900">$6,000 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <p className="text-xs text-slate-500 font-light">($72,000/yr retainer covering account manager salaries and agency margins)</p>
                
                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-500">Weekly Founder Time:</span> <span className="font-bold text-red-600">10+ Hours Calls</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tone Accuracy:</span> <span className="font-bold text-red-600">Uncalibrated Copy</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Onboarding:</span> <span className="font-bold text-slate-900">3 - 4 Weeks</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 block">Bloated Overhead</span>
              </div>
            </div>

            {/* Column 2: Freelancer */}
            <div className="bg-white border border-slate-200/90 p-8 rounded-3xl space-y-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
              <div className="space-y-5">
                <span className="text-xs text-amber-600 font-sans font-semibold uppercase tracking-wider block">In-House / Freelancers</span>
                <div className="text-3xl font-bold font-display text-slate-900">$3,000 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <p className="text-xs text-slate-500 font-light">($36,000/yr salary + management oversight for copywriters and designers)</p>
                
                <div className="border-t border-slate-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-500">Weekly Founder Time:</span> <span className="font-bold text-amber-600">6+ Hours Oversight</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tone Accuracy:</span> <span className="font-bold text-amber-600">Constant Tone Drift</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Onboarding:</span> <span className="font-bold text-slate-900">2 - 3 Weeks</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 block">High Management Friction</span>
              </div>
            </div>

            {/* Column 3: BrandToPost */}
            <div className="bg-white border-2 border-[#7C3AED] p-8 rounded-3xl space-y-6 shadow-2xl shadow-[#7C3AED]/15 flex flex-col justify-between transform md:-translate-y-2">
              <div className="space-y-5">
                <span className="text-xs text-[#7C3AED] font-sans font-bold uppercase tracking-wider block">BrandToPost Studio</span>
                <div className="text-3xl font-bold font-display text-[#7C3AED]">₹2,499 – ₹4,499 <span className="text-xs font-normal text-slate-500">/ mo</span></div>
                <p className="text-xs text-slate-600 font-light">(Less than 1 hour of your founder time per month for full autopilot distribution)</p>
                
                <div className="border-t border-purple-100 pt-4 space-y-3 text-xs font-sans">
                  <div className="flex justify-between"><span className="text-slate-600">Weekly Founder Time:</span> <span className="font-bold text-emerald-600">2-Min Mobile Deck</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Tone Accuracy:</span> <span className="font-bold text-emerald-600">100% Arthur Voice Clone</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Onboarding:</span> <span className="font-bold text-[#7C3AED]">Instant 15-Min DNA Sync</span></div>
                </div>
              </div>
              <div className="pt-4 border-t border-purple-100 text-center space-y-2">
                <Link 
                  to="/login?mode=signup"
                  className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-md block text-center"
                >
                  Deploy Founder Studio
                </Link>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 inline-block">
                  Saves $50,000+ / Year
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. SECTION 04 — VERIFIED FOUNDER CASE STUDIES & MARQUEE STREAM */}
      <section id="results" data-nav-theme="dark" className="py-24 md:py-36 px-6 md:px-16 lg:px-24 w-full bg-[#08080C] text-white border-b border-white/10 relative z-10 text-left overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>VERIFIED METRIC PROOF</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-light font-display tracking-tight leading-[1.05] text-white">
              Real Results From Category Leaders <br />
              <span className="font-normal italic text-purple-300">Who Automated Their Reach.</span>
            </h2>
            
            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl">
              Growth metrics from founders who stopped writing manual drafts and deployed our doppelganger distribution engine.
            </p>
          </div>

          {/* 3 VERIFIED CASE STUDY TILES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <img src="/MINIM-logo-primary.png" alt="MINIM" className="h-8 max-w-[130px] object-contain brightness-110" />
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40">+340% Inbound Demos</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "We went from posting once every 3 weeks to 5 high-converting posts a week on LinkedIn and X. Our inbound enterprise demos jumped by +340% in 30 days."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Alex Rivera (CEO @ MINIM)</span>
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  <span>Voice Verified</span>
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                </span>
              </div>
            </div>

            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <img src="/aimlpartner_logo.png" alt="AIMLPartner" className="h-8 max-w-[130px] object-contain brightness-110" />
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">2-Min Weekly Deck</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "The 2-minute Monday approval deck is a total game changer. I review the queued campaign deck on my phone, click Approve All, and our channels run on autopilot."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Sarah Chen (Co-Founder @ AIMLPartner)</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span>Autopilot Active</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </span>
              </div>
            </div>

            <div className="bg-[#0E0E17] border border-white/10 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <img src="/superherogym_logo.png" alt="Superhero Gym" className="h-8 max-w-[130px] object-contain brightness-110" />
                  <span className="text-xs font-bold text-pink-300 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/40">$6,000/mo Saved</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
                  "I used to pay an agency $6,000/month for generic posts that got 5 likes. BrandToPost's voice clone captures my exact founder story for a fraction of the cost."
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Marcus Vance (Founder @ Superhero Gym)</span>
                <span className="text-pink-400 font-semibold flex items-center gap-1">
                  <span>Agency Replaced</span>
                  <CheckCircle2 className="w-3 h-3 text-pink-400" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. SECTION 05 — FINAL HIGH-CONVERSION CALL TO ACTION STAGE */}
      <section data-nav-theme="dark" className="py-32 md:py-44 px-6 md:px-16 lg:px-24 w-full bg-[#08080C] text-white border-t border-white/10 relative z-10 overflow-hidden text-left">
        
        {/* ATTENTION-GRABBING 4K BACKDROP IMAGE RENDER */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="/brand_dna_temple_bg_1785868729158.png" 
            alt="Studio Engine Backdrop" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/85 to-[#08080C]/90" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LEFT COLUMN: HERO STATEMENT */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3 text-xs font-sans font-semibold tracking-[0.25em] text-purple-400 uppercase mb-4">
              <span className="w-8 h-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 rounded-full" />
              <span>THE AUTOMATED FOUNDER ERA</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-light font-display tracking-tight leading-[1.05] text-white">
              Ready to Stop Writing Manual Posts <br />
              <span className="font-normal italic text-purple-300">And Deploy Your Doppelganger Studio?</span>
            </h2>

            <p className="text-base text-slate-300 font-light leading-relaxed max-w-xl mt-4">
              Replace $6,000/mo agency retainers and 10+ hours of weekly drafting grind. Claim your virtual AI specialist roster and launch native autopilot distribution today.
            </p>
          </div>

          {/* RIGHT COLUMN: HIGH-CONVERSION CONSOLE CARD */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#12111D]/90 to-[#0A0A12]/95 border border-purple-500/40 p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl shadow-purple-950/60 backdrop-blur-xl relative overflow-hidden text-left">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">Instant Activation</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Launch Your Founder Studio</h3>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Paste your site URL, sync your founder voice DNA, and receive your first 30-day campaign queue in under 60 seconds.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link 
                to="/login?mode=signup"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-purple-600 to-pink-600 hover:from-[#6D28D9] hover:to-pink-700 text-white font-bold text-sm transition-all shadow-xl shadow-purple-600/30 text-center block hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Free Founder DNA Setup — Onboard in 60s
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10 text-center space-y-1">
              <span className="text-[11px] text-emerald-400 font-sans font-semibold flex items-center justify-center gap-1">
                <span>100% Mobile Control Guarantee</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <span className="text-[10px] text-slate-500 font-sans block">
                No Credit Card Required • Instant Cancel Anytime
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="w-full bg-[#FAF8F5] pt-16 relative z-10 border-t border-slate-200/60 flex flex-col justify-between mb-0 pb-0 text-slate-900">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/50 text-left">
          <div className="flex flex-col gap-3.5">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">Platform</span>
            <div className="flex flex-col gap-2.5 text-xs text-slate-500 font-sans font-light">
              <Link to="/founder" className="hover:text-slate-900 transition-colors">Master Founder Studio</Link>
              <Link to="/login?mode=signup" className="hover:text-slate-900 transition-colors">Growth Autopilot</Link>
              <Link to="/login?mode=signup" className="hover:text-slate-900 transition-colors">Solo Founder Engine</Link>
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
              <Link to="/blog" className="hover:text-slate-900 transition-colors">Founder Guides</Link>
              <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 lg:col-span-2">
            <span className="font-display font-bold text-slate-900 text-xs tracking-wider uppercase">BrandToPost Founder Studio</span>
            <p className="text-xs text-slate-500 font-sans font-light leading-relaxed">
              Architect your personal executive authority across LinkedIn, X, Instagram, and Substack with zero artificial jargon.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between text-xs text-slate-400 font-sans font-light">
          <span>© {new Date().getFullYear()} BrandToPost Inc. All rights reserved.</span>
          <span className="text-[#7C3AED] font-semibold">Master Founder Engine</span>
        </div>
      </footer>

    </div>
  );
}
