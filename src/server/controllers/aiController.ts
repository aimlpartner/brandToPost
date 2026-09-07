import { Request, Response } from 'express';
import {
  generateAiContentService,
  generateCampaignImagesService,
  researchTrendsService,
  getDiscoveredTemplatesLibrary
} from '../services/aiService';
import {
  getSavedChannelTemplates,
  researchChannelTemplates,
  getSavedBlueprints,
  saveBlueprints,
  researchPlatformBatch,
  researchAllBlueprints,
  ResearchPlatform
} from '../services/blueprintResearchService';

export async function handleGenerateAiContent(req: Request, res: Response) {
  const { model, contents, config } = req.body;
  const abortController = new AbortController();
  let aborted = false;

  const handleAbort = () => {
    aborted = true;
    console.log(`[AI Proxy] Connection closed by client. Aborting Gemini API call for model: ${model}`);
    abortController.abort();
  };

  req.on('close', handleAbort);

  try {
    const userId = (req as any).user?.uid;
    const responseData = await generateAiContentService({
      model,
      contents,
      config,
      abortSignal: abortController.signal
    });

    if (aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }

    res.json(responseData);
  } catch (error: any) {
    if (aborted || error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('Cancel')) {
      console.log(`[AI Proxy] Gemini request aborted successfully.`);
      if (!res.headersSent) {
        res.status(499).json({ error: 'Client closed request' });
      }
    } else {
      console.error('[AI Proxy] Error:', error.message || error);
      const msg = error.message || 'Unknown AI generation error';
      const statusCode = msg.includes('429') || msg.includes('credits') || msg.includes('quota') ? 429 : 500;
      if (!res.headersSent) {
        res.status(statusCode).json({ error: msg });
      }
    }
  } finally {
    req.off('close', handleAbort);
  }
}

export async function handleGenerateCampaignImages(req: Request, res: Response) {
  try {
    const { prompts, logoUrl, logoPosition } = req.body;
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'prompts array is required.' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const userId = (req as any).user?.uid;

    const imageUrls = await generateCampaignImagesService(
      prompts,
      logoUrl,
      logoPosition
    );

    res.json({ success: true, imageUrls });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleResearchTrends(req: Request, res: Response) {
  try {
    const { focusNiche, singleStyle } = req.body || {};
    const userId = (req as any).user?.uid;

    const result = await researchTrendsService(focusNiche, singleStyle, userId);
    res.json(result);
  } catch (error: any) {
    console.error('[STEP 6/6 SERVER] Error during research trends operation:', error.message || error);
    res.status(500).json({ error: error.message || 'Error occurred during trends research' });
  }
}

export async function handleGetTemplatesLibrary(req: Request, res: Response) {
  try {
    const templates = await getDiscoveredTemplatesLibrary();
    res.json({ success: true, templates, count: templates.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleGetResearchChannelTemplates(req: Request, res: Response) {
  try {
    const channel = (req.query.channel as string) || 'linkedin';
    const result = await getSavedChannelTemplates(channel);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function handlePostResearchChannelTemplates(req: Request, res: Response) {
  try {
    const { channel = 'linkedin', count = 8, niche = 'B2B SaaS & Tech Leadership' } = req.body || {};
    const result = await researchChannelTemplates(channel, count, niche);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Channel Research Error]', error);
    res.status(500).json({ error: error.message || String(error) });
  }
}

export async function handleGetResearchBlueprints(req: Request, res: Response) {
  try {
    const result = await getSavedBlueprints();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function handlePostResearchBlueprints(req: Request, res: Response) {
  try {
    const { platform, action, allBlueprints, usedDescriptors = [] } = req.body || {};

    if (action === 'save_all' || Array.isArray(allBlueprints)) {
      const result = await saveBlueprints(Array.isArray(allBlueprints) ? allBlueprints : []);
      return res.json({ success: true, ...result });
    }

    const PLATFORMS = ['linkedin', 'x', 'instagram', 'reddit'];
    if (platform && PLATFORMS.includes(platform)) {
      const result = await researchPlatformBatch(platform as ResearchPlatform, usedDescriptors);
      return res.json({ success: true, ...result });
    }

    const result = await researchAllBlueprints();
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Grounding Research Error]', error);
    res.status(500).json({ error: error.message || String(error) });
  }
}
