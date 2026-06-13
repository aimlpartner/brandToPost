import fs from 'fs';
let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(/typeof dp !== 'undefined' && dp\.visualType/g, "false");

fs.writeFileSync('src/pages/Campaigns.tsx', content);
