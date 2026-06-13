import fs from 'fs';

const pages = [
  'src/pages/Dashboard.tsx',
  'src/pages/Settings.tsx',
  'src/pages/ProductDNA.tsx',
  'src/pages/Schedule.tsx',
  'src/pages/Creatives.tsx',
  'src/pages/AdminDashboard.tsx'
];

for (const page of pages) {
  let content = fs.readFileSync(page, 'utf8');
  // Add pb-[80px] md:pb-0 on the main wrapper
  if (page === 'src/pages/Dashboard.tsx') {
    content = content.replace(
      /<div className="space-y-4 sm:space-y-8 px-4 sm:px-0">/,
      '<div className="space-y-4 sm:space-y-8 px-4 sm:px-0 pb-[80px] md:pb-0">'
    );
  } else if (page === 'src/pages/Settings.tsx') {
    content = content.replace(
      /className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0"/,
      'className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pb-[80px] md:pb-0 pt-4 sm:pt-0"'
    );
  } else if (page === 'src/pages/ProductDNA.tsx') {
    content = content.replace(
      /className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 px-4 sm:px-0"/,
      'className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 px-4 sm:px-0 pb-[80px] md:pb-0"'
    );
  } else if (page === 'src/pages/Schedule.tsx') {
    content = content.replace(
      /className="flex flex-col gap-6 h-full animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0"/,
      'className="flex flex-col gap-6 h-full animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0 pb-[80px] md:pb-0"'
    );
  } else if (page === 'src/pages/Creatives.tsx') {
    content = content.replace(
      /className="space-y-4 sm:space-y-8 h-full flex flex-col animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0"/,
      'className="space-y-4 sm:space-y-8 h-full flex flex-col animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0 pb-[80px] md:pb-0"'
    );
  } else if (page === 'src/pages/AdminDashboard.tsx') {
    content = content.replace(
      /className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0"/,
      'className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0 pb-[80px] md:pb-0"'
    );
  }
  fs.writeFileSync(page, content);
}
