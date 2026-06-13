import fs from 'fs';

let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

// Stop overlaying logo in backend if we have visualType (since VisualEngine handles it)
content = content.replace(
  /if \(cachedLogoBase64\) \{\s*finalImage = await overlayLogo\(finalImage, cachedLogoBase64\);\s*\}/g,
  `if (cachedLogoBase64 && !targetObj.visualType) {\n              finalImage = await overlayLogo(finalImage, cachedLogoBase64);\n            }`
);

fs.writeFileSync('src/services/geminiService.ts', content);
