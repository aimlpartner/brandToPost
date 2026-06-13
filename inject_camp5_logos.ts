import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

content = content.replace(
  'productLogoUrl: activeProduct.logoUrl || null',
  'productLogoUrl: activeProduct.logoUrl || activeProduct.logoDarkUrl || activeProduct.logoLightUrl || null'
);

content = content.replace(
  'productLogo={activeProduct?.logoUrl}',
  'productLogo={activeProduct?.logoUrl || activeProduct?.logoDarkUrl || activeProduct?.logoLightUrl}'
);

fs.writeFileSync('src/pages/Campaigns.tsx', content);
