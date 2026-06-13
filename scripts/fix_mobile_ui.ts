import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  /<div key=\{idx\} className="glass-card overflow-hidden">/g,
  '<div key={idx} className="glass-card overflow-hidden !rounded-none sm:!rounded-xl !border-x-0 sm:!border-x border-[#7C3AED]/20 -mx-2 sm:mx-0">'
);

content = content.replace(
  /<div className="p-2 sm:p-5 flex flex-col items-center bg-black\/20">/g,
  '<div className="py-2 sm:p-5 flex flex-col items-center bg-black/20 sm:rounded-b-xl px-0 sm:px-5">'
);

content = content.replace(
  /<div key=\{pvIdx\} className="bg-black\/20 rounded-lg overflow-hidden border border-\[\#7C3AED\]\/20">/g,
  '<div key={pvIdx} className="bg-black/20 sm:rounded-lg overflow-hidden border-y sm:border border-[#7C3AED]/20 -mx-4 sm:mx-0">'
);

content = content.replace(
  /<div className="p-4 flex flex-col items-center bg-black\/20">/g,
  '<div className="py-4 sm:p-4 flex flex-col items-center bg-black/20 sm:rounded-b-xl px-0 sm:px-4">'
);

content = content.replace(
  /<div className="p-4 flex flex-col items-center">/g,
  '<div className="py-4 sm:p-4 flex flex-col items-center px-0 sm:px-4">'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
