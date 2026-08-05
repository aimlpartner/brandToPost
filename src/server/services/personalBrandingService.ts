import { GoogleGenAI, Type } from '@google/genai';
import { PersonalBrandItem } from '../../types';
import fsSync from 'fs';
import path from 'path';
import admin from 'firebase-admin';

let isFirebaseAdminInitialized = false;

export function getFirebaseAdminInstance() {
  if (isFirebaseAdminInitialized && admin.apps.length > 0) {
    return admin;
  }
  try {
    if (admin.apps.length > 0) {
      isFirebaseAdminInitialized = true;
      return admin;
    }
    const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount: any = null;
    if (saEnv) {
      try {
        serviceAccount = JSON.parse(saEnv);
      } catch {
        const trimmed = saEnv.trim().replace(/^'|'$/g, '');
        serviceAccount = JSON.parse(trimmed);
      }
    } else {
      const envPath = path.join(process.cwd(), '.env');
      if (fsSync.existsSync(envPath)) {
        const content = fsSync.readFileSync(envPath, 'utf8');
        const match = content.match(/FIREBASE_SERVICE_ACCOUNT='([^']+)'/s) || content.match(/FIREBASE_SERVICE_ACCOUNT="([^"]+)"/s);
        if (match) {
          serviceAccount = JSON.parse(match[1]);
        }
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'map-api-459818.firebasestorage.app',
      });
      isFirebaseAdminInitialized = true;
      console.log('[FirebaseStorage] Firebase Admin initialized with bucket: map-api-459818.firebasestorage.app');
    }
  } catch (err) {
    console.error('[FirebaseStorage] Failed to initialize Firebase Admin:', err);
  }
  return admin;
}

export async function uploadImageBufferToBucket(buffer: Buffer, destinationPath: string, contentType = 'image/png'): Promise<string | null> {
  try {
    getFirebaseAdminInstance();
    if (!admin.apps.length) {
      console.warn('[FirebaseStorage] Firebase Admin not initialized, skipping bucket upload');
      return null;
    }
    const bucket = admin.storage().bucket();
    const file = bucket.file(destinationPath);
    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media`;
    console.log(`[FirebaseStorage] ✅ Image successfully uploaded to bucket: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error('[FirebaseStorage] Bucket upload failed with error:', err?.message || err);
    return null;
  }
}

