export interface LayoutBlueprint {
  id: string;
  name: string;
  family: "split-panel" | "minimalist" | "heavy-typography" | "geometric";
  isLightBg: boolean;
  buildHtml: (params: {
    headline: string;
    subtext: string;
    imageUrl: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    authorName?: string;
    authorAvatar?: string;
    authorBio?: string;
  }) => string;
}

const calcFontSize = (text: string, base: number = 48, min: number = 22): number => {
  const len = (text || "").length;
  if (len > 90) return Math.max(min, Math.floor(base * 0.48));
  if (len > 60) return Math.max(min, Math.floor(base * 0.62));
  if (len > 35) return Math.max(min, Math.floor(base * 0.78));
  return base;
};

export const LAYOUT_BLUEPRINTS: Record<string, LayoutBlueprint> = {
  "x-tweet-card": {
    id: "x-tweet-card",
    name: "X (Twitter) Viral Tweet Card",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext, logoUrl, fontFamily, authorName, authorAvatar, authorBio }) => {
      const displayName = authorName || "Founder Daily";
      const displayHandle = `@${displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      const avatarSrc = authorAvatar || logoUrl;
      const avatarMarkup = avatarSrc 
        ? `<img src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;" />`
        : `<span style="color: #ffffff; font-weight: 800; font-size: 36px;">${displayName.charAt(0).toUpperCase()}</span>`;
      
      const combinedText = `${headline}\n\n${subtext || ""}`.trim();
      
      // Calculate font sizes based on text length to fill the card nicely
      let mainFontSize = 48;
      let lineHeight = 1.4;
      if (combinedText.length > 200) {
        mainFontSize = 38;
      } else if (combinedText.length > 120) {
        mainFontSize = 42;
      }
      
      return `
        <div style="width: 1080px; height: 1080px; background: #000000; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; padding: 60px 80px;">
          <!-- Tweet Container to look like a centered post or full screen -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%;">
            
            <!-- Top X Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; gap: 24px;">
                <div style="width: 90px; height: 90px; border-radius: 50%; background: #16181c; border: 1px solid #2f3336; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${avatarMarkup}
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; font-size: 32px; color: #e7e9ea; letter-spacing: -0.01em;">${displayName}</span>
                    <svg style="width: 28px; height: 28px; color: #1d9bf0;" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.05 1.273 2.42 2.148 4 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.05 2.148-2.42 2.148-4zM9.6 17.2L5.4 13l1.4-1.4 2.8 2.8 7.6-7.6 1.4 1.4-9 9z"/></svg>
                  </div>
                  <span style="font-size: 26px; color: #71767b; font-weight: 400;">${displayHandle}</span>
                </div>
              </div>
              <div style="color: #e7e9ea;">
                <svg style="width: 42px; height: 42px; fill: currentColor;" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
            </div>

            <!-- Main Tweet Body Copy -->
            <div style="font-size: ${mainFontSize}px; line-height: ${lineHeight}; font-weight: 400; color: #e7e9ea; margin-bottom: 24px; word-break: break-word; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${combinedText}</div>
            
            <!-- Bio / Info string as quote if available -->
            ${authorBio ? `<div style="font-size: 24px; color: #71767b; font-style: italic; margin-bottom: 24px;">— ${authorBio}</div>` : ""}

            <!-- Fake metrics footer at bottom -->
            <div style="border-top: 1px solid #2f3336; border-bottom: 1px solid #2f3336; padding: 20px 0; margin-top: auto; display: flex; align-items: center; justify-content: space-between; color: #71767b; font-size: 24px; font-weight: 500;">
              <span style="color: #e7e9ea;">10:42 AM · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span><span style="color: #e7e9ea; font-weight: 700;">1.8M</span> Views</span>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 24px; color: #71767b; font-size: 24px;">
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg> 107</div>
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg> 12</div>
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg> 218</div>
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg> 14K</div>
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/></svg></div>
              <div style="display: flex; gap: 12px; align-items: center;"><svg style="width: 32px; height: 32px; fill: currentColor" viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg></div>
            </div>
          </div>
        </div>
      `;
    }
  },
  "editorial-left": {
    id: "editorial-left",
    name: "Editorial Left Panel",
    family: "split-panel",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      const textShadow = "0 2px 4px rgba(0,0,0,0.1)";
      const fontSize = calcFontSize(headline, 50);
      const subFontSize = Math.max(15, Math.floor(fontSize * 0.42));
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Left Text Column (45%) -->
          <div style="width: 45%; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; border-right: 2px solid ${primaryColor}; box-sizing: border-box; background: ${secondaryColor}; position: relative; z-index: 10;">
            <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 60px;">
              <div style="width: 50px; height: 6px; background: ${primaryColor}; border-radius: 3px;"></div>
              <h2 style="color: #ffffff; font-weight: 800; font-size: ${fontSize}px; line-height: 1.2; margin: 0; text-shadow: ${textShadow}; word-break: break-word; overflow-wrap: break-word;">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 400; font-size: ${subFontSize}px; line-height: 1.5; margin: 0; text-shadow: ${textShadow}; word-break: break-word;">${subtext}</p>
            </div>
            ${logoUrl ? `<div><img src="${logoUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain;" /></div>` : ""}
          </div>
          <!-- Right Image Column (55%) -->
          <div style="width: 55%; position: relative; overflow: hidden; height: 100%;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
      `;
    }
  },

  "editorial-right": {
    id: "editorial-right",
    name: "Editorial Right Panel",
    family: "split-panel",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      const textShadow = "0 2px 4px rgba(0,0,0,0.1)";
      const fontSize = calcFontSize(headline, 50);
      const subFontSize = Math.max(15, Math.floor(fontSize * 0.42));
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Left Image Column (55%) -->
          <div style="width: 55%; position: relative; overflow: hidden; height: 100%;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Right Text Column (45%) -->
          <div style="width: 45%; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; border-left: 2px solid ${primaryColor}; box-sizing: border-box; background: ${secondaryColor}; position: relative; z-index: 10;">
            <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 60px;">
              <div style="width: 50px; height: 6px; background: ${primaryColor}; border-radius: 3px;"></div>
              <h2 style="color: #ffffff; font-weight: 800; font-size: ${fontSize}px; line-height: 1.2; margin: 0; text-shadow: ${textShadow}; word-break: break-word; overflow-wrap: break-word;">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 400; font-size: ${subFontSize}px; line-height: 1.5; margin: 0; text-shadow: ${textShadow}; word-break: break-word;">${subtext}</p>
            </div>
            ${logoUrl ? `<div><img src="${logoUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain;" /></div>` : ""}
          </div>
        </div>
      `;
    }
  },

  "split-horizontal": {
    id: "split-horizontal",
    name: "Split Horizontal Blocks",
    family: "split-panel",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; display: flex; flex-direction: column; background: #ffffff; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Top Text Area (45%) -->
          <div style="height: 45%; padding: 60px 80px; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; background: #ffffff; position: relative; z-10;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: 16px; max-width: 70%;">
                <h2 style="color: #0f172a; font-weight: 900; font-size: 48px; line-height: 1.2; margin: 0; letter-spacing: -0.01em;">${headline}</h2>
                <p style="color: #475569; font-weight: 500; font-size: 22px; line-height: 1.5; margin: 0;">${subtext}</p>
              </div>
              ${logoUrl ? `<img src="${logoUrl}" style="max-height: 55px; max-width: 160px; object-fit: contain; margin-top: 10px;" />` : ""}
            </div>
          </div>
          <!-- Bottom Image Area (55%) -->
          <div style="height: 55%; position: relative; overflow: hidden; border-top: 4px solid ${primaryColor};">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
      `;
    }
  },

  "frame-border": {
    id: "frame-border",
    name: "Classic Polaroid Border",
    family: "split-panel",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; display: flex; flex-direction: column; justify-content: space-between; background: #f8fafc; padding: 50px; box-sizing: border-box; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; border: 1px solid #e2e8f0;">
          <!-- Nested Polaroid-like photo frame -->
          <div style="width: 100%; height: 75%; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); background: #e2e8f0;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Lower text panel -->
          <div style="width: 100%; height: 20%; display: flex; justify-content: space-between; align-items: center; padding: 20px 10px 0 10px; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 8px; max-width: 75%;">
              <h2 style="color: #0f172a; font-weight: 850; font-size: 38px; line-height: 1.25; margin: 0; letter-spacing: -0.015em;">${headline}</h2>
              <p style="color: #64748b; font-weight: 500; font-size: 18px; line-height: 1.4; margin: 0;">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : ""}
          </div>
        </div>
      `;
    }
  },

  "notes-app-screenshot": {
    id: "notes-app-screenshot",
    name: "Apple Notes Founder Memo",
    family: "minimalist",
    isLightBg: true,
    buildHtml: ({ headline, subtext }) => {
      return `
        <div style="width: 1080px; height: 1080px; background: #fbfbfd; color: #1d1d1f; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 75px 80px;">
          <div>
            <!-- Apple Notes Top Navigation Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 45px; padding-bottom: 28px; border-bottom: 1.5px solid #e5e5ea;">
              <div style="display: flex; align-items: center; gap: 12px; color: #e59c00; font-size: 30px; font-weight: 600;">
                <svg style="width: 32px; height: 32px; fill: currentColor;" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                <span>Notes</span>
              </div>
              <div style="display: flex; align-items: center; gap: 20px; color: #e59c00; font-size: 28px; font-weight: 700;">
                <svg style="width: 34px; height: 34px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <span>Done</span>
              </div>
            </div>

            <!-- Notes Title Body -->
            <div style="font-size: 54px; line-height: 1.28; font-weight: 800; color: #1d1d1f; margin-bottom: 36px; letter-spacing: -0.02em; word-break: break-word;">
              ${headline}
            </div>

            <div style="font-size: 30px; line-height: 1.55; color: #424245; font-weight: 400; word-break: break-word;">
              ${subtext || "Hard truth after scaling to $1M ARR: Most features you build are just expensive distractions. Double down on the 1 single workflow that drives 80% of core retention."}
            </div>
          </div>

          <!-- Bottom Apple Notes Timestamp Footer Stamp -->
          <div style="border-top: 1.5px solid #e5e5ea; padding-top: 32px; display: flex; align-items: center; justify-content: space-between; color: #86868b; font-size: 24px; font-weight: 500;">
            <span>Today at 9:41 AM</span>
            <span>142 words</span>
          </div>
        </div>
      `;
    }
  },

  "metrics-breakdown-card": {
    id: "metrics-breakdown-card",
    name: "B2B SaaS Growth & Metric Card",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext }) => {
      return `
        <div style="width: 1080px; height: 1080px; background: #08080c; color: #ffffff; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 75px 80px;">
          <div>
            <!-- Top Metric Tag Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 45px;">
              <div style="display: flex; align-items: center; gap: 14px; background: #161822; border: 1px solid #2a2d3d; padding: 10px 24px; border-radius: 100px;">
                <div style="width: 14px; height: 14px; border-radius: 50%; background: #10b981; box-shadow: 0 0 12px #10b981;"></div>
                <span style="font-size: 20px; font-weight: 700; color: #f8fafc; letter-spacing: 0.05em; text-transform: uppercase;">Growth Metric Case Study</span>
              </div>
              <span style="color: #64748b; font-size: 22px; font-weight: 600;">#B2BPLAYBOOK</span>
            </div>

            <!-- Big Stat Grid Callouts -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 50px;">
              <div style="background: #11131c; border: 1px solid #222638; border-radius: 20px; padding: 28px 24px;">
                <div style="font-size: 48px; font-weight: 900; color: #10b981; line-height: 1; margin-bottom: 8px;">+340%</div>
                <div style="font-size: 18px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em;">MRR Growth</div>
              </div>
              <div style="background: #11131c; border: 1px solid #222638; border-radius: 20px; padding: 28px 24px;">
                <div style="font-size: 48px; font-weight: 900; color: #6366f1; line-height: 1; margin-bottom: 8px;">$1.2M</div>
                <div style="font-size: 18px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em;">ARR Pipeline</div>
              </div>
              <div style="background: #11131c; border: 1px solid #222638; border-radius: 20px; padding: 28px 24px;">
                <div style="font-size: 48px; font-weight: 900; color: #f59e0b; line-height: 1; margin-bottom: 8px;">&lt; 14 Days</div>
                <div style="font-size: 18px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em;">Payback Period</div>
              </div>
            </div>

            <!-- Main Headline Thesis -->
            <div style="font-size: 46px; line-height: 1.32; font-weight: 800; color: #ffffff; margin-bottom: 24px; letter-spacing: -0.015em;">
              ${headline}
            </div>

            ${subtext ? `<div style="font-size: 26px; line-height: 1.5; color: #94a3b8; font-weight: 400;">${subtext}</div>` : ""}
          </div>

          <!-- Bottom Branding Bar -->
          <div style="border-top: 1px solid #222638; padding-top: 32px; display: flex; align-items: center; justify-content: space-between; color: #64748b; font-size: 24px; font-weight: 600;">
            <span style="color: #cbd5e1; font-weight: 700;">Verified B2B Operating Model</span>
            <span style="color: #6366f1; font-weight: 700;">Read Full Breakdown ↓</span>
          </div>
        </div>
      `;
    }
  },

  "linkedin-carousel-cover": {
    id: "linkedin-carousel-cover",
    name: "LinkedIn Viral Carousel Cover",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext }) => {
      return `
        <div style="width: 1080px; height: 1080px; background: #08080c; color: #ffffff; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 80px 85px; position: relative;">
          <!-- Top Accent Border Rule -->
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 12px; background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);"></div>

          <div>
            <!-- Top Slide Badge -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 50px;">
              <span style="background: #1e1b4b; border: 1px solid #4338ca; color: #a5b4fc; font-size: 20px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 28px; border-radius: 100px;">
                THE FOUNDER PLAYBOOK · SLIDE 1/7
              </span>
              <span style="color: #64748b; font-size: 22px; font-weight: 700;">FOUNDER INSIGHT</span>
            </div>

            <!-- Massive Punchy Hook Headline -->
            <div style="font-size: 60px; line-height: 1.22; font-weight: 900; color: #ffffff; margin-bottom: 32px; letter-spacing: -0.02em; word-break: break-word;">
              ${headline}
            </div>

            <div style="font-size: 30px; line-height: 1.5; color: #94a3b8; font-weight: 400; max-width: 900px;">
              ${subtext || "Swipe through to see the exact tactical breakdown used to scale organic ARR with zero ad spend."}
            </div>
          </div>

          <!-- Bottom Swipe Indicator Bar -->
          <div style="border-top: 1px solid #1e293b; padding-top: 32px; display: flex; align-items: center; justify-content: space-between; color: #ffffff; font-size: 26px; font-weight: 700;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: #6366f1;"></div>
              <span style="color: #cbd5e1; font-weight: 600;">Founder Curation</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; color: #818cf8; font-weight: 800;">
              <span>SWIPE</span>
              <svg style="width: 32px; height: 32px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </div>
          </div>
        </div>
      `;
    }
  },

  "framed-mockup": {
    id: "framed-mockup",
    name: "Framed Screenshot Mockup",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #0f172a; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; padding: 60px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="position: absolute; inset:0; background: radial-gradient(circle at top right, ${primaryColor}25 0%, transparent 60%); z-index: 1;"></div>
          <!-- Header Area -->
          <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: flex-start; max-width: 85%;">
            <div>
              <h2 style="color: #ffffff; font-weight: 900; font-size: 44px; line-height: 1.2; margin: 0 0 10px 0;">${headline}</h2>
              <p style="color: #94a3b8; font-weight: 500; font-size: 20px; margin: 0;">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 45px; max-width: 140px; object-fit: contain;" />` : ''}
          </div>
          <!-- Browser Window Frame Mockup -->
          <div style="position: relative; z-index: 10; width: 100%; height: 720px; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.5); display: flex; flex-direction: column;">
            <!-- Browser Bar -->
            <div style="height: 44px; background: #0f172a; padding: 0 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></div>
              <div style="margin-left: 20px; background: #1e293b; border-radius: 6px; padding: 4px 12px; color: #64748b; font-size: 11px; font-family: monospace;">app.brandtopost.com/insight</div>
            </div>
            <!-- Image inside mockup -->
            <div style="flex: 1; overflow: hidden; position: relative;">
              <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          </div>
        </div>
      `;
    }
  },

  "brutalist-hero": {
    id: "brutalist-hero",
    name: "Brutalist Typography Hero",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; border: 16px solid ${primaryColor};">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.45; filter: grayscale(100%); z-index: 1;" />
          <div style="position: absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%); z-index: 5;"></div>
          <div style="position: absolute; inset:0; z-index: 10; padding: 80px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
            ${logoUrl ? `<div><img src="${logoUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain; filter: invert(1);" /></div>` : '<div></div>'}
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div style="background: ${primaryColor}; color: #000; font-weight: 900; font-size: 16px; padding: 6px 14px; text-transform: uppercase; width: fit-content; letter-spacing: 0.1em;">UNFILTERED FOUNDER TRUTH</div>
              <h1 style="color: #ffffff; font-weight: 900; font-size: 68px; line-height: 1.05; text-transform: uppercase; margin: 0; word-break: break-word;">${headline}</h1>
              <p style="color: #e2e8f0; font-weight: 600; font-size: 24px; line-height: 1.4; margin: 0; max-width: 850px; border-left: 4px solid ${primaryColor}; padding-left: 20px;">${subtext}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  "quote-spotlight": {
    id: "quote-spotlight",
    name: "Spotlight Quote Card",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #09090b; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; display: flex; align-items: center; justify-content: center; padding: 80px;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.25; filter: blur(10px); z-index: 1;" />
          <div style="position: relative; z-index: 10; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 30px;">
            <div style="font-size: 120px; line-height: 60px; color: ${primaryColor}; font-family: Georgia, serif; font-weight: 900; opacity: 0.8;">“</div>
            <h2 style="color: #ffffff; font-weight: 700; font-size: 52px; line-height: 1.3; margin: 0; max-width: 900px; text-shadow: 0 4px 20px rgba(0,0,0,0.8);">${headline}</h2>
            <div style="width: 80px; height: 4px; background: ${primaryColor}; border-radius: 2px;"></div>
            <p style="color: #a1a1aa; font-weight: 500; font-size: 22px; line-height: 1.5; margin: 0; max-width: 750px;">${subtext}</p>
            ${logoUrl ? `<div style="margin-top: 20px;"><img src="${logoUrl}" style="max-height: 45px; max-width: 150px; object-fit: contain;" /></div>` : ''}
          </div>
        </div>
      `;
    }
  },

  "minimal-thesis": {
    id: "minimal-thesis",
    name: "Minimalist Editorial Thesis",
    family: "minimalist",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #faf9f6; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; padding: 90px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 30px;">
            <span style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #0f172a;">FOUNDER MEMO</span>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 40px; max-width: 140px; object-fit: contain;" />` : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
            <h1 style="color: #0f172a; font-weight: 850; font-size: 56px; line-height: 1.18; margin: 0; letter-spacing: -0.02em;">${headline}</h1>
            <p style="color: #475569; font-weight: 500; font-size: 24px; line-height: 1.5; margin: 0;">${subtext}</p>
          </div>
          <div style="height: 380px; width: 100%; border-radius: 16px; overflow: hidden; position: relative; border: 1px solid #cbd5e1;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
      `;
    }
  },

  "stat-billboard": {
    id: "stat-billboard",
    name: "Stat & Metric Billboard",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #08080c; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; padding: 80px; display: flex; flex-direction: column; justify-content: space-between;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.2; z-index: 1;" />
          <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center;">
            <div style="background: ${primaryColor}; color: #000; font-weight: 900; font-size: 13px; letter-spacing: 0.15em; padding: 6px 14px; border-radius: 6px; text-transform: uppercase;">METRIC BILLBOARD</div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 45px; max-width: 150px; object-fit: contain;" />` : ''}
          </div>
          <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: 20px;">
            <h2 style="color: #ffffff; font-weight: 900; font-size: 64px; line-height: 1.1; margin: 0; text-transform: uppercase; letter-spacing: -0.02em;">${headline}</h2>
            <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-left: 6px solid ${primaryColor}; border-radius: 12px; padding: 24px 30px;">
              <p style="color: #cbd5e1; font-weight: 500; font-size: 22px; line-height: 1.45; margin: 0;">${subtext}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  "cinema-bottom": {
    id: "cinema-bottom",
    name: "Cinematic Bottom bar",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          
          <!-- Bottom solid strip zone -->
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 28%; background: rgba(8, 8, 12, 0.95); border-top: 5px solid ${primaryColor}; z-index: 10; padding: 40px 60px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; backdrop-filter: blur(10px);">
            <div style="display: flex; flex-direction: column; gap: 8px; max-width: 75%;">
              <h2 style="color: #ffffff; font-weight: 900; font-size: 42px; line-height: 1.2; margin: 0; letter-spacing: 0.05em; text-transform: uppercase;">${headline}</h2>
              <p style="color: #94a3b8; font-weight: 500; font-size: 19px; line-height: 1.4; margin: 0;">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 60px; max-width: 160px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />` : ""}
          </div>
        </div>
      `;
    }
  },

  "top-banner": {
    id: "top-banner",
    name: "Modern Top Banner",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      const textShadow = "0 4px 16px rgba(0,0,0,0.8)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          <!-- Top vignette gradient -->
          <div style="position: absolute; top:0; left:0; width: 100%; height: 50%; background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 100%); z-index: 5;"></div>
          
          <div style="position: absolute; top: 0; left: 0; width: 100%; padding: 80px 80px 0 80px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 10; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 16px; max-width: 70%;">
              <h2 style="color: #ffffff; font-weight: 850; font-size: 56px; line-height: 1.15; margin: 0; text-shadow: ${textShadow};">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 500; font-size: 22px; line-height: 1.5; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 55px; max-width: 160px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));" />` : ""}
          </div>
          
          <!-- Subtle color line accent at top edge -->
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: ${primaryColor}; z-index: 20;"></div>
        </div>
      `;
    }
  },

  "corner-badge": {
    id: "corner-badge",
    name: "Framed Corner Stamp",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      const textShadow = "0 1px 3px rgba(0,0,0,0.05)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #080808; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          
          <!-- Diagonal geometric badge overlay -->
          <div style="position: absolute; bottom: 60px; left: 60px; z-index: 10; background: #ffffff; padding: 45px 50px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border-left: 8px solid ${primaryColor}; max-width: 600px; box-sizing: border-box;">
            <h2 style="color: #0f172a; font-weight: 900; font-size: 38px; line-height: 1.25; margin: 0 0 12px 0; text-shadow: ${textShadow}; text-transform: uppercase;">${headline}</h2>
            <p style="color: #475569; font-weight: 600; font-size: 17px; line-height: 1.5; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
          </div>
          
          <!-- Standalone logo placement -->
          ${logoUrl ? `<div style="position: absolute; top: 60px; right: 60px; z-index: 10; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); padding: 12px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"><img src="${logoUrl}" style="max-height: 45px; max-width: 140px; object-fit: contain;" /></div>` : ""}
        </div>
      `;
    }
  },

  "full-overlay-minimal": {
    id: "full-overlay-minimal",
    name: "Full Overlay Minimalist",
    family: "minimalist",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, fontFamily }) => {
      const textShadow = "0 4px 15px rgba(0,0,0,0.8)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          <!-- Subtle full screen vignette -->
          <div style="position: absolute; inset:0; background: radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%); z-index: 5;"></div>
          
          <div style="position: absolute; inset:0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 120px; z-index: 10; box-sizing: border-box;">
            <h2 style="color: #ffffff; font-weight: 400; font-size: 58px; line-height: 1.3; margin: 0 0 24px 0; text-shadow: ${textShadow}; letter-spacing: -0.01em; font-style: italic;">"${headline}"</h2>
            <p style="color: #cbd5e1; font-weight: 500; font-size: 20px; line-height: 1.5; margin: 0; text-shadow: ${textShadow}; text-transform: uppercase; letter-spacing: 0.15em;">${subtext}</p>
          </div>
          
          ${logoUrl ? `<div style="position: absolute; bottom: 60px; right: 50%; transform: translateX(50%); z-index: 20;"><img src="${logoUrl}" style="max-height: 40px; max-width: 140px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" /></div>` : ""}
        </div>
      `;
    }
  },

  "knockout-type": {
    id: "knockout-type",
    name: "Oversized Typography Statement",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      const textShadow = "0 10px 40px rgba(0,0,0,0.9)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.75; z-index: 1;" />
          <div style="position: absolute; inset:0; background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%); z-index: 5;"></div>
          
          <div style="position: absolute; inset:0; padding: 100px 80px; display: flex; flex-direction: column; justify-content: flex-end; z-index: 10; box-sizing: border-box;">
            <div style="width: 100px; height: 10px; background: ${primaryColor}; margin-bottom: 40px; border-radius: 5px;"></div>
            <h2 style="color: #ffffff; font-weight: 900; font-size: 88px; line-height: 1.05; margin: 0 0 24px 0; text-shadow: ${textShadow}; word-break: break-word; letter-spacing: -0.03em; text-transform: uppercase;">${headline}</h2>
            <p style="color: #e2e8f0; font-weight: 500; font-size: 24px; line-height: 1.5; margin: 0; text-shadow: ${textShadow}; max-width: 800px;">${subtext}</p>
          </div>
          
          ${logoUrl ? `<div style="position: absolute; top: 100px; right: 80px; z-index: 20;"><img src="${logoUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" /></div>` : ""}
        </div>
      `;
    }
  },

  "sidebar-right": {
    id: "sidebar-right",
    name: "Modern Sidebar Right",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: #000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Left Image Content (68%) -->
          <div style="width: 68%; height: 100%; position: relative; overflow: hidden;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Right solid color panel (32%) -->
          <div style="width: 32%; background: ${secondaryColor}; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; border-left: 6px solid ${primaryColor}; box-sizing: border-box; position: relative; z-10; height: 100%;">
            <div style="display: flex; flex-direction: column; gap: 24px; margin-top: 80px;">
              <span style="color: ${primaryColor}; font-weight: 700; font-size: 15px; letter-spacing: 0.2em; text-transform: uppercase;">TRENDING INSIGHT</span>
              <h2 style="color: #ffffff; font-weight: 850; font-size: 40px; line-height: 1.2; margin: 0; word-break: break-word;">${headline}</h2>
              <p style="color: #94a3b8; font-weight: 500; font-size: 16px; line-height: 1.5; margin: 0;">${subtext}</p>
            </div>
            ${logoUrl ? `<div><img src="${logoUrl}" style="max-height: 45px; max-width: 130px; object-fit: contain;" /></div>` : ""}
          </div>
        </div>
      `;
    }
  },

  "ticker-strip": {
    id: "ticker-strip",
    name: "High-Contrast Ticker Strip",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          
          <!-- Central opaque block ticker -->
          <div style="position: absolute; top: 40%; left: 0; width: 100%; padding: 50px 80px; background: ${secondaryColor}; border-top: 4px solid ${primaryColor}; border-bottom: 4px solid ${primaryColor}; z-index: 10; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 75%;">
              <h2 style="color: #ffffff; font-weight: 900; font-size: 44px; line-height: 1.2; margin: 0; text-transform: uppercase; letter-spacing: -0.01em;">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 500; font-size: 18px; line-height: 1.45; margin: 0;">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 50px; max-width: 160px; object-fit: contain;" />` : ""}
          </div>
        </div>
      `;
    }
  },

  "asymmetric-focus": {
    id: "asymmetric-focus",
    name: "Asymmetric Framed Accent",
    family: "heavy-typography",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      const textShadow = "0 2px 8px rgba(0,0,0,0.5)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #0d0e12; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.85; z-index: 1;" />
          <div style="position: absolute; inset:0; background: linear-gradient(to right, rgba(13,14,18,0.9) 0%, rgba(13,14,18,0.3) 100%); z-index: 5;"></div>
          
          <!-- Asymmetric borders around text box -->
          <div style="position: absolute; bottom: 80px; left: 80px; border: 3px solid ${primaryColor}; border-right: none; border-top: none; padding: 40px 0 10px 40px; max-width: 700px; z-index: 10; box-sizing: border-box;">
            <h2 style="color: #ffffff; font-weight: 850; font-size: 54px; line-height: 1.2; margin: 0 0 20px 0; text-shadow: ${textShadow};">${headline}</h2>
            <p style="color: #e2e8f0; font-weight: 500; font-size: 20px; line-height: 1.5; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
          </div>
          
          ${logoUrl ? `<div style="position: absolute; top: 80px; right: 80px; z-index: 20; background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 8px;"><img src="${logoUrl}" style="max-height: 40px; max-width: 140px; object-fit: contain;" /></div>` : ""}
        </div>
      `;
    }
  },

  "diagonal-split": {
    id: "diagonal-split",
    name: "Geometric Diagonal Slice",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Clipped background image (60% diagonal coverage) -->
          <div style="position: absolute; inset: 0; clip-path: polygon(0 0, 100% 0, 100% 65%, 0% 90%); z-index: 1; overflow: hidden; background: #2d3748;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          
          <!-- Lower diagonal content block -->
          <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 80px 100px; box-sizing: border-box; z-index: 10; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="display: flex; flex-direction: column; gap: 16px; max-width: 70%;">
              <h2 style="color: #ffffff; font-weight: 900; font-size: 46px; line-height: 1.25; margin: 0; letter-spacing: -0.01em; text-transform: uppercase; border-left: 6px solid ${primaryColor}; padding-left: 20px;">${headline}</h2>
              <p style="color: #94a3b8; font-weight: 500; font-size: 19px; line-height: 1.45; margin: 0; padding-left: 26px;">${subtext}</p>
            </div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 55px; max-width: 160px; object-fit: contain;" />` : ""}
          </div>
        </div>
      `;
    }
  },

  "stacked-blocks": {
    id: "stacked-blocks",
    name: "Architectural Bauhaus Stack",
    family: "geometric",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #ffffff; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />
          
          <!-- Stacked offset text blocks -->
          <div style="position: absolute; bottom: 80px; left: 80px; display: flex; flex-direction: column; gap: 16px; z-index: 10; max-width: 750px;">
            <div style="background: ${secondaryColor}; padding: 24px 36px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-bottom: 4px solid ${primaryColor}; width: fit-content;">
              <h2 style="color: #ffffff; font-weight: 850; font-size: 38px; line-height: 1.2; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${headline}</h2>
            </div>
            <div style="background: #ffffff; padding: 20px 30px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); width: fit-content;">
              <p style="color: #334155; font-weight: 600; font-size: 18px; line-height: 1.4; margin: 0;">${subtext}</p>
            </div>
          </div>
          
          ${logoUrl ? `<div style="position: absolute; top: 80px; right: 80px; z-index: 10; background: #ffffff; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"><img src="${logoUrl}" style="max-height: 45px; max-width: 140px; object-fit: contain;" /></div>` : ""}
        </div>
      `;
    }
  },

  "neon-minimal": {
    id: "neon-minimal",
    name: "Neon Highlight Accent",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      const textShadow = "0 4px 16px rgba(0,0,0,0.7)";
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <img src="${imageUrl}" style="position: absolute; inset:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.9; z-index: 1;" />
          <div style="position: absolute; inset:0; background: radial-gradient(circle at bottom left, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.2) 100%); z-index: 5;"></div>
          
          <div style="position: absolute; bottom: 100px; left: 100px; display: flex; flex-direction: column; gap: 20px; z-index: 10; max-width: 750px; box-sizing: border-box;">
            <h2 style="color: #ffffff; font-weight: 900; font-size: 58px; line-height: 1.15; margin: 0; text-shadow: ${textShadow};">
              ${headline.split(" ").map((word, i) => i === 0 || i === headline.split(" ").length - 1 ? `<span style="color: ${primaryColor};">${word}</span>` : word).join(" ")}
            </h2>
            <p style="color: #94a3b8; font-weight: 500; font-size: 20px; line-height: 1.5; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
          </div>
          
          ${logoUrl ? `<div style="position: absolute; top: 100px; right: 100px; z-index: 20; background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 8px;"><img src="${logoUrl}" style="max-height: 40px; max-width: 140px; object-fit: contain;" /></div>` : ""}
        </div>
      `;
    }
  },

  "editorial-grid": {
    id: "editorial-grid",
    name: "Clean Asymmetric Grid",
    family: "geometric",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; display: flex; flex-direction: column; background: #f8fafc; padding: 70px; box-sizing: border-box; justify-content: space-between; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif;">
          <!-- Top grid border row -->
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px;">
            <span style="font-size: 15px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.15em;">FEATURED CASE STUDY</span>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height: 45px; max-width: 140px; object-fit: contain;" />` : ""}
          </div>
          <!-- Center content Grid -->
          <div style="flex: 1; display: flex; align-items: center; gap: 60px; margin: 40px 0;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 24px;">
              <h2 style="color: #0f172a; font-weight: 900; font-size: 46px; line-height: 1.25; margin: 0;">${headline}</h2>
              <p style="color: #64748b; font-weight: 500; font-size: 20px; line-height: 1.5; margin: 0;">${subtext}</p>
            </div>
            <div style="width: 450px; height: 450px; border-radius: 20px; overflow: hidden; border: 4px solid #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.06); background: #e2e8f0;">
              <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          </div>
          <!-- Bottom footer accent -->
          <div style="width: 100%; height: 8px; background: ${primaryColor}; border-radius: 4px;"></div>
        </div>
      `;
    }
  },

  "strategic-grid-split": {
    id: "strategic-grid-split",
    name: "Strategic Grid Split",
    family: "split-panel",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      const textShadow = "0 2px 4px rgba(0,0,0,0.1)";
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; border: 20px solid ${secondaryColor};">
          <!-- Left side: image in container -->
          <div style="width: 50%; height: 100%; overflow: hidden; border-radius: 12px; border: 4px solid rgba(255,255,255,0.08); position: relative;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Right side: grid background with content -->
          <div style="width: 50%; height: 100%; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 0), radial-gradient(rgba(255,255,255,0.05) 1px, transparent 0); background-size: 24px 24px; background-position: 0 0, 12px 12px; position: relative;">
            <div style="display: flex; flex-direction: column; gap: 28px;">
              <span style="font-family: monospace; font-size: 14px; color: ${primaryColor}; letter-spacing: 0.1em; text-transform: uppercase;">[ CONTRARIAN BRIEF ]</span>
              <h2 style="color: #ffffff; font-weight: 800; font-size: 44px; line-height: 1.2; margin: 0; word-break: break-word; text-shadow: ${textShadow};">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 400; font-size: 18px; line-height: 1.5; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
            </div>
            ${logoUrl ? `<div><img src="${logoUrl}" style="max-height: 40px; max-width: 140px; object-fit: contain; opacity: 0.8;" /></div>` : ""}
          </div>
        </div>
      `;
    }
  },

  "neon-code-blur": {
    id: "neon-code-blur",
    name: "Neon Code Snippet",
    family: "geometric",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #030712; overflow: hidden; font-family: 'JetBrains Mono', monospace; box-sizing: border-box;">
          <!-- Neon blur backdrop -->
          <div style="position: absolute; top: -100px; left: -100px; width: 600px; height: 600px; background: ${primaryColor}; opacity: 0.15; filter: blur(150px); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -100px; right: -100px; width: 600px; height: 600px; background: ${primaryColor}; opacity: 0.1; filter: blur(150px); border-radius: 50%;"></div>
          
          <img src="${imageUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.25; z-index: 1;" />
          
          <!-- Code Terminal container overlay -->
          <div style="position: absolute; inset: 120px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); z-index: 10; display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(10px);">
            <!-- Terminal Header -->
            <div style="background: rgba(30, 41, 59, 0.5); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; gap: 8px;">
                <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 6px;"></div>
                <div style="width: 12px; height: 12px; background: #eab308; border-radius: 6px;"></div>
                <div style="width: 12px; height: 12px; background: #22c55e; border-radius: 6px;"></div>
              </div>
              <span style="color: #64748b; font-size: 12px; font-weight: 500; font-family: monospace;">insight_compiler.sh</span>
            </div>
            
            <!-- Terminal Body -->
            <div style="padding: 50px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
              <div style="display: flex; flex-direction: column; gap: 32px; text-align: left;">
                <div style="display: flex; gap: 12px; font-size: 15px;">
                  <span style="color: ${primaryColor}; font-weight: bold;">$</span>
                  <span style="color: #38bdf8;">run --topic "${headline.toLowerCase().replace(/\s+/g, "_")}"</span>
                </div>
                <div>
                  <h2 style="color: #ffffff; font-size: 38px; line-height: 1.3; margin: 0; font-weight: 700; font-family: ${fontFamily}, system-ui, sans-serif;">${headline}</h2>
                  <p style="color: #94a3b8; font-size: 18px; line-height: 1.6; margin-top: 24px; font-family: ${fontFamily}, system-ui, sans-serif; font-weight: 400; overflow-wrap: break-word; word-break: break-word;">${subtext}</p>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 100%;">
                <span style="color: #475569; font-size: 13px;">// compiled successfully</span>
                ${logoUrl ? `<img src="${logoUrl}" style="max-height: 35px; max-width: 120px; object-fit: contain; opacity: 0.6;" />` : ""}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  "notebook-sketch": {
    id: "notebook-sketch",
    name: "Founder's Notebook Log",
    family: "minimalist",
    isLightBg: true,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, fontFamily }) => {
      return `
        <div style="width: 1080px; height: 1080px; position: relative; background: #faf9f6; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box; background-image: linear-gradient(#e2e8f0 1px, transparent 1px); background-size: 100% 28px; padding: 60px;">
          
          <!-- Polaroid photo block -->
          <div style="position: absolute; top: 120px; right: 80px; width: 440px; height: 500px; background: #ffffff; padding: 24px 24px 70px 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.08); transform: rotate(4deg); border: 1px solid rgba(0,0,0,0.03); z-index: 5; box-sizing: border-box;">
            <div style="width: 100%; height: 100%; background: #e2e8f0; overflow: hidden; border-radius: 4px;">
              <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <!-- Sketch text below image -->
            <div style="position: absolute; bottom: 20px; left: 0; width: 100%; text-align: center; font-family: monospace; font-size: 12px; color: #94a3b8;">[ FIG. 01: BACKDROP ]</div>
          </div>

          <!-- Note Content block -->
          <div style="position: absolute; bottom: 120px; left: 80px; max-width: 580px; z-index: 10; display: flex; flex-direction: column; gap: 24px; text-align: left; box-sizing: border-box;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 12px; height: 12px; border-radius: 6px; background: ${primaryColor};"></div>
              <span style="font-family: monospace; font-size: 13px; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">FOUNDER'S LOG</span>
            </div>
            
            <h2 style="color: #0f172a; font-weight: 900; font-size: 54px; line-height: 1.15; margin: 0; letter-spacing: -0.02em;">${headline}</h2>
            <p style="color: #475569; font-weight: 500; font-size: 20px; line-height: 1.6; margin: 0; font-style: italic;">${subtext}</p>
          </div>

          <!-- Handwritten style annotations circle overlay using SVG -->
          <div style="position: absolute; top: 80px; left: 80px; z-index: 8; color: ${primaryColor}; font-family: monospace; font-size: 13px;">
            <svg width="220" height="80" viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 70 C 50 20, 150 10, 200 40 M200 40 L 190 35 M200 40 L 195 50" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="4 2"/>
            </svg>
            <span style="position: absolute; top: 10px; left: 20px; transform: rotate(-8deg); opacity: 0.85;">contrarian perspective</span>
          </div>

          ${logoUrl ? `<div style="position: absolute; bottom: 60px; right: 80px; z-index: 20; opacity: 0.7; filter: grayscale(100%);"><img src="${logoUrl}" style="max-height: 40px; max-width: 130px; object-fit: contain;" /></div>` : ""}
        </div>
      `;
    }
  }
};

export function selectLayout(recentHistory: string[], seed: number = Date.now()): LayoutBlueprint {
  const allBlueprints = Object.values(LAYOUT_BLUEPRINTS);
  
  const lookbackLength = Math.min(4, recentHistory.length);
  const recentFamilies = recentHistory.slice(-lookbackLength).map(id => LAYOUT_BLUEPRINTS[id]?.family).filter(Boolean);
  
  let candidates = allBlueprints.filter(bp => !recentFamilies.includes(bp.family));
  
  if (candidates.length === 0) {
    candidates = allBlueprints;
  }
  
  const index = Math.abs(Math.sin(seed) * 1000) % candidates.length;
  return candidates[Math.floor(index)];
}
