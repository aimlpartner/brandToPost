import { GoogleGenAI, Type } from '@google/genai';
import { admin, db } from '../config/firebase';
import { getMonday, formatDate } from '../utils/dateUtils';
import { saveImageLocalAndDb, generateFallbackBrandedCanvas } from '../utils/imageUtils';
import {
  logBackendTokenUsage,
  addToQueue,
  setToken,
  getToken,
  getScheduleConfig,
  getBlogSettings,
  lastKnownHost,
} from '../utils/firestoreStorage';
import { generateSingleCampaignImageBackend } from './aiService';
import { publishPostToLinkedIn, publishToInstagramGraphAPI } from './socialService';
import { publishBlogToWordPress, publishBlogToWebhook, publishBlogToExternalSite } from './blogService';
import { sendBrandedEmail, createAndSendApprovalRequest } from './emailService';
import { LAYOUT_BLUEPRINTS, selectLayout } from '../../lib/layoutBlueprints';

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

const dailyPostCampaignSchema = {
  type: Type.OBJECT,
  properties: {
    theme: { type: Type.STRING, description: "3-5 word headline for the post theme" },
    targetAudience: { type: Type.STRING, description: "Specific segment targeted" },
    coreMessage: { type: Type.STRING, description: "Core value proposition or message of this post" },
    hook: { type: Type.STRING, description: "Engagement hook mirroring pain-point language" },
    cta: { type: Type.STRING, description: "Call to Action (e.g. Visit site, Book demo, etc.)" },
    contentFormat: { type: Type.STRING, description: "Post format (e.g. Text post, image overlay)" },
    dailyPosts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "Day of the week (e.g., Monday, Tuesday, etc.)" },
          contentType: { type: Type.STRING, description: "Type of content (e.g., Hook, Use Case, Real Story, Founder Voice)" },
          imagePrompt: { type: Type.STRING, description: "Prompt for AI image generation background" },
          overlayText: { type: Type.STRING, description: "Short punchy text to overlay on the creative" },
          visualType: { type: Type.STRING, description: "MUST ALWAYS BE: 'custom-overlay'", enum: ["custom-overlay"] },
          visualData: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Short, punchy primary text" },
              cinematicPrompt: { type: Type.STRING, description: "Artistic image prompt for the background image" },
              customHtml: { type: Type.STRING, description: "HTML layout using inline styles (1080x1080px canvas) with flexbox." }
            },
            required: ["cinematicPrompt", "customHtml"]
          },
          platformVersions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platform: { type: Type.STRING, description: "LinkedIn, X, Instagram, Facebook, or Reddit" },
                copy: { type: Type.STRING, description: "Tailored post copy" },
                format: { type: Type.STRING, description: "Post format details" }
              },
              required: ["platform", "copy", "format"]
            }
          }
        },
        required: ["day", "contentType", "platformVersions", "visualType", "visualData"]
      }
    },
    repurposingNotes: { type: Type.STRING, description: "Notes on how to reuse this" },
    confidenceScore: { type: Type.NUMBER, description: "Estimated relevance (0-100)" },
    pillar: { type: Type.STRING, description: "Primary content pillar used" },
    researchSummary: { type: Type.STRING, description: "Summary of research insights" }
  },
  required: ["theme", "targetAudience", "coreMessage", "hook", "cta", "contentFormat", "dailyPosts", "repurposingNotes", "confidenceScore", "pillar", "researchSummary"]
};


export async function executeAutoCampaignGeneration(productId: string) {
  if (!db) throw new Error("Database connection is not active.");

  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) throw new Error("Product not found");
  const product = productDoc.data()!;

  const userDoc = await db.collection('users').doc(product.userId || 'anonymous').get();
  if (!userDoc.exists) throw new Error("User profile not found. Please set up the Master Founder Agent.");
  const userData = userDoc.data()!;
  const founderAgent = userData.founderAgentSynthesized;
  if (!founderAgent) {
    throw new Error("Founder Agent doppelganger has not been synthesized globally yet.");
  }
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // 1. Get campaign inputs from Founder Agent
  console.log(`[executeAutoCampaignGeneration] Querying Founder Agent Doppelganger "${founderAgent.personaName}" for campaign direction...`);
  const founderPrompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Company Position & Product DNA:
- Product Name: ${product.name}
- Positioning: ${product.positioning}
- Target Audience: ${product.audience}
- Tone of Voice: ${product.tone}

