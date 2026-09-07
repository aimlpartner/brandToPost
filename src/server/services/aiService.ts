import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../config/firebase';
import {
  saveImageLocalAndDb,
  stampBrandLogoOnImage,
  generateFallbackBrandedCanvas,
} from '../utils/imageUtils';

export function translateBrandDNA(
  brandColors?: string[],
  fontStyle?: string
): { colorDescriptor: string; typographyDescriptor: string } {
  const colors =
    brandColors && Array.isArray(brandColors) && brandColors.length > 0
      ? brandColors
      : ['#08080C', '#FAF9F6', '#3B82F6'];

  const colorDescriptions = colors.map((c) => {
    const colorStr = String(c).trim().toLowerCase();
    if (colorStr.includes('08080c') || colorStr.includes('black') || colorStr.includes('000') || colorStr.includes('121212')) {
      return `sleek obsidian black (${c}) with deep charcoal matte shadows and cinematic contrast`;
    }
    if (colorStr.includes('faf9f6') || colorStr.includes('white') || colorStr.includes('fff') || colorStr.includes('cream')) {
      return `warm architectural off-white (${c}) with clean ceramic highlights`;
    }
    if (colorStr.includes('3b82f6') || colorStr.includes('blue') || colorStr.includes('2563eb') || colorStr.includes('60a5fa')) {
      return `vibrant electric sapphire blue (${c}) with subtle neon azure rim lighting`;
    }
    if (colorStr.includes('violet') || colorStr.includes('purple') || colorStr.includes('8b5cf6') || colorStr.includes('7c3aed')) {
      return `luminous ultraviolet (${c}) with gradient silk reflections`;
    }
    if (colorStr.includes('green') || colorStr.includes('10b981') || colorStr.includes('emerald') || colorStr.includes('teal')) {
      return `crisp emerald green (${c}) with bioluminescent accents`;
    }
    if (colorStr.includes('red') || colorStr.includes('orange') || colorStr.includes('amber') || colorStr.includes('coral')) {
      return `warm energetic coral-amber (${c}) with vivid golden radiance`;
    }
    return `curated brand accent color ${c} integrated with sleek editorial lighting harmony`;
  });

  const colorDescriptor = colorDescriptions.join(' paired with ');

  const font = (fontStyle || 'Inter Tight, bold modern sans-serif').trim().toLowerCase();
  let typographyDescriptor = `crisp architectural geometric sans-serif typography with high editorial contrast, razor-sharp letterforms, and executive spacing`;
  if (font.includes('serif') && !font.includes('sans')) {
    typographyDescriptor = `timeless luxury editorial serif typography with refined ligatures and sophisticated kerning`;
  } else if (font.includes('mono')) {
    typographyDescriptor = `sleek engineering monospace typography with precision-crafted tech aesthetics`;
  } else if (fontStyle) {
    typographyDescriptor = `executive editorial typography styled after ${fontStyle} with razor-sharp legibility and museum-grade typographic hierarchy`;
  }

  return { colorDescriptor, typographyDescriptor };
}

export async function executeOpenAIImageGeneration(
  openaiApiKey: string,
  prompt: string,
  modelPref?: string,
  qualityPref?: string
): Promise<string | null> {
  const modelsToTry: string[] = [];
  const configuredModel = modelPref || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  if (configuredModel && !modelsToTry.includes(configuredModel)) modelsToTry.push(configuredModel);
  if (!modelsToTry.includes('gpt-image-2')) modelsToTry.push('gpt-image-2');
  if (!modelsToTry.includes('dall-e-3')) modelsToTry.push('dall-e-3');

  for (const modelName of modelsToTry) {
    try {
      const payload: any = {
        model: modelName,
        prompt: prompt.substring(0, 3500),
        n: 1,
        size: '1024x1024'
      };
      if (modelName.startsWith('dall-e')) {
        payload.response_format = 'b64_json';
        payload.quality = qualityPref || 'standard';
      }

      console.log(`[executeOpenAIImageGeneration] Attempting generation with model: ${modelName}...`);
      const genRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (genRes.ok) {
        const genData = await genRes.json();
        if (genData?.data?.[0]?.b64_json) {
          console.log(`[executeOpenAIImageGeneration] Successfully generated b64_json using model: ${modelName}`);
          return genData.data[0].b64_json;
        } else if (genData?.data?.[0]?.url) {
          console.log(`[executeOpenAIImageGeneration] Successfully generated image URL using model: ${modelName}, fetching buffer...`);
          const imgFetch = await fetch(genData.data[0].url);
          const buf = await imgFetch.arrayBuffer();
          return Buffer.from(buf).toString('base64');
        }
      } else {
        const errTxt = await genRes.text();
        console.warn(`[executeOpenAIImageGeneration] Model ${modelName} failed HTTP ${genRes.status}:`, errTxt);
      }
    } catch (e: any) {
      console.warn(`[executeOpenAIImageGeneration] Model ${modelName} exception:`, e.message || e);
    }
  }
  return null;
}

