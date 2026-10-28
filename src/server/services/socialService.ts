import { db } from '../config/firebase';
import { tempImages } from '../utils/firestoreStorage';
import { resolveImageBuffer } from '../utils/imageUtils';

// Reusable helper to publish a post with optional image to LinkedIn
export async function publishPostToLinkedIn(
  token: string,
  text: string,
  imageUrl?: string | null,
  customAuthorUrn?: string
): Promise<void> {
  let authorUrn = customAuthorUrn?.trim();

  if (!authorUrn) {
    // Fallback to user URN if no custom URN is provided
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userRes.ok) {
      const err = await userRes.text();
      throw new Error(`Failed to fetch user info from LinkedIn (${userRes.status}): ${err}`);
    }

    const userData = await userRes.json();
    if (!userData?.sub) {
      throw new Error('LinkedIn user info did not return a valid sub identity');
    }
    authorUrn = `urn:li:person:${userData.sub}`;
  } else if (!authorUrn.startsWith('urn:li:')) {
    if (/^\d+$/.test(authorUrn)) {
      authorUrn = `urn:li:organization:${authorUrn}`;
    } else {
      authorUrn = `urn:li:person:${authorUrn}`;
    }
  }

  let specificContent: any = {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text },
      shareMediaCategory: 'NONE'
    }
  };

  let validImageUrl = imageUrl?.trim() || null;
  if (typeof validImageUrl === 'string' && (validImageUrl.startsWith('data:image/svg') || validImageUrl.endsWith('.svg'))) {
    console.warn('[publishPostToLinkedIn] Received SVG which is unsupported by LinkedIn feedshare-image API. Bypassing SVG media attachment.');
    validImageUrl = null;
  }

  if (validImageUrl) {
    const resolved = await resolveImageBuffer(validImageUrl);
    if (resolved && resolved.buffer && resolved.buffer.length > 0) {
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
        throw new Error(`Failed to register image upload with LinkedIn (${registerRes.status}): ${err}`);
      }

      const registerData = await registerRes.json();
      const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const assetUrn = registerData.value?.asset;

      if (!uploadUrl || !assetUrn) {
        throw new Error('LinkedIn did not return valid asset upload coordinates');
      }

      // Upload image binary
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': resolved.mimeType || 'image/png'
        },
        body: new Uint8Array(resolved.buffer)
      });

      if (!uploadRes.ok) {
        const upErr = await uploadRes.text();
        throw new Error(`Failed to upload image to LinkedIn (${uploadRes.status}): ${upErr}`);
      }

      specificContent = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: { text: 'Creative post visual' },
              media: assetUrn,
              title: { text: 'Visual Post' }
            }
          ]
        }
      };
    } else {
      console.warn(`[publishPostToLinkedIn] Could not resolve image buffer for ${validImageUrl}. Posting text-only.`);
    }
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
    throw new Error(`LinkedIn publishing failed (${postRes.status}): ${err}`);
  }
}

// Reusable helper to publish a photo post to Instagram Graph API
export async function publishToInstagramGraphAPI(
  token: string,
  text: string,
  imageUrl: string,
  appHost: string
): Promise<string> {
  const baseUrl = (appHost || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  // 1. Fetch Facebook Pages linked to this access token
  const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token}`);
  if (!pagesRes.ok) {
    const errorBody = await pagesRes.text();
    throw new Error(`Meta Graph API returned error fetching pages: ${errorBody}. Make sure your token has correct page access permissions.`);
  }
  const pagesData = await pagesRes.json();
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

  let resolvedImageUrl = (imageUrl || '').trim();
  if (!resolvedImageUrl || resolvedImageUrl.startsWith('data:image/svg') || resolvedImageUrl.endsWith('.svg')) {
    resolvedImageUrl = 'https://placehold.co/1080x1080/4f46e5/ffffff.png?text=Creative+Campaign';
  }

  // Convert local base64 / data URLs to public URL paths
  if (resolvedImageUrl.startsWith('data:image/')) {
    const tempId = Math.random().toString(36).substring(2, 9);
    tempImages[tempId] = resolvedImageUrl;
    resolvedImageUrl = `${baseUrl}/public/temp-image/${tempId}.png`;
  } else if (resolvedImageUrl.startsWith('/')) {
    // Check if Firestore has a public Google Cloud Storage URL for this imageId
    let foundStorageUrl: string | null = null;
    const idMatch = resolvedImageUrl.match(/(?:campaign|whatsapp)_images\/([^/.]+)/) ||
                    resolvedImageUrl.match(/\/api\/(?:campaign|whatsapp)\/images\/([^/.]+)/) ||
                    resolvedImageUrl.match(/\b(img_[a-zA-Z0-9_-]+)\b/);
    if (idMatch && db) {
      try {
        const imageId = idMatch[1].replace(/\.png$/i, '');
        let docSnap = await db.collection('campaign_images').doc(imageId).get();
        if (!docSnap.exists) {
          docSnap = await db.collection('whatsapp_images').doc(imageId).get();
        }
        if (docSnap.exists && docSnap.data()?.storageUrl) {
          foundStorageUrl = docSnap.data()!.storageUrl;
        }
      } catch (_) {}
    }

    if (foundStorageUrl) {
      resolvedImageUrl = foundStorageUrl;
    } else {
      resolvedImageUrl = `${baseUrl}${resolvedImageUrl}`;
    }
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

  // Poll Instagram container status until FINISHED (up to 12 seconds)
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code,status&access_token=${pageAccessToken}`
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const code = (statusData.status_code || '').toUpperCase();
        if (code === 'FINISHED') {
          break;
        } else if (code === 'ERROR' || code === 'EXPIRED') {
          throw new Error(`Instagram media container processing failed: ${statusData.status || code}`);
        }
      }
    } catch (pollErr: any) {
      if (pollErr.message?.includes('processing failed')) throw pollErr;
    }
  }

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
