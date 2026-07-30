const Type = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
  NULL: "NULL",
} as const;

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  if (url.startsWith('data:')) return url;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to fetch image as base64'));
    img.src = url;
  });
};

export interface LayoutConfig {
    textPosition: "top" | "middle" | "bottom";
    textAlign: "left" | "center" | "right";
    logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center" | "center" | "middle-left" | "middle-right";
    fontFamily?: string;
    titleSize?: number;
    subtitleSize?: number;
    titleColor?: string;
    subtitleColor?: string;
}

import { renderVisualToJpegOffscreen } from '../lib/offscreenRenderer';
import { LAYOUT_BLUEPRINTS, selectLayout } from '../lib/layoutBlueprints';

export const flattenVisualData = async (imageUrl: string, customHtml: string | undefined, activeLogo: string | null, layout?: LayoutConfig): Promise<string> => {
  const result = await renderVisualToJpegOffscreen(
    'custom-overlay',
    { customHtml, layout },

    imageUrl,
    null,
    "Brand",
    activeLogo
  );
  return typeof result === 'string' ? result : (result?.url || imageUrl);
};

export async function generateFieldSuggestions(
  dna: any | null,
  field: "industry" | "subcategory" | "theme",
  currentData: { industry?: string; subcategory?: string; theme?: string; },
  userId?: string
): Promise<string[]> {
  try {
    let prompt = `Use the following brand context and instructions to suggest 3 ideas for a campaign generation form field.
Return ONLY a JSON array of 3 strings. Example: ["Idea 1", "Idea 2", "Idea 3"]
`;
    
    if (dna) {
      prompt += `Brand Name: ${dna.name}
Positioning: ${dna.positioning || "Not specified"}
Audience: ${dna.audience || "Not specified"}
${dna.contentPillars && dna.contentPillars.length > 0 ? `Content Pillars: ${dna.contentPillars.join(", ")}` : ""}
${dna.targetIcps && dna.targetIcps.length > 0 ? `Target ICPs: ${dna.targetIcps.map((icp: any) => icp.name).join(", ")}` : ""}
`;
    }

    if (field === "industry") {
      prompt += `Give 3 broad target industries or highly relevant macro-level focus areas this brand could market to, driven directly by their Positioning and Target ICPs. Keep them punchy and distinct.`;
    } else if (field === "subcategory") {
      prompt += `Target Industry: ${currentData.industry || "Not specified"}
Give 3 specific sub-categories, extremely targeted niches, or ultra-specific pain-point driven markets within this industry that this brand could target. Make these highly actionable for a marketing campaign.`;
    } else if (field === "theme") {
      prompt += `Target Industry: ${currentData.industry || "Not specified"}
Sub-category/Niche: ${currentData.subcategory || "Not specified"}
Give 3 distinct, compelling, and creative weekly campaign themes (e.g. "The Anti-Burnout Formula", "Debunking Industry Myths", "Zero-to-One Growth Secrets") for this business based on the industry and niche.`;
    }

    const response = await generateContentProxy("gemini-2.5-flash", prompt, {
      temperature: 0.7,
      responseMimeType: "application/json"
    });

    if (response.usageMetadata && userId) {
      logTokenUsage(userId, "generateFieldSuggestions", "gemini-2.5-flash", response.usageMetadata).catch(console.error);
    }

    const text = response.text || "";
    try {
      const parsed = parseLLMJSON(text);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    } catch(e) {}
    return [];
  } catch (err) {
    console.error("Error generating field suggestions:", err);
    return [];
  }
}
import { ProductDNA, WeeklyCampaign, Creative } from "../types";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { loggerService } from "./loggerService";
import { logSilentError } from "../lib/firestore-error";
import { getCookie } from "../lib/cookies";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (options.signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }
      if ((response.status >= 500 || response.status === 429) && retries > 0) {
        console.warn(`Fetch returned status ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
    }
    return response;
  } catch (error: any) {
    if (options.signal?.aborted || error.name === 'AbortError') {
      throw error;
    }
    if (retries > 0) {
      console.warn(`Fetch threw error: ${error}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseLLMJSON(text: string): any {
  const trimmed = text.trim();
  
  // 1. Direct parse
  try {
    return JSON.parse(trimmed);
  } catch (e) {}
  
  // 2. Markdown block extraction
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }
  
  // 3. Fallback bracket extraction (greedy for first valid block)
  const firstOpenBracket = trimmed.indexOf('[');
  const firstOpenBrace = trimmed.indexOf('{');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
    startIdx = firstOpenBracket;
    endIdx = trimmed.lastIndexOf(']');
  } else if (firstOpenBrace !== -1) {
    startIdx = firstOpenBrace;
    endIdx = trimmed.lastIndexOf('}');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const extracted = trimmed.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(extracted);
    } catch(e) {}
  }
  
  throw new Error("Failed to parse JSON from LLM response");
}

async function generateContentProxy(model: string, contents: any, config?: any, signal?: AbortSignal, customToken?: string) {
  const token = customToken || (await auth.currentUser?.getIdToken());
  const userId = auth.currentUser?.uid;
  const activeProductId = userId ? (getCookie(`activeProductId_${userId}`) || localStorage.getItem(`activeProductId_${userId}`)) : null;

  const response = await fetchWithRetry('/api/ai/generate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(activeProductId ? { 'X-Product-Id': activeProductId } : {})
    },
    body: JSON.stringify({ model, contents, config }),
    signal
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any = {};
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      // ignore
    }
    throw new Error(errorData.error || `Failed to generate content: ${response.status} ${response.statusText}`);
  }
  
  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Invalid JSON from proxy:", responseText.substring(0, 500));
    throw new Error(`Invalid JSON response from server. Please try again.`);
  }
}

export async function generateImageViaProxy(prompt: string | any, userId?: string, productId?: string, logoUrl?: string): Promise<string | null> {
  const token = await auth.currentUser?.getIdToken();
  const activeProductId = productId || (userId ? (getCookie(`activeProductId_${userId}`) || localStorage.getItem(`activeProductId_${userId}`)) : null);

  const promptObj = typeof prompt === 'string' ? { prompt } : prompt;

  const response = await fetchWithRetry('/api/ai/generate-campaign-images', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(activeProductId ? { 'X-Product-Id': activeProductId } : {})
    },
    body: JSON.stringify({ prompts: [promptObj], logoUrl })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate image: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  if (data.success && data.imageUrls && data.imageUrls.length > 0) {
    return data.imageUrls[0];
  }
  return null;
}

