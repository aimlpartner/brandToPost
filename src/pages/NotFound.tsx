import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, HelpCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized position from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none selection:bg-[#7C3AED] selection:text-white">
      {/* Subtle warm background glows */}
      <div 
        className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#7C3AED]/5 rounded-full blur-[120px] transition-transform duration-700 pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`
        }}
      />
      <div 
        className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-[#2583EB]/5 rounded-full blur-[100px] transition-transform duration-700 pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Subtle details */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-slate-300 rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
        {/* Parallax Mascot Container */}
        <div className="relative w-72 h-72 mb-4 flex items-center justify-center">
          {/* Subtle glow behind mascot */}
          <div className="absolute w-44 h-44 bg-[#7C3AED]/10 rounded-full blur-3xl" />

          {/* Mouse tracking outer wrapper */}
          <div
            className="transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${mousePosition.x * 15}px, ${mousePosition.y * 15}px, 0) rotate(${mousePosition.x * 1.5}deg)`
            }}
          >
            {/* Hover floating inner wrapper */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative cursor-pointer"
            >
              <img
                src="/B2P AVATAR.png"
                alt="Tror Mascot"
                className="w-52 h-52 object-contain filter drop-shadow-[0_10px_25px_rgba(124,58,237,0.12)] hover:scale-102 transition-transform duration-500"
              />
              
              {/* Question mark bubbles coming out from Tror */}
              <motion.div
                animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-1 -right-1 bg-white border border-slate-200 text-[#7C3AED] text-base font-bold rounded-full w-9 h-9 flex items-center justify-center shadow-sm"
              >
                ?
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-6xl font-light tracking-tight text-slate-900 mb-4"
        >
          Lost in the{' '}
          <span className="font-serif italic font-normal text-slate-800">
            workspace
          </span>
          ?
        </motion.h1>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-slate-500 font-light text-base sm:text-lg mb-10 max-w-md leading-relaxed"
        >
          Even our mascot, <strong className="text-slate-700 font-normal">Tror</strong>, is puzzled by this one. The page you are looking for does not exist or has been relocated.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4"
        >
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-6 py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Home className="w-4.5 h-4.5" />
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-semibold rounded-lg px-6 py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Home className="w-4.5 h-4.5" />
              Return Home
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="bg-white border border-slate-200 hover:bg-[#FAF9F6] text-slate-700 font-semibold rounded-lg px-6 py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            Go Back
          </button>
        </motion.div>

        {/* Support link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Report this issue to support</span>
        </motion.div>
      </div>
    </div>
  );
}
