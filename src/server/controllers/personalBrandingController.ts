import { Request, Response } from 'express';
import {
  synthesizeFounderVoiceService,
  researchBrandLinksService,
  generateLinkedInPostService,
  suggestLinkedInTopicsService,
} from '../services/personalBrandingService';

export async function synthesizeVoiceController(req: Request, res: Response) {
  try {
    const { name, description, documentText } = req.body;
    console.log(`[PersonalBranding] Synthesizing voice DNA for: "${name}"`);

    const result = await synthesizeFounderVoiceService(name, description, documentText);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[PersonalBranding] Voice DNA synthesis error:', err);
    return res.status(500).json({
      error: 'Failed to synthesize Founder Voice DNA',
      message: err?.message || String(err),
    });
  }
}

export async function groundingResearchController(req: Request, res: Response) {
  try {
    const { urls, brandType = 'promotional' } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of website urls.' });
    }

    console.log(`[PersonalBranding] Running grounding research on ${urls.length} links (${brandType})`);
    const brands = await researchBrandLinksService(urls, brandType);
    return res.status(200).json({ brands });
  } catch (err: any) {
    console.error('[PersonalBranding] Grounding research error:', err);
    return res.status(500).json({
      error: 'Failed to complete grounding research on brand links',
      message: err?.message || String(err),
    });
  }
}

export async function generatePostController(req: Request, res: Response) {
  try {
    const {
      postKind = 'personal',
      founderName = 'Founder',
      voiceDna,
      topic,
      brand,
      promotionalUrl,
      styleFormat,
    } = req.body;

    console.log(`[PersonalBranding] Generating LinkedIn post (${postKind}, format: ${styleFormat || 'default'})`);
    const result = await generateLinkedInPostService({
      postKind,
      founderName,
      voiceDna,
      topic,
      brand,
      promotionalUrl,
      styleFormat,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[PersonalBranding] LinkedIn post generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate LinkedIn post',
      message: err?.message || String(err),
    });
  }
}

export async function suggestTopicsController(req: Request, res: Response) {
  try {
    const { founderName = 'Founder', voiceDna, brand, postKind = 'personal' } = req.body;
    const result = await suggestLinkedInTopicsService({
      founderName,
      voiceDna,
      brand,
      postKind,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[PersonalBranding] Suggest topics error:', err);
    return res.status(500).json({
      error: 'Failed to suggest topics',
      message: err?.message || String(err),
    });
  }
}
