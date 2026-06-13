import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Fix the condition guarding the VisualEngine wrap in Campaigns.tsx dailyPosts loop!
content = content.replace(
  /\{\(pv\.imageUrl \|\| pv\.imageId \|\| \(false\) \|\| \(pv as any\)\.visualType\) && \(/,
  "{(pv.imageUrl || pv.imageId || dp.visualType) && ("
);
content = content.replace(
  /\{\(pv\.imageUrl \|\| pv\.imageId \|\| \(pv as any\)\.visualType\) && \(/,
  "{(pv.imageUrl || pv.imageId || dp.visualType) && ("
);

content = content.replace(
  /\) \? \(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\) \|\| dp\.visualType\) \? \(/,
  ") : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]) || dp.visualType) ? ("
);

content = content.replace(
  /\) : \(pv\.imageUrl \|\| \(pv\.imageId && campaignImages\[pv\.imageId\]\) \|\| \(pv as any\)\.visualType\) \? \(/,
  ") : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]) || (pv as any).visualType) ? ("
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
