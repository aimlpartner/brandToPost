import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Setting user agent...");
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    console.log("Navigating to sagar-disposal.vercel.app...");
    await page.goto('https://sagar-disposal.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    console.log("Evaluating page...");
    const links = await page.evaluate(() => {
      const results: { href: string; text: string }[] = [];
      document.querySelectorAll('a').forEach(a => {
        results.push({ href: a.href, text: a.innerText });
      });
      return results;
    });

    console.log("Found links count:", links.length);
    console.log("Raw links discovered:", JSON.stringify(links, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
}

run();
