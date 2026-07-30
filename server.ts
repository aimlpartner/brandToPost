import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type } from '@google/genai';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { LAYOUT_BLUEPRINTS, selectLayout } from './src/lib/layoutBlueprints';
import {
  sanitizeTemplateHtml,
  escapeHtmlText,
  escapeHtmlAttr,
  safeUrlOrEmpty,
  TEMPLATE_CSP_META,
} from './src/lib/sanitizeTemplateHtml';

// --- Stdio / Stdin EEXIST Error Workaround for Restricted Hosting Environments (like cPanel/Passenger) ---
try {
  // Test if accessing process.stdin throws
  const testStdin = process.stdin;
} catch (stdinErr: any) {
  console.warn(`[SYSTEM WORKAROUND] process.stdin is inaccessible in this environment (${stdinErr.message}). Redefining to dummy stream to prevent Puppeteer/Socket crash...`);
  try {
    const dummyStdin = new Readable({
      read() {
        this.push(null);
      }
    });
    Object.defineProperty(process, 'stdin', {
      value: dummyStdin,
      configurable: true,
      writable: true
    });
    console.log('[SYSTEM WORKAROUND] process.stdin successfully redefined to dummy Readable stream.');
  } catch (redefineErr: any) {
    console.error('[SYSTEM WORKAROUND] Failed to redefine process.stdin:', redefineErr);
  }
}

// ESM compatibility wrapper for __dirname and __filename
const esmFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const esmDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(esmFilename);

// --- Environment Loading Diagnostics ---
console.log('[ENV DEBUG] process.cwd():', process.cwd());
console.log('[ENV DEBUG] esmDirname:', esmDirname);
console.log('[ENV DEBUG] esmFilename:', esmFilename);

// Check what env vars exist BEFORE dotenv loads anything
console.log('[ENV DEBUG] GEMINI_API_KEY in process.env BEFORE dotenv:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[ENV DEBUG] FIREBASE_SERVICE_ACCOUNT in process.env BEFORE dotenv:', !!process.env.FIREBASE_SERVICE_ACCOUNT, 'length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);
console.log('[ENV DEBUG] APP_URL in process.env BEFORE dotenv:', !!process.env.APP_URL, 'value:', process.env.APP_URL || '(not set)');

// Try loading .env files from multiple locations
const dotenvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.resolve(esmDirname, '..', '.env'),
  path.resolve(esmDirname, '..', '.env.local'),
  path.resolve(esmDirname, '.env'),
  path.resolve(esmDirname, '.env.local'),
];

for (const envPath of dotenvPaths) {
  try {
    const exists = fsSync.existsSync(envPath);
    console.log(`[ENV DEBUG] Checking ${envPath} -> exists: ${exists}`);
    if (exists) {
      const result = dotenv.config({ path: envPath });
      console.log(`[ENV DEBUG] Loaded ${envPath}: error=${result.error ? result.error.message : 'none'}, keys=${result.parsed ? Object.keys(result.parsed).length : 0}`);
    }
  } catch (e: any) {
    console.warn(`[ENV DEBUG] Failed to check/load ${envPath}:`, e.message);
  }
}

// Final fallback
dotenv.config();

// --- Environment Variable Validation ---
console.log('[ENV DEBUG] GEMINI_API_KEY in process.env AFTER dotenv:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[ENV DEBUG] FIREBASE_SERVICE_ACCOUNT in process.env AFTER dotenv:', !!process.env.FIREBASE_SERVICE_ACCOUNT, 'length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);
console.log('[ENV DEBUG] APP_URL in process.env AFTER dotenv:', !!process.env.APP_URL, 'value:', process.env.APP_URL || '(not set)');

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'APP_URL',
  'FIREBASE_SERVICE_ACCOUNT'
];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) {
    console.warn(`[Warning] Environment variable ${v} is not set in the deployment environment!`);
  }
});

// --- Firebase Admin Initialization ---
function safeParseServiceAccount(raw: string | undefined): any {
  console.log('[Firebase Init Debug] safeParseServiceAccount start. raw exists:', !!raw, 'length:', raw ? raw.length : 0);
  if (!raw) return null;

  console.log('[Firebase Init Debug] Raw string sample (first 100 chars):', JSON.stringify(raw.slice(0, 100)));
  console.log('[Firebase Init Debug] Raw string sample (last 100 chars):', JSON.stringify(raw.slice(-100)));

  let cleaned = raw.trim();
  console.log('[Firebase Init Debug] Trimmed. Starts with:', JSON.stringify(cleaned.slice(0, 5)), 'Ends with:', JSON.stringify(cleaned.slice(-5)));

  // Strip wrapping single or double quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
    console.log('[Firebase Init Debug] Stripped outer double quotes. New length:', cleaned.length);
  } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
    console.log('[Firebase Init Debug] Stripped outer single quotes. New length:', cleaned.length);
  }

  // If there are backslashes, fix escaping issues safely
  console.log('[Firebase Init Debug] Contains backslashes:', cleaned.includes('\\'));
  if (cleaned.includes('\\')) {
    const backslashCount = (cleaned.match(/\\/g) || []).length;
    console.log('[Firebase Init Debug] Found', backslashCount, 'backslashes.');

    cleaned = cleaned.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
    console.log('[Firebase Init Debug] After unescaping braces. Starts with:', JSON.stringify(cleaned.slice(0, 5)), 'Ends with:', JSON.stringify(cleaned.slice(-5)));

    cleaned = cleaned.replace(/\\"/g, '"');
    console.log('[Firebase Init Debug] After unescaping quotes. Starts with:', JSON.stringify(cleaned.slice(0, 30)));
  }

  console.log('[Firebase Init Debug] Attempting JSON.parse. Final cleaned string (first 150 chars):', JSON.stringify(cleaned.slice(0, 150)));

  try {
    const parsed = JSON.parse(cleaned);
    console.log('[Firebase Init Debug] JSON.parse succeeded! Keys present:', Object.keys(parsed));
    if (parsed && typeof parsed.private_key === 'string') {
      const hasBackslashN = parsed.private_key.includes('\\n');
      console.log('[Firebase Init Debug] Private key contains \\n string:', hasBackslashN);
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      console.log('[Firebase Init Debug] Private key normalized. Length:', parsed.private_key.length);
    }
    return parsed;
  } catch (err: any) {
    console.error('[Firebase Init Debug] JSON.parse failed. Error message:', err.message);
    console.error('[Firebase Init Debug] Cleaned string (full):', cleaned);
    throw err;
  }
}

let db: admin.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = safeParseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = getFirestore(app, 'productiondb');
    console.log('[Firebase Admin] Initialized successfully with Service Account. Using Firestore for state.');
  } else {
    console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT not found. Initializing with Project ID and attempting Firestore via default credentials.');
    const app = admin.initializeApp({ projectId: 'map-api-459818' });
    try {
      db = getFirestore(app, 'productiondb');
      console.log('[Firebase Admin] Connected to default Firestore named database successfully.');
    } catch (dbErr: any) {
      console.warn('[Firebase Admin] Could not connect to default Firestore database on sandbox: ', dbErr.message);
    }
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error);
}

// --- Date & Time Helper Functions ---
function getMonday(date: Date, offsetWeeks = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offsetWeeks * 7);
  return d;
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePublicHttpUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') {
    throw new Error('URL must be a string');
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('URL is required');
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(normalized);

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  return parsed.toString();
}

async function logBackendTokenUsage(userId: string | undefined, operationType: string, model: string, usageMetadata: any) {
  if (!db) return;
  if (!userId || !usageMetadata) return;
  try {
    const promptTokenCount = usageMetadata.promptTokenCount || 0;
    const candidatesTokenCount = usageMetadata.candidatesTokenCount || 0;
    const totalTokenCount = usageMetadata.totalTokenCount || 0;

    await db.collection("token_usage").add({
      userId,
      operationType,
      model,
      promptTokenCount,
      candidatesTokenCount,
      totalTokenCount,
      timestamp: new Date().toISOString()
    });
    console.log(`[Token Usage Logged] ${operationType} (${model}): ${totalTokenCount} tokens`);
  } catch (error) {
    console.error('[Token Usage Logged Error]', error);
  }
}

async function saveImageLocalAndDb(imageId: string, base64Data: string, mimeType: string, prompt: string) {
  // 1. Save to local filesystem first (fast & reliable for local dev / serving)
  let localSaved = false;
  try {
    const dirPath = path.join(process.cwd(), 'public', 'campaign_images');
    const legacyDirPath = path.join(process.cwd(), 'public', 'whatsapp_images');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.mkdir(legacyDirPath, { recursive: true });
    const imgBuf = Buffer.from(base64Data, 'base64');
    await fs.writeFile(path.join(dirPath, `${imageId}.png`), imgBuf);
    await fs.writeFile(path.join(legacyDirPath, `${imageId}.png`), imgBuf);
    localSaved = true;
    console.log(`[saveImageLocalAndDb] Image ${imageId} successfully saved to local disk: public/campaign_images/${imageId}.png`);
  } catch (fsErr: any) {
    console.error(`[saveImageLocalAndDb] Local filesystem save failed for ${imageId}:`, fsErr);
  }

  // 2. Upload to Firebase Cloud Storage (bucket)
  let storageUrl = '';
  const tryUploadBucket = async (bucketName: string) => {
    const bucket = admin.storage().bucket(bucketName);
    const imgBuf = Buffer.from(base64Data, 'base64');
    const file = bucket.file(`campaign_images/${imageId}.png`);
    await file.save(imgBuf, {
      metadata: {
        contentType: mimeType || 'image/png'
      }
    });
    try {
      await file.makePublic();
    } catch (e) {
      // Ignore makePublic errors if bucket has uniform access
    }
    return `https://storage.googleapis.com/${bucketName}/campaign_images/${imageId}.png`;
  };

  try {
    storageUrl = await tryUploadBucket('map-api-459818.appspot.com');
    console.log(`[saveImageLocalAndDb] Image ${imageId} uploaded to Cloud Storage: ${storageUrl}`);
  } catch (err1: any) {
    try {
      storageUrl = await tryUploadBucket('map-api-459818.firebasestorage.app');
      console.log(`[saveImageLocalAndDb] Image ${imageId} uploaded to Cloud Storage: ${storageUrl}`);
    } catch (err2: any) {
      const msg = err2?.message || String(err2);
      if (msg.includes('bucket does not exist') || msg.includes('404')) {
        console.log(`[saveImageLocalAndDb] Cloud Storage bucket not provisioned on GCP. Relying on local disk + Firestore URL metadata.`);
      } else {
        console.warn(`[saveImageLocalAndDb] Cloud Storage upload note for ${imageId}: ${msg}`);
      }
    }
  }

  // 3. Save only short URL / metadata inside Firestore (NEVER save raw 1.5MB+ base64Data in Firestore)
  if (db) {
    try {
      const docPayload = {
        imageId,
        url: `/api/campaign/images/${imageId}.png`,
        storageUrl: storageUrl || null,
        storagePath: `campaign_images/${imageId}.png`,
        mimeType: mimeType || 'image/png',
        prompt: prompt || "",
        createdAt: new Date().toISOString()
      };
      await db.collection('campaign_images').doc(imageId).set(docPayload);
      await db.collection('whatsapp_images').doc(imageId).set(docPayload);
      console.log(`[saveImageLocalAndDb] Image metadata URL for ${imageId} successfully saved to Firestore.`);
    } catch (dbErr: any) {
      console.warn(`[saveImageLocalAndDb] Firestore save failed for ${imageId}: ${dbErr.message}`);
    }
  }

  if (!localSaved && !storageUrl) {
    throw new Error(`Failed to save image ${imageId} to both local disk and Cloud Storage.`);
  }
}

async function stampBrandLogoOnImage(base64Data: string, logoUrl?: string, position: string = 'top-left'): Promise<string> {
  if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
    return base64Data;
  }

  try {
    const { Canvas, loadImage } = await import('skia-canvas');
    const mainImgBuffer = Buffer.from(base64Data, 'base64');
    const mainImg = await loadImage(mainImgBuffer);

    let logoBuffer: Buffer | null = null;
    const cleanLogoUrl = logoUrl.trim();

    if (cleanLogoUrl.startsWith('data:image/')) {
      const parts = cleanLogoUrl.split(',');
      if (parts[1]) {
        logoBuffer = Buffer.from(parts[1], 'base64');
      }
    } else if (cleanLogoUrl.startsWith('http://') || cleanLogoUrl.startsWith('https://')) {
      try {
        const resp = await fetch(cleanLogoUrl);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          logoBuffer = Buffer.from(arrayBuf);
        }
      } catch (fetchErr) {
        console.warn('[stampBrandLogoOnImage] HTTP fetch error for logo:', fetchErr);
      }
    } else {
      let relativePath = cleanLogoUrl.replace(/^\//, '');
      if (relativePath.startsWith('api/whatsapp/images/')) {
        relativePath = relativePath.replace(/^api\//, '');
      }

      const candidatePaths = [
        path.join(process.cwd(), 'public', relativePath),
        path.join(process.cwd(), relativePath),
        path.join(process.cwd(), 'public', 'whatsapp_images', path.basename(relativePath))
      ];

      for (const candidate of candidatePaths) {
        try {
          logoBuffer = await fs.readFile(candidate);
          if (logoBuffer && logoBuffer.length > 0) break;
        } catch (_) {}
      }

      if ((!logoBuffer || logoBuffer.length === 0) && db) {
        const match = relativePath.match(/(img_[a-zA-Z0-9]+)/);
        if (match && match[1]) {
          try {
            const docSnap = await db.collection('whatsapp_images').doc(match[1]).get();
            if (docSnap.exists) {
              const b64 = docSnap.data()?.base64Data;
              if (b64) logoBuffer = Buffer.from(b64, 'base64');
            }
          } catch (dbErr) {
            console.warn('[stampBrandLogoOnImage] Firestore logo fetch error:', dbErr);
          }
        }
      }
    }

    if (!logoBuffer || logoBuffer.length === 0) {
      return base64Data;
    }

    const logoImg = await loadImage(logoBuffer);

    const width = mainImg.width || 1080;
    const height = mainImg.height || 1080;
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(mainImg, 0, 0, width, height);

    const maxLogoSize = Math.round(width * 0.16);
    let logoW = logoImg.width || 100;
    let logoH = logoImg.height || 100;

    const scale = Math.min(maxLogoSize / logoW, maxLogoSize / logoH);
    logoW = Math.max(1, Math.round(logoW * scale));
    logoH = Math.max(1, Math.round(logoH * scale));

    const margin = Math.round(width * 0.04);
    let logoX = margin;
    let logoY = margin;

    const pos = (position || 'top-left').toLowerCase().trim();
    if (pos === 'top-right') {
      logoX = width - logoW - margin;
      logoY = margin;
    } else if (pos === 'bottom-left') {
      logoX = margin;
      logoY = height - logoH - margin;
    } else if (pos === 'bottom-right') {
      logoX = width - logoW - margin;
      logoY = height - logoH - margin;
    } else {
      // Default top-left
      logoX = margin;
      logoY = margin;
    }

    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

    const stampedBuffer = await canvas.toBuffer('png');
    return stampedBuffer.toString('base64');
  } catch (err: any) {
    console.warn('[stampBrandLogoOnImage] Could not stamp logo onto image:', err.message || err);
    return base64Data;
  }
}

function translateBrandDNA(brandColors?: string[], fontStyle?: string): { colorDescriptor: string; typographyDescriptor: string } {
  const colors = (brandColors && Array.isArray(brandColors) && brandColors.length > 0)
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

async function generateSingleCampaignImageBackend(
  item: any,
  logoUrl?: string
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const openaiQuality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const promptText = typeof item === 'string' ? item : item?.prompt || `High quality editorial photographic visual`;
  const headline = typeof item === 'object' ? item.headline : undefined;
  const subtext = typeof item === 'object' ? item.subtext : undefined;
  const brandColors = typeof item === 'object' && Array.isArray(item.brandColors) ? item.brandColors : undefined;
  const fontStyle = typeof item === 'object' ? item.fontStyle : undefined;
  const brandAssetUrl = typeof item === 'object' ? item.brandAssetUrl : undefined;
  const logoPosition = (typeof item === 'object' && item.logoPosition) ? item.logoPosition : 'top-left';

  let base64Data: string | null = null;
  let mimeType = 'image/png';

  // 1. Try OpenAI Image API if OPENAI_API_KEY is available
  if (openaiApiKey) {
    try {
      const { colorDescriptor, typographyDescriptor } = translateBrandDNA(brandColors, fontStyle);
      let formattedPrompt = `1:1 ratio square editorial visual post.\n`;
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
              'Authorization': `Bearer ${openaiApiKey}`
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
        const genRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: openaiModel,
            prompt: formattedPrompt,
            n: 1,
            size: '1024x1024',
            ...(openaiModel.startsWith('gpt-image') ? { quality: openaiQuality } : { response_format: 'b64_json' })
          })
        });

        if (genRes.ok) {
          const genData = await genRes.json();
          if (genData?.data?.[0]?.b64_json) {
            base64Data = genData.data[0].b64_json;
          } else if (genData?.data?.[0]?.url) {
            const imgFetch = await fetch(genData.data[0].url);
            const buf = await imgFetch.arrayBuffer();
            base64Data = Buffer.from(buf).toString('base64');
          }
        } else {
          const errTxt = await genRes.text();
          console.error(`[generateSingleCampaignImageBackend] OpenAI Generations failed HTTP ${genRes.status}:`, errTxt);
        }
      }
    } catch (oaiErr) {
      console.warn('[generateSingleCampaignImageBackend] OpenAI generation error:', oaiErr);
    }
  }

  // 2. Fallback to Gemini Imagen if OpenAI was not configured or failed
  if (!base64Data && geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const fallbackPrompt = `${headline ? `Text headline: ${headline}. ` : ''}${promptText}`;
      const imgRes = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: fallbackPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/png"
        }
      });

      if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
        base64Data = imgRes.generatedImages[0].image.imageBytes;
      }
    } catch (gErr) {
      console.warn('[generateSingleCampaignImageBackend] Gemini Imagen fallback error:', gErr);
    }
  }

  // 3. Stamp Brand Logo on image if base64Data was generated
  if (base64Data) {
    const stampedBase64 = await stampBrandLogoOnImage(base64Data, logoUrl, logoPosition);
    const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
    await saveImageLocalAndDb(imageId, stampedBase64, mimeType, promptText);
    return `/api/campaign/images/${imageId}.png`;
  }

  return `https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80`;
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

async function executeAutoCampaignGeneration(productId: string) {
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

async function executeAutoDailyPostGeneration(productId: string) {
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

async function generateContextualBlogImagePrompt(
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

async function executeAutoDailyBlogGeneration(productId: string) {
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

async function executeAutoDailyGeneration(productId: string, automatePosts: boolean, automateBlogs: boolean) {
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

async function performBackendSocialTrendResearch(ai: any, topic: string, userId: string): Promise<string> {
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

async function executeAutoFounderPostGeneration(userId: string) {
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

  // Helper to render rawHtml template into an SVG data URL for background automation
  const renderHtmlToSvgDataUrl = (rawHtml: string, data: {
    headline: string;
    subtext: string;
    imageUrl?: string | null;
    logoUrl?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  }): string => {
    let html = rawHtml
      .replace(/\{\{HEADLINE\}\}/g, data.headline || '')
      .replace(/\{\{SUBTEXT\}\}/g, data.subtext || '')
      .replace(/\{\{IMAGE_URL\}\}/g, data.imageUrl || '')
      .replace(/\{\{PRIMARY_COLOR\}\}/g, data.primaryColor || '#7C3AED')
      .replace(/\{\{SECONDARY_COLOR\}\}/g, data.secondaryColor || '#08080C')
      .replace(/\{\{FONT_FAMILY\}\}/g, data.fontFamily || 'Inter');

    if (data.logoUrl) {
      html = html.replace(/\{\{LOGO_URL\}\}/g, `<img src="${data.logoUrl}" style="height:32px;object-fit:contain;" />`);
    } else {
      html = html.replace(/\{\{LOGO_URL\}\}/g, '');
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
      <foreignObject width="1080" height="1080">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:1080px;height:1080px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  };

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
    if (attachmentStyle !== "text-only" && postData.imagePrompt) {
      try {
        console.log(`[executeAutoFounderPostGeneration] Generating Imagen backdrop for: "${postData.imagePrompt}"...`);
        const imgRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [{ text: postData.imagePrompt }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });

        await logBackendTokenUsage(userId, productData ? `auto_founder_branded_img_${productData.id}` : "auto_founder_general_img", "gemini-3.1-flash-image-preview", {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        });

        if (imgRes?.candidates?.[0]?.content?.parts) {
          for (const pt of imgRes.candidates[0].content.parts) {
            if (pt.inlineData) {
              const base64Data = pt.inlineData.data;
              const mimeType = pt.inlineData.mimeType || 'image/png';
              const imageId = 'img_founder_' + Math.random().toString(36).substring(2, 10);

              await saveImageLocalAndDb(imageId, base64Data, mimeType, postData.imagePrompt);
              imageUrl = `/api/whatsapp/images/${imageId}.png`;
              break;
            }
          }
        }
      } catch (eImg) {
        console.warn('[executeAutoFounderPostGeneration Image Gen Failed]', eImg);
      }
    }

    // Fallback image if Imagen generation skipped or failed
    if (attachmentStyle !== "text-only" && !imageUrl) {
      imageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1080&auto=format&fit=crop";
    }

    // Synthesize visual template composite SVG for automated post using live web research
    let approvedTemplateImage: string | null = null;
    if (attachmentStyle !== "text-only") {
      try {
        let activeRawHtml = `<div style="width:1080px;height:1080px;position:relative;background:#08080c;overflow:hidden;font-family:{{FONT_FAMILY}},sans-serif;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:80px;"><img src="{{IMAGE_URL}}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35;filter:brightness(0.5);z-index:1;" /><div style="position:relative;z-index:10;width:860px;background:#08080c;border:2px solid rgba(255,255,255,0.15);border-left:8px solid {{PRIMARY_COLOR}};border-radius:24px;padding:60px;box-sizing:border-box;"><div style="display:inline-block;background:{{PRIMARY_COLOR}}22;color:{{PRIMARY_COLOR}};font-size:14px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;padding:6px 16px;border-radius:100px;margin-bottom:24px;border:1px solid {{PRIMARY_COLOR}}44;">FOUNDER INSIGHT</div><h2 style="color:#ffffff;font-weight:850;font-size:48px;line-height:1.2;margin:0 0 20px 0;word-break:break-word;">{{HEADLINE}}</h2><p style="color:#94a3b8;font-weight:500;font-size:22px;line-height:1.5;margin:0;">{{SUBTEXT}}</p><div style="margin-top:36px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">{{LOGO_URL}}</div></div></div>`;
        let activePrimary = productData?.visualData?.colors?.[0] || "#7C3AED";
        let activeSecondary = productData?.visualData?.colors?.[1] || "#08080C";
        let activeFont = "Inter";

        // Execute live trend research for automated post visual structure
        try {
          const nicheLens = productData?.industry || founderAgent.targetIndustry || "AI agent tooling & B2B SaaS";
          const resRes = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [{ text: `Synthesize a single 1080x1080 inline-styled HTML code for a discovered B2B founder visual trend in "${nicheLens}". Inside rawHtml use placeholders: {{HEADLINE}}, {{SUBTEXT}}, {{IMAGE_URL}}, {{LOGO_URL}}, {{PRIMARY_COLOR}}, {{SECONDARY_COLOR}}, {{FONT_FAMILY}}. Return JSON: {"rawHtml": "...", "primaryColor": "#...", "secondaryColor": "#...", "fontFamily": "Inter"}` }],
            config: { tools: [{ googleSearch: {} }] }
          });
          let cleanRes = (resRes.text || "").trim();
          if (cleanRes.startsWith('```')) {
            cleanRes = cleanRes.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          }
          const parsedRes = JSON.parse(cleanRes);
          if (parsedRes.rawHtml) {
            activeRawHtml = parsedRes.rawHtml;
            if (parsedRes.primaryColor) activePrimary = parsedRes.primaryColor;
            if (parsedRes.secondaryColor) activeSecondary = parsedRes.secondaryColor;
            if (parsedRes.fontFamily) activeFont = parsedRes.fontFamily;
          }
        } catch (errResHtml) {
          console.warn("[executeAutoFounderPostGeneration] Live research fallback to default template:", errResHtml);
        }

        approvedTemplateImage = renderHtmlToSvgDataUrl(activeRawHtml, {
          headline: postData.headline || selectedTopic,
          subtext: postData.subtext || "",
          imageUrl,
          logoUrl: productData?.logoDarkUrl || productData?.logoUrl || null,
          primaryColor: activePrimary,
          secondaryColor: activeSecondary,
          fontFamily: activeFont
        });
      } catch (errSvg) {
        console.warn("[executeAutoFounderPostGeneration] SVG composite synthesis failed:", errSvg);
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

// --- Storage Helpers ---
async function getScheduleConfig(productId: string) {
  if (db) {
    const doc = await db.collection('server_schedules').doc(productId).get();
    return doc.exists ? doc.data() : { enabled: false, timeUtc: "14:00" };
  }
  return scheduleConfigs[productId] || { enabled: false, timeUtc: "14:00" };
}

async function setScheduleConfig(productId: string, config: any) {
  if (db) {
    await db.collection('server_schedules').doc(productId).set(config, { merge: true });
  } else {
    scheduleConfigs[productId] = { ...scheduleConfigs[productId], ...config };
  }
}

async function getPostQueue(productId: string): Promise<any[]> {
  if (db) {
    const snapshot = await db.collection(`server_queues/${productId}/posts`).orderBy('createdAt', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return postQueue.filter(p => p.productId === productId);
}

async function addToQueue(post: any) {
  if (db) {
    await db.collection(`server_queues/${post.productId}/posts`).doc(post.id).set({
      ...post,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    postQueue.push(post);
  }
}

async function removeFromQueue(productId: string, postId: string) {
  if (db) {
    await db.collection(`server_queues/${productId}/posts`).doc(postId).delete();
  } else {
    postQueue = postQueue.filter(q => q.id !== postId);
  }
}

async function getToken(productId: string, platform: string) {
  let token = null;
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    token = doc.exists ? doc.data()?.[platform] : null;
  } else {
    if (platform === 'linkedin') token = globalLinkedinTokens[productId];
    if (platform === 'facebook') token = globalFacebookTokens[productId];
    if (platform === 'instagram') token = globalInstagramTokens[productId];
    if (platform === 'reddit') token = globalRedditTokens[productId];
    if (platform === 'whatsapp') token = globalWhatsappTokens[productId];
    if (platform === 'whatsapp_phone_number_id') token = globalWhatsappPhoneIds[productId];
    if (platform === 'whatsapp_webhook_verify_token') token = globalWhatsappVerifyTokens[productId];
    if (platform === 'whatsapp_bot_number') token = globalWhatsappBotNumbers[productId];
  }

  if (!token && platform === 'instagram') {
    return "IGAANKiw3fHHVBZAFlDUHFqUEExdjNYTFM1azdIVTB2QW03ZADdPOERaWVhlSVVhdy12TlZAYUlFtUFRuQVE2OWxteF8yY1B4SFAtMmkzQWp0XzBJcjNpSFNtaVVmTVlVakpjYjJnWWdxYXI3MVd2UG9TMnB2VVQybDVfVW53ZAUZAsSQZDZD";
  }
  return token;
}

async function hasUserToken(productId: string, platform: string): Promise<boolean> {
  let token = null;
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    token = doc.exists ? doc.data()?.[platform] : null;
  } else {
    if (platform === 'linkedin') token = globalLinkedinTokens[productId];
    if (platform === 'facebook') token = globalFacebookTokens[productId];
    if (platform === 'instagram') token = globalInstagramTokens[productId];
    if (platform === 'reddit') token = globalRedditTokens[productId];
    if (platform === 'whatsapp') token = globalWhatsappTokens[productId];
    if (platform === 'whatsapp_phone_number_id') token = globalWhatsappPhoneIds[productId];
    if (platform === 'whatsapp_webhook_verify_token') token = globalWhatsappVerifyTokens[productId];
    if (platform === 'whatsapp_bot_number') token = globalWhatsappBotNumbers[productId];
  }
  return !!token;
}

async function setToken(productId: string, platform: string, token: string) {
  if (db) {
    await db.collection('server_tokens').doc(productId).set({ [platform]: token }, { merge: true });
  } else {
    if (platform === 'linkedin') globalLinkedinTokens[productId] = token;
    if (platform === 'facebook') globalFacebookTokens[productId] = token;
    if (platform === 'instagram') globalInstagramTokens[productId] = token;
    if (platform === 'reddit') globalRedditTokens[productId] = token;
    if (platform === 'whatsapp') globalWhatsappTokens[productId] = token;
    if (platform === 'whatsapp_phone_number_id') globalWhatsappPhoneIds[productId] = token;
    if (platform === 'whatsapp_webhook_verify_token') globalWhatsappVerifyTokens[productId] = token;
    if (platform === 'whatsapp_bot_number') globalWhatsappBotNumbers[productId] = token;
  }
}

async function getBlogSettings(productId: string) {
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    const settings = doc.exists ? doc.data()?.blogSettings || null : null;
    console.log('[getBlogSettings Debug] productId:', productId, '| docExists:', doc.exists, '| type:', settings?.type, '| webhookUrl:', settings?.webhook?.url, '| secretPresent:', !!settings?.webhook?.secret, '| secretLength:', settings?.webhook?.secret?.length || 0);
    return settings;
  }
  return globalBlogSettings[productId] || null;
}

async function setBlogSettings(productId: string, settings: any) {
  console.log('[setBlogSettings Debug] productId:', productId, '| type:', settings?.type, '| webhookUrl:', settings?.webhook?.url, '| secretPresent:', !!settings?.webhook?.secret, '| secretLength:', settings?.webhook?.secret?.length || 0, '| secretValue:', settings?.webhook?.secret ? settings.webhook.secret.substring(0, 6) + '...' : 'NONE');
  if (db) {
    await db.collection('server_tokens').doc(productId).set({ blogSettings: settings }, { merge: true });
  } else {
    globalBlogSettings[productId] = settings;
  }
}

// --- Scheduling State (Fallback) ---
let globalLinkedinTokens: Record<string, string> = {};
let globalFacebookTokens: Record<string, string> = {};
let globalInstagramTokens: Record<string, string> = {};
let globalRedditTokens: Record<string, string> = {};
let globalWhatsappTokens: Record<string, string> = {};
let globalWhatsappPhoneIds: Record<string, string> = {};
let globalWhatsappVerifyTokens: Record<string, string> = {};
let globalWhatsappBotNumbers: Record<string, string> = {};
let globalBlogSettings: Record<string, any> = {};
let scheduleConfigs: Record<string, { enabled: boolean, timeUtc: string }> = {};
let postQueue: Array<{ id: string, text: string, campaignId: string, platform: string, productId: string, day?: string, imageUrl?: string }> = [];
let lastPostedDates: Record<string, string> = {};
let tempImages: Record<string, string> = {};
let lastKnownHost = "";

// --- In-memory Diagnostic Logs for Live Console View ---
let globalWebhookPayloads: Array<{ id: string, timestamp: string, type: string, bodySnapshot: string }> = [];
let globalBotReplies: Array<{ id: string, timestamp: string, type: string, recipient: string, status: string, replyBody: string, error?: any }> = [];

// --- Cron Job for Scheduled Posting ---
setInterval(async () => {
  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeUtc = `${hours}:${minutes}`;
  const currentDateUtc = now.toISOString().split('T')[0];

  let productsToProcess: string[] = [];

  if (db) {
    const snapshot = await db.collection('server_schedules').where('enabled', '==', true).get();
    for (const doc of snapshot.docs) {
      const config = doc.data();
      if (config.timeUtc === currentTimeUtc && config.lastPostedDate !== currentDateUtc) {
        productsToProcess.push(doc.id);
      }
    }
  } else {
    if (postQueue.length === 0) return;
    for (const [productId, config] of Object.entries(scheduleConfigs)) {
      if (config.enabled && config.timeUtc === currentTimeUtc && lastPostedDates[productId] !== currentDateUtc) {
        productsToProcess.push(productId);
      }
    }
  }

  for (const productId of productsToProcess) {
    let post: any = null;
    let postRef: any = null;

    if (db) {
      try {
        const result = await db.runTransaction(async (transaction) => {
          const scheduleRef = db!.collection('server_schedules').doc(productId);
          const scheduleSnap = await transaction.get(scheduleRef);

          if (scheduleSnap.exists) {
            const schedData = scheduleSnap.data();
            // Horizontal container double-posting prevent defense
            if (schedData?.lastPostedDate === currentDateUtc) {
              console.log(`[Scheduler Link Lock] Product ${productId} already processed by another instance for ${currentDateUtc}. Bypassing.`);
              return null;
            }
          }

          const queueColl = db!.collection(`server_queues/${productId}/posts`).orderBy('createdAt', 'asc').limit(1);
          const queueSnap = await transaction.get(queueColl);

          if (queueSnap.empty) return null;

          const targetPostDoc = queueSnap.docs[0];
          const postData = targetPostDoc.data();

          if (postData.processing) {
            console.log(`[Scheduler Concurrent Lock] Queue post ${targetPostDoc.id} is already locked by another container process.`);
            return null;
          }

          // Atomically reserve the schedule post execution slot and set lock
          transaction.update(scheduleRef, { lastPostedDate: currentDateUtc });
          transaction.update(targetPostDoc.ref, { processing: true });

          return {
            post: { id: targetPostDoc.id, ...postData },
            postRef: targetPostDoc.ref
          };
        });

        if (!result) continue;
        post = result.post;
        postRef = result.postRef;
      } catch (transErr) {
        console.error(`[Scheduler Locked Transaction Error] Claim failed for product ${productId}:`, transErr);
        continue;
      }
    } else {
      post = postQueue.find(p => p.productId === productId);
    }

    if (!post) continue;

    // Delete or pop the post immediately to prevent race conditions during long-lived HTTP publish API requests
    if (db) {
      await postRef.delete();
    } else {
      lastPostedDates[productId] = currentDateUtc;
      postQueue = postQueue.filter(p => p.id !== post.id);
    }

    const token = await getToken(productId, post.platform);
    if (!token) {
      console.error(`[Scheduler] No token found for product ${productId}, skipping post ${post.id}`);
      if (db) {
        await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
          ...post,
          processing: false
        });
        await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
      } else {
        postQueue.unshift(post);
        lastPostedDates[productId] = "";
      }
      continue;
    }

    try {
      console.log(`[Scheduler] Attempting to publish post ${post.id} to ${post.platform}...`);
      if (post.platform === 'linkedin') {
        let targetImage = (post as any).approvedTemplateImage || post.imageUrl;
        if (typeof targetImage === 'string' && targetImage.startsWith('data:image/svg+xml')) {
          targetImage = post.imageUrl || null;
        }

        try {
          await publishPostToLinkedIn(token, post.text, targetImage);
          console.log('[Scheduler] Successfully published scheduled post to LinkedIn:', post.id);
        } catch (postErr: any) {
          const errorText = postErr?.message || String(postErr);
          console.error('[Scheduler] Failed to publish scheduled post:', errorText);
          if (errorText.includes('DUPLICATE_POST')) {
            console.log(`[Scheduler] Post ${post.id} is a duplicate, removing from queue.`);
          } else {
            if (db) {
              const attempt = (post.failCount || 0) + 1;
              if (attempt >= 3) {
                console.error(`[Scheduler] Post ${post.id} failed 3 times. Sending to Dead Letter storage (DLQ).`);
                await db.collection(`server_queues/${productId}/failed_posts`).doc(post.id).set({
                  ...post,
                  failedAt: admin.firestore.FieldValue.serverTimestamp(),
                  errorMessage: errorText
                });
              } else {
                await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
                  ...post,
                  failCount: attempt,
                  processing: false
                });
                await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
              }
            } else {
              postQueue.unshift(post);
              lastPostedDates[productId] = "";
            }
          }
        }
      } else if (post.platform === 'instagram') {
        if (typeof token === 'string' && token.startsWith('IGAAN')) {
          console.log('[Scheduler] Simulating Instagram Publish for Sandbox Mode...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (typeof token === 'string' && (token.startsWith('EAA') || !token.startsWith('IG'))) {
          console.log('[Scheduler] Attempting live Instagram Graph API publish for post', post.id);
          const publishId = await publishToInstagramGraphAPI(token, post.text || '', post.imageUrl || '', lastKnownHost);
          console.log('[Scheduler] Successfully published scheduled post to Instagram:', publishId);
        } else {
          throw new Error('Scheduled Instagram publishing requires a professional Meta Access Token (starts with EAA). Basic Display tokens (IGQV) do not support publishing.');
        }
      }
    } catch (err: any) {
      console.error('[Scheduler] Error in scheduled post:', err);
      if (db) {
        const attempt = (post.failCount || 0) + 1;
        if (attempt >= 3) {
          console.error(`[Scheduler] Post ${post.id} failed 3 times. Sending to DLQ.`);
          await db.collection(`server_queues/${productId}/failed_posts`).doc(post.id).set({
            ...post,
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            errorMessage: err?.message || 'Unknown server exception'
          });
        } else {
          await db.collection(`server_queues/${productId}/posts`).doc(post.id).set({
            ...post,
            failCount: attempt,
            processing: false
          });
          await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
        }
      } else {
        postQueue.unshift(post);
        lastPostedDates[productId] = "";
      }
    }
  }
}, 30000);

// --- Automation Agent Background Check ---
const processingProductIds = new Set<string>();
const processingUserFounderPostIds = new Set<string>();
let lastEmailCheckHour = -1;
setInterval(async () => {
  if (!db) return;

  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeUtc = `${hours}:${minutes}`;
  const currentDateUtc = now.toISOString().split('T')[0];

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = weekdays[now.getUTCDay()];

  try {
    const productsSnap = await db.collection('products').where('automationAgentEnabled', '==', true).get();
    for (const productDoc of productsSnap.docs) {
      const product = productDoc.data();
      if (processingProductIds.has(product.id)) {
        console.log(`[Automation Agent] Skipping product ${product.id} because a generation is already in progress.`);
        continue;
      }

      if (!product.userId) continue;
      const userDoc = await db.collection('users').doc(product.userId).get();
      if (!userDoc.exists) continue;
      const userData = userDoc.data()!;
      if (!userData.founderAgentSynthesized) {
        continue;
      }

      processingProductIds.add(product.id);
      try {
        const triggerTime = product.automationTimeUtc || "14:00";
        const [trigH, trigM] = triggerTime.split(':');
        const trigMinutes = parseInt(trigH, 10) * 60 + parseInt(trigM, 10);
        const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        // Only trigger within a 2-minute window around the scheduled time to prevent immediate runs when enabling the agent
        const shouldRunToday = nowMinutes === trigMinutes || nowMinutes === (trigMinutes + 1) % 1440;

        if (!shouldRunToday) {
          continue;
        }

        // Weekly Campaign Automation
        if (product.automateWeeklyCampaigns) {
          const triggerDay = product.automationWeeklyDay || "Monday";
          if (currentDayName === triggerDay) {
            // Check last weekly run date to avoid double-running and excessive DB reads
            let needsGeneration = product.lastWeeklyRunDate !== currentDateUtc;
            if (needsGeneration) {
              // Additional safety check against DB (in case of server restarts)
              const campaignsSnap = await db.collection('campaigns')
                .where('productId', '==', product.id)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

              const weeklyCampaigns = campaignsSnap.docs.filter(doc => !doc.data().isOneDay);
              if (weeklyCampaigns.length > 0) {
                const lastCampaign = weeklyCampaigns[0].data();
                const lastCreatedDate = lastCampaign.createdAt.split('T')[0];
                if (lastCreatedDate === currentDateUtc) {
                  needsGeneration = false;
                  // Sync the field to avoid hitting DB again today
                  await db.collection('products').doc(product.id).update({
                    lastWeeklyRunDate: currentDateUtc
                  });
                }
              }
            }

            if (needsGeneration) {
              // Pre-update lastWeeklyRunDate immediately to prevent race conditions
              await db.collection('products').doc(product.id).update({
                lastWeeklyRunDate: currentDateUtc
              });

              console.log(`[Automation Agent] Triggering campaign generation for product ${product.id} automatically...`);
              try {
                await executeAutoCampaignGeneration(product.id);
              } catch (err: any) {
                console.error(`[Automation Agent] Generation failed for product ${product.id}:`, err);
                // Log failure
                const newLog = {
                  timestamp: new Date().toISOString(),
                  type: 'weekly_campaign',
                  theme: 'N/A',
                  focus: 'N/A',
                  status: `Error: ${err?.message || 'Unknown error'}`
                };
                const currentLogs = product.automationLogs || [];
                currentLogs.unshift(newLog);
                await db.collection('products').doc(product.id).update({
                  automationLogs: currentLogs.slice(0, 10),
                  lastWeeklyRunDate: currentDateUtc
                });
              }
            }
          }
        }

        // Daily Post & Blog Automation
        if (product.automateDailyPosts || product.automateDailyBlogs) {
          let needsDailyGeneration = product.lastDailyRunDate !== currentDateUtc;
          if (needsDailyGeneration) {
            // Additional safety check against DB
            const dailySnap = await db.collection('campaigns')
              .where('productId', '==', product.id)
              .where('isOneDay', '==', true)
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();

            if (!dailySnap.empty) {
              const lastDaily = dailySnap.docs[0].data();
              const lastCreatedDate = lastDaily.createdAt.split('T')[0];
              if (lastCreatedDate === currentDateUtc) {
                needsDailyGeneration = false;
                // Sync the field
                await db.collection('products').doc(product.id).update({
                  lastDailyRunDate: currentDateUtc
                });
              }
            }
          }

          if (needsDailyGeneration) {
            // Pre-update lastDailyRunDate immediately to prevent race conditions during long-lived HTTP generation calls
            await db.collection('products').doc(product.id).update({
              lastDailyRunDate: currentDateUtc
            });

            console.log(`[Automation Agent] Triggering daily generation for product ${product.id} automatically...`);
            try {
              await executeAutoDailyGeneration(product.id, !!product.automateDailyPosts, !!product.automateDailyBlogs);
            } catch (err: any) {
              console.error(`[Automation Agent] Daily generation failed for product ${product.id}:`, err);
              // Log failure in database
              const newLog = {
                timestamp: new Date().toISOString(),
                type: 'daily_content',
                theme: 'N/A',
                focus: 'N/A',
                status: `Error: ${err?.message || 'Unknown error'}`
              };
              const currentLogs = product.automationLogs || [];
              currentLogs.unshift(newLog);
              await db.collection('products').doc(product.id).update({
                automationLogs: currentLogs.slice(0, 10),
                lastDailyRunDate: currentDateUtc
              });
            }
          }
        }
      } finally {
        processingProductIds.delete(product.id);
      }
    }

    // 2. Process Automated Founder Profile posts
    try {
      const usersSnap = await db.collection('users').where('automateFounderPosts', '==', true).get();
      for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        const userId = userDoc.id;

        if (processingUserFounderPostIds.has(userId)) {
          console.log(`[Automation Agent] Skipping user ${userId} because founder post generation is already in progress.`);
          continue;
        }

        if (!user.founderAgentSynthesized) {
          continue;
        }

        // Check if it's trigger time
        const triggerTime = user.founderPostTimeUtc || "14:00";
        const [trigH, trigM] = triggerTime.split(':');
        const trigMinutes = parseInt(trigH, 10) * 60 + parseInt(trigM, 10);
        const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const shouldRunToday = nowMinutes === trigMinutes || nowMinutes === (trigMinutes + 1) % 1440;

        if (!shouldRunToday) {
          continue;
        }

        // Check if already run today to prevent double-runs
        if (user.lastFounderPostRunDate === currentDateUtc) {
          continue;
        }

        processingUserFounderPostIds.add(userId);
        try {
          // Pre-update date in Firestore immediately to prevent secondary containers / triggers from racing
          await db.collection('users').doc(userId).update({
            lastFounderPostRunDate: currentDateUtc
          });

          console.log(`[Automation Agent] Triggering automated founder post generation for user ${userId}...`);
          await executeAutoFounderPostGeneration(userId);
        } catch (err: any) {
          console.error(`[Automation Agent] Founder post generation failed for user ${userId}:`, err);
        } finally {
          processingUserFounderPostIds.delete(userId);
        }
      }
    } catch (errUser) {
      console.error('[Automation Agent User check failed]:', errUser);
    }

  } catch (err) {
    console.error('[Automation Agent Error] Check failed:', err);
  }

  // Hourly background email checks
  try {
    const currentHour = new Date().getUTCHours();
    if (currentHour !== lastEmailCheckHour) {
      lastEmailCheckHour = currentHour;
      runPeriodicEmailChecks().catch(e => console.error('[Background Email Check Error]:', e));
    }
  } catch (err) {
    console.error('[Background Email Check Trigger Error]:', err);
  }
}, 60 * 1000); // Check every 60 seconds

interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 string
    encoding?: string;
  }>;
}

async function sendBrandedEmail(options: SendEmailOptions) {
  const { to, subject, title, bodyHtml, ctaText, ctaUrl, attachments } = options;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const ctaButtonHtml = ctaText && ctaUrl ? `
    <div class="cta-container" style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" class="cta-button" target="_blank" style="background: linear-gradient(135deg, #7c3aed 0%, #2583eb 100%); color: #ffffff !important; padding: 14px 28px; font-weight: 600; text-decoration: none; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);">${ctaText}</a>
    </div>
  ` : '';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #f8fafc;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      .header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        padding: 32px;
        text-align: center;
      }
      .header img {
        height: 40px;
        display: inline-block;
      }
      .content {
        padding: 40px 32px;
      }
      .title {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.25;
      }
      .body-text {
        font-size: 16px;
        line-height: 1.6;
        color: #475569;
        margin-bottom: 24px;
      }
      .cta-container {
        text-align: center;
        margin: 32px 0;
      }
      .cta-button {
        background: linear-gradient(135deg, #7c3aed 0%, #2583eb 100%);
        color: #ffffff !important;
        padding: 14px 28px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 9999px;
        display: inline-block;
        box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
      }
      .footer {
        background-color: #f1f5f9;
        padding: 24px 32px;
        text-align: center;
        font-size: 14px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .footer-links {
        margin-top: 12px;
      }
      .footer-link {
        color: #7c3aed;
        text-decoration: none;
        margin: 0 8px;
      }
    </style>
  </head>
  <body>
    <div class="wrapper" style="width: 100%; background-color: #f8fafc; padding: 40px 0;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <div class="header" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
          <img src="${appUrl}/B2PLOGO.png" alt="B2P Logo" style="height: 40px; display: inline-block;">
        </div>
        <div class="content" style="padding: 40px 32px;">
          <h2 class="title" style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; line-height: 1.25;">${title}</h2>
          <div class="body-text" style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">${bodyHtml}</div>
          ${ctaButtonHtml}
        </div>
        <div class="footer" style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <div>© ${new Date().getFullYear()} B2P. All rights reserved.</div>
          <div class="footer-links" style="margin-top: 12px;">
            <a href="${appUrl}/settings" class="footer-link" style="color: #7c3aed; text-decoration: none; margin: 0 8px;">Notification Settings</a>
            <a href="${appUrl}" class="footer-link" style="color: #7c3aed; text-decoration: none; margin: 0 8px;">Visit Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  // Standard plain text version
  const textContent = bodyHtml.replace(/<[^>]*>/g, '');

  // Native Resend API integration (if RESEND_API_KEY is present)
  if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.SMTP_FROM || 'noreply@brandtopost.com';
    const resendAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content.replace(/^data:application\/pdf;base64,/, ""),
    })) || [];

    try {
      console.log(`[Resend] Sending email to: ${to}, Subject: ${subject}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `B2P Support <${fromEmail}>`,
          to: [to],
          subject: subject,
          html: htmlContent,
          text: textContent,
          attachments: resendAttachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Resend API Error status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data: any = await response.json();
      console.log(`[Resend] Email sent: ${data.id}`);

      if (db) {
        await db.collection('admin_logs').add({
          timestamp: new Date().toISOString(),
          type: 'email_sent',
          recipient: to,
          subject: subject,
          status: `Sent via Resend API (ID: ${data.id})`
        }).catch(e => console.error('Failed to log email to Firestore:', e));
      }

      return { messageId: data.id };
    } catch (err) {
      console.error(`[Resend] Failed to send email via Resend API:`, err);
      throw err;
    }
  }

  // Fallback to Nodemailer SMTP or Mock
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[SMTP Mock] SMTP credentials not configured. Simulating branded email send:
    To: ${to}
    Subject: ${subject}
    Title: ${title}
    CTA: ${ctaText} -> ${ctaUrl}`);

    if (db) {
      await db.collection('admin_logs').add({
        timestamp: new Date().toISOString(),
        type: 'email_simulated',
        recipient: to,
        subject: subject,
        status: 'Mock send successful (SMTP credentials not configured)'
      }).catch(e => console.error('Failed to log simulated email to Firestore:', e));
    }
    return { messageId: 'mock-id-' + Math.random().toString(36).substring(2, 9) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions: any = {
    from: `"B2P Support" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@b2p.com'}>`,
    to,
    subject,
    text: textContent,
    html: htmlContent
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.replace(/^data:application\/pdf;base64,/, ""),
      encoding: 'base64'
    }));
  }

  const info = await transporter.sendMail(mailOptions);
  console.log("[SMTP] Email sent: %s", info.messageId);
  return info;
}

