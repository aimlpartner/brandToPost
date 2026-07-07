# System Architecture Documentation

This document provides a comprehensive map of the tech stack, execution pipelines, data networks, and backend systems that compose the **BrandToPost** platform.

---

## 1. System Topology Diagram

Below is the Mermaid sequence/topology map illustrating the lifecycle of user actions, API translations, AI invocation, headless image rendering, and native social distribution.

```mermaid
graph TD
    %% User Interfaces & Client
    subgraph ClientLayer ["Client Layer (React & Vite)"]
        UI["Web App Dashboard (React)"]
        AuthCtx["Auth Context (Firebase Client Auth)"]
        ProdCtx["Product Context (State & DNA)"]
        EditorModal["Visual Editor Modal (Canvas Manipulation)"]
        LogsConsole["Live Logs Console (Real-time Feedback)"]
    end

    %% Application Server
    subgraph ServerLayer ["Server Layer (Node.js & Express)"]
        Server["Express API Server (server.ts)"]
        RouteLimiter["Rate Limiting Middleware"]
        AuthMiddleware["Auth Middleware (Firebase Admin Auth Verification)"]
        ScrapeEngine["Puppeteer Scraping Engine (Brand Scraper)"]
        RenderEngine["Puppeteer Render Engine (HTML-to-Image Canvas)"]
        ScheduleWorker["Autopilot Automation Manager (Weekly/Daily Cron Loops)"]
    end

    %% State and Persistence Layer
    subgraph PersistenceLayer ["Persistence Layer (Firebase Firestore)"]
        FirestoreDB[("Cloud Firestore (productiondb Database)")]
        UsersColl["/users (User Metadata)"]
        ProdColl["/products (Scraped Brand DNA, Brand Fonts/Colors, Voice Clone Data)"]
        CampColl["/campaigns (Weekly Campaigns, Daily Social Post Copies)"]
        QueueColl["/server_queues/{productId}/posts (Queued Posts Queue)"]
        SchedColl["/server_schedules (Cron Configurations)"]
        TokenColl["/server_tokens (OAuth Access Credentials)"]
        UsageColl["/token_usage (Audit Logs: LLM Token Tracking, Puppeteer Render Audits)"]
        ImgColl["/whatsapp_images (Image Metadata & Base64 Assets)"]
    end

    %% Artificial Intelligence Engines
    subgraph AILayer ["AI Layer (Google Gemini & Imagen)"]
        GenAISDK["@google/genai SDK Client"]
        GeminiPro["gemini-3.1-pro-preview (DNA & Synthesis Reasoning)"]
        GeminiFlash["gemini-3.5-flash (Structured Weekly Calendars)"]
        GeminiCheap["gemini-2.5-flash (Fast Topic Suggestion & Formatting)"]
        ImagenAI["gemini-3.1-flash-image-preview (AI Backdrop Generation)"]
    end

    %% External Interfaces
    subgraph ExternalServices ["External Platform Network"]
        LinkedIn["LinkedIn API v2 (Publishing & OAuth)"]
        MetaInstagram["Meta Graph API (Instagram Publishing & Webhooks)"]
        MetaFacebook["Meta Graph API (Facebook Publishing & Status)"]
        Reddit["Reddit API (OAuth & Publishing)"]
        MetaWhatsApp["Meta WhatsApp Cloud API (Outbound & Webhooks)"]
        NodemailerSMTP["Nodemailer (SMTP Relay Email Campaigns)"]
    end

    %% Connections - Client to Server
    UI --> AuthCtx
    UI --> ProdCtx
    UI --> EditorModal
    UI --> LogsConsole
    ProdCtx & EditorModal -->|HTTP Requests with Firebase Bearer Token| RouteLimiter
    RouteLimiter --> AuthMiddleware
    AuthMiddleware -->|Validated req.user| Server

    %% Connections - Server to Services
    Server -->|admin.auth() Verify ID Token| AuthCtx
    Server -->|Read/Write Operations| FirestoreDB
    Server -->|Launches browser instances| ScrapeEngine
    Server -->|Bespoke HTML -> Screenshots| RenderEngine
    ScheduleWorker -->|Polled loop execution| Server
    
    %% Firestore DB Links
    FirestoreDB --- UsersColl
    FirestoreDB --- ProdColl
    FirestoreDB --- CampColl
    FirestoreDB --- QueueColl
    FirestoreDB --- SchedColl
    FirestoreDB --- TokenColl
    FirestoreDB --- UsageColl
    FirestoreDB --- ImgColl

    %% Server to AI Connections
    Server -->|Secure Outbound Proxied Requests| GenAISDK
    GenAISDK --> GeminiPro
    GenAISDK --> GeminiFlash
    GenAISDK --> GeminiCheap
    GenAISDK --> ImagenAI

    %% External Network Links
    Server -->|Meta Graph Integration| MetaInstagram
    Server -->|Meta Graph Integration| MetaFacebook
    Server -->|OAuth & v2 Endpoint Publishing| LinkedIn
    Server -->|Subreddit Distribution| Reddit
    Server -->|Transactional Messages & Bots| MetaWhatsApp
    Server -->|Nodemailer SMTP Transport| NodemailerSMTP
```

---

## 2. Tech Stack Specification

