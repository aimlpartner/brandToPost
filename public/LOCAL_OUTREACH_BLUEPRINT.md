# Specification & System Blueprint: Local Business WhatsApp Outreach & Story Creative Generator

This specification document outlines the complete architectural, API, database, and workflow design for your automated local business discovery and engagement engine. Use this file as a ready-to-run system blueprint to instantly configure and construct this system in the future.

---

## 1. System Vision & Workflow Architecture

The core objective is to automate the discovery of local brick-and-mortar businesses (beginning with clinics/medical shops or specific niches), filter for active WhatsApp contacts, generate personalized localized marketing creatives, automate engagement, handle response tracking, and manage media delivery.

```
+-----------------------------------+
|      1. Local Lead Discovery      |  <-- Google Places API / Google Maps
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|     2. Lead Sieve & Filtering     |  <-- Validates Phone Numbers & Business Images
+-----------------------------------+
                  | (Has Phone & Images)
                  v
+-----------------------------------+
|  3. Story Creative & Script Design |  <-- Compresses Images (<1MB) & Generates Personalized Creative
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|   4. WhatsApp Outreach Pipeline   |  <-- WhatsApp Business API (Local Language Message + Story Creative)
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|  5. CRM Profile & TTL Engagement  |  <-- Tracks responses. Auto-delete/flag inactive leads in 48-72h
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|  6. Secure Client Asset Vault     |  <-- Interactive signed links to download history + Storage subscription billing
+-----------------------------------+
```

---

## 2. Deep-Dive Core Modules

### Module A: Lead Discovery & Sieve (Google Maps Platform)
1. **Target Query Trigger**: Search clinics, surgical stores, diagnostic centers, or other categories within defined bounds (e.g., `"clinics in South Delhi"` or `"dental offices in Mumbai Central"`).
2. **Google Places API (New) Intake**:
   - Extract `displayName`, `formattedAddress`, `editorialSummary`, `regularOpeningHours`, and `rating`.
   - **Phone Sieve**: Filter out entries with invalid or missing telephone numbers. Reject landlines where possible, prioritizing mobile-ready strings.
   - **Image Sieve**: Inspect the `photos[]` node returned from the Places API. 
     - **Approval Filter**: If `photos` has $\ge 1$ asset, download the original high-res picture.
     - **Rejection Filter**: If the clinic contains no uploaded images or only stock graphics, auto-terminate/reject from outreach pipeline to preserve quality.

### Module B: Lead Qualification & Deactivation (TTL State Engine)
To maintain database sanity and avoid costly message retries to unengaged numbers, leads pass through an automated **Time-to-Live (TTL)** lifecycle state engine:
- **Lead Creation**: Once verified, a profile is inserted into Firestore with a status of `PENDING_OUTREACH` and a timestamp.
- **Outreach Dispatched**: Status becomes `OUTREACH_SENT`, resetting the `nextCheckTime` to exactly **48 / 72 hours** into the future.
- **Microtonal TTL Cron Worker**:
  - Automatically queries the Database every hour for leads in `OUTREACH_SENT` where `nextCheckTime < NOW`.
  - If a message response status has *not* transitioned to `INTERACTED` or `ENGAGED`, the business profile is either **deleted** or **deactivated** (`DEACTIVATED_UNENGAGED`) to clear storage space and prevent waste.

### Module C: Creative Compression & Canvas Pipeline
Your app will synthesize dynamic vertical Story/Highlight style social assets using actual pictures from the custom client uploads or retrieved Google Maps profiles.
- **Image Compression Protocol**:
  - Inputs can be massive. If file size exceeds **1.0 MB**, it is intercepted by a backend worker (such as Node `sharp` or client-side Canvas).
  - WebP/JPEG conversion with controlled quality (e.g., CSS compression or `sharp({ quality: 80 })`) ensures the output is optimal, reducing server strain, keeping file hosting cheap, and avoiding heavy payload delivery failures on cellular networks via WhatsApp.
- **Story Creative Overlay Generator**:
  - A serverless or server-side layout canvas overlaying the business's title, address, dynamic star ratings, custom branding labels, and a clear call-to-action (CTA).
  - Saves the resulting graphic in standard $1080 \times 1920$ resolution.

### Module D: Automated Localized WhatsApp Integration
- **Context Translation & localized Formatting**:
  - Uses AI models (e.g., Gemini-2.5) to translate an English outreach blueprint into regional languages (Hindi, Marathi, Kannada, Tamil, etc.) with professional tone and local dialect patterns.
  - Generates the body: "Hi, Dr. [Name]. We noticed your beautiful clinic on [Street] has amazing reviews. We custom-generated a gorgeous social promotional graphic (attached below) to showcase your service..."
- **WhatsApp Cloud API Dispatch**:
  - Sends a template message containing a **Media Header** (the compressed Story creative WebP/PNG) and the localized messaging components.

