import * as fs from 'fs';

let content = fs.readFileSync('src/pages/SharedCampaign.tsx', 'utf8');

content = content.replace(
  /\{\(\(\(pv\.imageId && images\[pv\.imageId\]\) \|\| \(\(dp as any\)\.imageId && images\[\(dp as any\)\.imageId\]\)\) \|\| generatedVisuals\[`daily-\$\{idx\}-\$\{pIdx\}`\]\) && \(/g,
  '{((((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || ((dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]))) || generatedVisuals[`daily-${idx}-${pIdx}`]) && ('
);

content = content.replace(
  /onClick=\{\(\) => handleDownloadImage\(generatedVisuals\[`daily-\$\{idx\}-\$\{pIdx\}`\] \|\| \(pv\.imageId && images\[pv\.imageId\]\) \|\| \(\(dp as any\)\.imageId && images\[\(dp as any\)\.imageId\]\) \|\| '', `\$\{campaign\.theme\.replace\(\/\[\^a-z0-9\]\/gi, '_'\)\.toLowerCase\(\)\}_\$\{pv\.platform\}\.png`\)\}/g,
  'onClick={() => handleDownloadImage(generatedVisuals[`daily-${idx}-${pIdx}`] || (pv as any).imageUrl || (pv.imageId && images[pv.imageId]) || (dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]) || \'\', `${campaign.theme.replace(/[^a-z0-9]/gi, \'_\').toLowerCase()}_${pv.platform}.png`)}'
);

content = content.replace(
  /\{\(\(pv\.imageId && images\[pv\.imageId\]\) \|\| generatedVisuals\[`platform-\$\{idx\}`\]\) && \(/g,
  '{(((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || generatedVisuals[`platform-${idx}`]) && ('
);

content = content.replace(
  /onClick=\{\(\) => handleDownloadImage\(generatedVisuals\[`platform-\$\{idx\}`\] \|\| images\[pv\.imageId!\]/g,
  'onClick={() => handleDownloadImage(generatedVisuals[`platform-${idx}`] || (pv as any).imageUrl || images[pv.imageId!]'
);

content = content.replace(
  /imageUrl=\{generatedVisuals\[`platform-\$\{idx\}`\] \|\| \(pv\.imageId \? images\[pv\.imageId\] : undefined\)\}/g,
  'imageUrl={generatedVisuals[`platform-${idx}`] || (pv as any).imageUrl || (pv.imageId ? images[pv.imageId] : undefined)}'
);

fs.writeFileSync('src/pages/SharedCampaign.tsx', content);
