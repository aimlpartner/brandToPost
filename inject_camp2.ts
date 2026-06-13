import fs from 'fs';
let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(/\(dp && dp\.visualType\)/g, "(typeof dp !== 'undefined' && dp.visualType)");

fs.writeFileSync('src/pages/Campaigns.tsx', content);
