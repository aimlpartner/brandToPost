import express from 'express';
import { handleProxyImage, handleDownloadLogo, handleScrapeUrl } from '../controllers/scraperController';
import { requireAuth } from '../middlewares/auth';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const scraperRouter = express.Router();

scraperRouter.get('/api/proxy-image', handleProxyImage);
scraperRouter.get('/api/download-logo', handleDownloadLogo);
scraperRouter.post('/api/scrape', requireAuth, routeRateLimiter(3, 60 * 1000), handleScrapeUrl);
