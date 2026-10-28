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
          title: "1-Tap Mobile Dispatch",
          desc: "Delivers complete drafts straight to your WhatsApp. Review in 10 seconds, reply '1', and it publishes live to your personal and company page.",
          tag: "Workflow"
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
          desc: "Cut executive drafting time from 10 hours to 60 seconds of WhatsApp approval per post."
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
          withAgent: "Review on WhatsApp on your phone; reply 1 to go live"
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
          metric: "0 Min",
          title: "Laptop Time Required",
          desc: "Approve daily threads and posts directly via WhatsApp mobile notifications."
        }
      ],
      comparison: [
        {
          feature: "Thread Drafting",
          manual: "Hours pacing around trying to write a 10-tweet thread",
          withAgent: "Full thread generated from one voice note or link in 15 seconds"
        },
        {
          feature: "Hook Quality",
          manual: "Weak openings that get scrolled past",
          withAgent: "Trained on top 0.1% viral hooks tailored to your specific niche"
        },
        {
          feature: "Time Commitment",
          manual: "Stuck reading your timeline for 2 hours every day",
          withAgent: "Review on WhatsApp in 15 seconds; completely hands-off"
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
          withAgent: "Preview card sent straight to WhatsApp; 1 tap to approve"
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
    slug: "whatsapp",
    name: "WhatsApp Agent",
    platform: "WhatsApp Bot",
    role: "Voice-to-Content & 10s Mobile Approvals",
    tagline: "20-Second Voice Memos Turned into Live Posts; Zero Dashboard Logins",
    heroHeadline: "Voice memos turned into live marketing with",
    heroHighlight: "WhatsApp.",
    heroSubtitle: "Drop your website link. Record a 20-second voice note while walking between meetings. Our WhatsApp Agent transcribes your thinking, cleans up the structure, and delivers ready-to-publish posts across all your feeds.",
    heroRotatingWords: ["founders.", "CEOs.", "partners.", "advisors.", "nomads."],
    icon: "/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg",
    iconType: "img",
    iconSrc: "/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg",
    accentColor: "#25D366",
    accentGlow: "rgba(37, 211, 102, 0.25)",
    whatIsItFor: {
      lead: "Built for founders who have high-value insights in their heads but zero time to sit down and write.",
      description: "The biggest bottleneck in founder branding is the friction of opening a laptop, logging into a SaaS tool, and typing. The WhatsApp Agent meets you where you already communicate: speak for 20 seconds, and 60 seconds later you receive a drafted LinkedIn carousel, an X thread, and an Instagram visual. Reply '1' and it is live.",
      bullets: [
        "Audio voice memo transcription with speech cleanup (removes 'umms', pauses, and rambling)",
        "Automatic extraction of core arguments, metrics, and actionable frameworks",
        "Interactive two-way chat: reply 'make it punchier' or 'add more numbers' to tweak",
        "1-tap approval system: reply '1' to immediately publish across all your connected channels"
      ],
      capabilities: [
        {
          title: "Voice Memo Ingestion",
          desc: "Accepts voice notes up to 5 minutes long and extracts your core intellectual property without losing nuance.",
          tag: "Audio Engine"
        },
        {
          title: "Multi-Channel Transmutation",
          desc: "Turns one spoken thought into 3 platform-native variations: a LinkedIn story, an X thread, and an Instagram card.",
          tag: "Syndication"
        },
        {
          title: "Conversational Iteration",
          desc: "Want to change the hook or mention a partner? Just send a quick text feedback and the bot adjusts in 5 seconds.",
          tag: "Feedback Loop"
        },
        {
          title: "Zero Password Logins",
          desc: "Manage your entire brand operations without ever logging into a web dashboard or remembering passwords.",
          tag: "Mobile-Only"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "The fastest friction-free bridge between executive brain and public audience.",
      description: "You have 10 great ideas every week while driving, walking, or talking to clients. 99% of them are lost because you don't write them down. WhatsApp Agent captures them effortlessly.",
      benefits: [
        {
          metric: "10 Sec",
          title: "Approval Speed",
          desc: "Review drafts in WhatsApp and reply '1' to go live across all 11 channels instantly."
        },
        {
          metric: "0 Min",
          title: "Keyboard Time",
          desc: "Create full-month content schedules purely by sending audio memos on your morning walk."
        },
        {
          metric: "100%",
          title: "Authentic Nuance",
          desc: "Retains your real-world inflection, vocabulary, and stories directly from your voice."
        }
      ],
      comparison: [
        {
          feature: "Input Mechanism",
          manual: "Typing on keyboard into Notion or Google Docs for hours",
          withAgent: "20-second voice memo while walking to coffee"
        },
        {
          feature: "Draft Review",
          manual: "Logging into complicated marketing SaaS software with 2FA",
          withAgent: "Direct WhatsApp chat preview with instant 1-tap approval"
        },
        {
          feature: "Editing Experience",
          manual: "Rewriting entire paragraphs manually",
          withAgent: "Text back 'shorter' or 'more aggressive' and it re-drafts in seconds"
        },
        {
          feature: "Cross-Posting",
          manual: "Copying text, opening 4 apps, manually uploading images",
          withAgent: "Single confirmation broadcasts to LinkedIn, X, Insta & Facebook simultaneously"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Send Voice Memo",
        desc: "Tap record on WhatsApp. Talk about a customer win, a mistake you made, or an industry shift.",
        codePreview: "Audio Ingest: 28s OGG received from Founder (+1 555-0199)"
      },
      {
        step: "02",
        title: "Transcription & Distillation",
        desc: "Gemini 3.1 Pro cleans the audio, extracts the thesis, and styles it in your founder voice.",
        codePreview: "Thesis: 'Client churn is driven by onboarding lag, not pricing'"
      },
      {
        step: "03",
        title: "Receive Multi-Platform Drafts",
        desc: "Bot replies with complete post previews for LinkedIn, X, and Instagram in under 45 seconds.",
        codePreview: "WhatsApp Message: 'Here are your 3 native drafts ready for review:'"
      },
      {
        step: "04",
        title: "Reply '1' to Publish",
        desc: "Send '1' to broadcast live immediately, or schedule for optimal audience engagement time.",
        codePreview: "User: '1' -> Broadcast Status: Live across 11 Connectors"
      }
    ],
    sampleOutputs: [
      {
        type: "Voice Note to Post",
        title: "Spoken Memo: 'Why we killed our onboarding call'",
        hook: "Spoken: 'Hey, so I just realized our 45-min onboarding call was actually annoying clients. We swapped it for a 3-min Loom and activation went up.' -> Crafted Post: 'We eliminated our onboarding call yesterday. Here is what happened to our churn rate...'",
        previewMeta: "Audio 24s -> LinkedIn Post (1,240 chars) + X Thread (5 tweets)",
        badge: "Voice-to-Post"
      },
      {
        type: "WhatsApp Review Interface",
        title: "1-Tap Review Preview",
        hook: "Bot: 'Here is your draft for tomorrow at 9:00 AM EST. Reply 1 to approve, 2 to reschedule, or reply with edits.'",
        previewMeta: "Interactive Two-Way WhatsApp Bot",
        badge: "Mobile Speed"
      }
    ]
  },
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
      description: "Short-form video is the single fastest way to reach net-new audiences, but scriptwriting requires specialized pacing. The TikTok & Reels Agent maps out 3-second hook variations, on-screen graphics, spoken scripts, and call-to-actions specifically optimized for video watch-time algorithms.",
      bullets: [
        "First 3-second visual and verbal hook formulas that stop the infinite scroll",
        "Side-by-side teleprompter script and visual B-roll direction",
        "Paced for high completion rates (55-70% target watch-through)",
        "On-screen text overlay prompts that drive curiosity and engagement"
      ],
      capabilities: [
        {
          title: "3-Second Hook Architecture",
          desc: "Generates 3 alternative opening lines and physical visual actions to hook viewers before they swipe away.",
          tag: "Hook Engine"
        },
        {
          title: "B-Roll Shot Directives",
          desc: "Provides clear filming instructions (e.g. 'Screen recording of dashboard', 'Cut to white board', 'Handheld camera walk').",
          tag: "Production"
        },
        {
          title: "Teleprompter Ready",
          desc: "Formatted directly for teleprompter apps with clean punctuation and conversational cadence.",
          tag: "Delivery"
        },
        {
          title: "AI Video Prompt Generator",
          desc: "Includes matching prompts ready for Runway, Luma, or Sora if you prefer generating AI video assets.",
          tag: "AI Video"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Scale your video presence without hiring expensive scriptwriters or video strategists.",
      description: "Most business video content fails because it starts with 'Hi, I'm John and today I want to talk about...'. Our agent writes hook-first, retention-backed scripts that keep viewers watching until the last frame.",
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
          title: "Weekly Filming Time",
          desc: "Read off the teleprompter script in one take. No editing guesswork needed."
        }
      ],
      comparison: [
        {
          feature: "Script Structure",
          manual: "Wandering, rambling monologues with no clear hook",
          withAgent: "Hook (0-3s) -> Conflict (3-12s) -> Value (12-40s) -> CTA (40-50s)"
        },
        {
          feature: "Filming Guidance",
          manual: "Unsure what to show on screen while speaking",
          withAgent: "Explicit shot-by-shot B-roll suggestions and on-screen text cues"
        },
        {
          feature: "Voice Naturalness",
          manual: "Stiff robotic corporate script that feels unnatural to speak",
          withAgent: "Conversational, punchy cadence calibrated to your natural speaking rhythm"
        },
        {
          feature: "Multi-Platform Export",
          manual: "Separate writing for TikTok vs Reels vs Shorts",
          withAgent: "Single master script optimized for TikTok, Reels, and YouTube Shorts"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Website & Topic Synthesis",
        desc: "Identifies the highest-curiosity features and value propositions from your website.",
        codePreview: "Topic Extracted: 'The hidden cost of manual agency reporting'"
      },
      {
        step: "02",
        title: "Hook Pacing & Scripting",
        desc: "Structures 3-second hook, spoken narration, and visual actions in 9:16 layout.",
        codePreview: "Script: 45s Duration · 140 words · 3 Visual Cut Directives"
      },
      {
        step: "03",
        title: "Delivery to Phone",
        desc: "Script arrives on WhatsApp formatted for teleprompter apps or direct camera recording.",
        codePreview: "WhatsApp -> Script Delivered with Teleprompter Spacing"
      },
      {
        step: "04",
        title: "Publish Video Asset",
        desc: "Upload filmed clip or generated video; the agent supplies captions, hashtags, and titles.",
        codePreview: "TikTok & Reels API: Meta descriptions and tags synchronized"
      }
    ],
    sampleOutputs: [
      {
        type: "9:16 Video Script",
        title: "Why 90% of Agencies Never Break $50k/mo",
        hook: "[VISUAL: Pointing at screen showing chaotic spreadsheet] Verbal: 'If you want to know why agency owners work 70 hours a week and take home less than their junior devs, look at this exact number...'",
        previewMeta: "48s Script · Teleprompter Ready · 3 Visual Cues",
        badge: "Short-Form Video"
      },
      {
        type: "Product Teardown Reel",
        title: "We rebuilt our client dashboard in 48 hours",
        hook: "[VISUAL: Fast-paced screen recording with highlight markers] Verbal: 'We deleted 80% of our software features last Tuesday. Our clients thought we lost our minds. Here is what happened next...'",
        previewMeta: "42s Script · B-Roll Shot List Included",
        badge: "Product Showcase"
      }
    ]
  },
  {
    slug: "youtube",
    name: "YouTube Agent",
    platform: "YouTube",
    role: "Long-Form Video Briefs & Shorts SEO",
    tagline: "Search-Indexed Descriptions, Chapter Outlines & Community Tab Engagement",
    heroHeadline: "YouTube search dominance & shorts on autopilot for",
    heroHighlight: "enterprises.",
    heroSubtitle: "Drop your website link. Our YouTube Agent crafts structured long-form video briefs, high-retention Shorts scripts, click-worthy titles, SEO descriptions, and weekly Community Tab polls.",
    heroRotatingWords: ["enterprises.", "founders.", "educators.", "consultancies.", "software."],
    icon: "youtube_svg",
    iconType: "svg",
    accentColor: "#FF0000",
    accentGlow: "rgba(255, 0, 0, 0.25)",
    whatIsItFor: {
      lead: "Engineered to transform your company into the definitive, search-ranked authority in your domain.",
      description: "YouTube is the world’s second-largest search engine. Unlike social feeds where content dies in 24 hours, YouTube videos drive high-intent enterprise pipeline for years. The YouTube Agent structures complete video outlines, title variations, timestamped chapters, and community tab polls.",
      bullets: [
        "Search-optimized title variations balancing curiosity with SEO keywords",
        "Timestamped chapter outlines that rank in Google Search results",
        "Complete description copy with contextual timestamps, links, and resource calls-to-action",
        "Weekly Community Tab posts to maintain algorithmic vitality between main video drops"
      ],
      capabilities: [
        {
          title: "Chapter & Timestamp Outlines",
          desc: "Generates clear timestamps that help Google index your video directly inside Google Search SERP features.",
          tag: "SEO Chapters"
        },
        {
          title: "Title & Thumbnail Briefs",
          desc: "Provides 5 tested title variations with matching thumbnail composition guidelines and emotional hooks.",
          tag: "Click Velocity"
        },
        {
          title: "Community Tab Engine",
          desc: "Writes weekly interactive polls, behind-the-scenes teasers, and discussion prompts that warm up your subscriber base.",
          tag: "Community"
        },
        {
          title: "Shorts-to-Longform Funnel",
          desc: "Scripts companion YouTube Shorts designed specifically to drive viewers into your flagship long-form videos.",
          tag: "Funnel Routing"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Compounding evergreen discovery that feeds your inbound pipeline for years.",
      description: "Stop relying solely on feeds that disappear by tomorrow morning. YouTube videos continue attracting high-value buyers 18 months after publishing when structured with proper search metadata.",
      benefits: [
        {
          metric: "18+ Mo",
          title: "Content Longevity",
          desc: "Videos rank and attract qualified traffic long after initial publication date."
        },
        {
          metric: "5 Titles",
          title: "CTR Tested",
          desc: "Pre-tested title variations combining search intent with psychological curiosity."
        },
        {
          metric: "Google #1",
          title: "Search Ranking",
          desc: "Timestamped chapter markers enable direct video feature snippets on Google."
        }
      ],
      comparison: [
        {
          feature: "Video Outlining",
          manual: "Hours figuring out how to structure a 10-minute technical video",
          withAgent: "Complete outline with introduction hook, 4 teaching pillars, and CTA"
        },
        {
          feature: "YouTube SEO Metadata",
          manual: "Blank descriptions or hasty 1-sentence summaries",
          withAgent: "Rich, keyword-targeted description with timestamps and links"
        },
        {
          feature: "Community Engagement",
          manual: "Forgetting the Community tab exists for months at a time",
          withAgent: "Weekly automated polls and discussions that maintain channel momentum"
        },
        {
          feature: "Shorts Repurposing",
          manual: "Manually re-editing clips with zero context",
          withAgent: "Scripted companion Shorts engineered to drive traffic to the main video"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Search Keyword & Topic Analysis",
        desc: "Finds high-intent search queries your ideal customers are actively typing on YouTube.",
        codePreview: "Query Identified: 'How to automate marketing operations in 2026'"
      },
      {
        step: "02",
        title: "Long-Form Outline & Chaptering",
        desc: "Constructs 10-minute narrative arc with retention peaks, timestamps, and slide cues.",
        codePreview: "Generated: 6 Chapters with exact timestamp intervals and talking points"
      },
      {
        step: "03",
        title: "SEO Metadata & Titles",
        desc: "Drafts 5 high-CTR titles, full SEO description, and targeted channel tags.",
        codePreview: "Metadata Complete: 5 Titles · 2,400 char description · 15 tags"
      },
      {
        step: "04",
        title: "Publish to Channel",
        desc: "Syncs directly to your YouTube Studio with metadata, playlists, and cards prefilled.",
        codePreview: "YouTube API: Video Draft Saved to Studio with Chapters"
      }
    ],
    sampleOutputs: [
      {
        type: "Long-Form Master Brief",
        title: "The Death of Traditional Agencies: The Autonomous Content Engine Explained",
        hook: "Intro (0:00 - 1:15): 'If you are paying an agency $10,000/mo to schedule 12 social posts, you are participating in a dying economic model. In this video, we break down the autonomous stack...'",
        previewMeta: "12-Min Video Brief · 5 Chapters · SEO Description",
        badge: "Evergreen Authority"
      },
      {
        type: "Community Tab Poll",
        title: "Weekly Engagement Poll",
        hook: "Question: 'What is the biggest bottleneck in your company's marketing right now?' Options: A) Copywriting quality B) Visual consistency C) Publishing cadence D) Client approvals",
        previewMeta: "Community Post · Interactive Poll · 4 Options",
        badge: "Audience Warming"
      }
    ]
  },
  {
    slug: "facebook",
    name: "Facebook Agent",
    platform: "Facebook Pages & Groups",
    role: "Company Page Feeds & Case Studies",
    tagline: "Automated Business Announcements, Client Case Studies & Group Discussions",
    heroHeadline: "Facebook company syndication on autopilot for",
    heroHighlight: "businesses.",
    heroSubtitle: "Drop your website link. Keep your Facebook business page and client community groups active with automated company case studies, customer transformations, and discussion posts.",
    heroRotatingWords: ["businesses.", "agencies.", "local leaders.", "brands.", "services."],
    icon: "/native-marketing-on-autopilot.svg.svg-647.Woblo.svg",
    iconType: "img",
    iconSrc: "/native-marketing-on-autopilot.svg.svg-647.Woblo.svg",
    accentColor: "#1877F2",
    accentGlow: "rgba(24, 119, 242, 0.25)",
    whatIsItFor: {
      lead: "Ensures your business maintains an active, credible presence on Meta's ecosystem without manual busywork.",
      description: "B2B and high-ticket service buyers frequently check Facebook pages and groups to verify legitimate business operations, reviews, and community activity. The Facebook Agent formats long-form storytelling posts, case study breakdowns, and scheduled announcements that maintain professional credibility.",
      bullets: [
        "Long-form customer transformation and case study storytelling",
        "Business updates, feature rollouts, and company milestone announcements",
        "Community group discussion starters designed to generate real comments",
        "Zero-friction automated syndication directly alongside your other feeds"
      ],
      capabilities: [
        {
          title: "Case Study Storytelling",
          desc: "Formats detailed customer success stories with rich imagery, quotes, and measurable outcomes.",
          tag: "Case Studies"
        },
        {
          title: "Group Discussion Posts",
          desc: "Crafts open-ended questions and prompts that encourage community members to participate and comment.",
          tag: "Community"
        },
        {
          title: "Milestone Announcements",
          desc: "Celebrates team achievements, product updates, and client wins with clean professional tone.",
          tag: "Social Proof"
        },
        {
          title: "Dual Feed Distribution",
          desc: "Publishes simultaneously to your official Facebook Business Page and linked private Facebook Groups.",
          tag: "Distribution"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Keep your Meta footprint alive and trustworthy without spending mental energy on it.",
      description: "An abandoned Facebook page with the last post from 8 months ago damages buyer trust. The Facebook Agent automatically keeps your page fresh, professional, and full of social proof.",
      benefits: [
        {
          metric: "100%",
          title: "Page Freshness",
          desc: "Prospective clients always find recent posts, case studies, and updates on your page."
        },
        {
          metric: "0 Extra Mins",
          title: "Double-Posting",
          desc: "Never manually re-upload images or re-paste captions into Facebook Business Suite."
        },
        {
          metric: "High Trust",
          title: "Social Proof",
          desc: "Detailed client results and testimonials displayed prominently where buyers look."
        }
      ],
      comparison: [
        {
          feature: "Facebook Page Management",
          manual: "Abandoned for months because nobody wants to open Meta Business Suite",
          withAgent: "Maintained automatically with fresh, relevant company updates every week"
        },
        {
          feature: "Case Study Formatting",
          manual: "Dry technical summaries that get zero engagement",
          withAgent: "Compelling narrative storytelling with before-and-after outcomes"
        },
        {
          feature: "Workflow",
          manual: "Logging into complicated Meta Business Manager settings",
          withAgent: "Approved in 10 seconds via WhatsApp alongside all other platforms"
        },
        {
          feature: "Community Groups",
          manual: "Dead silence in your company group or customer forum",
          withAgent: "Consistent value drops and structured discussion starters"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Company Update Extraction",
        desc: "Extracts latest company milestones, client outcomes, and blog posts from your website.",
        codePreview: "Extracted Update: 'New feature launch & client case study'"
      },
      {
        step: "02",
        title: "Storytelling Formulation",
        desc: "Constructs conversational, engaging Facebook posts with clean layout and relevant imagery.",
        codePreview: "Formatted Post: 850 characters with bulleted results and call-to-action"
      },
      {
        step: "03",
        title: "Mobile Push via WhatsApp",
        desc: "Delivered to WhatsApp with your company page preview card ready for one-tap approval.",
        codePreview: "WhatsApp -> Facebook Post Preview Ready"
      },
      {
        step: "04",
        title: "Meta Graph API Dispatch",
        desc: "Directly published via official Meta API to your Page and linked groups.",
        codePreview: "Meta Graph API: Status 200 OK -> Post Live"
      }
    ],
    sampleOutputs: [
      {
        type: "Client Case Study Post",
        title: "How Northstar Logistics cut client communication overhead by 73%",
        hook: "When Northstar first approached us, their account managers were drowning in 400+ weekly WhatsApp messages. Here is the exact autonomous system we rolled out...",
        previewMeta: "Facebook Page Post · Image Attached · 920 chars",
        badge: "Social Proof"
      },
      {
        type: "Community Discussion",
        title: "The Future of B2B Operations",
        hook: "Quick question for the operators here: If you could automate one manual task in your company tomorrow morning, what would it be? Drop yours below—we are compiling the top answers.",
        previewMeta: "Group Discussion Starter · 280 chars",
        badge: "Community Engagement"
      }
    ]
  },
  {
    slug: "pinterest",
    name: "Pinterest Agent",
    platform: "Pinterest",
    role: "Visual Search Pins & Infographics",
    tagline: "Evergreen 2:3 Vertical Pins, Infographic Summaries & Long-Term Search Traffic",
    heroHeadline: "Evergreen visual search traffic on autopilot for",
    heroHighlight: "brands.",
    heroSubtitle: "Drop your website link. Our Pinterest Agent transforms your core frameworks and insights into high-intent 2:3 vertical pins, infographic cards, and automated board destinations.",
    heroRotatingWords: ["brands.", "publishers.", "consultancies.", "software.", "educators."],
    icon: "/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg",
    iconType: "img",
    iconSrc: "/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg",
    accentColor: "#E60023",
    accentGlow: "rgba(230, 0, 35, 0.25)",
    whatIsItFor: {
      lead: "Engineered to unlock the world's most underrated evergreen visual search engine.",
      description: "Unlike social feeds where posts disappear after 24 hours, a Pinterest pin has an average lifespan of 6 to 12 months. Users search Pinterest for frameworks, cheat-sheets, workflows, and solutions. The Pinterest Agent generates 2:3 vertical infographic pins that rank for search terms and drive continuous organic referral clicks to your website.",
      bullets: [
        "2:3 vertical aspect ratio optimized for mobile Pinterest search feeds",
        "Search-indexed keyword titles and descriptions tailored to high-intent buyer queries",
        "Infographic summaries, workflow diagrams, and visual checklists",
        "Direct outbound URL linking to your website, landing page, or case study"
      ],
      capabilities: [
        {
          title: "2:3 Infographic Pins",
          desc: "Generates high-contrast vertical pins with diagrams, checklists, and bulleted takeaways that users save to their boards.",
          tag: "Infographics"
        },
        {
          title: "Pinterest Search SEO",
          desc: "Researches keyword density and search tags to ensure your pins rank when buyers search for your category.",
          tag: "Search SEO"
        },
        {
          title: "Automated Board Routing",
          desc: "Categorizes and schedules pins across multiple themed boards on your business profile automatically.",
          tag: "Board Routing"
        },
        {
          title: "Direct Referral Links",
          desc: "Embeds direct tracking links to your landing page, driving qualified inbound traffic with high buying intent.",
          tag: "Inbound Clicks"
        }
      ]
    },
    whyShouldYouUseIt: {
      lead: "Build a perpetual traffic engine that keeps sending visitors months after you post.",
      description: "If you are tired of the treadmill of daily social posting where yesterday's effort vanishes today, Pinterest is your compounding moat. Pins published in January still drive leads in September.",
      benefits: [
        {
          metric: "9+ Mo",
          title: "Avg Pin Lifespan",
          desc: "Pins continue to generate impressions, saves, and clicks for nearly a full year."
        },
        {
          metric: "2:3 Ratio",
          title: "Optimal Format",
          desc: "High-resolution vertical pins that maximize visual presence in the search grid."
        },
        {
          metric: "High Intent",
          title: "Search Traffic",
          desc: "Reaches users who are actively searching for solutions, not passively scrolling."
        }
      ],
      comparison: [
        {
          feature: "Content Lifespan",
          manual: "24 to 48 hours on LinkedIn, X, or Instagram",
          withAgent: "6 to 12 months of compounding search visibility on Pinterest"
        },
        {
          feature: "Infographic Design",
          manual: "Hiring a designer to build complex 2:3 vertical graphics",
          withAgent: "Instant automated rendering of high-density visual frameworks"
        },
        {
          feature: "Outbound Linking",
          manual: "Penalized by algorithms on LinkedIn and X",
          withAgent: "Fully supported and encouraged by Pinterest; direct link on every pin"
        },
        {
          feature: "Effort Required",
          manual: "Forgetting Pinterest because manual pinning is tedious",
          withAgent: "Syndicated automatically from your website crawl alongside all other feeds"
        }
      ]
    },
    workflowSteps: [
      {
        step: "01",
        title: "Framework & Article Crawl",
        desc: "Extracts key concepts, checklists, and step-by-step guides from your website.",
        codePreview: "Extracted Framework: 'The 7 Steps to Automated Marketing'"
      },
      {
        step: "02",
        title: "2:3 Vertical Pin Rendering",
        desc: "Renders vertical infographic card with high-contrast typography and visual hierarchy.",
        codePreview: "Canvas Engine: 1000x1500px High-Resolution Pin Generated"
      },
      {
        step: "03",
        title: "Pinterest Keyword SEO",
        desc: "Applies targeted search terms to title, pin description, and destination link.",
        codePreview: "SEO Optimization: Targeted 'business automation workflow'"
      },
      {
        step: "04",
        title: "Board Syndication",
        desc: "Saves pin directly to your targeted Pinterest boards with outbound link attached.",
        codePreview: "Pinterest API: Pin Saved to 'Business Growth Strategies'"
      }
    ],
    sampleOutputs: [
      {
        type: "2:3 Vertical Infographic",
        title: "The Ultimate Guide to Founder Brand Automation",
        hook: "Vertical Pin: 5-step visual diagram detailing how to capture voice notes and turn them into multi-channel marketing with zero retainers.",
        previewMeta: "1000x1500 · High-Resolution Infographic · Outbound Link Included",
        badge: "Evergreen Search Pin"
      },
      {
        type: "Checklist Pin",
        title: "10 Things to Check Before Hiring a Marketing Agency",
        hook: "Vertical Checklist Pin: Clean numbered checklist highlighting agency red flags and alternatives.",
        previewMeta: "2:3 Ratio · Save-Magnet Layout",
        badge: "Checklist Magnet"
      }
    ]
  }
];

export function getAgentBySlug(slug: string): AgentData | undefined {
  const normalized = slug?.toLowerCase().trim();
  if (normalized === 'twitter') return AGENTS_LIST.find(a => a.slug === 'x');
  return AGENTS_LIST.find(a => a.slug === normalized);
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
  if (agent.slug === 'tiktok') {
    return (
      <svg className={`${sizeClass} fill-[#00F2FE]`} viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/>
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

