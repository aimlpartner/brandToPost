import nodemailer from 'nodemailer';
import { db } from '../config/firebase';
import { publishItemInstantly } from './publisherService';

export interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export async function sendBrandedEmail(options: SendEmailOptions): Promise<any> {
  const { to, subject, title, bodyHtml, ctaText, ctaUrl, attachments } = options;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const ctaButtonHtml = ctaText && ctaUrl ? `
    <div class="cta-container" style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" class="cta-button" target="_blank" style="background: linear-gradient(135deg, #7c3aed 0%, #2583eb 100%); color: #ffffff !important; padding: 14px 28px; font-weight: 600; text-decoration: none; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);">${ctaText}</a>
    </div>
  ` : '';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        background-color: #f8fafc;
        padding: 40px 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
      }
      .header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        padding: 32px;
        text-align: center;
      }
      .header img {
        height: 40px;
        display: inline-block;
      }
      .content {
        padding: 40px 32px;
      }
      .title {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.25;
      }
      .body-text {
        font-size: 16px;
        line-height: 1.6;
        color: #475569;
        margin-bottom: 24px;
      }
      .cta-container {
        text-align: center;
        margin: 32px 0;
      }
      .cta-button {
        background: linear-gradient(135deg, #7c3aed 0%, #2583eb 100%);
        color: #ffffff !important;
        padding: 14px 28px;
        font-weight: 600;
        text-decoration: none;
        border-radius: 9999px;
        display: inline-block;
        box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
      }
      .footer {
        background-color: #f1f5f9;
        padding: 24px 32px;
        text-align: center;
        font-size: 14px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .footer-links {
        margin-top: 12px;
      }
      .footer-link {
        color: #7c3aed;
        text-decoration: none;
        margin: 0 8px;
      }
    </style>
  </head>
  <body>
    <div class="wrapper" style="width: 100%; background-color: #f8fafc; padding: 40px 0;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
        <div class="header" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;">
          <img src="${appUrl}/B2PLOGO.png" alt="B2P Logo" style="height: 40px; display: inline-block;">
        </div>
        <div class="content" style="padding: 40px 32px;">
          <h2 class="title" style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; line-height: 1.25;">${title}</h2>
          <div class="body-text" style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">${bodyHtml}</div>
          ${ctaButtonHtml}
        </div>
        <div class="footer" style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <div>© ${new Date().getFullYear()} B2P. All rights reserved.</div>
          <div class="footer-links" style="margin-top: 12px;">
            <a href="${appUrl}/settings" class="footer-link" style="color: #7c3aed; text-decoration: none; margin: 0 8px;">Notification Settings</a>
            <a href="${appUrl}" class="footer-link" style="color: #7c3aed; text-decoration: none; margin: 0 8px;">Visit Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = bodyHtml.replace(/<[^>]*>/g, '');

  if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.SMTP_FROM || 'noreply@brandtopost.com';
    const resendAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.content.replace(/^data:application\/pdf;base64,/, ''),
    })) || [];

    try {
      console.log(`[Resend] Sending email to: ${to}, Subject: ${subject}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `B2P Support <${fromEmail}>`,
          to: [to],
          subject,
          html: htmlContent,
          text: textContent,
          attachments: resendAttachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Resend API Error status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data: any = await response.json();
      console.log(`[Resend] Email sent: ${data.id}`);

      if (db) {
        await db.collection('admin_logs').add({
          timestamp: new Date().toISOString(),
          type: 'email_sent',
          recipient: to,
          subject,
          status: `Sent via Resend API (ID: ${data.id})`
        }).catch((e) => console.error('Failed to log email to Firestore:', e));
      }

      return { messageId: data.id };
    } catch (err) {
      console.error(`[Resend] Failed to send email via Resend API:`, err);
      throw err;
    }
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[SMTP Mock] SMTP credentials not configured. Simulating branded email send:
    To: ${to}
    Subject: ${subject}
    Title: ${title}
    CTA: ${ctaText} -> ${ctaUrl}`);

    if (db) {
      await db.collection('admin_logs').add({
        timestamp: new Date().toISOString(),
        type: 'email_simulated',
        recipient: to,
        subject,
        status: 'Mock send successful (SMTP credentials not configured)'
      }).catch((e) => console.error('Failed to log simulated email to Firestore:', e));
    }
    return { messageId: 'mock-id-' + Math.random().toString(36).substring(2, 9) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions: any = {
    from: `"B2P Support" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@b2p.com'}>`,
    to,
    subject,
    text: textContent,
    html: htmlContent
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.content.replace(/^data:application\/pdf;base64,/, ''),
      encoding: 'base64'
    }));
  }

  const info = await transporter.sendMail(mailOptions);
  console.log('[SMTP] Email sent: %s', info.messageId);
  return info;
}

