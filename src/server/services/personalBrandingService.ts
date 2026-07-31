import { GoogleGenAI, Type } from '@google/genai';
import { PersonalBrandItem } from '../../types';

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

Task: Write a high-converting, highly engaging LinkedIn post.
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

Return a JSON object with:
- headline: A compelling 5-10 word title/summary for the post
- postText: The complete, formatted LinkedIn post text (with line breaks \\n, bullet points if needed, and the target URL if branded)
- hashtags: An array of 3-5 relevant LinkedIn hashtags (without # prefix in array, e.g. ["Leadership", "Startups", "Growth"])
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
          postText: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          featuredUrl: { type: Type.STRING },
        },
        required: ['headline', 'postText', 'hashtags'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');

  return {
    headline: parsed.headline || 'Leadership & Strategy',
    postText: parsed.postText || 'Excited to share my latest thoughts on industry evolution and building value for customers.',
    hashtags: parsed.hashtags || ['Leadership', 'Business', 'Growth'],
    featuredUrl: parsed.featuredUrl || (postKind === 'branded' ? targetUrl : undefined),
  };
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
