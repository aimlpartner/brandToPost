import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  /visualType: \(pv as any\)\.visualType \|\| dp\.visualType,\n\s*visualData: \(pv as any\)\.visualData \|\| dp\.visualData/g,
  "visualType: (pv as any).visualType || (typeof dp !== 'undefined' ? dp.visualType : undefined),\n    visualData: (pv as any).visualData || (typeof dp !== 'undefined' ? dp.visualData : undefined)"
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
