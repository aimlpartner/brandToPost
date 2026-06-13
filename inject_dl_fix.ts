import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Hide the generic background-only download button if the content relies on HTML/CSS Visuals
content = content.replace(
  /\{\(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\)\)\) && \(/g,
  "{(!dp?.visualType && !(pv as any)?.visualType && (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]))) && ("
);

// We need to also catch the exact one used in line 1361 and 1498 (it is exactly `{(pv.imageUrl || (pv.imageId && campaignImages[pv.imageId])) && (`)
content = content.replace(
  /\{\(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\)\)\) && \(/g,
  "{(!dp?.visualType && !(pv as any)?.visualType && (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]))) && ("
);


fs.writeFileSync('src/pages/Campaigns.tsx', content);
