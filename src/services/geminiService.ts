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

export const flattenVisualData = async (imageUrl: string, customHtml: string | undefined, activeLogo: string | null, layout?: LayoutConfig): Promise<string> => {
  return renderVisualToJpegOffscreen(
    'custom-overlay',
    { customHtml, layout },

    imageUrl,
    null,
    "Brand",
    activeLogo
  );
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
      const parsed = JSON.parse(text);
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

function extractJSON(text: string): string {
  const firstOpenBracket = text.indexOf('[');
  const firstOpenBrace = text.indexOf('{');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
    // Array JSON
    startIdx = firstOpenBracket;
    endIdx = text.lastIndexOf(']');
  } else if (firstOpenBrace !== -1) {
    // Object JSON
    startIdx = firstOpenBrace;
    endIdx = text.lastIndexOf('}');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return text;
}

async function generateContentProxy(model: string, contents: any, config?: any, signal?: AbortSignal) {
  const token = await auth.currentUser?.getIdToken();
  const userId = auth.currentUser?.uid;
  const activeProductId = userId ? localStorage.getItem(`activeProductId_${userId}`) : null;

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
  signal?: AbortSignal
): Promise<Partial<ProductDNA>> {
  const normalizedWebsite = website ? normalizeWebsiteUrl(website) : "";
  const hasWebsite = normalizedWebsite !== "";
  const hasDescription = currentDna?.description && currentDna.description.trim() !== "";
  const hasDocument = !!document;
  
  let sourceContext = "";
  let scrapedMediaImages: string[] = [];
  let scrapedLogoUrl = "";
  
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
      const token = await auth.currentUser?.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second total timeout for scraping endpoint
      
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
    }
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
      return parsedResult;
    }
    throw new Error("Failed to parse JSON response");
  }
}

