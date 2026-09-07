import { Request, Response } from 'express';
import path from 'path';
import fsSync from 'fs';
import { admin, db } from '../config/firebase';
import {
  globalWebhookPayloads,
  globalBotReplies,
  globalWhatsappTokens,
  globalWhatsappPhoneIds,
  globalWhatsappBotNumbers,
  globalWhatsappVerifyTokens,
  serverMetrics
} from '../utils/diagnosticLogs';

export async function handleAdminLockUser(req: Request, res: Response) {
  try {
    const { adminEmail, targetUserId, isLocked, lockReason } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection not active on server' });
    }

    const defaultReason = 'The testing phase is over. Access to your account has been suspended by administration.';
    const userRef = db.collection('users').doc(targetUserId);

    await userRef.set({
      isLocked: !!isLocked,
      lockReason: isLocked ? (lockReason || defaultReason) : null,
      lockedAt: isLocked ? new Date().toISOString() : null
    }, { merge: true });

    console.log(`[Admin Lock] User ${targetUserId} lock status updated to ${isLocked} by ${adminEmail || 'admin'}.`);
    return res.json({ success: true, targetUserId, isLocked });
  } catch (err: any) {
    console.error('[Admin Lock Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to update user lock state' });
  }
}

export async function handleAdminLockAllUsers(req: Request, res: Response) {
  try {
    const { adminEmail, lockReason } = req.body;

    if (!db) {
      return res.status(500).json({ error: 'Database connection not active on server' });
    }

    const defaultReason = 'The testing phase is over. Access to your account has been suspended by administration.';
    const reasonToSave = lockReason && lockReason.trim() ? lockReason.trim() : defaultReason;

    const usersSnap = await db.collection('users').get();
    let lockedCount = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      if (userData.email !== 'garvitbansal2303@gmail.com' && userData.role !== 'Admin') {
        await userDoc.ref.set({
          isLocked: true,
          lockReason: reasonToSave,
          lockedAt: new Date().toISOString()
        }, { merge: true });
        lockedCount++;
      }
    }

    console.log(`[Admin Emergency Lock All] ${lockedCount} non-admin users locked by ${adminEmail || 'admin'}.`);
    return res.json({ success: true, lockedCount });
  } catch (err: any) {
    console.error('[Admin Emergency Lock All Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to lock all users' });
  }
}

export async function handleAdminDeleteUser(req: Request, res: Response) {
  try {
    const { adminEmail, targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection not active on server' });
    }

    try {
      await admin.auth().deleteUser(targetUserId);
      console.log(`[Admin Delete] Deleted user ${targetUserId} from Firebase Auth.`);
    } catch (authErr: any) {
      console.warn(`[Admin Delete] Could not delete user from auth (might already be deleted): ${authErr.message}`);
    }

    await db.collection('users').doc(targetUserId).delete();

    const productsSnap = await db.collection('products').where('userId', '==', targetUserId).get();
    const productDeletes = productsSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(productDeletes);

    const campaignsSnap = await db.collection('campaigns').where('userId', '==', targetUserId).get();
    const campaignDeletes = campaignsSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(campaignDeletes);

    console.log(`[Admin Delete] User ${targetUserId} and associated data deleted by ${adminEmail || 'admin'}.`);
    return res.json({ success: true, targetUserId });
  } catch (err: any) {
    console.error('[Admin Delete Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
}

export async function handleAdminGetUserGenerations(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!db) {
      return res.status(500).json({ error: 'Database connection not active on server' });
    }

    const productsSnap = await db.collection('products').where('userId', '==', userId).get();
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const campaignsSnap = await db.collection('campaigns').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(20).get();
    const campaigns = campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.json({ success: true, products, campaigns });
  } catch (err: any) {
    console.error('[Admin Generations Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch user generations' });
  }
}

