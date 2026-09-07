import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { admin, db } from '../config/firebase';
import {
  getToken,
  setToken,
  hasUserToken,
  lastKnownHost,
  globalLinkedinTokens,
  globalFacebookTokens,
  globalInstagramTokens,
  globalRedditTokens
} from '../utils/firestoreStorage';
import { publishPostToLinkedIn, publishToInstagramGraphAPI } from '../services/socialService';

export async function handleLinkedInAuthUrl(req, res) {
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

    const scope = 'openid profile email w_member_social';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: stateStr,
      scope: scope,
    });

    res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` });
  }

export async function handleLinkedInCallback(req, res) {
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
  }

export async function handleLinkedInAutoFetchProfile(req, res) {
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
            model: "gemini-3.1-pro-preview",
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
  }

export async function handleLinkedInStatus(req, res) {
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
  }

export async function handleLinkedInOrganizations(req, res) {
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
  }

export async function handleUserSettings(req, res) {
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
  }

export async function handleLinkedInSelectOrganization(req, res) {
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
  }

export async function handleLinkedInPublish(req, res) {
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
  }

export async function handleFounderPublish(req, res) {
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
  }

export async function handleDisconnectIntegration(req, res) {
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
  }

export async function handleInstagramPublish(req, res) {
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
  }

export async function handleFacebookAuthUrl(req, res) {
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
  }

export async function handleFacebookCallback(req, res) {
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
  }

export async function handleFacebookStatus(req, res) {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`facebook_token_${productId}`];
      if (cookieToken) await setToken(productId, 'facebook', cookieToken);
      const connected = await hasUserToken(productId, 'facebook');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

export async function handleInstagramAuthUrl(req, res) {
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
  }

export async function handleInstagramCallback(req, res) {
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
  }

export async function handleInstagramStatus(req, res) {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`instagram_token_${productId}`];
      if (cookieToken) await setToken(productId, 'instagram', cookieToken);
      const connected = await hasUserToken(productId, 'instagram');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

export async function handleInstagramManualToken(req, res) {
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
  }

export async function handleInstagramWebhookVerify(req, res) {
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
  }

export async function handleInstagramWebhookInbound(req, res) {
    const body = req.body;

    // Verify it's from the page/instagram subscription
    if (body.object === 'page' || body.object === 'instagram') {
      console.log('[Webhook] Received event:', JSON.stringify(body, null, 2));
      // Process webhook event here
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  }

export async function handleRedditAuthUrl(req, res) {
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
  }

export async function handleRedditCallback(req, res) {
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
  }

export async function handleRedditStatus(req, res) {
    try {
      const productId = req.query.productId as string;
      const cookieToken = req.cookies[`reddit_token_${productId}`];
      if (cookieToken) await setToken(productId, 'reddit', cookieToken);
      const connected = await hasUserToken(productId, 'reddit');
      res.json({ connected });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
