import path from 'path';
import fs from 'fs/promises';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../config/firebase';

const PLATFORMS = ["linkedin", "x", "instagram", "reddit"] as const;
export type ResearchPlatform = (typeof PLATFORMS)[number];

const ITEMS_PER_PLATFORM = 25; // 4 x 25 = 100
const PRIMARY_MODEL = "gemini-3.1-pro-preview";
const FALLBACK_MODEL = "gemini-2.5-pro";

const PLATFORM_RESEARCH_FOCUS: Record<ResearchPlatform, string> = {
  linkedin:
    "square multi-page document carousels, data-led single-image infographic frames, and exec-quote visual overlays",
  x: "1:1 text-image pairings, quote-card mechanics, single-stat layout containers, and product screenshot wrappers that feel application-native",
  instagram:
    "micro-copy slide frameworks (15-20 words max per slide), edge-bleed panoramic canvas transitions, and minimal-premium hierarchies restricted to 1:1 boxes",
  reddit:
    "subreddit-native formatting mechanics, system-font mimicking layouts, and raw conversational containers that reject visual polish",
};

const blueprintItemSchema = {
  type: Type.OBJECT,
  properties: {
    blueprint_id: { type: Type.STRING },
    platform: { type: Type.STRING, enum: [...PLATFORMS] },
    content_intent: { type: Type.STRING },
    ideal_text_length: { type: Type.STRING, enum: ["short", "medium", "long"] },
    composition_archetype: { type: Type.STRING },
    grid_layout_axis: { type: Type.STRING },
    negative_space_description: { type: Type.STRING },
    typography_rules: {
      type: Type.OBJECT,
      properties: {
        heading_font_size: { type: Type.STRING },
        heading_line_height: { type: Type.STRING },
        heading_font_weight: { type: Type.STRING },
      },
      required: ["heading_font_size", "heading_line_height", "heading_font_weight"],
    },
    cultural_justification: { type: Type.STRING },
  },
  required: [
    "blueprint_id",
    "platform",
    "content_intent",
    "ideal_text_length",
    "composition_archetype",
    "grid_layout_axis",
    "negative_space_description",
    "typography_rules",
    "cultural_justification",
  ],
};

export function descriptorOf(item: any): string {
  return `${item.composition_archetype} | ${item.grid_layout_axis}`;
}