export async function generateSingleCampaignImageBackend(
  item: any,
  logoUrl?: string
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const openaiModel = rawModel;
  const rawQuality = process.env.OPENAI_IMAGE_QUALITY || 'standard';
  const openaiQuality = rawQuality;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const promptText = typeof item === 'string' ? item : item?.prompt || `High quality editorial photographic visual`;
  const headline = typeof item === 'object' ? item.headline : undefined;
  const subtext = typeof item === 'object' ? item.subtext : undefined;
  const brandColors = typeof item === 'object' && Array.isArray(item.brandColors) ? item.brandColors : undefined;
  const fontStyle = typeof item === 'object' ? item.fontStyle : undefined;
  const brandAssetUrl = typeof item === 'object' ? item.brandAssetUrl : undefined;
  const logoPosition = typeof item === 'object' && item.logoPosition ? item.logoPosition : 'top-left';

  let base64Data: string | null = null;
  const mimeType = 'image/png';

  if (openaiApiKey) {
    try {
      const { colorDescriptor, typographyDescriptor } = translateBrandDNA(brandColors, fontStyle);
      let formattedPrompt = `1:1 ratio square editorial visual post.\n`;
      if (promptText) formattedPrompt += `VISUAL SUBJECT & CONCEPT DESCRIPTION: ${promptText}\n`;
      if (headline) formattedPrompt += `HEADLINE TEXT TO DISPLAY: "${headline}"\n`;
      if (subtext) formattedPrompt += `SUBTEXT/BODY COPY: "${subtext}"\n`;
      formattedPrompt += `VIVID BRAND COLOR & LIGHTING HARMONY: ${colorDescriptor}\n`;
      formattedPrompt += `VISUAL TYPOGRAPHY DESIGN: ${typographyDescriptor}\n`;

      const pos = logoPosition.toLowerCase().trim();
      let spatialRule = `LAYOUT CONSTRAINT: Keep top-left corner (top 20% height, left 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
      if (pos === 'top-right') {
        spatialRule = `LAYOUT CONSTRAINT: Keep top-right corner (top 20% height, right 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
      } else if (pos === 'bottom-left') {
        spatialRule = `LAYOUT CONSTRAINT: Keep bottom-left corner (bottom 20% height, left 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
      } else if (pos === 'bottom-right') {
        spatialRule = `LAYOUT CONSTRAINT: Keep bottom-right corner (bottom 20% height, right 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
      }
      formattedPrompt += spatialRule;
      formattedPrompt += `INSTRUCTIONS: Render crisp, perfectly legible headline & subtext with high-end modern B2B editorial typography. Place text cleanly outside the reserved logo area. Use executive visual aesthetics. No extraneous text.`;

      if (brandAssetUrl && (brandAssetUrl.startsWith('http://') || brandAssetUrl.startsWith('https://') || brandAssetUrl.startsWith('data:image/'))) {
        try {
          let assetBuf: Buffer;
          if (brandAssetUrl.startsWith('data:image/')) {
            assetBuf = Buffer.from(brandAssetUrl.split(',')[1], 'base64');
          } else {
            const fetchAsset = await fetch(brandAssetUrl);
            assetBuf = Buffer.from(await fetchAsset.arrayBuffer());
          }

          const formData = new FormData();
          const blob = new Blob([assetBuf], { type: 'image/png' });
          formData.append('image', blob, 'source.png');
          formData.append('prompt', formattedPrompt);
          formData.append('model', openaiModel);
          if (openaiModel === 'dall-e-3') {
            formData.append('quality', openaiQuality);
          } else {
            formData.append('response_format', 'b64_json');
          }
          formData.append('n', '1');
          formData.append('size', '1024x1024');

          const editRes = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openaiApiKey}`
            },
            body: formData
          });

          if (editRes.ok) {
            const editData = await editRes.json();
            if (editData?.data?.[0]?.b64_json) {
              base64Data = editData.data[0].b64_json;
            } else if (editData?.data?.[0]?.url) {
              const imgFetch = await fetch(editData.data[0].url);
              const buf = await imgFetch.arrayBuffer();
              base64Data = Buffer.from(buf).toString('base64');
            }
          } else {
            const errTxt = await editRes.text();
            console.error(`[generateSingleCampaignImageBackend] OpenAI Edit API failed HTTP ${editRes.status}:`, errTxt);
          }
        } catch (editErr) {
          console.error('[generateSingleCampaignImageBackend] OpenAI Edit exception:', editErr);
        }
      }

      if (!base64Data) {
        base64Data = await executeOpenAIImageGeneration(openaiApiKey, formattedPrompt, openaiModel, openaiQuality);
      }
    } catch (oaiErr) {
      console.warn('[generateSingleCampaignImageBackend] OpenAI generation error:', oaiErr);
    }
  }

  // Fallback to Gemini Imagen if OpenAI was not configured or failed
  if (!base64Data && geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const fallbackPrompt = `${headline ? `Text headline: ${headline}. ` : ''}${promptText}`;
      const imgRes = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: fallbackPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/png'
        }
      });

      if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
        base64Data = imgRes.generatedImages[0].image.imageBytes;
      }
    } catch (gErr) {
      console.warn('[generateSingleCampaignImageBackend] Gemini Imagen fallback error:', gErr);
    }
  }

  if (base64Data) {
    const stampedBase64 = await stampBrandLogoOnImage(base64Data, logoUrl, logoPosition);
    const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
    await saveImageLocalAndDb(imageId, stampedBase64, mimeType, promptText);
    return `/api/campaign/images/${imageId}.png`;
  }

  return generateFallbackBrandedCanvas(
    headline || promptText,
    subtext || '',
    brandColors?.[0] || '#7C3AED',
    brandColors?.[1] || '#08080C',
    logoUrl
  );
}

export async function generateCampaignImagesService(
  prompts: any[],
  logoUrl?: string,
  defaultLogoPosition?: string
): Promise<string[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const openaiModel = rawModel;
  const rawQuality = process.env.OPENAI_IMAGE_QUALITY || 'standard';
  const openaiQuality = rawQuality;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const imageUrls: string[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    const promptText = typeof item === 'string' ? item : item?.prompt || `High quality editorial photographic visual #${i + 1}`;
    const headline = typeof item === 'object' ? item.headline : undefined;
    const subtext = typeof item === 'object' ? item.subtext : undefined;
    const brandColors = typeof item === 'object' && Array.isArray(item.brandColors) ? item.brandColors : undefined;
    const fontStyle = typeof item === 'object' ? item.fontStyle : undefined;
    const brandAssetUrl = typeof item === 'object' ? item.brandAssetUrl : undefined;
    const logoPosition = typeof item === 'object' && item.logoPosition ? item.logoPosition : (defaultLogoPosition || 'top-left');

    let base64Data: string | null = null;
    const mimeType = 'image/png';

    if (openaiApiKey) {
      try {
        const { colorDescriptor, typographyDescriptor } = translateBrandDNA(brandColors, fontStyle);
        let formattedPrompt = `1:1 ratio square editorial visual post.\n`;
        if (promptText) formattedPrompt += `VISUAL SUBJECT & CONCEPT DESCRIPTION: ${promptText}\n`;
        if (headline) formattedPrompt += `HEADLINE TEXT TO DISPLAY: "${headline}"\n`;
        if (subtext) formattedPrompt += `SUBTEXT/BODY COPY: "${subtext}"\n`;
        formattedPrompt += `VIVID BRAND COLOR & LIGHTING HARMONY: ${colorDescriptor}\n`;
        formattedPrompt += `VISUAL TYPOGRAPHY DESIGN: ${typographyDescriptor}\n`;

        const pos = logoPosition.toLowerCase().trim();
        let spatialRule = `LAYOUT CONSTRAINT: Keep top-left corner (top 20% height, left 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
        if (pos === 'top-right') {
          spatialRule = `LAYOUT CONSTRAINT: Keep top-right corner (top 20% height, right 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
        } else if (pos === 'bottom-left') {
          spatialRule = `LAYOUT CONSTRAINT: Keep bottom-left corner (bottom 20% height, left 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
        } else if (pos === 'bottom-right') {
          spatialRule = `LAYOUT CONSTRAINT: Keep bottom-right corner (bottom 20% height, right 30% width) completely empty and free of headlines, body text, or graphic overlays for brand logo placement.\n`;
        }
        formattedPrompt += spatialRule;
        formattedPrompt += `INSTRUCTIONS: Render crisp, perfectly legible headline & subtext with high-end modern B2B editorial typography. Place text cleanly outside the reserved logo area. Use executive visual aesthetics. No extraneous text.`;

        if (brandAssetUrl && (brandAssetUrl.startsWith('http://') || brandAssetUrl.startsWith('https://') || brandAssetUrl.startsWith('data:image/'))) {
          try {
            let assetBuf: Buffer;
            if (brandAssetUrl.startsWith('data:image/')) {
              assetBuf = Buffer.from(brandAssetUrl.split(',')[1], 'base64');
            } else {
              const fetchAsset = await fetch(brandAssetUrl);
              assetBuf = Buffer.from(await fetchAsset.arrayBuffer());
            }

            const formData = new FormData();
            const blob = new Blob([assetBuf], { type: 'image/png' });
            formData.append('image', blob, 'source.png');
            formData.append('prompt', formattedPrompt);
            formData.append('model', openaiModel);
            if (openaiModel.startsWith('gpt-image')) {
              formData.append('quality', openaiQuality);
            } else {
              formData.append('response_format', 'b64_json');
            }
            formData.append('n', '1');
            formData.append('size', '1024x1024');

            const editRes = await fetch('https://api.openai.com/v1/images/edits', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`
              },
              body: formData
            });

            if (editRes.ok) {
              const editData = await editRes.json();
              if (editData?.data?.[0]?.b64_json) {
                base64Data = editData.data[0].b64_json;
              }
            } else {
              const errTxt = await editRes.text();
              console.error(`[generate-campaign-images] OpenAI Edit API failed HTTP ${editRes.status}:`, errTxt);
            }
          } catch (editErr) {
            console.error('[generate-campaign-images] OpenAI Edit exception:', editErr);
          }
        }

        if (!base64Data) {
          base64Data = await executeOpenAIImageGeneration(openaiApiKey, formattedPrompt, openaiModel, openaiQuality);
        }
      } catch (oaiErr) {
        console.error('[generate-campaign-images] OpenAI generation error:', oaiErr);
      }
    }

    if (!base64Data && geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const fallbackPrompt = `${headline ? `Text headline: ${headline}. ` : ''}${promptText}`;
        const imgRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-001',
          prompt: fallbackPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/png'
          }
        });

        if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
          base64Data = imgRes.generatedImages[0].image.imageBytes;
        }
      } catch (gErr) {
        console.warn('[generate-campaign-images] Gemini Imagen fallback error:', gErr);
      }
    }

    let generatedUrl: string | null = null;
    if (base64Data) {
      const stampedBase64 = await stampBrandLogoOnImage(base64Data, logoUrl, logoPosition);
      const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
      await saveImageLocalAndDb(imageId, stampedBase64, mimeType, promptText);
      generatedUrl = `/api/whatsapp/images/${imageId}.png`;
    }

    imageUrls.push(
      generatedUrl ||
        generateFallbackBrandedCanvas(
          headline || promptText,
          subtext || '',
          brandColors?.[0] || '#7C3AED',
          brandColors?.[1] || '#08080C',
          logoUrl
        )
    );
  }

  return imageUrls;
}

