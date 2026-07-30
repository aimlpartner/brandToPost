import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { 
  Brain, Cpu, Upload, Loader2, Sparkles, Save, Target, MessageSquare, 
  Zap, Clock, Globe, FileText, CheckCircle2, ChevronRight, Play, Check,
  Palette, Type, Download, Copy, RefreshCw, FileSignature, Linkedin, Image as ImageIcon, X,
  LayoutGrid, ListFilter, ChevronLeft, ShieldCheck, Eye, Share2, Sliders, Info, AlertCircle, TrendingUp, Wand2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { db, auth } from "../firebase";
import { doc, updateDoc, collection, query, orderBy, getDocs, deleteDoc, setDoc } from "firebase/firestore";
import { logSilentError } from "../lib/firestore-error";
import {
  sanitizeTemplateHtml,
  escapeHtmlText,
  escapeHtmlAttr,
  safeUrlOrEmpty,
  TEMPLATE_CSP_META,
} from "../lib/sanitizeTemplateHtml";
import { synthesizeFounderAgent, generateGeneralFounderPost, generateFounderTopicSuggestions, generateBrandedFounderPost, researchVisualTrends } from "../services/geminiService";
import { CustomTimePicker } from "../components/CustomTimePicker";
import { PlusPenIcon } from "../components/PlusPenIcon";
import { PostPreviewModal } from "../components/PostPreviewModal";
import { FaLinkedin, FaXTwitter, FaFacebook, FaInstagram, FaReddit } from "react-icons/fa6";
import { utcToLocal, localToUtc, cn } from "../lib/utils";
import { VisualEngine } from "../components/VisualEngine";
import { LAYOUT_BLUEPRINTS } from "../lib/layoutBlueprints";

// Helper component to dynamically scale 1080x1080 iframe template previews to fill container with zero gaps
function ScaledIframePreview({ htmlToRender, title }: { htmlToRender: string; title: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState<number>(0.22);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const width = containerRef.current?.getBoundingClientRect().width || 230;
      if (width > 0) {
        setScale(width / 1080);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-square rounded-lg bg-black overflow-hidden border border-slate-800">
      <iframe
        title={title}
        loading="lazy"
        srcDoc={`<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:#000000;width:1080px;height:1080px;}</style></head><body style="margin:0;padding:0;overflow:hidden;">${htmlToRender}</body></html>`}
        sandbox="allow-same-origin"
        scrolling="no"
        className="absolute top-0 left-0 border-none pointer-events-none"
        style={{
          width: "1080px",
          height: "1080px",
          transform: `scale(${scale})`,
          transformOrigin: "top left"
        }}
      />
    </div>
  );
}
import { toJpeg, toPng } from "html-to-image";
import { renderVisualCanvasFallback } from "../lib/offscreenRenderer";
import { GOOGLE_FONTS, ADOBE_FONTS } from "../lib/fonts";

const STOCK_IMAGES = [
  {
    id: "chess",
    name: "Strategy & Office",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "tech",
    name: "Tech & Code",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "architecture",
    name: "Architecture",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "creative",
    name: "Creative Flatlay",
    url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80"
  }
];

function renderDiscoveredHtml(rawHtml: string, data: {
  headline: string;
  subtext: string;
  imageUrl: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  authorName?: string;
  authorAvatar?: string;
  authorBio?: string;
}): string {
  if (!rawHtml) return "";

  // rawHtml is model-generated and lands in an iframe srcDoc. Sanitize the
  // template BEFORE substitution — that is where the untrusted content is.
  const { html: safeTemplate, violations } = sanitizeTemplateHtml(rawHtml);
  if (violations.length > 0) {
    console.warn("[template sanitizer] stripped unsafe markup:", violations);
  }
  let html = safeTemplate;

  const logoSrc = safeUrlOrEmpty(data.logoUrl || "");
  const logoMarkup = logoSrc
    ? `<img src="${escapeHtmlAttr(logoSrc)}" style="max-height: 45px; max-width: 150px; object-fit: contain;" alt="Brand Logo" />`
    : "";

  // Cleanly replace any <img ... src="{{LOGO_URL}}"> or src="{{LOGO_URL}}" attributes
  html = html.replace(/<img[^>]*src=["']\{\{LOGO_URL\}\}["'][^>]*>/g, logoMarkup);
  html = html.replace(/src=["']\{\{LOGO_URL\}\}["']/g, logoSrc ? `src="${escapeHtmlAttr(logoSrc)}"` : `src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:none;"`);

  html = html.replace(/\{\{LOGO_URL\}\}/g, logoMarkup);

  html = html.replace(/\{\{HEADLINE\}\}/g, escapeHtmlText(data.headline));
  html = html.replace(/\{\{SUBTEXT\}\}/g, escapeHtmlText(data.subtext));
  html = html.replace(/\{\{IMAGE_URL\}\}/g, escapeHtmlAttr(safeUrlOrEmpty(data.imageUrl)));
  html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, escapeHtmlAttr(data.primaryColor || "#6366F1"));
  html = html.replace(/\{\{SECONDARY_COLOR\}\}/g, escapeHtmlAttr(data.secondaryColor || "#0F172A"));
  html = html.replace(/\{\{FONT_FAMILY\}\}/g, escapeHtmlAttr(data.fontFamily || "Inter"));
  return html;
}

const ALL_FONTS = [...GOOGLE_FONTS, ...ADOBE_FONTS];
const POPULAR_FONTS = Array.from(new Set(ALL_FONTS)).sort();

const Divider = () => <div className="h-px bg-slate-105 my-5" />;

// ─── Bento Card Component ───
const BentoCard = ({ children, className = "", span = 1 }: { children: React.ReactNode; className?: string; span?: 1 | 2 | 3 }) => {
  const spanClass = span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm ${spanClass} ${className}`}>
      {children}
    </div>
  );
};

// ─── Section Title ───
const SectionTitle = ({ icon: Icon, title, iconColor = "text-[#7C3AED]" }: { icon: React.ElementType; title: string; iconColor?: string }) => (
  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
    <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
    <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
  </div>
);

// ─── SmartField: Editable Text Component ───
interface SmartFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  onChange: (val: string) => void;
  accentColor?: string;
}

function SmartField({ label, value, placeholder = "—", hint, multiline = false, onChange, accentColor }: SmartFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      if (multiline) {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
        }
      } else {
        inputRef.current?.focus();
      }
    }
  }, [editing, multiline]);

  const handleToggleDone = () => {
    if (editing) {
      if (localVal !== value) {
        onChange(localVal);
      }
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  const handleBlur = () => {
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor || "text-slate-400"}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={handleToggleDone}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      {hint && !editing && <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{hint}</p>}
      {editing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={localVal}
            onChange={(e) => {
              setLocalVal(e.target.value);
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
              }
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2.5 text-sm text-slate-850 outline-none resize-none transition-colors"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-sm text-slate-850 outline-none transition-colors"
          />
        )
      ) : (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${value?.trim() ? "text-slate-850" : "text-slate-350 italic"}`}>
          {value?.trim() || placeholder}
        </p>
      )}
    </div>
  );
}

// ─── Inline Bullets Editor for Synthesized Traits ───
interface BulletEditorProps {
  label: string;
  items: string[];
  icon: React.ElementType;
  color: string;
  dotColor: string;
  onChange: (newItems: string[]) => void;
  className?: string;
}

function BulletEditor({ label, items, icon: Icon, color, dotColor, onChange, className = "" }: BulletEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (editing) setText(items.join("\n"));
  }, [editing, items]);

  const handleSave = () => {
    const list = text.split("\n").map(l => l.trim()).filter(Boolean);
    onChange(list);
    setEditing(false);
  };

  return (
    <div className={`bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-xs font-bold text-slate-800 tracking-tight">{label}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editing) handleSave();
              else setEditing(true);
            }}
            className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>
        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] text-xs rounded-xl p-3 outline-none resize-none leading-relaxed transition-colors"
            placeholder="One item per line..."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                <span>{item}</span>
              </li>
            ))}
            {items.length === 0 && <li className="text-xs text-slate-350 italic">None generated yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MasterFounder() {
  const { user, userProfile } = useAuth();
  const { products, updateProduct } = useProducts();
  const [activeTab, setActiveTab] = useState<"brain" | "brands" | "generator" | "history">("brain");

  const renderMiniLayoutPreview = (id: string) => {
    switch (id) {
      case "auto":
        return (
          <div className="w-full h-20 bg-violet-50 rounded-lg overflow-hidden border border-violet-100 flex flex-col items-center justify-center text-violet-500 space-y-1">
            <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
            <span className="text-[8px] font-bold tracking-wider">AUTO ROTATE</span>
          </div>
        );
      case "editorial-left":
        return (
          <div className="w-full h-20 bg-slate-800 rounded-lg overflow-hidden flex border border-slate-200">
            <div className="w-[40%] bg-[#1e293b] p-1 flex flex-col justify-between border-r border-violet-500/20">
              <div className="space-y-0.5">
                <div className="h-0.5 w-3 bg-violet-400 rounded"></div>
                <div className="h-1.5 w-full bg-white/80 rounded"></div>
                <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1.5 w-4 bg-slate-500/50 rounded"></div>
            </div>
            <div className="w-[60%] bg-slate-200 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        );
      case "editorial-right":
        return (
          <div className="w-full h-20 bg-slate-800 rounded-lg overflow-hidden flex border border-slate-200">
            <div className="w-[60%] bg-slate-200 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="w-[40%] bg-[#1e293b] p-1 flex flex-col justify-between border-l border-violet-500/20">
              <div className="space-y-0.5">
                <div className="h-0.5 w-3 bg-violet-400 rounded"></div>
                <div className="h-1.5 w-full bg-white/80 rounded"></div>
                <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1.5 w-4 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "cinema-bottom":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-0 left-0 w-full h-[35%] bg-slate-900/90 border-t border-violet-500 p-1 flex justify-between items-center">
              <div className="space-y-0.5 w-[70%]">
                <div className="h-1.5 w-full bg-white rounded"></div>
                <div className="h-0.5 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "knockout-type":
        return (
          <div className="w-full h-20 bg-slate-300 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40 z-0"></div>
            <ImageIcon className="h-4 w-4 text-slate-400/60" />
            <div className="absolute inset-0 p-1.5 flex flex-col justify-end z-10 space-y-0.5">
              <div className="h-1 w-4 bg-violet-500 rounded"></div>
              <div className="h-2 w-4/5 bg-white rounded"></div>
              <div className="h-2 w-3/5 bg-white rounded"></div>
              <div className="h-1 w-1/2 bg-slate-300 rounded"></div>
            </div>
          </div>
        );
      case "ticker-strip":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute top-[35%] left-0 w-full h-[30%] bg-slate-950/95 border-y border-violet-500 p-1 flex justify-between items-center">
              <div className="h-1.5 w-2/3 bg-white rounded"></div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "stacked-blocks":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-1 left-1.5 space-y-0.5 flex flex-col items-start max-w-[90%]">
              <div className="bg-slate-900 text-white px-1 py-0.5 rounded shadow border-b border-violet-500">
                <div className="h-1.5 w-8 bg-white rounded"></div>
              </div>
              <div className="bg-white px-1 py-0.5 rounded shadow">
                <div className="h-1 w-10 bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        );
      case "frame-border":
        return (
          <div className="w-full h-20 bg-slate-50 rounded-lg p-1 overflow-hidden flex flex-col justify-between border border-slate-200">
            <div className="w-full h-[70%] bg-slate-200 rounded flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-slate-400" />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <div className="space-y-0.5">
                <div className="h-1 w-10 bg-slate-800 rounded"></div>
                <div className="h-0.5 w-6 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1 w-3 bg-slate-350 rounded"></div>
            </div>
          </div>
        );
      case "diagonal-split":
        return (
          <div className="w-full h-20 bg-[#111827] rounded-lg overflow-hidden relative border border-slate-200">
            <div className="absolute inset-0 bg-slate-200" style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0% 75%)" }}>
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-end z-10">
              <div className="space-y-0.5 max-w-[70%]">
                <div className="h-1.5 w-full bg-white rounded border-l border-violet-500 pl-0.5"></div>
                <div className="h-0.5 w-3/4 bg-slate-400 rounded pl-0.5"></div>
              </div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "neon-minimal":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/30"></div>
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 space-y-0.5">
              <div className="flex gap-0.5">
                <div className="h-1.5 w-4 bg-violet-500 rounded"></div>
                <div className="h-1.5 w-6 bg-white rounded"></div>
                <div className="h-1.5 w-3 bg-violet-500 rounded"></div>
              </div>
              <div className="h-0.5 w-8 bg-slate-300 rounded"></div>
            </div>
          </div>
        );
      case "editorial-grid":
        return (
          <div className="w-full h-20 bg-slate-50 rounded-lg p-1 overflow-hidden flex justify-between items-center border border-slate-200">
            <div className="w-[50%] space-y-1 pl-0.5">
              <div className="h-0.5 w-4 bg-violet-500 rounded"></div>
              <div className="h-2 w-full bg-slate-800 rounded"></div>
              <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
            </div>
            <div className="w-[45%] h-[85%] bg-slate-200 rounded flex items-center justify-center border border-white shadow-sm">
              <ImageIcon className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </div>
        );
    }
  };

function getPlatformLogo(platform: string, className = "h-4 w-4") {
  const p = (platform || "").toLowerCase();
  if (p === "linkedin") return <FaLinkedin className={cn("text-[#0A66C2]", className)} />;
  if (p === "instagram") return <FaInstagram className={cn("text-[#E4405F]", className)} />;
  if (p === "twitter" || p === "x") return <FaXTwitter className={cn("text-slate-900", className)} />;
  if (p === "facebook") return <FaFacebook className={cn("text-[#1877F2]", className)} />;
  if (p === "reddit") return <FaReddit className={cn("text-[#FF4500]", className)} />;
  return <Globe className={cn("text-slate-500", className)} />;
}

  // Profiler collapsible control & Success Modal states
  const [showProfiler, setShowProfiler] = useState(true);
  const [hasInitializedProfilerState, setHasInitializedProfilerState] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calibratedPersonaName, setCalibratedPersonaName] = useState("");

  useEffect(() => {
    if (userProfile && !hasInitializedProfilerState) {
      setShowProfiler(!userProfile.founderAgentSynthesized);
      setHasInitializedProfilerState(true);
    }
  }, [userProfile, hasInitializedProfilerState]);

  // Voice Inputs
  const [voiceDesc, setVoiceDesc] = useState(userProfile?.founderVoiceDescription || "");
  const voiceDescTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVoiceDescFocusedRef = useRef(false);
  const [voiceFile, setVoiceFile] = useState<{ name: string; mimeType: string; data: string } | null>(
    userProfile?.founderVoiceFileName && userProfile?.founderVoiceFileData
      ? {
          name: userProfile.founderVoiceFileName,
          mimeType: userProfile.founderVoiceFileMimeType || "",
          data: userProfile.founderVoiceFileData,
        }
      : null
  );

  // Non-Branded Design Profile
  const [nbColors, setNbColors] = useState<string[]>(userProfile?.nonBrandedColors || ["#7C3AED", "#1E1B4B"]);
  const [nbPrimaryFont, setNbPrimaryFont] = useState(userProfile?.nonBrandedPrimaryFont || "Outfit");
  const [nbSecondaryFont, setNbSecondaryFont] = useState(userProfile?.nonBrandedSecondaryFont || "Inter");
  const [fontSearch, setFontSearch] = useState("");

  // Synthesis logs
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Modal state for popup form
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  // Social Channels Selector Modal state
  const [channelModalBrand, setChannelModalBrand] = useState<any | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']);
  const [selectedUseBrandAssets, setSelectedUseBrandAssets] = useState<boolean | undefined>(undefined);
  const [isSavingChannels, setIsSavingChannels] = useState(false);

  const openChannelSelectorModal = (brand: any) => {
    setChannelModalBrand(brand);
    setSelectedPlatforms(
      brand.targetPlatforms && brand.targetPlatforms.length > 0
        ? brand.targetPlatforms
        : ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']
    );
    setSelectedUseBrandAssets(brand.useBrandAssets);
  };

  // Body scroll locking when any modal is active
  useEffect(() => {
    if (isTopicModalOpen || channelModalBrand || showSuccessModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isTopicModalOpen, channelModalBrand, showSuccessModal]);

  // History tab pagination & layout view mode
  const [historyLayout, setHistoryLayout] = useState<"list" | "grid">("list");
  const [historyPage, setHistoryPage] = useState(1);

  // Founder LinkedIn integration state
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);

  const checkLinkedinStatus = async () => {
    if (!user) return;
    setIsCheckingStatus(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/linkedin/status?productId=founder_${user.uid}`, {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLinkedinConnected(!!data.connected);
        if (data.profile) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            linkedInProfile: {
              name: data.profile.name || userProfile?.linkedInProfile?.name || "",
              picture: data.profile.picture || userProfile?.linkedInProfile?.picture || "",
              headline: data.profile.headline || userProfile?.linkedInProfile?.headline || ""
            }
          }, { merge: true });
        }
        // Automatically fetch latest photo & bio in background
        handleAutoFetchLinkedinProfile(true);
      }
    } catch (err) {
      console.error("Failed to fetch LinkedIn connection status:", err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectLinkedin = async () => {
    if (!user) return;
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/auth/linkedin/url?productId=founder_${user.uid}`, {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setError('Please allow popups for this site to connect your account.');
    } catch (error) {
      logSilentError(error as Error, { context: "handleConnectLinkedinFounder" });
      setError('Failed to initiate LinkedIn connection.');
    }
  };

  const handleDisconnectLinkedin = async () => {
    if (!user) return;
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ productId: `founder_${user.uid}`, platform: 'linkedin' })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to disconnect from LinkedIn');
      }
      setIsLinkedinConnected(false);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleDisconnectLinkedinFounder" });
      setError(err.message || 'Failed to disconnect LinkedIn.');
    }
  };

  const [isAutoFetchingProfile, setIsAutoFetchingProfile] = useState(false);

  const handleAutoFetchLinkedinProfile = async (silent = true) => {
    if (!user) return;
    setIsAutoFetchingProfile(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/linkedin/auto-fetch-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          productId: `founder_${user.uid}`,
          founderName: userProfile?.name || user?.displayName || "",
          linkedinUrl: (userProfile as any)?.linkedinUrl || (userProfile?.linkedInProfile as any)?.url || ""
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            linkedInProfile: data.profile
          }, { merge: true });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (!silent) console.warn("Auto-fetch response:", errData);
      }
    } catch (err: any) {
      if (!silent) console.error("Failed to auto-fetch LinkedIn profile:", err);
    } finally {
      setIsAutoFetchingProfile(false);
    }
  };

  // Automatic Background Profile & Bio Fetcher Trigger
  useEffect(() => {
    if (user && !isAutoFetchingProfile) {
      const headline = userProfile?.linkedInProfile?.headline || "";
      const isGenericHeadline = !headline || headline.includes("User | Founder") || headline.includes("Founder & Executive") || headline.includes("Founder Profile");
      if (isGenericHeadline || !userProfile?.linkedInProfile?.picture) {
        handleAutoFetchLinkedinProfile(true);
      }
    }
  }, [user, userProfile?.linkedInProfile?.headline, userProfile?.linkedInProfile?.picture]);

  const handleManualPublish = async (postId: string) => {
    if (!user) return;
    setPublishingPostId(postId);
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/founder/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ postId })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to publish post');
      }
      alert("Successfully published to LinkedIn!");
      await fetchAutomatedPosts();
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleManualPublishFounder" });
      setError(err.message || 'Failed to publish post to LinkedIn.');
    } finally {
      setPublishingPostId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "generator" && user) {
      checkLinkedinStatus();
    }
  }, [activeTab, user]);

  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkLinkedinStatus();
      }
    };
    window.addEventListener('message', handleOauthMessage);
    return () => window.removeEventListener('message', handleOauthMessage);
  }, [user]);

  // Track run states for products
  const [runningBrandId, setRunningBrandId] = useState<string | null>(null);
  const [brandMessage, setBrandMessage] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // General Post Generator State
  const [postTopic, setPostTopic] = useState("");
  const [postScope, setPostScope] = useState<"general" | "branded">("general");
  const [selectedManualBrands, setSelectedManualBrands] = useState<string[]>([]);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatorLogs, setGeneratorLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Suggestions states (Cached separately for general vs per-brand)
  const [generalSuggestions, setGeneralSuggestions] = useState<{ title: string; description: string; prompt: string }[]>([]);
  const [brandedSuggestionsMap, setBrandedSuggestionsMap] = useState<Record<string, { title: string; description: string; prompt: string }[]>>({});
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Automated posts history states
  const [automatedPosts, setAutomatedPosts] = useState<any[]>([]);
  const [loadingAutoposts, setLoadingAutoposts] = useState(true);

  // Automated Visual Studio Studio State (Client-Side Interactive Canvas)
  const [generatedPostCopy, setGeneratedPostCopy] = useState("");
  const [generatedHeadline, setGeneratedHeadline] = useState("");
  const [generatedSubtext, setGeneratedSubtext] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [trendReport, setTrendReport] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("editorial-left");
  const [selectedPrebuiltTemplate, setSelectedPrebuiltTemplate] = useState<string>("auto");
  const [hasGeneratedOutput, setHasGeneratedOutput] = useState(false);

  // Template Approval Flow State
  const [approvedTemplateId, setApprovedTemplateId] = useState<string | null>(null);
  const [isApprovingTemplate, setIsApprovingTemplate] = useState(false);
  const [approvedTemplateImageUrl, setApprovedTemplateImageUrl] = useState<string | null>(null);

  const fetchTopicSuggestions = async (forceRefresh = false) => {
    if (!userProfile?.founderAgentSynthesized || isFetchingSuggestions) return;

    if (postScope === "general") {
      if (!forceRefresh && generalSuggestions.length > 0) return;
      setIsFetchingSuggestions(true);
      try {
        const list = await generateFounderTopicSuggestions(userProfile.founderAgentSynthesized, user?.uid);
        setGeneralSuggestions(list || []);
      } catch (err) {
        console.error("Failed to fetch general topic suggestions:", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    } else if (postScope === "branded") {
      const targetBrandId = selectedManualBrands[0];
      if (!targetBrandId) return;
      if (!forceRefresh && brandedSuggestionsMap[targetBrandId]?.length > 0) return;

      const targetProd = products.find((p) => p.id === targetBrandId);
      if (!targetProd) return;

      setIsFetchingSuggestions(true);
      try {
        const list = await generateFounderTopicSuggestions(userProfile.founderAgentSynthesized, user?.uid, targetProd);
        setBrandedSuggestionsMap((prev) => ({ ...prev, [targetBrandId]: list || [] }));
      } catch (err) {
        console.error("Failed to fetch branded topic suggestions:", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }
  };

  const handleGeneratePost = async () => {
    if (!userProfile?.founderAgentSynthesized) {
      setError("You must first synthesize your Founder Brain before generating founder posts.");
      return;
    }
    if (!postTopic.trim()) {
      setError("Please input a topic or core thought for your post.");
      return;
    }
    if (postScope === "branded" && selectedManualBrands.length === 0) {
      setError("Please select at least one brand/product to focus on.");
      return;
    }

    setError(null);
    setIsTopicModalOpen(false);
    console.log(`\n======================================================`);
    console.log(`[STUDIO STEP 1/5] handleGeneratePostStudio triggered. Topic: "${postTopic}", Scope: "${postScope}" -> PASSED`);
    setIsGeneratingPost(true);
    setGeneratorLogs(["Spawning virtual Founder Brain...", `Topic: "${postTopic}"`]);
    try {
      let result: any = null;
      let targetProduct: any = null;
      let resolvedLayoutId: string = selectedPrebuiltTemplate !== "auto" ? selectedPrebuiltTemplate : "editorial-left";
      let reportData: any = null;

      // STEP 1: Determine Visual Template FIRST (Before Copy & Image Gen)
      if (selectedPrebuiltTemplate !== "auto") {
        console.log(`[STUDIO STEP 1/4] Prebuilt template selected: "${selectedPrebuiltTemplate}". SKIPPING live template research!`);
        setGeneratorLogs(p => [...p, `⚡ Prebuilt Template selected: [${selectedPrebuiltTemplate}]. Skipping live research to save tokens...`]);

        const prebuiltList = [
          { id: "x-tweet-card", name: "X (Twitter) Viral Tweet Card", primaryColor: "#1D9BF0", secondaryColor: "#000000", fontFamily: "Inter", isLightBg: false },
          { id: "contrarian-card", name: "Contrarian Hot Take Card", primaryColor: "#EC4899", secondaryColor: "#08080C", fontFamily: "Inter", isLightBg: false },
          { id: "editorial-left", name: "Editorial Left Panel", primaryColor: "#F59E0B", secondaryColor: "#08080C", fontFamily: "Inter", isLightBg: false },
          { id: "framed-mockup", name: "Framed Screenshot Mockup", primaryColor: "#7C3AED", secondaryColor: "#0F172A", fontFamily: "Outfit", isLightBg: false }
        ];
        const chosen = prebuiltList.find(t => t.id === selectedPrebuiltTemplate) || prebuiltList[0];
        reportData = { summary: "Prebuilt Template Selection", viralPick: chosen, discoveredTemplates: prebuiltList };
        setTrendReport(reportData);
        setSelectedTemplateId(chosen.id);
        resolvedLayoutId = chosen.id;
      } else {
        console.log(`[STUDIO STEP 1/4] Querying researchVisualTrends() FIRST...`);
        setGeneratorLogs(p => [...p, "🔍 Querying live market trend research engine via Gemini 3.1 Pro..."]);
        try {
          reportData = await researchVisualTrends();
          if (reportData?.discoveredTemplates?.length > 0) {
            reportData.discoveredTemplates = reportData.discoveredTemplates.map((dt: any, idx: number) => ({
              ...dt,
              id: dt.id && typeof dt.id === 'string' ? dt.id : `dynamic-fallback-${Date.now()}-${idx}`
            }));
            setTrendReport(reportData);
            const topId = reportData.discoveredTemplates[0].id;
            resolvedLayoutId = topId;
            setSelectedTemplateId(topId);

            if (user) {
              for (const dt of reportData.discoveredTemplates) {
                if (dt.rawHtml && typeof dt.rawHtml === 'string' && dt.rawHtml.trim().length > 30) {
                  const tplRef = doc(db, "users", user.uid, "saved_templates", dt.id);
                  setDoc(tplRef, {
                    ...dt,
                    savedAt: new Date().toISOString(),
                    source: "master-founder-research"
                  }, { merge: true }).catch(err => console.warn("Failed to auto-save template to library:", err));
                }
              }
            }

            const isStaticFallback = ["editorial-left", "contrarian-card", "framed-mockup", "brutalist-hero", "quote-spotlight", "stat-billboard"].includes(topId);
            setGeneratorLogs(p => [...p, `✓ Synthesized ${reportData.discoveredTemplates.length} visual trends (${isStaticFallback ? 'Static Fallback' : 'Dynamic AI'}). Saved to Template Library! Top choice: [${reportData.discoveredTemplates[0].name}]`]);
          }
        } catch (resErr: any) {
          console.error("[STUDIO STEP 1/4] Visual Trend Research -> FAILED with exception:", resErr);
        }
      }

      // STEP 2: Generate Post Copy & Image with Layout Context
      if (postScope === "general") {
        console.log(`[STUDIO STEP 2/4] Calling generateGeneralFounderPost with layout: "${resolvedLayoutId}"...`);
        setGeneratorLogs(p => [...p, "Drafting organic social copy & visual hook..."]);
        result = await generateGeneralFounderPost({
          topic: postTopic,
          attachmentStyle: "image-overlay",
          founderAgent: userProfile.founderAgentSynthesized,
          userId: user?.uid,
          layoutId: resolvedLayoutId
        });
      } else {
        targetProduct = products.find(p => p.id === selectedManualBrands[0]) || products[0];
        console.log(`[STUDIO STEP 2/4] Calling generateBrandedFounderPost for brand: "${targetProduct?.name}" with layout: "${resolvedLayoutId}"...`);
        setGeneratorLogs(p => [...p, `Drafting branded copy for: ${targetProduct?.name || 'Selected Product'}...`]);
        result = await generateBrandedFounderPost({
          topic: postTopic,
          attachmentStyle: "image-overlay",
          founderAgent: userProfile.founderAgentSynthesized,
          product: targetProduct,
          userId: user?.uid,
          layoutId: resolvedLayoutId
        });
      }

      if (result) {
        console.log(`[STUDIO STEP 3/4] Copy & backdrop image generation -> PASSED (Headline: "${result.headline}")`);
        setGeneratorLogs(p => [...p, "✓ Copy and backdrop image generated successfully."]);
        
        let finalCopy = result.postCopy || "";
        if (postScope === "branded" && targetProduct) {
          const website = targetProduct.website || targetProduct.url || targetProduct.domain;
          if (website) {
            const formattedLink = website.startsWith('http') ? website : `https://${website}`;
            if (!finalCopy.includes(website) && !finalCopy.includes(formattedLink)) {
              finalCopy = `${finalCopy.trim()}\n\n🔗 ${formattedLink}`;
            }
          }
        }
        
        setGeneratedPostCopy(finalCopy);
        setGeneratedHeadline(result.headline || "Key Founder Insight");
        setGeneratedSubtext(result.subtext || "Value-driven lesson");
        if (result.imageUrl) {
          setGeneratedImageUrl(result.imageUrl);
        }

        setHasGeneratedOutput(true);

        // Reset approval state for the new draft
        setApprovedTemplateId(null);
        setApprovedTemplateImageUrl(null);

        // STEP 4: Save post to Firestore history
        console.log(`[STUDIO STEP 4/4] Saving generated post to Firestore with layoutId: "${resolvedLayoutId}"...`);
        const newPostId = 'fpost_' + Math.random().toString(36).substring(2, 11);
        const newPost = {
          id: newPostId,
          userId: user?.uid || null,
          postCopy: finalCopy,
          imageUrl: result.imageUrl || STOCK_IMAGES[0].url,
          headline: result.headline || null,
          subtext: result.subtext || null,
          imagePrompt: result.imagePrompt || null,
          layoutId: resolvedLayoutId || "editorial-left",
          approvedTemplateImage: null,
          createdAt: new Date().toISOString(),
          status: "scheduled",
          topic: result.headline || postTopic || null,
          isBranded: postScope === "branded",
          productId: targetProduct?.id || null
        };
        await setDoc(doc(db, "users", user!.uid, "founder_posts", newPostId), newPost);
        await fetchAutomatedPosts();
        console.log(`[STUDIO STEP 4/4] Save to Firestore -> PASSED (Post ID: ${newPostId})`);
        console.log(`======================================================\n`);
      } else {
        console.error(`[STUDIO STEP 2/5] Copy generation returned null result -> FAILED`);
      }
    } catch (err: any) {
      console.error(`[STUDIO handleGeneratePostStudio EXCEPTION] -> FAILED:`, err);
      logSilentError(err, { context: "handleGeneratePostStudio" });
      setError("Failed to generate post. Please check your AI connection.");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Helper to downscale and compress base64 image strings safely under Firestore 1MB document limit
  const compressDataUrl = async (dataUrl: string, maxBytes: number = 500000): Promise<string> => {
    if (dataUrl.length <= maxBytes) return dataUrl;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > 900 || height > 900) {
          const ratio = Math.min(900 / width, 900 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.70;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        while (compressed.length > maxBytes && quality > 0.25) {
          quality -= 0.10;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Active product for branded posts
  const activeProduct = postScope === "branded" ? (products.find(p => p.id === selectedManualBrands[0]) || products[0]) : null;
  const activeDiscovered = trendReport?.discoveredTemplates?.find((t: any) => t.id === selectedTemplateId) || trendReport?.discoveredTemplates?.[0];

  const primaryColor = activeProduct?.visualData?.colors?.[0] || (activeProduct as any)?.colors?.[0] || activeDiscovered?.primaryColor || "#7C3AED";
  const secondaryColor = activeProduct?.visualData?.colors?.[1] || (activeProduct as any)?.colors?.[1] || activeDiscovered?.secondaryColor || "#08080C";
  const fontFamily = activeProduct?.visualData?.fonts?.primary || activeDiscovered?.fontFamily || "Inter";
  // Omit brand logo from graphic visuals per user directive; brand website link is placed in post text copy instead
  const logoUrl = null;
  const currentImageUrl = generatedImageUrl || STOCK_IMAGES[0].url;

  // Personal Founder Identity Resolution (Name, LinkedIn Photo, Role/Headline)
  const founderAuthorName = userProfile?.linkedInProfile?.name
    || userProfile?.name
    || user?.displayName
    || userProfile?.founderAgentSynthesized?.personaName
    || "Founder Insight";

  // STRICT LINKEDIN AVATAR: Use LinkedIn picture or custom profile avatar, DO NOT use Google account photo
  const founderAuthorAvatar = userProfile?.linkedInProfile?.picture
    || (userProfile as any)?.avatarUrl
    || (userProfile as any)?.profilePicture
    || null;

  // STRICT LINKEDIN BIO / HEADLINE: Use LinkedIn headline or user custom founder bio
  const founderAuthorHeadline = userProfile?.linkedInProfile?.headline
    || (userProfile as any)?.founderBio
    || (userProfile as any)?.headline
    || (userProfile?.role && userProfile?.founderAgentSynthesized?.targetIndustry 
        ? `${userProfile.role} @ ${userProfile.founderAgentSynthesized.targetIndustry}` 
        : userProfile?.role 
          || (userProfile?.founderAgentSynthesized?.targetIndustry 
              ? `${userProfile.founderAgentSynthesized.targetIndustry} Founder`
              : "Founder & Executive • Daily Strategy"));

  // Render PURELY from the selected template blueprint or AI-researched rawHtml template!
  let previewHtml = "";
  if (selectedTemplateId && LAYOUT_BLUEPRINTS[selectedTemplateId]) {
    previewHtml = LAYOUT_BLUEPRINTS[selectedTemplateId].buildHtml({
      headline: generatedHeadline,
      subtext: generatedSubtext,
      imageUrl: currentImageUrl,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      authorName: founderAuthorName,
      authorAvatar: founderAuthorAvatar,
      authorBio: founderAuthorHeadline
    });
  } else if (activeDiscovered?.rawHtml && activeDiscovered.rawHtml.trim().length > 30) {
    previewHtml = renderDiscoveredHtml(activeDiscovered.rawHtml, {
      headline: generatedHeadline,
      subtext: generatedSubtext,
      imageUrl: currentImageUrl,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      authorName: founderAuthorName,
      authorAvatar: founderAuthorAvatar,
      authorBio: founderAuthorHeadline
    });
  } else if (hasGeneratedOutput) {
    // Emergency client-side fallback: generate a quality editorial template so the canvas is never blank
    console.warn(`[STUDIO CANVAS] rawHtml empty for template "${activeDiscovered?.id || 'none'}". Rendering client fallback.`);
    const logoMarkup = logoUrl
      ? `<img src="${logoUrl}" style="max-height:45px;max-width:150px;object-fit:contain;" alt="Brand Logo" />`
      : "";
    previewHtml = `<div style="width:1080px;height:1080px;display:flex;background:${secondaryColor};overflow:hidden;font-family:'${fontFamily}',system-ui,sans-serif;box-sizing:border-box;">
      <div style="width:45%;padding:60px 40px;display:flex;flex-direction:column;justify-content:space-between;border-right:2px solid ${primaryColor};box-sizing:border-box;background:${secondaryColor};position:relative;z-index:10;">
        <div style="display:flex;flex-direction:column;gap:24px;margin-top:60px;">
          <div style="width:50px;height:6px;background:${primaryColor};border-radius:3px;"></div>
          <h2 style="color:#ffffff;font-weight:800;font-size:48px;line-height:1.2;margin:0;word-break:break-word;">${generatedHeadline || "Your Founder Insight"}</h2>
          <p style="color:#cbd5e1;font-weight:400;font-size:20px;line-height:1.5;margin:0;word-break:break-word;">${generatedSubtext || ""}</p>
        </div>
        <div>${logoMarkup}</div>
      </div>
      <div style="width:55%;position:relative;overflow:hidden;height:100%;">
        <img src="${currentImageUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>`;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${TEMPLATE_CSP_META}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&family=Outfit:wght@300;400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;500;700;800&family=Clash+Display:wght@400;600;700&display=swap" rel="stylesheet" crossorigin="anonymous">
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 1080px;
            height: 1080px;
            background: #000;
          }
        </style>
      </head>
      <body>
        ${previewHtml}
      </body>
    </html>
  `;

  // ─── Template Capture & Fallback Helper ───
  const captureTemplateAsJpeg = async (): Promise<string> => {
    // 1. Try to capture the already-rendered iframe first! (This solves missing SVG xmlns or CSS rendering bugs)
    try {
      const iframe = document.getElementById("visual-studio-canvas-preview") as HTMLIFrameElement;
      if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
        const iframeDataUrl = await toJpeg(iframe.contentDocument.body, {
          cacheBust: true,
          width: 1080,
          height: 1080,
          style: { margin: "0" },
          quality: 0.90,
          pixelRatio: 1
        });
        if (iframeDataUrl && iframeDataUrl.startsWith("data:image") && iframeDataUrl.length > 1000) {
          return iframeDataUrl;
        }
      }
    } catch (iframeErr) {
      console.warn("[captureTemplateAsJpeg] Iframe capture failed, falling back to hidden offscreen container:", iframeErr);
    }

    // 2. Fallback to hidden container if iframe capture failed
    let hiddenContainer: HTMLDivElement | null = null;
    try {
      hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "fixed";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.top = "-9999px";
      hiddenContainer.style.width = "1080px";
      hiddenContainer.style.height = "1080px";
      hiddenContainer.style.overflow = "hidden";
      hiddenContainer.style.zIndex = "-9999";
      hiddenContainer.style.backgroundColor = secondaryColor || "#08080C";
      hiddenContainer.innerHTML = previewHtml || fullHtml;
      document.body.appendChild(hiddenContainer);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toJpeg(hiddenContainer, {
        cacheBust: true,
        width: 1080,
        height: 1080,
        style: { margin: "0" },
        quality: 0.85,
        pixelRatio: 1
      });

      if (dataUrl && dataUrl.startsWith("data:image") && dataUrl.length > 1000) {
        return dataUrl;
      }
    } catch (e1) {
      console.warn("[captureTemplateAsJpeg] Offscreen DOM toJpeg capture warning:", e1);
    } finally {
      if (hiddenContainer && hiddenContainer.parentNode) {
        hiddenContainer.parentNode.removeChild(hiddenContainer);
      }
    }

    return await renderVisualCanvasFallback(
      generatedHeadline || (generatedPostCopy ? generatedPostCopy.slice(0, 60) : "Founder Post"),
      generatedSubtext || "",
      currentImageUrl,
      primaryColor,
      secondaryColor,
      logoUrl
    );
  };

  // ─── Template Approval Handler ───
  const handleApproveTemplate = async () => {
    if (!user || automatedPosts.length === 0) return;
    setIsApprovingTemplate(true);
    try {
      const rawDataUrl = await captureTemplateAsJpeg();
      const dataUrl = await compressDataUrl(rawDataUrl, 500000);

      // Update the latest post in Firestore with the approved template composite
      const latestPost = automatedPosts[0];
      const postRef = doc(db, "users", user.uid, "founder_posts", latestPost.id);
      await updateDoc(postRef, {
        approvedTemplateImage: dataUrl,
        layoutId: selectedTemplateId
      });

      setApprovedTemplateId(selectedTemplateId);
      setApprovedTemplateImageUrl(dataUrl);

      // Refresh the posts list to pick up the change
      await fetchAutomatedPosts();
      console.log(`[TEMPLATE APPROVAL] Template "${selectedTemplateId}" approved and composite saved cleanly (${Math.round(dataUrl.length / 1024)} KB).`);
    } catch (err: any) {
      console.error("[TEMPLATE APPROVAL] Failed to approve template:", err);
      setError("Failed to capture template visual. Try again.");
    } finally {
      setIsApprovingTemplate(false);
    }
  };

  const fetchAutomatedPosts = async () => {
    if (!user) return;
    setLoadingAutoposts(true);
    try {
      const postsRef = collection(db, "users", user.uid, "founder_posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAutomatedPosts(list);
    } catch (err) {
      console.error("Failed to fetch automated posts:", err);
    } finally {
      setLoadingAutoposts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, "users", user.uid, "founder_posts", postId);
      await deleteDoc(postRef);
      setAutomatedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAutomatedPosts();
    }
  }, [user, activeTab]);

  // Optional Strategy Overrides during synthesis
  const [showOptionalInputs, setShowOptionalInputs] = useState(false);
  const [optIndustry, setOptIndustry] = useState("");
  const [optAudience, setOptAudience] = useState("");
  const [optVision, setOptVision] = useState("");
  const [optMission, setOptMission] = useState("");
  const [optGoal, setOptGoal] = useState("");
  const [optPillars, setOptPillars] = useState("");

  useEffect(() => {
    if (!isTopicModalOpen || !userProfile?.founderAgentSynthesized) return;

    if (postScope === "general") {
      if (generalSuggestions.length === 0 && !isFetchingSuggestions) {
        fetchTopicSuggestions(false);
      }
    } else if (postScope === "branded") {
      const targetBrandId = selectedManualBrands[0];
      if (targetBrandId && !brandedSuggestionsMap[targetBrandId] && !isFetchingSuggestions) {
        fetchTopicSuggestions(false);
      }
    }
  }, [isTopicModalOpen, postScope, selectedManualBrands, userProfile]);

  useEffect(() => {
    if (userProfile) {
      if (!isVoiceDescFocusedRef.current && !voiceDescTimeoutRef.current) {
        setVoiceDesc(userProfile.founderVoiceDescription || "");
      }
      if (userProfile.founderVoiceFileName && userProfile.founderVoiceFileData) {
        setVoiceFile({
          name: userProfile.founderVoiceFileName,
          mimeType: userProfile.founderVoiceFileMimeType || "",
          data: userProfile.founderVoiceFileData,
        });
      }
      if (userProfile.nonBrandedColors) {
        setNbColors(userProfile.nonBrandedColors);
      }
      if (userProfile.nonBrandedPrimaryFont) {
        setNbPrimaryFont(userProfile.nonBrandedPrimaryFont);
      }
      if (userProfile.nonBrandedSecondaryFont) {
        setNbSecondaryFont(userProfile.nonBrandedSecondaryFont);
      }
    }
  }, [userProfile]);

  const handleVoiceDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setVoiceDesc(val);
    if (voiceDescTimeoutRef.current) {
      clearTimeout(voiceDescTimeoutRef.current);
    }
    voiceDescTimeoutRef.current = setTimeout(() => {
      saveProfileData({ founderVoiceDescription: val });
      voiceDescTimeoutRef.current = null;
    }, 1000);
  };

  const handleVoiceDescBlur = () => {
    isVoiceDescFocusedRef.current = false;
    if (voiceDescTimeoutRef.current) {
      clearTimeout(voiceDescTimeoutRef.current);
      voiceDescTimeoutRef.current = null;
    }
    saveProfileData({ founderVoiceDescription: voiceDesc });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Training file size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setVoiceFile({ name: file.name, mimeType: file.type, data: base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setVoiceFile(null);
  };

  const saveProfileData = async (updatedFields: Partial<typeof userProfile>) => {
    if (!user) return;
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const payload = { ...updatedFields, userId: user.uid };
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        // Fallback to client setDoc with merge: true
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, updatedFields, { merge: true });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, updatedFields, { merge: true });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (clientErr: any) {
        logSilentError(clientErr, { context: "saveUserProfileFields" });
        setError("Failed to update profile fields in database.");
      }
    }
  };

  const handleColorChange = (idx: number, hex: string) => {
    const next = [...nbColors];
    next[idx] = hex;
    setNbColors(next);
    saveProfileData({ nonBrandedColors: next });
  };

  const handleSynthesize = async () => {
    if (!user) return;
    if (!voiceDesc && !voiceFile) {
      setError("Please input a description or upload a document to train the agent.");
      return;
    }
    setError(null);
    setIsSynthesizing(true);
    setProgress(5);
    setLogs(["Initializing Master Cognitive Profiler...", "Parsing founder profile metadata..."]);

    try {
      const t1 = setTimeout(() => { setLogs(p => [...p, "Running semantic voice analysis..."]); setProgress(25); }, 800);
      const t2 = setTimeout(() => { setLogs(p => [...p, "Synthesizing styles and vocab heuristics..."]); setProgress(55); }, 1600);
      const t3 = setTimeout(() => { setLogs(p => [...p, "Modeling core decisions structure..."]); setProgress(80); }, 2400);

      // Build products context
      const productsContext = products.map(p => `
Brand: ${p.name}
Website: ${p.website}
Description: ${p.description || "N/A"}
Positioning: ${p.positioning || "N/A"}
Audience: ${p.audience || "N/A"}
Stage: ${p.stage || "N/A"}
Content Pillars: ${p.contentPillars?.join(", ") || "N/A"}
`).join("\n---\n");

      // Build optional inputs overrides
      const optionalInputs = {
        targetIndustry: optIndustry,
        targetAudience: optAudience,
        vision: optVision,
        mission: optMission,
        goal: optGoal,
        contentPillars: optPillars
      };

      const docObj = voiceFile ? { data: voiceFile.data, mimeType: voiceFile.mimeType } : null;
      const profile = await synthesizeFounderAgent(voiceDesc, docObj, user.uid, productsContext, optionalInputs);

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setLogs(p => [...p, "✓ Cognitive Synthesis Complete.", `Activated Founder Brain: "${profile.personaName}"`]);
      setProgress(100);

      const payload = {
        founderVoiceDescription: voiceDesc,
        founderVoiceFileName: voiceFile?.name || "",
        founderVoiceFileMimeType: voiceFile?.mimeType || "",
        founderVoiceFileData: voiceFile?.data || "",
        founderAgentSynthesized: {
          ...profile,
          synthesizedAt: new Date().toISOString()
        }
      };

      await saveProfileData(payload);

      // Trigger UX modal and collapse profiler
      setCalibratedPersonaName(profile.personaName);
      setShowSuccessModal(true);
      setShowProfiler(false);

      // Trigger Founder Agent Email
      if (user.email) {
        try {
          const { generateFounderAgentPDF } = await import("../lib/pdfGenerator");
          const mockProduct = {
            name: "B2P Workspace",
            founderVoiceDescription: voiceDesc,
            founderAgentSynthesized: payload.founderAgentSynthesized
          };
          const pdfDoc = await generateFounderAgentPDF(mockProduct as any);
          const pdfBase64 = pdfDoc.output("datauristring");
          const { triggerBrandedEmail } = await import("../lib/emailTriggers");
          await triggerBrandedEmail(
            "founder_agent",
            user.email,
            { personaName: profile.personaName, productName: "B2P Workspace" },
            pdfBase64
          );
        } catch (emailErr) {
          logSilentError(emailErr as Error, { context: "sendGlobalFounderEmail" });
        }
      }

      setIsSynthesizing(false);
    } catch (err: any) {
      logSilentError(err, { context: "handleSynthesizeMasterFounder" });
      setError("AI Synthesis failed. Please verify API configuration and try again.");
      setIsSynthesizing(false);
    }
  };

  // Central trigger automation for a specific product
  const handleTriggerBrandRun = async (brandId: string) => {
    setRunningBrandId(brandId);
    setBrandMessage(prev => ({ ...prev, [brandId]: { type: "success", text: "" } }));
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/automation/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ productId: brandId })
      });
      if (res.ok) {
        setBrandMessage(prev => ({ 
          ...prev, 
          [brandId]: { type: "success", text: "Successfully triggered daily run! Check schedule tab." } 
        }));
      } else {
        const errorData = await res.json();
        setBrandMessage(prev => ({ 
          ...prev, 
          [brandId]: { type: "error", text: errorData.error || "Execution failed." } 
        }));
      }
    } catch (err: any) {
      logSilentError(err, { context: "manualTriggerBrandRun" });
      setBrandMessage(prev => ({ 
        ...prev, 
        [brandId]: { type: "error", text: "Connection error occurred." } 
      }));
    } finally {
      setRunningBrandId(null);
    }
  };

  // Post generation functionality removed as requested. Ready for new specification.

  // Clipboard copy helper
  const handleCopy = () => {
    if (!generatedPostCopy) return;
    navigator.clipboard.writeText(generatedPostCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter Google Fonts for primary/secondary selectors
  const filteredFonts = fontSearch.trim()
    ? POPULAR_FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()))
    : POPULAR_FONTS;

  // Build Mock DNA for non-branded VisualEngine preview
  const mockNbDna = {
    name: "Master Founder",
    logoUrl: "", logoDarkUrl: "", logoLightUrl: "",
    visualData: {
      colors: nbColors,
      fonts: {
        primary: nbPrimaryFont,
        secondary: nbSecondaryFont
      },
      typographyHierarchy: "standard",
      imageStyle: "editorial"
    }
  } as any;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Luxury Minimal Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 text-left">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-650 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-805 font-display">Founder Agent</h1>
              {userProfile?.founderAgentSynthesized ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5" /> Founder Brain Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider">
                  Not Synthesized
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-light max-w-2xl leading-relaxed">
              Your centralized Digital Founder Brain control board. Define your persona once and deploy it across all brands. Manages schedules, triggers content, and monitors daily automations.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
          <p className="text-xs text-red-650 font-semibold">{error}</p>
        </div>
      )}

      {/* Main Layout: Left Vertical Tab Nav + Right Content Area (matches ProductDNA) */}
      <div className="flex gap-8 items-start text-left mt-6">
        
        {/* Desktop: Vertical Mini Sidebar Navigation */}
        <nav className="hidden md:flex flex-col shrink-0 w-44 pt-1 sticky top-8 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Master Agent</p>
          {[
            { key: "brain", label: "Founder Brain" },
            { key: "brands", label: "Brand Control Board" },
            { key: "generator", label: "Founder Post Generator" },
            { key: "history", label: "Founder Post History" }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`text-left px-3 py-2.5 text-xs transition-all duration-150 border-l-2 ${
                  isActive
                    ? "border-[#7C3AED] text-slate-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile: Horizontal Scroll Tabs */}
        <div className="md:hidden w-full mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { key: "brain", label: "Founder Brain" },
            { key: "brands", label: "Brand Control Board" },
            { key: "generator", label: "Founder Post Generator" },
            { key: "history", label: "Founder Post History" }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive ? "bg-[#7C3AED] text-white" : "text-slate-500 bg-slate-100 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
            {activeTab === "brain" ? (
              <div className="space-y-6">
                
                {/* Active control toggle bar */}
                {userProfile?.founderAgentSynthesized && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-900/10 rounded-2xl p-4 gap-3 shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Founder Brain Calibrated</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProfiler(!showProfiler)}
                      className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] border border-slate-200/80 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all cursor-pointer select-none text-center"
                    >
                      {showProfiler ? "Hide Profiler & Style Settings" : "Configure Voice Inputs & Style"}
                    </button>
                  </div>
                )}

                {/* Row 1: Collapsible Setup Tools */}
                {showProfiler && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in slide-in-from-top-1 duration-200">
                    
                    {/* Column 1: AI Founder Brain Profiler Uploader Tool */}
                    <BentoCard span={1} className="!bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <SectionTitle icon={Sparkles} title="Founder Brain AI Profiler" />
                        <p className="text-xs text-slate-500 leading-relaxed mb-5 font-light">
                          Feed descriptions of your personal voice or upload blog drafts/diary texts to synthesize your virtual Founder Brain.
                        </p>
                        
                        <div className="space-y-5">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                                <MessageSquare className="h-3 w-3 text-slate-455" /> Voice Description
                              </label>
                              <AnimatePresence>
                                {saved && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.85, y: -2 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: -2 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-xs"
                                  >
                                    <Check className="h-2.5 w-2.5 text-emerald-500" strokeWidth={2.5} /> Saved
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <textarea
                              value={voiceDesc}
                              onFocus={() => { isVoiceDescFocusedRef.current = true; }}
                              onChange={handleVoiceDescChange}
                              onBlur={handleVoiceDescBlur}
                              rows={4}
                              className="w-full bg-white border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2.5 text-xs text-slate-805 placeholder-slate-300 outline-none resize-none transition-colors"
                              placeholder="e.g. I prefer punchy sentences, speak skeptically of corporate speak, and focus on developer problems..."
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">
                              <FileText className="h-3 w-3 text-slate-455" /> Voice Training Document
                            </label>
                            {voiceFile ? (
                              <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                                  <p className="text-xs font-semibold text-slate-700 truncate min-w-0">{voiceFile.name}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRemoveFile();
                                    saveProfileData({
                                      founderVoiceFileName: "",
                                      founderVoiceFileData: "",
                                      founderVoiceFileMimeType: "",
                                    });
                                  }}
                                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-100 transition-all shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-355 transition-colors cursor-pointer"
                              />
                            )}
                          </div>

                          {/* Optional Strategic Overrides Collapsible Drawer */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => setShowOptionalInputs(!showOptionalInputs)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-wider transition-colors"
                            >
                              <span>Optional strategy overrides</span>
                              <ChevronRight className={`h-3.5 w-3.5 text-slate-450 transition-transform ${showOptionalInputs ? 'rotate-90' : ''}`} />
                            </button>
                            {showOptionalInputs && (
                              <div className="p-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Industry</label>
                                  <input 
                                    type="text" 
                                    value={optIndustry} 
                                    onChange={e => setOptIndustry(e.target.value)} 
                                    placeholder="e.g. AI DevTools"
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
                                  <input 
                                    type="text" 
                                    value={optAudience} 
                                    onChange={e => setOptAudience(e.target.value)} 
                                    placeholder="e.g. CTOs, Tech Founders"
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-755 focus:border-violet-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vision</label>
                                  <input 
                                    type="text" 
                                    value={optVision} 
                                    onChange={e => setOptVision(e.target.value)} 
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mission</label>
                                  <input 
                                    type="text" 
                                    value={optMission} 
                                    onChange={e => setOptMission(e.target.value)} 
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Goal</label>
                                  <input 
                                    type="text" 
                                    value={optGoal} 
                                    onChange={e => setOptGoal(e.target.value)} 
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Content Pillars (Comma separated)</label>
                                  <input 
                                    type="text" 
                                    value={optPillars} 
                                    onChange={e => setOptPillars(e.target.value)} 
                                    placeholder="e.g. system design, lean teams"
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-3">
                        <button
                          type="button"
                          onClick={handleSynthesize}
                          disabled={isSynthesizing || (!voiceDesc && !voiceFile)}
                          className="w-full bg-violet-600 hover:bg-violet-750 text-white rounded-xl py-3 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase"
                        >
                          {isSynthesizing ? (
                            <>
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                              <span>Profiling Founder Brain...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Synthesize Founder Brain</span>
                            </>
                          )}
                        </button>
                      </div>
                    </BentoCard>

                    {/* Column 2: Personal Brand Graphic Styling */}
                    <BentoCard span={1} className="flex flex-col justify-between">
                      <div className="space-y-6">
                        {/* Color Palette section */}
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4 text-violet-500" />
                              <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Color Palette</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (nbColors.length < 8) {
                                  const nextColors = [...nbColors, "#7C3AED"];
                                  setNbColors(nextColors);
                                  saveProfileData({ nonBrandedColors: nextColors });
                                }
                              }}
                              className="text-[10px] font-bold text-[#7C3AED] hover:bg-violet-50 px-2.5 py-1 rounded-lg border border-transparent hover:border-violet-100 transition"
                            >
                              + Add
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {nbColors.map((color, idx) => (
                              <div key={idx} className="relative group flex flex-col items-center">
                                <div 
                                  className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 cursor-pointer relative"
                                  style={{ backgroundColor: color }}
                                >
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(idx, e.target.value)}
                                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 outline-none bg-transparent opacity-0"
                                  />
                                </div>
                                <span className="text-[9px] font-mono text-slate-450 mt-1.5 uppercase tracking-wider">{color}</span>
                                {nbColors.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextColors = nbColors.filter((_, i) => i !== idx);
                                      setNbColors(nextColors);
                                      await saveProfileData({ nonBrandedColors: nextColors });
                                    }}
                                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Typography section */}
                        <div>
                          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                            <Type className="h-4 w-4 text-violet-500" />
                            <h3 className="text-xs font-bold text-slate-855 uppercase tracking-wider">Typography</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Primary */}
                            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex items-center gap-3">
                              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white border border-slate-150 text-base font-bold text-slate-700 font-display shadow-sm shrink-0">
                                Aa
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block mb-0.5">Primary (Headings)</span>
                                <select
                                  value={nbPrimaryFont}
                                  onChange={async (e) => {
                                    setNbPrimaryFont(e.target.value);
                                    await saveProfileData({ nonBrandedPrimaryFont: e.target.value });
                                  }}
                                  className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-705 p-0 focus:ring-0 cursor-pointer"
                                >
                                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Secondary */}
                            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex items-center gap-3">
                              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white border border-slate-150 text-base font-bold text-slate-700 font-display shadow-sm shrink-0">
                                Aa
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-455 uppercase tracking-widest block mb-0.5">Secondary (Body)</span>
                                <select
                                  value={nbSecondaryFont}
                                  onChange={async (e) => {
                                    setNbSecondaryFont(e.target.value);
                                    await saveProfileData({ nonBrandedSecondaryFont: e.target.value });
                                  }}
                                  className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-705 p-0 focus:ring-0 cursor-pointer"
                                >
                                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Synthesizer Terminal logs */}
                      {isSynthesizing && (
                        <div className="mt-6 border border-slate-800 rounded-xl bg-slate-900 p-4 font-mono text-[10px] text-slate-300 space-y-2 select-none">
                          <div className="flex justify-between text-[9px] text-violet-400 font-bold uppercase tracking-wider">
                            <span>Engine Terminal</span><span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-violet-500 h-1 rounded-full transition-all duration-350" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto pt-2">
                            {logs.map((log, idx) => (
                              <p key={idx} className={log.startsWith("✓") ? "text-emerald-400 font-semibold" : "text-slate-400"}>{log}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </BentoCard>
                  </div>
                )}

                {/* Bento Grid: Active Founder Brain Details */}
                {userProfile?.founderAgentSynthesized && !isSynthesizing ? (
                  <div className="w-full animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Card 1: Identity & Sync Status */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between relative overflow-hidden lg:col-span-4 md:col-span-2">
                        {/* Interactive Brainwave animation background */}
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                          <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
                            <path d="M10 60 C 30 30, 50 90, 70 60 C 90 30, 110 90, 130 60 C 150 30, 170 90, 190 60" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                            <path d="M20 70 C 40 40, 60 100, 80 70 C 100 40, 120 100, 140 70 C 160 40, 180 100, 200 70" stroke="#2583EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                          </svg>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 border border-violet-200/50 font-display text-lg font-bold shrink-0">
                                {userProfile.founderAgentSynthesized.personaName?.charAt(0) || "F"}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                                  {userProfile.founderAgentSynthesized.personaName || "Active Founder Brain"}
                                </h3>
                                <p className="text-[9px] text-violet-500 font-bold uppercase tracking-wider">Founder Persona Twin</p>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100" />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-455">Sync Status</span>
                              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                Online & Active
                              </span>
                            </div>
                            {userProfile.founderAgentSynthesized.synthesizedAt && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-455">Last Calibrated</span>
                                <span className="font-mono text-slate-600 text-[11px]">
                                  {new Date(userProfile.founderAgentSynthesized.synthesizedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cognitive DNA Clone</span>
                          <span className="text-violet-500 font-medium font-mono text-[10px]">Arthur V1.2</span>
                        </div>
                      </div>

                      {/* Card 2: Strategic Targets */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-4 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Target className="h-4 w-4 text-violet-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Strategic Targets</h4>
                          </div>

                          <div className="space-y-4">
                            <SmartField
                              label="Target Industry"
                              value={userProfile.founderAgentSynthesized.targetIndustry || ""}
                              placeholder="e.g. SaaS"
                              onChange={(v) => {
                                const updated = { ...userProfile.founderAgentSynthesized, targetIndustry: v };
                                saveProfileData({ founderAgentSynthesized: updated });
                              }}
                            />
                            <SmartField
                              label="Target Audience"
                              value={userProfile.founderAgentSynthesized.targetAudience || ""}
                              placeholder="e.g. CTOs"
                              onChange={(v) => {
                                const updated = { ...userProfile.founderAgentSynthesized, targetAudience: v };
                                saveProfileData({ founderAgentSynthesized: updated });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Growth Goal */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-4 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Growth Goal</h4>
                          </div>

                          <SmartField
                            label="Immediate Scaling Target"
                            value={userProfile.founderAgentSynthesized.goal || ""}
                            placeholder="What is the immediate business or scaling goal?"
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, goal: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Card 4: Long-Term Vision */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-6 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Core Vision</h4>
                          </div>

                          <SmartField
                            label="Future Outlook"
                            value={userProfile.founderAgentSynthesized.vision || ""}
                            placeholder="Define your personal or startup long-term vision..."
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, vision: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Card 5: Daily Mission */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-6 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daily Mission</h4>
                          </div>

                          <SmartField
                            label="Value Driver"
                            value={userProfile.founderAgentSynthesized.mission || ""}
                            placeholder="What is your core daily driving mission?"
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, mission: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Cards 6-9: Cognitive DNA Bullet Editors */}
                      {[
                        { key: "behavioralTraits" as const, icon: Brain, color: "text-violet-500", label: "Personality & Traits", items: userProfile.founderAgentSynthesized.behavioralTraits || [], dotColor: "bg-violet-400", gridClass: "lg:col-span-4 md:col-span-1" },
                        { key: "coreValues" as const, icon: Target, color: "text-rose-500", label: "Core Beliefs & Values", items: userProfile.founderAgentSynthesized.coreValues || [], dotColor: "bg-rose-400", gridClass: "lg:col-span-4 md:col-span-1" },
                        { key: "communicationStyle" as const, icon: MessageSquare, color: "text-emerald-500", label: "Communication Style", items: userProfile.founderAgentSynthesized.communicationStyle || [], dotColor: "bg-emerald-400", gridClass: "lg:col-span-4 md:col-span-2 lg:col-span-4" },
                        { key: "decisionHeuristics" as const, icon: Zap, color: "text-amber-500", label: "Decision Heuristics", items: userProfile.founderAgentSynthesized.decisionHeuristics || [], dotColor: "bg-amber-400", gridClass: "lg:col-span-6 md:col-span-1" },
                      ].map(({ key, icon, color, label, items, dotColor, gridClass }) => (
                        <BulletEditor
                          key={key}
                          label={label}
                          items={items}
                          icon={icon}
                          color={color}
                          dotColor={dotColor}
                          className={gridClass}
                          onChange={(newItems) => {
                            const updatedSynthesized = {
                              ...userProfile.founderAgentSynthesized,
                              [key]: newItems,
                            };
                            saveProfileData({ founderAgentSynthesized: updatedSynthesized });
                          }}
                        />
                      ))}

                      {/* Card 10: Key Content Pillars */}
                      <BulletEditor
                        label="Key Content Pillars"
                        items={userProfile.founderAgentSynthesized.contentPillars || []}
                        icon={Brain}
                        color="text-[#7C3AED]"
                        dotColor="bg-[#7C3AED]"
                        className="lg:col-span-6 md:col-span-1"
                        onChange={(newItems) => {
                          const updated = { ...userProfile.founderAgentSynthesized, contentPillars: newItems };
                          saveProfileData({ founderAgentSynthesized: updated });
                        }}
                      />

                    </div>
                  </div>
                ) : (
                  !isSynthesizing && !userProfile?.founderAgentSynthesized && (
                    <div className="flex flex-col items-center justify-center py-28 px-4 bg-slate-55 border border-slate-200 border-dashed rounded-2xl text-center">
                      <Brain className="h-8 w-8 text-slate-350 animate-pulse mb-3" />
                      <h4 className="text-xs font-bold text-slate-700">No Founder Brain Calibrated</h4>
                      <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed mt-1">
                        Configure your voice guidelines above and run synthesis to build your virtual active Founder Brain workspace.
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : activeTab === "brands" ? (
          /* Brand Control Board */
          <div className="space-y-4">
            <BentoCard span={3}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <SectionTitle icon={Globe} title="Connected Brands Automation Manager" iconColor="text-violet-600" />
                  <p className="text-xs text-slate-500 font-light mt-1">
                    Manage individual daily automation schedules, content triggers, visual sources, and manual executions across your brands.
                  </p>
                </div>
              </div>

              {/* Helpful Rule Callout Banner */}
              <div className="mb-5 p-3 rounded-xl bg-violet-50/60 border border-violet-100 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-violet-900 leading-relaxed">
                  <strong className="font-semibold">Automation Rule:</strong> Daily Posts and Weekly Campaigns operate with mutual exclusion. Enabling Daily Posts automatically pauses Weekly Campaigns for that brand, and vice-versa, preventing redundant social posts.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                  <p className="text-sm text-slate-500 italic">No brands found. Add one in the sidebar brand switcher.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (md and up) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[1040px]">
                      <colgroup>
                        <col style={{ width: "24%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "12%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "13%" }} />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-4 text-left">Brand &amp; Target Socials</th>
                          <th className="py-3.5 px-3 text-center">Daily Posts</th>
                          <th className="py-3.5 px-3 text-center">Daily Blogs</th>
                          <th className="py-3.5 px-3 text-center">Weekly Campaigns</th>
                          <th className="py-3.5 px-3 text-center">Visual Source</th>
                          <th className="py-3.5 px-3 text-center">Automation Time</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((brand) => {
                          const localTimeStr = utcToLocal(brand.automationTimeUtc || "14:00");
                          const statusMessage = brandMessage[brand.id];

                          const toggleFeature = async (field: "automateDailyPosts" | "automateDailyBlogs" | "automateWeeklyCampaigns") => {
                            const val = !brand[field];
                            const updates: any = { [field]: val };
                            
                            // Mutual Exclusion Rule: Weekly Campaigns ON -> Daily Posts OFF, and Vice Versa
                            if (field === "automateWeeklyCampaigns" && val === true) {
                              updates.automateDailyPosts = false;
                            } else if (field === "automateDailyPosts" && val === true) {
                              updates.automateWeeklyCampaigns = false;
                            }

                            // Auto enable/disable master switch
                            const finalPosts = updates.automateDailyPosts !== undefined ? updates.automateDailyPosts : !!brand.automateDailyPosts;
                            const finalBlogs = field === "automateDailyBlogs" ? val : !!brand.automateDailyBlogs;
                            const finalWeekly = updates.automateWeeklyCampaigns !== undefined ? updates.automateWeeklyCampaigns : !!brand.automateWeeklyCampaigns;
                            updates.automationAgentEnabled = finalPosts || finalBlogs || finalWeekly;
                            
                            await updateProduct(brand.id, updates);

                            // Open Social Channel Selection Modal if enabling Daily Posts or Weekly Campaigns
                            if ((field === "automateDailyPosts" || field === "automateWeeklyCampaigns") && val === true) {
                              openChannelSelectorModal(brand);
                            }
                          };

                          return (
                            <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors">
                              {/* Product Identity & Channels */}
                              <td className="py-4 px-4 align-middle">
                                <div className="flex items-center gap-3">
                                  {brand.logoUrl || brand.logoDarkUrl ? (
                                    <img
                                      src={brand.logoUrl || brand.logoDarkUrl}
                                      alt={brand.name}
                                      className="h-9 w-9 rounded-xl shrink-0 object-contain border border-slate-200 p-0.5 bg-white shadow-2xs"
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0 border border-violet-200">
                                      {brand.name[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{brand.name}</p>
                                    <a
                                      href={brand.website}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-slate-400 hover:text-violet-600 truncate block max-w-[150px]"
                                    >
                                      {brand.website || "No website"}
                                    </a>

                                    {/* Active Channels Logos & Edit Gear */}
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      {(brand.targetPlatforms && brand.targetPlatforms.length > 0
                                        ? brand.targetPlatforms
                                        : ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']
                                      ).map((plat: string) => (
                                        <div
                                          key={plat}
                                          className="h-5 w-5 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0"
                                          title={plat === 'twitter' ? 'X (Twitter)' : plat.toUpperCase()}
                                        >
                                          {getPlatformLogo(plat, "h-3 w-3")}
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => openChannelSelectorModal(brand)}
                                        className="text-[9px] text-violet-600 hover:text-violet-800 font-bold flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-md hover:bg-violet-50 transition-colors cursor-pointer"
                                        title="Configure social channels and visual generation mode"
                                      >
                                        <Sliders className="h-2.5 w-2.5" />
                                        <span>Edit</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Daily Posts toggle */}
                              <td className="py-4 px-3 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                  <button
                                    type="button"
                                    title="Toggle Daily Social Posts"
                                    onClick={() => toggleFeature("automateDailyPosts")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                      brand.automateDailyPosts ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                        brand.automateDailyPosts ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                  <span className="text-[9px] text-slate-400 mt-1 font-medium">
                                    {brand.automateDailyPosts ? "Active" : "Off"}
                                  </span>
                                </div>
                              </td>

                              {/* Daily Blogs toggle */}
                              <td className="py-4 px-3 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                  <button
                                    type="button"
                                    title="Toggle Daily SEO Blogs"
                                    onClick={() => toggleFeature("automateDailyBlogs")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                      brand.automateDailyBlogs ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                        brand.automateDailyBlogs ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                  <span className="text-[9px] text-slate-400 mt-1 font-medium">
                                    {brand.automateDailyBlogs ? "Active" : "Off"}
                                  </span>
                                </div>
                              </td>

                              {/* Weekly Campaigns toggle */}
                              <td className="py-4 px-3 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                  <button
                                    type="button"
                                    title="Toggle 7-Day Weekly Campaigns"
                                    onClick={() => toggleFeature("automateWeeklyCampaigns")}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                      brand.automateWeeklyCampaigns ? "bg-violet-600" : "bg-slate-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                        brand.automateWeeklyCampaigns ? "translate-x-4" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                  <span className="text-[9px] text-slate-400 mt-1 font-medium">
                                    {brand.automateWeeklyCampaigns ? "Active" : "Off"}
                                  </span>
                                </div>
                              </td>

                              {/* Visual Source usage status & modal selector */}
                              <td className="py-4 px-3 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => openChannelSelectorModal(brand)}
                                  title="Click to configure visual generation mode"
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    brand.useBrandAssets === true
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                      : brand.useBrandAssets === false
                                      ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                                      : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse"
                                  }`}
                                >
                                  {brand.useBrandAssets === true ? (
                                    <span className="flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3 text-emerald-600" />
                                      <span>Brand Assets</span>
                                    </span>
                                  ) : brand.useBrandAssets === false ? (
                                    <span className="flex items-center gap-1">
                                      <PlusPenIcon className="h-3 w-3 text-violet-600 shrink-0" />
                                      <span>AI Visuals</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3 text-amber-600" />
                                      <span>Required</span>
                                    </span>
                                  )}
                                </button>
                              </td>

                              {/* Scheduling time */}
                              <td className="py-4 px-3 text-center align-middle">
                                <div className="inline-flex justify-center">
                                  <CustomTimePicker
                                    value={localTimeStr}
                                    onChange={async (newLocalTime) => {
                                      const timeUtc = localToUtc(newLocalTime);
                                      await updateProduct(brand.id, { automationTimeUtc: timeUtc });
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Actions column: manual run */}
                              <td className="py-4 px-4 text-right align-middle">
                                <div className="flex flex-col items-end gap-1">
                                  <button
                                    type="button"
                                    disabled={runningBrandId === brand.id || !userProfile?.founderAgentSynthesized}
                                    onClick={() => handleTriggerBrandRun(brand.id)}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-violet-50 text-[#7C3AED] hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed border border-violet-200 rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    {runningBrandId === brand.id ? (
                                      <>
                                        <Loader2 className="animate-spin h-3 w-3" />
                                        <span>Running...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3 fill-current" />
                                        <span>Trigger Run</span>
                                      </>
                                    )}
                                  </button>
                                  {statusMessage && (
                                    <span className={`text-[9px] font-medium leading-tight max-w-[150px] text-right block ${
                                      statusMessage.type === "success" ? "text-emerald-600" : "text-red-500"
                                    }`}>
                                      {statusMessage.text}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Grid View (< md) */}
                  <div className="block md:hidden space-y-3">
                    {products.map((brand) => {
                      const localTimeStr = utcToLocal(brand.automationTimeUtc || "14:00");
                      const statusMessage = brandMessage[brand.id];

                      const toggleFeature = async (field: "automateDailyPosts" | "automateDailyBlogs" | "automateWeeklyCampaigns") => {
                        const val = !brand[field];
                        const updates: any = { [field]: val };
                        if (field === "automateWeeklyCampaigns" && val === true) {
                          updates.automateDailyPosts = false;
                        } else if (field === "automateDailyPosts" && val === true) {
                          updates.automateWeeklyCampaigns = false;
                        }
                        const finalPosts = updates.automateDailyPosts !== undefined ? updates.automateDailyPosts : !!brand.automateDailyPosts;
                        const finalBlogs = field === "automateDailyBlogs" ? val : !!brand.automateDailyBlogs;
                        const finalWeekly = updates.automateWeeklyCampaigns !== undefined ? updates.automateWeeklyCampaigns : !!brand.automateWeeklyCampaigns;
                        updates.automationAgentEnabled = finalPosts || finalBlogs || finalWeekly;
                        
                        await updateProduct(brand.id, updates);
                        if ((field === "automateDailyPosts" || field === "automateWeeklyCampaigns") && val === true) {
                          openChannelSelectorModal(brand);
                        }
                      };

                      return (
                        <div key={brand.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
                          {/* Brand Info Bar */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {brand.logoUrl || brand.logoDarkUrl ? (
                                <img
                                  src={brand.logoUrl || brand.logoDarkUrl}
                                  alt={brand.name}
                                  className="h-10 w-10 rounded-xl shrink-0 object-contain border border-slate-200 p-0.5 bg-white"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
                                  {brand.name[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{brand.name}</h4>
                                <a
                                  href={brand.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-slate-400 hover:text-violet-600 truncate block max-w-[180px]"
                                >
                                  {brand.website || "No website"}
                                </a>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openChannelSelectorModal(brand)}
                              className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-200 flex items-center gap-1"
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Settings</span>
                            </button>
                          </div>

                          {/* Social Platform Chips */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 mr-1">Channels:</span>
                            {(brand.targetPlatforms && brand.targetPlatforms.length > 0
                              ? brand.targetPlatforms
                              : ['linkedin', 'instagram', 'twitter', 'facebook', 'reddit']
                            ).map((plat: string) => (
                              <div
                                key={plat}
                                className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0"
                                title={plat}
                              >
                                {getPlatformLogo(plat, "h-3 w-3")}
                              </div>
                            ))}
                          </div>

                          {/* Toggles Grid */}
                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100">
                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50">
                              <span className="text-[10px] font-bold text-slate-600 mb-1.5">Daily Posts</span>
                              <button
                                type="button"
                                onClick={() => toggleFeature("automateDailyPosts")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ${
                                  brand.automateDailyPosts ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateDailyPosts ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50">
                              <span className="text-[10px] font-bold text-slate-600 mb-1.5">Daily Blogs</span>
                              <button
                                type="button"
                                onClick={() => toggleFeature("automateDailyBlogs")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ${
                                  brand.automateDailyBlogs ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateDailyBlogs ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50">
                              <span className="text-[10px] font-bold text-slate-600 mb-1.5">Weekly Camp.</span>
                              <button
                                type="button"
                                onClick={() => toggleFeature("automateWeeklyCampaigns")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ${
                                  brand.automateWeeklyCampaigns ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateWeeklyCampaigns ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Time & Visual Source Footer */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500">Visuals:</span>
                              <button
                                type="button"
                                onClick={() => openChannelSelectorModal(brand)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  brand.useBrandAssets === true
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : brand.useBrandAssets === false
                                    ? "bg-violet-50 text-violet-700 border-violet-200"
                                    : "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                }`}
                              >
                                {brand.useBrandAssets === true ? (
                                  <span className="flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3 text-emerald-600" />
                                    <span>Brand Assets</span>
                                  </span>
                                ) : brand.useBrandAssets === false ? (
                                  <span className="flex items-center gap-1">
                                    <PlusPenIcon className="h-3 w-3 text-violet-600 shrink-0" />
                                    <span>AI Visuals</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                    <span>Required</span>
                                  </span>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <CustomTimePicker
                                value={localTimeStr}
                                onChange={async (newLocalTime) => {
                                  const timeUtc = localToUtc(newLocalTime);
                                  await updateProduct(brand.id, { automationTimeUtc: timeUtc });
                                }}
                              />
                              <button
                                type="button"
                                disabled={runningBrandId === brand.id || !userProfile?.founderAgentSynthesized}
                                onClick={() => handleTriggerBrandRun(brand.id)}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {runningBrandId === brand.id ? (
                                  <Loader2 className="animate-spin h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3 fill-current" />
                                )}
                                <span>Run</span>
                              </button>
                            </div>
                          </div>
                          {statusMessage && (
                            <p className={`text-[9px] font-medium text-right ${
                              statusMessage.type === "success" ? "text-emerald-600" : "text-red-500"
                            }`}>
                              {statusMessage.text}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </BentoCard>
          </div>
        ) : activeTab === "generator" ? (
          /* General Post Generator View */
          <div className="space-y-6">
            
            {/* 1. Automated Daily Posting Settings Card */}
            <BentoCard span={3}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-violet-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Daily Automated Profile Auto-Posting</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light mt-1 max-w-xl leading-relaxed">
                    Let your Founder Agent write and design social posts automatically. The agent dynamically generates insights at your selected daily time.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  {/* Toggle */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Auto-Posting
                    </span>
                    <button
                      onClick={async () => {
                        const nextVal = !userProfile?.automateFounderPosts;
                        await saveProfileData({ automateFounderPosts: nextVal });
                      }}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                        userProfile?.automateFounderPosts ? "bg-violet-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                          userProfile?.automateFounderPosts ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {userProfile?.automateFounderPosts && (
                    <>
                      {/* Time Picker */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                          Schedule
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-655 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <CustomTimePicker
                            value={utcToLocal(userProfile?.founderPostTimeUtc || "14:00")}
                            onChange={async (newLocalTime) => {
                              const timeUtc = localToUtc(newLocalTime);
                              await saveProfileData({ founderPostTimeUtc: timeUtc });
                            }}
                          />
                        </div>
                      </div>

                      {/* Content Type Selector */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                          Type
                        </span>
                        <select
                          value={userProfile?.founderPostType || "general"}
                          onChange={async (e) => {
                            await saveProfileData({ founderPostType: e.target.value as any });
                          }}
                          className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                        >
                          <option value="general">General (Non-Branded)</option>
                          <option value="branded">Branded (Product Focus)</option>
                          <option value="both">Both (General & Branded)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Brands to include in auto-posting */}
              {userProfile?.automateFounderPosts && (userProfile?.founderPostType === "branded" || userProfile?.founderPostType === "both") && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Brands to Automate:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {products.map((p) => {
                      const isChecked = (userProfile?.founderPostSelectedProducts || []).includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={async () => {
                            const currentList = userProfile?.founderPostSelectedProducts || [];
                            const nextList = isChecked 
                              ? currentList.filter(id => id !== p.id)
                              : [...currentList, p.id];
                            await saveProfileData({ founderPostSelectedProducts: nextList });
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                            isChecked 
                              ? "bg-violet-600 border-violet-500 text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-555 hover:bg-slate-100"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personal Socials Connection Area */}
              <div className="mt-4 pt-4 border-t border-slate-100/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  {/* Left: Avatar + Name + Headline */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold overflow-hidden border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {founderAuthorAvatar ? (
                        <img src={founderAuthorAvatar} alt="LinkedIn Avatar" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-sm font-extrabold">{founderAuthorName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{founderAuthorName}</h4>
                        <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate max-w-[320px]">
                        {userProfile?.linkedInProfile?.headline || (userProfile as any)?.founderBio || "Founder Profile • Automated Daily Posts"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Connection Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isLinkedinConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>Connected</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAutoFetchLinkedinProfile(false)}
                          disabled={isAutoFetchingProfile}
                          title="Sync LinkedIn Headline & Avatar"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isAutoFetchingProfile ? "animate-spin text-indigo-600" : ""}`} />
                          <span>{isAutoFetchingProfile ? "Syncing..." : "Sync"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDisconnectLinkedin}
                          className="text-[10px] font-bold text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectLinkedin}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-[#0A66C2] hover:bg-[#00509d] transition shadow-2xs cursor-pointer"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        <span>Connect LinkedIn</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* 2. Main Automated Visual Studio Console */}
            <div className="space-y-6">
              {/* Header Bar with Popup Modal Trigger Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-50 text-violet-650 border border-violet-100">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Founder Visual Studio</h3>
                    <p className="text-xs text-slate-500 font-light mt-0.5">
                      Configure topics via popup modal, preview real-time visual canvases, and tweak live copy.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition shadow-sm cursor-pointer shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-white" />
                  <span>+ New Post</span>
                </button>
              </div>

              {/* Main 2-Column Workspace Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* LEFT COLUMN: Visual Studio Canvas Preview (Top) & Discovered Visual Trends (Bottom) */}
                <div className="space-y-6">
                  {/* Visual Engine Live Interactive Render Canvas (iframe Sandbox) */}
                  <BentoCard span={1}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-violet-650" />
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Visual Studio Canvas Preview</h3>
                      </div>
                      {hasGeneratedOutput && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 uppercase">
                          Layout: {selectedTemplateId}
                        </span>
                      )}
                    </div>

                    {isGeneratingPost && (
                      <div className="aspect-square bg-slate-955 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-2" />
                        <span className="text-xs font-bold text-slate-200 font-mono">Synthesizing Visual Draft & Researching Trends...</span>
                        <div className="space-y-1 font-mono text-[10px] text-slate-400 max-w-xs">
                          {generatorLogs.map((log, idx) => (
                            <p key={idx} className={log.startsWith("✓") ? "text-emerald-400 font-semibold" : ""}>{log}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {!hasGeneratedOutput && !isGeneratingPost && (
                      <div className="aspect-square bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                        <Sparkles className="h-8 w-8 text-slate-300 animate-pulse" />
                        <span className="text-xs font-bold text-slate-700">Visual Graphic Canvas</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs font-light">
                          Draft a post to trigger live trend research. The auto-selected layout, backdrop image, and text overlay will render here.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsTopicModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-violet-650 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition mt-2 cursor-pointer"
                        >
                          <PlusPenIcon className="h-3.5 w-3.5 text-violet-650" />
                          <span>+ New Post</span>
                        </button>
                      </div>
                    )}

                    {hasGeneratedOutput && !isGeneratingPost && (
                      <div className="space-y-4">
                        {/* Live Canvas Preview via Iframe Renderer */}
                        <div className="relative w-[360px] h-[360px] rounded-xl border border-slate-200 shadow overflow-hidden bg-slate-950 shrink-0 mx-auto">
                          <iframe
                            id="visual-studio-canvas-preview"
                            title="Visual Template Preview Renderer"
                            srcDoc={fullHtml}
                            // allow-same-origin (so the parent can read
                            // contentDocument for toJpeg export) WITHOUT
                            // allow-scripts — model-generated template markup must
                            // never execute against this origin.
                            sandbox="allow-same-origin"
                            className="absolute origin-top-left border-none pointer-events-none"
                            style={{
                              width: "1080px",
                              height: "1080px",
                              transform: "scale(0.333333)"
                            }}
                          />
                        </div>

                        {/* Brand DNA & Color Harmony Swatches */}
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Brand Harmony:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: primaryColor }} title="Primary Accent Color" />
                              <span className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: secondaryColor }} title="Secondary Backdrop Color" />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-semibold">
                            <Type className="h-3 w-3 text-slate-400" />
                            <span>{fontFamily}</span>
                          </div>
                        </div>

                        {/* Post Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPostCopy);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-sm cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copy Post Copy</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const iframe = document.querySelector('iframe[title="Visual Template Preview Renderer"]') as HTMLIFrameElement;
                                const iframeBody = iframe?.contentDocument?.body || null;

                                const dataUrl = await captureTemplateAsJpeg();

                                const link = document.createElement('a');
                                link.download = `founder-visual-${Date.now()}.jpg`;
                                link.href = dataUrl;
                                link.click();
                              } catch (err) {
                                console.error("Failed to download image:", err);
                                alert("Failed to download visual image.");
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-sm cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                            <span>Download Image</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </BentoCard>

                  {/* 6 Discovered Visual Templates Grid (Grounded Web Trends) */}
                  {trendReport && trendReport.discoveredTemplates?.length > 0 && (
                    <div className="border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/10 rounded-2xl p-5 shadow-xs text-left space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                          <span className="text-xs font-bold text-slate-900">🔥 Grounded Visual Trends (Gemini 2.5 Pro)</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                          {trendReport.discoveredTemplates.length} Templates Synthesized
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {trendReport.discoveredTemplates.map((dt: any, dtIdx: number) => {
                          const safeId = dt.id && typeof dt.id === 'string' ? dt.id : `dt-fallback-${dtIdx}`;
                          const isSelected = selectedTemplateId === safeId;
                          const isApproved = approvedTemplateId === safeId;
                          return (
                            <div 
                              key={safeId} 
                              className={`p-3 rounded-xl space-y-2 flex flex-col justify-between transition border ${
                                isApproved
                                  ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/30 shadow-sm"
                                  : isSelected 
                                    ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-sm" 
                                    : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start gap-1">
                                  <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">{dt.name}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isApproved && (
                                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono flex items-center gap-0.5">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        Approved
                                      </span>
                                    )}
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                                      {dt.viralityScore || "98/100"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold text-amber-700 font-mono uppercase block mt-1">
                                  {dt.sourceTrend}
                                </span>
                                <p className="text-slate-500 text-[9px] leading-relaxed mt-1 font-light line-clamp-2">{dt.whyViral}</p>
                              </div>
                              
                              <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                                {/* Preview Layout Button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedTemplateId(dt.id)}
                                  className={`w-full text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                                    isSelected 
                                      ? "bg-amber-600 text-white shadow-xs" 
                                      : "bg-slate-900 hover:bg-amber-600 text-white"
                                  }`}
                                >
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>{isSelected ? "Previewing" : "Preview Layout"}</span>
                                </button>

                                {/* Approve & Finalize Button — only on the currently selected template */}
                                {isSelected && !isApproved && (
                                  <button
                                    type="button"
                                    onClick={handleApproveTemplate}
                                    disabled={isApprovingTemplate}
                                    className="w-full text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-60"
                                  >
                                    {isApprovingTemplate ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        <span>Rendering...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        <span>Approve & Finalize</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                {isApproved && (
                                  <div className="text-[9px] font-bold text-emerald-700 text-center py-1">
                                    ✓ Template finalized for this post
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Edit Live Copy Section (Top) & Founder Posts History Feed (Bottom) */}
                <div className="space-y-6">
                  {/* Edit Live Copy Section (Auto-Populated & Live Editable) */}
                  {hasGeneratedOutput ? (
                    <BentoCard span={1} className="animate-in fade-in duration-300">
                      <SectionTitle icon={FileText} title="Edit Live Copy (Auto-Populated)" iconColor="text-violet-650" />
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Visual Headline / Hook (Overlay Text)
                          </label>
                          <input
                            type="text"
                            value={generatedHeadline}
                            onChange={(e) => setGeneratedHeadline(e.target.value)}
                            placeholder="Headline visual hook..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Visual Subtext (Supporting Lesson)
                          </label>
                          <input
                            type="text"
                            value={generatedSubtext}
                            onChange={(e) => setGeneratedSubtext(e.target.value)}
                            placeholder="Supporting subtext detail..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Full Post Text Copy
                          </label>
                          <textarea
                            rows={6}
                            value={generatedPostCopy}
                            onChange={(e) => setGeneratedPostCopy(e.target.value)}
                            placeholder="Full post copywriting..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl p-3 text-xs text-slate-800 outline-none leading-relaxed resize-none transition-colors font-light"
                          />
                        </div>

                        {/* AI-Generated Visual Backdrop Section */}
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Generated Visual Backdrop Image (Auto-Populated)
                            </label>
                            <span className="text-[9px] font-mono font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-150">
                              Imagen AI
                            </span>
                          </div>

                          {generatedImageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm bg-slate-900 group">
                              <img src={generatedImageUrl} alt="AI Generated Backdrop" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-3 text-center">
                                <span className="text-[10px] text-white font-medium">Auto-applied as backdrop for the visual template overlay.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center bg-slate-50 text-slate-400 text-xs font-light">
                              Backdrop image generated by Imagen AI will appear here upon post drafting.
                            </div>
                          )}
                        </div>
                      </div>
                    </BentoCard>
                  ) : (
                    <BentoCard span={1}>
                      <SectionTitle icon={FileText} title="Edit Live Copy (Auto-Populated)" iconColor="text-violet-650" />
                      <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                        <span className="text-xs font-bold text-slate-700 block">No Post Drafted Yet</span>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto font-light leading-relaxed">
                          Click "Configure Post Topic & Scope" to choose a topic and draft a post. Live headline, subtext, and body copy will appear here for editing.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsTopicModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-violet-650 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition mt-2 cursor-pointer"
                        >
                          <PlusPenIcon className="h-3.5 w-3.5 text-violet-650" />
                          <span>Configure Post Topic & Scope</span>
                        </button>
                      </div>
                    </BentoCard>
                  )}

                  {/* Singular Latest Generated Founder Post in Creation View */}
                  {automatedPosts.length > 0 && (
                    <BentoCard span={1}>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <SectionTitle icon={Clock} title="Latest Generated Founder Post" iconColor="text-violet-650" />
                        <button
                          type="button"
                          onClick={() => setActiveTab("history")}
                          className="text-[10px] font-bold text-violet-650 hover:text-violet-800 transition flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>View Previous Posts ({Math.max(0, automatedPosts.length - 1)})</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>

                      {(() => {
                        const latestPost = automatedPosts[0];
                        return (
                          <div
                            key={latestPost.id}
                            className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col gap-2.5 hover:bg-white hover:border-slate-300 transition-all text-left"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                latestPost.isBranded 
                                  ? "bg-violet-100 text-violet-700 border border-violet-200" 
                                  : "bg-slate-200 text-slate-700 border border-slate-300"
                              }`}>
                                {latestPost.isBranded ? "Branded Product" : "Organic General"}
                              </span>

                              <div className="flex items-center gap-2">
                                {true && (
                                  <button
                                    disabled={!isLinkedinConnected || publishingPostId !== null}
                                    onClick={() => handleManualPublish(latestPost.id)}
                                    className={`inline-flex items-center gap-1 text-[9px] font-bold rounded-lg px-2 py-1 transition shadow-sm border ${
                                      !isLinkedinConnected
                                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                        : "bg-white text-[#0A66C2] border-[#0A66C2]/30 hover:border-[#0A66C2]/60 cursor-pointer"
                                    }`}
                                  >
                                    {publishingPostId === latestPost.id ? <Loader2 className="h-2.5 w-2.5 animate-spin text-[#0A66C2]" /> : <Linkedin className="h-2.5 w-2.5 text-[#0A66C2]" />}
                                    <span>Publish</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(latestPost.postCopy);
                                    alert("Copied to clipboard!");
                                  }}
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white transition shadow-sm cursor-pointer"
                                >
                                  <Copy className="h-2.5 w-2.5" />
                                  <span>Copy</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePost(latestPost.id)}
                                  className="text-[9px] font-bold text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 transition cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 -mx-1 pointer-events-auto">
                              <PostPreviewModal
                                inline
                                platform="linkedin"
                                copy={latestPost.postCopy}
                                imageUrl={approvedTemplateImageUrl || latestPost.approvedTemplateImage || latestPost.imageUrl || undefined}
                                isFlattened={true}
                                productName={founderAuthorName}
                                productLogo={founderAuthorAvatar || ""}
                                productTagline={founderAuthorHeadline}
                              />
                              {(approvedTemplateImageUrl || latestPost.approvedTemplateImage) && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  <span>Approved template visual applied</span>
                                </div>
                              )}
                              {!approvedTemplateImageUrl && !latestPost.approvedTemplateImage && trendReport?.discoveredTemplates?.length > 0 && (
                                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                  <Zap className="h-3 w-3 text-amber-500" />
                                  <span>No template approved yet — select and approve a template from the visual trends grid</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </BentoCard>
                  )}
                </div>
              </div>

              {/* Popup Modal: Configure Post Topic & Visual Scope Form (Equal max-w-5xl width as Campaign Modal) */}
              {isTopicModalOpen && createPortal(
                <div className="fixed inset-0 bg-slate-950/85 z-[99999] flex items-center justify-center p-4 md:p-6 overflow-y-auto scroll-smooth" onClick={() => setIsTopicModalOpen(false)}>
                  <div className="bg-white border border-slate-200/90 rounded-[24px] max-w-5xl w-full p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 shadow-[0_25px_70px_rgba(15,23,42,0.25)] relative my-auto max-h-[92vh] overflow-y-auto scroll-smooth" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <PlusPenIcon className="h-4.5 w-4.5 text-violet-650 shrink-0" />
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">Create Founder Post</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-light">
                          Set persona scope, post topic, and visual template layout.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTopicModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0 -mr-2 -mt-1"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* 2-Column High-End Studio Modal Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left Column (5/12): Scope, Brand & Topic Inputs */}
                      <div className="lg:col-span-5 space-y-5">
                        {/* Post Scope Selection */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Post Persona Branding Scope
                          </label>
                          <div className="flex gap-2">
                            {[
                              { value: "general", label: "General (Non-Branded)" },
                              { value: "branded", label: "Branded (Product Focus)" }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPostScope(opt.value as any)}
                                className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  postScope === opt.value
                                    ? "bg-violet-600 border-violet-500 text-white shadow-sm"
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-650"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Target Brand Selector for Branded Posts */}
                        {postScope === "branded" && (
                          <div className="animate-in fade-in duration-200 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Select Target Product / Brand
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {products.map((p) => {
                                const isChecked = selectedManualBrands.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedManualBrands([p.id]);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                                      isChecked
                                        ? "bg-violet-600 border-violet-500 text-white shadow-sm"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {p.name}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-slate-400 italic">
                              Selected brand colors & website URL will auto-apply to post copy.
                            </p>
                          </div>
                        )}

                        {/* Post Concept / Topic Field */}
                        <div>
                          {(() => {
                            const activeBrandId = selectedManualBrands[0];
                            const isBrandedScope = postScope === "branded";
                            const isBrandSelected = isBrandedScope && !!activeBrandId;
                            const isRecsDisabled = isBrandedScope && !isBrandSelected;
                            const activeSuggestions = isBrandedScope
                              ? (activeBrandId ? (brandedSuggestionsMap[activeBrandId] || []) : [])
                              : generalSuggestions;

                            return (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Active Post Concept / Topic
                                  </label>
                                  <button
                                    type="button"
                                    disabled={isFetchingSuggestions || !userProfile?.founderAgentSynthesized || isRecsDisabled}
                                    onClick={() => fetchTopicSuggestions(true)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-650 hover:text-[#6D28D9] disabled:opacity-40 cursor-pointer"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${isFetchingSuggestions ? 'animate-spin' : ''}`} />
                                    <span>AI Recommendations</span>
                                  </button>
                                </div>

                                {/* Helper Notice when Branded Scope is selected but no brand picked yet */}
                                {isRecsDisabled && (
                                  <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[10px] text-amber-800 flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span>Select a brand above to generate AI topic recommendations tailored to its metrics & Product DNA.</span>
                                  </div>
                                )}

                                {/* AI Recommendation Chips */}
                                {activeSuggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-36 overflow-y-auto">
                                    {activeSuggestions.map((sug, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setPostTopic(sug.prompt)}
                                        title={sug.description}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border text-left flex items-center justify-between gap-1 max-w-full cursor-pointer ${
                                          postTopic === sug.prompt
                                            ? "bg-violet-600 text-white border-violet-500 shadow-2xs"
                                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                        }`}
                                      >
                                        <span className="truncate">{sug.prompt}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          <textarea
                            rows={4}
                            value={postTopic}
                            onChange={(e) => setPostTopic(e.target.value)}
                            placeholder="Click an AI recommendation chip above, or type custom post topic..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl p-3 text-xs text-slate-800 outline-none leading-relaxed resize-none transition-colors font-light shadow-2xs"
                          />
                        </div>

                        {/* Submit Action Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={isGeneratingPost || !postTopic.trim()}
                            onClick={handleGeneratePost}
                            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isGeneratingPost ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                <span>Generating Post & Layout...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-white" />
                                <span>Generate Post</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right Column (7/12): Live Rendered HD Template Previews Grid */}
                      <div className="lg:col-span-7 space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                              Visual Template
                            </label>
                            <p className="text-[10px] text-slate-400 font-light">
                              Choose dynamic AI trend research or lock a pixel-perfect prebuilt template.
                            </p>
                          </div>
                          {selectedPrebuiltTemplate !== "auto" && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                              ⚡ Research Skipped
                            </span>
                          )}
                        </div>

                        {/* 4 Real Scaled Template Preview Cards Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              id: "auto",
                              name: "Dynamic AI Research",
                              tag: "Grounded Trends",
                              desc: "Researches live AI visual trends per post"
                            },
                            {
                              id: "x-tweet-card",
                              name: "X Viral Tweet Card",
                              tag: "99/100 Virality",
                              desc: "Native dark X tweet screenshot"
                            }
                          ].map((tpl) => {
                            const isSelected = selectedPrebuiltTemplate === tpl.id;
                            
                            // Sample HTML for live iframe rendering
                            let htmlToRender = "";
                            if (tpl.id !== "auto" && LAYOUT_BLUEPRINTS[tpl.id]) {
                              htmlToRender = LAYOUT_BLUEPRINTS[tpl.id].buildHtml({
                                headline: tpl.id === "x-tweet-card" ? "Stop Trading Founder Time For Slow Growth" : "How We Built a $10M Pipeline Without A Single Sales Rep",
                                subtext: "The 5 core operating models scaling B2B teams mandate.",
                                imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1080&q=80",
                                logoUrl: null,
                                primaryColor: "#6366F1",
                                secondaryColor: "#08080C",
                                fontFamily: "Inter"
                              });
                            }

                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => setSelectedPrebuiltTemplate(tpl.id)}
                                className={`group p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-white border-violet-600 ring-2 ring-violet-500/40 shadow-md"
                                    : "bg-white border-slate-200 hover:bg-slate-150 hover:border-slate-300"
                                }`}
                              >
                                {/* Live Scaled Template Renderer Box with Dynamic ResizeObserver */}
                                <div className="relative w-full mb-2">
                                  {tpl.id === "auto" ? (
                                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-violet-900/60 via-slate-950 to-purple-950 p-3 flex flex-col items-center justify-center text-center border border-slate-800">
                                      <div className="w-8 h-8 rounded-full bg-violet-600/40 border border-violet-400 flex items-center justify-center mb-1 animate-pulse">
                                        <Sparkles className="w-4 h-4 text-amber-300" />
                                      </div>
                                      <span className="text-[10px] font-bold text-white">Dynamic AI Trends</span>
                                      <span className="text-[8px] text-slate-400">Researched per post</span>
                                    </div>
                                  ) : (
                                    <ScaledIframePreview title={`Preview ${tpl.name}`} htmlToRender={htmlToRender} />
                                  )}
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 bg-violet-600 text-white p-1 rounded-full shadow-xs z-20">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-[11px] font-bold text-slate-900 truncate">{tpl.name}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-light truncate">{tpl.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>

        ) : activeTab === "history" ? (
          /* 4. Dedicated Founder Post History Tab View (Previous Posts Only with Pagination & Layouts) */
          <div className="space-y-6">
            <BentoCard span={3}>
              {(() => {
                const previousPosts = automatedPosts.slice(1);
                const itemsPerPage = historyLayout === "grid" ? 6 : 4;
                const totalPages = Math.ceil(previousPosts.length / itemsPerPage);
                const currentPage = Math.min(historyPage, Math.max(1, totalPages));
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedPosts = previousPosts.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <SectionTitle icon={Clock} title="Previous Founder Posts History" iconColor="text-violet-650" />
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full -mt-5">
                          {previousPosts.length} Previous Post{previousPosts.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* Layout View Mode Selectors */}
                      {previousPosts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => { setHistoryLayout("list"); setHistoryPage(1); }}
                              title="List / Feed View"
                              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                historyLayout === "list"
                                  ? "bg-white text-violet-650 shadow-xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              <ListFilter className="h-4 w-4" />
                              <span className="hidden sm:inline text-[11px]">List</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setHistoryLayout("grid"); setHistoryPage(1); }}
                              title="Grid Cards View"
                              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                historyLayout === "grid"
                                  ? "bg-white text-violet-650 shadow-xs"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              <LayoutGrid className="h-4 w-4" />
                              <span className="hidden sm:inline text-[11px]">Grid</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {loadingAutoposts ? (
                      <div className="space-y-4 pt-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-5 w-28 bg-slate-200 rounded-md" />
                                <div className="h-4 w-20 bg-slate-100 rounded-md" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-24 bg-slate-200 rounded-xl" />
                                <div className="h-7 w-20 bg-slate-100 rounded-xl" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                              <div className="h-4 w-full bg-slate-100 rounded-md" />
                              <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
                            </div>
                            <div className="h-32 w-full bg-slate-100 rounded-xl border border-slate-200/60" />
                          </div>
                        ))}
                      </div>
                    ) : previousPosts.length > 0 ? (
                      <div className="space-y-6 pt-4">
                        {/* LIST VIEW */}
                        {historyLayout === "list" && (
                          <div className="space-y-4">
                            {paginatedPosts.map((post: any) => (
                              <div
                                key={post.id}
                                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col gap-3 hover:bg-white hover:border-slate-300 transition-all text-left"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                      post.isBranded 
                                        ? "bg-violet-100 text-violet-700 border border-violet-200" 
                                        : "bg-slate-200 text-slate-700 border border-slate-300"
                                    }`}>
                                      {post.isBranded ? "Branded Product" : "Organic General"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {post.status !== "published" && (
                                      <button
                                        disabled={!isLinkedinConnected || publishingPostId !== null}
                                        onClick={() => handleManualPublish(post.id)}
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-1.5 transition shadow-sm border ${
                                          !isLinkedinConnected
                                            ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                            : "bg-white text-[#0A66C2] border-[#0A66C2]/30 hover:border-[#0A66C2]/60 cursor-pointer"
                                        }`}
                                      >
                                        {publishingPostId === post.id ? <Loader2 className="h-3 w-3 animate-spin text-[#0A66C2]" /> : <Linkedin className="h-3 w-3 text-[#0A66C2]" />}
                                        <span>Publish to Profile</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(post.postCopy);
                                        alert("Copied to clipboard!");
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 bg-white transition shadow-sm cursor-pointer"
                                    >
                                      <Copy className="h-3 w-3" />
                                      <span>Copy Copywriting</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      className="text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl px-3 py-1.5 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-2 -mx-1 pointer-events-auto">
                                  <PostPreviewModal
                                    inline
                                    platform="linkedin"
                                    copy={post.postCopy}
                                    imageUrl={post.approvedTemplateImage || post.imageUrl || undefined}
                                    isFlattened={true}
                                    productName={founderAuthorName}
                                    productLogo={founderAuthorAvatar || ""}
                                    productTagline={founderAuthorHeadline}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* GRID VIEW */}
                        {historyLayout === "grid" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedPosts.map((post: any) => {
                              const brandObj = post.isBranded ? products.find(p => p.id === post.productId) : null;
                              return (
                                <div
                                  key={post.id}
                                  className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-white hover:border-slate-300 transition-all text-left gap-3 shadow-xs"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                        post.isBranded 
                                          ? "bg-violet-100 text-violet-700 border border-violet-200" 
                                          : "bg-slate-200 text-slate-700 border border-slate-300"
                                      }`}>
                                        {post.isBranded ? (brandObj?.name || "Branded") : "Organic General"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                      </span>
                                    </div>

                                    {/* Embedded Full LinkedIn Post Preview Card */}
                                    <div className="pointer-events-auto overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                                      <PostPreviewModal
                                        inline
                                        platform="linkedin"
                                        copy={post.postCopy}
                                        imageUrl={post.approvedTemplateImage || post.imageUrl || undefined}
                                        isFlattened={true}
                                        productName={founderAuthorName}
                                        productLogo={founderAuthorAvatar || ""}
                                        productTagline={founderAuthorHeadline}
                                      />
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      {true && (
                                        <button
                                          disabled={!isLinkedinConnected || publishingPostId !== null}
                                          onClick={() => handleManualPublish(post.id)}
                                          title="Publish to LinkedIn"
                                          className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-lg px-2 py-1 transition border ${
                                            !isLinkedinConnected
                                              ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                              : "bg-white text-[#0A66C2] border-[#0A66C2]/30 hover:border-[#0A66C2]/60 cursor-pointer"
                                          }`}
                                        >
                                          {publishingPostId === post.id ? <Loader2 className="h-3 w-3 animate-spin text-[#0A66C2]" /> : <Linkedin className="h-3 w-3 text-[#0A66C2]" />}
                                          <span>Publish</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(post.postCopy);
                                          alert("Copied to clipboard!");
                                        }}
                                        title="Copy Copywriting"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1 bg-white hover:bg-slate-50 transition cursor-pointer"
                                      >
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleDeletePost(post.id)}
                                      className="text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                            <span>
                              Showing <strong className="text-slate-800">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, previousPosts.length)}</strong> of <strong className="text-slate-800">{previousPosts.length}</strong> previous posts
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Previous</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                  <button
                                    key={pg}
                                    type="button"
                                    onClick={() => setHistoryPage(pg)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                                      currentPage === pg
                                        ? "bg-violet-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {pg}
                                  </button>
                                ))}
                              </div>

                              <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <span>Next</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3">
                        <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">No Previous Founder Posts Yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto font-light leading-relaxed">
                          Your active draft post is displayed on the "Founder Post Generator" tab. When you draft a new post, older posts will move into this archive.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("generator")}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-750 transition cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Open Post Generator</span>
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </BentoCard>
          </div>
        ) : null}
      </div>
    </div>
  </div>

      {showSuccessModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 z-[99999] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 shadow-2xl relative my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Pulsing check circle indicator */}
            <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 animate-pulse text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Founder Brain Calibrated</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Your virtual persona twin <span className="font-semibold text-[#7C3AED]">"{calibratedPersonaName}"</span> has been synthesized and is now active inside the workspace.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl py-3 transition shadow-sm cursor-pointer"
            >
              Explore Founder Brain
            </button>
          </div>
        </div>,
        document.body
      )}

      {channelModalBrand && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setChannelModalBrand(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-violet-600" />
                  Automation Settings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure channels and visual generation mode for <span className="font-semibold text-slate-800">{channelModalBrand.name}</span>.
                </p>
              </div>
              <button
                onClick={() => setChannelModalBrand(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800">1. Target Social Media Channels</h4>
            </div>
            <div className="space-y-2.5">
              {[
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'instagram', label: 'Instagram' },
                { id: 'twitter', label: 'X (Twitter)' },
                { id: 'facebook', label: 'Facebook' },
                { id: 'reddit', label: 'Reddit' },
              ].map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedPlatforms.length <= 1) {
                          alert("Please keep at least 1 social channel selected.");
                          return;
                        }
                        setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                      } else {
                        setSelectedPlatforms(prev => [...prev, platform.id]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-violet-600 bg-violet-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {getPlatformLogo(platform.id, "h-4.5 w-4.5")}
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{platform.label}</span>
                    </div>
                    <div className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>2. Visual Generation Mode</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">REQUIRED</span>
                </h4>
              </div>
              <p className="text-xs text-slate-500 font-light mb-3">
                Choose whether automated Daily Posts and Weekly Campaigns should edit your uploaded Brand Assets or generate fresh AI visuals.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedUseBrandAssets(true)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedUseBrandAssets === true
                      ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">Use Brand Assets</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                    Uses uploaded creatives, applies OpenAI edits &amp; stamps brand logo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUseBrandAssets(false)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedUseBrandAssets === false
                      ? "border-violet-600 bg-violet-50/70 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PlusPenIcon className="h-4 w-4 text-violet-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">AI Visuals</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                    Generates fresh AI executive photographic visuals (GPT Image 2).
                  </p>
                </button>
              </div>
              {selectedUseBrandAssets === undefined && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-2.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Required: Please select whether to use Brand Assets or AI Generated Visuals before saving.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setChannelModalBrand(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedUseBrandAssets === undefined) {
                    alert("Required: Please select whether to use Brand Assets or AI Generated Visuals.");
                    return;
                  }
                  setIsSavingChannels(true);
                  try {
                    await updateProduct(channelModalBrand.id, {
                      targetPlatforms: selectedPlatforms,
                      useBrandAssets: selectedUseBrandAssets
                    });
                    setChannelModalBrand(null);
                  } catch (e: any) {
                    alert("Failed to save automation settings.");
                  } finally {
                    setIsSavingChannels(false);
                  }
                }}
                disabled={isSavingChannels}
                className="px-5 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingChannels ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
