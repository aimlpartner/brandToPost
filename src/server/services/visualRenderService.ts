import { LAYOUT_BLUEPRINTS, selectLayout } from '../../lib/layoutBlueprints';
import {
  sanitizeTemplateHtml,
  escapeHtmlText,
  escapeHtmlAttr,
  safeUrlOrEmpty,
  TEMPLATE_CSP_META,
} from '../../lib/sanitizeTemplateHtml';
import { runWithRenderLock } from './renderPoolService';
import { admin, db } from '../config/firebase';
import { logBackendTokenUsage } from '../utils/firestoreStorage';

export interface RenderVisualCardParams {
  visualType?: string;
  visualData?: any;
  imageUrl?: string;
  dna?: any;
  fallbackText?: string;
  activeLogo?: string;
  recentLayoutHistory?: any[];
  userId?: string;
  userEmail?: string;
}

export async function renderVisualCard(params: RenderVisualCardParams): Promise<{ url: string; layoutId: string }> {
  const {
    visualType,
    visualData,
    imageUrl,
    dna,
    fallbackText,
    activeLogo,
    recentLayoutHistory,
    userId,
    userEmail,
  } = params;

  const primaryColor = visualData?.primaryColor || dna?.visualData?.colors?.[0] || '#F59E0B';
  const secondaryColor = visualData?.secondaryColor || dna?.visualData?.colors?.[1] || '#08080C';
  const safeVisualType = visualType || 'custom-overlay';
  const headline = visualData?.headline || fallbackText || 'Your text here';

  const primaryFont = visualData?.fontFamily || dna?.visualData?.fonts?.primary || 'Inter';
  const fontFamily = primaryFont.includes(' ') && !primaryFont.includes("'")
    ? `'${primaryFont}'`
    : primaryFont;

  let selectedBlueprintId = '';
  let htmlContent = '';

  // 0. Check if hydrated renderedHtml is passed for V3 Master Templates
  if (visualData?.renderedHtml || visualData?.customHtml) {
    htmlContent = visualData.renderedHtml || visualData.customHtml;
  } else if (safeVisualType === 'grounded-research' || visualData?.rawHtml) {
    const { html: templateHtml, violations } = sanitizeTemplateHtml(visualData.rawHtml || '');
    if (violations.length > 0) {
      console.warn('[/api/render-visual] template sanitizer stripped unsafe markup:', violations);
    }

    const logoSrc = safeUrlOrEmpty(activeLogo || '');
    const logoReplacement = logoSrc
      ? `<img src="${escapeHtmlAttr(logoSrc)}" style="height: 48px; width: auto; max-width: 180px; object-fit: contain;" />`
      : '';

    htmlContent = templateHtml
      .replaceAll('{{HEADLINE}}', escapeHtmlText(headline || ''))
      .replaceAll('{{SUBTEXT}}', escapeHtmlText(visualData?.subtext || ''))
      .replaceAll('{{IMAGE_URL}}', escapeHtmlAttr(safeUrlOrEmpty(imageUrl || '')))
      .replaceAll('{{LOGO_URL}}', logoReplacement)
      .replaceAll('{{PRIMARY_COLOR}}', escapeHtmlAttr(primaryColor))
      .replaceAll('{{SECONDARY_COLOR}}', escapeHtmlAttr(secondaryColor))
      .replaceAll('{{FONT_FAMILY}}', escapeHtmlAttr(fontFamily));
  }
  // 1. Check if visualType directly matches a layout blueprint
  else if (LAYOUT_BLUEPRINTS[safeVisualType]) {
    selectedBlueprintId = safeVisualType;
  }
  // 2. Check if visualData.layoutId matches a layout blueprint
  else if (visualData?.layoutId && LAYOUT_BLUEPRINTS[visualData.layoutId]) {
    selectedBlueprintId = visualData.layoutId;
  }
  // 3. If "custom-overlay" is chosen but no specific layoutId is passed, run auto-rotation
  else if (safeVisualType === 'custom-overlay') {
    const history = Array.isArray(recentLayoutHistory) ? recentLayoutHistory : [];
    const chosenBlueprint = selectLayout(history);
    selectedBlueprintId = chosenBlueprint.id;
  }

  if (!htmlContent) {
    const blueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId];
    if (blueprint) {
      htmlContent = blueprint.buildHtml({
        headline,
        subtext: visualData?.subtext || '',
        imageUrl: imageUrl || '',
        logoUrl: activeLogo || null,
        primaryColor,
        secondaryColor,
        fontFamily,
      });
    } else {
      let resolvedTextPos = visualData?.layout?.textPosition || 'bottom';
      if (safeVisualType === 'creative-story') {
        resolvedTextPos = 'bottom';
      } else if (safeVisualType === 'abstract-announcement') {
        resolvedTextPos = 'middle';
      } else if (safeVisualType === 'powerful-quote') {
        resolvedTextPos = 'middle';
      } else if (safeVisualType === 'data-infographic') {
        resolvedTextPos = 'top';
      }

      let resolvedLogoPos = visualData?.layout?.logoPosition;
      if (!resolvedLogoPos) {
        resolvedLogoPos = resolvedTextPos === 'bottom' ? 'top-right' : 'bottom-right';
      }

      if (resolvedTextPos === 'bottom' && resolvedLogoPos.startsWith('bottom')) {
        resolvedLogoPos = resolvedLogoPos.replace('bottom', 'top');
      } else if (resolvedTextPos === 'top' && resolvedLogoPos.startsWith('top')) {
        resolvedLogoPos = resolvedLogoPos.replace('top', 'bottom');
      }

      let logoStyles = 'bottom: 80px; right: 80px;';
      const pos = resolvedLogoPos;
      if (pos === 'top-left') logoStyles = 'top: 80px; left: 80px;';
      if (pos === 'top-center') logoStyles = 'top: 80px; left: 50%; transform: translateX(-50%);';
      if (pos === 'top-right') logoStyles = 'top: 80px; right: 80px;';
      if (pos === 'middle-left') logoStyles = 'top: 50%; left: 80px; transform: translateY(-50%);';
      if (pos === 'center') logoStyles = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
      if (pos === 'middle-right') logoStyles = 'top: 50%; right: 80px; transform: translateY(-50%);';
      if (pos === 'bottom-left') logoStyles = 'bottom: 80px; left: 80px;';
      if (pos === 'bottom-center') logoStyles = 'bottom: 80px; left: 50%; transform: translateX(-50%);';
      if (pos === 'bottom-right') logoStyles = 'bottom: 80px; right: 80px;';

      const textShadowDeep = '0 8px 32px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)';
      const customHtmlResult = sanitizeTemplateHtml(visualData?.customHtml || '');
      if (customHtmlResult.violations.length > 0) {
        console.warn('[/api/render-visual] customHtml sanitizer stripped unsafe markup:', customHtmlResult.violations);
      }
      let processedCustomHtml = customHtmlResult.html;
      if (processedCustomHtml && activeLogo) {
        const safeLogo = safeUrlOrEmpty(activeLogo);
        if (safeLogo) {
          processedCustomHtml = processedCustomHtml.replace(/<img([^>]+)src=["']([^"']*)["']([^>]*)>/gi, (match, p1, src, p3) => {
            const isLogo = src.toLowerCase().includes('logo') || match.toLowerCase().includes('alt="logo"') || match.toLowerCase().includes("alt='logo'");
            if (isLogo) {
              return `<img${p1}src="${escapeHtmlAttr(safeLogo)}"${p3}>`;
            }
            return match;
          });
        }
      }

      if (safeVisualType === 'creative-story') {
        htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #111; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />` : ''}
<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.1) 100%); z-index: 1;"></div>
<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; padding: 80px 100px 80px 80px; display: flex; flex-direction: column; justify-content: flex-end; box-sizing: border-box; z-index: 10;">
${visualData?.subtext ? `<div style="margin-bottom: 24px; color: #a5b4fc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: clamp(20px, 2.5vw, 28px); text-shadow: ${textShadowDeep}; width: 85%; overflow-wrap: break-word;">— ${visualData.subtext}</div>` : ''}
<h2 style="color: white; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em; font-size: clamp(48px, 6vw, 90px); margin: 0; padding-bottom: 40px; text-shadow: ${textShadowDeep}; text-wrap: balance; width: 85%; overflow-wrap: break-word;">${headline}</h2>
</div>
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;
      } else if (safeVisualType === 'abstract-announcement') {
        htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #080808; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0.9; background: radial-gradient(circle at top right, ${primaryColor}60, transparent 65%), radial-gradient(circle at bottom left, ${secondaryColor}90, ${primaryColor}30 85%); z-index: 1;"></div>
${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; mix-blend-mode: overlay; z-index: 2;" />` : ''}
<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%); z-index: 3;"></div>
<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-height: 90%; background: rgba(15,15,15,0.75); backdrop-filter: blur(32px); border: 2px solid rgba(255,255,255,0.1); padding: 80px 100px; border-radius: 40px; text-align: center; box-sizing: border-box; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 25px 80px rgba(0,0,0,0.8);">
<h2 style="color: white; font-weight: 800; line-height: 1.1; margin: 0 0 24px 0; font-size: clamp(40px, 5vw, 84px); text-wrap: balance; overflow-wrap: break-word; text-shadow: ${textShadowDeep};">${headline}</h2>
${visualData?.subtext ? `<div style="height: 4px; width: 80px; background: rgba(255,255,255,0.4); margin: 32px auto; border-radius: 4px;"></div><p style="color: #e5e7eb; font-weight: 500; line-height: 1.4; margin: 0; font-size: clamp(24px, 3vw, 36px); text-wrap: balance; overflow-wrap: break-word; text-shadow: 0 2px 8px rgba(0,0,0,0.6);">${visualData.subtext}</p>` : ''}
</div>
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;
      } else if (safeVisualType === 'data-infographic') {
        htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #ffffff; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; padding: 100px; box-sizing: border-box;">
<div style="text-align: center; margin-bottom: 80px; z-index: 10;">
<h2 style="color: #0f172a; font-weight: 900; margin: 0; line-height: 1.15; letter-spacing: -0.02em; font-size: clamp(48px, 6vw, 84px); text-wrap: balance; overflow-wrap: break-word;">${headline}</h2>
${visualData?.subtext ? `<p style="color: #475569; font-weight: 500; font-size: clamp(24px, 3vw, 36px); margin: 24px 0 0 0; text-wrap: balance; overflow-wrap: break-word;">${visualData.subtext}</p>` : ''}
</div>
<div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; z-index: 10;">
${(visualData?.stats?.length ? visualData.stats : [{ label: 'Stat A', value: '85%' }, { label: 'Stat B', value: '2.4x' }]).slice(0, 4).map((s: any, i: number) => {
  const bgs = ['#eff6ff', '#fff7ed', '#faf5ff', '#ecfdf5'];
  const textColors = ['#1e3a8a', '#9a3412', '#6b21a8', '#065f46'];
  return `<div style="border-radius: 32px; background: ${bgs[i % 4]}; padding: 48px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="font-size: clamp(24px, 3vw, 36px); font-weight: 600; margin-bottom: 12px; color: ${textColors[i % 4]}; line-height: 1.2;">${s.label}</div>
  <div style="font-size: clamp(64px, 8vw, 120px); font-weight: 900; line-height: 1; color: ${textColors[i % 4]};">${s.value}</div>
</div>`;
}).join('')}
</div>
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;
      } else if (safeVisualType === 'powerful-quote') {
        htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px; box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(135deg, ${secondaryColor}, #0a0a0a 80%); overflow: hidden;">
<div style="position: absolute; top: -50px; left: -50px; font-size: 800px; color: rgba(255,255,255,0.03); font-family: 'Playfair Display', serif; line-height: 1; z-index: 1;">"</div>
<h2 style="color: white; font-weight: 800; line-height: 1.2; margin: 0; font-size: clamp(44px, 6vw, 84px); z-index: 10; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word;">"${headline}"</h2>
<div style="width: 100px; height: 6px; background-color: ${primaryColor}; margin: 64px 0 40px 0; z-index: 10; border-radius: 3px;"></div>
<div style="color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; font-size: clamp(20px, 3vw, 32px); z-index: 10; text-wrap: balance; overflow-wrap: break-word;">${visualData?.subtext || dna?.name || 'The Vision'}</div>
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;
      } else {
        htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />` : ''}
${processedCustomHtml
  ? `<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; mix-blend-mode: normal; z-index: 5;">${processedCustomHtml}</div>`
  : `<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 100%); z-index: 2;"></div>
     <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding: 100px; text-align: center; box-sizing: border-box; z-index: 5;">
       <h2 style="color: white; font-weight: 800; line-height: 1.15; font-size: clamp(48px, 6vw, 90px); margin: 0 0 24px 0; text-shadow: ${textShadowDeep}; text-wrap: balance; overflow-wrap: break-word; width: 100%;">${headline}</h2>
       ${visualData?.subtext ? `<p style="color: #f3f4f6; font-size: clamp(24px, 3vw, 36px); font-weight: 500; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8); text-wrap: balance; overflow-wrap: break-word;">${visualData.subtext}</p>` : ''}
     </div>`}
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;
      }
    }
  }

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Clash+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body { margin: 0; padding: 0; }
h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  const executeRender = async (targetHtml: string): Promise<string> => {
    return await runWithRenderLock(async (browser) => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
        await page.setContent(targetHtml, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 20000 }).catch(() => {});

        await page.evaluate(async () => {
          try {
            await Promise.race([
              document.fonts.ready,
              new Promise(resolve => setTimeout(resolve, 3000))
            ]);
          } catch (_) {}

          const elements = Array.from(document.querySelectorAll('*'));
          const imagePromises: Promise<any>[] = [];

          elements.forEach((el) => {
            if (el.tagName === 'IMG') {
              const img = el as HTMLImageElement;
              if (!img.complete) {
                imagePromises.push(new Promise((resolve) => {
                  const t = setTimeout(() => resolve(null), 3000);
                  img.onload = () => { clearTimeout(t); resolve(null); };
                  img.onerror = () => { clearTimeout(t); resolve(null); };
                }));
              }
            }
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg.startsWith('url(')) {
              const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
              if (url && !url.startsWith('data:')) {
                const img = new Image();
                img.src = url;
                imagePromises.push(new Promise((resolve) => {
                  const t = setTimeout(() => resolve(null), 3000);
                  img.onload = () => { clearTimeout(t); resolve(null); };
                  img.onerror = () => { clearTimeout(t); resolve(null); };
                }));
              }
            }
          });

          await Promise.all(imagePromises);
        });

        const buffer = await page.screenshot({ type: 'png' });
        return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
      } finally {
        await page.close().catch(() => {});
      }
    });
  };

  let renderResult: string;
  try {
    renderResult = await executeRender(fullHtml);
  } catch (firstErr: any) {
    console.warn('[PUPPETEER POOL WARNING] Initial template render failed, attempting blueprint fallback:', firstErr?.message);

    const fallbackBlueprint = LAYOUT_BLUEPRINTS[selectedBlueprintId] || selectLayout([]);
    const fallbackHtmlContent = fallbackBlueprint.buildHtml({
      headline,
      subtext: visualData?.subtext || '',
      imageUrl: imageUrl || '',
      logoUrl: activeLogo || null,
      primaryColor,
      secondaryColor,
      fontFamily
    });

    const fallbackFullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${TEMPLATE_CSP_META}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Clash+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body { margin: 0; padding: 0; }
h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
${fallbackHtmlContent}
</body>
</html>`;

    renderResult = await executeRender(fallbackFullHtml);
    selectedBlueprintId = fallbackBlueprint.id;
  }

  if (userId) {
    await logBackendTokenUsage(userId, 'puppeteer_overlay_render', 'puppeteer-layout-render', {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 1
    });
  }

  return { url: renderResult, layoutId: selectedBlueprintId };
}
