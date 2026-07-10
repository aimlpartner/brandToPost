import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Helper to generate a tiny 1x1 base64 transparent PNG
const dummyBase64Png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function runRenderTest() {
  const visualType = "custom-overlay";
  const visualData = {
    customHtml: `
      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; background: rgba(0,0,0,0.5); color: white; width: 1080px; height: 1080px;">
        <h1 style="font-size: 64px; font-weight: 800; line-height: 1.25; margin: 0;">Test Overlay Headline</h1>
        <img src="logo" alt="logo" style="width: 50px; height: 50px;" />
      </div>
    `
  };
  const imageUrl = dummyBase64Png;
  const dna = { visualData: { colors: ["#4F46E5", "#111827"] } };
  const fallbackText = "Test Fallback";
  const activeLogo = dummyBase64Png;

  // Replicate server.ts logic for rendering HTML content
  const primaryColor = dna?.visualData?.colors?.[0] || "#4F46E5";
  const secondaryColor = dna?.visualData?.colors?.[1] || "#111827";
  const safeVisualType = visualType || "custom-overlay";
  const headline = visualData?.headline || fallbackText || "Your text here";
  
  let resolvedTextPos = 'bottom';
  let resolvedLogoPos = 'top-right';
  let logoStyles = 'bottom: 80px; right: 80px;';
  
  let htmlContent = `<div style="width: 1080px; height: 1080px; position: relative; background: #000; overflow: hidden; font-family: 'Inter', system-ui, sans-serif;">
${imageUrl ? `<img src="${imageUrl}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />` : ''}
${visualData?.customHtml 
  ? `<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; mix-blend-mode: normal; z-index: 5;">${visualData.customHtml}</div>` 
  : `<div>Fallback Content</div>`}
${activeLogo ? `<div style="position: absolute; ${logoStyles}; z-index: 100;"><img src="${activeLogo}" style="max-height: 70px; max-width: 180px; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));" /></div>` : ''}
</div>`;

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin: 0; padding: 0; }
  h1, h2, h3, h4, h5, p, div { box-sizing: border-box; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
  });

  try {
    const page = await browser.newPage();
    console.log("Setting content in Puppeteer...");
    
    // Track page errors and console logs
    page.on('pageerror', (err) => console.log('Page error inside Puppeteer:', err));
    page.on('console', (msg) => console.log('Console from Puppeteer:', msg.text()));
    
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    
    // Call page.setContent and time it
    const start = Date.now();
    await page.setContent(fullHtml, { waitUntil: 'load', timeout: 25000 });
    console.log(`Content set successfully in ${Date.now() - start}ms`);
    
    console.log("Evaluating images load...");
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => {
            console.log('Image loaded: ' + img.src);
            resolve(null);
          };
          img.onerror = (e) => {
            console.log('Image failed to load: ' + img.src);
            resolve(null);
          };
        });
      }));
    });
    
    console.log("Capturing screenshot...");
    const buffer = await page.screenshot({ type: 'jpeg', quality: 92 });
    console.log(`Screenshot captured! Size: ${buffer.length} bytes`);
  } catch (e: any) {
    console.error("Error during rendering process:", e);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

runRenderTest().catch(console.error);
