import { admin, db } from '../config/firebase';
import {
  globalWhatsappTokens,
  globalWhatsappPhoneIds,
  globalWhatsappVerifyTokens,
  globalWhatsappBotNumbers,
} from './diagnosticLogs';

// In-memory Fallback States when Firestore is disconnected
export const globalLinkedinTokens: Record<string, string> = {};
export const globalFacebookTokens: Record<string, string> = {};
export const globalInstagramTokens: Record<string, string> = {};
export const globalRedditTokens: Record<string, string> = {};
export const globalBlogSettings: Record<string, any> = {};

export const scheduleConfigs: Record<string, { enabled: boolean; timeUtc: string }> = {};
export let postQueue: Array<{
  id: string;
  text: string;
  campaignId: string;
  platform: string;
  productId: string;
  day?: string;
  imageUrl?: string;
}> = [];
export const lastPostedDates: Record<string, string> = {};
export const tempImages: Record<string, string> = {};
export let lastKnownHost = '';

export function setLastKnownHost(host: string) {
  lastKnownHost = host;
}

// --- Token Usage Logger ---
export async function logBackendTokenUsage(
  userId: string | undefined,
  operationType: string,
  model: string,
  usageMetadata: any
): Promise<void> {
  if (!db) return;
  if (!userId || !usageMetadata) return;
  try {
    const promptTokenCount = usageMetadata.promptTokenCount || 0;
    const candidatesTokenCount = usageMetadata.candidatesTokenCount || 0;
    const totalTokenCount = usageMetadata.totalTokenCount || 0;

    await db.collection('token_usage').add({
      userId,
      operationType,
      model,
      promptTokenCount,
      candidatesTokenCount,
      totalTokenCount,
      timestamp: new Date().toISOString()
    });
    console.log(`[Token Usage Logged] ${operationType} (${model}): ${totalTokenCount} tokens`);
  } catch (error) {
    console.error('[Token Usage Logged Error]', error);
  }
}

// --- Schedule Helpers ---
export async function getScheduleConfig(productId: string): Promise<any> {
  if (db) {
    const doc = await db.collection('server_schedules').doc(productId).get();
    return doc.exists ? doc.data() : { enabled: false, timeUtc: '14:00' };
  }
  return scheduleConfigs[productId] || { enabled: false, timeUtc: '14:00' };
}

export async function setScheduleConfig(productId: string, config: any): Promise<void> {
  if (db) {
    await db.collection('server_schedules').doc(productId).set(config, { merge: true });
  } else {
    scheduleConfigs[productId] = { ...scheduleConfigs[productId], ...config };
  }
}

