import fs from 'fs';

function applyLuxury(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace RGB purples and blues in shadows
  content = content.replace(/124,58,237/g, '200,169,126');
  content = content.replace(/124,\s*58,\s*237/g, '200, 169, 126');

  // Colors replacement HEX
  content = content.replace(/#7C3AED/gi, '#C8A97E'); // Gold
  content = content.replace(/#2583EB/gi, '#8C7355'); // Bronze
  content = content.replace(/#18F07A/gi, '#EBEBEB'); // Silver/White
  content = content.replace(/#FF7778/gi, '#FFFFFF'); // White
  
  if (filePath.includes('Login.tsx')) {
    // Specifically for login page gradients and bg
    content = content.replace(/#0A0A0F/g, '#030303');
    content = content.replace(/#1C1C22/g, '#0A0A0A');
    content = content.replace(/text-5xl lg:text-7xl font-bold text-white/g, 'text-5xl lg:text-7xl font-normal font-display text-white');
  }

  fs.writeFileSync(filePath, content);
}

applyLuxury('src/pages/LandingPage.tsx');
applyLuxury('src/pages/Login.tsx');
