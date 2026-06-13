import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  /<div className="space-y-6 pt-2 pl-4 border-l-2 border-\[\#7C3AED\]\/20 ml-2">/g,
  '<div className="space-y-6 pt-2 sm:pl-4 sm:border-l-2 border-[#7C3AED]/20 sm:ml-2">'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
