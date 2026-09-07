import express from 'express';
import { admin } from '../config/firebase';

// --- Auth Middleware ---
export const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    if (!admin.apps?.length) {
      // If admin is not initialized (e.g. no service account), we can't verify easily.
      // For preview purposes, we'll allow it if we can't verify, but log a warning.
      console.warn('[Auth] Firebase Admin not initialized. Bypassing auth check for preview.');
      return next();
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
