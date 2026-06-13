// Script to fetch massive google fonts list and save to a constant
const fs = require('fs');
const https = require('https');

https.get('https://gwfh.mranftl.com/api/fonts', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    const fonts = json.map(f => f.family);
    fs.writeFileSync('./src/lib/fonts.ts', 'export const GOOGLE_FONTS = ' + JSON.stringify(fonts) + ';\n');
    console.log(`Saved ${fonts.length} fonts to src/lib/fonts.ts`);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
