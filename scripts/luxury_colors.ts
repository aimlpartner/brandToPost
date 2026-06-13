import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf-8');

// Colors replacement
content = content.replace(/#7C3AED/g, '#C8A97E'); // Gold
content = content.replace(/#2583EB/g, '#8C7355'); // Bronze
content = content.replace(/#18F07A/g, '#EBEBEB'); // Silver/White
content = content.replace(/#FF7778/g, '#FFFFFF'); // White
content = content.replace(/#0A0A0F/g, '#030303'); // Rich Black
content = content.replace(/#1C1C22/g, '#0A0A0A'); // Charcoal
content = content.replace(/from-yellow-400 via-pink-500 to-purple-500/g, 'from-\\[#C8A97E\\] to-\\[#8C7355\\]');

// Increase typography sizes or font weights in Hero
content = content.replace(/text-5xl md:text-7xl lg:text-\[80px\] font-extrabold/g, 'text-6xl md:text-8xl lg:text-[100px] font-normal');
content = content.replace(/text-4xl md:text-5xl font-bold/g, 'text-5xl md:text-6xl font-normal');

// Remove some blurs
content = content.replace(/blur-\[150px\]/g, 'blur-[100px]');
content = content.replace(/blur-\[120px\]/g, 'blur-[80px]');

fs.writeFileSync('src/pages/LandingPage.tsx', content);
