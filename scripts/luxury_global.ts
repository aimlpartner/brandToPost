import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function applyLuxuryToProject() {
  walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      let modified = content;
      
      // Global Brand Color Replacement
      // RGB Colors
      modified = modified.replace(/124,58,237/g, '200,169,126');
      modified = modified.replace(/124,\s*58,\s*237/g, '200, 169, 126');
      modified = modified.replace(/37,131,235/g, '140,115,85');
      modified = modified.replace(/37,\s*131,\s*235/g, '140, 115, 85');
      
      // Hex Colors
      modified = modified.replace(/#7C3AED/gi, '#C8A97E'); // purple to gold
      modified = modified.replace(/#2583EB/gi, '#8C7355'); // blue to bronze
      modified = modified.replace(/#ff8566/gi, '#D9BB92'); // orange to light gold
      
      // BGs
      modified = modified.replace(/#0A0A0F/g, '#030303');
      modified = modified.replace(/#1C1C22/g, '#0A0A0A');

      if (content !== modified) {
        fs.writeFileSync(filePath, modified);
      }
    }
  });
}

applyLuxuryToProject();
