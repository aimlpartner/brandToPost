import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Rect, Group } from "react-konva";
import useImage from "use-image";
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

const getProxiedImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/") || url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

export function VisualEngine({
  visualType,
  visualData,
  imageUrl,
  dna,
  className,
  fallbackText,
  onImageGenerated,
  activeLogo: propsActiveLogo
}: VisualEngineProps) {
  const stageRef = useRef<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [redrawCounter, setRedrawCounter] = useState(0);

  // Brand colors or defaults
  const primaryColor = dna?.visualData?.colors?.[0] || "#4F46E5";
  const secondaryColor = dna?.visualData?.colors?.[1] || "#111827";

  // Font family determination
  const primaryFont = dna?.visualData?.fonts?.primary || "Inter";
  const fontFamily = primaryFont.includes(" ") && !primaryFont.includes("'") 
    ? `'${primaryFont}'` 
    : primaryFont;

  // Load custom fonts dynamically into the DOM
  useEffect(() => {
    const fn = primaryFont.replace(/["']/g, "").trim();
    if (fn && fn !== "System Default" && fn !== "Inter") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fn.replace(/ /g, "+")}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
      
      // Listen for font load completion to trigger redraw
      document.fonts.ready.then(() => {
        setRedrawCounter(prev => prev + 1);
      });

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [primaryFont]);

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
  const rawLogo = propsActiveLogo || (isDarkTemplate ? dna?.logoLightUrl : dna?.logoDarkUrl) || dna?.logoUrl;
  const activeLogo = getProxiedImageUrl(rawLogo);

  // Load canvas images
  const [bgImage, bgStatus] = useImage(imageUrl || "", "anonymous");
  const [logoImage, logoStatus] = useImage(activeLogo || "", "anonymous");

  // Run the canvas compilation and export once everything is loaded
  useEffect(() => {
    if (!safeVisualType || safeVisualType === "none") {
      setIsGenerating(false);
      return;
    }

    const bgReady = !imageUrl || bgStatus === "loaded" || bgStatus === "failed";
    const logoReady = !activeLogo || logoStatus === "loaded" || logoStatus === "failed";

    if (!bgReady || !logoReady) {
      setIsGenerating(true);
      return;
    }

    // Wait 150ms to ensure font rendering settles
    const timer = setTimeout(() => {
      if (stageRef.current) {
        try {
          const dataUrl = stageRef.current.toDataURL({
            pixelRatio: 1,
            mimeType: "image/jpeg",
            quality: 0.95
          });
          setMergedImage(dataUrl);
          setIsGenerating(false);
          if (onImageGenerated) onImageGenerated(dataUrl);
        } catch (err) {
          console.error("Failed to generate canvas image:", err);
          setIsGenerating(false);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [safeVisualType, JSON.stringify(visualData), imageUrl, activeLogo, bgStatus, logoStatus, redrawCounter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mergedImage && (!safeVisualType || safeVisualType === "none") && imageUrl) {
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

  // Determine smart non-overlapping logo calculations
  const getLogoPlacement = () => {
    let resolvedTextPos = visualData?.layout?.textPosition || "bottom";
    if (safeVisualType === "creative-story") {
      resolvedTextPos = "bottom";
    } else if (safeVisualType === "abstract-announcement") {
      resolvedTextPos = "middle";
    } else if (safeVisualType === "powerful-quote") {
      resolvedTextPos = "middle";
    } else if (safeVisualType === "data-infographic") {
      resolvedTextPos = "top";
    }

    let resolvedLogoPos = visualData?.layout?.logoPosition;
    if (!resolvedLogoPos) {
      resolvedLogoPos = resolvedTextPos === "bottom" ? "top-right" : "bottom-right";
    }

    if (resolvedTextPos === "bottom" && resolvedLogoPos.startsWith("bottom")) {
      resolvedLogoPos = resolvedLogoPos.replace("bottom", "top");
    } else if (resolvedTextPos === "top" && resolvedLogoPos.startsWith("top")) {
      resolvedLogoPos = resolvedLogoPos.replace("top", "bottom");
    }

    let x = 820;
    let y = 880;

    if (resolvedLogoPos === "top-left") { x = 80; y = 80; }
    else if (resolvedLogoPos === "top-center") { x = 450; y = 80; }
    else if (resolvedLogoPos === "top-right") { x = 820; y = 80; }
    else if (resolvedLogoPos === "middle-left") { x = 80; y = 500; }
    else if (resolvedLogoPos === "center") { x = 450; y = 500; }
    else if (resolvedLogoPos === "middle-right") { x = 820; y = 500; }
    else if (resolvedLogoPos === "bottom-left") { x = 80; y = 880; }
    else if (resolvedLogoPos === "bottom-center") { x = 450; y = 880; }
    else if (resolvedLogoPos === "bottom-right") { x = 820; y = 880; }

    return { x, y };
  };

  const logoPos = getLogoPlacement();

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

  const headlineText = visualData?.headline || fallbackText || "Your disruptive quote goes here.";
  const subtextText = visualData?.subtext || "";

  return (
    <div className={cn("relative group border border-gray-800 rounded-xl overflow-hidden bg-black", className)}>
      
      {/* Hidden 1080x1080 rendering canvas */}
      <div className="absolute opacity-0 pointer-events-none" style={{ left: "-9999px", top: 0, width: "1080px", height: "1080px" }}>
        <Stage width={1080} height={1080} ref={stageRef}>
          <Layer>
            {/* Background Rect for safety */}
            <Rect x={0} y={0} width={1080} height={1080} fill="#000000" />

            {/* TEMPLATE 1: Cinematic Human */}
            {safeVisualType === "creative-story" && (
              <>
                {bgImage ? (
                  <KonvaImage image={bgImage} x={0} y={0} width={1080} height={1080} />
                ) : (
                  <Rect x={0} y={0} width={1080} height={1080} fill="#111827" />
                )}
                {/* Dark transparent left-side overlay */}
                <Rect x={0} y={0} width={1080} height={1080} fill="rgba(0,0,0,0.6)" />

                {/* Subtext */}
                {subtextText && (
                  <Text
                    x={80}
                    y={320}
                    text={`— ${subtextText.toUpperCase()}`}
                    fontFamily={fontFamily}
                    fontSize={24}
                    fill="#818CF8"
                    fontStyle="bold"
                    letterSpacing={4}
                  />
                )}

                {/* Headline */}
                <Text
                  x={80}
                  y={380}
                  width={820}
                  text={headlineText}
                  fontFamily={fontFamily}
                  fontSize={headlineText.length > 150 ? 44 : headlineText.length > 80 ? 56 : 68}
                  fill="#FFFFFF"
                  fontStyle="900"
                  lineHeight={1.2}
                />
              </>
            )}

            {/* TEMPLATE 2: Abstract Announcement */}
            {safeVisualType === "abstract-announcement" && (
              <>
                <Rect x={0} y={0} width={1080} height={1080} fill={secondaryColor || "#0B0F19"} />
                {bgImage && (
                  <KonvaImage 
                    image={bgImage} 
                    x={0} 
                    y={0} 
                    width={1080} 
                    height={1080} 
                    opacity={0.3}
                  />
                )}

                {/* Glassmorphic box representation */}
                <Rect
                  x={140}
                  y={240}
                  width={800}
                  height={600}
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={2}
                  cornerRadius={48}
                />

                {/* Headline */}
                <Text
                  x={180}
                  y={320}
                  width={720}
                  text={headlineText}
                  fontFamily={fontFamily}
                  fontSize={headlineText.length > 150 ? 38 : headlineText.length > 80 ? 48 : 60}
                  fill="#FFFFFF"
                  fontStyle="bold"
                  align="center"
                  lineHeight={1.2}
                />

                {/* Divider Line */}
                {subtextText && (
                  <Rect
                    x={470}
                    y={520}
                    width={140}
                    height={4}
                    fill="rgba(255,255,255,0.3)"
                  />
                )}

                {/* Subtext */}
                {subtextText && (
                  <Text
                    x={180}
                    y={560}
                    width={720}
                    text={subtextText}
                    fontFamily={fontFamily}
                    fontSize={subtextText.length > 150 ? 24 : 32}
                    fill="#D1D5DB"
                    fontStyle="normal"
                    align="center"
                    lineHeight={1.4}
                  />
                )}
              </>
            )}

            {/* TEMPLATE 3: Data Bento Grid */}
            {safeVisualType === "data-infographic" && (
              <>
                <Rect x={0} y={0} width={1080} height={1080} fill="#F8FAFC" />

                {/* Top Section */}
                <Text
                  x={80}
                  y={100}
                  width={920}
                  text={headlineText}
                  fontFamily={fontFamily}
                  fontSize={headlineText.length > 150 ? 38 : headlineText.length > 80 ? 48 : 60}
                  fill="#0F172A"
                  fontStyle="900"
                  align="center"
                  lineHeight={1.2}
                />

                {subtextText && (
                  <Text
                    x={80}
                    y={200}
                    width={920}
                    text={subtextText}
                    fontFamily={fontFamily}
                    fontSize={24}
                    fill="#64748B"
                    fontStyle="500"
                    align="center"
                  />
                )}

                {/* Grid stats */}
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
                        />
                        <Text
                          x={pos.x + 40}
                          y={pos.y + 40}
                          width={360}
                          text={stat.label}
                          fontFamily={fontFamily}
                          fontSize={28}
                          fill={textColors[i % textColors.length]}
                          fontStyle="bold"
                          opacity={0.8}
                        />
                        <Text
                          x={pos.x + 40}
                          y={pos.y + 110}
                          width={360}
                          text={stat.value}
                          fontFamily={fontFamily}
                          fontSize={84}
                          fill={textColors[i % textColors.length]}
                          fontStyle="900"
                        />
                      </Group>
                    );
                  });
                })()}
              </>
            )}

            {/* TEMPLATE 4: Powerful Quote */}
            {safeVisualType === "powerful-quote" && (
              <>
                <Rect x={0} y={0} width={1080} height={1080} fill={secondaryColor || "#000000"} />

                {/* Quotation Mark */}
                <Text
                  x={80}
                  y={120}
                  width={920}
                  text={'"'}
                  fontFamily="Georgia, serif"
                  fontSize={160}
                  fill="rgba(255,255,255,0.15)"
                  align="center"
                />

                {/* Quote text */}
                <Text
                  x={120}
                  y={280}
                  width={840}
                  text={headlineText}
                  fontFamily={fontFamily}
                  fontSize={headlineText.length > 150 ? 38 : headlineText.length > 80 ? 48 : 60}
                  fill="#FFFFFF"
                  fontStyle="900"
                  align="center"
                  lineHeight={1.2}
                />

                {/* Accent bar */}
                <Rect
                  x={490}
                  y={580}
                  width={100}
                  height={8}
                  fill={primaryColor}
                />

                {/* Author / Brand name */}
                <Text
                  x={120}
                  y={630}
                  width={840}
                  text={(dna?.name || "The Vision").toUpperCase()}
                  fontFamily={fontFamily}
                  fontSize={28}
                  fill="#9CA3AF"
                  fontStyle="bold"
                  align="center"
                  letterSpacing={6}
                />
              </>
            )}

            {/* TEMPLATE 5: Custom Overlay */}
            {safeVisualType === "custom-overlay" && (
              <>
                {bgImage ? (
                  <KonvaImage image={bgImage} x={0} y={0} width={1080} height={1080} />
                ) : (
                  <Rect x={0} y={0} width={1080} height={1080} fill="#1F2937" />
                )}
                {/* Darkness gradient at the bottom */}
                <Rect
                  x={0}
                  y={400}
                  width={1080}
                  height={680}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: 0, y: 680 }}
                  fillLinearGradientColorStops={[0, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0.85)"]}
                />

                {/* Headline */}
                <Text
                  x={80}
                  y={700}
                  width={920}
                  text={headlineText}
                  fontFamily={fontFamily}
                  fontSize={headlineText.length > 150 ? 38 : headlineText.length > 80 ? 48 : 60}
                  fill="#FFFFFF"
                  fontStyle="bold"
                  lineHeight={1.2}
                />

                {/* Subtext */}
                {subtextText && (
                  <Text
                    x={80}
                    y={880}
                    width={920}
                    text={subtextText}
                    fontFamily={fontFamily}
                    fontSize={28}
                    fill="#E5E7EB"
                    fontStyle="normal"
                  />
                )}
              </>
            )}

            {/* Brand Logo Overlay */}
            {logoImage && (
              <KonvaImage
                image={logoImage}
                x={logoPos.x}
                y={logoPos.y}
                width={180}
                height={70}
                sceneFunc={(context, shape) => {
                  // Keep aspect ratio containment
                  const img = (shape as any).image();
                  if (img) {
                    const ratio = img.width / img.height;
                    const w = Math.min(180, 70 * ratio);
                    const h = Math.min(70, 180 / ratio);
                    context.drawImage(img, 0, 0, w, h);
                  }
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Visible UI */}
      {isGenerating ? (
        <div className="w-full aspect-square flex flex-col items-center justify-center bg-gray-900 border border-[#7C3AED]/20 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <span className="text-[15px] font-medium text-gray-400">Rendering visual canvas...</span>
        </div>
      ) : mergedImage ? (
        <img src={mergedImage || undefined} alt="Merged visual post" className="w-full h-full object-cover aspect-square" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-gray-900 text-gray-500">
          Failed to render visual
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
