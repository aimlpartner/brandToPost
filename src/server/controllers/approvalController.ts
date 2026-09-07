import { Request, Response } from 'express';
import { admin, db } from '../config/firebase';
import { sendBrandedEmail, createAndSendApprovalRequest } from '../services/emailService';
import { publishItemInstantly } from '../services/publisherService';
import { escHtml, buildApprovalStatusPage, buildContentPreview } from '../utils/approvalTemplates';

export async function handleGetCampaigns(req, res) {
    try {
      const campaigns: any[] = [];
      if (db) {
        const snapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(50).get();
        snapshot.forEach(doc => {
          campaigns.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      res.json(campaigns);
    } catch (e: any) {
      console.error('[API Campaigns] Error loading:', e.message);
      res.json([]);
    }
  }

export async function handlePostCampaignsEmail(req, res) {
    const { email, pdfBase64, campaignTheme } = req.body;
    if (!email || !pdfBase64) {
      return res.status(400).json({ error: 'Email and pdfBase64 are required' });
    }

    try {
      await sendBrandedEmail({
        to: email,
        subject: `Your Approved Campaign: ${campaignTheme || 'Strategy'}`,
        title: "Your Campaign Strategy",
        bodyHtml: `<p>Attached is your approved campaign strategy for <strong>${campaignTheme || 'Strategy'}</strong>.</p>`,
        attachments: [
          {
            filename: 'Campaign_Strategy.pdf',
            content: pdfBase64
          }
        ]
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending campaign email:", error);
      res.status(500).json({ error: error.message });
    }
  }

export async function handlePostEmailsTrigger(req, res) {
    const { type, email, metadata, pdfBase64 } = req.body;
    if (!type || !email) {
      return res.status(400).json({ error: 'Email and type are required' });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    let subject = '';
    let title = '';
    let bodyHtml = '';
    let ctaText = '';
    let ctaUrl = '';
    let attachments: any[] = [];

    switch (type) {
      case 'signup':
        subject = "Welcome to B2P - Let's build your brand DNA! 🧬";
        title = "Welcome to B2P!";
        bodyHtml = `
          <p>Thank you for signing up for B2P. We're thrilled to have you here!</p>
          <p>B2P uses Gemini AI to turn your product details, websites, and documents into high-converting social media posts styled exactly to your voice.</p>
          <p>Let's get started by setting up your onboarding variables.</p>
        `;
        ctaText = "Start Onboarding";
        ctaUrl = `${appUrl}/onboarding`;
        break;

      case 'onboarding_complete':
        const userName = metadata?.name || 'there';
        subject = "Welcome to the B2P Family! 🚀 Onboarding Complete";
        title = `Welcome, ${userName}!`;
        bodyHtml = `
          <p>Congratulations on completing your onboarding process!</p>
          <p>Your profile is ready, and your first product workspace has been created.</p>
          <p>Now, let's dive into Product DNA analysis to synthesize your brand voice and start generating stellar campaigns.</p>
        `;
        ctaText = "Explore Dashboard";
        ctaUrl = `${appUrl}/dashboard`;
        break;

      case 'product_dna':
        const prodName = metadata?.productName || 'your product';
        subject = `Your Product DNA Research is Ready! 🧬 [${prodName}]`;
        title = "Brand DNA Analysis Complete";
        bodyHtml = `
          <p>Our AI engines have finished researching and analyzing the positioning, target audience, content pillars, and psychographics for <strong>${prodName}</strong>.</p>
          <p>We've attached your complete Product DNA Research PDF to this email. You can also view and edit these variables anytime in your product settings.</p>
        `;
        ctaText = "View Product DNA";
        ctaUrl = `${appUrl}/dashboard/dna`;
        if (pdfBase64) {
          attachments.push({
            filename: `${prodName.replace(/[^a-zA-Z0-9]/g, '_')}_Product_DNA.pdf`,
            content: pdfBase64
          });
        }
        break;

      case 'founder_agent':
        const personaName = metadata?.personaName || 'Founder Agent';
        const founderProdName = metadata?.productName || 'your product';
        subject = `Founder Agent "${personaName}" synthesized successfully! 🧠`;
        title = "Your Digital Doppelganger is Online";
        bodyHtml = `
          <p>Great news! Your virtual Founder Agent (digital doppelganger) is successfully synthesized for <strong>${founderProdName}</strong>.</p>
          <p>The agent is trained on your behavioral traits, communication style, and values. It is now fully active to research topics, generate posts, and automatically schedule drafts to your calendar.</p>
          <p>Attached is your Founder Agent Doppelganger profile report PDF.</p>
        `;
        ctaText = "Go to Scheduler";
        ctaUrl = `${appUrl}/dashboard/schedule`;
        if (pdfBase64) {
          attachments.push({
            filename: `${personaName.replace(/[^a-zA-Z0-9]/g, '_')}_Founder_Profile.pdf`,
            content: pdfBase64
          });
        }
        break;

      case 'first_campaign':
        const campaignTheme = metadata?.theme || 'Strategy';
        subject = "Your First Campaign is Ready to Post! 🥳";
        title = "First Campaign Generated Successfully!";
        bodyHtml = `
          <p>Hurray! You just generated/approved your very first campaign theme <strong>"${campaignTheme}"</strong> on B2P.</p>
          <p>This is a huge milestone in maintaining active social consistency. Head over to the campaigns list to publish, schedule, or tweak your daily content.</p>
        `;
        ctaText = "View Campaigns";
        ctaUrl = `${appUrl}/dashboard/campaigns`;
        break;

      default:
        return res.status(400).json({ error: `Unknown email trigger type: ${type}` });
    }

    try {
      await sendBrandedEmail({ to: email, subject, title, bodyHtml, ctaText, ctaUrl, attachments });
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to trigger email type ${type} to ${email}:`, err);
      res.status(500).json({ error: err.message });
    }
  }

export async function handleGetApprovalReview(req, res) {
    const token = req.query.token as string;
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    if (!token) {
      return res.status(400).send(buildApprovalStatusPage({
        appUrl,
        emoji: '⚠️',
        title: 'Invalid Review Link',
        message: 'Missing approval token. Please check your email link.',
        borderColor: '#ef4444'
      }));
    }

    if (!db) {
      return res.status(500).send(buildApprovalStatusPage({
        appUrl,
        emoji: '🔌',
        title: 'Service Unavailable',
        message: 'Database connection is temporarily unavailable. Please try again shortly.',
        borderColor: '#f59e0b'
      }));
    }

    try {
      const snap = await db.collection('approval_requests').where('token', '==', token).limit(1).get();
      if (snap.empty) {
        return res.status(404).send(buildApprovalStatusPage({
          appUrl,
          emoji: '🔍',
          title: 'Request Expired or Invalid',
          message: 'This approval link is invalid or has already expired.',
          borderColor: '#f59e0b'
        }));
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();

      // Already processed → show status page
      if (data.status !== 'pending') {
        const isApproved = data.status === 'approved' || data.status === 'auto_approved';
        return res.send(buildApprovalStatusPage({
          appUrl,
          emoji: isApproved ? '✅' : '❌',
          title: 'Request Already Processed',
          message: `This <strong>${data.itemType}</strong> titled <strong>"${data.itemTitle}"</strong> was previously processed with status: <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.status.toUpperCase()}</span>.`,
          borderColor: isApproved ? '#10b981' : '#ef4444'
        }));
      }

      // Pending → render the full preview page
      const approveActionUrl = `${appUrl}/api/approval/respond?token=${token}&action=approve`;
      const rejectActionUrl = `${appUrl}/api/approval/respond?token=${token}&action=reject`;
      const contentPreviewHtml = buildContentPreview(data);
      const itemTypeLabel = data.itemType === 'founder_post' ? 'Founder Post' : data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Review: ${escHtml(data.itemTitle)} — B2P</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #08080c;
      color: #e2e8f0;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .top-bar {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-bar img { height: 32px; }
    .top-bar .badge {
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 20px 80px;
    }
    .header-section {
      margin-bottom: 32px;
    }
    .header-section h1 {
      font-size: 28px;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .header-section .meta {
      font-size: 14px;
      color: #94a3b8;
    }
    .header-section .meta strong { color: #c4b5fd; }
    .countdown-bar {
      background: #12121a;
      border: 1px solid #27273a;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .countdown-bar .label {
      font-size: 14px;
      color: #94a3b8;
    }
    .countdown-bar .label strong { color: #fbbf24; }
    .countdown-timer {
      display: flex;
      gap: 8px;
    }
    .countdown-timer .unit {
      background: #1e1e2e;
      border: 1px solid #27273a;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      min-width: 56px;
    }
    .countdown-timer .unit .num {
      font-size: 24px;
      font-weight: 800;
      color: #fbbf24;
      font-variant-numeric: tabular-nums;
    }
    .countdown-timer .unit .lbl {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .content-card {
      background: #12121a;
      border: 1px solid #27273a;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    .content-card .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #27273a;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .content-card .card-header .type-badge {
      background: #7c3aed;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .content-card .card-header .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
    }
    .content-card .card-body {
      padding: 24px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    .section-value {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.7;
      margin-bottom: 20px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .section-value:last-child { margin-bottom: 0; }
    .daily-post {
      background: #1a1a2e;
      border: 1px solid #27273a;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 12px;
    }
    .daily-post:last-child { margin-bottom: 0; }
    .daily-post .day-label {
      font-size: 12px;
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 4px;
    }
    .daily-post .platform-tag {
      display: inline-block;
      background: #27273a;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .daily-post .post-copy {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-top: 8px;
      white-space: pre-wrap;
    }
    .blog-content {
      font-size: 15px;
      color: #cbd5e1;
      line-height: 1.8;
    }
    .blog-content h1, .blog-content h2, .blog-content h3 {
      color: #f8fafc;
      margin: 20px 0 10px;
    }
    .blog-content p { margin-bottom: 12px; }
    .action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(8, 8, 12, 0.95);
      backdrop-filter: blur(12px);
      border-top: 1px solid #27273a;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 100;
    }
    .action-bar .btn {
      padding: 14px 36px;
      font-weight: 700;
      font-size: 15px;
      font-family: inherit;
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      text-decoration: none;
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .action-bar .btn:hover { transform: translateY(-1px); }
    .action-bar .btn:active { transform: translateY(0); }
    .btn-approve {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }
    .btn-reject {
      background: #ef4444;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
    }
    .action-bar .btn.disabled {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }
    .processing-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(8, 8, 12, 0.92);
      z-index: 200;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
    }
    .processing-overlay.visible { display: flex; }
    .processing-overlay .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #27273a;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .processing-overlay .proc-text {
      font-size: 16px;
      color: #f8fafc;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      .container { padding: 20px 16px 100px; }
      .header-section h1 { font-size: 22px; }
      .countdown-bar { flex-direction: column; align-items: flex-start; }
      .action-bar { gap: 10px; }
      .action-bar .btn { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <img src="${appUrl}/B2PLOGO.png" alt="B2P">
    <span class="badge">${escHtml(itemTypeLabel)} Review</span>
  </div>

  <div class="container">
    <div class="header-section">
      <h1>${escHtml(data.itemTitle)}</h1>
      <p class="meta">
        Generated for <strong>${escHtml(data.productName || 'your brand')}</strong>
        on ${new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>

    <div class="countdown-bar">
      <div class="label">
        ⏱️ <strong>Auto-upload</strong> if no action taken:
      </div>
      <div class="countdown-timer" id="countdown">
        <div class="unit"><div class="num" id="cd-hours">--</div><div class="lbl">Hours</div></div>
        <div class="unit"><div class="num" id="cd-mins">--</div><div class="lbl">Mins</div></div>
        <div class="unit"><div class="num" id="cd-secs">--</div><div class="lbl">Secs</div></div>
      </div>
    </div>

    ${contentPreviewHtml}
  </div>

  <div class="action-bar" id="action-bar">
    <a class="btn btn-approve" id="btn-approve" href="${approveActionUrl}">✅ Approve & Publish</a>
    <a class="btn btn-reject" id="btn-reject" href="${rejectActionUrl}">❌ Reject & Discard</a>
  </div>

  <div class="processing-overlay" id="processing-overlay">
    <div class="spinner"></div>
    <div class="proc-text" id="proc-text">Processing...</div>
  </div>

  <script>
    // Live Countdown Timer
    const expiresAt = new Date("${data.expiresAt}").getTime();
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    function updateCountdown() {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        document.querySelector('.countdown-bar .label').innerHTML = '⏱️ <strong style="color: #ef4444;">Timer expired</strong> — content will auto-publish shortly';
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      secsEl.textContent = String(s).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Action Button Handlers — show processing overlay, prevent double-clicks
    document.getElementById('btn-approve').addEventListener('click', function(e) {
      document.getElementById('proc-text').textContent = 'Approving & Publishing...';
      document.getElementById('processing-overlay').classList.add('visible');
      document.getElementById('btn-approve').classList.add('disabled');
      document.getElementById('btn-reject').classList.add('disabled');
    });
    document.getElementById('btn-reject').addEventListener('click', function(e) {
      document.getElementById('proc-text').textContent = 'Rejecting...';
      document.getElementById('processing-overlay').classList.add('visible');
      document.getElementById('btn-approve').classList.add('disabled');
      document.getElementById('btn-reject').classList.add('disabled');
    });
  </script>
</body>
</html>`;

      res.send(html);
    } catch (err: any) {
      console.error('[api/approval/review Error]:', err);
      res.status(500).send(buildApprovalStatusPage({
        appUrl,
        emoji: '💥',
        title: 'Server Error',
        message: `An unexpected error occurred: ${escHtml(err.message)}`,
        borderColor: '#ef4444'
      }));
    }
  }

export async function handleGetApprovalRespond(req, res) {
    const token = req.query.token as string;
    const action = req.query.action as string; // 'approve' | 'reject'
    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    if (!token || !action) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Invalid Request</title></head>
        <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
          <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 480px;">
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ Invalid Approval Request</h2>
            <p style="color: #94a3b8;">Missing required approval parameters. Please check your email link.</p>
            <a href="${appUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 16px;">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    if (!db) {
      return res.status(500).send('Database connection unavailable.');
    }

    try {
      const snap = await db.collection('approval_requests').where('token', '==', token).limit(1).get();
      if (snap.empty) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Request Not Found</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 480px;">
              <h2 style="color: #f59e0b; margin-top: 0;">🔍 Request Expired or Invalid</h2>
              <p style="color: #94a3b8;">This approval link is invalid or has expired.</p>
              <a href="${appUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 16px;">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();
      const nowIso = new Date().toISOString();

      if (data.status !== 'pending') {
        const isApproved = data.status === 'approved' || data.status === 'auto_approved';
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Already Processed</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #27273a; padding: 40px; border-radius: 16px; text-align: center; max-width: 520px;">
              <div style="font-size: 48px; margin-bottom: 16px;">${isApproved ? '✅' : '❌'}</div>
              <h2 style="color: #f8fafc; margin-top: 0;">Request Already Processed</h2>
              <p style="color: #94a3b8; line-height: 1.5;">This <strong>${data.itemType}</strong> titled <strong>"${data.itemTitle}"</strong> was previously processed with status: <span style="color: ${isApproved ? '#10b981' : '#ef4444'}; font-weight: 700;">${data.status.toUpperCase()}</span>.</p>
              <a href="${appUrl}/dashboard" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: 600;">Go to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      }

      if (action === 'approve') {
        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'approved',
          processedAt: nowIso
        });

        await publishItemInstantly(data.itemType, data.itemData, data.productId);

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Approved & Published</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #10b981; padding: 44px; border-radius: 20px; text-align: center; max-width: 540px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);">
              <div style="font-size: 56px; margin-bottom: 16px;">🎉</div>
              <h2 style="color: #10b981; margin-top: 0; font-size: 26px;">Approved & Published Instantly!</h2>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Your <strong>${data.itemType.toUpperCase()}</strong> titled <strong>"${data.itemTitle}"</strong> has been approved and published to your channels.
              </p>
              <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">View Live in Dashboard →</a>
            </div>
          </body>
          </html>
        `);
      } else if (action === 'reject') {
        await db.collection('approval_requests').doc(docSnap.id).update({
          status: 'rejected',
          processedAt: nowIso
        });

        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Request Rejected</title></head>
          <body style="font-family: system-ui, sans-serif; background: #08080c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
            <div style="background: #12121a; border: 1px solid #ef4444; padding: 44px; border-radius: 20px; text-align: center; max-width: 540px; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
              <div style="font-size: 56px; margin-bottom: 16px;">❌</div>
              <h2 style="color: #ef4444; margin-top: 0; font-size: 26px;">Generation Rejected</h2>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Your <strong>${data.itemType.toUpperCase()}</strong> titled <strong>"${data.itemTitle}"</strong> was rejected. It will NOT be uploaded or published.
              </p>
              <a href="${appUrl}/dashboard" style="background: #334155; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 15px;">Return to Dashboard</a>
            </div>
          </body>
          </html>
        `);
      } else {
        return res.status(400).send('Invalid action parameter.');
      }
    } catch (err: any) {
      console.error('[api/approval/respond Error]:', err);
      res.status(500).send(`Server error: ${err.message}`);
    }
  }

export async function handlePostApprovalTrigger(req, res) {
    try {
      const { productId, productName, itemType, itemTitle, itemPreview, itemData } = req.body;
      const userEmail = (req as any).user?.email;
      const userId = (req as any).user?.uid;

      if (!productId || !itemType || !itemTitle || !userEmail) {
        return res.status(400).json({ error: 'productId, itemType, itemTitle, and user email are required' });
      }

      const result = await createAndSendApprovalRequest({
        userId,
        productId,
        productName,
        userEmail,
        itemType,
        itemTitle,
        itemPreview,
        itemData
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[api/approval/trigger Error]:', err);
      res.status(500).json({ error: err.message });
    }
  }
