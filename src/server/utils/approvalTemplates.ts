// HTML Builders for Approval Review Page

export function escHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildApprovalStatusPage(options: {
  appUrl: string;
  emoji: string;
  title: string;
  message: string;
  borderColor: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escHtml(options.title)} — B2P</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background: #08080c; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 24px; -webkit-font-smoothing: antialiased; }
    .status-card { background: #12121a; border: 1px solid #27273a; border-top: 4px solid ${options.borderColor}; border-radius: 16px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
    .emoji { font-size: 64px; margin-bottom: 24px; line-height: 1; }
    .title { font-size: 24px; font-weight: 800; color: #f8fafc; margin-bottom: 16px; }
    .message { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; }
    .btn { display: inline-flex; background: #27273a; color: #f8fafc; padding: 12px 28px; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 9999px; transition: background 0.2s; }
    .btn:hover { background: #3f3f5a; }
  </style>
</head>
<body>
  <div class="status-card">
    <div class="emoji">${options.emoji}</div>
    <div class="title">${options.title}</div>
    <div class="message">${options.message}</div>
    <a href="${options.appUrl}/dashboard" class="btn">Go to Dashboard</a>
  </div>
</body>
</html>`;
}

export function buildContentPreview(data: any): string {
  let html = '';
  const itemType = data.itemType;
  const itemData = data.itemData || {};

  if (itemType === 'campaign') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Campaign Plan</span>
          <span class="card-title">${escHtml(itemData.theme || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="section-label">Core Message</div>
          <div class="section-value">${escHtml(itemData.coreMessage)}</div>
          
          <div class="section-label">Target Audience</div>
          <div class="section-value">${escHtml(itemData.targetAudience)}</div>

          <div class="section-label">Campaign Hook</div>
          <div class="section-value">${escHtml(itemData.hook)}</div>
        </div>
      </div>
      
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Daily Posts</span>
          <span class="card-title">Generated Content Map</span>
        </div>
        <div class="card-body" style="background: #08080c;">
    `;

    if (Array.isArray(itemData.dailyPosts)) {
      itemData.dailyPosts.forEach((post: any) => {
        html += `
          <div class="daily-post">
            <div class="day-label">Day ${post.day}</div>
            <div>
              ${post.platforms ? Object.keys(post.platforms).map(p => `<span class="platform-tag">${escHtml(p)}</span>`).join('') : ''}
            </div>
            <div class="post-copy">${escHtml(post.postCopy || post.copy || 'No copy available')}</div>
          </div>
        `;
      });
    } else {
      html += `<div class="section-value">No daily posts found in campaign data.</div>`;
    }

    html += `</div></div>`;
  } else if (itemType === 'post' || itemType === 'founder_post') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">${itemType === 'founder_post' ? 'Founder Post' : 'Social Post'}</span>
          <span class="card-title">${escHtml(itemData.headline || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="section-label">Post Copy</div>
          <div class="section-value" style="font-size: 16px;">${escHtml(itemData.postCopy || itemData.copy)}</div>
          
          ${itemData.imagePrompt ? `
          <div class="section-label" style="margin-top: 24px;">Visual Generation Prompt</div>
          <div class="section-value" style="font-style: italic; color: #94a3b8;">${escHtml(itemData.imagePrompt)}</div>
          ` : ''}
          
          ${itemData.platform ? `
          <div class="section-label" style="margin-top: 24px;">Target Platform</div>
          <div class="section-value" style="text-transform: capitalize;">${escHtml(itemData.platform)}</div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (itemType === 'blog') {
    html += `
      <div class="content-card">
        <div class="card-header">
          <span class="type-badge">Blog Article</span>
          <span class="card-title">${escHtml(itemData.title || itemData.blogTitle || data.itemTitle)}</span>
        </div>
        <div class="card-body">
          <div class="blog-content">
            ${itemData.content || itemData.blogContent ? (itemData.content || itemData.blogContent) : '<p>No content available</p>'}
          </div>
        </div>
      </div>
    `;
  }

  return html;
}
