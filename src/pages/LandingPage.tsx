import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Megaphone, Zap, Target, Layers, ArrowRight, 
  Sparkles, Globe, Share2, BarChart, CheckCircle2,
  MessageSquare, Users, TrendingUp, Cpu, CalendarClock
} from 'lucide-react';

const AnimatedGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <motion.div 
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.4, 0.6, 0.4],
        rotate: [0, 45, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ffe066]/40 via-[#ff6347]/10 to-transparent blur-[100px]"
    />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        rotate: [0, -45, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ff6347]/20 via-[#ffe066]/20 to-transparent blur-[120px]"
    />
  </div>
);

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-[#ff6347]/20 selection:text-[#ff6347] overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center shadow-md">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl tracking-tight font-display text-gray-900">
                <span className="font-extrabold">Brand</span>
                <span className="font-light text-[#ff6347]">ToPost</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:block">
                Sign In
              </Link>
              <Link to="/login" className="group relative inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-gray-900/20">
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center justify-center">
        <AnimatedGradient />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8"
        >
          <Sparkles className="h-4 w-4 text-[#ff6347]" />
          <span className="text-sm font-semibold text-gray-700">Introducing the POST Framework</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter font-display text-gray-900 mb-8 leading-[1.1] max-w-5xl"
        >
          Build market trust and <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6347] to-[#f5b041]">
            generate demand.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl font-medium leading-relaxed"
        >
          We help companies build market trust and generate demand through POST: <strong className="text-gray-900">Positioning, Outreach, Social Proof, and Traction.</strong>
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link to="/login" className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 bg-[#ff6347] text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#ff6347]/30">
            Start Generating Now
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#framework" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 border border-gray-200 shadow-sm transition-all">
            See the Framework
          </a>
        </motion.div>

        {/* Abstract UI Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-5xl relative"
        >
          <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-gray-200/50">
            <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-2 bg-gray-50/50">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 px-3 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-500 font-mono flex items-center gap-2 shadow-sm">
                <Globe className="h-3 w-3" /> https://your-startup.com
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
              <div className="col-span-1 space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 w-full bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-4/5 bg-gray-200 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded" />
                </div>
                <div className="h-32 w-full bg-orange-50 rounded-2xl border border-orange-100 p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#ff6347]" />
                    <div className="h-3 w-20 bg-orange-200 rounded" />
                  </div>
                  <div className="h-2 w-full bg-orange-200 rounded" />
                  <div className="h-2 w-4/5 bg-orange-200 rounded" />
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-64 w-full bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#ffe066]/20 to-transparent rounded-full blur-2xl" />
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6347] to-[#ffe066] shrink-0 shadow-md" />
                    <div className="space-y-2 w-full mt-1">
                      <div className="h-3 w-32 bg-gray-300 rounded" />
                      <div className="h-2 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-200 rounded" />
                    <div className="h-3 w-3/4 bg-gray-200 rounded" />
                  </div>
                  <div className="mt-8 h-24 w-full rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center relative z-10">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-[#ff6347] border-b-[6px] border-b-transparent ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Marquee */}
      <section className="py-10 border-y border-gray-200 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-6 text-center">
          <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Engineered for modern platforms</p>
        </div>
        <div className="flex whitespace-nowrap animate-marquee opacity-60 hover:opacity-100 transition-opacity duration-500">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 mx-8">
              {['LinkedIn', 'Twitter / X', 'Instagram', 'Facebook', 'Reddit', 'Email Newsletters'].map((platform) => (
                <span key={platform} className="text-2xl font-display font-extrabold text-gray-300">{platform}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* The POST Framework Section */}
      <section id="framework" className="py-32 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-bold mb-6">
            <Target className="h-4 w-4" />
            Public Opportunity Signal Engine
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6 tracking-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6347] to-[#f5b041]">POST</span> Framework
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            A clean, systematic approach connecting brand building, public posting, distribution, and lead generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              letter: "P",
              title: "Position",
              desc: "Define what the brand stands for, who it serves, and why it matters.",
              icon: <Target className="h-6 w-6 text-[#ff6347]" />,
              color: "bg-red-50 border-red-100"
            },
            {
              letter: "O",
              title: "Outreach",
              desc: "Put the message in front of the right audience through social and founder-led visibility.",
              icon: <Megaphone className="h-6 w-6 text-orange-500" />,
              color: "bg-orange-50 border-orange-100"
            },
            {
              letter: "S",
              title: "Signal",
              desc: "Create consistent content, proof, opinions, and market cues that build trust.",
              icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
              color: "bg-yellow-50 border-yellow-100"
            },
            {
              letter: "T",
              title: "Traction",
              desc: "Turn attention into leads, conversations, pipeline, and business growth.",
              icon: <TrendingUp className="h-6 w-6 text-green-500" />,
              color: "bg-green-50 border-green-100"
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl p-8 border ${item.color} relative overflow-hidden group hover:shadow-lg transition-all bg-white`}
            >
              <div className="absolute -right-6 -top-6 text-9xl font-black text-gray-900/5 group-hover:text-gray-900/10 transition-colors font-display">
                {item.letter}
              </div>
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 shadow-sm`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 relative z-10">{item.title}</h3>
              <p className="text-gray-600 font-medium leading-relaxed relative z-10">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#ff6347] to-[#ffe066] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#ff6347]/20">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-bold font-display text-white mb-6 relative z-10 tracking-tight">
            Ready to scale your voice?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto relative z-10 font-medium">
            Join the next generation of founders and marketers who are automating their growth engine with BrandToPost.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10">
            <Link to="/login" className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 bg-white text-[#ff6347] px-10 py-5 rounded-full text-lg font-bold transition-all hover:scale-105 hover:shadow-xl">
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/80 relative z-10 font-medium">No credit card required. Setup takes 30 seconds.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center shadow-sm">
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl tracking-tight font-display text-gray-900">
              <span className="font-extrabold">Brand</span>
              <span className="font-light text-[#ff6347]">ToPost</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-gray-500">
            <a href="#" className="hover:text-[#ff6347] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#ff6347] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#ff6347] transition-colors">Twitter</a>
          </div>
          <div className="text-gray-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} BrandToPost. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
