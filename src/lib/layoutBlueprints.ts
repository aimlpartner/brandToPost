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
  }) => string;
}

export const LAYOUT_BLUEPRINTS: Record<string, LayoutBlueprint> = {
  "editorial-left": {
    id: "editorial-left",
    name: "Editorial Left Panel",
    family: "split-panel",
    isLightBg: false,
    buildHtml: ({ headline, subtext, imageUrl, logoUrl, primaryColor, secondaryColor, fontFamily }) => {
      const textShadow = "0 2px 4px rgba(0,0,0,0.1)";
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Left Text Column (45%) -->
          <div style="width: 45%; padding: 80px 50px; display: flex; flex-direction: column; justify-content: space-between; border-right: 2px solid ${primaryColor}; box-sizing: border-box; background: ${secondaryColor}; position: relative; z-10;">
            <div style="display: flex; flex-direction: column; gap: 36px; margin-top: 100px;">
              <div style="width: 50px; height: 6px; background: ${primaryColor}; border-radius: 3px;"></div>
              <h2 style="color: #ffffff; font-weight: 800; font-size: 52px; line-height: 1.2; margin: 0; text-shadow: ${textShadow}; word-break: break-word;">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 400; font-size: 20px; line-height: 1.6; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
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
      return `
        <div style="width: 1080px; height: 1080px; display: flex; background: ${secondaryColor}; overflow: hidden; font-family: ${fontFamily}, system-ui, sans-serif; box-sizing: border-box;">
          <!-- Left Image Column (55%) -->
          <div style="width: 55%; position: relative; overflow: hidden; height: 100%;">
            <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Right Text Column (45%) -->
          <div style="width: 45%; padding: 80px 50px; display: flex; flex-direction: column; justify-content: space-between; border-left: 2px solid ${primaryColor}; box-sizing: border-box; background: ${secondaryColor}; position: relative; z-10;">
            <div style="display: flex; flex-direction: column; gap: 36px; margin-top: 100px;">
              <div style="width: 50px; height: 6px; background: ${primaryColor}; border-radius: 3px;"></div>
              <h2 style="color: #ffffff; font-weight: 800; font-size: 52px; line-height: 1.2; margin: 0; text-shadow: ${textShadow}; word-break: break-word;">${headline}</h2>
              <p style="color: #cbd5e1; font-weight: 400; font-size: 20px; line-height: 1.6; margin: 0; text-shadow: ${textShadow};">${subtext}</p>
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