Based on your profile, values, behavioral traits, and positioning, identify a highly specific, compelling marketing campaign focus (broad industry or micro-focus area), a sub-category/niche, and a campaign theme (hook angle) for this week.
Return the result in a JSON object with the following fields:
- focusInput: A punchy focus area (e.g. "early stage B2B SaaS", "manual spreadsheet fatigue")
- subCategory: A specific sub-category or niche (e.g. "productivity tools", "accounting automation")
- campaignTheme: An engaging hook or campaign theme/angle (e.g. "The hidden cost of manual data entry")
`;

  const founderResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: founderPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focusInput: { type: Type.STRING },
          subCategory: { type: Type.STRING },
          campaignTheme: { type: Type.STRING }
        },
        required: ["focusInput", "subCategory", "campaignTheme"]
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "weekly_campaign_founder_focus", "gemini-3.1-pro-preview", founderResponse.usageMetadata);

  const founderInputs = JSON.parse(founderResponse.text || "{}");
  if (!founderInputs.focusInput) throw new Error("Founder Agent failed to generate campaign focus.");

  // 2. Research focus area
  console.log(`[executeAutoCampaignGeneration] Researching focus area: ${founderInputs.focusInput}...`);
  const researchPrompt = `
    You are an expert market researcher.
    
    Research the following industry or focus area: "${founderInputs.focusInput}"
    Specifically focus on this sub-category or niche: "${founderInputs.subCategory}"
    
    Generate 4-6 highly engaging key insights about this focus area, including:
    - Current trends and emerging topics
    - Audience pain points and desires
    - Competitor landscape or market gaps
    - Specific, recent case studies or success stories with data points
    
    Return a JSON array of strings, where each string is a detailed key insight.
  `;

  const researchResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: researchPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "weekly_campaign_research", "gemini-3.1-pro-preview", researchResponse.usageMetadata);

  const insights = JSON.parse(researchResponse.text || "[]");

  // 3. Generate campaign
  console.log(`[executeAutoCampaignGeneration] Drafting full weekly campaign for "${founderInputs.campaignTheme}"...`);
  const campaignPrompt = `
    You are an expert B2B SaaS marketer.
    
    Generate a weekly social media campaign based on the provided Brand Position, the Key Insights, and the specific focus area.
    
    Campaign Focus Area: ${founderInputs.focusInput}
    Industry Sub-Category/Niche: ${founderInputs.subCategory}
    Campaign Theme: ${founderInputs.campaignTheme}
    
    Key Insights about this Focus:
    ${insights.map((i: string) => `- ${i}`).join('\n')}
    
    Brand Position:
    Website: ${product.website}
    Positioning: ${product.positioning}
    Audience: ${product.audience}
    Tone: ${product.tone}
    Stage: ${product.stage}
    Visual Style: ${product.visualStyle || 'Standard professional'}
    ${product.visualData ? `
    Visual DNA:
    - Colors: ${product.visualData.colors.join(', ')}
    - Fonts: Primary (${product.visualData.fonts.primary}), Secondary (${product.visualData.fonts.secondary})
    - Typography Hierarchy: ${product.visualData.typographyHierarchy}
    - Image Style: ${product.visualData.imageStyle}
    ` : ''}
    
    Advanced DNA (Psychology, Narrative, & Strategy):
    ${product.enemy ? `- The Enemy / Status Quo: ${product.enemy}` : ''}
    ${product.earnedSecret ? `- The Earned Secret: ${product.earnedSecret}` : ''}
    ${product.originStory ? `- Origin Story: ${product.originStory}` : ''}
    ${product.hellState ? `- 'Hell' State (Before): ${product.hellState}` : ''}
    ${product.heavenState ? `- 'Heaven' State (After): ${product.heavenState}` : ''}
    ${product.objections ? `- Top Buying Objections: ${product.objections}` : ''}
    ${product.uniqueMechanism ? `- Unique Mechanism: ${product.uniqueMechanism}` : ''}
    ${product.proofPoints ? `- Proof Points: ${product.proofPoints}` : ''}
    ${product.vocabularyAlways ? `- Vocabulary to ALWAYS use: ${product.vocabularyAlways}` : ''}
    ${product.vocabularyNever ? `- Vocabulary to NEVER use: ${product.vocabularyNever}` : ''}
    ${product.contentPillars && product.contentPillars.length > 0 ? `- Content Pillars: ${product.contentPillars.join(' | ')}` : ''}
    ${product.targetIcps && product.targetIcps.length > 0 ? `- Target ICPs & Pain Points:\n      ${product.targetIcps.map((icp: any) => `${icp.name} (Pains: ${icp.painPoints.join(', ')})`).join('\n      ')}` : ''}

    The campaign must include:
    - A specific theme for the week.
    - The target audience segment.
    - A core message (one sentence value proposition).
    - A hook (1-2 lines mirroring pain-point language).
    - A clear Call to Action (CTA).
    - The overall content format.
    - Daily Post Sequencing: Vary content types daily to maintain engagement. Provide a post sequence for each day (Monday to Sunday).
    - For each daily post, provide platform-specific versions for the following channels: LinkedIn, X, Instagram, Facebook, Reddit. Each must have copy and format.
    - Repurposing notes (how to reuse this week's assets next week).
    - A confidence score (0-100) based on relevance.
    - The primary content pillar used.
    - A research summary (1-2 paragraphs summarizing what you found about the company and audience trends).
  `;

  const campaignResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: campaignPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: campaignSchema
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "weekly_campaign_draft", "gemini-3.1-pro-preview", campaignResponse.usageMetadata);

  const campaignData = JSON.parse(campaignResponse.text || "{}");

  // 4. Assemble campaign dates & save to Firestore
  const campaignId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const dayOffsets: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const nextMonday = getMonday(new Date(), 1);
  const selectedStartDate = formatDate(nextMonday);

  const brandLogoUrl = product.logoUrl || product.logoDarkUrl || product.logoLightUrl || undefined;
  const brandColors = product.visualData?.colors || ['#08080C', '#FAF9F6', '#3B82F6'];
  const fontStyle = product.visualData?.fonts?.primary || 'Inter Tight, bold modern sans-serif';

  // Check if user required using Brand Assets for automated campaigns
  const brandAssetUrls: string[] = [];
  if (product.useBrandAssets === true) {
    const creativesSnap = await db.collection('creatives')
      .where('productId', '==', productId)
      .get();
    if (!creativesSnap.empty) {
      creativesSnap.forEach(docSnap => {
        const cData = docSnap.data();
        if (cData.url) brandAssetUrls.push(cData.url);
      });
    }
    if (brandAssetUrls.length === 0) {
      console.warn('[executeAutoCampaignGeneration] Brand assets requested but 0 uploaded creatives found. Falling back to AI image generation.');
    }
  }

  if (campaignData.dailyPosts && Array.isArray(campaignData.dailyPosts)) {
    for (let i = 0; i < campaignData.dailyPosts.length; i++) {
      const dp = campaignData.dailyPosts[i];
      const offset = dayOffsets[dp.day] || 0;
      const postDate = new Date(selectedStartDate + "T12:00:00Z");
      postDate.setDate(postDate.getDate() + offset);
      dp.date = formatDate(postDate);

      // Generate visual using OpenAI GPT Image 2 Medium + Logo stamping (or Brand Asset Editing)
      const chosenAsset = brandAssetUrls.length > 0 ? brandAssetUrls[i % brandAssetUrls.length] : undefined;
      const headline = dp.visualData?.headline || dp.contentType || `${product.name} — ${dp.day}`;
      const subtext = dp.visualData?.subtext || product.tagline || product.description || 'Automated B2B Growth Engine';
      const promptText = dp.visualData?.cinematicPrompt || dp.imagePrompt || `High-end executive photographic visual for ${product.name}, topic: ${headline}, 1:1 ratio, clean aesthetic`;

      console.log(`[executeAutoCampaignGeneration] Generating AI visual for day ${dp.day} (${i + 1}/${campaignData.dailyPosts.length})...`);
      const generatedImageUrl = await generateSingleCampaignImageBackend({
        prompt: promptText,
        headline,
        subtext,
        brandColors,
        fontStyle,
        brandAssetUrl: chosenAsset,
        logoPosition: dp.visualData?.logoPosition || 'top-left'
      }, brandLogoUrl);

      dp.imageUrl = generatedImageUrl;
      if (dp.platformVersions && Array.isArray(dp.platformVersions)) {
        dp.platformVersions = dp.platformVersions.map((pv: any) => ({
          ...pv,
          imageUrl: generatedImageUrl
        }));
      }
    }
  }

  const newCampaign = {
    ...campaignData,
    id: campaignId,
    productId,
    userId: product.userId || "anonymous",
    productName: product.name,
    productLogoUrl: product.logoUrl || product.logoDarkUrl || product.logoLightUrl || null,
    createdAt: new Date().toISOString(),
    startDate: selectedStartDate,
    focus: founderInputs.focusInput,
    subCategory: founderInputs.subCategory,
    campaignThemeInput: founderInputs.campaignTheme,
  };

  await db.collection('campaigns').doc(campaignId).set(newCampaign);

  // 5. Automatically Queue daily posts if automateDailyPosts enabled
  if (product.automateDailyPosts) {
    console.log(`[executeAutoCampaignGeneration] Queueing daily posts for product ${product.id} automatically...`);
    if (newCampaign.dailyPosts) {
      for (const dp of newCampaign.dailyPosts) {
        if (dp.platformVersions) {
          for (const pv of dp.platformVersions) {
            const queueId = Math.random().toString(36).substring(7);
            await addToQueue({
              id: queueId,
              text: pv.copy,
              campaignId: campaignId,
              platform: pv.platform,
              productId: productId,
              day: dp.day,
              date: dp.date,
              imageUrl: pv.imageUrl || null
            });
          }
        }
      }
    }
  }

  // 6. Update logs in product
  console.log(`[executeAutoCampaignGeneration] Campaign successfully created. Logging execution state.`);
  const newLog = {
    timestamp: new Date().toISOString(),
    type: 'weekly_campaign',
    theme: founderInputs.campaignTheme,
    focus: founderInputs.focusInput,
    status: 'Success'
  };

  const currentLogs = product.automationLogs || [];
  currentLogs.unshift(newLog);
  const trimmedLogs = currentLogs.slice(0, 10);

  await db.collection('products').doc(productId).update({
    automationLogs: trimmedLogs
  });

  // Trigger Email Approval Workflow if enabled
  try {
    const userDoc = product.userId ? await db.collection('users').doc(product.userId).get() : null;
    const userEmail = userDoc?.exists ? userDoc.data()?.email : null;
    if (userEmail) {
      await createAndSendApprovalRequest({
        userId: product.userId,
        productId,
        productName: product.name,
        userEmail,
        itemType: 'campaign',
        itemTitle: founderInputs.campaignTheme || "Weekly Campaign",
        itemPreview: newCampaign.coreMessage || newCampaign.hook || founderInputs.focusInput,
        itemData: newCampaign
      });
    }
  } catch (apprErr) {
    console.warn('[executeAutoCampaignGeneration] Could not send approval email:', apprErr);
  }

  return newCampaign;
}

export async function executeAutoDailyPostGeneration(productId: string) {
  if (!db) throw new Error("Database connection is not active.");

  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) throw new Error("Product not found");
  const product = productDoc.data()!;

  const currentDateUtc = new Date().toISOString().split('T')[0];

  // Idempotency defense: check if a daily post campaign was already generated for this product today
  const existingPostsSnap = await db.collection('campaigns')
    .where('productId', '==', productId)
    .where('isOneDay', '==', true)
    .where('isBlog', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  if (!existingPostsSnap.empty) {
    const latestPost = existingPostsSnap.docs[0].data();
    const createdDate = (latestPost.createdAt || "").split('T')[0];
    if (createdDate === currentDateUtc) {
      console.log(`[executeAutoDailyPostGeneration] Daily post already generated today (${currentDateUtc}) for product ${productId}. Bypassing duplicate creation.`);
      return latestPost;
    }
  }

  const userDoc = await db.collection('users').doc(product.userId || 'anonymous').get();
  if (!userDoc.exists) throw new Error("User profile not found. Please set up the Master Founder Agent.");
  const userData = userDoc.data()!;
  const founderAgent = userData.founderAgentSynthesized;
  if (!founderAgent) {
    throw new Error("Founder Agent doppelganger has not been synthesized globally yet.");
  }
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // 1. Get campaign inputs from Founder Agent
  console.log(`[executeAutoDailyPostGeneration] Querying Founder Agent Doppelganger "${founderAgent.personaName}" for daily post direction...`);
  const founderPrompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Company Position & Product DNA:
- Product Name: ${product.name}
- Positioning: ${product.positioning}
- Target Audience: ${product.audience}
- Tone of Voice: ${product.tone}

Based on your profile, values, behavioral traits, and positioning, identify a highly specific, compelling social media post topic or focus area, a sub-category/niche, and a post theme/angle for today.
Return the result in a JSON object with the following fields:
- focusInput: A punchy focus area (e.g. "early stage B2B SaaS", "manual spreadsheet fatigue")
- subCategory: A specific sub-category or niche (e.g. "productivity tools", "accounting automation")
- campaignTheme: An engaging hook or theme/angle (e.g. "The hidden cost of manual data entry")
`;

  const founderResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: founderPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focusInput: { type: Type.STRING },
          subCategory: { type: Type.STRING },
          campaignTheme: { type: Type.STRING }
        },
        required: ["focusInput", "subCategory", "campaignTheme"]
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_post_founder_focus", "gemini-3.1-pro-preview", founderResponse.usageMetadata);

  const founderInputs = JSON.parse(founderResponse.text || "{}");
  if (!founderInputs.focusInput) throw new Error("Founder Agent failed to generate daily post focus.");

  // 2. Research focus area
  console.log(`[executeAutoDailyPostGeneration] Researching focus area: ${founderInputs.focusInput}...`);
  const researchPrompt = `
    You are an expert market researcher.
    
    Research the following industry or focus area: "${founderInputs.focusInput}"
    Specifically focus on this sub-category or niche: "${founderInputs.subCategory}"
    
    Generate 3-5 highly engaging key insights about this focus area, including:
    - Current trends and emerging topics
    - Audience pain points and desires
    - Competitor landscape or market gaps
    
    Return a JSON array of strings, where each string is a detailed key insight.
  `;

  const researchResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: researchPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_post_research", "gemini-3.1-pro-preview", researchResponse.usageMetadata);

  const insights = JSON.parse(researchResponse.text || "[]");

  // 3. Generate campaign/post
  console.log(`[executeAutoDailyPostGeneration] Drafting single daily post for "${founderInputs.campaignTheme}"...`);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = weekdays[new Date().getDay()];
  const currentDate = formatDate(new Date());

  const campaignPrompt = `
    You are an expert B2B SaaS marketer.
    
    Generate a single-day social media campaign/post based on the provided Brand Position, the Key Insights, and the specific focus area.
    This is for ${currentDayName} (${currentDate}).
    
    Campaign Focus Area: ${founderInputs.focusInput}
    Industry Sub-Category/Niche: ${founderInputs.subCategory}
    Campaign Theme: ${founderInputs.campaignTheme}
    
    Key Insights about this Focus:
    ${insights.map((i: string) => `- ${i}`).join('\n')}
    
    Brand Position:
    Website: ${product.website}
    Positioning: ${product.positioning}
    Audience: ${product.audience}
    Tone: ${product.tone}
    Stage: ${product.stage}
    Visual Style: ${product.visualStyle || 'Standard professional'}
    ${product.visualData ? `
    Visual DNA:
    - Colors: ${product.visualData.colors.join(', ')}
    - Fonts: Primary (${product.visualData.fonts.primary}), Secondary (${product.visualData.fonts.secondary})
    - Typography Hierarchy: ${product.visualData.typographyHierarchy}
    - Image Style: ${product.visualData.imageStyle}
    ` : ''}
    
    Advanced DNA (Psychology, Narrative, & Strategy):
    ${product.enemy ? `- The Enemy / Status Quo: ${product.enemy}` : ''}
    ${product.earnedSecret ? `- The Earned Secret: ${product.earnedSecret}` : ''}
    ${product.originStory ? `- Origin Story: ${product.originStory}` : ''}
    ${product.hellState ? `- 'Hell' State (Before): ${product.hellState}` : ''}
    ${product.heavenState ? `- 'Heaven' State (After): ${product.heavenState}` : ''}
    ${product.objections ? `- Top Buying Objections: ${product.objections}` : ''}
    ${product.uniqueMechanism ? `- Unique Mechanism: ${product.uniqueMechanism}` : ''}
    ${product.proofPoints ? `- Proof Points: ${product.proofPoints}` : ''}
    ${product.vocabularyAlways ? `- Vocabulary to ALWAYS use: ${product.vocabularyAlways}` : ''}
    ${product.vocabularyNever ? `- Vocabulary to NEVER use: ${product.vocabularyNever}` : ''}
    ${product.contentPillars && product.contentPillars.length > 0 ? `- Content Pillars: ${product.contentPillars.join(' | ')}` : ''}
    ${product.targetIcps && product.targetIcps.length > 0 ? `- Target ICPs & Pain Points:\n      ${product.targetIcps.map((icp: any) => `${icp.name} (Pains: ${icp.painPoints.join(', ')})`).join('\n      ')}` : ''}

    The JSON output must include:
    - A specific theme for the post.
    - The target audience segment.
    - A core message (one sentence value proposition).
    - A hook (1-2 lines mirroring pain-point language).
    - A clear Call to Action (CTA).
    - The overall content format.
    - Daily Post Sequencing: You MUST generate exactly ONE item in the dailyPosts array for the day: "${currentDayName}".
    - For this single daily post, provide platform-specific versions for the following channels: LinkedIn, X, Instagram, Facebook, Reddit. Each must have copy and format.
    - Repurposing notes (how to reuse this next week).
    - A confidence score (0-100) based on relevance.
    - The primary content pillar used.
    - A research summary (1-2 paragraphs summarizing audience trends).
  `;

  const campaignResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: campaignPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: dailyPostCampaignSchema
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_post_draft", "gemini-3.1-pro-preview", campaignResponse.usageMetadata);

  const campaignData = JSON.parse(campaignResponse.text || "{}");

  const campaignId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const activePlatforms = (product.targetPlatforms && Array.isArray(product.targetPlatforms) && product.targetPlatforms.length > 0)
    ? product.targetPlatforms.map((p: string) => p.toLowerCase())
    : ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit'];

  // Query uploaded Brand Assets from Firestore if available
  const creativesSnap = await db.collection('creatives')
    .where('productId', '==', productId)
    .get();

  const brandAssetUrls: string[] = [];
  if (!creativesSnap.empty) {
    creativesSnap.forEach(docSnap => {
      const cData = docSnap.data();
      if (cData.url) brandAssetUrls.push(cData.url);
    });
  }

  const brandLogoUrl = product.logoUrl || product.logoDarkUrl || product.logoLightUrl || undefined;
  const brandColors = product.visualData?.colors || ['#08080C', '#FAF9F6', '#3B82F6'];
  const fontStyle = product.visualData?.fonts?.primary || 'Inter Tight, bold modern sans-serif';

  if (campaignData.dailyPosts && Array.isArray(campaignData.dailyPosts)) {
    const updatedDailyPosts: any[] = [];
    for (let idx = 0; idx < campaignData.dailyPosts.length; idx++) {
      const dp = campaignData.dailyPosts[idx];
      let filteredVersions = dp.platformVersions || [];
      if (activePlatforms.length > 0) {
        filteredVersions = filteredVersions.filter((pv: any) => {
          const plat = (pv.platform || '').toLowerCase();
          return activePlatforms.includes(plat) || (plat === 'x' && activePlatforms.includes('twitter')) || (plat === 'twitter' && activePlatforms.includes('x'));
        });
      }

      const chosenAsset = (product.useBrandAssets === true && brandAssetUrls.length > 0) ? brandAssetUrls[idx % brandAssetUrls.length] : undefined;
      const headline = dp.visualData?.headline || dp.contentType || `${product.name} — ${currentDayName}`;
      const subtext = dp.visualData?.subtext || product.tagline || product.description || 'Automated B2B Growth Engine';
      const promptText = dp.visualData?.cinematicPrompt || dp.imagePrompt || `High-end executive photographic visual for ${product.name}, topic: ${headline}, 1:1 ratio, clean aesthetic`;

      console.log(`[executeAutoDailyPostGeneration] Generating AI visual for post (${idx + 1}/${campaignData.dailyPosts.length})...`);
      const generatedImageUrl = await generateSingleCampaignImageBackend({
        prompt: promptText,
        headline,
        subtext,
        brandColors,
        fontStyle,
        brandAssetUrl: chosenAsset,
        logoPosition: dp.visualData?.logoPosition || 'top-left'
      }, brandLogoUrl);

      filteredVersions = filteredVersions.map((pv: any) => ({
        ...pv,
        imageUrl: generatedImageUrl
      }));

      updatedDailyPosts.push({
        ...dp,
        day: currentDayName,
        date: currentDate,
        imageUrl: generatedImageUrl,
        platformVersions: filteredVersions
      });
    }
    campaignData.dailyPosts = updatedDailyPosts;
  }

  const newCampaign = {
    ...campaignData,
    id: campaignId,
    productId,
    userId: product.userId || "anonymous",
    productName: product.name,
    productLogoUrl: product.logoUrl || product.logoDarkUrl || product.logoLightUrl || null,
    createdAt: new Date().toISOString(),
    startDate: currentDate,
    focus: founderInputs.focusInput,
    subCategory: founderInputs.subCategory,
    campaignThemeInput: founderInputs.campaignTheme,
    isOneDay: true,
    isAutomated: true
  };

  await db.collection('campaigns').doc(campaignId).set(newCampaign);

  // Queue daily posts
  console.log(`[executeAutoDailyPostGeneration] Queueing daily post for product ${product.id} automatically...`);
  if (newCampaign.dailyPosts) {
    for (const dp of newCampaign.dailyPosts) {
      if (dp.platformVersions) {
        for (const pv of dp.platformVersions) {
          const queueId = Math.random().toString(36).substring(7);
          await addToQueue({
            id: queueId,
            text: pv.copy,
            campaignId: campaignId,
            platform: pv.platform,
            productId: productId,
            day: dp.day,
            date: dp.date,
            imageUrl: pv.imageUrl || null
          });
        }
      }
    }
  }

  // 6. Update logs in product
  console.log(`[executeAutoDailyGeneration] Daily content successfully created. Logging execution state.`);
  const executionDateUtc = new Date().toISOString().split('T')[0];
  const newLog = {
    timestamp: new Date().toISOString(),
    type: 'daily_content',
    theme: founderInputs.campaignTheme || "Daily Post",
    focus: founderInputs.focusInput,
    status: 'Success'
  };

  const currentLogs = product.automationLogs || [];
  currentLogs.unshift(newLog);
  const trimmedLogs = currentLogs.slice(0, 10);

  await db.collection('products').doc(productId).update({
    automationLogs: trimmedLogs,
    lastDailyRunDate: currentDateUtc
  });

  // Trigger Email Approval Workflow if enabled
  try {
    const userDoc = product.userId ? await db.collection('users').doc(product.userId).get() : null;
    const userEmail = userDoc?.exists ? userDoc.data()?.email : null;
    if (userEmail) {
      const firstPost = newCampaign.dailyPosts?.[0]?.platformVersions?.[0];
      const previewText = firstPost ? `${firstPost.platform}: ${firstPost.copy}` : (founderInputs.focusInput || founderInputs.campaignTheme);
      await createAndSendApprovalRequest({
        userId: product.userId,
        productId,
        productName: product.name,
        userEmail,
        itemType: 'post',
        itemTitle: founderInputs.campaignTheme || "Daily Post",
        itemPreview: previewText,
        itemData: newCampaign
      });
    }
  } catch (apprErr) {
    console.warn('[executeAutoDailyPostGeneration] Could not send approval email:', apprErr);
  }

  return newCampaign;
}

