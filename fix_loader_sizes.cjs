const fs = require('fs');

const files = [
  'src/pages/AdminDashboard.tsx',
  'src/pages/Campaigns.tsx',
  'src/pages/Creatives.tsx',
  'src/pages/Login.tsx',
  'src/pages/ProductDNA.tsx',
  'src/pages/SharedCampaign.tsx',
  'src/components/ImageLoader.tsx'
];

const matchLineMap = {
  'AdminDashboard.tsx': {
    170: 'h-24 w-24 text-[#7C3AED] mx-auto',
    481: 'h-7 w-7'
  },
  'Campaigns.tsx': {
    942: 'mr-1.5 h-7 w-7',
    1308: 'mr-1.5 h-7 w-7',
    1323: 'mr-1.5 h-7 w-7',
    1369: 'h-10 w-10 text-gray-300',
    1433: 'mr-1.5 h-7 w-7',
    1448: 'mr-1.5 h-7 w-7',
    1494: 'h-10 w-10 text-gray-300',
    1722: 'h-32 w-32 text-[#7C3AED] mx-auto',
    1891: 'mr-2 h-7 w-7'
  },
  'Creatives.tsx': {
    308: 'h-7 w-7',
    340: 'mr-2 h-7 w-7',
    366: 'mr-2 h-7 w-7',
    388: 'h-32 w-32 text-[#7C3AED] mx-auto',
    457: 'mr-2 h-7 w-7'
  },
  'Login.tsx': {
    30: 'h-32 w-32 mx-auto scale-[1.5]'
  },
  'ProductDNA.tsx': {
    381: 'mr-2 h-7 w-7',
    610: 'mr-2 h-7 w-7',
    666: 'mr-2 h-7 w-7'
  },
  'SharedCampaign.tsx': {
    180: 'h-32 w-32 text-[#7C3AED] mx-auto'
  },
  'ImageLoader.tsx': {
    21: 'w-24 h-24 text-[#ff8566] mx-auto'
  }
};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  const filename = file.split('/').pop();

  if (matchLineMap[filename]) {
    lines = lines.map((line, idx) => {
      const lineNum = idx + 1;
      if (matchLineMap[filename][lineNum]) {
        return line.replace(/<VideoLoader\s+className="[^"]+"/g, `<VideoLoader className="${matchLineMap[filename][lineNum]}"`);
      }
      return line;
    });
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Updated ${file}`);
  }
});
