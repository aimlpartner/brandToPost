import * as fs from 'fs';

function patch(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{productLogo\}/g, 'src={productLogo || undefined}');
  fs.writeFileSync(filepath, content);
}
patch('src/components/PostPreviewModal.tsx');