export async function generateContextualBlogImagePrompt(
  ai: GoogleGenAI,
  userId: string,
  product: any,
  blogTitle: string,
  coreMessage: string,
  targetAudience: string,
  insights: string[],
  blogContent: string
): Promise<string> {
  const visualStyle = product.visualStyle || 'High-end editorial studio photography';
  const colors = product.visualData?.colors?.length ? product.visualData.colors.join(', ') : 'Sophisticated, modern brand palette';
  const imageStyle = product.visualData?.imageStyle || 'Clean visual metaphor, cinematic studio lighting';

  const systemPrompt = `
You are Chloe, an elite Visual Art Director and Brand Strategist for high-growth tech brands.
Your task is to craft a highly descriptive, anti-slop image prompt for Imagen AI to generate a top-tier cover graphic for a blog post.

BRAND DNA & DESIGN DIRECTIVES:
- Brand Name: ${product.name}
- Positioning: ${product.positioning}
- Brand Visual Style: ${visualStyle}
- Brand Color Palette: ${colors}
- Preferred Image Style: ${imageStyle}

BLOG POST CONTEXT:
- Blog Title: "${blogTitle}"
- Core Value / Key Message: "${coreMessage}"
- Target Audience: "${targetAudience}"
- Key Topics & Insights: ${insights?.slice(0, 3).join("; ") || "Industry trends"}
- Content Teaser: ${blogContent ? blogContent.substring(0, 300).replace(/\n/g, ' ') : ''}

CRITICAL ANTI-AI SLOP INSTRUCTIONS:
1. SPECIFIC VISUAL METAPHOR: Create a striking, atmospheric visual metaphor or architectural composition that directly symbolizes the central theme of "${blogTitle}".
2. NO SAAS AI CLICHÉS:
   - NEVER use generic blue/purple cyber network graphs or digital stream particles.
   - NEVER use floating 3D glowing lightbulbs, gear icons, or holograms.
   - NEVER use generic corporate stock photo scenes of smiling colleagues pointing at whiteboards.
   - NEVER use random disconnected mountain sunsets unless strictly part of the narrative.
   - NEVER include text, letters, numbers, or logos inside the generated graphic.
3. COMPOSITION & LIGHTING:
   - Aspect ratio: 16:9 header image composition.
   - Cinematic studio lighting with soft shadows and rich depth of field.
   - Incorporate the brand color palette (${colors}) seamlessly into the lighting, environment, or focal object.

Return ONLY a JSON object with a single field:
{
  "imagePrompt": "Detailed 2-3 sentence prompt for Imagen AI..."
}
`;

  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: systemPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING }
          },
          required: ["imagePrompt"]
        }
      }
    });

    if (res.usageMetadata) {
      await logBackendTokenUsage(userId, "blog_image_prompt_gen", "gemini-3.1-pro-preview", res.usageMetadata);
    }

    const data = JSON.parse(res.text || "{}");
    return data.imagePrompt || `High-end editorial visual representing ${blogTitle}, styled in ${visualStyle} with colors ${colors}, cinematic lighting, 16:9 aspect ratio, clean visual metaphor, no text.`;
  } catch (err) {
    console.warn("[generateContextualBlogImagePrompt] Fallback due to error:", err);
    return `High-end editorial header graphic for "${blogTitle}". Atmospheric visual metaphor matching ${visualStyle}, incorporating ${colors}. Cinematic lighting, depth of field, 16:9 header layout, no text or symbols.`;
  }
}

