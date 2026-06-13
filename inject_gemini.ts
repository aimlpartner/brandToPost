import fs from 'fs';

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

// 1. Replace the Schema definition for dailyPosts
const schemaReplacement = `          visualType: { type: Type.STRING, description: "Must be one of: 'creative-story', 'data-infographic', 'powerful-quote', 'abstract-announcement'" },
          visualData: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Short, punchy primary text" },
              subtext: { type: Type.STRING, description: "Secondary text or apology body" },
              cinematicPrompt: { type: Type.STRING, description: "Image prompt. ONLY if creative-story/abstract-announcement. MUST include 'off-center, negative space on the left' if human, OR 'abstract gradient, glassmorphism' if announcement." },
              stats: {
                type: Type.ARRAY,
                description: "Array of stats if data-infographic is used",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["label", "value"]
                }
              }
            }
          },
          platformVersions: {`;

// Replace `imagePrompt` and `overlayText` schema definitions with our new ones
content = content.replace(
  /imagePrompt: \{ type: Type\.STRING, description: "Prompt for AI image generation for this day" \},\s*overlayText: \{ type: Type\.STRING, description: "Short punchy hook text to overlay on custom creatives" \},\s*platformVersions: \{/,
  `imagePrompt: { type: Type.STRING, description: "Prompt for AI image generation for this day" },\n          overlayText: { type: Type.STRING, description: "Short punchy hook text to overlay on custom creatives" },\n${schemaReplacement}`
);

// 2. Replace instructions in generateCampaign prompt
const newPromptInstructions1 = `    \${generateImages ? \`- For EACH DAY (not for each platform), determine a 'visualType' ('creative-story', 'data-infographic', 'powerful-quote', or 'abstract-announcement'). Provide a 'visualData' object with 'headline'. If 'data-infographic', provide 'stats' array. If 'creative-story' or 'abstract-announcement', provide 'cinematicPrompt' with strict rules: if human, must say 'Cinematic editorial photography, subject far right, vast negative space on left'. No text instructions in image prompt.\` : ""}
    \${useCreatives ? \`- For EACH DAY, provide an 'overlayText' field (max 10 words). This will be overlaid onto the brand's custom creatives.\` : ""}
`;

content = content.replace(
  /\$\{generateImages \? `- For EACH DAY.*?\}` : ""\}\n\s*\$\{useCreatives \? `- For EACH DAY.*?` : ""\}/s,
  newPromptInstructions1
);


// 3. Update the dailyPosts generation logic
// Find where generateImage is called inside process in batches. Around line 956:
const imageLogicReplacer = `    // Generate images for daily posts
    if (campaign.dailyPosts) {
      campaign.dailyPosts.forEach((dp: any) => {
        if (generateImages && dp.visualType && dp.visualData?.cinematicPrompt) {
          imageTasks.push(async () => {
            // Use cinematicPrompt
            await generateImage(dp.visualData.cinematicPrompt, dp, \`daily post \${dp.day}\`);
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => { pv.imageUrl = dp.imageUrl; });
            }
          });
        } else if (useCreatives && dp.overlayText) {
          imageTasks.push(async () => {
            await processCustomCreative(dp.overlayText, dp, \`daily post \${dp.day}\`);
            if (dp.imageUrl && dp.platformVersions) {
              dp.platformVersions.forEach((pv: any) => { pv.imageUrl = dp.imageUrl; });
            }
          });
        }
      });
    }`;

content = content.replace(
  /\/\/ Generate images for daily posts\s*if \(campaign\.dailyPosts\) \{[\s\S]*?\}\s*\n\s*\/\/ Process in batches/,
  imageLogicReplacer + "\n\n    // Process in batches"
);

fs.writeFileSync('src/services/geminiService.ts', content);
