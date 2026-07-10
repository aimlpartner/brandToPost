import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

async function fixOnboardedUsers() {
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
  const productsSnap = await db.collection('products').get();
  const onboardedUserIds = new Set<string>();
  productsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.userId) {
      onboardedUserIds.add(data.userId);
    }
  });
  console.log(`Found ${onboardedUserIds.size} unique user IDs with associated products.`);
  
  console.log("Fetching all users...");
  const usersSnap = await db.collection('users').get();
  
  let updatedCount = 0;
  for (const doc of usersSnap.docs) {
    const userId = doc.id;
    const data = doc.data();
    
    const needsUid = !data.uid;
    const shouldBeOnboarded = onboardedUserIds.has(userId) && !data.onboarded;
    
    if (needsUid || shouldBeOnboarded) {
      console.log(`Fixing User ${userId} (${data.email || 'no-email'}):`);
      const updateData: any = {};
      if (needsUid) {
        updateData.uid = userId;
        console.log(`  - Adding uid: ${userId}`);
      }
      if (shouldBeOnboarded) {
        updateData.onboarded = true;
        console.log(`  - Setting onboarded: true (has product)`);
      }
      
      await db.collection('users').doc(userId).update(updateData);
      updatedCount++;
    }
  }
  
  console.log(`Finished! Updated ${updatedCount} user documents.`);
}

fixOnboardedUsers().catch(console.error);
