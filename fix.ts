import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Instance 1 & 2
content = content.replace(
  /imageUrl=\{pv\.imageUrl \|\| \(pv\.imageId \? campaignImages\[pv\.imageId\] : undefined\)\}/g,
  'imageUrl={generatedVisuals[publishKey] || pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined)}'
);

// Instance 3
content = content.replace(
  /imageUrl=\{pv\.imageUrl \|\| dp\.imageUrl!\}/g,
  'imageUrl={generatedVisuals[publishKey] || pv.imageUrl || dp.imageUrl!}'
);

// Instance 4
content = content.replace(
  /imageUrl=\{pv\.imageUrl\}/g,
  'imageUrl={generatedVisuals[publishKey] || pv.imageUrl}'
);

content = content.replace(
  /onImageGenerated=\{\(url\) => handleSetGeneratedVisual\(publishKey, url\)\}/g,
  'onImageGenerated={(url) => handleSetGeneratedVisual(publishKey, url)}\n    onUpdateVisual={(url) => handleSetGeneratedVisual(publishKey, url)}'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);

// And SharedCampaign.tsx just in case
if (fs.existsSync('src/pages/SharedCampaign.tsx')) {
  let sharedContent = fs.readFileSync('src/pages/SharedCampaign.tsx', 'utf8');
  sharedContent = sharedContent.replace(
    /onImageGenerated=\{\(url\) => handleSetGeneratedVisual\(publishKey, url\)\}/g,
    'onImageGenerated={(url) => handleSetGeneratedVisual(publishKey, url)}\n    onUpdateVisual={(url) => handleSetGeneratedVisual(publishKey, url)}'
  );
  fs.writeFileSync('src/pages/SharedCampaign.tsx', sharedContent);
}

console.log("Done");
