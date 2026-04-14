const fs = require('fs');
const path = require('path');

const colorMap = {
  '#7699D4': '#ff6347', // Primary -> Tomato
  '#F3DEC7': '#ffe066', // Secondary -> Yellow
  '#7FA986': '#ff8566', // Muted Teal -> Lighter Tomato
  '#EFEEEA': '#fafafa', // Background -> Off-white for contrast
  '#2D3A54': '#111827', // Dark text -> Gray 900
  '#3A4B6B': '#374151', // Dark text 2 -> Gray 700
  '#4A5D82': '#4b5563', // Muted text -> Gray 600
  '#5C7099': '#6b7280', // Lighter muted -> Gray 500
  '#232D42': '#030712', // Very dark -> Gray 950
  '118,153,212': '255,99,71', // RGB Tomato
  '243,222,199': '255,224,102', // RGB Yellow
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    const regex = new RegExp(oldColor, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, newColor);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