export async function createAndSendApprovalRequest(options: {
  userId?: string;
  productId: string;
  productName?: string;
  userEmail: string;
  itemType: 'campaign' | 'post' | 'blog' | 'founder_post';
  itemTitle: string;
  itemPreview?: string;
  itemData: any;
  autoUploadDelayHours?: number;
}): Promise<any> {
  if (!db) throw new Error('Database connection is not active.');
  const { userId, productId, productName, userEmail, itemType, itemTitle, itemPreview, itemData } = options;

  let requireEmailApproval = true;
  let delayHours = options.autoUploadDelayHours || 12;

  try {
    const prodSnap = await db.collection('products').doc(productId).get();
    if (prodSnap.exists) {
      const pData = prodSnap.data()!;
      if (pData.requireEmailApproval === false) {
        requireEmailApproval = false;
      }
      if (pData.autoUploadDelayHours) {
        delayHours = Number(pData.autoUploadDelayHours) || 12;
      }
    }
  } catch (err) {
    console.warn('[createAndSendApprovalRequest] Could not read product approval settings:', err);
  }

  if (!requireEmailApproval) {
    console.log(`[Approval Engine] requireEmailApproval is OFF for product ${productId}. Auto-publishing instantly...`);
    await publishItemInstantly(itemType, itemData, productId);

    sendBrandedEmail({
      to: userEmail,
      subject: `[Auto-Published] Your ${itemType.toUpperCase()} '${itemTitle}' is live! 🚀`,
      title: `Content Published Automatically`,
      bodyHtml: `
        <p>Your <strong>${itemType}</strong> titled <strong>"${itemTitle}"</strong> was published automatically based on your product's Auto-Publish settings.</p>
        <p style="color: #64748b; font-size: 14px;">(Note: Email approval is currently turned OFF for this product. You can enable Email Approval anytime in Settings.)</p>
      `,
      ctaText: 'View Dashboard',
      ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
    }).catch((e) => console.error('Failed to send auto-published email:', e));

    return { approvedInstantly: true };
  }

  const crypto = await import('crypto');
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000).toISOString();
  const approvalId = 'appr_' + Math.random().toString(36).substring(2, 9);

  const approvalDoc = {
    id: approvalId,
    token,
    userId: userId || null,
    productId,
    productName: productName || 'Brand',
    userEmail,
    itemType,
    itemTitle,
    itemPreview: itemPreview || itemTitle,
    itemData,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt
  };

  await db.collection('approval_requests').doc(approvalId).set(approvalDoc);
  console.log(`[Approval Engine] Created approval request ${approvalId} for ${itemType} "${itemTitle}". Expires in ${delayHours}h.`);

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const reviewUrl = `${appUrl}/api/approval/review?token=${token}`;

  const itemTypeLabel = itemType === 'founder_post' ? 'FOUNDER POST' : itemType.toUpperCase();

  const previewHtml = itemPreview ? `
    <div style="background-color: #f1f5f9; border-left: 4px solid #7c3aed; padding: 16px; margin: 20px 0; border-radius: 8px; font-style: italic; color: #334155; font-size: 15px; line-height: 1.6;">
      "${itemPreview.slice(0, 500)}${itemPreview.length > 500 ? '...' : ''}"
    </div>
  ` : '';

  const emailBody = `
    <p>A new <strong>${itemTypeLabel}</strong> has been generated for <strong>${productName || 'your brand'}</strong> and is awaiting your approval before publication.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <div style="display: inline-block; background: #7c3aed; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 10px;">${itemTypeLabel}</div>
      <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${itemTitle}</h3>
      ${previewHtml}
    </div>
    <p style="text-align: center; font-weight: 600; color: #0f172a; margin-top: 24px; font-size: 15px;">Click below to review the full content and approve or reject:</p>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 24px;">
      ⏱️ <strong>Auto-Upload Timeline:</strong> If no action is taken within <strong>${delayHours} hours</strong>, this content will be automatically approved and published.
    </div>
  `;

  await sendBrandedEmail({
    to: userEmail,
    subject: `[Action Required] Approve New ${itemTypeLabel}: ${itemTitle}`,
    title: `Approval Request: ${itemTitle}`,
    bodyHtml: emailBody,
    ctaText: 'Review Content & Decide',
    ctaUrl: reviewUrl
  });

  return { approvedInstantly: false, approvalId, expiresAt };
}

