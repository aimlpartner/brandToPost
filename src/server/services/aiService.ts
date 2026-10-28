import { GoogleGenAI, Type } from '@google/genai';
import { ai, MODELS } from '../config/gemini';
import { callGpt56SolReasoning, GPT_56_SOL_MODEL } from './gpt56Service';
import { db } from '../config/firebase';
import {
  saveImageLocalAndDb,
  stampBrandLogoOnImage,
  generateFallbackBrandedCanvas,
  resolveImageBuffer,
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

export function formatEditorialArtDirectorPrompt(
  promptText: string,
  layoutAnchor?: string,
  colorDescriptor?: string
): string {
  const clean = promptText.trim().replace(/\s+/g, ' ');

  const hasExplicitSpatialPrefix = /^(subject positioned|positioned on|composition:|wide empty|expansive clean)/i.test(clean);
  const anchor = (layoutAnchor || '').toLowerCase();

  let spatialPrefix = '';
  if (!hasExplicitSpatialPrefix) {
    if (anchor.includes('right') || anchor === 'negative_space_right') {
      spatialPrefix = 'Subject positioned strictly on the left third, wide clean empty surface and generous negative space covering the entire right side';
    } else if (anchor.includes('banner') || anchor.includes('top') || anchor === 'top_left_banner') {
      spatialPrefix = 'Subject positioned strictly on the lower-right third, wide clean open background and generous negative space across the upper-left';
    } else if (anchor.includes('cinematic') || anchor.includes('bottom') || anchor === 'bottom_full_cinematic') {
      spatialPrefix = 'Subject positioned in the upper half or horizon, expansive clean empty dark foreground surface across the bottom third';
    } else if (anchor.includes('center') || anchor === 'centered_minimal') {
      spatialPrefix = 'Centered subject with expansive minimalist atmospheric bokeh and generous clean breathing room on all sides';
    } else {
      // Default: bottom_left_editorial / negative_space_left
      spatialPrefix = 'Subject positioned strictly on the upper-right third, wide clean uncluttered surface and generous negative space on the lower-left';
    }
  }

  const parts: string[] = [];
  if (spatialPrefix) {
    parts.push(spatialPrefix);
  }
  parts.push(clean);

  const hasNegativeSpace = /negative space|breathing room|empty space|clean background|open surface|slate|counter|tabletop|bokeh|uncluttered/i.test(clean);
  const hasOptics = /35mm|lens|f\/|depth of field|bokeh|grain/i.test(clean);
  const hasNegative = /no text|no words|no letters/i.test(clean);

  if (!hasNegativeSpace && !spatialPrefix) {
    parts.push('composed with generous organic negative space and uncluttered background');
  }
  if (!hasOptics) {
    parts.push('editorial 35mm photography, f/1.8 shallow depth of field, subtle organic film grain');
  }
  if (colorDescriptor && !clean.toLowerCase().includes('light')) {
    parts.push(colorDescriptor);
  }
  if (!hasNegative) {
    parts.push('clean editorial background plate, strictly no text, no words, no letters, no logos');
  }

  return parts.join(', ');
}

export async function executeGoogleImageGeneration(
  prompt: string,
  options?: {
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5';
    modelPref?: string;
    inputImageBase64?: string;
    inputImageMime?: string;
  }
): Promise<string | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn('[GOOGLE-NANO-BANANA] GEMINI_API_KEY is not defined in environment. Skipping Google Nano Banana.');
    return null;
  }

  const aspectRatio = options?.aspectRatio || '4:5';
  const apiAspectRatio = (aspectRatio === '4:5' ? '3:4' : aspectRatio) as '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  const configuredModel = options?.modelPref || process.env.GEMINI_IMAGE_MODEL || MODELS.NANO_BANANA || 'gemini-nano-banana-2.1';
  const modelsToTry = [
    configuredModel,
    'gemini-nano-banana-2.1',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image',
    'gemini-3.1-flash-lite-image',
    'gemini-2.5-flash-image',
    'imagen-3.0-generate-002',
  ];
  const uniqueModels = Array.from(new Set(modelsToTry));

  console.log(`\n[GOOGLE-NANO-BANANA] ════════════════════════════════════════════════════════════════`);
  console.log(`[GOOGLE-NANO-BANANA] ▶ START Google Nano Banana Image Generation`);
  console.log(`[GOOGLE-NANO-BANANA] Target Model: "${configuredModel}" | Aspect Ratio: "${aspectRatio}" (API: "${apiAspectRatio}")`);
  console.log(`[GOOGLE-NANO-BANANA] Candidates to try: [${uniqueModels.join(', ')}]`);
  console.log(`[GOOGLE-NANO-BANANA] Prompt Preview (${prompt.length} chars): "${prompt.substring(0, 120).replace(/\n/g, ' ')}..."`);

  for (let attempt = 0; attempt < uniqueModels.length; attempt++) {
    const modelName = uniqueModels[attempt];
    const startTime = Date.now();
    try {
      console.log(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}/${uniqueModels.length}] Dispatching request to Google model "${modelName}"...`);

      // ── BRANCH A: Dedicated Imagen Models (API: ai.models.generateImages) ──────────────
      if (modelName.startsWith('imagen-')) {
        const imgRes = await ai.models.generateImages({
          model: modelName,
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: apiAspectRatio,
            outputMimeType: 'image/png'
          }
        });

        const elapsedMs = Date.now() - startTime;
        if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
          const b64 = imgRes.generatedImages[0].image.imageBytes;
          console.log(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] ✔ SUCCESS with Imagen "${modelName}" in ${elapsedMs}ms! (${Math.round(b64.length / 1024)} KB)`);
          console.log(`[GOOGLE-NANO-BANANA] ════════════════════════════════════════════════════════════════\n`);
          return b64;
        }
        console.warn(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] Model "${modelName}" returned no imageBytes.`);
        continue;
      }

      // ── BRANCH B: Gemini Nano Banana / Flash Image Models (API: ai.models.generateContent) ───
      // 1. If input image was provided for multimodal image refinement/editing, try sending multimodal parts
      if (options?.inputImageBase64) {
        try {
          const partsWithImg: any[] = [
            {
              inlineData: {
                mimeType: options.inputImageMime || 'image/png',
                data: options.inputImageBase64,
              }
            },
            { text: prompt }
          ];
          const imgRes = await ai.models.generateContent({
            model: modelName,
            contents: { parts: partsWithImg },
            config: {
              imageConfig: {
                aspectRatio: apiAspectRatio,
              }
            }
          });

          const elapsedMs = Date.now() - startTime;
          if (imgRes?.candidates?.[0]?.content?.parts) {
            for (const pt of imgRes.candidates[0].content.parts) {
              if (pt.inlineData?.data) {
                const b64 = pt.inlineData.data;
                console.log(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] ✔ SUCCESS (multimodal) with "${modelName}" in ${elapsedMs}ms! (${Math.round(b64.length / 1024)} KB)`);
                console.log(`[GOOGLE-NANO-BANANA] ════════════════════════════════════════════════════════════════\n`);
                return b64;
              }
            }
          }
        } catch (multiErr: any) {
          console.warn(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] Multimodal input notice with "${modelName}":`, multiErr?.message || multiErr);
        }
      }

      // 2. Direct text-to-image plate generation via Gemini generateContent + imageConfig
      const imgRes = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: apiAspectRatio,
          }
        }
      });

      const elapsedMs = Date.now() - startTime;
      if (imgRes?.candidates?.[0]?.content?.parts) {
        for (const pt of imgRes.candidates[0].content.parts) {
          if (pt.inlineData?.data) {
            const b64 = pt.inlineData.data;
            console.log(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] ✔ SUCCESS with "${modelName}" in ${elapsedMs}ms! (${Math.round(b64.length / 1024)} KB)`);
            console.log(`[GOOGLE-NANO-BANANA] ════════════════════════════════════════════════════════════════\n`);
            return b64;
          }
        }
      }
      console.warn(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] Model "${modelName}" returned no inlineData.`);
    } catch (err: any) {
      const elapsedMs = Date.now() - startTime;
      console.warn(`[GOOGLE-NANO-BANANA] [Attempt ${attempt + 1}] ✘ Exception with model "${modelName}" after ${elapsedMs}ms:`, err?.message || err);
    }
  }

  console.error(`[GOOGLE-NANO-BANANA] ✘ FAILED: All Google Nano Banana models exhausted without success.`);
  console.log(`[GOOGLE-NANO-BANANA] ════════════════════════════════════════════════════════════════\n`);
  return null;
}

export async function executeOpenAIImageGeneration(
  openaiApiKey: string,
  prompt: string,
  modelPref?: string,
  qualityPref?: string
): Promise<string | null> {
  const configuredModel = modelPref || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const modelsToTry: string[] = [configuredModel];
  // If configuredModel is not gpt-image-2, add gpt-image-2 as fallback
  if (configuredModel !== 'gpt-image-2') modelsToTry.push('gpt-image-2');
  if (configuredModel !== 'dall-e-3') modelsToTry.push('dall-e-3');

  console.log(`\n[AI-IMAGE-ENGINE] ════════════════════════════════════════════════════════════════`);
  console.log(`[AI-IMAGE-ENGINE] ▶ START OpenAI Image Generation`);
  console.log(`[AI-IMAGE-ENGINE] Configured Model: "${configuredModel}" | Quality Preference: "${qualityPref || 'default'}"`);
  console.log(`[AI-IMAGE-ENGINE] Candidates to try: [${modelsToTry.join(', ')}]`);
  console.log(`[AI-IMAGE-ENGINE] Prompt Preview (${prompt.length} chars): "${prompt.substring(0, 120).replace(/\n/g, ' ')}..."`);

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const modelName = modelsToTry[attempt];
    const startTime = Date.now();
    try {
      const isDallE3 = modelName === 'dall-e-3';
      const isDallE2 = modelName === 'dall-e-2';
      const isGptImage = modelName.includes('gpt-image');
      const maxPromptLen = isDallE2 ? 1000 : 3900;

      const payload: any = {
        model: modelName,
        prompt: prompt.substring(0, maxPromptLen),
        n: 1,
        size: '1024x1024'
      };

      if (isDallE3) {
        payload.quality = (qualityPref === 'medium' || qualityPref === 'low') ? 'standard' : (qualityPref || 'standard');
      } else if (isGptImage) {
        if (qualityPref) payload.quality = qualityPref;
      }

      console.log(`[AI-IMAGE-ENGINE] [Attempt ${attempt + 1}/${modelsToTry.length}] Dispatching request to OpenAI...`);
      console.log(`[AI-IMAGE-ENGINE]   → Model: ${payload.model}`);
      console.log(`[AI-IMAGE-ENGINE]   → Size: ${payload.size} | Quality: ${payload.quality || 'N/A'}`);
      console.log(`[AI-IMAGE-ENGINE]   → Payload keys: [${Object.keys(payload).join(', ')}]`);

      const genRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const elapsedMs = Date.now() - startTime;

      if (genRes.ok) {
        const genData = await genRes.json();
        if (genData?.data?.[0]?.b64_json) {
          const b64Len = genData.data[0].b64_json.length;
          console.log(`[AI-IMAGE-ENGINE] [Attempt ${attempt + 1}] ✔ SUCCESS in ${elapsedMs}ms!`);
          console.log(`[AI-IMAGE-ENGINE]   → Model: ${modelName}`);
          console.log(`[AI-IMAGE-ENGINE]   → Received base64 image data (${Math.round(b64Len / 1024)} KB)`);
          console.log(`[AI-IMAGE-ENGINE] ════════════════════════════════════════════════════════════════\n`);
          return genData.data[0].b64_json;
        } else if (genData?.data?.[0]?.url) {
          console.log(`[AI-IMAGE-ENGINE] [Attempt ${attempt + 1}] ✔ SUCCESS in ${elapsedMs}ms! Received image URL: ${genData.data[0].url}`);
          console.log(`[AI-IMAGE-ENGINE]   → Downloading binary image buffer...`);
          const imgFetch = await fetch(genData.data[0].url);
          const buf = await imgFetch.arrayBuffer();
          const base64 = Buffer.from(buf).toString('base64');
          console.log(`[AI-IMAGE-ENGINE]   → Converted to base64 (${Math.round(base64.length / 1024)} KB)`);
          console.log(`[AI-IMAGE-ENGINE] ════════════════════════════════════════════════════════════════\n`);
          return base64;
        }
      } else {
        const errTxt = await genRes.text();
        console.error(`[AI-IMAGE-ENGINE] [Attempt ${attempt + 1}] ✘ Model "${modelName}" returned HTTP ${genRes.status} in ${elapsedMs}ms:`, errTxt);
      }
    } catch (e: any) {
      const elapsedMs = Date.now() - startTime;
      console.error(`[AI-IMAGE-ENGINE] [Attempt ${attempt + 1}] ✘ Exception with model "${modelName}" after ${elapsedMs}ms:`, e.message || e);
    }
  }

  console.error(`[AI-IMAGE-ENGINE] ✘ FAILED: All candidate models exhausted without success.`);
  console.log(`[AI-IMAGE-ENGINE] ════════════════════════════════════════════════════════════════\n`);
  return null;
}

export async function generateSingleCampaignImageBackend(
  item: any,
  logoUrl?: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const openaiModel = rawModel;
  const rawQuality = process.env.OPENAI_IMAGE_QUALITY || 'standard';
  const openaiQuality = rawQuality;

  const promptText = typeof item === 'string' ? item : item?.prompt || `High quality editorial photographic visual`;
  const headline = typeof item === 'object' ? item.headline : undefined;
  const subtext = typeof item === 'object' ? item.subtext : undefined;
  const brandColors = typeof item === 'object' && Array.isArray(item.brandColors) ? item.brandColors : undefined;
  const fontStyle = typeof item === 'object' ? item.fontStyle : undefined;
  const brandAssetUrl = typeof item === 'object' ? item.brandAssetUrl : undefined;
  const logoPosition = typeof item === 'object' && item.logoPosition ? item.logoPosition : 'top-left';

  const rawLayoutAnchor = typeof item === 'object' ? (item.layoutAnchor || item.preferredAnchor || item.layout_intent) : undefined;
  const layoutAnchor = rawLayoutAnchor;

  const visualStrategy = typeof item === 'object' ? (item.visualStrategy || item.visual_strategy) : undefined;
  if (visualStrategy === 'brand_gradient') {
    console.log(`[AI-IMAGE-ENGINE] Visual tier "brand_gradient" planned. Generating minimalist brand gradient canvas...`);
    return generateFallbackBrandedCanvas(
      headline || promptText,
      subtext || '',
      brandColors?.[0] || '#7C3AED',
      brandColors?.[1] || '#08080C',
      logoUrl
    );
  }

  let base64Data: string | null = null;
  const mimeType = 'image/png';

  const { colorDescriptor } = translateBrandDNA(brandColors, fontStyle);
  const formattedPrompt = formatEditorialArtDirectorPrompt(promptText, layoutAnchor, colorDescriptor);

  // 1. BRAND ASSET PRESERVATION & ENHANCEMENT
  if (brandAssetUrl) {
    try {
      console.log(`[AI-IMAGE-ENGINE] Brand asset detected: "${brandAssetUrl.substring(0, 80)}...". Resolving image buffer...`);
      const assetResolved = await resolveImageBuffer(brandAssetUrl);
      if (assetResolved?.buffer) {
        const { Canvas, loadImage } = await import('skia-canvas');
        const canvas = new Canvas(1024, 1024);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#08080C';
        ctx.fillRect(0, 0, 1024, 1024);

        const loadedImg = await loadImage(assetResolved.buffer);
        const scale = Math.max(1024 / loadedImg.width, 1024 / loadedImg.height);
        const w = loadedImg.width * scale;
        const h = loadedImg.height * scale;
        const x = (1024 - w) / 2;
        const y = (1024 - h) / 2;
        ctx.drawImage(loadedImg, x, y, w, h);

        const assetPngBuf = Buffer.from(await canvas.toBuffer('png'));
        const assetBase64 = assetPngBuf.toString('base64');

        let editPrompt = `CRITICAL REQUIREMENT: PRESERVE the exact subject, person, clothing, camera/product equipment, and scene composition from the source photo. DO NOT replace, redraw, or substitute the subject in the photo.\n`;
        editPrompt += `Subtly enhance the photo with professional cinematic lighting and high-end color grading harmonized with brand aesthetic: ${colorDescriptor}.\n`;
        editPrompt += `STRICT REQUIREMENT: Absolutely NO text, NO words, NO typography, NO letters, NO watermarks. Clean visual plate only.`;

        // 1a. Try Google Nano Banana multimodal enhancement first
        if (geminiApiKey) {
          try {
            console.log(`[AI-IMAGE-ENGINE] Enhancing brand asset using Google Nano Banana (${MODELS.IMAGEN})...`);
            base64Data = await executeGoogleImageGeneration(editPrompt, {
              aspectRatio: '4:5',
              inputImageBase64: assetBase64,
              inputImageMime: 'image/png',
            });
            if (base64Data) {
              console.log(`[AI-IMAGE-ENGINE] ✔ Successfully enhanced brand asset with Google Nano Banana!`);
            }
          } catch (gErr) {
            console.warn('[AI-IMAGE-ENGINE] Google Nano Banana asset edit note:', gErr);
          }
        }

        // 1b. Fallback to OpenAI Image Edit if Google Nano Banana did not return an image
        if (!base64Data && openaiApiKey) {
          try {
            const formData = new FormData();
            const blob = new Blob([new Uint8Array(assetPngBuf)], { type: 'image/png' });
            formData.append('image', blob, 'source.png');
            formData.append('prompt', editPrompt.substring(0, 950));
            formData.append('model', openaiModel);
            formData.append('n', '1');
            formData.append('size', '1024x1024');

            console.log(`[AI-IMAGE-ENGINE] Calling OpenAI /v1/images/edits with model: ${openaiModel}...`);
            const editRes = await fetch('https://api.openai.com/v1/images/edits', {
              method: 'POST',
              headers: { Authorization: `Bearer ${openaiApiKey}` },
              body: formData
            });

            if (editRes.ok) {
              const editData = await editRes.json();
              if (editData?.data?.[0]?.b64_json) {
                base64Data = editData.data[0].b64_json;
                console.log(`[AI-IMAGE-ENGINE] ✔ Successfully edited brand asset using ${openaiModel}`);
              } else if (editData?.data?.[0]?.url) {
                const imgFetch = await fetch(editData.data[0].url);
                const buf = await imgFetch.arrayBuffer();
                base64Data = Buffer.from(buf).toString('base64');
                console.log(`[AI-IMAGE-ENGINE] ✔ Successfully edited brand asset using ${openaiModel} (URL download)`);
              }
            } else {
              const errTxt = await editRes.text();
              console.warn(`[AI-IMAGE-ENGINE] OpenAI Edit API notice (${editRes.status}): ${errTxt}. Preserving normalized asset.`);
            }
          } catch (editErr: any) {
            console.warn('[AI-IMAGE-ENGINE] OpenAI Edit note:', editErr?.message || editErr);
          }
        }

        // 1c. If both AI edits failed, preserve the clean normalized source asset plate
        if (!base64Data) {
          base64Data = assetBase64;
        }
      }
    } catch (assetErr: any) {
      console.warn('[AI-IMAGE-ENGINE] Brand asset processing note:', assetErr?.message || assetErr);
    }
  }

  // 2. TEXT-TO-IMAGE GENERATION (When no brandAssetUrl was provided or resolved)
  if (!base64Data) {
    // 2a. PRIMARY: Google Nano Banana Image Generation (gemini-3.1-flash-image-preview)
    if (geminiApiKey) {
      try {
        console.log(`[AI-IMAGE-ENGINE] ▶ Generating clean 4:5 plate with Google Nano Banana (${MODELS.IMAGEN})...`);
        base64Data = await executeGoogleImageGeneration(formattedPrompt, { aspectRatio: '4:5' });
        if (base64Data) {
          console.log(`[AI-IMAGE-ENGINE] ✔ Google Nano Banana successfully generated clean 4:5 image plate.`);
        }
      } catch (gErr: any) {
        console.warn('[AI-IMAGE-ENGINE] Google Nano Banana generation note:', gErr?.message || gErr);
      }
    }

    // 2b. SECONDARY (FALLBACK): OpenAI Image Generation (gpt-image-2 / dall-e-3)
    if (!base64Data && openaiApiKey) {
      try {
        console.log(`[AI-IMAGE-ENGINE] ▶ Falling back to OpenAI Image Generation (${openaiModel})...`);
        base64Data = await executeOpenAIImageGeneration(openaiApiKey, formattedPrompt, openaiModel, openaiQuality);
      } catch (oaiErr) {
        console.warn('[generateSingleCampaignImageBackend] OpenAI generation error:', oaiErr);
      }
    }
  }

  if (base64Data) {
    const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
    console.log(`[AI-IMAGE-ENGINE] Persisting clean background plate "${imageId}.png" to local disk & db...`);
    await saveImageLocalAndDb(imageId, base64Data, mimeType, promptText);
    const finalUrl = `/api/campaign/images/${imageId}.png`;
    console.log(`[AI-IMAGE-ENGINE] ✔ Final resolved image URL: ${finalUrl}`);
    return finalUrl;
  }

  console.warn(`[AI-IMAGE-ENGINE] ⚠ No AI base64 image generated. Using branded SVG fallback.`);
  return generateFallbackBrandedCanvas(
    headline || promptText,
    subtext || '',
    brandColors?.[0] || '#7C3AED',
    brandColors?.[1] || '#08080C',
    logoUrl
  );
}

export async function extractServerVisionAnalysis(
  base64Png: string,
  promptHint?: string
): Promise<{
  subjectBox: { xMin: number; yMin: number; xMax: number; yMax: number };
  averageLuminance: number;
  dominantLeadingLineY?: number;
  freeSpace?: { originX: number; originY: number; width: number; height: number };
  detectedSubjectSide?: 'left' | 'right' | 'center';
}> {
  try {
    const { Canvas, loadImage } = await import('skia-canvas');
    const imgBuf = Buffer.from(base64Png, 'base64');
    const loadedImg = await loadImage(imgBuf);

    const sampleW = 64;
    const sampleH = 64;
    const canvas = new Canvas(sampleW, sampleH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(loadedImg, 0, 0, sampleW, sampleH);

    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

    const gray = new Float32Array(sampleW * sampleH);
    let totalLuminance = 0;
    for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[p] = l;
      totalLuminance += l;
    }
    const overallAvgLuminance = Math.round(totalLuminance / (sampleW * sampleH));

    const colEnergy = new Float32Array(sampleW);
    const horizEdges = new Float32Array(sampleH);

    let leftSum = 0, leftSumSq = 0, leftEdges = 0, leftCount = 0;
    let rightSum = 0, rightSumSq = 0, rightEdges = 0, rightCount = 0;
    const halfW = Math.floor(sampleW / 2);

    for (let y = 1; y < sampleH - 1; y++) {
      const yOffset = y * sampleW;
      for (let x = 1; x < sampleW - 1; x++) {
        const val = gray[yOffset + x];
        const gx = gray[yOffset + x + 1] - gray[yOffset + x - 1];
        const gy = gray[yOffset + sampleW + x] - gray[yOffset - sampleW + x];
        const edge = Math.abs(gx) + Math.abs(gy);

        colEnergy[x] += edge;
        horizEdges[y] += Math.abs(gy);

        if (x < halfW) {
          leftSum += val;
          leftSumSq += val * val;
          leftEdges += edge;
          leftCount++;
        } else {
          rightSum += val;
          rightSumSq += val * val;
          rightEdges += edge;
          rightCount++;
        }
      }
    }

    const leftVariance = (leftSumSq / leftCount) - Math.pow(leftSum / leftCount, 2);
    const rightVariance = (rightSumSq / rightCount) - Math.pow(rightSum / rightCount, 2);
    const leftComplexity = leftVariance + (leftEdges / leftCount) * 40;
    const rightComplexity = rightVariance + (rightEdges / rightCount) * 40;

    const isSubjectLeft = leftComplexity >= rightComplexity;
    const detectedSubjectSide: 'left' | 'right' | 'center' = isSubjectLeft ? 'left' : 'right';

    let maxHoriz = 0;
    let dominantLeadingLineY: number | undefined = undefined;
    for (let y = Math.floor(sampleH * 0.22); y < Math.floor(sampleH * 0.75); y++) {
      if (horizEdges[y] > maxHoriz) {
        maxHoriz = horizEdges[y];
        dominantLeadingLineY = Number((y / sampleH).toFixed(3));
      }
    }

    let xMin = 0.08;
    let xMax = 0.92;
    let freeSpace: { originX: number; originY: number; width: number; height: number };

    if (isSubjectLeft) {
      let leftTot = 0;
      for (let x = 0; x < halfW; x++) leftTot += colEnergy[x];
      let cumL = 0;
      let cutX = Math.floor(sampleW * 0.40);
      for (let x = 0; x < halfW; x++) {
        cumL += colEnergy[x];
        if (cumL >= leftTot * 0.85) {
          cutX = x;
          break;
        }
      }
      xMin = 0.08;
      xMax = Number(Math.max(0.36, Math.min(0.55, cutX / sampleW)).toFixed(3));
      const freeOriginX = Number((xMax + 0.04).toFixed(3));
      const freeWidth = Number((0.92 - freeOriginX).toFixed(3));
      freeSpace = {
        originX: freeOriginX,
        originY: dominantLeadingLineY && dominantLeadingLineY > 0.16 ? dominantLeadingLineY : 0.20,
        width: freeWidth,
        height: 0.60,
      };
    } else {
      let rightTot = 0;
      for (let x = halfW; x < sampleW; x++) rightTot += colEnergy[x];
      let cumR = 0;
      let startX = Math.floor(sampleW * 0.60);
      for (let x = halfW; x < sampleW; x++) {
        cumR += colEnergy[x];
        if (cumR >= rightTot * 0.18) {
          startX = x;
          break;
        }
      }
      xMin = Number(Math.max(0.45, Math.min(0.64, startX / sampleW)).toFixed(3));
      xMax = 0.92;
      const freeWidth = Number((xMin - 0.12).toFixed(3));
      freeSpace = {
        originX: 0.08,
        originY: dominantLeadingLineY && dominantLeadingLineY > 0.16 ? dominantLeadingLineY : 0.20,
        width: Math.max(0.40, freeWidth),
        height: 0.60,
      };
    }

    return {
      subjectBox: {
        xMin,
        yMin: 0.12,
        xMax,
        yMax: 0.88,
      },
      averageLuminance: overallAvgLuminance,
      dominantLeadingLineY,
      freeSpace,
      detectedSubjectSide,
    };
  } catch (err) {
    console.warn('[extractServerVisionAnalysis] Error during CV analysis, using hint fallback:', err);
    const hint = (promptHint || '').toLowerCase();
    const isDark = hint.includes('dark') || hint.includes('night') || hint.includes('black') || hint.includes('moody');
    return {
      subjectBox: { xMin: 0.44, yMin: 0.14, xMax: 0.92, yMax: 0.86 },
      averageLuminance: isDark ? 45 : 145,
      dominantLeadingLineY: 0.54,
      detectedSubjectSide: 'right',
      freeSpace: { originX: 0.08, originY: 0.20, width: 0.48, height: 0.60 },
    };
  }
}

export async function generateCampaignImagesService(
  prompts: any[],
  logoUrl?: string,
  defaultLogoPosition?: string
): Promise<string[] & { imageUrls: string[]; visualAnalyses: any[] }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const rawModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const openaiModel = rawModel;
  const rawQuality = process.env.OPENAI_IMAGE_QUALITY || 'standard';
  const openaiQuality = rawQuality;

  const imageUrls: string[] = [];
  const visualAnalyses: any[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const item = prompts[i];
    const promptText = typeof item === 'string' ? item : item?.prompt || `High quality editorial photographic visual #${i + 1}`;
    const headline = typeof item === 'object' ? item.headline : undefined;
    const subtext = typeof item === 'object' ? item.subtext : undefined;
    const brandColors = typeof item === 'object' && Array.isArray(item.brandColors) ? item.brandColors : undefined;
    const fontStyle = typeof item === 'object' ? item.fontStyle : undefined;
    const brandAssetUrl = typeof item === 'object' ? item.brandAssetUrl : undefined;
    const logoPosition = typeof item === 'object' && item.logoPosition ? item.logoPosition : (defaultLogoPosition || 'top-left');

    const rawLayoutAnchor = typeof item === 'object' ? (item.layoutAnchor || item.preferredAnchor || item.layout_intent) : undefined;
    const layoutAnchor = rawLayoutAnchor;

    const visualStrategy = typeof item === 'object' ? (item.visualStrategy || item.visual_strategy) : undefined;
    if (visualStrategy === 'brand_gradient') {
      console.log(`[AI-IMAGE-ENGINE] [Item #${i + 1}/${prompts.length}] Visual tier "brand_gradient" planned. Generating minimalist brand gradient plate...`);
      const fallbackUrl = generateFallbackBrandedCanvas(
        headline || promptText,
        subtext || '',
        brandColors?.[0] || '#7C3AED',
        brandColors?.[1] || '#08080C',
        logoUrl
      );
      imageUrls.push(fallbackUrl);
      visualAnalyses.push({
        subjectBox: { xMin: 0.44, yMin: 0.16, xMax: 0.88, yMax: 0.64 },
        averageLuminance: 35,
        dominantLeadingLineY: 0.50,
        detectedSubjectSide: 'right',
        freeSpace: { originX: 0.08, originY: 0.20, width: 0.50, height: 0.60 }
      });
      continue;
    }

    let base64Data: string | null = null;
    const mimeType = 'image/png';

    const { colorDescriptor } = translateBrandDNA(brandColors, fontStyle);
    const formattedPrompt = formatEditorialArtDirectorPrompt(promptText, layoutAnchor, colorDescriptor);

    // 1. BRAND ASSET HANDLING
    if (brandAssetUrl) {
      try {
        console.log(`[AI-IMAGE-ENGINE] Brand asset detected: "${brandAssetUrl.substring(0, 80)}...". Resolving image buffer...`);
        const assetResolved = await resolveImageBuffer(brandAssetUrl);
        if (assetResolved?.buffer) {
          const { Canvas, loadImage } = await import('skia-canvas');
          const canvas = new Canvas(1024, 1024);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#08080C';
          ctx.fillRect(0, 0, 1024, 1024);

          const loadedImg = await loadImage(assetResolved.buffer);
          const scale = Math.max(1024 / loadedImg.width, 1024 / loadedImg.height);
          const w = loadedImg.width * scale;
          const h = loadedImg.height * scale;
          const x = (1024 - w) / 2;
          const y = (1024 - h) / 2;
          ctx.drawImage(loadedImg, x, y, w, h);

          const assetPngBuf = Buffer.from(await canvas.toBuffer('png'));
          const assetBase64 = assetPngBuf.toString('base64');

          let editPrompt = `CRITICAL REQUIREMENT: PRESERVE the exact subject, person, clothing, camera/product equipment, and scene composition from the source photo. DO NOT replace, redraw, or substitute the subject in the photo.\n`;
          editPrompt += `Subtly enhance the photo with professional cinematic lighting and high-end color grading harmonized with brand aesthetic: ${colorDescriptor}.\n`;
          editPrompt += `STRICT REQUIREMENT: Absolutely NO text, NO words, NO typography, NO letters, NO watermarks. Clean visual plate only.`;

          // 1a. Try Google Nano Banana multimodal editing first
          if (geminiApiKey) {
            try {
              console.log(`[AI-IMAGE-ENGINE] Enhancing brand asset using Google Nano Banana (${MODELS.IMAGEN})...`);
              base64Data = await executeGoogleImageGeneration(editPrompt, {
                aspectRatio: '4:5',
                inputImageBase64: assetBase64,
                inputImageMime: 'image/png',
              });
              if (base64Data) {
                console.log(`[AI-IMAGE-ENGINE] ✔ Successfully enhanced brand asset with Google Nano Banana!`);
              }
            } catch (gErr) {
              console.warn('[AI-IMAGE-ENGINE] Google Nano Banana asset edit note:', gErr);
            }
          }

          // 1b. Fallback to OpenAI Image Edit if Google Nano Banana did not return an image
          if (!base64Data && openaiApiKey) {
            try {
              const formData = new FormData();
              const blob = new Blob([new Uint8Array(assetPngBuf)], { type: 'image/png' });
              formData.append('image', blob, 'source.png');
              formData.append('prompt', editPrompt.substring(0, 950));
              formData.append('model', openaiModel);
              formData.append('n', '1');
              formData.append('size', '1024x1024');

              console.log(`[AI-IMAGE-ENGINE] Calling OpenAI /v1/images/edits with model: ${openaiModel}...`);
              const editRes = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: { Authorization: `Bearer ${openaiApiKey}` },
                body: formData
              });

              if (editRes.ok) {
                const editData = await editRes.json();
                if (editData?.data?.[0]?.b64_json) {
                  base64Data = editData.data[0].b64_json;
                  console.log(`[AI-IMAGE-ENGINE] ✔ Successfully edited brand asset using ${openaiModel}`);
                } else if (editData?.data?.[0]?.url) {
                  const fetchImg = await fetch(editData.data[0].url);
                  const buf = await fetchImg.arrayBuffer();
                  base64Data = Buffer.from(buf).toString('base64');
                  console.log(`[AI-IMAGE-ENGINE] ✔ Successfully edited brand asset using ${openaiModel} (URL download)`);
                }
              } else {
                const errTxt = await editRes.text();
                console.warn(`[AI-IMAGE-ENGINE] OpenAI Edit API notice (${editRes.status}): ${errTxt}. Preserving normalized asset.`);
              }
            } catch (editErr: any) {
              console.warn('[AI-IMAGE-ENGINE] OpenAI Edit note:', editErr?.message || editErr);
            }
          }

          // 1c. If both AI edits failed, preserve the clean normalized source asset plate
          if (!base64Data) {
            base64Data = assetBase64;
          }
        }
      } catch (assetErr: any) {
        console.warn('[AI-IMAGE-ENGINE] Brand asset processing note:', assetErr?.message || assetErr);
      }
    }

    // 2. TEXT-TO-IMAGE GENERATION (When no brandAssetUrl was provided or resolved)
    if (!base64Data) {
      // 2a. PRIMARY: Google Nano Banana Image Generation (gemini-3.1-flash-image-preview)
      if (geminiApiKey) {
        try {
          console.log(`[AI-IMAGE-ENGINE] [Item #${i + 1}/${prompts.length}] ▶ Generating clean 4:5 plate with Google Nano Banana (${MODELS.IMAGEN})...`);
          base64Data = await executeGoogleImageGeneration(formattedPrompt, { aspectRatio: '4:5' });
          if (base64Data) {
            console.log(`[AI-IMAGE-ENGINE] [Item #${i + 1}] ✔ Google Nano Banana successfully generated clean 4:5 image plate.`);
          }
        } catch (gErr: any) {
          console.warn(`[AI-IMAGE-ENGINE] [Item #${i + 1}] Google Nano Banana generation note:`, gErr?.message || gErr);
        }
      }

      // 2b. SECONDARY (FALLBACK): OpenAI Image Generation (gpt-image-2 / dall-e-3)
      if (!base64Data && openaiApiKey) {
        try {
          console.log(`[AI-IMAGE-ENGINE] [Item #${i + 1}/${prompts.length}] ▶ Falling back to OpenAI Image Generation (${openaiModel})...`);
          base64Data = await executeOpenAIImageGeneration(openaiApiKey, formattedPrompt, openaiModel, openaiQuality);
        } catch (oaiErr) {
          console.error('[generate-campaign-images] OpenAI generation error:', oaiErr);
        }
      }
    }

    let generatedUrl: string | null = null;
    let visualAnalysis: any = null;

    if (base64Data) {
      const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
      console.log(`[AI-IMAGE-ENGINE] Persisting clean background plate "${imageId}.png" to local disk & db...`);
      await saveImageLocalAndDb(imageId, base64Data, mimeType, promptText);
      generatedUrl = `/api/campaign/images/${imageId}.png`;
      console.log(`[AI-IMAGE-ENGINE] ✔ Final resolved image URL: ${generatedUrl}`);
      try {
        visualAnalysis = await extractServerVisionAnalysis(base64Data, promptText);
        console.log(`[AI-IMAGE-ENGINE] ✔ Extracted server vision analysis for plate: Luminance=${visualAnalysis.averageLuminance}, SubjectSide=${visualAnalysis.detectedSubjectSide}`);
      } catch (cvErr) {
        console.warn('[AI-IMAGE-ENGINE] Server vision analysis exception:', cvErr);
      }
    } else {
      console.warn(`[AI-IMAGE-ENGINE] ⚠ No AI base64 image generated for item #${i + 1}. Using branded SVG fallback.`);
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
    visualAnalyses.push(
      visualAnalysis || {
        subjectBox: { xMin: 0.44, yMin: 0.16, xMax: 0.88, yMax: 0.64 },
        averageLuminance: 45,
        dominantLeadingLineY: 0.54,
        detectedSubjectSide: 'right',
        freeSpace: { originX: 0.08, originY: 0.20, width: 0.48, height: 0.60 }
      }
    );
  }

  const result: any = [...imageUrls];
  result.imageUrls = imageUrls;
  result.visualAnalyses = visualAnalyses;
  return result;
}


