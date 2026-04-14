import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import path from 'path';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

// --- Scheduling State ---
let globalLinkedinTokens: Record<string, string> = {}; // productId -> token
let globalFacebookTokens: Record<string, string> = {};
let globalInstagramTokens: Record<string, string> = {};
let globalRedditTokens: Record<string, string> = {};
let scheduleConfigs: Record<string, { enabled: boolean, timeUtc: string }> = {}; // productId -> config
let postQueue: Array<{ id: string, text: string, campaignId: string, platform: string, productId: string, day?: string }> = [];
let lastPostedDates: Record<string, string> = {}; // productId -> "YYYY-MM-DD" in UTC

// --- Cron Job for Scheduled Posting ---
setInterval(async () => {
  if (postQueue.length === 0) return;

  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeUtc = `${hours}:${minutes}`;
  const currentDateUtc = now.toISOString().split('T')[0];

  // Process queue for each product
  const productsToProcess = new Set(postQueue.map(p => p.productId));

  for (const productId of productsToProcess) {
    const config = scheduleConfigs[productId] || { enabled: false, timeUtc: "14:00" };
    if (!config.enabled) continue;

    if (currentTimeUtc === config.timeUtc && lastPostedDates[productId] !== currentDateUtc) {
      // Find the first post for this product
      const postIndex = postQueue.findIndex(p => p.productId === productId);
      if (postIndex !== -1) {
        lastPostedDates[productId] = currentDateUtc;
        const post = postQueue.splice(postIndex, 1)[0]; // Remove from queue
        
        const token = globalLinkedinTokens[post.productId];
        if (!token) {
          console.error(`[Scheduler] No token found for product ${post.productId}, skipping post ${post.id}`);
          postQueue.unshift(post);
          lastPostedDates[productId] = "";
          continue;
        }

        try {
          console.log(`[Scheduler] Attempting to publish post ${post.id} to ${post.platform}...`);
          // Publish to LinkedIn
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
            
            // If it's a duplicate post error, don't put it back in the queue
            if (errorText.includes('DUPLICATE_POST')) {
              console.log(`[Scheduler] Post ${post.id} is a duplicate, removing from queue.`);
            } else {
              // Put it back in the queue if failed
              postQueue.unshift(post);
              lastPostedDates[productId] = ""; // Allow retrying
            }
          } else {
            console.log('[Scheduler] Successfully published scheduled post:', post.id);
          }
        } catch (err) {
          console.error('[Scheduler] Error in scheduled post:', err);
          postQueue.unshift(post);
          lastPostedDates[productId] = "";
        }
      }
    }
  }
}, 30000); // Check every 30 seconds

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- AI Proxy Endpoint ---
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      
      // Use the API key provided by the user to bypass environment variable issues
      // User explicitly requested to hardcode this and stated they will revoke it later.
      const apiKey = "AIzaSyCYK86PmlReHZSQ2dTNeKRhYL6IG8Jc6IM";
      
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
  app.get('/api/schedule', (req, res) => {
    const productId = req.query.productId as string;
    const config = scheduleConfigs[productId] || { enabled: false, timeUtc: "14:00" };
    const queue = postQueue.filter(p => p.productId === productId);
    res.json({ config, queue });
  });

  app.post('/api/schedule', (req, res) => {
    const { enabled, timeUtc, productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    
    if (!scheduleConfigs[productId]) {
      scheduleConfigs[productId] = { enabled: false, timeUtc: "14:00" };
    }
    
    if (enabled !== undefined) scheduleConfigs[productId].enabled = enabled;
    if (timeUtc !== undefined) scheduleConfigs[productId].timeUtc = timeUtc;
    
    res.json({ success: true, config: scheduleConfigs[productId] });
  });

  app.post('/api/schedule/queue', (req, res) => {
    const { text, campaignId, platform, productId, day, date } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    
    const id = Math.random().toString(36).substring(7);
    postQueue.push({ id, text, campaignId, platform, productId, day, date });
    
    if (req.cookies[`linkedin_token_${productId}`]) {
      globalLinkedinTokens[productId] = req.cookies[`linkedin_token_${productId}`];
    }
    
    const queue = postQueue.filter(p => p.productId === productId);
    res.json({ success: true, queue });
  });

  app.delete('/api/schedule/queue/:id', (req, res) => {
    const productId = req.query.productId as string;
    postQueue = postQueue.filter(q => q.id !== req.params.id);
    const queue = postQueue.filter(p => p.productId === productId);
    res.json({ success: true, queue });
  });

  app.post('/api/schedule/queue/remove', (req, res) => {
    const { campaignId, platform, productId, day } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    
    postQueue = postQueue.filter(q => {
      if (q.productId !== productId) return true;
      if (q.campaignId !== campaignId) return true;
      if (q.platform !== platform) return true;
      if (day && q.day !== day) return true;
      return false;
    });
    
    const queue = postQueue.filter(p => p.productId === productId);
    res.json({ success: true, queue });
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
        globalLinkedinTokens[productId] = tokenData.access_token;
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

  app.get('/api/linkedin/status', (req, res) => {
    const productId = req.query.productId as string;
    const cookieToken = req.cookies[`linkedin_token_${productId}`];
    if (cookieToken) {
      globalLinkedinTokens[productId] = cookieToken;
    }
    res.json({ connected: !!globalLinkedinTokens[productId] });
  });

  app.post('/api/linkedin/publish', async (req, res) => {
    const { text, productId, imageUrl } = req.body;
    const token = globalLinkedinTokens[productId] || req.cookies[`linkedin_token_${productId}`];
    if (!token) return res.status(401).json({ error: 'Not connected to LinkedIn' });

    try {
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
        } catch (e) {}
      }

      const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}`);
      const tokenData = await tokenRes.json();

      if (tokenData.access_token) {
        globalFacebookTokens[productId] = tokenData.access_token;
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

  app.get('/api/facebook/status', (req, res) => {
    const productId = req.query.productId as string;
    const cookieToken = req.cookies[`facebook_token_${productId}`];
    if (cookieToken) globalFacebookTokens[productId] = cookieToken;
    res.json({ connected: !!globalFacebookTokens[productId] });
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
        } catch (e) {}
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
        globalInstagramTokens[productId] = tokenData.access_token;
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

  app.get('/api/instagram/status', (req, res) => {
    const productId = req.query.productId as string;
    const cookieToken = req.cookies[`instagram_token_${productId}`];
    if (cookieToken) globalInstagramTokens[productId] = cookieToken;
    res.json({ connected: !!globalInstagramTokens[productId] });
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
        } catch (e) {}
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
        globalRedditTokens[productId] = tokenData.access_token;
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

  app.get('/api/reddit/status', (req, res) => {
    const productId = req.query.productId as string;
    const cookieToken = req.cookies[`reddit_token_${productId}`];
    if (cookieToken) globalRedditTokens[productId] = cookieToken;
    res.json({ connected: !!globalRedditTokens[productId] });
  });

  // Email Sending Endpoint
  app.post('/api/campaigns/email', async (req, res) => {
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
  app.post('/api/scrape', async (req, res) => {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
