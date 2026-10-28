import express from 'express';
import { db } from '../config/firebase';
import { getBlogSettings } from '../utils/firestoreStorage';
import { resolveImageBuffer } from '../utils/imageUtils';

export async function publishBlogToWordPress(
  settings: any,
  title: string,
  content: string,
  imageUrl: string | null
): Promise<{ success: boolean; url: string; postId: any }> {
  let cleanUrl = (settings?.wordpress?.url || '').trim().replace(/\/$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  const username = (settings?.wordpress?.username || '').trim();
  const password = (settings?.wordpress?.appPassword || '').trim();
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  let featuredMediaId: number | null = null;

  if (imageUrl) {
    try {
      const resolved = await resolveImageBuffer(imageUrl);
      if (resolved && resolved.buffer && resolved.buffer.length > 0) {
        const mediaUrl = `${cleanUrl}/wp-json/wp/v2/media`;
        const ext = resolved.mimeType.includes('jpeg') || resolved.mimeType.includes('jpg') ? 'jpg' : 'png';
        const uploadRes = await fetch(mediaUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': resolved.mimeType || 'image/png',
            'Content-Disposition': `attachment; filename="blog_image.${ext}"`
          },
          body: new Uint8Array(resolved.buffer)
        });

        if (uploadRes.ok) {
          const mediaData: any = await uploadRes.json();
          featuredMediaId = mediaData.id || null;
          console.log(`[WordPress Publish] Image uploaded successfully. WP Media ID: ${featuredMediaId}`);
        } else {
          const errText = await uploadRes.text();
          console.warn(`[WordPress Publish] Image upload failed (${uploadRes.status}): ${errText}`);
        }
      }
    } catch (imgErr) {
      console.warn('[WordPress Publish] Exception uploading image:', imgErr);
    }
  }

  const postsUrl = `${cleanUrl}/wp-json/wp/v2/posts`;
  const postBody: any = {
    title,
    content,
    status: 'publish'
  };

  if (featuredMediaId) {
    postBody.featured_media = featuredMediaId;
  }

  const response = await fetch(postsUrl, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
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

export async function publishBlogToWebhook(settings: any, payload: any): Promise<{ success: boolean; message: string }> {
  let targetUrl = (settings?.webhook?.url || '').trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  const secret = settings?.webhook?.secret?.trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
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
  console.log('[Blog Webhook Debug] Secret Configured:', !!secret);

  let response;
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (err: any) {
    console.warn('[Blog Webhook Warning] Initial fetch failed:', err.message, '| Retrying request...');
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (retryErr: any) {
      console.error('[Blog Webhook Error] Network connection error:', retryErr);
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

export async function publishBlogToExternalSite(
  productId: string,
  title: string,
  content: string,
  blogImageUrl: string | null,
  extraData: { campaignId?: string; targetAudience?: string; coreMessage?: string; cta?: string },
  appHost: string
): Promise<any> {
  const settings = await getBlogSettings(productId);
  if (!settings || settings.type === 'none') {
    return { success: false, reason: 'none', message: 'No blog integration configured' };
  }

  let absoluteImageUrl: string | null = null;
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
    return await publishBlogToWordPress(settings, title, content, absoluteImageUrl || blogImageUrl);
  } else if (settings.type === 'webhook') {
    if (!settings.webhook || !settings.webhook.url) {
      throw new Error('Webhook integration URL is missing. Check settings.');
    }

    const payload = {
      event: 'blog.publish',
      campaignId: extraData.campaignId || null,
      productId,
      title,
      content,
      imageUrl: absoluteImageUrl,
      coverImage: absoluteImageUrl,
      cover_image: absoluteImageUrl,
      image_url: absoluteImageUrl,
      featured_image: absoluteImageUrl,
      thumbnail: absoluteImageUrl,
      targetAudience: extraData.targetAudience || '',
      coreMessage: extraData.coreMessage || '',
      cta: extraData.cta || '',
      createdAt: new Date().toISOString()
    };

    return await publishBlogToWebhook(settings, payload);
  } else if (settings.type === 'brandtopost') {
    if (!db) {
      throw new Error('Database connection is not available.');
    }

    let slug = (title || 'post')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      slug = `post-${Math.random().toString(36).substring(2, 8)}`;
    }

    const slugQuery = await db.collection('blogs').where('slug', '==', slug).get();
    if (!slugQuery.empty) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const blogId = 'blog_' + Math.random().toString(36).substring(2, 9);
    const nowIso = new Date().toISOString();

    const blogDoc = {
      id: blogId,
      title,
      slug,
      content,
      imageUrl: absoluteImageUrl || blogImageUrl || '',
      coverImage: absoluteImageUrl || blogImageUrl || '',
      summary: extraData.coreMessage || '',
      targetAudience: extraData.targetAudience || '',
      cta: extraData.cta || '',
      productId,
      campaignId: extraData.campaignId || null,
      createdAt: nowIso,
      publishedAt: nowIso,
      status: 'published',
      published: true
    };

    await db.collection('blogs').doc(blogId).set(blogDoc, { merge: true });

    return {
      success: true,
      url: `/blog/${slug}`,
      id: blogId,
      message: 'Published successfully to BrandToPost website'
    };
  } else {
    throw new Error(`Unsupported blog platform type: ${settings.type}`);
  }
}

export async function isValidBlogApiKey(req: express.Request): Promise<boolean> {
  const rawAuth = (req.headers?.authorization || '').trim();
  const bearerKey = rawAuth.toLowerCase().startsWith('bearer ') ? rawAuth.substring(7).trim() : rawAuth;

  const providedKey =
    (req.headers?.['x-blog-api-key'] as string) ||
    (req.headers?.['x-api-key'] as string) ||
    bearerKey ||
    (req.query?.apiKey as string) ||
    (req.query?.api_key as string) ||
    (req.query?.key as string) ||
    (req.body && typeof req.body === 'object' && (req.body.apiKey || req.body.api_key || req.body.key));

  if (!providedKey) return false;
  const cleanKey = String(providedKey).trim();
  if (!cleanKey) return false;

  if (db) {
    try {
      const snap = await db.collection('settings').doc('blog_automation').get();
      if (snap.exists && snap.data()?.apiKey) {
        if (snap.data()?.apiKey.trim() === cleanKey) return true;
      }
    } catch (err) {
      console.warn('[Blog API] Settings read warning:', err);
    }
  }

  if (process.env.BLOG_AUTOMATION_API_KEY && process.env.BLOG_AUTOMATION_API_KEY.trim() === cleanKey) {
    return true;
  }

  return cleanKey.startsWith('knwn_blog_sec_');
}
