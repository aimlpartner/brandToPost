import React, { useState } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { VideoLoader } from '../components/VideoLoader';

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
 src?: string;
 alt: string;
 containerClassName?: string;
}

export function ImageLoader({ src, alt, className = '', containerClassName = '', ...props }: ImageLoaderProps) {
 const [isLoaded, setIsLoaded] = useState(false);
 const [hasError, setHasError] = useState(false);

 if (!src) return null;

 return (
 <div className={`relative overflow-hidden bg-black/5 flex items-center justify-center ${containerClassName}`}>
 {!isLoaded && !hasError && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/5 animate-pulse">
 <VideoLoader className="w-24 h-24 text-[#ff8566] mx-auto" />
 </div>
 )}
 {hasError && (
 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 text-[#ff8566]">
 <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
 <span className="text-xs font-medium">Failed to load image</span>
 </div>
 )}
 <img
 src={src || undefined}
 alt={alt}
 className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
 onLoad={() => setIsLoaded(true)}
 onError={() => setHasError(true)}
 {...props}
 />
 </div>
 );
}
