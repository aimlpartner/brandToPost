import fs from 'fs';

// 1. Update geminiService.ts
let gService = fs.readFileSync('src/services/geminiService.ts', 'utf8');

gService = gService.replace(
  /visualType: \{ type: Type\.STRING, description: "Must be one of: 'creative-story', 'data-infographic', 'powerful-quote', 'abstract-announcement'" \},/,
  `visualType: { type: Type.STRING, description: "Must be one of: 'creative-story', 'data-infographic', 'powerful-quote', 'abstract-announcement'", enum: ["creative-story", "data-infographic", "powerful-quote", "abstract-announcement"] },`
);

fs.writeFileSync('src/services/geminiService.ts', gService);


// 2. Update VisualEngine.tsx
let vEngine = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const getSafeVisualTypeLogic = `
  // Normalize visualType
  let safeVisualType = visualType ? visualType.toLowerCase() : '';
  const validTypes = ['creative-story', 'data-infographic', 'powerful-quote', 'abstract-announcement'];
  if (safeVisualType && !validTypes.includes(safeVisualType)) {
    // LLM hallucinated the string
    if (safeVisualType.includes('quote')) safeVisualType = 'powerful-quote';
    else if (safeVisualType.includes('data') || safeVisualType.includes('info')) safeVisualType = 'data-infographic';
    else if (safeVisualType.includes('abstract') || safeVisualType.includes('announce')) safeVisualType = 'abstract-announcement';
    else safeVisualType = imageUrl ? 'creative-story' : 'powerful-quote';
  }

  const isDarkTemplate = ['creative-story', 'powerful-quote', 'abstract-announcement'].includes(safeVisualType);
`;

vEngine = vEngine.replace(
  /const isDarkTemplate = \['creative-story', 'powerful-quote', 'abstract-announcement'\]\.includes\(visualType \|\| ''\);/,
  getSafeVisualTypeLogic
);

vEngine = vEngine.replace(
  /if \(\!visualType \|\| \(\!visualData && imageUrl\)\) \{/,
  `if (!safeVisualType || (!visualData && imageUrl)) {`
);

vEngine = vEngine.replace(/visualType === /g, "safeVisualType === ");
vEngine = vEngine.replace(/visualType \|\| ''/g, "safeVisualType");

fs.writeFileSync('src/components/VisualEngine.tsx', vEngine);

