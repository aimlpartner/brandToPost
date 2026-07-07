# BrandToPost — Repository Context & AI Assistance Codex (AGENTS.md)

This document provides a structural mapping, coding standard codex, and specialized agent context for **BrandToPost**. It serves as the primary guidance file for AI engineering assistants, code editors, and automated tools working within this repository.

---

## 1. Project Directory & Core File Map

```
/ (Repository Root)
├── docs/                             # Core technical architecture and governance documents
│   ├── system_architecture.md        # Stack maps, data pipelines, and Mermaid diagrams
│   ├── data_flow_governance.md       # Ingestion lifecycle, Firestore collections, GDPR rules
│   ├── model_card_evaluation.md      # Gemini models list, task allocations, safety rules
│   └── api_integration.md            # API routes documentation, parameters, and authentication
├── public/                           # Static assets, fonts, and local whatsapp_images/ caches
├── src/                              # Front-end React Application source code
│   ├── components/                   # Reusable UI elements, modals, consoles, and renderers
│   │   ├── AgentFlipbook.tsx         # Specialist details display modal
│   │   ├── RevolvingAgents.tsx       # Frontpage rotating specialist UI
│   │   ├── LiveLogsConsole.tsx       # Real-time server diagnostics logging view
│   │   ├── VisualEngine.tsx          # Client side visual rendering templates
│   │   └── VisualEditorModal.tsx     # Large creative editing console (63KB)
│   ├── contexts/                     # React Context State management
│   │   ├── AuthContext.tsx           # Firebase client authentication token handler
│   │   └── ProductContext.tsx        # Brand DNA state, active configurations, scrapers
│   ├── lib/                          # Utility wrappers and helpers
│   │   ├── pdfGenerator.ts           # PDF report builder
│   │   └── fonts.ts                  # Typography registry loader
│   ├── pages/                        # Main screens and dashboard modules
│   │   ├── Dashboard.tsx             # Primary overview analytics
│   │   ├── ProductDNA.tsx            # Scraping and psychographics management page
│   │   ├── Campaigns.tsx             # Post curation, copy tweaking, and calendar management
│   │   └── WhatsAppSystem.tsx        # Interactive chat and configurations
│   ├── services/                     # API client services
│   │   ├── geminiService.ts          # Outbound AI routing, prompt mappings, and fallback loops
│   │   └── loggerService.ts          # App-wide diagnostics logger
│   ├── types.ts                      # Core TypeScript definitions (ProductDNA, Campaigns)
│   ├── App.tsx                       # Main Router and Page shell wrapper
│   └── index.css                     # Main styling file (Tailwind v4 integrations)
├── server.ts                         # Express Application Backend server (Main Entrypoint)
├── firestore.rules                   # Firebase security configurations for document access
├── package.json                      # Build scripts and project dependencies
└── tsconfig.json                     # TypeScript compilation settings
```

---

## 2. Core Coding Standards

1.  **Strict Type Safety**: All data structures must align to definitions in [types.ts](file:///d:/updated_b2p_prod/src/types.ts). Avoid the `any` keyword unless parsing dynamic third-party payloads transiently.
2.  **API Call Isolation**: Never call the Gemini API or write directly to Firebase from client-side code. All calls must run through server proxies (e.g. `/api/ai/generate`) to protect security keys and restrict rate limits.
3.  **Mutex Lock Safeguards**: Complex headless processes (like web scraping or graphic rendering) must be wrapped inside `runWithRenderLock` blocks in [server.ts](file:///d:/updated_b2p_prod/server.ts) to prevent OOM server failure.
4.  **Error Integrity**: Use `logSilentError` or the [loggerService.ts](file:///d:/updated_b2p_prod/src/services/loggerService.ts) helper on the backend instead of empty catch blocks to ensure debugging traceability.

---

## 3. Anti-Slop Codex (Aesthetic Guidelines)

AI assistants editing front-end files must strictly adhere to the brand design principles defined in `design.md` to prevent generic "AI slop templates":

*   **No Pill Badges & Sparkle Icons**: Remove rounded pill badges like "✨ AI Powered" above headers. Let high-quality typography do the styling.
*   **No Blue-to-Purple Gradients**: Avoid default SaaS gradients. Use pitch black (`#08080C`) for dark headers and warm off-white (`#FAF9F6`) for sections. Do not use generic cold grays (`bg-gray-50`, `bg-slate-50`).
*   **No Card Soup**: Avoid rounded glass-morphism boxes floating on background shadows. Place elements directly onto the warm off-white page canvas separated by thin border rules (`border-slate-900/10`).
*   **Consolidated Workspaces**: To prevent endless scrolling, group dashboards into compact, tabbed consoles (e.g., list on the left, dynamic preview on the right).
*   **Sentence-Casing Button Styling**: Do not style buttons in all-caps uppercase monospace. Use standard sentence/title casing, modern sans-serif typography (`Inter Tight`), and subtle micro-animations (opacity transitions, underline reveals) instead of card-scaling.

---

## 4. Specialist Agent Roles Registry

When working with prompt engines or specialist context layers, align prompts with these agent profiles:

1.  **Arthur (Voice & DNA Clone)**: Calibrated for Founder Persona. Matches the founder's heuristics, vocabulary preferences, and values so drafted copy reads naturally, not robotic.
2.  **Sarah (Market Researcher)**: Responsible for live web scrapes. Extracts market metrics, pain points, competitor complaints, and active trends.
3.  **Alex (Multi-Channel Copywriter)**: Platform-native copy writer. Tailors character lengths, breaks, threads, and styling specifically for LinkedIn, X, Reddit, Facebook, or Instagram.
4.  **Chloe (Creative Director)**: Ideates layout spacing rules, graphic concepts, and negative space formatting.
5.  **Julian (Visual Publisher)**: Integrates the headless browser stack to construct HTML layouts, layer brand graphics, and snap PNG templates.
6.  **Zack (Video Screenwriter)**: Formulates B2B video scripts, Luma/Sora/Runway prompts, sound effect cues, and direct scripts.
7.  **Maya (Autopilot Manager)**: Orchestrates database polling, checks UTC schedulers, coordinates queues, and logs automation histories.
