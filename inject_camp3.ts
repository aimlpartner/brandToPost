import fs from 'fs';
let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Replace the problematic line 1498 (it's exactly this string)
content = content.replace(
  "(pv.imageUrl || pv.imageId || (typeof dp !== 'undefined' && dp.visualType) || (pv as any).visualType)",
  "(pv.imageUrl || pv.imageId || (pv as any).visualType)"
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
