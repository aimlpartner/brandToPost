import fs from 'fs';

// 1. Update geminiService.ts to guarantee image generation if the template requires it!
let gemini = fs.readFileSync('src/services/geminiService.ts', 'utf8');

gemini = gemini.replace(
  /if \(generateImages && dp\.visualType && dp\.visualData\?\.cinematicPrompt\) \{/,
  "if (generateImages && dp.visualType && ['creative-story', 'abstract-announcement'].includes(dp.visualType)) {"
);

gemini = gemini.replace(
  /await generateImage\(dp\.visualData\.cinematicPrompt, dp, `daily post \$\{dp\.day\}`\);/,
  "const cinematicPrompt = dp.visualData?.cinematicPrompt || dp.imagePrompt || `Cinematic editorial photography representing ${focus}, high quality, vast negative space`;\n            await generateImage(cinematicPrompt, dp, `daily post ${dp.day}`);"
);

fs.writeFileSync('src/services/geminiService.ts', gemini);

// 2. Fix VisualEngine.tsx so we don't accidentally coerce intentional blanks into 'creative-story'
let engine = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

const oldLogic = `  if (!validTypes.includes(safeVisualType)) {
    // LLM hallucinated the string, or it was absent
    if (safeVisualType.includes('quote')) safeVisualType = 'powerful-quote';
    else if (safeVisualType.includes('data') || safeVisualType.includes('info')) safeVisualType = 'data-infographic';
    else if (safeVisualType.includes('abstract') || safeVisualType.includes('announce')) safeVisualType = 'abstract-announcement';
    else safeVisualType = imageUrl ? 'creative-story' : 'powerful-quote';
  }`;

const newLogic = `  if (safeVisualType && !validTypes.includes(safeVisualType)) {
    // LLM hallucinated the string
    if (safeVisualType.includes('quote')) safeVisualType = 'powerful-quote';
    else if (safeVisualType.includes('data') || safeVisualType.includes('info')) safeVisualType = 'data-infographic';
    else if (safeVisualType.includes('abstract') || safeVisualType.includes('announce')) safeVisualType = 'abstract-announcement';
    else safeVisualType = '';
  }`;

engine = engine.replace(oldLogic, newLogic);

// We should also make absolutely SURE that VisualEngine always forces SOME text if it renders a template.
// If the LLM completely omits 'visualData' but visualType is 'powerful-quote', we should use fallbackText.
engine = engine.replace(
  /if \(!safeVisualType || \(\!visualData && imageUrl\)\) \{/,
  "if (!safeVisualType || safeVisualType === 'none') {"
);

fs.writeFileSync('src/components/VisualEngine.tsx', engine);
