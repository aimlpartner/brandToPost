import fs from 'fs';

let content = fs.readFileSync('src/pages/SharedCampaign.tsx', 'utf8');

// Instance 1
content = content.replace(
  /imageUrl=\{\(pv\.imageId && images\[pv\.imageId\]\) \|\| \(\(dp as any\)\.imageId && images\[\(dp as any\)\.imageId\]\) \|\| undefined\}/g,
  'imageUrl={generatedVisuals[`daily-${idx}-${pIdx}`] || (pv.imageId && images[pv.imageId]) || ((dp as any).imageId && images[(dp as any).imageId]) || undefined}'
);
content = content.replace(
  /onImageGenerated=\{\(url\) => handleSetGeneratedVisual\(`daily-\$\{idx\}-\$\{pIdx\}`\, url\)\}/g,
  'onImageGenerated={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}\n   onUpdateVisual={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}'
);

// Instance 2
content = content.replace(
  /imageUrl=\{pv\.imageId \? images\[pv\.imageId\] : undefined\}/g,
  'imageUrl={generatedVisuals[`platform-${idx}`] || (pv.imageId ? images[pv.imageId] : undefined)}'
);
content = content.replace(
  /onImageGenerated=\{\(url\) => handleSetGeneratedVisual\(`platform-\$\{idx\}`\, url\)\}/g,
  'onImageGenerated={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}\n   onUpdateVisual={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}'
);

fs.writeFileSync('src/pages/SharedCampaign.tsx', content);

console.log("SharedCampaign patched");
