import dotenv from 'dotenv';
import path from 'path';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

// --- Stdio / Stdin EEXIST Error Workaround for Restricted Hosting Environments (like cPanel/Passenger) ---
try {
  // Test if accessing process.stdin throws
  const testStdin = process.stdin;
} catch (stdinErr: any) {
  console.warn(`[SYSTEM WORKAROUND] process.stdin is inaccessible in this environment (${stdinErr.message}). Redefining to dummy stream to prevent Puppeteer/Socket crash...`);
  try {
    const dummyStdin = new Readable({
      read() {
        this.push(null);
      }
    });
    Object.defineProperty(process, 'stdin', {
      value: dummyStdin,
      configurable: true,
      writable: true
    });
    console.log('[SYSTEM WORKAROUND] process.stdin successfully redefined to dummy Readable stream.');
  } catch (redefineErr: any) {
    console.error('[SYSTEM WORKAROUND] Failed to redefine process.stdin:', redefineErr);
  }
}

// ESM compatibility wrapper for __dirname and __filename
export const esmFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
export const esmDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(esmFilename);

// --- Environment Loading Diagnostics ---
console.log('[ENV DEBUG] process.cwd():', process.cwd());
console.log('[ENV DEBUG] esmDirname:', esmDirname);
console.log('[ENV DEBUG] esmFilename:', esmFilename);

// Check what env vars exist BEFORE dotenv loads anything
console.log('[ENV DEBUG] GEMINI_API_KEY in process.env BEFORE dotenv:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[ENV DEBUG] FIREBASE_SERVICE_ACCOUNT in process.env BEFORE dotenv:', !!process.env.FIREBASE_SERVICE_ACCOUNT, 'length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);
console.log('[ENV DEBUG] APP_URL in process.env BEFORE dotenv:', !!process.env.APP_URL, 'value:', process.env.APP_URL || '(not set)');

// Try loading .env files from multiple locations
const dotenvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.resolve(esmDirname, '..', '.env'),
  path.resolve(esmDirname, '..', '.env.local'),
  path.resolve(esmDirname, '..', '..', '.env'),
  path.resolve(esmDirname, '..', '..', '.env.local'),
  path.resolve(esmDirname, '.env'),
  path.resolve(esmDirname, '.env.local'),
];

for (const envPath of dotenvPaths) {
  try {
    const exists = fsSync.existsSync(envPath);
    console.log(`[ENV DEBUG] Checking ${envPath} -> exists: ${exists}`);
    if (exists) {
      const result = dotenv.config({ path: envPath });
      console.log(`[ENV DEBUG] Loaded ${envPath}: error=${result.error ? result.error.message : 'none'}, keys=${result.parsed ? Object.keys(result.parsed).length : 0}`);
    }
  } catch (e: any) {
    console.warn(`[ENV DEBUG] Failed to check/load ${envPath}:`, e.message);
  }
}

// Final fallback
dotenv.config();

// --- Environment Variable Validation ---
console.log('[ENV DEBUG] GEMINI_API_KEY in process.env AFTER dotenv:', !!process.env.GEMINI_API_KEY, 'length:', process.env.GEMINI_API_KEY?.length || 0);
console.log('[ENV DEBUG] FIREBASE_SERVICE_ACCOUNT in process.env AFTER dotenv:', !!process.env.FIREBASE_SERVICE_ACCOUNT, 'length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);
console.log('[ENV DEBUG] APP_URL in process.env AFTER dotenv:', !!process.env.APP_URL, 'value:', process.env.APP_URL || '(not set)');

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'APP_URL',
  'FIREBASE_SERVICE_ACCOUNT'
];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) {
    console.warn(`[Warning] Environment variable ${v} is not set in the deployment environment!`);
  }
});

export const PORT = parseInt(process.env.PORT || '3000', 10);
export const APP_URL = process.env.APP_URL || 'http://localhost:5173';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