export async function executeAutoDailyBlogGeneration(productId: string) {
  if (!db) throw new Error("Database connection is not active.");

  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) throw new Error("Product not found");
  const product = productDoc.data()!;

  const currentDateUtc = new Date().toISOString().split('T')[0];

  // Idempotency defense: check if a blog was already generated for this product today
  const existingBlogsSnap = await db.collection('campaigns')
    .where('productId', '==', productId)
    .where('isOneDay', '==', true)
    .where('isBlog', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();

  if (!existingBlogsSnap.empty) {
    const latestBlog = existingBlogsSnap.docs[0].data();
    const createdDate = (latestBlog.createdAt || "").split('T')[0];
    if (createdDate === currentDateUtc) {
      console.log(`[executeAutoDailyBlogGeneration] Blog already generated today (${currentDateUtc}) for product ${productId}. Bypassing duplicate creation.`);
      return latestBlog;
    }
  }

  const userDoc = await db.collection('users').doc(product.userId || 'anonymous').get();
  if (!userDoc.exists) throw new Error("User profile not found. Please set up the Master Founder Agent.");
  const userData = userDoc.data()!;
  const founderAgent = userData.founderAgentSynthesized;
  if (!founderAgent) {
    throw new Error("Founder Agent doppelganger has not been synthesized globally yet.");
  }
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // 1. Get campaign inputs / blog topic from Founder Agent
  console.log(`[executeAutoDailyBlogGeneration] Querying Founder Agent Doppelganger "${founderAgent.personaName}" for blog direction...`);
  const founderPrompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Company Position & Product DNA:
- Product Name: ${product.name}
- Positioning: ${product.positioning}
- Target Audience: ${product.audience}
- Tone of Voice: ${product.tone}

Based on your profile, values, behavioral traits, and positioning, identify a highly specific, compelling blog post topic or focus area, a sub-category/niche, and an engaging blog title/theme for today.
Return the result in a JSON object with the following fields:
- focusInput: A punchy focus area (e.g. "early stage B2B SaaS", "manual spreadsheet fatigue")
- subCategory: A specific sub-category or niche (e.g. "productivity tools", "accounting automation")
- blogTitle: An engaging, click-worthy blog title (e.g. "The Hidden Cost of Manual Data Entry in B2B Teams")
`;

  const founderResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: founderPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          focusInput: { type: Type.STRING },
          subCategory: { type: Type.STRING },
          blogTitle: { type: Type.STRING }
        },
        required: ["focusInput", "subCategory", "blogTitle"]
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_blog_founder_focus", "gemini-3.1-pro-preview", founderResponse.usageMetadata);

  const founderInputs = JSON.parse(founderResponse.text || "{}");
  if (!founderInputs.focusInput || !founderInputs.blogTitle) throw new Error("Founder Agent failed to generate daily blog focus.");

  // 2. Research focus area
  console.log(`[executeAutoDailyBlogGeneration] Researching focus area: ${founderInputs.focusInput}...`);
  const researchPrompt = `
    You are an expert market researcher.
    
    Research the following industry or focus area: "${founderInputs.focusInput}"
    Specifically focus on this sub-category or niche: "${founderInputs.subCategory}"
    
    Generate 4-6 highly engaging key insights about this focus area, including:
    - Current trends and emerging topics
    - Audience pain points and desires
    - Competitor landscape or market gaps
    
    Return a JSON array of strings, where each string is a detailed key insight.
  `;

  const researchResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: researchPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_blog_research", "gemini-3.1-pro-preview", researchResponse.usageMetadata);

  const insights = JSON.parse(researchResponse.text || "[]");

  // 3. Generate blog body and image prompt
  console.log(`[executeAutoDailyBlogGeneration] Drafting daily blog for "${founderInputs.blogTitle}"...`);
  const blogPrompt = `
    You are an expert B2B SaaS copywriter and growth marketer.
    
    Generate a full-length, highly engaging blog post and newsletter based on the provided Brand Position, Key Insights, and specific topic.
    The writing style MUST reflect the virtual Founder Agent "${founderAgent.personaName}" who has the following traits:
    - Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
    - Core Values: ${founderAgent.coreValues?.join(", ") || ""}
    - Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
    - Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

    Blog Title: ${founderInputs.blogTitle}
    Industry Focus Area: ${founderInputs.focusInput}
    Industry Sub-Category/Niche: ${founderInputs.subCategory}
    
    Key Insights about this Focus:
    ${insights.map((i: string) => `- ${i}`).join('\n')}
    
    Brand Position:
    Website: ${product.website}
    Positioning: ${product.positioning}
    Audience: ${product.audience}
    Tone: ${product.tone}
    Stage: ${product.stage}
    Visual Style: ${product.visualStyle || 'High-end editorial studio photography'}
    ${product.visualData ? `
    Visual DNA:
    - Colors: ${product.visualData.colors?.join(', ')}
    - Fonts: Primary (${product.visualData.fonts?.primary}), Secondary (${product.visualData.fonts?.secondary})
    - Image Style: ${product.visualData.imageStyle}
    ` : ''}
    
    Advanced DNA:
    ${product.enemy ? `- The Enemy / Status Quo: ${product.enemy}` : ''}
    ${product.earnedSecret ? `- The Earned Secret: ${product.earnedSecret}` : ''}
    ${product.originStory ? `- Origin Story: ${product.originStory}` : ''}
    ${product.hellState ? `- 'Hell' State (Before): ${product.hellState}` : ''}
    ${product.heavenState ? `- 'Heaven' State (After): ${product.heavenState}` : ''}
    ${product.uniqueMechanism ? `- Unique Mechanism: ${product.uniqueMechanism}` : ''}
    ${product.proofPoints ? `- Proof Points: ${product.proofPoints}` : ''}

    The output must contain:
    - blogContent: A full-length (500-800 words) detailed, insightful blog post written in a conversational, authoritative founder voice. Format with markdown headings (##, ###) and clean paragraphs.
    - blogImagePrompt: A detailed, contextually rich visual prompt for Imagen AI.
    - targetAudience: The specific reader persona targeted.
    - coreMessage: A 1-sentence value proposition of this blog post.
    - cta: A clear newsletter or product call-to-action at the end (e.g. "Try ${product.name} today").
  `;

  const blogResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ text: blogPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          blogContent: { type: Type.STRING },
          blogImagePrompt: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          coreMessage: { type: Type.STRING },
          cta: { type: Type.STRING }
        },
        required: ["blogContent", "blogImagePrompt", "targetAudience", "coreMessage", "cta"]
      }
    }
  });

  await logBackendTokenUsage(product.userId || "anonymous", "daily_blog_draft", "gemini-3.1-pro-preview", blogResponse.usageMetadata);

  const blogData = JSON.parse(blogResponse.text || "{}");
  if (!blogData.blogContent) throw new Error("Failed to generate blog content.");

  // Dedicated second pass for Brand DNA & Context-Driven Blog Cover Image Prompt
  try {
    console.log(`[executeAutoDailyBlogGeneration] Generating context-rich Brand DNA image prompt...`);
    const contextualPrompt = await generateContextualBlogImagePrompt(
      ai,
      product.userId || "anonymous",
      product,
      founderInputs.blogTitle,
      blogData.coreMessage || "",
      blogData.targetAudience || product.audience || "",
      insights,
      blogData.blogContent || ""
    );
    if (contextualPrompt) {
      blogData.blogImagePrompt = contextualPrompt;
      console.log(`[executeAutoDailyBlogGeneration] Contextual blog image prompt generated: "${contextualPrompt}"`);
    }
  } catch (ePrompt) {
    console.warn("[executeAutoDailyBlogGeneration] Contextual prompt generation warning:", ePrompt);
  }

  // 4. Generate AI image for the blog
  let blogImageUrl = null;
  if (blogData.blogImagePrompt) {
    try {
      console.log(`[executeAutoDailyBlogGeneration] Generating Imagen header image for blog: "${blogData.blogImagePrompt}"...`);
      const imgRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: blogData.blogImagePrompt }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });

      await logBackendTokenUsage(product.userId || "anonymous", "daily_blog_image", "gemini-3.1-flash-image-preview", {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 1
      });

      if (imgRes?.candidates?.[0]?.content?.parts) {
        for (const pt of imgRes.candidates[0].content.parts) {
          if (pt.inlineData) {
            const base64Data = pt.inlineData.data;
            const mimeType = pt.inlineData.mimeType || 'image/png';

            const imageId = 'img_blog_' + Math.random().toString(36).substring(2, 10);

            await saveImageLocalAndDb(imageId, base64Data, mimeType, blogData.blogImagePrompt);

            // Use relative path so the frontend resolves it correctly against the active origin
            blogImageUrl = `/api/whatsapp/images/${imageId}.png`;
            console.log(`[executeAutoDailyBlogGeneration] Blog image successfully served relative at: ${blogImageUrl}`);
            break;
          }
        }
      }
    } catch (eImg: any) {
      console.warn('[executeAutoDailyBlogGeneration Image Gen Failed]', eImg);
      if (db) {
        db.collection('error_logs').add({
          error: eImg instanceof Error ? eImg.message : String(eImg),
          stack: eImg instanceof Error ? eImg.stack : null,
          context: { context: "executeAutoDailyBlogGeneration_ImageGen", prompt: blogData.blogImagePrompt },
          timestamp: new Date().toISOString(),
          type: 'daily_blog_image_error'
        }).catch(err => console.error("Failed to log image gen error to db", err));
      }
    }
  }

  // 5. Assemble campaign dates & save to Firestore as a Blog campaign
  const campaignId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const currentDate = formatDate(new Date());

  // Attempt to publish to external site if configured
  let publishedBlogUrl = null;
  let blogPublishError = null;
  let publishStatusText = 'Success';

  try {
    const blogSettings = await getBlogSettings(productId);
    if (blogSettings && blogSettings.type !== 'none') {
      console.log(`[executeAutoDailyBlogGeneration] Blog integration found (${blogSettings.type}). Attempting auto-publishing...`);
      const appHost = process.env.APP_URL || lastKnownHost || 'http://localhost:3000';
      const publishRes = await publishBlogToExternalSite(
        productId,
        founderInputs.blogTitle,
        blogData.blogContent,
        blogImageUrl,
        { campaignId, targetAudience: blogData.targetAudience, coreMessage: blogData.coreMessage, cta: blogData.cta },
        appHost
      );
      if (publishRes.success) {
        publishedBlogUrl = (publishRes as any).url || null;
        publishStatusText = `Success (Published to ${blogSettings.type})`;
        console.log(`[executeAutoDailyBlogGeneration] Auto-publishing succeeded: ${publishedBlogUrl || 'delivery successful'}`);
      } else {
        blogPublishError = (publishRes as any).message || 'Auto-publishing failed';
        publishStatusText = `Success (Saved to Dashboard, Autopost Failed)`;
        console.warn(`[executeAutoDailyBlogGeneration] Auto-publishing failed: ${blogPublishError}`);
      }
    }
  } catch (pubErr: any) {
    blogPublishError = pubErr.message || String(pubErr);
    publishStatusText = `Success (Saved to Dashboard, Autopost Error)`;
    console.error(`[executeAutoDailyBlogGeneration] Auto-publishing threw error:`, pubErr);
  }

  const newCampaign: any = {
    id: campaignId,
    productId,
    userId: product.userId || "anonymous",
    productName: product.name,
    productLogoUrl: product.logoUrl || product.logoDarkUrl || product.logoLightUrl || null,
    createdAt: new Date().toISOString(),
    startDate: currentDate,
    theme: founderInputs.blogTitle,
    focus: founderInputs.focusInput,
    subCategory: founderInputs.subCategory,
    campaignThemeInput: founderInputs.blogTitle,
    isOneDay: true,
    isBlog: true,
    isAutomated: true,

    // Blog fields
    blogTitle: founderInputs.blogTitle,
    blogContent: blogData.blogContent,
    blogImagePrompt: blogData.blogImagePrompt || null,
    blogImageUrl: blogImageUrl || null,
    targetAudience: blogData.targetAudience || product.audience || "",
    coreMessage: blogData.coreMessage || "",
    cta: blogData.cta || ""
  };

  if (publishedBlogUrl) {
    newCampaign.publishedBlogUrl = publishedBlogUrl;
    newCampaign.publishedAt = new Date().toISOString();
  }
  if (blogPublishError) {
    newCampaign.blogPublishError = blogPublishError;
  }

  await db.collection('campaigns').doc(campaignId).set(newCampaign);

  // 6. Update logs in product
  console.log(`[executeAutoDailyBlogGeneration] Blog content successfully created. Logging execution state.`);
  const blogExecutionDateUtc = new Date().toISOString().split('T')[0];
  const newLog = {
    timestamp: new Date().toISOString(),
    type: 'daily_content',
    theme: founderInputs.blogTitle,
    focus: founderInputs.focusInput,
    status: publishStatusText
  };

  const currentLogs = product.automationLogs || [];
  currentLogs.unshift(newLog);
  const trimmedLogs = currentLogs.slice(0, 10);

  await db.collection('products').doc(productId).update({
    automationLogs: trimmedLogs,
    lastDailyRunDate: currentDateUtc
  });

  // Trigger Email Approval Workflow if enabled
  try {
    const userDoc = product.userId ? await db.collection('users').doc(product.userId).get() : null;
    const userEmail = userDoc?.exists ? userDoc.data()?.email : null;
    if (userEmail) {
      await createAndSendApprovalRequest({
        userId: product.userId,
        productId,
        productName: product.name,
        userEmail,
        itemType: 'blog',
        itemTitle: founderInputs.blogTitle,
        itemPreview: blogData.blogContent,
        itemData: newCampaign
      });
    }
  } catch (apprErr) {
    console.warn('[executeAutoDailyBlogGeneration] Could not send approval email:', apprErr);
  }

  return newCampaign;
}

export async function executeAutoDailyGeneration(productId: string, automatePosts: boolean, automateBlogs: boolean) {
  console.log(`[executeAutoDailyGeneration] Triggered for product ${productId}. Automate Posts: ${automatePosts}, Automate Blogs: ${automateBlogs}`);

  if (automatePosts) {
    console.log(`[executeAutoDailyGeneration] Starting automated post generation...`);
    await executeAutoDailyPostGeneration(productId);
  }

  if (automateBlogs) {
    console.log(`[executeAutoDailyGeneration] Starting automated blog generation...`);
    await executeAutoDailyBlogGeneration(productId);
  }
}

export async function performBackendSocialTrendResearch(ai: any, topic: string, userId: string): Promise<string> {
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: prompt }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    await logBackendTokenUsage(userId, "founder_post_research", "gemini-3.1-pro-preview", response.usageMetadata);
    return response.text || "";
  } catch (err) {
    console.warn("[performBackendSocialTrendResearch] Failed:", err);
    return "Use standard engaging LinkedIn formats: strong contrarian hook, spaced paragraphs, clear bulleted take-aways, and a thought-provoking final sentence.";
  }
}

export async function executeAutoFounderPostGeneration(userId: string) {
  if (!db) throw new Error("Database connection is not active.");

  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error("User not found");
  const user = userDoc.data()!;
  const founderAgent = user.founderAgentSynthesized;
  if (!founderAgent) {
    throw new Error("Founder Agent has not been synthesized yet.");
  }

  // Load API Key
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable for user founder post automation.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const attachmentStyle = user.founderPostAttachmentStyle || "image-overlay";
  const postType = user.founderPostType || "general"; // 'general' | 'branded' | 'both'
  console.log(`[executeAutoFounderPostGeneration] Run for user ${userId}. Type: ${postType}, Style: ${attachmentStyle}...`);

  // 1. Generate topic to focus on today based on pillars and strategic context
  let selectedTopic = "entrepreneurship and personal lessons from building startups";
  let trendResearch = "";

  try {
    const topicPrompt = `
      You are a virtual Founder Agent named "${founderAgent.personaName}".
      Your profile:
      - Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
      - Core Values: ${founderAgent.coreValues?.join(", ") || ""}
      - Key Content Pillars: ${founderAgent.contentPillars?.join(", ") || ""}
      - Target Industry: ${founderAgent.targetIndustry || "General Entrepreneurship"}
      - Target Audience: ${founderAgent.targetAudience || "General Public/Professionals"}
      
      Determine a single high-impact, highly relevant topic or core thought to write about today on LinkedIn. It should align with your content pillars and target industry.
      Return a JSON object containing:
      - topic: A short, specific post topic or focus area (e.g. "why remote work is failing for juniors" or "the hidden cost of premature scaling").
    `;

    const topicRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: topicPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING }
          },
          required: ["topic"]
        }
      }
    });

    const topicData = JSON.parse(topicRes.text || "{}");
    if (topicData.topic) {
      selectedTopic = topicData.topic;
    }
  } catch (errTopic) {
    console.warn("[executeAutoFounderPostGeneration] Failed to generate custom topic suggestion. Falling back to default:", errTopic);
  }

  // 2. Perform live platform/social trend research using Google Search
  try {
    console.log(`[executeAutoFounderPostGeneration] Performing live LinkedIn trend research for topic: "${selectedTopic}"...`);
    trendResearch = await performBackendSocialTrendResearch(ai, selectedTopic, userId);
  } catch (errRes) {
    console.warn("[executeAutoFounderPostGeneration] Niche trend research failed:", errRes);
  }

  // Helper to generate and save a single post
  const generateAndSavePost = async (productData?: any) => {
    let prompt = "";
    if (productData) {
      // Branded post prompt
      prompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}

Product Focus & Brand DNA:
- Product Name: ${productData.name}
- Positioning / Value Prop: ${productData.positioning || ""}
- Target Audience: ${productData.audience || ""}
- Company Stage: ${productData.stage || ""}
- Content Pillars: ${productData.contentPillars?.join(", ") || ""}

Additional Product DNA elements:
${productData.enemy ? `- Enemy / Status Quo: ${productData.enemy}` : ""}
${productData.earnedSecret ? `- Earned Secret: ${productData.earnedSecret}` : ""}
${productData.originStory ? `- Origin Story: ${productData.originStory}` : ""}
${productData.uniqueMechanism ? `- Unique Mechanism: ${productData.uniqueMechanism}` : ""}

Strategic Personal Branding Context:
- Target Industry: ${founderAgent.targetIndustry || ""}
- Vision: ${founderAgent.vision || ""}
- Mission: ${founderAgent.mission || ""}
- Goal: ${founderAgent.goal || ""}

LinkedIn Platform Research & Trend Insights:
${trendResearch || "Focus on a strong hook, concise paragraphs, clean list/spacing formatting, and a strong CTA."}

Write an organic, highly engaging, and thought-provoking personal social media post for your profile.
This is a BRANDED post written from your perspective as the founder of "${productData.name}".
Post Topic of the Day: "${selectedTopic}"

CRITICAL RULES:
1. Speak as the creator/founder of "${productData.name}". You are sharing an insight, story, status quo challenge, or lesson directly related to the problem "${productData.name}" solves or the journey of building it.
2. Blend the product's positioning, audience, and narrative elements smoothly into a high-value personal post. Avoid simple sales pitches—the post must offer real value to the reader.
3. Sound exactly like the founder's profile (behavioral traits, style, values).
4. CRITICAL: You must write this post using the platform formatting templates, hook styles, layout structure, and trending insights identified in the LinkedIn Platform Research & Trend Insights above.

Return a JSON object containing:
- postCopy: The full post copy (formatted with clean spacing and paragraph breaks).
- imagePrompt: A detailed, high-quality descriptive prompt for a photographic backdrop matching the post's theme.
- headline: A short, punchy overlay title (3-6 words, e.g. "Hiring is a Trap").
- subtext: A brief subtitle (4-8 words).
`;
    } else {
      // General post prompt
      prompt = `You are a virtual Founder Agent named "${founderAgent.personaName}".
Your profile:
- Behavioral Traits: ${founderAgent.behavioralTraits?.join(", ") || ""}
- Core Values: ${founderAgent.coreValues?.join(", ") || ""}
- Communication Style: ${founderAgent.communicationStyle?.join(", ") || ""}
- Decision Heuristics: ${founderAgent.decisionHeuristics?.join(", ") || ""}
- Content Pillars: ${founderAgent.contentPillars?.join(", ") || ""}

Strategic Context:
- Target Industry: ${founderAgent.targetIndustry || "Tech"}
- Target Audience: ${founderAgent.targetAudience || "Entrepreneurs & Tech Builders"}
- Vision: ${founderAgent.vision || ""}
- Mission: ${founderAgent.mission || ""}
- Goal: ${founderAgent.goal || ""}

LinkedIn Platform Research & Trend Insights:
${trendResearch || "Focus on a strong hook, concise paragraphs, clean list/spacing formatting, and a strong CTA."}

Write an organic, highly engaging, and thought-provoking personal social media post for your profile.
Post Topic of the Day: "${selectedTopic}"

CRITICAL RULES:
1. Do NOT talk about, mention, or name any specific products, brands, or commercial projects. This post must be strictly non-branded, educational, narrative-driven, or a personal lesson.
2. Adopt a natural, expert human voice matching your profile. Avoid marketing fluff or generic corporate listicles.
3. CRITICAL: You must write this post using the platform formatting templates, hook styles, layout structure, and trending insights identified in the LinkedIn Platform Research & Trend Insights above.

Return a JSON object containing:
- postCopy: The full post copy (formatted with clean spacing and paragraph breaks).
- imagePrompt: A detailed, high-quality descriptive prompt for a photographic backdrop matching the post's theme.
- headline: A short, punchy overlay title (3-6 words, e.g. "Hiring is a Trap").
- subtext: A brief subtitle (4-8 words).
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            postCopy: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            headline: { type: Type.STRING },
            subtext: { type: Type.STRING }
          },
          required: ["postCopy", "imagePrompt", "headline", "subtext"]
        }
      }
    });

    await logBackendTokenUsage(userId, productData ? `auto_founder_branded_${productData.id}` : "auto_founder_general", "gemini-3.1-pro-preview", response.usageMetadata);

    const postData = JSON.parse(response.text || "{}");
    if (!postData.postCopy) return;

    let imageUrl: string | null = null;
    let approvedTemplateImage: string | null = null;

    if (attachmentStyle !== "text-only") {
      // 1. Discover 1 Single Visual Aesthetic Trend ("like how they look") via Google Search grounding
      let stylePrompt = "High-contrast B2B founder editorial visual with executive dark-mode lighting, minimal modern typography, and structured negative space.";
      let activePrimary = productData?.visualData?.colors?.[0] || "#7C3AED";
      let activeSecondary = productData?.visualData?.colors?.[1] || "#08080C";

      try {
        const nicheLens = productData?.industry || founderAgent.targetIndustry || "AI agent tooling & B2B SaaS";
        const trendRes = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{ text: `You are an elite B2B brand designer and visual researcher. Conduct Google Search grounding to discover 1 current, high-impact visual aesthetic trend for executive founder social media cards in "${nicheLens}".
Return ONLY valid JSON matching this schema:
{
  "visualStylePrompt": "Detailed visual description of lighting, composition, negative space, and executive aesthetic",
  "primaryColor": "#...",
  "secondaryColor": "#..."
}` }],
          config: { tools: [{ googleSearch: {} }] }
        });
        let cleanRes = (trendRes.text || "").trim();
        if (cleanRes.startsWith('```')) {
          cleanRes = cleanRes.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
        const parsedRes = JSON.parse(cleanRes);
        if (parsedRes.visualStylePrompt) stylePrompt = parsedRes.visualStylePrompt;
        if (parsedRes.primaryColor) activePrimary = parsedRes.primaryColor;
        if (parsedRes.secondaryColor) activeSecondary = parsedRes.secondaryColor;
      } catch (trendErr) {
        console.warn("[executeAutoFounderPostGeneration] 1-Style Grounding Research fallback:", trendErr);
      }

      // 2. Generate 1:1 Direct Image using our GPT-2 Image Medium (generateSingleCampaignImageBackend)
      try {
        const directPrompt = `B2B Founder Social Post Graphic about: ${selectedTopic}.
Visual Concept & Subject: A modern editorial B2B graphic representing ${selectedTopic}. ${postData.imagePrompt || ''}
Style & Aesthetic: ${stylePrompt}.
Headline text to display: "${postData.headline || selectedTopic}".
Subtext / secondary theme: "${postData.subtext || ''}".
Brand Color Palette: Primary ${activePrimary}, Secondary ${activeSecondary}.
Style: Professional 1:1 editorial graphic, zero stock photo slop, dark-mode executive aesthetic.`;

        imageUrl = await generateSingleCampaignImageBackend({
          prompt: directPrompt,
          headline: postData.headline || selectedTopic,
          subtext: postData.subtext || undefined,
          brandColors: [activePrimary, activeSecondary]
        }, productData?.logoDarkUrl || productData?.logoUrl);

        approvedTemplateImage = imageUrl;
        console.log(`[executeAutoFounderPostGeneration] Successfully generated GPT-2 image: ${imageUrl}`);
      } catch (eImg) {
        console.error('[executeAutoFounderPostGeneration] GPT-2 Image Generation failed:', eImg);
      }

      // Fallback branded graphic canvas if both OpenAI and Imagen failed (ZERO stock photo slop)
      if (!imageUrl) {
        imageUrl = generateFallbackBrandedCanvas(
          postData.headline || selectedTopic,
          postData.subtext || "",
          activePrimary,
          activeSecondary,
          productData?.logoDarkUrl || productData?.logoUrl || undefined
        );
        approvedTemplateImage = imageUrl;
      }
    }

    const newPostId = 'fpost_' + Math.random().toString(36).substring(2, 11);
    const newPost = {
      id: newPostId,
      userId: userId,
      postCopy: postData.postCopy,
      imageUrl: imageUrl || null,
      approvedTemplateImage: approvedTemplateImage || imageUrl || null,
      headline: postData.headline || null,
      subtext: postData.subtext || null,
      imagePrompt: postData.imagePrompt || null,
      createdAt: new Date().toISOString(),
      status: "scheduled",
      topic: productData ? `Focus: ${productData.name}` : (postData.headline || "Daily Automated Insight"),
      isBranded: !!productData,
      productId: productData ? productData.id : null
    };

    console.log(`[executeAutoFounderPostGeneration] Routing founder post ${newPostId} to approval system (branded: ${!!productData}).`);

    // Check user email for notification
    let userEmail = 'founder@brandtopost.com';
    try {
      const uDoc = await db.collection('users').doc(userId).get();
      if (uDoc.exists && uDoc.data()?.email) {
        userEmail = uDoc.data()!.email;
      }
    } catch (e) {
      console.warn("Could not fetch user email for founder post approval:", e);
    }

    await createAndSendApprovalRequest({
      userId,
      productId: productData ? productData.id : userId, // use userId if no specific product
      productName: productData ? productData.name : founderAgent.personaName + "'s Profile",
      userEmail,
      itemType: 'founder_post',
      itemTitle: postData.headline || "Automated Founder Post",
      itemPreview: postData.postCopy,
      itemData: newPost
    });
  };

  // Run general post generation if applicable
  if (postType === "general" || postType === "both") {
    try {
      await generateAndSavePost();
    } catch (errGen) {
      console.error("[executeAutoFounderPostGeneration] General post failed:", errGen);
    }
  }

  // Run branded post generation if applicable
  if (postType === "branded" || postType === "both") {
    let targetProductIds = user.founderPostSelectedProducts || [];
    if (targetProductIds.length === 0) {
      // Fallback: load all user's products
      const pSnap = await db.collection('products').where('userId', '==', userId).get();
      targetProductIds = pSnap.docs.map(doc => doc.id);
    }

    for (const pId of targetProductIds) {
      try {
        const pDoc = await db.collection('products').doc(pId).get();
        if (pDoc.exists) {
          await generateAndSavePost(pDoc.data());
        }
      } catch (errBr) {
        console.error(`[executeAutoFounderPostGeneration] Branded post failed for product ${pId}:`, errBr);
      }
    }
  }
}


