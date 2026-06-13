import fs from 'fs';

let content = fs.readFileSync('src/pages/ProductDNA.tsx', 'utf8');
const lines = content.split('\n');
lines.splice(0, 157);
const stripped = lines.join('\n');
fs.writeFileSync('src/pages/ProductDNA.tsx', stripped.replace(/^\\n/, ''));
console.log("Deleted top chunk");
