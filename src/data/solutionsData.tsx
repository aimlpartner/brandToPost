import React from 'react';

export interface SolutionData {
  slug: string;
  name: string;
  shortName: string;
  role: string;
  badge: string;
  isFlagship?: boolean;
  heroHeadline: string;
  heroRotatingWords: string[];
  heroSubtitle: string;
  accentColor: string;
  assignedAgents: string[]; // slugs from AGENTS_LIST
  painPointsSolved: Array<{
    tag: string;
    title: string;
    desc: string;
  }>;
  threeStepPlaybook: [
    { title: string; desc: string; visualTopLabel: string; visualBottomLabel: string },
    { title: string; desc: string; visualTopLabel: string; visualBottomLabel: string },
    { title: string; desc: string; visualTopLabel: string; visualBottomLabel: string }
  ];
  roiMetrics: Array<{
    metric: string;
    title: string;
    desc: string;
  }>;
  comparison: Array<{
    dimension: string;
    oldWay: string;
    withSolution: string;
  }>;
  sampleOutputs: Array<{
    channel: string;
    badge: string;
    title: string;
    hook: string;
    meta: string;
  }>;
}

export const SOLUTIONS_LIST: SolutionData[] = [
  {
    slug: "founders",
    name: "Founders & Technical CEOs",
    shortName: "Founders & CEOs",
    role: "Personal Authority + Owned Brand",
    badge: "FLAGSHIP · FOUNDER ENGINE",
    isFlagship: true,
    heroHeadline: "Personal brand & company reach on autopilot for",
    heroRotatingWords: ["technical CEOs.", "solo founders.", "bootstrappers.", "repeat builders.", "operators."],
    heroSubtitle: "Clone your exact founder voice, link the products you own, and publish daily to your personal LinkedIn & X alongside your company channels.",
    accentColor: "#C084FC",
    assignedAgents: ["writing", "linkedin", "x"],
    painPointsSolved: [
      {
        tag: "Voice Clone",
        title: "Zero Robotic Ghostwriter Slop",
        desc: "Arthur maps your real sentence cadence, contrarian opinions, and banned buzzwords so every post reads like you at 6 AM."
      },
      {
        tag: "Dual-Stream",
        title: "Personal + Company Feeds in Sync",
        desc: "Your personal profile builds 5x more trust while your company pages publish product carousels and case studies in parallel."
      },
      {
        tag: "Brand Grounding",
        title: "Subtle Inbound Product Tie-Ins",
        desc: "Link the companies you own so your personal stories naturally drive demos and signups without sounding like a corporate ad."
      },
      {
        tag: "Time Leverage",
        title: "60 Seconds Per Week",
        desc: "Drop a 1-line thought or pick an AI-researched topic. Review your personal queue in one click and get back to building product."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Calibrate voice & link owned brands",
        desc: "Share a sample post to clone your tone, and attach the website links of the products you own.",
        visualTopLabel: "Arthur Voice DNA · 99.4%",
        visualBottomLabel: "+ Linked: yourcompany.com"
      },
      {
        title: "1-line thought to story + visual",
        desc: "Type a rough 5-word idea or select a suggested founder topic—we draft the post and render the visual card.",
        visualTopLabel: "\"Why we killed our $6k agency\"",
        visualBottomLabel: "1st-Person Post + Quote Card"
      },
      {
        title: "Auto-publish to LinkedIn & X",
        desc: "Approve your personal queue in 60 seconds or enable daily autopilot across your personal feeds.",
        visualTopLabel: "Personal LinkedIn + Personal X",
        visualBottomLabel: "Daily Autopilot Active"
      }
    ],
    roiMetrics: [
      {
        metric: "15 Hrs",
        title: "Reclaimed Weekly",
        desc: "Stop spending Sunday nights staring at a blank cursor trying to write LinkedIn posts and X threads."
      },
      {
        metric: "5.2x",
        title: "Higher Founder Trust",
        desc: "First-person executive posts generate 5x more profile views and inbound DMs than corporate logo posts."
      },
      {
        metric: "$72k/yr",
        title: "Ghostwriter Saved",
        desc: "Replaces $6,000/month personal-branding retainers that still require hours of interview calls."
      }
    ],
    comparison: [
      {
        dimension: "Voice Authenticity",
        oldWay: "Cringe ChatGPT posts or junior ghostwriters who don't understand your product",
        withSolution: "99.4% Arthur Voice Clone calibrated on your real writing and heuristics"
      },
      {
        dimension: "Product Attribution",
        oldWay: "Viral personal posts that get likes but zero product signups",
        withSolution: "Grounded in your owned brand URLs to convert readers into product demos"
      },
      {
        dimension: "Weekly Founder Time",
        oldWay: "8–12 hours drafting, designing slides, and logging into schedulers",
        withSolution: "60-second weekly queue approval with 1-click auto-publishing"
      }
    ],
    sampleOutputs: [
      {
        channel: "Personal LinkedIn",
        badge: "Founder Story + Visual",
        title: "Why we stopped hiring agencies and built an internal autonomous stack",
        hook: "We spent $42,000 on a B2B agency last year. Net pipeline generated: $0. Last month we replaced the entire workflow with 3 internal systems. Here is the exact breakdown:",
        meta: "1st-Person Essay · Quote Card Attached · 99.4% Voice Match"
      },
      {
        channel: "Personal X Thread",
        badge: "Contrarian Operator Thread",
        title: "8 hard truths about scaling from $0 to $2M ARR with 4 people",
        hook: "If your headcount is growing faster than your revenue per employee, you aren't scaling—you're swelling. Here are the 8 leverage rules we run our company by: 🧵👇",
        meta: "8-Tweet Thread · High Bookmark Velocity · Auto-Scheduled"
      }
    ]
  },
  {
    slug: "b2b-saas",
    name: "Seed–Series B SaaS Teams",
    shortName: "Seed–Series B SaaS",
    role: "Changelog to Enterprise Pipeline",
    badge: "B2B SAAS GTM",
    heroHeadline: "Turn weekly product ships into inbound pipeline for",
    heroRotatingWords: ["Series A SaaS.", "product-led teams.", "B2B startups.", "lean GTM teams.", "SaaS founders."],
    heroSubtitle: "Your engineering team ships every week, but your marketing lags behind. Turn every release, changelog, and customer metric into LinkedIn decks, X launch threads, and SEO comparisons.",
    accentColor: "#38BDF8",
    assignedAgents: ["research", "linkedin", "blog"],
    painPointsSolved: [
      {
        tag: "Ship-to-GTM",
        title: "Zero Silent Product Releases",
        desc: "Every feature ship and changelog url automatically becomes a multi-channel launch campaign across 11 feeds."
      },
      {
        tag: "ICP Precision",
        title: "Built for Technical & Enterprise Buyers",
        desc: "Speaks directly to VPs, CFOs, and operators using concrete ROI metrics rather than fluffy marketing adjectives."
      },
      {
        tag: "Search Moat",
        title: "Bottom-of-Funnel SEO Comparisons",
        desc: "Automatically drafts '[Your SaaS] vs. Legacy Competitor' guides that capture high-intent search & AI citations."
      },
      {
        tag: "Lean GTM",
        title: "Full-Stack Output Without Headcount",
        desc: "Run the publishing velocity of a 6-person content team before hiring your first full-time marketer."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Index your SaaS positioning & docs",
        desc: "Drop your domain or changelog link—we extract your ICP pain points, feature moat, and brand palette.",
        visualTopLabel: "SaaS Docs + Positioning Indexed",
        visualBottomLabel: "5 Buyer ICPs Mapped"
      },
      {
        title: "Generate multi-channel launch kits",
        desc: "Our fleet synthesizes LinkedIn PDF decks, X launch threads, 4:5 feature visuals, and SEO comparison articles.",
        visualTopLabel: "Release v2.4 -> 30 Native Assets",
        visualBottomLabel: "Carousels · Threads · SEO Guides"
      },
      {
        title: "Synchronize Founder + Company feeds",
        desc: "Publish product announcements on your company page and founder commentary on your CEO's profile simultaneously.",
        visualTopLabel: "Company Feed + CEO Profile",
        visualBottomLabel: "+340% Inbound Demo Lift"
      }
    ],
    roiMetrics: [
      {
        metric: "+340%",
        title: "Inbound Demo Lift",
        desc: "Consistent multi-channel product proof turns passive followers into booked discovery calls."
      },
      {
        metric: "60 Sec",
        title: "Release-to-Campaign",
        desc: "Go from a shipped feature URL to a 30-day multi-platform GTM calendar in under a minute."
      },
      {
        metric: "$180k",
        title: "GTM Payroll Saved",
        desc: "Delay hiring a content manager, graphic designer, and SEO freelancer while moving 5x faster."
      }
    ],
    comparison: [
      {
        dimension: "Feature Launches",
        oldWay: "A single changelog bullet that nobody outside your existing users ever sees",
        withSolution: "Turned into 10-slide LinkedIn decks, X launch threads, and SEO articles"
      },
      {
        dimension: "Competitor Positioning",
        oldWay: "Outdated comparison pages written once a year",
        withSolution: "Live competitor gap analysis and search-ranked comparison guides"
      },
      {
        dimension: "Design Bottlenecks",
        oldWay: "Pulling product designers away from UI work to make social graphics",
        withSolution: "Automated brand-locked 4:5 cards and architecture diagrams"
      }
    ],
    sampleOutputs: [
      {
        channel: "LinkedIn PDF Carousel",
        badge: "Product Architecture Deck",
        title: "How we cut enterprise onboarding from 14 days to 90 seconds",
        hook: "Slide 1: Legacy enterprise software forces teams through 3 weeks of implementation calls. Here is the 6-slide architecture behind our zero-config sync engine:",
        meta: "8 Slides · 1080x1350 PDF · Brand Palette Applied"
      },
      {
        channel: "SEO & AI Search Guide",
        badge: "Bottom-of-Funnel Comparison",
        title: "Automated Workflow Engines vs. Legacy Point Solutions: 2026 TCO Guide",
        hook: "A side-by-side breakdown of implementation time, seat licensing costs, and API throughput for scaling B2B operations teams...",
        meta: "2,100 Words · Comparison Table + FAQ Schema · CMS Synced"
      }
    ]
  },
  {
    slug: "boutique-agencies",
    name: "Boutique Marketing & Ghostwriting Agencies",
    shortName: "Boutique Agencies",
    role: "Multi-Client Delivery Engine",
    badge: "AGENCY SCALE",
    heroHeadline: "Scale from 5 to 40 client retainers for",
    heroRotatingWords: ["boutique agencies.", "GTM studios.", "ghostwriting shops.", "social agencies.", "growth partners."],
    heroSubtitle: "Onboard any client via their website URL in 60 seconds. Isolate each client's Brand DNA and deliver 30 studio-grade posts & visuals per client with zero extra payroll.",
    accentColor: "#10B981",
    assignedAgents: ["writing", "designer", "linkedin"],
    painPointsSolved: [
      {
        tag: "Multi-Tenant",
        title: "Isolated Brand DNA Per Client",
        desc: "Switch between 40+ client workspaces—each locked to that client's exact hex palette, typography, and founder voice."
      },
      {
        tag: "Margin Expansion",
        title: "85%+ Gross Agency Margins",
        desc: "Stop hiring another $4k/mo copywriter and designer every time you sign 3 new client retainers."
      },
      {
        tag: "60s Onboarding",
        title: "Instant Day-1 Client Deliverables",
        desc: "Paste a new client's website URL during the kickoff call and present their first 30-day campaign deck live."
      },
      {
        tag: "Zero Churn",
        title: "Shareable Client Approval Links",
        desc: "Send clean campaign preview decks to clients for instant sign-off without messy spreadsheets."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Create isolated client workspaces",
        desc: "Drop each client's URL to lock in their distinct visual identity, ICP strategy, and executive voice.",
        visualTopLabel: "40+ Isolated Client Workspaces",
        visualBottomLabel: "Zero Cross-Client Tone Drift"
      },
      {
        title: "Batch-generate 30-day client decks",
        desc: "Render a full month of LinkedIn carousels, X threads, and 4:5 graphics for any client in 60 seconds.",
        visualTopLabel: "30 Posts + Visuals / Client",
        visualBottomLabel: "100% White-Label Studio Output"
      },
      {
        title: "1-click client sign-off & auto-publish",
        desc: "Share a clean preview link with your client and auto-schedule across all their connected channels.",
        visualTopLabel: "Shared Client Approval Deck",
        visualBottomLabel: "Auto-Dispatched Across 11 Feeds"
      }
    ],
    roiMetrics: [
      {
        metric: "10x",
        title: "Client Capacity",
        desc: "One account strategist can manage 30+ active client retainers without quality drop."
      },
      {
        metric: "88%",
        title: "Gross Margin",
        desc: "Eliminate freelance copywriter and Canva designer overhead eating into your retainers."
      },
      {
        metric: "Day 1",
        title: "Client Kickoff Proof",
        desc: "Deliver a complete 30-day content calendar on Day 1 instead of taking 3 weeks to onboard."
      }
    ],
    comparison: [
      {
        dimension: "Client Onboarding",
        oldWay: "3 weeks of questionnaires, brand discovery docs, and sample drafts",
        withSolution: "60-second URL crawl extracts Brand DNA and generates 30 posts on Day 1"
      },
      {
        dimension: "Scaling Retainers",
        oldWay: "Hiring more writers and designers for every 4 new clients signed",
        withSolution: "Unlimited multi-tenant workspaces with zero additional headcount"
      },
      {
        dimension: "Visual Production",
        oldWay: "Design queue bottlenecks delaying copy approval by 5+ days",
        withSolution: "Brand-locked carousels and 4:5 cards rendered simultaneously with copy"
      }
    ],
    sampleOutputs: [
      {
        channel: "Client Workspace A · FinTech",
        badge: "Executive LinkedIn Deck",
        title: "Why CFOs Are Replacing Manual Treasury Spreadsheets in 2026",
        hook: "Calibrated to Client A's Navy/Emerald palette and authoritative CFO tone—10-slide PDF carousel ready for client sign-off.",
        meta: "Workspace: FinTech Corp · 10 Slides · Client Approved"
      },
      {
        channel: "Client Workspace B · AI SaaS",
        badge: "Founder X Launch Thread",
        title: "How we trained a domain-specific agent with 99.2% deterministic accuracy",
        hook: "Calibrated to Client B's technical founder voice—7-part engineering breakdown thread with system diagram.",
        meta: "Workspace: Nexus AI · 7 Tweets + Diagram · Scheduled"
      }
    ]
  },
  {
    slug: "consultancies",
    name: "B2B Consultancies & Advisory Firms",
    shortName: "B2B Consultancies",
    role: "Partner Frameworks & Case Studies",
    badge: "CONSULTANCIES",
    heroHeadline: "Turn proprietary frameworks into deal flow for",
    heroRotatingWords: ["consultancies.", "advisory firms.", "managing partners.", "strategy boutiques.", "transformation firms."],
    heroSubtitle: "Enterprise buyers hire consultancies whose frameworks they already trust. Turn your methodologies and anonymized client wins into executive LinkedIn carousels and SEO whitepapers.",
    accentColor: "#A78BFA",
    assignedAgents: ["linkedin", "designer", "blog"],
    painPointsSolved: [
      {
        tag: "IP Extraction",
        title: "Turn Methodologies Into Visual Decks",
        desc: "Transforms your 2x2 matrices, diagnostic models, and playbooks into bookmark-worthy LinkedIn PDF carousels."
      },
      {
        tag: "Case Studies",
        title: "Anonymized Client Win Teardowns",
        desc: "Structures client engagements into 'Problem / Diagnostic / Transformation / ROI' narratives that attract C-suite buyers."
      },
      {
        tag: "Partner Voice",
        title: "Multi-Partner Executive Presence",
        desc: "Keep every Managing Partner and Principal visible on LinkedIn without billing a single consulting hour to writing."
      },
      {
        tag: "Search Authority",
        title: "2,000-Word Industry Benchmarks",
        desc: "Publishes deep analytical guides on your domain that rank for high-ticket enterprise advisory queries."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Crawl practice areas & case studies",
        desc: "Paste your firm's URL—we index your core advisory pillars, industry verticals, and executive tone.",
        visualTopLabel: "Practice Areas & IP Indexed",
        visualBottomLabel: "Executive Partner Tone Locked"
      },
      {
        title: "Render framework carousels & briefs",
        desc: "Automatically builds 10-slide LinkedIn briefing decks, contrarian partner takes, and long-form insight articles.",
        visualTopLabel: "10-Slide Executive PDF Decks",
        visualBottomLabel: "+ 2,000w Advisory Whitepapers"
      },
      {
        title: "Publish across partner & firm feeds",
        desc: "Schedule thought leadership across Managing Partners' personal profiles and the firm's company page.",
        visualTopLabel: "Partner Profiles + Firm Page",
        visualBottomLabel: "Consistent C-Suite Visibility"
      }
    ],
    roiMetrics: [
      {
        metric: "4.6x",
        title: "Executive Dwell Time",
        desc: "Framework PDF carousels earn 4.6x longer reading time from VP and C-level decision makers."
      },
      {
        metric: "0 Hrs",
        title: "Billable Time Lost",
        desc: "Partners never sacrifice billable client delivery hours to draft social posts or articles."
      },
      {
        metric: "$50k+",
        title: "Avg Inbound Engagement",
        desc: "Positions your firm as the definitive category expert before the RFP is even written."
      }
    ],
    comparison: [
      {
        dimension: "Partner Visibility",
        oldWay: "Partners only post once a quarter when announcing a conference panel",
        withSolution: "3–5 high-authority framework posts per week in each partner's exact voice"
      },
      {
        dimension: "Case Study Distribution",
        oldWay: "Buried as static PDFs on a '/resources' page nobody visits",
        withSolution: "Repackaged into swipeable LinkedIn teardowns and X threads"
      },
      {
        dimension: "Visual Presentation",
        oldWay: "Dense corporate text walls or dated stock photography",
        withSolution: "Minimalist McKinsey/editorial-grade diagrams and typography cards"
      }
    ],
    sampleOutputs: [
      {
        channel: "Partner LinkedIn Carousel",
        badge: "Diagnostic Framework",
        title: "The 4-Stage Operating Model Audit: Why 70% of Post-Merger Integrations Stall",
        hook: "Across 40+ mid-market transformations, we found the same bottleneck in Week 6. Here is the 8-slide diagnostic framework our practice uses to resolve it:",
        meta: "8-Slide Executive PDF · Diagrammatic Layout · C-Suite Targeted"
      },
      {
        channel: "Firm Insight Article",
        badge: "Advisory Benchmark",
        title: "2026 Supply Chain Margin Compression: Playbook for Industrial COOs",
        hook: "An empirical breakdown of procurement automation and working-capital recovery across $50M–$500M industrial operators...",
        meta: "1,950 Words · Executive Summary + Data Tables · Auto-Published"
      }
    ]
  },
  {
    slug: "fractional-executives",
    name: "Fractional CMOs, CTOs & Advisors",
    shortName: "Fractional Executives",
    role: "High-Ticket Retainer Waitlist",
    badge: "FRACTIONAL EXECS",
    heroHeadline: "Keep a full waitlist of $10k/mo retainers for",
    heroRotatingWords: ["fractional CMOs.", "fractional CTOs.", "fractional CFOs.", "board advisors.", "operating partners."],
    heroSubtitle: "When you are heads-down serving 3 clients, your own marketing stops—leading to the feast-or-famine retainer cycle. Keep your personal LinkedIn & X publishing 5x/week automatically.",
    accentColor: "#F59E0B",
    assignedAgents: ["writing", "linkedin", "x"],
    painPointsSolved: [
      {
        tag: "Pipeline Stability",
        title: "End the Feast-or-Famine Cycle",
        desc: "Maintain daily executive visibility even during your busiest client delivery weeks so your waitlist stays full."
      },
      {
        tag: "Operator Proof",
        title: "Playbook-First Authority",
        desc: "Shares tactical 90-day playbooks, audit checklists, and board-level heuristics that make CEOs DM you."
      },
      {
        tag: "Voice Clone",
        title: "Sounds Like a 15-Year Operator",
        desc: "Zero junior copywriter fluff—calibrated to your executive vocabulary and real operational scars."
      },
      {
        tag: "Multi-Format",
        title: "LinkedIn Essays + X Threads + Newsletter",
        desc: "Turns one weekly insight into a complete omnichannel executive presence in 60 seconds."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Sync your advisory thesis & bio",
        desc: "Connect your site or LinkedIn—we extract your fractional specialty, ICP stage, and operator voice.",
        visualTopLabel: "Fractional Thesis Calibrated",
        visualBottomLabel: "Target: Seed–Series B CEOs"
      },
      {
        title: "Auto-build 30 days of playbooks",
        desc: "Generates 90-day roadmap carousels, audit checklists, and contrarian operator takes.",
        visualTopLabel: "30 Executive Playbook Posts",
        visualBottomLabel: "Carousels + Threads + Diagrams"
      },
      {
        title: "Run on daily personal autopilot",
        desc: "Review your queue in 60 seconds on Monday and let your feeds attract inbound CEO inquiries all week.",
        visualTopLabel: "Mon–Fri Autopilot Active",
        visualBottomLabel: "Waitlist: 4/4 Retainers Filled"
      }
    ],
    roiMetrics: [
      {
        metric: "100%",
        title: "Retainer Utilization",
        desc: "Never drop to zero pipeline when a 6-month fractional engagement wraps up."
      },
      {
        metric: "2 Min",
        title: "Monday Review Routine",
        desc: "Approve your entire week of LinkedIn and X thought leadership before your first Monday standup."
      },
      {
        metric: "1 Deal",
        title: "100x Annual ROI",
        desc: "A single inbound $8k/month fractional retainer pays for your autonomous stack for years."
      }
    ],
    comparison: [
      {
        dimension: "Consistency",
        oldWay: "Posting for 2 weeks when you need clients, then going silent for 4 months",
        withSolution: "Unbroken 5x/week executive publishing whether you have 1 client or 5"
      },
      {
        dimension: "Positioning",
        oldWay: "Looking like a freelancer begging for gigs",
        withSolution: "Positioned as a high-demand operating partner sharing proven systems"
      },
      {
        dimension: "Visual Credibility",
        oldWay: "Plain text posts that blend into the feed",
        withSolution: "Paired with custom architectural diagrams and executive quote cards"
      }
    ],
    sampleOutputs: [
      {
        channel: "Personal LinkedIn",
        badge: "90-Day Audit Playbook",
        title: "What I audit in the first 14 days as a Fractional Executive at a $5M ARR startup",
        hook: "Every time a founder brings me in at $5M ARR, they think they have a top-of-funnel problem. 9 times out of 10, it's a positioning and unit-economics leak. Here is my 5-step audit:",
        meta: "7-Slide Playbook Carousel · High CEO DM Conversion"
      },
      {
        channel: "Personal X Thread",
        badge: "Boardroom Heuristics",
        title: "6 red flags I look for in a Series A board deck before taking an advisory role",
        hook: "After sitting in 30+ board meetings, you can spot a broken GTM motion on Slide 3. Here are the 6 metrics founders hide—and how to fix them: 🧵👇",
        meta: "6-Tweet Thread · Operator Voice Clone"
      }
    ]
  },
  {
    slug: "ai-dev-tools",
    name: "AI-Native & DevTool Startups",
    shortName: "AI & DevTools",
    role: "Technical Threads & Architecture",
    badge: "AI & DEVTOOLS",
    heroHeadline: "Technical category creation on autopilot for",
    heroRotatingWords: ["AI startups.", "devtools.", "infra teams.", "open-source founders.", "ML engineers."],
    heroSubtitle: "Developers and CTOs ignore corporate marketing fluff. We translate your documentation, benchmarks, and system architecture into high-bookmark X threads, diagrams, and technical blog posts.",
    accentColor: "#34D399",
    assignedAgents: ["x", "designer", "blog"],
    painPointsSolved: [
      {
        tag: "Zero Fluff",
        title: "Engineered for Skeptical Developers",
        desc: "Bans marketing buzzwords. Focuses strictly on latency, architecture, DX, benchmarks, and real implementation patterns."
      },
      {
        tag: "Architecture Visuals",
        title: "System Diagrams & Benchmark Cards",
        desc: "Turns raw metrics and pipeline steps into dark-mode architectural diagrams that engineers bookmark and share."
      },
      {
        tag: "Launch Velocity",
        title: "Ship Thread + Docs + Blog in Sync",
        desc: "Every SDK update, model benchmark, or open-source release becomes a coordinated X thread, LinkedIn post, and technical guide."
      },
      {
        tag: "GEO & Search",
        title: "Cited by AI Coding Assistants",
        desc: "Publishes structured technical guides so ChatGPT, Claude, and Perplexity recommend your tool to developers."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Ingest docs, GitHub & benchmarks",
        desc: "Drop your docs URL or release notes—we extract your technical architecture, API surface, and performance edge.",
        visualTopLabel: "Docs + Benchmarks Indexed",
        visualBottomLabel: "Zero-Fluff Technical Mode"
      },
      {
        title: "Synthesize threads & diagrams",
        desc: "Builds multi-part X launch threads, dark-mode system diagrams, and deep technical blog comparisons.",
        visualTopLabel: "8-Tweet Dev Thread + Diagram",
        visualBottomLabel: "p99 Latency & DX Highlighted"
      },
      {
        title: "Broadcast across X, LinkedIn & Blog",
        desc: "Publish technical threads from your founder accounts and sync deep-dive guides straight to your blog.",
        visualTopLabel: "X + LinkedIn + Technical Blog",
        visualBottomLabel: "High Bookmark & Star Velocity"
      }
    ],
    roiMetrics: [
      {
        metric: "4.8x",
        title: "Developer Bookmarks",
        desc: "Architectural breakdowns and benchmark threads drive 4.8x more saves than standard product announcements."
      },
      {
        metric: "0",
        title: "Marketing Buzzwords",
        desc: "Strict negative constraints prevent 'revolutionary' clichés that alienate technical buyers."
      },
      {
        metric: "100%",
        title: "Engineering Focus",
        desc: "Founders and founding engineers stay in the codebase while maintaining daily technical visibility on X."
      }
    ],
    comparison: [
      {
        dimension: "Technical Depth",
        oldWay: "Hiring non-technical marketers who write vague, embarrassing copy",
        withSolution: "Grounded directly in your documentation, architecture, and real benchmarks"
      },
      {
        dimension: "Visual Assets",
        oldWay: "Screenshots of terminal windows that are impossible to read on mobile",
        withSolution: "High-contrast dark-mode architecture cards and benchmark comparisons"
      },
      {
        dimension: "Release Cadence",
        oldWay: "Shipping 10 features in GitHub while your X account sits silent for a month",
        withSolution: "Every weekly ship automatically turned into a high-signal launch thread"
      }
    ],
    sampleOutputs: [
      {
        channel: "Technical X Thread",
        badge: "Architecture Breakdown",
        title: "How we reduced p99 inference latency by 64% without quantization loss",
        hook: "Most teams try to fix agent latency at the prompt layer. The real bottleneck is cold-start KV cache routing. Here is the 6-part architecture we shipped today: 🧵👇",
        meta: "7 Tweets · Dark-Mode System Diagram · 98/100 Dev Signal"
      },
      {
        channel: "Technical Blog & GEO",
        badge: "Engineering Deep Dive",
        title: "Stateful Agent Orchestration vs. Stateless DAGs: 2026 Throughput Benchmark",
        hook: "We benchmarked 10,000 concurrent tool-calling sessions across 4 orchestration patterns. Here are the memory footprint and retry-loop results...",
        meta: "2,300 Words · Benchmark Tables · Cited by AI Search"
      }
    ]
  },
  {
    slug: "design-dev-studios",
    name: "Webflow, Product & Dev Studios",
    shortName: "Design & Dev Studios",
    role: "Shipped Work to Visual Showcases",
    badge: "CREATIVE STUDIOS",
    heroHeadline: "Turn shipped client projects into inbound leads for",
    heroRotatingWords: ["design studios.", "Webflow agencies.", "product studios.", "MVP shops.", "branding boutiques."],
    heroSubtitle: "You build world-class websites and products for clients, yet your own studio's social feeds are months out of date. Drop any shipped project link to generate 4:5 visual decks and teardown threads.",
    accentColor: "#EC4899",
    assignedAgents: ["designer", "instagram", "x"],
    painPointsSolved: [
      {
        tag: "Portfolio Engine",
        title: "Shipped URL to 10-Post Showcase",
        desc: "Paste the link to a client site you just launched—we extract the palette, typography, and UX story into a full showcase campaign."
      },
      {
        tag: "Editorial Polish",
        title: "Luxury 4:5 Visual Artboards",
        desc: "Renders minimalist, studio-grade 4:5 Instagram & LinkedIn carousels that match your agency's design taste."
      },
      {
        tag: "Behind-the-Build",
        title: "Process & Conversion Teardowns",
        desc: "Writes 'Before vs. After' conversion stories that show prospective founders why your studio commands premium pricing."
      },
      {
        tag: "Always Booking",
        title: "Fill Next Month's Studio Slots",
        desc: "Keep showcasing your craft daily even when your whole team is heads-down in a client sprint."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Drop your studio or shipped client URL",
        desc: "Paste your agency domain or a newly launched client project link to extract visual tokens and project highlights.",
        visualTopLabel: "Shipped Project URL Indexed",
        visualBottomLabel: "Palette + Typography Extracted"
      },
      {
        title: "Render 4:5 decks & build threads",
        desc: "Generates 4:5 portrait showcase carousels, typographic quote cards, and behind-the-build X & LinkedIn threads.",
        visualTopLabel: "4:5 Editorial Carousel Suite",
        visualBottomLabel: "+ Behind-the-Build Thread"
      },
      {
        title: "Auto-publish across visual & B2B feeds",
        desc: "Keep your Instagram, X, and LinkedIn feeds showcasing fresh studio work every week on autopilot.",
        visualTopLabel: "Instagram · X · LinkedIn",
        visualBottomLabel: "Inbound Studio Inquiries Active"
      }
    ],
    roiMetrics: [
      {
        metric: "5.8x",
        title: "More Portfolio Saves",
        desc: "4:5 behind-the-scenes breakdown carousels get bookmarked by founders planning their next redesign."
      },
      {
        metric: "60 Sec",
        title: "Case Study Build",
        desc: "Turn a finished client URL into a multi-channel case study without waiting months to write a portfolio page."
      },
      {
        metric: "$25k+",
        title: "Inbound Project Size",
        desc: "Editorial authority attracts funded startups ready for high-ticket retainers and builds."
      }
    ],
    comparison: [
      {
        dimension: "Case Study Publishing",
        oldWay: "Launching a client site and taking 6 months to post a case study",
        withSolution: "Paste the live client URL and generate a 10-post showcase in 60 seconds"
      },
      {
        dimension: "Aesthetic Quality",
        oldWay: "Generic social templates that embarrass a real design studio",
        withSolution: "Bespoke, pitch-black & warm-ivory editorial artboards with custom serif pairings"
      },
      {
        dimension: "Business Development",
        oldWay: "Relying purely on word-of-mouth referrals and cold outreach",
        withSolution: "Daily visual proof on X, LinkedIn, and Instagram driving inbound DMs"
      }
    ],
    sampleOutputs: [
      {
        channel: "Instagram & LinkedIn 4:5 Deck",
        badge: "Redesign Teardown",
        title: "How we redesigned a Series A AI startup's hero section to lift demo conversions by 48%",
        hook: "Slide 01/07: Most AI startups hide their product behind abstract 3D blobs. Here is how we used architectural typography and live micro-UI to double conversion:",
        meta: "7 Slides · 1080x1350 Portrait · Studio Brand Locked"
      },
      {
        channel: "X Behind-the-Build Thread",
        badge: "Design System Thread",
        title: "5 typography & grid rules we used on our latest fintech build",
        hook: "We just shipped a full rebrand + Webflow build in 21 days. Here are the 5 layout and micro-interaction decisions that made it feel like a $100M brand: 🧵👇",
        meta: "6 Tweets + 4:5 Visual Plates · High Save Velocity"
      }
    ]
  },
  {
    slug: "venture-studios",
    name: "Venture Studios, Micro-VCs & Solo GPs",
    shortName: "Venture & Solo GPs",
    role: "Thesis Distribution & Deal Flow",
    badge: "VENTURE & SOLO GPS",
    heroHeadline: "Attract top-decile technical founders for",
    heroRotatingWords: ["solo GPs.", "venture studios.", "micro-VCs.", "operator funds.", "angel syndicates."],
    heroSubtitle: "The best founders choose investors whose thesis they already read. Turn your investment memos, market maps, and portfolio wins into daily X discourse, LinkedIn essays, and Substack issues.",
    accentColor: "#818CF8",
    assignedAgents: ["research", "x", "blog"],
    painPointsSolved: [
      {
        tag: "Thesis Reach",
        title: "Turn Investment Memos Into Public Magnets",
        desc: "Transforms internal sector research into sharp X threads and LinkedIn essays that signal deep domain conviction."
      },
      {
        tag: "Deal Flow",
        title: "Inbound From Pre-Seed & Seed Builders",
        desc: "When you publish clear thesis breakdowns, technical founders send you their deck before talking to tier-1 funds."
      },
      {
        tag: "Portfolio Halo",
        title: "Amplify Portfolio Company Launches",
        desc: "Drop any portfolio company's URL to generate high-signal spotlight threads and partner commentary."
      },
      {
        tag: "LP Visibility",
        title: "Consistent Market Intelligence",
        desc: "Keep LPs, co-investors, and founders engaged with weekly market maps and long-form newsletter dispatches."
      }
    ],
    threeStepPlaybook: [
      {
        title: "Sync fund thesis & portfolio links",
        desc: "Drop your fund URL or thesis memo—we map your sector focus, contrarian beliefs, and GP voice.",
        visualTopLabel: "Fund Thesis & Portfolio Synced",
        visualBottomLabel: "GP Voice Heuristics Mapped"
      },
      {
        title: "Synthesize market maps & essays",
        desc: "Builds X thesis threads, LinkedIn partner essays, visual market maps, and LP/founder newsletter editions.",
        visualTopLabel: "Thesis Memo -> 30 Native Assets",
        visualBottomLabel: "Threads · Essays · Market Maps"
      },
      {
        title: "Auto-publish across GP & fund feeds",
        desc: "Maintain daily presence on X and LinkedIn while spending 100% of your time meeting founders.",
        visualTopLabel: "GP Personal X + LinkedIn",
        visualBottomLabel: "Compounding Inbound Deal Flow"
      }
    ],
    roiMetrics: [
      {
        metric: "3.8x",
        title: "Inbound Founder DMs",
        desc: "Public thesis threads attract technical builders building in your exact target verticals."
      },
      {
        metric: "60 Sec",
        title: "Portfolio Spotlight",
        desc: "Turn any portfolio company's announcement into a polished GP endorsement thread in one click."
      },
      {
        metric: "52 Wks",
        title: "Unbroken Thesis Presence",
        desc: "Stay top-of-mind with founders and LPs every single week of the year."
      }
    ],
    comparison: [
      {
        dimension: "Thesis Distribution",
        oldWay: "Writing one Medium post a year that only 200 people read",
        withSolution: "Slicing every thesis into daily high-velocity X threads, LinkedIn essays & diagrams"
      },
      {
        dimension: "Portfolio Support",
        oldWay: "A generic 'Proud to back @company!' quote tweet",
        withSolution: "Deep, analytical breakdown of why the portfolio company wins its category"
      },
      {
        dimension: "GP Time Allocation",
        oldWay: "Zero time to write between pitch meetings, diligence, and board calls",
        withSolution: "60-second weekly approval keeps your personal GP brand active daily"
      }
    ],
    sampleOutputs: [
      {
        channel: "GP X Thesis Thread",
        badge: "Sector Market Map",
        title: "Why vertical AI agents are unbundling legacy $10B ERP workflows",
        hook: "Over the last 90 days we met 60+ seed founders building in industrial and finance automation. The winners aren't building copilots—they are replacing the system of record. Our 7-part thesis: 🧵👇",
        meta: "7-Tweet Thread · Market Map Diagram · High Founder Reach"
      },
      {
        channel: "Partner LinkedIn & Substack",
        badge: "Investment Memo",
        title: "The Seed-to-Series A Chasm in 2026: What Revenue Quality Actually Means",
        hook: "Headline ARR is no longer enough to clear a Series A bar. Here are the 4 retention and net-dollar-expansion benchmarks we advise our portfolio founders to hit...",
        meta: "1,400 Words · GP Voice Clone · Newsletter + LinkedIn Sync"
      }
    ]
  }
];

