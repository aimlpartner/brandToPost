import path from 'path';
import fs from 'fs/promises';
import { db } from '../config/firebase';
import { tempImages } from '../utils/firestoreStorage';

// Reusable helper to publish a post with optional image to LinkedIn
export async function publishPostToLinkedIn(
  token: string,
  text: string,
  imageUrl?: string | null,
  customAuthorUrn?: string
): Promise<void> {
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

// Reusable helper to publish a photo post to Instagram Graph API
export async function publishToInstagramGraphAPI(
  token: string,
  text: string,
  imageUrl: string,
  appHost: string
): Promise<string> {
  const baseUrl = appHost || process.env.APP_URL || '';
  if (!baseUrl) {
    throw new Error('Server URL configuration is loaded incorrectly. Please make sure APP_URL is set.');
  }

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

  let resolvedImageUrl = imageUrl;
  if (!resolvedImageUrl) {
    resolvedImageUrl = 'https://placehold.co/1080x1080/4f46e5/ffffff.png?text=Creative+Campaign';
  }

  // Convert local base64 / data URLs to public URL paths
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

  // Pause briefly to let Instagram's servers load and analyze the asset
  await new Promise((resolve) => setTimeout(resolve, 3000));

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
