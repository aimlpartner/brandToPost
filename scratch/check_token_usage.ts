import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkTokenUsage() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching recent token_usage entries for puppeteer_overlay_render...");
  const snapshot = await db.collection('token_usage')
    .where('operationType', '==', 'puppeteer_overlay_render')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();
    
  if (snapshot.empty) {
    console.log("No token usage records found for puppeteer_overlay_render.");
    return;
  }
  
  console.log(`Found ${snapshot.size} recent records:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const ts = data.timestamp ? data.timestamp.toDate().toISOString() : '';
    console.log(`[${ts}] User: ${data.userId} Model: ${data.model} Tokens: ${data.totalTokenCount}`);
  });
}

checkTokenUsage().catch(console.error);
