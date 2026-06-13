import React, { useState } from 'react';
import { cn } from '../lib/utils';

export function VideoLoader({ className }: { className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={cn(
        "rounded-full border-2 border-transparent border-t-[#7C3AED] border-l-[#2583EB] animate-spin", 
        className
      )} />
    );
  }

  return (
    <video 
      src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Character_Animation_Loader_Prompt.mp4" 
      autoPlay 
      loop 
      muted 
      playsInline 
      onError={() => setHasError(true)}
      className={cn("rounded-full object-cover pointer-events-none inline-block shadow-[0_0_15px_rgba(124,58,237,0.3)]", className)}
    />
  );
}