export interface MergeProductAssetsParams {
  asset1Url: string; // Primary asset (Product / Item)
  asset2Url: string; // Secondary asset (Person / Model / Second Product)
  prompt?: string;
  headline?: string;
  subtext?: string;
  brandColors?: string[];
  logoUrl?: string;
}

export async function mergeProductImagesService(
  params: MergeProductAssetsParams
): Promise<string> {
  const { asset1Url, asset2Url, prompt, headline, subtext, brandColors, logoUrl } = params;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  // Use gpt-image-2 as specified
  const modelToUse = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

  const res1 = await resolveImageBuffer(asset1Url);
  const res2 = await resolveImageBuffer(asset2Url);

  const { Canvas, loadImage } = await import('skia-canvas');
  const canvas = new Canvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Background / Atmosphere
  const primaryCol = brandColors?.[0] || '#08080C';
  const secondaryCol = brandColors?.[1] || '#181824';
  const grad = ctx.createRadialGradient(512, 512, 120, 512, 512, 720);
  grad.addColorStop(0, secondaryCol);
  grad.addColorStop(1, primaryCol);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle studio surface reflection line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 860);
  ctx.lineTo(944, 860);
  ctx.stroke();

  // Load and composite the 2 assets
  let compositeBuffer: Buffer | null = null;
  try {
    const img1 = res1?.buffer ? await loadImage(res1.buffer) : null;
    const img2 = res2?.buffer ? await loadImage(res2.buffer) : null;

    if (img2) {
      // Asset 2: Person / Model / Secondary Item
      // Draw with soft ambient contact shadow and natural placement
      const maxW = 560;
      const maxH = 820;
      const scale2 = Math.min(maxW / img2.width, maxH / img2.height);
      const w2 = img2.width * scale2;
      const h2 = img2.height * scale2;
      const x2 = img1 ? 40 : (1024 - w2) / 2;
      const y2 = 1024 - h2 - 60;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      ctx.drawImage(img2, x2, y2, w2, h2);
      ctx.restore();
    }

    if (img1) {
      // Asset 1: Primary Product / Item
      // Showcase as the hero element with realistic elevation shadow & crisp fidelity
      const maxW = 540;
      const maxH = 760;
      const scale1 = Math.min(maxW / img1.width, maxH / img1.height);
      const w1 = img1.width * scale1;
      const h1 = img1.height * scale1;
      const x1 = img2 ? 460 : (1024 - w1) / 2;
      const y1 = 1024 - h1 - 80;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 25;
      ctx.drawImage(img1, x1, y1, w1, h1);
      ctx.restore();
    }

    compositeBuffer = Buffer.from(await canvas.toBuffer('png'));
  } catch (canvasErr) {
    console.warn('[mergeProductImagesService] skia-canvas composition error:', canvasErr);
  }

  let finalBase64: string | null = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const mergedPrompt = `Editorial commercial photo featuring the product seamlessly integrated with the person/secondary product. Studio lighting, realistic depth of field, harmonious shadows and reflections, 1:1 format. ${prompt ? `Concept: ${prompt}.` : ''} ${headline ? `Headline: "${headline}".` : ''}`.substring(0, 950);

  // 1. Google Nano Banana refinement
  if (geminiApiKey && compositeBuffer) {
    try {
      console.log(`[mergeProductImagesService] Calling Google Nano Banana (${MODELS.IMAGEN}) to refine merged product composite...`);
      finalBase64 = await executeGoogleImageGeneration(mergedPrompt, {
        aspectRatio: '4:5',
        inputImageBase64: compositeBuffer.toString('base64'),
        inputImageMime: 'image/png',
      });
      if (finalBase64) {
        console.log(`[mergeProductImagesService] ✔ Successfully refined merged product visual with Google Nano Banana!`);
      }
    } catch (gErr) {
      console.warn('[mergeProductImagesService] Google Nano Banana merge note:', gErr);
    }
  }

  // 2. OpenAI Image Edits API fallback
  if (!finalBase64 && openaiApiKey && compositeBuffer) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(compositeBuffer)], { type: 'image/png' });
      formData.append('image', blob, 'source.png');
      formData.append('prompt', mergedPrompt);
      formData.append('model', modelToUse);
      formData.append('n', '1');
      formData.append('size', '1024x1024');

      console.log(`[mergeProductImagesService] Calling OpenAI Image Edit with model: ${modelToUse}...`);
      const editRes = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (editRes.ok) {
        const editData = await editRes.json();
        if (editData?.data?.[0]?.b64_json) {
          finalBase64 = editData.data[0].b64_json;
          console.log(`[mergeProductImagesService] Successfully refined with ${modelToUse}`);
        } else if (editData?.data?.[0]?.url) {
          const fetchImg = await fetch(editData.data[0].url);
          const buf = await fetchImg.arrayBuffer();
          finalBase64 = Buffer.from(buf).toString('base64');
        }
      } else {
        const errTxt = await editRes.text();
        console.warn(`[mergeProductImagesService] OpenAI edit notice (${editRes.status}): ${errTxt}. Using composite.`);
      }
    } catch (oaiErr) {
      console.warn('[mergeProductImagesService] OpenAI edit exception:', oaiErr);
    }
  }

  // Fallback to high-res studio composite buffer if OpenAI edit failed or was unavailable
  if (!finalBase64 && compositeBuffer) {
    finalBase64 = compositeBuffer.toString('base64');
  }

  if (finalBase64) {
    if (logoUrl) {
      finalBase64 = await stampBrandLogoOnImage(finalBase64, logoUrl, 'top-left');
    }
    const imageId = 'prod_merged_' + Math.random().toString(36).substring(2, 10);
    await saveImageLocalAndDb(imageId, finalBase64, 'image/png', prompt || 'Merged Product Visual');
    return `/api/campaign/images/${imageId}.png`;
  }

  return generateFallbackBrandedCanvas(
    headline || 'Product Showcase',
    subtext || 'Dual Asset Synthesis',
    brandColors?.[0] || '#7C3AED',
    brandColors?.[1] || '#08080C',
    logoUrl
  );
}

