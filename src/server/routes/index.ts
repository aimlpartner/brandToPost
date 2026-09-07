import express from 'express';
import { adminRouter } from './adminRoutes';
import { aiRouter } from './aiRoutes';
import { renderRouter } from './renderRoutes';
import { scraperRouter } from './scraperRoutes';
import { scheduleRouter } from './scheduleRoutes';
import { socialRouter } from './socialRoutes';
import { blogRouter } from './blogRoutes';
import { approvalRouter } from './approvalRoutes';
import { whatsappRouter } from './whatsappRoutes';
import { personalBrandingRouter } from './personalBrandingRoutes';

export const apiRouter = express.Router();

// Mount Personal Branding Router at /api/personal-branding
apiRouter.use('/api/personal-branding', personalBrandingRouter);

// Mount domain routes
apiRouter.use(adminRouter);
apiRouter.use(aiRouter);
apiRouter.use(renderRouter);
apiRouter.use(scraperRouter);
apiRouter.use(scheduleRouter);
apiRouter.use(socialRouter);
apiRouter.use(blogRouter);
apiRouter.use(approvalRouter);
apiRouter.use(whatsappRouter);
