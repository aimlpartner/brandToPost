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
  
  console.log("Checking token_usage collection...");
  const tokenSnapshot = await db.collection('token_usage').orderBy('timestamp', 'desc').limit(5).get();
  console.log(`Found ${tokenSnapshot.docs.length} recent token usage documents:`);
  tokenSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Operation: ${data.operationType}, Model: ${data.model}, Timestamp: ${data.timestamp}, TotalTokens: ${data.totalTokenCount}`);
  });
  
  console.log("\nChecking recent campaigns...");
  const campaignsSnapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(2).get();
  console.log(`Found ${campaignsSnapshot.docs.length} campaigns:`);
  campaignsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Campaign ID: ${doc.id}, Theme: ${data.theme}, isBlog: ${data.isBlog}, blogImageUrl: ${data.blogImageUrl}`);
  });

  console.log("\nChecking daily_blog_image_error logs...");
  const imageErrorSnapshot = await db.collection('error_logs').where('type', '==', 'daily_blog_image_error').get();
  console.log(`Found ${imageErrorSnapshot.docs.length} daily_blog_image_error logs:`);
  imageErrorSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}, Error: ${data.error}, Timestamp: ${data.timestamp}`);
  });
}

check().catch(console.error);
