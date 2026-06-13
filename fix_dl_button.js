import fs from 'fs';

let lines = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('{(pv.imageUrl || (pv.imageId && campaignImages[pv.imageId])) && (')) {
       // DailyPosts context (around line 1361)
       if (i < 1450) {
           lines[i] = lines[i].replace(
               /\{\(pv.imageUrl \|\| \(pv.imageId && campaignImages\[pv.imageId\]\)\) && \(/,
               '{(!dp?.visualType && (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]))) && ('
           );
       } else { // Standard loop context (around line 1498)
           lines[i] = lines[i].replace(
               /\{\(pv.imageUrl \|\| \(pv.imageId && campaignImages\[pv.imageId\]\)\) && \(/,
               '{(!(pv as any)?.visualType && (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId]))) && ('
           );
       }
   }
}

fs.writeFileSync('src/pages/Campaigns.tsx', lines.join('\n'));
