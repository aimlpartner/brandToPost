# Model Card & Evaluation Report

This report outlines the models used across the **BrandToPost** ecosystem, their specific task allocations, evaluation frameworks, testing scripts, and algorithmic safety/fairness guidelines.

---

## 1. Model Inventory & Task Allocation

To maximize cognitive depth while maintaining cost control and low latencies, the platform divides tasks among four Google Gemini models:

| Model Identifier | Specialized Persona | Target Tasks | Primary Strengths |
|---|---|---|---|
| **`gemini-3.1-pro-preview`** | *The Strategic Director* | <ul><li>Product DNA Scraping Analysis</li><li>Founder Agent Persona Synthesis</li><li>Objection mapping & Psychographic discovery</li><li>Feedback revision reasoning</li></ul> | High-reasoning cognitive depth, complex multi-turn logic, strict adherence to developer systems, and large context handling. |
| **`gemini-3.5-flash`** | *The Social Publisher* | <ul><li>Structured weekly campaign calendars</li><li>Day-by-day platform copy synthesis</li><li>Industry market research mapping</li></ul> | Fast token throughput, structured JSON schema outputs, excellent multi-format generation capability. |
| **`gemini-2.5-flash`** | *The Rapid Assistant* | <ul><li>Topic suggestion formatting</li><li>Input field suggestions</li><li>Image generation prompt formatting</li></ul> | Ultra-low latency, high cost efficiency, reliable for formatting structural arrays. |
| **`gemini-3.1-flash-image-preview`** | *The Backdrop Artist* | <ul><li>Cinematic creative background graphics</li><li>Square aspect ratio backdrop assets</li></ul> | Text-to-image graphic generation (Imagen backend integration), high-definition 1K textures, and layout framing. |

---

## 2. Model Evaluation Framework

BrandToPost integrates automated evaluation pipelines to ensure model outputs are accurate, secure, and structurally valid prior to database entry.

### 2.1. Automated Test Pipelines
1.  **`test-gemini.ts`**:
    *   *Purpose*: Validates image generation models and Firestore sync.
    *   *Verification*: Invokes `gemini-3.1-flash-image-preview`, asserts the receipt of non-empty base64 graphics, checks image aspect ratio boundaries, and validates Firestore writes.
2.  **`test-daily-blog.ts`**:
    *   *Purpose*: End-to-end evaluation of the virtual Founder Agent.
    *   *Verification*: Instantiates a virtual founder agent session, queries `gemini-3.1-pro-preview` for today's blog title and niche focus under a strict JSON schema, triggers automated search research, and synthesizes the final post.
3.  **`check-trigger.ts`**:
    *   *Purpose*: Evaluates scheduler trigger metrics and ensures queued posts align with active schemas.

### 2.2. Schema & Structure Constraints
To prevent LLM structural hallucinations (a common failure mode in LLM pipelines), all critical endpoints utilize the **Response Schema** parameters in the GenAI SDK.
*   **Campaign JSON Schema**: Enforces that weekly campaigns must exactly output a `theme`, `targetAudience`, `coreMessage`, `hook`, `cta`, `contentFormat`, `dailyPosts` (mapping day, contentType, imagePrompt, customHtml layout), `repurposingNotes`, and `confidenceScore`.
*   **Self-Healing Fallbacks**: If `gemini-3.1-pro-preview` fails or encounters rate limits (status code 429), the server falls back to `gemini-3.5-flash` to continue campaign generation without causing server errors.

---

## 3. Algorithmic Fairness & Safety Guardrails

### 3.1. Tone & Style Alignment
The system strictly prevents the output of typical generic AI patterns (e.g. using slop words like "supercharge", "leverage", "unlock", "elevate") by configuring the system instructions of `alex` and `arthur` with the **Anti-Slop Codex** defined in `design.md`.

### 3.2. Content Moderation & Bias Filters
1.  **Safety Settings**: The backend configures Google GenAI safety parameters to block requests displaying hate speech, harassment, sexually explicit material, or dangerous content.
2.  **Identity Protection**: Arthur reads user voice profiles and isolates them using security layers in Firestore. Voice clones are strictly locked to individual accounts and are never aggregated or used for subsequent model training.
3.  **Topic Restraints**: Founder Agents are instructed to restrict post suggestions to the user's specific business niche (defined in `extractedMediaImages` and `contentPillars`). If a user attempts to generate irrelevant or abusive content, the model is configured to refuse generation.
