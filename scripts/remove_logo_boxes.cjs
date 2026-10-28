const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'landing_export', 'index.html'),
  path.join(__dirname, '..', 'landing_page.html')
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // 1. In navbar dropdown: replace <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[^"]*"> with <div class="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
  content = content.replace(
    /<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5[^"]*">/g,
    '<div class="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">'
  );

  // 2. In agent fleet cards: replace <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110[^"]*"> with <div class="w-8 h-8 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0">
  content = content.replace(
    /<div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110[^"]*">/g,
    '<div class="w-8 h-8 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0">'
  );

  // 3. Ensure images/svgs in agent fleet are nicely sized (w-6 h-6)
  // Check LinkedIn image in agent fleet:
  content = content.replace(
    /<img src="\/native-marketing-on-autopilot\.svg\.svg-100\.Woblo\.svg" alt="LinkedIn" class="w-5 h-5 object-contain rounded-sm" \/>\s*<\/div>\s*<span class="font-mono text-xs font-semibold text-slate-500 group-hover:text-\[#C084FC\] transition-colors">01<\/span>/,
    '<img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" class="w-6 h-6 object-contain" /></div><span class="font-mono text-xs font-semibold text-slate-500 group-hover:text-[#C084FC] transition-colors">01</span>'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated:', file);
}
