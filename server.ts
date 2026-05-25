import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import * as adminNamespace from 'firebase-admin';
const admin: typeof adminNamespace = (adminNamespace as any).default || adminNamespace;

// --- Firebase Admin Initialization   ---
let db: adminNamespace.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    try {
      // Clean up common escaping issues introduced by hosting environments (like Hostinger/cPanel)
      const startIndex = serviceAccountStr.indexOf('{');
      const endIndex = serviceAccountStr.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        serviceAccountStr = serviceAccountStr.slice(startIndex, endIndex + 1);
      }
      serviceAccountStr = serviceAccountStr.replace(/\\"/g, '"');
      serviceAccountStr = serviceAccountStr.replace(/\\\\n/g, '\\n');

      const serviceAccount = JSON.parse(serviceAccountStr);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      console.log('[Firebase Admin] Initialized successfully with Service Account. Using Firestore for state.');
    } catch (parseError) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT. Raw value preview:', process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 100));
      throw parseError;
    }
  } else {
    console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT not found. Initializing with Project ID for Auth only. Falling back to in-memory state for data.');
    admin.initializeApp({ projectId: 'map-api-459818' });
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error);
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
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    return doc.exists ? doc.data()?.[platform] : null;
  }
  if (platform === 'linkedin') return globalLinkedinTokens[productId];
  if (platform === 'facebook') return globalFacebookTokens[productId];
  if (platform === 'instagram') return globalInstagramTokens[productId];
  if (platform === 'reddit') return globalRedditTokens[productId];
  return null;
}

async function setToken(productId: string, platform: string, token: string) {
  if (db) {
    await db.collection('server_tokens').doc(productId).set({ [platform]: token }, { merge: true });
  } else {
    if (platform === 'linkedin') globalLinkedinTokens[productId] = token;
    if (platform === 'facebook') globalFacebookTokens[productId] = token;
    if (platform === 'instagram') globalInstagramTokens[productId] = token;
    if (platform === 'reddit') globalRedditTokens[productId] = token;
  }
}

