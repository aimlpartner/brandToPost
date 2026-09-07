import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { esmDirname } from '../config/env';
import { serverMetrics } from '../utils/diagnosticLogs';

let sharedBrowser: any = null;
const activeRenderQueue: Array<{ resolve: (val: any) => void; reject: (err: any) => void }> = [];
let activeRendersCount = 0;
const MAX_CONCURRENT_RENDERS = 1; // Strict 1 browser viewport to avoid memory overloading on Cloud Run

export function findDynamicChrome(): string | null {
  const candidateDirs = [
    path.join(process.cwd(), '.cache', 'puppeteer'),
    path.join(esmDirname, '..', '.cache', 'puppeteer'),
    path.join(esmDirname, '.cache', 'puppeteer'),
    '/tmp/puppeteer-cache',
    path.join(process.cwd(), '.puppeteer-cache'),
    path.join(esmDirname, '..', '.puppeteer-cache'),
    path.join(esmDirname, '.puppeteer-cache'),
    '/home/u769235882/domains/brandtopost.com/public_html/.cache/puppeteer'
  ];

  const isWin = process.platform === 'win32';
  const execName = isWin ? 'chrome.exe' : 'chrome';

  for (const baseDir of candidateDirs) {
    try {
      const chromeDir = path.join(baseDir, 'chrome');
      if (fs.existsSync(chromeDir)) {
        const versions = fs.readdirSync(chromeDir);
        for (const v of versions) {
          const versionDir = path.join(chromeDir, v);
          if (fs.existsSync(versionDir)) {
            const subdirs = fs.readdirSync(versionDir);
            for (const sd of subdirs) {
              const candidate = path.join(versionDir, sd, execName);
              if (fs.existsSync(candidate)) {
                console.log(`[PUPPETEER POOL] Found Chrome at: ${candidate}`);
                return candidate;
              }
            }
          }
        }
      }
    } catch (err) {
      // ignore folder-specific scanning errors
    }
  }
  return null;
}

export async function runWithRenderLock<T>(task: (browser: any) => Promise<T>): Promise<T> {
  console.log(`[runWithRenderLock] Started task queue check. activeRendersCount: ${activeRendersCount}`);
  if (activeRendersCount >= MAX_CONCURRENT_RENDERS) {
    serverMetrics.throttledRequestsCount++;
    console.log(`[SCALABILITY GUARD] Maximum concurrent renders reached. Request queued.`);
    return new Promise((resolve, reject) => {
      activeRenderQueue.push({ resolve, reject });
    }).then(async () => {
      console.log(`[SCALABILITY GUARD] Request dequeued, executing task...`);
      return runWithRenderLock(task);
    });
  }

  activeRendersCount++;
  serverMetrics.activeRendersCount = activeRendersCount;
  console.log(`[runWithRenderLock] Incrementing activeRendersCount: ${activeRendersCount}`);
  try {
    let chromeExecutable = findDynamicChrome();
    let hasInstall = !!chromeExecutable;
    console.log(`[runWithRenderLock] Checking Chrome. exists: ${hasInstall}, path: ${chromeExecutable}`);

    if (!hasInstall) {
      const installCacheDir = path.join(process.cwd(), '.cache', 'puppeteer');
      console.log(`[PUPPETEER POOL] Local Chrome executable not found. Running auto-installer into ${installCacheDir}...`);
      try {
        execSync('npx puppeteer browsers install chrome', {
          env: { ...process.env, PUPPETEER_CACHE_DIR: installCacheDir },
          stdio: 'pipe'
        });
        try {
          console.log(`[PUPPETEER POOL] Setting permissions on ${installCacheDir}...`);
          execSync(`chmod -R 755 ${installCacheDir}`);
        } catch (eChmod: any) {
          console.error(`[PUPPETEER POOL] chmod failed:`, eChmod.message);
        }
        chromeExecutable = findDynamicChrome();
        hasInstall = !!chromeExecutable;
        console.log(`[runWithRenderLock] Re-checking Chrome after installation. exists: ${hasInstall}, path: ${chromeExecutable}`);
      } catch (eInstall: any) {
        console.error(`[PUPPETEER POOL] Local Chrome auto-installation to ${installCacheDir} failed: ${eInstall.message}`);

        // Fallback to /tmp/puppeteer-cache if main workspace install fails
        const fallbackCacheDir = '/tmp/puppeteer-cache';
        console.log(`[PUPPETEER POOL] Attempting fallback auto-installation to ${fallbackCacheDir}...`);
        try {
          execSync('npx puppeteer browsers install chrome', {
            env: { ...process.env, PUPPETEER_CACHE_DIR: fallbackCacheDir },
            stdio: 'pipe'
          });
          try {
            execSync(`chmod -R 755 ${fallbackCacheDir}`);
          } catch (eChmod: any) {}
          chromeExecutable = findDynamicChrome();
          hasInstall = !!chromeExecutable;
          console.log(`[runWithRenderLock] Re-checking Chrome after fallback installation. exists: ${hasInstall}, path: ${chromeExecutable}`);
        } catch (eFallback: any) {
          console.error(`[PUPPETEER POOL] Fallback installation also failed: ${eFallback.message}`);
        }
      }
    }

    const puppeteer = await import('puppeteer');
    if (!sharedBrowser || !sharedBrowser.isConnected()) {
      if (sharedBrowser) {
        try { await sharedBrowser.close().catch(() => {}); } catch (_) {}
        sharedBrowser = null;
      }
      console.log(`[PUPPETEER POOL] Initializing background browser instance...`);
      const launchOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      };
      if (hasInstall && chromeExecutable) {
        console.log(`[PUPPETEER POOL] Specifying explicit Chrome executable path: ${chromeExecutable}`);
        launchOptions.executablePath = chromeExecutable;
      } else {
        console.warn(`[PUPPETEER POOL] Chrome missing. Checking default fallback paths.`);
      }
      console.log(`[PUPPETEER POOL] Launching browser with options:`, JSON.stringify(launchOptions));
      try {
        sharedBrowser = await puppeteer.default.launch(launchOptions);
        console.log(`[PUPPETEER POOL] Browser launched successfully!`);
      } catch (launchErr: any) {
        console.error(`[PUPPETEER POOL] Browser launch failed:`, launchErr.message || launchErr);
        throw launchErr;
      }
    }
    console.log(`[runWithRenderLock] Calling task function...`);
    let result: T;
    try {
      result = await task(sharedBrowser);
    } catch (taskErr: any) {
      console.warn(`[PUPPETEER POOL] Task failed: ${taskErr.message}. Attempting browser reconnect and retry once...`);
      try { await sharedBrowser?.close().catch(() => {}); } catch (_) {}
      sharedBrowser = null;
      const launchOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      };
      if (hasInstall && chromeExecutable) launchOptions.executablePath = chromeExecutable;
      sharedBrowser = await puppeteer.default.launch(launchOptions);
      result = await task(sharedBrowser);
    }
    console.log(`[runWithRenderLock] Task function completed successfully.`);
    serverMetrics.totalRendersExecuted++;
    return result;
  } catch (err: any) {
    console.error(`[runWithRenderLock] Error inside block:`, err.message || err);
    throw err;
  } finally {
    activeRendersCount--;
    serverMetrics.activeRendersCount = activeRendersCount;
    console.log(`[runWithRenderLock] Decremented activeRendersCount: ${activeRendersCount}`);
    if (activeRenderQueue.length > 0) {
      const next = activeRenderQueue.shift();
      if (next) {
        console.log(`[runWithRenderLock] Releasing next queued render.`);
        next.resolve(true);
      }
    }
  }
}
