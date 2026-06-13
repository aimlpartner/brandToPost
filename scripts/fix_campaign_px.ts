import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Title section
content = content.replace(
  /<div className="border-b border-\[\#7C3AED\]\/20 pb-4 sm:pb-6">/g,
  '<div className="border-b border-[#7C3AED]/20 pb-4 sm:pb-6 px-4 sm:px-0 pt-4 sm:pt-0">'
);

// Summary wrapper
content = content.replace(
  /<div className="bg-\[\#1C1C22\]\/50 border border-\[\#2583EB\]\/30 rounded-xl p-4 sm:p-6 shadow-\[0_0_15px_rgba\(37,131,235,0.1\)\] mb-6">/g,
  '<div className="bg-[#1C1C22]/50 border-y sm:border border-[#2583EB]/30 sm:rounded-xl p-4 sm:p-6 shadow-[0_0_15px_rgba(37,131,235,0.1)] mb-6">'
);

// Campaign Inputs and Campaign Tags
content = content.replace(
  /<div className="glass-card bg-\[\#0A0A0F\]\/80\/50 border-\[\#7C3AED\]\/20\/50 p-3 sm:p-5">/g,
  '<div className="glass-card bg-[#0A0A0F]/80/50 border-[#7C3AED]/20/50 p-4 sm:p-5 !rounded-none sm:!rounded-xl border-x-0 sm:border-x">'
);

content = content.replace(
  /<div className="glass-card bg-\[\#1C1C22\]\/50 border-\[\#7C3AED\]\/20 border-\[\#7C3AED\]\/20\/50 p-3 sm:p-5">/g,
  '<div className="glass-card bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#7C3AED]/20/50 p-4 sm:p-5 !rounded-none sm:!rounded-xl border-x-0 sm:border-x">'
);

content = content.replace(
  /<div className="flex items-center gap-2 mb-6">/g,
  '<div className="flex items-center gap-2 mb-6 px-4 sm:px-0">'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