export async function handleAdminGetProducts(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database connection not active on server' });
    }

    const productsSnap = await db.collection('products').get();
    const products: any[] = [];
    productsSnap.forEach(docSnap => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });

    return res.json({ success: true, products });
  } catch (err: any) {
    console.error('[Admin Fetch Products Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
}

export async function handleGetScalabilityMetrics(req: Request, res: Response) {
  try {
    const memory = process.memoryUsage();
    res.json({
      serverMemoryRssMb: Math.round(memory.rss / 1024 / 1024),
      serverMemoryHeapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      cacheHits: serverMetrics.cacheHits,
      cacheMisses: serverMetrics.cacheMisses,
      cacheTotalEntries: 0,
      throttledRequestsCount: serverMetrics.throttledRequestsCount,
      activeRenderQueueLength: 0,
      activeRendersCount: serverMetrics.activeRendersCount,
      concurrencySettings: {
        maxRenders: 3,
        cacheTtlMs: 3600000
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleGetAdminLogs(req: Request, res: Response) {
  try {
    const logs: any[] = [];
    const tokens: any[] = [];

    globalWebhookPayloads.forEach(item => logs.push(item));
    globalBotReplies.forEach(item => {
      logs.push({
        id: item.id,
        timestamp: item.timestamp,
        type: item.type,
        bodySnapshot: `Recipient: ${item.recipient} | Status: ${item.status} | Body: ${item.replyBody}` + (item.error ? ` | Error: ${JSON.stringify(item.error)}` : '')
      });
    });

    if (db) {
      try {
        const snapshot = await db.collection('admin_logs').orderBy('timestamp', 'desc').limit(50).get();
        snapshot.forEach(doc => {
          const data = doc.data();
          logs.push({ id: doc.id, ...data });
        });
      } catch (err: any) {
        console.warn('[Admin Logs API] Firestore logs fetch skipped/denied:', err.message);
      }

      try {
        const tokenSnapshot = await db.collection('server_tokens').get();
        tokenSnapshot.forEach(doc => {
          const data = doc.data();
          tokens.push({
            productId: doc.id,
            whatsapp_phone_number_id: data.whatsapp_phone_number_id || '',
            whatsapp_bot_number: data.whatsapp_bot_number || '',
            has_token: !!data.whatsapp,
            has_verify_token: !!data.whatsapp_webhook_verify_token
          });
        });
      } catch (err: any) {
        console.warn('[Admin Logs API] Firestore tokens fetch skipped/denied:', err.message);
      }
    }

    if (tokens.length === 0) {
      Object.keys(globalWhatsappTokens).forEach(pId => {
        tokens.push({
          productId: pId,
          whatsapp_phone_number_id: globalWhatsappPhoneIds[pId] || '',
          whatsapp_bot_number: globalWhatsappBotNumbers[pId] || '',
          has_token: !!globalWhatsappTokens[pId],
          has_verify_token: !!globalWhatsappVerifyTokens[pId]
        });
      });
    }

    logs.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    res.json({
      success: true,
      summary: 'Diagnostic server logs retrieved successfully.',
      firebase_connected: !!db,
      tokens,
      logs: logs.slice(0, 50)
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message, logs: [] });
  }
}

export function handleGetDebugEnv(req: Request, res: Response) {
  const envPaths = [
    { label: 'cwd/.env', path: path.join(process.cwd(), '.env') },
    { label: 'cwd/.env.local', path: path.join(process.cwd(), '.env.local') }
  ];

  const fileChecks = envPaths.map(p => ({
    label: p.label,
    absolutePath: p.path,
    exists: fsSync.existsSync(p.path)
  }));

  let cwdFiles: string[] = [];
  try {
    cwdFiles = fsSync.readdirSync(process.cwd()).slice(0, 50);
  } catch (e: any) {
    cwdFiles = [`Error reading cwd: ${e.message}`];
  }

  res.json({
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    fileChecks,
    cwdFiles,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasFirebaseKey: !!process.env.FIREBASE_PRIVATE_KEY
  });
}
