import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkDefaultDb() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  // Initialize Firestore connecting to the (default) database
  const db = getFirestore(app);
  
  console.log("Fetching users from (default) Firestore database...");
  const snapshot = await db.collection('users').get();
  
  if (snapshot.empty) {
    console.log("No users found in (default) database.");
    return;
  }
  
  console.log(`Found ${snapshot.size} users in (default) database:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`User ID: ${doc.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Onboarded: ${data.onboarded}`);
  });
}

checkDefaultDb().catch(console.error);