### Module E: Post-Outreach Historical Safehouse & Monetization
When an outreach succeeds and the business wants to access their complete localized content catalog:
- **Secured Signed URLs**: Historical high-fidelity campaigns or images are stored in protected storage buckets (e.g., AWS S3 or Google Cloud Storage).
- **Client Vault Security**: Users receive short-lived JWT-protected links or Cloud Storage Signed URLs (active for 1 to 24 hours), guaranteeing absolute defense against unauthorized leaks.
- **Storage Subscriptions & Fees**:
  - The system dynamically tallies directory byte usage (`sizeInBytes` attributes in metadata metrics).
  - Automatically charges a monthly or tiered **cloud storage fee** for keeping the business assets archived on the platform securely.

---

## 3. Required API Architecture & Credentials Matrix

To build this setup, you must obtain and initialize the following APIs:

| API Service | Purpose | Acquisition & Credentials Needed |
| :--- | :--- | :--- |
| **Google Places API (New)** | Automated discovery of local clinics and business metadata. | Google Cloud Platform Console. Turn on "Places API". Requires `GOOGLE_MAPS_API_KEY`. |
| **WhatsApp Business Platform Cloud API** | Automatic message sending with media attachments and status webhooks. | Meta for Developers Console (`developers.facebook.com`). Requires `WHATSAPP_PHONE_NUMBER_ID` and a permanent `SYSTEM_USER_ACCESS_TOKEN`. |
| **Gemini API** | Local-language translation, personalization, and promotional copywriting.| Google AI Studio. Requires `GEMINI_API_KEY`. |
| **GCP Cloud Storage / AWS S3** | Storing raw assets, compressed creative files, and issuing temporary signed URLs. | Firebase Console / GCP / AWS Console. Requires Service Account Key JSON or AWS Access Credentials. |
| **Stripe / Razorpay API** | Auto-bills recurring monthly storage subscription fee or creative export invoices. | Stripe Console / Razorpay Dashboard. Requires Secret Stripe Keys and API key configurations. |

---

## 4. Logical Database Schemas (Firestore Blueprint)

To manage operations seamlessly, these standard schemas handle Lead, State, Media, and Vault metrics:

### Collection: `leads`
```json
{
  "id": "lead_clinic_00382",
  "name": "Apollo Dental Clinic",
  "phone": "+919876543210",
  "address": "Block C, Lajpat Nagar, New Delhi",
  "originalGoogleMapImage": "https://lh3.googleusercontent.com/p/AF1QipN...",
  "status": "OUTREACH_SENT",               // PENDING_DISCOVERY, PENDING_OUTREACH, OUTREACH_SENT, INTERACTED, DEACTIVATED_UNENGAGED
  "totalImages": 4,
  "lastCheckedAt": "2026-05-27T09:10:12Z",
  "nextCheckTime": "2026-05-30T09:10:12Z", // TTL Check Trigger (72-hour window)
  "createdAt": "2026-05-27T09:10:12Z"
}
```

### Collection: `billing_storage`
```json
{
  "businessId": "lead_clinic_00382",
  "pricingTier": "STANDARD_CLOUD_VAULT",    // Standard tier
  "allocatedBytes": 5368709120,             // 5 GB limits
  "currentBytesUsed": 104857600,            // 100 MB currently consumed
  "monthlyStorageCostUSD": 2.99,            // Automated flat subscription fee
  "billingInterval": "monthly",
  "nextInvoiceDate": "2026-06-27T00:00:00Z"
}
```

### Collection: `campaign_media`
```json
{
  "mediaId": "med_campaign_st_9942",
  "associatedLeadId": "lead_clinic_00382",
  "fileUrl": "https://storage.googleapis.com/outreach-bucket/clinics/apollo_dent_delhi.webp",
  "originalSizeInBytes": 4194304,           // 4.0 MB original
  "compressedSizeInBytes": 838860,          // 819 KB post-compression (<1.0 MB target)
  "languageUsed": "Hindi-English-Mix",
  "generatedStorySlogan": "Sparkling Smiles in Lajpat Nagar",
  "createdAt": "2026-05-27T09:12:00Z"
}
```

---

## 5. Development Strategy (Phase-by-Phase Plan)

When you are ready to construct this feature, execute with your AI in these precise, structured steps:

1. **Step 1 - Google Places Integration**: Connect Google Places SDK, implement the filter for clinic coordinates, and build the custom logical condition checking for both phone validity and visual gallery count.
2. **Step 2 - Compression & Dynamic Canvas**: Add serverless backend routes or library functions to ingest any dynamic binary file, compress down to `< 1MB` threshold smoothly, and burn custom headings into a standard Story template aspect-ratio. 
3. **Step 3 - Local Translation & WhatsApp Cloud Sandbox**: Stand up template strings, integrate Google GenAI to localize the pitch based on the business's city of origin, and execute a verified curl/post request to the Meta Cloud Graph endpoint.
4. **Step 4 - TTL Checker System**: Construct the background task runner or Firestore listener checking state limits to prune stale business logs autonomously.
5. **Step 5 - Vault Security & Charging Engine**: Integrate cloud signature methods producing read-only URLs, map a Stripe monthly billing scheme, and generate an active responsive dashboard to review campaign performance.
