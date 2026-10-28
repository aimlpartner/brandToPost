import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Layers as LayersIcon,
  Type,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Download,
  Box,
  Palette,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  Plus
} from "lucide-react";
import { toPng } from "html-to-image";
import { Creative } from "../types";
import { computeTypographicScale, sampleImageLuminance, LayoutAnchor, formatHighlightedHeadline } from "../lib/dynamicLayoutResolver";

export type LayerId = "bg" | "photo" | "text" | "logo" | "sticker";
export type ToolType = "layers" | "text" | "branding" | "elements" | "upload" | "images";

export interface EditorPostState {
  eyebrow?: string;
  headline: string;
  subtext: string;
  highlightWords?: string[];
  bgImageUrl: string;
  photoUrl: string;
  logoUrl: string;
  brandName: string;
  brandColor: string;
  isCutoutActive: boolean;
  activeSticker: boolean;
  stickerText: string;
  fontFamily: string;
  titleSize: number;
  subtitleSize: number;
  titleColor: string;
  subtitleColor: string;
  textAlign: "left" | "center" | "right";
  textPosition: "bottom" | "center" | "top";
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  logoScale: number;
  scrimOpacity: number;
  scrimHeight: number;
  layoutAnchor?: LayoutAnchor;
  textBehindCutout?: boolean;
  autoClampScale?: boolean;
}

const CURATED_BACKGROUNDS = [
  {
    id: "minimal-concrete",
    name: "Architectural Concrete",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "studio-warm",
    name: "Warm Editorial Studio",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "executive-dark",
    name: "Executive Obsidian",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "nordic-wood",
    name: "Nordic Minimal Wood",
    url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "architecture-glass",
    name: "Modern Glass Facade",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "ambient-dawn",
    name: "Ambient Gradient Dawn",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop"
  }
];