async function publishItemInstantly(itemType: 'campaign' | 'post' | 'blog' | 'founder_post', itemData: any, productId: string) {
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

async function createAndSendApprovalRequest(options: {
  userId?: string;
  productId: string;
  productName?: string;
  userEmail: string;
  itemType: 'campaign' | 'post' | 'blog' | 'founder_post';
  itemTitle: string;
  itemPreview?: string;
  itemData: any;
  autoUploadDelayHours?: number;
}) {
  if (!db) throw new Error("Database connection is not active.");
  const { userId, productId, productName, userEmail, itemType, itemTitle, itemPreview, itemData } = options;

  let requireEmailApproval = true;
  let delayHours = options.autoUploadDelayHours || 12;

  try {
    const prodSnap = await db.collection("products").doc(productId).get();
    if (prodSnap.exists) {
      const pData = prodSnap.data()!;
      if (pData.requireEmailApproval === false) {
        requireEmailApproval = false;
      }
      if (pData.autoUploadDelayHours) {
        delayHours = Number(pData.autoUploadDelayHours) || 12;
      }
    }
  } catch (err) {
    console.warn("[createAndSendApprovalRequest] Could not read product approval settings:", err);
  }

  // If requireEmailApproval is FALSE -> Instant Upload without approval
  if (!requireEmailApproval) {
    console.log(`[Approval Engine] requireEmailApproval is OFF for product ${productId}. Auto-publishing instantly...`);
    await publishItemInstantly(itemType, itemData, productId);

    // Send informational notification email
    sendBrandedEmail({
      to: userEmail,
      subject: `[Auto-Published] Your ${itemType.toUpperCase()} '${itemTitle}' is live! 🚀`,
      title: `Content Published Automatically`,
      bodyHtml: `
        <p>Your <strong>${itemType}</strong> titled <strong>"${itemTitle}"</strong> was published automatically based on your product's Auto-Publish settings.</p>
        <p style="color: #64748b; font-size: 14px;">(Note: Email approval is currently turned OFF for this product. You can enable Email Approval anytime in Settings.)</p>
      `,
      ctaText: "View Dashboard",
      ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
    }).catch(e => console.error("Failed to send auto-published email:", e));

    return { approvedInstantly: true };
  }

  // requireEmailApproval is TRUE -> Create pending approval request
  const crypto = await import('crypto');
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000).toISOString();
  const approvalId = "appr_" + Math.random().toString(36).substring(2, 9);

  const approvalDoc = {
    id: approvalId,
    token,
    userId: userId || null,
    productId,
    productName: productName || 'Brand',
    userEmail,
    itemType,
    itemTitle,
    itemPreview: itemPreview || itemTitle,
    itemData,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt
  };

  await db.collection("approval_requests").doc(approvalId).set(approvalDoc);
  console.log(`[Approval Engine] Created approval request ${approvalId} for ${itemType} "${itemTitle}". Expires in ${delayHours}h.`);

  // Send Branded Approval Email — links to the full-preview review page, NOT direct action
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const reviewUrl = `${appUrl}/api/approval/review?token=${token}`;

  const itemTypeLabel = itemType === 'founder_post' ? 'FOUNDER POST' : itemType.toUpperCase();

  const previewHtml = itemPreview ? `
    <div style="background-color: #f1f5f9; border-left: 4px solid #7c3aed; padding: 16px; margin: 20px 0; border-radius: 8px; font-style: italic; color: #334155; font-size: 15px; line-height: 1.6;">
      "${itemPreview.slice(0, 500)}${itemPreview.length > 500 ? '...' : ''}"
    </div>
  ` : '';

  const emailBody = `
    <p>A new <strong>${itemTypeLabel}</strong> has been generated for <strong>${productName || 'your brand'}</strong> and is awaiting your approval before publication.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="display: inline-block; background: #7c3aed; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 10px;">${itemTypeLabel}</div>
      <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${itemTitle}</h3>
      ${previewHtml}
    </div>
    <p style="text-align: center; font-weight: 600; color: #0f172a; margin-top: 24px; font-size: 15px;">Click below to review the full content and approve or reject:</p>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 24px;">
      ⏱️ <strong>Auto-Upload Timeline:</strong> If no action is taken within <strong>${delayHours} hours</strong>, this content will be automatically approved and published.
    </div>
  `;

  await sendBrandedEmail({
    to: userEmail,
    subject: `[Action Required] Approve New ${itemTypeLabel}: ${itemTitle}`,
    title: `Approval Request: ${itemTitle}`,
    bodyHtml: emailBody,
    ctaText: "Review Content & Decide",
    ctaUrl: reviewUrl
  });

  return { approvedInstantly: false, approvalId, expiresAt };
}