async function logTokenUsage(userId: string | undefined, operationType: string, model: string, usageMetadata: any) {
  if (!userId || !usageMetadata) return;
  
  try {
    await addDoc(collection(db, "token_usage"), {
      userId,
      operationType,
      model,
      promptTokenCount: usageMetadata.promptTokenCount || 0,
      candidatesTokenCount: usageMetadata.candidatesTokenCount || 0,
      totalTokenCount: usageMetadata.totalTokenCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logSilentError(error as Error, { context: "logTokenUsage", userId, operationType, model });
  }
}

const RESEARCH_CONTEXT = `
Successful product-led SaaS brands run modular, repeatable distribution systems that:
- Treat product-content-social channels as one stack.
- Systematize hooks, pains, and jobs-to-be-done into platform-specific content pillars.
- Reuse weekly campaigns across products by plugging in website, persona, audience, and tone.

Key pain themes (from founders):
- Getting the first customers / traction
- Content and distribution fatigue
- Not knowing what to say or how to structure campaigns
- Measuring what actually drives growth

Content pillars:
1. Problem-spotting & empathy
2. Product-as-solution
3. Education & system-thinking
4. Founder-story & transparency
5. User-generated / proof

Platform-by-platform distribution strategy:
- LinkedIn: B2B awareness, trust, demand. Professional, insight-driven.
- X (Twitter): Real-time dialogue, in-the-trenches storytelling. Raw, opinionated.
- Instagram: Emotional connection, founder-brand. Human, aspirational.
- Facebook: Broad-reach awareness, community. Friendly.
- Reddit: Authority-building, trust. Helpful, humble, no-hype.
`;

export async function researchProductDNA(
  website: string, 
  currentDna?: Partial<ProductDNA>, 
  document?: { data: string, mimeType: string } | null, 
  userId?: string, 
  screenshot?: { data: string, mimeType: string },
  microlinkMetadata?: any,
  signal?: AbortSignal,
  customToken?: string
): Promise<Partial<ProductDNA>> {
  const normalizedWebsite = website ? normalizeWebsiteUrl(website) : "";
  const hasWebsite = normalizedWebsite !== "";
  const hasDescription = currentDna?.description && currentDna.description.trim() !== "";
  const hasDocument = !!document;
  
  let sourceContext = "";
  let scrapedMediaImages: string[] = [];
  let scrapedLogoUrl = "";
  let scrapedCrawledUrls: string[] = [];
  
  if (microlinkMetadata) {
     sourceContext += `\n--- ENHANCED METADATA (Microlink) ---\n`;
     if (microlinkMetadata.title) sourceContext += `Site Title: ${microlinkMetadata.title}\n`;
     if (microlinkMetadata.description) sourceContext += `Site Description: ${microlinkMetadata.description}\n`;
     // Injecting extracted colors and logo directly
     const logoUrl = microlinkMetadata.logo?.url;
     if (logoUrl) sourceContext += `Found Logo URL: ${logoUrl} (Please use this exactly for logoLightUrl and logoDarkUrl if appropriate)\n`;
     
     // Extracted Dominant Colors (palette)
     const palette = microlinkMetadata.logo?.palette || microlinkMetadata.image?.palette || [];
     if (palette && palette.length > 0) {
        sourceContext += `Extracted Brand Palette (Dominant Colors): ${palette.join(', ')}. Use these to inform your primary and secondary color choices.\n`;
     }
     sourceContext += `------------------------------------\n`;
  }
  
  if (hasWebsite) {
    sourceContext += `Please use Google Search to research the following company website: ${normalizedWebsite}\n`;
    
    // Attempt to scrape the website for better context, especially for typography
    try {
      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }
      const token = customToken || (await auth.currentUser?.getIdToken());
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second total timeout for scraping endpoint
      
      const onAbort = () => {
        controller.abort();
      };
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeoutId);
          throw new DOMException("The user aborted a request.", "AbortError");
        }
        signal.addEventListener('abort', onAbort);
      }

      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: normalizedWebsite }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      
      if (scrapeRes.ok) {
        const scrapeData = await scrapeRes.json();
        if (scrapeData.success) {
          if (scrapeData.mediaImages) scrapedMediaImages = scrapeData.mediaImages;
          if (scrapeData.logoUrl) scrapedLogoUrl = scrapeData.logoUrl;
          if (scrapeData.crawledUrls) scrapedCrawledUrls = scrapeData.crawledUrls;
          sourceContext += `\n--- SCRAPED WEBSITE DATA ---\n`;
          sourceContext += `Text Content Snippet: ${scrapeData.textContent}\n`;
          if (scrapeData.cssContent) {
            sourceContext += `CSS Snippet: ${scrapeData.cssContent}\n`;
          }
          if (scrapeData.extractedFonts && scrapeData.extractedFonts.length > 0) {
            sourceContext += `Extracted Font Families: ${scrapeData.extractedFonts.join(', ')}\n`;
          }
          sourceContext += `----------------------------\n`;
        }
      }
    } catch (e: any) {
      if (signal?.aborted || e.name === 'AbortError') {
        throw e;
      }
      console.error("Failed to scrape website for context:", e);
    }
  }
  
  if (hasDescription) {
    sourceContext += `Also, consider this product description provided by the user: "${currentDna.description}"\n`;
  }
  if (hasDocument) {
    sourceContext += `I have also attached a document containing information about the product. Please analyze it thoroughly.\n`;
  }

  if (!hasWebsite && !hasDescription && !hasDocument) {
    throw new Error("A website, description, or document must be provided to research Brand Position.");
  }

    // ... same prompt context
    const prompt = `
    You are an expert B2B SaaS marketer and researcher.
    
    ${sourceContext}
    ${hasWebsite ? 'CRITICAL: You must actively browse the web to fetch the absolute latest data, recent news, and real-time updates about this company to ensure your research is fresh.' : ''}
    ${screenshot ? 'CRITICAL FOR VISUAL DATA: I have attached a high-resolution screenshot of the landing page. You MUST use this image to perfectly extract the exact Primary and Secondary Fonts used in the design, and perfectly sample the Primary and Secondary Brand Colors in 6-digit Hex format. If they use premium/Adobe fonts (e.g. Proxima Nova, Aktiv Grotesk, Circular, Inter, Futura), identify those explicitly by name.' : ''}

    Based on the provided information, determine the following Brand Position attributes. If the user provided partial information, use it as a hint but improve upon it based on your analysis.
    
    Current known info:
    Positioning: ${currentDna?.positioning || 'Unknown'}
    Audience: ${currentDna?.audience || 'Unknown'}
    Tone: ${currentDna?.tone || 'Unknown'}
    Stage: ${currentDna?.stage || 'Unknown'}
    
    Return a JSON object with the following fields:
    - positioning: A concise, powerful 1-2 sentence positioning statement.
    - audience: A detailed description of the target audience (roles, pain points, industries).
    - tone: The brand's voice and tone (e.g., "Professional, authoritative, yet approachable").
    - stage: The company's estimated stage (e.g., "MVP", "Early Growth", "Scaling", "Enterprise").
    - visualStyle: The brand's visual identity, mood board, and aesthetic.
    - visualData: Structured object containing specific visual details.
    
    CRITICAL: You must also deeply analyze their psychographics and strategy to output the following fields:
    - enemy: The Status Quo / The Enemy. What old way of doing things is this product trying to kill? (e.g., Slack's enemy was email. Airbnb's enemy was sterile hotels.)
    - earnedSecret: What is the one thing this founder/company knows about the industry that nobody else realizes?
    - originStory: Why was this built? What is the founding frustration or pain?
    - hellState: The exact pain, frustration, or fear the user is experiencing right now.
    - heavenState: The emotional payoff after using the product.
    - objections: Top 3 Buying Objections. Why do people say no? (Format as a single paragraph or comma-separated list).
    - uniqueMechanism: How does the product actually deliver the result differently than competitors?
    - proofPoints: Hard numbers, metrics, or case study snippets.
    - vocabularyAlways: Words we ALWAYS use (e.g., "Revenue-driven", "Asynchronous", "Craft").
    - vocabularyNever: Words we NEVER use (e.g., "Synergy", "Hack", "Ninja").
    - contentPillars: 3-5 core strategic content pillars that will form the backbone of their social media presence.
    - targetIcps: 2-3 specific Ideal Customer Profiles with their absolute biggest, most bleeding-neck pain points.
    - recommendedThemes: 5-7 highly specific, actionable Campaign Themes/Ideas tailored to this product that the user can immediately use for their next marketing campaigns. They should be engaging hooks or angles (e.g. "The hidden cost of [Status Quo]").
  `;

  const contents: any[] = [{ text: prompt }];
  if (hasDocument && document) {
    contents.push({
      inlineData: {
        data: document.data,
        mimeType: document.mimeType
      }
    });
  }
  if (screenshot) {
    contents.push({
      inlineData: {
        data: screenshot.data,
        mimeType: screenshot.mimeType
      }
    });
  }

  if (signal?.aborted) {
    throw new DOMException("The user aborted a request.", "AbortError");
  }

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    contents,
    {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          positioning: { type: Type.STRING },
          audience: { type: Type.STRING },
          tone: { type: Type.STRING },
          stage: { type: Type.STRING },
          visualStyle: { type: Type.STRING },
          enemy: { type: Type.STRING },
          earnedSecret: { type: Type.STRING },
          originStory: { type: Type.STRING },
          hellState: { type: Type.STRING },
          heavenState: { type: Type.STRING },
          objections: { type: Type.STRING },
          uniqueMechanism: { type: Type.STRING },
          proofPoints: { type: Type.STRING },
          vocabularyAlways: { type: Type.STRING },
          vocabularyNever: { type: Type.STRING },
          contentPillars: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 high-level content pillars the brand should post about (e.g., 'Founder Learnings', 'Productivity Hacks', 'Customer Stories')"
          },
          targetIcps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the ICP, e.g., 'Agency Owners'" },
                painPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["name", "painPoints"]
            },
            description: "2-3 Ideal Customer Profiles with their absolute biggest pain points"
          },
          recommendedThemes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 very specific, highly actionable Campaign Themes that the user can immediately select to generate a campaign (e.g., 'Busting the biggest myth in our industry', 'The true cost of the Status Quo', 'Origin Story: Why we built this'). These will be shown as buttons."
          },
          visualData: {
            type: Type.OBJECT,
            properties: {
              colors: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              fonts: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING }
                },
                required: ["primary", "secondary"]
              },
              typographyHierarchy: { type: Type.STRING },
              imageStyle: { type: Type.STRING }
            },
            required: ["colors", "fonts", "typographyHierarchy", "imageStyle"]
          }
        },
        required: ["positioning", "audience", "tone", "stage", "visualStyle", "visualData", "contentPillars", "targetIcps", "recommendedThemes"]
      }
    },
    undefined,
    customToken
  );

  if (response.usageMetadata) {
    await logTokenUsage(userId, "researchProductDNA", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const text = response.text;
  if (!text) {
    throw new Error("Failed to research Brand Position");
  }

  try {
    let parsedResult = JSON.parse(text);
    const bestBrandLogo = microlinkMetadata?.logo?.url || scrapedLogoUrl || "";
    if (bestBrandLogo) {
      if (!parsedResult.logoUrl) parsedResult.logoUrl = bestBrandLogo;
      if (!parsedResult.logoDarkUrl) parsedResult.logoDarkUrl = bestBrandLogo;
      if (!parsedResult.logoLightUrl) parsedResult.logoLightUrl = bestBrandLogo;
    }
    if (scrapedMediaImages.length > 0) {
      parsedResult.extractedMediaImages = scrapedMediaImages;
    }
    if (scrapedCrawledUrls.length > 0) {
      parsedResult.crawledUrls = scrapedCrawledUrls;
    }
    return parsedResult;
  } catch (e) {
    logSilentError("Failed to parse JSON response", { context: "researchProductDNA", text });
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      let parsedResult = JSON.parse(match[1]);
      const bestBrandLogo = microlinkMetadata?.logo?.url || scrapedLogoUrl || "";
      if (bestBrandLogo) {
        if (!parsedResult.logoUrl) parsedResult.logoUrl = bestBrandLogo;
        if (!parsedResult.logoDarkUrl) parsedResult.logoDarkUrl = bestBrandLogo;
        if (!parsedResult.logoLightUrl) parsedResult.logoLightUrl = bestBrandLogo;
      }
      if (scrapedMediaImages.length > 0) {
        parsedResult.extractedMediaImages = scrapedMediaImages;
      }
      if (scrapedCrawledUrls.length > 0) {
        parsedResult.crawledUrls = scrapedCrawledUrls;
      }
      return parsedResult;
    }
    throw new Error("Failed to parse JSON response");
  }
}


