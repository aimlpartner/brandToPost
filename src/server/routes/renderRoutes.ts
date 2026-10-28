import express from 'express';
import { handleRenderVisual, handleGetTempImage, handleServeImage } from '../controllers/renderController';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const renderRouter = express.Router();

renderRouter.post('/api/render-visual', routeRateLimiter(120, 60 * 1000), handleRenderVisual);
const imageCorsMiddleware = (req: any, res: any, next: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

renderRouter.options('/api/campaign/images/:imageId.png', imageCorsMiddleware);
renderRouter.get('/api/campaign/images/:imageId.png', imageCorsMiddleware, handleServeImage);
renderRouter.options('/api/whatsapp/images/:imageId.png', imageCorsMiddleware);
renderRouter.get('/api/whatsapp/images/:imageId.png', imageCorsMiddleware, handleServeImage);
