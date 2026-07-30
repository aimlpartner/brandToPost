import React, { useRef, useEffect, useState, useCallback } from 'react';

// -----------------------------------------------
// AGENT DATA
// -----------------------------------------------
const AGENTS = [
  {
    id: "arthur",
    name: "Arthur",
    role: "The Founder Doppelganger",
    avatar: "/agents_img/arthur.png",
    color: "#7C3AED",
    jobDescription: "Studies your values, communication rules, positioning, and decision styles to clone your exact voice. Arthur ensures all generated copy reads like it was written directly by you, not a robot.",
    unlockedIn: "Growth Autopilot",
    outputPreview: {
      title: "Synthesized Voice Template",
      content: "No one cares about your product's features. They care about their own problems. BrandToPost doesn't write articles; it builds traction systems.",
      meta: "Arthur // Calibrated for Founder Persona"
    }
  },
  {
    id: "sarah",
    name: "Sarah",
    role: "The Market Researcher",
    avatar: "/agents_img/sarah.png",
    color: "#2583EB",
    jobDescription: "Scans the live web in real-time. Sarah extracts the latest industry trends, competitor positioning gaps, customer complaints, and data-backed case studies to fuel campaign concepts.",
    unlockedIn: "Solo Founder",
    outputPreview: {
      title: "Competitor positioning analysis",
      content: "Market research trigger detected: 82% of agencies struggle with manual multi-channel copywriting bottlenecks. Target focus: 'autonomous marketing efficiency'.",
      meta: "Sarah // Live Web Extract"
    }
  },
  {
    id: "alex",
    name: "Alex",
    role: "The Multi-Channel Copywriter",
    avatar: "/agents_img/alex.png",
    color: "#7C3AED",
    jobDescription: "Drafts high-converting copy native to each platform's design guidelines. Alex formats generous line breaks for LinkedIn, punchy hooks for X, and clean markdown lists for Reddit.",
    unlockedIn: "Solo Founder",
    outputPreview: {
      title: "LinkedIn Post Blueprint",
      content: "Stop prompting boxes.\n\nHere is how you scale B2B distribution:\n1. Personalize voice anchors\n2. Automate rendering pipelines\n3. Sync native channels",
      meta: "Alex // Platform Native Copy"
    }
  },
  {
    id: "chloe",
    name: "Chloe",
    role: "The Creative Director",
    avatar: "/agents_img/chloe.png",
    color: "#E1306C",
    jobDescription: "Ideates visual card concepts, designs backdrop prompts, and runs AI scans to identify negative space inside images so text boxes place cleanly without overlapping human faces.",
    unlockedIn: "Solo Founder",
    outputPreview: {
      title: "Creative Canvas Specifications",
      content: "Palette Anchor: Deep Violet (#7C3AED) combined with Eggshell (#FCFBF9). Typography: Outfit (Bold) for hooks, Inter (Light) for text layout. Negative space padding constraint: 24px.",
      meta: "Chloe // Brand Book Spec"
    }
  },
  {
    id: "julian",
    name: "Julian",
    role: "The Visual Publisher",
    avatar: "/agents_img/julian.png",
    color: "#10B981",
    jobDescription: "Spins up headless browser instances to draw custom HTML overlays, apply CSS layout structures, and stamp your company logo cleanly into high-DPI magazine-style graphics.",
    unlockedIn: "Solo Founder",
    outputPreview: {
      title: "Headless Canvas Overlay",
      content: "Image canvas initialized at 1200x1200px. Brand vector logo rendered at absolute coordinates (x: 48, y: 1100). Anti-alias filters applied.",
      meta: "Julian // Graphics Engine Stamp"
    }
  },
  {
    id: "zack",
    name: "Zack",
    role: "The Video Screenwriter",
    avatar: "/agents_img/zack.png",
    color: "#FF7778",
    jobDescription: "Synthesizes B2B cinematic screenplays, scene-by-scene script copy, image prompt directions (for Runway, Sora, or Luma), and lists of required media assets.",
    unlockedIn: "Growth Autopilot",
    outputPreview: {
      title: "Storyboard Screenplay Sequence",
      content: "Scene 1: Close-up on a founder typing manual ChatGPT prompts. Screen fades to slate-900. Cut to a clean automated social calendar rendering 30 distinct post concepts in seconds.",
      meta: "Zack // Video Script Outline"
    }
  },
  {
    id: "maya",
    name: "Maya",
    role: "The Autopilot Manager",
    avatar: "/agents_img/maya.png",
    color: "#7C3AED",
    jobDescription: "Monitors the clock. Maya automatically runs background generation processes and schedules weekly campaigns/daily posts to the calendar on her own without you needing to log in.",
    unlockedIn: "Growth Autopilot",
    outputPreview: {
      title: "Distribution Calendar Queue",
      content: "LinkedIn post queue locked for Thursday at 08:30 AM. Auto-scheduler verified. 14 campaigns pre-populated. Zero prompts required.",
      meta: "Maya // Autopilot Scheduler"
    }
  },
  {
    id: "victor",
    name: "Victor",
    role: "The Mobile CRM Liaison",
    avatar: "/agents_img/victor.png",
    color: "#10B981",
    jobDescription: "Maintains a live, conversational WhatsApp link. Talk with Victor to edit draft campaign copy, translate texts into regional local languages, and schedule posts directly via chat.",
    unlockedIn: "Agency Partner",
    outputPreview: {
      title: "CRM Chat Interface Draft",
      content: "Victor: 'I have adjusted the copy for the product launch post. I swapped the CTA to \"Start Distribution\" as requested. Ready to deploy?'",
      meta: "Victor // Conversational Revision Log"
    }
  },
  {
    id: "max",
    name: "Max",
    role: "The API Distributor",
    avatar: "/agents_img/max.png",
    color: "#2583EB",
    jobDescription: "Monitors queued schedules and utilizes secure API token handshakes to automatically post approved content directly to LinkedIn and Instagram on time.",
    unlockedIn: "Agency Partner",
    outputPreview: {
      title: "Dynamic social publishing API",
      content: "API connection handshake established. Secure OAuth token validated. Distribution queue verified and published automatically.",
      meta: "Max // Native API Handshake"
    }
  },
  {
    id: "elena",
    name: "Elena",
    role: "The Campaign Reporter",
    avatar: "/agents_img/elena.png",
    color: "#7C3AED",
    jobDescription: "Assembles completed weekly assets into a beautiful PDF review deck. Elena automatically emails the PDF to you or directly to client stakeholders for immediate approval.",
    unlockedIn: "Solo Founder",
    outputPreview: {
      title: "Weekly Performance Summary Digest",
      content: "Total campaign impressions: 142.8k. Average click-through CTR: 3.8%. Clean, magazine-style PDF digest compiled and dispatched.",
      meta: "Elena // Analytics PDF Generator"
    }
  }
];

