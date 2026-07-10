import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkLogs() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching recent warning/error generation_logs...");
  const logsSnapshot = await db.collection('generation_logs')
    .orderBy('timestamp', 'desc')
    .limit(300)
    .get();
    
  if (logsSnapshot.empty) {
    console.log("No logs found in generation_logs.");
    return;
  }
  
  console.log(`Found ${logsSnapshot.size} total logs. Filtering for warnings and errors:`);
  let count = 0;
  logsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const ts = data.timestamp ? data.timestamp.toDate().toISOString() : data.clientTimestamp;
    if (data.level === 'error' || data.level === 'warn' || data.message?.includes('failed') || data.message?.includes('Error')) {
      count++;
      console.log(`[${ts}] [${data.section?.toUpperCase()}] [${data.level?.toUpperCase()}] ${data.message}`);
      if (data.details) {
        console.log(`  Details: ${data.details}`);
      }
    }
  });
  console.log(`Printed ${count} warning/error logs.`);
}

checkLogs().catch(console.error);
