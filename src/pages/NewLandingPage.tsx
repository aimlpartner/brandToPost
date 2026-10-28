import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, MessageCircle, Repeat2, Heart, Share2, Send, Bookmark,
  Fingerprint, Globe, PenTool, Palette, Layers, Video, Cpu, MessageSquare,
  ChevronDown, X, CheckCircle2, ArrowRight, ArrowUpRight, ThumbsUp, Mic, Zap, Check
} from 'lucide-react';
import { AGENTS_LIST, renderAgentIcon } from '../data/agentsData';
import { CloudShader } from '../components/ui/cloud-shader';

export function NewLandingPage() {
  const navigate = useNavigate();

  // 1. Rotating Word in Hero
  const words = ["consultancies.", "agencies.", "founders.", "advisors.", "studios."];
  const [wordIdx, setWordIdx] = useState(0);
  const [isWordIn, setIsWordIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsWordIn(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % words.length);
        setIsWordIn(true);
      }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, [words.length]);

  // Agents & Integrations Hamburger Dropdowns State
  const [agentsOpen, setAgentsOpen] = useState(false);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const agentsBtnRef = useRef<HTMLButtonElement>(null);
  const agentsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const integrationsDropdownRef = useRef<HTMLDivElement>(null);
  const integrationsBtnRef = useRef<HTMLButtonElement>(null);
  const integrationsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAgentsMouseEnter = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    setIntegrationsOpen(false);
    setAgentsOpen(true);
  };

  const handleAgentsMouseLeave = () => {
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    agentsTimerRef.current = setTimeout(() => {
      setAgentsOpen(false);
    }, 200);
  };

  const handleIntegrationsMouseEnter = () => {
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
    setAgentsOpen(false);
    setIntegrationsOpen(true);
  };

  const handleIntegrationsMouseLeave = () => {
    if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    integrationsTimerRef.current = setTimeout(() => {
      setIntegrationsOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        integrationsDropdownRef.current &&
        !integrationsDropdownRef.current.contains(event.target as Node) &&
        integrationsBtnRef.current &&
        !integrationsBtnRef.current.contains(event.target as Node)
      ) {
        setIntegrationsOpen(false);
      }
      if (
        agentsDropdownRef.current &&
        !agentsDropdownRef.current.contains(event.target as Node) &&
        agentsBtnRef.current &&
        !agentsBtnRef.current.contains(event.target as Node)
      ) {
        setAgentsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIntegrationsOpen(false);
        setAgentsOpen(false);
      }
    };
    if (integrationsOpen || agentsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (agentsTimerRef.current) clearTimeout(agentsTimerRef.current);
      if (integrationsTimerRef.current) clearTimeout(integrationsTimerRef.current);
    };
  }, [integrationsOpen, agentsOpen]);

  // 11 Core Integrations Directory
  const integrationsList = [
    {
      category: "Social & Professional Feeds",
      items: [
        {
          name: "LinkedIn",
          type: "Company & Personal",
          icon: <img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" className="w-5 h-5 object-contain" />,
          desc: "Multi-slide PDF carousels, text thought-leadership & founder takes"
        },
        {
          name: "X (Twitter)",
          type: "Viral Threads & Posts",
          icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
          desc: "High-hook viral threads, commentary & direct founder insights"
        },
        {
          name: "Instagram",
          type: "4:5 Visuals & Reels",
          icon: <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>,
          desc: "Layered 4:5 carousels, editorial branding & Reels video scripts"
        },
        {
          name: "Facebook",
          type: "Business Pages & Groups",
          icon: <img src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" alt="Facebook" className="w-5 h-5 object-contain" />,
          desc: "Scheduled business announcements, case studies & discussion posts"
        }
      ]
    },
    {
      category: "Video & Search Discovery",
      items: [
        {
          name: "TikTok",
          type: "9:16 Video Scripts",
          icon: <svg className="w-4.5 h-4.5 fill-[#00F2FE]" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>,
          desc: "Hook-first vertical video scripts, audio pacing & prompt directives"
        },
        {
          name: "YouTube",
          type: "Shorts & Community",
          icon: <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
          desc: "Full video storyboards, description SEO & community tab posts"
        },
        {
          name: "Pinterest",
          type: "Visual Search Pins",
          icon: <img src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" alt="Pinterest" className="w-5 h-5 object-contain" />,
          desc: "Infographic pins, visual authority assets & automated board routing"
        },
        {
          name: "Threads",
          type: "Meta Text Feeds",
          icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12.001 2c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10 5.522 0 10-4.478 10-10 0-5.523-4.478-10-10-10zm4.57 13.916c-.516.897-1.321 1.572-2.327 1.954-1.006.381-2.115.421-3.208.115-1.092-.307-2.03-.974-2.712-1.928-.683-.955-1.05-2.114-1.06-3.307.01-1.194.377-2.353 1.06-3.308.682-.954 1.62-1.621 2.712-1.928 1.093-.306 2.202-.266 3.208.115 1.006.382 1.811 1.057 2.327 1.954.148.258.06.587-.198.736-.258.148-.588.06-.736-.198-.415-.721-1.062-1.264-1.87-1.57-1.189-.452-2.527-.294-3.578.423-1.05.717-1.688 1.905-1.706 3.176.018 1.27.656 2.458 1.706 3.175 1.051.717 2.389.875 3.578.423.808-.306 1.455-.849 1.87-1.57.148-.258.478-.346.736-.198.258.149.346.478.198.736z"/></svg>,
          desc: "Micro-blogging, rapid market observations & conversational replies"
        }
      ]
    },
    {
      category: "Operations & Syndication",
      items: [
        {
          name: "WhatsApp Bot",
          type: "Voice & 1-Tap Review",
          icon: <img src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" alt="WhatsApp" className="w-5 h-5 object-contain" />,
          desc: "20s voice notes turned into posts; reply '1' to publish live instantly"
        },
        {
          name: "Reddit",
          type: "Niche Communities",
          icon: <svg className="w-5 h-5 fill-[#FF4500]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M16.5 13c0-.8-.6-1.5-1.5-1.5-.4 0-.8.2-1 .5-1-.7-2.4-1.1-3.9-1.1l.8-3.5 2.5.5c.1.6.6 1.1 1.3 1.1.7 0 1.3-.6 1.3-1.3S15.4 6.4 14.7 6.4c-.5 0-1 .3-1.2.8l-2.8-.6c-.2 0-.4.1-.5.3l-.9 4c-1.5.1-2.9.5-3.9 1.1-.3-.3-.6-.5-1-.5-.8 0-1.5.7-1.5 1.5 0 .6.4 1.1.9 1.4 0 .2 0 .4 0 .6 0 2.2 2.6 4 5.8 4s5.8-1.8 5.8-4c0-.2 0-.4 0-.6.6-.3 1.1-.8 1.1-1.4z"/></svg>,
          desc: "Zero-spam authentic value drops strictly tailored to subreddit rules"
        },
        {
          name: "Blog & Webhooks",
          type: "SEO Articles & API",
          icon: <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>,
          desc: "Long-form markdown blog articles, Ghost/WordPress feeds & webhooks"
        }
      ]
    }
  ];

  // Autonomous Agent Fleet Registry (Social Media Platform Named Agents)
  const agentFleet: Array<{
    step: string;
    role: string;
    icon: React.ReactNode;
    desc: string;
    output: string;
  }> = [
    {
      step: "01",
      role: "LinkedIn Agent",
      icon: (
        <img 
          src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" 
          alt="LinkedIn" 
          className="w-6 h-6 object-contain" 
        />
      ),
      desc: "Drafts high-authority B2B posts, multi-slide PDF carousels, and founder takeaways.",
      output: "Native B2B carousels & posts"
    },
    {
      step: "02",
      role: "X (Twitter) Agent",
      icon: (
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      ),
      desc: "Writes punchy viral threads, founder takes, contrarian hooks, and market commentary.",
      output: "Viral threads & quick takes"
    },
    {
      step: "03",
      role: "Instagram Agent",
      icon: (
        <svg className="w-6 h-6 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
      ),
      desc: "Generates high-aesthetic 4:5 visual cards, carousel decks, and platform-tailored captions.",
      output: "4:5 visual carousels & reels"
    },
    {
      step: "04",
      role: "WhatsApp Agent",
      icon: (
        <img 
          src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" 
          alt="WhatsApp" 
          className="w-6 h-6 object-contain" 
        />
      ),
      desc: "Receives your 20-second voice notes and delivers finished drafts for 1-tap mobile approval.",
      output: "1-tap mobile voice approvals"
    },
    {
      step: "05",
      role: "TikTok & Reels Agent",
      icon: (
        <svg className="w-6 h-6 fill-[#00F2FE]" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>
      ),
      desc: "Scripts fast-paced 9:16 vertical video hooks, visual B-roll cues, and voiceover prompts.",
      output: "9:16 short-form video scripts"
    },
    {
      step: "06",
      role: "YouTube Agent",
      icon: (
        <svg className="w-6 h-6 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      ),
      desc: "Structures video scripts, description metadata, and community post discussions.",
      output: "Video briefs & community posts"
    },
    {
      step: "07",
      role: "Facebook Agent",
      icon: (
        <img 
          src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" 
          alt="Facebook" 
          className="w-6 h-6 object-contain" 
        />
      ),
      desc: "Formats and schedules company updates, announcements, and visual case studies.",
      output: "Automated business page feeds"
    },
    {
      step: "08",
      role: "Pinterest Agent",
      icon: (
        <img 
          src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" 
          alt="Pinterest" 
          className="w-6 h-6 object-contain" 
        />
      ),
      desc: "Transforms insights and blog posts into high-intent search pins and visual infographics.",
      output: "Search-optimized visual pins"
    }
  ];

  // 2. Full Spectrum Production Tabs
  const suiteData = [
    {
      step: "01 / 04",
      title: "Multi-Channel Social",
      highlights: ["Native aspect ratios", "Auto-scheduled", "1-tap WhatsApp review"],
      avatar: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=160&q=80",
      brand: "kitecanine.academy",
      meta: "Copenhagen, Denmark · Audio Original",
      badge: "Instagram 4:5",
      copy: "Your puppy spots another dog across the boulevard and suddenly you're gripping a 50-pound kite on a string. 3 physical cues to reclaim focus:",
      photo: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=80",
      artTag: "Masterclass Carousel",
      artTitle: "Reactivity Thresholds in Urban Environments",
      likes: "482 likes",
      sideTitle: "Multi-channel social, in your genuine voice.",
      sideDesc: "Written, designed, and published natively to 11 platforms. Zero manual copy-pasting."
    },
    {
      step: "02 / 04",
      title: "Vector Graphic Design",
      highlights: ["Uploaded typography", "Vector brand marks", "High-res slide carousels"],
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      brand: "nordicpaws.official",
      meta: "Stockholm & Oslo · Brand Design System",
      badge: "LinkedIn & IG",
      copy: "Scandinavian minimalism meets alpine durability. Load-tested to 420kg in sub-zero conditions with zero hardware failure.",
      photo: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80",
      artTag: "Brand Typography System",
      artTitle: "Engineered for Arctic Trails",
      likes: "619 likes · 142 saves",
      sideTitle: "Layered graphic design with your exact brand rules.",
      sideDesc: "Custom vector layouts, uploaded brand fonts, and hex colors applied automatically across every asset."
    },
    {
      step: "03 / 04",
      title: "Brand Photography",
      highlights: ["Curated art direction", "Niche-specific framing", "Zero generic stock"],
      avatar: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=160&q=80",
      brand: "vanguard.realty.group",
      meta: "Dallas–Fort Worth · Commercial CRE",
      badge: "Editorial Photo",
      copy: "Class-A industrial logistics hubs are outperforming traditional office space by 3.2× across Dallas-Fort Worth this quarter.",
      photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
      artTag: "Architectural Photography",
      artTitle: "Q4 Institutional Real Estate Briefing",
      likes: "734 likes · 88 shares",
      sideTitle: "Editorial photography tailored to your niche.",
      sideDesc: "Bespoke, high-contrast visual imagery tailored to your niche aesthetics—never bland corporate stock."
    },
    {
      step: "04 / 04",
      title: "Founder Voice",
      highlights: ["Authentic first-person POV", "Dual personal & brand streams", "Zero corporate fluff"],
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      brand: "marcus.vance.cre",
      meta: "Managing Director · Apex Elevation",
      badge: "Founder Mode",
      copy: "Unpopular opinion in civil infrastructure: The fastest way to lose a municipal bid is promising an unverified timeline.",
      photo: "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=1000&q=80",
      artTag: "First-Person Thought Leadership",
      artTitle: "Why Brutal Honesty Wins 8-Figure Bids",
      likes: "1,120 likes · 194 comments",
      sideTitle: "Persona voice modeling that sounds like you.",
      sideDesc: "Separate tone calibration matching your founder heuristics and values so drafted copy reads naturally."
    }
  ];
  const [suiteTab, setSuiteTab] = useState(0);



  // Verified Operators Testimonials Deck
  const testimonialsRow1 = [
    {
      company: "Apex Elevation · Dallas",
      metric: "10× Cheaper",
      quote: "“$80/mo instead of $800 for a freelance copywriter.”",
      detail: "Inbound partner inquiries doubled in 60 days.",
      name: "Marcus Vance",
      role: "Managing Director",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      platform: "LinkedIn"
    },
    {
      company: "Nordic Paws · Copenhagen",
      metric: "Weekly Inbound",
      quote: "“Consistent organic posts now bring direct orders every week.”",
      detail: "Inbound orders in week one with zero manual design.",
      name: "Lars Lindqvist",
      role: "Founder & CEO",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      platform: "Instagram"
    },
    {
      company: "StackLogic · Berlin",
      metric: "2-Min Review",
      quote: "“Three weeks in, the manual drafting grind is completely gone.”",
      detail: "Sunday queue review takes 2 minutes on WhatsApp.",
      name: "Elena Rostova",
      role: "Co-Founder & VP Eng",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
      platform: "LinkedIn"
    },
    {
      company: "HyperScale Media · Austin",
      metric: "14 Leads / Wk",
      quote: "“Replaced an entire 3-person content team for all 8 client accounts.”",
      detail: "Clients assume we hired 4 senior copywriters.",
      name: "Devon Mitchell",
      role: "Agency Founder",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      platform: "X & LinkedIn"
    },
    {
      company: "Kuro Studio · San Francisco",
      metric: "4.8× Reach",
      quote: "“The voice cloning actually sounds like me. Zero corporate robot slop.”",
      detail: "Grew organic impressions from 40k to 230k in 90 days.",
      name: "Sarah Chen",
      role: "Head of Growth",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80",
      platform: "LinkedIn"
    }
  ];

  const testimonialsRow2 = [
    {
      company: "Veloce Labs · Zurich",
      metric: "Zero Retainers",
      quote: "“I send 30-sec voice memos while walking. Posts go live at 9 AM.”",
      detail: "Generated 3 enterprise inbound calls in the first month.",
      name: "Julian Thorne",
      role: "Technical Founder",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
      platform: "X"
    },
    {
      company: "Aura Commerce · London",
      metric: "+340% Conversions",
      quote: "“11 platforms covered effortlessly. Pinterest and Threads drove revenue.”",
      detail: "Saves our marketing lead 18 hours every single week.",
      name: "Amina Diallo",
      role: "E-Commerce Operator",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=160&q=80",
      platform: "Instagram"
    },
    {
      company: "SaaSStack · Toronto",
      metric: "92% Time Saved",
      quote: "“I used to dread Sunday night planning. Now it’s one WhatsApp tap.”",
      detail: "Our founder brand now drives 45% of pipeline.",
      name: "Kavita Patel",
      role: "Solo Builder & CEO",
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=160&q=80",
      platform: "LinkedIn"
    },
    {
      company: "Beacon AI · Barcelona",
      metric: "6.2× Engagement",
      quote: "“It captures our specific technical nuances that freelancers always missed.”",
      detail: "Top engineering breakdown reached 180k impressions organically.",
      name: "Mateo Ruiz",
      role: "Managing Partner",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
      platform: "Threads"
    },
    {
      company: "Foundry Craft · New York",
      metric: "Instant Output",
      quote: "“Visuals and copy match our brand guidelines with pinpoint precision.”",
      detail: "Published 120 posts in 30 days without a single hitch.",
      name: "Hannah Bradley",
      role: "Creative Director",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
      platform: "Multi-channel"
    }
  ];

  // 3b. Mobile Preview Posts (Instagram & LinkedIn Native App Views)
  const mobilePreviewPosts = [
    {
      id: "mob-1",
      type: "linkedin",
      authorName: "Marcus Vance",
      authorRole: "Managing Director • Apex Elevation",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      timeAgo: "3h · Public",
      copy: "We stopped manual content distribution 6 months ago.\n\n1 voice note on WhatsApp now powers 11 feeds every week. Zero agency retainers. Here is the exact autonomous architecture:",
      image: "/campaign_images/post_content_framework.jpg",
      likesText: "You and 184 others",
      stats: "28 comments • 14 reposts"
    },
    {
      id: "mob-2",
      type: "instagram",
      handle: "nordicpaws.official",
      authorAvatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=160&q=80",
      image: "/campaign_images/post_b2b_infographic.jpg",
      likesCount: "1,420 likes",
      caption: "Why traditional content agencies are obsolete. 2026 distribution is autonomous or it doesn't scale.",
      timeAgo: "2 hours ago"
    },
    {
      id: "mob-3",
      type: "linkedin",
      authorName: "Sarah Chen",
      authorRole: "Head of Growth • Kuro Studio",
      authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80",
      timeAgo: "5h · Public",
      copy: "Paid CAC is up 64% YoY across B2B SaaS.\n\nFounder-led organic authority is the only sustainable pipeline moat left. Look at the numbers:",
      image: "/campaign_images/post_cac_authority.jpg",
      likesText: "Elena Rostova and 342 others",
      stats: "46 comments • 22 reposts"
    },
    {
      id: "mob-4",
      type: "instagram",
      handle: "apex.elevation",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      image: "/campaign_images/post_playbook_carousel.jpg",
      likesCount: "2,840 likes",
      caption: "The Autonomous Founder Playbook: 1 Voice Note to 11 Native Feeds. Save this framework.",
      timeAgo: "4 hours ago"
    },
    {
      id: "mob-5",
      type: "linkedin",
      authorName: "Elena Rostova",
      authorRole: "VP Engineering • StackLogic",
      authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
      timeAgo: "1d · Public",
      copy: "Why your customer acquisition cost is bleeding while pipeline stalls. Breaking down the paid ad trap vs compound organic reach:",
      image: "/campaign_images/img_camp_gfutmcc8.png",
      likesText: "Julian Thorne and 219 others",
      stats: "31 comments • 9 reposts"
    },
    {
      id: "mob-6",
      type: "instagram",
      handle: "sterling.ops",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      image: "/campaign_images/post_viral_thread.jpg",
      likesCount: "3,912 likes",
      caption: "Stop spending 20 hours a week on social media. 3 shifts that 10x your reach automatically.",
      timeAgo: "6 hours ago"
    },
    {
      id: "mob-7",
      type: "linkedin",
      authorName: "Devon Mitchell",
      authorRole: "Founder • HyperScale Media",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      timeAgo: "2d · Public",
      copy: "We audited 28 B2B brands last week. Here are the 4 critical failure modes burning marketing bandwidth:",
      image: "/campaign_images/img_camp_3ze4z4jv.png",
      likesText: "Marcus Vance and 188 others",
      stats: "38 comments • 16 reposts"
    },
    {
      id: "mob-8",
      type: "instagram",
      handle: "nordicpaws.official",
      authorAvatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=160&q=80",
      image: "/campaign_images/img_camp_1o4vrjla.png",
      likesCount: "4,120 likes",
      caption: "Design consistency across 11 platforms. Autonomous brand guidelines in action.",
      timeAgo: "1 day ago"
    }
  ];

  // 4. Pricing Billing Toggle
  const [billingMode, setBillingMode] = useState<'monthly' | 'yearly'>('yearly');

  // 5. Accordion FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // 6. Form Handlers
  const [heroUrl, setHeroUrl] = useState('');
  const [heroBtnText, setHeroBtnText] = useState('Generate 30 Free Posts');
  const [footerUrl, setFooterUrl] = useState('');
  const [footerBtnText, setFooterBtnText] = useState('Get started');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroUrl.trim()) return;
    setHeroBtnText('Calibrating...');
    setTimeout(() => {
      navigate(`/login?mode=signup&url=${encodeURIComponent(heroUrl.trim())}`);
    }, 800);
  };

  const handleFooterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footerUrl.trim()) return;
    setFooterBtnText('Initializing...');
    setTimeout(() => {
      navigate(`/login?mode=signup&url=${encodeURIComponent(footerUrl.trim())}`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#08080C] text-slate-100 font-sans selection:bg-[#7C3AED]/30 selection:text-purple-300 overflow-x-hidden relative">
      <style>{`
        :root {
          --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        }

        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E");
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 34s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-reverse {
          display: flex;
          width: max-content;
          animation: marquee-reverse 38s linear infinite;
        }
        .animate-marquee-reverse:hover {
          animation-play-state: paused;
        }

        @keyframes stream-pulse {
          0% { stroke-dashoffset: 160; opacity: 0.15; }
          40% { opacity: 1; }
          80% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.15; }
        }
        .stream-line {
          stroke-dasharray: 24 136;
          animation: stream-pulse 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes gemini-pulse-flow {
          0% { stroke-dashoffset: 300; opacity: 0.2; }
          40% { opacity: 1; }
          80% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        .gemini-stream {
          stroke-dasharray: 45 255;
          animation: gemini-pulse-flow 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes laser-beam {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .laser-beam-fast {
          animation: laser-beam 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes node-arrival {
          0%, 65%, 100% { border-color: rgba(15, 23, 42, 0.1); transform: translateY(0); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
          78% { border-color: #7C3AED; transform: translateY(-3px); box-shadow: 0 12px 24px -6px rgba(124, 58, 237, 0.22); }
        }
        .channel-node-card {
          animation: node-arrival 2.6s infinite;
        }

        @keyframes orbit-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orbit-reverse {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes breathe-glow {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.96); }
          50% { opacity: 0.65; transform: translate(-50%, -50%) scale(1.04); }
        }
        .hero-orbit-cw {
          animation: orbit-slow 90s linear infinite;
        }
        .hero-orbit-ccw {
          animation: orbit-reverse 120s linear infinite;
        }
        .hero-halo-pulse {
          animation: breathe-glow 8s ease-in-out infinite;
        }
        .editorial-card {
          transition: transform 0.45s var(--ease-out-expo), border-color 0.35s ease;
        }
        .editorial-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* ==========================================
           NAVIGATION (Zero Pills, Pure Editorial Bar)
           ========================================== */}
      <nav id="main-nav" className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#08080C]/85 border-b border-white/[0.08] py-4 backdrop-blur-xl text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
          <div className="flex justify-between items-center">
            {/* Brand Logo */}
            <Link className="flex items-center gap-2.5 group shrink-0" to="/">
              <img src="/B2PLOGO.png" alt="BrandToPost" className="w-8 h-8 object-contain" />
              <span className="text-base tracking-tight font-semibold">BrandToPost</span>
            </Link>

            {/* Clean Text Links + Agents & Integrations Hamburger Triggers */}
            <div className="flex items-center gap-3 sm:gap-5 lg:gap-6">
              {/* Agents Dropdown Trigger */}
              <button
                ref={agentsBtnRef}
                onMouseEnter={handleAgentsMouseEnter}
                onMouseLeave={handleAgentsMouseLeave}
                onClick={() => {
                  setAgentsOpen(!agentsOpen);
                  setIntegrationsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  agentsOpen 
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]' 
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
                aria-expanded={agentsOpen}
                aria-label="Toggle agents dropdown"
              >
                <span className="tracking-tight font-medium">Agents</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${agentsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Integrations Dropdown Trigger */}
              <button
                ref={integrationsBtnRef}
                onMouseEnter={handleIntegrationsMouseEnter}
                onMouseLeave={handleIntegrationsMouseLeave}
                onClick={() => {
                  setIntegrationsOpen(!integrationsOpen);
                  setAgentsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer ${
                  integrationsOpen 
                    ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]' 
                    : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
                }`}
                aria-expanded={integrationsOpen}
                aria-label="Toggle integrations dropdown"
              >
                <span className="tracking-tight font-medium">Integrations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-white/60 ${integrationsOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <Link className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity" to="/blog">Blog</Link>
              <Link className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity hidden md:block" to="/login">Sign In</Link>
              <Link className="px-4 py-2 text-xs font-medium tracking-wide transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white whitespace-nowrap" to="/login?mode=signup">
                Start free trial
              </Link>
            </div>
          </div>

          {/* Agents Mega Dropdown Panel */}
          {agentsOpen && (
            <div
              ref={agentsDropdownRef}
              onMouseEnter={handleAgentsMouseEnter}
              onMouseLeave={handleAgentsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[680px] md:w-[780px] lg:w-[860px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"></span>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Autonomous Platform Agents</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                      8 Dedicated Engines
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Each agent specializes in platform-native algorithms, formatting, and high-retention storytelling.
                  </p>
                </div>
                <button
                  onClick={() => setAgentsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close agents menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Agents Grid (Clean Logos, Zero Boxes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 py-5">
                {AGENTS_LIST.map((agent) => (
                  <Link
                    key={agent.slug}
                    to={`/agents/${agent.slug}`}
                    onClick={() => setAgentsOpen(false)}
                    className="group/agent p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Clean Logo: No box container */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          {renderAgentIcon(agent, "w-5 h-5")}
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover/agent:text-white transition-colors" />
                      </div>
                      <h4 className="text-xs font-semibold text-white group-hover/agent:text-[#C084FC] transition-colors mb-1">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] font-mono text-[#A78BFA] mb-2">
                        {agent.role}
                      </p>
                      <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">
                        {agent.tagline}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/40 group-hover/agent:text-white/80 transition-colors">
                      <span>Explore Agent</span>
                      <span className="text-[#C084FC]">→</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Dropdown Footer CTA */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>All 8 agents synchronize with your central Brand DNA automatically</span>
                </div>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setAgentsOpen(false)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors group/cta"
                >
                  <span>Deploy all agents free</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Integrations Mega Dropdown Panel */}
          {integrationsOpen && (
            <div
              ref={integrationsDropdownRef}
              onMouseEnter={handleIntegrationsMouseEnter}
              onMouseLeave={handleIntegrationsMouseLeave}
              className="absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-2 sm:w-[720px] md:w-[840px] lg:w-[940px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 animate-in fade-in zoom-in-95 duration-200 text-left"
            >
              <div className="absolute -top-3 left-0 right-0 h-3" />
              {/* Dropdown Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                    <h3 className="text-sm font-semibold text-white tracking-tight">Direct Network Integrations</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                      11 Native Connectors
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Direct API sync with zero third-party zaps required. Schedule, format, and push live with 1 tap.
                  </p>
                </div>
                <button
                  onClick={() => setIntegrationsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close integrations menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Integrations Grid by Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-5">
                {integrationsList.map((categoryGroup, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
                      {categoryGroup.category}
                    </div>
                    <div className="space-y-2">
                      {categoryGroup.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="group/item flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-default"
                        >
                          <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-white group-hover/item:text-[#A78BFA] transition-colors">
                                {item.name}
                              </span>
                              <span className="text-[9px] font-mono text-white/40 truncate">
                                {item.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dropdown Footer CTA */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></span>
                  <span>Need custom enterprise CRM, Slack, or CMS webhooks?</span>
                </div>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setIntegrationsOpen(false)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors group/cta"
                >
                  <span>Connect all 11 platforms free</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ==========================================
           1. HERO SECTION (Centered + Orbital Halo Frame)
           ========================================== */}
      <section data-nav-theme="dark" className="relative w-full min-h-screen bg-[#08080C] text-white pt-32 pb-14 px-6 sm:px-10 lg:px-16 flex flex-col justify-between border-b border-white/10 overflow-hidden">
        
        {/* Aceternity UI Cloud Shader Procedural Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <CloudShader
            className="w-full h-full"
            speed={0.8}
            count={6}
            cloudColor="#fbf8f2"
            skyTopColor="#3876ba"
            skyBottomColor="#8cbfe8"
          />
          {/* Subtle gradient vignette to preserve contrast and seamlessly blend with dark navbar and client logo strip */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080C]/75 via-[#08080C]/25 to-[#08080C]/90 pointer-events-none" />

          {/* Ambient architectural halo pulse */}
          <div className="hero-halo-pulse absolute top-[46%] left-1/2 w-[540px] h-[540px] sm:w-[760px] sm:h-[760px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,rgba(192,132,252,0.04)_45%,transparent_70%)] blur-2xl"></div>

          <div className="hero-orbit-cw absolute top-[46%] left-1/2 w-[660px] h-[660px] sm:w-[920px] sm:h-[920px] lg:w-[1120px] lg:h-[1120px] rounded-full border border-white/[0.08]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#7C3AED] shadow-[0_0_14px_#7C3AED]"></div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#C084FC]/60"></div>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 bg-white/30"></div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-white/30"></div>
          </div>

          <div className="hero-orbit-ccw absolute top-[46%] left-1/2 w-[480px] h-[480px] sm:w-[680px] sm:h-[680px] lg:w-[820px] lg:h-[820px] rounded-full border border-dashed border-[#C084FC]/[0.15]">
            <div className="absolute top-[14%] right-[14%] w-1.5 h-1.5 bg-[#C084FC] shadow-[0_0_10px_#C084FC]"></div>
            <div className="absolute bottom-[14%] left-[14%] w-1.5 h-1.5 bg-[#7C3AED]"></div>
          </div>

          <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-5xl h-[540px] border border-white/[0.04] hidden lg:block">
            <div className="absolute -top-px -left-px w-5 h-5 border-t border-l border-[#7C3AED]/60"></div>
            <div className="absolute -top-px -right-px w-5 h-5 border-t border-r border-[#7C3AED]/60"></div>
            <div className="absolute -bottom-px -left-px w-5 h-5 border-b border-l border-[#7C3AED]/60"></div>
            <div className="absolute -bottom-px -right-px w-5 h-5 border-b border-r border-[#7C3AED]/60"></div>
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_72%)]"></div>
        </div>

        {/* Centered Main Content Stage */}
        <div className="max-w-4xl mx-auto w-full relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto py-12 lg:py-16 space-y-10">
          
          <div className="space-y-6 flex flex-col items-center w-full">
            <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-400">
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
              <span>Autonomous Social Engine · Zero Retainers</span>
              <span className="w-1.5 h-1.5 bg-[#7C3AED] inline-block"></span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-[86px] font-serif font-normal tracking-tight text-white leading-[1.01] drop-shadow-[0_4px_28px_rgba(0,0,0,0.7)]">
              Marketing for <br className="hidden sm:block" />
              <span className={`inline-block transition-all duration-300 text-[#C084FC] italic font-normal ${isWordIn ? 'opacity-100 translate-y-0 filter-none' : 'opacity-0 translate-y-3 blur-xs'}`}>
                {words[wordIdx]}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-white/90 font-light max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              Drop your URL. Get 30 posts in your exact voice, published to 11 channels automatically.
            </p>

            {/* Centered Command Input */}
            <form onSubmit={handleHeroSubmit} className="pt-2 max-w-xl w-full mx-auto">
              <div className="flex flex-col sm:flex-row items-stretch bg-[#0D0D14]/90 border border-white/15 p-1.5 transition-all duration-300 focus-within:border-[#7C3AED] shadow-[0_0_50px_rgba(124,58,237,0.14)] backdrop-blur-xl">
                <div className="flex items-center gap-2 pl-3.5 pr-1 text-slate-500">
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  <span className="text-xs font-mono text-slate-500 select-none">https://</span>
                </div>
                <input 
                  type="text" 
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="yourcompany.com" 
                  required 
                  className="flex-1 bg-transparent px-1 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-sans" 
                />
                <button type="submit" className="px-6 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 group">
                  <span>{heroBtnText}</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-400">
                <span>2-min setup</span>
                <span>·</span>
                <span>Founder + Company streams</span>
                <span>·</span>
                <span>No card required</span>
              </div>
            </form>
          </div>



        </div>

        {/* Client Logo Bar */}
        <div className="max-w-7xl mx-auto w-full relative z-10 pt-8 border-t border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between mb-5 text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            <span>2,400+ Operators</span>
            <span>1.2B+ Impressions</span>
          </div>
          
          <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex items-center gap-12 sm:gap-16 lg:gap-20 py-2">
              {[
                { name: "MINIM", src: "/MINIM-logo-primary.png", className: "h-4 sm:h-5" },
                { name: "AIMLPARTNER", src: "/aimlpartner_logo.png", className: "h-6 sm:h-7" },
                { name: "SUPERHERO GYM", src: "/superherogym_logo.png", className: "h-5 sm:h-6" },
                { name: "WEAREKNWN", src: "/weareknwn_logo.png", className: "h-4 sm:h-5" },
                { name: "AVENOIR", src: "/avenoirlogo.png", className: "h-5 sm:h-6" },
                { name: "GVRG INDUSTRIES", src: "/gvrgindustrieslogo.png", className: "h-4 sm:h-5" },
                { name: "EQUESTRIAN", src: "/equestrianlogo.png", className: "h-5 sm:h-6" },
                { name: "LOHIA TRADERS", src: "/lohiatraderslogo.png", className: "h-6 sm:h-7" },
                { name: "MINIM", src: "/MINIM-logo-primary.png", className: "h-4 sm:h-5" },
                { name: "AIMLPARTNER", src: "/aimlpartner_logo.png", className: "h-6 sm:h-7" },
                { name: "SUPERHERO GYM", src: "/superherogym_logo.png", className: "h-5 sm:h-6" },
                { name: "WEAREKNWN", src: "/weareknwn_logo.png", className: "h-4 sm:h-5" },
                { name: "AVENOIR", src: "/avenoirlogo.png", className: "h-5 sm:h-6" },
                { name: "GVRG INDUSTRIES", src: "/gvrgindustrieslogo.png", className: "h-4 sm:h-5" },
                { name: "EQUESTRIAN", src: "/equestrianlogo.png", className: "h-5 sm:h-6" },
                { name: "LOHIA TRADERS", src: "/lohiatraderslogo.png", className: "h-6 sm:h-7" },
              ].map((brand, idx) => (
                <div key={idx} className="flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                  <img
                    src={brand.src}
                    alt={brand.name}
                    className={`${brand.className} w-auto object-contain brightness-0 invert`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ==========================================
           2. HOW IT WORKS (Minimal Text, Zero Boxes, Ultra-Straightforward Vertical)
           ========================================== */}
      <section className="w-full bg-[#08080C] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#7C3AED]/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* Header: Short, straight to the point */}
          <div className="mb-14 sm:mb-16">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
              From your link to 11 live feeds. <em className="italic text-[#C084FC]">Four steps.</em>
            </h2>
          </div>

          {/* 4 Vertical Steps: Clean, Boxless, Minimal Text */}
          <div className="space-y-10 sm:space-y-12">
            
            {/* Step 01 */}
            <div className="flex items-start gap-6 sm:gap-10 group">
              <span className="text-3xl sm:text-5xl font-serif text-white/20 group-hover:text-[#C084FC] transition-colors shrink-0 font-light select-none">
                01
              </span>
              <div className="flex-1 pt-1 border-b border-white/10 pb-8 sm:pb-10">
                <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight mb-1.5">
                  Paste your link
                </h3>
                <p className="text-sm sm:text-base text-slate-400 font-light">
                  We crawl your website, docs, and positioning in 3 seconds.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>https://yourbrand.com ── Analyzed in 3.2s</span>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="flex items-start gap-6 sm:gap-10 group">
              <span className="text-3xl sm:text-5xl font-serif text-white/20 group-hover:text-[#C084FC] transition-colors shrink-0 font-light select-none">
                02
              </span>
              <div className="flex-1 pt-1 border-b border-white/10 pb-8 sm:pb-10">
                <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight mb-1.5">
                  We strategize 5 things
                </h3>
                <p className="text-sm sm:text-base text-slate-400 font-light mb-3">
                  Before writing a word, our agents extract what actually converts:
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-mono text-slate-300">
                  <span>1. Content Strategy</span>
                  <span className="text-white/20">/</span>
                  <span>2. Competitor Angles</span>
                  <span className="text-white/20">/</span>
                  <span>3. Brand DNA</span>
                  <span className="text-white/20">/</span>
                  <span>4. Buyer ICP</span>
                  <span className="text-white/20">/</span>
                  <span>5. Founder Voice Clone</span>
                </div>
              </div>
            </div>

            {/* Step 03: Autonomous Agents */}
            <div className="flex items-start gap-6 sm:gap-10 group">
              <span className="text-3xl sm:text-5xl font-serif text-white/20 group-hover:text-[#C084FC] transition-colors shrink-0 font-light select-none">
                03
              </span>
              <div className="flex-1 pt-1 border-b border-white/10 pb-8 sm:pb-10">
                <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight mb-1.5">
                  Autonomous agents craft your content
                </h3>
                <p className="text-sm sm:text-base text-slate-400 font-light mb-3">
                  Dedicated engines collaborate across every format:
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm font-mono text-slate-300">
                  <span>Copywriting</span>
                  <span className="text-white/20">/</span>
                  <span>Visual Design</span>
                  <span className="text-white/20">/</span>
                  <span>Video Scripts</span>
                  <span className="text-white/20">/</span>
                  <span>Voice Cloning</span>
                  <span className="text-white/20">/</span>
                  <span>Market Research</span>
                  <span className="text-white/20">/</span>
                  <span>Graphic Engine</span>
                </div>
              </div>
            </div>

            {/* Step 04: Omnichannel Review & Broadcast */}
            <div className="flex items-start gap-6 sm:gap-10 group">
              <span className="text-3xl sm:text-5xl font-serif text-emerald-400/40 group-hover:text-emerald-400 transition-colors shrink-0 font-light select-none">
                04
              </span>
              <div className="flex-1 pt-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1.5">
                  <h3 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                    1-Tap WhatsApp review. Live across 11 channels.
                  </h3>
                  <span className="text-emerald-400 font-mono text-sm uppercase tracking-wider font-semibold">
                    Boom, done.
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-400 font-light mb-4">
                  Review drafts on WhatsApp. Tap approve, and your content publishes simultaneously across all feeds:
                </p>

                {/* Social Media Channel Logos (Using Public Folder Assets) */}
                <div className="flex items-center gap-4 sm:gap-5 flex-wrap mb-5 pt-1">
                  <div title="LinkedIn" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" className="w-6 h-6 object-contain rounded" />
                  </div>
                  <div title="X" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <div title="Instagram" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-6 h-6 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
                  </div>
                  <div title="YouTube" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-6 h-6 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                  <div title="TikTok" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>
                  </div>
                  <div title="WhatsApp" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" alt="WhatsApp" className="w-6 h-6 object-contain" />
                  </div>
                  <div title="Facebook" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" alt="Facebook" className="w-6 h-6 object-contain rounded-full" />
                  </div>
                  <div title="Threads" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12.186 24C5.556 24 0 18.636 0 12.008 0 5.488 5.452.016 12.083 0c3.766 0 7.021 1.636 9.176 4.606l-2.47 1.796c-1.63-2.185-4.04-3.376-6.706-3.376-4.992 0-9.056 4.05-9.056 8.982 0 5.016 4.156 9.07 9.159 9.07 3.328 0 5.926-1.503 7.067-4.116.643-1.472.934-3.477.934-6.462h-8.08v-3.026h11.08c.045.54.067 1.144.067 1.796 0 3.734-.413 6.388-1.398 8.49C19.467 21.606 16.275 24 12.186 24z"/></svg>
                  </div>
                  <div title="Reddit" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <svg className="w-6 h-6 fill-[#FF4500]" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                  </div>
                  <div title="Pinterest" className="cursor-pointer transition-transform duration-200 hover:scale-110">
                    <img src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" alt="Pinterest" className="w-6 h-6 object-contain" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <a
                    href="#hero-input"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full transition-colors inline-flex items-center gap-2"
                  >
                    <span>Approve &amp; Broadcast All 11 Feeds</span>
                    <span>✓</span>
                  </a>
                  <span className="text-slate-500">Zero dashboard logins required</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           2. FULL SPECTRUM PRODUCTION (Hover Minimalist Accordion + Interactive Artboard)
           ========================================== */}
      {/* ==========================================
           2. AUTONOMOUS AGENT FLEET (Domain-Specific Specialized Engines)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">01 / Autonomous Agent Fleet</span>
              <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight leading-[1.06]">
                8 platform agents. <em className="italic text-[#C084FC]">Zero human bottlenecks.</em>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] animate-pulse"></span>
              Autonomous pipeline · LinkedIn · X · Instagram · WhatsApp · TikTok · YouTube · Facebook · Pinterest
            </p>
          </div>

          {/* 8 Autonomous Platform Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentFleet.map((agent) => (
              <div 
                key={agent.step}
                className="bg-[#0F1017]/90 border border-white/10 hover:border-[#7C3AED]/60 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] group backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0">
                      {agent.icon}
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-500 group-hover:text-[#C084FC] transition-colors">
                      {agent.step}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-serif font-normal text-white mb-2 group-hover:text-purple-200 transition-colors">
                    {agent.role}
                  </h3>
                  
                  <p className="text-xs sm:text-[13px] text-slate-400 font-light leading-relaxed">
                    {agent.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">Output</span>
                  <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{agent.output}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
           3. OMNICHANNEL DISTRIBUTION (Google Gemini Effect · BrandToPost Core in Center)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        {/* Ambient Subtle Multi-Color Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-[#7C3AED]/12 via-[#38BDF8]/8 to-[#C084FC]/12 rounded-full blur-[180px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-3">
              02 / OMNICHANNEL DISTRIBUTION
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight leading-[1.08]">
              11 channels, <em className="italic text-[#C084FC]">published at once.</em>
            </h2>
            <p className="mt-4 text-sm sm:text-base font-light text-slate-400 max-w-xl mx-auto">
              One raw voice note or insight in. Eleven platform-native formats styled, formatted, and distributed simultaneously.
            </p>
          </div>

          {/* Gemini Effect Layout: Left 5 Channels — Center BrandToPost Core — Right 6 Channels */}
          <div className="relative min-h-[640px] flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-0">
            
            {/* SVG Wave Canvas (Visible on LG screens, connects Center to all 11 nodes) */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block overflow-visible" 
              viewBox="0 0 1000 640" 
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Luminous Gradients */}
                <linearGradient id="gemini-grad-1" x1="50%" y1="50%" x2="0%" y2="8%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0A66C2" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-2" x1="50%" y1="50%" x2="0%" y2="28%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E1306C" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-3" x1="50%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-4" x1="50%" y1="50%" x2="0%" y2="72%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-5" x1="50%" y1="50%" x2="0%" y2="92%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FF0000" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="gemini-grad-6" x1="50%" y1="50%" x2="100%" y2="6%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#25D366" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-7" x1="50%" y1="50%" x2="100%" y2="24%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#1877F2" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-8" x1="50%" y1="50%" x2="100%" y2="42%">
                  <stop offset="0%" stopColor="#C084FC" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FF4500" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-9" x1="50%" y1="50%" x2="100%" y2="60%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-10" x1="50%" y1="50%" x2="100%" y2="78%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#E60023" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="gemini-grad-11" x1="50%" y1="50%" x2="100%" y2="94%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Static Neon Halo Glow Paths (Center is 500, 320) */}
              {/* Left 5 paths to x=210 */}
              <path d="M 455 320 C 370 320, 290 60, 210 60" stroke="#0A66C2" strokeWidth="6" opacity="0.12" />
              <path d="M 455 320 C 370 320, 290 190, 210 190" stroke="#E1306C" strokeWidth="6" opacity="0.12" />
              <path d="M 455 320 C 370 320, 290 320, 210 320" stroke="#FFFFFF" strokeWidth="6" opacity="0.12" />
              <path d="M 455 320 C 370 320, 290 450, 210 450" stroke="#00F2FE" strokeWidth="6" opacity="0.12" />
              <path d="M 455 320 C 370 320, 290 580, 210 580" stroke="#FF0000" strokeWidth="6" opacity="0.12" />

              {/* Right 6 paths to x=790 */}
              <path d="M 545 320 C 630 320, 710 50, 790 50" stroke="#25D366" strokeWidth="6" opacity="0.12" />
              <path d="M 545 320 C 630 320, 710 155, 790 155" stroke="#1877F2" strokeWidth="6" opacity="0.12" />
              <path d="M 545 320 C 630 320, 710 260, 790 260" stroke="#FF4500" strokeWidth="6" opacity="0.12" />
              <path d="M 545 320 C 630 320, 710 365, 790 365" stroke="#FFFFFF" strokeWidth="6" opacity="0.12" />
              <path d="M 545 320 C 630 320, 710 475, 790 475" stroke="#E60023" strokeWidth="6" opacity="0.12" />
              <path d="M 545 320 C 630 320, 710 585, 790 585" stroke="#38BDF8" strokeWidth="6" opacity="0.12" />

              {/* Static Base Faint Wireframe Paths */}
              <path d="M 455 320 C 370 320, 290 60, 210 60" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 455 320 C 370 320, 290 190, 210 190" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 455 320 C 370 320, 290 320, 210 320" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 455 320 C 370 320, 290 450, 210 450" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 455 320 C 370 320, 290 580, 210 580" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

              <path d="M 545 320 C 630 320, 710 50, 790 50" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 545 320 C 630 320, 710 155, 790 155" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 545 320 C 630 320, 710 260, 790 260" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 545 320 C 630 320, 710 365, 790 365" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 545 320 C 630 320, 710 475, 790 475" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <path d="M 545 320 C 630 320, 710 585, 790 585" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

              {/* Active Animated Traveling Laser Streams (Gemini Effect) */}
              <path d="M 455 320 C 370 320, 290 60, 210 60" stroke="url(#gemini-grad-1)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '0s' }} />
              <path d="M 455 320 C 370 320, 290 190, 210 190" stroke="url(#gemini-grad-2)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '0.4s' }} />
              <path d="M 455 320 C 370 320, 290 320, 210 320" stroke="url(#gemini-grad-3)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '0.8s' }} />
              <path d="M 455 320 C 370 320, 290 450, 210 450" stroke="url(#gemini-grad-4)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '1.2s' }} />
              <path d="M 455 320 C 370 320, 290 580, 210 580" stroke="url(#gemini-grad-5)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '1.6s' }} />

              <path d="M 545 320 C 630 320, 710 50, 790 50" stroke="url(#gemini-grad-6)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '0.2s' }} />
              <path d="M 545 320 C 630 320, 710 155, 790 155" stroke="url(#gemini-grad-7)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '0.6s' }} />
              <path d="M 545 320 C 630 320, 710 260, 790 260" stroke="url(#gemini-grad-8)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '1.0s' }} />
              <path d="M 545 320 C 630 320, 710 365, 790 365" stroke="url(#gemini-grad-9)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '1.4s' }} />
              <path d="M 545 320 C 630 320, 710 475, 790 475" stroke="url(#gemini-grad-10)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '1.8s' }} />
              <path d="M 545 320 C 630 320, 710 585, 790 585" stroke="url(#gemini-grad-11)" strokeWidth="2.5" pathLength="300" className="gemini-stream" style={{ animationDelay: '2.2s' }} />

              {/* Terminal Connection Node Dots */}
              <circle cx="210" cy="60" r="4.5" fill="#0A66C2" className="animate-pulse" />
              <circle cx="210" cy="190" r="4.5" fill="#E1306C" className="animate-pulse" />
              <circle cx="210" cy="320" r="4.5" fill="#FFFFFF" className="animate-pulse" />
              <circle cx="210" cy="450" r="4.5" fill="#00F2FE" className="animate-pulse" />
              <circle cx="210" cy="580" r="4.5" fill="#FF0000" className="animate-pulse" />

              <circle cx="790" cy="50" r="4.5" fill="#25D366" className="animate-pulse" />
              <circle cx="790" cy="155" r="4.5" fill="#1877F2" className="animate-pulse" />
              <circle cx="790" cy="260" r="4.5" fill="#FF4500" className="animate-pulse" />
              <circle cx="790" cy="365" r="4.5" fill="#FFFFFF" className="animate-pulse" />
              <circle cx="790" cy="475" r="4.5" fill="#E60023" className="animate-pulse" />
              <circle cx="790" cy="585" r="4.5" fill="#38BDF8" className="animate-pulse" />
            </svg>

            {/* LEFT COLUMN: 5 Channels */}
            <div className="w-full lg:w-[260px] flex flex-col justify-between gap-4 z-10">
              
              {/* 1. LinkedIn */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#0A66C2]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/15 border border-[#0A66C2]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" className="w-5 h-5 object-contain rounded-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>LinkedIn</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Native Carousels</div>
                </div>
              </div>

              {/* 2. Instagram */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#E1306C]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-10 h-10 rounded-lg bg-[#E1306C]/15 border border-[#E1306C]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Instagram</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Reels &amp; 4:5 Posts</div>
                </div>
              </div>

              {/* 3. X / Twitter */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-white/40 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>X (Twitter)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Viral Threads</div>
                </div>
              </div>

              {/* 4. TikTok */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#00F2FE]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-10 h-10 rounded-lg bg-[#00F2FE]/15 border border-[#00F2FE]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-[#00F2FE]" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>TikTok</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Short Video Scripts</div>
                </div>
              </div>

              {/* 5. YouTube */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#FF0000]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-10 h-10 rounded-lg bg-[#FF0000]/15 border border-[#FF0000]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>YouTube</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Shorts &amp; Community</div>
                </div>
              </div>

            </div>

            {/* CENTER: BrandToPost Logo (Pure & Iconic) */}
            <div className="relative flex flex-col items-center justify-center z-20 my-8 lg:my-0">
              
              {/* Soft Ambient Radiance Behind Logo */}
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-[#7C3AED]/35 via-[#C084FC]/25 to-[#38BDF8]/20 blur-3xl pointer-events-none"></div>
              
              {/* Subtle Concentric Pulse Rings */}
              <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-[#7C3AED]/20 animate-ping pointer-events-none" style={{ animationDuration: '4.5s' }}></div>
              <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-[#C084FC]/30 animate-pulse pointer-events-none"></div>

              {/* Just the BrandToPost Logo */}
              <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl p-1.5 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] border border-purple-300/40 shadow-[0_0_50px_rgba(124,58,237,0.5)] hover:shadow-[0_0_70px_rgba(192,132,252,0.65)] flex items-center justify-center overflow-hidden">
                  <img 
                    src="/B2PLOGO.png" 
                    alt="BrandToPost" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: 6 Channels */}
            <div className="w-full lg:w-[260px] flex flex-col justify-between gap-3.5 z-10">
              
              {/* 6. WhatsApp */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#25D366]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <img src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" alt="WhatsApp" className="w-4.5 h-4.5 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>WhatsApp</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">1-Tap Review &amp; Voice</div>
                </div>
              </div>

              {/* 7. Facebook */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#1877F2]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#1877F2]/15 border border-[#1877F2]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <img src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" alt="Facebook" className="w-4.5 h-4.5 object-contain rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Facebook</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Business Feeds</div>
                </div>
              </div>

              {/* 8. Reddit */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#FF4500]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#FF4500]/15 border border-[#FF4500]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-4.5 h-4.5 fill-[#FF4500]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M16.5 13c0-.8-.6-1.5-1.5-1.5-.4 0-.8.2-1 .5-1-.7-2.4-1.1-3.9-1.1l.8-3.5 2.5.5c.1.6.6 1.1 1.3 1.1.7 0 1.3-.6 1.3-1.3S15.4 6.4 14.7 6.4c-.5 0-1 .3-1.2.8l-2.8-.6c-.2 0-.4.1-.5.3l-.9 4c-1.5.1-2.9.5-3.9 1.1-.3-.3-.6-.5-1-.5-.8 0-1.5.7-1.5 1.5 0 .6.4 1.1.9 1.4 0 .2 0 .4 0 .6 0 2.2 2.6 4 5.8 4s5.8-1.8 5.8-4c0-.2 0-.4 0-.6.6-.3 1.1-.8 1.1-1.4z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Reddit</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Niche Community Threads</div>
                </div>
              </div>

              {/* 9. Threads */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-white/40 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M12.001 2c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10 5.522 0 10-4.478 10-10 0-5.523-4.478-10-10-10zm4.57 13.916c-.516.897-1.321 1.572-2.327 1.954-1.006.381-2.115.421-3.208.115-1.092-.307-2.03-.974-2.712-1.928-.683-.955-1.05-2.114-1.06-3.307.01-1.194.377-2.353 1.06-3.308.682-.954 1.62-1.621 2.712-1.928 1.093-.306 2.202-.266 3.208.115 1.006.382 1.811 1.057 2.327 1.954.148.258.06.587-.198.736-.258.148-.588.06-.736-.198-.415-.721-1.062-1.264-1.87-1.57-1.189-.452-2.527-.294-3.578.423-1.05.717-1.688 1.905-1.706 3.176.018 1.27.656 2.458 1.706 3.175 1.051.717 2.389.875 3.578.423.808-.306 1.455-.849 1.87-1.57.148-.258.478-.346.736-.198.258.149.346.478.198.736z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Threads</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Short Text Insights</div>
                </div>
              </div>

              {/* 10. Pinterest */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-[#E60023]/60 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-[#E60023]/15 border border-[#E60023]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <img src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" alt="Pinterest" className="w-4.5 h-4.5 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Pinterest</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">High-Intent Infographics</div>
                </div>
              </div>

              {/* 11. Medium & Blog */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0F1017]/90 border border-white/10 hover:border-white/40 hover:bg-[#141522] transition-all duration-300 shadow-xl group">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Medium &amp; Blog</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">Longform Articles</div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Trust Stat Bar */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-white font-medium">100% Native Formats</span>
              <span>· No generic cross-posting slop</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Auto-aspect ratio: 1:1, 4:5, 9:16, 16:9</span>
              <span className="text-[#C084FC]">Zero Manual Editing</span>
            </div>
          </div>

        </div>
      </section>



      {/* ==========================================
           3. AUTONOMOUS OUTPUT SHOWCASE (Auto-Moving Mobile View Marquee)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 border-b border-white/10 overflow-hidden relative">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12 sm:mb-14 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                03 / AUTONOMOUS OUTPUT SHOWCASE
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight">
                Every visual. Every thread. <em className="italic text-[#C084FC]">Engineered for authority.</em>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl font-light">
                No generic AI templates. Auto-published in native LinkedIn and Instagram mobile feeds.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Native Mobile Feeds · Zero Manual Formatting</span>
            </div>
          </div>
        </div>

        {/* Auto-moving Infinite Carousel (Moves on its own, pauses on hover) */}
        <div className="relative z-10 overflow-hidden">
          {/* Edge Gradient Masks for Smooth Infinite Fade */}
          <div className="absolute left-0 inset-y-0 w-16 sm:w-32 bg-gradient-to-r from-[#08080C] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 inset-y-0 w-16 sm:w-32 bg-gradient-to-l from-[#08080C] to-transparent z-20 pointer-events-none"></div>

          <div className="overflow-hidden flex">
            <div className="animate-marquee flex items-stretch gap-6 pl-6 hover:[animation-play-state:paused]">
              {[...mobilePreviewPosts, ...mobilePreviewPosts].map((post, idx) => (
                post.type === 'linkedin' ? (
                  /* LinkedIn Mobile Feed Card */
                  <div 
                    key={idx}
                    className="w-[320px] sm:w-[350px] shrink-0 bg-[#0F1017] border border-white/10 hover:border-[#0A66C2]/60 hover:shadow-[0_0_35px_rgba(10,102,194,0.25)] transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl select-none group"
                  >
                    {/* LinkedIn Header */}
                    <div className="p-3.5 pb-2.5 flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-semibold text-white truncate">{post.authorName}</span>
                            <span className="text-[11px] text-slate-400">· 1st</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{post.authorRole}</div>
                          <div className="text-[10px] text-slate-500">{post.timeAgo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76c.96 0 1.74.79 1.74 1.76s-.78 1.76-1.74 1.76m1.39 9.97v-8.37H5.07v8.37h2.78z"/></svg>
                        <svg className="w-4 h-4 text-slate-400 fill-current" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                      </div>
                    </div>

                    {/* Copy */}
                    <div className="px-3.5 pb-2.5 text-[12px] text-slate-200 leading-relaxed font-normal whitespace-pre-line line-clamp-2">
                      {post.copy}
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[4/5] w-full bg-black/60 overflow-hidden border-y border-white/5">
                      <img src={post.image} alt={post.authorName} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    </div>

                    {/* Reactions */}
                    <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center shrink-0">
                          <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                        <span className="truncate">{post.likesText}</span>
                      </div>
                      <span className="truncate text-slate-500 shrink-0">{post.stats}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="px-1 py-1.5 flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-1 justify-center cursor-pointer group/btn">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#0A66C2] transition-colors" />
                        <span>Like</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-1 justify-center cursor-pointer group/btn">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#0A66C2] transition-colors" />
                        <span>Comment</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-1 justify-center cursor-pointer group/btn">
                        <Repeat2 className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#0A66C2] transition-colors" />
                        <span>Repost</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex-1 justify-center cursor-pointer group/btn">
                        <Send className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#0A66C2] transition-colors" />
                        <span>Send</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Instagram Mobile Feed Card */
                  <div 
                    key={idx}
                    className="w-[320px] sm:w-[350px] shrink-0 bg-[#0F1017] border border-white/10 hover:border-[#E1306C]/60 hover:shadow-[0_0_35px_rgba(225,48,108,0.25)] transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl select-none group"
                  >
                    {/* Instagram Header */}
                    <div className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center">
                          <img src={post.authorAvatar} alt={post.handle} className="w-full h-full rounded-full object-cover border border-[#0F1017]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-white tracking-tight leading-tight">{post.handle}</div>
                          <div className="text-[10px] text-slate-400">Original audio</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[4/5] w-full bg-black/60 overflow-hidden border-y border-white/5">
                      <img src={post.image} alt={post.handle} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    </div>

                    {/* Actions */}
                    <div className="p-3 pb-2">
                      <div className="flex items-center justify-between text-slate-200 mb-2">
                        <div className="flex items-center gap-3.5">
                          <Heart className="w-5 h-5 text-slate-200 hover:text-[#E1306C] hover:fill-[#E1306C] transition-colors cursor-pointer" />
                          <MessageCircle className="w-5 h-5 text-slate-200 hover:text-white transition-colors cursor-pointer" />
                          <Send className="w-5 h-5 text-slate-200 hover:text-white transition-colors cursor-pointer" />
                        </div>
                        <Bookmark className="w-5 h-5 text-slate-200 hover:text-white transition-colors cursor-pointer" />
                      </div>

                      <div className="text-[12px] font-semibold text-white mb-1">{post.likesCount}</div>
                      <div className="text-[12px] text-slate-300 leading-snug line-clamp-2">
                        <span className="font-semibold text-white mr-1.5">{post.handle}</span>
                        <span>{post.caption}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{post.timeAgo}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Carousel Bottom Indicator */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mt-8 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span>Live Output Stream · Continuous Multi-Channel Synchronization</span>
          </div>
          <div className="hidden sm:block text-slate-500">
            Hover over any post to pause and inspect
          </div>
        </div>
      </section>



      {/* ==========================================
           FOUNDER AGENT: What it does for you (Clean Icons, Zero Emojis)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-16 sm:py-24 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[260px] bg-[#7C3AED]/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="mb-12">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
              FOUNDER AGENT
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight">
              What it does for you. <em className="italic text-[#C084FC]">Zero hours writing.</em>
            </h2>
          </div>

          {/* 3 Plain Minimal Columns (Clean SVG Icons, Zero Emojis) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pt-2">
            
            {/* Step 01 */}
            <div className="border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
              <span className="text-2xl sm:text-4xl font-serif text-white/30 font-light block mb-2 select-none">
                01
              </span>
              <h3 className="text-base sm:text-lg font-medium text-white mb-1.5">
                What you give us
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed mb-3">
                A 20-second voice note on WhatsApp while walking. Nothing else.
              </p>
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>20s WhatsApp voice note</span>
                </span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
              <span className="text-2xl sm:text-4xl font-serif text-[#C084FC]/60 font-light block mb-2 select-none">
                02
              </span>
              <h3 className="text-base sm:text-lg font-medium text-white mb-1.5">
                What the agent does
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed mb-3">
                Clones your exact voice and crafts ready-to-publish posts for LinkedIn &amp; X.
              </p>
              <div className="text-xs font-mono text-[#C084FC] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
                  <span>In your voice · Zero AI slop</span>
                </span>
              </div>
            </div>

            {/* Step 03 */}
            <div>
              <span className="text-2xl sm:text-4xl font-serif text-emerald-400/60 font-light block mb-2 select-none">
                03
              </span>
              <h3 className="text-base sm:text-lg font-medium text-white mb-1.5">
                How it goes live
              </h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed mb-3">
                Draft arrives in WhatsApp. Reply "1" or tap approve. Goes live instantly.
              </p>
              <div className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>10-second approval ── Done</span>
                </span>
              </div>
            </div>

          </div>

          {/* Quick Flow Line */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <span className="text-slate-200">Send 20s voice memo</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/30 hidden sm:inline" />
            <span className="text-slate-200">Agent crafts post in your voice</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/30 hidden sm:inline" />
            <span className="text-emerald-400 font-medium">Approve on WhatsApp in 10s ── Boom, live</span>
          </div>

        </div>
      </section>

      {/* ==========================================
           4. AUDITED PERFORMANCE (Sliding 2-Row Deck of Cards · Dark Theme)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 border-b border-white/10 overflow-hidden relative">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 mb-12 sm:mb-14 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
                VERIFIED OPERATORS
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal text-white tracking-tight">
                In their own <em className="italic text-[#C084FC]">words.</em>
              </h2>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Real operators · Unedited</span>
            </div>
          </div>
        </div>

        {/* Sliding 2-Row Deck of Cards */}
        <div className="relative z-10 space-y-6">
          {/* Edge Gradient Masks for Smooth Infinite Fade */}
          <div className="absolute left-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-r from-[#08080C] to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-l from-[#08080C] to-transparent z-20 pointer-events-none"></div>

          {/* Row 1: Sliding Left (Duplicates array for seamless loop) */}
          <div className="overflow-hidden flex">
            <div className="animate-marquee flex items-stretch gap-6 pl-6">
              {[...testimonialsRow1, ...testimonialsRow1].map((t, idx) => (
                <div
                  key={idx}
                  className="w-[360px] sm:w-[420px] shrink-0 bg-[#0F1017]/95 border border-white/10 hover:border-[#7C3AED]/50 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between shadow-xl select-none group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-4">
                      <span className="text-slate-400">{t.company}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {t.metric}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-normal leading-snug tracking-tight mb-2 group-hover:text-purple-200 transition-colors">
                      {t.quote}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {t.detail}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20" />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <svg className="w-3.5 h-3.5 fill-[#1D9BF0]" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                        </div>
                        <div className="text-[11px] text-slate-400">{t.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {t.platform}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Sliding Right / Reverse (Duplicates array for seamless loop) */}
          <div className="overflow-hidden flex">
            <div className="animate-marquee-reverse flex items-stretch gap-6 pl-6">
              {[...testimonialsRow2, ...testimonialsRow2].map((t, idx) => (
                <div
                  key={idx}
                  className="w-[360px] sm:w-[420px] shrink-0 bg-[#0F1017]/95 border border-white/10 hover:border-[#7C3AED]/50 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between shadow-xl select-none group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-4">
                      <span className="text-slate-400">{t.company}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#C084FC] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
                        {t.metric}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-normal leading-snug tracking-tight mb-2 group-hover:text-purple-200 transition-colors">
                      {t.quote}
                    </h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      {t.detail}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20" />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <svg className="w-3.5 h-3.5 fill-[#1D9BF0]" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                        </div>
                        <div className="text-[11px] text-slate-400">{t.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {t.platform}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ==========================================
           5. THE DIFFERENCE: Invisible vs. Category Authority (Clean Architectural Split)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#7C3AED]/8 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="mb-12 sm:mb-16 max-w-3xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-3">
              THE DIFFERENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white tracking-tight leading-[1.12]">
              The difference between being invisible <em className="italic text-[#C084FC]">and being everywhere.</em>
            </h2>
          </div>

          {/* Unified Architectural Split Frame */}
          <div className="border border-white/10 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-white/[0.015]">
            
            {/* Left: Without BrandToPost (Going Dark) */}
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="pb-6 border-b border-white/10 mb-8">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 block mb-2">
                    01 · WITHOUT BRANDTOPOST
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-white/90 font-normal tracking-tight">
                    Going Dark
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1.5">
                    Manual drafting · Inconsistent feeds
                  </p>
                </div>

                <ul className="space-y-5 text-sm sm:text-[15px] text-slate-300 font-light leading-relaxed">
                  <li className="flex items-start gap-3.5">
                    <span className="text-rose-400/80 font-mono text-sm shrink-0 mt-0.5 select-none">✕</span>
                    <span>Feeds go dead for weeks whenever client work gets busy</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-rose-400/80 font-mono text-sm shrink-0 mt-0.5 select-none">✕</span>
                    <span>You have great insights, but blank-page paralysis stops you</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-rose-400/80 font-mono text-sm shrink-0 mt-0.5 select-none">✕</span>
                    <span>Generic ChatGPT prompts sound robotic and hurt your reputation</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-rose-400/80 font-mono text-sm shrink-0 mt-0.5 select-none">✕</span>
                    <span>Buyers search your name, find silence, and hire competitors</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Result</span>
                <span className="text-rose-400/90 font-medium">Invisible brand · Zero inbound</span>
              </div>
            </div>

            {/* Right: With BrandToPost (Category Authority) */}
            <div className="bg-[#0F1017]/70 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="pb-6 border-b border-white/10 mb-8">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C084FC] block mb-2">
                    02 · WITH BRANDTOPOST
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
                    Category Authority
                  </h3>
                  <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live daily distribution across 11 feeds
                  </p>
                </div>

                <ul className="space-y-5 text-sm sm:text-[15px] text-slate-200 font-light leading-relaxed">
                  <li className="flex items-start gap-3.5">
                    <span className="text-emerald-400 font-mono text-sm shrink-0 mt-0.5 select-none">✓</span>
                    <span>Casual voice notes turn into sharp, high-status thought leadership</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-emerald-400 font-mono text-sm shrink-0 mt-0.5 select-none">✓</span>
                    <span>Sounds 100% like your authentic voice—never AI slop</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-emerald-400 font-mono text-sm shrink-0 mt-0.5 select-none">✓</span>
                    <span>Active daily distribution across 11 platforms simultaneously</span>
                  </li>
                  <li className="flex items-start gap-3.5">
                    <span className="text-emerald-400 font-mono text-sm shrink-0 mt-0.5 select-none">✓</span>
                    <span>Buyers search your name and find an undeniable market leader</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Result</span>
                <span className="text-emerald-400 font-medium">Category authority · Consistent dealflow</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           6. DUAL-STREAM PRESENCE (Founder on X · Brand on Instagram)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[360px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-14">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">
              06 / UNIFIED INTELLIGENCE
            </span>
            <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight leading-[1.06]">
              Your brand and your founder profile. <em className="italic text-[#C084FC]">All under one brain.</em>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 font-light max-w-2xl leading-relaxed">
              Two distinct tones. One centralized intelligence. The founder profile shares candid, first-person insights on X while your company page publishes visual brand assets on Instagram—with zero voice contamination.
            </p>
          </div>

          {/* Dual-Stream Display: Founder on X (left) + Brand on Instagram (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
            
            {/* Real X (Twitter) Preview — Direct App Template */}
            <div className="w-full flex justify-center">
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden max-w-[540px] w-full font-sans text-[15px] text-[#0f1419] shadow-2xl text-left">
                <div className="flex p-4 sm:p-5">
                  <div className="mr-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80" 
                        alt="Julia Lindholm" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center truncate">
                        <span className="font-bold hover:underline truncate text-[#0f1419]">Julia Lindholm</span>
                        <span className="text-[#536471] ml-1.5 truncate text-[14px]">@julialindholm</span>
                        <span className="text-[#536471] mx-1">·</span>
                        <span className="text-[#536471] hover:underline text-[14px]">2h</span>
                      </div>
                      <MoreHorizontal className="h-5 w-5 text-[#536471] shrink-0" />
                    </div>
                    <div className="whitespace-pre-wrap word-break break-words mb-3 text-[14px] sm:text-[15px] text-[#0f1419] leading-relaxed">
                      In our first year, I personally called every single customer who churned.
                      {"\n\n"}
                      The real problem was never our pricing—it was our confusing 4-step onboarding flow. Fix product friction before you touch price.
                    </div>
                    <div className="rounded-2xl border border-gray-200 overflow-hidden mb-3 bg-black aspect-[16/9]">
                      <img 
                        src="/campaign_images/post_content_framework.jpg" 
                        alt="Founder insight visual" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex items-center justify-between text-[#536471] max-w-md pt-1">
                      <div className="flex items-center hover:text-blue-500 transition-colors cursor-pointer group">
                        <div className="p-2 group-hover:bg-[#2583EB]/10 rounded-full">
                          <MessageCircle className="h-[18px] w-[18px]" />
                        </div>
                        <span className="text-[13px] px-1 font-mono">12</span>
                      </div>
                      <div className="flex items-center hover:text-green-500 transition-colors cursor-pointer group">
                        <div className="p-2 group-hover:bg-[#18F07A]/10 rounded-full">
                          <Repeat2 className="h-[18px] w-[18px]" />
                        </div>
                        <span className="text-[13px] px-1 font-mono">4</span>
                      </div>
                      <div className="flex items-center hover:text-pink-500 transition-colors cursor-pointer group">
                        <div className="p-2 group-hover:bg-pink-50 rounded-full">
                          <Heart className="h-[18px] w-[18px]" />
                        </div>
                        <span className="text-[13px] px-1 font-mono">48</span>
                      </div>
                      <div className="flex items-center hover:text-blue-500 transition-colors cursor-pointer group">
                        <div className="p-2 group-hover:bg-[#2583EB]/10 rounded-full">
                          <Share2 className="h-[18px] w-[18px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Instagram Preview — Direct App Template */}
            <div className="w-full flex justify-center">
              <div className="bg-white border border-gray-200 rounded-[3px] overflow-hidden max-w-[470px] w-full font-sans text-[14px] shadow-2xl text-left">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center">
                        <img src="/B2P AVATAR.png" alt="brandtopost" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <span className="ml-3 font-semibold text-[14px] text-gray-900">brandtopost</span>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-gray-900 shrink-0" />
                </div>
                
                <div className="w-full overflow-hidden bg-slate-950 aspect-[4/5] sm:aspect-square">
                  <img src="/campaign_images/post_b2b_infographic.jpg" alt="Brand visual" className="w-full h-full object-cover" />
                </div>
                
                <div className="p-3 pb-4">
                  <div className="flex items-center justify-between mb-3 text-gray-900">
                    <div className="flex items-center gap-4">
                      <Heart className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
                      <MessageCircle className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
                      <Send className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
                    </div>
                    <Bookmark className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
                  </div>
                  <div className="font-semibold text-[14px] mb-1 text-gray-900">1,024 likes</div>
                  <div className="text-[14px] text-gray-900 leading-snug">
                    <span className="font-semibold mr-2">brandtopost</span>
                    <span className="whitespace-pre-wrap text-gray-800">
                      Product Dispatch: Multi-channel scheduler now supports automated carousel vector presets across 11 platform feeds.
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500 uppercase mt-2 font-mono">1 hour ago</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
           7. SYSTEMIC COMPARISON (Workflow Shift · Dark Theme)
           ========================================== */}
      <section data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="max-w-3xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C084FC] block mb-2">07 / Workflow Shift</span>
            <h2 className="text-4xl sm:text-6xl font-serif font-normal text-white tracking-tight leading-[1.06]">
              Manual social is a second job. <em className="italic text-[#C084FC]">Put it on autopilot.</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 font-light">
              Stop losing 20+ hours every month to manual drafting, formatting, and tab switching. Let autonomous intelligence handle execution.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* The Manual Grind */}
            <div className="bg-[#0F1017] border border-white/10 p-8 sm:p-12 space-y-8 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <h3 className="text-2xl font-serif text-slate-200">The Manual Grind</h3>
                  <span className="text-xs font-mono uppercase text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">High Friction</span>
                </div>
                <ul className="mt-6 space-y-4 text-sm sm:text-base text-slate-400 font-light">
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>Sunday night blank-screen dread</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>Manual cropping across 4 tabs</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>Weeks of accidental radio silence</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>$4,000/mo agency retainers</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>Endless bi-weekly review calls</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-mono text-xs shrink-0 border border-rose-500/20">✕</span>
                    <span>Founder profile left dormant</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Result: Exhausted founders</span>
                <span className="text-rose-400">Zero pipeline compounding</span>
              </div>
            </div>

            {/* With BrandToPost */}
            <div className="bg-[#12131F] border-2 border-[#7C3AED] p-8 sm:p-12 space-y-8 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.18)] flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <h3 className="text-2xl font-serif text-white">With BrandToPost</h3>
                  <span className="text-xs font-mono uppercase text-[#C084FC] bg-[#7C3AED]/20 px-2.5 py-1 rounded border border-[#7C3AED]/40 font-semibold">Full Autopilot</span>
                </div>
                <ul className="mt-6 space-y-4 text-sm sm:text-base text-slate-200 font-normal">
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>30 custom posts queued monthly</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>11 channels formatted natively</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>Daily visibility without gaps</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>Flat $79/mo—zero contracts</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>30-second WhatsApp approvals</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs shrink-0 border border-emerald-500/20">✓</span>
                    <span>Founder + Company dual streams</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Result: Continuous visibility</span>
                <span className="text-emerald-400 font-medium">Compound inbound authority</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==========================================
           8. MARKET ECONOMICS (Clean Architectural Grid)
           ========================================== */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] block mb-2">08 / Market Economics</span>
            <h2 className="text-4xl sm:text-6xl font-serif font-normal text-slate-900 tracking-tight leading-[1.06]">
              Your entire content presence, <em className="italic text-[#7C3AED]">on autopilot.</em>
            </h2>
          </div>

          <div className="mt-12 bg-white border border-slate-900/10 overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-4 text-xs sm:text-sm">
              <div className="p-5 font-mono text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-slate-50/50">Metric</div>
              <div className="p-5 font-serif text-lg text-[#7C3AED] border-b border-slate-200 bg-[#7C3AED]/[0.04] text-center">BrandToPost</div>
              <div className="p-5 font-serif text-lg text-slate-700 border-b border-slate-200 bg-slate-50/50 text-center">Agency</div>
              <div className="p-5 font-serif text-lg text-slate-700 border-b border-slate-200 bg-slate-50/50 text-center">In-House Hire</div>

              <div className="p-5 font-medium text-slate-800 border-b border-slate-100">Monthly Cost</div>
              <div className="p-5 font-semibold text-[#7C3AED] bg-[#7C3AED]/[0.04] border-b border-slate-100 text-center font-mono">$79 / mo</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center font-mono">$3,500+ / mo</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center font-mono">$6,500+ / mo</div>

              <div className="p-5 font-medium text-slate-800 border-b border-slate-100">First Batch Live</div>
              <div className="p-5 font-semibold text-[#7C3AED] bg-[#7C3AED]/[0.04] border-b border-slate-100 text-center font-mono">2 minutes</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">3 weeks</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">2 months</div>

              <div className="p-5 font-medium text-slate-800 border-b border-slate-100">Weekly Effort</div>
              <div className="p-5 font-semibold text-[#7C3AED] bg-[#7C3AED]/[0.04] border-b border-slate-100 text-center">3 mins (WhatsApp)</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">Weekly calls</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">Daily management</div>

              <div className="p-5 font-medium text-slate-800 border-b border-slate-100">Channels</div>
              <div className="p-5 font-semibold text-[#7C3AED] bg-[#7C3AED]/[0.04] border-b border-slate-100 text-center font-mono">11 Channels</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">2–3 Channels</div>
              <div className="p-5 text-slate-500 border-b border-slate-100 text-center">2–3 Channels</div>

              <div className="p-5 font-medium text-slate-800">Commitment</div>
              <div className="p-5 font-semibold text-[#7C3AED] bg-[#7C3AED]/[0.04] text-center">Cancel anytime</div>
              <div className="p-5 text-slate-500 text-center">6-mo retainer</div>
              <div className="p-5 text-slate-500 text-center">Employment contract</div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
           9. TRANSPARENT PRICING (Sharp Architectural Cards)
           ========================================== */}
      <section id="pricing" data-nav-theme="light" className="w-full bg-[#FAF9F6] py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] block mb-2">09 / Pricing</span>
              <h2 className="text-4xl sm:text-6xl font-serif font-normal text-slate-900 tracking-tight leading-[1.06]">
                Choose your setup.
              </h2>
            </div>

            <div className="flex items-center border border-slate-900/15 bg-white self-start lg:self-auto">
              <button 
                onClick={() => setBillingMode('monthly')} 
                className={`px-5 py-2.5 text-xs font-mono transition-all cursor-pointer ${
                  billingMode === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingMode('yearly')} 
                className={`px-5 py-2.5 text-xs font-mono transition-all cursor-pointer ${
                  billingMode === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Yearly (−40%)
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Pro */}
            <div className="editorial-card bg-white border border-slate-900/10 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase">Solo Operators</div>
                <h3 className="text-3xl font-serif text-slate-900 mt-1">Pro</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-serif text-slate-900">
                    {billingMode === 'yearly' ? '$47' : '$79'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ mo</span>
                </div>
                <div className="text-[11px] text-[#7C3AED] font-mono mt-1">
                  {billingMode === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                </div>
                
                <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-600 font-light border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>1 brand profile included</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>60 post suggestions / mo</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>All 11 social channels</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>WhatsApp 1-click approvals</span></li>
                </ul>
              </div>
              <div className="pt-8 mt-8 border-t border-slate-100">
                <Link className="w-full py-3.5 border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center" to="/login?mode=signup">
                  Start Pro
                </Link>
              </div>
            </div>

            {/* Growth */}
            <div className="editorial-card bg-white border-2 border-[#7C3AED] p-8 sm:p-10 flex flex-col justify-between shadow-lg relative">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#7C3AED] font-mono uppercase font-semibold">Founder + Company</span>
                  <span className="text-[10px] font-mono uppercase text-white bg-[#7C3AED] px-2 py-0.5">Popular</span>
                </div>
                <h3 className="text-3xl font-serif text-slate-900 mt-1">Growth</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-serif text-slate-900">
                    {billingMode === 'yearly' ? '$149' : '$249'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ mo</span>
                </div>
                <div className="text-[11px] text-[#7C3AED] font-mono mt-1">
                  {billingMode === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                </div>
                
                <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-600 font-light border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>3 brand profiles included</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>300 post suggestions / mo</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>Founder + Company dual streams</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>Custom vector fonts &amp; brand presets</span></li>
                </ul>
              </div>
              <div className="pt-8 mt-8 border-t border-slate-100">
                <Link className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center" to="/login?mode=signup">
                  Start Growth
                </Link>
              </div>
            </div>

            {/* Agency */}
            <div id="agency" className="editorial-card bg-white border border-slate-900/10 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-mono uppercase">Multi-Client Roster</div>
                <h3 className="text-3xl font-serif text-slate-900 mt-1">Agency</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-serif text-slate-900">
                    {billingMode === 'yearly' ? '$299' : '$499'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ mo</span>
                </div>
                <div className="text-[11px] text-[#7C3AED] font-mono mt-1">
                  {billingMode === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                </div>
                
                <ul className="mt-8 space-y-3 text-xs sm:text-sm text-slate-600 font-light border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>10 brand profiles included</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>Unlimited post suggestions</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>White-label approval portals</span></li>
                  <li className="flex items-center gap-2.5"><span className="text-emerald-600 font-mono">✓</span><span>Multi-client analytics</span></li>
                </ul>
              </div>
              <div className="pt-8 mt-8 border-t border-slate-100">
                <Link className="w-full py-3.5 border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center" to="/agency">
                  Explore Agency OS
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==========================================
           10. FREQUENTLY ASKED QUESTIONS (Concise 1-Line Answers)
           ========================================== */}
      <section data-nav-theme="light" className="w-full bg-[#FAF9F6] py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className="lg:col-span-4 space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] block">10 / FAQ</span>
              <h2 className="text-4xl sm:text-5xl font-serif font-normal text-slate-900 tracking-tight leading-[1.08]">
                Frequently asked questions.
              </h2>
            </div>

            <div className="lg:col-span-8 divide-y divide-slate-900/10 border-y border-slate-900/10">
              
              {[
                {
                  q: "Do I need copywriting or marketing experience?",
                  a: "No. Submit your URL—BrandToPost researches, writes, designs, and schedules everything."
                },
                {
                  q: "Will the content sound authentic to my brand?",
                  a: "Yes. It indexes your site, case studies, and past writing before drafting a single line."
                },
                {
                  q: "Does this work if our following is small?",
                  a: "Especially then. Daily publishing across 11 channels is the fastest way to compound organic reach from zero."
                },
                {
                  q: "What formats does BrandToPost produce?",
                  a: "Long-form posts, threads, multi-slide carousels, vector graphics, and editorial brand photography."
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="py-5 cursor-pointer group" 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="w-full flex items-center justify-between text-left text-lg sm:text-xl font-serif text-slate-900">
                    <span className={`transition-colors ${openFaq === idx ? 'text-[#7C3AED]' : 'group-hover:text-[#7C3AED]'}`}>
                      {item.q}
                    </span>
                    <span className={`font-mono text-xl ml-4 ${openFaq === idx ? 'text-[#7C3AED]' : 'text-slate-400'}`}>
                      {openFaq === idx ? '−' : '+'}
                    </span>
                  </div>
                  {openFaq === idx && (
                    <div className="mt-2 text-sm text-slate-500 font-light leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
           11. ENGINEERING DISPATCHES (Visual Editorial Cards)
           ========================================== */}
      <section id="dispatches" data-nav-theme="light" className="w-full bg-[#FAF9F6] py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-slate-900/10">
        <div className="max-w-7xl mx-auto">
          
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7C3AED] block mb-2">10 / Dispatches</span>
            <h2 className="text-4xl sm:text-6xl font-serif font-normal text-slate-900 tracking-tight">
              The latest from BrandToPost.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <Link to="/blog" className="editorial-card bg-white border border-slate-900/10 flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="h-44 overflow-hidden bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=80" alt="Topic Prediction" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-7 space-y-2">
                  <div className="text-[10px] font-mono text-[#7C3AED] uppercase tracking-widest">Prediction</div>
                  <h3 className="text-2xl font-serif text-slate-900 group-hover:text-[#7C3AED] transition-colors">Topic Prediction Engine</h3>
                  <p className="text-xs text-slate-500 font-light">Scores buyer engagement before publishing.</p>
                </div>
              </div>
              <div className="px-7 py-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Oct 2026</span>
                <span className="text-slate-900">Read →</span>
              </div>
            </Link>

            <Link to="/blog" className="editorial-card bg-white border border-slate-900/10 flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="h-44 overflow-hidden bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80" alt="Brand Memory" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-7 space-y-2">
                  <div className="text-[10px] font-mono text-[#7C3AED] uppercase tracking-widest">Brand Memory</div>
                  <h3 className="text-2xl font-serif text-slate-900 group-hover:text-[#7C3AED] transition-colors">Brand Consistency Levels</h3>
                  <p className="text-xs text-slate-500 font-light">Sharpens tone rules with every approved post.</p>
                </div>
              </div>
              <div className="px-7 py-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Oct 2026</span>
                <span className="text-slate-900">Read →</span>
              </div>
            </Link>

            <Link to="/blog" className="editorial-card bg-white border border-slate-900/10 flex flex-col justify-between group cursor-pointer">
              <div>
                <div className="h-44 overflow-hidden bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=700&q=80" alt="WhatsApp Workflow" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-7 space-y-2">
                  <div className="text-[10px] font-mono text-[#7C3AED] uppercase tracking-widest">Mobile Workflow</div>
                  <h3 className="text-2xl font-serif text-slate-900 group-hover:text-[#7C3AED] transition-colors">WhatsApp Approval Messenger</h3>
                  <p className="text-xs text-slate-500 font-light">Approve weekly calendars in 1 tap on mobile.</p>
                </div>
              </div>
              <div className="px-7 py-4 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Oct 2026</span>
                <span className="text-slate-900">Read →</span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ==========================================
           12. FINAL CTA SECTION (Sharp Obsidian Stage)
           ========================================== */}
      <section id="cta" data-nav-theme="dark" className="w-full bg-[#08080C] text-white py-28 sm:py-40 px-6 sm:px-10 lg:px-16 border-b border-white/10 relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="text-[11px] font-mono text-[#C084FC] uppercase tracking-[0.25em]">
            Autonomous Social Distribution
          </div>
          <h2 className="text-5xl sm:text-7xl font-serif font-normal text-white tracking-tight leading-[1.04]">
            Take command of your marketing.
          </h2>

          <form onSubmit={handleFooterSubmit} className="pt-4 max-w-lg mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-stretch bg-white/[0.05] border border-white/15 p-1.5 transition-all focus-within:border-[#7C3AED]">
              <input 
                type="text" 
                value={footerUrl}
                onChange={(e) => setFooterUrl(e.target.value)}
                placeholder="yourcompany.com" 
                required 
                className="flex-1 bg-transparent px-4 py-3 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-sans" 
              />
              <button type="submit" className="px-7 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0">
                <span>{footerBtnText}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
            <p className="mt-3.5 text-[11px] font-mono text-slate-500">
              14-day free trial · 30 custom posts · No card required
            </p>
          </form>
        </div>
      </section>

      {/* ==========================================
           13. MINIMALIST FOOTER
           ========================================== */}
      <footer className="w-full bg-[#FAF9F6] py-16 px-6 sm:px-10 lg:px-16 border-t border-slate-900/10 text-slate-600 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/B2PLOGO.png" alt="BrandToPost" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-slate-900 font-sans text-sm">BrandToPost</span>
            <span className="text-slate-400">© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <Link to="/agency" className="hover:text-slate-900 transition-colors">Agency OS</Link>
            <Link to="/founder" className="hover:text-slate-900 transition-colors">Founder Studio</Link>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <Link to="/blog" className="hover:text-slate-900 transition-colors">Dispatches</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default NewLandingPage;
