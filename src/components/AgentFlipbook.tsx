import React, { useRef, useEffect, useState, useCallback, forwardRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';

// -----------------------------------------------
// AGENT DATA
// -----------------------------------------------
const AGENTS = [
  {
    id: "arthur",
    name: "Arthur",
    role: "The Founder Doppelganger",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#7C3AED",
    jobDescription: "Studies your values, communication rules, positioning, and decision styles to clone your exact voice. Arthur ensures all generated copy reads like it was written directly by you, not a robot.",
    unlockedIn: ["Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#2583EB",
    jobDescription: "Scans the live web in real-time. Sarah extracts the latest industry trends, competitor positioning gaps, customer complaints, and data-backed case studies to fuel campaign concepts.",
    unlockedIn: ["Solo Founder", "Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#7C3AED",
    jobDescription: "Drafts high-converting copy native to each platform's design guidelines. Alex formats generous line breaks for LinkedIn, punchy hooks for X, and clean markdown lists for Reddit.",
    unlockedIn: ["Solo Founder", "Growth Autopilot", "Agency Partner"],
    outputPreview: {
      title: "LinkedIn Post Blueprint",
      content: "Stop prompting boxes.\n\nHere is how you actually scale B2B distribution:\n1. Personalize voice anchors\n2. Automate rendering pipelines\n3. Sync native channels",
      meta: "Alex // Platform Native Copy"
    }
  },
  {
    id: "chloe",
    name: "Chloe",
    role: "The Creative Director",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#E1306C",
    jobDescription: "Ideates visual card concepts, designs backdrop prompts, and runs AI scans to identify negative space inside images so text boxes place cleanly without overlapping human faces.",
    unlockedIn: ["Solo Founder", "Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#10B981",
    jobDescription: "Spins up headless browser instances to draw custom HTML overlays, apply CSS layout structures, and stamp your company logo cleanly into high-DPI magazine-style graphics.",
    unlockedIn: ["Solo Founder", "Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#FF7778",
    jobDescription: "Synthesizes B2B cinematic screenplays, scene-by-scene script copy, image prompt directions (for Runway, Sora, or Luma), and lists of required media assets.",
    unlockedIn: ["Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#7C3AED",
    jobDescription: "Monitors the clock. Maya automatically runs background generation processes and schedules weekly campaigns/daily posts to the calendar on her own without you needing to log in.",
    unlockedIn: ["Growth Autopilot", "Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#10B981",
    jobDescription: "Maintains a live, conversational WhatsApp link. Talk with Victor to edit draft campaign copy, translate texts into regional local languages, and schedule posts directly via chat.",
    unlockedIn: ["Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#2583EB",
    jobDescription: "Monitors queued schedules and utilizes secure API token handshakes to automatically post approved content directly to LinkedIn and Instagram on time.",
    unlockedIn: ["Agency Partner"],
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
    avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600&h=600",
    color: "#7C3AED",
    jobDescription: "Assembles completed weekly assets into a beautiful PDF review deck. Elena automatically emails the PDF to you or directly to client stakeholders for immediate approval.",
    unlockedIn: ["Solo Founder", "Growth Autopilot", "Agency Partner"],
    outputPreview: {
      title: "Weekly Performance Summary Digest",
      content: "Total campaign impressions: 142.8k. Average click-through CTR: 3.8%. Clean, magazine-style PDF digest compiled and dispatched.",
      meta: "Elena // Analytics PDF Generator"
    }
  }
];

// -----------------------------------------------
// Portrait Page (Left page of each spread — full-bleed agent photo)
// -----------------------------------------------
const PortraitPage = forwardRef<HTMLDivElement, { agent: typeof AGENTS[0]; index: number }>(
  ({ agent, index }, ref) => {
    const num = String(index + 1).padStart(2, '0');
    return (
      <div ref={ref} className="artbook-page-wrap">
        <div className="artbook-portrait-page">
          <img src={agent.avatar} alt={agent.name} loading="lazy" />
          {/* Number overlay */}
          <div className="artbook-portrait-num">{num}</div>
          {/* Subtle name overlay at bottom */}
          <div className="artbook-portrait-label">
            <span className="artbook-portrait-name">{agent.name}</span>
            <span className="artbook-portrait-role" style={{ color: agent.color }}>{agent.role}</span>
          </div>
        </div>
      </div>
    );
  }
);
PortraitPage.displayName = 'PortraitPage';

// -----------------------------------------------
// Detail Page (Right page of each spread — agent info)
// -----------------------------------------------
const DetailPage = forwardRef<HTMLDivElement, { agent: typeof AGENTS[0]; index: number }>(
  ({ agent, index }, ref) => {
    return (
      <div ref={ref} className="artbook-page-wrap">
        <div className="artbook-detail-page">
          {/* Binding-side shadow */}
          <div className="artbook-detail-shadow" />

          <div className="artbook-detail-content">
            {/* Header */}
            <div className="artbook-detail-header">
              <h3 className="artbook-detail-name">{agent.name}</h3>
              <p className="artbook-detail-role" style={{ color: agent.color }}>{agent.role}</p>
            </div>

            {/* Description */}
            <p className="artbook-detail-desc" style={{ '--agent-color': agent.color } as React.CSSProperties}>
              {agent.jobDescription}
            </p>

            {/* Output Preview Card */}
            <div className="artbook-detail-output">
              <span className="artbook-detail-output-tag">{agent.outputPreview.title}</span>
              <blockquote className="artbook-detail-output-quote">
                "{agent.outputPreview.content}"
              </blockquote>
              <div className="artbook-detail-output-footer">
                <span>{agent.outputPreview.meta}</span>
                <span style={{ color: '#7C3AED', fontWeight: 700 }}>READY</span>
              </div>
            </div>

            {/* Bottom */}
            <div className="artbook-detail-bottom">
              <span>{agent.unlockedIn.join(' · ')}</span>
              <span>BRANDTOPOST ROSTER</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
DetailPage.displayName = 'DetailPage';

// -----------------------------------------------
// Cover Pages
// -----------------------------------------------
const CoverPage = forwardRef<HTMLDivElement, { type: 'front' | 'back' }>(({ type }, ref) => {
  return (
    <div ref={ref} className="artbook-page-wrap">
      <div className={`artbook-cover ${type === 'front' ? 'artbook-cover-front' : 'artbook-cover-back'}`}>
        {type === 'front' ? (
          <>
            <div className="artbook-cover-accent" />
            <div className="artbook-cover-body">
              <span className="artbook-cover-eyebrow">BRANDTOPOST</span>
              <h2 className="artbook-cover-title">Creative<br/>Roster</h2>
              <div className="artbook-cover-line" />
              <p className="artbook-cover-sub">Meet Your AI<br/>Marketing Team</p>
              <span className="artbook-cover-edition">{new Date().getFullYear()} EDITION</span>
            </div>
            <div className="artbook-cover-badge">10 SPECIALISTS</div>
          </>
        ) : (
          <>
            <div className="artbook-cover-accent" />
            <div className="artbook-cover-body">
              <img
                src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png"
                alt="Logo"
                className="artbook-cover-logo"
              />
              <p className="artbook-cover-back-text">
                Your autonomous AI marketing<br/>department is ready to deploy.
              </p>
              <span className="artbook-cover-eyebrow" style={{ fontSize: '9px' }}>BRANDTOPOST.COM</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
CoverPage.displayName = 'CoverPage';

// -----------------------------------------------
// Main Flipbook Component
// -----------------------------------------------
export function AgentFlipbook() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const hasFlippedOnce = useRef(false);
  const isFlipping = useRef(false);
  const flipCooldown = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 10 agents × 2 pages each + 2 covers = 22 pages total
  const totalRawPages = AGENTS.length * 2 + 2;
  const lastAtEnd = useRef(false);
  const lastAtStart = useRef(false);

  // Compute the current "spread" index (which agent we're on)
  // Pages: 0=front cover, 1-2=agent0, 3-4=agent1, ... , 21=back cover
  const currentSpread = useMemo(() => {
    if (currentPage <= 0) return 0; // Cover
    if (currentPage >= totalRawPages - 1) return AGENTS.length + 1; // Back cover
    return Math.ceil(currentPage / 2);
  }, [currentPage, totalRawPages]);

  const currentAgent = useMemo(() => {
    const agentIndex = currentSpread - 1;
    if (agentIndex >= 0 && agentIndex < AGENTS.length) return AGENTS[agentIndex];
    return null;
  }, [currentSpread]);

  const isAtStart = currentPage <= 0;
  const isAtEnd = currentPage >= totalRawPages - 2;

  const flipNext = useCallback(() => {
    if (isFlipping.current || !bookRef.current) return;
    const pageFlip = bookRef.current.pageFlip();
    if (!pageFlip) return;

    const current = pageFlip.getCurrentPageIndex();
    const total = pageFlip.getPageCount();

    if (current >= total - 2) {
      // At or near last page
      if (lastAtEnd.current) {
        setIsLocked(false);
        document.body.style.overflow = '';
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          window.scrollBy({ top: rect.bottom, behavior: 'smooth' });
        }
        lastAtEnd.current = false;
      } else {
        lastAtEnd.current = true;
      }
      return;
    }

    lastAtEnd.current = false;
    lastAtStart.current = false;
    isFlipping.current = true;

    // Hide hint on first flip
    if (!hasFlippedOnce.current) {
      hasFlippedOnce.current = true;
      setShowHint(false);
    }

    pageFlip.flipNext();

    if (flipCooldown.current) clearTimeout(flipCooldown.current);
    flipCooldown.current = setTimeout(() => {
      isFlipping.current = false;
    }, 700);
  }, []);

  const flipPrev = useCallback(() => {
    if (isFlipping.current || !bookRef.current) return;
    const pageFlip = bookRef.current.pageFlip();
    if (!pageFlip) return;

    const current = pageFlip.getCurrentPageIndex();

    if (current <= 0) {
      if (lastAtStart.current) {
        setIsLocked(false);
        document.body.style.overflow = '';
        lastAtStart.current = false;
      } else {
        lastAtStart.current = true;
      }
      return;
    }

    lastAtStart.current = false;
    lastAtEnd.current = false;
    isFlipping.current = true;

    // Hide hint on first flip
    if (!hasFlippedOnce.current) {
      hasFlippedOnce.current = true;
      setShowHint(false);
    }

    pageFlip.flipPrev();

    if (flipCooldown.current) clearTimeout(flipCooldown.current);
    flipCooldown.current = setTimeout(() => {
      isFlipping.current = false;
    }, 700);
  }, []);

  // IntersectionObserver to lock scroll
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            setIsLocked(true);
            document.body.style.overflow = 'hidden';
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Wheel + touch handlers when locked
  useEffect(() => {
    if (!isLocked) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(e.deltaY) < 15) return;
      if (e.deltaY > 0) flipNext();
      else flipPrev();
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
      if (deltaY > 0) flipNext();
      else flipPrev();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLocked, flipNext, flipPrev]);

  // Keyboard
  useEffect(() => {
    if (!isLocked) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        flipPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, flipNext, flipPrev]);

  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
    lastAtEnd.current = false;
    lastAtStart.current = false;
  }, []);

  // Auto-hide hint after 6 seconds even without interaction
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="artbook-section"
      id="creative-roster"
    >
      {/* Section Header */}
      <div className="w-full max-w-[1200px] px-6 lg:px-8 mx-auto mb-16 text-left relative z-10">
        <p className="text-sm font-medium text-[#7C3AED] mb-4 font-sans">Creative roster</p>
        <h2 className="text-4xl md:text-7xl font-light font-display text-slate-900 mb-6 tracking-tight leading-[1.05]">
          Meet your AI <span className="font-normal italic text-[#7C3AED]">Marketing Team.</span>
        </h2>
      </div>

      {/* Book Stage */}
      <div className="artbook-stage">
        {/* Shadow underneath the book */}
        <div className="artbook-shadow" />

        {/* Left Navigation Arrow */}
        <button
          className={`artbook-nav-arrow artbook-nav-prev ${isAtStart ? 'artbook-nav-disabled' : ''}`}
          onClick={flipPrev}
          aria-label="Previous page"
          disabled={isAtStart}
        >
          <ChevronLeft className="artbook-nav-icon" />
        </button>

        <div className="artbook-wrapper">
          {/* Scroll Hint Overlay */}
          {showHint && (
            <div className="artbook-hint">
              <div className="artbook-hint-inner">
                <MousePointerClick className="artbook-hint-icon" />
                <span>Scroll to flip pages</span>
              </div>
            </div>
          )}

          {/* @ts-ignore */}
          <HTMLFlipBook
            ref={bookRef}
            width={550}
            height={400}
            size="stretch"
            minWidth={320}
            maxWidth={650}
            minHeight={250}
            maxHeight={460}
            showCover={true}
            maxShadowOpacity={0.5}
            drawShadow={true}
            flippingTime={650}
            usePortrait={false}
            startPage={0}
            startZIndex={0}
            autoSize={true}
            mobileScrollSupport={false}
            clickEventForward={false}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            className="artbook-book"
            style={{}}
            onFlip={onFlip}
          >
            {/* Front Cover */}
            <CoverPage type="front" />

            {/* Agent Spreads: Portrait (left) + Detail (right) for each agent */}
            {AGENTS.flatMap((agent, i) => [
              <PortraitPage key={`${agent.id}-portrait`} agent={agent} index={i} />,
              <DetailPage key={`${agent.id}-detail`} agent={agent} index={i} />
            ])}

            {/* Back Cover */}
            <CoverPage type="back" />
          </HTMLFlipBook>
        </div>

        {/* Right Navigation Arrow */}
        <button
          className={`artbook-nav-arrow artbook-nav-next ${isAtEnd ? 'artbook-nav-disabled' : ''}`}
          onClick={flipNext}
          aria-label="Next page"
          disabled={isAtEnd}
        >
          <ChevronRight className="artbook-nav-icon" />
        </button>
      </div>

      {/* Bottom Controls: Progress + Page Counter + Current Agent */}
      <div className="artbook-controls">
        {/* Agent Name Display */}
        <div className="artbook-agent-display">
          {currentAgent ? (
            <>
              <span className="artbook-agent-name">{currentAgent.name}</span>
              <span className="artbook-agent-role-tag" style={{ color: currentAgent.color, borderColor: `${currentAgent.color}33` }}>
                {currentAgent.role}
              </span>
            </>
          ) : (
            <span className="artbook-agent-name" style={{ opacity: 0.4 }}>
              {currentSpread === 0 ? 'Cover' : 'Back Cover'}
            </span>
          )}
        </div>

        {/* Progress Dots */}
        <div className="artbook-progress">
          {/* Cover dot */}
          <button
            className={`artbook-dot ${currentSpread === 0 ? 'artbook-dot-active' : ''}`}
            onClick={() => {
              if (bookRef.current?.pageFlip()) {
                bookRef.current.pageFlip().flip(0);
              }
            }}
            aria-label="Go to cover"
          />
          {/* Agent dots */}
          {AGENTS.map((agent, i) => (
            <button
              key={agent.id}
              className={`artbook-dot ${currentSpread === i + 1 ? 'artbook-dot-active' : ''}`}
              style={currentSpread === i + 1 ? { backgroundColor: agent.color } : {}}
              onClick={() => {
                if (bookRef.current?.pageFlip()) {
                  bookRef.current.pageFlip().flip(i * 2 + 1);
                }
              }}
              aria-label={`Go to ${agent.name}`}
              title={agent.name}
            />
          ))}
          {/* Back cover dot */}
          <button
            className={`artbook-dot ${currentSpread === AGENTS.length + 1 ? 'artbook-dot-active' : ''}`}
            onClick={() => {
              if (bookRef.current?.pageFlip()) {
                bookRef.current.pageFlip().flip(totalRawPages - 1);
              }
            }}
            aria-label="Go to back cover"
          />
        </div>

        {/* Page Counter */}
        <div className="artbook-page-counter">
          <span className="artbook-page-current">
            {String(Math.min(currentSpread, AGENTS.length)).padStart(2, '0')}
          </span>
          <span className="artbook-page-sep">/</span>
          <span className="artbook-page-total">
            {String(AGENTS.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}
