const fs = require('fs');
const path = require('path');

const colorMap = {
  // Primary Accent -> Wisteria
  '#FFBFA8': '#7699D4',
  'rgba\\(255, 191, 168': 'rgba(118, 153, 212',
  
  // Secondary Accent -> Almond Cream
  '#E8C3B3': '#F3DEC7',
  '#E5A892': '#F3DEC7',
  '#FFE0D2': '#F3DEC7',
  '#FFCBB8': '#F3DEC7',
  '#F3D2C4': '#F3DEC7',
  
  // Muted Teal
  '#CEBDB2': '#7FA986',
  '#AD9C92': '#7FA986',
  
  // Background Light -> Cloud Dancer
  '#FFF0E5': '#EFEEEA',
  '#FFF5F0': '#EFEEEA',
  '#FAFAFA': '#EFEEEA',
  '#FDFBF7': '#EFEEEA',
  '#F5F0E6': '#EFEEEA',
  '#FDF8F5': '#EFEEEA',
  '#FDE2E4': '#EFEEEA',
  
  // Dark Text/Backgrounds -> Dark Wisteria
  '#4A3B32': '#2D3A54',
  'rgba\\(74, 59, 50': 'rgba(45, 58, 84',
  '#5A4B42': '#3A4B6B',
  '#6B5B52': '#4A5D82',
  '#8C7B72': '#5C7099',
  '#0A0705': '#1A2233',
  '#1A1412': '#232D42',
};

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    // Case insensitive replacement for hex codes
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newColor);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      replaceColors(filePath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done');
