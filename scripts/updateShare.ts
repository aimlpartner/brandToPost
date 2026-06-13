import fs from 'fs';

let content = fs.readFileSync('src/pages/SharedCampaign.tsx', 'utf-8');

content = content.replace(
  /imageUrl=\{pv\.imageId \? images\[pv\.imageId\] : undefined\}\n\s*visualType=\{\(pv as any\)\.visualType \|\| dp\.visualType\}/,
  'imageUrl={(pv.imageId && images[pv.imageId]) || ((dp as any).imageId && images[(dp as any).imageId]) || undefined}\n   visualType={(pv as any).visualType || dp.visualType}'
);

content = content.replace(
  /generatedVisuals\[\`daily-\$\{idx\}-\$\{pIdx\}\`\] \|\| images\[pv\.imageId\!\]/g,
  'generatedVisuals[`daily-${idx}-${pIdx}`] || (pv.imageId && images[pv.imageId]) || ((dp as any).imageId && images[(dp as any).imageId]) || \'\''
);

content = content.replace(
  /\{\(\(pv\.imageId \&\& images\[pv\.imageId\]\) \|\| generatedVisuals\[\`daily-\$\{idx\}-\$\{pIdx\}\`\]\) \&\& \(/g,
  '{(((pv.imageId && images[pv.imageId]) || ((dp as any).imageId && images[(dp as any).imageId])) || generatedVisuals[`daily-${idx}-${pIdx}`]) && ('
);

fs.writeFileSync('src/pages/SharedCampaign.tsx', content);
