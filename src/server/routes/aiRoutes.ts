import express from 'express';
import {
  handleGenerateAiContent,
  handleGenerateCampaignImages,
  handleResearchTrends,
  handleGetTemplatesLibrary,
  handleGetResearchChannelTemplates,
  handlePostResearchChannelTemplates,
  handleGetResearchBlueprints,
  handlePostResearchBlueprints
} from '../controllers/aiController';
import { requireAuth } from '../middlewares/auth';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const aiRouter = express.Router();

aiRouter.post('/api/ai/generate', requireAuth, routeRateLimiter(15, 60 * 1000), handleGenerateAiContent);
aiRouter.post('/api/ai/generate-campaign-images', requireAuth, routeRateLimiter(10, 60 * 1000), handleGenerateCampaignImages);
aiRouter.post('/api/ai/research-trends', requireAuth, routeRateLimiter(15, 60 * 1000), handleResearchTrends);
aiRouter.get('/api/templates/library', requireAuth, handleGetTemplatesLibrary);

aiRouter.get('/api/research-channel-templates', handleGetResearchChannelTemplates);
aiRouter.post('/api/research-channel-templates', handlePostResearchChannelTemplates);

aiRouter.get('/api/research-blueprints', handleGetResearchBlueprints);
aiRouter.post('/api/research-blueprints', handlePostResearchBlueprints);
