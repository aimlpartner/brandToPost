import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'map-api-459818-firebase-adminsdk-fbsvc-142bd5a810.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account JSON file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function runTest() {
  const testUserId = 'test_user_onboarding_' + Date.now();
  const testProductId = 'test_product_' + Date.now();
  const testCampaignId = 'test_campaign_' + Date.now();

  console.log(`[TEST] Starting onboarding data verification for User: ${testUserId}`);

  try {
    // 1. Simulate AuthContext completeOnboarding user profile write
    const userRef = db.collection('users').doc(testUserId);
    const profileData = {
      name: 'Test Jane Doe',
      role: 'Founder',
      onboarded: true,
      createdAt: new Date().toISOString()
    };
    await userRef.set(profileData);
    console.log('[x] Successfully wrote simulated user profile to users collection');

    // 2. Simulate AuthContext completeOnboarding product write
    const productRef = db.collection('products').doc(testProductId);
    const productData = {
      id: testProductId,
      name: 'Test Brand DNA Product',
      website: 'www.testbranddna.com',
      description: 'AI testing framework for branding automation',
      positioning: 'The ultimate sandbox for branding automation strategies',
      audience: 'Product managers and AI verification agents',
      tone: 'Sleek, bold, precise, professional',
      stage: 'beta',
      visualStyle: 'dark-neon',
      userId: testUserId
    };
    await productRef.set(productData);
    console.log('[x] Successfully wrote simulated product to products collection');

    // 3. Simulate Onboarding.tsx campaign write
    const campaignRef = db.collection('campaigns').doc(testCampaignId);
    const campaignData = {
      id: testCampaignId,
      productId: testProductId,
      userId: testUserId,
      theme: 'Testing Onboarding Flows Automations',
      coreMessage: 'Testing the end to end pipeline of onboarding writes.',
      createdAt: new Date().toISOString(),
      dailyPosts: [
        {
          day: 'Day 1',
          contentType: 'educational',
          overlayText: 'Verify your pipelines early and often.',
          platformVersions: [
            {
              platform: 'LinkedIn',
              copy: 'Here is a test LinkedIn copy for Day 1. End-to-end verification is crucial for user flows.'
            },
            {
              platform: 'X',
              copy: 'Verify your pipelines early. End-to-end testing is key. #onboarding #automation'
            }
          ]
        }
      ]
    };
    await campaignRef.set(campaignData);
    console.log('[x] Successfully wrote simulated campaign to campaigns collection');

    // Verification queries
    console.log('\n--- VERIFYING Firestore schema and persistence ---');

    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('User document was not saved');
    const savedUser = userSnap.data();
    console.log(`User verification: Name = "${savedUser.name}", Onboarded = ${savedUser.onboarded}`);
    if (savedUser.name !== profileData.name || savedUser.onboarded !== true) {
      throw new Error('User profile data mismatch');
    }

    const productSnap = await productRef.get();
    if (!productSnap.exists) throw new Error('Product document was not saved');
    const savedProduct = productSnap.data();
    console.log(`Product verification: Name = "${savedProduct.name}", Website = "${savedProduct.website}"`);
    if (savedProduct.name !== productData.name || savedProduct.userId !== testUserId) {
      throw new Error('Product data mismatch');
    }

    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) throw new Error('Campaign document was not saved');
    const savedCampaign = campaignSnap.data();
    console.log(`Campaign verification: Theme = "${savedCampaign.theme}", DailyPosts count = ${savedCampaign.dailyPosts?.length}`);
    if (savedCampaign.theme !== campaignData.theme || savedCampaign.productId !== testProductId) {
      throw new Error('Campaign data mismatch');
    }

    console.log('\n[SUCCESS] Onboarding Firestore persistence verification passed successfully!\n');

  } catch (err) {
    console.error('\n[FAILURE] Verification failed:', err);
    process.exitCode = 1;
  } finally {
    // Clean up
    console.log('--- Cleaning up test documents ---');
    try {
      await db.collection('users').doc(testUserId).delete();
      await db.collection('products').doc(testProductId).delete();
      await db.collection('campaigns').doc(testCampaignId).delete();
      console.log('[x] Cleaned up user, product, and campaign test documents.');
    } catch (cleanErr) {
      console.error('Failed to clean up test documents:', cleanErr);
    }
    process.exit(process.exitCode || 0);
  }
}

runTest();
