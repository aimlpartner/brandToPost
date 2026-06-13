import fs from 'fs';

let content = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const activeLogoPdfDef = `const activeLogo = product.logoDarkUrl || product.logoUrl || product.logoLightUrl;`;

content = content.replace("let logoBottomY = pageHeight / 3;", activeLogoPdfDef + "\n  let logoBottomY = pageHeight / 3;");

content = content.replace(/product\.logoUrl/g, "activeLogo");

fs.writeFileSync('src/lib/pdfGenerator.ts', content);
