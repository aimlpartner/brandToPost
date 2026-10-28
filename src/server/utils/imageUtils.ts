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
  const primary = primaryColor || '#7C3AED';

  // Return a clean, sleek dark aesthetic background plate without baked-in typography
  // so the client-side Native dynamic layout engine can cleanly place typography dynamically.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#08080c" />
        <stop offset="50%" stop-color="#0e0e17" />
        <stop offset="100%" stop-color="#181829" />
      </linearGradient>
      <radialGradient id="glowGrad" cx="80%" cy="20%" r="60%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#08080c" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="glowGrad2" cx="20%" cy="80%" r="50%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#08080c" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#bgGrad)" />
    <circle cx="850" cy="200" r="450" fill="url(#glowGrad)" />
    <circle cx="200" cy="850" r="350" fill="url(#glowGrad2)" />
    <line x1="90" y1="960" x2="990" y2="960" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export interface ResolvedImageBuffer {
  buffer: Buffer;
  mimeType: string;
}

export async function resolveImageBuffer(
  imageUrl?: string | null,
  appHost?: string
): Promise<ResolvedImageBuffer | null> {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null;
  }

  const cleanUrl = imageUrl.trim();

  // 1. Data URL
  if (cleanUrl.startsWith('data:')) {
    const matches = cleanUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      let mimeType = matches[1];
      let buffer = Buffer.from(matches[2], 'base64');
      if (mimeType.includes('svg')) {
        try {
          const { Canvas, loadImage } = await import('skia-canvas');
          const img = await loadImage(buffer);
          const canvas = new Canvas(img.width || 1080, img.height || 1080);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const rasterBuf = await canvas.toBuffer('png');
          buffer = Buffer.from(rasterBuf as any);
          mimeType = 'image/png';
        } catch (_) {
          // Fallback to original SVG buffer if rasterization fails
        }
      }
      return { buffer, mimeType };
    }
    return null;
  }

  // 2. Extract potential image ID
  let imageId: string | null = null;
  const idMatch = cleanUrl.match(/(?:campaign|whatsapp)_images\/([^/.]+)/) ||
                  cleanUrl.match(/\/api\/(?:campaign|whatsapp)\/images\/([^/.]+)/) ||
                  cleanUrl.match(/\b(img_[a-zA-Z0-9_-]+)\b/);
  if (idMatch) {
    imageId = idMatch[1].replace(/\.png$/i, '');
  }

  // Check local filesystem first
  if (imageId) {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'campaign_images', `${imageId}.png`),
      path.join(process.cwd(), 'public', 'whatsapp_images', `${imageId}.png`),
      path.join(process.cwd(), 'public', cleanUrl.replace(/^\//, ''))
    ];
    for (const candPath of candidatePaths) {
      try {
        const buf = await fs.readFile(candPath);
        if (buf && buf.length > 0) {
          return { buffer: buf, mimeType: 'image/png' };
        }
      } catch (_) {}
    }

    // Check Firestore metadata / Cloud Storage
    if (db) {
      try {
        let docSnap = await db.collection('campaign_images').doc(imageId).get();
        if (!docSnap.exists) {
          docSnap = await db.collection('whatsapp_images').doc(imageId).get();
        }
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data?.base64Data) {
            return {
              buffer: Buffer.from(data.base64Data, 'base64'),
              mimeType: data.mimeType || 'image/png'
            };
          }
          if (data?.storageUrl) {
            try {
              const sRes = await fetch(data.storageUrl);
              if (sRes.ok) {
                const arr = await sRes.arrayBuffer();
                return {
                  buffer: Buffer.from(arr),
                  mimeType: sRes.headers.get('content-type') || data.mimeType || 'image/png'
                };
              }
            } catch (_) {}
          }
          if (data?.storagePath) {
            const bucketNames = ['map-api-459818.firebasestorage.app', 'map-api-459818.appspot.com'];
            for (const bName of bucketNames) {
              try {
                const bucket = admin.storage().bucket(bName);
                const file = bucket.file(data.storagePath);
                const [downBuf] = await file.download();
                if (downBuf && downBuf.length > 0) {
                  return { buffer: downBuf, mimeType: data.mimeType || 'image/png' };
                }
              } catch (_) {}
            }
          }
        }
      } catch (dbErr) {
        console.warn('[resolveImageBuffer] Firestore lookup note:', dbErr);
      }
    }
  }

  // 3. Absolute HTTP/HTTPS URL
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const resp = await fetch(cleanUrl);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        const mimeType = resp.headers.get('content-type') || 'image/jpeg';
        return { buffer: Buffer.from(arrayBuf), mimeType };
      }
    } catch (httpErr) {
      console.warn(`[resolveImageBuffer] Failed to fetch image over HTTP (${cleanUrl}):`, httpErr);
    }
  }

  // 4. Relative URL path (e.g., /api/campaign/images/...)
  if (cleanUrl.startsWith('/')) {
    const host = (appHost || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    try {
      const resp = await fetch(`${host}${cleanUrl}`);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        const mimeType = resp.headers.get('content-type') || 'image/png';
        return { buffer: Buffer.from(arrayBuf), mimeType };
      }
    } catch (relErr) {
      console.warn(`[resolveImageBuffer] Failed to fetch relative image via host (${host}${cleanUrl}):`, relErr);
    }
  }

  return null;
}
