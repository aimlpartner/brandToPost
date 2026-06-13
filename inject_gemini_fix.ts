import fs from 'fs';

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const oldPromptBlock = `    \${generateImages ? \`- For EACH DAY (not for each platform), provide a single 'imagePrompt' at the daily post level. CRITICAL: You must design a "Text-Overlay Engagement Graphic" using this exact 3-layer approach:
      Layer 1 (Background): A high-quality, thematic background relevant to the post, OR a clean gradient/solid color directly matching the Brand Position Visual Style/Mood Board: "\${dna.visualStyle || 'Standard professional'}" \${dna.visualData ? \`and utilizing these specific brand colors: \${dna.visualData.colors.join(', ')}\` : ''}. The background MUST be explicitly described as darkened, color-tinted, or slightly blurred to ensure white text is perfectly legible.
      Layer 2 (Typography): A short, punchy hook or discussion prompt (max 10 words) from the post. Describe it as bold, high-contrast white text \${dna.visualData ? \`using the brand's primary font style (\${dna.visualData.fonts.primary})\` : 'sans-serif'}, centered on the screen, using strong font hierarchy (e.g., one key word fully capitalized to draw the eye). Explicitly state the exact text to be rendered in quotes.
      Layer 3 (Branding): Do NOT include a logo in the prompt (we will overlay it programmatically). Just ensure the bottom center of the image has clean space.\` : ""}
    \${useCreatives ? \`- For EACH DAY, provide an 'overlayText' field (max 10 words). This will be overlaid onto the brand's custom creatives. It should be a short, punchy hook or discussion prompt from the post.\` : ""}`;

const newPromptBlock = `    \${generateImages ? \`- For EACH DAY (not for each platform), YOU MUST output 'visualType' (choose ONE: 'creative-story', 'data-infographic', 'powerful-quote', or 'abstract-announcement'). YOU MUST ALSO output a 'visualData' object with a 'headline' string (the main text to render on the image). If 'visualType' is 'data-infographic', provide a 'stats' array. If 'visualType' is 'creative-story' or 'abstract-announcement', provide 'cinematicPrompt' with strict rules: if human, must say 'Cinematic editorial photography, subject far right, vast negative space on left'. Do NOT include text instructions in the image prompt.\` : ""}
    \${useCreatives ? \`- For EACH DAY, provide an 'overlayText' field (max 10 words). This will be overlaid onto the brand's custom creatives.\` : ""}`;

content = content.replace(oldPromptBlock, newPromptBlock);

// Update required schema
content = content.replace(
  'required: ["day", "contentType", "platformVersions"]',
  'required: ["day", "contentType", "platformVersions", "visualType", "visualData"]'
);

fs.writeFileSync('src/services/geminiService.ts', content);
