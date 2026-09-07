import express from 'express';
import {
  handleWhatsAppPublicLink,
  handleWhatsAppQuickSetupNumber,
  handleGetWhatsAppConfig,
  handlePostWhatsAppConfig,
  handleGetWhatsAppChats,
  handleDeleteWhatsAppChat,
  handlePostWhatsAppSend,
  handleWhatsAppWebhookVerify,
  handleWhatsAppWebhookInbound
} from '../controllers/whatsappController';

export const whatsappRouter = express.Router();

whatsappRouter.get('/api/whatsapp/public-link', handleWhatsAppPublicLink);
whatsappRouter.post('/api/whatsapp/quick-setup-number', handleWhatsAppQuickSetupNumber);
whatsappRouter.get('/api/whatsapp/config', handleGetWhatsAppConfig);
whatsappRouter.post('/api/whatsapp/config', handlePostWhatsAppConfig);
whatsappRouter.get('/api/whatsapp/chats', handleGetWhatsAppChats);
whatsappRouter.delete('/api/whatsapp/chats/:id', handleDeleteWhatsAppChat);
whatsappRouter.post('/api/whatsapp/send', handlePostWhatsAppSend);
whatsappRouter.get('/api/whatsapp', handleWhatsAppWebhookVerify);
whatsappRouter.post('/api/whatsapp', handleWhatsAppWebhookInbound);
