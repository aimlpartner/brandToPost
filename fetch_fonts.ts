import fs from 'fs';

async function fetchFonts() {
  try {
    const res = await fetch('https://gwfh.mranftl.com/api/fonts');
    const data = await res.json();
    const fonts = data.map((f: any) => f.family);
    fs.writeFileSync('./src/lib/fonts.ts', 'export const GOOGLE_FONTS = ' + JSON.stringify(fonts) + ';\n');
    console.log(`Saved ${fonts.length} fonts to src/lib/fonts.ts`);
  } catch (e) {
    console.error(e);
  }
}
fetchFonts();
