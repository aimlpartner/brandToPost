import { Request, Response } from 'express';
import { scrapeWebsite } from '../services/scrapingService';
import { normalizePublicHttpUrl } from '../utils/imageUtils';

export async function handleProxyImage(req: Request, res: Response) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL query parameter is required');
  }
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Remote server responded with: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (e: any) {
    console.error('CORS proxy failed for image:', url, e.message);
    res.status(500).send(e.message);
  }
}

export async function handleDownloadLogo(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url, filename } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL query parameter is required');
  }
  const safeFilename = typeof filename === 'string' && filename ? filename : 'logo.png';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Remote host returned status code: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);
  } catch (err: any) {
    console.error('CORS proxy logo download failed, redirecting to direct url as fallback:', err);
    res.redirect(url);
  }
}

export async function handleScrapeUrl(req: Request, res: Response) {
  const { url } = req.body;
  console.log(`[api/scrape] Received request for URL: ${url}`);
  let targetUrl: string;
  try {
    targetUrl = normalizePublicHttpUrl(url);
    console.log(`[api/scrape] Normalized target URL to: ${targetUrl}`);
  } catch (error: any) {
    console.error(`[api/scrape] URL normalization failed for input "${url}":`, error.message);
    return res.status(400).json({ error: error.message || 'Invalid URL' });
  }

  let pageRef: any = null;
  let aborted = false;

  const handleAbort = async () => {
    aborted = true;
    console.log(`[api/scrape] Connection closed by client. Aborting Puppeteer page for URL: ${targetUrl}`);
    if (pageRef) {
      try {
        await pageRef.close().catch(() => {});
      } catch (err) {
        // ignore
      }
    }
  };

  req.on('close', handleAbort);

  try {
    const userId = (req as any).user?.uid;
    const scrapeData = await scrapeWebsite(targetUrl, {
      isAborted: () => aborted,
      onPageCreated: (page) => {
        pageRef = page;
      },
      userId
    });

    req.off('close', handleAbort);
    return res.json(scrapeData);
  } catch (error: any) {
    req.off('close', handleAbort);
    if (aborted || error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log(`[api/scrape] Scrape operation safely halted due to client cancellation.`);
      if (!res.headersSent) {
        return res.status(499).json({ error: 'Client closed request' });
      }
      return;
    }
    console.error(`[api/scrape] Scraping pipeline error:`, error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Failed to scrape webpage' });
    }
  }
}
