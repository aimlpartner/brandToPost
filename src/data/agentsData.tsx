import React from 'react';

export interface AgentData {
  slug: string;
  name: string;
  platform: string;
  role: string;
  tagline: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroRotatingWords: string[];
  icon: string | React.ReactNode;
  iconType: 'img' | 'svg';
  iconSrc?: string;
  accentColor: string;
  accentGlow: string;
  whatIsItFor: {
    lead: string;
    description: string;
    bullets: string[];
    capabilities: Array<{
      title: string;
      desc: string;
      tag: string;
    }>;
  };
  whyShouldYouUseIt: {
    lead: string;
    description: string;
    benefits: Array<{
      metric: string;
      title: string;
      desc: string;
    }>;
    comparison: Array<{
      feature: string;
      manual: string;
      withAgent: string;
    }>;
  };
  workflowSteps: Array<{
    step: string;
    title: string;
    desc: string;
    codePreview: string;
  }>;
  sampleOutputs: Array<{
    type: string;
    title: string;
    hook: string;
    previewMeta: string;
    badge: string;
  }>;
}

export const AGENTS_LIST: AgentData[] = [
  {
    slug: "linkedin",
    name: "LinkedIn Agent",
    platform: "LinkedIn",
    role: "B2B Carousels & Authority Posts",
    tagline: "Autonomous Executive Presence, PDF Slide Decks & Founder Takes",
    heroHeadline: "LinkedIn thought leadership on autopilot for",
    heroHighlight: "B2B leaders.",
    heroSubtitle: "Drop your website link. Our LinkedIn Agent crawls your positioning, reverse-engineers buyer pain points, and drafts 30 high-authority carousels and zero-click text posts in your exact executive tone.",
    heroRotatingWords: ["founders.", "consultancies.", "agencies.", "executives.", "advisors."],
    icon: "/native-marketing-on-autopilot.svg.svg-100.Woblo.svg",
    iconType: "img",
    iconSrc: "/native-marketing-on-autopilot.svg.svg-100.Woblo.svg",
    accentColor: "#0A66C2",
    accentGlow: "rgba(10, 102, 194, 0.25)",
    whatIsItFor: {
      lead: "Engineered specifically to solve the 'silent executive' problem on professional networks.",
      description: "Top B2B decisions happen on LinkedIn, yet founders and consultancy leaders lose 10+ hours a week trying to draft thoughtful posts, or spend $6,000/month on generic ghostwriters. The LinkedIn Agent continuously turns your site updates, podcasts, and client wins into viral document carousels and commentary that establish category leadership.",
      bullets: [
        "Multi-slide PDF Document Carousels formatted for maximum swipe velocity",
        "Zero-click text posts with psychological hooks designed to avoid link penalties",
        "Founder voice clone that matches your natural vocabulary, idioms, and heuristics",
        "Algorithmic formatting: generous whitespace, mobile-first line breaks, and clear takeaways"
      ],
      capabilities: [
        {
          title: "10-Slide PDF Document Carousels",
          desc: "Automatically formats visual slide decks with crisp typography, diagrams, and takeaways that LinkedIn users love to bookmark.",
          tag: "Carousels"
        },
        {
          title: "Contrarian Industry Breakdowns",
          desc: "Identifies consensus fluff in your industry and writes sharp, evidence-backed contrarian perspectives that command respect.",
          tag: "Thought Leadership"
        },
        {
          title: "Case Study Teardowns",
          desc: "Transforms client case studies and metrics into engaging story-driven posts with structured 'Before / Action / Result' architecture.",
          tag: "Social Proof"
        },
        {
          title: "Dual-Stream Autopilot",
          desc: "Schedules and publishes directly to both your personal founder profile and company LinkedIn page.",
          tag: "Autopilot"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "High-tier authority without agency retainers or creative burnout.",
      description: "Manual posting is inconsistent, and general AI produces plastic, cringe-worthy motivational fluff. The LinkedIn Agent combines deep brand DNA grounding with LinkedIn-specific algorithmic optimization.",
      benefits: [
        {
          metric: "94%",
          title: "Time Saved Weekly",
          desc: "Cut executive drafting time from 10 hours a week to a 60-second queue review."
        },
        {
          metric: "3.4x",
          title: "Higher Carousel Reach",
          desc: "Document posts receive more dwell time and algorithmic distribution than static images or external links."
        },
        {
          metric: "$6.5k",
          title: "Monthly Retainer Saved",
          desc: "Replaces traditional ghostwriting agencies and junior social media managers with zero quality drop."
        }
      ],
      comparison: [
        {
          feature: "Creation Method",
          manual: "10+ hours staring at blank screen or $6k agency retainers",
          withAgent: "Instant crawl from your URL; 30 posts drafted in 60s"
        },
        {
          feature: "Tone of Voice",
          manual: "Generic robotic ChatGPT templates with 'In today's fast-paced world...'",
          withAgent: "Cloned Founder Persona trained on your actual sentence lengths & vocabulary"
        },
        {
          feature: "LinkedIn Carousel Output",
          manual: "Hours of manual Figma / Canva design and PDF exporting",
          withAgent: "Fully rendered multi-slide PDF carousels built natively"
        },
        {
          feature: "Publishing Workflow",
          manual: "Log in to 3 different scheduling dashboards",
          withAgent: "1-click approval and automated peak-hour scheduling"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "URL Ingestion & Positioning Crawl",
        desc: "Paste your company or profile link. The agent maps your ICP, tone, value proposition, and competitor angles in 3 seconds.",
        codePreview: "POST /api/agents/linkedin/crawl -> 100% Brand DNA Loaded"
      },
      {
        step: "02",
        title: "Carousel & Text Synthesis",
        desc: "Constructs 10-slide visual PDF decks, hook variations, and long-form thought pieces tailored to your weekly calendar.",
        codePreview: "PDF Engine: Rendered 1080x1350 Document Carousel v2.4"
      },
      {
        step: "03",
        title: "Mobile WhatsApp Delivery",
        desc: "Your phone dings with the finished post preview, carousel slides, and exact copy. No laptop needed.",
        codePreview: "WhatsApp -> Post #14 Ready: '3 Hiring Mistakes Founders Make'"
      },
      {
        step: "04",
        title: "1-Tap Live Broadcast",
        desc: "Reply '1' or tap approve. The post publishes directly to your personal LinkedIn profile and company page.",
        codePreview: "Status: 200 OK -> Published to LinkedIn Personal + Org"
      }
    ],
    sampleOutputs: [
      {
        type: "Document Carousel",
        title: "The Zero-Retention Playbook: How We Scaled Without Inbound Calls",
        hook: "Most agency founders think they need more leads. What they actually need is higher velocity proof. Here is the 7-slide framework we used...",
        previewMeta: "10 Slides · PDF Carousel · 1,420 words",
        badge: "Top Engagement Format"
      },
      {
        type: "Contrarian Text Post",
        title: "Why 'Full-Stack Marketers' Are Killing Early-Stage Startups",
        hook: "Hot take that might upset people: If you are hiring a 'generalist marketer' before $1M ARR, you are burning your runway. Here is why...",
        previewMeta: "Zero-Click Post · Mobile Spacing · 840 words",
        badge: "Viral Discussion"
      }
    ]
  },
  {
    slug: "x",
    name: "X (Twitter) Agent",
    platform: "X (Twitter)",
    role: "Viral Threads & Contrarian Takes",
    tagline: "High-Hook Viral Threads, Rapid Founder Observations & Discourse Commentary",
    heroHeadline: "X & Twitter viral reach on autopilot for",
    heroHighlight: "founders.",
    heroSubtitle: "Drop your website link. Our X Agent writes razor-sharp 8-tweet threads, contrarian industry observations, and quick founder commentary engineered for bookmarks, retweets, and algorithmic velocity.",
    heroRotatingWords: ["founders.", "operators.", "builders.", "investors.", "creators."],
    icon: "x_svg",
    iconType: "svg",
    accentColor: "#FFFFFF",
    accentGlow: "rgba(255, 255, 255, 0.2)",
    whatIsItFor: {
      lead: "Built to dominate the fast-paced, high-density intellectual discourse of X without living online.",
      description: "X rewards speed, contrarian opinions, and bookmark-dense educational threads. Most executives don't have the time to tweet 4 times a day or formulate 10-part threads. The X Agent studies your product philosophy and generates punchy, high-hook posts that position you in front of operators, tech leaders, and investors.",
      bullets: [
        "Tested hook lines designed to maximize bookmark velocity and quote-tweets",
        "Seamless thread chunking that maintains suspense and narrative flow",
        "Short-form contrarian observations and framework breakdowns",
        "Direct commentary templates for engaging under industry leaders' posts"
      ],
      capabilities: [
        {
          title: "Multi-Tweet Thread Architecture",
          desc: "Structures 6-to-10 tweet threads with strong opening hooks, numbered value points, and strong summary calls-to-action.",
          tag: "Threads"
        },
        {
          title: "Bookmark-Magnet Frameworks",
          desc: "Turns your internal SOPs, metrics, and insights into clean lists and cheat-sheets that readers save for reference.",
          tag: "Save Velocity"
        },
        {
          title: "Daily Single-Take Commentary",
          desc: "Drafts punchy single tweets that spark healthy debate without being generic or engagement-baiting.",
          tag: "Discourse"
        },
        {
          title: "Instant Queue Sync",
          desc: "Schedules optimal drop times based on your audience timezone, or fires instantly with 1 tap.",
          tag: "Scheduling"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Build an influential founder brand while focusing 100% on building your company.",
      description: "The founders who win venture funding, top talent, and enterprise deals in 2026 are vocal on X. With our X Agent, you get an elite ghostwriter that never misses a day and never dilutes your authentic voice.",
      benefits: [
        {
          metric: "4.2x",
          title: "Higher Bookmark Rate",
          desc: "Synthesizes tactical frameworks that readers instinctively save to their personal bookmarks."
        },
        {
          metric: "3x/Day",
          title: "Consistent Publishing",
          desc: "Maintains optimal algorithmic posting cadence without requiring you to open the app all day."
        },
        {
          metric: "60 Sec",
          title: "Weekly Review Time",
          desc: "Approve your entire week of daily threads and single-take posts in one click."
        }
      ],
      comparison: [
        {
          feature: "Thread Drafting",
          manual: "Hours pacing around trying to write a 10-tweet thread",
          withAgent: "Full thread generated from one link or topic in 15 seconds"
        },
        {
          feature: "Hook Quality",
          manual: "Weak openings that get scrolled past",
          withAgent: "Trained on top 0.1% viral hooks tailored to your specific niche"
        },
        {
          feature: "Time Commitment",
          manual: "Stuck reading your timeline for 2 hours every day",
          withAgent: "Review your queue in 60 seconds; completely hands-off"
        },
        {
          feature: "Repurposing",
          manual: "Manual copy-pasting and reformatting across other apps",
          withAgent: "Syndicates automatically alongside your LinkedIn and Instagram feeds"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Context & Positioning Analysis",
        desc: "Scans your website and historical takes to capture your unique contrarian thesis.",
        codePreview: "Agent Init: Voice mapped to contrarian B2B tech operator"
      },
      {
        step: "02",
        title: "Thread & Hook Generation",
        desc: "Constructs 3 high-impact hooks and maps out thread pacing with key takeaways.",
        codePreview: "Generated Thread: 8 Tweets · Hook Score: 96/100"
      },
      {
        step: "03",
        title: "Mobile Push via WhatsApp",
        desc: "You receive the full thread text formatted for mobile review with a quick approve button.",
        codePreview: "WhatsApp Notification: 'Thread: 10 Rules for Scaling Solo'"
      },
      {
        step: "04",
        title: "Direct API Publishing",
        desc: "Publishes the entire thread in order with proper intervals to maximize algorithmic reach.",
        codePreview: "X API: Tweet 1..8 Published Successfully"
      }
    ],
    sampleOutputs: [
      {
        type: "Viral Thread",
        title: "How we replaced a $20,000/mo marketing team with autonomous agents",
        hook: "Most marketing teams spend 80% of their time formatting and 20% thinking. In 2026, that equation is reversed. Here is the exact stack we built (and how you can replicate it): 🧵👇",
        previewMeta: "8 Tweets · 1,180 chars · Hook Velocity: High",
        badge: "Bookmark Magnet"
      },
      {
        type: "Contrarian Take",
        title: "The Death of Cold Outbound",
        hook: "Cold email open rates dropped 62% this year. If your growth model relies on spamming 10k prospects/day, you don't have a sales funnel—you have a reputation tax. The fix is owned brand authority.",
        previewMeta: "Single Post · 260 chars",
        badge: "Executive Take"
      }
    ]
  },
  {
    slug: "instagram",
    name: "Instagram Agent",
    platform: "Instagram",
    role: "Layered 4:5 Visuals & Editorial Decks",
    tagline: "4:5 Portrait Carousels, Editorial Quotes & Reels Video Directives",
    heroHeadline: "Editorial Instagram branding on autopilot for",
    heroHighlight: "studios.",
    heroSubtitle: "Drop your website link. Our Instagram Agent extracts your brand palette, typography, and positioning to generate high-aesthetic 4:5 swipe decks, quote cards, and Reels video briefs.",
    heroRotatingWords: ["studios.", "brands.", "creatives.", "founders.", "consultancies."],
    icon: "instagram_svg",
    iconType: "svg",
    accentColor: "#E1306C",
    accentGlow: "rgba(225, 48, 108, 0.25)",
    whatIsItFor: {
      lead: "Built for companies that need editorial-grade visual polish without maintaining a full-time design studio.",
      description: "Instagram is a visual-first credibility test. Buyers inspect your profile to evaluate whether your business looks modern, sharp, and premium. The Instagram Agent automatically layouts typography, carousel cards, and video scripts in native 4:5 mobile dimensions.",
      bullets: [
        "Native 4:5 portrait aspect ratio to occupy 100% of vertical mobile screens",
        "Layered typography and quote cards using your exact brand colors and serif styling",
        "Educational carousel frameworks built for high save and share velocity",
        "Complete formatted caption copywriting with strategic line breaks and hashtag sets"
      ],
      capabilities: [
        {
          title: "4:5 Visual Carousel Decks",
          desc: "Builds multi-slide educational carousels with clean slide numbering, progress indicators, and save triggers.",
          tag: "Carousels"
        },
        {
          title: "Editorial Quote Cards",
          desc: "Transforms founder quotes and industry data points into minimalist, typography-led visual cards.",
          tag: "Branding"
        },
        {
          title: "Reels Video Briefs",
          desc: "Delivers spoken scripts, visual overlay directions, and audio pacing guides for high-retention vertical Reels.",
          tag: "Reels"
        },
        {
          title: "Brand Style Guardrails",
          desc: "Locks down typography, border radii, and color palettes so every asset matches your website aesthetic.",
          tag: "Consistency"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "High-end creative director output without Figma bottlenecks.",
      description: "Traditional graphic designers take 4 days to deliver a carousel, and Canva templates look cheap and mass-produced. The Instagram Agent delivers bespoke, luxury-grade editorial slides in seconds.",
      benefits: [
        {
          metric: "100%",
          title: "Brand Consistency",
          desc: "Never post off-brand colors or misaligned fonts. Adheres strictly to your brand DNA."
        },
        {
          metric: "5.8x",
          title: "Higher Saves",
          desc: "Educational carousel cards trigger massive save metrics, boosting organic discovery."
        },
        {
          metric: "$0",
          title: "Design Studio Cost",
          desc: "Eliminates monthly freelance designer invoices and endless Slack feedback rounds."
        }
      ],
      comparison: [
        {
          feature: "Design Time",
          manual: "4 hours in Figma or Canva per carousel",
          withAgent: "Instant layout synthesis in 20 seconds"
        },
        {
          feature: "Aesthetic Level",
          manual: "Generic Canva templates that look like standard social media marketing",
          withAgent: "Editorial, luxury-grade minimalism with custom typography and generous whitespace"
        },
        {
          feature: "Aspect Ratio",
          manual: "Outdated 1:1 squares that waste mobile screen space",
          withAgent: "Full-bleed 4:5 portrait ratio designed for modern mobile screens"
        },
        {
          feature: "Review Process",
          manual: "Endless email threads and Google Drive links",
          withAgent: "Instant visual studio preview; 1 click to approve and schedule"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Palette & Font Extraction",
        desc: "Extracts brand colors, dark mode themes, and typography preferences directly from your site.",
        codePreview: "Extracted Theme: Pitch Black #08080C, Accent #7C3AED, Serif: EB Garamond"
      },
      {
        step: "02",
        title: "4:5 Visual Deck Rendering",
        desc: "Renders 5-to-8 slide carousels using headless layout engines with crisp typographic hierarchy.",
        codePreview: "Headless Canvas: Generated 1080x1350 PNG Suite (8 Slides)"
      },
      {
        step: "03",
        title: "Caption & Hashtag Formulation",
        desc: "Writes conversational, value-dense captions with clean formatting and targeted hashtags.",
        codePreview: "Caption: Formatted with zero spam hashtags · 320 words"
      },
      {
        step: "04",
        title: "Direct Mobile Review",
        desc: "Full carousel gallery sent to WhatsApp for instant visual swipe inspection and approval.",
        codePreview: "WhatsApp -> 8 Slides Delivered -> Tap 1 to Post"
      }
    ],
    sampleOutputs: [
      {
        type: "4:5 Visual Carousel",
        title: "The 5 Pillars of Enterprise Autonomous Marketing",
        hook: "Slide 1: If your marketing pipeline still requires 4 people to approve an image, you are moving at 2018 speed. Here are the 5 architectural shifts...",
        previewMeta: "7 Slides · 1080x1350 · Dark Luxury Theme",
        badge: "Editorial Design"
      },
      {
        type: "Typographic Quote Card",
        title: "Speed as a Brand Moat",
        hook: "The best marketing doesn't look like marketing. It looks like high-velocity conviction shared in public.",
        previewMeta: "Single 4:5 Card · Minimalist Serif",
        badge: "Save Magnet"
      }
    ]
  },
  {
    slug: "research",
    name: "Research Agent",
    platform: "Market & ICP Intelligence",
    role: "Market & ICP Trends",
    tagline: "Live Competitor Analysis, Buyer Pain-Point Mapping & Trend Extraction",
    heroHeadline: "Autonomous market & ICP research on autopilot for",
    heroHighlight: "founders.",
    heroSubtitle: "Drop your website link. Our Research Agent crawls your positioning, analyzes competitor messaging gaps, and extracts real buyer pain points to ground every post in market reality.",
    heroRotatingWords: ["founders.", "CEOs.", "consultancies.", "agencies.", "operators."],
    icon: "research_svg",
    iconType: "svg",
    accentColor: "#34D399",
    accentGlow: "rgba(52, 211, 153, 0.25)",
    whatIsItFor: {
      lead: "Built to ensure every piece of content is anchored in real buyer pain points and live market signals.",
      description: "Generic content fails because it ignores what buyers actually care about right now. The Research Agent crawls your domain, maps your ideal customer profile (ICP), identifies competitor blind spots, and feeds high-conviction angles directly into your 30-day content calendar.",
      bullets: [
        "Deep crawl of your website, product pages, case studies, and positioning",
        "Automated extraction of buyer objections, pain points, and decision triggers",
        "Competitor narrative analysis to uncover contrarian positioning gaps",
        "Continuous topic ideation mapped directly to your 30-day publishing calendar"
      ],
      capabilities: [
        {
          title: "Brand DNA & ICP Mapping",
          desc: "Extracts your exact value proposition, target buyer personas, and core differentiators in seconds.",
          tag: "Brand DNA"
        },
        {
          title: "Competitor Gap Analysis",
          desc: "Identifies overused industry clichés so your brand speaks with a distinct, contrarian perspective.",
          tag: "Positioning"
        },
        {
          title: "Pain-Point Topic Matrix",
          desc: "Generates 30 high-intent content angles tailored to questions your buyers are actively asking.",
          tag: "Strategy"
        },
        {
          title: "Live Trend Synthesis",
          desc: "Connects industry shifts directly to your product's thesis for timely authority posts.",
          tag: "Market Intel"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Never stare at a blank calendar wondering what to post about next.",
      description: "The Research Agent turns your website URL into a complete, evidence-backed 30-day content strategy in under 60 seconds.",
      benefits: [
        {
          metric: "60 Sec",
          title: "Strategy Build",
          desc: "Complete Brand DNA and 30-day topic matrix extracted from your URL."
        },
        {
          metric: "100%",
          title: "ICP Aligned",
          desc: "Every post topic targets real buyer objections and commercial intent."
        },
        {
          metric: "0 Hrs",
          title: "Manual Research",
          desc: "Replaces hours of manual competitor digging and topic brainstorming."
        }
      ],
      comparison: [
        {
          feature: "Topic Ideation",
          manual: "Hours brainstorming random topics in spreadsheets",
          withAgent: "30 strategic, buyer-aligned angles extracted from your URL in 60s"
        },
        {
          feature: "Market Grounding",
          manual: "Generic surface-level tips that sound like everyone else",
          withAgent: "Deeply grounded in your actual product positioning and ICP pain points"
        },
        {
          feature: "Competitor Differentiation",
          manual: "Repeating the same topics your competitors post",
          withAgent: "Targets narrative gaps to position your brand as the category authority"
        },
        {
          feature: "Execution Handoff",
          manual: "Static strategy decks that sit in a folder",
          withAgent: "Feeds directly into Writing & Designer Agents to build all 30 posts"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "URL & Positioning Crawl",
        desc: "Paste your website link. The agent scans your pages, value props, and case studies.",
        codePreview: "Crawl Complete: 100% Brand DNA & Product Positioning Indexed"
      },
      {
        step: "02",
        title: "ICP & Pain-Point Extraction",
        desc: "Maps your ideal buyer's core frustrations, objections, and buying triggers.",
        codePreview: "ICP Matrix: 5 Core Pain Points & 12 Contrarian Angles Identified"
      },
      {
        step: "03",
        title: "30-Day Topic Architecture",
        desc: "Builds a balanced 30-day calendar mixing authority, social proof, and educational breakdowns.",
        codePreview: "Calendar Generated: 30 High-Signal Topics Assigned to Fleet"
      },
      {
        step: "04",
        title: "Autonomous Fleet Dispatch",
        desc: "Passes briefs to the Writing, Designer, and Social Agents to generate ready-to-publish assets.",
        codePreview: "Status: 30 Native Posts & Visuals Ready for 1-Click Schedule"
      }
    ],
    sampleOutputs: [
      {
        type: "ICP Strategy Brief",
        title: "30-Day Authority Matrix & Positioning Breakdown",
        hook: "Extracted Core Thesis: 'Eliminate agency retainers with autonomous brand pipelines.' Mapped into 10 Authority Carousels, 10 Contrarian Threads, and 10 Visual Case Studies.",
        previewMeta: "Brand DNA Profile · 30 Topic Pillars · ICP Objection Map",
        badge: "Market Strategy"
      },
      {
        type: "Contrarian Angle Brief",
        title: "Competitor Blind-Spot Analysis",
        hook: "Market Gap Detected: 84% of competitors post generic tips. Recommended Angle: Publish transparent system architecture teardowns and real ROI benchmarks.",
        previewMeta: "Positioning Intelligence · High-Conversion Hook Brief",
        badge: "Competitor Intel"
      }
    ]
  },
  {
    slug: "writing",
    name: "Writing Agent",
    platform: "Voice Clone & Copy",
    role: "Founder Voice & Copywriting",
    tagline: "Cloned Founder Heuristics, High-Converting Hooks & Zero-Slop Copy",
    heroHeadline: "Executive copywriting in your exact voice for",
    heroHighlight: "founders.",
    heroSubtitle: "Drop your website link. Our Writing Agent clones your sentence cadence, vocabulary heuristics, and domain authority to write sharp, human-grade copy with zero robotic AI clichés.",
    heroRotatingWords: ["founders.", "consultancies.", "agencies.", "advisors.", "operators."],
    icon: "writing_svg",
    iconType: "svg",
    accentColor: "#C084FC",
    accentGlow: "rgba(192, 132, 252, 0.25)",
    whatIsItFor: {
      lead: "Engineered to eliminate generic 'ChatGPT slop' and mirror your authentic executive voice.",
      description: "Generic AI copy destroys brand trust with predictable phrases and plastic enthusiasm. The Writing Agent analyzes your actual speaking style, site copy, and past writing to synthesize high-authority narratives, contrarian takes, and platform-native hooks that read 100% like you.",
      bullets: [
        "Deep stylistic fingerprinting of your sentence lengths, rhythm, and vocabulary",
        "Strict anti-slop filter that bans clichés, em-dash overuse, and robotic intros",
        "Psychological hook synthesis tailored to stop B2B and executive scroll",
        "Seamless adaptation across short-form takes, threads, and long-form stories"
      ],
      capabilities: [
        {
          title: "Founder Voice Fingerprinting",
          desc: "Maps your natural idioms, tone, and conviction level so every draft sounds unmistakably written by you.",
          tag: "Voice Clone"
        },
        {
          title: "Contrarian Hook Engine",
          desc: "Crafts opening lines engineered for curiosity, authority, and high dwell time.",
          tag: "Hook Architecture"
        },
        {
          title: "Zero-Slop Guardrails",
          desc: "Strips out generic AI buzzwords and enforces crisp, editorial-grade prose.",
          tag: "Editorial"
        },
        {
          title: "Cross-Format Adaptation",
          desc: "Re-cuts a single core insight into punchy tweets, executive posts, and narrative captions.",
          tag: "Multi-Format"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Replace $6,000/month ghostwriters with an engine that actually knows your voice.",
      description: "Onboarding a human ghostwriter takes months of painful revisions. The Writing Agent calibrates from your URL and voice notes in seconds.",
      benefits: [
        {
          metric: "99%",
          title: "Voice Match",
          desc: "Calibrated directly on your linguistic patterns and domain terminology."
        },
        {
          metric: "0",
          title: "AI Clichés",
          desc: "Hard-coded negative constraints eliminate robotic phrasing."
        },
        {
          metric: "30x",
          title: "Drafting Speed",
          desc: "Turn a 20-second thought into a month of publication-ready copy."
        }
      ],
      comparison: [
        {
          feature: "Tone Accuracy",
          manual: "Generic ChatGPT prompts that sound robotic and repetitive",
          withAgent: "Custom voice DNA cloned from your real website and spoken memos"
        },
        {
          feature: "Turnaround Time",
          manual: "45 minutes staring at a blinking cursor per post",
          withAgent: "30 complete drafts generated in under 60 seconds"
        },
        {
          feature: "Cost Structure",
          manual: "$5,000+/mo retainer for a freelance ghostwriter",
          withAgent: "Autonomous 24/7 copy engine included in your stack"
        },
        {
          feature: "Revision Loop",
          manual: "Endless Google Doc comment threads",
          withAgent: "Tweak hooks inline in one click and auto-schedule"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Linguistic DNA Extraction",
        desc: "Crawls your website and voice notes to map vocabulary, cadence, and core arguments.",
        codePreview: "Voice DNA: Cadence=Direct · Formality=Executive · SlopFilter=Strict"
      },
      {
        step: "02",
        title: "Thesis & Hook Synthesis",
        desc: "Structures high-conviction angles and 3 scroll-stopping hooks per topic.",
        codePreview: "Drafted 3 Hook Variants -> Selected Highest Curiosity Score (9.4/10)"
      },
      {
        step: "03",
        title: "Editorial Refinement",
        desc: "Formats line breaks, pacing, and takeaways for effortless mobile reading.",
        codePreview: "Copy Engine: 1,180 chars · 0 Clichés Detected · Ready"
      },
      {
        step: "04",
        title: "WhatsApp Review & Dispatch",
        desc: "Sends finished copy to your phone for instant 1-tap approval.",
        codePreview: "WhatsApp -> Reply '1' to Approve & Broadcast"
      }
    ],
    sampleOutputs: [
      {
        type: "Executive Narrative",
        title: "Why We Fired Our Retainer Agency",
        hook: "We spent $42,000 on a B2B content agency last year. They delivered 4 PDFs nobody read and 12 posts that sounded like a press release. Here is what we built instead...",
        previewMeta: "Founder Voice · 980 chars · High-Conviction Tone",
        badge: "Voice Clone"
      },
      {
        type: "Framework Breakdown",
        title: "The 3-Part Architecture of Inbound Authority",
        hook: "Most founders treat content like a lottery ticket. Top operators treat it like product engineering. Here are the 3 systems that compound...",
        previewMeta: "Structured Copy · Mobile Spacing · Zero Fluff",
        badge: "Authority Copy"
      }
    ]
  },
  {
    slug: "designer",
    name: "Designer Agent",
    platform: "Visual & Brand Engine",
    role: "Brand Visuals & Slide Decks",
    tagline: "Automated Typography, Custom Brand Carousels & Editorial Social Graphics",
    heroHeadline: "Bespoke brand design & carousels on autopilot for",
    heroHighlight: "modern teams.",
    heroSubtitle: "Drop your website link. Our Designer Agent extracts your color palette, typography, and logos to render studio-grade carousels, infographics, and 4:5 visual cards automatically.",
    heroRotatingWords: ["modern teams.", "agencies.", "founders.", "studios.", "brands."],
    icon: "designer_svg",
    iconType: "svg",
    accentColor: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.25)",
    whatIsItFor: {
      lead: "Engineered to replace hours of manual Figma and Canva pixel-pushing.",
      description: "Great copy needs thumb-stopping visuals, but hiring designers or spending hours in Canva slows down publishing. The Designer Agent automatically pulls your brand colors, fonts, and visual identity to render multi-slide carousels, infographic diagrams, and editorial cards.",
      bullets: [
        "Automatic extraction of your exact hex palette, typography, and brand marks",
        "Multi-slide 1080x1350 carousels and 1:1 / 4:5 / 9:16 social artboards",
        "High-contrast editorial layouts with zero cheap stock-template look",
        "Instant headless browser rendering into crisp, publication-ready PNGs & PDFs"
      ],
      capabilities: [
        {
          title: "Brand Identity Sync",
          desc: "Lock in your exact brand colors, fonts, and logo placement across every visual asset.",
          tag: "Brand DNA"
        },
        {
          title: "Multi-Slide Carousel Builder",
          desc: "Designs cohesive 7-to-10 slide educational decks with visual progression.",
          tag: "Carousels"
        },
        {
          title: "Data & Workflow Infographics",
          desc: "Turns complex processes and comparisons into clean architectural diagrams.",
          tag: "Infographics"
        },
        {
          title: "Multi-Ratio Auto-Resize",
          desc: "Renders native 4:5, 1:1, 16:9, and 9:16 formats simultaneously.",
          tag: "Adaptive Layout"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Studio-quality visual consistency without waiting on a design queue.",
      description: "Every post gets a custom-engineered visual that looks like it came from an in-house creative director.",
      benefits: [
        {
          metric: "100%",
          title: "On-Brand",
          desc: "Strict adherence to your typography, palette, and layout grid."
        },
        {
          metric: "4 Ratios",
          title: "Auto-Rendered",
          desc: "Simultaneous output for LinkedIn PDFs, Instagram 4:5, X 16:9, and Stories."
        },
        {
          metric: "0 Hrs",
          title: "In Canva/Figma",
          desc: "Completely autonomous layout composition and high-res export."
        }
      ],
      comparison: [
        {
          feature: "Design Workflow",
          manual: "2 hours dragging boxes in Canva or waiting 4 days on a designer",
          withAgent: "Rendered automatically alongside your post copy in seconds"
        },
        {
          feature: "Visual Consistency",
          manual: "Random templates that clash with your website aesthetic",
          withAgent: "Unified design system calibrated to your exact brand DNA"
        },
        {
          feature: "Aspect Ratios",
          manual: "Manually resizing and fixing broken text across platforms",
          withAgent: "Native 1:1, 4:5, 9:16, and 16:9 artboards generated at once"
        },
        {
          feature: "Cost",
          manual: "$3,500/mo design subscription or freelance bills",
          withAgent: "Unlimited automated visual rendering included"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Brand Palette & Font Crawl",
        desc: "Extracts your primary/secondary hex codes, font pairings, and logo mark.",
        codePreview: "Brand Tokens: #08080C · #7C3AED · Font: Inter Tight / Serif"
      },
      {
        step: "02",
        title: "Artboard Composition",
        desc: "Selects optimal layout grid, visual hierarchy, and diagrammatic elements.",
        codePreview: "Layout Engine: 8-Slide Carousel + 4:5 Hero Card Composed"
      },
      {
        step: "03",
        title: "High-Res Vector & PNG Render",
        desc: "Renders crisp 2x retina graphics and multi-page PDF decks.",
        codePreview: "Render Lock: Exported 1080x1350 @2x PNGs in 1.8s"
      },
      {
        step: "04",
        title: "Attached to Drafts",
        desc: "Delivers finished visuals straight to WhatsApp with your copy.",
        codePreview: "WhatsApp -> Visual + Copy Package Ready for 1-Tap Publish"
      }
    ],
    sampleOutputs: [
      {
        type: "System Architecture Graphic",
        title: "How 1 Voice Note Becomes 30 Native Assets",
        hook: "Dark-mode architectural flowchart contrasting legacy $6k/mo agencies against autonomous multi-channel pipelines.",
        previewMeta: "1080x1350 · Vector Diagram · Brand Palette Applied",
        badge: "Visual Card"
      },
      {
        type: "Executive Carousel Deck",
        title: "The 2026 B2B Distribution Playbook",
        hook: "8-slide minimalist editorial deck with custom typography, metric callouts, and branded footer.",
        previewMeta: "8 Slides · Multi-Page PDF + Instagram Carousel",
        badge: "Carousel Deck"
      }
    ]
  },
  {
    slug: "blog",
    name: "Blog & SEO Agent",
    platform: "Editorial & Search",
    role: "SEO Articles & Newsletters",
    tagline: "Search-Ranked Long-Form Articles, Pillar Guides & Automated CMS Publishing",
    heroHeadline: "Compounding SEO articles & newsletters on autopilot for",
    heroHighlight: "category leaders.",
    heroSubtitle: "Drop your website link. Our Blog & SEO Agent researches high-intent buyer keywords, structures deep technical articles in your brand voice, and publishes directly to your CMS.",
    heroRotatingWords: ["category leaders.", "SaaS teams.", "consultancies.", "founders.", "publishers."],
    icon: "blog_svg",
    iconType: "svg",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.25)",
    whatIsItFor: {
      lead: "Engineered to capture high-intent organic search and AI answer engine citations.",
      description: "Social feeds create immediate awareness, but long-form SEO articles and newsletters build permanent search equity. The Blog Agent turns your product insights and voice memos into 1,800-word authoritative guides optimized for both Google Search and AI search engines.",
      bullets: [
        "High-intent keyword targeting focused on bottom-of-funnel buyer questions",
        "Structured H2/H3 hierarchy, comparison tables, and FAQ schema blocks",
        "Written in your authentic domain voice with real examples—not generic SEO filler",
        "Direct webhook publishing to WordPress, Ghost, Webflow, or custom markdown feeds"
      ],
      capabilities: [
        {
          title: "Search & GEO Optimization",
          desc: "Structured to rank on Google and get cited by ChatGPT, Perplexity, and Gemini.",
          tag: "SEO + GEO"
        },
        {
          title: "Deep Pillar Articles",
          desc: "Writes comprehensive 1,500–2,500 word breakdowns with diagrams and takeaways.",
          tag: "Long-Form"
        },
        {
          title: "Newsletter Synthesis",
          desc: "Formats companion weekly email editions ready for Substack, Beehiiv, or Resend.",
          tag: "Newsletter"
        },
        {
          title: "Direct CMS Webhooks",
          desc: "Pushes formatted HTML/Markdown with meta tags and OG images straight to your blog.",
          tag: "Auto-Publish"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Own your industry's search keywords without paying $500 per article.",
      description: "Turn every product update and founder insight into a permanent, search-indexed asset on your domain.",
      benefits: [
        {
          metric: "2,000+",
          title: "Words / Guide",
          desc: "In-depth, structured articles with real domain authority."
        },
        {
          metric: "100%",
          title: "CMS Synced",
          desc: "Auto-formatted with meta descriptions, slugs, and header hierarchy."
        },
        {
          metric: "24/7",
          title: "Organic Inbound",
          desc: "Compounding search traffic that converts high-intent buyers."
        }
      ],
      comparison: [
        {
          feature: "Article Quality",
          manual: "Cheap SEO writers producing unreadable keyword-stuffed fluff",
          withAgent: "Grounded in your actual product DNA and executive insights"
        },
        {
          feature: "Formatting & Schema",
          manual: "Hours manually formatting H2s, tables, and meta tags in CMS",
          withAgent: "Complete Markdown/HTML with SEO metadata delivered automatically"
        },
        {
          feature: "Social Syndication",
          manual: "Blog posts sit on your site with zero social promotion",
          withAgent: "Automatically sliced into LinkedIn carousels, X threads & pins"
        },
        {
          feature: "Cost per Article",
          manual: "$400–$800 per freelance technical article",
          withAgent: "Unlimited long-form editorial output included"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Search Intent & Gap Mapping",
        desc: "Identifies high-converting buyer queries and competitor content gaps.",
        codePreview: "Target Keyword: 'autonomous b2b content workflow' · Intent: High"
      },
      {
        step: "02",
        title: "Outline & Deep Drafting",
        desc: "Synthesizes a 2,000-word article with H2/H3 structure, tables, and key takeaways.",
        codePreview: "Draft Complete: 2,140 words · 6 Sections · FAQ Schema Included"
      },
      {
        step: "03",
        title: "WhatsApp Summary Approval",
        desc: "Sends article title, outline, and preview link to your WhatsApp for quick sign-off.",
        codePreview: "WhatsApp -> Article Ready: 'The 2026 B2B Content Stack'"
      },
      {
        step: "04",
        title: "CMS & Social Syndication",
        desc: "Publishes live to your blog and dispatches companion social threads.",
        codePreview: "Webhook 200 OK -> Live at /blog/2026-b2b-content-stack"
      }
    ],
    sampleOutputs: [
      {
        type: "Pillar SEO Guide",
        title: "Autonomous Marketing Systems vs. Traditional Retainer Agencies: 2026 Benchmark",
        hook: "An exhaustive breakdown of cost-per-asset, publishing velocity, and pipeline attribution across 140 B2B organizations...",
        previewMeta: "2,200 Words · Comparison Tables · SEO Meta Included",
        badge: "Search Pillar"
      },
      {
        type: "Founder Newsletter Issue",
        title: "Issue #42: Why Speed of Distribution Beats Perfection",
        hook: "In this week's deep dive, we look at why the fastest-growing consultancies publish 5x more frequently by removing desktop bottlenecks...",
        previewMeta: "1,100 Words · Newsletter Edition · 48% Avg Open Rate",
        badge: "Newsletter"
      }
    ]
  },
  {
    slug: "video",
    name: "Video Script Agent",
    platform: "TikTok, Reels & YouTube",
    role: "9:16 Video Scripts & Hooks",
    tagline: "Retention-Engineered 9:16 Video Scripts, Audio Pacing & B-Roll Shot Lists",
    heroHeadline: "Short-form & YouTube video scripts on autopilot for",
    heroHighlight: "creators.",
    heroSubtitle: "Drop your website link. Our Video Script Agent writes retention-optimized 30-to-60 second vertical scripts and YouTube briefs with visual hooks, on-screen text cues, and B-roll directions.",
    heroRotatingWords: ["creators.", "founders.", "brands.", "advisors.", "educators."],
    icon: "video_svg",
    iconType: "svg",
    accentColor: "#F59E0B",
    accentGlow: "rgba(245, 158, 11, 0.25)",
    whatIsItFor: {
      lead: "Built for founders and brands that want massive organic reach through video without scripting bottlenecks.",
      description: "Video is the fastest way to reach net-new audiences across TikTok, Reels, and YouTube Shorts, but scriptwriting requires specialized pacing. The Video Script Agent maps out 3-second hook variations, on-screen graphics, spoken scripts, and B-roll cues optimized for watch-time algorithms.",
      bullets: [
        "First 3-second visual and verbal hook formulas that stop the infinite scroll",
        "Side-by-side teleprompter script and visual B-roll direction",
        "Paced for high completion rates (55-70% target watch-through)",
        "Ready-to-use AI video generation prompts for Runway, Luma, and Sora"
      ],
      capabilities: [
        {
          title: "3-Second Hook Architecture",
          desc: "Generates 3 alternative opening lines and physical visual actions to hook viewers immediately.",
          tag: "Hook Engine"
        },
        {
          title: "B-Roll Shot Directives",
          desc: "Provides clear filming instructions and on-screen text overlay cues.",
          tag: "Production"
        },
        {
          title: "Teleprompter Ready",
          desc: "Formatted directly for mobile teleprompter apps with natural spoken cadence.",
          tag: "Delivery"
        },
        {
          title: "YouTube & Shorts Sync",
          desc: "Generates both 60s vertical scripts and structured YouTube chapter outlines.",
          tag: "Multi-Video"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Scale your video presence without hiring expensive scriptwriters or video strategists.",
      description: "Our agent writes hook-first, retention-backed scripts that keep viewers watching until the final frame.",
      benefits: [
        {
          metric: "68%",
          title: "Avg Watch Through",
          desc: "Optimized pacing keeps viewers engaged past the critical 30-second mark."
        },
        {
          metric: "3 Hooks",
          title: "Per Script",
          desc: "Test multiple opening hooks without re-writing the core body of the video."
        },
        {
          metric: "15 Min",
          title: "Weekly Filming",
          desc: "Read off the teleprompter script in one take. No editing guesswork needed."
        }
      ],
      comparison: [
        {
          feature: "Script Structure",
          manual: "Wandering, rambling monologues with no clear hook",
          withAgent: "Hook (0-3s) -> Tension (3-12s) -> Value (12-40s) -> CTA (40-50s)"
        },
        {
          feature: "Filming Guidance",
          manual: "Unsure what to show on screen while speaking",
          withAgent: "Explicit shot-by-shot B-roll suggestions and text cues"
        },
        {
          feature: "Voice Naturalness",
          manual: "Stiff robotic corporate script that feels unnatural to speak",
          withAgent: "Conversational cadence calibrated to your natural speaking rhythm"
        },
        {
          feature: "Multi-Platform Export",
          manual: "Separate writing for TikTok vs Reels vs YouTube Shorts",
          withAgent: "Single master script optimized for all short-form video feeds"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Topic & Hook Extraction",
        desc: "Identifies the highest-curiosity angles from your website or voice memo.",
        codePreview: "Topic Extracted: 'The hidden cost of manual agency reporting'"
      },
      {
        step: "02",
        title: "9:16 Pacing & Scripting",
        desc: "Structures 3-second hook, spoken narration, and visual cuts.",
        codePreview: "Script: 45s Duration · 140 words · 3 Visual Cut Directives"
      },
      {
        step: "03",
        title: "Delivery to Phone",
        desc: "Script arrives on WhatsApp formatted for teleprompter apps.",
        codePreview: "WhatsApp -> Script Delivered with Teleprompter Spacing"
      },
      {
        step: "04",
        title: "Publish Video Asset",
        desc: "Upload clip or AI render; the agent supplies captions, tags, and titles.",
        codePreview: "Video API: Reels, TikTok & Shorts metadata synchronized"
      }
    ],
    sampleOutputs: [
      {
        type: "9:16 Video Script",
        title: "Why 90% of Agencies Never Break $50k/mo",
        hook: "[VISUAL: Pointing at screen showing chaotic spreadsheet] Verbal: 'If you want to know why agency owners work 70 hours a week, look at this exact number...'",
        previewMeta: "48s Script · Teleprompter Ready · 3 Visual Cues",
        badge: "Short-Form Video"
      },
      {
        type: "Product Teardown Reel",
        title: "We rebuilt our client workflow in 48 hours",
        hook: "[VISUAL: Fast-paced screen recording] Verbal: 'We deleted 80% of manual steps last Tuesday. Here is what happened next...'",
        previewMeta: "42s Script · B-Roll Shot List Included",
        badge: "Product Reel"
      }
    ]
  }
];

export const EXTRA_AGENTS_LIST: AgentData[] = [
  {
    slug: "tiktok",
    name: "TikTok & Reels Agent",
    platform: "TikTok & Reels",
    role: "9:16 Video Scripts & Hook Storyboards",
    tagline: "Retention-Engineered 9:16 Video Scripts, Audio Pacing & B-Roll Shot Lists",
    heroHeadline: "Short-form vertical video scripts on autopilot for",
    heroHighlight: "creators.",
    heroSubtitle: "Drop your website link. Our TikTok & Reels Agent writes retention-optimized 30-to-60 second scripts with visual hooks, on-screen text cues, and B-roll suggestions designed for algorithmic completion rates.",
    heroRotatingWords: ["creators.", "founders.", "brands.", "advisors.", "educators."],
    icon: "tiktok_svg",
    iconType: "svg",
    accentColor: "#00F2FE",
    accentGlow: "rgba(0, 242, 254, 0.25)",
    whatIsItFor: {
      lead: "Built for founders and brands that want massive organic reach through short-form video without being cringey.",
      description: "Short-form video is the single fastest way to reach net-new audiences, but scriptwriting requires specialized pacing.",
      bullets: [
        "First 3-second visual and verbal hook formulas that stop the infinite scroll",
        "Side-by-side teleprompter script and visual B-roll direction",
        "Paced for high completion rates (55-70% target watch-through)",
        "On-screen text overlay prompts that drive curiosity and engagement"
      ],
      capabilities: [
        { title: "3-Second Hook Architecture", desc: "Generates 3 alternative opening lines to hook viewers.", tag: "Hook Engine" },
        { title: "B-Roll Shot Directives", desc: "Provides clear filming instructions and visual cues.", tag: "Production" },
        { title: "Teleprompter Ready", desc: "Formatted directly for teleprompter apps.", tag: "Delivery" },
        { title: "AI Video Prompt Generator", desc: "Includes prompts ready for Runway, Luma, or Sora.", tag: "AI Video" }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Scale your video presence without hiring expensive scriptwriters.",
      description: "Hook-first, retention-backed scripts that keep viewers watching until the last frame.",
      benefits: [
        { metric: "68%", title: "Avg Watch Through", desc: "Optimized pacing keeps viewers engaged." },
        { metric: "3 Hooks", title: "Per Script", desc: "Test multiple opening hooks effortlessly." },
        { metric: "15 Min", title: "Weekly Filming Time", desc: "Read off the teleprompter script in one take." }
      ],
      comparison: [
        { feature: "Script Structure", manual: "Wandering monologues", withAgent: "Hook -> Conflict -> Value -> CTA" }
      ]
    },
    workflowSteps: [
      { step: "01", title: "Website Synthesis", desc: "Identifies high-curiosity angles.", codePreview: "Topic Extracted" },
      { step: "02", title: "Hook Pacing", desc: "Structures 3-second hook and narration.", codePreview: "Script: 45s Duration" },
      { step: "03", title: "Delivery to Phone", desc: "Arrives on WhatsApp.", codePreview: "WhatsApp -> Delivered" },
      { step: "04", title: "Publish Video", desc: "Syncs captions and tags.", codePreview: "API: Synchronized" }
    ],
    sampleOutputs: [
      { type: "9:16 Video Script", title: "Why 90% of Agencies Plateau", hook: "Look at this exact number...", previewMeta: "48s Script", badge: "Short-Form" }
    ]
  }
];

export function getAgentBySlug(slug: string): AgentData | undefined {
  const normalized = slug?.toLowerCase().trim();
  if (normalized === 'twitter') return AGENTS_LIST.find(a => a.slug === 'x');
  if (normalized === 'tiktok' || normalized === 'youtube') return AGENTS_LIST.find(a => a.slug === 'video') || EXTRA_AGENTS_LIST.find(a => a.slug === normalized);
  return AGENTS_LIST.find(a => a.slug === normalized) || EXTRA_AGENTS_LIST.find(a => a.slug === normalized);
}

export function renderAgentIcon(agent: AgentData, sizeClass = "w-5 h-5"): React.ReactNode {
  if (agent.iconType === 'img' && agent.iconSrc) {
    return <img src={agent.iconSrc} alt={agent.name} className={`${sizeClass} object-contain`} />;
  }
  if (agent.slug === 'x') {
    return (
      <svg className={`${sizeClass} fill-white`} viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
  if (agent.slug === 'instagram') {
    return (
      <svg className={`${sizeClass} text-[#E1306C]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
      </svg>
    );
  }
  if (agent.slug === 'writing') {
    return (
      <svg className={`${sizeClass} text-[#C084FC]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    );
  }
  if (agent.slug === 'designer') {
    return (
      <svg className={`${sizeClass} text-[#38BDF8]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    );
  }
  if (agent.slug === 'blog') {
    return (
      <svg className={`${sizeClass} text-[#10B981]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    );
  }
  if (agent.slug === 'research') {
    return (
      <svg className={`${sizeClass} text-[#34D399]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    );
  }
  if (agent.slug === 'video' || agent.slug === 'tiktok') {
    return (
      <svg className={`${sizeClass} text-[#F59E0B]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    );
  }
  if (agent.slug === 'youtube') {
    return (
      <svg className={`${sizeClass} fill-[#FF0000]`} viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  return null;
}

