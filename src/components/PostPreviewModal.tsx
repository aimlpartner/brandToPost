import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Repeat2, MoreHorizontal, ThumbsUp, Send, Edit, Bookmark } from 'lucide-react';
import { VisualEditorModal } from './VisualEditorModal';
import { VisualEngine } from './VisualEngine';
import { ProductDNA } from '../types';

interface PostPreviewModalProps {
  platform: string;
  copy: string;
  imageUrl?: string;
  visualType?: string;
  visualData?: any;
  dna?: ProductDNA;
  productName: string;
  productLogo?: string;
  onClose?: () => void;
  inline?: boolean;
  onImageGenerated?: (dataUrl: string) => void;
  onUpdateVisual?: (newImageUrl: string, revertableOriginalUrl: string, newVisualData?: any) => void;
  isLoadingVisual?: boolean;
}

export function PostPreviewModal({ platform, copy, imageUrl, visualType, visualData, dna, productName, productLogo, onClose, inline, onImageGenerated, onUpdateVisual, isLoadingVisual }: PostPreviewModalProps) {
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);

  useEffect(() => {
    if (!inline) {
      document.body.classList.add('modal-open');
      return () => document.body.classList.remove('modal-open');
    }
  }, [inline]);

  const handleVisualSave = (newUrl: string, originalUrl: string, newVisualData?: any) => {
    if (onUpdateVisual) {
      onUpdateVisual(newUrl, originalUrl, newVisualData);
    } else if (onImageGenerated) {
       onImageGenerated(newUrl);
    }
  };

  const currentImageUrl = imageUrl;
  const originalUrl = visualData?.baseImage || currentImageUrl;
  const hasVisual = !!currentImageUrl || !!visualType || !!isLoadingVisual;

  const renderVisual = () => {
    if (isLoadingVisual) {
      return (
        <div className="w-full h-64 bg-slate-100 flex flex-col items-center justify-center gap-3 border border-slate-200 rounded-lg animate-pulse p-6">
          <div className="relative flex items-center justify-center">
            <svg className="w-10 h-10 text-[#7C3AED] animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute w-5 h-5 rounded-full bg-[#7C3AED]/20 animate-ping"></div>
          </div>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">Fetching high-res post asset...</span>
          <span className="text-[10px] text-slate-400 font-light max-w-xs text-center">Tror is gathering deep assets from secure storage.</span>
        </div>
      );
    }
    if (!currentImageUrl) return null;

    // Optimize: If we already have a flattened/pre-rendered visual image (not just the raw background),
    // display it statically. This prevents running heavy HTML-to-Image / toJpeg calls inside campaign lists.
    const hasPrecompiledImage = currentImageUrl && currentImageUrl !== visualData?.baseImage;

    if (visualType && visualType !== 'none' && !hasPrecompiledImage) {
      return (
        <div className="w-full relative group">
          <VisualEngine
            visualType={visualType}
            visualData={visualData}
            imageUrl={visualData?.baseImage || currentImageUrl}
            dna={dna || null}
            fallbackText={productName}
            activeLogo={productLogo}
          />
          {/* Only show Edit button if it's a custom-overlay or we have original image to edit text on */}
          {(visualType === 'custom-overlay' || originalUrl) && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsVisualEditorOpen(true); }}
              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-xl z-20"
            >
               <Edit className="w-3.5 h-3.5" /> Edit Visual
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="w-full relative group">
        <img src={currentImageUrl || undefined} alt="Post" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
        {/* Only show Edit button if it's a custom-overlay or we have original image to edit text on */}
        {(visualType === 'custom-overlay' || originalUrl) && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsVisualEditorOpen(true); }}
            className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-xl z-20"
          >
             <Edit className="w-3.5 h-3.5" /> Edit Visual
          </button>
        )}
      </div>
    );
  };

 const parseText = (text: string) => {
   const parts = text.split(/(\*\*.*?\*\*)/g);
   return parts.map((part, i) => {
     if (part.startsWith('**') && part.endsWith('**')) {
       return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
     }
     return <span key={i}>{part}</span>;
   });
 };

 const formattedCopy = copy.split('\n').map((line, i) => (
 <React.Fragment key={i}>
 {parseText(line)}
 {i < copy.split('\n').length - 1 && <br />}
 </React.Fragment>
 ));

 const renderTwitterPreview = () => (
 <div className="bg-white border border-gray-100 rounded-xl overflow-hidden max-w-[600px] w-full mx-auto font-sans text-[15px] text-[#0f1419]">
 <div className="flex p-4">
 <div className="mr-3 shrink-0">
 <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
 {productLogo ? <img src={productLogo || undefined} className="w-full h-full object-cover" /> : <div className="text-gray-400 font-bold">{productName.charAt(0)}</div>}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <div className="flex items-center truncate">
 <span className="font-bold hover:underline truncate">{productName}</span>
 <span className="text-[#536471] ml-1 truncate">@{productName.replace(/\s+/g, '').toLowerCase()}</span>
 <span className="text-[#536471] mx-1">·</span>
 <span className="text-[#536471] hover:underline">1h</span>
 </div>
 <MoreHorizontal className="h-5 w-5 text-[#536471]" />
 </div>
 <div className="whitespace-pre-wrap word-break break-words mb-3">
 {formattedCopy}
 </div>
 {hasVisual && (
  <div className="rounded-2xl border border-gray-200 overflow-hidden mb-3 bg-black">
    {renderVisual()}
  </div>
  )}
 <div className="flex items-center justify-between text-[#536471] max-w-md">
 <div className="flex items-center hover:text-blue-500 transition-colors cursor-pointer group">
 <div className="p-2 group-hover:bg-[#2583EB]/10 rounded-full"><MessageCircle className="h-[18px] w-[18px]" /></div>
 <span className="text-[13px] px-1">12</span>
 </div>
 <div className="flex items-center hover:text-green-500 transition-colors cursor-pointer group">
 <div className="p-2 group-hover:bg-[#18F07A]/10 rounded-full"><Repeat2 className="h-[18px] w-[18px]" /></div>
 <span className="text-[13px] px-1">4</span>
 </div>
 <div className="flex items-center hover:text-pink-500 transition-colors cursor-pointer group">
 <div className="p-2 group-hover:bg-pink-50 rounded-full"><Heart className="h-[18px] w-[18px]" /></div>
 <span className="text-[13px] px-1">48</span>
 </div>
 <div className="flex items-center hover:text-blue-500 transition-colors cursor-pointer group">
 <div className="p-2 group-hover:bg-[#2583EB]/10 rounded-full"><Share2 className="h-[18px] w-[18px]" /></div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

  const renderLinkedInPreview = () => (
  <div className="bg-white border-y sm:border sm:border-gray-200 sm:rounded-xl overflow-hidden max-w-[552px] w-full mx-auto font-sans text-[14px] text-gray-900">
  <div className="flex p-4 pb-0">
  <div className="mr-2 shrink-0">
  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 overflow-hidden border border-gray-200">
  {productLogo ? <img src={productLogo || undefined} className="w-full h-full object-cover" /> : <div className="text-gray-400 font-bold">{productName.charAt(0)}</div>}
  </div>
  </div>
  <div className="flex-1 min-w-0">
  <div className="flex items-start justify-between">
  <div className="flex flex-col">
  <span className="font-semibold text-black hover:text-[#2583EB] hover:underline">{productName}</span>
  <span className="text-[12px] text-gray-450 truncate">SaaS Platform • Daily Strategy</span>
  <span className="text-[12px] text-gray-450">1h • 🌐</span>
  </div>
  <MoreHorizontal className="h-5 w-5 text-gray-400" />
  </div>
  </div>
  </div>
  <div className="px-4 py-3 text-[14px] text-gray-900 whitespace-pre-wrap">
  {formattedCopy}
  </div>
  {hasVisual && (
   <div className="bg-[#f9fafb] border-t border-b border-gray-200">
     {renderVisual()}
   </div>
   )}
 <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between text-[12px] text-gray-400">
 <div className="flex items-center">
 <div className="bg-[#2583EB]/100 rounded-full w-4 h-4 flex items-center justify-center -mr-1 z-10 p-[2px]">
 <ThumbsUp className="h-2 w-2 text-white" />
 </div>
 <span className="ml-2 text-gray-400 hover:text-[#2583EB] hover:underline cursor-pointer">You and 84 others</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="hover:text-[#2583EB] hover:underline cursor-pointer">12 comments</span>
 <span>•</span>
 <span className="hover:text-[#2583EB] hover:underline cursor-pointer">2 reposts</span>
 </div>
 </div>
 <div className="px-2 py-1 flex items-center justify-between">
 <button className="flex items-center gap-2 text-gray-600 font-semibold hover:bg-gray-100 px-3 py-3 rounded-md flex-1 justify-center transition-colors">
 <ThumbsUp className="h-5 w-5" /> <span>Like</span>
 </button>
 <button className="flex items-center gap-2 text-gray-600 font-semibold hover:bg-gray-100 px-3 py-3 rounded-md flex-1 justify-center transition-colors">
 <MessageCircle className="h-5 w-5" /> <span>Comment</span>
 </button>
 <button className="flex items-center gap-2 text-gray-600 font-semibold hover:bg-gray-100 px-3 py-3 rounded-md flex-1 justify-center transition-colors">
 <Repeat2 className="h-5 w-5" /> <span>Repost</span>
 </button>
 <button className="flex items-center gap-2 text-gray-600 font-semibold hover:bg-gray-100 px-3 py-3 rounded-md flex-1 justify-center transition-colors">
 <Send className="h-5 w-5" /> <span>Send</span>
 </button>
 </div>
 </div>
 );
 
 const renderInstagramPreview = () => (
 <div className="bg-white border border-gray-200 rounded-[3px] overflow-hidden max-w-[470px] w-full mx-auto font-sans text-[14px]">
 <div className="flex items-center justify-between p-3 border-b border-gray-100">
 <div className="flex items-center">
 <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center p-[2px]">
 <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
 {productLogo ? <img src={productLogo || undefined} className="w-full h-full object-cover" /> : <div className="text-gray-400 font-bold text-xs">{productName.charAt(0)}</div>}
 </div>
 </div>
 <span className="ml-3 font-semibold text-[14px] text-gray-900">{productName.toLowerCase().replace(/\s+/g, '')}</span>
 </div>
 <MoreHorizontal className="h-5 w-5 text-gray-900" />
 </div>
 
 {hasVisual ? (
 <div className="w-full bg-black flex items-center justify-center">
 {renderVisual()}
 </div>
 ) : (
 <div className="w-full bg-[#E1306C] aspect-square flex items-center justify-center p-8 text-center text-white text-xl font-semibold overflow-y-auto">
 {formattedCopy}
 </div>
 )}
 
 <div className="p-3 pb-4">
 <div className="flex items-center justify-between mb-3 text-gray-900">
 <div className="flex items-center gap-4">
 <Heart className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
 <MessageCircle className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
 <Send className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
 </div>
 <Bookmark className="h-6 w-6 hover:text-gray-500 cursor-pointer transition-colors" />
 </div>
 <div className="font-semibold text-[14px] mb-1 text-gray-900">1,024 likes</div>
 <div className="text-[14px] text-gray-900">
 <span className="font-semibold mr-2">{productName.toLowerCase().replace(/\s+/g, '')}</span>
 <span className="whitespace-pre-wrap text-gray-800">{formattedCopy}</span>
 </div>
 <div className="text-[12px] text-gray-500 uppercase mt-2">1 hour ago</div>
 </div>
 </div>
 );

 const getPreview = () => {
 switch (platform.toLowerCase()) {
 case 'x':
 case 'twitter':
 return renderTwitterPreview();
 case 'linkedin':
 return renderLinkedInPreview();
 case 'instagram':
 return renderInstagramPreview();
 default:
 // Generic fallback
 return renderLinkedInPreview();
 }
 };

 if (inline) {
  return (
   <div className="w-full">
     {getPreview()}
      {(currentImageUrl || visualType) && (
        <VisualEditorModal 
          isOpen={isVisualEditorOpen} 
          onClose={() => setIsVisualEditorOpen(false)} 
          imageUrl={currentImageUrl || ''} 
          originalImageUrl={originalUrl}
          visualData={visualData}
          visualType={visualType}
          creatives={[]}
          activeLogo={productLogo}
          onSave={handleVisualSave}
        />
      )}
   </div>
  );
 }

 return (
 <div 
 className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
 onClick={onClose}
 >
 <button 
 onClick={onClose}
 className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors z-10"
 >
 <X className="h-6 w-6" />
 </button>
 <div 
 className="relative my-auto py-8 w-full flex justify-center"
 onClick={(e) => e.stopPropagation()}
 >
 {getPreview()}
 </div>
 {(currentImageUrl || visualType) && (
   <VisualEditorModal 
     isOpen={isVisualEditorOpen} 
     onClose={() => setIsVisualEditorOpen(false)} 
     imageUrl={currentImageUrl || ''} 
     originalImageUrl={originalUrl}
     visualData={visualData}
     visualType={visualType}
     creatives={[]}
     activeLogo={productLogo}
     onSave={handleVisualSave}
   />
 )}
 </div>
 );
}
