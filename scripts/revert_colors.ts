import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function revertColors() {
  walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      let modified = content;
      
      // Revert RGB
      modified = modified.replace(/200,169,126/g, '124,58,237');
      modified = modified.replace(/200,\s*169,\s*126/g, '124, 58, 237');
      modified = modified.replace(/140,115,85/g, '37,131,235');
      modified = modified.replace(/140,\s*115,\s*85/g, '37, 131, 235');
      
      // Revert Hex
      modified = modified.replace(/#C8A97E/gi, '#7C3AED');
      modified = modified.replace(/#8C7355/gi, '#2583EB');
      modified = modified.replace(/#D9BB92/gi, '#ff8566');
      modified = modified.replace(/#030303/g, '#0A0A0F');
      modified = modified.replace(/#0A0A0A/g, '#1C1C22');

      // Revert Landing page specific overrides
      if (filePath.endsWith('LandingPage.tsx')) {
        modified = modified.replace(/#EBEBEB/gi, '#18F07A');
        // Since we replaced #FF7778 with #FFFFFF but also there were legitimate #FFFFFF, it's safer to just replace specific instances or let it be. But I'll fix the gradient.
        modified = modified.replace(/from-\[#7C3AED\] to-\[#18F07A\]/g, 'from-[#7C3AED] via-[#FF7778] to-[#18F07A]');
      }

      if (content !== modified) {
        fs.writeFileSync(filePath, modified);
      }
    }
  });
}

revertColors();
