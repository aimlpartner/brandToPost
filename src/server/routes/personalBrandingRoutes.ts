import express from 'express';
import {
  synthesizeVoiceController,
  groundingResearchController,
  generatePostController,
  suggestTopicsController,
  generateImageController,
} from '../controllers/personalBrandingController';

export const personalBrandingRouter = express.Router();

// POST /api/personal-branding/voice-synthesize
personalBrandingRouter.post('/voice-synthesize', synthesizeVoiceController);

// POST /api/personal-branding/grounding-research
personalBrandingRouter.post('/grounding-research', groundingResearchController);

// POST /api/personal-branding/generate OR /generate-post
personalBrandingRouter.post('/generate', generatePostController);
personalBrandingRouter.post('/generate-post', generatePostController);

// POST /api/personal-branding/generate-image
personalBrandingRouter.post('/generate-image', generateImageController);

// POST /api/personal-branding/suggest-topics
personalBrandingRouter.post('/suggest-topics', suggestTopicsController);