export async function researchPlatform(ai: any, platform: ResearchPlatform): Promise<string> {
  const prompt = `
Using live Google Search, research how real, verified corporate/brand B2B and SMB
accounts on ${platform.toUpperCase()} have visually structured their posts in the
last 60-90 days.

Focus areas: ${PLATFORM_RESEARCH_FOCUS[platform]}.

Bypass Canva template packs, Envato/Creative Market, stock marketplaces, and
generic SEO listicles ("use white space", "bold typography") as low-value
signal -- if a search surfaces these, redirect toward real brand post
teardowns, performance audits, or design breakdowns instead. Focus on
corporate/brand-authored accounts, not personal founder or influencer accounts.

Find at least ${ITEMS_PER_PLATFORM} examples that are each STRUCTURALLY
DISTINCT from one another -- different grid ratios, different padding /
negative-space logic, different typographic weight or size choices, different
text-length strategies. Prioritize structural diversity over hitting a round
number; it's fine to describe fewer examples in more structural depth.

For each example, write 2-4 sentences of plain prose covering:
- the specific real pattern you found (describe the mechanic itself if the
  source doesn't name a specific brand)
- the exact structural mechanic (grid ratio, padding %, alignment, approx.
  text length in words)
- typography choices (approximate size / weight / line-height if inferable)
- why this mechanic performs well on ${platform} specifically

Write this as a numbered list of research notes in plain prose. Do NOT format
as JSON.
`.trim();

  const call = (model: string) =>
    ai.models.generateContent({
      model,
      contents: [{ text: prompt }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 1.0,
        maxOutputTokens: 8192,
      },
    });

  let response;
  try {
    response = await call(PRIMARY_MODEL);
  } catch (err: any) {
    console.warn(`[Research][${platform}] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, err.message);
    response = await call(FALLBACK_MODEL);
  }

  const grounding = (response as any)?.candidates?.[0]?.groundingMetadata;
  const queryCount = grounding?.webSearchQueries?.length ?? 0;
  console.log(`[Grounding Research][Phase A][${platform}] executed ${queryCount} live search queries.`);
  if (queryCount === 0) {
    console.warn(`[Grounding Research][Phase A][${platform}] WARNING: zero search queries detected -- this platform's notes may not be grounded.`);
  }

  return response.text || "";
}

export async function structurePlatform(
  ai: any,
  platform: ResearchPlatform,
  researchNotes: string,
  alreadyUsedDescriptors: string[],
  startIndex: number
): Promise<any[]> {
  if (!researchNotes || !researchNotes.trim()) {
    console.warn(`[Structure][${platform}] Research notes empty, returning empty array.`);
    return [];
  }

  const avoidBlock = alreadyUsedDescriptors.length
    ? `\nThese composition_archetype / grid_layout_axis combinations are ALREADY USED elsewhere in this dataset. Do not repeat them -- use genuinely different mechanics:\n${alreadyUsedDescriptors
      .slice(-30)
      .map((d) => `- ${d}`)
      .join("\n")}\n`
    : "";

  const prompt = `
Convert the following real, grounded research notes into structured layout
blueprint records for platform "${platform}".

RESEARCH NOTES:
"""
${researchNotes}
"""
${avoidBlock}
Produce exactly ${ITEMS_PER_PLATFORM} objects. Each object must be grounded in
a DIFFERENT note above -- do not invent generic filler beyond what the notes
support, and do not let two objects share the same composition_archetype,
grid_layout_axis, or typography_rules combination.

blueprint_id must run from "blueprint_${String(startIndex).padStart(3, "0")}"
through "blueprint_${String(startIndex + ITEMS_PER_PLATFORM - 1).padStart(3, "0")}".

cultural_justification must reflect the actual reasoning present in the notes
above, not generic marketing language.
`.trim();

  const call = (model: string) =>
    ai.models.generateContent({
      model,
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: blueprintItemSchema },
        temperature: 0.95,
        maxOutputTokens: 8192,
      },
    });

  let response: any;
  try {
    response = await call(PRIMARY_MODEL);
  } catch (err: any) {
    console.warn(`[Structure][${platform}] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, err.message);
    try {
      response = await call(FALLBACK_MODEL);
    } catch (fallbackErr: any) {
      console.error(`[Structure][${platform}] Fallback model also failed:`, fallbackErr.message);
      throw new Error(`Structure platform '${platform}' failed on both models: ${fallbackErr.message}`);
    }
  }

  const rawText = response?.text || "";
  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.blueprints)) return parsed.blueprints;
    return [parsed];
  } catch (parseErr: any) {
    console.error(`[Structure][${platform}] JSON.parse failed. Raw text length: ${rawText.length}`);
    const match = rawText.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        console.error(`[Structure][${platform}] Regex JSON parse also failed.`);
      }
    }
    throw new Error(`Failed to parse JSON response for platform '${platform}': ${parseErr.message}`);
  }
}

export async function getSavedChannelTemplates(channel: string = 'linkedin') {
  const outputDir = path.join(process.cwd(), 'output_templates');
  const fileNames = [
    `${channel}_templates_60.json`,
    `${channel}_templates_20.json`,
    `${channel}_templates.json`,
    'master_templates_60.json',
    'master_templates.json'
  ];

  for (const fileName of fileNames) {
    const filePath = path.join(outputDir, fileName);
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      const templates = JSON.parse(fileData);
      if (Array.isArray(templates) && templates.length > 0) {
        return { channel, count: templates.length, templates };
      }
    } catch (e) { }
  }

  if (db) {
    try {
      const snapshot = await db.collection(`${channel}_templates`).get();
      const templates = snapshot.docs.map(doc => doc.data());
      if (templates.length > 0) {
        return { channel, count: templates.length, templates };
      }
    } catch (e) { }
  }

  return { channel, count: 0, templates: [] };
}

export async function researchChannelTemplates(channel: string = 'linkedin', count: number = 8, niche: string = 'B2B SaaS & Tech Leadership') {
  console.log(`[Channel Research] Initiating live template discovery for channel "${channel.toUpperCase()}" (${count} templates)...`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const currentDate = new Date().toISOString().split('T')[0];

  // Phase 1: Live Grounded Search on Channel Trends
  let groundingNotes = "";
  try {
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{
        text: `Today's date is ${currentDate}. Perform live web searches for top-performing corporate B2B and SMB post visual layouts on ${channel.toUpperCase()} in the niche: "${niche}".
Focus areas for ${channel.toUpperCase()}:
- Carousels, multi-slide document covers, infographic frames, quote cards, data billboard callouts, and product teardowns.
- Bypass Canva generic listicles, Envato stock placeholders, and personal founder selfies.
- Identify 4-6 distinct, high-converting visual layout structures used by verified business accounts.`
      }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    groundingNotes = searchRes.text || "";
  } catch (err: any) {
    console.warn(`[Channel Research][${channel}] Grounded search notice:`, err.message);
    groundingNotes = `High-contrast B2B corporate cards, split pane infographics, executive quote frames, and dark-mode data billboards.`;
  }

  // Phase 2: HTML/CSS Template Code Synthesis
  const timestamp = Date.now();
  const synthesisPrompt = `You are a world-class senior brand visual director and HTML/CSS template architect.
Today's date is ${currentDate}.

Grounded Market Insights for ${channel.toUpperCase()}:
${groundingNotes}

Synthesize EXACTLY ${count} COMPLETELY DISTINCT, HIGH-AESTHETIC visual post templates for ${channel.toUpperCase()}.
Each template MUST have a unique ID using format "template-${channel}-${timestamp}-1", "template-${channel}-${timestamp}-2", etc.

CRITICAL DESIGN & CODE REQUIREMENTS:
1. "rawHtml" MUST contain full 1080x1080px HTML/CSS code using INLINE STYLES.
2. Must use these EXACT placeholders inside the HTML code:
   - {{HEADLINE}}
   - {{SUBTEXT}}
   - {{IMAGE_URL}}
   - {{LOGO_URL}}
   - {{PRIMARY_COLOR}}
   - {{SECONDARY_COLOR}}
   - {{ACCENT_COLOR}}
   - {{FONT_FAMILY}}
3. MUST USE {{SECONDARY_COLOR}} for main canvas background-color (or {{PRIMARY_COLOR}} for hero/billboard cards). Use {{ACCENT_COLOR}} for vibrant highlights, badges, and contrasting visual elements. NEVER hardcode background hex codes like #08080C or #0F172A. All template colors MUST be driven dynamically by {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}, and {{ACCENT_COLOR}}.
4. Flexible flexbox / grid layout. Text MUST NEVER overlap. Safe line-heights (1.2+). Word wrap enabled.
5. High-end $10k/mo designer aesthetic: sleek borders, subtle gradients, clean typography hierarchy. No cheap sparkle icons or low-quality stock mockups.
`;

  const channelTemplateSchema = {
    type: Type.OBJECT,
    properties: {
      channel: { type: Type.STRING },
      summary: { type: Type.STRING },
      templates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            channel: { type: Type.STRING },
            archetype: { type: Type.STRING },
            viralityScore: { type: Type.STRING },
            sourceTrend: { type: Type.STRING },
            whyViral: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            rawHtml: { type: Type.STRING }
          },
          required: ["id", "name", "archetype", "whyViral", "rawHtml"]
        }
      }
    },
    required: ["summary", "templates"]
  };

  const synthRes = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ text: synthesisPrompt }],
    config: {
      responseMimeType: "application/json",
      responseSchema: channelTemplateSchema,
      temperature: 0.95,
      maxOutputTokens: 65536
    }
  });

  const rawText = synthRes.text || "{}";
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsedData = JSON.parse(cleaned);

  const templates = parsedData.templates || [];

  // Local Save
  const outputDir = path.join(process.cwd(), 'output_templates');
  await fs.mkdir(outputDir, { recursive: true });
  const jsonFileName = `${channel}_templates_${templates.length || count}.json`;
  await fs.writeFile(path.join(outputDir, jsonFileName), JSON.stringify(templates, null, 2), 'utf-8');

  // Firestore DB Save
  let dbSavedCount = 0;
  if (db) {
    try {
      const batch = db.batch();
      for (const t of templates) {
        const docRef = db.collection(`${channel}_templates`).doc(t.id);
        batch.set(docRef, { ...t, channel, updatedAt: new Date().toISOString() }, { merge: true });
        const universalRef = db.collection('campaign_visual_templates').doc(t.id);
        batch.set(universalRef, { ...t, channel, updatedAt: new Date().toISOString() }, { merge: true });
      }
      await batch.commit();
      dbSavedCount = templates.length;
    } catch (dbErr: any) {
      console.warn(`[Channel Research] Firestore DB save skipped/timed out (${dbErr.message}). Local files saved successfully.`);
    }
  }

  return {
    channel,
    summary: parsedData.summary || `Extracted ${templates.length} live ${channel} templates.`,
    count: templates.length,
    localPath: `./output_templates/${jsonFileName}`,
    dbCollection: "campaign_visual_templates",
    dbSavedCount,
    templates
  };
}

export async function getSavedBlueprints() {
  const localFilePath = path.join(process.cwd(), 'output_templates', 'researched_blueprints_100.json');
  try {
    const fileData = await fs.readFile(localFilePath, 'utf-8');
    const blueprints = JSON.parse(fileData);
    return { count: blueprints.length, blueprints };
  } catch (fileErr) {
    if (db) {
      const snapshot = await db.collection('layout_blueprints').get();
      const blueprints = snapshot.docs.map(doc => doc.data());
      if (blueprints.length > 0) {
        return { count: blueprints.length, blueprints };
      }
    }
    return { count: 0, blueprints: [] };
  }
}

export async function saveBlueprints(blueprintsToSave: any[]) {
  console.log(`[Grounding Research] Persisting ${blueprintsToSave.length} total blueprints...`);

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const item of blueprintsToSave) {
    const key = descriptorOf(item).toLowerCase();
    if (seen.has(key)) duplicateIds.push(item.blueprint_id);
    seen.add(key);
  }

  const outputDir = path.join(process.cwd(), 'output_templates');
  await fs.mkdir(outputDir, { recursive: true });
  const localFilePath = path.join(outputDir, 'researched_blueprints_100.json');
  await fs.writeFile(localFilePath, JSON.stringify(blueprintsToSave, null, 2), 'utf-8');

  let dbSavedCount = 0;
  if (db) {
    try {
      const batchSize = 50;
      for (let i = 0; i < blueprintsToSave.length; i += batchSize) {
        const chunk = blueprintsToSave.slice(i, i + batchSize);
        const batch = db.batch();
        for (let j = 0; j < chunk.length; j++) {
          const item = chunk[j];
          const docId = item.blueprint_id || `blueprint_${String(i + j + 1).padStart(3, '0')}`;
          const docRef = db.collection('layout_blueprints').doc(docId);
          batch.set(docRef, {
            ...item,
            blueprint_id: docId,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
        await batch.commit();
        dbSavedCount += chunk.length;
      }
    } catch (dbErr: any) {
      console.error("[Grounding Research] DB save error:", dbErr);
    }
  }

  return {
    count: blueprintsToSave.length,
    duplicatesDetected: duplicateIds.length,
    localPath: "./output_templates/researched_blueprints_100.json",
    dbCollection: "layout_blueprints",
    dbSavedCount,
    blueprints: blueprintsToSave
  };
}

export async function researchPlatformBatch(platform: ResearchPlatform, usedDescriptors: string[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const startIndexMap: Record<ResearchPlatform, number> = {
    linkedin: 1,
    x: 26,
    instagram: 51,
    reddit: 76
  };
  const startIndex = startIndexMap[platform] || 1;

  console.log(`[Grounding Research Batch] Phase A: Researching ${platform}...`);
  const researchNotes = await researchPlatform(ai, platform);

  console.log(`[Grounding Research Batch] Phase B: Structuring 25 blueprints for ${platform}...`);
  const items = await structurePlatform(ai, platform, researchNotes, usedDescriptors, startIndex);

  return {
    platform,
    count: items.length,
    blueprints: items
  };
}

export async function researchAllBlueprints() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log("[Grounding Research] Starting full multi-channel blueprint research operation...");
  const researchNotesByPlatform = await Promise.all(
    PLATFORMS.map((p) => researchPlatform(ai, p))
  );

  let blueprints: any[] = [];
  let accumulatedDescriptors: string[] = [];
  let cursor = 1;

  for (let i = 0; i < PLATFORMS.length; i++) {
    const p = PLATFORMS[i];
    const items = await structurePlatform(ai, p, researchNotesByPlatform[i], accumulatedDescriptors, cursor);
    blueprints = blueprints.concat(items);
    accumulatedDescriptors = accumulatedDescriptors.concat(items.map(descriptorOf));
    cursor += ITEMS_PER_PLATFORM;
  }

  const saved = await saveBlueprints(blueprints);
  return saved;
}
