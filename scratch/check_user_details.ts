import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkUserDetails() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  const userId = "QDAbl0ftyTY4S2rdF7OwNzXqkuE2";
  console.log(`Fetching user document for UID: ${userId}...`);
  const docSnap = await db.collection('users').doc(userId).get();
  
  if (!docSnap.exists) {
    console.log("User not found.");
    return;
  }
  
  const data = docSnap.data()!;
  console.log("User details:");
  Object.keys(data).forEach(key => {
    const val = data[key];
    console.log(`  ${key}: type=${typeof val}, value=${JSON.stringify(val)}`);
  });
}

checkUserDetails().catch(console.error);
