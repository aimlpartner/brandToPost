import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function check() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT");
    return;
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  const db = getFirestore(admin.apps[0], 'productiondb');
  
  console.log("Checking products collection...");
  const snap = await db.collection('products').get();
  console.log(`Found ${snap.docs.length} products:`);
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  automationAgentEnabled: ${data.automationAgentEnabled}`);
    console.log(`  automateDailyPosts: ${data.automateDailyPosts}`);
    console.log(`  automateDailyBlogs: ${data.automateDailyBlogs}`);
    console.log(`  automateWeeklyCampaigns: ${data.automateWeeklyCampaigns}`);
    console.log(`  automationTimeUtc: ${data.automationTimeUtc}`);
    console.log(`  automationWeeklyDay: ${data.automationWeeklyDay}`);
  });
}

check().catch(console.error);
