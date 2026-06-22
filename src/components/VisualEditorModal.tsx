import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { X, Image as ImageIcon, Type, Layout, Check, RotateCcw, Upload, Move, Eye, EyeOff, Layers } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { motion, useMotionValue } from 'framer-motion';
import { Creative } from '../types';

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
    if (c === 'transparent') return { hex: '#000000', opacity: 0 };
    if (c.startsWith('#')) {
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
    if (c.startsWith('rgb')) {
       const parts = c.match(/[\d.]+/g);
       if (parts && parts.length >= 3) {
          const r = parseInt(parts[0]).toString(16).padStart(2, '0');
          const g = parseInt(parts[1]).toString(16).padStart(2, '0');
          const b = parseInt(parts[2]).toString(16).padStart(2, '0');
          const a = parts[3] ? parseFloat(parts[3]) : 1;
          return { hex: `#${r}${g}${b}`, opacity: a };
       }
    }
    return { hex: '#000000', opacity: 1 };
};

const hexAndOpacityToRgba = (hex: string, opacity: number) => {
   const r = parseInt(hex.slice(1, 3), 16) || 0;
   const g = parseInt(hex.slice(3, 5), 16) || 0;
   const b = parseInt(hex.slice(5, 7), 16) || 0;
   return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

interface VisualEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  originalImageUrl?: string;
  visualData?: any;
  creatives?: Creative[];
  activeLogo?: string;
  onSave: (newImageUrl: string, revertableOriginalUrl: string, newVisualData?: any) => void;
}