export async function researchFocus(focus: string, channels: string[] = [], subCategory?: string, userId?: string, customToken?: string): Promise<string[]> {
  const channelsText = channels.length > 0 ? `Focus your research specifically on these channels/platforms: ${channels.join(', ')}.` : '';
  const prompt = `
    You are an expert market researcher.
    
    Research the following industry or focus area: "${focus}"
    ${subCategory ? `Specifically focus on this sub-category or niche: "${subCategory}"` : ''}
    ${channelsText}
    CRITICAL: You must actively browse the web to fetch the absolute latest data, recent news, real-time trends, and real-world case studies about this focus area. Do not rely solely on your training data.
    
    Generate 4-6 highly engaging key insights about this focus area, including:
    - Current trends and emerging topics
    - Audience pain points and desires
    - Competitor landscape or market gaps
    - Specific, recent case studies or success stories with data points (to make content more engaging and interesting)
    
    Return a JSON array of strings, where each string is a detailed key insight.
  `;

  const strategies = [
    { model: "gemini-3.1-pro-preview", search: true },
    { model: "gemini-3.5-flash", search: true },
    { model: "gemini-2.5-flash", search: false }
  ];

  let lastError: any = null;

  for (const strategy of strategies) {
    try {
      console.log(`[researchFocus] Attempting strategy: model=${strategy.model}, search=${strategy.search}`);
      const config: any = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      };

      if (strategy.search) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await generateContentProxy(strategy.model, prompt, config, undefined, customToken);

      if (response.usageMetadata && userId) {
        await logTokenUsage(userId, "researchFocus", strategy.model, response.usageMetadata);
      }

      const text = response.text;
      if (!text) {
        throw new Error("Empty response text");
      }

      const trimmed = text.trim();
      try {
        return parseLLMJSON(trimmed);
      } catch (err: any) {
        throw new Error("JSON parsing failed for text content");
      }
    } catch (err: any) {
      console.warn(`[researchFocus] Strategy (model=${strategy.model}, search=${strategy.search}) failed:`, err);
      lastError = err;
    }
  }

  console.error("[researchFocus] All AI strategies failed. Falling back to local template insights.");
  logSilentError(lastError || new Error("All researchFocus strategies failed"), { context: "researchFocus_all_failed", focus });

  return [
    `Analyzing current emerging trends and audience topics for "${focus}"`,
    `Addressing the key audience pain points and primary desires in the "${focus}" sector`,
    `Leveraging unique competitor insights and addressing clear market gaps`,
    `Focusing on high-converting value propositions for the "${focus}" target group`
  ];
}

const campaignSchema = {
  type: Type.OBJECT,
  properties: {
    theme: { type: Type.STRING, description: "3-5 word headline for the week" },
    targetAudience: { type: Type.STRING, description: "1-2 segments" },
    coreMessage: { type: Type.STRING, description: "One sentence value proposition" },
    hook: { type: Type.STRING, description: "1-2 lines that mirror pain-point language" },
    cta: { type: Type.STRING, description: "Action: Book a demo, Try for free, etc." },
    contentFormat: { type: Type.STRING, description: "e.g., Short post + carousel + 1-minute video" },
    platformVersions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING, description: "LinkedIn, X, Instagram, Facebook, or Reddit" },
          copy: { type: Type.STRING, description: "The actual post copy tailored to the platform" },
          format: { type: Type.STRING, description: "The format for this specific platform" },
          imagePrompt: { type: Type.STRING, description: "Prompt for AI image generation" }
        },
        required: ["platform", "copy", "format"]
      }
    },
    dailyPosts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday" },
          contentType: { type: Type.STRING, description: "e.g., Hook, Use Case, Real Story/Example, Founder Voice, etc." },
          imagePrompt: { type: Type.STRING, description: "Prompt for AI image generation for this day" },
          overlayText: { type: Type.STRING, description: "Short punchy hook text to overlay on custom creatives" },
          visualType: { type: Type.STRING, description: "MUST ALWAYS BE: 'custom-overlay'", enum: ["custom-overlay"] },
          visualData: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Short, punchy primary text" },
              cinematicPrompt: { type: Type.STRING, description: "Image prompt for the background image. Should include artistic directions like off-center, negative space, lighting, mood. Do NOT include text instructions." },
              customHtml: { type: Type.STRING, description: "A highly creative, BESPOKE HTML layout using INLINE STYLES. The canvas is 1080x1080px. CRITICAL: To prevent text overlap, you MUST use Flexbox (display: flex; flex-direction: column; gap: 20px) for layout instead of absolute positioning individual text nodes. NEVER overlap text. Use safe line-heights (1.2+). ALWAYS ensure text is readable. Examples: <div style=\"position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white;\"><h1 style=\"font-size: 80px; font-weight: 900; line-height: 1.2; margin: 0;\">Title</h1><p style=\"font-size: 32px; margin: 20px 0 0 0;\">Subtitle</p></div>." }
            },
            required: ["cinematicPrompt", "customHtml"]
          },
          platformVersions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING, description: "LinkedIn, X, Instagram, Facebook, or Reddit" },
                copy: { type: Type.STRING, description: "The actual post copy tailored to the platform" },
                format: { type: Type.STRING, description: "The format for this specific platform" }
              },
              required: ["platform", "copy", "format"]
            }
          }
        },
        required: ["day", "contentType", "platformVersions", "visualType", "visualData"]
      }
    },
    repurposingNotes: { type: Type.STRING, description: "How to reuse this week's assets next week" },
    confidenceScore: { type: Type.NUMBER, description: "AI-estimated relevance (0-100)" },
    pillar: { type: Type.STRING, description: "The primary content pillar used" },
    researchSummary: { type: Type.STRING, description: "Summary of live research findings about the company and audience" }
  },
  required: ["theme", "targetAudience", "coreMessage", "hook", "cta", "contentFormat", "dailyPosts", "repurposingNotes", "confidenceScore", "pillar", "researchSummary"]
};

/**
 * Canvas is fixed at 1080x1080 — see docs/weekly-campaign-v2-plan.md §8.1.
 * There is no draft-regeneration path; a rejected draft is simply generated again.
 */
function generateWeeklyLogoPositions(): string[] {
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const shuffle = (arr: string[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const firstFour = shuffle(corners);
  const nextThree = shuffle(corners).slice(0, 3);
  const positions = shuffle([...firstFour, ...nextThree]);

  for (let i = 1; i < positions.length; i++) {
    if (positions[i] === positions[i - 1]) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[j] !== positions[i - 1] && (j === positions.length - 1 || positions[j] !== positions[i])) {
          [positions[i], positions[j]] = [positions[j], positions[i]];
          break;
        }
      }
    }
  }

  return positions;
}

/**
 * Generate a full 7-day social campaign using Gemini 3 Pro
 */
export async function generateCampaign(
  dna: ProductDNA,
  focus: string,
  insights: string[],
  generateImages: boolean = false,
  channels: string[] = ['LinkedIn', 'X', 'Instagram', 'Facebook', 'Reddit'],
  campaignTheme?: string,
  subCategory?: string,
  userId?: string,
  onProgress?: (step: number, total: number, msg: string) => void,
  customToken?: string,
  recentLayoutHistory?: string[]
): Promise<Omit<WeeklyCampaign, 'id' | 'createdAt'>> {
  if (onProgress) onProgress(1, 4, "Researching brand DNA & synthesizing 7-day post copy...");

  const activeChannels = (channels && Array.isArray(channels) && channels.length > 0)
    ? channels
    : ((dna.targetPlatforms && Array.isArray(dna.targetPlatforms) && dna.targetPlatforms.length > 0)
      ? dna.targetPlatforms
      : ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']);

  const prompt = `You are a world-class senior B2B content strategist and brand growth director.

Generate a comprehensive 7-DAY MULTI-CHANNEL SOCIAL CAMPAIGN for this brand:
Brand Name: "${dna.name}"
Value Proposition: "${(dna as any).tagline || dna.positioning || dna.description}"
Target Audience: "${dna.audience}"
Industry: "${(dna as any).industry || dna.positioning}"
Campaign Focus/Theme: "${focus || campaignTheme || 'B2B Growth & Automation'}"
Selected Channels: ${activeChannels.join(', ')}

REQUIREMENTS:
1. Generate dailyPosts for all 7 days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
2. For each day, create platformVersions tailored ONLY for these Selected Channels: ${activeChannels.join(', ')}. Do NOT generate posts or platformVersions for any platform not explicitly included in Selected Channels.
3. For each day, provide a punchy "headline" (10-15 words max) and "subtext" (15-25 words max) inside "visualData" that captures the day's key value hook.
4. Provide a descriptive, cinematic "cinematicPrompt" inside visualData for generating a background photo.
`;

  try {
    const res = await generateContentProxy('gemini-3.1-pro-preview', prompt, {
      responseMimeType: "application/json",
      responseSchema: campaignSchema,
      temperature: 0.7,
      maxOutputTokens: 16384
    }, undefined, customToken);

    const rawText = res.text || "{}";
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const campaignData = JSON.parse(cleaned);

    if (onProgress) onProgress(2, 3, "Generating 7 high-end visual posts using OpenAI gpt-image-2-medium...");

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const brandColors = (dna as any).primaryColor ? [(dna as any).primaryColor, (dna as any).secondaryColor, (dna as any).accentColor].filter(Boolean) : (dna.visualData?.colors || ['#08080C', '#FAF9F6', '#3B82F6']);
    const fontStyle = (dna as any).fontFamily || dna.visualData?.fonts?.primary || 'Inter Tight, bold modern sans-serif';
    const logoUrl = dna.logoUrl || (dna as any).logoDarkUrl || (dna as any).logoLightUrl || '/whatsapp_images/BrandToPost.png';

    // Extract brand photo assets if available
    const brandAssets = (dna as any).brandAssets || (dna as any).creatives || dna.extractedMediaImages || [];

    const weeklyLogoPositions = generateWeeklyLogoPositions();
    const structuredPrompts = (campaignData.dailyPosts || []).map((dp: any, idx: number) => {
      const headline = dp.visualData?.headline || dp.contentType || `${dna.name} — ${days[idx]}`;
      const subtext = dp.visualData?.subtext || (dna as any).tagline || dna.description || 'Automated B2B Growth Engine';
      const promptText = dp.visualData?.cinematicPrompt || dp.imagePrompt || `High-end executive photographic visual for ${dna.name}, topic: ${headline}, 1:1 ratio, clean aesthetic`;
      const brandAssetUrl = (!generateImages && brandAssets.length > 0)
        ? (typeof brandAssets[idx % brandAssets.length] === 'string' ? brandAssets[idx % brandAssets.length] : brandAssets[idx % brandAssets.length]?.url)
        : undefined;

      const logoPosition = weeklyLogoPositions[idx % weeklyLogoPositions.length];
      if (!dp.visualData) dp.visualData = {};
      dp.visualData.logoPosition = logoPosition;

      return {
        prompt: promptText,
        headline,
        subtext,
        brandColors,
        fontStyle,
        brandAssetUrl,
        logoPosition
      };
    });

    let generatedAiImages: string[] = [];
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : '';
      const imgRes = await fetch('/api/ai/generate-campaign-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompts: structuredPrompts, logoUrl, productId: dna.id })
      });
      const iData = await imgRes.json();
      if (iData.success && Array.isArray(iData.imageUrls)) {
        generatedAiImages = iData.imageUrls;
      }
    } catch (e) {
      console.warn("Failed to generate AI campaign images via backend proxy", e);
    }

    if (onProgress) onProgress(3, 3, "Stamping brand logo & finalizing 1080x1080 visual assets...");

    const defaultImages = [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80'
    ];

    const dailyPosts = (campaignData.dailyPosts || []).map((dp: any, idx: number) => {
      const headline = dp.visualData?.headline || dp.contentType || `${dna.name} — ${days[idx]}`;
      const subtext = dp.visualData?.subtext || (dna as any).tagline || dna.description || 'Automated B2B Growth Engine';
      const finalImageUrl = (generatedAiImages[idx] && generatedAiImages[idx].startsWith('/api/'))
        ? generatedAiImages[idx]
        : defaultImages[idx % defaultImages.length];

      const visualDataObj = {
        ...(dp.visualData || {}),
        headline,
        subtext,
        colors: brandColors,
        fontStyle,
        isFlattened: true
      };

      const updatedPlatformVersions = (dp.platformVersions || []).map((pv: any) => ({
        ...pv,
        imageUrl: finalImageUrl,
        visualType: 'custom-overlay',
        visualData: visualDataObj
      }));

      return {
        ...dp,
        day: days[idx] || dp.day,
        imageUrl: finalImageUrl,
        visualType: 'custom-overlay',
        visualData: visualDataObj,
        platformVersions: updatedPlatformVersions
      };
    });

    const topPlatformVersions = (campaignData.platformVersions || []).map((pv: any, idx: number) => {
      const matchingDp = dailyPosts[idx % Math.max(1, dailyPosts.length)];
      return {
        ...pv,
        imageUrl: matchingDp?.imageUrl || defaultImages[0],
        visualType: 'custom-overlay',
        visualData: matchingDp?.visualData
      };
    });

    return {
      productId: dna.id || '',
      theme: campaignData.theme || focus || 'B2B Organic Growth',
      targetAudience: campaignData.targetAudience || dna.audience || 'B2B Leaders',
      coreMessage: campaignData.coreMessage || (dna as any).tagline || dna.description || 'Automated multi-channel brand growth.',
      hook: campaignData.hook || 'Transform your social distribution',
      cta: campaignData.cta || 'Get started today',
      contentFormat: campaignData.contentFormat || '1-Template-Per-Day Visual Graphics + Multi-Platform Copy',
      repurposingNotes: campaignData.repurposingNotes || '',
      confidenceScore: campaignData.confidenceScore || 98,
      pillar: campaignData.pillar || 'Growth & Automation',
      researchSummary: campaignData.researchSummary || `Live research synthesized for ${dna.name}`,
      platformVersions: topPlatformVersions.length > 0 ? topPlatformVersions : (dailyPosts[0]?.platformVersions || []),
      dailyPosts
    };
  } catch (err: any) {
    console.error("V3 Campaign Generation Error:", err);
    throw err;
  }
}

