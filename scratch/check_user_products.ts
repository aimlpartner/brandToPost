import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkUserProducts() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching all products...");
  const snapshot = await db.collection('products').get();
  
  if (snapshot.empty) {
    console.log("No products found.");
    return;
  }
  
  console.log(`Found ${snapshot.size} products:`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Product ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  userId: ${data.userId}`);
  });
}

checkUserProducts().catch(console.error);