export async function regeneratePostWithFeedback(
  originalCopy: string,
  feedbacks: string[],
  theme: string,
  coreMessage: string,
  userId?: string
): Promise<string> {
  const prompt = `
    You are an expert copywriter. I have a specific social media post that needs to be improved based on reviewer feedback.
    
    Original Campaign Theme: ${theme}
    Original Core Message: ${coreMessage}
    
    Original Post Copy:
    "${originalCopy}"
    
    Reviewer Feedback for this specific post:
    ${feedbacks.map(f => `- ${f}`).join('\n')}
    
    Please rewrite the post copy, incorporating this feedback. Keep the tone and format appropriate for the platform, but improve the content as requested.
    Return ONLY the rewritten post copy text. Do not include any JSON formatting, markdown code blocks, or extra commentary.
  `;

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    prompt,
    {
      responseMimeType: "text/plain"
    }
  );

  if (response.usageMetadata) {
    await logTokenUsage(userId, "regeneratePostWithFeedback", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const text = response.text;
  if (!text) {
    throw new Error("Failed to regenerate post with feedback");
  }

  return text.trim();
}

export async function researchFocus(focus: string, channels: string[] = [], subCategory?: string, userId?: string): Promise<string[]> {
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
    { model: "gemini-3.5-flash", search: false }
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

      const response = await generateContentProxy(strategy.model, prompt, config);

      if (response.usageMetadata && userId) {
        await logTokenUsage(userId, "researchFocus", strategy.model, response.usageMetadata);
      }

      const text = response.text;
      if (!text) {
        throw new Error("Empty response text");
      }

      const trimmed = text.trim();
      try {
        return JSON.parse(trimmed);
      } catch {
        const extracted = extractJSON(trimmed);
        try {
          return JSON.parse(extracted);
        } catch {
          const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            return JSON.parse(match[1].trim());
          }
        }
      }
      throw new Error("JSON parsing failed for text content");
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

export async function generateCampaign(dna: ProductDNA, focus: string, insights: string[], generateImages: boolean = false, feedback?: string, previousDraft?: Omit<WeeklyCampaign, 'id' | 'createdAt'>, channels: string[] = ['LinkedIn', 'X', 'Instagram', 'Facebook', 'Reddit'], campaignTheme?: string, subCategory?: string, userId?: string, aspectRatio?: string, onProgress?: (step: number, total: number, msg: string) => void): Promise<Omit<WeeklyCampaign, 'id' | 'createdAt'>> {
  // Fetch creatives if generateImages is false
  let creatives: Creative[] = [];
  if (!generateImages && dna.id && userId) {
    try {
      const q = query(
        collection(db, "creatives"), 
        where("productId", "==", dna.id),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => creatives.push({ id: doc.id, ...doc.data() } as Creative));
      
      // Shuffle creatives to ensure variety
      for (let i = creatives.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [creatives[i], creatives[j]] = [creatives[j], creatives[i]];
      }
    } catch (e) {
      console.error("Failed to fetch creatives", e);
    }
  }
  const useCreatives = !generateImages && creatives.length > 0;
  let creativeIndex = 0;

  const totalSteps = (generateImages || useCreatives) ? 3 : 2;
  if (onProgress) { onProgress(1, totalSteps, "Analyzing brand DNA and mapping week-long campaign..."); }

  const prompt = `
    You are an expert B2B SaaS marketer.
    
    Generate a weekly social media campaign based on the provided Brand Position, the Key Insights, and the specific focus area.
    
    Campaign Focus Area: ${focus}
    ${subCategory ? `Industry Sub-Category/Niche: ${subCategory}` : ''}
    ${campaignTheme ? `Campaign Theme: ${campaignTheme}` : ''}
    
    Key Insights about this Focus:
    ${insights.map(i => `- ${i}`).join('\n')}
    
    Brand Position:
    Website: ${dna.website}
    Positioning: ${dna.positioning}
    Audience: ${dna.audience}
    Tone: ${dna.tone}
    Stage: ${dna.stage}
    Visual Style: ${dna.visualStyle || 'Standard professional'}
    ${dna.visualData ? `
    Visual DNA:
    - Colors: ${dna.visualData.colors.join(', ')}
    - Fonts: Primary (${dna.visualData.fonts.primary}), Secondary (${dna.visualData.fonts.secondary})
    - Typography Hierarchy: ${dna.visualData.typographyHierarchy}
    - Image Style: ${dna.visualData.imageStyle}
    ` : ''}
    
    Advanced DNA (Psychology, Narrative, & Strategy):
    ${dna.enemy ? `- The Enemy / Status Quo: ${dna.enemy}` : ''}
    ${dna.earnedSecret ? `- The Earned Secret: ${dna.earnedSecret}` : ''}
    ${dna.originStory ? `- Origin Story: ${dna.originStory}` : ''}
    ${dna.hellState ? `- 'Hell' State (Before): ${dna.hellState}` : ''}
    ${dna.heavenState ? `- 'Heaven' State (After): ${dna.heavenState}` : ''}
    ${dna.objections ? `- Top Buying Objections: ${dna.objections}` : ''}
    ${dna.uniqueMechanism ? `- Unique Mechanism: ${dna.uniqueMechanism}` : ''}
    ${dna.proofPoints ? `- Proof Points: ${dna.proofPoints}` : ''}
    ${dna.vocabularyAlways ? `- Vocabulary to ALWAYS use: ${dna.vocabularyAlways}` : ''}
    ${dna.vocabularyNever ? `- Vocabulary to NEVER use: ${dna.vocabularyNever}` : ''}
    ${dna.contentPillars && dna.contentPillars.length > 0 ? `- Content Pillars: ${dna.contentPillars.join(' | ')}` : ''}
    ${dna.targetIcps && dna.targetIcps.length > 0 ? `- Target ICPs & Pain Points:\n      ${dna.targetIcps.map(icp => `${icp.name} (Pains: ${icp.painPoints.join(', ')})`).join('\n      ')}` : ''}

    ${feedback ? `
    CRITICAL INSTRUCTION: The user rejected the previous draft and provided the following feedback for improvement:
    "${feedback}"
    
    Please strictly incorporate this feedback into the new campaign.
    ` : ''}
    ${previousDraft ? `
    Here is the previous draft for context (improve upon this based on the feedback):
    Theme: ${previousDraft.theme}
    Core Message: ${previousDraft.coreMessage}
    ` : ''}

    Use the following research context to inform the campaign strategy:
    ${RESEARCH_CONTEXT}

    The campaign must include:
    - A specific theme for the week.
    - The target audience segment.
    - A core message (one sentence value proposition).
    - A hook (1-2 lines mirroring pain-point language).
    - A clear Call to Action (CTA).
    - The overall content format.
    - Daily Post Sequencing: Vary content types daily to maintain engagement. Provide a post sequence for each day (Monday to Sunday).
    - CRITICAL FORMATTING RULES FOR 'copy' PER PLATFORM:
      - LinkedIn: Use generous whitespace, short 1-2 sentence paragraphs, and professional emojis.
      - X (Twitter): Keep it punchy, use line breaks for readability, max 2-3 relevant hashtags.
      - Instagram: Clean line breaks, aesthetic emojis, and a block of relevant hashtags at the bottom.
      - Facebook: Conversational paragraph spacing, light and friendly emojis.
      - Reddit: Use Markdown (bolding, bullet points, italics). STRICTLY NO emojis and NO hashtags.
      - General: Break all paragraphs into short lines, ensure clear line breaks between sections, convert inline strategies into properly separated numbered points, do NOT include citations like [1.2]. Return clean, well-structured, highly readable content.
    - For each daily post, provide platform-specific versions for the following channels ONLY: ${channels.join(', ')}. Each must have copy and format.
    ${generateImages ? `- For EACH DAY (not for each platform), YOU MUST output 'visualType' (MUST be 'custom-overlay'). YOU MUST ALSO output a 'visualData' object with 'cinematicPrompt' and 'customHtml'. For 'customHtml', you are generating bespoke, magazine-quality text layouts over images using STRICTLY INLINE STYLES. The canvas is 1080x1080px. CRITICAL RULES TO PREVENT TEXT OVERLAP: 1. NEVER use absolute/fixed positioning for multiple individual text elements. 2. Instead, use a single absolute container and arrange content inside it using Flexbox (display: flex; flex-direction: column; gap: 24px;). 3. Use safe line-heights (minimum 1.2). 4. Use backdrop-filter or gradients so text is readable against the background image. Each day should look visually distinct.` : ""}
    ${useCreatives ? `- For EACH DAY, provide an 'overlayText' field (max 10 words). This will be overlaid onto the brand's custom creatives.` : ""}
    - Repurposing notes (how to reuse this week's assets next week).
    - A confidence score (0-100) based on relevance.
    - The primary content pillar used (e.g., "Problem-spotting & empathy").
    - A research summary (1-2 paragraphs summarizing what you found about the company and audience trends).
  `;

  const modelsToTry = ["gemini-3.1-pro-preview", "gemini-3.5-flash"];
  let campaignResponseText = "";
  let successModel = "gemini-3.1-pro-preview";
  let lastCampaignError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[generateCampaign] Attempting generation with model: ${modelName}`);
      const response = await generateContentProxy(
        modelName,
        prompt,
        {
          responseMimeType: "application/json",
          responseSchema: campaignSchema
        }
      );
      
      if (response.usageMetadata && userId) {
        await logTokenUsage(userId, "generateCampaign", modelName, response.usageMetadata);
      }
      
      if (response.text) {
        campaignResponseText = response.text;
        successModel = modelName;
        break;
      }
    } catch (err: any) {
      console.warn(`[generateCampaign] Model ${modelName} failed:`, err);
      lastCampaignError = err;
    }
  }

  if (!campaignResponseText) {
    throw lastCampaignError || new Error("Failed to generate campaign with any available model");
  }

  let campaign;
  const trimmedCampaignText = campaignResponseText.trim();
  try {
    campaign = JSON.parse(trimmedCampaignText);
  } catch (e) {
    console.warn("[generateCampaign] Standard JSON parse failed, initiating robust parsing...");
    const extracted = extractJSON(trimmedCampaignText);
    try {
      campaign = JSON.parse(extracted);
    } catch {
      const match = trimmedCampaignText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        try {
          campaign = JSON.parse(match[1].trim());
        } catch (innerE) {
          logSilentError("Failed to parse JSON response on secondary match", { context: "generateCampaign", text: campaignResponseText });
          throw new Error("Failed to parse JSON response");
        }
      } else {
        logSilentError("Failed to parse JSON response, no matches found", { context: "generateCampaign", text: campaignResponseText });
        throw new Error("Failed to parse JSON response");
      }
    }
  }

  // Ensure platformVersions exists for backward compatibility if not generated
  if (!campaign.platformVersions && campaign.dailyPosts && campaign.dailyPosts.length > 0) {
    campaign.platformVersions = campaign.dailyPosts[0].platformVersions;
  } else if (!campaign.platformVersions) {
    campaign.platformVersions = [];
  }

  // Phase 2: Format the copy using a cheaper model (gemini-2.5-flash)
  const totalSteps2 = (generateImages || useCreatives) ? 3 : 2;
  if (onProgress) { onProgress(2, totalSteps2, "Formatting and structuring copy length..."); }
  try {
    const formatPrompt = `
      You are a strict text formatter. Your ONLY job is to format the 'copy' fields in the provided JSON campaign data.
      DO NOT change any words, sentences, or the meaning of the text.
      Apply excellent social media formatting to the 'copy' fields:
      - Add appropriate line breaks (double spacing between paragraphs).
      - Use bolding for emphasis (using markdown **bold**).
      - Add relevant emojis if appropriate, but keep it professional.
      - Use bullet points or numbered lists where it makes sense.
      
      Return the EXACT SAME JSON structure, just with the 'copy' fields formatted.
      
      Campaign JSON:
      ${JSON.stringify(campaign)}
    `;
    
    const formatResponse = await generateContentProxy(
      "gemini-2.5-flash",
      formatPrompt,
      {
        responseMimeType: "application/json",
        responseSchema: campaignSchema
      }
    );
    
    if (formatResponse.usageMetadata) {
      await logTokenUsage(userId, "formatCampaign", "gemini-2.5-flash", formatResponse.usageMetadata);
    }
    
    if (formatResponse.text) {
      const formattedCampaign = JSON.parse(formatResponse.text);
      // Ensure we don't lose any data if the model hallucinated
      if (formattedCampaign.dailyPosts && formattedCampaign.dailyPosts.length > 0) {
        campaign = formattedCampaign;
      }
    }
  } catch (e) {
    console.error("Formatting phase failed, falling back to unformatted campaign", e);
    // Fallback to the original campaign if formatting fails
  }

  if (generateImages || useCreatives) {
    if (onProgress) { onProgress(3, 3, "Tror's designer is creating custom visuals and layouts..."); }
    const imageTasks: (() => Promise<void>)[] = [];
    
    // Helper to compress image to JPEG
    const compressImage = async (base64Str: string, quality = 0.85): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        if (!base64Str.startsWith('data:')) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64Str);
          
          // Fill with white background in case of transparent PNG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => {
          console.error("compressImage failed to load img src");
          resolve(base64Str); // Fallback to original
        };
        img.src = base64Str;
      });
    };

    // Pre-fetch logo to avoid network/CORS failures during parallel processing
    let cachedLogoBase64: string | null = null;
    if (dna.logoUrl) {
      try {
        cachedLogoBase64 = await new Promise<string | null>((resolve) => {
          const img = new Image();
          if (!dna.logoUrl!.startsWith('data:')) {
            img.crossOrigin = "anonymous";
          }
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = dna.logoUrl!;
        });
      } catch (e) {
        console.error("Failed to pre-fetch logo", e);
      }
    }

    // Helper to overlay logo
    const overlayLogo = async (base64Image: string, logoBase64: string, layoutText?: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64Image);
          
          ctx.drawImage(img, 0, 0);
          
          const logo = new Image();
          logo.crossOrigin = "anonymous";
          logo.onload = () => {
            // Calculate logo size (e.g., 10% of image width for a premium subtle look)
            let logoWidth = canvas.width * 0.08;
            let logoHeight = (logo.height / logo.width) * logoWidth;
            
            // Universal logo size guardrails
            const MAX_LOGO_WIDTH = 120;
            const MAX_LOGO_HEIGHT = 60;
            
            if (logoWidth > MAX_LOGO_WIDTH) {
              logoWidth = MAX_LOGO_WIDTH;
              logoHeight = (logo.height / logo.width) * logoWidth;
            }
            if (logoHeight > MAX_LOGO_HEIGHT) {
              logoHeight = MAX_LOGO_HEIGHT;
              logoWidth = (logo.width / logo.height) * logoHeight;
            }
            
            // Default Position: bottom center with padding
            const padding = canvas.width * 0.05;
            let x = (canvas.width - logoWidth) / 2;
            let y = canvas.height - logoHeight - padding;
            
            if (layoutText) {
              const layout = (layoutText.length + layoutText.charCodeAt(0)) % 4;
              switch (layout) {
                case 0:
                  // Text Center Showcase -> Logo Bottom Center
                  x = (canvas.width - logoWidth) / 2;
                  y = canvas.height - logoHeight - padding;
                  break;
                case 1:
                  // Text Bottom Left Stack -> Logo Top Right (to balance)
                  x = canvas.width - logoWidth - padding;
                  y = padding;
                  break;
                case 2:
                  // Text Center Editorial (Glass Box in middle) -> Logo Bottom Right
                  x = canvas.width - logoWidth - padding;
                  y = canvas.height - logoHeight - padding;
                  break;
                case 3:
                  // Text Top Left Elegant -> Logo Bottom Right (classic diagonal balance)
                  x = canvas.width - logoWidth - padding;
                  y = canvas.height - logoHeight - padding;
                  break;
              }
            }
            
            // Ensure transparency is respected for the logo itself
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(logo, x, y, logoWidth, logoHeight);
            resolve(canvas.toDataURL('image/png'));
          };
          logo.onerror = () => resolve(base64Image);
          logo.src = logoBase64;
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
      });
    };

    // Helper to overlay text on a custom creative
    const overlayTextOnCreative = async (creativeUrl: string, text: string): Promise<string> => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const scale = 2; // Supersample for crispness
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(creativeUrl);
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const primaryColor = (dna.visualData?.colors && dna.visualData.colors.length > 0) ? dna.visualData.colors[0] : '#7C3AED';
          const fontName = dna.visualData?.fonts?.primary || 'Inter';
          
          // Pseudo-random layout based on text length to feel "designed" not stamped
          const layout = (text.length + text.charCodeAt(0)) % 4; 
          
          const baseFontSize = Math.max(48, Math.floor(canvas.width * 0.055));
          ctx.fillStyle = '#FFFFFF';
          
          const getLines = (context: CanvasRenderingContext2D, textStr: string, maxWidthStr: number) => {
            const words = textStr.split(' ');
            let line = '';
            const lines: string[] = [];
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              if (context.measureText(testLine).width > maxWidthStr && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line.trim());
            return lines;
          };

          const maxWidth = canvas.width * 0.85;
          const padding = canvas.width * 0.08;

          switch(layout) {
            case 0: {
              // Center Heavy Drop Shadow
              ctx.fillStyle = 'rgba(0,0,0,0.25)';
              ctx.fillRect(0, 0, canvas.width, canvas.height); 
              
              ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
              ctx.shadowBlur = 40;
              ctx.shadowOffsetY = 15;
              
              ctx.font = `900 ${baseFontSize * 1.3}px "${fontName}", sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const lines = getLines(ctx, text.toUpperCase(), maxWidth);
              const lineHeight = baseFontSize * 1.5;
              const startY = (canvas.height - (lines.length * lineHeight)) / 2;
              
              ctx.fillStyle = '#FFFFFF';
              lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight) + (lineHeight / 2));
              });
              break;
            }
            case 1: {
              // Bottom Left Modern Stack
              const grad = ctx.createLinearGradient(0, canvas.height - (canvas.height * 0.5), 0, canvas.height);
              grad.addColorStop(0, 'rgba(0,0,0,0)');
              grad.addColorStop(1, 'rgba(0,0,0,0.9)');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              ctx.font = `800 ${baseFontSize * 1.1}px "${fontName}", sans-serif`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'bottom';
              
              const lines = getLines(ctx, text, maxWidth);
              const lineHeight = baseFontSize * 1.35;
              const startY = canvas.height - padding - (lines.length * lineHeight);
              
              ctx.fillStyle = primaryColor;
              ctx.fillRect(padding - 20, startY, 12, lines.length * lineHeight);
              
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 15;
              lines.forEach((line, index) => {
                ctx.fillText(line, padding, startY + (index * lineHeight) + lineHeight);
              });
              break;
            }
            case 2: {
              // Center Editorial Glass Box
              ctx.font = `bold ${baseFontSize * 1.05}px "${fontName}", sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const lines = getLines(ctx, text, maxWidth * 0.8);
              const lineHeight = baseFontSize * 1.4;
              const textHeight = lines.length * lineHeight;
              const boxHeight = textHeight + (baseFontSize * 2.5);
              
              let maxLineWidth = 0;
              lines.forEach(l => {
                  const w = ctx.measureText(l).width;
                  if (w > maxLineWidth) maxLineWidth = w;
              });
              const boxWidth = maxLineWidth + (baseFontSize * 3);
              const startTop = (canvas.height - boxHeight) / 2;
              
              ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
              ctx.shadowColor = 'rgba(0,0,0,0.4)';
              ctx.shadowBlur = 50;
              ctx.fillRect((canvas.width - boxWidth)/2, startTop, boxWidth, boxHeight);
              
              ctx.shadowColor = 'transparent';
              ctx.strokeStyle = primaryColor;
              ctx.lineWidth = 6;
              ctx.strokeRect((canvas.width - boxWidth)/2 + 20, startTop + 20, boxWidth - 40, boxHeight - 40);
              
              ctx.fillStyle = '#FFFFFF';
              const textStartY = (canvas.height - textHeight) / 2;
              lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, textStartY + (index * lineHeight) + (lineHeight / 2));
              });
              break;
            }
            case 3: {
              // Top Left Minimalist
              const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
              grad.addColorStop(0, 'rgba(0,0,0,0.85)');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              ctx.font = `italic 800 ${baseFontSize * 1.2}px "${fontName}", sans-serif`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
              ctx.shadowBlur = 20;
              
              const lines = getLines(ctx, text, maxWidth);
              const lineHeight = baseFontSize * 1.45;
              
              ctx.fillStyle = '#FFFFFF';
              lines.forEach((line, index) => {
                ctx.fillText(line, padding, padding + (index * lineHeight));
              });
              
              ctx.shadowColor = 'transparent';
              ctx.fillStyle = primaryColor;
              ctx.fillRect(padding, padding + (lines.length * lineHeight) + 24, 150, 10);
              break;
            }
          }
          
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = () => resolve(creativeUrl);
        img.src = creativeUrl;
      });
    };

    // Helper to analyze the creative and find the best layout
    const analyzeCreativeLayout = async (base64Str: string, text: string): Promise<LayoutConfig> => {
       try {
           const prompt = `You are a world-class graphic designer layout engine.
Analyze this background image and the text: "${text}".
Find the best placement for the text and a small logo so they DO NOT cover the main subjects (e.g. faces, products) and are legible.

CRITICAL RULES:
1. Ensure textPosition and logoPosition DO NOT overlap. (e.g. If text is "top", do not put logo "top-left" or "top-right" unless necessary).
2. Choose a text alignment ("left", "center", "right") that balances the composition.

Output JSON exactly:
{"textPosition": "top" | "middle" | "bottom", "textAlign": "left" | "center" | "right", "logoPosition": "top-left" | "top-right" | "bottom-left" | "bottom-right"}`;
           const base64Data = base64Str.startsWith('data:') ? base64Str.split(',')[1] : base64Str;
           const mimeType = base64Str.startsWith('data:') ? base64Str.split(';')[0].split(':')[1] : 'image/jpeg';
           
           const response = await generateContentProxy("gemini-2.5-flash", [
               prompt,
               { inlineData: { data: base64Data, mimeType } }
           ], {
               responseMimeType: "application/json",
               responseSchema: {
                   type: Type.OBJECT,
                   properties: {
                       textPosition: { type: Type.STRING, enum: ["top", "middle", "bottom"] },
                       textAlign: { type: Type.STRING, enum: ["left", "center", "right"] },
                       logoPosition: { type: Type.STRING, enum: ["top-left", "top-right", "bottom-left", "bottom-right"] }
                   },
                   required: ["textPosition", "textAlign", "logoPosition"]
               }
           });
           
           if (response && response.text) {
               try {
                   const parsed = JSON.parse(response.text);
                   return parsed as LayoutConfig;
               } catch (e) {
                   console.error("Failed to parse layout JSON", e);
               }
           }
       } catch(e) {
           console.error("Layout analysis failed", e);
       }
       return { textPosition: "bottom", textAlign: "left", logoPosition: "bottom-right" };
    };

    const processCustomCreative = async (overlayText: string, targetObj: any, label: string) => {
      try {
        loggerService.addLog("image", "info", `[Custom Backdrop Overlay: ${label}] Processing template layers...`, `Message: "${overlayText}"`);
        // Pick creative sequentially from shuffled array to avoid repeats
        const creative = creatives[creativeIndex % creatives.length];
        creativeIndex++;
        
        let base64Creative = creative.url;
        let useFallback = false;
        try {
          if (base64Creative.startsWith('http')) {
            loggerService.addLog("image", "info", `[Custom Backdrop Overlay: ${label}] Converting remote URL to local base64 proxy...`, base64Creative);
            base64Creative = await fetchImageAsBase64(base64Creative);
          }
        } catch (e: any) {
             console.warn("Failed to convert creative to base64, falling back to original URL", e);
             loggerService.addLog("image", "warn", `[Custom Backdrop Overlay: ${label}] URL conversion failed, using fallback mode.`, String(e));
             useFallback = true;
        }

        if (useFallback) {
             targetObj.imageUrl = creative.url;
             return;
        }

        // Use a highly robust, pre-defined HTML overlay to avoid LLM hallucination and ensure perfect text rendering
        const customHtml = `
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 100%); color: white; font-family: system-ui, sans-serif;">
            <h1 style="font-size: 64px; font-weight: 800; line-height: 1.25; margin: 0; text-shadow: 0 4px 12px rgba(0,0,0,0.6); max-width: 900px; padding-bottom: 24px;">${overlayText || ""}</h1>
          </div>
        `;

        loggerService.addLog("overlay", "info", `[Offset Layer Analysis: ${label}] Initiating negative-space layout scanning via multimodal Flash...`);
        const layoutConfig = await analyzeCreativeLayout(base64Creative, overlayText);
        loggerService.addLog("overlay", "info", `[Offset Layer Analysis: ${label}] Grid layout parsed: Position is ${layoutConfig.textPosition}, Align is ${layoutConfig.textAlign}`);
        
        loggerService.addLog("overlay", "info", `[Puppeteer Overlay: ${label}] Loading page simulation and baking text overlay...`);
        let finalImage = await flattenVisualData(base64Creative, customHtml, cachedLogoBase64, layoutConfig);
        
        // Use 0.95 quality for custom creatives to preserve crispness
        loggerService.addLog("image", "info", `[Optimizer: ${label}] Custom backdrop composition flattened. Compressing layer bits (0.95 web-safe)...`);
        finalImage = await compressImage(finalImage, 0.95);
        targetObj.imageUrl = finalImage;
        targetObj.visualType = 'custom-overlay';
        targetObj.visualData = {
            baseImage: base64Creative,
            customHtml: customHtml,
            layout: layoutConfig
        };
        loggerService.addLog("image", "success", `[Custom Backdrop Overlay: ${label}] Visual generation successfully flattened and compressed!`);
      } catch (e: any) {
        loggerService.addLog("image", "error", `[Custom Backdrop Overlay: ${label}] Processing failed:`, String(e));
        logSilentError(`Failed to process custom creative for ${label}`, { error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined, context: "processCustomCreative" });
        // Fallback to the original URL if generation fails entirely
        if (!targetObj.imageUrl && creatives.length > 0) {
            targetObj.imageUrl = creatives[(creativeIndex - 1) % creatives.length].url;
        }
      }
    };

    // Helper to generate image
    const generateImage = async (prompt: string, targetObj: any, label: string) => {
      try {
        loggerService.addLog("image", "info", `[AI Backdrop Generation: ${label}] Submitting graphic description prompt to Imagen AI...`, prompt);
        const imgRes = await generateContentProxy(
          'gemini-3.1-flash-image-preview',
          prompt,
          {
            imageConfig: {
              imageSize: "1K",
              aspectRatio: aspectRatio || "1:1"
            }
          }
        );
        
        // Log image generation usage (1 image)
        await logTokenUsage(userId, "generateImage", "gemini-3.1-flash-image-preview", {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1 // Representing 1 image generated
        });

        const parts = imgRes.candidates?.[0]?.content?.parts || [];
        loggerService.addLog("image", "info", `[AI Backdrop Generation: ${label}] Imagen AI returned candidates segment. Parsing image parts...`);
        
        for (const part of parts) {
          if (part.inlineData) {
            let finalImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            loggerService.addLog("image", "success", `[AI Backdrop Generation: ${label}] Base image generated successfully (${part.inlineData.mimeType || 'image/png'}).`);
            
            if (targetObj.visualType && targetObj.visualType !== 'none') {
              const baseImg = finalImage;
              let layoutConfig: any = undefined;
              
              if (targetObj.visualType === 'custom-overlay' && targetObj.visualData?.customHtml) {
                const htmlText = targetObj.visualData.customHtml.replace(/<[^>]*>?/gm, '');
                loggerService.addLog("overlay", "info", `[Overlay Layout Scan: ${label}] Scanning negative space of generated image via multimodal Gemini...`);
                layoutConfig = await analyzeCreativeLayout(finalImage, htmlText);
                loggerService.addLog("overlay", "info", `[Overlay Layout Scan: ${label}] Layout mapped. Muted space at: ${layoutConfig.textPosition}, align: ${layoutConfig.textAlign}`);
                targetObj.visualData = {
                  ...targetObj.visualData,
                  layout: layoutConfig
                };
              }

              loggerService.addLog("overlay", "info", `[Puppeteer Render: ${label}] Launching headless Puppeteer instance for HTML overlay flattening...`, `Type: ${targetObj.visualType}`);
              finalImage = await renderVisualToJpegOffscreen(
                targetObj.visualType,
                targetObj.visualData,
                baseImg,
                dna,
                dna?.name || "Brand",
                cachedLogoBase64 || null
              );

              targetObj.visualData = {
                 ...targetObj.visualData,
                 baseImage: baseImg
              };
            } else if (cachedLogoBase64) {
              loggerService.addLog("overlay", "info", `[Logo overlay: ${label}] Applying brand logo onto the center bottom of graphic card...`);
              finalImage = await overlayLogo(finalImage, cachedLogoBase64);
            }
            
            // Compress the final image to JPEG to drastically reduce file size (from ~3MB to ~400KB)
            loggerService.addLog("image", "info", `[Optimizer: ${label}] Visual completed. Running custom JPEG compression pass to optimize storage and loading speed...`);
            finalImage = await compressImage(finalImage, 0.85);
            
            targetObj.imageUrl = finalImage;
            loggerService.addLog("image", "success", `[AI Backdrop Generation: ${label}] Finished flattening & post-processing.`);
            break;
          }
        }
        
        // If image generation failed to produce candidates
        if (!targetObj.imageUrl) {
          loggerService.addLog("image", "error", `[AI Backdrop Generation: ${label}] No valid inline image chunks received from Gemini Imagen payload.`);
          throw new Error("No candidates returned from image generation.");
        }
      } catch (e: any) {
        loggerService.addLog("image", "error", `[AI Backdrop Generation: ${label}] Error encountered:`, String(e));
        logSilentError(`Failed to generate image for ${label}`, { error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined, context: "generateCampaignImages" });
        // Fallback placeholder image so rendering doesn't crash to a black screen
        targetObj.imageUrl = "https://placehold.co/1080x1080/000000/FFFFFF.png?text=Image+Generation+Timeout";
        
        // Process through VisualEngine just in case it is custom-overlay
        if (targetObj.visualType && targetObj.visualType !== 'none') {
           try {
              loggerService.addLog("overlay", "warn", `[AI Backdrop Generation: ${label}] Rendering fallback layout on empty background canvas...`);
              let finalImage = await renderVisualToJpegOffscreen(
                targetObj.visualType,
                targetObj.visualData,
                targetObj.imageUrl,
                dna,
                dna?.name || "Brand",
                cachedLogoBase64 || null
              );
              targetObj.imageUrl = finalImage;
              loggerService.addLog("overlay", "success", `[AI Backdrop Generation: ${label}] Fallback card canvas rendered successfully.`);
           } catch(renderingErr: any) {
              loggerService.addLog("overlay", "error", `[AI Backdrop Generation: ${label}] Rendering fallback layout failed:`, String(renderingErr));
              console.warn("Failed rendering fallback image");
           }
        }
      }
    };

    // Generate images for top-level platform versions (if they still have imagePrompt)
    campaign.platformVersions.forEach((pv: any) => {
      if (generateImages && pv.imagePrompt) {
        imageTasks.push(() => generateImage(pv.imagePrompt, pv, pv.platform));
      } else if (useCreatives && pv.overlayText) {
        imageTasks.push(() => processCustomCreative(pv.overlayText, pv, pv.platform));
      }
    });

        // Generate images for daily posts
    if (campaign.dailyPosts) {
      campaign.dailyPosts.forEach((dp: any) => {
        // Enforce a visualType if generateImages is true
        if (generateImages && !dp.visualType) {
           dp.visualType = "custom-overlay";
        }
        const lowerVisType = dp.visualType ? String(dp.visualType).toLowerCase() : "";
        if (generateImages && ['creative-story', 'abstract-announcement', 'custom-overlay'].includes(lowerVisType)) {
          imageTasks.push(async () => {
            // Use cinematicPrompt
            const cinematicPrompt = dp.visualData?.cinematicPrompt || dp.imagePrompt || `Cinematic editorial photography representing ${focus}, high quality, vast negative space`;
            await generateImage(cinematicPrompt, dp, `daily post ${dp.day}`);
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => { pv.imageUrl = dp.imageUrl; });
            }
          });
        } else if (useCreatives && dp.overlayText) {
          imageTasks.push(async () => {
            await processCustomCreative(dp.overlayText, dp, `daily post ${dp.day}`);
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => { pv.imageUrl = dp.imageUrl; });
            }
          });
        }
      });
    }

    // Renders should run concurrently (all visuals fire at once), Cloud Function handles concurrency limits.
    const totalTasks = imageTasks.length;
    let completedTasks = 0;
    
    if (onProgress && totalTasks > 0) {
      onProgress(3, 4, `Rendering 0 of ${totalTasks} visuals...`);
    }

    for (let i = 0; i < imageTasks.length; i++) {
        await imageTasks[i]();
        completedTasks++;
        if (onProgress) {
            onProgress(3, 4, `Rendering ${completedTasks} of ${totalTasks} visuals...`);
        }
        
      if (i < imageTasks.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  return campaign;
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
      const imgRes = await generateContentProxy(
        'gemini-3.1-flash-image-preview',
        imagePrompt,
        {
          imageConfig: {
            imageSize: "1K",
            aspectRatio: "1:1"
          }
        }
      );

      // Track usage (1 image generated)
      if (params.userId) {
        await logTokenUsage(params.userId, "generateOneDayStoryImage", "gemini-3.1-flash-image-preview", {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        }).catch(console.error);
      }

      const parts = imgRes.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          baseImageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          loggerService.addLog("image", "success", `Step 2 complete: High-res background image successfully generated.`);
          break;
        }
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
    const renderedImage = await renderVisualToJpegOffscreen(
      'custom-overlay',
      visualData,
      baseImageBase64,
      null,
      params.businessName,
      params.dnaUrl || null
    );

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

export async function generateGeneralFounderPost(params: {
  topic: string;
  referencePosts?: string;
  attachmentStyle: "text-only" | "image-only" | "image-overlay";
  customImagePrompt?: string;
  founderAgent: any;
  userId?: string;
}): Promise<{
  postCopy: string;
  imagePrompt?: string;
  headline?: string;
  subtext?: string;
  imageUrl?: string;
}> {
  const { topic, referencePosts, attachmentStyle, customImagePrompt, founderAgent, userId } = params;

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

Draft an organic, highly engaging, and completely non-branded social media post for LinkedIn or X.
Topic: "${topic}"
`;

  if (referencePosts?.trim()) {
    prompt += `\nReference posts for style, structure, or tone inspiration:\n"${referencePosts}"\n`;
  }

  prompt += `
CRITICAL rules:
1. Do NOT reference any specific products, company names, brands, or websites. This is a personal branding post for the founder's own profile.
2. Focus purely on general insights, lessons learned, personal stories, or earned secrets.
3. Sound exactly like the founder's profile (behavioral traits, style, values).
`;

  if (attachmentStyle === "image-overlay") {
    prompt += `
Since this post will have a custom graphic with text overlaid, you must also generate:
- A short, punchy headline (1-5 words) to overlay on the image (e.g. "Kill the Status Quo", "ARR is a Lie").
- A brief subtext (1-2 lines) to support the headline on the image.
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
  const finalImagePrompt = customImagePrompt || result.imagePrompt;
  if ((attachmentStyle === "image-only" || attachmentStyle === "image-overlay") && finalImagePrompt) {
    try {
      const imgRes = await generateContentProxy(
        'gemini-3.1-flash-image-preview',
        finalImagePrompt,
        {
          imageConfig: {
            imageSize: "1K",
            aspectRatio: "1:1"
          }
        }
      );
      
      if (userId) {
        await logTokenUsage(userId, "generateGeneralFounderPost_image", "gemini-3.1-flash-image-preview", {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        });
      }

      if (imgRes?.candidates?.[0]?.content?.parts) {
        for (const pt of imgRes.candidates[0].content.parts) {
          if (pt.inlineData) {
            imageUrl = `data:${pt.inlineData.mimeType || 'image/png'};base64,${pt.inlineData.data}`;
            break;
          }
        }
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
  userId?: string
): Promise<{ title: string; description: string; prompt: string }[]> {
  const prompt = `You are a world-class executive strategist and personal branding coach.
Analyze the following virtual Founder Doppelganger agent profile:
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

Generate 5 highly engaging, customized, and distinct social media post ideas/topics tailored for this founder to write on their personal LinkedIn/X profile.

CRITICAL rules:
1. Do NOT mention or refer to any specific products, brands, or company names. Keep the topics focused on general insights, industry observations, opinions, personal experiences, or core beliefs.
2. Ensure the suggestions alternate between the founder's key content pillars.
3. The topics should feel authentic, organic, and avoid generic clickbait.

Return a JSON array of objects. Each object must have:
- title: A short title representing the theme (e.g. "Lean Engineering Teams", "The Pre-Seed Trap").
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
}): Promise<{
  postCopy: string;
  imagePrompt?: string;
  headline?: string;
  subtext?: string;
  imageUrl?: string;
}> {
  const { topic, referencePosts, attachmentStyle, customImagePrompt, founderAgent, product, userId } = params;

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

Draft an organic, highly engaging social media post for LinkedIn or X.
This is a BRANDED post written from your perspective as the founder of "${product.name}". 
Topic or Concept to cover: "${topic}"

CRITICAL rules:
1. Speak as the creator/founder of "${product.name}". You are sharing an insight, story, status quo challenge, or lesson directly related to the problem "${product.name}" solves or the journey of building it.
2. Blend the product's positioning, audience, and narrative elements smoothly into a high-value personal post. Avoid simple sales pitches—the post must offer real value to the reader.
3. Sound exactly like the founder's profile (behavioral traits, style, values).
`;

  if (referencePosts?.trim()) {
    prompt += `\nReference posts for style, structure, or tone inspiration:\n"${referencePosts}"\n`;
  }

  if (attachmentStyle === "image-overlay") {
    prompt += `
Since this post will have a custom graphic with text overlaid, you must also generate:
- A short, punchy headline (1-5 words) to overlay on the image (e.g. "Kill the Status Quo", "ARR is a Lie").
- A brief subtext (1-2 lines) to support the headline on the image.
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
  
  let imageUrl = "";
  const finalImagePrompt = customImagePrompt || result.imagePrompt;
  if ((attachmentStyle === "image-only" || attachmentStyle === "image-overlay") && finalImagePrompt) {
    try {
      const imgRes = await generateContentProxy(
        'gemini-3.1-flash-image-preview',
        finalImagePrompt,
        {
          imageConfig: {
            imageSize: "1K",
            aspectRatio: "1:1"
          }
        }
      );
      
      if (userId) {
        await logTokenUsage(userId, "generateBrandedFounderPost_image", "gemini-3.1-flash-image-preview", {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        });
      }

      if (imgRes?.candidates?.[0]?.content?.parts) {
        for (const pt of imgRes.candidates[0].content.parts) {
          if (pt.inlineData) {
            imageUrl = `data:${pt.inlineData.mimeType || 'image/png'};base64,${pt.inlineData.data}`;
            break;
          }
        }
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

