import { createPortal } from "react-dom";
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { X, Image as ImageIcon, Type, Layout, Check, RotateCcw, Upload, Move, Eye, EyeOff, Layers } from "lucide-react";
import { Stage, Layer, Image as KonvaImage, Text, Rect, Group, Transformer } from "react-konva";
import useImage from "use-image";
import { Creative } from "../types";

const extractColors = (cssStr: string) => {
   if (!cssStr) return [];
   const regex = /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|transparent)/gi;
   const matches = [];
   let match;
   while ((match = regex.exec(cssStr)) !== null) {
      matches.push({
         value: match[0],
         index: match.index
      });
   }
   return matches;
};

const parseColorToHexAndOpacity = (c: string) => {
    if (c === "transparent") return { hex: "#000000", opacity: 0 };
    if (c.startsWith("#")) {
       let hex = c;
       let opacity = 1;
       if (c.length === 9) {
          hex = c.slice(0, 7);
          opacity = parseInt(c.slice(7, 9), 16) / 255;
       } else if (c.length === 5) {
          hex = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
          opacity = parseInt(`${c[4]}${c[4]}`, 16) / 255;
       } else if (c.length === 4) {
          hex = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
       }
       return { hex, opacity };
    }
    if (c.startsWith("rgb")) {
       const parts = c.match(/[\d.]+/g);
       if (parts && parts.length >= 3) {
          const r = parseInt(parts[0]).toString(16).padStart(2, "0");
          const g = parseInt(parts[1]).toString(16).padStart(2, "0");
          const b = parseInt(parts[2]).toString(16).padStart(2, "0");
          const a = parts[3] ? parseFloat(parts[3]) : 1;
          return { hex: `#${r}${g}${b}`, opacity: a };
       }
    }
    return { hex: "#000000", opacity: 1 };
};

