import fs from 'fs';

let engine = fs.readFileSync('src/components/VisualEngine.tsx', 'utf8');

// Remove crossOrigin which breaks logo loading if CORS isn't explicitly configured on the user's bucket
engine = engine.replace(/ crossOrigin="anonymous"/g, "");

// Remove container queries which break html-to-image rendering
engine = engine.replace(/ @container/g, "");
engine = engine.replace(/@md:/g, "sm:");

// Replace fragile container-query width (cqw) with standard responsive text sizes
engine = engine.replace(/text-\[min\(3cqw,16px\)\]/g, "text-xs sm:text-sm");
engine = engine.replace(/text-\[min\(8cqw,64px\)\]/g, "text-3xl sm:text-4xl md:text-5xl");
engine = engine.replace(/text-\[min\(6cqw,48px\)\]/g, "text-2xl sm:text-3xl md:text-4xl");
engine = engine.replace(/text-\[min\(4cqw,24px\)\]/g, "text-lg sm:text-xl md:text-2xl");
engine = engine.replace(/text-\[min\(7cqw,56px\)\]/g, "text-3xl sm:text-4xl md:text-5xl");
engine = engine.replace(/text-\[min\(3\.5cqw,20px\)\]/g, "text-sm sm:text-base md:text-lg");
engine = engine.replace(/text-\[min\(10cqw,80px\)\]/g, "text-4xl sm:text-5xl md:text-7xl");
engine = engine.replace(/text-\[min\(8cqw,72px\)\]/g, "text-3xl sm:text-4xl md:text-6xl");

fs.writeFileSync('src/components/VisualEngine.tsx', engine);