export const RevolvingAgents: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const isFlipping = useRef(false);
  const flipCooldown = useRef<NodeJS.Timeout | null>(null);

  const goNext = useCallback(() => {
    if (isFlipping.current) return;
    if (activeIndex < 9) {
      isFlipping.current = true;
      setActiveIndex(prev => prev + 1);
      if (flipCooldown.current) clearTimeout(flipCooldown.current);
      flipCooldown.current = setTimeout(() => {
        isFlipping.current = false;
      }, 600);
    } else {
      setIsLocked(false);
      document.body.style.overflow = '';
    }
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    if (isFlipping.current) return;
    if (activeIndex > 0) {
      isFlipping.current = true;
      setActiveIndex(prev => prev - 1);
      if (flipCooldown.current) clearTimeout(flipCooldown.current);
      flipCooldown.current = setTimeout(() => {
        isFlipping.current = false;
      }, 600);
    } else {
      setIsLocked(false);
      document.body.style.overflow = '';
    }
  }, [activeIndex]);

  // IntersectionObserver to capture viewport scroll lock
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            const rect = section.getBoundingClientRect();
            // Enter from bottom -> load final index, enter from top -> load start index
            if (rect.top > 0) {
              setActiveIndex(9);
            } else {
              setActiveIndex(0);
            }
            setIsLocked(true);
            document.body.style.overflow = 'hidden';
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            setIsLocked(false);
            document.body.style.overflow = '';
          }
        });
      },
      { threshold: [0.4] }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  // Capture wheel/touch gestures when scroll locked
  useEffect(() => {
    if (!isLocked) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(e.deltaY) < 15) return;
      if (e.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isLocked) return;
      e.preventDefault();
      const deltaY = touchStartY - e.touches[0].clientY;
      if (Math.abs(deltaY) < 30) return;
      touchStartY = e.touches[0].clientY;
      if (deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLocked, goNext, goPrev]);

  // Keyboard navigation when locked
  useEffect(() => {
    if (!isLocked) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, goNext, goPrev]);

  // Track Y rotation angle (36deg step for 10 cards)
  const rotationY = activeIndex * 36;

  return (
    <div 
      ref={sectionRef} 
      className="relative w-full min-h-screen bg-[#FAF9F6] border-b border-slate-200/60 overflow-hidden flex flex-col justify-between py-12 md:py-16 select-none"
    >
      
      {/* Editorial Section Header */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 text-left relative z-10">
        <p className="text-sm font-medium text-[#7C3AED] mb-3 font-sans">Visual database</p>
        <h2 className="text-4xl md:text-6xl font-light font-display text-slate-900 tracking-tight leading-[1.05]">
          Revolving agent <br />
          <span className="font-normal italic text-[#7C3AED]">Cylinder.</span>
        </h2>
      </div>

      {/* 3D Cylindrical Stage */}
      <div 
        className="relative w-full flex-1 min-h-[520px] flex items-center justify-center relative z-10 mt-6"
        style={{ perspective: '2200px' }}
      >
        {/* Tilted Cylinder container (tilt rotateX makes the entire ring/circle structure visible) */}
        <div 
          className="relative w-[200px] h-[340px] flex items-center justify-center"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: `rotateX(-7deg) rotateY(${-rotationY}deg)`,
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {AGENTS.map((agent, i) => {
            const cardAngle = i * 36;
            const isActive = i === activeIndex;

            // Calculate angular distance to the front focus position
            const diffAngle = Math.abs(((cardAngle - rotationY + 180) % 360) - 180);
            
            // Adjust scaling and opacity based on proximity to center focus
            const scale = isActive ? 1.05 : Math.max(0.72, 1 - diffAngle / 280);
            const opacity = isActive ? 1.0 : Math.max(0.38, 1 - diffAngle / 180);

            // Active card is landscape, Inactive card is portrait
            const cardWidth = isActive ? '580px' : '180px';

            return (
              <div 
                key={agent.id}
                className="absolute h-[330px] bg-white border border-slate-200/80 rounded-3xl flex flex-col overflow-hidden transition-[transform,opacity,width,border-color] duration-500 ease-out shadow-md"
                style={{
                  width: cardWidth,
                  transformStyle: 'preserve-3d',
                  // rotateY(-cardAngle + rotationY) counter-rotates the card locally so it always faces forward (no text mirroring)
                  transform: `rotateY(${cardAngle}deg) translateZ(480px) rotateY(${-cardAngle + rotationY}deg) scale(${scale})`,
                  opacity: opacity,
                  borderColor: isActive ? '#7C3AED' : 'rgba(226, 232, 240, 0.8)',
                  zIndex: isActive ? 50 : 10 - Math.round(diffAngle / 10)
                }}
              >
                {isActive ? (
                  // LANDSCAPE LAYOUT FOR EXPANDED ACTIVE CARD (Image on left, details on right)
                  <div className="flex flex-col md:flex-row h-full items-stretch p-6 gap-6 transition-all duration-300">
                    
                    {/* Left side: Avatar profile block */}
                    <div className="w-[160px] flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 pr-6">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-inner" 
                      />
                      <h4 className="text-xl font-display font-semibold text-slate-900 mt-3 text-center">{agent.name}</h4>
                      <p className="text-[#7C3AED] text-[10px] font-sans text-center mt-1 font-medium">{agent.role}</p>
                      
                      <div className="mt-4 flex flex-col items-center text-[9px] text-slate-400 font-sans">
                        <span>Access Tier</span>
                        <span className="font-semibold text-slate-600 truncate max-w-[120px]">{agent.unlockedIn}</span>
                      </div>
                    </div>

                    {/* Right side: Credentials description & Output code */}
                    <div className="flex-1 flex flex-col justify-between text-left space-y-3.5">
                      <p className="text-[12px] text-slate-600 font-light leading-relaxed">
                        {agent.jobDescription}
                      </p>

                      {/* Code Output panel */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 font-mono text-[10px] text-slate-600">
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5 mb-1.5 font-sans">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-sans">{agent.outputPreview.title}</span>
                          <span className="text-[8px] uppercase tracking-wider text-[#10B981] font-semibold block font-sans">Live Output</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed font-light">{agent.outputPreview.content}</p>
                        <span className="text-[#7C3AED] block mt-1.5 font-medium">{agent.outputPreview.meta}</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  // PORTRAIT LAYOUT FOR COLLAPSED INACTIVE CARDS (Sleek minimalist look)
                  <div className="flex flex-col justify-between h-full p-5 text-left transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        className="w-12 h-12 rounded-full object-cover border border-slate-100" 
                      />
                      <span className="text-[10px] font-sans font-light text-slate-400">
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="text-left space-y-1 mt-4">
                      <h3 className="font-display font-medium text-slate-900 text-lg leading-tight truncate">
                        {agent.name}
                      </h3>
                      <p className="text-[#7C3AED] text-xs font-sans font-normal truncate">
                        {agent.role}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-sans truncate">
                      {agent.unlockedIn}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom index indicator dots */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 pb-4">
        <div className="flex justify-center gap-1.5">
          {AGENTS.map((_, i) => (
            <div 
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? '20px' : '6px',
                backgroundColor: i === activeIndex ? '#7C3AED' : 'rgba(203, 213, 225, 0.6)'
              }}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
