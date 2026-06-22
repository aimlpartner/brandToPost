import React, { useRef, useState, useEffect } from "react";
import { toJpeg } from "html-to-image";
import { Download, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { ProductDNA } from "../types";

export interface VisualData {
  headline?: string;
  subtext?: string;
  stats?: Array<{ label: string; value: string }>;
  cinematicPrompt?: string;
  customHtml?: string;
  layout?: any;
  editorState?: any;
}

interface VisualEngineProps {
  visualType?: "creative-story" | "data-infographic" | "powerful-quote" | "abstract-announcement" | "custom-overlay" | string;
  visualData?: VisualData;
  imageUrl?: string;
  dna: ProductDNA | null;
  activeLogo?: string;
  className?: string;
  fallbackText?: string;
  onImageGenerated?: (dataUrl: string) => void;
}

// Small helper for powerful-quote template name
function uniqueName(name: string) {
  return <div className="text-gray-400 tracking-widest uppercase font-bold text-[min(3vw,16px)]">{name}</div>;
}

export function VisualEngine({ visualType, visualData, imageUrl, dna, className, fallbackText, onImageGenerated, activeLogo: propsActiveLogo }: VisualEngineProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  
  // Use brand colors or defaults
  const primaryColor = dna?.visualData?.colors?.[0] || "#4F46E5";
  const secondaryColor = dna?.visualData?.colors?.[1] || "#111827";
  
  // Font Family style extraction
  const fontFamilyStyle = {
    fontFamily: dna?.visualData?.fonts?.primary 
      ? `"${dna.visualData.fonts.primary}", sans-serif`
      : "Inter, sans-serif"
  };

  // Normalize visualType
  let safeVisualType = visualType ? visualType.toLowerCase() : "";
  const validTypes = ["creative-story", "data-infographic", "powerful-quote", "abstract-announcement", "custom-overlay"];
  if (safeVisualType && !validTypes.includes(safeVisualType)) {
    if (safeVisualType.includes("quote")) safeVisualType = "powerful-quote";
    else if (safeVisualType.includes("data") || safeVisualType.includes("info")) safeVisualType = "data-infographic";
    else if (safeVisualType.includes("abstract") || safeVisualType.includes("announce")) safeVisualType = "abstract-announcement";
    else if (safeVisualType.includes("custom")) safeVisualType = "custom-overlay";
    else safeVisualType = "";
  }

  const isDarkTemplate = ["creative-story", "powerful-quote", "abstract-announcement", "custom-overlay"].includes(safeVisualType);
  const activeLogo = propsActiveLogo || (isDarkTemplate ? dna?.logoLightUrl : dna?.logoDarkUrl) || dna?.logoUrl;

  useEffect(() => {
    let mounted = true;
    
    if (!safeVisualType || safeVisualType === "none") {
      setIsGenerating(false);
      return;
    }

    setMergedImage(null);
    setIsGenerating(true);

    const generateMergedImage = async () => {
      try {
        // Wait for rendering and image loading
        // Wait for ALL images inside nodeRef to load
        await new Promise<void>((resolve) => {
          if (!nodeRef.current) return resolve();
          const images = Array.from(nodeRef.current.querySelectorAll("img"));
          if (images.length === 0) return resolve();
          let loadedCount = 0;
          const checkDone = () => {
             loadedCount++;
             if (loadedCount >= images.length) resolve();
          };
          images.forEach((img) => {
             if (img.complete) {
               checkDone();
             } else {
               img.onload = checkDone;
               img.onerror = checkDone;
             }
          });
          // Fallback timeout of 5s just in case
          setTimeout(resolve, 5000);
        });

        // Small delay to ensure CSS applies
        await new Promise(r => setTimeout(r, 100)); 
        
        if (!nodeRef.current) return;
        
        const dataUrl = await toJpeg(nodeRef.current, { 
          quality: 0.95,
          pixelRatio: 1, // Keep it exactly 1080x1080
          
          cacheBust: true,
        });

        if (mounted) {
          setMergedImage(dataUrl);
          setIsGenerating(false);
          if (onImageGenerated) onImageGenerated(dataUrl);
        }
      } catch (err) {
        console.error("Failed to generate merged image:", err);
        if (mounted) setIsGenerating(false);
      }
    };

    generateMergedImage();
    
    return () => { mounted = false; };
  }, [safeVisualType, visualData, imageUrl, dna, fallbackText]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mergedImage && (!safeVisualType || safeVisualType === "none") && imageUrl) {
       // Download plain image if no template
       const link = document.createElement("a");
       link.download = `${dna?.name || "brand"}_post.jpg`;
       link.href = imageUrl;
       link.click();
       return;
    }
    
    if (!mergedImage) return;

    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `${dna?.name || "brand"}_post.jpg`;
      link.href = mergedImage;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!safeVisualType || safeVisualType === "none") {
    return (
      <div className={cn("relative group overflow-hidden rounded-xl border border-gray-800", className)}>
        {imageUrl && <img src={imageUrl || undefined} className="w-full h-auto max-h-[600px] object-cover" alt="Generated post image" />}
        <button 
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative group border border-gray-800 rounded-xl overflow-hidden bg-black", className)}>
      
      {/* Hidden 1080x1080 rendering container used only for toJpeg capturing */}
      <div className="absolute opacity-0 pointer-events-none" style={{ left: "-9999px", top: 0, width: "1080px", height: "1080px" }}>
        <div 
          ref={nodeRef} 
          className="w-full h-full relative flex flex-col justify-center overflow-hidden bg-black"
          style={{ ...fontFamilyStyle, width: "1080px", height: "1080px" }}
        >
          
          {/* TEMPLATE 1: Cinematic Human */}
          {safeVisualType === "creative-story" && (
            <>
              {imageUrl ? (
                 <img 
                   src={imageUrl || undefined} 
                   crossOrigin={imageUrl?.startsWith("data:") ? undefined : "anonymous"} 
                   className="absolute inset-0 w-full h-full object-cover" 
                   alt="Background" 
                 />
              ) : (
                 <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                   <ImageIcon className="w-32 h-32 text-gray-700" />
                 </div>
              )}
              {/* Translucent solid black overlay on the left */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />
              
              <div className="relative z-10 p-24 h-full flex flex-col justify-center w-[85%]">
                {visualData?.subtext && (
                   <div className="mb-8 text-indigo-400 font-bold uppercase tracking-[0.2em] text-[24px]">
                     — {visualData.subtext}
                   </div>
                )}
                <h2 className={`text-white font-extrabold leading-[1.15] tracking-tight drop-shadow-2xl ${(visualData?.headline || fallbackText || "").length > 150 ? "text-[48px]" : (visualData?.headline || fallbackText || "").length > 80 ? "text-[64px]" : "text-[80px]"}`}>
                  {visualData?.headline || fallbackText || "Your disruptive quote goes here."}
                </h2>
              </div>
            </>
          )}

          {/* TEMPLATE 2: Abstract Apology / Announcement */}
          {safeVisualType === "abstract-announcement" && (
            <>
              <div 
                 className="absolute inset-0 opacity-80"
                 style={{ 
                   backgroundColor: secondaryColor || "#0B0F19"
                 }}
              />
              {imageUrl && (
                <img 
                  src={imageUrl || undefined}
                  crossOrigin={imageUrl?.startsWith("data:") ? undefined : "anonymous"}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                />
              )}
              
              <div className="relative z-10 w-full max-w-[85%] mx-auto bg-white/10 backdrop-blur-3xl border border-white/20 p-20 rounded-[3rem] shadow-2xl text-center">
                <h2 className={`text-white font-bold leading-[1.1] tracking-tight mb-10 ${(visualData?.headline || fallbackText || "").length > 150 ? "text-[36px]" : (visualData?.headline || fallbackText || "").length > 80 ? "text-[48px]" : "text-[64px]"}`}>
                  {visualData?.headline || fallbackText || "Important Announcement"}
                </h2>
                {visualData?.subtext && (
                  <div className="h-1 w-32 bg-white/30 mx-auto my-12 rounded-full" />
                )}
                {visualData?.subtext && (
                  <p className={`text-gray-300 font-medium leading-relaxed ${(visualData?.subtext || "").length > 150 ? "text-[24px]" : "text-[32px]"}`}>
                    {visualData.subtext}
                  </p>
                )}
              </div>
            </>
          )}

          {/* TEMPLATE 3: Data Bento Grid */}
          {safeVisualType === "data-infographic" && (
            <div className="absolute inset-0 bg-[#F8FAFC] flex flex-col p-20">
              <div className="mb-16 text-center">
                <h2 className={`text-gray-900 font-extrabold tracking-tight ${(visualData?.headline || fallbackText || "").length > 150 ? "text-[42px]" : (visualData?.headline || fallbackText || "").length > 80 ? "text-[56px]" : "text-[72px]"} leading-tight`}>
                  {visualData?.headline || "Industry Benchmarks"}
                </h2>
                {visualData?.subtext && (
                   <p className={`text-gray-500 mt-6 font-medium ${(visualData?.subtext || "").length > 150 ? "text-[24px]" : "text-[32px]"}`}>{visualData.subtext}</p>
                )}
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-10">
                {(visualData?.stats && visualData.stats.length > 0 ? visualData.stats : [
                  { label: "Default Metric A", value: "85%" },
                  { label: "Default Metric B", value: "2.4x" },
                  { label: "Default Metric C", value: "$4M+" },
                  { label: "Default Metric D", value: "99%" }
                ]).slice(0, 4).map((stat, i) => {
                   const bgs = ["bg-blue-100", "bg-orange-100", "bg-purple-100", "bg-emerald-100"];
                   const textColors = ["text-blue-900", "text-orange-900", "text-purple-900", "text-emerald-900"];
                   
                   return (
                     <div key={i} className={cn("rounded-[3rem] p-16 flex flex-col justify-end border-2 border-gray-100 shadow-sm", bgs[i % bgs.length])}>
                       <div className={cn("text-[36px] font-bold mb-4 opacity-80", textColors[i % textColors.length])}>
                          {stat.label}
                       </div>
                       <div className={cn("text-[110px] font-black leading-none", textColors[i % textColors.length])}>
                          {stat.value}
                       </div>
                     </div>
                   );
                })}
              </div>
            </div>
          )}

          {/* TEMPLATE 4: Powerful Quote */}
          {safeVisualType === "powerful-quote" && (
            <div className="absolute inset-0 flex flex-col justify-center items-center p-24 text-center"
                 style={{ backgroundColor: secondaryColor || "#000000" }}
            >
              <div className="text-[140px] text-white/20 mb-10 font-serif leading-none">"</div>
              <h2 className={`text-white font-black leading-[1.1] tracking-tight drop-shadow-md pb-8 ${(visualData?.headline || fallbackText || "").length > 150 ? "text-[42px]" : (visualData?.headline || fallbackText || "").length > 80 ? "text-[56px]" : "text-[72px]"}`}
              >
                {visualData?.headline || fallbackText || "The old way of working is broken beyond repair."}
              </h2>
              <div className="w-32 h-2 mt-16 mb-12" style={{ backgroundColor: primaryColor }} />
              <div className={`text-gray-400 tracking-widest uppercase font-bold ${(visualData?.subtext || "").length > 150 ? "text-[24px]" : "text-[32px]"}`}>{dna?.name || "The Vision"}</div>
            </div>
          )}

          {/* TEMPLATE 5: Custom dynamically generated HTML overlay */}
          {safeVisualType === "custom-overlay" && (
            <>
              {imageUrl && (
                 <img
                   className="absolute inset-0 w-full h-full object-cover" 
                   src={imageUrl || undefined} 
                   crossOrigin={imageUrl?.startsWith("data:") ? undefined : "anonymous"}
                   alt="Background" 
                 />
              )}
              {/* Overlay with dangerouslySetInnerHTML */}
              {visualData?.customHtml ? (
                <div 
                  className="absolute inset-0 w-full h-full mix-blend-normal"
                  dangerouslySetInnerHTML={{ __html: visualData.customHtml }} 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-end p-24 text-center bg-black/60">
                   <h2 className={`text-white font-extrabold leading-[1.1] mb-6 drop-shadow-lg ${(visualData?.headline || fallbackText || "").length > 150 ? "text-[36px]" : (visualData?.headline || fallbackText || "").length > 80 ? "text-[48px]" : "text-[64px]"}`}>
                      {visualData?.headline || fallbackText}
                   </h2>
                   {visualData?.subtext && (
                       <p className={`text-gray-200 font-medium drop-shadow-md ${(visualData?.subtext || "").length > 150 ? "text-[24px]" : "text-[32px]"}`}>
                           {visualData.subtext}
                       </p>
                   )}
                </div>
              )}
            </>
          )}

          {/* Global Logo Overlay */}
          {activeLogo && (() => {
             // Smart non-overlapping logo calculations
             let resolvedTextPos = visualData?.layout?.textPosition || 'bottom';
             if (safeVisualType === 'creative-story') {
               resolvedTextPos = 'bottom';
             } else if (safeVisualType === 'abstract-announcement') {
               resolvedTextPos = 'middle';
             } else if (safeVisualType === 'powerful-quote') {
               resolvedTextPos = 'middle';
             } else if (safeVisualType === 'data-infographic') {
               resolvedTextPos = 'top';
             }

             let resolvedLogoPos = visualData?.layout?.logoPosition;
             if (!resolvedLogoPos) {
               if (resolvedTextPos === 'bottom') {
                 resolvedLogoPos = 'top-right';
               } else if (resolvedTextPos === 'top') {
                 resolvedLogoPos = 'bottom-right';
               } else {
                 resolvedLogoPos = 'bottom-right';
               }
             }

             // Overlap prevention guardrail: if text and logo are both at the bottom or both at the top,
             // push the logo to the opposite vertical side to ensure zero overlap.
             if (resolvedTextPos === 'bottom' && resolvedLogoPos.startsWith('bottom')) {
               resolvedLogoPos = resolvedLogoPos.replace('bottom', 'top');
             } else if (resolvedTextPos === 'top' && resolvedLogoPos.startsWith('top')) {
               resolvedLogoPos = resolvedLogoPos.replace('top', 'bottom');
             }

             // Map to absolute positioning styles for 1080x1080 canvas
             let logoPlacementStyle: React.CSSProperties = { position: 'absolute', bottom: '80px', right: '80px' };
             const pos = resolvedLogoPos;
             if (pos === 'top-left') logoPlacementStyle = { position: 'absolute', top: '80px', left: '80px' };
             if (pos === 'top-center') logoPlacementStyle = { position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)' };
             if (pos === 'top-right') logoPlacementStyle = { position: 'absolute', top: '80px', right: '80px' };
             if (pos === 'middle-left') logoPlacementStyle = { position: 'absolute', top: '50%', left: '80px', transform: 'translateY(-50%)' };
             if (pos === 'center') logoPlacementStyle = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
             if (pos === 'middle-right') logoPlacementStyle = { position: 'absolute', top: '50%', right: '80px', transform: 'translateY(-50%)' };
             if (pos === 'bottom-left') logoPlacementStyle = { position: 'absolute', bottom: '80px', left: '80px' };
             if (pos === 'bottom-center') logoPlacementStyle = { position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)' };
             if (pos === 'bottom-right') logoPlacementStyle = { position: 'absolute', bottom: '80px', right: '80px' };

             return (
               <div style={{ ...logoPlacementStyle, zIndex: 100 }}>
                 <img src={activeLogo || undefined} crossOrigin={activeLogo?.startsWith("data:") ? undefined : "anonymous"} alt="Logo" className="object-contain drop-shadow-2xl" style={{ maxHeight: '70px', maxWidth: '180px' }} />
               </div>
             );
          })()}
        </div>
      </div>

      {/* Visible UI */}
      {isGenerating ? (
        <div className="w-full aspect-square flex flex-col items-center justify-center bg-gray-900 border border-[#7C3AED]/20 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <span className="text-[15px] font-medium text-gray-400">Rendering visual...</span>
        </div>
      ) : mergedImage ? (
        <img src={mergedImage || undefined} alt="Merged visual post" className="w-full h-full object-cover aspect-square" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-gray-900 text-gray-500">
          Failed to generate visual
        </div>
      )}

      {mergedImage && (
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="absolute top-2 right-2 p-2.5 bg-black/70 hover:bg-black backdrop-blur border border-white/10 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-30 flex items-center gap-2 shadow-lg"
          title="Download high-res image"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>  
      )}
    </div>
  );
}
