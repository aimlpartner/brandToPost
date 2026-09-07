import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import './env'; // Ensure environment variables are loaded first

export function safeParseServiceAccount(raw: string | undefined): any {
  console.log('[Firebase Init Debug] safeParseServiceAccount start. raw exists:', !!raw, 'length:', raw ? raw.length : 0);
  if (!raw) return null;

  console.log('[Firebase Init Debug] Raw string sample (first 100 chars):', JSON.stringify(raw.slice(0, 100)));
  console.log('[Firebase Init Debug] Raw string sample (last 100 chars):', JSON.stringify(raw.slice(-100)));

  let cleaned = raw.trim();
  console.log('[Firebase Init Debug] Trimmed. Starts with:', JSON.stringify(cleaned.slice(0, 5)), 'Ends with:', JSON.stringify(cleaned.slice(-5)));

  // Strip wrapping single or double quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
    console.log('[Firebase Init Debug] Stripped outer double quotes. New length:', cleaned.length);
  } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
    console.log('[Firebase Init Debug] Stripped outer single quotes. New length:', cleaned.length);
  }

  // If there are backslashes, fix escaping issues safely
  console.log('[Firebase Init Debug] Contains backslashes:', cleaned.includes('\\'));
  if (cleaned.includes('\\')) {
    const backslashCount = (cleaned.match(/\\/g) || []).length;
    console.log('[Firebase Init Debug] Found', backslashCount, 'backslashes.');

    cleaned = cleaned.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
    console.log('[Firebase Init Debug] After unescaping braces. Starts with:', JSON.stringify(cleaned.slice(0, 5)), 'Ends with:', JSON.stringify(cleaned.slice(-5)));

    cleaned = cleaned.replace(/\\"/g, '"');
    console.log('[Firebase Init Debug] After unescaping quotes. Starts with:', JSON.stringify(cleaned.slice(0, 30)));
  }

  console.log('[Firebase Init Debug] Attempting JSON.parse. Final cleaned string (first 150 chars):', JSON.stringify(cleaned.slice(0, 150)));

  try {
    const parsed = JSON.parse(cleaned);
    console.log('[Firebase Init Debug] JSON.parse succeeded! Keys present:', Object.keys(parsed));
    if (parsed && typeof parsed.private_key === 'string') {
      const hasBackslashN = parsed.private_key.includes('\\n');
      console.log('[Firebase Init Debug] Private key contains \\n string:', hasBackslashN);
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      console.log('[Firebase Init Debug] Private key normalized. Length:', parsed.private_key.length);
    }
    return parsed;
  } catch (err: any) {
    console.error('[Firebase Init Debug] JSON.parse failed. Error message:', err.message);
    console.error('[Firebase Init Debug] Cleaned string (full):', cleaned);
    throw err;
  }
}

let dbInstance: admin.firestore.Firestore | null = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = safeParseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
    const app = admin.apps.length > 0 ? admin.app() : admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    dbInstance = getFirestore(app, 'productiondb');
    console.log('[Firebase Admin] Initialized successfully with Service Account. Using Firestore for state.');
  } else {
    console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT not found. Initializing with Project ID and attempting Firestore via default credentials.');
    const app = admin.apps.length > 0 ? admin.app() : admin.initializeApp({ projectId: 'map-api-459818' });
    try {
      dbInstance = getFirestore(app, 'productiondb');
      console.log('[Firebase Admin] Connected to default Firestore named database successfully.');
    } catch (dbErr: any) {
      console.warn('[Firebase Admin] Could not connect to default Firestore database on sandbox: ', dbErr.message);
    }
  }
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error);
}

export async function verifyFirestoreConnection(): Promise<void> {
  if (dbInstance) {
    try {
      console.log('[Firebase Admin] Testing Firestore connectivity...');
      await dbInstance.collection('server_schedules').limit(1).get();
      console.log('[Firebase Admin] Firestore connectivity verified successfully.');
    } catch (e: any) {
      console.warn('[Firebase Admin] Firestore connection test failed. Falling back to local in-memory state. Error:', e.message);
      dbInstance = null;
    }
  }
}

export { admin };
export { dbInstance as db };
export function getDb(): admin.firestore.Firestore | null {
  return dbInstance;
}
export function setDb(val: admin.firestore.Firestore | null) {
  dbInstance = val;
}
