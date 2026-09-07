import { Request, Response } from 'express';
import { db } from '../config/firebase';
import {
  getScheduleConfig,
  setScheduleConfig,
  getPostQueue,
  addToQueue,
  removeFromQueue,
  setToken
} from '../utils/firestoreStorage';
import {
  executeAutoDailyGeneration,
  executeAutoCampaignGeneration
} from '../services/autoCampaignService';

export async function handleGetSchedule(req: Request, res: Response) {
  try {
    const productId = req.query.productId as string;
    const config = await getScheduleConfig(productId);
    const queue = await getPostQueue(productId);
    res.json({ config, queue });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostSchedule(req: Request, res: Response) {
  try {
    const { enabled, timeUtc, productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const updates: any = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (timeUtc !== undefined) updates.timeUtc = timeUtc;

    await setScheduleConfig(productId, updates);
    const newConfig = await getScheduleConfig(productId);

    res.json({ success: true, config: newConfig });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostScheduleQueue(req: Request, res: Response) {
  try {
    const { text, campaignId, platform, productId, day, date, imageUrl } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const id = Math.random().toString(36).substring(7);
    await addToQueue({ id, text, campaignId, platform, productId, day, date, imageUrl });

    if (req.cookies && req.cookies[`linkedin_token_${productId}`]) {
      await setToken(productId, 'linkedin', req.cookies[`linkedin_token_${productId}`]);
    }

    const queue = await getPostQueue(productId);
    res.json({ success: true, queue });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleDeleteScheduleQueueItem(req: Request, res: Response) {
  try {
    const productId = req.query.productId as string;
    await removeFromQueue(productId, req.params.id);
    const queue = await getPostQueue(productId);
    res.json({ success: true, queue });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleRemoveScheduleQueue(req: Request, res: Response) {
  try {
    const { campaignId, platform, productId, day } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const queue = await getPostQueue(productId);
    for (const q of queue) {
      if (q.campaignId === campaignId && q.platform === platform && (!day || q.day === day)) {
        await removeFromQueue(productId, q.id);
      }
    }

    const newQueue = await getPostQueue(productId);
    res.json({ success: true, queue: newQueue });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleGetAutomationConfig(req: Request, res: Response) {
  try {
    const productId = req.query.productId as string;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    if (!db) return res.status(500).json({ error: 'Database connection is not active' });

    const docRef = db.collection('products').doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = docSnap.data()!;
    res.json({
      enabled: !!p.automationAgentEnabled,
      automateDailyPosts: !!p.automateDailyPosts,
      automateDailyBlogs: !!p.automateDailyBlogs,
      automateWeeklyCampaigns: !!p.automateWeeklyCampaigns,
      useBrandAssets: p.useBrandAssets,
      automationTimeUtc: p.automationTimeUtc || '14:00',
      automationWeeklyDay: p.automationWeeklyDay || 'Monday',
      requireEmailApproval: p.requireEmailApproval !== false,
      autoUploadDelayHours: p.autoUploadDelayHours || 12,
      logs: p.automationLogs || []
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostAutomationConfig(req: Request, res: Response) {
  try {
    const {
      productId,
      enabled,
      automateDailyPosts,
      automateDailyBlogs,
      automateWeeklyCampaigns,
      useBrandAssets,
      automationTimeUtc,
      automationWeeklyDay,
      requireEmailApproval,
      autoUploadDelayHours
    } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    if (!db) return res.status(500).json({ error: 'Database connection is not active' });

    const docRef = db.collection('products').doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates: any = {};
    if (enabled !== undefined) updates.automationAgentEnabled = enabled;
    if (automateDailyPosts !== undefined) updates.automateDailyPosts = automateDailyPosts;
    if (automateDailyBlogs !== undefined) updates.automateDailyBlogs = automateDailyBlogs;
    if (automateWeeklyCampaigns !== undefined) updates.automateWeeklyCampaigns = automateWeeklyCampaigns;
    if (useBrandAssets !== undefined) updates.useBrandAssets = useBrandAssets;
    if (automationTimeUtc !== undefined) updates.automationTimeUtc = automationTimeUtc;
    if (automationWeeklyDay !== undefined) updates.automationWeeklyDay = automationWeeklyDay;
    if (requireEmailApproval !== undefined) updates.requireEmailApproval = requireEmailApproval;
    if (autoUploadDelayHours !== undefined) updates.autoUploadDelayHours = Number(autoUploadDelayHours) || 12;

    await docRef.update(updates);

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostAutomationTrigger(req: Request, res: Response) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    if (!db) return res.status(500).json({ error: 'Database connection is not active' });

    console.log(`[Manual Automation Trigger] Spawning virtual Founder Agent for product ${productId}...`);

    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });
    const product = productDoc.data()!;

    let generatedCampaign = null;
    if ((product.automateDailyPosts || product.automateDailyBlogs) && !product.automateWeeklyCampaigns) {
      await executeAutoDailyGeneration(productId, !!product.automateDailyPosts, !!product.automateDailyBlogs);

      const campaignSnap = await db.collection('campaigns')
        .where('productId', '==', productId)
        .where('isOneDay', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      if (!campaignSnap.empty) {
        generatedCampaign = campaignSnap.docs[0].data();
      }
    } else {
      generatedCampaign = await executeAutoCampaignGeneration(productId);
    }

    res.json({ success: true, campaign: generatedCampaign });
  } catch (e: any) {
    console.error('[Manual Automation Trigger Error]:', e);
    res.status(500).json({ error: e.message });
  }
}
