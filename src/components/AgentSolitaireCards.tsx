import React, { useState, useCallback, useRef, useEffect } from 'react';
import './AgentSolitaireCards.css';

// -----------------------------------------------
// AGENT DATA
// -----------------------------------------------
const AGENTS = [
  {
    id: "arthur",
    name: "Arthur",
    purpose: "Voice Cloning",
    avatar: "/agents_img/arthur.png",
    color: "#7C3AED",
    rank: "A",
  },
  {
    id: "sarah",
    name: "Sarah",
    purpose: "Market Research",
    avatar: "/agents_img/sarah.png",
    color: "#2583EB",
    rank: "K",
  },
  {
    id: "alex",
    name: "Alex",
    purpose: "Multi-Channel Copy",
    avatar: "/agents_img/alex.png",
    color: "#7C3AED",
    rank: "Q",
  },
  {
    id: "chloe",
    name: "Chloe",
    purpose: "Creative Direction",
    avatar: "/agents_img/chloe.png",
    color: "#E1306C",
    rank: "J",
  },
  {
    id: "julian",
    name: "Julian",
    purpose: "Visual Publishing",
    avatar: "/agents_img/julian.png",
    color: "#10B981",
    rank: "10",
  },
  {
    id: "zack",
    name: "Zack",
    purpose: "Video Scripting",
    avatar: "/agents_img/zack.png",
    color: "#FF7778",
    rank: "9",
  },
  {
    id: "maya",
    name: "Maya",
    purpose: "Autopilot Scheduling",
    avatar: "/agents_img/maya.png",
    color: "#7C3AED",
    rank: "8",
  },
  {
    id: "victor",
    name: "Victor",
    purpose: "Mobile CRM",
    avatar: "/agents_img/victor.png",
    color: "#10B981",
    rank: "7",
  },
  {
    id: "max",
    name: "Max",
    purpose: "API Distribution",
    avatar: "/agents_img/max.png",
    color: "#2583EB",
    rank: "6",
  },
  {
    id: "elena",
    name: "Elena",
    purpose: "Campaign Reporting",
    avatar: "/agents_img/elena.png",
    color: "#7C3AED",
    rank: "5",
  }
];

export function AgentSolitaireCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shuffleDir, setShuffleDir] = useState<'next' | 'prev' | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const isLockedRef = useRef(false);
  const unlockCooldownRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const isFlipping = useRef(false);
  const flipCooldown = useRef<NodeJS.Timeout | null>(null);

  const goNext = useCallback(() => {
    if (isFlipping.current) return;
    if (activeIndexRef.current < AGENTS.length - 1) {
      isFlipping.current = true;
      setShuffleDir('next');
      setActiveIndex(prev => prev + 1);
      if (flipCooldown.current) clearTimeout(flipCooldown.current);
      flipCooldown.current = setTimeout(() => {
        isFlipping.current = false;
        setShuffleDir(null);
      }, 360);
    } else {
      // Reached the end (Agent 10) — unlock and let user continue scrolling down
      setIsLocked(false);
      isLockedRef.current = false;
      document.body.style.overflow = '';
      unlockCooldownRef.current = true;
      setTimeout(() => {
        unlockCooldownRef.current = false;
      }, 1000);
    }
  }, []);

  const goPrev = useCallback(() => {
    if (isFlipping.current) return;
    if (activeIndexRef.current > 0) {
      isFlipping.current = true;
      setShuffleDir('prev');
      setActiveIndex(prev => prev - 1);
      if (flipCooldown.current) clearTimeout(flipCooldown.current);
      flipCooldown.current = setTimeout(() => {
        isFlipping.current = false;
        setShuffleDir(null);
      }, 360);
    } else {
      // Reached the beginning (Agent 1) — unlock and let user continue scrolling up
      setIsLocked(false);
      isLockedRef.current = false;
      document.body.style.overflow = '';
      unlockCooldownRef.current = true;
      setTimeout(() => {
        unlockCooldownRef.current = false;
      }, 1000);
    }
  }, []);

  // IntersectionObserver to lock scroll when the cards stage enters viewport
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
            if (isLockedRef.current || unlockCooldownRef.current) return;

            const rect = stage.getBoundingClientRect();
            if (rect.top > 0) {
              setActiveIndex(0);
            } else {
              setActiveIndex(AGENTS.length - 1);
            }
            setIsLocked(true);
            isLockedRef.current = true;
            document.body.style.overflow = 'hidden';
            stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (!entry.isIntersecting) {
            setIsLocked(false);
            isLockedRef.current = false;
            document.body.style.overflow = '';
          }
        });
      },
      { threshold: [0.45] }
    );

    observer.observe(stage);
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  // Capture wheel and touch events when section is locked
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

  const agent = AGENTS[activeIndex];
  const shuffleClass = shuffleDir === 'next'
    ? 'solitaire-shuffle-out-left'
    : shuffleDir === 'prev'
      ? 'solitaire-shuffle-out-right'
      : 'solitaire-shuffle-in';

  return (
    <section ref={sectionRef} className="solitaire-section" id="creative-roster">
      {/* Section Header (visible before scrolling into the locked card stage) */}
      <div className="solitaire-header">
        <h2 className="solitaire-title">
          Meet your <span className="solitaire-title-highlight">AI Marketing Team.</span>
        </h2>
        <p className="solitaire-subtitle">
          10 autonomous specialists working in sync to power your content engine.
        </p>
      </div>

      {/* Card Stage with Deck Stack (this stage locks to 100vh when scrolling into it) */}
      <div ref={stageRef} className="solitaire-stage">
        <div className={`solitaire-deck-stack ${isFlipping.current ? 'is-shuffling' : ''}`}>
          {/* Deck card (bottom layer) */}
          <div className="solitaire-deck-card solitaire-deck-card--bottom">
            <div className="solitaire-deck-card-pattern" />
          </div>

          {/* Deck card (middle layer) */}
          <div className="solitaire-deck-card solitaire-deck-card--middle">
            <div className="solitaire-deck-card-pattern" />
          </div>

          {/* Top Active Card */}
          <div className={`solitaire-card ${shuffleClass}`} key={agent.id} style={{ '--card-accent': agent.color } as React.CSSProperties}>
            <div className="solitaire-card-inner">

              {/* Top-left corner: logo + rank */}
              <div className="solitaire-card-corner solitaire-card-corner--tl">
                <img src="/B2PLOGO.png" alt="" className="solitaire-card-logo" draggable={false} />
                <span className="solitaire-card-rank">{agent.rank}</span>
              </div>

              {/* Full-bleed Joker-style Portrait */}
              <div className="solitaire-card-portrait">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  loading="eager"
                  draggable={false}
                />
              </div>

              {/* Name + Purpose */}
              <div className="solitaire-card-identity">
                <h3 className="solitaire-card-name">{agent.name}</h3>
                <span className="solitaire-card-purpose">{agent.purpose}</span>
              </div>

              {/* Bottom-right corner: logo + rank (inverted) */}
              <div className="solitaire-card-corner solitaire-card-corner--br">
                <img src="/B2PLOGO.png" alt="" className="solitaire-card-logo" draggable={false} />
                <span className="solitaire-card-rank">{agent.rank}</span>
              </div>

              {/* Inset decorative border */}
              <div className="solitaire-card-border-inset" />

              {/* Very subtle card surface pattern */}
              <div className="solitaire-card-surface-pattern" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
