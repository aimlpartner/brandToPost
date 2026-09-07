import { db } from '../config/firebase';
import { getToken } from '../utils/firestoreStorage';
import { publishPostToLinkedIn } from './socialService';

export async function publishItemInstantly(
  itemType: 'campaign' | 'post' | 'blog' | 'founder_post',
  itemData: any,
  productId: string
): Promise<void> {
  if (!db) return;
  const now = new Date().toISOString();
  console.log(`[Publish Engine] Publishing ${itemType} instantly for product ${productId}...`);

  if (itemType === 'blog') {
    const blogId = itemData.id || ('blog_' + Math.random().toString(36).substring(2, 9));
    const slug = (itemData.title || itemData.blogTitle || 'article')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const blogDoc = {
      ...itemData,
      id: blogId,
      slug: itemData.slug || slug,
      title: itemData.title || itemData.blogTitle || 'Untitled Blog Post',
      content: itemData.content || itemData.blogContent || '',
      coverImage:
        itemData.coverImage ||
        itemData.blogImageUrl ||
        itemData.imageUrl ||
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200',
      published: true,
      publishedAt: now,
      updatedAt: now,
      status: 'published',
      productId
    };

    await db.collection('blogs').doc(blogId).set(blogDoc, { merge: true });
    console.log(`[Publish Engine] Blog published: "${blogDoc.title}" (ID: ${blogId})`);

    // Check if Product has Webhook or WordPress integration configured
    try {
      const blogConfigSnap = await db
        .collection('products')
        .doc(productId)
        .collection('settings')
        .doc('blog_config')
        .get();
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
          }).catch((e) => console.error('[Publish Engine] Webhook error:', e));
        }
      }
    } catch (err) {
      console.warn('[Publish Engine] Webhook trigger check error:', err);
    }
  } else if (itemType === 'campaign') {
    const campaignId = itemData.id || ('camp_' + Math.random().toString(36).substring(2, 9));
    const campaignDoc = {
      ...itemData,
      id: campaignId,
      productId,
      status: 'active',
      publishedAt: now,
      isShared: true
    };
    await db.collection('campaigns').doc(campaignId).set(campaignDoc, { merge: true });
    console.log(`[Publish Engine] Campaign published: "${campaignDoc.theme || campaignDoc.title || 'Campaign'}" (ID: ${campaignId})`);
  } else if (itemType === 'post') {
    const postId = itemData.id || ('post_' + Math.random().toString(36).substring(2, 9));
    const postDoc = {
      ...itemData,
      id: postId,
      productId,
      status: 'published',
      publishedAt: now
    };
    await db.collection('posts').doc(postId).set(postDoc, { merge: true });
    console.log(`[Publish Engine] Social Post published (ID: ${postId})`);
  } else if (itemType === 'founder_post') {
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
