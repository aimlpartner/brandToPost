import express from 'express';
import {
  handleLinkedInAuthUrl,
  handleLinkedInCallback,
  handleLinkedInAutoFetchProfile,
  handleLinkedInStatus,
  handleLinkedInOrganizations,
  handleUserSettings,
  handleLinkedInSelectOrganization,
  handleLinkedInPublish,
  handleFounderPublish,
  handleDisconnectIntegration,
  handleInstagramPublish,
  handleFacebookAuthUrl,
  handleFacebookCallback,
  handleFacebookStatus,
  handleInstagramAuthUrl,
  handleInstagramCallback,
  handleInstagramStatus,
  handleInstagramManualToken,
  handleInstagramWebhookVerify,
  handleInstagramWebhookInbound,
  handleRedditAuthUrl,
  handleRedditCallback,
  handleRedditStatus
} from '../controllers/socialController';
import { requireAuth } from '../middlewares/auth';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const socialRouter = express.Router();

// LinkedIn
socialRouter.get('/api/auth/linkedin/url', handleLinkedInAuthUrl);
socialRouter.get('/api/auth/linkedin/callback', handleLinkedInCallback);
socialRouter.post('/api/linkedin/auto-fetch-profile', requireAuth, handleLinkedInAutoFetchProfile);
socialRouter.get('/api/linkedin/status', requireAuth, handleLinkedInStatus);
socialRouter.get('/api/linkedin/organizations', requireAuth, handleLinkedInOrganizations);
socialRouter.post('/api/user/settings', requireAuth, handleUserSettings);
socialRouter.post('/api/linkedin/select-organization', requireAuth, handleLinkedInSelectOrganization);
socialRouter.post('/api/linkedin/publish', requireAuth, routeRateLimiter(5, 60 * 1000), handleLinkedInPublish);
socialRouter.post('/api/founder/publish', requireAuth, routeRateLimiter(5, 60 * 1000), handleFounderPublish);
socialRouter.post('/api/disconnect', requireAuth, handleDisconnectIntegration);

// Facebook
socialRouter.get('/api/auth/facebook/url', handleFacebookAuthUrl);
socialRouter.get('/api/auth/facebook/callback', handleFacebookCallback);
socialRouter.get('/api/facebook/status', handleFacebookStatus);

// Instagram
socialRouter.post('/api/instagram/publish', requireAuth, routeRateLimiter(5, 60 * 1000), handleInstagramPublish);
socialRouter.get('/api/auth/instagram/url', handleInstagramAuthUrl);
socialRouter.get('/api/auth/instagram/callback', handleInstagramCallback);
socialRouter.get('/api/instagram/status', handleInstagramStatus);
socialRouter.post('/api/instagram/manual-token', handleInstagramManualToken);
socialRouter.get('/api/webhooks/instagram', handleInstagramWebhookVerify);
socialRouter.post('/api/webhooks/instagram', handleInstagramWebhookInbound);

// Reddit
socialRouter.get('/api/auth/reddit/url', handleRedditAuthUrl);
socialRouter.get('/api/auth/reddit/callback', handleRedditCallback);
socialRouter.get('/api/reddit/status', handleRedditStatus);