const AVAILABLE_FONTS = [
  { name: "Inter Tight", value: "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif" },
  { name: "EB Garamond", value: "'EB Garamond', Georgia, serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Georgia", value: "Georgia, serif" }
];

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

  // Derive initial values
  const initialBaseBg = visualData?.editorState?.bgImageUrl || visualData?.editorState?.baseBg || visualData?.baseImage || originalImageUrl || imageUrl || CURATED_BACKGROUNDS[0].url;
  const initialHeadline = visualData?.editorState?.headline || visualData?.editorState?.title || visualData?.headline || "Autonomous B2B Growth Engine.";
  const initialSubtext = visualData?.editorState?.subtext || visualData?.editorState?.subtitle || visualData?.subtext || "Scale social distribution without headcount.";
  const initialBrandName = visualData?.editorState?.brandName || visualData?.brandName || "BrandToPost";
  const initialBrandColor = visualData?.editorState?.brandColor || visualData?.colors?.[0] || "#E9B638";
  const initialEyebrow = visualData?.editorState?.eyebrow || visualData?.eyebrow || (visualData?.contentType ? visualData.contentType.toUpperCase().substring(0, 18) : "PERSPECTIVE");
  const initialHighlightWords = visualData?.editorState?.highlightWords || visualData?.highlightWords || visualData?.highlight_words || [];

  const [post, setPost] = useState<EditorPostState>({
    eyebrow: initialEyebrow,
    headline: initialHeadline,
    subtext: initialSubtext,
    highlightWords: initialHighlightWords,
    bgImageUrl: initialBaseBg,
    photoUrl: visualData?.editorState?.photoUrl || "",
    logoUrl: visualData?.editorState?.logoUrl || activeLogo || "",
    brandName: initialBrandName,
    brandColor: initialBrandColor,
    isCutoutActive: visualData?.editorState?.isCutoutActive ?? false,
    activeSticker: visualData?.editorState?.activeSticker ?? true,
    stickerText: visualData?.editorState?.stickerText || visualData?.contentType || "CASE STUDY",
    fontFamily: visualData?.editorState?.fontFamily || "'EB Garamond', Georgia, serif",
    titleSize: visualData?.editorState?.titleSize || 56,
    subtitleSize: visualData?.editorState?.subtitleSize || 24,
    titleColor: visualData?.editorState?.titleColor || "#FFFFFF",
    subtitleColor: visualData?.editorState?.subtitleColor || "#E2E8F0",
    textAlign: visualData?.editorState?.textAlign || "left",
    textPosition: visualData?.editorState?.textPosition || (
      (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "top_left_banner" ? "top" :
      (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "centered_minimal" ? "center" : "bottom"
    ),
    logoPosition: visualData?.editorState?.logoPosition || (
      (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "top_left_banner" ? "bottom-right" : "top-right"
    ),
    logoScale: visualData?.editorState?.logoScale || 1,
    scrimOpacity: visualData?.editorState?.scrimOpacity ?? 0.85,
    scrimHeight: visualData?.editorState?.scrimHeight ?? 75,
    layoutAnchor: visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor || "bottom_left_editorial",
    textBehindCutout: visualData?.editorState?.textBehindCutout ?? true,
    autoClampScale: visualData?.editorState?.autoClampScale ?? false
  });

  const [activeTool, setActiveTool] = useState<ToolType>("layers");
  const [selectedLayer, setSelectedLayer] = useState<LayerId | null>("text");
  const [isApart, setIsApart] = useState<boolean>(false);
  const [hiddenLayers, setHiddenLayers] = useState<LayerId[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(0.55);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Auto-Clamp Typographic Scale using Native Formula
  const handleAutoClampScale = (targetHeadline = post.headline) => {
    const { fontSize } = computeTypographicScale(targetHeadline, 1080);
    setPost((p) => ({
      ...p,
      titleSize: fontSize,
      subtitleSize: Math.max(18, Math.round(fontSize * 0.44))
    }));
  };

  // Auto-Balance Contrast via background luminance sampling
  const handleAutoBalanceContrast = async () => {
    if (!post.bgImageUrl) return;
    const luminance = await sampleImageLuminance(post.bgImageUrl, post.textPosition === 'top' ? 'top-left' : 'bottom-left');
    const isDark = luminance < 125;
    setPost((p) => ({
      ...p,
      titleColor: isDark ? "#FAF7F2" : "#181613",
      subtitleColor: isDark ? "#E2E8F0" : "#4A453E"
    }));
  };

  // Apply Native layout anchor presets
  const handleApplyLayoutAnchor = (anchor: LayoutAnchor) => {
    let textPosition: "bottom" | "center" | "top" = "bottom";
    let textAlign: "left" | "center" | "right" = "left";
    let scrimHeight = 75;

    if (anchor === "top_left_banner") {
      textPosition = "top";
      textAlign = "left";
      scrimHeight = 65;
    } else if (anchor === "centered_minimal") {
      textPosition = "center";
      textAlign = "center";
      scrimHeight = 55;
    } else if (anchor === "bottom_full_cinematic") {
      textPosition = "bottom";
      textAlign = "left";
      scrimHeight = 85;
    } else {
      textPosition = "bottom";
      textAlign = "left";
      scrimHeight = 75;
    }

    setPost((p) => ({
      ...p,
      layoutAnchor: anchor,
      textPosition,
      textAlign,
      scrimHeight
    }));
  };

  // Initialize state when opened
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const baseBg = visualData?.editorState?.bgImageUrl || visualData?.editorState?.baseBg || visualData?.baseImage || originalImageUrl || imageUrl || CURATED_BACKGROUNDS[0].url;
    setPost({
      headline: visualData?.editorState?.headline || visualData?.editorState?.title || visualData?.headline || "Autonomous B2B Growth Engine.",
      subtext: visualData?.editorState?.subtext || visualData?.editorState?.subtitle || visualData?.subtext || "Scale social distribution without headcount.",
      bgImageUrl: baseBg,
      photoUrl: visualData?.editorState?.photoUrl || "",
      logoUrl: visualData?.editorState?.logoUrl || activeLogo || "",
      brandName: visualData?.editorState?.brandName || visualData?.brandName || "BrandToPost",
      brandColor: visualData?.editorState?.brandColor || visualData?.colors?.[0] || "#E9B638",
      isCutoutActive: visualData?.editorState?.isCutoutActive ?? false,
      activeSticker: visualData?.editorState?.activeSticker ?? true,
      stickerText: visualData?.editorState?.stickerText || visualData?.contentType || "CASE STUDY",
      fontFamily: visualData?.editorState?.fontFamily || "'Inter Tight', sans-serif",
      titleSize: visualData?.editorState?.titleSize || 56,
      subtitleSize: visualData?.editorState?.subtitleSize || 24,
      titleColor: visualData?.editorState?.titleColor || "#FFFFFF",
      subtitleColor: visualData?.editorState?.subtitleColor || "#E2E8F0",
      textAlign: visualData?.editorState?.textAlign || "left",
      textPosition: visualData?.editorState?.textPosition || (
        (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "top_left_banner" ? "top" :
        (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "centered_minimal" ? "center" : "bottom"
      ),
      logoPosition: visualData?.editorState?.logoPosition || (
        (visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor) === "top_left_banner" ? "bottom-right" : "top-right"
      ),
      logoScale: visualData?.editorState?.logoScale || 1,
      scrimOpacity: visualData?.editorState?.scrimOpacity ?? 0.85,
      scrimHeight: visualData?.editorState?.scrimHeight ?? 75,
      layoutAnchor: visualData?.editorState?.layoutAnchor || visualData?.layoutAnchor || "bottom_left_editorial",
      textBehindCutout: visualData?.editorState?.textBehindCutout ?? true,
      autoClampScale: visualData?.editorState?.autoClampScale ?? false
    });

    setHiddenLayers([]);
    setIsApart(false);
    setSelectedLayer("text");
  }, [isOpen, visualData, imageUrl, activeLogo, originalImageUrl]);

  // Stage scaling calculation for 1:1 1080x1080 container
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const padding = 64;
      const availableW = Math.max(280, width - padding);
      const availableH = Math.max(280, height - padding);
      const fitScale = Math.min(availableW / 1080, availableH / 1080, 0.72);
      setScale(fitScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  const toggleLayerVisibility = (id: LayerId) => {
    setHiddenLayers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 3D coordinate calculator for "Apart Mode"
  const getLayerStyle = (layerId: LayerId, layerIndex: number): React.CSSProperties => {
    const isVisible = !hiddenLayers.includes(layerId);
    const gapPx = 48;

    return {
      position: "absolute",
      inset: 0,
      borderRadius: "20px",
      transform: `translateZ(${isApart ? layerIndex * gapPx : 0}px)`,
      transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease, opacity 0.35s ease",
      boxShadow: isApart ? "0 20px 48px rgba(0, 0, 0, 0.45)" : "none",
      opacity: isVisible ? 1 : isApart ? 0.15 : 0,
      pointerEvents: isVisible ? "auto" : "none"
    };
  };

  // Save handler: flattens 3D if open, renders 1080x1080 PNG, and returns
  const handleSave = async () => {
    if (!stageRef.current) return;
    setIsSaving(true);
    setSelectedLayer(null);

    const wasApart = isApart;
    if (wasApart) {
      setIsApart(false);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      await new Promise((r) => setTimeout(r, 60));

      const dataUrl = await toPng(stageRef.current, {
        pixelRatio: 1,
        width: 1080,
        height: 1080,
        cacheBust: true,
        skipAutoScale: true
      });

      const newVisualData = {
        ...(visualData || {}),
        headline: post.headline,
        subtext: post.subtext,
        eyebrow: post.eyebrow,
        highlightWords: post.highlightWords,
        baseImage: post.bgImageUrl,
        bgImageUrl: post.bgImageUrl,
        brandLogoUrl: post.logoUrl,
        isFlattened: true,
        editorState: {
          ...post
        }
      };

      onSave(dataUrl, originalImageUrl || imageUrl, newVisualData);
      onClose();
    } catch (err) {
      console.error("Failed to export canvas image:", err);
    } finally {
      setIsSaving(false);
      if (wasApart) setIsApart(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "bg" | "photo" | "logo") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          if (target === "bg") setPost((p) => ({ ...p, bgImageUrl: res }));
          if (target === "photo") setPost((p) => ({ ...p, photoUrl: res }));
          if (target === "logo") setPost((p) => ({ ...p, logoUrl: res }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0C0D12] text-slate-100 w-full max-w-[1400px] h-[94vh] flex flex-col rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <header className="h-14 border-b border-white/10 px-5 flex items-center justify-between bg-[#08080C] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9B638]/20 text-[#E9B638] font-bold text-sm">
              ★
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                BrandToPost Canvas Editor
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  1:1 Post Engine
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-[#E9B638] hover:bg-[#D4A32D] text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                  Exporting 1080x1080...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save & Apply
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 overflow-hidden flex flex-row relative">
          
          {/* 1. Left Tool Rail */}
          <aside className="w-20 border-r border-white/10 bg-[#08080C] flex flex-col items-center py-5 shrink-0 z-20">
            <nav className="flex flex-col gap-2.5 w-full px-2">
              {(
                [
                  { id: "layers", label: "Layers", icon: LayersIcon },
                  { id: "text", label: "Text", icon: Type },
                  { id: "branding", label: "Branding", icon: Palette },
                  { id: "elements", label: "Elements", icon: Box },
                  { id: "images", label: "Images", icon: ImageIcon },
                  { id: "upload", label: "Upload", icon: Upload }
                ] as const
              ).map((tool) => {
                const IconComponent = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-white/15 text-white shadow-sm font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? "text-[#E9B638]" : ""}`} />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* 3D Isometric Exploded View ("Apart Mode") Toggle */}
            <div className="mt-auto pt-4 border-t border-white/10 w-full px-2">
              <button
                onClick={() => setIsApart(!isApart)}
                className={`w-full flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  isApart
                    ? "bg-[#E9B638] text-slate-950 shadow-lg shadow-[#E9B638]/20"
                    : "border border-white/15 text-slate-300 hover:text-white hover:border-white/30 bg-white/5"
                }`}
                title="Toggle 3D Layer Explosion ('Apart Mode')"
              >
                <Box className="w-4 h-4" />
                <span>3D Layers</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isApart ? "bg-black/20 text-slate-950" : "text-[#E9B638]"}`}>
                  {isApart ? "ACTIVE" : "OFF"}
                </span>
              </button>
            </div>
          </aside>

          {/* 2. Secondary Settings Sidebar Panel */}
          <aside className="w-80 border-r border-white/10 bg-[#0F1017] p-5 overflow-y-auto shrink-0 z-20">
            <div className="mb-5 flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeTool.toUpperCase()} CONTROLS
              </h2>
            </div>

            {/* LAYERS PANEL */}
            {activeTool === "layers" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a layer to adjust properties. Toggle visibility or view in 3D Apart Mode.
                </p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { id: "sticker", label: "Layer 4: Badge / Sticker", tag: "Chip" },
                      { id: "logo", label: "Layer 3: Brand Vector Logo", tag: "SVG/PNG" },
                      { id: "text", label: "Layer 2: Typography Overlay", tag: "Live Text" },
                      { id: "photo", label: "Layer 1: Product Cutout / Asset", tag: "Photo" },
                      { id: "bg", label: "Layer 0: Background Plate", tag: "Plate" }
                    ] as const
                  ).map((layer) => {
                    const isSelected = selectedLayer === layer.id;
                    const isVisible = !hiddenLayers.includes(layer.id);
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayer(layer.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#E9B638] bg-[#E9B638]/10 text-white font-medium shadow-sm"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-400/80">{layer.tag}</span>
                          <span className="font-medium">{layer.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                          title={isVisible ? "Hide layer" : "Show layer"}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Layer Interleaving: Text Behind Cutout */}
                <div className="pt-3 border-t border-white/10 mt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="pr-2">
                      <span className="text-xs font-semibold text-white block">Layer Interleaving (3D Cutout)</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Places typography behind subject cutout (Native magazine style)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={post.textBehindCutout}
                      onChange={(e) => setPost({ ...post, textBehindCutout: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#E9B638] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TEXT PANEL */}
            {activeTool === "text" && (
              <div className="space-y-5">
                {/* Native Layout Anchor Presets */}
                <div>
                  <label className="text-xs font-semibold text-slate-300">Layout Anchor Preset (Native)</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Constraint-based dynamic anchor solver</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'bottom_left_editorial', label: 'Editorial Bottom' },
                      { id: 'top_left_banner', label: 'Top-Left Banner' },
                      { id: 'centered_minimal', label: 'Centered Minimal' },
                      { id: 'bottom_full_cinematic', label: 'Cinematic Full' },
                    ].map((anchor) => (
                      <button
                        key={anchor.id}
                        type="button"
                        onClick={() => handleApplyLayoutAnchor(anchor.id as LayoutAnchor)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-medium border text-left transition-colors cursor-pointer ${
                          post.layoutAnchor === anchor.id
                            ? 'bg-[#E9B638]/20 border-[#E9B638] text-white font-semibold'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {anchor.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Category Tag / Eyebrow (Native Level 1)</label>
                  <input
                    type="text"
                    value={post.eyebrow || ''}
                    onChange={(e) => setPost({ ...post, eyebrow: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-2.5 text-xs text-white outline-none focus:border-[#E9B638] uppercase font-bold tracking-widest"
                    placeholder="e.g. PERSPECTIVE, CASE STUDY, STRATEGY..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Headline Copy</label>
                  <textarea
                    value={post.headline}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setPost((prev) => {
                        const next = { ...prev, headline: newText };
                        if (prev.autoClampScale) {
                          const { fontSize } = computeTypographicScale(newText, 1080);
                          next.titleSize = fontSize;
                          next.subtitleSize = Math.max(18, Math.round(fontSize * 0.44));
                        }
                        return next;
                      });
                    }}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white outline-none focus:border-[#E9B638] transition-colors resize-y leading-relaxed"
                    rows={4}
                    placeholder="Enter bold hook headline..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Subtext / Subtitle</label>
                  <textarea
                    value={post.subtext}
                    onChange={(e) => setPost({ ...post, subtext: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white outline-none focus:border-[#E9B638] transition-colors resize-y leading-relaxed"
                    rows={2}
                    placeholder="Enter clarifying subtext..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Brand Font Family</label>
                  <select
                    value={post.fontFamily}
                    onChange={(e) => setPost({ ...post, fontFamily: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-2.5 text-xs text-white outline-none focus:border-[#E9B638]"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.name} value={f.value} className="bg-slate-900">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Headline Size ({post.titleSize}px)</label>
                      <button
                        type="button"
                        onClick={() => handleAutoClampScale()}
                        className="text-[10px] font-bold text-[#E9B638] hover:underline cursor-pointer"
                        title="Auto-scale font size using Native formula"
                      >
                        Auto-Scale
                      </button>
                    </div>
                    <input
                      type="range"
                      min={32}
                      max={84}
                      value={post.titleSize}
                      onChange={(e) => setPost({ ...post, titleSize: Number(e.target.value) })}
                      className="mt-2 w-full accent-[#E9B638]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Subtext Size ({post.subtitleSize}px)</label>
                    <input
                      type="range"
                      min={16}
                      max={40}
                      value={post.subtitleSize}
                      onChange={(e) => setPost({ ...post, subtitleSize: Number(e.target.value) })}
                      className="mt-2 w-full accent-[#E9B638]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Text Alignment</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setPost({ ...post, textAlign: align })}
                        className={`py-2 rounded-xl text-xs font-medium border capitalize flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          post.textAlign === align
                            ? "bg-[#E9B638]/20 border-[#E9B638] text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Vertical Alignment</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(["bottom", "center", "top"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPost({ ...post, textPosition: pos })}
                        className={`py-2 rounded-xl text-xs font-medium border capitalize transition-colors cursor-pointer ${
                          post.textPosition === pos
                            ? "bg-[#E9B638]/20 border-[#E9B638] text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Title Color</label>
                      <button
                        type="button"
                        onClick={handleAutoBalanceContrast}
                        className="text-[10px] font-bold text-[#E9B638] hover:underline cursor-pointer"
                        title="Auto-balance contrast based on background plate luminance"
                      >
                        Auto-Contrast
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="color"
                        value={post.titleColor}
                        onChange={(e) => setPost({ ...post, titleColor: e.target.value })}
                        className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-slate-300">{post.titleColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Subtext Color</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="color"
                        value={post.subtitleColor}
                        onChange={(e) => setPost({ ...post, subtitleColor: e.target.value })}
                        className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-slate-300">{post.subtitleColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BRANDING PANEL */}
            {activeTool === "branding" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Brand Name</label>
                  <input
                    type="text"
                    value={post.brandName}
                    onChange={(e) => setPost({ ...post, brandName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-2.5 text-xs text-white outline-none focus:border-[#E9B638]"
                    placeholder="Enter brand name..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Brand Accent Color</label>
                  <div className="flex items-center gap-3 mt-1.5 p-2 rounded-xl bg-black/40 border border-white/10">
                    <input
                      type="color"
                      value={post.brandColor}
                      onChange={(e) => setPost({ ...post, brandColor: e.target.value })}
                      className="h-9 w-9 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs text-slate-200">{post.brandColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Logo Anchor Position</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPost({ ...post, logoPosition: pos })}
                        className={`py-2 rounded-xl text-xs font-medium border capitalize transition-colors cursor-pointer ${
                          post.logoPosition === pos
                            ? "bg-[#E9B638]/20 border-[#E9B638] text-white"
                            : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {pos.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Logo Scale ({post.logoScale.toFixed(1)}x)</label>
                  <input
                    type="range"
                    min={0.6}
                    max={2.0}
                    step={0.1}
                    value={post.logoScale}
                    onChange={(e) => setPost({ ...post, logoScale: parseFloat(e.target.value) })}
                    className="mt-2 w-full accent-[#E9B638]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Upload Vector / PNG Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "logo")}
                    className="mt-1.5 w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ELEMENTS PANEL */}
            {activeTool === "elements" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <h3 className="text-xs font-semibold text-white">Sticker / Badge Layer</h3>
                    <p className="text-[11px] text-slate-400">Floating topical badge in upper corner</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={post.activeSticker}
                    onChange={(e) => setPost({ ...post, activeSticker: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#E9B638] cursor-pointer"
                  />
                </div>

                {post.activeSticker && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Badge Text</label>
                      <input
                        type="text"
                        value={post.stickerText}
                        onChange={(e) => setPost({ ...post, stickerText: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/40 p-2.5 text-xs text-white outline-none focus:border-[#E9B638]"
                        placeholder="e.g. CASE STUDY, DAY 1, FOUNDER TIP"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Scrim Gradient Depth</label>
                      <div className="space-y-3 mt-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Height</span>
                            <span>{post.scrimHeight}%</span>
                          </div>
                          <input
                            type="range"
                            min={30}
                            max={100}
                            value={post.scrimHeight}
                            onChange={(e) => setPost({ ...post, scrimHeight: Number(e.target.value) })}
                            className="w-full accent-[#E9B638]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Opacity</span>
                            <span>{Math.round(post.scrimOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.2}
                            max={1}
                            step={0.05}
                            value={post.scrimOpacity}
                            onChange={(e) => setPost({ ...post, scrimOpacity: parseFloat(e.target.value) })}
                            className="w-full accent-[#E9B638]"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* IMAGES PANEL */}
            {activeTool === "images" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a clean editorial background plate with zero AI text artifacts:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CURATED_BACKGROUNDS.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setPost({ ...post, bgImageUrl: item.url })}
                      className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        post.bgImageUrl === item.url
                          ? "border-[#E9B638] ring-2 ring-[#E9B638]/30 shadow-md"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-semibold text-white truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* UPLOAD PANEL */}
            {activeTool === "upload" && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Upload Clean Background Plate</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Replaces Layer 0 background canvas</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "bg")}
                    className="mt-2 w-full text-xs text-slate-400 file:mr-3 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E9B638] file:text-slate-950 hover:file:bg-[#D4A32D] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Upload Subject Photo / Cutout (Layer 1)</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Transparent PNG product asset or photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "photo")}
                    className="mt-2 w-full text-xs text-slate-400 file:mr-3 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                </div>
              </div>
            )}

          </aside>

          {/* 3. Main Stage & Virtual 1:1 Canvas */}
          <main
            ref={containerRef}
            onClick={() => setSelectedLayer(null)}
            className="flex-1 bg-[#07080C] overflow-hidden relative flex items-center justify-center p-8 select-none"
          >
            {/* 3D Perspective Canvas Stage */}
            <div
              className="relative flex items-center justify-center"
              style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}
            >
              {/* Card Frame: Exactly 1080x1080 (1:1 Aspect Ratio) scaled cleanly */}
              <div
                ref={stageRef}
                data-darkreader-ignore="true"
                data-visual-artboard="true"
                style={{
                  width: 1080,
                  height: 1080,
                  transform: `${isApart ? "rotateX(22deg) rotateY(-20deg) rotateZ(4deg)" : "none"} scale(${scale})`,
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                  isolation: "isolate",
                  colorScheme: "light"
                }}
                className="darkreader-ignore relative rounded-2xl overflow-visible bg-black shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
              >
                
                {/* Layer 0: Background Plate (AI / Gradient / Clean Photo) */}
                <div
                  style={getLayerStyle("bg", 0)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLayer("bg");
                  }}
                  className="overflow-hidden border border-white/5 cursor-pointer"
                >
                  {post.bgImageUrl ? (
                    <img
                      src={post.bgImageUrl}
                      alt="Background Plate"
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
                  )}

                  {/* Adaptive Directional Scrim */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity"
                    style={{
                      height: `${post.scrimHeight}%`,
                      top: post.textPosition === 'top' ? 0 : `${100 - post.scrimHeight}%`,
                      background: post.textPosition === 'top'
                        ? `linear-gradient(to bottom, rgba(8, 8, 12, ${post.scrimOpacity}) 0%, rgba(8, 8, 12, ${post.scrimOpacity * 0.6}) 55%, transparent 100%)`
                        : `linear-gradient(to top, rgba(8, 8, 12, ${post.scrimOpacity}) 0%, rgba(8, 8, 12, ${post.scrimOpacity * 0.6}) 55%, transparent 100%)`
                    }}
                  />

                  {selectedLayer === "bg" && <SelectionHandles />}
                </div>

                {/* Layer 1 & 2: Interleaved Typography and Photo Cutout */}
                {(() => {
                  const typographyLayer = (layerIndex: number) => (
                    <div
                      key="layer-text"
                      style={getLayerStyle("text", layerIndex)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLayer("text");
                      }}
                      className={`flex flex-col p-16 z-20 cursor-pointer ${
                        post.textPosition === "top"
                          ? "justify-start"
                          : post.textPosition === "center"
                          ? "justify-center"
                          : "justify-end"
                      }`}
                    >
                      <div
                        style={{ textAlign: post.textAlign }}
                        className="max-w-[92%]"
                      >
                        {/* Level 1: Category Tag / Eyebrow */}
                        {post.eyebrow && (
                          <span
                            className="block font-bold uppercase tracking-[0.14em] text-[20px] mb-3 select-none"
                            style={{
                              fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif",
                              color: post.brandColor || '#E9B638',
                              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            }}
                          >
                            {post.eyebrow}
                          </span>
                        )}

                        {/* Editable Headline */}
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const newText = e.currentTarget.innerText;
                            setPost((prev) => {
                              const next = { ...prev, headline: newText };
                              if (prev.autoClampScale) {
                                const { fontSize } = computeTypographicScale(newText, 1080);
                                next.titleSize = fontSize;
                                next.subtitleSize = Math.max(18, Math.round(fontSize * 0.44));
                              }
                              return next;
                            });
                          }}
                          className="inline-block font-bold leading-[1.12] outline-none tracking-tight transition-all"
                          style={{
                            fontFamily: post.fontFamily,
                            fontSize: `${post.titleSize}px`,
                            color: post.titleColor,
                            textShadow: post.titleColor.toLowerCase().includes('faf') || post.titleColor.toLowerCase().includes('fff')
                              ? "0 2px 14px rgba(12, 20, 34, 0.75), 0 1px 6px rgba(0,0,0,0.6)"
                              : "0 1px 4px rgba(250, 247, 242, 0.6), 0 2px 8px rgba(0,0,0,0.12)",
                            boxDecorationBreak: "clone",
                            WebkitBoxDecorationBreak: "clone"
                          }}
                        >
                          {post.headline}
                        </h1>

                        {/* Editable Subtext */}
                        {post.subtext && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setPost({ ...post, subtext: e.currentTarget.innerText })}
                            className="mt-5 font-normal leading-relaxed outline-none transition-all"
                            style={{
                              fontFamily: post.fontFamily,
                              fontSize: `${post.subtitleSize}px`,
                              color: post.subtitleColor,
                              textShadow: "0 1px 8px rgba(0,0,0,0.7)"
                            }}
                          >
                            {post.subtext}
                          </p>
                        )}
                      </div>

                      {selectedLayer === "text" && <SelectionHandles />}
                    </div>
                  );

                  const photoCutoutLayer = (layerIndex: number) => {
                    if (!post.photoUrl) return null;
                    return (
                      <div
                        key="layer-photo"
                        style={getLayerStyle("photo", layerIndex)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLayer("photo");
                        }}
                        className="overflow-hidden pointer-events-auto cursor-pointer"
                      >
                        <img
                          src={post.photoUrl}
                          alt="Subject Asset"
                          className="h-full w-full object-contain p-12 transition-transform duration-500"
                          crossOrigin="anonymous"
                        />
                        {selectedLayer === "photo" && <SelectionHandles />}
                      </div>
                    );
                  };

                  return post.textBehindCutout ? (
                    <>
                      {typographyLayer(1)}
                      {photoCutoutLayer(2)}
                    </>
                  ) : (
                    <>
                      {photoCutoutLayer(1)}
                      {typographyLayer(2)}
                    </>
                  );
                })()}

                {/* Layer 3: Vector Brand Logo */}
                <div
                  style={getLayerStyle("logo", 3)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLayer("logo");
                  }}
                  className={`flex p-12 z-30 cursor-pointer ${
                    post.logoPosition === "top-left"
                      ? "items-start justify-start"
                      : post.logoPosition === "bottom-left"
                      ? "items-end justify-start"
                      : post.logoPosition === "bottom-right"
                      ? "items-end justify-end"
                      : "items-start justify-end"
                  }`}
                >
                  <div className="relative">
                    {post.logoUrl ? (
                      <img
                        src={post.logoUrl}
                        alt="Brand Logo"
                        className="h-10 max-h-12 w-auto max-w-[180px] object-contain drop-shadow-[0_3px_12px_rgba(0,0,0,0.7)]"
                        style={{ transform: `scale(${post.logoScale})` }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-xl font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" style={{ color: post.brandColor }}>
                        ★
                      </span>
                    )}
                  </div>

                  {selectedLayer === "logo" && <SelectionHandles />}
                </div>

                {/* Layer 4: Floating Sticker / Topical Badge */}
                {post.activeSticker && (
                  <div
                    style={getLayerStyle("sticker", 4)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayer("sticker");
                    }}
                    className="p-12 z-40 flex items-start justify-start cursor-pointer"
                  >
                    <div
                      className="px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-slate-950 shadow-xl transition-transform"
                      style={{
                        backgroundColor: post.brandColor,
                        transform: "rotate(-3deg)"
                      }}
                    >
                      {post.stickerText}
                    </div>

                    {selectedLayer === "sticker" && <SelectionHandles />}
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Floating Info Pill */}
            <div className="absolute bottom-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#E9B638] animate-pulse" />
              <span>Click any element to edit inline. Toggle <b>3D Layers</b> for exploded perspective view.</span>
            </div>
          </main>

        </div>
      </div>
    </div>,
    document.body
  );
}

// Figma/Native Style Selection Anchor Bounding Box
const SelectionHandles: React.FC = () => {
  const corners = ["tl", "tr", "bl", "br"] as const;

  return (
    <span
      className="pointer-events-none absolute inset-[-6px] z-50 rounded-2xl"
      style={{ border: "2px solid #E9B638" }}
    >
      {corners.map((corner) => (
        <span
          key={corner}
          className="absolute h-3 w-3 rounded-sm bg-white shadow-sm"
          style={{
            border: "2px solid #E9B638",
            top: corner[0] === "t" ? -6 : undefined,
            bottom: corner[0] === "b" ? -6 : undefined,
            left: corner[1] === "l" ? -6 : undefined,
            right: corner[1] === "r" ? -6 : undefined
          }}
        />
      ))}
    </span>
  );
};

export default VisualEditorModal;
