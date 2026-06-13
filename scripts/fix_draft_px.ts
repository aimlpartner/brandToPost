import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Draft day cards
content = content.replace(
  /<div key=\{idx\} className="glass-card p-4 space-y-4">/g,
  '<div key={idx} className="glass-card px-0 sm:px-4 py-4 space-y-4 !rounded-none sm:!rounded-xl border-x-0 sm:border-x">'
);

// Draft day header
content = content.replace(
  /<div \n\s*className="flex items-center justify-between cursor-pointer select-none"/g,
  '<div \n                                    className="flex items-center justify-between cursor-pointer select-none px-4 sm:px-0"'
);

// Generated Posts
content = content.replace(
  /<div className="space-y-4 pr-2">/g,
  '<div className="space-y-4 sm:pr-2 px-0">'
);
content = content.replace(
  /<h4 className="text-sm font-semibold text-white">Generated Posts<\/h4>/g,
  '<h4 className="text-sm font-semibold text-white px-4 sm:px-0">Generated Posts</h4>'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
