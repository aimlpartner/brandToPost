import { Request, Response } from 'express';
import { renderVisualCard } from '../services/visualRenderService';
import { handleServeImage } from '../services/whatsappService';
import { tempImages } from '../utils/firestoreStorage';

export async function handleRenderVisual(req: Request, res: Response) {
  try {
    const {
      visualType,
      visualData,
      imageUrl,
      dna,
      fallbackText,
      activeLogo,
      recentLayoutHistory
    } = req.body;

    const userId = (req as any).user?.uid;
    const userEmail = (req as any).user?.email;

    const result = await renderVisualCard({
      visualType,
      visualData,
      imageUrl,
      dna,
      fallbackText,
      activeLogo,
      recentLayoutHistory,
      userId,
      userEmail
    });

    res.json(result);
  } catch (error: any) {
    console.error('Visual rendering error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleGetTempImage(req: Request, res: Response) {
  const base64Data = tempImages[req.params.id];
  if (!base64Data) return res.status(404).send('Image resource expired or not found');
  try {
    const base64ImageString = base64Data.split(',')[1];
    const buffer = Buffer.from(base64ImageString, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    res.end(buffer);
  } catch (e: any) {
    res.status(500).send('Error rendering proxy asset: ' + e.message);
  }
}

export { handleServeImage };
