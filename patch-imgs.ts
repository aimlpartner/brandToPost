import * as fs from 'fs';

function patch(filepath: string) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{user\.photoURL\}/g, 'src={user.photoURL || undefined}');
  content = content.replace(/src=\{currentImageUrl\}/g, 'src={currentImageUrl || undefined}');
  content = content.replace(/src=\{activeLogo\}/g, 'src={activeLogo || undefined}');
  content = content.replace(/src=\{imageUrl\}/g, 'src={imageUrl || undefined}');
  content = content.replace(/src=\{src\}/g, 'src={src || undefined}');
  
  fs.writeFileSync(filepath, content);
}

patch('src/components/Layout.tsx');
patch('src/components/Sidebar.tsx');
patch('src/components/PostPreviewModal.tsx');
patch('src/components/ImageLoader.tsx');
patch('src/components/ImageLightbox.tsx');
patch('src/components/VisualEngine.tsx');
