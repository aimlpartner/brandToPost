// In-memory Diagnostic Logs for Live Console View and Webhook Monitoring

export interface WebhookPayloadLog {
  id: string;
  timestamp: string;
  type: string;
  bodySnapshot: string;
}

export interface BotReplyLog {
  id: string;
  timestamp: string;
  type: string;
  recipient: string;
  status: string;
  replyBody: string;
  error?: any;
}

export const globalWebhookPayloads: WebhookPayloadLog[] = [];
export const globalBotReplies: BotReplyLog[] = [];

// Fallback in-memory dictionaries for tokens when Firestore is unavailable
export const globalWhatsappTokens: Record<string, string> = {};
export const globalWhatsappPhoneIds: Record<string, string> = {};
export const globalWhatsappBotNumbers: Record<string, string> = {};
export const globalWhatsappVerifyTokens: Record<string, string> = {};

// Scalability & Performance Metrics Counters
export const serverMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  throttledRequestsCount: 0,
  activeRendersCount: 0,
  totalRendersExecuted: 0,
};

export function addWebhookPayload(type: string, bodySnapshot: string): void {
  globalWebhookPayloads.unshift({
    id: 'log_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    type,
    bodySnapshot: typeof bodySnapshot === 'string' ? bodySnapshot : JSON.stringify(bodySnapshot),
  });
  if (globalWebhookPayloads.length > 100) {
    globalWebhookPayloads.length = 100;
  }
}

export function addBotReply(
  recipient: string,
  replyBody: string,
  status: string,
  type = 'WHATSAPP_BOT_OUTBOUND',
  error?: any
): void {
  globalBotReplies.unshift({
    id: 'reply_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    type,
    recipient,
    status,
    replyBody,
    error,
  });
  if (globalBotReplies.length > 100) {
    globalBotReplies.length = 100;
  }
}
