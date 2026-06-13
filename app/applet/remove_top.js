import fs from 'fs';

let content = fs.readFileSync('src/pages/ProductDNA.tsx', 'utf8');
const lines = content.split('\\n');
lines.splice(0, 157);
// there's probably a random '\n' or something at line 158.
// Let's just write to file and check again.
fs.writeFileSync('src/pages/ProductDNA.tsx', lines.join('\\n'));
console.log("Deleted top chunk");
