import React from 'react';

export function AppSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0A0A0F] relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute w-[180px] h-[180px] md:w-[240px] md:h-[240px] rounded-full filter blur-[25px] mix-blend-screen opacity-70 animate-pulse bg-[#7C3AED]/30 z-0"></div>
        <img 
          src="/B2PLOGO.png" 
          alt="BrandToPost Logo" 
          className="w-24 md:w-36 h-auto object-contain animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] relative z-10" 
        />
      </div>
      <div className="pb-10 flex flex-col items-center relative">
        <div className="absolute bottom-[30px] w-[140px] h-[80px] rounded-full filter blur-[20px] opacity-70 animate-pulse bg-[#7C3AED]/20 z-0 delay-700"></div>
        <span className="text-gray-400 text-xs mb-2 font-medium tracking-wider relative z-10 uppercase">from</span>
        <img 
          src="/Mascot.png" 
          alt="Parent Company Logo" 
          className="h-10 object-contain relative z-10" 
        />
      </div>
    </div>
  );
}
