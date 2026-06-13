import fs from 'fs';

// 1. Update PostPreviewModal
let modalContent = fs.readFileSync('src/components/PostPreviewModal.tsx', 'utf8');

// Add import
modalContent = modalContent.replace(
  "import { X, Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, ThumbsUp, Send } from 'lucide-react';",
  "import { X, Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, ThumbsUp, Send } from 'lucide-react';\nimport { VisualEngine } from './VisualEngine';\nimport { ProductDNA } from '../types';"
);

// Update interface
modalContent = modalContent.replace(
  "imageUrl?: string;\n productName",
  "imageUrl?: string;\n visualType?: string;\n visualData?: any;\n dna?: ProductDNA;\n  productName"
);

// Update component signature
modalContent = modalContent.replace(
  "export function PostPreviewModal({ platform, copy, imageUrl, productName, productLogo, onClose }: PostPreviewModalProps) {",
  "export function PostPreviewModal({ platform, copy, imageUrl, visualType, visualData, dna, productName, productLogo, onClose }: PostPreviewModalProps) {"
);

const visualCode = `
  const renderVisual = () => {
    if (visualType && dna) {
      return (
        <div className="pointer-events-none w-full relative">
          <VisualEngine 
            visualType={visualType} 
            visualData={visualData} 
            imageUrl={imageUrl} 
            dna={dna} 
            fallbackText={copy.substring(0, 50)} 
          />
        </div>
      );
    }
    if (imageUrl) {
      return <img src={imageUrl} alt="Post" className="w-full h-auto max-h-[500px] object-contain" />;
    }
    return null;
  };
`;

modalContent = modalContent.replace(
  "const formattedCopy = copy.split('\\n').map((line, i) => (",
  visualCode + "\n const formattedCopy = copy.split('\\n').map((line, i) => ("
);

// Replace `{imageUrl && (<div...>...</div>)}` in Twitter
modalContent = modalContent.replace(
  /\{imageUrl && \(\s*<div className="rounded-2xl border border-gray-200 overflow-hidden mb-3">\s*<img src=\{imageUrl\} alt="Post" className="w-full h-auto" \/>\s*<\/div>\s*\)\}/,
  `{(imageUrl || visualType) && (
  <div className="rounded-2xl border border-gray-200 overflow-hidden mb-3 bg-black">
    {renderVisual()}
  </div>
  )}`
);

// Replace in LinkedIn (two different places potentially)
modalContent = modalContent.replace(
  /\{imageUrl && \(\s*<div className="bg-\[\#f9fafb\]">\s*<img src=\{imageUrl\} alt="Post" className="w-full h-auto max-h-\[500px\] object-contain" \/>\s*<\/div>\s*\)\}/,
  `{(imageUrl || visualType) && (
  <div className="bg-[#f9fafb] border-t border-b border-gray-200">
    {renderVisual()}
  </div>
  )}`
);

// Replace in Instagram
modalContent = modalContent.replace(
  /\{imageUrl && \(\s*<div className="bg-black flex items-center justify-center border-t border-b border-gray-100 overflow-hidden">\s*<img src=\{imageUrl\} alt="Post" className="w-full h-auto max-h-\[600px\] object-contain" \/>\s*<\/div>\s*\)\}/,
  `{(imageUrl || visualType) && (
  <div className="bg-black flex items-center justify-center border-t border-b border-gray-100 overflow-hidden w-full relative">
    {renderVisual()}
  </div>
  )}`
);

// Replace in Facebook
modalContent = modalContent.replace(
  /\{imageUrl && \(\s*<div className="bg-black flex items-center justify-center">\s*<img src=\{imageUrl\} alt="Post" className="w-full h-auto max-h-\[500px\] object-contain" \/>\s*<\/div>\s*\)\}/,
  `{(imageUrl || visualType) && (
  <div className="bg-black flex items-center justify-center border-t border-b border-gray-100">
    {renderVisual()}
  </div>
  )}`
);

fs.writeFileSync('src/components/PostPreviewModal.tsx', modalContent);


// 2. Update Campaigns preview logic
let campsContent = fs.readFileSync('src/pages/Campaigns.tsx', 'utf8');

campsContent = campsContent.replace(
  /const \[previewPost, setPreviewPost\] = useState<\{ platform: string, copy: string, imageUrl\?: string \} \| null>\(null\);/,
  `const [previewPost, setPreviewPost] = useState<{ platform: string, copy: string, imageUrl?: string, visualType?: string, visualData?: any } | null>(null);`
);

// Add visualType to the previewPost setters
campsContent = campsContent.replace(
  /onClick=\{\(\) => setPreviewPost\(\{\s*platform: pv\.platform,\s*copy: pv\.copy,\s*imageUrl: pv\.imageUrl \|\| \(pv\.imageId \? campaignImages\[pv\.imageId\] : undefined\)\s*\}\)\}/g,
  `onClick={() => setPreviewPost({
    platform: pv.platform,
    copy: pv.copy,
    imageUrl: pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined),
    visualType: (pv as any).visualType || dp.visualType,
    visualData: (pv as any).visualData || dp.visualData
  })}`
);

// Update rendering of PostPreviewModal
campsContent = campsContent.replace(
  /imageUrl=\{previewPost\.imageUrl\}\s*productName=\{activeProduct\?\.name \|\| "Product Name"\}/,
  `imageUrl={previewPost.imageUrl}
 visualType={previewPost.visualType}
 visualData={previewPost.visualData}
 dna={activeProduct!}
 productName={activeProduct?.name || "Product Name"}`
);

fs.writeFileSync('src/pages/Campaigns.tsx', campsContent);