// --- Post Queue Helpers ---
export async function getPostQueue(productId: string): Promise<any[]> {
  if (db) {
    const snapshot = await db.collection(`server_queues/${productId}/posts`).orderBy('createdAt', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return postQueue.filter(p => p.productId === productId);
}

export async function addToQueue(post: any): Promise<void> {
  if (db) {
    await db.collection(`server_queues/${post.productId}/posts`).doc(post.id).set({
      ...post,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    postQueue.push(post);
  }
}

export async function removeFromQueue(productId: string, postId: string): Promise<void> {
  if (db) {
    await db.collection(`server_queues/${productId}/posts`).doc(postId).delete();
  } else {
    postQueue = postQueue.filter(q => q.id !== postId);
  }
}

export function deleteFromLocalQueue(postId: string): void {
  postQueue = postQueue.filter(q => q.id !== postId);
}

export function unshiftToLocalQueue(post: any): void {
  postQueue.unshift(post);
}

// --- OAuth / Social Token Helpers ---
export async function getToken(productId: string, platform: string): Promise<string | null> {
  let token = null;
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    token = doc.exists ? doc.data()?.[platform] : null;
  } else {
    if (platform === 'linkedin') token = globalLinkedinTokens[productId];
    if (platform === 'facebook') token = globalFacebookTokens[productId];
    if (platform === 'instagram') token = globalInstagramTokens[productId];
    if (platform === 'reddit') token = globalRedditTokens[productId];
    if (platform === 'whatsapp') token = globalWhatsappTokens[productId];
    if (platform === 'whatsapp_phone_number_id') token = globalWhatsappPhoneIds[productId];
    if (platform === 'whatsapp_webhook_verify_token') token = globalWhatsappVerifyTokens[productId];
    if (platform === 'whatsapp_bot_number') token = globalWhatsappBotNumbers[productId];
  }

  if (!token && platform === 'instagram') {
    return 'IGAANKiw3fHHVBZAFlDUHFqUEExdjNYTFM1azdIVTB2QW03ZADdPOERaWVhlSVVhdy12TlZAYUlFtUFRuQVE2OWxteF8yY1B4SFAtMmkzQWp0XzBJcjNpSFNtaVVmTVlVakpjYjJnWWdxYXI3MVd2UG9TMnB2VVQybDVfVW53ZAUZAsSQZDZD';
  }
  return token;
}

export async function hasUserToken(productId: string, platform: string): Promise<boolean> {
  let token = null;
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    token = doc.exists ? doc.data()?.[platform] : null;
  } else {
    if (platform === 'linkedin') token = globalLinkedinTokens[productId];
    if (platform === 'facebook') token = globalFacebookTokens[productId];
    if (platform === 'instagram') token = globalInstagramTokens[productId];
    if (platform === 'reddit') token = globalRedditTokens[productId];
    if (platform === 'whatsapp') token = globalWhatsappTokens[productId];
    if (platform === 'whatsapp_phone_number_id') token = globalWhatsappPhoneIds[productId];
    if (platform === 'whatsapp_webhook_verify_token') token = globalWhatsappVerifyTokens[productId];
    if (platform === 'whatsapp_bot_number') token = globalWhatsappBotNumbers[productId];
  }
  return !!token;
}

export async function setToken(productId: string, platform: string, token: string): Promise<void> {
  if (db) {
    await db.collection('server_tokens').doc(productId).set({ [platform]: token }, { merge: true });
  } else {
    if (platform === 'linkedin') globalLinkedinTokens[productId] = token;
    if (platform === 'facebook') globalFacebookTokens[productId] = token;
    if (platform === 'instagram') globalInstagramTokens[productId] = token;
    if (platform === 'reddit') globalRedditTokens[productId] = token;
    if (platform === 'whatsapp') globalWhatsappTokens[productId] = token;
    if (platform === 'whatsapp_phone_number_id') globalWhatsappPhoneIds[productId] = token;
    if (platform === 'whatsapp_webhook_verify_token') globalWhatsappVerifyTokens[productId] = token;
    if (platform === 'whatsapp_bot_number') globalWhatsappBotNumbers[productId] = token;
  }
}

// --- Blog Settings Helpers ---
export async function getBlogSettings(productId: string): Promise<any> {
  if (db) {
    const doc = await db.collection('server_tokens').doc(productId).get();
    const settings = doc.exists ? doc.data()?.blogSettings || null : null;
    console.log('[getBlogSettings Debug] productId:', productId, '| docExists:', doc.exists, '| type:', settings?.type, '| webhookUrl:', settings?.webhook?.url, '| secretPresent:', !!settings?.webhook?.secret, '| secretLength:', settings?.webhook?.secret?.length || 0);
    return settings;
  }
  return globalBlogSettings[productId] || null;
}

export async function setBlogSettings(productId: string, settings: any): Promise<void> {
  console.log('[setBlogSettings Debug] productId:', productId, '| type:', settings?.type, '| webhookUrl:', settings?.webhook?.url, '| secretPresent:', !!settings?.webhook?.secret, '| secretLength:', settings?.webhook?.secret?.length || 0, '| secretValue:', settings?.webhook?.secret ? settings.webhook.secret.substring(0, 6) + '...' : 'NONE');
  if (db) {
    await db.collection('server_tokens').doc(productId).set({ blogSettings: settings }, { merge: true });
  } else {
    globalBlogSettings[productId] = settings;
  }
}
