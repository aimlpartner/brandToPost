import puppeteer from 'puppeteer';

async function test() {
  console.log("Attempting to launch Puppeteer...");
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
    });
    console.log("Puppeteer launched successfully!");
    
    console.log("Opening new page...");
    const page = await browser.newPage();
    
    console.log("Setting content...");
    await page.setContent('<html><body><h1>Hello World from Puppeteer!</h1></body></html>');
    
    console.log("Taking screenshot...");
    const screenshot = await page.screenshot({ type: 'png' });
    console.log(`Screenshot taken! Size: ${screenshot.length} bytes`);
    
    await browser.close();
    console.log("Browser closed successfully.");
  } catch (err) {
    console.error("Puppeteer launch failed:", err);
  }
}

test();
