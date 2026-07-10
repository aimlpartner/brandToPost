import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkUsers() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching users from Firestore...");
  const snapshot = await db.collection('users').get();
  
  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }
  
  console.log(`Found ${snapshot.size} users:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`User ID: ${doc.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Onboarded: ${data.onboarded}`);
  });
}

checkUsers().catch(console.error);