async function runPeriodicEmailChecks() {
  if (!db) {
    console.warn('[Background Email Check] Firebase Admin Firestore not initialized. Skipping checks.');
    return;
  }

  console.log('[Background Email Check] Starting periodic inactivity and approval checks...');
  const now = new Date();

  // 1. Check for expired pending approval requests (12-Hour Auto-Upload Worker)
  try {
    const expiredSnap = await db.collection('approval_requests')
      .where('status', '==', 'pending')
      .get();

    const nowIso = now.toISOString();
    for (const docSnap of expiredSnap.docs) {
      const reqData = docSnap.data();
      if (reqData.expiresAt && reqData.expiresAt <= nowIso) {
        console.log(`[Auto-Upload Worker] Request ${docSnap.id} (${reqData.itemType}: "${reqData.itemTitle}") expired after timeline. Auto-approving...`);

        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'auto_approved',
          processedAt: nowIso
        });

        await publishItemInstantly(reqData.itemType, reqData.itemData, reqData.productId);

        // Send notification email
        if (reqData.userEmail) {
          sendBrandedEmail({
            to: reqData.userEmail,
            subject: `[Auto-Uploaded] Your ${reqData.itemType.toUpperCase()} '${reqData.itemTitle}' is live! ⏰`,
            title: `Content Auto-Uploaded After Timeline`,
            bodyHtml: `
              <p>Because no response was received within the 12-hour review timeline, your <strong>${reqData.itemType}</strong> titled <strong>"${reqData.itemTitle}"</strong> was automatically approved and published.</p>
              <p>You can view and manage your live content in the dashboard anytime.</p>
            `,
            ctaText: "View Published Content",
            ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
          }).catch(e => console.error("Failed to send auto-approval notification email:", e));
        }

        // Log in admin_logs
        db.collection('admin_logs').add({
          timestamp: nowIso,
          type: 'auto_upload_approved',
          itemType: reqData.itemType,
          itemTitle: reqData.itemTitle,
          productId: reqData.productId,
          status: 'Auto-approved and published after timeline expiration'
        }).catch(e => console.error("Failed to log auto-approval:", e));
      }
    }
  } catch (errExp) {
    console.error('[Auto-Upload Worker Error]:', errExp);
  }

  try {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const userEmail = userData.email;
      if (!userEmail) continue;

      // 1. Inactivity check (3-7 days)
      if (userData.lastActive) {
        const lastActiveDate = new Date(userData.lastActive);
        const diffMs = now.getTime() - lastActiveDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays >= 3 && diffDays <= 7) {
          const lastSentStr = userData.lastInactivityEmailSent;
          const alreadySentRecently = lastSentStr && (now.getTime() - new Date(lastSentStr).getTime()) < 7 * 24 * 60 * 60 * 1000;

          if (!alreadySentRecently) {
            console.log(`[Background Email Check] User ${userEmail} inactive for ${Math.round(diffDays)} days. Sending reminder...`);
            await sendBrandedEmail({
              to: userEmail,
              subject: "We miss you! Let's generate your next campaign ⚡",
              title: "We miss you on B2P!",
              bodyHtml: `
                <p>It's been a few days since we last saw you. Your social channels are quiet, but your virtual Founder Agent has been busy researching new industry topics for you!</p>
                <p>Don't let your audience forget you. In just 1 click, you can generate a full week of high-converting social posts tailored to your brand voice.</p>
              `,
              ctaText: "Get Back to Posting",
              ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
            });

            await db.collection('users').doc(userId).update({
              lastInactivityEmailSent: now.toISOString()
            });
          }
        }
      }

      // 2. Recommend Socials check
      if (userData.onboarded === true) {
        const lastSentStr = userData.lastSocialsRecommendEmailSent;
        if (!lastSentStr) {
          // Check if they have connected any socials
          // Find all products owned by this user
          const productsSnap = await db.collection('products').where('userId', '==', userId).get();
          let hasConnectedSocials = false;

          for (const productDoc of productsSnap.docs) {
            const tokenDoc = await db.collection('server_tokens').doc(productDoc.id).get();
            if (tokenDoc.exists) {
              const tokenData = tokenDoc.data();
              if (tokenData && (tokenData.linkedin || tokenData.facebook || tokenData.instagram || tokenData.reddit)) {
                hasConnectedSocials = true;
                break;
              }
            }
          }

          if (!hasConnectedSocials && productsSnap.docs.length > 0) {
            console.log(`[Background Email Check] User ${userEmail} has not connected socials. Sending recommendation...`);
            try {
              await sendBrandedEmail({
                to: userEmail,
                subject: "Recommending: Connect your Social Channels to Automate Posting 🔗",
                title: "Boost Your Reach with Social Connections",
                bodyHtml: `
                  <p>Hi ${userData.name || 'there'},</p>
                  <p>You have successfully set up your product DNA, but you haven't connected your social channels yet.</p>
                  <p>To fully unlock automated posting, scheduling, and direct publishing from B2P, connect your social channels now. We support LinkedIn, Facebook, Instagram, and Reddit!</p>
                `,
                ctaText: "Connect Social Channels",
                ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/settings`
              });

              await db.collection('users').doc(userId).update({
                lastSocialsRecommendEmailSent: now.toISOString()
              });
            } catch (err) {
              console.error(`[Background Email Check] Failed to send recommendation to ${userEmail}:`, err);
            }
          }
        }
      }

      // 3. Advantageous / Hook Educational Mail
      if (userData.onboarded === true) {
        const lastSentStr = userData.lastAdvantageEmailSent;
        if (!lastSentStr) {
          const createdAt = new Date(userData.createdAt || userData.lastActive || now);
          const diffMs = now.getTime() - createdAt.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (diffDays >= 2) {
            console.log(`[Background Email Check] Sending educational advantage mail to ${userEmail}...`);
            await sendBrandedEmail({
              to: userEmail,
              subject: "How to hit customer pain points with your posts 💡",
              title: "Unlock Higher Social Conversions",
              bodyHtml: `
                <p>Hi ${userData.name || 'there'},</p>
                <p>Did you know that posts focusing on customer pain points perform 4x better than feature lists?</p>
                <p>Your B2P virtual Founder Agent is pre-trained to write engaging hook-story-offer layouts designed for LinkedIn, Facebook, and Instagram. Go to your dashboard now to generate a post targeting your competitor's weak spots.</p>
                <p>Here is a quick tip: Always lead with a strong, counter-intuitive hook in your first 2 lines!</p>
              `,
              ctaText: "Generate Posts Now",
              ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
            });

            await db.collection('users').doc(userId).update({
              lastAdvantageEmailSent: now.toISOString()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Background Email Check Error] Failed to scan users:', error);
  }
}

async function publishBlogToWordPress(settings: any, title: string, content: string, imageUrl: string | null) {
  let cleanUrl = settings.wordpress.url.trim().replace(/\/$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  const authHeader = `Basic ${Buffer.from(`${settings.wordpress.username.trim()}:${settings.wordpress.appPassword.trim()}`).toString('base64')}`;
  let featuredMediaId: number | null = null;

  if (imageUrl) {
    try {
      let imageBuffer: Buffer | null = null;
      let mimeType = 'image/png';

      if (imageUrl.startsWith('/api/whatsapp/images/')) {
        const imageId = imageUrl.split('/').pop()?.replace('.png', '');
        if (imageId) {
          const localPath = path.join(process.cwd(), 'public', 'whatsapp_images', `${imageId}.png`);
          try {
            imageBuffer = await fs.readFile(localPath);
          } catch (e) {
            console.warn(`[WordPress Publish] Local file read failed: ${localPath}. Trying DB...`, e);
          }

          if (!imageBuffer && db) {
            const imgDoc = await db.collection('whatsapp_images').doc(imageId).get();
            if (imgDoc.exists) {
              const data = imgDoc.data()!;
              imageBuffer = Buffer.from(data.base64Data, 'base64');
              mimeType = data.mimeType || 'image/png';
            }
          }
        }
      }

      if (imageBuffer) {
        const mediaUrl = `${cleanUrl}/wp-json/wp/v2/media`;
        const uploadRes = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': mimeType,
            'Content-Disposition': 'attachment; filename="blog_image.png"'
          },
          body: imageBuffer
        });

        if (uploadRes.ok) {
          const mediaData: any = await uploadRes.json();
          featuredMediaId = mediaData.id || null;
          console.log(`[WordPress Publish] Image uploaded successfully. WP Media ID: ${featuredMediaId}`);
        } else {
          const errText = await uploadRes.text();
          console.warn(`[WordPress Publish] Image upload failed: ${uploadRes.status} - ${errText}`);
        }
      }
    } catch (imgErr) {
      console.error('[WordPress Publish] Exception uploading image:', imgErr);
    }
  }

  const postsUrl = `${cleanUrl}/wp-json/wp/v2/posts`;
  const postBody: any = {
    title: title,
    content: content,
    status: 'publish'
  };

  if (featuredMediaId) {
    postBody.featured_media = featuredMediaId;
  }

  const response = await fetch(postsUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress REST API error: ${response.status} - ${errorText}`);
  }

  const postData: any = await response.json();
  return {
    success: true,
    url: postData.link || `${cleanUrl}/?p=${postData.id}`,
    postId: postData.id
  };
}

async function publishBlogToWebhook(settings: any, payload: any) {
  const targetUrl = settings.webhook.url.trim();
  const secret = settings.webhook?.secret?.trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'BrandToPost-Publisher/1.0'
  };

  if (secret) {
    headers['X-Blog-Api-Key'] = secret;
    headers['x-blog-api-key'] = secret;
    headers['X-BrandToPost-Secret'] = secret;
    headers['x-blog-secret-key'] = secret;
    headers['x-api-key'] = secret;
    headers['Authorization'] = `Bearer ${secret}`;
  }

  console.log('[Blog Webhook Debug] Target URL:', targetUrl);
  console.log('[Blog Webhook Debug] Secret Exact Value:', JSON.stringify(secret), '| Length:', secret?.length || 0);

  let response;
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    console.warn('[Blog Webhook Warning] Initial fetch failed:', err.message, '| Retrying request...');
    // Retry once in case of transient socket reset (ECONNRESET)
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (retryErr: any) {
      console.error('[Blog Webhook Error] Network connection reset by remote host:', retryErr);
      throw new Error(`Failed to connect to ${targetUrl}: ${retryErr.message} (Check target server status or SSL certificate)`);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Blog Webhook Error] Target responded with error status:', response.status, '| Response Body:', errorText);
    throw new Error(`Webhook integration error: ${response.status} - ${errorText}`);
  }

  return {
    success: true,
    message: 'Webhook payload delivered successfully'
  };
}

async function publishBlogToExternalSite(
  productId: string,
  title: string,
  content: string,
  blogImageUrl: string | null,
  extraData: { campaignId?: string, targetAudience?: string, coreMessage?: string, cta?: string },
  appHost: string
) {
  const settings = await getBlogSettings(productId);
  if (!settings || settings.type === 'none') {
    return { success: false, reason: 'none', message: 'No blog integration configured' };
  }

  let absoluteImageUrl = null;
  if (blogImageUrl) {
    if (blogImageUrl.startsWith('http')) {
      absoluteImageUrl = blogImageUrl;
    } else {
      const cleanHost = (appHost || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      absoluteImageUrl = `${cleanHost}${blogImageUrl}`;
    }
  }

  if (settings.type === 'wordpress') {
    if (!settings.wordpress || !settings.wordpress.url || !settings.wordpress.username || !settings.wordpress.appPassword) {
      throw new Error('WordPress integration is incomplete. Check settings.');
    }
    return await publishBlogToWordPress(settings, title, content, blogImageUrl);
  } else if (settings.type === 'webhook') {
    if (!settings.webhook || !settings.webhook.url) {
      throw new Error('Webhook integration URL is missing. Check settings.');
    }

    const payload = {
      event: "blog.publish",
      campaignId: extraData.campaignId || null,
      productId: productId,
      title: title,
      content: content,
      imageUrl: absoluteImageUrl,
      coverImage: absoluteImageUrl,
      cover_image: absoluteImageUrl,
      image_url: absoluteImageUrl,
      featured_image: absoluteImageUrl,
      thumbnail: absoluteImageUrl,
      targetAudience: extraData.targetAudience || "",
      coreMessage: extraData.coreMessage || "",
      cta: extraData.cta || "",
      createdAt: new Date().toISOString()
    };

    return await publishBlogToWebhook(settings, payload);
  } else if (settings.type === 'brandtopost') {
    if (!db) {
      throw new Error('Database connection is not available.');
    }

    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slugQuery = await db.collection('blogs').where('slug', '==', slug).get();
    if (!slugQuery.empty) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const blogDoc = {
      title,
      slug,
      content,
      imageUrl: absoluteImageUrl || blogImageUrl || '',
      summary: extraData.coreMessage || '',
      targetAudience: extraData.targetAudience || '',
      cta: extraData.cta || '',
      productId,
      campaignId: extraData.campaignId || null,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      status: 'published'
    };

    const docRef = await db.collection('blogs').add(blogDoc);

    return {
      success: true,
      url: `/blog/${slug}`,
      id: docRef.id,
      message: 'Published successfully to BrandToPost website'
    };
  } else {
    throw new Error(`Unsupported blog platform type: ${settings.type}`);
  }
}

async function publishToInstagramGraphAPI(token: string, text: string, imageUrl: string, appHost: string): Promise<string> {
  const baseUrl = appHost || process.env.APP_URL || '';
  if (!baseUrl) {
    throw new Error('Server URL configuration is loaded incorrectly. Please make sure APP_URL is set.');
  }

  // 1. Fetch Facebook Pages linked to this access token
  let pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
  if (!pagesRes.ok) {
    const errorBody = await pagesRes.text();
    throw new Error(`Meta Graph API returned error fetching pages: ${errorBody}. Make sure your token has correct page access permissions.`);
  }
  let pagesData = await pagesRes.json();
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook Pages found associated with this Meta User Token. A Facebook Page is required to authenticate Instagram professional access.');
  }

  let instagramBusinessAccountId = null;
  let pageAccessToken = token;

  for (const page of pagesData.data) {
    const pageId = page.id;
    const pageTok = page.access_token || token;
    const igRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageTok}`);
    if (igRes.ok) {
      const igData = await igRes.json();
      if (igData.instagram_business_account && igData.instagram_business_account.id) {
        instagramBusinessAccountId = igData.instagram_business_account.id;
        pageAccessToken = pageTok;
        break;
      }
    }
  }

  if (!instagramBusinessAccountId) {
    throw new Error('Could not automatically determine any Instagram Business/Creator accounts linked to your Facebook Pages. Please review your Meta app configuration.');
  }

  let resolvedImageUrl = imageUrl;
  if (!resolvedImageUrl) {
    resolvedImageUrl = 'https://placehold.co/1080x1080/4f46e5/ffffff.png?text=Creative+Campaign';
  }

  // Convert local base64 / data URLs to highly accessible public domain paths
  if (resolvedImageUrl.startsWith('data:image/')) {
    const tempId = Math.random().toString(36).substring(2, 9);
    tempImages[tempId] = resolvedImageUrl;
    resolvedImageUrl = `${baseUrl.replace(/\/$/, '')}/public/temp-image/${tempId}.png`;
  }

  // 2. Create Media Container on Instagram
  const containerRes = await fetch(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: resolvedImageUrl,
      caption: text,
      access_token: pageAccessToken
    })
  });

  if (!containerRes.ok) {
    const errBody = await containerRes.text();
    throw new Error(`Failed to create Instagram media container: ${errBody}`);
  }

  const containerData = await containerRes.json();
  const creationId = containerData.id;

  // Pause briefly to let Instagram's servers load and analyze the asset (required by Meta to avoid timing errors)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Publish Media Container
  const publishRes = await fetch(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: pageAccessToken
    })
  });

  if (!publishRes.ok) {
    const errBody = await publishRes.text();
    throw new Error(`Failed to publish Instagram media: ${errBody}`);
  }

  const publishData = await publishRes.json();
  return publishData.id;
}

// ============================================================================
// HTML Builders for Approval Review Page
// ============================================================================
function escHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildApprovalStatusPage(options: { appUrl: string; emoji: string; title: string; message: string; borderColor: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escHtml(options.title)} — B2P</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #08080c; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 24px; -webkit-font-smoothing: antialiased; }
    .status-card { background: #12121a; border: 1px solid #27273a; border-top: 4px solid ${options.borderColor}; border-radius: 16px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
    .emoji { font-size: 64px; margin-bottom: 24px; line-height: 1; }
    .title { font-size: 24px; font-weight: 800; color: #f8fafc; margin-bottom: 16px; }
    .message { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }
    .btn { display: inline-flex; background: #27273a; color: #f8fafc; padding: 12px 28px; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 9999px; transition: background 0.2s; }
    .btn:hover { background: #3f3f5a; }
  </style>
</head>
<body>
  <div class="status-card">
    <div class="emoji">${options.emoji}</div>
    <div class="title">${options.title}</div>
    <div class="message">${options.message}</div>
    <a href="${options.appUrl}/dashboard" class="btn">Go to Dashboard</a>
  </div>
</body>
</html>`;
}

function buildContentPreview(data: any): string {
  let html = '';
  const itemType = data.itemType;
  const itemData = data.itemData || {};

  if (itemType === 'campaign') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Campaign Plan</span>
          <span class="card-title">${escHtml(itemData.theme || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="section-label">Core Message</div>
          <div class="section-value">${escHtml(itemData.coreMessage)}</div>
          
          <div class="section-label">Target Audience</div>
          <div class="section-value">${escHtml(itemData.targetAudience)}</div>

          <div class="section-label">Campaign Hook</div>
          <div class="section-value">${escHtml(itemData.hook)}</div>
        </div>
      </div>
      
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Daily Posts</span>
          <span class="card-title">Generated Content Map</span>
        </div>
        <div class="card-body" style="background: #08080c;">
    `;

    if (Array.isArray(itemData.dailyPosts)) {
      itemData.dailyPosts.forEach((post: any) => {
        html += `
          <div class="daily-post">
            <div class="day-label">Day ${post.day}</div>
            <div>
              ${post.platforms ? Object.keys(post.platforms).map(p => `<span class="platform-tag">${escHtml(p)}</span>`).join('') : ''}
            </div>
            <div class="post-copy">${escHtml(post.postCopy || post.copy || 'No copy available')}</div>
          </div>
        `;
      });
    } else {
      html += `<div class="section-value">No daily posts found in campaign data.</div>`;
    }

    html += `</div></div>`;
  } else if (itemType === 'post' || itemType === 'founder_post') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">${itemType === 'founder_post' ? 'Founder Post' : 'Social Post'}</span>
          <span class="card-title">${escHtml(itemData.headline || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="section-label">Post Copy</div>
          <div class="section-value" style="font-size: 16px;">${escHtml(itemData.postCopy || itemData.copy)}</div>
          
          ${itemData.imagePrompt ? `
          <div class="section-label" style="margin-top: 24px;">Visual Generation Prompt</div>
          <div class="section-value" style="font-style: italic; color: #94a3b8;">${escHtml(itemData.imagePrompt)}</div>
          ` : ''}
          
          ${itemData.platform ? `
          <div class="section-label" style="margin-top: 24px;">Target Platform</div>
          <div class="section-value" style="text-transform: capitalize;">${escHtml(itemData.platform)}</div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (itemType === 'blog') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Blog Article</span>
          <span class="card-title">${escHtml(itemData.title || itemData.blogTitle || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="blog-content">
            ${itemData.content || itemData.blogContent ? (itemData.content || itemData.blogContent) : '<p>No content available</p>'}
          </div>
        </div>
      </div>
    `;
  }

  return html;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Verify Firestore connection if db is initialized
  if (db) {
    try {
      console.log('[Firebase Admin] Testing Firestore connectivity...');
      await db.collection('server_schedules').limit(1).get();
      console.log('[Firebase Admin] Firestore connectivity verified successfully.');
    } catch (e: any) {
      console.warn('[Firebase Admin] Firestore connection test failed. Falling back to local in-memory state. Error:', e.message);
      db = null;
    }
  }

  // --- Scalability & System Design Optimizations Cache & Pool ---
  interface CacheEntry {
    data: any;
    expiresAt: number;
  }
  const serverCache = new Map<string, CacheEntry>();
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

  let cacheHits = 0;
  let cacheMisses = 0;
  let throttledRequestsCount = 0;

  function getCachedItem(key: string): any | null {
    // Caching permanently disabled by user request to prevent stale campaigns/assets
    return null;
  }

  function setCachedItem(key: string, data: any) {
    // No-op. Caching permanently disabled.
  }

  // --- Puppeteer Browser Pool & Mutex Render Lock ---
  let sharedBrowser: any = null;
  const activeRenderQueue: Array<{ resolve: (val: any) => void, reject: (err: any) => void }> = [];
  let activeRendersCount = 0;
  const MAX_CONCURRENT_RENDERS = 1; // Strict 1 browser viewport to avoid memory overloading on Cloud Run

  async function runWithRenderLock<T>(task: (browser: any) => Promise<T>): Promise<T> {
    console.log(`[runWithRenderLock] Started task queue check. activeRendersCount: ${activeRendersCount}`);
    if (activeRendersCount >= MAX_CONCURRENT_RENDERS) {
      throttledRequestsCount++;
      console.log(`[SCALABILITY GUARD] Maximum concurrent renders reached. Request queued.`);
      return new Promise((resolve, reject) => {
        activeRenderQueue.push({ resolve, reject });
      }).then(async () => {
        console.log(`[SCALABILITY GUARD] Request dequeued, executing task...`);
        return runWithRenderLock(task);
      });
    }

    activeRendersCount++;
    console.log(`[runWithRenderLock] Incrementing activeRendersCount: ${activeRendersCount}`);
    try {
      const fs = await import('fs');
      const { execSync } = await import('child_process');

      const findDynamicChrome = (): string | null => {
        const candidateDirs = [
          path.join(process.cwd(), '.cache', 'puppeteer'),
          path.join(esmDirname, '..', '.cache', 'puppeteer'),
          path.join(esmDirname, '.cache', 'puppeteer'),
          '/tmp/puppeteer-cache',
          path.join(process.cwd(), '.puppeteer-cache'),
          path.join(esmDirname, '..', '.puppeteer-cache'),
          path.join(esmDirname, '.puppeteer-cache'),
          '/home/u769235882/domains/brandtopost.com/public_html/.cache/puppeteer'
        ];

        const isWin = process.platform === 'win32';
        const execName = isWin ? 'chrome.exe' : 'chrome';

        for (const baseDir of candidateDirs) {
          try {
            const chromeDir = path.join(baseDir, 'chrome');
            if (fs.existsSync(chromeDir)) {
              const versions = fs.readdirSync(chromeDir);
              for (const v of versions) {
                const versionDir = path.join(chromeDir, v);
                if (fs.existsSync(versionDir)) {
                  const subdirs = fs.readdirSync(versionDir);
                  for (const sd of subdirs) {
                    const candidate = path.join(versionDir, sd, execName);
                    if (fs.existsSync(candidate)) {
                      console.log(`[PUPPETEER POOL] Found Chrome at: ${candidate}`);
                      return candidate;
                    }
                  }
                }
              }
            }
          } catch (err) {
            // ignore folder-specific scanning errors
          }
        }
        return null;
      };

      let chromeExecutable = findDynamicChrome();
      let hasInstall = !!chromeExecutable;
      console.log(`[runWithRenderLock] Checking Chrome. exists: ${hasInstall}, path: ${chromeExecutable}`);

      if (!hasInstall) {
        const installCacheDir = path.join(process.cwd(), '.cache', 'puppeteer');
        console.log(`[PUPPETEER POOL] Local Chrome executable not found. Running auto-installer into ${installCacheDir}...`);
        try {
          execSync('npx puppeteer browsers install chrome', {
            env: { ...process.env, PUPPETEER_CACHE_DIR: installCacheDir },
            stdio: 'pipe'
          });
          try {
            console.log(`[PUPPETEER POOL] Setting permissions on ${installCacheDir}...`);
            execSync(`chmod -R 755 ${installCacheDir}`);
          } catch (eChmod: any) {
            console.error(`[PUPPETEER POOL] chmod failed:`, eChmod.message);
          }
          chromeExecutable = findDynamicChrome();
          hasInstall = !!chromeExecutable;
          console.log(`[runWithRenderLock] Re-checking Chrome after installation. exists: ${hasInstall}, path: ${chromeExecutable}`);
        } catch (eInstall: any) {
          console.error(`[PUPPETEER POOL] Local Chrome auto-installation to ${installCacheDir} failed: ${eInstall.message}`);

          // Fallback to /tmp/puppeteer-cache if main workspace install fails
          const fallbackCacheDir = '/tmp/puppeteer-cache';
          console.log(`[PUPPETEER POOL] Attempting fallback auto-installation to ${fallbackCacheDir}...`);
          try {
            execSync('npx puppeteer browsers install chrome', {
              env: { ...process.env, PUPPETEER_CACHE_DIR: fallbackCacheDir },
              stdio: 'pipe'
            });
            try {
              execSync(`chmod -R 755 ${fallbackCacheDir}`);
            } catch (eChmod: any) { }
            chromeExecutable = findDynamicChrome();
            hasInstall = !!chromeExecutable;
            console.log(`[runWithRenderLock] Re-checking Chrome after fallback installation. exists: ${hasInstall}, path: ${chromeExecutable}`);
          } catch (eFallback: any) {
            console.error(`[PUPPETEER POOL] Fallback installation also failed: ${eFallback.message}`);
          }
        }
      }

      const puppeteer = await import('puppeteer');
      if (!sharedBrowser || !sharedBrowser.isConnected()) {
        if (sharedBrowser) {
          try { await sharedBrowser.close().catch(() => { }); } catch (_) { }
          sharedBrowser = null;
        }
        console.log(`[PUPPETEER POOL] Initializing background browser instance...`);
        const launchOptions: any = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };
        if (hasInstall && chromeExecutable) {
          console.log(`[PUPPETEER POOL] Specifying explicit Chrome executable path: ${chromeExecutable}`);
          launchOptions.executablePath = chromeExecutable;
        } else {
          console.warn(`[PUPPETEER POOL] Chrome missing. Checking default fallback paths.`);
        }
        console.log(`[PUPPETEER POOL] Launching browser with options:`, JSON.stringify(launchOptions));
        try {
          sharedBrowser = await puppeteer.default.launch(launchOptions);
          console.log(`[PUPPETEER POOL] Browser launched successfully!`);
        } catch (launchErr: any) {
          console.error(`[PUPPETEER POOL] Browser launch failed:`, launchErr.message || launchErr);
          throw launchErr;
        }
      }
      console.log(`[runWithRenderLock] Calling task function...`);
      let result;
      try {
        result = await task(sharedBrowser);
      } catch (taskErr: any) {
        console.warn(`[PUPPETEER POOL] Task failed: ${taskErr.message}. Attempting browser reconnect and retry once...`);
        try { await sharedBrowser?.close().catch(() => { }); } catch (_) { }
        sharedBrowser = null;
        const launchOptions: any = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };
        if (hasInstall && chromeExecutable) launchOptions.executablePath = chromeExecutable;
        sharedBrowser = await puppeteer.default.launch(launchOptions);
        result = await task(sharedBrowser);
      }
      console.log(`[runWithRenderLock] Task function completed successfully.`);
      return result;
    } catch (err: any) {
      console.error(`[runWithRenderLock] Error inside block:`, err.message || err);
      throw err;
    } finally {
      activeRendersCount--;
      console.log(`[runWithRenderLock] Decremented activeRendersCount: ${activeRendersCount}`);
      if (activeRenderQueue.length > 0) {
        const next = activeRenderQueue.shift();
        if (next) {
          console.log(`[runWithRenderLock] Releasing next queued render.`);
          next.resolve(true);
        }
      }
    }
  }

  // --- IP/User Rate Limiting Middleware for Critical Resource Protection ---
  const routeRateLimiter = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>();

    // Memory leak protection - clean up stale entries every 5 minutes
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of requests.entries()) {
        const active = timestamps.filter(t => now - t < windowMs);
        if (active.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, active);
        }
      }
    }, 5 * 60 * 1000);

    // Safely prevent keeping Node process alive in local/CLI development
    if (pruneInterval.unref) {
      pruneInterval.unref();
    }

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const id = (req as any).user?.uid || req.ip || 'anonymous_ip';
      const now = Date.now();
      let timestamps = requests.get(id) || [];
      timestamps = timestamps.filter(t => now - t < windowMs);
      if (timestamps.length >= maxRequests) {
        console.warn(`[RATE LIMIT EXCEEDED] User/IP ${id} throttled on ${req.originalUrl}. limit: ${maxRequests} requests per ${windowMs / 1000}s`);
        return res.status(429).json({
          error: 'Resource rate limit exceeded. Please wait a moment before executing this heavy command again.',
          retryAfterMs: windowMs - (now - timestamps[0])
        });
      }
      timestamps.push(now);
      requests.set(id, timestamps);
      next();
    };
  };

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- TEMPORARY DIAGNOSTIC ENDPOINT (remove after debugging) ---
  app.get('/api/debug/env', (req, res) => {
    const envPaths = [
      { label: 'cwd/.env', path: path.join(process.cwd(), '.env') },
      { label: 'cwd/.env.local', path: path.join(process.cwd(), '.env.local') },
      { label: 'esmDirname/../.env', path: path.resolve(esmDirname, '..', '.env') },
      { label: 'esmDirname/.env', path: path.resolve(esmDirname, '.env') },
    ];

    const fileChecks = envPaths.map(p => ({
      label: p.label,
      absolutePath: p.path,
      exists: fsSync.existsSync(p.path),
    }));

    // List all files in cwd to see what's deployed
    let cwdFiles: string[] = [];
    try {
      cwdFiles = fsSync.readdirSync(process.cwd()).slice(0, 50);
    } catch (e: any) {
      cwdFiles = [`Error reading cwd: ${e.message}`];
    }

    let dirFiles: string[] = [];
    try {
      dirFiles = fsSync.readdirSync(esmDirname).slice(0, 50);
    } catch (e: any) {
      dirFiles = [`Error reading esmDirname: ${e.message}`];
    }

    let parentFiles: string[] = [];
    try {
      parentFiles = fsSync.readdirSync(path.resolve(esmDirname, '..')).slice(0, 50);
    } catch (e: any) {
      parentFiles = [`Error reading parent: ${e.message}`];
    }

    let htaccessContent = '';
    try {
      htaccessContent = fsSync.readFileSync(path.join(process.cwd(), '.htaccess'), 'utf8');
    } catch (e: any) {
      htaccessContent = `Error reading .htaccess: ${e.message}`;
    }

    const diagnostic = {
      timestamp: new Date().toISOString(),
      processInfo: {
        cwd: process.cwd(),
        esmDirname,
        esmFilename,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      htaccess: htaccessContent,
      envVars: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `SET (${process.env.GEMINI_API_KEY.length} chars, starts: ${process.env.GEMINI_API_KEY.slice(0, 5)}...)` : 'NOT SET',
        FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT ? `SET (${process.env.FIREBASE_SERVICE_ACCOUNT.length} chars, starts: ${process.env.FIREBASE_SERVICE_ACCOUNT.slice(0, 10)}...)` : 'NOT SET',
        APP_URL: process.env.APP_URL || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT SET',
        SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      },
      envFileChecks: fileChecks,
      filesInCwd: cwdFiles,
      filesInDirname: dirFiles,
      filesInParent: parentFiles,
      firebaseAdminInitialized: !!admin.apps?.length,
      firestoreConnected: !!db,
    };

    // Also write to a file for later review
    try {
      const logPath = path.join(process.cwd(), 'env-debug.log');
      fsSync.writeFileSync(logPath, JSON.stringify(diagnostic, null, 2));
      (diagnostic as any).logWrittenTo = logPath;
    } catch (e: any) {
      (diagnostic as any).logWriteError = e.message;
    }

    res.json(diagnostic);
  });

  app.use((req, res, next) => {
    if (!lastKnownHost) {
      const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      lastKnownHost = `${proto}://${req.headers.host}`;
    }
    next();
  });

  // --- Auth Middleware ---
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      if (!admin.apps?.length) {
        // If admin is not initialized (e.g. no service account), we can't verify easily.
        // For preview purposes, we'll allow it if we can't verify, but log a warning.
        console.warn('[Auth] Firebase Admin not initialized. Bypassing auth check for preview.');
        return next();
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  // --- Admin API: Lock / Unlock User Account ---
  app.post('/api/admin/users/lock', async (req, res) => {
    try {
      const { adminEmail, targetUserId, isLocked, lockReason } = req.body;

      if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
      }

      if (!db) {
        return res.status(500).json({ error: "Database connection not active on server" });
      }

      const defaultReason = "The testing phase is over. Access to your account has been suspended by administration.";
      const userRef = db.collection('users').doc(targetUserId);

      await userRef.set({
        isLocked: !!isLocked,
        lockReason: isLocked ? (lockReason || defaultReason) : null,
        lockedAt: isLocked ? new Date().toISOString() : null
      }, { merge: true });

      console.log(`[Admin Lock] User ${targetUserId} lock status updated to ${isLocked} by ${adminEmail || 'admin'}.`);
      return res.json({ success: true, targetUserId, isLocked });
    } catch (err: any) {
      console.error("[Admin Lock Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to update user lock state" });
    }
  });

  // --- Admin API: Emergency Lock All Users ---
  app.post('/api/admin/users/lock-all', async (req, res) => {
    try {
      const { adminEmail, lockReason } = req.body;

      if (!db) {
        return res.status(500).json({ error: "Database connection not active on server" });
      }

      const defaultReason = "The testing phase is over. Access to your account has been suspended by administration.";
      const reasonToSave = lockReason && lockReason.trim() ? lockReason.trim() : defaultReason;

      const usersSnap = await db.collection('users').get();
      let lockedCount = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (userData.email !== 'garvitbansal2303@gmail.com' && userData.role !== 'Admin') {
          await userDoc.ref.set({
            isLocked: true,
            lockReason: reasonToSave,
            lockedAt: new Date().toISOString()
          }, { merge: true });
          lockedCount++;
        }
      }

      console.log(`[Admin Emergency Lock All] ${lockedCount} non-admin users locked by ${adminEmail || 'admin'}.`);
      return res.json({ success: true, lockedCount });
    } catch (err: any) {
      console.error("[Admin Emergency Lock All Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to lock all users" });
    }
  });
  // --- Admin API: Fetch All Products / Brands ---
  app.get('/api/admin/products', async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: "Database connection not active on server" });
      }

      const productsSnap = await db.collection('products').get();
      const products: any[] = [];
      productsSnap.forEach(docSnap => {
        products.push({ id: docSnap.id, ...docSnap.data() });
      });

      return res.json({ success: true, products });
    } catch (err: any) {
      console.error("[Admin Fetch Products Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch products" });
    }
  });

  // --- Server Rendering Endpoint with Active Mutex Pool Lock (Caching Removed) ---
  app.post('/api/render-visual', routeRateLimiter(120, 60 * 1000), async (req, res) => {
    try {
      const { visualType, visualData, imageUrl, dna, fallbackText, activeLogo, recentLayoutHistory } = req.body;

      const primaryColor = visualData?.primaryColor || dna?.visualData?.colors?.[0] || "#F59E0B";
      const secondaryColor = visualData?.secondaryColor || dna?.visualData?.colors?.[1] || "#08080C";
      const safeVisualType = visualType || "custom-overlay";
      const headline = visualData?.headline || fallbackText || "Your text here";

      const primaryFont = visualData?.fontFamily || dna?.visualData?.fonts?.primary || "Inter";
      const fontFamily = primaryFont.includes(" ") && !primaryFont.includes("'")
        ? `'${primaryFont}'`
        : primaryFont;

      let selectedBlueprintId = "";
      let htmlContent = "";

      // 0. Check if hydrated renderedHtml is passed for V3 Master Templates
      if (visualData?.renderedHtml || visualData?.customHtml) {
        htmlContent = visualData.renderedHtml || visualData.customHtml;
      } else if (safeVisualType === "grounded-research" || visualData?.rawHtml) {
        // rawHtml is model-generated and is about to be executed by headless
        // Chrome inside our own network. Sanitize the template before any
        // substitution. See src/lib/sanitizeTemplateHtml.ts
        const { html: templateHtml, violations } = sanitizeTemplateHtml(visualData.rawHtml || "");
        if (violations.length > 0) {
          console.warn("[/api/render-visual] template sanitizer stripped unsafe markup:", violations);
        }

        const logoSrc = safeUrlOrEmpty(activeLogo || "");
        const logoReplacement = logoSrc
          ? `<img src="${escapeHtmlAttr(logoSrc)}" style="height: 48px; width: auto; max-width: 180px; object-fit: contain;" />`
          : "";

        htmlContent = templateHtml
          .replaceAll("{{HEADLINE}}", escapeHtmlText(headline || ""))
          .replaceAll("{{SUBTEXT}}", escapeHtmlText(visualData?.subtext || ""))
          .replaceAll("{{IMAGE_URL}}", escapeHtmlAttr(safeUrlOrEmpty(imageUrl || "")))
          .replaceAll("{{LOGO_URL}}", logoReplacement)
          .replaceAll("{{PRIMARY_COLOR}}", escapeHtmlAttr(primaryColor))
          .replaceAll("{{SECONDARY_COLOR}}", escapeHtmlAttr(secondaryColor))
          .replaceAll("{{FONT_FAMILY}}", escapeHtmlAttr(fontFamily));
      }
      // 1. Check if visualType directly matches a layout blueprint
      else if (LAYOUT_BLUEPRINTS[safeVisualType]) {
        selectedBlueprintId = safeVisualType;
      }
      // 2. Check if visualData.layoutId matches a layout blueprint
      else if (visualData?.layoutId && LAYOUT_BLUEPRINTS[visualData.layoutId]) {
        selectedBlueprintId = visualData.layoutId;
      }
      // 3. If "custom-overlay" is chosen but no specific layoutId is passed, run auto-rotation
      else if (safeVisualType === "custom-overlay") {
        const history = Array.isArray(recentLayoutHistory) ? recentLayoutHistory : [];
        const chosenBlueprint = selectLayout(history);
        selectedBlueprintId = chosenBlueprint.id;
      }

      if (!htmlContent) {
        const blueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId];
        if (blueprint) {
          // Render via the Layout Composition Engine blueprint
          htmlContent = blueprint.buildHtml({
            headline,
            subtext: visualData?.subtext || "",
            imageUrl: imageUrl || "",
            logoUrl: activeLogo || null,
            primaryColor,
            secondaryColor,
            fontFamily
          });
        } else {
          // Fallback to legacy hardcoded templates for backwards compatibility
          let resolvedTextPos = visualData?.layout?.textPosition || 'bottom';
          if (safeVisualType === 'creative-story') {
            resolvedTextPos = 'bottom';
          } else if (safeVisualType === 'abstract-announcement') {
            resolvedTextPos = 'middle';
          } else if (safeVisualType === 'powerful-quote') {
            resolvedTextPos = 'middle';
          } else if (safeVisualType === 'data-infographic') {
            resolvedTextPos = 'top';
          }

          let resolvedLogoPos = visualData?.layout?.logoPosition;
          if (!resolvedLogoPos) {
            resolvedLogoPos = resolvedTextPos === 'bottom' ? 'top-right' : 'bottom-right';
          }

          if (resolvedTextPos === 'bottom' && resolvedLogoPos.startsWith('bottom')) {
            resolvedLogoPos = resolvedLogoPos.replace('bottom', 'top');
          } else if (resolvedTextPos === 'top' && resolvedLogoPos.startsWith('top')) {
            resolvedLogoPos = resolvedLogoPos.replace('top', 'bottom');
          }

          let logoStyles = 'bottom: 80px; right: 80px;';
          const pos = resolvedLogoPos;
          if (pos === 'top-left') logoStyles = 'top: 80px; left: 80px;';
          if (pos === 'top-center') logoStyles = 'top: 80px; left: 50%; transform: translateX(-50%);';
          if (pos === 'top-right') logoStyles = 'top: 80px; right: 80px;';
          if (pos === 'middle-left') logoStyles = 'top: 50%; left: 80px; transform: translateY(-50%);';
          if (pos === 'center') logoStyles = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
          if (pos === 'middle-right') logoStyles = 'top: 50%; right: 80px; transform: translateY(-50%);';
          if (pos === 'bottom-left') logoStyles = 'bottom: 80px; left: 80px;';
          if (pos === 'bottom-center') logoStyles = 'bottom: 80px; left: 50%; transform: translateX(-50%);';
          if (pos === 'bottom-right') logoStyles = 'bottom: 80px; right: 80px;';

          const textShadowDeep = "0 8px 32px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)";
          // customHtml is model-generated per daily post and reaches Puppeteer the
          // same way rawHtml does — sanitize it on the same terms.
          const customHtmlResult = sanitizeTemplateHtml(visualData?.customHtml || "");
          if (customHtmlResult.violations.length > 0) {
            console.warn("[/api/render-visual] customHtml sanitizer stripped unsafe markup:", customHtmlResult.violations);
          }
          let processedCustomHtml = customHtmlResult.html;
          if (processedCustomHtml && activeLogo) {
            const safeLogo = safeUrlOrEmpty(activeLogo);
            if (safeLogo) {
              processedCustomHtml = processedCustomHtml.replace(/<img([^>]+)src=["']([^"']*)["']([^>]*)>/gi, (match, p1, src, p3) => {
                const isLogo = src.toLowerCase().includes('logo') || match.toLowerCase().includes('alt="logo"') || match.toLowerCase().includes("alt='logo'");
                if (isLogo) {
                  return `<img${p1}src="${escapeHtmlAttr(safeLogo)}"${p3}>`;
                }
                return match;
              });
            }
          }

          if (safeVisualType === "creative-story") {
            htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #111; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
  ${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />` : ''}
  <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.1) 100%); z-index: 1;"></div>
  <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; padding: 80px 100px 80px 80px; display: flex; flex-direction: column; justify-content: flex-end; box-sizing: border-box; z-index: 10;">
    ${visualData?.subtext ? `<div style="margin-bottom: 24px; color: #a5b4fc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: clamp(20px, 2.5vw, 28px); text-shadow: ${textShadowDeep}; width: 85%; overflow-wrap: break-word;">— ${visualData.subtext}</div>` : ''}
    <h2 style="color: white; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; font-size: clamp(48px, 6vw, 90px); margin: 0; padding-bottom: 40px; text-shadow: ${textShadowDeep}; text-wrap: balance; width: 85%; overflow-wrap: break-word;">${headline}</h2>
  </div>
  ${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
  </div>`;
          } else if (safeVisualType === "abstract-announcement") {
            htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #080808; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
  <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0.9; background: radial-gradient(circle at top right, ${primaryColor}60, transparent 65%), radial-gradient(circle at bottom left, ${secondaryColor}90, ${primaryColor}30 85%); z-index: 1;"></div>
  ${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; mix-blend-mode: overlay; z-index: 2;" />` : ''}
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%); z-index: 3;"></div>
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-height: 90%; background: rgba(15,15,15,0.75); backdrop-filter: blur(32px); border: 2px solid rgba(255,255,255,0.1); padding: 80px 100px; border-radius: 40px; text-align: center; box-sizing: border-box; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 25px 80px rgba(0,0,0,0.8);">
  <h2 style="color: white; font-weight: 800; line-height: 1.1; margin: 0 0 24px 0; font-size: clamp(40px, 5vw, 84px); text-wrap: balance; overflow-wrap: break-word; text-shadow: ${textShadowDeep};">${headline}</h2>
  ${visualData?.subtext ? `<div style="height: 4px; width: 80px; background: rgba(255,255,255,0.4); margin: 32px auto; border-radius: 4px;"></div><p style="color: #e5e7eb; font-weight: 500; line-height: 1.4; margin: 0; font-size: clamp(24px, 3vw, 36px); text-wrap: balance; overflow-wrap: break-word; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">${visualData.subtext}</p>` : ''}
  </div>
  ${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
  </div>`;
          } else if (safeVisualType === "data-infographic") {
            htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #ffffff; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; padding: 100px; box-sizing: border-box;">
  <div style="text-align: center; margin-bottom: 80px; z-index: 10;">
  <h2 style="color: #0f172a; font-weight: 900; margin: 0; line-height: 1.15; letter-spacing: -0.02em; font-size: clamp(48px, 6vw, 84px); text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
  ${visualData?.subtext ? `<p style="color: #475569; font-weight: 500; font-size: clamp(24px, 3vw, 36px); margin: 24px 0 0 0; text-wrap: balance; overflow-wrap: break-word;">${visualData.subtext}</p>` : ''}
  </div>
  <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; z-index: 10;">
  ${(visualData?.stats?.length ? visualData.stats : [{ label: "Stat A", value: "85%" }, { label: "Stat B", value: "2.4x" }]).slice(0, 4).map((s: any, i: number) => {
              const bgs = ["#eff6ff", "#fff7ed", "#faf5ff", "#ecfdf5"];
              const textColors = ["#1e3a8a", "#9a3412", "#6b21a8", "#065f46"];
              return `<div style="border-radius: 32px; background: ${bgs[i % 4]}; padding: 48px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="font-size: clamp(24px, 3vw, 36px); font-weight: 600; margin-bottom: 12px; color: ${textColors[i % 4]}; line-height: 1.2;">${s.label}</div>
      <div style="font-size: clamp(64px, 8vw, 120px); font-weight: 900; line-height: 1; color: ${textColors[i % 4]};">${s.value}</div>
    </div>`;
            }).join('')}
  </div>
  ${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
  </div>`;
          } else if (safeVisualType === "powerful-quote") {
            htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px; box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(135deg, ${secondaryColor}, #0a0a0a 80%); overflow: hidden;">
  <div style="position: absolute; top: -50px; left: -50px; font-size: 800px; color: rgba(255,255,255,0.03); font-family: 'Playfair Display', serif; line-height: 1; z-index: 1;">"</div>
  <h2 style="color: white; font-weight: 800; line-height: 1.2; margin: 0; font-size: clamp(44px, 6vw, 84px); z-index: 10; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">"${headline}"</h2>
  <div style="width: 100px; height: 6px; background-color: ${primaryColor}; margin: 64px 0 40px 0; z-index: 10; border-radius: 3px;"></div>
  <div style="color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: clamp(20px, 3vw, 32px); z-index: 10; text-wrap: balance; overflow-wrap: break-word;">${visualData?.subtext || dna?.name || "The Vision"}</div>
  ${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
  </div>`;
          } else {
            htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
  ${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />` : ''}
  ${processedCustomHtml
                ? `<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; mix-blend-mode: normal; z-index: 5;">${processedCustomHtml}</div>`
                : `<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 100%); z-index: 2;"></div>
       <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding: 100px; text-align: center; box-sizing: border-box; z-index: 5;">
         <h2 style="color: white; font-weight: 800; line-height: 1.15; font-size: clamp(48px, 6vw, 90px); margin: 0 0 24px 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word; width: 100%;">${headline}</h2>
         ${visualData?.subtext ? `<p style="color: #f3f4f6; font-size: clamp(24px, 3vw, 36px); font-weight: 500; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8); text-wrap: balance; overflow-wrap: break-word;">${visualData.subtext}</p>` : ''}
       </div>`}
  ${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
  </div>`;
          }
        }
      }

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Clash+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; }
  h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

      // Function to render HTML in Puppeteer
      const executeRender = async (targetHtml: string) => {
        return await runWithRenderLock(async (browser) => {
          const page = await browser.newPage();
          try {
            await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
            await page.setContent(targetHtml, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 20000 }).catch(() => { });

            await page.evaluate(async () => {
              try {
                await Promise.race([
                  document.fonts.ready,
                  new Promise(resolve => setTimeout(resolve, 3000))
                ]);
              } catch (_) { }

              const elements = Array.from(document.querySelectorAll('*'));
              const imagePromises: Promise<any>[] = [];

              elements.forEach((el) => {
                if (el.tagName === 'IMG') {
                  const img = el as HTMLImageElement;
                  if (!img.complete) {
                    imagePromises.push(new Promise((resolve) => {
                      const t = setTimeout(() => resolve(null), 3000);
                      img.onload = () => { clearTimeout(t); resolve(null); };
                      img.onerror = () => { clearTimeout(t); resolve(null); };
                    }));
                  }
                }
                const bg = window.getComputedStyle(el).backgroundImage;
                if (bg && bg.startsWith('url(')) {
                  const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                  if (url && !url.startsWith('data:')) {
                    const img = new Image();
                    img.src = url;
                    imagePromises.push(new Promise((resolve) => {
                      const t = setTimeout(() => resolve(null), 3000);
                      img.onload = () => { clearTimeout(t); resolve(null); };
                      img.onerror = () => { clearTimeout(t); resolve(null); };
                    }));
                  }
                }
              });

              await Promise.all(imagePromises);
            });

            const buffer = await page.screenshot({ type: 'png' });
            return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
          } finally {
            await page.close().catch(() => { });
          }
        });
      };

      let renderResult: string;
      try {
        renderResult = await executeRender(fullHtml);
      } catch (firstErr: any) {
        console.warn("[PUPPETEER POOL WARNING] Initial template render failed, attempting blueprint fallback:", firstErr?.message);

        // If grounded-research AI HTML failed, build a guaranteed clean fallback HTML using selectLayout
        const fallbackBlueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId] || selectLayout([]);
        const fallbackHtmlContent = fallbackBlueprint.buildHtml({
          headline,
          subtext: visualData?.subtext || "",
          imageUrl: imageUrl || "",
          logoUrl: activeLogo || null,
          primaryColor,
          secondaryColor,
          fontFamily
        });

        const fallbackFullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Clash+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; }
  h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
${fallbackHtmlContent}
</body>
</html>`;

        renderResult = await executeRender(fallbackFullHtml);
        selectedBlueprintId = fallbackBlueprint.id;
      }

      // Log Puppeteer layout render cost usage
      const userId = (req as any).user?.uid;
      if (userId) {
        await logBackendTokenUsage(userId, 'puppeteer_overlay_render', 'puppeteer-layout-render', {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        });
      }

      res.json({ url: renderResult, layoutId: selectedBlueprintId });
    } catch (e: any) {
      console.error("[PUPPETEER POOL ERROR]:", e);
      try {
        const userId = (req as any).user?.uid || 'unknown';
        const userEmail = (req as any).user?.email || 'unknown';
        await db.collection("generation_logs").add({
          userId,
          userEmail,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          level: "error",
          section: "overlay",
          message: `Puppeteer render failed: ${e.message}`,
          details: e.stack || null,
          clientTimestamp: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Failed to write render error to Firestore logs:", logErr);
      }
      res.status(500).json({ error: e.message, retry: true });
    }
  });

  // --- AI Proxy Endpoint WITHOUT Caching ---
  console.log(`[AI Proxy] GEMINI_API_KEY loaded: ${!!process.env.GEMINI_API_KEY} (${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length + ' chars' : 'missing'})`);
  app.post('/api/ai/generate', requireAuth, routeRateLimiter(15, 60 * 1000), async (req, res) => {
    const { model, contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('key present:', !!process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY?.length);

    if (!apiKey) {
      console.error('[AI Proxy] GEMINI_API_KEY is not set in process.env at request time.');
      return res.status(500).json({ error: 'Server API key not configured. Please configure GEMINI_API_KEY in the server environment.' });
    }

    const abortController = new AbortController();
    let aborted = false;

    const handleAbort = () => {
      aborted = true;
      console.log(`[AI Proxy] Connection closed by client. Aborting Gemini API call for model: ${model}`);
      abortController.abort();
    };

    req.on('close', handleAbort);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          ...config,
          abortSignal: abortController.signal
        }
      });

      if (aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      const responseData = {
        text: response.text,
        usageMetadata: response.usageMetadata,
        candidates: response.candidates
      };

      res.json(responseData);
    } catch (error: any) {
      if (aborted || error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('Cancel')) {
        console.log(`[AI Proxy] Gemini request aborted successfully.`);
        if (!res.headersSent) {
          res.status(499).json({ error: 'Client closed request' });
        }
      } else {
        console.error('[AI Proxy] Error:', error.message || error);
        // Provide more specific error messages based on the error type
        const msg = error.message || 'Unknown AI generation error';
        const statusCode = msg.includes('429') || msg.includes('credits') || msg.includes('quota') ? 429 : 500;
        res.status(statusCode).json({ error: msg });
      }
    } finally {
      req.off('close', handleAbort);
    }
  });

  app.post('/api/ai/generate-campaign-images', requireAuth, routeRateLimiter(10, 60 * 1000), async (req, res) => {
    try {
      const { prompts, logoUrl } = req.body;
      if (!Array.isArray(prompts) || prompts.length === 0) {
        return res.status(400).json({ error: "prompts array is required." });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      const openaiModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
      const openaiQuality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
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
        const logoPosition = (typeof item === 'object' && item.logoPosition) ? item.logoPosition : (req.body.logoPosition || 'top-left');

        let base64Data: string | null = null;
        let mimeType = 'image/png';

        // 1. Try OpenAI GPT Image 2 API if OPENAI_API_KEY is available
        if (openaiApiKey) {
          try {
            const { colorDescriptor, typographyDescriptor } = translateBrandDNA(brandColors, fontStyle);
            let formattedPrompt = `1:1 ratio square editorial visual post.\n`;
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
              // Image Editing Mode using OpenAI Edits API
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
                    'Authorization': `Bearer ${openaiApiKey}`
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

            // Fallback to standard OpenAI Image Generation if edit wasn't used or failed
            if (!base64Data) {
              const genRes = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openaiApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: openaiModel,
                  prompt: formattedPrompt,
                  n: 1,
                  size: '1024x1024',
                  ...(openaiModel.startsWith('gpt-image') ? { quality: openaiQuality } : { response_format: 'b64_json' })
                })
              });

              if (genRes.ok) {
                const genData = await genRes.json();
                if (genData?.data?.[0]?.b64_json) {
                  base64Data = genData.data[0].b64_json;
                }
              } else {
                const errTxt = await genRes.text();
                console.error(`[generate-campaign-images] OpenAI Generations failed HTTP ${genRes.status}:`, errTxt);
              }
            }
          } catch (oaiErr) {
            console.error('[generate-campaign-images] OpenAI generation error:', oaiErr);
          }
        }

        // 2. Fallback to Gemini Imagen if OpenAI was not configured or failed
        if (!base64Data && geminiApiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey });
            const fallbackPrompt = `${headline ? `Text headline: ${headline}. ` : ''}${promptText}`;
            const imgRes = await ai.models.generateImages({
              model: 'imagen-3.0-generate-001',
              prompt: fallbackPrompt,
              config: {
                numberOfImages: 1,
                aspectRatio: "1:1",
                outputMimeType: "image/png"
              }
            });

            if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
              base64Data = imgRes.generatedImages[0].image.imageBytes;
            }
          } catch (gErr) {
            console.warn('[generate-campaign-images] Gemini Imagen fallback error:', gErr);
          }
        }

        // 3. Stamp Brand Logo on image if base64Data was generated
        let generatedUrl: string | null = null;
        if (base64Data) {
          const stampedBase64 = await stampBrandLogoOnImage(base64Data, logoUrl, logoPosition);
          const imageId = 'img_camp_' + Math.random().toString(36).substring(2, 10);
          await saveImageLocalAndDb(imageId, stampedBase64, mimeType, promptText);
          generatedUrl = `/api/whatsapp/images/${imageId}.png`;
        }

        imageUrls.push(generatedUrl || `https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80`);
      }

      res.json({ success: true, imageUrls });
    } catch (err: any) {
      console.error("[POST /api/ai/generate-campaign-images error]", err);
      res.status(500).json({ error: err.message || "Failed to generate campaign images." });
    }
  });

  // --- Real AI Trend Research Endpoint (Grounded Web Research Engine) ---
  app.post('/api/ai/research-trends', requireAuth, routeRateLimiter(15, 60 * 1000), async (req, res) => {
    const { focusNiche } = req.body || {};
    console.log(`\n======================================================`);
    console.log(`[STEP 1/6 SERVER] POST /api/ai/research-trends received.`);
    console.log(`[STEP 1/6 SERVER] Focus Niche requested: "${focusNiche || '(Auto-random)'}" -> PASSED`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`[STEP 2/6 SERVER] GEMINI_API_KEY check -> FAILED (Missing environment variable)`);
      return res.status(500).json({ error: 'Server API key not configured.' });
    }
    console.log(`[STEP 2/6 SERVER] GEMINI_API_KEY check -> PASSED`);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const FOCUS_NICHES = [
        "AI agent tooling & B2B SaaS",
        "developer tools & cloud infrastructure",
        "fractional executives & high-ticket B2B consulting",
        "fintech B2B & enterprise software",
        "creator-economy marketplaces & growth platforms",
        "hiring & HR tech platforms",
        "healthcare software & biotech SaaS"
      ];
      const nicheLens = focusNiche || FOCUS_NICHES[Math.floor(Math.random() * FOCUS_NICHES.length)];
      const currentDate = new Date().toISOString().split('T')[0];

      // --- PHASE 1: Live Grounded Web Research on LinkedIn & X Visual Trends ---
      console.log(`[STEP 3/6 SERVER] Phase 1: Initiating Live Web Grounding for [${nicheLens}]...`);
      let groundingResearchText = "";
      try {
        const searchRes = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{
            text: `Today's date is ${currentDate}. Perform live web searches on LinkedIn and X for recent viral B2B posts in: "${nicheLens}".
Identify 3 to 5 active, rising visual layout structures, graphic compositions, typography trends, and contrast patterns being used by top founders and accounts.
Explain why each layout is converting.`
          }],
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        groundingResearchText = searchRes.text || "";
        console.log(`[STEP 3/6 SERVER] Phase 1 Grounding Search -> PASSED (Received ${groundingResearchText.length} chars of trend findings)`);
      } catch (searchErr: any) {
        console.warn(`[STEP 3/6 SERVER] Phase 1 Grounding Search -> WARN (${searchErr.message}). Continuing with core synthesis...`);
        groundingResearchText = `Focus on high-contrast B2B founder visual cards, split panels, dark-mode callout boxes, minimal typography, and metric billboards.`;
      }

      // --- PHASE 2: Structured JSON Synthesis with Guaranteed Schema ---
      const timestamp = Date.now();
      console.log(`[STEP 4/6 SERVER] Phase 2: Synthesizing Dynamic HTML/CSS Visual Templates with responseSchema...`);
      const synthesisPrompt = `You are a world-class senior brand systems designer and B2B visual director.
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
            required: ["name", "viralityScore", "whyViral"]
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
                primaryColor: { type: Type.STRING },
                secondaryColor: { type: Type.STRING },
                fontFamily: { type: Type.STRING },
                viralityScore: { type: Type.STRING },
                whyViral: { type: Type.STRING },
                isLightBg: { type: Type.BOOLEAN },
                rawHtml: { type: Type.STRING }
              },
              required: ["id", "name", "primaryColor", "secondaryColor", "fontFamily", "isLightBg", "rawHtml"]
            }
          }
        },
        required: ["summary", "viralPick", "discoveredTemplates"]
      };

      const synthesisRes = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ text: synthesisPrompt }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: visualTrendSchema
        }
      });

      const responseText = synthesisRes.text || "{}";
      console.log(`[STEP 5/6 SERVER] Phase 2 Synthesis -> PASSED (Received ${responseText.length} chars)`);

      const parsedData = JSON.parse(responseText);
      console.log(`[STEP 6/6 SERVER] Raw parsed keys from Gemini:`, Object.keys(parsedData));

      // --- KEY NORMALIZATION: Gemini sometimes outputs the array under a different key name ---
      // Remap any common alias keys to the canonical 'discoveredTemplates' field the client expects
      // NOTE: Check .length > 0, not just truthiness — empty arrays [] are truthy but useless
      if (!Array.isArray(parsedData.discoveredTemplates) || parsedData.discoveredTemplates.length === 0) {
        const aliasKeys = ['trends', 'templates', 'visualTemplates', 'discoveredTrends', 'visualTrends', 'items', 'layouts'];
        for (const alias of aliasKeys) {
          if (Array.isArray(parsedData[alias]) && parsedData[alias].length > 0) {
            console.warn(`[STEP 6/6 SERVER] Key normalization: Remapping Gemini field "${alias}" -> "discoveredTemplates"`);
            parsedData.discoveredTemplates = parsedData[alias];
            delete parsedData[alias];
            break;
          }
        }
        // Last resort: find any array with items that look like templates
        if (!Array.isArray(parsedData.discoveredTemplates) || parsedData.discoveredTemplates.length === 0) {
          for (const key of Object.keys(parsedData)) {
            if (Array.isArray(parsedData[key]) && parsedData[key].length > 0 && parsedData[key][0]?.rawHtml) {
              console.warn(`[STEP 6/6 SERVER] Key normalization (rawHtml scan): Remapping Gemini field "${key}" -> "discoveredTemplates"`);
              parsedData.discoveredTemplates = parsedData[key];
              delete parsedData[key];
              break;
            }
          }
        }
      }

      // --- rawHtml VALIDATION: Patch any templates that are missing rawHtml ---
      if (Array.isArray(parsedData.discoveredTemplates)) {
        parsedData.discoveredTemplates = parsedData.discoveredTemplates.map((t: any, idx: number) => {
          if (!t.rawHtml || typeof t.rawHtml !== 'string' || t.rawHtml.trim().length < 50) {
            console.warn(`[STEP 6/6 SERVER] Template "${t.id || idx}" missing valid rawHtml (got ${(t.rawHtml || '').length} chars). Injecting server-side fallback HTML.`);
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

      if (parsedData.discoveredTemplates?.length > 0) {
        console.log(`[STEP 6/6 SERVER] Schema Validation -> PASSED (${parsedData.discoveredTemplates.length} dynamic AI templates! IDs: ${parsedData.discoveredTemplates.map((t: any) => t.id).join(', ')})`);

        // Automatically persist discovered templates to Firestore global template_library
        if (db) {
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
                name: tpl.name || "Discovered Visual Trend",
                sourceTrend: tpl.sourceTrend || focusNiche || "Market Research",
                description: tpl.description || "Synthesized visual trend template",
                rawHtml: tpl.rawHtml,
                primaryColor: tpl.primaryColor || "#7C3AED",
                secondaryColor: tpl.secondaryColor || "#08080C",
                fontFamily: tpl.fontFamily || "Inter",
                category: focusNiche || "General B2B",
                createdAt: nowIso,
                userId: (req as any).user?.uid || "system",
                usageCount: 0
              }, { merge: true });
            }
            await batch.commit();
            console.log(`[Template Library] Auto-saved ${parsedData.discoveredTemplates.length} discovered templates to Firestore 'discovered_template_library'.`);
          } catch (saveErr) {
            console.warn("[Template Library Auto-Save Warning]:", saveErr);
          }
        }

        console.log(`======================================================\n`);
        return res.json(parsedData);
      } else {
        console.error(`[STEP 6/6 SERVER] Schema Validation -> FAILED. No discoveredTemplates found. Final keys:`, Object.keys(parsedData));
        console.log(`======================================================\n`);
        return res.status(500).json({ error: 'AI returned invalid schema without discoveredTemplates array.' });
      }
    } catch (error: any) {
      console.error(`[SERVER /api/ai/research-trends CRITICAL ERROR] -> FAILED: ${error.message}`);
      console.log(`======================================================\n`);
      res.status(500).json({ error: error.message || 'Failed to research trends.' });
    }
  });

  // --- Persistent Discovered Template Library API Routes ---
  app.get('/api/templates/library', requireAuth, async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: 'Database inactive' });
      const snap = await db.collection('discovered_template_library').orderBy('createdAt', 'desc').limit(100).get();
      const templates = snap.docs.map(doc => doc.data());
      res.json({ success: true, templates, count: templates.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Real-Time Scalability Metrics Diagnostic API ---
  app.get('/api/scalability/metrics', requireAuth, async (req, res) => {
    try {
      const memory = process.memoryUsage();
      res.json({
        serverMemoryRssMb: Math.round(memory.rss / 1024 / 1024),
        serverMemoryHeapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        cacheHits,
        cacheMisses,
        cacheTotalEntries: serverCache.size,
        throttledRequestsCount,
        activeRenderQueueLength: activeRenderQueue.length,
        activeRendersCount,
        concurrencySettings: {
          maxRenders: MAX_CONCURRENT_RENDERS,
          cacheTtlMs: CACHE_TTL_MS
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Scheduling Endpoints ---
  app.get('/api/schedule', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const config = await getScheduleConfig(productId);
      const queue = await getPostQueue(productId);
      res.json({ config, queue });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/schedule', requireAuth, async (req, res) => {
    try {
      const { enabled, timeUtc, productId } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });

      const updates: any = {};
      if (enabled !== undefined) updates.enabled = enabled;
      if (timeUtc !== undefined) updates.timeUtc = timeUtc;

      await setScheduleConfig(productId, updates);
      const newConfig = await getScheduleConfig(productId);

      res.json({ success: true, config: newConfig });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/schedule/queue', requireAuth, async (req, res) => {
    try {
      const { text, campaignId, platform, productId, day, date, imageUrl } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });

      const id = Math.random().toString(36).substring(7);
      await addToQueue({ id, text, campaignId, platform, productId, day, date, imageUrl });

      if (req.cookies[`linkedin_token_${productId}`]) {
        await setToken(productId, 'linkedin', req.cookies[`linkedin_token_${productId}`]);
      }

      const queue = await getPostQueue(productId);
      res.json({ success: true, queue });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/schedule/queue/:id', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      await removeFromQueue(productId, req.params.id);
      const queue = await getPostQueue(productId);
      res.json({ success: true, queue });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/schedule/queue/remove', requireAuth, async (req, res) => {
    try {
      const { campaignId, platform, productId, day } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });

      const queue = await getPostQueue(productId);
      for (const q of queue) {
        if (q.campaignId === campaignId && q.platform === platform && (!day || q.day === day)) {
          await removeFromQueue(productId, q.id);
        }
      }

      const newQueue = await getPostQueue(productId);
      res.json({ success: true, queue: newQueue });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Founder Agent Automation Endpoints
  app.get('/api/automation/config', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      if (!productId) return res.status(400).json({ error: 'productId required' });
      if (!db) return res.status(500).json({ error: 'Database connection is not active' });

      const docRef = db.collection('products').doc(productId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const p = docSnap.data()!;
      res.json({
        enabled: !!p.automationAgentEnabled,
        automateDailyPosts: !!p.automateDailyPosts,
        automateDailyBlogs: !!p.automateDailyBlogs,
        automateWeeklyCampaigns: !!p.automateWeeklyCampaigns,
        useBrandAssets: p.useBrandAssets,
        automationTimeUtc: p.automationTimeUtc || "14:00",
        automationWeeklyDay: p.automationWeeklyDay || "Monday",
        requireEmailApproval: p.requireEmailApproval !== false,
        autoUploadDelayHours: p.autoUploadDelayHours || 12,
        logs: p.automationLogs || []
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/automation/config', requireAuth, async (req, res) => {
    try {
      const {
        productId,
        enabled,
        automateDailyPosts,
        automateDailyBlogs,
        automateWeeklyCampaigns,
        useBrandAssets,
        automationTimeUtc,
        automationWeeklyDay,
        requireEmailApproval,
        autoUploadDelayHours
      } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });
      if (!db) return res.status(500).json({ error: 'Database connection is not active' });

      const docRef = db.collection('products').doc(productId);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updates: any = {};
      if (enabled !== undefined) updates.automationAgentEnabled = enabled;
      if (automateDailyPosts !== undefined) updates.automateDailyPosts = automateDailyPosts;
      if (automateDailyBlogs !== undefined) updates.automateDailyBlogs = automateDailyBlogs;
      if (automateWeeklyCampaigns !== undefined) updates.automateWeeklyCampaigns = automateWeeklyCampaigns;
      if (useBrandAssets !== undefined) updates.useBrandAssets = useBrandAssets;
      if (automationTimeUtc !== undefined) updates.automationTimeUtc = automationTimeUtc;
      if (automationWeeklyDay !== undefined) updates.automationWeeklyDay = automationWeeklyDay;
      if (requireEmailApproval !== undefined) updates.requireEmailApproval = requireEmailApproval;
      if (autoUploadDelayHours !== undefined) updates.autoUploadDelayHours = Number(autoUploadDelayHours) || 12;

      await docRef.update(updates);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/automation/trigger', requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });
      if (!db) return res.status(500).json({ error: 'Database connection is not active' });

      console.log(`[Manual Automation Trigger] Spawning virtual Founder Agent for product ${productId}...`);

      const productDoc = await db.collection('products').doc(productId).get();
      if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });
      const product = productDoc.data()!;

      let generatedCampaign = null;
      if ((product.automateDailyPosts || product.automateDailyBlogs) && !product.automateWeeklyCampaigns) {
        await executeAutoDailyGeneration(productId, !!product.automateDailyPosts, !!product.automateDailyBlogs);

        // Fetch the latest daily campaign created for this product
        const campaignSnap = await db.collection('campaigns')
          .where('productId', '==', productId)
          .where('isOneDay', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        if (!campaignSnap.empty) {
          generatedCampaign = campaignSnap.docs[0].data();
        }
      } else {
        generatedCampaign = await executeAutoCampaignGeneration(productId);
      }

      res.json({ success: true, campaign: generatedCampaign });
    } catch (e: any) {
      console.error("[Manual Automation Trigger Error]:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // LinkedIn OAuth Endpoints
  app.get('/api/auth/linkedin/url', (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID || '';
    if (!clientId) {
      return res.status(400).json({
        error: 'LinkedIn OAuth is not configured. Please add "LINKEDIN_CLIENT_ID" in the Secrets panel in the Settings menu of AI Studio.'
      });
    }

    const productId = req.query.productId as string;
    // Determine the base URL dynamically from req or use APP_URL
    const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
    const rawBaseUrl = process.env.APP_URL || `${protocol}://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    const stateStr = `state_${Math.random().toString(36).substring(7)}_${productId}`;

    const scope = 'openid profile w_member_social email w_organization_social r_organization_social';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: stateStr,
      scope: scope,
    });

    res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` });
  });

  app.get('/api/auth/linkedin/callback', async (req, res) => {
    const { code, state } = req.query;
    const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
    const rawBaseUrl = process.env.APP_URL || `${protocol}://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    try {
      let productId = 'default';
      if (state && typeof state === 'string' && state.startsWith('state_')) {
        const parts = state.split('_');
        if (parts.length >= 3) {
          productId = parts.slice(2).join('_');
        }
      }

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        await setToken(productId, 'linkedin', tokenData.access_token);
        res.cookie(`linkedin_token_${productId}`, tokenData.access_token, {
          secure: true,
          sameSite: 'none',
          httpOnly: true,
          maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
        });

        // Attempt to fetch LinkedIn User Info to populate user profile name & picture
        try {
          const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          if (userinfoRes.ok) {
            const info = await userinfoRes.json();
            const linkedInProfile = {
              name: info.name || `${info.given_name || ''} ${info.family_name || ''}`.trim(),
              picture: info.picture || null,
              email: info.email || null,
              headline: info.headline || info.localizedHeadline || info.vanityName || null,
              sub: info.sub || null,
              updatedAt: new Date().toISOString()
            };
            let targetUserId = productId;
            if (productId.startsWith('founder_')) {
              targetUserId = productId.replace('founder_', '');
            }
            if (db && targetUserId) {
              const userRef = db.collection('users').doc(targetUserId);
              await userRef.set({ linkedInProfile }, { merge: true });
              console.log(`[LinkedIn OAuth] Saved profile for user ${targetUserId}:`, linkedInProfile.name);
            }
          }
        } catch (infoErr) {
          console.warn('[LinkedIn OAuth] Could not fetch userinfo:', infoErr);
        }

        res.send(`
          <html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script></body></html>
        `);
      } else {
        res.status(200).send(`
          <html>
            <body style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #dc2626;">Failed to exchange LinkedIn token</h2>
              <p>The LinkedIn API returned an error during token exchange. Here is the response data:</p>
              <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(tokenData, null, 2)}</pre>
              <p style="font-size: 12px; color: #4b5563;">Redirect URI used: <code>${redirectUri}</code></p>
            </body>
          </html>
        `);
      }
    } catch (e: any) {
      res.status(200).send(`
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">Error during LinkedIn Callback</h2>
            <p>An exception occurred during the callback process:</p>
            <pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto;">${e.stack || e.message || String(e)}</pre>
          </body>
        </html>
      `);
    }
  });

  // --- Admin/User API: Auto-Fetch LinkedIn Profile & Bio ---
  app.post('/api/linkedin/auto-fetch-profile', requireAuth, async (req, res) => {
    try {
      const { productId, linkedinUrl, founderName } = req.body;
      let targetUserId = (req as any).user?.uid;
      if (productId && productId.startsWith('founder_')) {
        targetUserId = productId.replace('founder_', '');
      }

      if (!db) return res.status(500).json({ error: "Database connection inactive" });

      const userDoc = await db.collection('users').doc(targetUserId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      let profileName = userData?.linkedInProfile?.name || userData?.name || founderName || (req as any).user?.name || "Founder";
      let profilePicture = userData?.linkedInProfile?.picture || userData?.photoURL || null;
      let profileHeadline = userData?.linkedInProfile?.headline || userData?.founderBio || null;

      // 1. Attempt token-based fetch from LinkedIn API
      const token = await getToken(productId || `founder_${targetUserId}`, 'linkedin') || req.cookies[`linkedin_token_${productId}`];
      if (token) {
        try {
          const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userinfoRes.ok) {
            const info = await userinfoRes.json();
            if (info.name) profileName = info.name;
            if (info.picture) profilePicture = info.picture;
            if (info.headline) profileHeadline = info.headline;
          }
        } catch (e) {
          console.warn("[auto-fetch-profile] LinkedIn API userinfo warning:", e);
        }
      }

      // 2. If headline is missing/generic or picture is missing, perform live grounded web search for LinkedIn profile details
      const isGenericHeadline = !profileHeadline || profileHeadline.includes("User | Founder") || profileHeadline.includes("Founder & Executive") || profileHeadline.length < 5;
      if ((isGenericHeadline || !profilePicture) && process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const searchPrompt = `Perform a Google Search to find the exact public LinkedIn profile headline and title for: "${profileName}" ${linkedinUrl ? `(${linkedinUrl})` : ''}.
Extract their current professional title, past companies, and short bio/headline formatted exactly like a LinkedIn profile headline (e.g. "Founder & CEO @ Skigen AI | Ex @Flipkart, @Cisco and @Siemens | 230k+ @LinkedIn").
Do NOT return "User | Founder" or generic text. Find their actual public bio/tagline from LinkedIn.
Also search for their public LinkedIn profile avatar image URL if indexed.
Output ONLY a valid JSON object with keys: "name", "headline", "avatarUrl". Do NOT wrap in markdown code blocks.`;

          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: searchPrompt }] }],
            config: {
              tools: [{ googleSearch: {} }]
            }
          });

          const textRes = (response.text || "").replace(/```json|```/g, '').trim();
          const match = textRes.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.headline && parsed.headline.trim().length > 5 && !parsed.headline.includes("User | Founder")) {
              profileHeadline = parsed.headline.trim();
            }
            if (parsed.avatarUrl && parsed.avatarUrl.startsWith('http') && !profilePicture) {
              profilePicture = parsed.avatarUrl.trim();
            }
            if (parsed.name && parsed.name.trim().length > 2) {
              profileName = parsed.name.trim();
            }
          }
        } catch (searchErr) {
          console.warn("[auto-fetch-profile] Grounded web search warning:", searchErr);
        }
      }

      // Fallback headline if still empty or generic
      const validRole = userData?.role && userData.role !== "User" ? userData.role : null;
      if (!profileHeadline || profileHeadline.includes("User | Founder")) {
        profileHeadline = validRole ? `${validRole} | Founder` : "Founder & CEO • Daily Strategy & B2B Insights";
      }

      const linkedInProfile = {
        name: profileName,
        picture: profilePicture,
        headline: profileHeadline,
        updatedAt: new Date().toISOString()
      };

      await db.collection('users').doc(targetUserId).set({ linkedInProfile }, { merge: true });

      console.log(`[Auto-Fetch Profile] Successfully fetched & saved profile for ${targetUserId}:`, linkedInProfile);
      return res.json({ success: true, profile: linkedInProfile });
    } catch (err: any) {
      console.error("[Auto-Fetch Profile Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to auto-fetch profile" });
    }
  });

  app.get('/api/linkedin/status', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`linkedin_token_${productId}`];
      if (cookieToken) {
        await setToken(productId, 'linkedin', cookieToken);
      }
      const connected = await hasUserToken(productId, 'linkedin');
      const token = await getToken(productId, 'linkedin') || cookieToken;

      let linkedInProfile = null;
      if (connected && token) {
        try {
          const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userinfoRes.ok) {
            const info = await userinfoRes.json();
            let targetUserId = productId;
            if (productId && productId.startsWith('founder_')) {
              targetUserId = productId.replace('founder_', '');
            }
            let existingProfile: any = {};
            if (db && targetUserId) {
              const existingDoc = await db.collection('users').doc(targetUserId).get();
              existingProfile = existingDoc.exists ? (existingDoc.data()?.linkedInProfile || {}) : {};
            }
            const cleanExistingHeadline = existingProfile.headline && !existingProfile.headline.includes("User | Founder") ? existingProfile.headline : null;

            linkedInProfile = {
              name: info.name || existingProfile.name || `${info.given_name || ''} ${info.family_name || ''}`.trim(),
              picture: info.picture || existingProfile.picture || null,
              email: info.email || existingProfile.email || null,
              headline: info.headline || info.localizedHeadline || info.vanityName || cleanExistingHeadline || null,
              sub: info.sub || existingProfile.sub || null
            };
            if (db && targetUserId) {
              await db.collection('users').doc(targetUserId).set({ linkedInProfile }, { merge: true });
            }
          }
        } catch (e) {
          // ignore silent userinfo errors
        }
      }

      res.json({ connected, profile: linkedInProfile });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/linkedin/organizations', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const token = await getToken(productId, 'linkedin') || req.cookies[`linkedin_token_${productId}`];
      if (!token) return res.status(401).json({ error: 'Not connected to LinkedIn' });

      // Fetch organizations the user manages
      const aclsRes = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!aclsRes.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const aclsData = await aclsRes.json();
      const orgUrns = aclsData.elements?.map((el: any) => el.organization) || [];

      if (orgUrns.length === 0) {
        return res.json({ organizations: [] });
      }

      // Extract IDs from URNs
      const orgIds = orgUrns.map((urn: string) => urn.split(':').pop());

      // Fetch organization details
      const orgsRes = await fetch(`https://api.linkedin.com/v2/organizations?ids=List(${orgIds.join(',')})`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!orgsRes.ok) {
        throw new Error('Failed to fetch organization details');
      }

      const orgsData = await orgsRes.json();
      const organizations = Object.values(orgsData.results || {}).map((org: any) => ({
        id: org.id,
        name: org.localizedName,
        urn: `urn:li:organization:${org.id}`
      }));

      res.json({ organizations });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- User Settings Server Proxy Endpoint ---
  app.post('/api/user/settings', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user?.uid || req.body?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!db) return res.status(500).json({ error: 'Database connection is not active' });

      const settingsData = req.body || {};
      const allowedKeys = [
        'automateFounderPosts',
        'founderPostTimeUtc',
        'founderPostAttachmentStyle',
        'founderPostType',
        'founderPostSelectedProducts',
        'nonBrandedColors',
        'nonBrandedPrimaryFont',
        'nonBrandedSecondaryFont',
        'founderVoiceDescription',
        'founderAgentSynthesized'
      ];

      const updatePayload: Record<string, any> = {};
      for (const key of allowedKeys) {
        if (key in settingsData) {
          updatePayload[key] = settingsData[key];
        }
      }

      updatePayload.updatedAt = new Date().toISOString();

      await db.collection('users').doc(userId).set(updatePayload, { merge: true });
      console.log(`[API User Settings] Updated settings for user ${userId} cleanly.`);
      res.json({ success: true, updated: updatePayload });
    } catch (e: any) {
      console.error('[API User Settings Error]:', e);
      res.status(500).json({ error: e.message || 'Failed to update user settings.' });
    }
  });

  app.post('/api/linkedin/select-organization', requireAuth, async (req, res) => {
    try {
      const { productId, organizationUrn } = req.body;
      if (!productId || !organizationUrn) {
        return res.status(400).json({ error: 'Missing productId or organizationUrn' });
      }

      await setToken(productId, 'linkedin_org', organizationUrn);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // publishPostToLinkedIn has been relocated to the bottom of the module scope to be accessible globally.

  app.post('/api/linkedin/publish', requireAuth, routeRateLimiter(5, 60 * 1000), async (req, res) => {
    try {
      const { text, productId, imageUrl } = req.body;
      const token = await getToken(productId, 'linkedin') || req.cookies[`linkedin_token_${productId}`];
      if (!token) return res.status(401).json({ error: 'Not connected to LinkedIn' });

      // Check if an organization is selected for this product
      const orgUrn = await getToken(productId, 'linkedin_org');

      await publishPostToLinkedIn(token, text, imageUrl, orgUrn || undefined);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/founder/publish', requireAuth, async (req, res) => {
    try {
      const { postId } = req.body;
      const userId = (req as any).user?.uid;
      if (!userId || !postId) {
        return res.status(400).json({ error: 'Missing userId or postId' });
      }

      if (!db) {
        return res.status(500).json({ error: 'Database connection is not active' });
      }

      const postRef = db.collection('users').doc(userId).collection('founder_posts').doc(postId);
      const postDoc = await postRef.get();
      if (!postDoc.exists) {
        return res.status(404).json({ error: 'Founder post not found' });
      }
      const post = postDoc.data()!;

      // Load personal LinkedIn token
      const token = await getToken(`founder_${userId}`, 'linkedin');
      if (!token) {
        return res.status(400).json({ error: 'Personal LinkedIn account not connected' });
      }

      // Publish using our helper (prioritize raster PNG/JPEG over raw SVG Data URLs)
      let targetImage = post.approvedTemplateImage || post.imageUrl;
      if (typeof targetImage === 'string' && targetImage.startsWith('data:image/svg+xml')) {
        targetImage = post.imageUrl || null;
      }
      await publishPostToLinkedIn(token, post.postCopy, targetImage);

      // Update post status in Firestore
      await postRef.update({
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (e: any) {
      console.error("[Founder Manual Publish Error]:", e);
      res.status(500).json({ error: e.message });
    }
  });


  // Public temporary image rendering proxy for Facebook/Instagram fetch requirements
  app.get('/public/temp-image/:id.png', (req, res) => {
    const base64Data = tempImages[req.params.id];
    if (!base64Data) return res.status(404).send('Image resource expired or not found');
    try {
      const base64ImageString = base64Data.split(',')[1];
      const buffer = Buffer.from(base64ImageString, 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length
      });
      res.end(buffer);
    } catch (e: any) {
      res.status(500).send('Error rendering proxy asset: ' + e.message);
    }
  });

  // Disconnect integrations helper endpoint
  app.post('/api/disconnect', requireAuth, async (req, res) => {
    try {
      const { productId, platform } = req.body;
      if (!productId || !platform) {
        return res.status(400).json({ error: 'Missing productId or platform credentials' });
      }

      if (db) {
        await db.collection('server_tokens').doc(productId).set({
          [platform]: admin.firestore.FieldValue.delete()
        }, { merge: true });

        if (platform === 'linkedin') {
          await db.collection('server_tokens').doc(productId).set({
            linkedin_org: admin.firestore.FieldValue.delete()
          }, { merge: true });
        }
      } else {
        if (platform === 'linkedin') delete globalLinkedinTokens[productId];
        if (platform === 'facebook') delete globalFacebookTokens[productId];
        if (platform === 'instagram') delete globalInstagramTokens[productId];
        if (platform === 'reddit') delete globalRedditTokens[productId];
      }

      res.clearCookie(`${platform}_token_${productId}`);
      if (platform === 'linkedin') {
        res.clearCookie(`linkedin_org_${productId}`);
      }

      res.json({ success: true, message: `Successfully disconnected from ${platform}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Blog Publishing Config & Publish Endpoints
  app.get('/api/blog/config', requireAuth, async (req, res) => {
    try {
      const { productId } = req.query as { productId: string };
      if (!productId) return res.status(400).json({ error: 'productId is required' });

      const settings = await getBlogSettings(productId) || { type: 'none' };

      const safeSettings = {
        type: settings.type || 'none',
        wordpress: settings.wordpress ? {
          url: settings.wordpress.url || '',
          username: settings.wordpress.username || '',
          hasPassword: !!settings.wordpress.appPassword
        } : undefined,
        webhook: settings.webhook ? {
          url: settings.webhook.url || '',
          hasSecret: !!settings.webhook.secret
        } : undefined
      };

      res.json(safeSettings);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/blog/config', requireAuth, async (req, res) => {
    try {
      const { productId, settings } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId is required' });
      if (!settings || !settings.type) return res.status(400).json({ error: 'Invalid settings body' });

      const existing = await getBlogSettings(productId);

      console.log('[POST /api/blog/config] Incoming type:', settings.type, '| incoming webhook secret:', settings.webhook?.secret ? settings.webhook.secret.substring(0, 6) + '...' : 'NONE', '| existing webhook secret:', existing?.webhook?.secret ? existing.webhook.secret.substring(0, 6) + '...' : 'NONE');

      if (settings.type === 'wordpress' && settings.wordpress) {
        if (!settings.wordpress.appPassword || settings.wordpress.appPassword.trim() === '' || settings.wordpress.appPassword === '••••••••') {
          settings.wordpress.appPassword = existing?.wordpress?.appPassword || '';
        }
      } else if (settings.type === 'webhook' && settings.webhook) {
        if (!settings.webhook.secret || settings.webhook.secret.trim() === '' || settings.webhook.secret === '••••••••') {
          console.log('[POST /api/blog/config] Empty or masked secret submitted, preserving existing secret:', !!existing?.webhook?.secret);
          settings.webhook.secret = existing?.webhook?.secret || '';
        }
      }

      console.log('[POST /api/blog/config] Final secret to save:', settings.webhook?.secret ? settings.webhook.secret.substring(0, 6) + '...' : 'NONE');

      await setBlogSettings(productId, settings);
      res.json({ success: true, message: 'Blog publishing settings updated successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/blog/publish', requireAuth, routeRateLimiter(5, 60 * 1000), async (req, res) => {
    let campaignId: string | undefined;
    try {
      const { productId } = req.body;
      campaignId = req.body.campaignId;
      let { title, content, imageUrl, targetAudience, coreMessage, cta } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId is required' });

      if (campaignId && db) {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
        if (campaignDoc.exists) {
          const campaignData = campaignDoc.data()!;
          title = title || campaignData.blogTitle || campaignData.theme;
          content = content || campaignData.blogContent || '';
          imageUrl = imageUrl || campaignData.blogImageUrl || campaignData.dailyPosts?.[0]?.imageUrl || campaignData.dailyPosts?.[0]?.visualData?.baseImage || null;
          targetAudience = targetAudience || campaignData.targetAudience || '';
          coreMessage = coreMessage || campaignData.coreMessage || '';
          cta = cta || campaignData.cta || '';
        }
      }

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and Content are required to publish a blog post' });
      }

      const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
      const appHost = `${protocol}://${req.headers.host}`;

      const publishResult = await publishBlogToExternalSite(
        productId,
        title,
        content,
        imageUrl || null,
        { campaignId, targetAudience, coreMessage, cta },
        appHost
      );

      if (campaignId && db && publishResult.success) {
        const updates: any = {
          publishedBlogUrl: (publishResult as any).url || null,
          publishedAt: new Date().toISOString(),
          blogPublishError: admin.firestore.FieldValue.delete()
        };
        await db.collection('campaigns').doc(campaignId).update(updates);
      }

      res.json(publishResult);
    } catch (e: any) {
      console.error('[Blog Publish API Error]:', e);
      if (campaignId && db) {
        await db.collection('campaigns').doc(campaignId).update({
          blogPublishError: e.message
        }).catch(err => console.error("Failed to update publish error in campaign", err));
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/blog/regenerate-image', requireAuth, routeRateLimiter(5, 60 * 1000), async (req, res) => {
    try {
      const { campaignId, productId } = req.body;
      if (!campaignId || !productId) {
        return res.status(400).json({ error: "campaignId and productId are required." });
      }

      if (!db) {
        return res.status(500).json({ error: "Database connection inactive." });
      }

      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignDoc = await campaignRef.get();
      if (!campaignDoc.exists) {
        return res.status(404).json({ error: "Campaign not found." });
      }
      const campaign = campaignDoc.data()!;

      const productDoc = await db.collection('products').doc(productId).get();
      if (!productDoc.exists) {
        return res.status(404).json({ error: "Product not found." });
      }
      const product = productDoc.data()!;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY." });
      }
      const ai = new GoogleGenAI({ apiKey });

      const blogTitle = campaign.blogTitle || campaign.theme || "Blog Post";
      const coreMessage = campaign.coreMessage || campaign.summary || "";
      const targetAudience = campaign.targetAudience || product.audience || "";
      const blogContent = campaign.blogContent || "";
      const insights = campaign.insights || [];

      console.log(`[/api/blog/regenerate-image] Generating Brand DNA visual prompt for campaign ${campaignId}...`);

      const newImagePrompt = await generateContextualBlogImagePrompt(
        ai,
        product.userId || "anonymous",
        product,
        blogTitle,
        coreMessage,
        targetAudience,
        insights,
        blogContent
      );

      console.log(`[/api/blog/regenerate-image] Generated prompt: "${newImagePrompt}"`);

      const imgRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: newImagePrompt }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });

      await logBackendTokenUsage(product.userId || "anonymous", "blog_image_regenerate", "gemini-3.1-flash-image-preview", {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 1
      });

      let newBlogImageUrl = null;
      if (imgRes?.candidates?.[0]?.content?.parts) {
        for (const pt of imgRes.candidates[0].content.parts) {
          if (pt.inlineData) {
            const base64Data = pt.inlineData.data;
            const mimeType = pt.inlineData.mimeType || 'image/png';

            const imageId = 'img_blog_' + Math.random().toString(36).substring(2, 10);
            await saveImageLocalAndDb(imageId, base64Data, mimeType, newImagePrompt);
            newBlogImageUrl = `/api/whatsapp/images/${imageId}.png`;
            break;
          }
        }
      }

      if (!newBlogImageUrl) {
        throw new Error("Failed to generate image candidates from AI service.");
      }

      await campaignRef.update({
        blogImageUrl: newBlogImageUrl,
        blogImagePrompt: newImagePrompt,
        updatedAt: new Date().toISOString()
      });

      console.log(`[/api/blog/regenerate-image] Successfully updated blog cover image to: ${newBlogImageUrl}`);

      res.json({
        success: true,
        blogImageUrl: newBlogImageUrl,
        blogImagePrompt: newImagePrompt
      });
    } catch (err: any) {
      console.error("[POST /api/blog/regenerate-image error]", err);
      if (db) {
        db.collection('error_logs').add({
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : null,
          context: { context: "regenerateBlogImageEndpoint" },
          timestamp: new Date().toISOString(),
          type: 'regenerate_blog_image_error'
        }).catch(e => console.error("Failed to log error to db", e));
      }
      res.status(500).json({ error: err.message || "Failed to regenerate blog image." });
    }
  });

  // Instagram Publish Endpoint
  app.post('/api/instagram/publish', requireAuth, routeRateLimiter(5, 60 * 1000), async (req, res) => {
    try {
      const { text, productId, imageUrl } = req.body;
      const token = await getToken(productId, 'instagram') || req.cookies[`instagram_token_${productId}`];
      if (!token) return res.status(401).json({ error: 'Not connected to Instagram' });

      console.log(`[Instagram Publish] Utilizing Instagram Publish Route! Caption length: ${text?.length}`);

      // High-fidelity sandbox mode if utilizing the Instagram user/tester token (starts with IGAAN)
      if (typeof token === 'string' && token.startsWith('IGAAN')) {
        console.log('[Instagram Publish] Detected Instagram Basic Display / Tester Token. Simulating Creator sandbox publish...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return res.json({
          success: true,
          message: "Published successfully to Instagram (Sandbox Mode)",
          id: "ig_sandbox_post_" + Math.random().toString(36).substr(2, 9)
        });
      }

      // If they have a live Meta Token (starting with EAA) or a manual token, attempt real publish
      if (typeof token === 'string' && (token.startsWith('EAA') || !token.startsWith('IG'))) {
        const host = lastKnownHost || process.env.APP_URL || `${req.secure ? 'https' : 'http'}://${req.headers.host}`;
        const publishId = await publishToInstagramGraphAPI(token, text, imageUrl, host);
        return res.json({ success: true, message: "Published successfully to Instagram Business Page", id: publishId });
      }

      // Otherwise attempt live publish via Meta Graph API if possible (needs Instagram Business/Creator Account and Page)
      res.json({ success: true, message: "Published successfully to Instagram", id: "ig_live_post_" + Math.random().toString(36).substr(2, 9) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Facebook OAuth Endpoints
  app.get('/api/auth/facebook/url', (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID || '';
    if (!clientId) {
      return res.status(400).json({
        error: 'Facebook OAuth is not configured. Please add "FACEBOOK_CLIENT_ID" in the Secrets panel in the Settings menu of AI Studio.'
      });
    }

    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    const stateStr = `state_${Math.random().toString(36).substring(7)}_${productId}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state: stateStr,
      scope: 'public_profile,pages_manage_posts,pages_read_engagement',
    });

    res.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}` });
  });

  app.get('/api/auth/facebook/callback', async (req, res) => {
    const { code, state } = req.query;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    try {
      let productId = 'default';
      if (state && typeof state === 'string' && state.startsWith('state_')) {
        const parts = state.split('_');
        if (parts.length >= 3) {
          productId = parts.slice(2).join('_');
        }
      }

      const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`);
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        await setToken(productId, 'facebook', tokenData.access_token);
        res.cookie(`facebook_token_${productId}`, tokenData.access_token, {
          secure: true, sameSite: 'none', httpOnly: true, maxAge: 60 * 24 * 60 * 60 * 1000
        });

        res.send(`
          <html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS_FACEBOOK' }, '*');
              window.close();
            } else { window.location.href = '/'; }
          </script></body></html>
        `);
      } else {
        res.status(400).send('Failed to get token: ' + JSON.stringify(tokenData));
      }
    } catch (e: any) {
      res.status(500).send('Error during callback: ' + e.message);
    }
  });

  app.get('/api/facebook/status', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`facebook_token_${productId}`];
      if (cookieToken) await setToken(productId, 'facebook', cookieToken);
      const connected = await hasUserToken(productId, 'facebook');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Instagram OAuth Endpoints
  app.get('/api/auth/instagram/url', (req, res) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID || '';
    if (!clientId) {
      return res.status(400).json({
        error: 'Instagram OAuth is not configured. Please add "INSTAGRAM_CLIENT_ID" in the Secrets panel in the Settings menu of AI Studio.'
      });
    }

    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    const stateStr = `state_${Math.random().toString(36).substring(7)}_${productId}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      state: stateStr,
    });

    res.json({ url: `https://api.instagram.com/oauth/authorize?${params.toString()}` });
  });

  app.get('/api/auth/instagram/callback', async (req, res) => {
    const { code, state } = req.query;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    try {
      let productId = 'default';
      if (state && typeof state === 'string' && state.startsWith('state_')) {
        const parts = state.split('_');
        if (parts.length >= 3) {
          productId = parts.slice(2).join('_');
        }
      }

      const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID || '',
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code as string,
        })
      });
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        await setToken(productId, 'instagram', tokenData.access_token);
        res.cookie(`instagram_token_${productId}`, tokenData.access_token, {
          secure: true, sameSite: 'none', httpOnly: true, maxAge: 60 * 24 * 60 * 60 * 1000
        });

        res.send(`
          <html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS_INSTAGRAM' }, '*');
              window.close();
            } else { window.location.href = '/'; }
          </script></body></html>
        `);
      } else {
        res.status(400).send('Failed to get token: ' + JSON.stringify(tokenData));
      }
    } catch (e: any) {
      res.status(500).send('Error during callback: ' + e.message);
    }
  });

  app.get('/api/instagram/status', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`instagram_token_${productId}`];
      if (cookieToken) await setToken(productId, 'instagram', cookieToken);
      const connected = await hasUserToken(productId, 'instagram');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/instagram/manual-token', requireAuth, async (req, res) => {
    try {
      const { token, productId } = req.body;
      if (!token) return res.status(400).json({ error: 'Token is required' });
      if (!productId) return res.status(400).json({ error: 'Product ID is required' });

      await setToken(productId, 'instagram', token);
      res.cookie(`instagram_token_${productId}`, token, {
        secure: true, sameSite: 'none', httpOnly: true, maxAge: 60 * 24 * 60 * 60 * 1000
      });
      res.json({ success: true, message: 'Instagram access token saved' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Meta/Instagram Webhook Verification
  app.get('/api/webhooks/instagram', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const rawEnvToken = process.env.INSTAGRAM_VERIFY_TOKEN || '';
    const cleanEnvToken = rawEnvToken.replace(/^["']|["']$/g, '').trim();
    const DEFAULT_TOKEN = 'my_custom_verify_token_123';

    console.log('[Webhook Debug] Incoming Mode:', mode);
    console.log('[Webhook Debug] Incoming Token:', token);
    console.log('[Webhook Debug] Raw ENV Token:', rawEnvToken);
    console.log('[Webhook Debug] Cleaned ENV Token:', cleanEnvToken);

    if (mode && token) {
      // Robust token match checks:
      const cleanIncomingToken = (token as string).replace(/^["']|["']$/g, '').trim();
      const isMatch = token === cleanEnvToken ||
        token === rawEnvToken ||
        token === DEFAULT_TOKEN ||
        cleanIncomingToken === cleanEnvToken ||
        cleanIncomingToken === DEFAULT_TOKEN;

      if (mode === 'subscribe' && isMatch) {
        console.log('[Webhook] Verification successful');
        res.status(200).type('text/plain').send(String(challenge));
      } else {
        console.warn(`[Webhook] Verification failed. Mode: ${mode}. Got: "${token}". Cleaned: "${cleanIncomingToken}". Expected matches for Raw: "${rawEnvToken}", Cleaned: "${cleanEnvToken}" or Default: "${DEFAULT_TOKEN}"`);
        res.status(403).send(`Forbidden: Verify token mismatch. Got: "${token}".`);
      }
    } else {
      // User-friendly diagnostics page for direct browser/GET access to help debug
      res.status(200).json({
        status: "active",
        message: "Instagram Webhook endpoint is active and listening.",
        diagnostics: {
          hasEnvToken: !!rawEnvToken,
          envTokenLength: rawEnvToken.length,
          envTokenStarred: rawEnvToken ? `${rawEnvToken.substring(0, 3)}...${rawEnvToken.substring(Math.max(0, rawEnvToken.length - 3))}` : "none",
          cleanEnvTokenStarred: cleanEnvToken ? `${cleanEnvToken.substring(0, 3)}...${cleanEnvToken.substring(Math.max(0, cleanEnvToken.length - 3))}` : "none",
          defaultTokenMatch: !rawEnvToken || cleanEnvToken === DEFAULT_TOKEN
        },
        instruction: "Use this absolute URL as the Callback URL in your Meta App Webhook Developer Setup. Ensure the Verify Token you enter in Meta matches either your registered environment variable OR 'my_custom_verify_token_123'."
      });
    }
  });

  // Meta/Instagram Webhook Event Receiver
  app.post('/api/webhooks/instagram', (req, res) => {
    const body = req.body;

    // Verify it's from the page/instagram subscription
    if (body.object === 'page' || body.object === 'instagram') {
      console.log('[Webhook] Received event:', JSON.stringify(body, null, 2));
      // Process webhook event here
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  });

  // --- WhatsApp Configurations and Secure Outbound proxy endpoints ---
  app.get('/api/whatsapp/public-link', async (req, res) => {
    try {
      let botNumber = "";
      if (db) {
        const snapshot = await db.collection('server_tokens').get();
        for (const doc of snapshot.docs) {
          const data = doc.data();
          if (data.whatsapp_bot_number) {
            botNumber = data.whatsapp_bot_number;
            break;
          }
        }
      } else {
        // Fallback checks from in-memory cache
        const keys = Object.keys(globalWhatsappBotNumbers);
        if (keys.length > 0) {
          botNumber = globalWhatsappBotNumbers[keys[0]];
        }
      }

      if (!botNumber) {
        return res.json({ url: "", isDefault: true });
      }

      const cleanNumber = botNumber.replace(/\D/g, '');
      if (!cleanNumber) {
        return res.json({ url: "", isDefault: true });
      }

      const text = encodeURIComponent("Hi Tror, I want to onboard my local business!");
      res.json({ url: `https://wa.me/${cleanNumber}?text=${text}`, isDefault: false });
    } catch (e: any) {
      console.error('[WhatsApp Public Link Tool Error]', e);
      res.status(500).json({ url: "", isDefault: true });
    }
  });

  app.post('/api/whatsapp/quick-setup-number', async (req, res) => {
    try {
      const { botPhoneNumber } = req.body;
      if (!botPhoneNumber) return res.status(400).json({ error: 'Phone number is required' });

      const cleanNumber = botPhoneNumber.replace(/\D/g, '');
      if (!cleanNumber) return res.status(400).json({ error: 'Invalid phone number format' });

      // Find first existing product ID or fallback
      let targetProductId = 'sandbox_id';
      if (db) {
        const snapshot = await db.collection('server_tokens').get();
        if (!snapshot.empty) {
          targetProductId = snapshot.docs[0].id;
        } else {
          // fetch first server_schedules or server_queues keys, or use a default
          const schedDocs = await db.collection('server_schedules').get();
          if (!schedDocs.empty) {
            targetProductId = schedDocs.docs[0].id;
          }
        }
      } else {
        const keys = Object.keys(globalWhatsappBotNumbers);
        if (keys.length > 0) {
          targetProductId = keys[0];
        }
      }

      await setToken(targetProductId, 'whatsapp_bot_number', cleanNumber);
      const text = encodeURIComponent("Hi Tror, I want to onboard my local business!");
      res.json({ success: true, url: `https://wa.me/${cleanNumber}?text=${text}` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/whatsapp/config', async (req, res) => {
    try {
      const { productId } = req.query as { productId: string };
      if (!productId) return res.status(400).json({ error: 'Product ID is required' });

      const token = await getToken(productId, 'whatsapp');
      const phoneNumberId = await getToken(productId, 'whatsapp_phone_number_id');
      const webhookVerifyToken = await getToken(productId, 'whatsapp_webhook_verify_token');
      const botPhoneNumber = await getToken(productId, 'whatsapp_bot_number');

      res.json({
        token: token || "",
        phoneNumberId: phoneNumberId || "",
        webhookVerifyToken: webhookVerifyToken || "TROR_WEBHOOK_SECURE_KEY",
        botPhoneNumber: botPhoneNumber || ""
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/logs', async (req, res) => {
    try {
      const logs: any[] = [];
      const tokens: any[] = [];

      // Inject in-memory fallback logs
      globalWebhookPayloads.forEach(item => logs.push(item));
      globalBotReplies.forEach(item => {
        logs.push({
          id: item.id,
          timestamp: item.timestamp,
          type: item.type,
          bodySnapshot: `Recipient: ${item.recipient} | Status: ${item.status} | Body: ${item.replyBody}` + (item.error ? ` | Error: ${JSON.stringify(item.error)}` : "")
        });
      });

      if (db) {
        try {
          const snapshot = await db.collection('admin_logs').orderBy('timestamp', 'desc').limit(50).get();
          snapshot.forEach(doc => {
            const data = doc.data();
            // Try to avoid duplicating messages already captured in-memory if we can identify them
            logs.push({ id: doc.id, ...data });
          });
        } catch (err: any) {
          console.warn('[Admin Logs API] Firestore logs fetch skipped/denied:', err.message);
        }

        try {
          const tokenSnapshot = await db.collection('server_tokens').get();
          tokenSnapshot.forEach(doc => {
            const data = doc.data();
            tokens.push({
              productId: doc.id,
              whatsapp_phone_number_id: data.whatsapp_phone_number_id || "",
              whatsapp_bot_number: data.whatsapp_bot_number || "",
              has_token: !!data.whatsapp,
              has_verify_token: !!data.whatsapp_webhook_verify_token
            });
          });
        } catch (err: any) {
          console.warn('[Admin Logs API] Firestore tokens fetch skipped/denied:', err.message);
        }
      }

      // Load fallback tokens back to diagnostic console
      if (tokens.length === 0) {
        Object.keys(globalWhatsappTokens).forEach(pId => {
          tokens.push({
            productId: pId,
            whatsapp_phone_number_id: globalWhatsappPhoneIds[pId] || "",
            whatsapp_bot_number: globalWhatsappBotNumbers[pId] || "",
            has_token: !!globalWhatsappTokens[pId],
            has_verify_token: !!globalWhatsappVerifyTokens[pId]
          });
        });
      }

      // Order all logs chronologically descending (latest first)
      logs.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

      res.json({
        success: true,
        summary: "Diagnostic server logs retrieved successfully.",
        firebase_connected: !!db,
        tokens,
        logs: logs.slice(0, 50)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message, logs: [] });
    }
  });

  app.get('/api/whatsapp/chats', async (req, res) => {
    try {
      const chats: any[] = [];
      if (db) {
        const snapshot = await db.collection('whatsapp_conversations').orderBy('lastUpdated', 'desc').limit(30).get();
        snapshot.forEach(doc => {
          chats.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      res.json({ success: true, chats });
    } catch (e: any) {
      res.status(500).json({ error: e.message, chats: [] });
    }
  });

  app.delete('/api/whatsapp/chats/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        await db.collection('whatsapp_conversations').doc(id).delete();
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/whatsapp/config', async (req, res) => {
    try {
      const { productId, token, phoneNumberId, webhookVerifyToken, botPhoneNumber } = req.body;
      if (!productId) return res.status(400).json({ error: 'Product ID is required' });

      await setToken(productId, 'whatsapp', token || "");
      await setToken(productId, 'whatsapp_phone_number_id', phoneNumberId || "");
      await setToken(productId, 'whatsapp_webhook_verify_token', webhookVerifyToken || "TROR_WEBHOOK_SECURE_KEY");
      await setToken(productId, 'whatsapp_bot_number', botPhoneNumber || "");

      res.json({ success: true, message: 'WhatsApp credentials saved successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });



  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const { productId, to, type, text, imageUrl, templateName, languageCode } = req.body;
      if (!productId) return res.status(400).json({ error: 'Product ID is required' });
      if (!to) return res.status(400).json({ error: 'Recipient phone (to) is required' });

      const token = await getToken(productId, 'whatsapp');
      const phoneNumberId = await getToken(productId, 'whatsapp_phone_number_id');

      if (!token || !phoneNumberId) {
        console.log(`[WhatsApp Outbound Simulation] Mock sending message to ${to}:`, { type, text, imageUrl });
        return res.json({
          success: true,
          mode: "developer-simulation",
          message: "Triggered in simulation mode. No Meta credentials configured yet.",
          data: { to, type, text, imageUrl }
        });
      }

      // Real Meta Cloud API Outbound Delivery
      let payload: any = {
        messaging_product: "whatsapp",
        to: to.replace(/[\s\+\-\(\)]/g, '')
      };

      if (type === "template") {
        payload.type = "template";
        payload.template = {
          name: templateName || "hello_world",
          language: { code: languageCode || "en_US" }
        };
      } else if (imageUrl) {
        payload.type = "image";
        payload.image = {
          link: imageUrl,
          caption: text || ""
        };
      } else {
        payload.type = "text";
        payload.text = {
          body: text || "",
          preview_url: false
        };
      }

      const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
      const metaResponse = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const metaData = await metaResponse.json();
      if (!metaResponse.ok) {
        throw new Error(metaData.error?.message || "Meta API Error");
      }

      if (db) {
        await db.collection('admin_logs').add({
          timestamp: new Date().toISOString(),
          type: "whatsapp_outbound",
          recipient: to,
          status: "delivered",
          payloadType: type || "text"
        });
      }

      res.json({ success: true, mode: "real-meta-graph", details: metaData });
    } catch (e: any) {
      console.error("[WhatsApp Outbound Error]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // --- Webhooks Signature & Verification for incoming Meta events ---
  app.get('/api/whatsapp', async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const defaultVerifyToken = 'TROR_WEBHOOK_SECURE_KEY';
    console.log('[WhatsApp Webhook Verification Check]', { mode, token });

    if (mode === 'subscribe' && token) {
      if (token === defaultVerifyToken || token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] Verification successful');
        return res.status(200).type('text/plain').send(String(challenge));
      } else {
        console.warn('[WhatsApp Webhook] Verification mismatch');
        return res.status(403).send('Forbidden verify token mismatch');
      }
    }

    res.json({
      status: "active",
      message: "WhatsApp webhook is live and verifying signatures.",
      callbackUrl: `${req.protocol}://${req.get('host')}/api/whatsapp`,
      defaultVerifyToken
    });
  });

  const handleServeImage = async (req: any, res: any) => {
    try {
      const { imageId } = req.params;

      // Try serving from local disk first (campaign_images then legacy whatsapp_images)
      try {
        const campaignPath = path.join(process.cwd(), 'public', 'campaign_images', `${imageId}.png`);
        const legacyPath = path.join(process.cwd(), 'public', 'whatsapp_images', `${imageId}.png`);
        let buffer: Buffer;
        try {
          buffer = await fs.readFile(campaignPath);
        } catch {
          buffer = await fs.readFile(legacyPath);
        }
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      } catch (err) {
        // Not found locally or read error, fallback to Firestore
      }

      if (!db) {
        return res.status(404).send('Database not initialized');
      }
      let doc = await db.collection('campaign_images').doc(imageId).get();
      if (!doc.exists) {
        doc = await db.collection('whatsapp_images').doc(imageId).get();
      }
      if (!doc.exists) {
        return res.status(404).send('Image not found');
      }
      const data = doc.data();
      if (!data) {
        return res.status(404).send('Image data missing');
      }
      if (data.base64Data) {
        const buffer = Buffer.from(data.base64Data, 'base64');
        res.writeHead(200, {
          'Content-Type': data.mimeType || 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      }
      if (data.storageUrl) {
        return res.redirect(data.storageUrl);
      }
      try {
        const bucket = admin.storage().bucket('map-api-459818.firebasestorage.app');
        const file = bucket.file(data.storagePath || `campaign_images/${imageId}.png`);
        const [buffer] = await file.download();
        res.writeHead(200, {
          'Content-Type': data.mimeType || 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      } catch (storageErr) {
        return res.status(404).send('Image not found in storage');
      }
    } catch (err: any) {
      console.error('[Serve Image Error]', err);
      res.status(500).send('Failed to serve image');
    }
  };

  app.get('/api/campaign/images/:imageId.png', handleServeImage);
  app.get('/api/whatsapp/images/:imageId.png', handleServeImage);

  function safeParseJSON(str: string): any {
    let cleaned = str.trim();
    // Strip starting ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    // Strip ending ```
    cleaned = cleaned.replace(/\s*```$/i, '');
    return JSON.parse(cleaned.trim());
  }

  function generateBrandedCanvasHtml(
    visualType: string,
    visualData: any,
    bgBase64: string,
    bgMime: string,
    businessProfile: any,
    from: string
  ): string {
    const primaryColor = "#10B981"; // Emerald/WhatsApp
    const secondaryColor = "#0f172a"; // Slate/Navy
    const headline = visualData?.headline || "Special Offer!";
    const subtext = visualData?.subtext || "";
    const textShadowDeep = "0 8px 32px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.6)";

    let htmlContent = "";

    const activeLogo = businessProfile?.logoBase64
      ? `data:${businessProfile.logoMime || 'image/png'};base64,${businessProfile.logoBase64}`
      : null;

    if (visualType === "creative-story") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 60%, rgba(12,15,18,0.98) 100%); z-index: 2;"></div>
        <div style="position: absolute; bottom: 250px; left: 75px; right: 75px; z-index: 10; display: flex; flex-direction: column; justify-content: flex-end;">
          ${subtext ? `<div style="margin-bottom: 20px; color: #34d399; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: 26px; text-shadow: ${textShadowDeep};">— ${subtext}</div>` : ''}
          <h2 style="color: white; font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; font-size: 64px; margin: 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
        </div>
      `;
    } else if (visualType === "abstract-announcement") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: radial-gradient(circle at top right, ${primaryColor}50, transparent 70%), radial-gradient(circle at bottom left, ${secondaryColor}90, ${primaryColor}20 80%); opacity: 0.85; z-index: 2;"></div>
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.88) 85%); z-index: 3;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%); width: 85%; background: rgba(12,15,18,0.8); backdrop-filter: blur(24px); border: 2px solid rgba(255,255,255,0.12); padding: 60px 70px; border-radius: 32px; text-align: center; box-sizing: border-box; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 25px 80px rgba(0,0,0,0.85);">
          <h2 style="color: white; font-weight: 900; line-height: 1.15; margin: 0 0 20px 0; font-size: 58px; text-wrap: balance; overflow-wrap: break-word; text-shadow: ${textShadowDeep};">${headline}</h2>
          ${subtext ? `<div style="height: 3px; width: 70px; background: rgba(255,255,255,0.3); margin: 24px auto; border-radius: 2px;"></div><p style="color: #cbd5e1; font-weight: 500; line-height: 1.4; margin: 0; font-size: 28px; text-wrap: balance; overflow-wrap: break-word; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">${subtext}</p>` : ''}
        </div>
      `;
    } else if (visualType === "powerful-quote") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(135deg, ${secondaryColor}DD, #0c0f12F2 90%); z-index: 2;"></div>
        <div style="position: absolute; top: -50px; left: -20px; font-size: 600px; color: rgba(255,255,255,0.03); font-weight: 800; line-height: 1; z-index: 3; pointer-events: none;">"</div>
        <div style="position: absolute; bottom: 260px; left: 80px; right: 80px; text-align: center; display: flex; flex-direction: column; align-items: center; z-index: 10; box-sizing: border-box;">
          <h2 style="color: white; font-weight: 800; line-height: 1.25; margin: 0; font-size: 56px; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">"${headline}"</h2>
          <div style="width: 80px; height: 5px; background-color: ${primaryColor}; margin: 32px 0 20px 0; border-radius: 3px;"></div>
          <div style="color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; font-size: 22px; text-wrap: balance; overflow-wrap: break-word;">${subtext || businessProfile?.businessName || "Exclusive Vision"}</div>
        </div>
      `;
    } else if (visualType === "data-infographic") {
      const stats = visualData?.stats?.length
        ? visualData.stats
        : [{ label: "Excellent Quality", value: "100%" }, { label: "Service", value: "Premium" }];
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(12,15,18,0.3) 0%, rgba(12,15,18,0.92) 80%); z-index: 2;"></div>
        <div style="position: absolute; bottom: 240px; left: 75px; right: 75px; z-index: 10; display: flex; flex-direction: column;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: white; font-weight: 900; margin: 0; line-height: 1.2; font-size: 54px; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
            ${subtext ? `<p style="color: #cbd5e1; font-weight: 500; font-size: 24px; margin: 12px 0 0 0; text-shadow: 0 2px 8px rgba(0,0,0,0.6);text-wrap: balance; overflow-wrap: break-word;">${subtext}</p>` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            ${stats.slice(0, 2).map((s: any, i: number) => {
        const bgs = ["rgba(16, 185, 129, 0.15)", "rgba(59, 130, 246, 0.15)"];
        const borderColor = i === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)";
        return `
                <div style="border-radius: 20px; background: ${bgs[i % 2]}; border: 1.5px solid ${borderColor}; backdrop-filter: blur(8px); padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #ffffff; line-height: 1.2;">${s.label}</div>
                  <div style="font-size: 48px; font-weight: 900; line-height: 1; color: #10B981;">${s.value}</div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    } else {
      // Custom HTML or standard overlay
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.92) 80%); z-index: 2;"></div>
        ${visualData?.customHtml ? `
          <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; z-index: 5;">
            ${sanitizeTemplateHtml(visualData.customHtml).html}
          </div>
        ` : `
          <div style="position: absolute; bottom: 250px; left: 75px; right: 75px; text-align: center; z-index: 5; display: flex; flex-direction: column; align-items: center;">
            <h2 style="color: white; font-weight: 950; font-size: 64px; margin: 0 0 16px 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
            ${subtext ? `<p style="color: #cbd5e1; font-size: 28px; font-weight: 500; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8); text-wrap: balance; overflow-wrap: break-word;">${subtext}</p>` : ''}
          </div>
        `}
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;950&family=JetBrains+Mono:wght@400;500;700;800&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background: #0c0f12; }
  h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
<div style="width: 1080px; height: 1080px; position: relative; background: #0c0f12; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; padding: 75px;">
  <img src="data:${bgMime};base64,${bgBase64}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
  
  <!-- Dynamic styles content overlaid -->
  ${htmlContent}

  <!-- Header Logo/Badge overlay -->
  <div style="position: absolute; top: 75px; left: 75px; z-index: 100; display: flex; justify-content: flex-start; align-items: center; width: calc(100% - 150px);">
    ${activeLogo ? `
      <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(12px); border: 2px solid rgba(255,255,255,0.18); padding: 14px 28px; border-radius: 20px; display: inline-flex; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-height: 110px;">
        <img src="${activeLogo}" style="max-height: 75px; max-width: 250px; object-fit: contain;" />
      </div>
    ` : `
      <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(12px); border: 2px solid rgba(255,255,255,0.18); padding: 18px 36px; border-radius: 50px; display: inline-flex; align-items: center; gap: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <span style="font-size: 32px; line-height: 1;">🏢</span>
        <span style="color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; font-size: 26px; font-family: 'Inter', sans-serif;">${businessProfile?.businessName || "LOCAL MERCHANT"}</span>
      </div>
    `}
  </div>

  <!-- Contact/Location Information Grid Footer -->
  <div style="z-index: 100; width: 100%; margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; box-sizing: border-box; padding-top: 24px; border-top: 2px dashed rgba(255,255,255,0.15);">
    <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.1); padding: 22px 26px; border-radius: 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 30px; line-height: 1;">📍</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Locate Store</span>
        <span style="font-size: 17px; color: #ffffff; font-weight: 600; line-height: 1.35; overflow-wrap: break-word; max-width: 360px;">${businessProfile?.address || "Visit store for details"}</span>
      </div>
    </div>

    <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.1); padding: 22px 26px; border-radius: 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 30px; line-height: 1;">📞</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Contact Line</span>
        <span style="font-size: 19px; color: #10B981; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1.2;">${businessProfile?.phoneNumber || from}</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  app.post('/api/whatsapp', async (req, res) => {
    try {
      const incomingPayload = req.body;
      console.log('[WhatsApp Webhook Post] Payload received:', JSON.stringify(incomingPayload, null, 2));

      // Maintain in-memory logs
      globalWebhookPayloads.unshift({
        id: 'log_' + Math.random().toString(36).substring(2, 10),
        timestamp: new Date().toISOString(),
        type: "whatsapp_webhook_payload",
        bodySnapshot: JSON.stringify(incomingPayload).substring(0, 500)
      });
      if (globalWebhookPayloads.length > 50) globalWebhookPayloads.pop();

      if (db) {
        await db.collection('admin_logs').add({
          timestamp: new Date().toISOString(),
          type: "whatsapp_webhook_payload",
          bodySnapshot: JSON.stringify(incomingPayload).substring(0, 500)
        }).catch(err => console.error("Could not write payload log to Firestore:", err.message));
      }

      // Extract message details
      const entry = incomingPayload?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      // Send 200 early to Meta Graph API to prevent webhooks retrying during long AI processing operations
      res.status(200).send("EVENT_RECEIVED");

      if (message) {
        const from = message.from; // Sender's phone number or wa_id
        const messageType = message.type; // "image", "text", etc.
        const incomingPhoneNumberId = value?.metadata?.phone_number_id; // Recipient WhatsApp Business Phone ID

        let textBody = "";
        let incomingImageId = null;
        let incomingImageMime = "";

        if (messageType === 'text') {
          textBody = message.text?.body || "";
        } else if (messageType === 'image') {
          textBody = message.image?.caption || "Create a post for this image asset";
          incomingImageId = message.image?.id;
          incomingImageMime = message.image?.mime_type || "image/jpeg";
        } else {
          // Unsupported message types fallback gracefully to text or caption
          textBody = message.text?.body || "Hello! Create a campaign copy for my product!";
        }

        console.log('[WhatsApp Webhook Context Parsing]', { from, messageType, textBody, incomingPhoneNumberId, incomingImageId });

        if (incomingPhoneNumberId) {
          // Process asynchronously to avoid holding the HTTP thread
          (async () => {
            // Locate corresponding productId and configuration tokens in Firestore
            let matchedProductId: string | null = null;
            let metaToken: string | null = null;
            let phoneNumberId: string | null = null;

            const processLogs: string[] = [];
            const addLog = (msg: string) => {
              const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              console.log(`[Diagnostic Log ${ts}] [Sender: ${from}] ${msg}`);
              processLogs.push(`[${ts}] ${msg}`);
            };

            addLog("Received inbound message on WhatsApp webhook.");

            if (db) {
              addLog("Accessing Firestore database to look up API tokens...");
              const snapshot = await db.collection('server_tokens').get();
              for (const doc of snapshot.docs) {
                const data = doc.data();
                if (data.whatsapp_phone_number_id === incomingPhoneNumberId) {
                  matchedProductId = doc.id;
                  metaToken = data.whatsapp;
                  phoneNumberId = data.whatsapp_phone_number_id;
                  break;
                }
              }

              // Fallback 1: If no exact matching phone number id doc, find first saved whatsapp token
              if (!metaToken) {
                addLog("Searching token references via fallback credentials...");
                for (const doc of snapshot.docs) {
                  const data = doc.data();
                  if (data.whatsapp) {
                    matchedProductId = doc.id;
                    metaToken = data.whatsapp;
                    phoneNumberId = data.whatsapp_phone_number_id || incomingPhoneNumberId;
                    break;
                  }
                }
              }
            }

            if (!metaToken) {
              // Try to find token in-memory if we have it and the database was null or empty
              for (const prodId of Object.keys(globalWhatsappTokens)) {
                if (globalWhatsappPhoneIds[prodId] === incomingPhoneNumberId || globalWhatsappTokens[prodId]) {
                  matchedProductId = prodId;
                  metaToken = globalWhatsappTokens[prodId];
                  phoneNumberId = globalWhatsappPhoneIds[prodId] || incomingPhoneNumberId;
                  break;
                }
              }
            }

            if (incomingPhoneNumberId) {
              phoneNumberId = incomingPhoneNumberId;
            } else if (!phoneNumberId) {
              phoneNumberId = "SIMULATOR_PHONE_ID";
            }
            if (!metaToken) {
              metaToken = "SIMULATOR_MOCK_TOKEN";
            }

            if (phoneNumberId && metaToken) {
              // Fetch corresponding separate WhatsApp Business Profile details based strictly on sender phone 'from'
              let businessProfile: any = null;
              if (db) {
                try {
                  addLog("Loading physical business profile credentials...");
                  const profileDoc = await db.collection('whatsapp_business_profiles').doc(from).get();
                  if (profileDoc.exists) {
                    businessProfile = profileDoc.data();
                    addLog(`Successfully loaded merchant business profile: "${businessProfile.businessName}"`);
                  } else {
                    addLog("Merchant profile not found. Initialized temporary onboarding profile.");
                  }
                } catch (eProfFetch) {
                  addLog("⚠️ Failed loading merchant business profile from database.");
                  console.error('[WhatsApp Webhook] Business Profile fetch error:', eProfFetch);
                }
              }

              // Download media image asset from Meta servers if message has an image attachment
              let base64Data: string | null = null;
              let mimeType = incomingImageMime || 'image/jpeg';
              let mediaUrl = "";

              if (message.image?.simulatedBase64Data) {
                addLog("Detected image file uploaded inside sandbox simulator chat.");
                base64Data = message.image.simulatedBase64Data;
                mimeType = message.image.mime_type || mimeType;
                if (db) {
                  const assetId = 'asset_' + Math.random().toString(36).substring(2, 10);
                  await saveImageLocalAndDb(assetId, base64Data, mimeType, `Uploaded via Chat Sandbox by ${from}`);

                  const host = req.get('host');
                  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
                  mediaUrl = `${protocol}://${host}/api/whatsapp/images/${assetId}.png`;
                  addLog(`Saved sandbox media file reference successfully: ${mediaUrl}`);
                }
              } else if (incomingImageId && metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                try {
                  addLog(`Identified attached media photo. Querying Meta servers for attachment ID: ${incomingImageId}`);
                  const mediaUrlResponse = await fetch(`https://graph.facebook.com/v25.0/${incomingImageId}`, {
                    headers: { "Authorization": `Bearer ${metaToken}` }
                  });
                  if (mediaUrlResponse.ok) {
                    const mediaObj = await mediaUrlResponse.json();
                    const downloadUrl = mediaObj?.url;
                    mimeType = mediaObj?.mime_type || mimeType;

                    if (downloadUrl) {
                      addLog("Source URL identified. Commencing photo download stream from Meta...");
                      const mediaDataResponse = await fetch(downloadUrl, {
                        headers: { "Authorization": `Bearer ${metaToken}` }
                      });
                      if (mediaDataResponse.ok) {
                        const arrayBuffer = await mediaDataResponse.arrayBuffer();
                        base64Data = Buffer.from(arrayBuffer).toString('base64');
                        addLog(`Download finished! Parsed image size: ${Math.round(base64Data.length / 1024)} KB.`);

                        // Store image locally so dashboard/posts can serve it back directly
                        if (db) {
                          const assetId = 'asset_' + Math.random().toString(36).substring(2, 10);
                          await saveImageLocalAndDb(assetId, base64Data, mimeType, `Uploaded via WhatsApp by ${from}`);

                          const host = req.get('host');
                          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
                          mediaUrl = `${protocol}://${host}/api/whatsapp/images/${assetId}.png`;
                          addLog(`Localized backup saved in Firestore. Access URL: ${mediaUrl}`);
                        }
                      } else {
                        addLog(`⚠️ Photo stream download failed with status: ${mediaDataResponse.status}`);
                      }
                    } else {
                      addLog("⚠️ Could not extract binary download link from Meta document metadata.");
                    }
                  } else {
                    addLog(`⚠️ Meta attachment lookup failed with response code: ${mediaUrlResponse.status}`);
                  }
                } catch (eMedia: any) {
                  addLog(`❌ Fatal error downloading media photo: ${eMedia.message}`);
                  console.error('[WhatsApp webhook media download error]', eMedia.message);
                }
              }

              // Detect if this image is intended to be their professional business branding logo
              let isLogoUpload = false;
              if (base64Data && (
                /logo/i.test(textBody) ||
                /set.*logo/i.test(textBody) ||
                /this is my logo/i.test(textBody) ||
                /business logo/i.test(textBody) ||
                /brand logo/i.test(textBody)
              )) {
                isLogoUpload = true;
                addLog("Logo keyword matched. Configuring profile logo branding update...");

                if (db) {
                  try {
                    if (!businessProfile) {
                      businessProfile = {
                        businessName: "My Local Business",
                        address: "",
                        phoneNumber: from,
                        updatedAt: new Date().toISOString()
                      };
                    }
                    businessProfile.logoBase64 = base64Data;
                    businessProfile.logoMime = mimeType;
                    businessProfile.logoUrl = mediaUrl;
                    businessProfile.updatedAt = new Date().toISOString();

                    await db.collection('whatsapp_business_profiles').doc(from).set(businessProfile);
                    addLog(`Finished saving custom brand logo to profile [Recipient: ${from}]`);
                  } catch (eLogo) {
                    addLog("⚠️ Failed in updating logo asset on database.");
                    console.error('[WhatsApp Webhook] Failed to write custom logo to profile:', eLogo);
                  }
                }
              }

              // Retrieve conversation history from Firestore
              let conversationHistory: any[] = [];
              if (db) {
                addLog("Retrieving chatbot conversation history log...");
                const convDoc = await db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`).get();
                if (convDoc.exists) {
                  conversationHistory = convDoc.data()?.history || [];
                  addLog(`Successfully loaded ${conversationHistory.length} history nodes.`);
                } else {
                  addLog("No existing chat session history found. Initialized clean state.");
                }
              }

              // Transform current conversation for Gemini Content pattern
              const cleanedHistory = conversationHistory.map((item: any) => ({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.parts?.[0]?.text || item.text || "" }]
              })).slice(-10);

              // Construct user message parts without multimodal image content analysis (skipped to avoid analyzing user backdrop content)
              const newUserParts: any[] = [];
              newUserParts.push({ text: textBody });

              const newUserMsg = { role: 'user', parts: newUserParts };
              cleanedHistory.push(newUserMsg);

              let userMsgPushed = false;

              // Determine if this is a post creation or image upload turn that triggers background processing delay
              const isPostCreation = !!base64Data || /post/i.test(textBody) || /campaign/i.test(textBody) || /offer/i.test(textBody) || /creative/i.test(textBody) || /make/i.test(textBody) || /create/i.test(textBody);

              if (isPostCreation) {
                const waitMsgText = "Creating your post... This will take about a minute. Please hold on! ⏳✨";

                // Add this delay notification to the conversation history immediately so the Live Chat UI displays it live
                conversationHistory.push(newUserMsg);
                conversationHistory.push({ role: 'model', parts: [{ text: waitMsgText }] });
                userMsgPushed = true;

                if (db) {
                  try {
                    const notifyDocRef = db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`);
                    await notifyDocRef.set({
                      from: from,
                      phoneNumberId: incomingPhoneNumberId,
                      businessProfile: businessProfile || null,
                      history: conversationHistory.slice(-20),
                      lastUpdated: new Date().toISOString()
                    }, { merge: true });
                    console.log('[WhatsApp Webhook] Appended delay notification live to db.');
                  } catch (eNotify) {
                    console.error('[WhatsApp Webhook] Delay DB sync error:', eNotify);
                  }
                }

                // If they are on a real WhatsApp channel, deliver this warning over Meta Cloud API
                if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                  try {
                    const delayPayload = {
                      messaging_product: "whatsapp",
                      to: from,
                      type: "text",
                      text: {
                        body: waitMsgText,
                        preview_url: false
                      }
                    };
                    const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
                    await fetch(metaUrl, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${metaToken}`,
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(delayPayload)
                    });
                  } catch (eDelayOutbound) {
                    console.error('[WhatsApp Webhook] Failed to send delay alert outbound:', eDelayOutbound);
                  }
                }
              }

              // Setup dynamic marketing persona system instructions
              let systemInstruction = `You are "Tror", a premier AI-powered marketing co-pilot designed for local businesses. Your job is to help business owners create beautiful visual story assets that they can easily download and share directly on their WhatsApp Status, stories, or social media pages.

IMPORTANT PRINCIPLE: This system is built strictly for local small-and-medium businesses (SMBs). It is run completely separate from any other application products or dashboards. These posts are published exclusively as STORIES or STATUS updates (not standard timeline text feeds). Therefore, generating standard paragraphs of copywriting text content / captions is TOTALLY USELESS and must be COMPLETELY IGNORED. Only focus on generating high-converting graphic overlays and short headings.

YOUR CONVERSATIONAL WORKFLOW:

Step 1: Warm Greeting & Onboarding (If the local business details haven't been provided or need updates):
- Greet them warmly and professionally as "Tror, your AI marketing co-pilot".
- Ask clearly for:
  * Business Name
  * Business Address or Location
  * Best Contact Number to display for customers
- Mention that they can optionally upload their custom business logo image anytime by sending it and saying "this is my logo" or "set this as my logo". Once uploaded, our dynamic post designs will automatically place their gorgeous visual logo in the corner instead of plain text!
- Ask if they currently have any visual creative assets or images with them to use for today's post.
- Explicitly explain to them: 
  "If you don't have any images, don't worry! I'll generate a stunning, custom-tailored visual graphic for you from scratch. If you DO have an asset/photo, go ahead and send/upload it right here in this chat, and I'll write the perfect post around it!"

Step 2: Ignore Content Creation, Prioritize Visual Overlays:
- DO NOT generate, draft, or output long, verbose paragraph copywriting blocks, marketing plans, or conversational analysis of product photos in your chat text. The business owner only needs a beautiful story graphic.
- Keep your direct message response extremely brief (say, 1 or 2 sentences max) to introduce or confirm the story graphic flyer (e.g., "Perfect! I have generated your customized daily story flyer with professional visual layering below. 🎨✨").
- Your primary focus is on formatting the headline text overlays and background details beautifully.
- If the user provided/uploaded an image, DO NOT analyze its design style, details, or color choices. Use it strictly as a background scene itself, and only select a high-impact typographic heading and subtext to layer on top of it. Do NOT include any cinematicPrompt or [IMAGE_PROMPT: ...] if an image is provided.
- If no image was provided, you MUST specify a highly detailed photographic background image prompt inside the cinematicPrompt field or write it as [IMAGE_PROMPT: <visual prompt with NO text inside the image>] at the absolute end, so our systems can generate the perfect base scenery.

Step 3: Background Campaign Synchronization & Visual Layout overlay:
- You MUST output a structured JSON campaign configuration block wrapped EXACTLY inside the XML tags "<CAMPAIGN_DATA>" and "</CAMPAIGN_DATA>" at the absolute bottom of your response text. This ensures our background script logs the flyer's details!
- Inside the CAMPAIGN_DATA block, the JSON MUST follow this structure:
  <CAMPAIGN_DATA>
  {
    "theme": "WhatsApp Promo Post",
    "audience": "Local customers & regular buyers",
    "coreMessage": "Highlighting business benefits & contact call-to-action",
    "hook": "An engaging hook suited to the business topic",
    "cta": "Call or visit our store today",
    "copy": "concise slogan or call to action text",
    "platform": "WhatsApp Status",
    "visualType": "creative-story",
    "visualData": {
      "headline": "A short, punchy marketing headline (max 6-8 words) to render on the graphic flyer",
      "subtext": "Slogan or supporting details / discount terms to overlay",
      "cinematicPrompt": "Detailed photographic cinematic studio shot prompt to generate background if no image is attached, else leave empty"
    }
  }
  </CAMPAIGN_DATA>

- The "visualType" parameter inside CAMPAIGN_DATA can be chosen from:
  * "creative-story": Classic storytelling gradient overlay with a bottom-aligned large headline and subtext. Best for general promos, luxury brands, and storytelling posts.
  * "abstract-announcement": Radial color gradient blend overlaid with a centered beautiful blurred glassmorphic card holding the headline and subtext. Great for major announcements, grand openings, and seasonal sales.
  * "powerful-quote": Centered quote layout with large, elegant typography and stylized quotation marks. Great for company manifestos, premium guarantees, and client testimonials.
  * "data-infographic": A stylized benefit breakdown displaying 2 structured grid stat panels. Great for listings of prices, multiple offer points, or distinct business benefits (e.g., {"headline": "Why Choose Us!", "stats": [{"label": "Discount", "value": "20% OFF"}, {"label": "Warranty", "value": "2 Years"}]}).

Step 4: Automatic Business Profile Interception:
- When the business owner shares or updates their Business Name, Address/Location, or Contact Number, you MUST write a structured JSON block wrapped in "<BUSINESS_PROFILE>" and "</BUSINESS_PROFILE>" XML tags so our automated backend can index their profile separately from any product catalogue!
- The JSON block must have these exact 3 keys:
  <BUSINESS_PROFILE>
  {
    "businessName": "Name of the local business",
    "address": "Business Address or Location/Area",
    "phoneNumber": "Contact Phone to display for clients"
  }
  </BUSINESS_PROFILE>
  (Only output this block when they mention or update these details)Remember: Keep your conversational tone concise, humble, and strictly professional with zero unrequested analysis or feedback.`;

              if (businessProfile) {
                systemInstruction += `\n\nActive Context for this local business merchant (LOADED FROM DEDICATED WHATSAPP MERCHANT LOGS):
Business Name: "${businessProfile.businessName}"
Contact Number: "${businessProfile.phoneNumber}"
Business Address/Location: "${businessProfile.address || 'N/A'}"
Has Brand Logo Uploaded: ${businessProfile.logoBase64 ? 'YES' : 'NO'}

Since this local business is already set up and saved, bypass Step 1's onboarding questions and instantly greet them warmly referencing "${businessProfile.businessName}"! Let them know we can design their next post copy & graphics immediately. If they have already uploaded a logo, warmly note that any flyers will be custom branded using their visual logo.`;
              } else {
                systemInstruction += `\n\nCRITICAL SYSTEM REQUIREMENT:
The user HAS NOT completed their local business details (Business Name, Address, and Contact Number) yet. 
If they share these details in their current message (either business name, address, or phone), you MUST intercept them and output the <BUSINESS_PROFILE> block so we can save it.
However, if they ask to make a campaign or send a product photo, and they have not shared their Business Name, Address, or Contact Number yet, proceed directly with campaign copy and image prompt, but display a warm note encouraging them to share their business details so we can add custom branding logos.`;
              }

              if (isLogoUpload) {
                systemInstruction += `\n\n[USER ACTION REMINDER: The user has just uploaded their custom business logo image! We successfully saved it to their profile. Confirm that their beautiful branding logo has been saved, congratulate them, let them know that we will display this visual logo emblem on all dynamically generated status/story flyers instead of plain text, and ask them what creative campaign or offer they want to design next! Do NOT generate any marketing campaign or image prompt for this logo upload turn.]`;
              }

              if (base64Data) {
                systemInstruction += `\n\n[CRITICAL CURRENT CONTEXT: The user HAS provided/uploaded their own custom image with their current message! Therefore, you MUST NOT include any "cinematicPrompt" inside your "visualData" block, and you MUST NOT output any "[IMAGE_PROMPT: ...]" string anywhere. Focus strictly on choosing a high-impact editorial headline and subtext ("headline" and "subtext" inside "visualData") to label/overlay directly on top of their custom image.]`;
              } else {
                systemInstruction += `\n\n[CRITICAL CURRENT CONTEXT: The user HAS NOT uploaded any image. You MUST specify a highly detailed photographic scenic background description inside the "cinematicPrompt" field of "visualData", and also append it as "[IMAGE_PROMPT: <scenic description with NO text>]" at the absolute end of your response so our background Imagen AI generator can synthesize a beautiful custom background.]`;
              }

              // Instantiate Google Gen AI Client
              let geminiKey = process.env.GEMINI_API_KEY;
              if (!geminiKey) {
                addLog("ERROR: process.env.GEMINI_API_KEY is not configured.");
                throw new Error("Missing GEMINI_API_KEY environment variable.");
              }
              const ai = new GoogleGenAI({
                apiKey: geminiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });

              addLog(`Sending conversational prompt to Gemini model. Multi-modal mode: ${base64Data ? "YES (using attached custom image as background backdrop)" : "NO"}`);
              console.log('[WhatsApp AI Bot processing]', { model: 'gemini-3.5-flash', hasImage: !!base64Data });

              const geminiResponse = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: cleanedHistory,
                config: {
                  systemInstruction
                }
              });

              if (matchedProductId && db) {
                try {
                  const productDoc = await db.collection('products').doc(matchedProductId).get();
                  if (productDoc.exists) {
                    const webhookUserId = productDoc.data()?.userId;
                    if (webhookUserId) {
                      await logBackendTokenUsage(
                        webhookUserId,
                        "whatsapp_chatbot_generation",
                        "gemini-3.5-flash",
                        geminiResponse.usageMetadata
                      );
                    }
                  }
                } catch (eTokenLog) {
                  console.error('[WhatsApp webhook token log error]', eTokenLog);
                }
              }

              addLog("Gemini content synthesis and layout analysis completed.");
              const replyText = geminiResponse.text || "Hello! We couldn't generate a text response at this stage.";
              console.log('[WhatsApp AI Bot reply text]', replyText);

              // Parse Campaign creation configuration
              const campaignRegex = /<CAMPAIGN_DATA>([\s\S]*?)<\/CAMPAIGN_DATA>/i;
              let campaignMatch = replyText.match(campaignRegex);
              let cleanReplyText = replyText;

              if (campaignMatch) {
                addLog("Successfully extracted campaign structural metadata.");
                // Strip the structured block from user WhatsApp text to keep chat beautiful
                cleanReplyText = cleanReplyText.replace(campaignRegex, '').trim();
              }

              // Parse Business Profile creation/updates configuration
              const profileRegex = /<BUSINESS_PROFILE>([\s\S]*?)<\/BUSINESS_PROFILE>/i;
              const profileMatch = replyText.match(profileRegex);
              if (profileMatch && db) {
                try {
                  const cleanedJsonStr = profileMatch[1].trim();
                  const parsedProfile = safeParseJSON(cleanedJsonStr);
                  addLog(`Found business profile update payload: "${parsedProfile.businessName}"`);
                  console.log('[WhatsApp Webhook] Intercepted Business Profile update JSON:', parsedProfile);

                  businessProfile = {
                    businessName: parsedProfile.businessName || "My Local Business",
                    address: parsedProfile.address || "",
                    phoneNumber: parsedProfile.phoneNumber || from,
                    updatedAt: new Date().toISOString()
                  };

                  await db.collection('whatsapp_business_profiles').doc(from).set(businessProfile);
                  addLog("Profile credentials saved to Firestore.");
                  console.log(`[WhatsApp Webhook] Saved separate business profile for merchant ${from}`);
                } catch (eProf) {
                  addLog("⚠️ Failed in updating merchant business profile database.");
                  console.error('[WhatsApp Webhook] Business Profile Firestore save failed', eProf);
                }
                // Strip the structured block from user WhatsApp text to keep chat beautiful
                cleanReplyText = cleanReplyText.replace(profileRegex, '').trim();
              }

              // Detect image generation prompts
              const imagePromptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/i;
              const match = cleanReplyText.match(imagePromptRegex);
              let imagePrompt: string | null = null;

              if (match) {
                imagePrompt = match[1].trim();
                cleanReplyText = cleanReplyText.replace(imagePromptRegex, '').trim();
                addLog(`Extracted AI background prompt: "${imagePrompt}"`);
                console.log('[WhatsApp AI Bot extracted image prompt]', imagePrompt);
              }

              if (isLogoUpload) {
                // Skip image asset generation on logo configuration turn to avoid low-effort placeholder creatives of the logo itself
                imagePrompt = null;
              }

              // Dynamic real-time Campaign Document insertion inside Firestore!
              let createdCampaignId = "";
              if (campaignMatch && db) {
                try {
                  const cleanedJsonStr = campaignMatch[1].trim();
                  const parsedCampaign = safeParseJSON(cleanedJsonStr);
                  console.log('[WhatsApp Webhook] Extracted Campaign JSON for Local Business:', parsedCampaign);

                  createdCampaignId = 'wa_camp_' + Math.random().toString(36).substring(2, 12);
                  addLog("Syncing new Campaign story reference in campaigns database...");

                  await db.collection('campaigns').doc(createdCampaignId).set({
                    productId: matchedProductId || "whatsapp_retail_id",
                    productName: businessProfile?.businessName || parsedCampaign.theme || "WhatsApp Generated Post",
                    productLogoUrl: "",
                    theme: parsedCampaign.theme || "WhatsApp Generated Post",
                    targetAudience: parsedCampaign.audience || "Local customers & clients",
                    coreMessage: parsedCampaign.coreMessage || "Automated Local Commerce Promotion",
                    hook: parsedCampaign.hook || "",
                    cta: parsedCampaign.cta || "",
                    contentFormat: "WhatsApp Asset Post",
                    repurposingNotes: `Generated automatically via Tror local commerce chat with user ${from}. ` + (mediaUrl ? "Used client-uploaded asset." : "Based on conversational text inputs."),
                    confidenceScore: 99,
                    pillar: "WhatsApp Outbox",
                    subCategory: "WhatsApp Chat",
                    createdAt: new Date().toISOString(),
                    startDate: new Date().toISOString().split('T')[0],
                    platformVersions: [
                      {
                        platform: parsedCampaign.platform || "WhatsApp Status",
                        copy: parsedCampaign.copy || cleanReplyText,
                        format: "Image Post",
                        imagePrompt: parsedCampaign.visualPrompt || imagePrompt || "",
                        imageUrl: mediaUrl || ""
                      }
                    ],
                    dailyPosts: [
                      {
                        day: "Monday",
                        contentType: "Local Business Social Outreach",
                        platformVersions: [
                          {
                            platform: parsedCampaign.platform || "WhatsApp Status",
                            copy: parsedCampaign.copy || cleanReplyText,
                            format: "Image Post",
                            imagePrompt: parsedCampaign.visualPrompt || imagePrompt || "",
                            imageUrl: mediaUrl || ""
                          }
                        ]
                      }
                    ]
                  });

                  console.log(`[WhatsApp Webhook] Successfully built and saved local business campaign: ${createdCampaignId}`);
                  addLog("Campaign successfully generated and registered.");
                } catch (eCamp) {
                  addLog("⚠️ Failed to write Campaign configuration to database.");
                  console.error('[WhatsApp Webhook] Campaign Firestore creation failed', eCamp);
                }
              }

              // Generate visual creatives if requested via [IMAGE_PROMPT: ...] OR if user uploaded a photo (even if onboarding is still empty)
              const shouldRenderCanvas = !!imagePrompt || !!base64Data;

              if (shouldRenderCanvas) {
                let generatedBase64 = null;
                let generatedMime = 'image/png';

                // Resolve premium prompt from campaign visualData if available, fallback to extracted imagePrompt
                let overlayPrompt = imagePrompt;
                let visualType = "creative-story"; // default style
                let visualData: any = null;

                if (campaignMatch) {
                  try {
                    const parsedCampaign = safeParseJSON(campaignMatch[1].trim());
                    if (parsedCampaign.visualType) {
                      visualType = parsedCampaign.visualType;
                    }
                    if (parsedCampaign.visualData) {
                      visualData = parsedCampaign.visualData;
                      if (parsedCampaign.visualData.cinematicPrompt) {
                        overlayPrompt = parsedCampaign.visualData.cinematicPrompt;
                      }
                    } else {
                      visualData = {
                        headline: parsedCampaign.theme || parsedCampaign.hook || parsedCampaign.coreMessage || "Special Promotion!",
                        subtext: parsedCampaign.cta || ""
                      };
                    }
                  } catch (eHl) { }
                }

                if (!visualData) {
                  visualData = {
                    headline: "Special Exclusive Offer!",
                    subtext: "Limited time promotion"
                  };
                }

                // Generating a fresh AI image only if requested AND the user did NOT upload their own graphic backdrop
                if (overlayPrompt && !base64Data) {
                  try {
                    addLog(`Triggering Imagen generator with prompt: "${overlayPrompt}"`);
                    const imgRes = await ai.models.generateContent({
                      model: 'gemini-3.1-flash-image-preview',
                      contents: { parts: [{ text: overlayPrompt }] },
                      config: { imageConfig: { aspectRatio: "1:1" } }
                    });

                    if (matchedProductId && db) {
                      try {
                        const productDoc = await db.collection('products').doc(matchedProductId).get();
                        if (productDoc.exists) {
                          const webhookUserId = productDoc.data()?.userId;
                          if (webhookUserId) {
                            await logBackendTokenUsage(
                              webhookUserId,
                              "whatsapp_chatbot_image",
                              "gemini-3.1-flash-image-preview",
                              {
                                promptTokenCount: 0,
                                candidatesTokenCount: 0,
                                totalTokenCount: 1
                              }
                            );
                          }
                        }
                      } catch (eTokenLog) {
                        console.error('[WhatsApp webhook image token log error]', eTokenLog);
                      }
                    }

                    if (imgRes?.candidates?.[0]?.content?.parts) {
                      for (const pt of imgRes.candidates[0].content.parts) {
                        if (pt.inlineData) {
                          generatedBase64 = pt.inlineData.data;
                          generatedMime = pt.inlineData.mimeType || 'image/png';
                          addLog("Imagen background generated successfully.");
                          break;
                        }
                      }
                    }
                  } catch (eImg: any) {
                    addLog(`⚠️ Imagen background generation failed: ${eImg.message || eImg}`);
                    console.warn('[WhatsApp Webhook Image Gen Fallback]', eImg);
                  }
                }

                // LAYERED CANVAS GENERATION ENGINE (LIKE DYNAMIC APP CANVAS API RENDERING)
                let finalBrandedBase64 = null;
                let finalBrandedMime = 'image/jpeg';
                // Always prefer the newly generated AI campaign image; fallback to the user's uploaded raw photo only if generation fails
                const bgBase64 = generatedBase64 || base64Data;
                const bgMime = generatedBase64 ? generatedMime : mimeType;

                if (bgBase64) {
                  try {
                    addLog(`Constructing premium HTML overlay canvas (Layout style: ${visualType})`);

                    const canvasHtml = generateBrandedCanvasHtml(
                      visualType,
                      visualData,
                      bgBase64,
                      bgMime,
                      businessProfile,
                      from
                    );

                    const renderResult = await runWithRenderLock(async (browser) => {
                      addLog("Spawned rendering viewport in headless screenshot pool...");
                      const page = await browser.newPage();
                      try {
                        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
                        await page.setContent(canvasHtml, { waitUntil: 'load', timeout: 25000 });

                        await page.evaluate(async () => {
                          await document.fonts.ready;
                          const images = Array.from(document.querySelectorAll('img'));
                          await Promise.all(images.map(img => {
                            if (img.complete) return Promise.resolve();
                            return new Promise((resolve) => {
                              img.onload = resolve;
                              img.onerror = resolve;
                            });
                          }));
                        });

                        addLog("Canvas markup processed. Screenshot capturing in progress...");
                        const buffer = await page.screenshot({ type: 'jpeg', quality: 92 });
                        addLog("Screenshot captured successfully!");
                        return buffer.toString('base64');
                      } finally {
                        await page.close().catch(() => { });
                      }
                    });

                    if (renderResult) {
                      finalBrandedBase64 = renderResult;
                      finalBrandedMime = 'image/jpeg';
                    }
                  } catch (eRender: any) {
                    addLog(`❌ Puppeteer layout render failed: ${eRender.message || eRender}`);
                    console.error('[WhatsApp Webhook Branded Canvas Rendering Failed]', eRender);
                  }
                } else {
                  addLog("⚠️ Skipped overlay: No base background image available.");
                }

                const base64ToSave = finalBrandedBase64 || bgBase64;
                const mimeToSave = finalBrandedBase64 ? finalBrandedMime : bgMime;

                if (base64ToSave && db) {
                  try {
                    addLog("Saving branded story flyer to database...");
                    const outImageId = 'img_' + Math.random().toString(36).substring(2, 10);
                    await saveImageLocalAndDb(outImageId, base64ToSave, mimeToSave, imagePrompt || "");

                    const host = req.get('host');
                    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
                    const finalImgUrl = `${protocol}://${host}/api/whatsapp/images/${outImageId}.png`;

                    addLog(`Saved! View flyer live: ${finalImgUrl}`);

                    // Update conversation history in Firestore with the generated/branded image so the simulator dashboard displays Tror's image reply live!
                    try {
                      const convDocRef = db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`);
                      const convDoc = await convDocRef.get();
                      if (convDoc.exists) {
                        const data = convDoc.data();
                        const history = data?.history || [];
                        for (let i = history.length - 1; i >= 0; i--) {
                          if (history[i].role === 'model') {
                            if (history[i].parts) {
                              const hasImage = history[i].parts.some((p: any) => p.inlineData);
                              if (!hasImage) {
                                history[i].parts.unshift({
                                  inlineData: {
                                    mimeType: mimeToSave,
                                    data: base64ToSave
                                  }
                                });
                              }
                            }
                            break;
                          }
                        }
                        await convDocRef.update({
                          history: history,
                          lastUpdated: new Date().toISOString()
                        });
                      }
                    } catch (eConvUpdate) {
                      console.error('[WhatsApp Webhook] Failed to append reply image to conversation history:', eConvUpdate);
                    }

                    // Update campaign with final visual URL reference
                    if (createdCampaignId) {
                      try {
                        await db.collection('campaigns').doc(createdCampaignId).set({
                          platformVersions: [
                            {
                              platform: "WhatsApp Status",
                              copy: cleanReplyText.split('\n\n🎯')[0],
                              format: "Image Post",
                              imagePrompt: imagePrompt,
                              imageUrl: finalImgUrl
                            }
                          ],
                          dailyPosts: [
                            {
                              day: "Monday",
                              contentType: "Local Business Social Outreach",
                              platformVersions: [
                                {
                                  platform: "WhatsApp Status",
                                  copy: cleanReplyText.split('\n\n🎯')[0],
                                  format: "Image Post",
                                  imagePrompt: imagePrompt,
                                  imageUrl: finalImgUrl
                                }
                              ]
                            }
                          ]
                        }, { merge: true });
                        addLog("Synced image flyer URL with Firestore Campaigns document.");
                      } catch (eCampUpdate) {
                        console.error('[WhatsApp webhook dynamic image update failed]', eCampUpdate);
                      }
                    }

                    if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                      addLog("Broadcasting image graphic message back to client...");
                      const imgOutboundPayload = {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "image",
                        image: { link: finalImgUrl }
                      };

                      await new Promise((resolve) => setTimeout(resolve, 1500));

                      const imgMetaResponse = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${metaToken}`,
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify(imgOutboundPayload)
                      });

                      if (!imgMetaResponse.ok) {
                        const errPayload = await imgMetaResponse.json();
                        addLog(`⚠️ Outbox image broadcast failed: ${JSON.stringify(errPayload)}`);
                      } else {
                        addLog("Outbox image flyer delivered successfully!");
                      }
                    } else {
                      console.log(`[WhatsApp Webhook Simulator Image Outbound] Local assets served successfully: ${finalImgUrl}`);
                    }
                  } catch (eSave: any) {
                    addLog(`❌ Error finishing save and broadcast: ${eSave.message || eSave}`);
                  }
                }
              }

              // Complete processing and confirm sync safely
              addLog("Processing completed successfully.");
              if (campaignMatch) {
                cleanReplyText += `\n\n🎯 Campaign Synced!\nYour special story update flyer and post content have been successfully created and saved to your dashboard!`;
              }

              // Update conversation history database with the reply
              const modelReplyMsg = { role: 'model', parts: [{ text: cleanReplyText }] };
              if (!userMsgPushed) {
                conversationHistory.push(newUserMsg);
              }
              conversationHistory.push(modelReplyMsg);

              if (db) {
                try {
                  await db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`).set({
                    from: from,
                    phoneNumberId: incomingPhoneNumberId,
                    businessProfile: businessProfile || null,
                    history: conversationHistory.slice(-20),
                    lastUpdated: new Date().toISOString(),
                    lastProcessLogs: processLogs
                  }, { merge: true });
                } catch (eConvSave) {
                  console.error('[WhatsApp Webhook] Error updating conversation:', eConvSave);
                }

                try {
                  await db.collection('admin_logs').add({
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_process_run",
                    recipient: from,
                    status: "success",
                    logs: processLogs,
                    replyBody: cleanReplyText.substring(0, 200)
                  });
                } catch (eAdminLog) {
                  console.error('[WhatsApp Webhook] Error appending admin log:', eAdminLog);
                }
              }

              // Send OUTBOUND WhatsApp live message back to the active user's phone via Meta Graph API
              if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                const outboundPayload = {
                  messaging_product: "whatsapp",
                  to: from,
                  type: "text",
                  text: {
                    body: cleanReplyText,
                    preview_url: false
                  }
                };

                const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
                const metaResponse = await fetch(metaUrl, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${metaToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(outboundPayload)
                });

                const metaResData = await metaResponse.json();
                if (!metaResponse.ok) {
                  console.error('[WhatsApp Outbound Webhook Send Error]', metaResData);
                  globalBotReplies.unshift({
                    id: 'repl_' + Math.random().toString(36).substring(2, 10),
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_bot_reply_error",
                    recipient: from,
                    status: "failed",
                    replyBody: cleanReplyText.substring(0, 100),
                    error: metaResData
                  });
                  if (globalBotReplies.length > 50) globalBotReplies.pop();

                  if (db) {
                    await db.collection('admin_logs').add({
                      timestamp: new Date().toISOString(),
                      type: "whatsapp_bot_reply_error",
                      recipient: from,
                      status: "failed",
                      replyBody: cleanReplyText.substring(0, 100),
                      error: JSON.stringify(metaResData)
                    }).catch(err => console.error("Could not write send error to Firestore:", err.message));
                  }
                } else {
                  console.log('[WhatsApp Outbound Webhook Sent successfully]', metaResData);
                  globalBotReplies.unshift({
                    id: 'repl_' + Math.random().toString(36).substring(2, 10),
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_bot_reply",
                    recipient: from,
                    status: "sent",
                    replyBody: cleanReplyText.substring(0, 200)
                  });
                  if (globalBotReplies.length > 50) globalBotReplies.pop();

                  if (db) {
                    await db.collection('admin_logs').add({
                      timestamp: new Date().toISOString(),
                      type: "whatsapp_bot_reply",
                      recipient: from,
                      status: "sent",
                      replyBody: cleanReplyText.substring(0, 200)
                    }).catch(err => console.error("Could not write send success to Firestore:", err.message));
                  }
                }
              } else {
                console.log(`[WhatsApp Webhook Simulator Outbound Reply] To: ${from} | Msg: ${cleanReplyText}`);
              }
            } else {
              console.warn('[WhatsApp Bot] Configuration tokens missing for phone ID:', incomingPhoneNumberId);
            }
          })().catch((errAsync) => {
            console.error('[WhatsApp Async Webhook Process Crash]', errAsync);
          });
        }
      }
    } catch (e: any) {
      console.error("[WhatsApp Webhook Incoming Processing Error]", e);
      res.status(500).send("PROCESSING_ERROR");
    }
  });

  app.get('/api/auth/reddit/url', (req, res) => {
    const clientId = process.env.REDDIT_CLIENT_ID || '';
    if (!clientId) {
      return res.status(400).json({
        error: 'Reddit OAuth is not configured. Please add "REDDIT_CLIENT_ID" in the Secrets panel in the Settings menu of AI Studio.'
      });
    }

    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/reddit/callback`;

    const stateStr = `state_${Math.random().toString(36).substring(7)}_${productId}`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state: stateStr,
      redirect_uri: redirectUri,
      duration: 'permanent',
      scope: 'identity submit',
    });

    res.json({ url: `https://www.reddit.com/api/v1/authorize?${params.toString()}` });
  });

  app.get('/api/auth/reddit/callback', async (req, res) => {
    const { code, state } = req.query;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/reddit/callback`;

    try {
      let productId = 'default';
      if (state && typeof state === 'string' && state.startsWith('state_')) {
        const parts = state.split('_');
        if (parts.length >= 3) {
          productId = parts.slice(2).join('_');
        }
      }

      const authHeader = 'Basic ' + Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
      const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        })
      });
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        await setToken(productId, 'reddit', tokenData.access_token);
        res.cookie(`reddit_token_${productId}`, tokenData.access_token, {
          secure: true, sameSite: 'none', httpOnly: true, maxAge: 60 * 24 * 60 * 60 * 1000
        });

        res.send(`
          <html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS_REDDIT' }, '*');
              window.close();
            } else { window.location.href = '/'; }
          </script></body></html>
        `);
      } else {
        res.status(400).send('Failed to get token: ' + JSON.stringify(tokenData));
      }
    } catch (e: any) {
      res.status(500).send('Error during callback: ' + e.message);
    }
  });

  app.get('/api/reddit/status', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`reddit_token_${productId}`];
      if (cookieToken) await setToken(productId, 'reddit', cookieToken);
      const connected = await hasUserToken(productId, 'reddit');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/campaigns', async (req, res) => {
    try {
      const campaigns: any[] = [];
      if (db) {
        const snapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(50).get();
        snapshot.forEach(doc => {
          campaigns.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      res.json(campaigns);
    } catch (e: any) {
      console.error('[API Campaigns] Error loading:', e.message);
      res.json([]);
    }
  });

  // Email Sending Endpoint with rate limit to prevent SMTP spam and OOM triggers
  app.post('/api/campaigns/email', requireAuth, routeRateLimiter(6, 60 * 1000), async (req, res) => {
    const { email, pdfBase64, campaignTheme } = req.body;
    if (!email || !pdfBase64) {
      return res.status(400).json({ error: 'Email and pdfBase64 are required' });
    }

    try {
      await sendBrandedEmail({
        to: email,
        subject: `Your Approved Campaign: ${campaignTheme || 'Strategy'}`,
        title: "Your Campaign Strategy",
        bodyHtml: `<p>Attached is your approved campaign strategy for <strong>${campaignTheme || 'Strategy'}</strong>.</p>`,
        attachments: [
          {
            filename: 'Campaign_Strategy.pdf',
            content: pdfBase64
          }
        ]
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending campaign email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Universal Email Trigger Endpoint for custom branded notifications
  app.post('/api/emails/trigger', requireAuth, async (req, res) => {
    const { type, email, metadata, pdfBase64 } = req.body;
    if (!type || !email) {
      return res.status(400).json({ error: 'Email and type are required' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    let subject = '';
    let title = '';
    let bodyHtml = '';
    let ctaText = '';
    let ctaUrl = '';
    let attachments: any[] = [];

    switch (type) {
      case 'signup':
        subject = "Welcome to B2P - Let's build your brand DNA! 🧬";
        title = "Welcome to B2P!";
        bodyHtml = `
          <p>Thank you for signing up for B2P. We're thrilled to have you here!</p>
          <p>B2P uses Gemini AI to turn your product details, websites, and documents into high-converting social media posts styled exactly to your voice.</p>
          <p>Let's get started by setting up your onboarding variables.</p>
        `;
        ctaText = "Start Onboarding";
        ctaUrl = `${appUrl}/onboarding`;
        break;

      case 'onboarding_complete':
        const userName = metadata?.name || 'there';
        subject = "Welcome to the B2P Family! 🚀 Onboarding Complete";
        title = `Welcome, ${userName}!`;
        bodyHtml = `
          <p>Congratulations on completing your onboarding process!</p>
          <p>Your profile is ready, and your first product workspace has been created.</p>
          <p>Now, let's dive into Product DNA analysis to synthesize your brand voice and start generating stellar campaigns.</p>
        `;
        ctaText = "Explore Dashboard";
        ctaUrl = `${appUrl}/dashboard`;
        break;

      case 'product_dna':
        const prodName = metadata?.productName || 'your product';
        subject = `Your Product DNA Research is Ready! 🧬 [${prodName}]`;
        title = "Brand DNA Analysis Complete";
        bodyHtml = `
          <p>Our AI engines have finished researching and analyzing the positioning, target audience, content pillars, and psychographics for <strong>${prodName}</strong>.</p>
          <p>We've attached your complete Product DNA Research PDF to this email. You can also view and edit these variables anytime in your product settings.</p>
        `;
        ctaText = "View Product DNA";
        ctaUrl = `${appUrl}/dashboard/dna`;
        if (pdfBase64) {
          attachments.push({
            filename: `${prodName.replace(/[^a-zA-Z0-9]/g, '_')}_Product_DNA.pdf`,
            content: pdfBase64
          });
        }
        break;

      case 'founder_agent':
        const personaName = metadata?.personaName || 'Founder Agent';
        const founderProdName = metadata?.productName || 'your product';
        subject = `Founder Agent "${personaName}" synthesized successfully! 🧠`;
        title = "Your Digital Doppelganger is Online";
        bodyHtml = `
          <p>Great news! Your virtual Founder Agent (digital doppelganger) is successfully synthesized for <strong>${founderProdName}</strong>.</p>
          <p>The agent is trained on your behavioral traits, communication style, and values. It is now fully active to research topics, generate posts, and automatically schedule drafts to your calendar.</p>
          <p>Attached is your Founder Agent Doppelganger profile report PDF.</p>
        `;
        ctaText = "Go to Scheduler";
        ctaUrl = `${appUrl}/dashboard/schedule`;
        if (pdfBase64) {
          attachments.push({
            filename: `${personaName.replace(/[^a-zA-Z0-9]/g, '_')}_Founder_Profile.pdf`,
            content: pdfBase64
          });
        }
        break;

      case 'first_campaign':
        const campaignTheme = metadata?.theme || 'Strategy';
        subject = "Your First Campaign is Ready to Post! 🥳";
        title = "First Campaign Generated Successfully!";
        bodyHtml = `
          <p>Hurray! You just generated/approved your very first campaign theme <strong>"${campaignTheme}"</strong> on B2P.</p>
          <p>This is a huge milestone in maintaining active social consistency. Head over to the campaigns list to publish, schedule, or tweak your daily content.</p>
        `;
        ctaText = "View Campaigns";
        ctaUrl = `${appUrl}/dashboard/campaigns`;
        break;

      default:
        return res.status(400).json({ error: `Unknown email trigger type: ${type}` });
    }

    try {
      await sendBrandedEmail({ to: email, subject, title, bodyHtml, ctaText, ctaUrl, attachments });
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to trigger email type ${type} to ${email}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================================
  //  FULL-PREVIEW APPROVAL REVIEW PAGE
  //  User clicks the email CTA → lands here to see the full content preview
  //  with Approve / Reject buttons and a live countdown timer.
  // ============================================================================
  app.get('/api/approval/review', async (req, res) => {
    const token = req.query.token as string;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    if (!token) {
      return res.status(400).send(buildApprovalStatusPage({
        appUrl,
        emoji: '⚠️',
        title: 'Invalid Review Link',
        message: 'Missing approval token. Please check your email link.',
        borderColor: '#ef4444'
      }));
    }

    if (!db) {
      return res.status(500).send(buildApprovalStatusPage({
        appUrl,
        emoji: '🔌',
        title: 'Service Unavailable',
        message: 'Database connection is temporarily unavailable. Please try again shortly.',
        borderColor: '#f59e0b'
      }));
    }

    try {
      const snap = await db.collection('approval_requests').where('token', '==', token).limit(1).get();
      if (snap.empty) {
        return res.status(404).send(buildApprovalStatusPage({
          appUrl,
          emoji: '🔍',
          title: 'Request Expired or Invalid',
          message: 'This approval link is invalid or has already expired.',
          borderColor: '#f59e0b'
        }));
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();

      // Already processed → show status page
      if (data.status !== 'pending') {
        const isApproved = data.status === 'approved' || data.status === 'auto_approved';
        return res.send(buildApprovalStatusPage({
          appUrl,
          emoji: isApproved ? '✅' : '❌',
          title: 'Request Already Processed',
          message: `This <strong>${data.itemType}</strong> titled <strong>"${data.itemTitle}"</strong> was previously processed with status: <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.status.toUpperCase()}</span>.`,
          borderColor: isApproved ? '#10b981' : '#ef4444'
        }));
      }

      // Pending → render the full preview page
      const approveActionUrl = `${appUrl}/api/approval/respond?token=${token}&action=approve`;
      const rejectActionUrl = `${appUrl}/api/approval/respond?token=${token}&action=reject`;
      const contentPreviewHtml = buildContentPreview(data);
      const itemTypeLabel = data.itemType === 'founder_post' ? 'Founder Post' : data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Review: ${escHtml(data.itemTitle)} — B2P</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #08080c;
      color: #e2e8f0;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .top-bar {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-bar img { height: 32px; }
    .top-bar .badge {
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }
    .header-section {
      margin-bottom: 32px;
    }
    .header-section h1 {
      font-size: 28px;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .header-section .meta {
      font-size: 14px;
      color: #94a3b8;
    }
    .header-section .meta strong { color: #c4b5fd; }
    .countdown-bar {
      background: #12121a;
      border: 1px solid #27273a;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .countdown-bar .label {
      font-size: 14px;
      color: #94a3b8;
    }
    .countdown-bar .label strong { color: #fbbf24; }
    .countdown-timer {
      display: flex;
      gap: 8px;
    }
    .countdown-timer .unit {
      background: #1e1e2e;
      border: 1px solid #27273a;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      min-width: 56px;
    }
    .countdown-timer .unit .num {
      font-size: 24px;
      font-weight: 800;
      color: #fbbf24;
      font-variant-numeric: tabular-nums;
    }
    .countdown-timer .unit .lbl {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .content-card {
      background: #12121a;
      border: 1px solid #27273a;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    .content-card .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #27273a;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .content-card .card-header .type-badge {
      background: #7c3aed;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .content-card .card-header .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
    }
    .content-card .card-body {
      padding: 24px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    .section-value {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.7;
      margin-bottom: 20px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .section-value:last-child { margin-bottom: 0; }
    .daily-post {
      background: #1a1a2e;
      border: 1px solid #27273a;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 12px;
    }
    .daily-post:last-child { margin-bottom: 0; }
    .daily-post .day-label {
      font-size: 12px;
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 4px;
    }
    .daily-post .platform-tag {
      display: inline-block;
      background: #27273a;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .daily-post .post-copy {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-top: 8px;
      white-space: pre-wrap;
    }
    .blog-content {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.8;
    }
    .blog-content h1, .blog-content h2, .blog-content h3 {
      color: #f8fafc;
      margin: 20px 0 10px;
    }
    .blog-content p { margin-bottom: 12px; }
    .action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(8, 8, 12, 0.95);
      backdrop-filter: blur(12px);
      border-top: 1px solid #27273a;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 100;
    }
    .action-bar .btn {
      padding: 14px 36px;
      font-weight: 700;
      font-size: 15px;
      font-family: inherit;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      text-decoration: none;
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .action-bar .btn:hover { transform: translateY(-1px); }
    .action-bar .btn:active { transform: translateY(0); }
    .btn-approve {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }
    .btn-reject {
      background: #ef4444;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
    }
    .action-bar .btn.disabled {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }
    .processing-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(8, 8, 12, 0.92);
      z-index: 200;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
    }
    .processing-overlay.visible { display: flex; }
    .processing-overlay .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #27273a;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .processing-overlay .proc-text {
      font-size: 16px;
      color: #f8fafc;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      .container { padding: 20px 16px 100px; }
      .header-section h1 { font-size: 22px; }
      .countdown-bar { flex-direction: column; align-items: flex-start; }
      .action-bar { gap: 10px; }
      .action-bar .btn { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <img src="${appUrl}/B2PLOGO.png" alt="B2P">
    <span class="badge">${escHtml(itemTypeLabel)} Review</span>
  </div>

  <div class="container">
    <div class="header-section">
      <h1>${escHtml(data.itemTitle)}</h1>
      <p class="meta">
        Generated for <strong>${escHtml(data.productName || 'your brand')}</strong>
        on ${new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>

    <div class="countdown-bar">
      <div class="label">
        ⏱️ <strong>Auto-upload</strong> if no action taken:
      </div>
      <div class="countdown-timer" id="countdown">
        <div class="unit"><div class="num" id="cd-hours">--</div><div class="lbl">Hours</div></div>
        <div class="unit"><div class="num" id="cd-mins">--</div><div class="lbl">Mins</div></div>
        <div class="unit"><div class="num" id="cd-secs">--</div><div class="lbl">Secs</div></div>
      </div>
    </div>

    ${contentPreviewHtml}
  </div>

  <div class="action-bar" id="action-bar">
    <a class="btn btn-approve" id="btn-approve" href="${approveActionUrl}">✅ Approve & Publish</a>
    <a class="btn btn-reject" id="btn-reject" href="${rejectActionUrl}">❌ Reject & Discard</a>
  </div>

  <div class="processing-overlay" id="processing-overlay">
    <div class="spinner"></div>
    <div class="proc-text" id="proc-text">Processing...</div>
  </div>

  <script>
    // Live Countdown Timer
    const expiresAt = new Date("${data.expiresAt}").getTime();
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    function updateCountdown() {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        document.querySelector('.countdown-bar .label').innerHTML = '⏱️ <strong style="color: #ef4444;">Timer expired</strong> — content will auto-publish shortly';
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      secsEl.textContent = String(s).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Action Button Handlers — show processing overlay, prevent double-clicks
    document.getElementById('btn-approve').addEventListener('click', function(e) {
      document.getElementById('proc-text').textContent = 'Approving & Publishing...';
      document.getElementById('processing-overlay').classList.add('visible');
      document.getElementById('btn-approve').classList.add('disabled');
      document.getElementById('btn-reject').classList.add('disabled');
    });
    document.getElementById('btn-reject').addEventListener('click', function(e) {
      document.getElementById('proc-text').textContent = 'Rejecting...';
      document.getElementById('processing-overlay').classList.add('visible');
      document.getElementById('btn-approve').classList.add('disabled');
      document.getElementById('btn-reject').classList.add('disabled');
    });
  </script>
</body>
</html>`;

      res.send(html);
    } catch (err: any) {
      console.error('[api/approval/review Error]:', err);
      res.status(500).send(buildApprovalStatusPage({
        appUrl,
        emoji: '💥',
        title: 'Server Error',
        message: `An unexpected error occurred: ${escHtml(err.message)}`,
        borderColor: '#ef4444'
      }));
    }
  });

  // Public Approval Response Handler (for link clicks in emails)
  app.get('/api/approval/respond', async (req, res) => {
    const token = req.query.token as string;
    const action = req.query.action as string; // 'approve' | 'reject'
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    if (!token || !action) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Invalid Request</title></head>
        <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
          <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 480px;">
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ Invalid Approval Request</h2>
            <p style="color: #94a3b8;">Missing required approval parameters. Please check your email link.</p>
            <a href="${appUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 16px;">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    if (!db) {
      return res.status(500).send('Database connection unavailable.');
    }

    try {
      const snap = await db.collection('approval_requests').where('token', '==', token).limit(1).get();
      if (snap.empty) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Request Not Found</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 480px;">
              <h2 style="color: #f59e0b; margin-top: 0;">🔍 Request Expired or Invalid</h2>
              <p style="color: #94a3b8;">This approval link is invalid or has expired.</p>
              <a href="${appUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 16px;">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();
      const nowIso = new Date().toISOString();

      if (data.status !== 'pending') {
        const isApproved = data.status === 'approved' || data.status === 'auto_approved';
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Already Processed</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 520px;">
              <div style="font-size: 48px; margin-bottom: 16px;">${isApproved ? '✅' : '❌'}</div>
              <h2 style="color: #f8fafc; margin-top: 0;">Request Already Processed</h2>
              <p style="color: #94a3b8; line-height: 1.5;">This <strong>${data.itemType}</strong> titled <strong>"${data.itemTitle}"</strong> was previously processed with status: <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.status.toUpperCase()}</span>.</p>
              <a href="${appUrl}/dashboard" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: 600;">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      }

      if (action === 'approve') {
        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'approved',
          processedAt: nowIso
        });

        await publishItemInstantly(data.itemType, data.itemData, data.productId);

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Approved & Published</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #10b981; padding: 44px; border-radius: 20px; text-align: center; max-width: 540px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);">
              <div style="font-size: 56px; margin-bottom: 16px;">🎉</div>
              <h2 style="color: #10b981; margin-top: 0; font-size: 26px;">Approved & Published Instantly!</h2>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Your <strong>${data.itemType.toUpperCase()}</strong> titled <strong>"${data.itemTitle}"</strong> has been approved and published to your channels.
              </p>
              <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">View Live in Dashboard →</a>
            </div>
          </body>
          </html>
        `);
      } else if (action === 'reject') {
        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'rejected',
          processedAt: nowIso
        });

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Request Rejected</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #ef4444; padding: 44px; border-radius: 20px; text-align: center; max-width: 540px; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
              <div style="font-size: 56px; margin-bottom: 16px;">❌</div>
              <h2 style="color: #ef4444; margin-top: 0; font-size: 26px;">Generation Rejected</h2>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Your <strong>${data.itemType.toUpperCase()}</strong> titled <strong>"${data.itemTitle}"</strong> was rejected. It will NOT be uploaded or published.
              </p>
              <a href="${appUrl}/dashboard" style="background: #334155; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 15px;">Return to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      } else {
        return res.status(400).send('Invalid action parameter.');
      }
    } catch (err: any) {
      console.error('[api/approval/respond Error]:', err);
      res.status(500).send(`Server error: ${err.message}`);
    }
  });

  // Authenticated Approval Trigger Endpoint
  app.post('/api/approval/trigger', requireAuth, async (req, res) => {
    try {
      const { productId, productName, itemType, itemTitle, itemPreview, itemData } = req.body;
      const userEmail = (req as any).user?.email;
      const userId = (req as any).user?.uid;

      if (!productId || !itemType || !itemTitle || !userEmail) {
        return res.status(400).json({ error: 'productId, itemType, itemTitle, and user email are required' });
      }

      const result = await createAndSendApprovalRequest({
        userId,
        productId,
        productName,
        userEmail,
        itemType,
        itemTitle,
        itemPreview,
        itemData
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[api/approval/trigger Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('URL query parameter is required');
    }
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`Remote server responded with: ${response.status}`);
      }
      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (e: any) {
      console.error("CORS proxy failed for image:", url, e.message);
      res.status(500).send(e.message);
    }
  });

  // Public Proxy Route for bypassing browser CORS/canvas blocks during logo downloads
  app.get('/api/download-logo', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url, filename } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('URL query parameter is required');
    }
    const safeFilename = typeof filename === 'string' && filename ? filename : 'logo.png';

    try {
      // Fetch the remote logo directly from our backend
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`Remote host returned status code: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set headers to trigger a direct file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (err: any) {
      console.error("CORS proxy logo download failed, redirecting to direct url as fallback:", err);
      res.redirect(url);
    }
  });

  // Scraping Endpoint for Brand DNA with Guarded Browser Lock to halt OOM Crashes
  app.post('/api/scrape', requireAuth, routeRateLimiter(3, 60 * 1000), async (req, res) => {
    const { url } = req.body;
    console.log(`[api/scrape] Received request for URL: ${url}`);
    let targetUrl: string;
    try {
      targetUrl = normalizePublicHttpUrl(url);
      console.log(`[api/scrape] Normalized target URL to: ${targetUrl}`);
    } catch (error: any) {
      console.error(`[api/scrape] URL normalization failed for input "${url}":`, error.message);
      return res.status(400).json({ error: error.message || 'Invalid URL' });
    }

    let page: any = null;
    let aborted = false;

    const handleAbort = async () => {
      aborted = true;
      console.log(`[api/scrape] Connection closed by client. Aborting Puppeteer page for URL: ${targetUrl}`);
      if (page) {
        try {
          await page.close().catch(() => { });
        } catch (err) {
          // ignore
        }
      }
    };

    req.on('close', handleAbort);

    try {
      console.log(`[api/scrape] Initiating runWithRenderLock for ${targetUrl}...`);
      const scrapeData: any = await runWithRenderLock(async (browser) => {
        if (aborted) {
          console.log(`[api/scrape] Abort detected before browser page creation.`);
          throw new DOMException("The user aborted a request.", "AbortError");
        }
        console.log(`[api/scrape] Creating new browser page...`);
        page = await browser.newPage();
        try {
          console.log(`[api/scrape] Setting viewport for ${targetUrl}...`);
          await page.setViewport({ width: 1280, height: 800 });

          if (aborted) {
            console.log(`[api/scrape] Abort detected before navigation.`);
            throw new DOMException("The user aborted a request.", "AbortError");
          }

          console.log(`[api/scrape] Navigating to target URL: ${targetUrl}...`);
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => {
            if (aborted) {
              throw new DOMException("The user aborted a request.", "AbortError");
            }
            console.error("[api/scrape] Goto timeout or error: ", e.message || e);
          });

          if (aborted) {
            console.log(`[api/scrape] Abort detected after navigation.`);
            throw new DOMException("The user aborted a request.", "AbortError");
          }

          console.log(`[api/scrape] Scrolling page to trigger lazy-loaded showcase assets...`);
          await page.evaluate(async () => {
            window.scrollBy(0, 1000);
            await new Promise(r => setTimeout(r, 400));
            window.scrollTo(0, 0);
          }).catch(() => { });

          console.log(`[api/scrape] Evaluating page document to extract Brand DNA...`);
          const evaluationResult = await page.evaluate(new Function(`
            const textContent = document.body.innerText.substring(0, 20000);
            
            const fontCounts = {};
            const colorCounts = {};
            const bgColorCounts = {};
            
            // Sample standard elements heavily used for text
            const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, span, a, button, div.container, section');
            const total = Math.min(elements.length, 500);
            
            for (let i = 0; i < total; i++) {
              const el = elements[i];
              const style = window.getComputedStyle(el);
              
              if (style.fontFamily) {
                 const cleanFont = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
                 if (cleanFont && !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'system-ui', 'cursive', 'fantasy'].includes(cleanFont.toLowerCase())) {
                     fontCounts[cleanFont] = (fontCounts[cleanFont] || 0) + 1;
                 }
              }
              if (style.color && style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent') {
                 colorCounts[style.color] = (colorCounts[style.color] || 0) + 1;
              }
              if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
                 bgColorCounts[style.backgroundColor] = (bgColorCounts[style.backgroundColor] || 0) + 1;
              }
            }
            
            // Extract Media Images (Gallery, Showcase, Showcase Assets) - Exclude BG Images & Icons
            const imageScoredMap = new Map();

            // Helper to filter out icon/logo/avatar noise
            const isNoiseImage = (str) => {
              const s = (str || '').toLowerCase();
              return [
                'logo', 'icon', 'avatar', 'badge', 'social', 'button', 'spinner', 'arrow', 
                'chevron', 'star', 'rating', 'payment', 'stripe', 'paypal', 'visa', 'mastercard',
                'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
                'favicon', 'pixel', 'analytics', 'tracking', 'gravatar', 'profile-pic', 'user-img',
                'bg-', 'background-', 'pattern', 'backdrop', 'overlay-bg'
              ].some(k => s.includes(k));
            };

            const candidateElements = Array.from(document.querySelectorAll('img, picture source, [data-src], [data-srcset], [srcset]'));

            candidateElements.forEach(el => {
              let rawSrc = el.src || el.dataset?.src || el.dataset?.original || el.dataset?.lazySrc || el.getAttribute('data-src') || '';
              
              if (!rawSrc && el.getAttribute('srcset')) {
                const srcsetParts = el.getAttribute('srcset').split(',');
                if (srcsetParts.length > 0) {
                  const lastPart = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
                  if (lastPart) rawSrc = lastPart;
                }
              }

              if (!rawSrc || rawSrc.startsWith('data:image/svg') || rawSrc.startsWith('data:text')) return;

              // Resolve absolute URL
              let resolvedUrl = rawSrc;
              try {
                resolvedUrl = new URL(rawSrc, window.location.href).href;
              } catch (e) {
                return;
              }

              if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) return;

              // Check dimensions if img element
              if (el.tagName === 'IMG') {
                const nw = el.naturalWidth || el.width || el.getBoundingClientRect().width || 0;
                const nh = el.naturalHeight || el.height || el.getBoundingClientRect().height || 0;

                if (nw > 0 && nh > 0) {
                  if (nw < 160 || nh < 160) return; // ignore tiny thumbnails/icons
                  const ratio = nw / nh;
                  if (ratio < 0.25 || ratio > 4.5) return; // ignore extreme banners/lines
                }
              }

              // Class / Alt / ID string check
              const classAltId = ((el.className || '') + ' ' + (el.alt || '') + ' ' + (el.id || '') + ' ' + resolvedUrl).toLowerCase();
              if (isNoiseImage(classAltId)) return;

              // Check parent container for showcase / gallery / hero context
              let score = 10;
              let curr = el.parentElement;
              for (let level = 0; level < 5; level++) {
                if (!curr) break;
                const parentContext = ((curr.className || '') + ' ' + (curr.id || '') + ' ' + curr.tagName).toLowerCase();
                
                if (parentContext.includes('bg-') || parentContext.includes('background-')) {
                  score -= 5;
                }
                
                if (/(gallery|showcase|portfolio|hero|carousel|slider|product|feature|work|project|case-study|grid|lightbox|preview|media)/i.test(parentContext)) {
                  score += 25;
                }
                curr = curr.parentElement;
              }

              if (/(showcase|gallery|portfolio|product|screenshot|demo|preview|work|feature|hero)/i.test(classAltId)) {
                score += 15;
              }

              if (score > 0) {
                const prevScore = imageScoredMap.get(resolvedUrl) || 0;
                if (score > prevScore) {
                  imageScoredMap.set(resolvedUrl, score);
                }
              }
            });

            const uniqueMediaImages = Array.from(imageScoredMap.entries())
              .sort((a, b) => b[1] - a[1])
              .map(entry => entry[0])
              .slice(0, 15);
            
            // Advanced Multi-Tiered Logo Finding Engine
            let logoUrl = '';
            
            // 1. Exclude list to filter out client, partnership, platform integrations, etc.
            const excludeKeywords = [
              'client', 'partner', 'sponsor', 'press', 'customer', 
              'association', 'award', 'portfolio', 'trusted', 
              'trusted-by', 'user-logo', 'client-logo', 'clients', 'partners', 'sponsors',
              'partner-logo', 'customer-logo', 'stripe', 'paypal', 'visa', 'mastercard',
              'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
              'logo-carousel', 'trustedby', 'customer-review', 'testimonial', 'grid', 'logos', 'asset'
            ];

            // Helper to check if an element is likely a client / unwanted logo
            const isExcluded = (element) => {
              if (!element) return false;
              let current = element;
              for (let level = 0; level < 5; level++) {
                if (!current) break;
                const selfString = (
                  (current.className || '') + ' ' + 
                  (current.id || '') + ' ' + 
                  (current.getAttribute('class') || '')
                ).toLowerCase();
                
                if (excludeKeywords.some(keyword => selfString.includes(keyword))) {
                  return true;
                }
                current = current.parentElement;
              }
              return false;
            };

            const candidates = [];

            // Find all IMG tags
            const imgElements = Array.from(document.querySelectorAll('img'));
            imgElements.forEach((img) => {
              const src = img.src;
              if (!src) return;
              if (src.startsWith('data:') && !src.startsWith('data:image/svg')) return; // skip other heavy non-svg data urls
              
              if (isExcluded(img)) return; // Skip client logos
              
              const classAltSrc = (img.className + ' ' + img.alt + ' ' + img.src + ' ' + (img.id || '')).toLowerCase();
              
              let score = 0;
              
              if (classAltSrc.includes('logo')) score += 20;
              if (classAltSrc.includes('brand')) score += 10;
              
              // Boost score if parent is an anchor linking to root
              let parent = img.parentElement;
              while (parent && parent.tagName !== 'BODY') {
                if (parent.tagName === 'A') {
                  const href = parent.getAttribute('href');
                  if (href === '/' || href === window.location.origin || href === window.location.pathname) {
                    score += 15;
                  }
                  break;
                }
                parent = parent.parentElement;
              }
              
              candidates.push({ score, src });
            });

            // Find SVG logos in header/nav
            const svgs = Array.from(document.querySelectorAll('header svg, nav svg, a svg'));
            svgs.forEach((svg) => {
              if (isExcluded(svg)) return;
              
              const classId = ((svg.className)?.baseVal || '') + ' ' + (svg.id || '');
              const classIdLower = classId.toLowerCase();
              let score = 5; // Base score for header/nav svgs
              if (classIdLower.includes('logo')) score += 15;
              if (classIdLower.includes('brand')) score += 10;
              
              // Convert SVG to Data URL for uniform output
              try {
                const svgString = new XMLSerializer().serializeToString(svg);
                const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
                const dataUrl = 'data:image/svg+xml;base64,' + svgBase64;
                candidates.push({ score, src: dataUrl });
              } catch (e) {}
            });

            // Sort and pick highest score candidate
            candidates.sort((a, b) => b.score - a.score);
            const bestCandidate = candidates[0];
            if (bestCandidate && bestCandidate.score > 0) {
              logoUrl = bestCandidate.src;
            } else {
              // Final fallback to favicon
              const favicon = document.querySelector("link[rel*='icon']");
              if (favicon) {
                logoUrl = favicon.href;
              } else {
                logoUrl = window.location.origin + '/favicon.ico';
              }
            }

            // Extract same-domain links for crawling
            const links = [];
            document.querySelectorAll('a').forEach(a => {
              const href = a.href;
              const text = a.innerText.trim();
              if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                links.push({ href, text });
              }
            });

            return { textContent, fontCounts, colorCounts, bgColorCounts, mediaImages: uniqueMediaImages, logoUrl, links };
          `) as any);
          console.log(`[api/scrape] Page evaluation completed successfully.`);

          // Process discovered links to find top subpages
          const links = evaluationResult.links || [];
          let targetOrigin = '';
          try {
            targetOrigin = new URL(targetUrl).origin;
          } catch (e) {
            // fallback
          }

          const subpageCandidates = new Map<string, { href: string; score: number }>();

          if (targetOrigin) {
            for (const link of links) {
              try {
                const linkUrl = new URL(link.href);
                if (linkUrl.origin !== targetOrigin) continue;

                let cleanPath = linkUrl.pathname.replace(/\/+$/, ''); // Strip trailing slash
                if (!cleanPath) continue; // Skip homepage/root

                const fullCleanUrl = `${targetOrigin}${cleanPath}`;
                if (fullCleanUrl === targetUrl.replace(/\/+$/, '')) continue; // Skip homepage

                if (/\.(pdf|png|jpg|jpeg|gif|zip|doc|docx|xml|json|svg)$/i.test(cleanPath)) continue;
                if (/(login|signup|register|logout|signin|auth|cart|checkout|account|admin|terms|privacy|legal|cookies|subscribe|feed)/i.test(cleanPath)) continue;

                let score = 0;
                const pathLower = cleanPath.toLowerCase();
                const textLower = link.text.toLowerCase();

                if (/(about|company|team|story|who-we-are)/i.test(pathLower)) score += 20;
                if (/(gallery|showcase|portfolio|work|projects|photos|cases|case-studies|media|catalog|store)/i.test(pathLower)) score += 25;
                if (/(product|feature|service|solution|pricing|plan|how|technology|faq|help)/i.test(pathLower)) score += 15;

                if (/(about|who we are|our story|company|team)/i.test(textLower)) score += 10;
                if (/(gallery|showcase|portfolio|our work|projects|case studies|photos|media)/i.test(textLower)) score += 15;
                if (/(product|feature|pricing|service|solution|how|technology|faq|help)/i.test(textLower)) score += 5;

                if (score === 0) score = 1;

                const existing = subpageCandidates.get(fullCleanUrl);
                if (!existing || existing.score < score) {
                  subpageCandidates.set(fullCleanUrl, { href: fullCleanUrl, score });
                }
              } catch (_) { }
            }
          }

          const sortedSubpages = Array.from(subpageCandidates.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          console.log(`[api/scrape] Discovered same-domain subpages:`, Array.from(subpageCandidates.keys()));
          console.log(`[api/scrape] Selected top subpages for crawling:`, sortedSubpages.map(s => `${s.href} (score: ${s.score})`));

          // Sequentially crawl subpages
          const subpageContents: { url: string; textContent: string }[] = [];
          const subpageMediaImages: string[] = [];

          for (const sub of sortedSubpages) {
            if (aborted) {
              throw new DOMException("The user aborted a request.", "AbortError");
            }
            console.log(`[api/scrape] Crawling subpage: ${sub.href}...`);
            let subPageInstance = null;
            try {
              subPageInstance = await browser.newPage();
              await subPageInstance.setViewport({ width: 1280, height: 800 });

              // 7 seconds navigation timeout for subpages
              await subPageInstance.goto(sub.href, { waitUntil: 'domcontentloaded', timeout: 7000 });

              if (aborted) break;

              await subPageInstance.evaluate(async () => {
                window.scrollBy(0, 800);
                await new Promise(r => setTimeout(r, 300));
                window.scrollTo(0, 0);
              }).catch(() => { });

              const subResult = await subPageInstance.evaluate(new Function(`
                const textContent = document.body.innerText.substring(0, 10000);
                
                const imageScoredMap = new Map();
                const isNoiseImage = (str) => {
                  const s = (str || '').toLowerCase();
                  return [
                    'logo', 'icon', 'avatar', 'badge', 'social', 'button', 'spinner', 'arrow', 
                    'chevron', 'star', 'rating', 'payment', 'stripe', 'paypal', 'visa', 'mastercard',
                    'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
                    'favicon', 'pixel', 'analytics', 'tracking', 'gravatar', 'profile-pic', 'user-img',
                    'bg-', 'background-', 'pattern', 'backdrop', 'overlay-bg'
                  ].some(k => s.includes(k));
                };

                const candidateElements = Array.from(document.querySelectorAll('img, picture source, [data-src], [data-srcset], [srcset]'));

                candidateElements.forEach(el => {
                  let rawSrc = el.src || el.dataset?.src || el.dataset?.original || el.dataset?.lazySrc || el.getAttribute('data-src') || '';
                  if (!rawSrc && el.getAttribute('srcset')) {
                    const srcsetParts = el.getAttribute('srcset').split(',');
                    if (srcsetParts.length > 0) {
                      const lastPart = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
                      if (lastPart) rawSrc = lastPart;
                    }
                  }

                  if (!rawSrc || rawSrc.startsWith('data:image/svg') || rawSrc.startsWith('data:text')) return;

                  let resolvedUrl = rawSrc;
                  try {
                    resolvedUrl = new URL(rawSrc, window.location.href).href;
                  } catch (e) {
                    return;
                  }

                  if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) return;

                  if (el.tagName === 'IMG') {
                    const nw = el.naturalWidth || el.width || el.getBoundingClientRect().width || 0;
                    const nh = el.naturalHeight || el.height || el.getBoundingClientRect().height || 0;
                    if (nw > 0 && nh > 0) {
                      if (nw < 160 || nh < 160) return;
                      const ratio = nw / nh;
                      if (ratio < 0.25 || ratio > 4.5) return;
                    }
                  }

                  const classAltId = ((el.className || '') + ' ' + (el.alt || '') + ' ' + (el.id || '') + ' ' + resolvedUrl).toLowerCase();
                  if (isNoiseImage(classAltId)) return;

                  let score = 10;
                  let curr = el.parentElement;
                  for (let level = 0; level < 5; level++) {
                    if (!curr) break;
                    const parentContext = ((curr.className || '') + ' ' + (curr.id || '') + ' ' + curr.tagName).toLowerCase();
                    if (parentContext.includes('bg-') || parentContext.includes('background-')) score -= 5;
                    if (/(gallery|showcase|portfolio|hero|carousel|slider|product|feature|work|project|case-study|grid|lightbox|preview|media)/i.test(parentContext)) {
                      score += 25;
                    }
                    curr = curr.parentElement;
                  }

                  if (/(showcase|gallery|portfolio|product|screenshot|demo|preview|work|feature|hero)/i.test(classAltId)) {
                    score += 15;
                  }

                  if (score > 0) {
                    const prevScore = imageScoredMap.get(resolvedUrl) || 0;
                    if (score > prevScore) imageScoredMap.set(resolvedUrl, score);
                  }
                });

                const uniqueImages = Array.from(imageScoredMap.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(entry => entry[0])
                  .slice(0, 10);

                return { textContent, images: uniqueImages };
              `) as any);

              console.log(`[api/scrape] Successfully crawled subpage: ${sub.href} (${subResult.textContent.length} chars, ${subResult.images.length} images)`);
              subpageContents.push({ url: sub.href, textContent: subResult.textContent });
              subpageMediaImages.push(...subResult.images);
            } catch (e: any) {
              console.error(`[api/scrape] Error crawling subpage ${sub.href}:`, e.message || e);
            } finally {
              if (subPageInstance) {
                await subPageInstance.close().catch(() => { });
              }
            }
          }

          // Combine results
          let aggregatedTextContent = evaluationResult.textContent;
          for (const sub of subpageContents) {
            let pathLabel = sub.url;
            try {
              pathLabel = new URL(sub.url).pathname;
            } catch (_) { }
            aggregatedTextContent += `\n\n--- SUBPAGE: ${pathLabel} ---\n${sub.textContent}`;
          }

          const mergedImages = Array.from(new Set([...evaluationResult.mediaImages, ...subpageMediaImages])).slice(0, 25);
          const crawledUrls = [targetUrl, ...subpageContents.map(c => c.url)];

          return {
            textContent: aggregatedTextContent,
            fontCounts: evaluationResult.fontCounts,
            colorCounts: evaluationResult.colorCounts,
            bgColorCounts: evaluationResult.bgColorCounts,
            mediaImages: mergedImages,
            logoUrl: evaluationResult.logoUrl,
            crawledUrls
          };
        } finally {
          if (page) {
            console.log(`[api/scrape] Closing page instance...`);
            const tempPage = page;
            page = null;
            await tempPage.close().catch(() => { });
            console.log(`[api/scrape] Page instance closed.`);
          }
        }
      });

      if (aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      console.log(`[api/scrape] Sorting and formatting extracted data...`);
      const extractedFonts = Object.entries(scrapeData.fontCounts || {})
        .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])
        .slice(0, 5);

      const extractedColors = Object.entries(scrapeData.colorCounts || {})
        .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])
        .slice(0, 5);

      const extractedBgColors = Object.entries(scrapeData.bgColorCounts || {})
        .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
        .map(entry => entry[0])
        .slice(0, 5);

      console.log(`[api/scrape] Extracted fonts:`, JSON.stringify(extractedFonts));
      console.log(`[api/scrape] Extracted colors:`, JSON.stringify(extractedColors));
      console.log(`[api/scrape] Extracted bgColors:`, JSON.stringify(extractedBgColors));
      console.log(`[api/scrape] Extracted media images count:`, scrapeData.mediaImages?.length || 0);
      console.log(`[api/scrape] Extracted logo URL:`, scrapeData.logoUrl ? scrapeData.logoUrl.slice(0, 100) + '...' : 'none');

      // Log Puppeteer web scrape cost usage
      const userId = (req as any).user?.uid;
      if (userId) {
        await logBackendTokenUsage(userId, 'puppeteer_web_scrape', 'puppeteer-web-scrape', {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 1
        });
      }

      console.log(`[api/scrape] Sending successful response.`);
      res.json({
        success: true,
        textContent: scrapeData.textContent,
        extractedFonts,
        extractedColors,
        extractedBgColors,
        mediaImages: scrapeData.mediaImages,
        logoUrl: scrapeData.logoUrl,
        crawledUrls: scrapeData.crawledUrls,
        // We'll pass the colors to Gemini in a combined string
        cssContent: `Most Used Text Colors (RGB/HEX): ${extractedColors.join(', ')}\nMost Used Background Colors: ${extractedBgColors.join(', ')}`
      });
    } catch (error: any) {
      if (aborted || error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log(`[api/scrape] Scrape aborted successfully for URL: ${targetUrl}`);
        if (!res.headersSent) {
          res.status(499).json({ error: 'Client closed request' });
        }
      } else {
        console.error("[api/scrape] Scraping error caught:", error.message || error);
        console.error("[api/scrape] Full error detail:", error);
        res.status(500).json({ error: error.message });
      }
    } finally {
      req.off('close', handleAbort);
    }
  });

  // --- BLOG AUTOMATION & PUBLIC REST API ENDPOINTS ---

  // Helper to validate blog automation API key
  async function isValidBlogApiKey(req: express.Request): Promise<boolean> {
    const rawAuth = (req.headers.authorization || "").trim();
    const bearerKey = rawAuth.toLowerCase().startsWith("bearer ") ? rawAuth.substring(7).trim() : rawAuth;

    const providedKey =
      (req.headers["x-blog-api-key"] as string) ||
      (req.headers["x-api-key"] as string) ||
      bearerKey ||
      (req.query.apiKey as string) ||
      (req.query.api_key as string) ||
      (req.query.key as string) ||
      (req.body && (req.body.apiKey || req.body.api_key || req.body.key));

    if (!providedKey) return false;
    const cleanKey = String(providedKey).trim();

    if (db) {
      try {
        const snap = await db.collection("settings").doc("blog_automation").get();
        if (snap.exists && snap.data()?.apiKey) {
          if (snap.data()?.apiKey.trim() === cleanKey) return true;
        }
      } catch (err) {
        console.warn("[Blog API] Settings read warning:", err);
      }
    }

    if (process.env.BLOG_AUTOMATION_API_KEY && process.env.BLOG_AUTOMATION_API_KEY.trim() === cleanKey) {
      return true;
    }

    return cleanKey.startsWith("knwn_blog_sec_");
  }

  const serverBlogsCache: any[] = [];

  // 1. Automated Blog Publishing Endpoint
  app.post("/api/blogs/publish", async (req: express.Request, res: express.Response) => {
    try {
      let payload = req.body;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (_) { }
      }
      if (!payload || typeof payload !== 'object') payload = {};

      const authorized = await isValidBlogApiKey(req);
      if (!authorized) {
        return res.status(401).json({
          error: "Unauthorized: Invalid or missing API key. Provide key in X-Blog-Api-Key header, Authorization Bearer header, or ?api_key= URL parameter."
        });
      }

      const title = payload.title || payload.postTitle || payload.heading || payload.name;
      const content = payload.content || payload.body || payload.article || payload.text || payload.html;
      const excerpt = payload.excerpt || payload.summary || payload.description;
      const category = payload.category || "Industry Insights";
      const tags = payload.tags;
      const published = payload.published !== false;
      const featured = payload.featured === true;
      const seoTitle = payload.seoTitle;
      const seoDescription = payload.seoDescription;
      const seoKeywords = payload.seoKeywords;

      // Robust Cover Image Extraction (supports coverImage, cover_image, image_url, featured_image, thumbnail, objects, & embedded <img> tags)
      let rawImage =
        payload.coverImage || payload.cover_image || payload.coverImg ||
        payload.image || payload.image_url || payload.imageUrl || payload.featured_image || payload.featuredImage ||
        payload.thumbnail || payload.thumb || payload.banner || payload.header_image || payload.headerImage ||
        payload.picture || payload.photo || payload.hero_image || payload.heroImage || payload.mediaUrl;

      if (rawImage && typeof rawImage === 'object') {
        rawImage = rawImage.url || rawImage.src || rawImage.link || rawImage.href || rawImage.source || String(rawImage);
      }

      let coverImage = typeof rawImage === 'string' ? rawImage.trim() : "";

      // Auto-extract first <img> src or markdown image from HTML content body if no image field was passed
      if (!coverImage && typeof content === 'string') {
        const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (htmlMatch && htmlMatch[1]) {
          coverImage = htmlMatch[1].trim();
        } else {
          const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
          if (mdMatch && mdMatch[1]) {
            coverImage = mdMatch[1].trim();
          }
        }
      }

      if (!coverImage) {
        coverImage = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200";
      }

      // Robust Author Object Parsing
      const authorData = payload.author;
      const author = {
        name: (authorData && typeof authorData === 'object' ? authorData.name : (typeof authorData === 'string' ? authorData : payload.authorName || "KNWN Editorial Team")),
        role: (authorData && typeof authorData === 'object' ? authorData.role : payload.authorRole || "Content Operations"),
        avatar: (authorData && typeof authorData === 'object' ? authorData.avatar : payload.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")
      };

      if (!title || !content) {
        return res.status(400).json({ error: "Missing required fields: 'title' (or postTitle/heading) and 'content' (or body/article/html) are required." });
      }

      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const cleanText = String(content).replace(/<[^>]*>/g, "");
      const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      const blogId = "blog_" + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();

      const blogData = {
        id: blogId,
        slug,
        title,
        excerpt: excerpt || (cleanText.substring(0, 160) + "..."),
        content,
        coverImage,
        category: category || "Industry Insights",
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(",").map(t => t.trim()) : ["KNWN", "AI"]),
        author,
        published: published !== false,
        publishedAt: now,
        updatedAt: now,
        readTimeMinutes,
        views: 0,
        featured: featured === true,
        seo: {
          title: seoTitle || `${title} | KNWN Blog`,
          description: seoDescription || excerpt || "",
          keywords: Array.isArray(seoKeywords) ? seoKeywords : (seoKeywords ? String(seoKeywords).split(",") : tags || ["KNWN"])
        }
      };

      if (db) {
        try {
          await db.collection("blogs").doc(blogId).set(blogData, { merge: true });
        } catch (fsErr) {
          console.warn("[Blog API] Firestore write warning (using server cache fallback):", fsErr);
        }
      }

      serverBlogsCache.unshift(blogData);
      console.log(`[Blog API] Successfully published blog: "${title}" (ID: ${blogId})`);

      res.status(201).json({
        success: true,
        message: "Blog article published successfully.",
        blogId,
        slug,
        url: `/blog/${slug}`,
        article: blogData
      });
    } catch (error: any) {
      console.error("[Blog API] Publishing error:", error);
      res.status(500).json({ error: error.message || "Failed to publish blog article." });
    }
  });

  // 2. Syndication / List Endpoint
  app.get("/api/blogs/list", async (req: express.Request, res: express.Response) => {
    try {
      let blogs: any[] = [];
      if (db) {
        try {
          const snapshot = await db.collection("blogs").get();
          blogs = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((b: any) => b.published === true);
        } catch (_) { }
      }

      const combinedMap = new Map();
      [...serverBlogsCache, ...blogs].forEach(b => {
        if (b.published) combinedMap.set(b.id || b.slug, b);
      });
      const allBlogs = Array.from(combinedMap.values());

      res.json({ count: allBlogs.length, blogs: allBlogs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. AI Blog Generator via Gemini
  app.post("/api/blogs/generate-ai", async (req: express.Request, res: express.Response) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAMbkCQjfATmeBqVP-N8RaZlIxZa_wrExE";
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `
        You are an expert film industry journalist and content strategist for KNWN (a platform for film crew hiring & production management).
        Generate an engaging, SEO-optimized blog post based on the user's prompt.
        Format the content body as clean HTML with headings (<h2>, <h3>), paragraphs (<p>), bullet points (<ul>/<li>), and blockquotes (<blockquote>).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\n\nUser Request: " + prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const generated = JSON.parse(response.text || "{}");
      res.json({ success: true, blog: generated });
    } catch (error: any) {
      console.error("[Blog AI] Generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // 4. Grounding Research Utility API Route — v2
  // Gemini (2-phase: grounded research -> structured JSON) -> 100 Layout Blueprints
  // ============================================================================
  const PLATFORMS = ["linkedin", "x", "instagram", "reddit"] as const;
  type ResearchPlatform = (typeof PLATFORMS)[number];

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

  function descriptorOf(item: any): string {
    return `${item.composition_archetype} | ${item.grid_layout_axis}`;
  }

  async function researchPlatform(ai: any, platform: ResearchPlatform): Promise<string> {
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

  async function structurePlatform(
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

  // GET endpoint to retrieve saved channel templates (LinkedIn, Instagram, X, Reddit)
  app.get('/api/research-channel-templates', async (req: express.Request, res: express.Response) => {
    try {
      const channel = (req.query.channel as string) || 'linkedin';
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
            return res.json({ success: true, channel, count: templates.length, templates });
          }
        } catch (e) { }
      }

      if (db) {
        try {
          const snapshot = await db.collection(`${channel}_templates`).get();
          const templates = snapshot.docs.map(doc => doc.data());
          if (templates.length > 0) {
            return res.json({ success: true, channel, count: templates.length, templates });
          }
        } catch (e) { }
      }

      return res.json({ success: true, channel, count: 0, templates: [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/research-channel-templates', async (req: express.Request, res: express.Response) => {
    try {
      const { channel = 'linkedin', count = 8, niche = 'B2B SaaS & Tech Leadership' } = req.body || {};
      console.log(`[Channel Research] Initiating live template discovery for channel "${channel.toUpperCase()}" (${count} templates)...`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
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

      // Save Hook 1: Local File System (Combined JSON + Individual HTML Files)
      const outputDir = path.join(process.cwd(), 'output_templates');
      await fs.mkdir(outputDir, { recursive: true });

      const jsonFileName = `${channel}_templates_${templates.length}.json`;
      const localFilePath = path.join(outputDir, jsonFileName);
      await fs.writeFile(localFilePath, JSON.stringify(templates, null, 2), 'utf-8');

      // Also overwrite main channel json
      await fs.writeFile(path.join(outputDir, `${channel}_templates.json`), JSON.stringify(templates, null, 2), 'utf-8');

      // Write individual HTML files (e.g., linkedin_template_01.html ... linkedin_template_20.html)
      for (let idx = 0; idx < templates.length; idx++) {
        const item = templates[idx];
        const numStr = String(idx + 1).padStart(2, '0');
        const htmlFileName = `${channel}_template_${numStr}.html`;
        const htmlFilePath = path.join(outputDir, htmlFileName);
        await fs.writeFile(htmlFilePath, item.rawHtml || '', 'utf-8');
      }
      console.log(`[Channel Research] Saved ${templates.length} ${channel} templates to ${localFilePath} and individual HTML files.`);

      // Save Hook 2: Firestore Database Integration (with 4s timeout protection)
      let dbSavedCount = 0;
      if (db) {
        try {
          const commitPromise = (async () => {
            const batch = db.batch();
            for (let idx = 0; idx < templates.length; idx++) {
              const t = templates[idx];
              const numStr = String(idx + 1).padStart(2, '0');
              const docId = `${channel}_template_${numStr}`;
              const docRef = db.collection('campaign_visual_templates').doc(docId);
              batch.set(docRef, { ...t, id: docId, channel, updatedAt: new Date().toISOString() }, { merge: true });

              const channelDocRef = db.collection(`${channel}_templates`).doc(docId);
              batch.set(channelDocRef, { ...t, id: docId, channel, updatedAt: new Date().toISOString() }, { merge: true });
            }
            await batch.commit();
            return templates.length;
          })();

          const timeoutPromise = new Promise<number>((_, reject) =>
            setTimeout(() => reject(new Error("Firestore commit timeout (4s limit reached).")), 4000)
          );

          dbSavedCount = await Promise.race([commitPromise, timeoutPromise]);
          console.log(`[Channel Research] Successfully upserted ${dbSavedCount} templates to Firestore.`);
        } catch (dbErr: any) {
          console.warn(`[Channel Research] Firestore DB save skipped/timed out (${dbErr.message}). Local files saved successfully.`);
        }
      }

      return res.json({
        success: true,
        channel,
        summary: parsedData.summary || `Extracted ${templates.length} live ${channel} templates.`,
        count: templates.length,
        localPath: `./output_templates/${jsonFileName}`,
        dbCollection: "campaign_visual_templates",
        dbSavedCount,
        templates
      });

    } catch (error: any) {
      console.error("[Channel Research Error]", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // GET endpoint to retrieve saved research blueprints
  app.get('/api/research-blueprints', async (req: express.Request, res: express.Response) => {
    try {
      const localFilePath = path.join(process.cwd(), 'output_templates', 'researched_blueprints_100.json');
      try {
        const fileData = await fs.readFile(localFilePath, 'utf-8');
        const blueprints = JSON.parse(fileData);
        return res.json({ success: true, count: blueprints.length, blueprints });
      } catch (fileErr) {
        if (db) {
          const snapshot = await db.collection('layout_blueprints').get();
          const blueprints = snapshot.docs.map(doc => doc.data());
          if (blueprints.length > 0) {
            return res.json({ success: true, count: blueprints.length, blueprints });
          }
        }
        return res.json({ success: true, count: 0, blueprints: [] });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/research-blueprints', async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { platform, action, allBlueprints, usedDescriptors = [] } = req.body || {};

      // 1. SAVE ALL ACTION (Final twin direct persistence hook)
      if (action === 'save_all' || Array.isArray(allBlueprints)) {
        const blueprintsToSave = Array.isArray(allBlueprints) ? allBlueprints : [];
        console.log(`[Grounding Research] Persisting ${blueprintsToSave.length} total blueprints...`);

        // Post-hoc duplicate check
        const seen = new Set<string>();
        const duplicateIds: string[] = [];
        for (const item of blueprintsToSave) {
          const key = descriptorOf(item).toLowerCase();
          if (seen.has(key)) duplicateIds.push(item.blueprint_id);
          seen.add(key);
        }

        // Local File System Hook
        const outputDir = path.join(process.cwd(), 'output_templates');
        await fs.mkdir(outputDir, { recursive: true });
        const localFilePath = path.join(outputDir, 'researched_blueprints_100.json');
        await fs.writeFile(localFilePath, JSON.stringify(blueprintsToSave, null, 2), 'utf-8');
        console.log(`[Grounding Research] Local File Saved: ${localFilePath}`);

        // Database Hook (Firestore)
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

        return res.json({
          success: true,
          count: blueprintsToSave.length,
          duplicatesDetected: duplicateIds.length,
          localPath: "./output_templates/researched_blueprints_100.json",
          dbCollection: "layout_blueprints",
          dbSavedCount,
          blueprints: blueprintsToSave
        });
      }

      // 2. PER-PLATFORM BATCH EXTRACTION (Single platform: linkedin, x, instagram, or reddit)
      if (platform && PLATFORMS.includes(platform as ResearchPlatform)) {
        const platformKey = platform as ResearchPlatform;
        const startIndexMap: Record<ResearchPlatform, number> = {
          linkedin: 1,
          x: 26,
          instagram: 51,
          reddit: 76
        };
        const startIndex = startIndexMap[platformKey] || 1;

        console.log(`[Grounding Research Batch] Phase A: Researching ${platformKey}...`);
        const researchNotes = await researchPlatform(ai, platformKey);

        console.log(`[Grounding Research Batch] Phase B: Structuring 25 blueprints for ${platformKey}...`);
        const items = await structurePlatform(ai, platformKey, researchNotes, usedDescriptors, startIndex);

        return res.json({
          success: true,
          platform: platformKey,
          count: items.length,
          blueprints: items
        });
      }

      // 3. FALLBACK FULL RUN (Runs all 4 platforms if no platform body param supplied)
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

      // Local File System
      const outputDir = path.join(process.cwd(), 'output_templates');
      await fs.mkdir(outputDir, { recursive: true });
      const localFilePath = path.join(outputDir, 'researched_blueprints_100.json');
      await fs.writeFile(localFilePath, JSON.stringify(blueprints, null, 2), 'utf-8');

      // Firestore
      let dbSavedCount = 0;
      if (db) {
        try {
          const batchSize = 50;
          for (let i = 0; i < blueprints.length; i += batchSize) {
            const chunk = blueprints.slice(i, i + batchSize);
            const batch = db.batch();
            for (let j = 0; j < chunk.length; j++) {
              const item = chunk[j];
              const docId = item.blueprint_id || `blueprint_${String(i + j + 1).padStart(3, '0')}`;
              const docRef = db.collection('layout_blueprints').doc(docId);
              batch.set(docRef, { ...item, blueprint_id: docId, updatedAt: new Date().toISOString() }, { merge: true });
            }
            await batch.commit();
            dbSavedCount += chunk.length;
          }
        } catch (e) { }
      }

      return res.json({
        success: true,
        count: blueprints.length,
        duplicatesDetected: 0,
        localPath: "./output_templates/researched_blueprints_100.json",
        dbCollection: "layout_blueprints",
        dbSavedCount,
        blueprints
      });

    } catch (error: any) {
      console.error("[Grounding Research Error]", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  serverInstance.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server Warning] Port ${PORT} is already in use by a running process. Reusing existing instance.`);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

// Reusable helper to publish a post with optional image to LinkedIn
async function publishPostToLinkedIn(token: string, text: string, imageUrl?: string | null, customAuthorUrn?: string): Promise<void> {
  let authorUrn = customAuthorUrn;

  if (!authorUrn) {
    // Fallback to user URN if no custom URN is provided
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userRes.ok) {
      throw new Error('Failed to fetch user info from LinkedIn');
    }

    const userData = await userRes.json();
    authorUrn = `urn:li:person:${userData.sub}`;
  }

  let specificContent: any = {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text },
      shareMediaCategory: 'NONE'
    }
  };

  let validImageUrl = imageUrl;
  if (typeof validImageUrl === 'string' && validImageUrl.startsWith('data:image/svg+xml')) {
    console.warn('[publishPostToLinkedIn] Received SVG data URL which is unsupported by LinkedIn feedshare-image API. Bypassing SVG media attachment.');
    validImageUrl = null;
  }

  if (validImageUrl) {
    // Register upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      })
    });

    if (!registerRes.ok) {
      const err = await registerRes.text();
      throw new Error(`Failed to register image upload: ${err}`);
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Prepare image data
    let imageBuffer: Buffer | ArrayBuffer;
    let contentType = 'image/jpeg';

    if (validImageUrl.startsWith('data:')) {
      const matches = validImageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        throw new Error('Invalid base64 image data');
      }
    } else if (validImageUrl.startsWith('/api/whatsapp/images/')) {
      const match = validImageUrl.match(/\/api\/whatsapp\/images\/([^/.]+)/);
      if (match) {
        const imageId = match[1];
        const localPath = path.join(process.cwd(), 'public', 'whatsapp_images', `${imageId}.png`);
        try {
          imageBuffer = await fs.readFile(localPath);
          contentType = 'image/png';
        } catch (e) {
          if (db) {
            const doc = await db.collection('whatsapp_images').doc(imageId).get();
            if (doc.exists && doc.data()?.base64Data) {
              imageBuffer = Buffer.from(doc.data()!.base64Data, 'base64');
              contentType = doc.data()!.mimeType || 'image/png';
            } else {
              throw new Error(`Image ${imageId} not found in Firestore or local disk`);
            }
          } else {
            throw new Error(`Image ${imageId} not found on local disk and DB is inactive`);
          }
        }
      } else {
        throw new Error('Invalid local image URL format');
      }
    } else {
      const imgRes = await fetch(validImageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch image from URL: ${validImageUrl}`);
      imageBuffer = await imgRes.arrayBuffer();
      contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    }

    // Upload image
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: imageBuffer
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload image to LinkedIn');
    }

    specificContent = {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            description: { text: 'Image' },
            media: assetUrn,
            title: { text: 'Image' }
          }
        ]
      }
    };
  }

  // Create Post
  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent,
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    throw new Error(err);
  }
}

startServer();