export async function generateOneDayStoryImage(params: {
  businessName: string;
  aboutBusiness: string;
  phone: string;
  address: string;
  dnaUrl?: string;
  userId?: string;
  backgroundImage?: string;
}): Promise<{ imageUrl: string; visualType: string; visualData: any }> {
  loggerService.addLog("whatsapp", "info", `Initializing 1-Day Story Creative Generator background worker...`, 
    `Business: "${params.businessName}"\nDetails: "${params.aboutBusiness}"\nPhone: "${params.phone}"\nAddress: "${params.address}"\nHas Attached Backdrop: ${!!params.backgroundImage}`
  );
  try {
    let baseImageBase64 = params.backgroundImage || "";
    let analyzedCustomHtml = "";
    let analyzedLayout: any = {
      textPosition: "bottom",
      logoPosition: "top-right"
    };
    let editorStateResult: any = null;

    if (!baseImageBase64) {
      loggerService.addLog("image", "info", `Step 1: Planning backdrop scenery theme via Gemini Flash Creative Director...`);
      // 1. Generate an optimized visual prompt using a high-fidelity prompt planner (gemini-2.5-flash)
      const promptPlanner = `You are an elite creative director. Create a highly professional, detailed, and atmospheric descriptive photography prompt for an AI image generator.
The business name is: "${params.businessName}"
About the business/context: "${params.aboutBusiness}"
Style guidelines: Cinematic editorial photography representing this business category.
IMPORTANT: The prompt must instruct the generator to produce a stunning, clean background photo with dramatic, warm or cinematic lighting and VAST empty negative space (such as on the left, right, or top) designed specifically for overlaying crisp text.
CRITICAL Rules:
- DO NOT generate any text, labels, watermarks, signs, storefront names or letters in the image itself.
- Ensure the scene is modern, premium, and evocative.
Return ONLY the description prompt text, with no wrappers, no conversational text, and no markdown. Just the direct prompt.`;

      const promptResponse = await generateContentProxy("gemini-2.5-flash", promptPlanner);
      const imagePrompt = promptResponse.text?.trim() || `Cinematic editorial photography representing ${params.businessName}, high quality, vast negative space for text overlay`;
      loggerService.addLog("image", "info", `Step 1 complete: Backdrop prompt planned beautifully:`, imagePrompt);

      // 2. Drive the generation engine to create the high-res 1K base image
      loggerService.addLog("image", "info", `Step 2: Submitting planned backdrop prompt to Imagen AI text-to-photo generator...`);
      const imgResUrl = await generateImageViaProxy(imagePrompt, params.userId, undefined);
      if (imgResUrl) {
        baseImageBase64 = imgResUrl;
        loggerService.addLog("image", "success", `Step 2 complete: High-res background image successfully generated.`);
      }
    } else {
      // Direct text/graphic layout placement: Skip multimodal backdrop content analysis as requested
      loggerService.addLog("image", "info", `Step 1 (Custom Backdrop): Skipping multimodal content analysis for maximum safety & speed.`);
      analyzedLayout = {
        textPosition: "bottom",
        logoPosition: "top-right"
      };
      editorStateResult = {
        baseBg: baseImageBase64,
        scrimHeight: 75,
        scrimOpacity: 0.85,
        scrimColor: "#000000",
        title: params.businessName,
        subtitle: params.aboutBusiness,
        titleSize: 64,
        fontFamily: "'Inter', system-ui, sans-serif"
      };
    }

    if (!baseImageBase64) {
      loggerService.addLog("image", "error", "Step 2: Failed to obtain or render base canvas profile.");
      throw new Error("Failed to generate or load background creative image.");
    }

    // 3. Compose a clean HTML story layout that overlays details beautifully in premium styling (if we don't have analyzedHtml)
    const customHtml = analyzedCustomHtml || `
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 60px; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%); color: white; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; width: 1080px; height: 1080px;">
        
        <!-- Top header badge bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div style="background: rgba(16, 185, 129, 0.2); backdrop-filter: blur(12px); border: 1px solid rgba(16, 185, 129, 0.4); padding: 10px 24px; border-radius: 50px; font-size: 16px; font-weight: 700; color: #10B981; text-transform: uppercase; letter-spacing: 0.12em;">
            ⭐ Verified Premium
          </div>
        </div>

        <!-- Bottom context info and branding layers -->
        <div style="display: flex; flex-direction: column; gap: 20px; width: 100%;">
          <div>
            <h1 style="font-size: 72px; font-weight: 900; line-height: 1.15; margin: 0; text-shadow: 0 4px 15px rgba(0,0,0,0.85); max-width: 900px; color: #FFFFFF; font-family: system-ui, sans-serif; letter-spacing: -0.02em;">
              \${params.businessName}
            </h1>
            <p style="font-size: 26px; font-weight: 400; line-height: 1.45; color: #E2E8F0; margin: 15px 0 0 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8); max-width: 850px; letter-spacing: -0.01em;">
              "\${params.aboutBusiness}"
            </p>
          </div>

          <!-- Phone and Physical Location Contact Footer Box -->
          <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-top: 15px; padding: 20px 30px; background: rgba(0,0,0,0.65); backdrop-filter: blur(20px); border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); width: fit-content; max-width: 960px;">
            \${params.address ? \`
            <div style="display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; color: #E2E8F0;">
              <span style="font-size: 24px;">📍</span> \${params.address}
            </div>
            \` : ''}
            \${params.phone ? \`
            <div style="display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 500; color: #E2E8F0;">
              <span style="font-size: 24px;">📞</span> \${params.phone}
            </div>
            \` : ''}
          </div>
        </div>
      </div>
    `.replace(/\${params\.businessName}/g, params.businessName)
     .replace(/\${params\.aboutBusiness}/g, params.aboutBusiness)
     .replace(/\${params\.address}/g, params.address || "")
     .replace(/\${params\.phone}/g, params.phone || "");

    const visualData = {
      headline: params.businessName,
      subtext: params.aboutBusiness,
      customHtml: customHtml,
      layout: analyzedLayout,
      editorState: editorStateResult || {
        baseBg: baseImageBase64,
        scrimHeight: 80,
        scrimOpacity: 0.85,
        scrimColor: "#000000",
        title: params.businessName,
        subtitle: params.aboutBusiness,
        titleSize: 72,
        fontFamily: "'Inter', system-ui, sans-serif",
        customHtml: customHtml
      }
    };

    // 4. Render and flatten to the pixel-perfect final JPEG
    loggerService.addLog("overlay", "info", "Step 3: Compiling layout vector structures and launching offscreen Puppeteer renderer...");
    const renderResult = await renderVisualToJpegOffscreen(
      'custom-overlay',
      visualData,
      baseImageBase64,
      null,
      params.businessName,
      params.dnaUrl || null
    );
    const renderedImage = typeof renderResult === 'string' ? renderResult : (renderResult?.url || baseImageBase64);

    loggerService.addLog("whatsapp", "success", "Step 4: Offscreen canvas flatten complete! 1-Day story creative loaded successfully.");
    return {
      imageUrl: renderedImage,
      visualType: 'custom-overlay',
      visualData
    };
  } catch (error: any) {
    loggerService.addLog("whatsapp", "error", "CRITICAL: Story graphic generation worker failed.", String(error));
    console.error("Error generating one day story image:", error);
    throw error;
  }
}

