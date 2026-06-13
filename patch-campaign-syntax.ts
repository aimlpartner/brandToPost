import * as fs from 'fs';
let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');
content = content.replace(/<\/div>\s*\),\s*document\.body\s*\)\}/, '</div>,\n  document.body\n  )}');
fs.writeFileSync('src/pages/Campaigns.tsx', content);