export async function generateAiContentService(params: {
  model: string;
  contents: any;
  config?: any;
  abortSignal?: AbortSignal;
}): Promise<{ text: string | undefined; usageMetadata: any; candidates: any }> {
  // If model is explicitly GPT-5.6 Sol, route to OpenAI
  if (
    params.model === GPT_56_SOL_MODEL ||
    params.model === 'gpt-5.6'
  ) {
    return await callGpt56SolReasoning({
      contents: params.contents,
      config: params.config,
      abortSignal: params.abortSignal,
      model: GPT_56_SOL_MODEL
    });
  }

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
    model: MODELS.PRIMARY,
    contents: [{ text: synthesisPrompt }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: visualTrendSchema
    }
  });

  let responseText = (synthesisRes.text || '{}').trim();
  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  let parsedData: any = {};
  try {
    parsedData = JSON.parse(responseText);
  } catch (jsonErr) {
    console.warn('[researchTrendsService] JSON parse note on trends synthesis:', jsonErr);
    parsedData = {
      summary: 'High-converting viral visual trends for modern B2B leaders',
      viralPick: {
        name: 'Executive High-Contrast Visual',
        viralityScore: '94/100',
        whyViral: 'High negative space and authoritative typography command attention'
      },
      discoveredTemplates: []
    };
  }

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
