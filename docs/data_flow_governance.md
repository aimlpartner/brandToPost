# Data Flow & Governance Document

This document outlines the data sourcing, ingestion pipelines, storage schema, access controls, auditability, and regulatory compliance protocols implemented across the **BrandToPost** platform.

---

## 1. Data Lifecycle Map

The platform processes data through four discrete lifecycle phases: Ingestion, Synthesis, Persistence, and Social Syndication.

```
       [ USER WEBSITE ]
              │
              ▼ (Scraping via Puppeteer)
       [ INGESTION ENGINE ] ──(Raw Styles & Text Content)──► [ GEMINI PIPELINE ]
                                                                    │
                                                                    ▼
                                                            [ PERSISTENCE LAYER ]
                                                          (Firestore productiondb)
                                                                    │
                                                                    ▼
                                                            [ AUTOMATION AUTO-PILET ]
                                                                    │
                                                                    ▼ (Outbound Publishing)
                                                            [ SOCIAL & WHATSAPP ENDPOINTS ]
```

---

## 2. Ingestion Pipelines & Sourcing

1.  **Brand Landing Page Scrapes**:
    *   **Source**: Public corporate websites provided by authenticated users.
    *   **Scope**: Raw text body (up to 20,000 characters), active CSS style tokens (computed font families, text and background hex colors), vector SVGs, and images.
    *   **Storage Path**: Kept transiently in memory, then summarized and stored as JSON properties inside the Firestore `/products` collection.
2.  **Voice DNA Profiles**:
    *   **Source**: Outbound voice recordings uploaded by founders to capture specific vocal styles and audio files.
    *   **Scope**: Audio file metadata (name, size, MIME type) and base64-encoded audio parameters.
    *   **Storage Path**: Kept securely locked in the database under `/products` document properties and local sandboxed file caches. Used exclusively to train user-specific voice synthesis tasks.
3.  **Collaborative Review Feedback**:
    *   **Source**: Team collaborators and external reviewers using shared public links.
    *   **Scope**: Real-time review comments, reviewer identity tags, and timestamp indexes.
    *   **Storage Path**: Saved under the `/feedback` collection, linking directly back to the target Campaign ID.

---

## 3. Database Schema & Persistence Inventory

The platform persists structured information in a Google Cloud Firestore instance under the `productiondb` database namespace. Below is the audited database collections register:

### 3.1. Collection: `/products`
Stores brand identities, scraped styling tokens, psychographic DNA strategy points, voice descriptors, and active autopilot configurations.
*   **Fields**:
    *   `id` (*string*): Unique UUID/Firebase ID.
    *   `name` (*string*): Brand name.
    *   `website` (*string*): Source landing page URL.
    *   `positioning` (*string*): AI-inferred market segment positioning.
    *   `visualData` (*map*): `{ colors: string[], fonts: { primary: string, secondary: string } }`.
    *   `hellState` / `heavenState` (*string*): Pain point mapping vectors.
    *   `uniqueMechanism` / `earnedSecret` (*string*): Strategic competitive anchors.
    *   `founderAgentSynthesized` (*map*): `{ personaName, behavioralTraits[], communicationStyle[], coreValues[], decisionHeuristics[] }`.
    *   `automationAgentEnabled` (*boolean*): Active autopilot toggle.

### 3.2. Collection: `/campaigns`
Stores generated weekly social campaigns, specific copy variations per platform, image overlay layouts, and calendar schedules.
*   **Fields**:
    *   `id` (*string*): Unique Campaign UUID.
    *   `productId` (*string*): Reference to the parent brand in `/products`.
    *   `theme` (*string*): Weekly narrative anchor.
    *   `dailyPosts` (*array*): Array of posts containing copy variations for LinkedIn, X, Reddit, Facebook, Instagram.
    *   `isShared` (*boolean*): Review link active toggle.
    *   `confidenceScore` (*number*): Relevance confidence metrics (0-100).
    *   `createdAt` (*string*): ISO Timestamp.

### 3.3. Collection: `/server_queues/{productId}/posts`
Maintains the active queue of social posts scheduled for native channel publishing.
*   **Fields**:
    *   `id` (*string*): Target post identifier.
    *   `day` (*string*): Monday-Sunday index.
    *   `platformVersions` (*array*): Formatted native social media platform copy parameters.
    *   `createdAt` (*string*): Timestamp.

### 3.4. Collection: `/token_usage`
Tracks prompt, candidate, and total LLM tokens used by operation, model, and user ID.
*   **Fields**:
    *   `userId` (*string*): Creator account ID.
    *   `operationType` (*string*): Operation tag (e.g. `researchProductDNA`, `generateCampaign`, `generateImage`).
    *   `model` (*string*): Target engine (e.g., `gemini-3.1-pro-preview`, `gemini-3.1-flash-image-preview`).
    *   `promptTokenCount` (*number*): Input tokens.
    *   `candidatesTokenCount` (*number*): Output tokens.
    *   `totalTokenCount` (*number*): Accumulated transaction count.
    *   `timestamp` (*string*): Audit timestamp.

### 3.5. Collection: `/server_tokens`
Stores social media API publishing credentials and Meta developer tokens securely.
*   **Fields**:
    *   `productId` (*string*): Document ID referencing the brand.
    *   `linkedin` / `facebook` / `instagram` / `reddit` (*string*): Encrypted or secure OAuth credentials.
    *   `whatsapp` (*string*): Outbound WhatsApp token.
    *   `whatsapp_phone_number_id` (*string*): Meta phone ID.

### 3.6. Collection: `/whatsapp_conversations`
Maintains persistent transaction logs of live chats with the WhatsApp agent.
*   **Fields**:
    *   `id` (*string*): Chat ID.
    *   `messages` (*array*): Chat message array logs.
    *   `lastUpdated` (*string*): Audit timeline index.

---

## 4. Security, Access Controls & Anonymization

1.  **Multi-Tenant Isolation**:
    *   Authentication is handled via Firebase Client SDK.
    *   All server endpoints validate incoming requests using the `requireAuth` middleware, which decodes JWT Bearer Tokens via Firebase Admin verification: `admin.auth().verifyIdToken(token)`.
    *   Database queries filter matches on `userId` (retrieved from the validated auth context) to prevent cross-tenant leakage.
2.  **Voice and Media Isolation**:
    *   Voice parameters are stored inside the user's isolated `/products` document.
    *   Audio files are locked down. Voice profiles are never pooled, exported, or utilized to train general foundation models.
3.  **Data Deletion ("Right to be Forgotten")**:
    *   When a user requests product or account deletion, Firestore cascade deletion rules remove all entries under `/products/{id}`, `/campaigns` linked to that product ID, the queued elements in `/server_queues/{id}/posts`, and any credentials in `/server_tokens/{id}`.

---

## 5. Audit Trails & Token Governance

To prevent API abuse and OOM costs, BrandToPost implements a systematic token tracing model:
*   Every AI transaction automatically extracts token usage headers (`usageMetadata`) returned by the Google GenAI SDK.
*   These are immediately persisted inside `/token_usage` for administrative cost monitoring and rate limit checks.
*   Puppeteer scrapes (`puppeteer_web_scrape`) and HTML-to-image graphic renderings (`puppeteer_overlay_render`) log a flat weight of 1 "synthetic token transaction" per process execution to trace usage metrics.
*   Rate limiting is enforced at the route level using `routeRateLimiter` windows (e.g. 15 requests/minute for campaign generation, 6 requests/minute for visual renders).
