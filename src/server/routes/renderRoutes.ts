import express from 'express';
import { handleRenderVisual, handleGetTempImage, handleServeImage } from '../controllers/renderController';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const renderRouter = express.Router();

renderRouter.post('/api/render-visual', routeRateLimiter(120, 60 * 1000), handleRenderVisual);
renderRouter.get('/public/temp-image/:id.png', handleGetTempImage);
renderRouter.get('/api/campaign/images/:imageId.png', handleServeImage);
renderRouter.get('/api/whatsapp/images/:imageId.png', handleServeImage);