const hexAndOpacityToRgba = (hex: string, opacity: number) => {
   const r = parseInt(hex.slice(1, 3), 16) || 0;
   const g = parseInt(hex.slice(3, 5), 16) || 0;
   const b = parseInt(hex.slice(5, 7), 16) || 0;
   return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const normalizeToHexColor = (colorStr: string | null | undefined): string => {
  if (!colorStr) return "#ffffff";
  const str = colorStr.trim().toLowerCase();
  
  const colorNames: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    green: "#00ff00",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    grey: "#808080",
    silver: "#c0c0c0",
    maroon: "#800000",
    olive: "#808000",
    lime: "#00ff00",
    aqua: "#00ffff",
    teal: "#008080",
    navy: "#000080",
    fuchsia: "#ff00ff",
    purple: "#800080",
    orange: "#ffa500",
    transparent: "#ffffff"
  };
  
  if (colorNames[str]) return colorNames[str];
  
  if (str.startsWith("#")) {
    if (str.length === 4) {
      return `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
    }
    if (str.length === 7) {
      return str;
    }
    if (str.length === 9) {
      return str.slice(0, 7);
    }
  }
  
  if (str.startsWith("rgb")) {
    const parts = str.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const r = parseInt(parts[0]).toString(16).padStart(2, "0");
      const g = parseInt(parts[1]).toString(16).padStart(2, "0");
      const b = parseInt(parts[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
  }
  
  return "#ffffff";
};

const extractPixelSize = (sizeStr: string | null | undefined, fallback: number): number => {
  if (!sizeStr) return fallback;
  const cleaned = sizeStr.trim().toLowerCase();
  
  const pxMatch = cleaned.match(/(\d+)px/);
  if (pxMatch) return parseInt(pxMatch[1]);
  
  const remMatch = cleaned.match(/([\d.]+)rem/);
  if (remMatch) return Math.round(parseFloat(remMatch[1]) * 16);
  
  const vwMatch = cleaned.match(/([\d.]+)vw/);
  if (vwMatch) return Math.round(parseFloat(vwMatch[1]) * 10.8);
  
  const numMatch = cleaned.match(/[\d.]+/);
  if (numMatch) return Math.round(parseFloat(numMatch[0]));
  
  return fallback;
};

const getHtmlTextWithLineBreaks = (el: HTMLElement | null): string => {
  if (!el) return "";
  try {
    const tempEl = el.cloneNode(true) as HTMLElement;
    tempEl.querySelectorAll("br").forEach(br => {
      br.replaceWith("\n");
    });
    return (tempEl.textContent || "").trim();
  } catch (e) {
    return (el?.textContent || "").trim();
  }
};

const getHtmlCssVal = (html: string | null | undefined, selector: string, prop: string): string | null => {
  if (!html) return null;
  try {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const el = tempDiv.querySelector(selector) as HTMLElement;
    if (el) {
      const cssText = el.getAttribute("style") || "";
      const rules = cssText.split(";");
      for (const rule of rules) {
        const parts = rule.split(":");
        if (parts.length >= 2 && parts[0].trim().toLowerCase() === prop.toLowerCase()) {
          return parts.slice(1).join(":").trim();
        }
      }
    }
    const root = tempDiv.firstElementChild as HTMLElement;
    if (root) {
      const cssText = root.getAttribute("style") || "";
      const rules = cssText.split(";");
      for (const rule of rules) {
        const parts = rule.split(":");
        if (parts.length >= 2 && parts[0].trim().toLowerCase() === prop.toLowerCase()) {
          return parts.slice(1).join(":").trim();
        }
      }
    }
  } catch (e) {
    console.error("Error parsing style in getHtmlCssVal", e);
  }
  return null;
};

interface VisualEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  originalImageUrl?: string;
  visualData?: any;
  visualType?: string;
  creatives?: Creative[];
  activeLogo?: string;
  onSave: (newImageUrl: string, revertableOriginalUrl: string, newVisualData?: any) => void;
}

const getProxiedImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/") || url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

export function VisualEditorModal({
  isOpen,
  onClose,
  imageUrl,
  originalImageUrl,
  visualData,
  visualType,
  creatives = [],
  activeLogo: rawActiveLogo,
  onSave
}: VisualEditorModalProps) {
  const activeLogo = getProxiedImageUrl(rawActiveLogo);

  // Background
  const initialBaseBg = visualData?.baseImage || originalImageUrl || imageUrl;
  const [baseBg, setBaseBg] = useState<string>(visualData?.editorState?.baseBg || initialBaseBg);

  // Scrim Overlay
  const [scrimHeight, setScrimHeight] = useState(visualData?.editorState?.scrimHeight ?? 80);
  const [scrimOpacity, setScrimOpacity] = useState(visualData?.editorState?.scrimOpacity ?? 0.85);
  const [scrimColor, setScrimColor] = useState(visualData?.editorState?.scrimColor ?? "#000000");

  const [customOverlayBg, setCustomOverlayBg] = useState(() => {
     if (visualData?.editorState?.customOverlayBg) return visualData.editorState.customOverlayBg;
     if (!visualData?.customHtml) return "";
     try {
       const div = document.createElement("div");
       div.innerHTML = visualData.customHtml;
       const root = div.firstElementChild as HTMLElement;
       return root?.style?.background || root?.style?.backgroundColor || "";
     } catch (e) { return ""; }
  });

  // Typography Layer
  const [title, setTitle] = useState(() => {
    if (visualData?.editorState?.title) return visualData.editorState.title;
    if (visualData?.customHtml) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = visualData.customHtml;
      return (tempDiv.querySelector("h1")?.textContent || tempDiv.querySelector("h2")?.textContent || "").trim() || visualData?.headline || "";
    }
    return visualData?.headline || "";
  });
  const [subtitle, setSubtitle] = useState(() => {
    if (visualData?.editorState?.subtitle) return visualData.editorState.subtitle;
    if (visualData?.customHtml) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = visualData.customHtml;
      return (tempDiv.querySelector("p")?.textContent || "").trim() || visualData?.subtext || "";
    }
    return visualData?.subtext || "";
  });

  const [titleSize, setTitleSize] = useState(() => {
     if (visualData?.editorState?.titleSize) return visualData.editorState.titleSize;
     const sizeStr = getHtmlCssVal(visualData?.customHtml, "h1, h2", "font-size");
     return extractPixelSize(sizeStr, 64);
  });
  
  const [subtitleSize, setSubtitleSize] = useState(() => {
     if (visualData?.editorState?.subtitleSize) return visualData.editorState.subtitleSize;
     const sizeStr = getHtmlCssVal(visualData?.customHtml, "p", "font-size");
     return extractPixelSize(sizeStr, 28);
  });

  const [fontFamily, setFontFamily] = useState(() => {
     if (visualData?.editorState?.fontFamily) return visualData.editorState.fontFamily;
     if (visualData?.layout?.fontFamily) return visualData.layout.fontFamily;
     if (visualData?.fonts?.primary) return visualData.fonts.primary.includes(" ") && !visualData.fonts.primary.includes("'") ? `'${visualData.fonts.primary}'` : visualData.fonts.primary;
     return "Inter";
  });
  
  const [titleColor, setTitleColor] = useState(() => {
     if (visualData?.editorState?.titleColor) return visualData.editorState.titleColor;
     const col = getHtmlCssVal(visualData?.customHtml, "h1, h2", "color");
     return normalizeToHexColor(col || visualData?.layout?.titleColor || "#ffffff");
  });
  
  const [subtitleColor, setSubtitleColor] = useState(() => {
     if (visualData?.editorState?.subtitleColor) return visualData.editorState.subtitleColor;
     const col = getHtmlCssVal(visualData?.customHtml, "p", "color");
     return normalizeToHexColor(col || visualData?.layout?.subtitleColor || "#e5e7eb");
  });
  
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(visualData?.editorState?.textAlign || visualData?.layout?.textAlign || "left");
  const [textWidth, setTextWidth] = useState(visualData?.editorState?.textWidth ?? 900);

  const [extraTextBlocks, setExtraTextBlocks] = useState<{ id: number; current: string }[]>(() => {
    if (visualData?.editorState?.extraTextBlocks) return visualData.editorState.extraTextBlocks;
    return [];
  });

  const [showLogo, setShowLogo] = useState(visualData?.editorState?.showLogo ?? true);
  const [logoScale, setLogoScale] = useState(visualData?.editorState?.logoScale ?? 1);

  // Position States
  const [textX, setTextX] = useState(visualData?.editorState?.textX ?? 80);
  const [textY, setTextY] = useState(visualData?.editorState?.textY ?? 680);
  const [logoX, setLogoX] = useState(visualData?.editorState?.logoX ?? 820);
  const [logoY, setLogoY] = useState(visualData?.editorState?.logoY ?? 80);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Background Image
    const initialBaseBg = visualData?.baseImage || originalImageUrl || imageUrl;
    setBaseBg(visualData?.editorState?.baseBg || initialBaseBg || "");

    // Scrim
    setScrimHeight(visualData?.editorState?.scrimHeight ?? 80);
    setScrimOpacity(visualData?.editorState?.scrimOpacity ?? 0.85);
    setScrimColor(visualData?.editorState?.scrimColor ?? "#000000");

    // Copy Content
    setTitle(visualData?.editorState?.title ?? (visualData?.headline || ""));
    setSubtitle(visualData?.editorState?.subtitle ?? (visualData?.subtext || ""));

    // Sizes
    setTitleSize(visualData?.editorState?.titleSize ?? 64);
    setSubtitleSize(visualData?.editorState?.subtitleSize ?? 28);

    // Font family
    let fFamily = "";
    if (visualData?.editorState?.fontFamily) {
      fFamily = visualData.editorState.fontFamily;
    } else if (visualData?.layout?.fontFamily) {
      fFamily = visualData.layout.fontFamily;
    } else if (visualData?.fonts?.primary) {
      fFamily = visualData.fonts.primary.includes(" ") && !visualData.fonts.primary.includes("'") 
        ? `'${visualData.fonts.primary}'` 
        : visualData.fonts.primary;
    } else {
      fFamily = "Inter";
    }
    setFontFamily(fFamily);

    // Colors & Align
    setTitleColor(visualData?.editorState?.titleColor ?? "#ffffff");
    setSubtitleColor(visualData?.editorState?.subtitleColor ?? "#e5e7eb");
    setTextAlign(visualData?.editorState?.textAlign || "left");
    setTextWidth(visualData?.editorState?.textWidth ?? 900);

    // Logo & Visibility
    setShowLogo(visualData?.editorState?.showLogo ?? true);
    setLogoScale(visualData?.editorState?.logoScale ?? 1);

    // Coordinates
    setTextX(visualData?.editorState?.textX ?? 80);
    setTextY(visualData?.editorState?.textY ?? 680);
    setLogoX(visualData?.editorState?.logoX ?? 820);
    setLogoY(visualData?.editorState?.logoY ?? 80);

  }, [isOpen, visualData, imageUrl, activeLogo, originalImageUrl, visualType]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"background" | "scrim" | "typography" | "logo">("typography");
  const [selectedNode, setSelectedNode] = useState<"text" | "logo" | null>(null);
  const [redrawCounter, setRedrawCounter] = useState(0);

  // References
  const stageRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const logoRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const primaryColor = visualData?.visualData?.colors?.[0] || "#4F46E5";
  const secondaryColor = visualData?.visualData?.colors?.[1] || "#111827";

  // Stage resize calculations
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const fitScale = Math.min((width - 40) / 1080, (height - 40) / 1080);
      setScale(fitScale);
    });
    observer.observe(containerRef.current);
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    setScale(Math.min((width - 40) / 1080, (height - 40) / 1080));
    
    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  const fonts = useMemo(() => {
    const list = [
      { name: "Inter", value: "Inter" },
      { name: "Georgia", value: "Georgia" },
      { name: "Arial", value: "Arial" },
      { name: "Verdana", value: "Verdana" }
    ];

    if (visualData?.fonts?.primary) {
      const pFont = visualData.fonts.primary.replace(/["']/g, "");
      if (!list.find(f => f.name === pFont)) {
        list.push({ name: pFont, value: pFont });
      }
    }
    return list;
  }, [visualData?.fonts]);

  // Load custom Google Fonts
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    fonts.forEach(f => {
      if (f.name !== "Inter" && f.name !== "Georgia" && f.name !== "Arial" && f.name !== "Verdana") {
        fontsToLoad.add(f.name);
      }
    });

    if (fontsToLoad.size > 0) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      const families = Array.from(fontsToLoad)
        .map(f => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`)
        .join("&");
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);

      document.fonts.ready.then(() => {
        setRedrawCounter(prev => prev + 1);
      });

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [fonts]);

  // Bind transformer to node selection
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedNode === "text" && textRef.current) {
      trRef.current.nodes([textRef.current]);
    } else if (selectedNode === "logo" && logoRef.current) {
      trRef.current.nodes([logoRef.current]);
    } else {
      trRef.current.nodes([]);
    }
    trRef.current.getLayer().batchDraw();
  }, [selectedNode, redrawCounter]);

  // Load images
  const [bgImage] = useImage(baseBg || "", "anonymous");
  const [logoImage] = useImage(activeLogo || "", "anonymous");

  const handleSave = async () => {
    if (!stageRef.current) return;
    setIsGenerating(true);
    
    // Clear selection so the transformer handles are hidden from the final export
    setSelectedNode(null);
    trRef.current?.nodes([]);
    stageRef.current.getLayer().batchDraw();

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const dataUrl = stageRef.current.toDataURL({ 
         quality: 0.95,
         pixelRatio: 2, // High resolution (2160x2160)
         mimeType: "image/jpeg"
      });
      
      const newVisualData = {
        ...visualData,
        editorState: {
           baseBg,
           scrimHeight,
           scrimOpacity,
           scrimColor,
           title,
           subtitle,
           titleSize,
           subtitleSize,
           fontFamily,
           titleColor,
           subtitleColor,
           textAlign,
           textWidth,
           showLogo,
           logoScale,
           textX,
           textY,
           logoX,
           logoY,
           extraTextBlocks,
           customOverlayBg
        }
      };

      onSave(dataUrl, originalImageUrl || imageUrl, newVisualData);
      onClose();
    } catch (e) {
      console.error("Save error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestore = () => {
    if (originalImageUrl) {
      setBaseBg(originalImageUrl);
      setTitle("");
      setSubtitle("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setBaseBg(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Normalize visualType for layout preview
  let safeVisualType = visualType ? visualType.toLowerCase() : "";
  const validTypes = ["creative-story", "data-infographic", "powerful-quote", "abstract-announcement", "custom-overlay"];
  if (safeVisualType && !validTypes.includes(safeVisualType)) {
    if (safeVisualType.includes("quote")) safeVisualType = "powerful-quote";
    else if (safeVisualType.includes("data") || safeVisualType.includes("info")) safeVisualType = "data-infographic";
    else if (safeVisualType.includes("abstract") || safeVisualType.includes("announce")) safeVisualType = "abstract-announcement";
    else if (safeVisualType.includes("custom")) safeVisualType = "custom-overlay";
    else safeVisualType = "";
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-7xl h-[95vh] flex flex-col rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">
              Visual Editor (Canvas v3)
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Stage Area */}
          <div ref={containerRef} className="flex-1 bg-slate-100 overflow-hidden relative flex flex-col items-center justify-center pattern-dots pattern-slate-300 pattern-bg-slate-50 pattern-opacity-30 pattern-size-4">
             {isGenerating && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C3AED] mx-auto mb-4"></div>
                        <p className="text-white font-medium">Exporting Canvas Layers...</p>
                    </div>
                </div>
             )}
             
             {/* 1080x1080 Stage scaled via scale factor */}
             <div 
               style={{ 
                 width: 1080, 
                 height: 1080, 
                 transform: `scale(${scale})`, 
                 transformOrigin: "center center", 
                 transition: "transform 0.1s ease-out",
                 boxShadow: "0 30px 90px rgba(15, 23, 42, 0.15), 0 10px 30px rgba(15, 23, 42, 0.08)"
               }}
             >
                <Stage 
                  width={1080} 
                  height={1080} 
                  ref={stageRef}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) {
                      setSelectedNode(null);
                    }
                  }}
                >
                  <Layer>
                    {/* Background Rect */}
                    <Rect x={0} y={0} width={1080} height={1080} fill="#000000" />

                    {/* Template Rendering Core */}
                    {safeVisualType === "creative-story" && (
                      <>
                        {bgImage && (
                          <KonvaImage image={bgImage} x={0} y={0} width={1080} height={1080} />
                        )}
                        <Rect x={0} y={0} width={1080} height={1080} fill="rgba(0,0,0,0.6)" />
                      </>
                    )}

                    {safeVisualType === "abstract-announcement" && (
                      <>
                        <Rect x={0} y={0} width={1080} height={1080} fill={secondaryColor || "#0B0F19"} />
                        {bgImage && (
                          <KonvaImage image={bgImage} x={0} y={0} width={1080} height={1080} opacity={0.3} />
                        )}
                        {/* Rounded center overlay */}
                        <Rect
                          x={140}
                          y={240}
                          width={800}
                          height={600}
                          fill="rgba(255,255,255,0.08)"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth={2}
                          cornerRadius={48}
                          listening={false}
                        />
                      </>
                    )}

                    {safeVisualType === "data-infographic" && (
                      <>
                        <Rect x={0} y={0} width={1080} height={1080} fill="#F8FAFC" />
                        {/* Static stats cards inside canvas background */}
                        {(() => {
                          const items = (visualData?.stats && visualData.stats.length > 0 ? visualData.stats : [
                            { label: "Default Metric A", value: "85%" },
                            { label: "Default Metric B", value: "2.4x" },
                            { label: "Default Metric C", value: "$4M+" },
                            { label: "Default Metric D", value: "99%" }
                          ]).slice(0, 4);

                          const cardBgs = ["#EFF6FF", "#FFF7ED", "#FAF5FF", "#ECFDF5"];
                          const textColors = ["#1E40AF", "#9A3412", "#6B21A8", "#065F46"];
                          const coords = [
                            { x: 80, y: 350 },
                            { x: 560, y: 350 },
                            { x: 80, y: 680 },
                            { x: 560, y: 680 }
                          ];

                          return items.map((stat, i) => {
                            const pos = coords[i];
                            return (
                              <Group key={i}>
                                <Rect
                                  x={pos.x}
                                  y={pos.y}
                                  width={440}
                                  height={260}
                                  fill={cardBgs[i % cardBgs.length]}
                                  cornerRadius={32}
                                  stroke="#E2E8F0"
                                  strokeWidth={1}
                                  listening={false}
                                />
                                <Text
                                  x={pos.x + 40}
                                  y={pos.y + 40}
                                  text={stat.label}
                                  fontFamily={fontFamily}
                                  fontSize={28}
                                  fill={textColors[i % textColors.length]}
                                  fontStyle="bold"
                                  opacity={0.8}
                                  listening={false}
                                />
                                <Text
                                  x={pos.x + 40}
                                  y={pos.y + 110}
                                  text={stat.value}
                                  fontFamily={fontFamily}
                                  fontSize={84}
                                  fill={textColors[i % textColors.length]}
                                  fontStyle="900"
                                  listening={false}
                                />
                              </Group>
                            );
                          });
                        })()}
                      </>
                    )}

                    {safeVisualType === "powerful-quote" && (
                      <>
                        <Rect x={0} y={0} width={1080} height={1080} fill={secondaryColor || "#000000"} />
                        <Text
                          x={80}
                          y={120}
                          width={920}
                          text={'"'}
                          fontFamily="Georgia, serif"
                          fontSize={160}
                          fill="rgba(255,255,255,0.15)"
                          align="center"
                          listening={false}
                        />
                        <Rect
                          x={490}
                          y={580}
                          width={100}
                          height={8}
                          fill={primaryColor}
                          listening={false}
                        />
                      </>
                    )}

                    {safeVisualType === "custom-overlay" && (
                      <>
                        {bgImage && (
                          <KonvaImage image={bgImage} x={0} y={0} width={1080} height={1080} />
                        )}
                      </>
                    )}

                    {/* Gradient Scrim Overlay */}
                    <Rect
                      x={0}
                      y={1080 - (1080 * (scrimHeight / 100))}
                      width={1080}
                      height={1080 * (scrimHeight / 100)}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{ x: 0, y: 1080 * (scrimHeight / 100) }}
                      fillLinearGradientColorStops={[
                        0, "rgba(0,0,0,0)", 
                        1, hexAndOpacityToRgba(scrimColor, scrimOpacity)
                      ]}
                      listening={false}
                    />

                    {/* Draggable Logo */}
                    {showLogo && logoImage && (
                      <KonvaImage
                        ref={logoRef}
                        image={logoImage}
                        x={logoX}
                        y={logoY}
                        width={180 * logoScale}
                        height={70 * logoScale}
                        draggable
                        onClick={() => setSelectedNode("logo")}
                        onTap={() => setSelectedNode("logo")}
                        onDragEnd={(e) => {
                          setLogoX(e.target.x());
                          setLogoY(e.target.y());
                        }}
                        sceneFunc={(context, shape) => {
                          const img = (shape as any).image();
                          if (img) {
                            const ratio = img.width / img.height;
                            const w = Math.min(180 * logoScale, 70 * logoScale * ratio);
                            const h = Math.min(70 * logoScale, (180 * logoScale) / ratio);
                            context.drawImage(img, 0, 0, w, h);
                          }
                        }}
                      />
                    )}

                    {/* Draggable wrapped typography layer */}
                    <Group
                      x={textX}
                      y={textY}
                      draggable
                      ref={textRef}
                      onClick={() => setSelectedNode("text")}
                      onTap={() => setSelectedNode("text")}
                      onDragEnd={(e) => {
                        setTextX(e.target.x());
                        setTextY(e.target.y());
                      }}
                    >
                      {title && (
                        <Text
                          text={title}
                          width={textWidth}
                          fontSize={titleSize}
                          fill={titleColor}
                          fontFamily={fontFamily}
                          fontStyle="900"
                          align={textAlign}
                          lineHeight={1.15}
                        />
                      )}
                      {subtitle && (
                        <Text
                          text={subtitle}
                          y={title ? titleSize + 24 : 0}
                          width={textWidth}
                          fontSize={subtitleSize}
                          fill={subtitleColor}
                          fontFamily={fontFamily}
                          fontStyle="normal"
                          align={textAlign}
                          lineHeight={1.4}
                        />
                      )}
                    </Group>

                    {/* Interactive Transformer Layer */}
                    <Transformer
                      ref={trRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 50 || newBox.height < 50) return oldBox;
                        return newBox;
                      }}
                    />
                  </Layer>
                </Stage>
             </div>
             
             {/* Info overlay */}
             <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white/80 font-medium">
                 <Move className="w-3.5 h-3.5 text-[#7C3AED]" />
                 Click text or logo to resize. Drag elements freely.
             </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-96 bg-slate-50 border-l border-slate-100 flex flex-col overflow-hidden max-h-[40vh] md:max-h-none z-10">
            <div className="flex border-b border-slate-200/80 overflow-x-auto bg-slate-100/40">
              <button onClick={() => setActiveTab("typography")} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === "typography" ? "border-[#7C3AED] text-[#7C3AED] font-semibold bg-white" : "border-transparent text-slate-505 hover:text-slate-800 hover:bg-slate-100/50"}`}>
                  <Type className="w-3.5 h-3.5" /> Text
              </button>
              <button onClick={() => setActiveTab("logo")} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === "logo" ? "border-[#7C3AED] text-[#7C3AED] font-semibold bg-white" : "border-transparent text-slate-505 hover:text-slate-800 hover:bg-slate-100/50"}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Logo
              </button>
              <button onClick={() => setActiveTab("scrim")} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === "scrim" ? "border-[#7C3AED] text-[#7C3AED] font-semibold bg-white" : "border-transparent text-slate-505 hover:text-slate-800 hover:bg-slate-100/50"}`}>
                  <Layers className="w-3.5 h-3.5" /> Scrim
              </button>
              <button onClick={() => setActiveTab("background")} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === "background" ? "border-[#7C3AED] text-[#7C3AED] font-semibold bg-white" : "border-transparent text-slate-505 hover:text-slate-800 hover:bg-slate-100/50"}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Bg
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Typography */}
              {activeTab === "typography" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content</label>
                    <textarea 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 h-20 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none placeholder-slate-400 shadow-sm"
                      placeholder="Headline text..."
                    />
                    <textarea 
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 h-20 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none placeholder-slate-400 shadow-sm"
                      placeholder="Subtext / paragraph..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between items-center">
                       <span>Typography Base</span>
                       <div className="flex bg-slate-200/60 rounded-md p-1 border border-slate-300/40">
                          {(["left", "center", "right"] as const).map(align => (
                            <button
                              key={align}
                              onClick={() => setTextAlign(align)}
                              className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded font-medium ${textAlign === align ? "bg-[#7C3AED] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                            >
                              {align}
                            </button>
                          ))}
                       </div>
                    </label>
                    <select 
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-[#7C3AED] shadow-sm"
                    >
                      {fonts.map(f => (
                         <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                     <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Headline Size</div>
                          <div className="flex items-center gap-2">
                              <input type="number" min="10" max="250" value={titleSize} onChange={(e) => setTitleSize(parseInt(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-slate-800 text-right font-semibold" />
                              <span className="text-xs text-slate-400 font-semibold">px</span>
                              <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0 ml-1" />
                          </div>
                       </div>
                       <input type="range" min="32" max="150" value={titleSize} onChange={(e) => setTitleSize(parseInt(e.target.value))} className="w-full accent-[#7C3AED]" />
                     </div>

                     <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Subtitle Size</div>
                          <div className="flex items-center gap-2">
                              <input type="number" min="10" max="150" value={subtitleSize} onChange={(e) => setSubtitleSize(parseInt(e.target.value))} className="w-16 bg-slate-50 border border-slate-205 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                              <span className="text-xs text-slate-404 font-semibold">px</span>
                              <input type="color" value={subtitleColor.startsWith("rgba") ? "#ffffff" : subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0 ml-1" />
                          </div>
                       </div>
                       <input type="range" min="16" max="64" value={subtitleSize} onChange={(e) => setSubtitleSize(parseInt(e.target.value))} className="w-full accent-[#7C3AED]" />
                     </div>
                     
                     <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Constraint Width</div>
                          <div className="flex items-center gap-2">
                              <input type="number" min="100" max="1080" value={textWidth} onChange={(e) => setTextWidth(parseInt(e.target.value))} className="w-16 bg-slate-50 border border-slate-205 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                              <span className="text-xs text-slate-404 font-semibold">px</span>
                          </div>
                       </div>
                       <input type="range" min="300" max="1000" step="10" value={textWidth} onChange={(e) => setTextWidth(parseInt(e.target.value))} className="w-full accent-[#7C3AED]" />
                     </div>
                  </div>
                </div>
              )}

              {/* Logo */}
              {activeTab === "logo" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {!activeLogo ? (
                     <div className="text-sm text-slate-500 bg-slate-100 p-4 rounded-lg border border-slate-200 font-sans">No logo applied. Upload logo in DNA settings.</div>
                  ) : (
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                           <span className="text-sm font-semibold text-slate-700">Logo Visibility</span>
                           <button 
                             onClick={() => setShowLogo(!showLogo)} 
                             className={`p-2 rounded-full ${showLogo ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-500"} transition-colors`}
                           >
                              {showLogo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                           </button>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center">
                             <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Logo Scale</div>
                             <div className="flex items-center gap-2">
                                 <input type="number" min="0.1" max="5" step="0.1" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-16 bg-slate-50 border border-slate-202 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                                 <span className="text-xs text-slate-404 font-semibold">x</span>
                             </div>
                          </div>
                          <input type="range" min="0.2" max="3" step="0.1" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-full accent-[#7C3AED]" />
                        </div>
                     </div>
                  )}
                </div>
              )}

              {/* Scrim Overlay */}
              {activeTab === "scrim" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Base Color</div>
                       <input type="color" value={scrimColor} onChange={(e) => setScrimColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Darkness (Opacity)</div>
                       <div className="flex items-center gap-2">
                           <input type="number" min="0" max="100" value={Math.round(scrimOpacity * 100)} onChange={(e) => setScrimOpacity(parseInt(e.target.value) / 100)} className="w-16 bg-slate-50 border border-slate-205 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                           <span className="text-xs text-slate-404 font-semibold">%</span>
                       </div>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={scrimOpacity} onChange={(e) => setScrimOpacity(parseFloat(e.target.value))} className="w-full accent-[#7C3AED]" />
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Scrim Height</div>
                       <div className="flex items-center gap-2">
                           <input type="number" min="0" max="100" value={Math.round(scrimHeight)} onChange={(e) => setScrimHeight(parseInt(e.target.value))} className="w-16 bg-slate-50 border border-slate-205 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                           <span className="text-xs text-slate-404 font-semibold">%</span>
                       </div>
                    </div>
                    <input type="range" min="10" max="100" step="5" value={scrimHeight} onChange={(e) => setScrimHeight(parseInt(e.target.value))} className="w-full accent-[#7C3AED]" />
                  </div>
                </div>
              )}

              {/* Background */}
              {activeTab === "background" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <label className="flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold py-3 px-4 rounded-xl cursor-pointer transition-colors shadow-lg shadow-[#7C3AED]/15 hover:shadow-[#7C3AED]/30">
                     <Upload className="w-4 h-4" />
                     Upload New Image
                     <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>

                  {creatives.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-505 uppercase tracking-widest mb-2">From Campaign</div>
                      <div className="grid grid-cols-2 gap-3">
                        {creatives.map((c, i) => (
                          <button 
                            key={i} 
                            onClick={() => setBaseBg(c.url)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 ${baseBg === c.url ? "border-[#7C3AED] shadow-md shadow-[#7C3AED]/15" : "border-slate-100 hover:border-[#7C3AED]/30"}`}
                          >
                            <img referrerPolicy="no-referrer" src={c.url || undefined} className="w-full h-full object-cover" alt="Creative" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center z-20 sticky bottom-0">
           <button 
             onClick={handleRestore}
             disabled={!originalImageUrl}
             className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40 font-semibold"
           >
             <RotateCcw className="w-4 h-4" /> Discard Changes
           </button>
           
           <div className="flex items-center gap-3 relative">
              <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-505 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-[#7C3AED]/15 hover:shadow-[#7C3AED]/30 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Exporting...</>
                ) : (
                    <><Check className="w-4 h-4" /> Save Export</>
                )}
              </button>
           </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
