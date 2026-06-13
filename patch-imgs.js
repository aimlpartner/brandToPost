const fs = require('fs');

function patch(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/src=\{user\.photoURL\}/g, 'src={user.photoURL || undefined}');
  fs.writeFileSync(filepath, content);
}

patch('src/components/Layout.tsx');
patch('src/components/Sidebar.tsx');