export async function publishItemInstantly(itemType: 'campaign' | 'post' | 'blog' | 'founder_post', itemData: any, productId: string) {
  if (!db) return;
  const now = new Date().toISOString();
  console.log(`[Publish Engine] Publishing ${itemType} instantly for product ${productId}...`);

  if (itemType === 'blog') {
    const blogId = itemData.id || ("blog_" + Math.random().toString(36).substring(2, 9));
    const slug = (itemData.title || itemData.blogTitle || "article")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const blogDoc = {
      ...itemData,
      id: blogId,
      slug: itemData.slug || slug,
      title: itemData.title || itemData.blogTitle || "Untitled Blog Post",
      content: itemData.content || itemData.blogContent || "",
      coverImage: itemData.coverImage || itemData.blogImageUrl || itemData.imageUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200",
      published: true,
      publishedAt: now,
      updatedAt: now,
      status: 'published',
      productId
    };

    await db.collection("blogs").doc(blogId).set(blogDoc, { merge: true });
    console.log(`[Publish Engine] Blog published: "${blogDoc.title}" (ID: ${blogId})`);

    // Check if Product has Webhook or WordPress integration configured
    try {
      const blogConfigSnap = await db.collection("products").doc(productId).collection("settings").doc("blog_config").get();
      if (blogConfigSnap.exists) {
        const config = blogConfigSnap.data();
        if (config?.type === 'webhook' && config?.webhook?.url) {
          console.log(`[Publish Engine] Triggering blog webhook for product ${productId} -> ${config.webhook.url}`);
          fetch(config.webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.webhook.secret ? { 'X-Webhook-Secret': config.webhook.secret } : {})
            },
            body: JSON.stringify({ event: 'blog.published', article: blogDoc })
          }).catch(e => console.error('[Publish Engine] Webhook error:', e));
        }
      }
    } catch (err) {
      console.warn('[Publish Engine] Webhook trigger check error:', err);
    }
  } else if (itemType === 'campaign') {
    const campaignId = itemData.id || ("camp_" + Math.random().toString(36).substring(2, 9));
    const campaignDoc = {
      ...itemData,
      id: campaignId,
      productId,
      status: 'active',
      publishedAt: now,
      isShared: true
    };
    await db.collection("campaigns").doc(campaignId).set(campaignDoc, { merge: true });
    console.log(`[Publish Engine] Campaign published: "${campaignDoc.theme || campaignDoc.title || 'Campaign'}" (ID: ${campaignId})`);
  } else if (itemType === 'post') {
    const postId = itemData.id || ("post_" + Math.random().toString(36).substring(2, 9));
    const postDoc = {
      ...itemData,
      id: postId,
      productId,
      status: 'published',
      publishedAt: now
    };
    await db.collection("posts").doc(postId).set(postDoc, { merge: true });
    console.log(`[Publish Engine] Social Post published (ID: ${postId})`);
  } else if (itemType === 'founder_post') {
    // Founder post: save to user's founder_posts subcollection and attempt LinkedIn auto-publish
    const userId = itemData.userId;
    const postId = itemData.id || ('fpost_' + Math.random().toString(36).substring(2, 11));
    const postDoc = {
      ...itemData,
      id: postId,
      status: 'published',
      publishedAt: now
    };

    if (userId) {
      await db.collection('users').doc(userId).collection('founder_posts').doc(postId).set(postDoc, { merge: true });
      console.log(`[Publish Engine] Founder Post saved (ID: ${postId}) for user ${userId}.`);

      // Attempt auto-publish to personal LinkedIn if token exists
      try {
        const linkedinToken = await getToken(`founder_${userId}`, 'linkedin');
        if (linkedinToken) {
          console.log(`[Publish Engine] Auto-publishing founder post ${postId} to LinkedIn...`);
          let targetImage = postDoc.approvedTemplateImage || postDoc.imageUrl;
          if (typeof targetImage === 'string' && targetImage.startsWith('data:image/svg+xml')) {
            targetImage = postDoc.imageUrl || null;
          }
          await publishPostToLinkedIn(linkedinToken, postDoc.postCopy, targetImage);
          postDoc.status = 'published';
          (postDoc as any).publishedAt = new Date().toISOString();
          await db.collection('users').doc(userId).collection('founder_posts').doc(postId).set(postDoc, { merge: true });
          console.log(`[Publish Engine] Founder Post ${postId} auto-published to LinkedIn.`);
        } else {
          console.log(`[Publish Engine] Personal LinkedIn not connected for user ${userId}. Founder Post ${postId} saved as published (no social push).`);
        }
      } catch (pubErr: any) {
        console.error(`[Publish Engine] LinkedIn auto-publish failed for founder post ${postId}:`, pubErr);
        postDoc.status = 'failed';
        (postDoc as any).publishError = pubErr.message || String(pubErr);
        await db.collection('users').doc(userId).collection('founder_posts').doc(postId).set(postDoc, { merge: true });
      }
    } else {
      console.warn(`[Publish Engine] Founder post missing userId. Skipping publish.`);
    }
  }
}

