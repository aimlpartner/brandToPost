import express from 'express';
import {
  handleGetCampaigns,
  handlePostCampaignsEmail,
  handlePostEmailsTrigger,
  handleGetApprovalReview,
  handleGetApprovalRespond,
  handlePostApprovalTrigger
} from '../controllers/approvalController';
import { requireAuth } from '../middlewares/auth';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const approvalRouter = express.Router();

approvalRouter.get('/api/campaigns', handleGetCampaigns);
approvalRouter.post('/api/campaigns/email', requireAuth, routeRateLimiter(6, 60 * 1000), handlePostCampaignsEmail);
approvalRouter.post('/api/emails/trigger', requireAuth, handlePostEmailsTrigger);
approvalRouter.get('/api/approval/review', handleGetApprovalReview);
approvalRouter.get('/api/approval/respond', handleGetApprovalRespond);
approvalRouter.post('/api/approval/trigger', requireAuth, handlePostApprovalTrigger);
