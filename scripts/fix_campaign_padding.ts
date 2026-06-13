import fs from 'fs';

let content = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

// Change Detail View wrapper
content = content.replace(
  /<div className=\{cn\("flex-1 overflow-y-auto glass-panel p-2 sm:p-8"/g,
  '<div className={cn("flex-1 overflow-y-auto p-0 sm:p-8 sm:glass-panel bg-transparent sm:bg-glass border-0 sm:border"'
);

// Remove the -mx-2 and -mx-4 from cards
content = content.replace(
  /\-mx\-2 sm:mx\-0/g,
  ''
);

content = content.replace(
  /\-mx\-4 sm:mx\-0/g,
  ''
);

// We need to fix the glass-card to not have border radius on mobile
fs.writeFileSync('src/pages/Campaigns.tsx', content);

// PostPreviewModal
let modalContent = fs.readFileSync('src/components/PostPreviewModal.tsx', 'utf8');
modalContent = modalContent.replace(
  /sm:rounded-xl/g,
  'sm:rounded-xl'
);
fs.writeFileSync('src/components/PostPreviewModal.tsx', modalContent);
