import path from 'path';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { admin, db } from '../config/firebase';
import {
  globalBotReplies,
  globalWebhookPayloads,
  globalWhatsappTokens,
  globalWhatsappPhoneIds,
  globalWhatsappVerifyTokens,
  globalWhatsappBotNumbers
} from '../utils/diagnosticLogs';
import { saveImageLocalAndDb, generateFallbackBrandedCanvas } from '../utils/imageUtils';
import { runWithRenderLock } from './renderPoolService';
import { getToken, logBackendTokenUsage } from '../utils/firestoreStorage';
import { sanitizeTemplateHtml, TEMPLATE_CSP_META } from '../../lib/sanitizeTemplateHtml';

  export function safeParseJSON(str: string): any {
    let cleaned = str.trim();
    // Strip starting ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    // Strip ending ```
    cleaned = cleaned.replace(/\s*```$/i, '');
    return JSON.parse(cleaned.trim());
  }

  export function generateBrandedCanvasHtml(
    visualType: string,
    visualData: any,
    bgBase64: string,
    bgMime: string,
    businessProfile: any,
    from: string
  ): string {
    const primaryColor = "#10B981"; // Emerald/WhatsApp
    const secondaryColor = "#0f172a"; // Slate/Navy
    const headline = visualData?.headline || "Special Offer!";
    const subtext = visualData?.subtext || "";
    const textShadowDeep = "0 8px 32px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.6)";

    let htmlContent = "";

    const activeLogo = businessProfile?.logoBase64
      ? `data:${businessProfile.logoMime || 'image/png'};base64,${businessProfile.logoBase64}`
      : null;

    if (visualType === "creative-story") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 60%, rgba(12,15,18,0.98) 100%); z-index: 2;"></div>
        <div style="position: absolute; bottom: 250px; left: 75px; right: 75px; z-index: 10; display: flex; flex-direction: column; justify-content: flex-end;">
          ${subtext ? `<div style="margin-bottom: 20px; color: #34d399; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: 26px; text-shadow: ${textShadowDeep};">— ${subtext}</div>` : ''}
          <h2 style="color: white; font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; font-size: 64px; margin: 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
        </div>
      `;
    } else if (visualType === "abstract-announcement") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: radial-gradient(circle at top right, ${primaryColor}50, transparent 70%), radial-gradient(circle at bottom left, ${secondaryColor}90, ${primaryColor}20 80%); opacity: 0.85; z-index: 2;"></div>
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.88) 85%); z-index: 3;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -55%); width: 85%; background: rgba(12,15,18,0.8); backdrop-filter: blur(24px); border: 2px solid rgba(255,255,255,0.12); padding: 60px 70px; border-radius: 32px; text-align: center; box-sizing: border-box; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 25px 80px rgba(0,0,0,0.85);">
          <h2 style="color: white; font-weight: 900; line-height: 1.15; margin: 0 0 20px 0; font-size: 58px; text-wrap: balance; overflow-wrap: break-word; text-shadow: ${textShadowDeep};">${headline}</h2>
          ${subtext ? `<div style="height: 3px; width: 70px; background: rgba(255,255,255,0.3); margin: 24px auto; border-radius: 2px;"></div><p style="color: #cbd5e1; font-weight: 500; line-height: 1.4; margin: 0; font-size: 28px; text-wrap: balance; overflow-wrap: break-word; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">${subtext}</p>` : ''}
        </div>
      `;
    } else if (visualType === "powerful-quote") {
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(135deg, ${secondaryColor}DD, #0c0f12F2 90%); z-index: 2;"></div>
        <div style="position: absolute; top: -50px; left: -20px; font-size: 600px; color: rgba(255,255,255,0.03); font-weight: 800; line-height: 1; z-index: 3; pointer-events: none;">"</div>
        <div style="position: absolute; bottom: 260px; left: 80px; right: 80px; text-align: center; display: flex; flex-direction: column; align-items: center; z-index: 10; box-sizing: border-box;">
          <h2 style="color: white; font-weight: 800; line-height: 1.25; margin: 0; font-size: 56px; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">"${headline}"</h2>
          <div style="width: 80px; height: 5px; background-color: ${primaryColor}; margin: 32px 0 20px 0; border-radius: 3px;"></div>
          <div style="color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; font-size: 22px; text-wrap: balance; overflow-wrap: break-word;">${subtext || businessProfile?.businessName || "Exclusive Vision"}</div>
        </div>
      `;
    } else if (visualType === "data-infographic") {
      const stats = visualData?.stats?.length
        ? visualData.stats
        : [{ label: "Excellent Quality", value: "100%" }, { label: "Service", value: "Premium" }];
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(12,15,18,0.3) 0%, rgba(12,15,18,0.92) 80%); z-index: 2;"></div>
        <div style="position: absolute; bottom: 240px; left: 75px; right: 75px; z-index: 10; display: flex; flex-direction: column;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="color: white; font-weight: 900; margin: 0; line-height: 1.2; font-size: 54px; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
            ${subtext ? `<p style="color: #cbd5e1; font-weight: 500; font-size: 24px; margin: 12px 0 0 0; text-shadow: 0 2px 8px rgba(0,0,0,0.6);text-wrap: balance; overflow-wrap: break-word;">${subtext}</p>` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%;">
            ${stats.slice(0, 2).map((s: any, i: number) => {
        const bgs = ["rgba(16, 185, 129, 0.15)", "rgba(59, 130, 246, 0.15)"];
        const borderColor = i === 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)";
        return `
                <div style="border-radius: 20px; background: ${bgs[i % 2]}; border: 1.5px solid ${borderColor}; backdrop-filter: blur(8px); padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #ffffff; line-height: 1.2;">${s.label}</div>
                  <div style="font-size: 48px; font-weight: 900; line-height: 1; color: #10B981;">${s.value}</div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    } else {
      // Custom HTML or standard overlay
      htmlContent = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.92) 80%); z-index: 2;"></div>
        ${visualData?.customHtml ? `
          <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; z-index: 5;">
            ${sanitizeTemplateHtml(visualData.customHtml).html}
          </div>
        ` : `
          <div style="position: absolute; bottom: 250px; left: 75px; right: 75px; text-align: center; z-index: 5; display: flex; flex-direction: column; align-items: center;">
            <h2 style="color: white; font-weight: 950; font-size: 64px; margin: 0 0 16px 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
            ${subtext ? `<p style="color: #cbd5e1; font-size: 28px; font-weight: 500; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8); text-wrap: balance; overflow-wrap: break-word;">${subtext}</p>` : ''}
          </div>
        `}
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;950&family=JetBrains+Mono:wght@400;500;700;800&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background: #0c0f12; }
  h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
<div style="width: 1080px; height: 1080px; position: relative; background: #0c0f12; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; padding: 75px;">
  <img src="data:${bgMime};base64,${bgBase64}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
  
  <!-- Dynamic styles content overlaid -->
  ${htmlContent}

  <!-- Header Logo/Badge overlay -->
  <div style="position: absolute; top: 75px; left: 75px; z-index: 100; display: flex; justify-content: flex-start; align-items: center; width: calc(100% - 150px);">
    ${activeLogo ? `
      <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(12px); border: 2px solid rgba(255,255,255,0.18); padding: 14px 28px; border-radius: 20px; display: inline-flex; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-height: 110px;">
        <img src="${activeLogo}" style="max-height: 75px; max-width: 250px; object-fit: contain;" />
      </div>
    ` : `
      <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(12px); border: 2px solid rgba(255,255,255,0.18); padding: 18px 36px; border-radius: 50px; display: inline-flex; align-items: center; gap: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <span style="font-size: 32px; line-height: 1;">🏢</span>
        <span style="color: #ffffff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; font-size: 26px; font-family: 'Inter', sans-serif;">${businessProfile?.businessName || "LOCAL MERCHANT"}</span>
      </div>
    `}
  </div>

  <!-- Contact/Location Information Grid Footer -->
  <div style="z-index: 100; width: 100%; margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; box-sizing: border-box; padding-top: 24px; border-top: 2px dashed rgba(255,255,255,0.15);">
    <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.1); padding: 22px 26px; border-radius: 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 30px; line-height: 1;">📍</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Locate Store</span>
        <span style="font-size: 17px; color: #ffffff; font-weight: 600; line-height: 1.35; overflow-wrap: break-word; max-width: 360px;">${businessProfile?.address || "Visit store for details"}</span>
      </div>
    </div>

    <div style="background: rgba(12,15,18,0.85); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.1); padding: 22px 26px; border-radius: 20px; display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 30px; line-height: 1;">📞</span>
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Contact Line</span>
        <span style="font-size: 19px; color: #10B981; font-weight: 800; font-family: 'JetBrains Mono', monospace; line-height: 1.2;">${businessProfile?.phoneNumber || from}</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
  }

export   const handleServeImage = async (req: any, res: any) => {
    try {
      const { imageId } = req.params;

      // Try serving from local disk first (campaign_images then legacy whatsapp_images)
      try {
        const campaignPath = path.join(process.cwd(), 'public', 'campaign_images', `${imageId}.png`);
        const legacyPath = path.join(process.cwd(), 'public', 'whatsapp_images', `${imageId}.png`);
        let buffer: Buffer;
        try {
          buffer = await fs.readFile(campaignPath);
        } catch {
          buffer = await fs.readFile(legacyPath);
        }
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      } catch (err) {
        // Not found locally or read error, fallback to Firestore
      }

      if (!db) {
        return res.status(404).send('Database not initialized');
      }
      let doc = await db.collection('campaign_images').doc(imageId).get();
      if (!doc.exists) {
        doc = await db.collection('whatsapp_images').doc(imageId).get();
      }
      if (!doc.exists) {
        return res.status(404).send('Image not found');
      }
      const data = doc.data();
      if (!data) {
        return res.status(404).send('Image data missing');
      }
      if (data.base64Data) {
        const buffer = Buffer.from(data.base64Data, 'base64');
        res.writeHead(200, {
          'Content-Type': data.mimeType || 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      }
      if (data.storageUrl) {
        return res.redirect(data.storageUrl);
      }
      try {
        const bucket = admin.storage().bucket('map-api-459818.firebasestorage.app');
        const file = bucket.file(data.storagePath || `campaign_images/${imageId}.png`);
        const [buffer] = await file.download();
        res.writeHead(200, {
          'Content-Type': data.mimeType || 'image/png',
          'Content-Length': buffer.length
        });
        return res.end(buffer);
      } catch (storageErr) {
        return res.status(404).send('Image not found in storage');
      }
    } catch (err: any) {
      console.error('[Serve Image Error]', err);
      res.status(500).send('Failed to serve image');
    }
  };


export async function sendWhatsAppMessageService(params: {
  productId: string;
  to: string;
  type?: string;
  text?: string;
  imageUrl?: string;
  templateName?: string;
  languageCode?: string;
}) {
  const { productId, to, type, text, imageUrl, templateName, languageCode } = params;
  if (!productId) throw new Error('Product ID is required');
  if (!to) throw new Error('Recipient phone (to) is required');

  const token = await getToken(productId, 'whatsapp');
  const phoneNumberId = await getToken(productId, 'whatsapp_phone_number_id');

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Outbound Simulation] Mock sending message to ${to}:`, { type, text, imageUrl });
    return {
      success: true,
      mode: "developer-simulation",
      message: "Triggered in simulation mode. No Meta credentials configured yet.",
      data: { to, type, text, imageUrl }
    };
  }

  let payload: any = {
    messaging_product: "whatsapp",
    to: to.replace(/[\s\+\-\(\)]/g, '')
  };

  if (type === "template") {
    payload.type = "template";
    payload.template = {
      name: templateName || "hello_world",
      language: { code: languageCode || "en_US" }
    };
  } else if (imageUrl) {
    payload.type = "image";
    payload.image = {
      link: imageUrl,
      caption: text || ""
    };
  } else {
    payload.type = "text";
    payload.text = {
      body: text || "",
      preview_url: false
    };
  }

  const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
  const metaResponse = await fetch(metaUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const metaData = await metaResponse.json();
  if (!metaResponse.ok) {
    throw new Error(metaData.error?.message || "Meta API Error");
  }

  if (db) {
    await db.collection('admin_logs').add({
      timestamp: new Date().toISOString(),
      type: "whatsapp_outbound",
      recipient: to,
      status: "delivered",
      payloadType: type || "text"
    });
  }

  return { success: true, mode: "real-meta-graph", details: metaData };
}

export async function processInboundWhatsAppMessage(incomingPayload: any, reqHost?: string, reqProtocol?: string) {
  // Maintain in-memory logs
  globalWebhookPayloads.unshift({
    id: 'log_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    type: "whatsapp_webhook_payload",
    bodySnapshot: JSON.stringify(incomingPayload).substring(0, 500)
  });
  if (globalWebhookPayloads.length > 50) globalWebhookPayloads.pop();

  if (db) {
    await db.collection('admin_logs').add({
      timestamp: new Date().toISOString(),
      type: "whatsapp_webhook_payload",
      bodySnapshot: JSON.stringify(incomingPayload).substring(0, 500)
    }).catch(err => console.error("Could not write payload log to Firestore:", err.message));
  }

  // Extract message details
  const entry = incomingPayload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // Sender's phone number or wa_id
        const messageType = message.type; // "image", "text", etc.
        const incomingPhoneNumberId = value?.metadata?.phone_number_id; // Recipient WhatsApp Business Phone ID

        let textBody = "";
        let incomingImageId = null;
        let incomingImageMime = "";

        if (messageType === 'text') {
          textBody = message.text?.body || "";
        } else if (messageType === 'image') {
          textBody = message.image?.caption || "Create a post for this image asset";
          incomingImageId = message.image?.id;
          incomingImageMime = message.image?.mime_type || "image/jpeg";
        } else {
          // Unsupported message types fallback gracefully to text or caption
          textBody = message.text?.body || "Hello! Create a campaign copy for my product!";
        }

        console.log('[WhatsApp Webhook Context Parsing]', { from, messageType, textBody, incomingPhoneNumberId, incomingImageId });

        if (incomingPhoneNumberId) {
          // Process asynchronously to avoid holding the HTTP thread
          (async () => {
            // Locate corresponding productId and configuration tokens in Firestore
            let matchedProductId: string | null = null;
            let metaToken: string | null = null;
            let phoneNumberId: string | null = null;

            const processLogs: string[] = [];
            const addLog = (msg: string) => {
              const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              console.log(`[Diagnostic Log ${ts}] [Sender: ${from}] ${msg}`);
              processLogs.push(`[${ts}] ${msg}`);
            };

            addLog("Received inbound message on WhatsApp webhook.");

            if (db) {
              addLog("Accessing Firestore database to look up API tokens...");
              const snapshot = await db.collection('server_tokens').get();
              for (const doc of snapshot.docs) {
                const data = doc.data();
                if (data.whatsapp_phone_number_id === incomingPhoneNumberId) {
                  matchedProductId = doc.id;
                  metaToken = data.whatsapp;
                  phoneNumberId = data.whatsapp_phone_number_id;
                  break;
                }
              }

              // Fallback 1: If no exact matching phone number id doc, find first saved whatsapp token
              if (!metaToken) {
                addLog("Searching token references via fallback credentials...");
                for (const doc of snapshot.docs) {
                  const data = doc.data();
                  if (data.whatsapp) {
                    matchedProductId = doc.id;
                    metaToken = data.whatsapp;
                    phoneNumberId = data.whatsapp_phone_number_id || incomingPhoneNumberId;
                    break;
                  }
                }
              }
            }

            if (!metaToken) {
              // Try to find token in-memory if we have it and the database was null or empty
              for (const prodId of Object.keys(globalWhatsappTokens)) {
                if (globalWhatsappPhoneIds[prodId] === incomingPhoneNumberId || globalWhatsappTokens[prodId]) {
                  matchedProductId = prodId;
                  metaToken = globalWhatsappTokens[prodId];
                  phoneNumberId = globalWhatsappPhoneIds[prodId] || incomingPhoneNumberId;
                  break;
                }
              }
            }

            if (incomingPhoneNumberId) {
              phoneNumberId = incomingPhoneNumberId;
            } else if (!phoneNumberId) {
              phoneNumberId = "SIMULATOR_PHONE_ID";
            }
            if (!metaToken) {
              metaToken = "SIMULATOR_MOCK_TOKEN";
            }

            if (phoneNumberId && metaToken) {
              // Fetch corresponding separate WhatsApp Business Profile details based strictly on sender phone 'from'
              let businessProfile: any = null;
              if (db) {
                try {
                  addLog("Loading physical business profile credentials...");
                  const profileDoc = await db.collection('whatsapp_business_profiles').doc(from).get();
                  if (profileDoc.exists) {
                    businessProfile = profileDoc.data();
                    addLog(`Successfully loaded merchant business profile: "${businessProfile.businessName}"`);
                  } else {
                    addLog("Merchant profile not found. Initialized temporary onboarding profile.");
                  }
                } catch (eProfFetch) {
                  addLog("⚠️ Failed loading merchant business profile from database.");
                  console.error('[WhatsApp Webhook] Business Profile fetch error:', eProfFetch);
                }
              }

              // Download media image asset from Meta servers if message has an image attachment
              let base64Data: string | null = null;
              let mimeType = incomingImageMime || 'image/jpeg';
              let mediaUrl = "";

              if (message.image?.simulatedBase64Data) {
                addLog("Detected image file uploaded inside sandbox simulator chat.");
                base64Data = message.image.simulatedBase64Data;
                mimeType = message.image.mime_type || mimeType;
                if (db) {
                  const assetId = 'asset_' + Math.random().toString(36).substring(2, 10);
                  await saveImageLocalAndDb(assetId, base64Data, mimeType, `Uploaded via Chat Sandbox by ${from}`);

                  const host = reqHost || "localhost:3000";
                  const protocol = reqProtocol || "https";
                  mediaUrl = `${protocol}://${host}/api/whatsapp/images/${assetId}.png`;
                  addLog(`Saved sandbox media file reference successfully: ${mediaUrl}`);
                }
              } else if (incomingImageId && metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                try {
                  addLog(`Identified attached media photo. Querying Meta servers for attachment ID: ${incomingImageId}`);
                  const mediaUrlResponse = await fetch(`https://graph.facebook.com/v25.0/${incomingImageId}`, {
                    headers: { "Authorization": `Bearer ${metaToken}` }
                  });
                  if (mediaUrlResponse.ok) {
                    const mediaObj = await mediaUrlResponse.json();
                    const downloadUrl = mediaObj?.url;
                    mimeType = mediaObj?.mime_type || mimeType;

                    if (downloadUrl) {
                      addLog("Source URL identified. Commencing photo download stream from Meta...");
                      const mediaDataResponse = await fetch(downloadUrl, {
                        headers: { "Authorization": `Bearer ${metaToken}` }
                      });
                      if (mediaDataResponse.ok) {
                        const arrayBuffer = await mediaDataResponse.arrayBuffer();
                        base64Data = Buffer.from(arrayBuffer).toString('base64');
                        addLog(`Download finished! Parsed image size: ${Math.round(base64Data.length / 1024)} KB.`);

                        // Store image locally so dashboard/posts can serve it back directly
                        if (db) {
                          const assetId = 'asset_' + Math.random().toString(36).substring(2, 10);
                          await saveImageLocalAndDb(assetId, base64Data, mimeType, `Uploaded via WhatsApp by ${from}`);

                          const host = reqHost || "localhost:3000";
                          const protocol = reqProtocol || "https";
                          mediaUrl = `${protocol}://${host}/api/whatsapp/images/${assetId}.png`;
                          addLog(`Localized backup saved in Firestore. Access URL: ${mediaUrl}`);
                        }
                      } else {
                        addLog(`⚠️ Photo stream download failed with status: ${mediaDataResponse.status}`);
                      }
                    } else {
                      addLog("⚠️ Could not extract binary download link from Meta document metadata.");
                    }
                  } else {
                    addLog(`⚠️ Meta attachment lookup failed with response code: ${mediaUrlResponse.status}`);
                  }
                } catch (eMedia: any) {
                  addLog(`❌ Fatal error downloading media photo: ${eMedia.message}`);
                  console.error('[WhatsApp webhook media download error]', eMedia.message);
                }
              }

              // Detect if this image is intended to be their professional business branding logo
              let isLogoUpload = false;
              if (base64Data && (
                /logo/i.test(textBody) ||
                /set.*logo/i.test(textBody) ||
                /this is my logo/i.test(textBody) ||
                /business logo/i.test(textBody) ||
                /brand logo/i.test(textBody)
              )) {
                isLogoUpload = true;
                addLog("Logo keyword matched. Configuring profile logo branding update...");

                if (db) {
                  try {
                    if (!businessProfile) {
                      businessProfile = {
                        businessName: "My Local Business",
                        address: "",
                        phoneNumber: from,
                        updatedAt: new Date().toISOString()
                      };
                    }
                    businessProfile.logoBase64 = base64Data;
                    businessProfile.logoMime = mimeType;
                    businessProfile.logoUrl = mediaUrl;
                    businessProfile.updatedAt = new Date().toISOString();

                    await db.collection('whatsapp_business_profiles').doc(from).set(businessProfile);
                    addLog(`Finished saving custom brand logo to profile [Recipient: ${from}]`);
                  } catch (eLogo) {
                    addLog("⚠️ Failed in updating logo asset on database.");
                    console.error('[WhatsApp Webhook] Failed to write custom logo to profile:', eLogo);
                  }
                }
              }

              // Retrieve conversation history from Firestore
              let conversationHistory: any[] = [];
              if (db) {
                addLog("Retrieving chatbot conversation history log...");
                const convDoc = await db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`).get();
                if (convDoc.exists) {
                  conversationHistory = convDoc.data()?.history || [];
                  addLog(`Successfully loaded ${conversationHistory.length} history nodes.`);
                } else {
                  addLog("No existing chat session history found. Initialized clean state.");
                }
              }

              // Transform current conversation for Gemini Content pattern
              const cleanedHistory = conversationHistory.map((item: any) => ({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.parts?.[0]?.text || item.text || "" }]
              })).slice(-10);

              // Construct user message parts without multimodal image content analysis (skipped to avoid analyzing user backdrop content)
              const newUserParts: any[] = [];
              newUserParts.push({ text: textBody });

              const newUserMsg = { role: 'user', parts: newUserParts };
              cleanedHistory.push(newUserMsg);

              let userMsgPushed = false;

              // Determine if this is a post creation or image upload turn that triggers background processing delay
              const isPostCreation = !!base64Data || /post/i.test(textBody) || /campaign/i.test(textBody) || /offer/i.test(textBody) || /creative/i.test(textBody) || /make/i.test(textBody) || /create/i.test(textBody);

              if (isPostCreation) {
                const waitMsgText = "Creating your post... This will take about a minute. Please hold on! ⏳✨";

                // Add this delay notification to the conversation history immediately so the Live Chat UI displays it live
                conversationHistory.push(newUserMsg);
                conversationHistory.push({ role: 'model', parts: [{ text: waitMsgText }] });
                userMsgPushed = true;

                if (db) {
                  try {
                    const notifyDocRef = db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`);
                    await notifyDocRef.set({
                      from: from,
                      phoneNumberId: incomingPhoneNumberId,
                      businessProfile: businessProfile || null,
                      history: conversationHistory.slice(-20),
                      lastUpdated: new Date().toISOString()
                    }, { merge: true });
                    console.log('[WhatsApp Webhook] Appended delay notification live to db.');
                  } catch (eNotify) {
                    console.error('[WhatsApp Webhook] Delay DB sync error:', eNotify);
                  }
                }

                // If they are on a real WhatsApp channel, deliver this warning over Meta Cloud API
                if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                  try {
                    const delayPayload = {
                      messaging_product: "whatsapp",
                      to: from,
                      type: "text",
                      text: {
                        body: waitMsgText,
                        preview_url: false
                      }
                    };
                    const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
                    await fetch(metaUrl, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${metaToken}`,
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify(delayPayload)
                    });
                  } catch (eDelayOutbound) {
                    console.error('[WhatsApp Webhook] Failed to send delay alert outbound:', eDelayOutbound);
                  }
                }
              }

              // Setup dynamic marketing persona system instructions
              let systemInstruction = `You are "Tror", a premier AI-powered marketing co-pilot designed for local businesses. Your job is to help business owners create beautiful visual story assets that they can easily download and share directly on their WhatsApp Status, stories, or social media pages.

IMPORTANT PRINCIPLE: This system is built strictly for local small-and-medium businesses (SMBs). It is run completely separate from any other application products or dashboards. These posts are published exclusively as STORIES or STATUS updates (not standard timeline text feeds). Therefore, generating standard paragraphs of copywriting text content / captions is TOTALLY USELESS and must be COMPLETELY IGNORED. Only focus on generating high-converting graphic overlays and short headings.

YOUR CONVERSATIONAL WORKFLOW:

Step 1: Warm Greeting & Onboarding (If the local business details haven't been provided or need updates):
- Greet them warmly and professionally as "Tror, your AI marketing co-pilot".
- Ask clearly for:
  * Business Name
  * Business Address or Location
  * Best Contact Number to display for customers
- Mention that they can optionally upload their custom business logo image anytime by sending it and saying "this is my logo" or "set this as my logo". Once uploaded, our dynamic post designs will automatically place their gorgeous visual logo in the corner instead of plain text!
- Ask if they currently have any visual creative assets or images with them to use for today's post.
- Explicitly explain to them: 
  "If you don't have any images, don't worry! I'll generate a stunning, custom-tailored visual graphic for you from scratch. If you DO have an asset/photo, go ahead and send/upload it right here in this chat, and I'll write the perfect post around it!"

Step 2: Ignore Content Creation, Prioritize Visual Overlays:
- DO NOT generate, draft, or output long, verbose paragraph copywriting blocks, marketing plans, or conversational analysis of product photos in your chat text. The business owner only needs a beautiful story graphic.
- Keep your direct message response extremely brief (say, 1 or 2 sentences max) to introduce or confirm the story graphic flyer (e.g., "Perfect! I have generated your customized daily story flyer with professional visual layering below. 🎨✨").
- Your primary focus is on formatting the headline text overlays and background details beautifully.
- If the user provided/uploaded an image, DO NOT analyze its design style, details, or color choices. Use it strictly as a background scene itself, and only select a high-impact typographic heading and subtext to layer on top of it. Do NOT include any cinematicPrompt or [IMAGE_PROMPT: ...] if an image is provided.
- If no image was provided, you MUST specify a highly detailed photographic background image prompt inside the cinematicPrompt field or write it as [IMAGE_PROMPT: <visual prompt with NO text inside the image>] at the absolute end, so our systems can generate the perfect base scenery.

Step 3: Background Campaign Synchronization & Visual Layout overlay:
- You MUST output a structured JSON campaign configuration block wrapped EXACTLY inside the XML tags "<CAMPAIGN_DATA>" and "</CAMPAIGN_DATA>" at the absolute bottom of your response text. This ensures our background script logs the flyer's details!
- Inside the CAMPAIGN_DATA block, the JSON MUST follow this structure:
  <CAMPAIGN_DATA>
  {
    "theme": "WhatsApp Promo Post",
    "audience": "Local customers & regular buyers",
    "coreMessage": "Highlighting business benefits & contact call-to-action",
    "hook": "An engaging hook suited to the business topic",
    "cta": "Call or visit our store today",
    "copy": "concise slogan or call to action text",
    "platform": "WhatsApp Status",
    "visualType": "creative-story",
    "visualData": {
      "headline": "A short, punchy marketing headline (max 6-8 words) to render on the graphic flyer",
      "subtext": "Slogan or supporting details / discount terms to overlay",
      "cinematicPrompt": "Detailed photographic cinematic studio shot prompt to generate background if no image is attached, else leave empty"
    }
  }
  </CAMPAIGN_DATA>

- The "visualType" parameter inside CAMPAIGN_DATA can be chosen from:
  * "creative-story": Classic storytelling gradient overlay with a bottom-aligned large headline and subtext. Best for general promos, luxury brands, and storytelling posts.
  * "abstract-announcement": Radial color gradient blend overlaid with a centered beautiful blurred glassmorphic card holding the headline and subtext. Great for major announcements, grand openings, and seasonal sales.
  * "powerful-quote": Centered quote layout with large, elegant typography and stylized quotation marks. Great for company manifestos, premium guarantees, and client testimonials.
  * "data-infographic": A stylized benefit breakdown displaying 2 structured grid stat panels. Great for listings of prices, multiple offer points, or distinct business benefits (e.g., {"headline": "Why Choose Us!", "stats": [{"label": "Discount", "value": "20% OFF"}, {"label": "Warranty", "value": "2 Years"}]}).

Step 4: Automatic Business Profile Interception:
- When the business owner shares or updates their Business Name, Address/Location, or Contact Number, you MUST write a structured JSON block wrapped in "<BUSINESS_PROFILE>" and "</BUSINESS_PROFILE>" XML tags so our automated backend can index their profile separately from any product catalogue!
- The JSON block must have these exact 3 keys:
  <BUSINESS_PROFILE>
  {
    "businessName": "Name of the local business",
    "address": "Business Address or Location/Area",
    "phoneNumber": "Contact Phone to display for clients"
  }
  </BUSINESS_PROFILE>
  (Only output this block when they mention or update these details)Remember: Keep your conversational tone concise, humble, and strictly professional with zero unrequested analysis or feedback.`;

              if (businessProfile) {
                systemInstruction += `\n\nActive Context for this local business merchant (LOADED FROM DEDICATED WHATSAPP MERCHANT LOGS):
Business Name: "${businessProfile.businessName}"
Contact Number: "${businessProfile.phoneNumber}"
Business Address/Location: "${businessProfile.address || 'N/A'}"
Has Brand Logo Uploaded: ${businessProfile.logoBase64 ? 'YES' : 'NO'}

Since this local business is already set up and saved, bypass Step 1's onboarding questions and instantly greet them warmly referencing "${businessProfile.businessName}"! Let them know we can design their next post copy & graphics immediately. If they have already uploaded a logo, warmly note that any flyers will be custom branded using their visual logo.`;
              } else {
                systemInstruction += `\n\nCRITICAL SYSTEM REQUIREMENT:
The user HAS NOT completed their local business details (Business Name, Address, and Contact Number) yet. 
If they share these details in their current message (either business name, address, or phone), you MUST intercept them and output the <BUSINESS_PROFILE> block so we can save it.
However, if they ask to make a campaign or send a product photo, and they have not shared their Business Name, Address, or Contact Number yet, proceed directly with campaign copy and image prompt, but display a warm note encouraging them to share their business details so we can add custom branding logos.`;
              }

              if (isLogoUpload) {
                systemInstruction += `\n\n[USER ACTION REMINDER: The user has just uploaded their custom business logo image! We successfully saved it to their profile. Confirm that their beautiful branding logo has been saved, congratulate them, let them know that we will display this visual logo emblem on all dynamically generated status/story flyers instead of plain text, and ask them what creative campaign or offer they want to design next! Do NOT generate any marketing campaign or image prompt for this logo upload turn.]`;
              }

              if (base64Data) {
                systemInstruction += `\n\n[CRITICAL CURRENT CONTEXT: The user HAS provided/uploaded their own custom image with their current message! Therefore, you MUST NOT include any "cinematicPrompt" inside your "visualData" block, and you MUST NOT output any "[IMAGE_PROMPT: ...]" string anywhere. Focus strictly on choosing a high-impact editorial headline and subtext ("headline" and "subtext" inside "visualData") to label/overlay directly on top of their custom image.]`;
              } else {
                systemInstruction += `\n\n[CRITICAL CURRENT CONTEXT: The user HAS NOT uploaded any image. You MUST specify a highly detailed photographic scenic background description inside the "cinematicPrompt" field of "visualData", and also append it as "[IMAGE_PROMPT: <scenic description with NO text>]" at the absolute end of your response so our background Imagen AI generator can synthesize a beautiful custom background.]`;
              }

              // Instantiate Google Gen AI Client
              let geminiKey = process.env.GEMINI_API_KEY;
              if (!geminiKey) {
                addLog("ERROR: process.env.GEMINI_API_KEY is not configured.");
                throw new Error("Missing GEMINI_API_KEY environment variable.");
              }
              const ai = new GoogleGenAI({
                apiKey: geminiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });

              addLog(`Sending conversational prompt to Gemini model. Multi-modal mode: ${base64Data ? "YES (using attached custom image as background backdrop)" : "NO"}`);
              console.log('[WhatsApp AI Bot processing]', { model: 'gemini-3.5-flash', hasImage: !!base64Data });

              const geminiResponse = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: cleanedHistory,
                config: {
                  systemInstruction
                }
              });

              if (matchedProductId && db) {
                try {
                  const productDoc = await db.collection('products').doc(matchedProductId).get();
                  if (productDoc.exists) {
                    const webhookUserId = productDoc.data()?.userId;
                    if (webhookUserId) {
                      await logBackendTokenUsage(
                        webhookUserId,
                        "whatsapp_chatbot_generation",
                        "gemini-3.5-flash",
                        geminiResponse.usageMetadata
                      );
                    }
                  }
                } catch (eTokenLog) {
                  console.error('[WhatsApp webhook token log error]', eTokenLog);
                }
              }

              addLog("Gemini content synthesis and layout analysis completed.");
              const replyText = geminiResponse.text || "Hello! We couldn't generate a text response at this stage.";
              console.log('[WhatsApp AI Bot reply text]', replyText);

              // Parse Campaign creation configuration
              const campaignRegex = /<CAMPAIGN_DATA>([\s\S]*?)<\/CAMPAIGN_DATA>/i;
              let campaignMatch = replyText.match(campaignRegex);
              let cleanReplyText = replyText;

              if (campaignMatch) {
                addLog("Successfully extracted campaign structural metadata.");
                // Strip the structured block from user WhatsApp text to keep chat beautiful
                cleanReplyText = cleanReplyText.replace(campaignRegex, '').trim();
              }

              // Parse Business Profile creation/updates configuration
              const profileRegex = /<BUSINESS_PROFILE>([\s\S]*?)<\/BUSINESS_PROFILE>/i;
              const profileMatch = replyText.match(profileRegex);
              if (profileMatch && db) {
                try {
                  const cleanedJsonStr = profileMatch[1].trim();
                  const parsedProfile = safeParseJSON(cleanedJsonStr);
                  addLog(`Found business profile update payload: "${parsedProfile.businessName}"`);
                  console.log('[WhatsApp Webhook] Intercepted Business Profile update JSON:', parsedProfile);

                  businessProfile = {
                    businessName: parsedProfile.businessName || "My Local Business",
                    address: parsedProfile.address || "",
                    phoneNumber: parsedProfile.phoneNumber || from,
                    updatedAt: new Date().toISOString()
                  };

                  await db.collection('whatsapp_business_profiles').doc(from).set(businessProfile);
                  addLog("Profile credentials saved to Firestore.");
                  console.log(`[WhatsApp Webhook] Saved separate business profile for merchant ${from}`);
                } catch (eProf) {
                  addLog("⚠️ Failed in updating merchant business profile database.");
                  console.error('[WhatsApp Webhook] Business Profile Firestore save failed', eProf);
                }
                // Strip the structured block from user WhatsApp text to keep chat beautiful
                cleanReplyText = cleanReplyText.replace(profileRegex, '').trim();
              }

              // Detect image generation prompts
              const imagePromptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/i;
              const match = cleanReplyText.match(imagePromptRegex);
              let imagePrompt: string | null = null;

              if (match) {
                imagePrompt = match[1].trim();
                cleanReplyText = cleanReplyText.replace(imagePromptRegex, '').trim();
                addLog(`Extracted AI background prompt: "${imagePrompt}"`);
                console.log('[WhatsApp AI Bot extracted image prompt]', imagePrompt);
              }

              if (isLogoUpload) {
                // Skip image asset generation on logo configuration turn to avoid low-effort placeholder creatives of the logo itself
                imagePrompt = null;
              }

              // Dynamic real-time Campaign Document insertion inside Firestore!
              let createdCampaignId = "";
              if (campaignMatch && db) {
                try {
                  const cleanedJsonStr = campaignMatch[1].trim();
                  const parsedCampaign = safeParseJSON(cleanedJsonStr);
                  console.log('[WhatsApp Webhook] Extracted Campaign JSON for Local Business:', parsedCampaign);

                  createdCampaignId = 'wa_camp_' + Math.random().toString(36).substring(2, 12);
                  addLog("Syncing new Campaign story reference in campaigns database...");

                  await db.collection('campaigns').doc(createdCampaignId).set({
                    productId: matchedProductId || "whatsapp_retail_id",
                    productName: businessProfile?.businessName || parsedCampaign.theme || "WhatsApp Generated Post",
                    productLogoUrl: "",
                    theme: parsedCampaign.theme || "WhatsApp Generated Post",
                    targetAudience: parsedCampaign.audience || "Local customers & clients",
                    coreMessage: parsedCampaign.coreMessage || "Automated Local Commerce Promotion",
                    hook: parsedCampaign.hook || "",
                    cta: parsedCampaign.cta || "",
                    contentFormat: "WhatsApp Asset Post",
                    repurposingNotes: `Generated automatically via Tror local commerce chat with user ${from}. ` + (mediaUrl ? "Used client-uploaded asset." : "Based on conversational text inputs."),
                    confidenceScore: 99,
                    pillar: "WhatsApp Outbox",
                    subCategory: "WhatsApp Chat",
                    createdAt: new Date().toISOString(),
                    startDate: new Date().toISOString().split('T')[0],
                    platformVersions: [
                      {
                        platform: parsedCampaign.platform || "WhatsApp Status",
                        copy: parsedCampaign.copy || cleanReplyText,
                        format: "Image Post",
                        imagePrompt: parsedCampaign.visualPrompt || imagePrompt || "",
                        imageUrl: mediaUrl || ""
                      }
                    ],
                    dailyPosts: [
                      {
                        day: "Monday",
                        contentType: "Local Business Social Outreach",
                        platformVersions: [
                          {
                            platform: parsedCampaign.platform || "WhatsApp Status",
                            copy: parsedCampaign.copy || cleanReplyText,
                            format: "Image Post",
                            imagePrompt: parsedCampaign.visualPrompt || imagePrompt || "",
                            imageUrl: mediaUrl || ""
                          }
                        ]
                      }
                    ]
                  });

                  console.log(`[WhatsApp Webhook] Successfully built and saved local business campaign: ${createdCampaignId}`);
                  addLog("Campaign successfully generated and registered.");
                } catch (eCamp) {
                  addLog("⚠️ Failed to write Campaign configuration to database.");
                  console.error('[WhatsApp Webhook] Campaign Firestore creation failed', eCamp);
                }
              }

              // Generate visual creatives if requested via [IMAGE_PROMPT: ...] OR if user uploaded a photo (even if onboarding is still empty)
              const shouldRenderCanvas = !!imagePrompt || !!base64Data;

              if (shouldRenderCanvas) {
                let generatedBase64 = null;
                let generatedMime = 'image/png';

                // Resolve premium prompt from campaign visualData if available, fallback to extracted imagePrompt
                let overlayPrompt = imagePrompt;
                let visualType = "creative-story"; // default style
                let visualData: any = null;

                if (campaignMatch) {
                  try {
                    const parsedCampaign = safeParseJSON(campaignMatch[1].trim());
                    if (parsedCampaign.visualType) {
                      visualType = parsedCampaign.visualType;
                    }
                    if (parsedCampaign.visualData) {
                      visualData = parsedCampaign.visualData;
                      if (parsedCampaign.visualData.cinematicPrompt) {
                        overlayPrompt = parsedCampaign.visualData.cinematicPrompt;
                      }
                    } else {
                      visualData = {
                        headline: parsedCampaign.theme || parsedCampaign.hook || parsedCampaign.coreMessage || "Special Promotion!",
                        subtext: parsedCampaign.cta || ""
                      };
                    }
                  } catch (eHl) { }
                }

                if (!visualData) {
                  visualData = {
                    headline: "Special Exclusive Offer!",
                    subtext: "Limited time promotion"
                  };
                }

                // Generating a fresh AI image only if requested AND the user did NOT upload their own graphic backdrop
                if (overlayPrompt && !base64Data) {
                  try {
                    addLog(`Triggering Imagen generator with prompt: "${overlayPrompt}"`);
                    const imgRes = await ai.models.generateContent({
                      model: 'gemini-3.1-flash-image-preview',
                      contents: { parts: [{ text: overlayPrompt }] },
                      config: { imageConfig: { aspectRatio: "1:1" } }
                    });

                    if (matchedProductId && db) {
                      try {
                        const productDoc = await db.collection('products').doc(matchedProductId).get();
                        if (productDoc.exists) {
                          const webhookUserId = productDoc.data()?.userId;
                          if (webhookUserId) {
                            await logBackendTokenUsage(
                              webhookUserId,
                              "whatsapp_chatbot_image",
                              "gemini-3.1-flash-image-preview",
                              {
                                promptTokenCount: 0,
                                candidatesTokenCount: 0,
                                totalTokenCount: 1
                              }
                            );
                          }
                        }
                      } catch (eTokenLog) {
                        console.error('[WhatsApp webhook image token log error]', eTokenLog);
                      }
                    }

                    if (imgRes?.candidates?.[0]?.content?.parts) {
                      for (const pt of imgRes.candidates[0].content.parts) {
                        if (pt.inlineData) {
                          generatedBase64 = pt.inlineData.data;
                          generatedMime = pt.inlineData.mimeType || 'image/png';
                          addLog("Imagen background generated successfully.");
                          break;
                        }
                      }
                    }
                  } catch (eImg: any) {
                    addLog(`⚠️ Imagen background generation failed: ${eImg.message || eImg}`);
                    console.warn('[WhatsApp Webhook Image Gen Fallback]', eImg);
                  }
                }

                // LAYERED CANVAS GENERATION ENGINE (LIKE DYNAMIC APP CANVAS API RENDERING)
                let finalBrandedBase64 = null;
                let finalBrandedMime = 'image/jpeg';
                // Always prefer the newly generated AI campaign image; fallback to the user's uploaded raw photo only if generation fails
                const bgBase64 = generatedBase64 || base64Data;
                const bgMime = generatedBase64 ? generatedMime : mimeType;

                if (bgBase64) {
                  try {
                    addLog(`Constructing premium HTML overlay canvas (Layout style: ${visualType})`);

                    const canvasHtml = generateBrandedCanvasHtml(
                      visualType,
                      visualData,
                      bgBase64,
                      bgMime,
                      businessProfile,
                      from
                    );

                    const renderResult = await runWithRenderLock(async (browser) => {
                      addLog("Spawned rendering viewport in headless screenshot pool...");
                      const page = await browser.newPage();
                      try {
                        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
                        await page.setContent(canvasHtml, { waitUntil: 'load', timeout: 25000 });

                        await page.evaluate(async () => {
                          await document.fonts.ready;
                          const images = Array.from(document.querySelectorAll('img'));
                          await Promise.all(images.map(img => {
                            if (img.complete) return Promise.resolve();
                            return new Promise((resolve) => {
                              img.onload = resolve;
                              img.onerror = resolve;
                            });
                          }));
                        });

                        addLog("Canvas markup processed. Screenshot capturing in progress...");
                        const buffer = await page.screenshot({ type: 'jpeg', quality: 92 });
                        addLog("Screenshot captured successfully!");
                        return buffer.toString('base64');
                      } finally {
                        await page.close().catch(() => { });
                      }
                    });

                    if (renderResult) {
                      finalBrandedBase64 = renderResult;
                      finalBrandedMime = 'image/jpeg';
                    }
                  } catch (eRender: any) {
                    addLog(`❌ Puppeteer layout render failed: ${eRender.message || eRender}`);
                    console.error('[WhatsApp Webhook Branded Canvas Rendering Failed]', eRender);
                  }
                } else {
                  addLog("⚠️ Skipped overlay: No base background image available.");
                }

                const base64ToSave = finalBrandedBase64 || bgBase64;
                const mimeToSave = finalBrandedBase64 ? finalBrandedMime : bgMime;

                if (base64ToSave && db) {
                  try {
                    addLog("Saving branded story flyer to database...");
                    const outImageId = 'img_' + Math.random().toString(36).substring(2, 10);
                    await saveImageLocalAndDb(outImageId, base64ToSave, mimeToSave, imagePrompt || "");

                    const host = reqHost || "localhost:3000";
                    const protocol = reqProtocol || "https";
                    const finalImgUrl = `${protocol}://${host}/api/whatsapp/images/${outImageId}.png`;

                    addLog(`Saved! View flyer live: ${finalImgUrl}`);

                    // Update conversation history in Firestore with the generated/branded image so the simulator dashboard displays Tror's image reply live!
                    try {
                      const convDocRef = db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`);
                      const convDoc = await convDocRef.get();
                      if (convDoc.exists) {
                        const data = convDoc.data();
                        const history = data?.history || [];
                        for (let i = history.length - 1; i >= 0; i--) {
                          if (history[i].role === 'model') {
                            if (history[i].parts) {
                              const hasImage = history[i].parts.some((p: any) => p.inlineData);
                              if (!hasImage) {
                                history[i].parts.unshift({
                                  inlineData: {
                                    mimeType: mimeToSave,
                                    data: base64ToSave
                                  }
                                });
                              }
                            }
                            break;
                          }
                        }
                        await convDocRef.update({
                          history: history,
                          lastUpdated: new Date().toISOString()
                        });
                      }
                    } catch (eConvUpdate) {
                      console.error('[WhatsApp Webhook] Failed to append reply image to conversation history:', eConvUpdate);
                    }

                    // Update campaign with final visual URL reference
                    if (createdCampaignId) {
                      try {
                        await db.collection('campaigns').doc(createdCampaignId).set({
                          platformVersions: [
                            {
                              platform: "WhatsApp Status",
                              copy: cleanReplyText.split('\n\n🎯')[0],
                              format: "Image Post",
                              imagePrompt: imagePrompt,
                              imageUrl: finalImgUrl
                            }
                          ],
                          dailyPosts: [
                            {
                              day: "Monday",
                              contentType: "Local Business Social Outreach",
                              platformVersions: [
                                {
                                  platform: "WhatsApp Status",
                                  copy: cleanReplyText.split('\n\n🎯')[0],
                                  format: "Image Post",
                                  imagePrompt: imagePrompt,
                                  imageUrl: finalImgUrl
                                }
                              ]
                            }
                          ]
                        }, { merge: true });
                        addLog("Synced image flyer URL with Firestore Campaigns document.");
                      } catch (eCampUpdate) {
                        console.error('[WhatsApp webhook dynamic image update failed]', eCampUpdate);
                      }
                    }

                    if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                      addLog("Broadcasting image graphic message back to client...");
                      const imgOutboundPayload = {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "image",
                        image: { link: finalImgUrl }
                      };

                      await new Promise((resolve) => setTimeout(resolve, 1500));

                      const imgMetaResponse = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
                        method: "POST",
                        headers: {
                          "Authorization": `Bearer ${metaToken}`,
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify(imgOutboundPayload)
                      });

                      if (!imgMetaResponse.ok) {
                        const errPayload = await imgMetaResponse.json();
                        addLog(`⚠️ Outbox image broadcast failed: ${JSON.stringify(errPayload)}`);
                      } else {
                        addLog("Outbox image flyer delivered successfully!");
                      }
                    } else {
                      console.log(`[WhatsApp Webhook Simulator Image Outbound] Local assets served successfully: ${finalImgUrl}`);
                    }
                  } catch (eSave: any) {
                    addLog(`❌ Error finishing save and broadcast: ${eSave.message || eSave}`);
                  }
                }
              }

              // Complete processing and confirm sync safely
              addLog("Processing completed successfully.");
              if (campaignMatch) {
                cleanReplyText += `\n\n🎯 Campaign Synced!\nYour special story update flyer and post content have been successfully created and saved to your dashboard!`;
              }

              // Update conversation history database with the reply
              const modelReplyMsg = { role: 'model', parts: [{ text: cleanReplyText }] };
              if (!userMsgPushed) {
                conversationHistory.push(newUserMsg);
              }
              conversationHistory.push(modelReplyMsg);

              if (db) {
                try {
                  await db.collection('whatsapp_conversations').doc(`${incomingPhoneNumberId}_${from}`).set({
                    from: from,
                    phoneNumberId: incomingPhoneNumberId,
                    businessProfile: businessProfile || null,
                    history: conversationHistory.slice(-20),
                    lastUpdated: new Date().toISOString(),
                    lastProcessLogs: processLogs
                  }, { merge: true });
                } catch (eConvSave) {
                  console.error('[WhatsApp Webhook] Error updating conversation:', eConvSave);
                }

                try {
                  await db.collection('admin_logs').add({
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_process_run",
                    recipient: from,
                    status: "success",
                    logs: processLogs,
                    replyBody: cleanReplyText.substring(0, 200)
                  });
                } catch (eAdminLog) {
                  console.error('[WhatsApp Webhook] Error appending admin log:', eAdminLog);
                }
              }

              // Send OUTBOUND WhatsApp live message back to the active user's phone via Meta Graph API
              if (metaToken && metaToken !== 'SIMULATOR_MOCK_TOKEN') {
                const outboundPayload = {
                  messaging_product: "whatsapp",
                  to: from,
                  type: "text",
                  text: {
                    body: cleanReplyText,
                    preview_url: false
                  }
                };

                const metaUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
                const metaResponse = await fetch(metaUrl, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${metaToken}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(outboundPayload)
                });

                const metaResData = await metaResponse.json();
                if (!metaResponse.ok) {
                  console.error('[WhatsApp Outbound Webhook Send Error]', metaResData);
                  globalBotReplies.unshift({
                    id: 'repl_' + Math.random().toString(36).substring(2, 10),
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_bot_reply_error",
                    recipient: from,
                    status: "failed",
                    replyBody: cleanReplyText.substring(0, 100),
                    error: metaResData
                  });
                  if (globalBotReplies.length > 50) globalBotReplies.pop();

                  if (db) {
                    await db.collection('admin_logs').add({
                      timestamp: new Date().toISOString(),
                      type: "whatsapp_bot_reply_error",
                      recipient: from,
                      status: "failed",
                      replyBody: cleanReplyText.substring(0, 100),
                      error: JSON.stringify(metaResData)
                    }).catch(err => console.error("Could not write send error to Firestore:", err.message));
                  }
                } else {
                  console.log('[WhatsApp Outbound Webhook Sent successfully]', metaResData);
                  globalBotReplies.unshift({
                    id: 'repl_' + Math.random().toString(36).substring(2, 10),
                    timestamp: new Date().toISOString(),
                    type: "whatsapp_bot_reply",
                    recipient: from,
                    status: "sent",
                    replyBody: cleanReplyText.substring(0, 200)
                  });
                  if (globalBotReplies.length > 50) globalBotReplies.pop();

                  if (db) {
                    await db.collection('admin_logs').add({
                      timestamp: new Date().toISOString(),
                      type: "whatsapp_bot_reply",
                      recipient: from,
                      status: "sent",
                      replyBody: cleanReplyText.substring(0, 200)
                    }).catch(err => console.error("Could not write send success to Firestore:", err.message));
                  }
                }
              } else {
                console.log(`[WhatsApp Webhook Simulator Outbound Reply] To: ${from} | Msg: ${cleanReplyText}`);
              }
            } else {
              console.warn('[WhatsApp Bot] Configuration tokens missing for phone ID:', incomingPhoneNumberId);
            }
          })().catch((errAsync) => {
            console.error('[WhatsApp Async Webhook Process Crash]', errAsync);
          });
        }
      }
}
