import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  /        <\/div>\n      \) \: \(\n        <div className="h-full flex flex-col items-center justify-center text-gray-300">/g,
  '          <div className="h-[80px] md:hidden shrink-0" />\n        </div>\n      ) : (\n        <div className="h-full flex flex-col items-center justify-center text-gray-300 pb-[80px] md:pb-0">'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);

// Also let's check Sidebar list just in case.
// <div className={cn("w-full lg:w-1/3 flex flex-col gap-4 h-full", selectedCampaign ? "hidden lg:flex" : "flex")}>
let content2 = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');
content2 = content2.replace(
  /<div className="flex-1 overflow-y-auto glass-panel divide-y divide-white\/20">/g,
  '<div className="flex-1 overflow-y-auto glass-panel divide-y divide-white/20 pb-[80px] md:pb-0">'
);
fs.writeFileSync('src/pages/Campaigns.tsx', content2);