const founderAgentSchema = {
  type: Type.OBJECT,
  properties: {
    personaName: { type: Type.STRING, description: "A creative name for this founder agent/doppelganger, e.g., 'Agent Smith', 'The Maverick Creator'" },
    behavioralTraits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 4-6 behavioral & personality traits describing how the founder behaves, acts, and approaches work."
    },
    communicationStyle: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 4-6 style attributes defining how the founder speaks, writes, and communicates (e.g., direct, no jargon, uses bullet points)."
    },
    coreValues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 4-6 core values and feelings that drive the founder's decisions and campaign inputs."
    },
    decisionHeuristics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 4-6 actionable rules of thumb the founder uses to make decisions or handle operations."
    },
    targetIndustry: {
      type: Type.STRING,
      description: "The primary industry, sector, or business domain the founder operates in."
    },
    targetAudience: {
      type: Type.STRING,
      description: "The primary target audience, ideal customer profile, or reader persona the founder addresses."
    },
    vision: {
      type: Type.STRING,
      description: "The founder's long-term vision or inspiration."
    },
    mission: {
      type: Type.STRING,
      description: "The core mission or purpose of the founder's professional focus."
    },
    goal: {
      type: Type.STRING,
      description: "The immediate or long-term business/personal goal."
    },
    contentPillars: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 strategic content topics, themes, or core categories the founder writes and speaks about."
    }
  },
  required: [
    "personaName", "behavioralTraits", "communicationStyle", "coreValues", "decisionHeuristics",
    "targetIndustry", "targetAudience", "vision", "mission", "goal", "contentPillars"
  ]
};

export async function synthesizeFounderAgent(
  description: string,
  document: { data: string, mimeType: string } | null,
  userId?: string,
  productsContext?: string,
  optionalInputs?: {
    targetIndustry?: string;
    targetAudience?: string;
    vision?: string;
    mission?: string;
    goal?: string;
    contentPillars?: string;
  }
): Promise<any> {
  const contents: any[] = [];
  
  let prompt = `You are a world-class cognitive profiler and executive strategist.
Analyze the following input about a founder's personal behavior, actions, activities, feelings, and real-life approach.
Your goal is to synthesize this input to construct a "Founder Agent" (a digital doppelganger) that can act, write, think, and target the correct market space like this founder.

Core Inputs for Doppelganger Style/Voice:
`;

  if (description) {
    prompt += `- Description of the Founder's voice/behavior: "${description}"\n`;
  }
  if (document) {
    prompt += `- Attached document with background writings, diaries, or essays from the founder.\n`;
  }

  prompt += `
Optional Strategic Inputs Provided by the Founder:
- Custom target industry: ${optionalInputs?.targetIndustry || "Not provided"}
- Custom target audience: ${optionalInputs?.targetAudience || "Not provided"}
- Custom vision: ${optionalInputs?.vision || "Not provided"}
- Custom mission: ${optionalInputs?.mission || "Not provided"}
- Custom goal: ${optionalInputs?.goal || "Not provided"}
- Custom content pillars: ${optionalInputs?.contentPillars || "Not provided"}

Connected Brands/Products (use as context/reference if any of the above strategic inputs are "Not provided"):
${productsContext || "No connected products"}

Rules for Strategy Context Generation:
1. If the founder provided a custom target industry, audience, vision, mission, goal, or content pillars, USE them exactly as defined or clean them up professionally.
2. If any of those strategic inputs are "Not provided", analyze the connected products' details. The founder will naturally operate in the same general industry, target the same general audience, and write about similar pillars. Extract, compile, and unify these fields across the active products to form a master strategic context for the founder agent.
3. If neither custom inputs nor connected products exist, deduce professional, baseline startup/entrepreneurial fields based on their voice description.
`;

  prompt += `\nExtract the personality traits, core values, communication style, key decision heuristics, and strategic context to build a structured profile.`;
  
  contents.push({ text: prompt });
  
  if (document) {
    contents.push({
      inlineData: {
        data: document.data,
        mimeType: document.mimeType
      }
    });
  }
  
  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    contents,
    {
      responseMimeType: "application/json",
      responseSchema: founderAgentSchema
    }
  );
  
  if (response.usageMetadata && userId) {
    await logTokenUsage(userId, "synthesizeFounderAgent", "gemini-3.1-pro-preview", response.usageMetadata);
  }
  
  const text = response.text;
  if (!text) {
    throw new Error("Failed to synthesize Founder Agent");
  }
  
  return JSON.parse(text);
}

export async function performSocialTrendResearch(topic: string, customToken?: string): Promise<string> {
  const prompt = `
    You are an expert social media strategist and LinkedIn growth hacker.
    
    Research current trends, successful post formats, structures, and templates on LinkedIn for the topic: "${topic}".
    
    CRITICAL: You must use the Google Search tool to search for:
    "trending LinkedIn posts formatting templates ${topic}" or similar.
    Find out:
    1. What formats, layouts, or hooks are currently viral or highly engaging on LinkedIn (e.g., listicles, contrarian hooks, story-based formats, short templates).
    2. What specific sub-topics, arguments, or keywords are trending.
    3. What templates are working best.
    
    Synthesize your findings into a concise list of 3-5 platform formatting guidelines and trend insights. Include specific tips on layout (e.g. paragraph spacing, formatting, use of negative space) and content strategy.
  `;
  
  try {
    const response = await generateContentProxy(
      "gemini-3.1-pro-preview",
      [{ text: prompt }],
      {
        tools: [{ googleSearch: {} }]
      },
      undefined,
      customToken
    );
    return response.text || "";
  } catch (err) {
    console.warn("[performSocialTrendResearch] Failed:", err);
    return "Use standard engaging LinkedIn formats: strong contrarian hook, spaced paragraphs, clear bulleted take-aways, and a thought-provoking final sentence.";
  }
}

