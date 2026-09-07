import express from 'express';
import {
  handleGetBlogConfig,
  handlePostBlogConfig,
  handlePostBlogPublish,
  handlePostBlogRegenerateImage,
  handlePublicBlogPublish,
  handlePublicBlogList,
  handlePublicBlogGenerateAi
} from '../controllers/blogController';
import { requireAuth } from '../middlewares/auth';
import { routeRateLimiter } from '../middlewares/rateLimiter';

export const blogRouter = express.Router();

blogRouter.get('/api/blog/config', requireAuth, handleGetBlogConfig);
blogRouter.post('/api/blog/config', requireAuth, handlePostBlogConfig);
blogRouter.post('/api/blog/publish', requireAuth, routeRateLimiter(5, 60 * 1000), handlePostBlogPublish);
blogRouter.post('/api/blog/regenerate-image', requireAuth, routeRateLimiter(5, 60 * 1000), handlePostBlogRegenerateImage);

// Public Headless Blog API
blogRouter.post('/api/blogs/publish', handlePublicBlogPublish);
blogRouter.get('/api/blogs/list', handlePublicBlogList);
blogRouter.post('/api/blogs/generate-ai', handlePublicBlogGenerateAi);
