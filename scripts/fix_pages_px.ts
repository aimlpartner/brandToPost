import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(
  /<div className="space-y-8">/,
  '<div className="space-y-4 sm:space-y-8 px-4 sm:px-0">'
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settings = settings.replace(
  /<div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">/,
  '<div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0">'
);
fs.writeFileSync('src/pages/Settings.tsx', settings);

let dna = fs.readFileSync('src/pages/ProductDNA.tsx', 'utf8');
dna = dna.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">/,
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-8 px-4 sm:px-0 pt-4 sm:pt-0">'
);

dna = dna.replace(
  /<div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">/,
  '<div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 px-4 sm:px-0">'
);
fs.writeFileSync('src/pages/ProductDNA.tsx', dna);

let schedule = fs.readFileSync('src/pages/Schedule.tsx', 'utf8');
schedule = schedule.replace(
  /<div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">/,
  '<div className="flex flex-col gap-6 h-full animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0">'
);
fs.writeFileSync('src/pages/Schedule.tsx', schedule);

let creatives = fs.readFileSync('src/pages/Creatives.tsx', 'utf8');
creatives = creatives.replace(
  /<div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500">/,
  '<div className="space-y-4 sm:space-y-8 h-full flex flex-col animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0">'
);
fs.writeFileSync('src/pages/Creatives.tsx', creatives);

let admin = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
admin = admin.replace(
  /<div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">/,
  '<div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 px-4 sm:px-0 pt-4 sm:pt-0">'
);
fs.writeFileSync('src/pages/AdminDashboard.tsx', admin);
