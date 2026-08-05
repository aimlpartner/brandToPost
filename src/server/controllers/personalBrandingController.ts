import { Request, Response } from 'express';
import {
  synthesizeFounderVoiceService,
  researchBrandLinksService,
  generateLinkedInPostService,
  suggestLinkedInTopicsService,
  generatePersonalBrandImageService,
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
      selectedBrand,
      profileOverride,
      generateImage = true,
      imageStyle = 'content_visual',
      quoteText,
    } = req.body;

    const activeFounderName = profileOverride?.founderName || founderName;
    const activeVoiceDna = profileOverride?.voiceDna || voiceDna;
    const activeBrand = selectedBrand || brand;

    console.log(`[PersonalBranding] Generating LinkedIn post (${postKind}, format: ${styleFormat || 'default'}, imageStyle: ${imageStyle})`);
    const result = await generateLinkedInPostService({
      postKind,
      founderName: activeFounderName,
      voiceDna: activeVoiceDna,
      topic,
      brand: activeBrand,
      promotionalUrl,
      styleFormat,
    });

    let imageUrl: string | undefined = undefined;
    if (generateImage !== false) {
      try {
        console.log(`[PersonalBranding] ================= START POST ACCOMPANYING IMAGE =================`);
        console.log(`[PersonalBranding] Image Style: ${imageStyle}, Quote: "${quoteText || ''}"`);
        imageUrl = await generatePersonalBrandImageService({
          prompt: result.imagePrompt || result.headline || topic,
          headline: result.headline,
          subtext: result.subtext || (postKind === 'branded' ? activeBrand?.name : activeFounderName),
          quoteText: quoteText || result.quoteExcerpt || result.headline,
          imageStyle,
          brandColors: activeBrand?.brandColors || ['#08080C', '#FAF9F6', '#7C3AED'],
          logoUrl: activeBrand?.logoUrl || profileOverride?.logoUrl || profileOverride?.avatarUrl,
          brandName: activeBrand?.name || activeFounderName,
        });
        console.log(`[PersonalBranding] Image generated successfully for post! (Type: ${imageUrl ? (imageUrl.startsWith('data:') ? 'Base64 Data URI' : imageUrl) : 'NONE'})`);
      } catch (imgErr: any) {
        console.error('[PersonalBranding] Post image generation failed with error:', imgErr);
      }
    }

    const finalResponse = {
      ...result,
      content: result.postText,
      headline: result.headline,
      subtext: result.subtext,
      quoteExcerpt: result.quoteExcerpt,
      hashtags: result.hashtags,
      featuredUrl: result.featuredUrl,
      imagePrompt: result.imagePrompt,
      imageStyle,
      imageUrl: imageUrl || result.imageUrl,
    };

    console.log(`[PersonalBranding] Returning generated post to client (hasImage: ${!!finalResponse.imageUrl})`);
    return res.status(200).json(finalResponse);
  } catch (err: any) {
    console.error('[PersonalBranding] LinkedIn post generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate LinkedIn post',
      message: err?.message || String(err),
    });
  }
}

export async function generateImageController(req: Request, res: Response) {
  try {
    const {
      prompt,
      headline,
      subtext,
      quoteText,
      imageStyle = 'content_visual',
      brandColors,
      fontStyle,
      logoUrl,
      brandName,
    } = req.body;

    console.log(`[PersonalBranding] On-demand image generation for: "${headline || prompt}" (style: ${imageStyle})`);
    const imageUrl = await generatePersonalBrandImageService({
      prompt: prompt || headline || 'Executive Thought Leadership Strategy',
      headline,
      subtext,
      quoteText,
      imageStyle,
      brandColors,
      fontStyle,
      logoUrl,
      brandName,
    });

    return res.status(200).json({ imageUrl });
  } catch (err: any) {
    console.error('[PersonalBranding] Image generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate image',
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