export function VisualEditorModal({
  isOpen,
  onClose,
  imageUrl,
  originalImageUrl,
  visualData,
  creatives = [],
  activeLogo,
  onSave
}: VisualEditorModalProps) {
  // --- Layers State ---
  
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
       const div = document.createElement('div');
       div.innerHTML = visualData.customHtml;
       const root = div.firstElementChild as HTMLElement;
       return root?.style?.background || root?.style?.backgroundColor || "";
     } catch (e) { return ""; }
  });

  // Typography Layer
  const [title, setTitle] = useState(() => {
    if (visualData?.editorState?.title) return visualData.editorState.title;
    if (visualData?.customHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = visualData.customHtml;
      return (tempDiv.querySelector('h1')?.textContent || tempDiv.querySelector('h2')?.textContent || '').trim() || visualData?.headline || "";
    }
    return visualData?.headline || "";
  });
  const [subtitle, setSubtitle] = useState(() => {
    if (visualData?.editorState?.subtitle) return visualData.editorState.subtitle;
    if (visualData?.customHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = visualData.customHtml;
      return (tempDiv.querySelector('p')?.textContent || '').trim() || visualData?.subtext || "";
    }
    return visualData?.subtext || "";
  });

  const [customTitleStyles, setCustomTitleStyles] = useState<React.CSSProperties>(visualData?.editorState?.customTitleStyles || {});
  const [customSubtitleStyles, setCustomSubtitleStyles] = useState<React.CSSProperties>(visualData?.editorState?.customSubtitleStyles || {});

  useEffect(() => {
    if (!visualData?.editorState?.customTitleStyles && visualData?.customHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = visualData.customHtml;
      
      const parseStyle = (el: HTMLElement | null): React.CSSProperties => {
        if (!el) return {};
        const res: any = {};
        const cssText = el.getAttribute('style') || '';
        cssText.split(';').forEach(rule => {
          const [key, ...val] = rule.split(':');
          if (key && val.length > 0) {
            const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (camelKey && !['position', 'inset', 'top', 'bottom', 'left', 'right', 'fontSize', 'color', 'margin', 'marginBottom'].includes(camelKey)) {
              res[camelKey] = val.join(':').trim();
            }
          }
        });
        return res;
      };

      const h1 = tempDiv.querySelector('h1') || tempDiv.querySelector('h2');
      if (h1) setCustomTitleStyles(parseStyle(h1));
      const p = tempDiv.querySelector('p');
      if (p) setCustomSubtitleStyles(parseStyle(p));
    }
  }, [visualData]);

  // Try to parse initial color and size from HTML, else fallback to defaults
  const getHtmlCssVal = (selector: string, prop: string) => {
      if (!visualData?.customHtml) return null;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = visualData.customHtml;
      const el = tempDiv.querySelector(selector) as HTMLElement;
      if (!el) return null;
      const cssText = el.getAttribute('style') || '';
      const rule = cssText.split(';').find(r => r.trim().startsWith(prop + ':'));
      if (rule) return rule.split(':')[1].trim();
      return null;
  }

  const [titleSize, setTitleSize] = useState(() => {
     if (visualData?.editorState?.titleSize) return visualData.editorState.titleSize;
     const sizeStr = getHtmlCssVal('h1, h2', 'font-size');
     if (sizeStr && sizeStr.endsWith('px')) return parseInt(sizeStr);
     return 72;
  });
  
  const [subtitleSize, setSubtitleSize] = useState(() => {
     if (visualData?.editorState?.subtitleSize) return visualData.editorState.subtitleSize;
     const sizeStr = getHtmlCssVal('p', 'font-size');
     if (sizeStr && sizeStr.endsWith('px')) return parseInt(sizeStr);
     return 32;
  });

  const [fontFamily, setFontFamily] = useState(() => {
     if (visualData?.editorState?.fontFamily) return visualData.editorState.fontFamily;
     if (visualData?.layout?.fontFamily) return visualData.layout.fontFamily;
     if (visualData?.fonts?.primary) return visualData.fonts.primary.includes(' ') && !visualData.fonts.primary.includes("'") ? `'${visualData.fonts.primary}', sans-serif` : `${visualData.fonts.primary}, sans-serif`;
     return "'Inter', system-ui, sans-serif";
  });
  
  const [titleColor, setTitleColor] = useState(() => {
     if (visualData?.editorState?.titleColor) return visualData.editorState.titleColor;
     const col = getHtmlCssVal('h1, h2', 'color');
     if (col && col.startsWith('#') && col.length === 7) return col;
     return visualData?.layout?.titleColor || "#ffffff";
  });
  
  const [subtitleColor, setSubtitleColor] = useState(() => {
     if (visualData?.editorState?.subtitleColor) return visualData.editorState.subtitleColor;
     const col = getHtmlCssVal('p', 'color');
     if (col && col.startsWith('#') && col.length === 7) return col;
     return visualData?.layout?.subtitleColor || "#e5e7eb";
  });
  
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(visualData?.editorState?.textAlign || visualData?.layout?.textAlign || "left");
  const [textWidth, setTextWidth] = useState(visualData?.editorState?.textWidth ?? 900);

  const [extraTextBlocks, setExtraTextBlocks] = useState<{ id: number; current: string }[]>(() => {
    if (visualData?.editorState?.extraTextBlocks) return visualData.editorState.extraTextBlocks;
    if (!visualData?.customHtml) return [];
    
    try {
      const div = document.createElement('div');
      div.innerHTML = visualData.customHtml;
      const blocks: { id: number; current: string }[] = [];
      let idx = 0;
      
      const h1 = div.querySelector('h1') || div.querySelector('h2');
      const pColl = div.querySelectorAll('p');
      const lastP = pColl.length > 0 ? pColl[pColl.length - 1] : null; 

      const walk = (node: Node) => {
         // skip the nodes we already handle
         if (node === h1 || node === lastP) {
             idx++;
             return; // we skip deep traversal of these to avoid duplicates, but increment index just in case we need stable IDs
         }
         
         if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            blocks.push({ id: idx, current: node.textContent.trim() });
            idx++;
         } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
               el.childNodes.forEach(walk);
            }
         }
      };
      
      div.childNodes.forEach(walk);
      return blocks;
    } catch(e) {
      return [];
    }
  });

  const patchedHtml = useMemo(() => {
    if (!visualData?.customHtml) return null;
    try {
      const div = document.createElement('div');
      div.innerHTML = visualData.customHtml;
      
      const h1 = div.querySelector('h1') || div.querySelector('h2');
      if (h1 && title) {
        h1.textContent = title;
        h1.style.fontSize = `${titleSize}px`;
        h1.style.color = titleColor;
        h1.style.fontFamily = fontFamily;
        if (textAlign) h1.style.textAlign = textAlign;
      }

      const pColl = div.querySelectorAll('p');
      const lastP = pColl.length > 0 ? pColl[pColl.length - 1] : null; 
      if (lastP && subtitle) {
        lastP.textContent = subtitle;
        lastP.style.fontSize = `${subtitleSize}px`;
        lastP.style.color = subtitleColor;
        lastP.style.fontFamily = fontFamily;
        if (textAlign) lastP.style.textAlign = textAlign;
      }
      
      let idx = 0;
      const walk = (node: Node) => {
         if (node === h1 || node === lastP) {
             idx++;
             return;
         }
         
         if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            const block = extraTextBlocks.find(b => b.id === idx);
            if (block) {
                node.textContent = block.current;
            }
            idx++;
         } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
               el.childNodes.forEach(walk);
            }
         }
      };
      div.childNodes.forEach(walk);
      
      // If we use patchedHtml inside the motion.div, we should remove absolute positioning on the root 
      // so it flows dynamically within the motion.div's layout limits and moves as we drag.
      const root = div.firstElementChild as HTMLElement;
      if (root) {
        root.style.position = 'relative';
        root.style.inset = 'auto';
        root.style.top = 'auto';
        root.style.left = 'auto';
        root.style.bottom = 'auto';
        root.style.right = 'auto';
        root.style.width = 'auto';
        root.style.height = 'auto';
        root.style.padding = '0px';
        root.style.margin = '0px';
        root.style.background = 'transparent';
        root.style.backgroundColor = 'transparent';
        if (root.style.justifyContent) {
           root.style.justifyContent = 'flex-start';
        }
      }

      return div.innerHTML;
    } catch(e) {
      return visualData.customHtml;
    }
  }, [visualData, title, titleSize, titleColor, fontFamily, textAlign, subtitle, subtitleSize, subtitleColor, extraTextBlocks]);

  const [showLogo, setShowLogo] = useState(visualData?.editorState?.showLogo ?? true);
  const [logoScale, setLogoScale] = useState(visualData?.editorState?.logoScale ?? 1);
  const textX = useMotionValue(visualData?.editorState?.textX ?? 90);
  const textY = useMotionValue(visualData?.editorState?.textY ?? 700);

  // Smart non-overlapping initial drag coordinates
  const getSmartInitialLogoX = () => {
    if (visualData?.editorState?.logoX !== undefined) return visualData.editorState.logoX;
    
    // Check if layout positions are declared
    let resolvedTextPos = visualData?.layout?.textPosition || 'bottom';
    let resolvedLogoPos = visualData?.layout?.logoPosition;
    if (!resolvedLogoPos) {
      resolvedLogoPos = resolvedTextPos === 'bottom' ? 'top-right' : 'bottom-right';
    }
    if (resolvedTextPos === 'bottom' && resolvedLogoPos.startsWith('bottom')) {
      resolvedLogoPos = resolvedLogoPos.replace('bottom', 'top');
    }
    
    // Map X coordinate
    if (resolvedLogoPos.endsWith('left')) return 90;
    if (resolvedLogoPos.endsWith('center') || resolvedLogoPos === 'center') return 490;
    return 800; // default right side
  };

  const getSmartInitialLogoY = () => {
    if (visualData?.editorState?.logoY !== undefined) return visualData.editorState.logoY;
    
    // Check if layout positions are declared
    let resolvedTextPos = visualData?.layout?.textPosition || 'bottom';
    let resolvedLogoPos = visualData?.layout?.logoPosition;
    if (!resolvedLogoPos) {
      resolvedLogoPos = resolvedTextPos === 'bottom' ? 'top-right' : 'bottom-right';
    }
    if (resolvedTextPos === 'bottom' && resolvedLogoPos.startsWith('bottom')) {
      resolvedLogoPos = resolvedLogoPos.replace('bottom', 'top');
    }
    
    // Map Y coordinate
    if (resolvedLogoPos.startsWith('top')) return 80;
    if (resolvedLogoPos.startsWith('middle') || resolvedLogoPos === 'center') return 490;
    return 880; // default bottom side
  };

  const logoX = useMotionValue(getSmartInitialLogoX());
  const logoY = useMotionValue(getSmartInitialLogoY());

  // Overall State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"background" | "scrim" | "typography" | "logo">("typography");
  
  // Stage Scaling
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const fitScale = Math.min((width - 40) / 1080, (height - 40) / 1080);
      setScale(fitScale);
    });
    observer.observe(containerRef.current);
    
    // Initial scale
    const { width, height } = containerRef.current.getBoundingClientRect();
    setScale(Math.min((width - 40) / 1080, (height - 40) / 1080));
    
    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const fonts = useMemo(() => {
    const list = [
      { name: 'Inter', value: "'Inter', system-ui, sans-serif" },
      { name: 'System Default', value: 'system-ui, sans-serif' },
      { name: 'Playfair Display', value: "'Playfair Display', serif" },
      { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" }
    ];

    if (visualData?.fonts?.primary) {
      const pFont = visualData.fonts.primary.replace(/["']/g, '');
      if (!list.find(f => f.name === pFont)) {
        list.push({ name: pFont, value: `'${pFont}', sans-serif` });
      }
    }
    if (visualData?.fonts?.secondary) {
      const sFont = visualData.fonts.secondary.replace(/["']/g, '');
      if (!list.find(f => f.name === sFont)) {
        list.push({ name: sFont, value: `'${sFont}', serif` });
      }
    }

    if (fontFamily && !list.find(f => f.value === fontFamily)) {
        const extracted = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        list.push({ name: extracted || 'Custom Font', value: fontFamily });
    }
    
    return list;
  }, [visualData?.fonts, fontFamily]);

  // Load custom fonts into DOM
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    fonts.forEach(f => {
      const fn = f.name.replace(/["']/g, '').trim();
      if (fn && fn !== 'System Default' && fn !== 'Custom Font') {
        fontsToLoad.add(fn);
      }
    });

    if (fontsToLoad.size > 0) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      const families = Array.from(fontsToLoad)
        .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800;900`)
        .join('&');
      link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [fonts]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!stageRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toJpeg(stageRef.current, { 
        quality: 0.95, 
        canvasWidth: 1080, 
        canvasHeight: 1080,
        pixelRatio: 1
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
           textX: textX.get(),
           textY: textY.get(),
           logoX: logoX.get(),
           logoY: logoY.get(),
           customTitleStyles,
           customSubtitleStyles,
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



  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-7xl h-[95vh] flex flex-col rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">
              Visual Editor (v2)
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          {/* Main Interactive Stage */}
          <div ref={containerRef} className="flex-1 bg-slate-100 overflow-hidden relative flex flex-col items-center justify-center pattern-dots pattern-slate-300 pattern-bg-slate-50 pattern-opacity-30 pattern-size-4">
             {isGenerating && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7C3AED] mx-auto mb-4"></div>
                        <p className="text-white font-medium">Exporting Canvas...</p>
                    </div>
                </div>
             )}
             
             {/* The 1080x1080 Canvas Wrapper scaled to fit */}
             <div 
               style={{ 
                 width: 1080, 
                 height: 1080, 
                 transform: `scale(${scale})`, 
                 transformOrigin: 'center center', 
                 transition: 'transform 0.1s ease-out',
                 boxShadow: '0 30px 90px rgba(15, 23, 42, 0.15), 0 10px 30px rgba(15, 23, 42, 0.08)'
               }}
             >
                {/* The Actual Stage passed to html-to-image */}
                <div 
                  ref={stageRef} 
                  style={{ width: 1080, height: 1080, position: 'relative', overflow: 'hidden', background: '#000', fontFamily }}
                >
                  {/* Background Layer */}
                  {baseBg && (
                    <img 
                      src={baseBg} 
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} 
                      crossOrigin="anonymous" 
                      alt="bg" 
                    />
                  )}
                  
                  {/* Scrim Overlay */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      height: `${scrimHeight}%`, 
                      background: `rgba(${parseInt(scrimColor.slice(1,3), 16) || 0},${parseInt(scrimColor.slice(3,5), 16) || 0},${parseInt(scrimColor.slice(5,7), 16) || 0},${scrimOpacity})`, 
                      zIndex: 1,
                      pointerEvents: 'none'
                    }} 
                  />

                  {/* Custom HTML Extracted Background */}
                  {customOverlayBg && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        inset: 0,
                        background: customOverlayBg,
                        zIndex: 2,
                        pointerEvents: 'none'
                      }} 
                    />
                  )}

                  {/* Typography Layer (Draggable) */}
                  <motion.div
                    drag
                    dragMomentum={false}
                    style={{ 
                      x: textX,
                      y: textY,
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      zIndex: 10, 
                      width: textWidth, 
                      cursor: 'move', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
                      textAlign
                    }}
                  >
                    {patchedHtml ? (
                      <div 
                        style={{ width: '100%', position: 'relative', pointerEvents: 'none' }}
                        dangerouslySetInnerHTML={{ __html: patchedHtml }}
                      />
                    ) : (
                      <>
                        {title && (
                          <h1 style={{ 
                            ...customTitleStyles,
                            fontSize: `${titleSize}px`, 
                            color: titleColor, 
                            fontWeight: customTitleStyles.fontWeight || 800, 
                            lineHeight: customTitleStyles.lineHeight || 1.15, 
                            margin: 0, 
                            marginBottom: subtitle ? '24px' : '0',
                            textShadow: customTitleStyles.textShadow || '0 8px 32px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)',
                            width: '100%',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {title}
                          </h1>
                        )}
                        {subtitle && (
                          <p style={{ 
                            ...customSubtitleStyles,
                            fontSize: `${subtitleSize}px`, 
                            color: subtitleColor, 
                            fontWeight: customSubtitleStyles.fontWeight || 500, 
                            lineHeight: customSubtitleStyles.lineHeight || 1.4, 
                            margin: 0,
                            textShadow: customSubtitleStyles.textShadow || '0 2px 8px rgba(0,0,0,0.8)',
                            width: '100%',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {subtitle}
                          </p>
                        )}
                      </>
                    )}
                  </motion.div>

                  {/* Logo Layer (Draggable) */}
                  {showLogo && activeLogo && (
                    <motion.div
                      drag
                      dragMomentum={false}
                      style={{ x: logoX, y: logoY, position: 'absolute', top: 0, left: 0, zIndex: 20, cursor: 'move' }}
                    >
                      <img 
                        src={activeLogo} 
                        crossOrigin="anonymous"
                        style={{ 
                          maxWidth: 300, 
                          maxHeight: 150, 
                          transform: `scale(${logoScale})`, 
                          transformOrigin: 'center center', 
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                          pointerEvents: 'none' // allow dragging div seamlessly
                        }} 
                        alt="Logo" 
                      />
                    </motion.div>
                  )}
                </div>
             </div>
             
             {/* Interaction Hint Overlay */}
             <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white/80 font-medium">
                 <Move className="w-3.5 h-3.5 text-[#7C3AED]" />
                 Drag Text & Logo directly on the canvas
             </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-96 bg-slate-50 border-l border-slate-100 flex flex-col overflow-hidden max-h-[40vh] md:max-h-none z-10">
            {/* Layer Tabs */}
            <div className="flex border-b border-slate-200/80 overflow-x-auto bg-slate-100/40">
              <button onClick={() => setActiveTab('typography')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === 'typography' ? 'border-[#7C3AED] text-[#7C3AED] font-semibold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
                  <Type className="w-3.5 h-3.5" /> Text
              </button>
              <button onClick={() => setActiveTab('logo')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === 'logo' ? 'border-[#7C3AED] text-[#7C3AED] font-semibold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Logo
              </button>
              <button onClick={() => setActiveTab('scrim')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === 'scrim' ? 'border-[#7C3AED] text-[#7C3AED] font-semibold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
                  <Layers className="w-3.5 h-3.5" /> Scrim
              </button>
              <button onClick={() => setActiveTab('background')} className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 gap-1.5 flex items-center justify-center transition-colors ${activeTab === 'background' ? 'border-[#7C3AED] text-[#7C3AED] font-semibold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Bg
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TYPOGRAPHY TAB */}
              {activeTab === 'typography' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content</label>
                    <input 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white border border-slate-205 rounded-lg p-3 text-sm text-slate-805 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none placeholder-slate-400 shadow-sm"
                      placeholder="Headline text..."
                    />
                    <textarea 
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full bg-white border border-slate-205 rounded-lg p-3 text-sm text-slate-805 h-20 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none placeholder-slate-400 shadow-sm"
                      placeholder="Subtext / paragraph..."
                    />
                    
                    {extraTextBlocks.map(block => (
                      <textarea
                        key={block.id}
                        value={block.current}
                        onChange={(e) => setExtraTextBlocks(prev => prev.map(b => b.id === block.id ? { ...b, current: e.target.value } : b))}
                        className="w-full bg-white border border-[#7C3AED]/30 rounded-lg p-3 text-sm text-slate-805 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none resize-none shadow-sm"
                        placeholder="Additional text..."
                        rows={2}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between items-center">
                       <span>Typography Base</span>
                       <div className="flex bg-slate-200/60 rounded-md p-1 border border-slate-300/40">
                          {(["left", "center", "right"] as const).map(align => (
                            <button
                              key={align}
                              onClick={() => setTextAlign(align)}
                              className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded font-medium ${textAlign === align ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-505 hover:text-slate-800'}`}
                            >
                              {align}
                            </button>
                          ))}
                       </div>
                    </label>
                    <select 
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-white border border-slate-205 rounded-lg p-2.5 text-sm text-slate-805 outline-none focus:border-[#7C3AED] shadow-sm"
                    >
                      {fonts.map(f => (
                         <option key={f.value} value={f.value}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                     <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                       <div className="flex justify-between items-center">
                          <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Headline Size</div>
                          <div className="flex items-center gap-2">
                              <input type="number" min="10" max="250" value={titleSize} onChange={(e) => setTitleSize(parseInt(e.target.value))} className="w-16 bg-slate-50 border border-slate-205 rounded px-2 py-1 text-sm text-slate-805 text-right font-semibold" />
                              <span className="text-xs text-slate-404 font-semibold">px</span>
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
                              <input type="color" value={subtitleColor.startsWith('rgba') ? '#ffffff' : subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0 ml-1" />
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

              {/* LOGO TAB */}
              {activeTab === 'logo' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {!activeLogo ? (
                     <div className="text-sm text-slate-500 bg-slate-100 p-4 rounded-lg border border-slate-200 font-sans">No active logo applied for this product. Use the DNA settings to upload a logo.</div>
                  ) : (
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                           <span className="text-sm font-semibold text-slate-700">Logo Visibility</span>
                           <button 
                             onClick={() => setShowLogo(!showLogo)} 
                             className={`p-2 rounded-full ${showLogo ? 'bg-[#7C3AED] text-white' : 'bg-slate-200 text-slate-500'} transition-colors`}
                           >
                              {showLogo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                           </button>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center">
                             <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Logo Scale (Size)</div>
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

              {/* SCRIM TAB */}
              {activeTab === 'scrim' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Base Color</div>
                       <input type="color" value={scrimColor} onChange={(e) => setScrimColor(e.target.value)} className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" />
                    </div>
                  </div>

                  {customOverlayBg !== "" && (() => {
                     const bgColors = extractColors(customOverlayBg);
                     return (
                        <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                             <div className="text-xs font-bold text-slate-505 uppercase tracking-widest">Overlay Control</div>
                          </div>
                          
                          {bgColors.length > 0 && (
                             <div className="space-y-4 mb-4">
                               {bgColors.map((c, i) => {
                                  const { hex, opacity } = parseColorToHexAndOpacity(c.value);
                                  return (
                                     <div key={i} className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-100 rounded">
                                         <div className="flex justify-between items-center">
                                            <div className="text-xs text-slate-500 font-bold tracking-wide">Color {i + 1}</div>
                                            <input 
                                                type="color" 
                                                value={hex} 
                                                onChange={(e) => {
                                                    const newColor = hexAndOpacityToRgba(e.target.value, opacity);
                                                    const updated = customOverlayBg.substring(0, c.index) + newColor + customOverlayBg.substring(c.index + c.value.length);
                                                    setCustomOverlayBg(updated);
                                                }}
                                                className="h-6 w-8 bg-transparent border-0 rounded cursor-pointer shrink-0" 
                                            />
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.05" 
                                                value={opacity} 
                                                onChange={(e) => {
                                                    const newColor = hexAndOpacityToRgba(hex, parseFloat(e.target.value));
                                                    const updated = customOverlayBg.substring(0, c.index) + newColor + customOverlayBg.substring(c.index + c.value.length);
                                                    setCustomOverlayBg(updated);
                                                }} 
                                                className="w-full accent-[#7C3AED]"
                                            />
                                            <span className="text-xs text-slate-500 font-bold w-8">{Math.round(opacity * 100)}%</span>
                                         </div>
                                     </div>
                                  )
                               })}
                             </div>
                          )}
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">CSS Value</div>
                          <input type="text" value={customOverlayBg} onChange={(e) => setCustomOverlayBg(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-xs text-slate-600 focus:border-[#7C3AED] focus:text-slate-800 outline-none font-mono" />
                        </div>
                     )
                  })()}

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
                  
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    The scrim is a soft overlay that sits above your image but beneath the text. This guarantees text readability even on bright images. 
                  </p>
                </div>
              )}

              {/* BACKGROUND TAB */}
              {activeTab === 'background' && (
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
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 ${baseBg === c.url ? 'border-[#7C3AED] shadow-md shadow-[#7C3AED]/15' : 'border-slate-100 hover:border-[#7C3AED]/30'}`}
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

        {/* Modal Footer Options */}
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

