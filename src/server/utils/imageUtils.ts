import path from 'path';
import fs from 'fs/promises';
import { admin, db } from '../config/firebase';

export function normalizePublicHttpUrl(rawUrl: unknown): string {
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

export async function saveImageLocalAndDb(
  imageId: string,
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<void> {
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
        prompt: prompt || '',
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

export async function stampBrandLogoOnImage(
  base64Data: string,
  logoUrl?: string,
  position: string = 'top-left'
): Promise<string> {
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

export function generateFallbackBrandedCanvas(
  headline: string,
  subtext: string,
  primaryColor: string,
  secondaryColor: string,
  logoUrl?: string
): string {
  const cleanHeadline = (headline || 'EXECUTIVE FOUNDER INSIGHT').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanSubtext = (subtext || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const primary = primaryColor || '#7C3AED';

  const logoSvg = logoUrl
    ? `<img src="${logoUrl}" style="height:42px;object-fit:contain;" />`
    : `<div style="color:${primary};font-weight:900;font-size:20px;letter-spacing:0.15em;">BRAND TOPIC</div>`;

  const rawHtml = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:1080px;height:1080px;background:#08080c;display:flex;flex-direction:column;justify-content:space-between;padding:90px;box-sizing:border-box;font-family:'Inter',sans-serif;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
    <div style="position:absolute;top:-150px;right:-150px;width:600px;height:600px;background:${primary};opacity:0.12;filter:blur(110px);border-radius:50%;"></div>
    <div style="position:relative;z-index:10;display:flex;flex-direction:column;gap:36px;">
      <div style="display:inline-block;background:${primary}22;color:${primary};font-size:14px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;padding:8px 20px;border-radius:100px;border:1px solid ${primary}44;width:fit-content;">FOUNDER PERSPECTIVE</div>
      <h2 style="color:#ffffff;font-weight:850;font-size:52px;line-height:1.22;margin:0;letter-spacing:-0.02em;">${cleanHeadline}</h2>
      ${cleanSubtext ? `<p style="color:#94a3b8;font-weight:500;font-size:24px;line-height:1.5;margin:0;">${cleanSubtext}</p>` : ''}
    </div>
    <div style="position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding-top:44px;border-top:1px solid rgba(255,255,255,0.12);">
      ${logoSvg}
      <div style="width:48px;height:4px;background:${primary};border-radius:2px;"></div>
    </div>
  </div>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
    <foreignObject width="1080" height="1080">
      ${rawHtml}
    </foreignObject>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
