import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PORT } from './src/server/config/env';
import { verifyFirestoreConnection } from './src/server/config/firebase';
import { apiRouter } from './src/server/routes';
import { globalErrorHandler } from './src/server/middlewares/errorHandler';
import { startAutomationWorker } from './src/server/services/automationWorker';

async function startServer() {
  const app = express();

  // Verify Firestore connection at startup
  await verifyFirestoreConnection();

  // Core middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Static serving for campaign and personal branding generated images
  app.use('/api/campaign/images', express.static(path.join(process.cwd(), 'public', 'campaign_images')));
  app.use('/api/personal-branding/images', express.static(path.join(process.cwd(), 'public', 'campaign_images')));
  app.use('/campaign_images', express.static(path.join(process.cwd(), 'public', 'campaign_images')));
  app.use('/whatsapp_images', express.static(path.join(process.cwd(), 'public', 'whatsapp_images')));

  // Mount unified API routes
  app.use(apiRouter);

  // Global Error Handler
  app.use(globalErrorHandler);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start background automation cron / polling worker
  startAutomationWorker();

  const serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  serverInstance.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server Warning] Port ${PORT} is already in use by a running process. Reusing existing instance.`);
    } else {
      console.error('[Server Error]', err);
    }
  });

  return serverInstance;
}

startServer();
