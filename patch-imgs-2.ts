import * as fs from 'fs';

function patch(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{dna\.logoUrl\}/g, 'src={dna.logoUrl || undefined}');
  content = content.replace(/src=\{dna\.logoLightUrl\}/g, 'src={dna.logoLightUrl || undefined}');
  content = content.replace(/src=\{dna\.logoDarkUrl\}/g, 'src={dna.logoDarkUrl || undefined}');
  content = content.replace(/src=\{campaign\.productLogoUrl\}/g, 'src={campaign.productLogoUrl || undefined}');
  content = content.replace(/src=\{previewCreative\.url\}/g, 'src={previewCreative.url || undefined}');
  content = content.replace(/src=\{creative\.url\}/g, 'src={creative.url || undefined}');
  
  fs.writeFileSync(filepath, content);
}

patch('src/pages/ProductDNA.tsx');
patch('src/pages/SharedCampaign.tsx');
patch('src/pages/Creatives.tsx');