export async function generateGeneralFounderPost(params: {
  topic: string;
  referencePosts?: string;
  attachmentStyle?: "text-only" | "image-only" | "image-overlay";
  customImagePrompt?: string;
  founderAgent: any;
  userId?: string;
  customToken?: string;
  layoutId?: string;
  recentLayoutHistory?: string[];
  isBranded?: boolean;
  brandLogoUrl?: string;
}): Promise<{
  postCopy: string;
  imagePrompt?: string;
  headline?: string;
  subtext?: string;
  imageUrl?: string;
  layoutId?: string;
}> {
  const { topic, referencePosts, attachmentStyle, customImagePrompt, founderAgent, userId, customToken, layoutId, recentLayoutHistory, isBranded, brandLogoUrl } = params;

  // Perform social media trend research first
  let trendResearch = "";
  try {
    trendResearch = await performSocialTrendResearch(topic, customToken);
  } catch (errRes) {
    console.warn("Trend research failed:", errRes);
  }

  let prompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Strategic Context:
- Target Industry: ${founderAgent.targetIndustry || "General Entrepreneurship"}
- Target Audience: ${founderAgent.targetAudience || "General Public/Professionals"}
- Vision: ${founderAgent.vision || ""}
- Mission: ${founderAgent.mission || ""}
- Goal: ${founderAgent.goal || ""}
- Key Content Pillars: ${founderAgent.contentPillars?.join(", ") || ""}

LinkedIn Platform Research & Trend Insights:
${trendResearch || "Focus on a strong hook, concise paragraphs, clean list/spacing formatting, and a strong CTA."}

Draft an organic, highly engaging social media post for LinkedIn.
Post Type: ${isBranded ? "Branded Founder Insight (Company Mission Aligned)" : "Personal Organic Founder Insight (Earned Secrets & Storytelling)"}
Topic: "${topic}"
`;

  if (referencePosts?.trim()) {
    prompt += `\nReference posts for style, structure, or tone inspiration:\n"${referencePosts}"\n`;
  }

  prompt += `
CRITICAL rules:
${isBranded 
  ? `1. Connect personal founder perspective naturally to company authority without sounding like a corporate press release.`
  : `1. Do NOT reference any specific products, company names, brands, or websites. This is a personal branding post for the founder's own profile.`}
2. Focus purely on high-signal insights, lessons learned, personal stories, or earned secrets.
3. Sound exactly like the founder's profile (behavioral traits, style, values).
4. CRITICAL: You must write this post using the platform formatting templates, hook styles, layout structure, and trending insights identified in the LinkedIn Platform Research & Trend Insights above.
`;

  if (attachmentStyle === "image-overlay") {
    prompt += `
Since this post will have a custom graphic with text overlaid, you must also generate:
- A short, punchy headline (1-5 words) to overlay on the image.
  CRITICAL: Do NOT write generic topic titles like "Ad Budgets" or "Hiring Tip". Instead, write a high-conviction, contrarian, or value-first visual hook that provokes immediate curiosity or challenges a status quo (e.g. "The Ad Budget Trap", "ARR is a Lie", "Stop Hiring Specialists", "Marginal Failure"). Max 4-5 words.
- A brief subtext (1-2 lines) to support and detail the hook on the image. It must outline a concrete lesson, metric, or question (e.g. "Why broad digital campaigns are destroying your pipeline (and how to fix it).", "How generalist squads out-deliver outsourced agencies by 3x.").
- A descriptive image prompt for an AI photo generator to create a beautiful, modern background graphic. It should specify high-quality editorial photography, cinematic lighting, and vast empty negative space (left, right, or top) for overlaying text. Do NOT instruct the generator to include any letters or words.
`;
  } else if (attachmentStyle === "image-only") {
    prompt += `
Since this post will have an image attachment (with no text overlaid), you must also generate:
- A detailed descriptive image prompt for an AI photo generator to create a stunning, evocative background graphic. It should specify high-quality editorial photography, cinematic lighting, representing the theme of the post. Do NOT instruct the generator to include any text or words.
`;
  }

  prompt += `
Return a JSON object with the following fields:
- postCopy: string (The actual post text copy with paragraphs, bullets, etc.)
- imagePrompt: string (Optional. The descriptive image prompt for Imagen AI. Required if an image is requested.)
- headline: string (Optional. The punchy headline for the text overlay. Required only if overlay style is requested.)
- subtext: string (Optional. The subtext for the text overlay. Required only if overlay style is requested.)
`;

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    [{ text: prompt }],
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          postCopy: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          headline: { type: Type.STRING },
          subtext: { type: Type.STRING }
        },
        required: ["postCopy"]
      }
    }
  );

  if (response.usageMetadata && userId) {
    await logTokenUsage(userId, "generateGeneralFounderPost", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const result = JSON.parse(response.text || "{}");
  
  // If image requested, trigger Imagen generation
  let imageUrl = "";
  let finalImagePrompt = customImagePrompt || result.imagePrompt;
  let chosenLayoutId = "";

  const textOnlyBlueprints = ["x-tweet-card"];

  if ((attachmentStyle === "image-only" || attachmentStyle === "image-overlay") && finalImagePrompt) {
    try {
      // Determine blueprint to align backdrop lighting (light mode vs dark mode)
      let selectedBlueprintId = "";
      if (layoutId && LAYOUT_BLUEPRINTS[layoutId]) {
        selectedBlueprintId = layoutId;
      } else if (attachmentStyle === "image-overlay") {
        const history = Array.isArray(recentLayoutHistory) ? recentLayoutHistory : [];
        const chosenBlueprint = selectLayout(history);
        selectedBlueprintId = chosenBlueprint.id;
      }
      
      const blueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId];
      if (blueprint && !textOnlyBlueprints.includes(blueprint.id)) {
        chosenLayoutId = blueprint.id;
        const isSplitOrFramed = [
          "editorial-left",
          "editorial-right",
          "split-horizontal",
          "frame-border",
          "sidebar-right",
          "diagonal-split",
          "stacked-blocks",
          "editorial-grid",
          "strategic-grid-split",
          "notebook-sketch"
        ].includes(blueprint.id);

      const aestheticConcepts = [
        "clean modern architectural photography, warm natural daylight, sleek glass and natural wood, 8k editorial photography",
        "vibrant creative studio setup, warm ambient lighting, modern aesthetic desk composition, high-end commercial photography",
        "minimalist 3D abstract geometric composition, warm organic textures, soft studio shadows, architectural digest aesthetic",
        "high-key daylight editorial setup, soft diffused light, crisp modern workspace, aesthetic composition",
        "editorial macro shot, tactile paper texture, fountain pen, natural sunlight, warm organic tones"
      ];
      const chosenConcept = aestheticConcepts[Math.floor(Math.random() * aestheticConcepts.length)];

      if (finalImagePrompt) {
        finalImagePrompt = `${finalImagePrompt}. Style: ${chosenConcept}, high resolution, zero text or letters in photo.`;
      } else {
        finalImagePrompt = `Bespoke high-end editorial backdrop for "${result.headline || topic}". Style: ${chosenConcept}, zero text in photo.`;
      }
      }

      const imgResUrl = await generateImageViaProxy(finalImagePrompt, userId, undefined);
      if (imgResUrl) {
        imageUrl = imgResUrl;
      }

    } catch (err) {
      console.error("Failed to generate general post image background:", err);
    }
  }

  return {
    postCopy: result.postCopy,
    imagePrompt: result.imagePrompt,
    headline: result.headline,
    subtext: result.subtext,
    imageUrl: imageUrl || undefined
  };
}

export async function generateFounderTopicSuggestions(
  founderAgent: any,
  userId?: string,
  targetProduct?: any
): Promise<{ title: string; description: string; prompt: string }[]> {
  const isBranded = !!targetProduct;

  let contextPrompt = "";
  if (isBranded) {
    contextPrompt = `
Analyze the following Founder Doppelganger agent profile AND target Brand/Product DNA:

Founder Persona Context:
- Target Industry: ${founderAgent?.targetIndustry || "B2B SaaS / Tech"}
- Target Audience: ${founderAgent?.targetAudience || "Executive Decision Makers"}
- Communication Style: ${founderAgent?.communicationStyle?.join(", ") || ""}

Target Brand Product DNA (${targetProduct.name}):
- Product Name: ${targetProduct.name}
- Product Description & Positioning: ${targetProduct.description || targetProduct.positioning || ""}
- Target Audience: ${targetProduct.audience || ""}
- Metrics & Proof Points / Traction: ${targetProduct.proofPoints || "Key performance metrics, conversion stats, milestone growth"}
- Unique Solution Mechanism: ${targetProduct.uniqueMechanism || ""}
- Customer Problem / Hell State: ${targetProduct.hellState || ""}
- Outcome / Heaven State: ${targetProduct.heavenState || ""}

Generate 5 highly engaging, strategic social media post ideas/topics tailored specifically for this founder to write about ${targetProduct.name} on their personal LinkedIn/X profile.

CRITICAL rules for Branded Post Topics:
1. Every topic MUST directly highlight ${targetProduct.name}'s specific product capabilities, customer metrics, growth milestones, or problem-solution storytelling.
2. Frame each concept as an authentic founder story or breakdown (e.g. "How ${targetProduct.name} reduced churn by 40%", "Why we built ${targetProduct.name}'s core mechanism", "The metric that changed how we serve ${targetProduct.audience || 'customers'}").
3. Make them punchy, specific, and actionable for B2B decision makers.
`;
  } else {
    contextPrompt = `
Analyze the following virtual Founder Doppelganger agent profile:
- Behavioral Traits: ${founderAgent?.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent?.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent?.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent?.decisionHeuristics?.join(", ") || ""}

Strategic Context:
- Target Industry: ${founderAgent?.targetIndustry || "General Entrepreneurship"}
- Target Audience: ${founderAgent?.targetAudience || "General Public/Professionals"}
- Vision: ${founderAgent?.vision || ""}
- Mission: ${founderAgent?.mission || ""}
- Goal: ${founderAgent?.goal || ""}
- Key Content Pillars: ${founderAgent?.contentPillars?.join(", ") || ""}

Generate 5 highly engaging, customized, and distinct social media post ideas/topics tailored for this founder to write on their personal LinkedIn/X profile.

CRITICAL rules for Non-Branded General Topics:
1. Do NOT mention or refer to any specific products, brands, or company names. Keep the topics focused on general insights, industry observations, opinions, personal experiences, or core beliefs.
2. Ensure the suggestions alternate between the founder's key content pillars.
3. The topics should feel authentic, organic, and avoid generic clickbait.
`;
  }

  const prompt = `You are a world-class executive strategist and personal branding coach.
${contextPrompt}

Return a JSON array of objects. Each object must have:
- title: A short title representing the theme (e.g. "Scaling $0 to $1M ARR", "The Churn Paradox").
- description: A brief explanation of the unique angle or story from the founder's perspective.
- prompt: A clear, actionable concept prompt that can be used directly as input to generate the final post.
`;

  const response = await generateContentProxy(
    "gemini-2.5-flash",
    [{ text: prompt }],
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prompt: { type: Type.STRING }
          },
          required: ["title", "description", "prompt"]
        }
      }
    }
  );

  if (response.usageMetadata && userId) {
    await logTokenUsage(userId, "generateFounderTopicSuggestions", "gemini-2.5-flash", response.usageMetadata);
  }

  try {
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Failed to parse topic suggestions response:", err);
    return [];
  }
}

export async function generateBrandedFounderPost(params: {
  topic: string;
  referencePosts?: string;
  attachmentStyle: "text-only" | "image-only" | "image-overlay";
  customImagePrompt?: string;
  founderAgent: any;
  product: any;
  userId?: string;
  customToken?: string;
  layoutId?: string;
  recentLayoutHistory?: string[];
}): Promise<{
  postCopy: string;
  imagePrompt?: string;
  headline?: string;
  subtext?: string;
  imageUrl?: string;
  layoutId?: string;
}> {
  const { topic, referencePosts, attachmentStyle, customImagePrompt, founderAgent, product, userId, customToken, layoutId, recentLayoutHistory } = params;

  // Perform social media trend research first
  let trendResearch = "";
  try {
    trendResearch = await performSocialTrendResearch(topic, customToken);
  } catch (errRes) {
    console.warn("Trend research failed:", errRes);
  }

  let prompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Product Focus & Brand DNA:
- Product Name: ${product.name}
- Positioning / Value Prop: ${product.positioning || ""}
- Target Audience: ${product.audience || ""}
- Company Stage: ${product.stage || ""}
- Content Pillars: ${product.contentPillars?.join(", ") || ""}

Additional Product DNA elements:
${product.enemy ? `- Enemy / Status Quo: ${product.enemy}` : ""}
${product.earnedSecret ? `- Earned Secret: ${product.earnedSecret}` : ""}
${product.originStory ? `- Origin Story: ${product.originStory}` : ""}
${product.uniqueMechanism ? `- Unique Mechanism: ${product.uniqueMechanism}` : ""}

Strategic Personal Branding Context:
- Target Industry: ${founderAgent.targetIndustry || ""}
- Vision: ${founderAgent.vision || ""}
- Mission: ${founderAgent.mission || ""}
- Goal: ${founderAgent.goal || ""}

LinkedIn Platform Research & Trend Insights:
${trendResearch || "Focus on a strong hook, concise paragraphs, clean list/spacing formatting, and a strong CTA."}

Draft an organic, highly engaging social media post for LinkedIn.
This is a BRANDED post written from your perspective as the founder of "${product.name}". 
Topic or Concept to cover: "${topic}"

CRITICAL rules:
1. Speak as the creator/founder of "${product.name}". You are sharing an insight, story, status quo challenge, or lesson directly related to the problem "${product.name}" solves or the journey of building it.
2. Blend the product's positioning, audience, and narrative elements smoothly into a high-value personal post. Avoid simple sales pitches—the post must offer real value to the reader.
3. Sound exactly like the founder's profile (behavioral traits, style, values).
4. CRITICAL: You must write this post using the platform formatting templates, hook styles, layout structure, and trending insights identified in the LinkedIn Platform Research & Trend Insights above.
5. Include a high-value call-to-action mentioning the official website link of ${product.name}${product.website || product.url || product.domain ? ` (${product.website || product.url || product.domain})` : ""} near the conclusion or footer of the post copy.
`;

  if (referencePosts?.trim()) {
    prompt += `\nReference posts for style, structure, or tone inspiration:\n"${referencePosts}"\n`;
  }

  if (attachmentStyle === "image-overlay") {
    prompt += `
Since this post will have a custom graphic with text overlaid, you must also generate:
- A short, punchy headline (1-5 words) to overlay on the image. 
  CRITICAL: Do NOT write generic topic titles like "Ad Budgets" or "Hiring Tip". Instead, write a high-conviction, contrarian, or value-first visual hook that provokes immediate curiosity or challenges a status quo (e.g. "The Ad Budget Trap", "ARR is a Lie", "Stop Hiring Specialists", "Marginal Failure"). Max 4-5 words.
- A brief subtext (1-2 lines) to support and detail the hook on the image. It must outline a concrete lesson, metric, or question (e.g. "Why broad digital campaigns are destroying your pipeline (and how to fix it).", "How generalist squads out-deliver outsourced agencies by 3x.").
- A descriptive image prompt for an AI photo generator to create a beautiful, modern background graphic. It should specify high-quality editorial photography, cinematic lighting, and vast empty negative space (left, right, or top) for overlaying text. Do NOT instruct the generator to include any letters or words.
`;
  } else if (attachmentStyle === "image-only") {
    prompt += `
Since this post will have an image attachment (with no text overlaid), you must also generate:
- A detailed descriptive image prompt for an AI photo generator to create a stunning, evocative background graphic. It should specify high-quality editorial photography, cinematic lighting, representing the theme of the post. Do NOT instruct the generator to include any text or words.
`;
  }

  prompt += `
Return a JSON object with the following fields:
- postCopy: string (The actual post text copy with paragraphs, bullets, etc.)
- imagePrompt: string (Optional. The descriptive image prompt for Imagen AI. Required if an image is requested.)
- headline: string (Optional. The punchy headline for the text overlay. Required only if overlay style is requested.)
- subtext: string (Optional. The subtext for the text overlay. Required only if overlay style is requested.)
`;

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    [{ text: prompt }],
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          postCopy: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          headline: { type: Type.STRING },
          subtext: { type: Type.STRING }
        },
        required: ["postCopy"]
      }
    }
  );

  if (response.usageMetadata && userId) {
    await logTokenUsage(userId, "generateBrandedFounderPost", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const result = JSON.parse(response.text || "{}");

  // Automatically attach brand website URL to post copy for branded posts
  const websiteLink = product?.website || product?.url || product?.domain;
  if (result.postCopy && websiteLink) {
    const formattedLink = websiteLink.startsWith('http') ? websiteLink : `https://${websiteLink}`;
    if (!result.postCopy.includes(websiteLink) && !result.postCopy.includes(formattedLink)) {
      result.postCopy = `${result.postCopy.trim()}\n\n🔗 ${formattedLink}`;
    }
  }
  
  let imageUrl = "";
  let finalImagePrompt = customImagePrompt || result.imagePrompt;
  let chosenLayoutId = "";

  const textOnlyBlueprints = ["x-tweet-card"];

  if ((attachmentStyle === "image-only" || attachmentStyle === "image-overlay") && finalImagePrompt) {
    try {
      // Determine blueprint to align backdrop lighting (light mode vs dark mode)
      let selectedBlueprintId = "";
      if (layoutId && LAYOUT_BLUEPRINTS[layoutId]) {
        selectedBlueprintId = layoutId;
      } else if (attachmentStyle === "image-overlay") {
        const history = Array.isArray(recentLayoutHistory) ? recentLayoutHistory : [];
        const chosenBlueprint = selectLayout(history);
        selectedBlueprintId = chosenBlueprint.id;
      }
      
      const blueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId];
      if (blueprint && !textOnlyBlueprints.includes(blueprint.id)) {
        chosenLayoutId = blueprint.id;
        const isSplitOrFramed = [
          "editorial-left",
          "editorial-right",
          "split-horizontal",
          "frame-border",
          "sidebar-right",
          "diagonal-split",
          "stacked-blocks",
          "editorial-grid",
          "strategic-grid-split",
          "notebook-sketch"
        ].includes(blueprint.id);

      const aestheticConcepts = [
        "clean modern architectural photography, warm natural daylight, sleek glass and natural wood, 8k editorial photography",
        "vibrant creative studio setup, warm ambient lighting, modern aesthetic desk composition, high-end commercial photography",
        "minimalist 3D abstract geometric composition, warm organic textures, soft studio shadows, architectural digest aesthetic",
        "high-key daylight editorial setup, soft diffused light, crisp modern workspace, aesthetic composition",
        "editorial macro shot, tactile paper texture, fountain pen, natural sunlight, warm organic tones"
      ];
      const chosenConcept = aestheticConcepts[Math.floor(Math.random() * aestheticConcepts.length)];

      if (finalImagePrompt) {
        finalImagePrompt = `${finalImagePrompt}. Style: ${chosenConcept}, high resolution, zero text or letters in photo.`;
      } else {
        finalImagePrompt = `Bespoke high-end editorial backdrop for "${result.headline || topic}". Style: ${chosenConcept}, zero text in photo.`;
      }
      }

      const imgResUrl = await generateImageViaProxy(finalImagePrompt, userId, product?.id);
      if (imgResUrl) {
        imageUrl = imgResUrl;
      }

    } catch (err) {
      console.error("Failed to generate branded post image background:", err);
    }
  }

  return {
    postCopy: result.postCopy,
    imagePrompt: result.imagePrompt,
    headline: result.headline,
    subtext: result.subtext,
    imageUrl: imageUrl || undefined
  };
}

