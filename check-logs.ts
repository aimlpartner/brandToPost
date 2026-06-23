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
  
  console.log("Fetching token_usage records from Firestore...");
  const tokenSnapshot = await db.collection('token_usage').orderBy('timestamp', 'desc').limit(100).get();
  
  const summary: Record<string, {
    model: string;
    count: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }> = {};

  tokenSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const key = `${data.operationType} (${data.model})`;
    if (!summary[key]) {
      summary[key] = {
        model: data.model || '',
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0
      };
    }
    
    const s = summary[key];
    s.count += 1;
    
    const input = data.promptTokenCount || 0;
    const output = data.candidatesTokenCount || 0;
    
    s.inputTokens += input;
    s.outputTokens += output;
    
    // Calculate cost based on model
    const m = (data.model || '').toLowerCase();
    if (m.includes('pro')) {
      s.costUsd += (input * 0.00000125) + (output * 0.000005);
    } else if (m.includes('image') || m.includes('imagen')) {
      s.costUsd += 0.03; // $0.03 per image generated
    } else if (m.includes('flash')) {
      s.costUsd += (input * 0.000000075) + (output * 0.0000003);
    } else {
      // Default to Pro-tier pricing if unknown
      s.costUsd += (input * 0.00000125) + (output * 0.000005);
    }
  });

  console.log("\n================================== TOKEN USAGE & COST SUMMARY ==================================");
  console.log(String("Operation (Model)").padEnd(45) + " | Runs | Input Tokens | Output Tokens | Cost (USD) | Cost (INR)");
  console.log("------------------------------------------------------------------------------------------------");
  
  let totalCostUsd = 0;
  for (const [opName, stats] of Object.entries(summary)) {
    const costInr = stats.costUsd * 84;
    totalCostUsd += stats.costUsd;
    console.log(
      opName.padEnd(45) + " | " +
      String(stats.count).padStart(4) + " | " +
      String(stats.inputTokens).padStart(12) + " | " +
      String(stats.outputTokens).padStart(13) + " | " +
      `$${stats.costUsd.toFixed(4)}`.padStart(10) + " | " +
      `₹${costInr.toFixed(2)}`.padStart(10)
    );
  }
  console.log("------------------------------------------------------------------------------------------------");
  console.log(`TOTAL COST FOR THE LAST 100 API CALLS: $${totalCostUsd.toFixed(4)} USD (~₹${(totalCostUsd * 84).toFixed(2)} INR)`);
  console.log("================================================================================================\n");

  console.log("Checking recent campaigns to calculate the typical single campaign cost...");
  const campaignsSnapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(1).get();
  if (campaignsSnapshot.empty) {
    console.log("No campaigns found.");
    return;
  }
  
  const latestCamp = campaignsSnapshot.docs[0].data();
  console.log(`Latest Campaign ID: ${latestCamp.id}`);
  console.log(`Theme: ${latestCamp.theme}`);
  console.log(`Created At: ${latestCamp.createdAt}`);

  // Fetch token usage for this specific campaign
  const campId = latestCamp.id;
  const campTokensSnap = await db.collection('token_usage')
    .where('userId', '==', latestCamp.userId)
    .get();
    
  console.log(`\nFiltered logs for User ID: ${latestCamp.userId}`);
  
  // Group by timestamp within 10 minutes of campaign creation to estimate its specific cost
  const campCreatedAtTime = new Date(latestCamp.createdAt).getTime();
  let campCostUsd = 0;
  console.log("\nEstimated API calls made during this campaign's generation:");
  
  campTokensSnap.docs.forEach(doc => {
    const data = doc.data();
    const time = new Date(data.timestamp).getTime();
    // If it's within 15 minutes of the campaign creation
    if (Math.abs(time - campCreatedAtTime) < 15 * 60 * 1000) {
      const input = data.promptTokenCount || 0;
      const output = data.candidatesTokenCount || 0;
      let cost = 0;
      const m = (data.model || '').toLowerCase();
      if (m.includes('pro')) {
        cost = (input * 0.00000125) + (output * 0.000005);
      } else if (m.includes('image') || m.includes('imagen')) {
        cost = 0.03;
      } else if (m.includes('flash')) {
        cost = (input * 0.000000075) + (output * 0.0000003);
      }
      
      campCostUsd += cost;
      console.log(`- ${data.operationType} (${data.model}): Input=${input}, Output=${output}, Cost=$${cost.toFixed(4)} (~₹${(cost * 84).toFixed(2)})`);
    }
  });
  
  console.log(`\nESTIMATED TOTAL COST OF GENERATING THIS CAMPAIGN: $${campCostUsd.toFixed(4)} USD (~₹${(campCostUsd * 84).toFixed(2)} INR)`);
}

check().catch(console.error);
