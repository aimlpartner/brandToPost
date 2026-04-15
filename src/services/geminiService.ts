import { Type } from "@google/genai";
import { ProductDNA, WeeklyCampaign, Creative } from "../types";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { logSilentError } from "../lib/firestore-error";

async function generateContentProxy(model: string, contents: any, config?: any) {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ model, contents, config })
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

export async function researchProductDNA(website: string, currentDna?: Partial<ProductDNA>, document?: { data: string, mimeType: string } | null, userId?: string): Promise<Partial<ProductDNA>> {
  const hasWebsite = website && website.trim() !== "";
  const hasDescription = currentDna?.description && currentDna.description.trim() !== "";
  const hasDocument = !!document;
  
  let sourceContext = "";
  
  if (hasWebsite) {
    sourceContext += `Please use Google Search to research the following company website: ${website}\n`;
    
    // Attempt to scrape the website for better context, especially for typography
    try {
      const token = await auth.currentUser?.getIdToken();
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: website })
      });
      
      if (scrapeRes.ok) {
        const scrapeData = await scrapeRes.json();
        if (scrapeData.success) {
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
    } catch (e) {
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

  const prompt = `
    You are an expert B2B SaaS marketer and researcher.
    
    ${sourceContext}
    ${hasWebsite ? 'CRITICAL: You must actively browse the web to fetch the absolute latest data, recent news, and real-time updates about this company to ensure your research is fresh.\nCRITICAL FOR VISUAL DATA: To get the exact fonts, you MUST inspect the website\'s CSS or source code for "font-family" declarations. Do not guess the fonts. Look for the actual primary (headings) and secondary (body) fonts used.' : ''}
    
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
    - visualStyle: The brand's visual identity, mood board, and aesthetic (e.g., "Minimalist, high-contrast, tech-focused with neon green accents").
    - visualData: A structured object containing specific visual details:
      - colors: An array of 3-5 hex color codes representing the brand's palette.
      - fonts: An object with 'primary' and 'secondary' font names.
      - typographyHierarchy: A brief description of how typography is used (e.g., "Bold sans-serif headers with readable serif body text").
      - imageStyle: A description of the photography or illustration style (e.g., "Flat vector illustrations with vibrant colors").
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
        required: ["positioning", "audience", "tone", "stage", "visualStyle", "visualData"]
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
    return JSON.parse(text);
  } catch (e) {
    logSilentError("Failed to parse JSON response", { context: "researchProductDNA", text });
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
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

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    prompt,
    {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  );

  if (response.usageMetadata) {
    await logTokenUsage(userId, "researchFocus", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const text = response.text;
  if (!text) {
    throw new Error("Failed to research focus");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    logSilentError("Failed to parse JSON response", { context: "researchFocus", text });
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    throw new Error("Failed to parse JSON response");
  }
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
        required: ["day", "contentType", "platformVersions"]
      }
    },
    repurposingNotes: { type: Type.STRING, description: "How to reuse this week's assets next week" },
    confidenceScore: { type: Type.NUMBER, description: "AI-estimated relevance (0-100)" },
    pillar: { type: Type.STRING, description: "The primary content pillar used" },
    researchSummary: { type: Type.STRING, description: "Summary of live research findings about the company and audience" }
  },
  required: ["theme", "targetAudience", "coreMessage", "hook", "cta", "contentFormat", "dailyPosts", "repurposingNotes", "confidenceScore", "pillar", "researchSummary"]
};

export async function generateCampaign(dna: ProductDNA, focus: string, insights: string[], generateImages: boolean = false, feedback?: string, previousDraft?: Omit<WeeklyCampaign, 'id' | 'createdAt'>, channels: string[] = ['LinkedIn', 'X', 'Instagram', 'Facebook', 'Reddit'], campaignTheme?: string, subCategory?: string, userId?: string): Promise<Omit<WeeklyCampaign, 'id' | 'createdAt'>> {
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
    ${generateImages ? `- For EACH DAY (not for each platform), provide a single 'imagePrompt' at the daily post level. CRITICAL: You must design a "Text-Overlay Engagement Graphic" using this exact 3-layer approach:
      Layer 1 (Background): A high-quality, thematic background relevant to the post, OR a clean gradient/solid color directly matching the Brand Position Visual Style/Mood Board: "${dna.visualStyle || 'Standard professional'}" ${dna.visualData ? `and utilizing these specific brand colors: ${dna.visualData.colors.join(', ')}` : ''}. The background MUST be explicitly described as darkened, color-tinted, or slightly blurred to ensure white text is perfectly legible.
      Layer 2 (Typography): A short, punchy hook or discussion prompt (max 10 words) from the post. Describe it as bold, high-contrast white text ${dna.visualData ? `using the brand's primary font style (${dna.visualData.fonts.primary})` : 'sans-serif'}, centered on the screen, using strong font hierarchy (e.g., one key word fully capitalized to draw the eye). Explicitly state the exact text to be rendered in quotes.
      Layer 3 (Branding): Do NOT include a logo in the prompt (we will overlay it programmatically). Just ensure the bottom center of the image has clean space.` : ""}
    ${useCreatives ? `- For EACH DAY, provide an 'overlayText' field (max 10 words). This will be overlaid onto the brand's custom creatives. It should be a short, punchy hook or discussion prompt from the post.` : ""}
    - Repurposing notes (how to reuse this week's assets next week).
    - A confidence score (0-100) based on relevance.
    - The primary content pillar used (e.g., "Problem-spotting & empathy").
    - A research summary (1-2 paragraphs summarizing what you found about the company and audience trends).
  `;

  const response = await generateContentProxy(
    "gemini-3.1-pro-preview",
    prompt,
    {
      responseMimeType: "application/json",
      responseSchema: campaignSchema
    }
  );

  if (response.usageMetadata) {
    await logTokenUsage(userId, "generateCampaign", "gemini-3.1-pro-preview", response.usageMetadata);
  }

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate campaign");
  }

  let campaign;
  try {
    campaign = JSON.parse(text);
  } catch (e) {
    logSilentError("Failed to parse JSON response", { context: "generateCampaign", text });
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      campaign = JSON.parse(match[1]);
    } else {
      throw new Error("Failed to parse JSON response");
    }
  }

  // Ensure platformVersions exists for backward compatibility if not generated
  if (!campaign.platformVersions && campaign.dailyPosts && campaign.dailyPosts.length > 0) {
    campaign.platformVersions = campaign.dailyPosts[0].platformVersions;
  } else if (!campaign.platformVersions) {
    campaign.platformVersions = [];
  }

  // Phase 2: Format the copy using a cheaper model (gemini-2.5-flash)
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
    const imageTasks: (() => Promise<void>)[] = [];
    
    // Helper to compress image to JPEG
    const compressImage = async (base64Str: string, quality = 0.85): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
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
        img.src = base64Str;
      });
    };

    // Pre-fetch logo to avoid network/CORS failures during parallel processing
    let cachedLogoBase64: string | null = null;
    if (dna.logoUrl) {
      try {
        cachedLogoBase64 = await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
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
    const overlayLogo = async (base64Image: string, logoBase64: string): Promise<string> => {
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
            // Calculate logo size (e.g., 12% of image width for a subtle look)
            const logoWidth = canvas.width * 0.12;
            const logoHeight = (logo.height / logo.width) * logoWidth;
            
            // Position: bottom center with padding
            const padding = canvas.width * 0.05;
            const x = (canvas.width - logoWidth) / 2;
            const y = canvas.height - logoHeight - padding;
            
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
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(creativeUrl);
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Draw darkening overlay for text readability
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw text
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Calculate font size based on image width
          const fontSize = Math.max(32, Math.floor(canvas.width * 0.06));
          ctx.font = `bold ${fontSize}px "${dna.visualData?.fonts?.primary || 'Inter'}", sans-serif`;
          
          // Word wrap logic and UPPERCASE
          const upperText = text.toUpperCase();
          const words = upperText.split(' ');
          let line = '';
          const lines = [];
          const maxWidth = canvas.width * 0.8;
          
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          
          // Draw lines
          const lineHeight = fontSize * 1.2;
          const startY = (canvas.height - (lines.length * lineHeight)) / 2;
          
          lines.forEach((line, index) => {
            ctx.fillText(line.trim(), canvas.width / 2, startY + (index * lineHeight) + (lineHeight / 2));
          });
          
          // Output at max quality
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        };
        img.onerror = () => resolve(creativeUrl);
        // Add proxy to bypass CORS if needed, or assume the URL allows CORS
        img.src = creativeUrl;
      });
    };

    const processCustomCreative = async (overlayText: string, targetObj: any, label: string) => {
      try {
        // Pick creative sequentially from shuffled array to avoid repeats
        const creative = creatives[creativeIndex % creatives.length];
        creativeIndex++;
        
        let finalImage = creative.url;
        
        // Convert to base64 by drawing to canvas first (to avoid CORS issues later if possible, but we need CORS to draw it anyway)
        // We do this inside overlayTextOnCreative
        finalImage = await overlayTextOnCreative(creative.url, overlayText);
        
        if (cachedLogoBase64) {
          finalImage = await overlayLogo(finalImage, cachedLogoBase64);
        }
        
        // Use 1.0 quality for custom creatives to preserve crispness
        finalImage = await compressImage(finalImage, 1.0);
        targetObj.imageUrl = finalImage;
      } catch (e) {
        logSilentError(`Failed to process custom creative for ${label}`, { error: e, context: "processCustomCreative" });
      }
    };

    // Helper to generate image
    const generateImage = async (prompt: string, targetObj: any, label: string) => {
      try {
        const imgRes = await generateContentProxy(
          'gemini-3.1-flash-image-preview',
          prompt,
          {
            imageConfig: {
              imageSize: "1K"
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
        for (const part of parts) {
          if (part.inlineData) {
            let finalImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            if (cachedLogoBase64) {
              finalImage = await overlayLogo(finalImage, cachedLogoBase64);
            }
            // Compress the final image to JPEG to drastically reduce file size (from ~3MB to ~400KB)
            // This prevents Firestore "Write stream exhausted" errors while maintaining high visual quality
            finalImage = await compressImage(finalImage, 0.85);
            
            targetObj.imageUrl = finalImage;
            break;
          }
        }
      } catch (e) {
        logSilentError(`Failed to generate image for ${label}`, { error: e, context: "generateCampaignImages" });
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
        if (generateImages && dp.imagePrompt) {
          imageTasks.push(async () => {
            await generateImage(dp.imagePrompt, dp, `daily post ${dp.day}`);
            // Assign the same image to all platform versions for this day
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => {
                pv.imageUrl = dp.imageUrl;
              });
            }
          });
        } else if (useCreatives && dp.overlayText) {
          imageTasks.push(async () => {
            await processCustomCreative(dp.overlayText, dp, `daily post ${dp.day}`);
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => {
                pv.imageUrl = dp.imageUrl;
              });
            }
          });
        }
      });
    }

    // Process in batches of 2 to avoid 429 Resource Exhausted
    const batchSize = 2;
    for (let i = 0; i < imageTasks.length; i += batchSize) {
      const batch = imageTasks.slice(i, i + batchSize);
      await Promise.all(batch.map(task => task()));
      if (i + batchSize < imageTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }
  }

  return campaign;
}