export async function generateAiContentService(params: {
  model: string;
  contents: any;
  config?: any;
  abortSignal?: AbortSignal;
}): Promise<{ text: string | undefined; usageMetadata: any; candidates: any }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Server API key not configured. Please configure GEMINI_API_KEY in the server environment.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: params.model,
    contents: params.contents,
    config: {
      ...params.config,
      abortSignal: params.abortSignal
    }
  });

  return {
    text: response.text,
    usageMetadata: response.usageMetadata,
    candidates: response.candidates
  };
}

export async function researchTrendsService(
  focusNiche?: string,
  singleStyle?: boolean,
  userId?: string
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Server API key not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const FOCUS_NICHES = [
    'AI agent tooling & B2B SaaS',
    'developer tools & cloud infrastructure',
    'fractional executives & high-ticket B2B consulting',
    'fintech B2B & enterprise software',
    'creator-economy marketplaces & growth platforms',
    'hiring & HR tech platforms',
    'healthcare software & biotech SaaS'
  ];
  const nicheLens = focusNiche || FOCUS_NICHES[Math.floor(Math.random() * FOCUS_NICHES.length)];
  const currentDate = new Date().toISOString().split('T')[0];

  let groundingResearchText = '';
  try {
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{
        text: singleStyle
          ? `Today's date is ${currentDate}. Perform a live web search on LinkedIn and X for recent viral B2B founder posts in: "${nicheLens}".
Identify 1 SINGLE active, high-converting visual layout composition trend or visual aesthetic ("like how they look").
Explain its lighting, contrast, typography hierarchy, and negative space composition.`
          : `Today's date is ${currentDate}. Perform live web searches on LinkedIn and X for recent viral B2B posts in: "${nicheLens}".
Identify 3 to 5 active, rising visual layout structures, graphic compositions, typography trends, and contrast patterns being used by top founders and accounts.
Explain why each layout is converting.`
      }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    groundingResearchText = searchRes.text || '';
  } catch (searchErr: any) {
    console.warn(`[researchTrendsService] Grounding search error (${searchErr.message}). Continuing with core synthesis...`);
    groundingResearchText = singleStyle
      ? `High-contrast B2B founder editorial visual with executive dark-mode lighting, minimal modern typography, and structured negative space.`
      : `Focus on high-contrast B2B founder visual cards, split panels, dark-mode callout boxes, minimal typography, and metric billboards.`;
  }

  const timestamp = Date.now();
  const synthesisPrompt = singleStyle
    ? `You are a world-class senior brand systems designer and B2B visual director.
Today's date is ${currentDate}.

Live Grounded Market Trend Research for "${nicheLens}":
${groundingResearchText}

Based on this grounded research, synthesize 1 SINGLE high-converting B2B founder visual trend aesthetic ("like how they look").
Your output MUST contain an array "discoveredTemplates" with EXACTLY 1 object describing this single visual trend.
The object MUST contain "visualStylePrompt" which provides detailed artistic, lighting, contrast, and layout composition instructions for generating a 1:1 editorial graphic via AI image models (e.g. GPT-2 Image / OpenAI / Imagen).
Do NOT write HTML or CSS in visualStylePrompt. Focus on how the visual looks: composition, backdrop mood, executive aesthetic, lighting, and visual hierarchy.
For "rawHtml", provide a simple minimal fallback string: "<div style='background:#08080C;color:#fff;padding:60px;'>AI Generated Visual</div>".`
    : `You are a world-class senior brand systems designer and B2B visual director.
Today's date is ${currentDate}.

Live Grounded Market Trend Research for "${nicheLens}":
${groundingResearchText}

Based on these grounded insights, synthesize 4 to 6 COMPLETELY ORIGINAL, DISTINCT visual templates.
Each template MUST have a unique ID using format "dynamic-${timestamp}-1", "dynamic-${timestamp}-2", etc. (Do NOT use 'editorial-left' or static prebuilt names).
Each template MUST provide full 1080x1080px HTML/CSS code inside "rawHtml" using inline styles and placeholders:
{{HEADLINE}}, {{SUBTEXT}}, {{IMAGE_URL}}, {{LOGO_URL}}, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}, {{FONT_FAMILY}}.

CRITICAL DESIGN RULES:
1. Every template must look like a high-end $10k/mo designer built it.
2. Pitch-black dark mode (#08080C) or warm off-white (#FAF9F6) backgrounds.
3. Clean flexbox layout, strong visual contrast, and high-impact typography.
4. No generic AI slop: no rounded pill badges, no giant quote marks, no stock photo laptop mockups.`;

  const visualTrendSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      viralPick: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          viralityScore: { type: Type.STRING },
          whyViral: { type: Type.STRING }
        },
        required: ['name', 'viralityScore', 'whyViral']
      },
      discoveredTemplates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            sourceTrend: { type: Type.STRING },
            evidenceRef: { type: Type.STRING },
            signatureDetail: { type: Type.STRING },
            visualStylePrompt: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            fontFamily: { type: Type.STRING },
            viralityScore: { type: Type.STRING },
            whyViral: { type: Type.STRING },
            isLightBg: { type: Type.BOOLEAN },
            rawHtml: { type: Type.STRING }
          },
          required: ['id', 'name', 'primaryColor', 'secondaryColor', 'fontFamily', 'isLightBg', 'rawHtml']
        }
      }
    },
    required: ['summary', 'viralPick', 'discoveredTemplates']
  };

  const synthesisRes = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [{ text: synthesisPrompt }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: visualTrendSchema
    }
  });

  const responseText = synthesisRes.text || '{}';
  const parsedData = JSON.parse(responseText);

  if (!Array.isArray(parsedData.discoveredTemplates) || parsedData.discoveredTemplates.length === 0) {
    const aliasKeys = ['trends', 'templates', 'visualTemplates', 'discoveredTrends', 'visualTrends', 'items', 'layouts'];
    for (const alias of aliasKeys) {
      if (Array.isArray(parsedData[alias]) && parsedData[alias].length > 0) {
        parsedData.discoveredTemplates = parsedData[alias];
        delete parsedData[alias];
        break;
      }
    }
    if (!Array.isArray(parsedData.discoveredTemplates) || parsedData.discoveredTemplates.length === 0) {
      for (const key of Object.keys(parsedData)) {
        if (Array.isArray(parsedData[key]) && parsedData[key].length > 0 && (parsedData[key][0]?.rawHtml || parsedData[key][0]?.visualStylePrompt)) {
          parsedData.discoveredTemplates = parsedData[key];
          delete parsedData[key];
          break;
        }
      }
    }
  }

  if (Array.isArray(parsedData.discoveredTemplates)) {
    parsedData.discoveredTemplates = parsedData.discoveredTemplates.map((t: any, idx: number) => {
      if (!singleStyle && (!t.rawHtml || typeof t.rawHtml !== 'string' || t.rawHtml.trim().length < 50)) {
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
      } else if (singleStyle && (!t.rawHtml || typeof t.rawHtml !== 'string' || t.rawHtml.trim().length < 10)) {
        t.rawHtml = '<div style="background:#08080C;color:#fff;padding:60px;">AI Generated Visual</div>';
      }
      return t;
    });
  }

  if (parsedData.discoveredTemplates?.length > 0 && db) {
    try {
      const batch = db.batch();
      const nowIso = new Date().toISOString();
      for (const tpl of parsedData.discoveredTemplates) {
        const tplId = tpl.id && typeof tpl.id === 'string' && tpl.id.length > 3
          ? tpl.id
          : `tpl_gemini_${Math.random().toString(36).substring(2, 10)}`;
        tpl.id = tplId;
        const docRef = db.collection('discovered_template_library').doc(tplId);
        batch.set(docRef, {
          id: tplId,
          name: tpl.name || 'Discovered Visual Trend',
          sourceTrend: tpl.sourceTrend || focusNiche || 'Market Research',
          description: tpl.description || 'Synthesized visual trend template',
          rawHtml: tpl.rawHtml,
          primaryColor: tpl.primaryColor || '#7C3AED',
          secondaryColor: tpl.secondaryColor || '#08080C',
          fontFamily: tpl.fontFamily || 'Inter',
          category: focusNiche || 'General B2B',
          createdAt: nowIso,
          userId: userId || 'system',
          usageCount: 0
        }, { merge: true });
      }
      await batch.commit();
      console.log(`[Template Library] Auto-saved ${parsedData.discoveredTemplates.length} discovered templates to Firestore 'discovered_template_library'.`);
    } catch (saveErr) {
      console.warn('[Template Library Auto-Save Warning]:', saveErr);
    }
  }

  return parsedData;
}

export async function getDiscoveredTemplatesLibrary(): Promise<any[]> {
  if (!db) return [];
  const snap = await db.collection('discovered_template_library').orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map(doc => doc.data());
}