export function getSolutionBySlug(slug: string): SolutionData | undefined {
  const normalized = slug?.toLowerCase().trim();
  if (normalized === 'founder' || normalized === 'personal-branding' || normalized === 'ceo') {
    return SOLUTIONS_LIST[0];
  }
  if (normalized === 'saas') return SOLUTIONS_LIST.find(s => s.slug === 'b2b-saas');
  if (normalized === 'agency' || normalized === 'agencies') return SOLUTIONS_LIST.find(s => s.slug === 'boutique-agencies');
  return SOLUTIONS_LIST.find(s => s.slug === normalized);
}

export function renderSolutionIcon(slug: string, sizeClass = "w-4 h-4"): React.ReactNode {
  switch (slug) {
    case 'founders':
      return (
        <svg className={`${sizeClass} text-[#C084FC]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        </svg>
      );
    case 'b2b-saas':
      return (
        <svg className={`${sizeClass} text-[#38BDF8]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      );
    case 'boutique-agencies':
      return (
        <svg className={`${sizeClass} text-[#10B981]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      );
    case 'consultancies':
      return (
        <svg className={`${sizeClass} text-[#A78BFA]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      );
    case 'fractional-executives':
      return (
        <svg className={`${sizeClass} text-[#F59E0B]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    case 'ai-dev-tools':
      return (
        <svg className={`${sizeClass} text-[#34D399]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      );
    case 'design-dev-studios':
      return (
        <svg className={`${sizeClass} text-[#EC4899]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
      );
    default:
      return (
        <svg className={`${sizeClass} text-[#818CF8]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      );
  }
}

