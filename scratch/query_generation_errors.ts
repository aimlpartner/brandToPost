import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function check() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching recent generation_logs records from Firestore...");
  const snapshot = await db.collection('generation_logs')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();
    
  if (snapshot.empty) {
    console.log("No logs found in generation_logs.");
    return;
  }

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`[${data.timestamp?.toDate().toISOString() || 'no-date'}] User: ${data.userEmail} | Sec: ${data.section} | Lvl: ${data.level}`);
    console.log(`Msg: ${data.message}`);
    if (data.details) {
      console.log(`Details: ${data.details.substring(0, 300)}...`);
    }
    console.log("-----------------------------------------");
  });
}

check().catch(console.error);
