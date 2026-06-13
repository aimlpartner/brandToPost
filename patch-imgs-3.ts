import * as fs from 'fs';

function patch(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{c\.url\}/g, 'src={c.url || undefined}');
  content = content.replace(/src=\{previewUrl\}/g, 'src={previewUrl || undefined}');
  fs.writeFileSync(filepath, content);
}
patch('src/components/VisualEditorModal.tsx');