*   **Frontend Foundations**: Built on **React 18.3** scaffolded via **Vite 5.2**. Route management is controlled via **React Router DOM v6**. Styling uses **Vanilla CSS** coupled with **Tailwind CSS v4** (via `@tailwindcss/vite` integration) adhering strictly to our Anti-Slop Codex (warm off-white canvas `#FAF9F6`, pitch black section headers `#08080C`, and sharp typography highlights using `Inter Tight`).
*   **Backend Server**: A **TypeScript Node.js** runtime powered by **Express 4.19**. Express handles JSON serialization limit overrides (up to 50MB) for raw canvas sync, cookie parsing for secure OAuth sessions, and CORS bypass relays for remote brand logos.
*   **Database & Authentication**: Controlled via **Firebase Admin SDK v12** and **Firebase Client SDK v10**. In production environments, state is stored inside a dedicated Firestore database named `productiondb`.
*   **AI SDK**: Employs the official `@google/genai` library, which proxies requests securely via `/api/ai/generate` to isolate keys on the server side.
*   **Headless Rendering Engine**: Powered by **Puppeteer v25**, executing Chrome binaries inside a containerized sandbox to parse CSS typography overlay layouts.

---

## 3. Core Execution Pipelines

### Pipeline A: Brand Scraping & Product DNA Ingestion
1.  The user provides their company URL in the onboarding interface.
2.  The backend routes the request to `/api/scrape` under a `runWithRenderLock` mutex block (preventing out-of-memory OOM server crashes).
3.  Puppeteer spins up a headless browser, navigates to the URL, and parses:
    *   **Text content**: Extracted up to 20,000 characters from paragraphs and headers.
    *   **Styles**: Scrapes computed font families, text colors, and background colors.
    *   **Images**: Identifies high-resolution media images (>150px dimensions).
    *   **Logo Finder**: Runs a multi-tiered logo selection engine scanning alt tags, class names, navigation headers, vector SVGs, and fallback `og:image` tags.
4.  The scraped payload is compiled and sent to `gemini-3.1-pro-preview` inside `researchProductDNA` to generate structured B2B strategy points (ICP pain points, unique mechanisms, hell/heaven states, earned secrets).

### Pipeline B: Multi-Specialist Agent Campaign Generation
1.  **Stage 1: Strategy Research** (`sarah`): Runs search queries via Google Search integration (`search: true`) on the target industry to retrieve live trends, competitor positioning gaps, and complaints.
2.  **Stage 2: Core Calendar Formulation** (`alex`): Translates product DNA + industry research into a structured weekly campaign using `gemini-3.5-flash` under strict JSON schemas. It maps out weekly themes, CTA anchors, target audience, and day-by-day (Monday-Sunday) specific platform copies (LinkedIn, X, Reddit, Facebook, Instagram).
3.  **Stage 3: Platform Formatting** (`alex`): platform-specific copies are cleaned and structured (e.g., generous line breaks for LinkedIn, characters limitations for X, and markdown syntax blocks for Reddit).
4.  **Stage 4: Creative Blueprinting** (`chloe`): Ideates background graphic prompts and text overlay layouts to ensure high negative space layout constraints.

### Pipeline C: Creative Image Generation & Overlap Safeguards
1.  **Backdrop Generation**: The generated cinematic image prompt is submitted to Imagen AI (`gemini-3.1-flash-image-preview`) with dimensions configured to square (1:1 aspect ratio, 1K resolution).
2.  **Overlay Configuration**: Chloe determines layout settings (logo position vs. text position) based on the template type.
3.  **Overlap Prevention Guardrails**:
    *   If the text layout position is configured to `bottom`, the logo position is automatically forced to `top-right` or `top-left`.
    *   If the text layout position is configured to `top`, the logo position is automatically forced to `bottom-right` or `bottom-left`.
    *   If both align to the same boundary, layout algorithms force the logo to the opposite vertical side to ensure zero overlap with text nodes.

### Pipeline D: Headless HTML Overlay Graphics Rendering
1.  The client or autopilot worker calls the `/api/render-visual` endpoint with the backdrop image URL, brand DNA, text overlays, and logo assets.
2.  Puppeteer opens a clean sandbox page, sets the viewport size precisely to 1080x1080px (the high-DPI magazine social media grid standard), and injects a bespoke HTML structure.
3.  The HTML utilizes robust **flex layouts** (flex-direction: column) with safe line-height thresholds (1.2+) rather than absolute positioning to protect font bounding boxes from overlapping.
4.  Once assets are fully loaded and rendered, Puppeteer takes a viewport screenshot, flattens the result, compresses it to PNG format, and returns the asset string, saving it to disk (`public/whatsapp_images/`) and storing metadata in Firestore.

### Pipeline E: Autopilot Automation Scheduler
1.  The background Schedule Manager (`ScheduleWorker` in `server.ts`) polls Firestore `server_schedules` looking for configurations where `enabled === true`.
2.  It matches the current system time against the configured UTC publishing schedule (`automationTimeUtc` and `automationWeeklyDay`).
3.  When a schedule fires:
    *   It checks the post queue `/server_queues/{productId}/posts`.
    *   If a post is ready, the scheduler retrieves the platform access credentials from `/server_tokens`.
    *   It issues publication commands native to each social channel.
    *   Upon successful dispatch, it logs records into `automationLogs` and removes the post from the active queue.
    *   If a network or publishing failure occurs, the post is pushed to `failed_posts` with the stack error trace to allow manual diagnostic recovery.

### Pipeline F: WhatsApp Direct Messaging Hub
1.  Inbound webhook events arrive at `POST /api/webhooks/instagram` or standard WhatsApp webhooks.
2.  The server extracts the sender identity, parses the message body, and checks for keyword triggers.
3.  If configured as a helper bot, the server queries the database context for the active brand, processes the query via Gemini, and pushes structured responses (copies, schedule updates, or PDF campaign reports) using the Meta WhatsApp Cloud API outbound pipeline.
4.  All interactions are logged dynamically inside the `whatsapp_conversations` collection to power the real-time `LiveLogsConsole` and WhatsApp UI dashboards.
