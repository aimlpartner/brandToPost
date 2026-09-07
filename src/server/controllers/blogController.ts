import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { admin, db } from '../config/firebase';

export const serverBlogsCache: any[] = [];
import { getBlogSettings, setBlogSettings, logBackendTokenUsage } from '../utils/firestoreStorage';
import { publishBlogToExternalSite, isValidBlogApiKey } from '../services/blogService';
import { executeOpenAIImageGeneration } from '../services/aiService';
import { generateContextualBlogImagePrompt } from '../services/autoCampaignService';
import { saveImageLocalAndDb } from '../utils/imageUtils';

export async function handleGetBlogConfig(req, res) {
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
  }

export async function handlePostBlogConfig(req, res) {
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
  }

export async function handlePostBlogPublish(req, res) {
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
  }

export async function handlePostBlogRegenerateImage(req, res) {
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
  }

export async function handlePublicBlogPublish(req: express.Request, res: express.Response) {
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
  }

export async function handlePublicBlogList(req: express.Request, res: express.Response) {
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
  }

export async function handlePublicBlogGenerateAi(req: express.Request, res: express.Response) {
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
  }
