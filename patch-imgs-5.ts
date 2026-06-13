import * as fs from 'fs';

function patch(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{screenshotUrl\}/g, 'src={screenshotUrl || undefined}');
  content = content.replace(/src=\{mergedImage\}/g, 'src={mergedImage || undefined}');
  fs.writeFileSync(filepath, content);
}
patch('src/components/BrandExtractionModal.tsx');
patch('src/components/VisualEngine.tsx');