export async function runPeriodicEmailChecks(): Promise<void> {
  if (!db) {
    console.warn('[Background Email Check] Firebase Admin Firestore not initialized. Skipping checks.');
    return;
  }

  console.log('[Background Email Check] Starting periodic inactivity and approval checks...');
  const now = new Date();

  // 1. Check for expired pending approval requests (12-Hour Auto-Upload Worker)
  try {
    const expiredSnap = await db.collection('approval_requests')
      .where('status', '==', 'pending')
      .get();

    const nowIso = now.toISOString();
    for (const docSnap of expiredSnap.docs) {
      const reqData = docSnap.data();
      if (reqData.expiresAt && reqData.expiresAt <= nowIso) {
        console.log(`[Auto-Upload Worker] Request ${docSnap.id} (${reqData.itemType}: "${reqData.itemTitle}") expired after timeline. Auto-approving...`);

        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'auto_approved',
          processedAt: nowIso
        });

        await publishItemInstantly(reqData.itemType, reqData.itemData, reqData.productId);

        if (reqData.userEmail) {
          sendBrandedEmail({
            to: reqData.userEmail,
            subject: `[Auto-Uploaded] Your ${reqData.itemType.toUpperCase()} '${reqData.itemTitle}' is live! ⏰`,
            title: `Content Auto-Uploaded After Timeline`,
            bodyHtml: `
              <p>Because no response was received within the 12-hour review timeline, your <strong>${reqData.itemType}</strong> titled <strong>"${reqData.itemTitle}"</strong> was automatically approved and published.</p>
              <p>You can view and manage your live content in the dashboard anytime.</p>
            `,
            ctaText: 'View Published Content',
            ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
          }).catch((e) => console.error('Failed to send auto-approval notification email:', e));
        }

        db.collection('admin_logs').add({
          timestamp: nowIso,
          type: 'auto_upload_approved',
          itemType: reqData.itemType,
          itemTitle: reqData.itemTitle,
          productId: reqData.productId,
          status: 'Auto-approved and published after timeline expiration'
        }).catch((e) => console.error('Failed to log auto-approval:', e));
      }
    }
  } catch (errExp) {
    console.error('[Auto-Upload Worker Error]:', errExp);
  }

  try {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const userEmail = userData.email;
      if (!userEmail) continue;

      // Inactivity check (3-7 days)
      if (userData.lastActive) {
        const lastActiveDate = new Date(userData.lastActive);
        const diffMs = now.getTime() - lastActiveDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays >= 3 && diffDays <= 7) {
          const lastSentStr = userData.lastInactivityEmailSent;
          const alreadySentRecently = lastSentStr && (now.getTime() - new Date(lastSentStr).getTime()) < 7 * 24 * 60 * 60 * 1000;

          if (!alreadySentRecently) {
            console.log(`[Background Email Check] User ${userEmail} inactive for ${Math.round(diffDays)} days. Sending reminder...`);
            await sendBrandedEmail({
              to: userEmail,
              subject: "We miss you! Let's generate your next campaign ⚡",
              title: 'We miss you on B2P!',
              bodyHtml: `
                <p>It's been a few days since we last saw you. Your social channels are quiet, but your virtual Founder Agent has been busy researching new industry topics for you!</p>
                <p>Don't let your audience forget you. In just 1 click, you can generate a full week of high-converting social posts tailored to your brand voice.</p>
              `,
              ctaText: 'Get Back to Posting',
              ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
            });

            await db.collection('users').doc(userId).update({
              lastInactivityEmailSent: now.toISOString()
            });
          }
        }
      }

      // Recommend Socials check
      if (userData.onboarded === true) {
        const lastSentStr = userData.lastSocialsRecommendEmailSent;
        if (!lastSentStr) {
          const productsSnap = await db.collection('products').where('userId', '==', userId).get();
          let hasConnectedSocials = false;

          for (const productDoc of productsSnap.docs) {
            const tokenDoc = await db.collection('server_tokens').doc(productDoc.id).get();
            if (tokenDoc.exists) {
              const tokenData = tokenDoc.data();
              if (tokenData && (tokenData.linkedin || tokenData.facebook || tokenData.instagram || tokenData.reddit)) {
                hasConnectedSocials = true;
                break;
              }
            }
          }

          if (!hasConnectedSocials && productsSnap.docs.length > 0) {
            console.log(`[Background Email Check] User ${userEmail} has not connected socials. Sending recommendation...`);
            try {
              await sendBrandedEmail({
                to: userEmail,
                subject: 'Recommending: Connect your Social Channels to Automate Posting 🔗',
                title: 'Boost Your Reach with Social Connections',
                bodyHtml: `
                  <p>Hi ${userData.name || 'there'},</p>
                  <p>You have successfully set up your product DNA, but you haven't connected your social channels yet.</p>
                  <p>To fully unlock automated posting, scheduling, and direct publishing from B2P, connect your social channels now. We support LinkedIn, Facebook, Instagram, and Reddit!</p>
                `,
                ctaText: 'Connect Social Channels',
                ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/settings`
              });

              await db.collection('users').doc(userId).update({
                lastSocialsRecommendEmailSent: now.toISOString()
              });
            } catch (err) {
              console.error(`[Background Email Check] Failed to send recommendation to ${userEmail}:`, err);
            }
          }
        }
      }

      // Advantageous / Hook Educational Mail
      if (userData.onboarded === true) {
        const lastSentStr = userData.lastAdvantageEmailSent;
        if (!lastSentStr) {
          const createdAt = new Date(userData.createdAt || userData.lastActive || now);
          const diffMs = now.getTime() - createdAt.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (diffDays >= 2) {
            console.log(`[Background Email Check] Sending educational advantage mail to ${userEmail}...`);
            await sendBrandedEmail({
              to: userEmail,
              subject: 'How to hit customer pain points with your posts 💡',
              title: 'Unlock Higher Social Conversions',
              bodyHtml: `
                <p>Hi ${userData.name || 'there'},</p>
                <p>Did you know that posts focusing on customer pain points perform 4x better than feature lists?</p>
                <p>Your B2P virtual Founder Agent is pre-trained to write engaging hook-story-offer layouts designed for LinkedIn, Facebook, and Instagram. Go to your dashboard now to generate a post targeting your competitor's weak spots.</p>
                <p>Here is a quick tip: Always lead with a strong, counter-intuitive hook in your first 2 lines!</p>
              `,
              ctaText: 'Generate Posts Now',
              ctaUrl: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard`
            });

            await db.collection('users').doc(userId).update({
              lastAdvantageEmailSent: now.toISOString()
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Background Email Check Error] Failed to scan users:', error);
  }
}
