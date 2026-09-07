import { runWithRenderLock } from './renderPoolService';
import { normalizePublicHttpUrl } from '../utils/imageUtils';
import { logBackendTokenUsage } from '../utils/firestoreStorage';

export interface ScrapeResult {
  textContent: string;
  extractedFonts: string[];
  extractedColors: string[];
  extractedBgColors: string[];
  mediaImages: string[];
  logoUrl: string;
  crawledUrls: string[];
  cssContent: string;
}

export async function scrapeWebsite(
  urlInput: string,
  options?: {
    isAborted?: () => boolean;
    onPageCreated?: (page: any) => void;
    userId?: string;
  }
): Promise<ScrapeResult> {
  const targetUrl = normalizePublicHttpUrl(urlInput);
  console.log(`[scrapingService] Normalized target URL to: ${targetUrl}`);

  const checkAbort = () => {
    if (options?.isAborted && options.isAborted()) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
  };

  let page: any = null;

  const scrapeData: any = await runWithRenderLock(async (browser) => {
    checkAbort();
    console.log(`[scrapingService] Creating new browser page...`);
    page = await browser.newPage();
    if (options?.onPageCreated) {
      options.onPageCreated(page);
    }

    try {
      console.log(`[scrapingService] Setting viewport for ${targetUrl}...`);
      await page.setViewport({ width: 1280, height: 800 });
      checkAbort();

      console.log(`[scrapingService] Navigating to target URL: ${targetUrl}...`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch((e: any) => {
        checkAbort();
        console.error('[scrapingService] Goto timeout or error: ', e.message || e);
      });
      checkAbort();

      console.log(`[scrapingService] Scrolling page to trigger lazy-loaded showcase assets...`);
      await page.evaluate(async () => {
        window.scrollBy(0, 1000);
        await new Promise((r) => setTimeout(r, 400));
        window.scrollTo(0, 0);
      }).catch(() => {});

      console.log(`[scrapingService] Evaluating page document to extract Brand DNA...`);
      const evaluationResult = await page.evaluate(new Function(`
        const textContent = document.body.innerText.substring(0, 20000);
        
        const fontCounts = {};
        const colorCounts = {};
        const bgColorCounts = {};
        
        // Sample standard elements heavily used for text
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, span, a, button, div.container, section');
        const total = Math.min(elements.length, 500);
        
        for (let i = 0; i < total; i++) {
          const el = elements[i];
          const style = window.getComputedStyle(el);
          
          if (style.fontFamily) {
             const cleanFont = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
             if (cleanFont && !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'system-ui', 'cursive', 'fantasy'].includes(cleanFont.toLowerCase())) {
                 fontCounts[cleanFont] = (fontCounts[cleanFont] || 0) + 1;
             }
          }
          if (style.color && style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent') {
             colorCounts[style.color] = (colorCounts[style.color] || 0) + 1;
          }
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
             bgColorCounts[style.backgroundColor] = (bgColorCounts[style.backgroundColor] || 0) + 1;
          }
        }
        
        // Extract Media Images (Gallery, Showcase, Showcase Assets) - Exclude BG Images & Icons
        const imageScoredMap = new Map();

        const isNoiseImage = (str) => {
          const s = (str || '').toLowerCase();
          return [
            'logo', 'icon', 'avatar', 'badge', 'social', 'button', 'spinner', 'arrow', 
            'chevron', 'star', 'rating', 'payment', 'stripe', 'paypal', 'visa', 'mastercard',
            'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
            'favicon', 'pixel', 'analytics', 'tracking', 'gravatar', 'profile-pic', 'user-img',
            'bg-', 'background-', 'pattern', 'backdrop', 'overlay-bg'
          ].some(k => s.includes(k));
        };

        const candidateElements = Array.from(document.querySelectorAll('img, picture source, [data-src], [data-srcset], [srcset]'));

        candidateElements.forEach(el => {
          let rawSrc = el.src || el.dataset?.src || el.dataset?.original || el.dataset?.lazySrc || el.getAttribute('data-src') || '';
          
          if (!rawSrc && el.getAttribute('srcset')) {
            const srcsetParts = el.getAttribute('srcset').split(',');
            if (srcsetParts.length > 0) {
              const lastPart = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
              if (lastPart) rawSrc = lastPart;
            }
          }

          if (!rawSrc || rawSrc.startsWith('data:image/svg') || rawSrc.startsWith('data:text')) return;

          let resolvedUrl = rawSrc;
          try {
            resolvedUrl = new URL(rawSrc, window.location.href).href;
          } catch (e) {
            return;
          }

          if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) return;

          if (el.tagName === 'IMG') {
            const nw = el.naturalWidth || el.width || el.getBoundingClientRect().width || 0;
            const nh = el.naturalHeight || el.height || el.getBoundingClientRect().height || 0;

            if (nw > 0 && nh > 0) {
              if (nw < 160 || nh < 160) return;
              const ratio = nw / nh;
              if (ratio < 0.25 || ratio > 4.5) return;
            }
          }

          const classAltId = ((el.className || '') + ' ' + (el.alt || '') + ' ' + (el.id || '') + ' ' + resolvedUrl).toLowerCase();
          if (isNoiseImage(classAltId)) return;

          let score = 10;
          let curr = el.parentElement;
          for (let level = 0; level < 5; level++) {
            if (!curr) break;
            const parentContext = ((curr.className || '') + ' ' + (curr.id || '') + ' ' + curr.tagName).toLowerCase();
            if (parentContext.includes('bg-') || parentContext.includes('background-')) score -= 5;
            if (/(gallery|showcase|portfolio|hero|carousel|slider|product|feature|work|project|case-study|grid|lightbox|preview|media)/i.test(parentContext)) {
              score += 25;
            }
            curr = curr.parentElement;
          }

          if (/(showcase|gallery|portfolio|product|screenshot|demo|preview|work|feature|hero)/i.test(classAltId)) {
            score += 15;
          }

          if (score > 0) {
            const prevScore = imageScoredMap.get(resolvedUrl) || 0;
            if (score > prevScore) {
              imageScoredMap.set(resolvedUrl, score);
            }
          }
        });

        const uniqueMediaImages = Array.from(imageScoredMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])
          .slice(0, 15);
        
        // Advanced Multi-Tiered Logo Finding Engine
        let logoUrl = '';
        const excludeKeywords = [
          'client', 'partner', 'sponsor', 'press', 'customer', 
          'association', 'award', 'portfolio', 'trusted', 
          'trusted-by', 'user-logo', 'client-logo', 'clients', 'partners', 'sponsors',
          'partner-logo', 'customer-logo', 'stripe', 'paypal', 'visa', 'mastercard',
          'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
          'logo-carousel', 'trustedby', 'customer-review', 'testimonial', 'grid', 'logos', 'asset'
        ];

        const isExcluded = (element) => {
          if (!element) return false;
          let current = element;
          for (let level = 0; level < 5; level++) {
            if (!current) break;
            const selfString = (
              (current.className || '') + ' ' + 
              (current.id || '') + ' ' + 
              (current.getAttribute('class') || '')
            ).toLowerCase();
            
            if (excludeKeywords.some(keyword => selfString.includes(keyword))) {
              return true;
            }
            current = current.parentElement;
          }
          return false;
        };

        const candidates = [];
        const imgElements = Array.from(document.querySelectorAll('img'));
        imgElements.forEach((img) => {
          const src = img.src;
          if (!src) return;
          if (src.startsWith('data:') && !src.startsWith('data:image/svg')) return;
          if (isExcluded(img)) return;
          
          const classAltSrc = (img.className + ' ' + img.alt + ' ' + img.src + ' ' + (img.id || '')).toLowerCase();
          let score = 0;
          if (classAltSrc.includes('logo')) score += 20;
          if (classAltSrc.includes('brand')) score += 10;
          
          let parent = img.parentElement;
          while (parent && parent.tagName !== 'BODY') {
            if (parent.tagName === 'A') {
              const href = parent.getAttribute('href');
              if (href === '/' || href === window.location.origin || href === window.location.pathname) {
                score += 15;
              }
              break;
            }
            parent = parent.parentElement;
          }
          candidates.push({ score, src });
        });

        const svgs = Array.from(document.querySelectorAll('header svg, nav svg, a svg'));
        svgs.forEach((svg) => {
          if (isExcluded(svg)) return;
          const classId = ((svg.className)?.baseVal || '') + ' ' + (svg.id || '');
          const classIdLower = classId.toLowerCase();
          let score = 5;
          if (classIdLower.includes('logo')) score += 15;
          if (classIdLower.includes('brand')) score += 10;
          
          try {
            const svgString = new XMLSerializer().serializeToString(svg);
            const svgBase64 = window.btoa(unescape(encodeURIComponent(svgString)));
            const dataUrl = 'data:image/svg+xml;base64,' + svgBase64;
            candidates.push({ score, src: dataUrl });
          } catch (e) {}
        });

        candidates.sort((a, b) => b.score - a.score);
        const bestCandidate = candidates[0];
        if (bestCandidate && bestCandidate.score > 0) {
          logoUrl = bestCandidate.src;
        } else {
          const favicon = document.querySelector("link[rel*='icon']");
          if (favicon) {
            logoUrl = favicon.href;
          } else {
            logoUrl = window.location.origin + '/favicon.ico';
          }
        }

        const links = [];
        document.querySelectorAll('a').forEach(a => {
          const href = a.href;
          const text = a.innerText.trim();
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            links.push({ href, text });
          }
        });

        return { textContent, fontCounts, colorCounts, bgColorCounts, mediaImages: uniqueMediaImages, logoUrl, links };
      `) as any);

      console.log(`[scrapingService] Page evaluation completed successfully.`);

      const links = evaluationResult.links || [];
      let targetOrigin = '';
      try {
        targetOrigin = new URL(targetUrl).origin;
      } catch (e) {}

      const subpageCandidates = new Map<string, { href: string; score: number }>();

      if (targetOrigin) {
        for (const link of links) {
          try {
            const linkUrl = new URL(link.href);
            if (linkUrl.origin !== targetOrigin) continue;

            let cleanPath = linkUrl.pathname.replace(/\/+$/, '');
            if (!cleanPath) continue;

            const fullCleanUrl = `${targetOrigin}${cleanPath}`;
            if (fullCleanUrl === targetUrl.replace(/\/+$/, '')) continue;

            if (/\.(pdf|png|jpg|jpeg|gif|zip|doc|docx|xml|json|svg)$/i.test(cleanPath)) continue;
            if (/(login|signup|register|logout|signin|auth|cart|checkout|account|admin|terms|privacy|legal|cookies|subscribe|feed)/i.test(cleanPath)) continue;

            let score = 0;
            const pathLower = cleanPath.toLowerCase();
            const textLower = link.text.toLowerCase();

            if (/(about|company|team|story|who-we-are)/i.test(pathLower)) score += 20;
            if (/(gallery|showcase|portfolio|work|projects|photos|cases|case-studies|media|catalog|store)/i.test(pathLower)) score += 25;
            if (/(product|feature|service|solution|pricing|plan|how|technology|faq|help)/i.test(pathLower)) score += 15;

            if (/(about|who we are|our story|company|team)/i.test(textLower)) score += 10;
            if (/(gallery|showcase|portfolio|our work|projects|case studies|photos|media)/i.test(textLower)) score += 15;
            if (/(product|feature|pricing|service|solution|how|technology|faq|help)/i.test(textLower)) score += 5;

            if (score === 0) score = 1;

            const existing = subpageCandidates.get(fullCleanUrl);
            if (!existing || existing.score < score) {
              subpageCandidates.set(fullCleanUrl, { href: fullCleanUrl, score });
            }
          } catch (_) {}
        }
      }

      const sortedSubpages = Array.from(subpageCandidates.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      console.log(`[scrapingService] Discovered same-domain subpages:`, Array.from(subpageCandidates.keys()));
      console.log(`[scrapingService] Selected top subpages for crawling:`, sortedSubpages.map(s => `${s.href} (score: ${s.score})`));

      const subpageContents: { url: string; textContent: string }[] = [];
      const subpageMediaImages: string[] = [];

      for (const sub of sortedSubpages) {
        checkAbort();
        console.log(`[scrapingService] Crawling subpage: ${sub.href}...`);
        let subPageInstance = null;
        try {
          subPageInstance = await browser.newPage();
          await subPageInstance.setViewport({ width: 1280, height: 800 });
          await subPageInstance.goto(sub.href, { waitUntil: 'domcontentloaded', timeout: 7000 });

          checkAbort();

          await subPageInstance.evaluate(async () => {
            window.scrollBy(0, 800);
            await new Promise(r => setTimeout(r, 300));
            window.scrollTo(0, 0);
          }).catch(() => {});

          const subResult = await subPageInstance.evaluate(new Function(`
            const textContent = document.body.innerText.substring(0, 10000);
            const imageScoredMap = new Map();
            const isNoiseImage = (str) => {
              const s = (str || '').toLowerCase();
              return [
                'logo', 'icon', 'avatar', 'badge', 'social', 'button', 'spinner', 'arrow', 
                'chevron', 'star', 'rating', 'payment', 'stripe', 'paypal', 'visa', 'mastercard',
                'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'discord',
                'favicon', 'pixel', 'analytics', 'tracking', 'gravatar', 'profile-pic', 'user-img',
                'bg-', 'background-', 'pattern', 'backdrop', 'overlay-bg'
              ].some(k => s.includes(k));
            };

            const candidateElements = Array.from(document.querySelectorAll('img, picture source, [data-src], [data-srcset], [srcset]'));

            candidateElements.forEach(el => {
              let rawSrc = el.src || el.dataset?.src || el.dataset?.original || el.dataset?.lazySrc || el.getAttribute('data-src') || '';
              if (!rawSrc && el.getAttribute('srcset')) {
                const srcsetParts = el.getAttribute('srcset').split(',');
                if (srcsetParts.length > 0) {
                  const lastPart = srcsetParts[srcsetParts.length - 1].trim().split(' ')[0];
                  if (lastPart) rawSrc = lastPart;
                }
              }

              if (!rawSrc || rawSrc.startsWith('data:image/svg') || rawSrc.startsWith('data:text')) return;

              let resolvedUrl = rawSrc;
              try {
                resolvedUrl = new URL(rawSrc, window.location.href).href;
              } catch (e) {
                return;
              }

              if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) return;

              if (el.tagName === 'IMG') {
                const nw = el.naturalWidth || el.width || el.getBoundingClientRect().width || 0;
                const nh = el.naturalHeight || el.height || el.getBoundingClientRect().height || 0;
                if (nw > 0 && nh > 0) {
                  if (nw < 160 || nh < 160) return;
                  const ratio = nw / nh;
                  if (ratio < 0.25 || ratio > 4.5) return;
                }
              }

              const classAltId = ((el.className || '') + ' ' + (el.alt || '') + ' ' + (el.id || '') + ' ' + resolvedUrl).toLowerCase();
              if (isNoiseImage(classAltId)) return;

              let score = 10;
              let curr = el.parentElement;
              for (let level = 0; level < 5; level++) {
                if (!curr) break;
                const parentContext = ((curr.className || '') + ' ' + (curr.id || '') + ' ' + curr.tagName).toLowerCase();
                if (parentContext.includes('bg-') || parentContext.includes('background-')) score -= 5;
                if (/(gallery|showcase|portfolio|hero|carousel|slider|product|feature|work|project|case-study|grid|lightbox|preview|media)/i.test(parentContext)) {
                  score += 25;
                }
                curr = curr.parentElement;
              }

              if (/(showcase|gallery|portfolio|product|screenshot|demo|preview|work|feature|hero)/i.test(classAltId)) {
                score += 15;
              }

              if (score > 0) {
                const prevScore = imageScoredMap.get(resolvedUrl) || 0;
                if (score > prevScore) imageScoredMap.set(resolvedUrl, score);
              }
            });

            const uniqueImages = Array.from(imageScoredMap.entries())
              .sort((a, b) => b[1] - a[1])
              .map(entry => entry[0])
              .slice(0, 10);

            return { textContent, images: uniqueImages };
          `) as any);

          console.log(`[scrapingService] Successfully crawled subpage: ${sub.href} (${subResult.textContent.length} chars, ${subResult.images.length} images)`);
          subpageContents.push({ url: sub.href, textContent: subResult.textContent });
          subpageMediaImages.push(...subResult.images);
        } catch (e: any) {
          console.error(`[scrapingService] Error crawling subpage ${sub.href}:`, e.message || e);
        } finally {
          if (subPageInstance) {
            await subPageInstance.close().catch(() => {});
          }
        }
      }

      let aggregatedTextContent = evaluationResult.textContent;
      for (const sub of subpageContents) {
        let pathLabel = sub.url;
        try {
          pathLabel = new URL(sub.url).pathname;
        } catch (_) {}
        aggregatedTextContent += `\n\n--- SUBPAGE: ${pathLabel} ---\n${sub.textContent}`;
      }

      const mergedImages = Array.from(new Set([...evaluationResult.mediaImages, ...subpageMediaImages])).slice(0, 25);
      const crawledUrls = [targetUrl, ...subpageContents.map(c => c.url)];

      return {
        textContent: aggregatedTextContent,
        fontCounts: evaluationResult.fontCounts,
        colorCounts: evaluationResult.colorCounts,
        bgColorCounts: evaluationResult.bgColorCounts,
        mediaImages: mergedImages,
        logoUrl: evaluationResult.logoUrl,
        crawledUrls
      };
    } finally {
      if (page) {
        console.log(`[scrapingService] Closing page instance...`);
        const tempPage = page;
        page = null;
        await tempPage.close().catch(() => {});
        console.log(`[scrapingService] Page instance closed.`);
      }
    }
  });

  checkAbort();

  console.log(`[scrapingService] Sorting and formatting extracted data...`);
  const extractedFonts = Object.entries(scrapeData.fontCounts || {})
    .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
    .map(entry => entry[0])
    .slice(0, 5);

  const extractedColors = Object.entries(scrapeData.colorCounts || {})
    .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
    .map(entry => entry[0])
    .slice(0, 5);

  const extractedBgColors = Object.entries(scrapeData.bgColorCounts || {})
    .sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number))
    .map(entry => entry[0])
    .slice(0, 5);

  if (options?.userId) {
    await logBackendTokenUsage(options.userId, 'puppeteer_web_scrape', 'puppeteer-web-scrape', {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 1
    });
  }

  return {
    textContent: scrapeData.textContent,
    extractedFonts,
    extractedColors,
    extractedBgColors,
    mediaImages: scrapeData.mediaImages,
    logoUrl: scrapeData.logoUrl,
    crawledUrls: scrapeData.crawledUrls,
    cssContent: `Most Used Text Colors (RGB/HEX): ${extractedColors.join(', ')}\nMost Used Background Colors: ${extractedBgColors.join(', ')}`
  };
}

export async function proxyRemoteImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!response.ok) {
    throw new Error(`Remote server responded with: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}