export function getOpenAiApiKey(): string | undefined {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) {
    return process.env.OPENAI_API_KEY.trim();
  }
  try {
    const envPaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '.env.local'),
      path.resolve(__dirname, '..', '..', '..', '.env'),
      path.resolve(__dirname, '..', '..', '.env'),
    ];
    for (const p of envPaths) {
      if (fsSync.existsSync(p)) {
        const content = fsSync.readFileSync(p, 'utf-8');
        for (const line of content.split('\n')) {
          if (line.startsWith('OPENAI_API_KEY=')) {
            const key = line.replace('OPENAI_API_KEY=', '').trim().replace(/^["']|["']$/g, '');
            if (key) {
              process.env.OPENAI_API_KEY = key;
              return key;
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return undefined;
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({ apiKey });
}

export interface VoiceSynthesisResult {
  personaName: string;
  behavioralTraits: string[];
  communicationStyle: string[];
  coreValues: string[];
  decisionHeuristics: string[];
  synthesizedAt: string;
  targetIndustry?: string;
  targetAudience?: string;
  vision?: string;
  mission?: string;
  goal?: string;
  contentPillars?: string[];
}

/**
 * Synthesize Founder Voice DNA from name, description, and optional document text
 */
export async function synthesizeFounderVoiceService(
  name: string,
  description: string,
  documentText?: string
): Promise<VoiceSynthesisResult> {
  const ai = getAiClient();

  const prompt = `You are a world-class cognitive profiler and executive strategist.
Analyze the following inputs about a founder's personal voice, heuristics, activities, values, and writing style.
Your task is to synthesize a structured "Voice DNA" profile for the founder: "${name || 'Founder'}".

Input Details:
- Founder Name: ${name || 'Not provided'}
- Voice Description / Bio / Notes:
${description || 'No description provided'}

${documentText ? `- Attached Writings / Document Excerpts:\n${documentText.slice(0, 8000)}` : ''}

Synthesize the profile into a JSON object with:
- personaName: A distinguished persona name or the founder's actual name
- behavioralTraits: Array of 4-6 specific behavioral & leadership traits
- communicationStyle: Array of 4-6 writing and communication rules (e.g. sentence structure, tone, pacing)
- coreValues: Array of 4-6 foundational beliefs and guiding values
- decisionHeuristics: Array of 4-6 rules of thumb the founder uses to judge situations
- targetIndustry: Deduce the likely target industry
- targetAudience: Deduce the likely primary audience
- contentPillars: Array of 3-5 content topics they should post about on LinkedIn`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personaName: { type: Type.STRING },
          behavioralTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
          communicationStyle: { type: Type.ARRAY, items: { type: Type.STRING } },
          coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
          decisionHeuristics: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetIndustry: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'personaName',
          'behavioralTraits',
          'communicationStyle',
          'coreValues',
          'decisionHeuristics',
        ],
      },
    },
  });

  const raw = response.text || '{}';
  const parsed = JSON.parse(raw);

  return {
    personaName: parsed.personaName || name || 'Founder Persona',
    behavioralTraits: parsed.behavioralTraits || ['Direct & candid', 'Pragmatic problem solver', 'High agency'],
    communicationStyle: parsed.communicationStyle || ['Short punchy sentences', 'Zero jargon', 'Authentic storytelling'],
    coreValues: parsed.coreValues || ['Transparency', 'Customer-first execution', 'Relentless iteration'],
    decisionHeuristics: parsed.decisionHeuristics || ['Speed over perfection', 'Evidence over opinion', 'Long-term value creation'],
    targetIndustry: parsed.targetIndustry || 'Technology & Startups',
    targetAudience: parsed.targetAudience || 'Founders, Executives, and Industry Leaders',
    contentPillars: parsed.contentPillars || ['Startup Lessons', 'Product Building', 'Leadership Insights'],
    synthesizedAt: new Date().toISOString(),
  };
}

/**
 * Perform Grounding Research on a list of Brand Website URLs
 */
export async function researchBrandLinksService(
  urls: string[],
  brandType: 'owned' | 'promotional'
): Promise<PersonalBrandItem[]> {
  const ai = getAiClient();
  const results: PersonalBrandItem[] = [];

  for (const rawUrl of urls) {
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl) continue;

    const prompt = `You are an expert market analyst and brand researcher.
Research and analyze the brand represented by this website link: "${cleanUrl}".
Even if you cannot browse live, deduce or identify the brand name, core industry, primary target audience, and a concise 2-sentence value proposition based on the domain name, industry knowledge, and typical brand positioning.

Return a JSON object with:
- name: The clean Brand / Company Name
- description: A concise 2-sentence description of what the brand does and its value proposition
- industry: The primary industry or market category
- targetAudience: Who the brand primarily targets or serves`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              industry: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
            },
            required: ['name', 'description'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      results.push({
        id: `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: cleanUrl,
        name: parsed.name || cleanUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
        description: parsed.description || `Verified brand asset for ${cleanUrl}.`,
        industry: parsed.industry || 'Business & Technology',
        targetAudience: parsed.targetAudience || 'Modern professionals & consumers',
        brandType: brandType,
        researchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn(`[researchBrandLinksService] Fallback for URL ${cleanUrl}:`, err?.message);
      results.push({
        id: `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: cleanUrl,
        name: cleanUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
        description: `Connected brand asset (${brandType}).`,
        industry: 'General Business',
        targetAudience: 'Professional network',
        brandType: brandType,
        researchedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

export interface GenerateLinkedInPostOptions {
  postKind: 'personal' | 'branded';
  founderName: string;
  voiceDna?: any;
  topic?: string;
  brand?: PersonalBrandItem;
  promotionalUrl?: string; // Optional specific affiliate/promotional link
  styleFormat?: string;
}

export interface LinkedInPostResult {
  postText: string;
  headline: string;
  hashtags: string[];
  featuredUrl?: string;
  imagePrompt?: string;
  quoteExcerpt?: string;
  subtext?: string;
  imageUrl?: string;
}

/**
 * Generate customized LinkedIn posts (Personal Non-Branded vs. Branded Promotional/Professional)
 */
export async function generateLinkedInPostService(
  options: GenerateLinkedInPostOptions
): Promise<LinkedInPostResult> {
  const ai = getAiClient();

  const {
    postKind,
    founderName,
    voiceDna,
    topic,
    brand,
    promotionalUrl,
    styleFormat = 'Broetry',
  } = options;

  const targetUrl = promotionalUrl || brand?.customPromotionalUrl || brand?.url || '';

  let prompt = `You are a viral LinkedIn executive ghostwriter and social algorithm specialist writing as "${founderName}".
Voice & Style Heuristics:
- Communication Style: ${JSON.stringify(voiceDna?.communicationStyle || ['Authentic', 'Clear', 'Engaging'])}
- Behavioral Traits: ${JSON.stringify(voiceDna?.behavioralTraits || ['High agency', 'Strategic'])}
- Core Values: ${JSON.stringify(voiceDna?.coreValues || ['Integrity', 'Value creation'])}

Task: Write a high-converting, highly engaging LinkedIn post based strictly on the topic and context.
`;

  if (postKind === 'personal') {
    prompt += `
POST KIND: Normal Personal {Non-Branded} Branding Post
- Focus strictly on thought leadership, personal experiences, founder lessons, executive insights, or professional growth.
- Topic focus: "${topic || 'A powerful lesson in leadership, decision-making, or startup execution'}"
- ZERO promotional pitches. ZERO links. ZERO selling.
- Format for readability: Use clean spacing, hook opening line, engaging body, and a thought-provoking closing question.`;
  } else {
    // Branded Post (either Owned or Promotional)
    const brandName = brand?.name || 'Selected Brand';
    const brandDesc = brand?.description || '';
    const isPromotional = brand?.brandType === 'promotional';

    prompt += `
POST KIND: Branded LinkedIn Post
- Featured Brand: "${brandName}"
- Brand Details: "${brandDesc}"
- Target URL to feature: "${targetUrl || 'Link in comments / below'}"
- Topic/Angle: "${topic || `Showcasing the value and impact of ${brandName}`}"
`;

    if (isPromotional) {
      prompt += `
BRAND OWNERSHIP TYPE: Advertising / Affiliate / Promotional Brand
We must use one of the viral LinkedIn advertising/promotional copywriting formats requested:
Selected Style Format: "${styleFormat}"

Format Definition Rules:
- If Broetry: Write in a dramatic, line-by-line format with heavy spacing, designed to exploit the LinkedIn algorithm for emotional engagement. Short 1-2 sentence lines separated by blank lines.
- If Guerrilla Influencer Marketing: A form of stealth advertising where the author hides a paid/affiliate promotion inside a deeply personal, emotional story or life lesson.
- If Astroturfing: Create a gripping, grassroots story of overcoming a challenge that naturally highlights the corporate brand as the secret weapon.
- If Corporate Fanfiction: Heavily dramatized, exaggerated, or cinematic professional struggle story designed to drive massive clicks and intrigue.

CRITICAL REQUIREMENT: At the end of the post, seamlessly introduce and include the exact URL: "${targetUrl}".`;
    } else {
      // Personal / Owned Brand
      prompt += `
BRAND OWNERSHIP TYPE: Personal / Owned Brand
- "we won't follow those promotional content for his own branding cause these are his own brands {so it will be in professional way and umm these will include his selected brand website links okay..}"
- Selected Style Approach: "${styleFormat || 'Founder Lesson & Product Reveal'}"
- Tone & Execution: Professional, high-authority, authentic founder storytelling. Explain the real problem in the industry, the earned insight, and how your owned brand (${brandName}) solves it elegantly. No manipulative slang or astroturfing.
- CRITICAL REQUIREMENT: At the end of the post, professionally include the exact URL: "${targetUrl}".`;
    }
  }

  prompt += `

CRITICAL INSTRUCTIONS FOR OUTPUT:
1. Return a JSON object with:
   - headline: A compelling 5-10 word title/summary for the visual graphic / post headline
   - subtext: A crisp 1-sentence executive takeaway for the graphic subtitle
   - quoteExcerpt: The single most impactful, memorable, contrarian, or quotable 1-2 sentence line extracted directly from your post text. (This will be used when rendering a Founder Quote Card graphic).
   - postText: The complete, formatted LinkedIn post text (with line breaks \\n, bullet points if needed, and the target URL if branded)
   - hashtags: An array of 3-5 relevant LinkedIn hashtags (without # prefix in array, e.g. ["Leadership", "Startups", "Growth"])
   - imagePrompt: A vivid, bespoke visual concept description tailored entirely and specifically to the concrete subject, metaphors, and real-world scenario of THIS post. Avoid generic office stock photos; describe concrete visual elements, lighting, composition, and mood that reflect the unique topic.
   - featuredUrl: The URL included in the post (or empty string if personal post)`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          subtext: { type: Type.STRING },
          quoteExcerpt: { type: Type.STRING },
          postText: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
          featuredUrl: { type: Type.STRING },
        },
        required: ['headline', 'postText', 'hashtags'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');

  return {
    headline: parsed.headline || 'Leadership & Strategy',
    subtext: parsed.subtext || 'Strategic clarity, non-obvious execution, and market leverage.',
    quoteExcerpt: parsed.quoteExcerpt || parsed.headline || 'Execution is what separates vision from hallucination.',
    postText: parsed.postText || 'Excited to share my latest thoughts on industry evolution and building value for customers.',
    hashtags: parsed.hashtags || ['Leadership', 'Business', 'Growth'],
    imagePrompt: parsed.imagePrompt || `High-end editorial visual representing: ${parsed.headline || topic || 'Executive Strategy'}`,
    featuredUrl: parsed.featuredUrl || (postKind === 'branded' ? targetUrl : undefined),
  };
}

export interface GenerateBrandImageOptions {
  prompt: string;
  headline?: string;
  subtext?: string;
  quoteText?: string;
  imageStyle?: 'content_visual' | 'quote' | 'diagram';
  brandColors?: string[];
  fontStyle?: string;
  logoUrl?: string;
  logoPosition?: string;
  brandName?: string;
}

function generateBrandedSvgCanvas(
  headline: string,
  subtext: string,
  brandColors: string[],
  brandName: string,
  logoUrl?: string,
  imageStyle?: string,
  quoteText?: string
): string {
  const primaryColor = brandColors?.[2] || brandColors?.[0] || '#7C3AED';
  const cleanHeadline = (headline || 'Executive Insight').replace(/[<>&"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      default: return c;
    }
  });
  const cleanSubtext = (subtext || 'Strategic clarity, non-obvious execution, and market leverage.').replace(/[<>&"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      default: return c;
    }
  });
  const cleanQuote = (quoteText || headline || '').replace(/[<>&"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      default: return c;
    }
  });
  const cleanBrand = (brandName || 'Executive Perspective').replace(/[<>&"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  const isQuote = imageStyle === 'quote';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" style="background:#08080C;font-family:'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.35" />
      <stop offset="60%" stop-color="${primaryColor}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#08080C" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2" cx="20%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#08080C" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14141E" stop-opacity="0.92" />
      <stop offset="100%" stop-color="#0B0B10" stop-opacity="0.97" />
    </linearGradient>
  </defs>

  <!-- Background Base & Ambient Glows -->
  <rect width="1080" height="1080" fill="#08080C" />
  <rect width="1080" height="1080" fill="url(#glow)" />
  <rect width="1080" height="1080" fill="url(#glow2)" />

  <!-- Subtle Grid Accent -->
  <g opacity="0.08" stroke="#FFFFFF" stroke-width="1">
    <line x1="120" y1="0" x2="120" y2="1080" />
    <line x1="960" y1="0" x2="960" y2="1080" />
    <line x1="0" y1="120" x2="1080" y2="120" />
    <line x1="0" y1="960" x2="1080" y2="960" />
  </g>

  <!-- Content Container Card -->
  <rect x="100" y="100" width="880" height="880" rx="32" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />

  <!-- Header Category Badge -->
  <g transform="translate(160, 170)">
    <rect x="0" y="0" width="${isQuote ? 220 : 220}" height="40" rx="20" fill="rgba(124, 58, 237, 0.18)" stroke="rgba(124, 58, 237, 0.4)" stroke-width="1" />
    <circle cx="20" cy="20" r="5" fill="${primaryColor}" />
    <text x="36" y="25" fill="#EDE9FE" font-size="13" font-weight="700" letter-spacing="1.5">${isQuote ? 'FOUNDER QUOTE' : 'EXECUTIVE INSIGHT'}</text>
  </g>

  ${isQuote ? `
  <!-- Quotation Mark -->
  <text x="160" y="295" fill="${primaryColor}" font-size="90" font-family="Georgia, serif" opacity="0.7">“</text>

  <!-- Quote Text -->
  <foreignObject x="160" y="310" width="760" height="420">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FAF9F6; font-size: ${cleanQuote.length > 130 ? '34px' : '42px'}; font-weight: 700; line-height: 1.35; letter-spacing: -0.02em; word-break: break-word; font-style: italic;">
      "${cleanQuote}"
    </div>
  </foreignObject>

  <!-- Attribution -->
  <foreignObject x="160" y="750" width="760" height="70">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #94A3B8; font-size: 22px; font-weight: 600; line-height: 1.4;">
      — ${cleanBrand}
    </div>
  </foreignObject>
  ` : `
  <!-- Main Headline -->
  <foreignObject x="160" y="250" width="760" height="360">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FAF9F6; font-size: 46px; font-weight: 800; line-height: 1.2; letter-spacing: -0.025em; word-break: break-word;">
      ${cleanHeadline}
    </div>
  </foreignObject>

  <!-- Subtext / Key Takeaway -->
  <foreignObject x="160" y="630" width="760" height="170">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #94A3B8; font-size: 24px; font-weight: 500; line-height: 1.45; word-break: break-word;">
      ${cleanSubtext}
    </div>
  </foreignObject>
  `}

  <!-- Footer Brand Bar -->
  <line x1="160" y1="840" x2="920" y2="840" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />

  <g transform="translate(160, 875)">
    <circle cx="16" cy="16" r="16" fill="${primaryColor}" />
    <text x="16" y="22" fill="#FFFFFF" font-size="14" font-weight="900" text-anchor="middle">${cleanBrand.charAt(0)}</text>
    <text x="44" y="22" fill="#FFFFFF" font-size="20" font-weight="700" letter-spacing="-0.01em">${cleanBrand}</text>
    <text x="760" y="22" fill="#64748B" font-size="16" font-weight="600" text-anchor="end">BrandToPost • Founder Series</text>
  </g>
</svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a visual image for LinkedIn posts
 */
export async function generatePersonalBrandImageService(
  options: GenerateBrandImageOptions
): Promise<string> {
  const {
    prompt,
    headline,
    subtext,
    quoteText,
    imageStyle = 'content_visual',
    brandColors = ['#08080C', '#FAF9F6', '#7C3AED'],
    fontStyle = 'Inter Tight, bold modern sans-serif',
    logoUrl,
    brandName = 'Brand',
  } = options;

  const openaiApiKey = getOpenAiApiKey();
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let base64Data: string | null = null;
  let modelUsed: string | null = null;

  console.log(`[generatePersonalBrandImageService] ================= IMAGE GENERATION START =================`);
  console.log(`[generatePersonalBrandImageService] Style: ${imageStyle}`);
  console.log(`[generatePersonalBrandImageService] Brand Name: ${brandName}`);
  console.log(`[generatePersonalBrandImageService] OpenAI API Key: ${openaiApiKey ? `Present (length ${openaiApiKey.length}, prefix ${openaiApiKey.substring(0, 10)}...)` : 'MISSING'}`);
  console.log(`[generatePersonalBrandImageService] Gemini API Key: ${geminiApiKey ? `Present (length ${geminiApiKey.length})` : 'MISSING'}`);

  const colorDesc = brandColors.join(', ');
  let formattedPrompt = '';

  if (imageStyle === 'quote') {
    const cleanQuote = (quoteText || headline || prompt).replace(/"/g, "'");
    formattedPrompt = `A high-end editorial quote graphic for LinkedIn in a luxury modern B2B editorial style.
Featuring a prominent quote: "${cleanQuote}".
Author / Attribution: ${brandName || 'Founder & Executive'}.
Visual Style: Dark minimalist architectural background, sophisticated typography, subtle ${colorDesc} lighting accents, ultra-high contrast, crisp layout, 1:1 square aspect ratio. No clutter.`;
  } else if (imageStyle === 'diagram') {
    formattedPrompt = `A clean, modern conceptual framework and diagram graphic for LinkedIn representing: ${prompt}.
Visual Style: Minimalist architectural layout, high contrast dark canvas, subtle glow in ${colorDesc}, crisp modern iconography and structural flow, 1:1 square aspect ratio.`;
  } else {
    // Completely content-driven visual
    formattedPrompt = `High-end editorial visual for a LinkedIn thought leadership post.
Subject and Scene: ${prompt}
Visual Direction: High-contrast luxury editorial photography and visual metaphor tailored specifically to the post's core message. Cinematic depth of field, dramatic architectural lighting with subtle ${colorDesc} undertones, premium composition, 1:1 square aspect ratio, realistic and engaging.`;
  }

  console.log(`[generatePersonalBrandImageService] Prompt for model: "${formattedPrompt.substring(0, 200)}..."`);

  // 1. Prioritize gpt-image-2 (OpenAI Image Model)
  if (openaiApiKey) {
    const configuredModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
    const modelsToTry = [configuredModel, 'gpt-image-2', 'dall-e-3'];
    const uniqueModels = Array.from(new Set(modelsToTry));

    for (const m of uniqueModels) {
      if (!m) continue;
      try {
        console.log(`[generatePersonalBrandImageService] Calling OpenAI Image API with model: ${m}...`);
        const payload: any = {
          model: m,
          prompt: formattedPrompt.substring(0, 3500),
          n: 1,
          size: '1024x1024',
        };
        if (m.startsWith('dall-e')) {
          payload.response_format = 'b64_json';
          payload.quality = 'standard';
        }
        const genRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(`[generatePersonalBrandImageService] OpenAI ${m} HTTP response: ${genRes.status} ${genRes.statusText}`);

        if (genRes.ok) {
          const genData = await genRes.json();
          if (genData?.data?.[0]?.b64_json) {
            base64Data = genData.data[0].b64_json;
            modelUsed = m;
            console.log(`[generatePersonalBrandImageService] Successfully generated with ${m} (b64_json length: ${base64Data?.length})`);
            break;
          } else if (genData?.data?.[0]?.url) {
            console.log(`[generatePersonalBrandImageService] Successfully generated with ${m} (url), downloading image...`);
            const fetchImg = await fetch(genData.data[0].url);
            const buf = await fetchImg.arrayBuffer();
            base64Data = Buffer.from(buf).toString('base64');
            modelUsed = m;
            console.log(`[generatePersonalBrandImageService] Downloaded image, b64 length: ${base64Data.length}`);
            break;
          }
        } else {
          const errTxt = await genRes.text();
          console.error(`[generatePersonalBrandImageService] OpenAI model ${m} failed (${genRes.status}):`, errTxt);
        }
      } catch (mErr) {
        console.error(`[generatePersonalBrandImageService] OpenAI model ${m} network exception:`, mErr);
      }
    }
  }

  // 2. Try Gemini Imagen fallback if OpenAI failed or not present
  if (!base64Data && geminiApiKey) {
    try {
      console.log(`[generatePersonalBrandImageService] Attempting Gemini Imagen fallback...`);
      const ai = getAiClient();
      const imgRes = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: formattedPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/png',
        },
      });
      if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
        base64Data = imgRes.generatedImages[0].image.imageBytes;
        modelUsed = 'imagen-3.0';
        console.log(`[generatePersonalBrandImageService] Successfully generated with Gemini Imagen`);
      }
    } catch (gErr) {
      console.error('[generatePersonalBrandImageService] Gemini Imagen fallback error:', gErr);
    }
  }

  // 3. Save generated image to local disk & upload to Firebase Storage Bucket
  if (base64Data) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const imageId = `img_pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const dirPath = path.join(process.cwd(), 'public', 'campaign_images');
      const legacyDirPath = path.join(process.cwd(), 'public', 'whatsapp_images');
      await fs.mkdir(dirPath, { recursive: true });
      await fs.mkdir(legacyDirPath, { recursive: true });
      const imgBuf = Buffer.from(base64Data, 'base64');
      await fs.writeFile(path.join(dirPath, `${imageId}.png`), imgBuf);
      await fs.writeFile(path.join(legacyDirPath, `${imageId}.png`), imgBuf);
      console.log(`[generatePersonalBrandImageService] Image archived locally as ${imageId}.png`);

      // Upload to Firebase Storage bucket
      const destinationPath = `personal_branding/${imageId}.png`;
      const bucketUrl = await uploadImageBufferToBucket(imgBuf, destinationPath, 'image/png');

      console.log(`[generatePersonalBrandImageService] ================= IMAGE GENERATION SUCCESS (${modelUsed}) =================`);
      if (bucketUrl) {
        console.log(`[generatePersonalBrandImageService] Returning Firebase Storage bucket URL: ${bucketUrl}`);
        return bucketUrl;
      }

      const relativeUrl = `/campaign_images/${imageId}.png`;
      console.log(`[generatePersonalBrandImageService] Bucket URL unavailable, returning server static route: ${relativeUrl}`);
      return relativeUrl;
    } catch (fsErr) {
      console.error('[generatePersonalBrandImageService] Failed to save/upload image, returning SVG fallback:', fsErr);
    }
  }

  console.warn(`[generatePersonalBrandImageService] Falling back to SVG branded canvas.`);
  // 4. High-quality SVG Branded Canvas fallback
  return generateBrandedSvgCanvas(headline || prompt, subtext || '', brandColors, brandName, logoUrl, imageStyle, quoteText);
}

export async function suggestLinkedInTopicsService(options: {
  founderName?: string;
  voiceDna?: any;
  brand?: PersonalBrandItem;
  postKind?: 'personal' | 'branded';
}): Promise<{ topics: string[] }> {
  const { founderName = 'Founder', voiceDna, brand, postKind = 'personal' } = options;
  const ai = getAiClient();

  const isBranded = postKind === 'branded' && !!brand;
  const prompt = `You are a viral LinkedIn B2B executive ghostwriter.
Generate 4 highly compelling, specific, and provocative LinkedIn post topic ideas for "${founderName}".

Voice & Style Heuristics:
- Communication Style: ${JSON.stringify(voiceDna?.communicationStyle || ['Authentic', 'Clear'])}
- Decision Heuristics: ${JSON.stringify(voiceDna?.decisionHeuristics || ['Speed over perfection', 'Evidence over opinion'])}
- Core Values: ${JSON.stringify(voiceDna?.coreValues || ['Transparency', 'Customer-first execution'])}
${isBranded ? `- Target Brand to weave in: "${brand?.name}" (${brand?.description || 'B2B Brand'})` : '- Focus strictly on pure personal branding, thought leadership, founder lessons, and executive insights (ZERO product pitching).'}

Return a JSON object with:
- topics: An array of exactly 4 strings. Each string should be a compelling topic or angle ready to generate a post from (e.g. "Why most founders overcomplicate customer acquisition before reaching $1M ARR...").`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['topics'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
      return { topics: parsed.topics.slice(0, 4) };
    }
  } catch (err) {
    console.warn('[suggestLinkedInTopicsService] Fallback topics triggered:', err);
  }

  // Intelligent fallback topics
  if (isBranded && brand) {
    return {
      topics: [
        `How ${brand.name} changes the economics of B2B execution without bloating headcount`,
        `Why traditional workflows in ${brand.industry || 'our industry'} are broken, and the earned secret behind ${brand.name}`,
        `The exact heuristic we use at ${brand.name} to deliver 10x leverage for our customers`,
        `Why we built ${brand.name}: The untold story of solving our biggest operational bottleneck`,
      ],
    };
  } else {
    return {
      topics: [
        `Why most B2B founders overcomplicate customer acquisition before finding real product-market fit`,
        `The counterintuitive decision heuristic that helped us scale pipeline without paid ad armies`,
        `Why consistency in execution beats one-off growth hacks every single time in SaaS`,
        `The hardest leadership lesson I learned when scaling from solo operator to managing a team`,
      ],
    };
  }
}
