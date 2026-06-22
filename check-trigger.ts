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
  
  console.log("Checking recent campaigns in detail...");
  const campaignsSnapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(5).get();
  for (const doc of campaignsSnapshot.docs) {
    const campaign = doc.data();
    console.log(`Campaign ID: ${doc.id}`);
    console.log(`  Theme: ${campaign.theme}`);
    console.log(`  isBlog: ${campaign.isBlog}`);
    console.log(`  isOneDay: ${campaign.isOneDay}`);
    console.log(`  isAutomated: ${campaign.isAutomated}`);
    console.log(`  productId: ${campaign.productId}`);
    console.log(`  createdAt: ${campaign.createdAt}`);
    
    if (campaign.productId) {
      const productDoc = await db.collection('products').doc(campaign.productId).get();
      if (productDoc.exists) {
        const prod = productDoc.data()!;
        console.log(`  Product Config:`);
        console.log(`    Name: ${prod.name}`);
        console.log(`    automationAgentEnabled: ${prod.automationAgentEnabled} (${typeof prod.automationAgentEnabled})`);
        console.log(`    automateDailyPosts: ${prod.automateDailyPosts} (${typeof prod.automateDailyPosts})`);
        console.log(`    automateDailyBlogs: ${prod.automateDailyBlogs} (${typeof prod.automateDailyBlogs})`);
        console.log(`    automateWeeklyCampaigns: ${prod.automateWeeklyCampaigns} (${typeof prod.automateWeeklyCampaigns})`);
        console.log(`    lastDailyRunDate: ${prod.lastDailyRunDate}`);
      } else {
        console.log(`  Product not found in DB!`);
      }
    }
    console.log("-----------------------------------------");
  }
}

check().catch(console.error);
