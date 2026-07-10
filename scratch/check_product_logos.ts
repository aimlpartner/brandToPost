import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function checkProductLogos() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  const app = admin.apps.length === 0 
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;
    
  const db = getFirestore(app, 'productiondb');
  
  console.log("Fetching products from Firestore...");
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
    console.log(`  logoUrl: ${data.logoUrl || 'not set'}`);
    console.log(`  logoDarkUrl: ${data.logoDarkUrl || 'not set'}`);
    console.log(`  logoLightUrl: ${data.logoLightUrl || 'not set'}`);
  });
}

checkProductLogos().catch(console.error);