export interface RawDiscoveredTemplate {
  id: string;
  name: string;
  layoutId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  sourceTrend: string;
  viralityScore: string;
  whyViral: string;
  isLightBg: boolean;
  rawHtml?: string;
}

export interface VisualTrendReport {
  summary: string;
  viralPick: {
    name: string;
    templateId: string;
    viralityScore: string;
    whyViral: string;
  };
  discoveredTemplates: RawDiscoveredTemplate[];
}

export async function researchVisualTrends(): Promise<VisualTrendReport> {
  const FOCUS_NICHES = [
    "AI agent tooling & B2B SaaS",
    "developer tools & cloud infrastructure",
    "fractional executives & high-ticket B2B consulting",
    "fintech B2B & enterprise software",
    "creator-economy marketplaces & growth platforms",
    "hiring & HR tech platforms"
  ];
  const focusNiche = FOCUS_NICHES[Math.floor(Math.random() * FOCUS_NICHES.length)];
  console.log(`\n------------------------------------------------------`);
  console.log(`[STEP 1/5 CLIENT] Triggering researchVisualTrends() for lens: [${focusNiche}] -> PASSED`);

  try {
    console.log(`[STEP 2/5 CLIENT] Fetching Firebase auth user ID token...`);
    const token = await auth.currentUser?.getIdToken();
    console.log(`[STEP 2/5 CLIENT] Auth token check -> ${token ? 'PASSED (Token retrieved)' : 'PASSED (Unauthenticated mode)'}`);

    console.log(`[STEP 3/5 CLIENT] Sending POST to /api/ai/research-trends...`);
    const res = await fetch('/api/ai/research-trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ focusNiche })
    });

    console.log(`[STEP 4/5 CLIENT] Server HTTP response status: ${res.status} ${res.statusText} -> ${res.ok ? 'PASSED' : 'FAILED'}`);

    if (res.ok) {
      console.log(`[STEP 5/5 CLIENT] Parsing server JSON response...`);
      const rawText = await res.text();
      console.log(`[STEP 5/5 CLIENT] Server Raw Response Text (Length: ${rawText.length} chars):\n`, rawText.slice(0, 500));
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
        console.log(`[STEP 5/5 CLIENT] JSON.parse succeeded! Object keys:`, Object.keys(parsed || {}));
      } catch (jsonErr: any) {
        console.error(`[STEP 5/5 CLIENT] JSON.parse(rawText) FAILED:`, jsonErr);
        throw jsonErr;
      }

      // --- CLIENT KEY NORMALIZATION: Remap Gemini alias keys to canonical 'discoveredTemplates' ---
      // NOTE: Check .length > 0, not just Array.isArray — empty arrays are truthy but useless
      if (parsed && (!Array.isArray(parsed.discoveredTemplates) || parsed.discoveredTemplates.length === 0)) {
        const aliasKeys = ['trends', 'templates', 'visualTemplates', 'discoveredTrends', 'visualTrends', 'items', 'layouts'];
        for (const alias of aliasKeys) {
          if (Array.isArray(parsed[alias]) && parsed[alias].length > 0) {
            console.warn(`[STEP 5/5 CLIENT] Key normalization: Remapping "${alias}" -> "discoveredTemplates"`);
            parsed.discoveredTemplates = parsed[alias];
            break;
          }
        }
        // Last resort: find any array with rawHtml inside
        if (!Array.isArray(parsed.discoveredTemplates) || parsed.discoveredTemplates.length === 0) {
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key]) && parsed[key].length > 0 && parsed[key][0]?.rawHtml) {
              console.warn(`[STEP 5/5 CLIENT] Key normalization (rawHtml scan): Remapping "${key}" -> "discoveredTemplates"`);
              parsed.discoveredTemplates = parsed[key];
              break;
            }
          }
        }
      }

      // --- CLIENT rawHtml VALIDATION: Patch templates with missing/empty rawHtml ---
      if (parsed && Array.isArray(parsed.discoveredTemplates)) {
        parsed.discoveredTemplates = parsed.discoveredTemplates.map((t: any, idx: number) => {
          if (!t.rawHtml || typeof t.rawHtml !== 'string' || t.rawHtml.trim().length < 50) {
            console.warn(`[STEP 5/5 CLIENT] Template "${t.id || idx}" missing valid rawHtml (${(t.rawHtml || '').length} chars). Patching with client fallback.`);
            const pc = t.primaryColor || '#7C3AED';
            const sc = t.secondaryColor || '#08080C';
            const ff = t.fontFamily || 'Inter';
            t.rawHtml = `<div style="width:1080px;height:1080px;position:relative;background:${sc};overflow:hidden;font-family:'${ff}',system-ui,sans-serif;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;padding:80px;">
              <img src="{{IMAGE_URL}}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.3;filter:brightness(0.5);z-index:1;" />
              <div style="position:relative;z-index:10;display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="background:${pc};color:#000;font-weight:900;font-size:13px;letter-spacing:0.15em;padding:6px 14px;border-radius:6px;text-transform:uppercase;">${(t.sourceTrend || t.name || 'TREND INSIGHT').toUpperCase()}</div>
                <div>{{LOGO_URL}}</div>
              </div>
              <div style="position:relative;z-index:10;display:flex;flex-direction:column;gap:20px;">
                <div style="width:60px;height:6px;background:${pc};border-radius:3px;"></div>
                <h2 style="color:#ffffff;font-weight:900;font-size:clamp(38px,5vw,64px);line-height:1.1;margin:0;text-transform:uppercase;letter-spacing:-0.02em;">{{HEADLINE}}</h2>
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-left:6px solid ${pc};border-radius:12px;padding:24px 30px;">
                  <p style="color:#cbd5e1;font-weight:500;font-size:22px;line-height:1.45;margin:0;">{{SUBTEXT}}</p>
                </div>
              </div>
            </div>`;
          }
          return t;
        });
      }

      if (parsed && Array.isArray(parsed.discoveredTemplates) && parsed.discoveredTemplates.length > 0) {
        console.log(`[STEP 5/5 CLIENT] Dynamic AI Templates received -> PASSED (${parsed.discoveredTemplates.length} templates)`);
        console.log(`------------------------------------------------------\n`);
        loggerService.addLog("system", "success", `[Visual Trend Engine] Synthesized ${parsed.discoveredTemplates.length} grounded templates & color palettes for [${focusNiche}].`);
        return parsed;
      } else {
        console.warn(`[STEP 5/5 CLIENT] Server response JSON missing 'discoveredTemplates' after normalization -> FAILED. Final keys:`, Object.keys(parsed || {}));
      }
    } else {
      const errTxt = await res.text().catch(() => '');
      console.error(`[STEP 4/5 CLIENT] Server returned error response body:`, errTxt);
    }
  } catch (err: any) {
    console.error(`[CLIENT researchVisualTrends ERROR] -> FAILED:`, err);
  }

  console.warn(`[CLIENT researchVisualTrends FALLBACK TRIGGERED] ⚠️ WARNING: Server proxy research failed or returned empty payload.`);
  console.warn(`[CLIENT researchVisualTrends FALLBACK TRIGGERED] Returning 6 pre-built static fallback templates to prevent UI crash!`);
  console.log(`------------------------------------------------------\n`);

  // Guaranteed fallback template set (Max 4 curated top viral templates)
  return {
    summary: `Active grounded visual trend analysis for ${focusNiche}`,
    viralPick: {
      name: "X (Twitter) Viral Tweet Card",
      templateId: "x-tweet-card",
      viralityScore: "99/100 Virality Index",
      whyViral: "Native tweet screenshot card with verified badge and engagement metrics."
    },
    discoveredTemplates: [
      {
        id: "x-tweet-card",
        name: "X (Twitter) Viral Tweet Card",
        primaryColor: "#1D9BF0",
        secondaryColor: "#000000",
        fontFamily: "Inter",
        sourceTrend: "Native Social Proof Tweet Card",
        viralityScore: "99/100",
        whyViral: "Highest converting social proof layout on LinkedIn & X",
        isLightBg: false,
        rawHtml: `<div style="width: 1080px; height: 1080px; background: #000000; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 80px 85px;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px;">
              <div style="display: flex; align-items: center; gap: 20px;">
                <div style="width: 84px; height: 84px; border-radius: 50%; background: #16181c; border: 1.5px solid #2f3336; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  {{LOGO_URL}}
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; font-size: 30px; color: #f7f9f9; letter-spacing: -0.01em;">Founder Daily</span>
                    <svg style="width: 26px; height: 26px; color: #1d9bf0;" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM9.6 17.2L5.4 13l1.4-1.4 2.8 2.8 7.6-7.6 1.4 1.4-9 9z"/></svg>
                  </div>
                  <span style="font-size: 22px; color: #71767b; font-weight: 400;">@founder_daily</span>
                </div>
              </div>
              <div style="color: #71767b;">
                <svg style="width: 36px; height: 36px; fill: currentColor;" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
            </div>
            <div style="font-size: 46px; line-height: 1.38; font-weight: 700; color: #f7f9f9; margin-bottom: 32px; word-break: break-word; letter-spacing: -0.01em;">
              {{HEADLINE}}
            </div>
            <div style="font-size: 26px; line-height: 1.5; color: #71767b; font-weight: 400; margin-bottom: 36px;">
              {{SUBTEXT}}
            </div>
            <div style="font-size: 22px; color: #71767b; border-bottom: 1px solid #2f3336; padding-bottom: 28px; font-weight: 400;">
              <span>10:42 AM · Jul 29, 2026</span> · <span style="color: #f7f9f9; font-weight: 700;">1.8M</span> Views
            </div>
          </div>
          <div style="border-top: 1px solid #2f3336; padding-top: 32px; display: flex; align-items: center; justify-content: space-between; color: #71767b; font-size: 24px; font-weight: 400;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.59-4 7.01v3.23c0 .54-.59.88-1.04.59l-3.69-2.31h-3.765c-4.42 0-8.005-3.58-8.005-8zm8.005-6c-3.317 0-6.005 2.69-6.005 6s2.688 6 6.005 6h4.316c.26 0 .51.07.73.2l2.43 1.52v-1.87c0-.55.45-1 1-1 2.214-1.01 3.549-3.23 3.549-5.72 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>
              <span>107</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M4.5 3.88l4.42 4.42-1.42 1.42L5.5 7.72V15c0 1.66 1.34 3 3 3h7v2H8.5c-2.76 0-5-2.24-5-5V7.72L1.5 9.72.08 8.3 4.5 3.88zM15.5 20.12l-4.42-4.42 1.42-1.42 2 2V9c0-1.66-1.34-3-3-3h-7V4h7c2.76 0 5 2.24 5 5v7.28l2-2 1.42 1.42-4.42 4.42z"/></svg>
              <span>12</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222 0-2.365.58-3.102 1.56-.737-.98-1.88-1.56-3.102-1.56C8.433 5.5 6.75 7.18 6.75 9.243c0 3.36 4.3 7.02 6.845 8.957.29.22.69.22.98 0 2.545-1.937 6.845-5.597 6.845-8.957 0-2.063-1.683-3.743-3.723-3.743zm-3.102 11.27C11.53 15.22 8.75 12.06 8.75 9.243c0-1.02.8-1.743 1.723-1.743.83 0 1.62.51 1.95 1.25.17.38.55.62.97.62s.8-.24.97-.62c.33-.74 1.12-1.25 1.95-1.25.923 0 1.723.723 1.723 1.743 0 2.817-2.78 5.977-4.843 7.527z"/></svg>
              <span>218</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM3.75 21V11h2v10h-2zM18.75 21V7h2v14h-2zM13.75 21V9h2v12h-2z"/></svg>
              <span>14K</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.12 2 6.5 2h11C18.88 2 20 3.12 20 4.5v16.73c0 .54-.59.88-1.04.59L12 17.52l-6.96 4.3c-.45.29-1.04-.05-1.04-.59V4.5zm2.5-.5c-.28 0-.5.22-.5.5v14.41l5.52-3.41c.29-.18.67-.18.96 0l5.52 3.41V4.5c0-.28-.22-.5-.5-.5h-11z"/></svg>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg style="width: 28px; height: 28px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 2.59l5.71 5.71-1.42 1.42L13 6.41V16h-2V6.41L7.71 9.72 6.29 8.3 12 2.59zM4 15v4c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-4h2v4c0 1.66-1.34 3-3 3H5c-1.66 0-3-1.34-3-3v-4h2z"/></svg>
            </div>
          </div>
        </div>`
      }
    ]
  };
}

export async function regenerateBlogCoverImage(
  campaignId: string,
  productId: string
): Promise<{ blogImageUrl: string; blogImagePrompt: string }> {
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : '';

  const res = await fetch('/api/blog/regenerate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ campaignId, productId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to regenerate blog cover image');
  }

  return await res.json();
}



