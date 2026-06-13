import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// 1. Add VisualEngine import
if (!content.includes("import { VisualEngine }")) {
  content = content.replace("import { ImageLightbox }", "import { VisualEngine } from '../components/VisualEngine';\nimport { ImageLightbox }");
}

// 2. Replace the image rendering in Daily Posts (around line 1378-1380)
const replaceDailyImage = `) : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]) || dp.visualType) ? (
  <VisualEngine 
    visualType={dp.visualType} 
    visualData={dp.visualData} 
    imageUrl={pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined)} 
    dna={activeProduct!} 
    fallbackText={pv.copy.substring(0, 50) + "..."}
  />
) : null}`;

content = content.replace(
  /\) : \(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\)\) \? \(\s*<ImageLoader.*? \/>\s*\) : null\}/,
  replaceDailyImage
);

// Do it again for the second occurrence (if there is one in non-daily posts)
// We look for pv.visualType, but platformVersions usually don't have it unless set. We can fallback to pv.visualType.
const replacePVImage = `) : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]) || (pv as any).visualType) ? (
  <VisualEngine 
    visualType={(pv as any).visualType} 
    visualData={(pv as any).visualData} 
    imageUrl={pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined)} 
    dna={activeProduct!} 
    fallbackText={pv.copy.substring(0, 50) + "..."}
  />
) : null}`;

content = content.replace(
  /\) : \(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\)\) \? \(\s*<ImageLoader.*? \/>\s*\) : null\}/,
  replacePVImage
);

// We need to also patch the condition `(pv.imageUrl || pv.imageId)` to `(pv.imageUrl || pv.imageId || dp.visualType)`
content = content.replace(/\{\(pv\.imageUrl \|\| pv\.imageId\) && \(\s*<div/g, "{(pv.imageUrl || pv.imageId || (dp && dp.visualType) || (pv as any).visualType) && (\n                        <div");


fs.writeFileSync('src/pages/Campaigns.tsx', content);
