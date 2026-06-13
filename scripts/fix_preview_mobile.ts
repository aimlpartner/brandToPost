import fs from 'fs';

let content = fs.readFileSync('src/components/PostPreviewModal.tsx', 'utf8');

// LinkedIn
content = content.replace(
  /<div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-\[552px\] w-full mx-auto font-sans text-\[14px\]">/g,
  '<div className="bg-white border-y sm:border sm:border-gray-200 sm:rounded-xl overflow-hidden max-w-[552px] w-full mx-auto font-sans text-[14px]">'
);

// X (Twitter)
content = content.replace(
  /<div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-\[552px\] w-full mx-auto font-sans text-\[15px\]">/g,
  '<div className="bg-white border-y sm:border sm:border-gray-200 sm:rounded-xl overflow-hidden max-w-[552px] w-full mx-auto font-sans text-[15px]">'
);

// YouTube
content = content.replace(
  /<div className="bg-[#0F0F0F] rounded-xl overflow-hidden max-w-\[552px\] w-full mx-auto font-sans text-\[14px\]">/g,
  '<div className="bg-[#0F0F0F] sm:rounded-xl overflow-hidden max-w-[552px] w-full mx-auto font-sans text-[14px]">'
);

fs.writeFileSync('src/components/PostPreviewModal.tsx', content);
