import fs from 'fs';

let lines = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8').split('\n');

lines[1509] = lines[1509].replace('dp.visualType', '(pv as any).visualType');

fs.writeFileSync('src/pages/Campaigns.tsx', lines.join('\n'));