// --- Scheduling State (Fallback) ---
let globalLinkedinTokens: Record<string, string> = {};
let globalFacebookTokens: Record<string, string> = {};
let globalInstagramTokens: Record<string, string> = {};
let globalRedditTokens: Record<string, string> = {};
let scheduleConfigs: Record<string, { enabled: boolean, timeUtc: string }> = {};
let postQueue: Array<{ id: string, text: string, campaignId: string, platform: string, productId: string, day?: string }> = [];
let lastPostedDates: Record<string, string> = {};

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
    if (db) {
      const snapshot = await db.collection(`server_queues/${productId}/posts`).orderBy('createdAt', 'asc').limit(1).get();
      if (!snapshot.empty) {
        post = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    } else {
      post = postQueue.find(p => p.productId === productId);
    }

    if (!post) continue;

    if (db) {
      await db.collection('server_schedules').doc(productId).update({ lastPostedDate: currentDateUtc });
      await db.collection(`server_queues/${productId}/posts`).doc(post.id).delete();
    } else {
      lastPostedDates[productId] = currentDateUtc;
      postQueue = postQueue.filter(p => p.id !== post.id);
    }

    const token = await getToken(productId, post.platform);
    if (!token) {
      console.error(`[Scheduler] No token found for product ${productId}, skipping post ${post.id}`);
      if (db) {
        await db.collection(`server_queues/${productId}/posts`).doc(post.id).set(post);
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
        const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user info');
        const userData = await userRes.json();
        const authorUrn = `urn:li:person:${userData.sub}`;

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
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: { text: post.text },
                shareMediaCategory: 'NONE'
              }
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
          })
        });

        if (!postRes.ok) {
          const errorText = await postRes.text();
          console.error('[Scheduler] Failed to publish scheduled post:', errorText);
          if (errorText.includes('DUPLICATE_POST')) {
            console.log(`[Scheduler] Post ${post.id} is a duplicate, removing from queue.`);
          } else {
            if (db) {
              await db.collection(`server_queues/${productId}/posts`).doc(post.id).set(post);
              await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
            } else {
              postQueue.unshift(post);
              lastPostedDates[productId] = "";
            }
          }
        } else {
          console.log('[Scheduler] Successfully published scheduled post:', post.id);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error in scheduled post:', err);
      if (db) {
        await db.collection(`server_queues/${productId}/posts`).doc(post.id).set(post);
        await db.collection('server_schedules').doc(productId).update({ lastPostedDate: "" });
      } else {
        postQueue.unshift(post);
        lastPostedDates[productId] = "";
      }
    }
  }
}, 30000);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- Auth Middleware ---
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      if (!admin.apps.length) {
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

  // --- AI Proxy Endpoint ---
  app.post('/api/ai/generate', requireAuth, async (req, res) => {
    try {
      const { model, contents, config } = req.body;

      // Use the API key from environment variables, fallback to the hardcoded one provided by user
      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCYK86PmlReHZSQ2dTNeKRhYL6IG8Jc6IM";

      if (!apiKey) {
        return res.status(500).json({ error: 'Server API key not configured. Please set GEMINI_API_KEY in settings.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      res.json({
        text: response.text,
        usageMetadata: response.usageMetadata,
        candidates: response.candidates
      });
    } catch (error: any) {
      console.error('[AI Proxy] Error:', error);
      res.status(500).json({ error: error.message });
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
      const { text, campaignId, platform, productId, day, date } = req.body;
      if (!productId) return res.status(400).json({ error: 'productId required' });

      const id = Math.random().toString(36).substring(7);
      await addToQueue({ id, text, campaignId, platform, productId, day, date });

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

  // LinkedIn OAuth Endpoints
  app.get('/api/auth/linkedin/url', (req, res) => {
    const productId = req.query.productId as string;
    // Determine the base URL dynamically from req or use APP_URL
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    const stateObj = { r: Math.random().toString(36).substring(7), productId };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      redirect_uri: redirectUri,
      state: stateStr,
      scope: 'openid profile w_member_social email',
    });

    res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` });
  });

  app.get('/api/auth/linkedin/callback', async (req, res) => {
    const { code, state } = req.query;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    try {
      let productId = 'default';
      if (state) {
        try {
          const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
          if (stateObj.productId) productId = stateObj.productId;
        } catch (e) {
          console.error("Failed to parse state", e);
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
        res.status(400).send('Failed to get token: ' + JSON.stringify(tokenData));
      }
    } catch (e: any) {
      res.status(500).send('Error during callback: ' + e.message);
    }
  });

  app.get('/api/linkedin/status', requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`linkedin_token_${productId}`];
      if (cookieToken) {
        await setToken(productId, 'linkedin', cookieToken);
      }
      const token = await getToken(productId, 'linkedin');
      res.json({ connected: !!token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/linkedin/publish', requireAuth, async (req, res) => {
    try {
      const { text, productId, imageUrl } = req.body;
      const token = await getToken(productId, 'linkedin') || req.cookies[`linkedin_token_${productId}`];
      if (!token) return res.status(401).json({ error: 'Not connected to LinkedIn' });
      // 1. Get user info to get the URN
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to fetch user info from LinkedIn');
      }

      const userData = await userRes.json();
      const authorUrn = `urn:li:person:${userData.sub}`;

      let specificContent: any = {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE'
        }
      };

      // 2. Handle image upload if imageUrl is provided
      if (imageUrl) {
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

        if (imageUrl.startsWith('data:')) {
          const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contentType = matches[1];
            imageBuffer = Buffer.from(matches[2], 'base64');
          } else {
            throw new Error('Invalid base64 image data');
          }
        } else {
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error('Failed to fetch image from URL');
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

        // Update specificContent for image
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

      // 3. Create Post
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

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Facebook OAuth Endpoints
  app.get('/api/auth/facebook/url', (req, res) => {
    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    const stateObj = { r: Math.random().toString(36).substring(7), productId };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID || '',
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
      if (state) {
        try {
          const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
          if (stateObj.productId) productId = stateObj.productId;
        } catch (e) { }
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
      const token = await getToken(productId, 'facebook');
      res.json({ connected: !!token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Instagram OAuth Endpoints
  app.get('/api/auth/instagram/url', (req, res) => {
    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

    const stateObj = { r: Math.random().toString(36).substring(7), productId };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID || '',
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
      if (state) {
        try {
          const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
          if (stateObj.productId) productId = stateObj.productId;
        } catch (e) { }
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
      const token = await getToken(productId, 'instagram');
      res.json({ connected: !!token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Reddit OAuth Endpoints
  app.get('/api/auth/reddit/url', (req, res) => {
    const productId = req.query.productId as string;
    const rawBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/reddit/callback`;

    const stateObj = { r: Math.random().toString(36).substring(7), productId };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const params = new URLSearchParams({
      client_id: process.env.REDDIT_CLIENT_ID || '',
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
      if (state) {
        try {
          const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
          if (stateObj.productId) productId = stateObj.productId;
        } catch (e) { }
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
      const token = await getToken(productId, 'reddit');
      res.json({ connected: !!token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Email Sending Endpoint
  app.post('/api/campaigns/email', requireAuth, async (req, res) => {
    const { email, pdfBase64, campaignTheme } = req.body;
    if (!email || !pdfBase64) {
      return res.status(400).json({ error: 'Email and pdfBase64 are required' });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        error: 'SMTP credentials not configured. Please add SMTP_USER and SMTP_PASS in the app settings to enable email delivery.'
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Remove the data:application/pdf;base64, prefix if present
      const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

      const info = await transporter.sendMail({
        from: '"Campaign Generator" <noreply@campaigngenerator.com>',
        to: email,
        subject: `Your Approved Campaign: ${campaignTheme || 'Strategy'}`,
        text: 'Attached is your approved campaign strategy.',
        html: '<p>Attached is your approved campaign strategy.</p>',
        attachments: [
          {
            filename: 'Campaign_Strategy.pdf',
            content: base64Data,
            encoding: 'base64'
          }
        ]
      });

      console.log("Message sent: %s", info.messageId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Scraping Endpoint for Brand DNA
  app.post('/api/scrape', requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const fetchRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch URL: ${fetchRes.statusText}`);
      }

      const html = await fetchRes.text();

      // We'll use a dynamic import for cheerio to avoid issues if it's not fully loaded
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);

      // Extract basic text content (limit to first 5000 chars to avoid huge payloads)
      $('script, style, noscript, iframe, img, svg').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

      // Extract inline styles and linked stylesheets (just the URLs or raw content)
      let cssContent = '';

      // Get inline styles from head
      $('head style').each((_, el) => {
        cssContent += $(el).html() + '\n';
      });

      // Also try to find font-family declarations in inline styles
      const fontFamilies = new Set<string>();
      const fontRegex = /font-family:\s*([^;\}]+)/gi;
      let match;
      while ((match = fontRegex.exec(cssContent)) !== null) {
        fontFamilies.add(match[1].trim());
      }

      // Also check Google Fonts links
      $('link[href*="fonts.googleapis.com"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const familyMatch = href.match(/family=([^&:]+)/g);
          if (familyMatch) {
            familyMatch.forEach(f => {
              fontFamilies.add(f.replace('family=', '').replace(/\+/g, ' '));
            });
          }
        }
      });

      res.json({
        success: true,
        textContent,
        cssContent: cssContent.substring(0, 2000), // Limit CSS size
        extractedFonts: Array.from(fontFamilies)
      });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const shouldServeStatic = process.env.NODE_ENV === "production" || process.env.npm_lifecycle_event === "start";

  if (shouldServeStatic) {
    console.log('[Server] Serving production build from dist.');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Running Vite middleware for development.');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
