# API & Integration Documentation

This document provides a detailed specification for the backend endpoints, request/response structures, rate limits, and authentication middlewares of the **BrandToPost** platform.

---

## 1. Security & Authentication

All API endpoints, with the exception of OAuth endpoints and public webhooks, require user authentication.

*   **Middleware**: `requireAuth`
*   **Header**: `Authorization: Bearer <Firebase_ID_Token>`
*   **Behavior**: Decodes the JWT token via Firebase Admin (`admin.auth().verifyIdToken()`) and attaches the payload to `req.user`. If Firebase Admin is not configured (sandbox environments), the check logs a warning and bypasses validation for preview ease.

---

## 2. Global Rate Limiter

Critical endpoints use the `routeRateLimiter(limit, windowMs)` middleware to prevent denial of service and API quota exhaustion:
*   *Scrape Engine*: 3 requests per minute.
*   *AI Generation*: 15 requests per minute.
*   *Image Rendering*: 6 requests per minute.
*   *Social Publishing*: 5 requests per minute.

---

## 3. Endpoint Reference Catalogue

### 3.1. Ingestion & Brand Extraction

#### `POST /api/scrape`
Scrapes public websites using Puppeteer to retrieve raw text, active colors, fonts, and assets to construct the brand's Product DNA.
*   **Auth**: Required (Rate limit: 3/min)
*   **Request Body**:
    ```json
    { "url": "https://example.com" }
    ```
*   **Response Body (200 OK)**:
    ```json
    {
      "success": true,
      "textContent": "...",
      "extractedFonts": ["Inter Tight", "Roboto"],
      "extractedColors": ["rgb(124, 58, 237)", "rgb(250, 249, 246)"],
      "extractedBgColors": ["rgb(8, 8, 12)"],
      "mediaImages": ["https://example.com/hero.jpg"],
      "logoUrl": "https://example.com/logo.svg",
      "cssContent": "..."
    }
    ```

#### `GET /api/download-logo`
CORS-bypass proxy that downloads remote logo images to the server and serves them to prevent browser canvas security violations.
*   **Query Parameters**: `?url=<URL>&filename=<Name>`
*   **Response**: Binary image stream with attachment disposition.

---

### 3.2. Artificial Intelligence Proxies

#### `POST /api/ai/generate`
Secure outbound gateway that instantiates the Google GenAI SDK and forwards requests to Gemini models without exposing API keys.
*   **Auth**: Required (Rate limit: 15/min)
*   **Request Body**:
    ```json
    {
      "model": "gemini-3.1-pro-preview",
      "contents": [{ "parts": [{ "text": "Draft a LinkedIn hook..." }] }],
      "config": { "responseMimeType": "application/json" }
    }
    ```
*   **Response Body (200 OK)**:
    ```json
    {
      "text": "Generated response string...",
      "usageMetadata": { "promptTokenCount": 140, "candidatesTokenCount": 85, "totalTokenCount": 225 },
      "candidates": [...]
    }
    ```

#### `POST /api/render-visual`
Invokes Puppeteer to render a custom, styled B2B card and return a high-DPI screenshot.
*   **Auth**: Required (Rate limit: 6/min)
*   **Request Body**:
    ```json
    {
      "visualType": "creative-story",
      "visualData": {
        "headline": "Stop writing bad copy.",
        "subtext": "Arthur Synthesis Engine",
        "layout": { "textPosition": "bottom", "logoPosition": "top-right" }
      },
      "imageUrl": "https://example.com/backdrop.png",
      "activeLogo": "https://example.com/logo.png"
    }
    ```
*   **Response Body (200 OK)**:
    ```json
    { "url": "data:image/png;base64,iVBORw0KGgoAAAANSU..." }
    ```

---

### 3.3. Autopilot & Scheduling

#### `GET /api/schedule`
Retrieves the schedule configuration for a brand.
*   **Auth**: Required
*   **Response Body (200 OK)**:
    ```json
    {
      "enabled": true,
      "timeUtc": "14:00",
      "days": ["Monday", "Wednesday", "Friday"]
    }
    ```

#### `POST /api/automation/config`
Updates autopilot configurations for daily posts, blogs, and weekly campaigns.
*   **Auth**: Required
*   **Request Body**:
    ```json
    {
      "automateDailyPosts": true,
      "automateDailyBlogs": false,
      "automateWeeklyCampaigns": true,
      "automationTimeUtc": "09:00",
      "automationWeeklyDay": "Monday"
    }
    ```
*   **Response Body (200 OK)**:
    ```json
    { "success": true }
    ```

#### `POST /api/automation/trigger`
Immediately triggers a run of the Autopilot campaign writer and publisher pipeline.
*   **Auth**: Required
*   **Response Body (200 OK)**:
    ```json
    { "success": true, "message": "Autopilot run completed successfully." }
    ```

---

### 3.4. Social Publishing (Meta Graph & LinkedIn)

#### `POST /api/linkedin/publish`
Publishes copy and image media natively to LinkedIn.
*   **Auth**: Required (Rate limit: 5/min)
*   **Request Body**:
    ```json
    {
      "copy": "My LinkedIn post content...",
      "mediaUrl": "https://example.com/render.png"
    }
    ```
*   **Response Body (200 OK)**:
    ```json
    { "success": true, "activityId": "urn:li:share:123456789" }
    ```

#### `POST /api/instagram/publish`
Publishes photos and captions directly to Instagram.
*   **Auth**: Required (Rate limit: 5/min)
*   **Request Body**:
    ```json
    {
      "imageUrl": "https://example.com/render.png",
      "caption": "My post description..."
    }
    ```
*   **Response Body (200 OK)**:
    ```json
    { "success": true, "mediaId": "ig_media_12345" }
    ```

---

### 3.5. Meta Webhooks

#### `GET /api/webhooks/instagram`
Meta Verification endpoint to authenticate webhooks during setup.
*   **Query Parameters**: `?hub.mode=subscribe&hub.challenge=abc&hub.verify_token=my_secret_token`
*   **Response**: Returns the challenge text.

#### `POST /api/webhooks/instagram`
Inbound messaging webhook that processes messages from customers, route them to Gemini, and triggers outbound replies.
*   **Request Body**: Standard Meta Webhook payload.
*   **Response**: `200 OK`.

---

### 3.6. Diagnostics & System Health

#### `GET /api/scalability/metrics`
Exposes server diagnostics, process health, and Puppeteer lock metrics.
*   **Auth**: Required
*   **Response Body (200 OK)**:
    ```json
    {
      "success": true,
      "memory": {
        "rss": 134250496,
        "heapTotal": 98304000,
        "heapUsed": 65420312,
        "external": 1420541
      },
      "uptime": 24510.3,
      "activeConnections": 12,
      "puppeteerInstances": 1
    }
    ```
