import { createPortal } from 'react-dom';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
 src: string;
 onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => { document.body.classList.remove('modal-open'); };
  }, []);

 return (
 <div 
 className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
 onClick={onClose}
 >
 <button 
 onClick={onClose}
 className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
 >
 <X className="h-6 w-6" />
 </button>
 <img 
 src={src || undefined} 
 alt="Enlarged view" 
 className="max-w-full max-h-[90vh] object-contain rounded-[14px] shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 );
}
