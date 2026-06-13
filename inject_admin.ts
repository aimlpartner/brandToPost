import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const updatedPricing = `const PRICING = {
  'gemini-3.1-pro-preview': { prompt: 1.25, candidate: 5.00 }, // Under 128k tokens
  'gemini-2.5-flash': { prompt: 0.075, candidate: 0.30 }, // Under 128k tokens
  'gemini-2.5-flash-preview': { prompt: 0.075, candidate: 0.30 },
  'gemini-3.1-flash-preview': { prompt: 0.075, candidate: 0.30 },
  'gemini-3.1-flash-image-preview': { prompt: 0, candidate: 0, perImage: 0.03 } // $0.03 per image
};`;

content = content.replace(/const PRICING = \{[\s\S]*?\};/, updatedPricing);


const updatedStatsLogic = `
  let totalTokens = 0;
  let totalImages = 0;
  let totalEstimatedCostUSD = 0;
  
  const operationStats: Record<string, number> = {};
  const operationCosts: Record<string, number> = {};
  const operationCounts: Record<string, number> = {};
  const modelStats: Record<string, number> = {};
  const timelineData: Record<string, { date: string, tokens: number, cost: number }> = {};

  logs.forEach(log => {
    if (log.model === 'gemini-3.1-flash-image-preview') {
      totalImages += log.totalTokenCount; // We logged 1 token = 1 image
    } else {
      totalTokens += log.totalTokenCount;
    }
    
    // Calculate cost
    let cost = 0;
    const rates = PRICING[log.model as keyof typeof PRICING] as any;
    if (rates) {
      if (log.model === 'gemini-3.1-flash-image-preview' && rates.perImage) {
        cost = log.totalTokenCount * rates.perImage;
      } else {
        cost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
      }
    }
    totalEstimatedCostUSD += cost;

    // Operation stats
    const statValue = log.model === 'gemini-3.1-flash-image-preview' ? log.totalTokenCount : log.totalTokenCount;
    operationStats[log.operationType] = (operationStats[log.operationType] || 0) + statValue;
    operationCosts[log.operationType] = (operationCosts[log.operationType] || 0) + cost;
    operationCounts[log.operationType] = (operationCounts[log.operationType] || 0) + 1;
    
    // Model stats
    modelStats[log.model] = (modelStats[log.model] || 0) + cost;

    // Timeline stats (group by day)
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!timelineData[date]) {
      timelineData[date] = { date, tokens: 0, cost: 0 };
    }
    if (log.model !== 'gemini-3.1-flash-image-preview') {
      timelineData[date].tokens += log.totalTokenCount;
    }
    timelineData[date].cost += cost;
  });

  const costBreakdownData = Object.entries(operationCosts).map(([name, cost]) => ({
    name,
    totalCost: cost,
    averageCost: cost / (operationCounts[name] || 1),
    count: operationCounts[name]
  })).sort((a, b) => b.totalCost - a.totalCost);

  const totalEstimatedCostINR = totalEstimatedCostUSD * USD_TO_INR;`;

content = content.replace(
  /let totalTokens = 0;[\s\S]*?cost = totalEstimatedCostUSD \* USD_TO_INR;/m,
  updatedStatsLogic
);
content = content.replace(
  /let totalTokens = 0;[\s\S]*?totalEstimatedCostINR = totalEstimatedCostUSD \* USD_TO_INR;/m,
  updatedStatsLogic
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
