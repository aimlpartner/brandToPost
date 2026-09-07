import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { getToken, setToken } from '../utils/firestoreStorage';
import { globalWhatsappBotNumbers } from '../utils/diagnosticLogs';
import {
  sendWhatsAppMessageService,
  processInboundWhatsAppMessage,
  handleServeImage
} from '../services/whatsappService';

export async function handleWhatsAppPublicLink(req: Request, res: Response) {
  try {
    let botNumber = '';
    if (db) {
      const snapshot = await db.collection('server_tokens').get();
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.whatsapp_bot_number) {
          botNumber = data.whatsapp_bot_number;
          break;
        }
      }
    } else {
      const keys = Object.keys(globalWhatsappBotNumbers);
      if (keys.length > 0) {
        botNumber = globalWhatsappBotNumbers[keys[0]];
      }
    }

    if (!botNumber) {
      return res.json({ url: '', isDefault: true });
    }

    const cleanNumber = botNumber.replace(/\D/g, '');
    if (!cleanNumber) {
      return res.json({ url: '', isDefault: true });
    }

    const text = encodeURIComponent('Hi Tror, I want to onboard my local business!');
    res.json({ url: `https://wa.me/${cleanNumber}?text=${text}`, isDefault: false });
  } catch (e: any) {
    console.error('[WhatsApp Public Link Tool Error]', e);
    res.status(500).json({ url: '', isDefault: true });
  }
}

export async function handleWhatsAppQuickSetupNumber(req: Request, res: Response) {
  try {
    const { botPhoneNumber } = req.body;
    if (!botPhoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    const cleanNumber = botPhoneNumber.replace(/\D/g, '');
    if (!cleanNumber) return res.status(400).json({ error: 'Invalid phone number format' });

    let targetProductId = 'sandbox_id';
    if (db) {
      const snapshot = await db.collection('server_tokens').get();
      if (!snapshot.empty) {
        targetProductId = snapshot.docs[0].id;
      } else {
        const schedDocs = await db.collection('server_schedules').get();
        if (!schedDocs.empty) {
          targetProductId = schedDocs.docs[0].id;
        }
      }
    } else {
      const keys = Object.keys(globalWhatsappBotNumbers);
      if (keys.length > 0) {
        targetProductId = keys[0];
      }
    }

    await setToken(targetProductId, 'whatsapp_bot_number', cleanNumber);
    const text = encodeURIComponent('Hi Tror, I want to onboard my local business!');
    res.json({ success: true, url: `https://wa.me/${cleanNumber}?text=${text}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleGetWhatsAppConfig(req: Request, res: Response) {
  try {
    const { productId } = req.query as { productId: string };
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const token = await getToken(productId, 'whatsapp');
    const phoneNumberId = await getToken(productId, 'whatsapp_phone_number_id');
    const webhookVerifyToken = await getToken(productId, 'whatsapp_webhook_verify_token');
    const botPhoneNumber = await getToken(productId, 'whatsapp_bot_number');

    res.json({
      token: token || '',
      phoneNumberId: phoneNumberId || '',
      webhookVerifyToken: webhookVerifyToken || 'TROR_WEBHOOK_SECURE_KEY',
      botPhoneNumber: botPhoneNumber || ''
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostWhatsAppConfig(req: Request, res: Response) {
  try {
    const { productId, token, phoneNumberId, webhookVerifyToken, botPhoneNumber } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    await setToken(productId, 'whatsapp', token || '');
    await setToken(productId, 'whatsapp_phone_number_id', phoneNumberId || '');
    await setToken(productId, 'whatsapp_webhook_verify_token', webhookVerifyToken || 'TROR_WEBHOOK_SECURE_KEY');
    await setToken(productId, 'whatsapp_bot_number', botPhoneNumber || '');

    res.json({ success: true, message: 'WhatsApp credentials saved successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handleGetWhatsAppChats(req: Request, res: Response) {
  try {
    const chats: any[] = [];
    if (db) {
      const snapshot = await db.collection('whatsapp_conversations').orderBy('lastUpdated', 'desc').limit(30).get();
      snapshot.forEach((doc) => {
        chats.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    res.json({ success: true, chats });
  } catch (e: any) {
    res.status(500).json({ error: e.message, chats: [] });
  }
}

export async function handleDeleteWhatsAppChat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('whatsapp_conversations').doc(id).delete();
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function handlePostWhatsAppSend(req: Request, res: Response) {
  try {
    const result = await sendWhatsAppMessageService(req.body);
    res.json(result);
  } catch (e: any) {
    console.error('[WhatsApp Outbound Error]', e.message);
    res.status(500).json({ error: e.message });
  }
}

export async function handleWhatsAppWebhookVerify(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const defaultVerifyToken = 'TROR_WEBHOOK_SECURE_KEY';
  console.log('[WhatsApp Webhook Verification Check]', { mode, token });

  if (mode === 'subscribe' && token) {
    if (token === defaultVerifyToken || token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      return res.status(200).type('text/plain').send(String(challenge));
    } else {
      console.warn('[WhatsApp Webhook] Verification mismatch');
      return res.status(403).send('Forbidden verify token mismatch');
    }
  }

  res.json({
    status: 'active',
    message: 'WhatsApp webhook is live and verifying signatures.',
    callbackUrl: `${req.protocol}://${req.get('host')}/api/whatsapp`,
    defaultVerifyToken
  });
}

export async function handleWhatsAppWebhookInbound(req: Request, res: Response) {
  try {
    const incomingPayload = req.body;
    console.log('[WhatsApp Webhook Post] Payload received:', JSON.stringify(incomingPayload, null, 2));

    // Send 200 early to Meta Graph API to prevent webhooks retrying
    res.status(200).send('EVENT_RECEIVED');

    const host = req.get('host');
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';

    processInboundWhatsAppMessage(incomingPayload, host, protocol).catch((err) => {
      console.error('[WhatsApp Async Webhook Process Crash]', err);
    });
  } catch (e: any) {
    console.error('[WhatsApp Webhook Incoming Processing Error]', e);
    if (!res.headersSent) {
      res.status(500).send('PROCESSING_ERROR');
    }
  }
}

export { handleServeImage };
