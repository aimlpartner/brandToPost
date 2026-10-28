import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Eye,
  Loader2,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import {
  FaLinkedin,
  FaXTwitter,
  FaInstagram,
  FaFacebook,
  FaReddit
} from 'react-icons/fa6';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { toPng } from 'html-to-image';
import {
  generatePostCreationSuggestions,
  generatePostCreationContent,
  generateImageViaProxy,
  mergeProductImagesViaProxy,
  saveOneDayPostToCampaigns,
  planAutonomousArtDirection
} from '../services/geminiService';
import { AssetPickerModal } from '../components/PostCreation/AssetPickerModal';
import { ProductMergeSlots } from '../components/PostCreation/ProductMergeSlots';
import { ImageLightbox } from '../components/ImageLightbox';
import { VisualEditorModal } from '../components/VisualEditorModal';
import { SocialMediaPlatform, OneDayPostCreationResult } from '../types';
import { cn, copyFormattedText, playSuccessChime } from '../lib/utils';
import {
  resolveSmartLayout,
  analyzeImageVision,
  VisionAnalysis,
  LayoutAnchor,
  formatHighlightedHeadline,
  resolveAutonomousDesign,
  AutonomousDesignResult,
  TypographicIntent,
  CompositionMode,
  renderTwoToneHeadline,
  UniversalCanvasRenderer,
  ArgonSceneGraph
} from '../lib/dynamicLayoutResolver';
import { resolveBrandFonts } from '../lib/fonts';

type VisualOption = 'ai' | 'single' | 'merge' | 'graphic';

const getProxiedImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

/**
 * Autonomous Artboard Renderer (Spec Section 5)
 * Dynamically switches composition mode and typographic intent:
 * 1. Attribution Badge (Person / Product spotlight: Mike B / Team Member)
 * 2. Taxonomy Strip (Semicolon tags: Motion; Lifestyle; Product)
 * 3. Metric Callout (Uppercase metric tag + proof stat + kicker)
 * 4. Hero Headline Only (Bold statement with negative space breathing room)
 * 5. Typographic Manifesto (Brutalist agency philosophy on neutral #E5E5E3 plate)
 * 6. Editorial Base Plate (Top 68% visual, bottom 32% text plate)
 * 7. Cinema Triptych (3 visual slices + base plate)
 */
export const AutonomousArtboard: React.FC<{
  design: AutonomousDesignResult;
  isFlattened?: boolean;
  flattenedImageUrl?: string;
  highlightWords?: string[];
  containerRef?: React.Ref<HTMLDivElement>;
}> = ({ design, isFlattened, flattenedImageUrl, highlightWords = [], containerRef }) => {
  const {
    mode,
    intent,
    frames,
    primaryText,
    secondaryText,
    kickerText,
    eyebrowText,
    logoUrl,
    surfaceColor,
    inkPrimary,
    inkSecondary,
    inkMuted,
    headlineFont,
    subtextFont,
    accentColor
  } = design;

  if (isFlattened && flattenedImageUrl) {
    return (
      <div
        ref={containerRef}
        data-darkreader-ignore="true"
        data-visual-artboard="true"
        className="darkreader-ignore relative w-full h-full overflow-hidden select-none"
        style={{ aspectRatio: '4/5', isolation: 'isolate', colorScheme: 'light' }}
      >
        <img
          src={getProxiedImageUrl(flattenedImageUrl)}
          alt="Post Visual"
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  const primaryImage = frames[0] || flattenedImageUrl;

  return (
    <div
      ref={containerRef}
      data-darkreader-ignore="true"
      data-visual-artboard="true"
      className="darkreader-ignore relative w-full h-full overflow-hidden select-none"
      style={{
        aspectRatio: '4/5',
        isolation: 'isolate',
        colorScheme: 'light',
        backgroundColor: mode === 'typographic_manifesto' ? '#E5E5E3' : surfaceColor
      }}
    >
      {/* ======================================================== */}
      {/* MODE 1: IN-SCENE FLOATING OVERLAY (Negative Space Photo) */}
      {/* ======================================================== */}
      {mode === 'in_scene_overlay' && primaryImage && (
        <div className="relative w-full h-full">
          <img
            src={getProxiedImageUrl(primaryImage)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          {/* Directional scrim protecting typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

          {/* ATTRIBUTION BADGE (MINIM Post 1: Mike B / Team Member) */}
          {intent === 'attribution_badge' ? (
            <div className="absolute bottom-8 left-8 z-10 flex flex-col max-w-[85%]">
              <h2
                style={{ fontFamily: headlineFont, letterSpacing: '-0.02em', lineHeight: 1.05 }}
                className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
              >
                {primaryText}
              </h2>
              {secondaryText && (
                <span
                  style={{ fontFamily: subtextFont }}
                  className="text-xs sm:text-sm font-normal text-slate-300 mt-1 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                >
                  {secondaryText}
                </span>
              )}
            </div>
          ) : intent === 'taxonomy_strip' ? (
            /* TAXONOMY STRIP (e.g. Concept + Semicolon Tags + Kicker) */
            <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col">
              <h1
                style={{ fontFamily: headlineFont, letterSpacing: '-0.02em', lineHeight: 1.08 }}
                className="text-2xl sm:text-3xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] text-balance"
              >
                {primaryText}
              </h1>
              {secondaryText && (
                <p
                  style={{ fontFamily: subtextFont }}
                  className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5 tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                >
                  {secondaryText}
                </p>
              )}
              {kickerText && (
                <p className="text-[11px] text-slate-400 mt-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {kickerText}
                </p>
              )}
            </div>
          ) : intent === 'metric_callout' ? (
            /* METRIC CALLOUT (Uppercase Metric Tag + Stat + Kicker) */
            <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col">
              {eyebrowText && (
                <span
                  style={{ color: accentColor, letterSpacing: '0.12em' }}
                  className="text-[10px] sm:text-[11px] uppercase font-bold mb-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                >
                  {eyebrowText}
                </span>
              )}
              <h1
                style={{ fontFamily: headlineFont, letterSpacing: '-0.025em', lineHeight: 1.05 }}
                className="text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] text-balance"
              >
                {primaryText}
              </h1>
              {kickerText && (
                <p className="text-xs text-slate-300 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {kickerText}
                </p>
              )}
            </div>
          ) : (
            /* HERO HEADLINE ONLY (Bold & Clean Breathing Room) */
            <div className="absolute bottom-8 left-8 right-8 z-10 flex flex-col">
              <h1
                style={{ fontFamily: headlineFont, letterSpacing: '-0.02em', lineHeight: 1.05 }}
                className="text-2xl sm:text-3xl font-semibold text-white text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                dangerouslySetInnerHTML={{
                  __html: formatHighlightedHeadline(primaryText, highlightWords, accentColor)
                }}
              />
              {kickerText && (
                <p className="text-xs text-slate-300 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {kickerText}
                </p>
              )}
            </div>
          )}

          {logoUrl && (
            <img
              src={getProxiedImageUrl(logoUrl)}
              alt=""
              crossOrigin="anonymous"
              className="absolute top-6 left-6 h-6 max-h-7 w-auto max-w-[120px] object-contain z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2 & 3: EDITORIAL BASE PLATE (Single busy or 3-frames)*/}
      {/* ======================================================== */}
      {(mode === 'editorial_base_plate' || mode === 'cinema_triptych') && (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: surfaceColor }}>
          {/* Top 68% Visual Gallery */}
          <div className="h-[68%] w-full flex flex-col overflow-hidden relative">
            {mode === 'cinema_triptych' && frames.length >= 2 ? (
              frames.map((src, i) => (
                <div key={i} className="flex-1 overflow-hidden relative">
                  <img
                    src={getProxiedImageUrl(src)}
                    alt=""
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))
            ) : (
              <img
                src={getProxiedImageUrl(primaryImage || '')}
                alt=""
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Bottom 32% Editorial Lower-Third Base Plate */}
          <div className="h-[32%] p-5 sm:p-6 flex flex-col justify-between" style={{ backgroundColor: surfaceColor }}>
            <div>
              <h1
                style={{ fontFamily: headlineFont, color: inkPrimary, letterSpacing: '-0.02em', lineHeight: 1.1 }}
                className="text-lg sm:text-xl font-bold leading-tight"
                dangerouslySetInnerHTML={{
                  __html: formatHighlightedHeadline(primaryText, highlightWords, accentColor)
                }}
              />
              {secondaryText && (
                <p style={{ color: inkSecondary, fontFamily: subtextFont }} className="text-xs sm:text-sm font-medium mt-1 tracking-tight">
                  {secondaryText}
                </p>
              )}
            </div>

            <div className="flex justify-between items-end">
              {kickerText ? (
                <span style={{ color: inkMuted }} className="text-[11px] font-medium">{kickerText}</span>
              ) : <div />}
              {logoUrl && (
                <img
                  src={getProxiedImageUrl(logoUrl)}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-5 sm:h-6 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 4: BRUTALIST TYPOGRAPHIC MANIFESTO (Zero Photos)     */}
      {/* ======================================================== */}
      {mode === 'typographic_manifesto' && (
        <div className="w-full h-full p-7 sm:p-9 flex flex-col justify-between relative" style={{ backgroundColor: '#E5E5E3' }}>
          {/* Top-Right Black Graphic Bleed */}
          <div className="absolute top-0 right-0 w-10 sm:w-14 h-20 sm:h-28 bg-black pointer-events-none" />

          <div className="mt-4 sm:mt-6 z-10">
            <h1
              style={{ fontFamily: headlineFont, color: inkPrimary, letterSpacing: '-0.03em', lineHeight: 1.02 }}
              className="text-2xl sm:text-3xl md:text-4xl font-black"
            >
              {primaryText}
            </h1>
            {secondaryText && (
              <div
                style={{ color: inkSecondary, fontFamily: subtextFont }}
                className="text-xs sm:text-sm font-normal mt-5 leading-relaxed max-w-[92%] space-y-2.5"
              >
                {secondaryText.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-end z-10">
            {kickerText ? (
              <span style={{ color: inkMuted }} className="text-[11px] uppercase tracking-wider font-semibold">
                {kickerText}
              </span>
            ) : <div />}
            {logoUrl && (
              <img
                src={getProxiedImageUrl(logoUrl)}
                alt=""
                crossOrigin="anonymous"
                className="h-6 sm:h-7 object-contain"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NON-AI GRAPHIC 1: AMBIENT BRAND MESH GRADIENT             */}
      {/* ======================================================== */}
      {mode === 'brand_mesh_gradient' && (
        <div
          className="w-full h-full p-8 sm:p-10 flex flex-col justify-between relative"
          style={{
            backgroundColor: '#0C111D',
            backgroundImage: `radial-gradient(at 15% 20%, ${accentColor}28 0px, transparent 55%), radial-gradient(at 85% 80%, #1E304F70 0px, transparent 65%), radial-gradient(at 50% 50%, #0C111DFA 0px, transparent 100%)`
          }}
        >
          {logoUrl && (
            <img
              src={getProxiedImageUrl(logoUrl)}
              alt=""
              crossOrigin="anonymous"
              className="h-7 sm:h-8 object-contain self-start"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          )}
          <div className="my-auto">
            <h1
              style={{ fontFamily: headlineFont, color: '#FAF7F2', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              className="text-3xl sm:text-4xl font-semibold leading-snug"
            >
              {renderTwoToneHeadline(primaryText, highlightWords, accentColor)}
            </h1>
            {secondaryText && (
              <p
                style={{ fontFamily: subtextFont }}
                className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed max-w-[90%]"
              >
                {secondaryText}
              </p>
            )}
          </div>
          <div className="flex justify-between items-end">
            {kickerText ? (
              <span className="text-xs text-slate-400 font-medium">{kickerText}</span>
            ) : <div />}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NON-AI GRAPHIC 2: METRIC PROOF PLATE                      */}
      {/* ======================================================== */}
      {mode === 'metric_proof_plate' && (
        <div className="w-full h-full p-8 sm:p-10 flex flex-col justify-between" style={{ backgroundColor: '#FAF7F2' }}>
          <div>
            {eyebrowText && (
              <span
                style={{ color: '#181613' }}
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/5 inline-block"
              >
                {eyebrowText}
              </span>
            )}
            <h2
              style={{ fontFamily: headlineFont, letterSpacing: '-0.04em', lineHeight: 1.0 }}
              className="text-5xl sm:text-6xl font-extrabold text-[#181613] tracking-tighter mt-6"
            >
              {renderTwoToneHeadline(primaryText, highlightWords, accentColor)}
            </h2>
            {secondaryText && (
              <p
                style={{ fontFamily: subtextFont, color: '#4A453E' }}
                className="text-base sm:text-lg font-medium mt-4 leading-snug"
              >
                {secondaryText}
              </p>
            )}
          </div>
          <div className="pt-5 border-t border-black/10 flex justify-between items-center">
            {kickerText ? (
              <span style={{ color: '#7C756B' }} className="text-xs font-medium">{kickerText}</span>
            ) : <div />}
            {logoUrl && (
              <img
                src={getProxiedImageUrl(logoUrl)}
                alt=""
                crossOrigin="anonymous"
                className="h-6 object-contain"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NON-AI GRAPHIC 3: REAL PRODUCT CUTOUT ON STUDIO PLATE     */}
      {/* ======================================================== */}
      {mode === 'product_studio_plate' && primaryImage && (
        <div className="w-full h-full p-8 sm:p-10 flex flex-col justify-between" style={{ backgroundColor: surfaceColor }}>
          <div>
            <h1
              style={{ fontFamily: headlineFont, color: inkPrimary, letterSpacing: '-0.02em', lineHeight: 1.1 }}
              className="text-2xl sm:text-3xl font-bold leading-tight"
            >
              {renderTwoToneHeadline(primaryText, highlightWords, accentColor)}
            </h1>
            {secondaryText && (
              <p style={{ color: inkSecondary, fontFamily: subtextFont }} className="text-xs sm:text-sm font-medium mt-2">
                {secondaryText}
              </p>
            )}
          </div>

          {/* Real Cutout Product Asset with Realistic Contact Shadow */}
          <div className="my-auto flex items-center justify-center relative py-4">
            <img
              src={getProxiedImageUrl(primaryImage)}
              alt=""
              crossOrigin="anonymous"
              className="max-h-56 sm:max-h-64 object-contain"
              style={{ filter: 'drop-shadow(0 25px 25px rgba(12, 20, 34, 0.20))' }}
            />
          </div>

          <div className="flex justify-between items-end">
            {kickerText ? (
              <span style={{ color: inkMuted }} className="text-xs font-medium">{kickerText}</span>
            ) : <div />}
            {logoUrl && (
              <img
                src={getProxiedImageUrl(logoUrl)}
                alt=""
                crossOrigin="anonymous"
                className="h-6 sm:h-7 object-contain"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 5: MULTI-ASSET STEP / ROUTINE COLLAGE (Section 7)   */}
      {/* ======================================================== */}
      {mode === 'step_routine_collage' && (
        <div className="w-full h-full grid grid-cols-12 gap-1 bg-[#0A0A0C] p-1">
          {/* Hero Card (58% width) */}
          <div className="col-span-7 relative h-full overflow-hidden rounded-l-md">
            <img
              src={getProxiedImageUrl(frames[0] || primaryImage || '')}
              alt=""
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-4 z-10">
              <h1
                style={{ fontFamily: headlineFont }}
                className="text-2xl sm:text-3xl font-black text-white uppercase leading-none tracking-tight"
              >
                {renderTwoToneHeadline(primaryText, highlightWords, accentColor)}
              </h1>
            </div>
          </div>

          {/* Step Cards Stack (42% width) */}
          <div className="col-span-5 flex flex-col gap-1 h-full">
            {(design.steps && design.steps.length > 0
              ? design.steps.slice(0, 3)
              : [
                  { title: 'START FAST', subtitle: 'Initial setup & launch' },
                  { title: 'BUILD HABIT', subtitle: 'Consistency in action' },
                  { title: 'SCALE PEAK', subtitle: 'Long term momentum' }
                ]
            ).map((step, idx) => (
              <div key={idx} className="relative flex-1 overflow-hidden rounded-r-md">
                <img
                  src={getProxiedImageUrl(frames[idx + 1] || frames[0] || primaryImage || '')}
                  alt=""
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span
                    style={{ color: accentColor }}
                    className="text-xl sm:text-2xl font-black opacity-75"
                  >
                    0{idx + 1}
                  </span>
                  <div>
                    <h3
                      style={{ fontFamily: headlineFont }}
                      className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-tight"
                    >
                      {renderTwoToneHeadline(step.title, step.highlightWords, accentColor)}
                    </h3>
                    {step.subtitle && (
                      <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">{step.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function PostCreation() {
  const navigate = useNavigate();
  const { activeProduct } = useProducts();
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  // Form vs Direct Prompt
  const [creationMode, setCreationMode] = useState<'form' | 'prompt'>('form');

  // Core Fields
  const [topic, setTopic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [specialOccasion, setSpecialOccasion] = useState('');
  const [directPrompt, setDirectPrompt] = useState('');

  // Visual Selection: 'ai' | 'single' | 'merge'
  const [visualOption, setVisualOption] = useState<VisualOption>('ai');
  const [singleAssetUrl, setSingleAssetUrl] = useState<string | null>(null);
  const [asset1Url, setAsset1Url] = useState<string | null>(null);
  const [asset2Url, setAsset2Url] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  // Publishing Channel
  const [selectedChannel, setSelectedChannel] = useState<SocialMediaPlatform>('LinkedIn');

  // Tror Suggestions
  const [suggestions, setSuggestions] = useState<{
    topic: string[];
    purpose: string[];
    occasion: string[];
  }>({ topic: [], purpose: [], occasion: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState<{
    topic?: boolean;
    purpose?: boolean;
    occasion?: boolean;
  }>({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Output Result
  const [generatedPost, setGeneratedPost] = useState<OneDayPostCreationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sampledPostLuminance, setSampledPostLuminance] = useState<number>(45);
  const [postVisionAnalysis, setPostVisionAnalysis] = useState<VisionAnalysis | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturingVisual, setIsCapturingVisual] = useState(false);

  React.useEffect(() => {
    if (generatedPost?.imageUrl) {
      analyzeImageVision(
        generatedPost.imageUrl,
        generatedPost.layoutAnchor || generatedPost.visualPrompt
      ).then((analysis) => {
        setPostVisionAnalysis(analysis);
        setSampledPostLuminance(analysis.averageLuminance);
      });
    }
  }, [generatedPost?.imageUrl, generatedPost?.layoutAnchor, generatedPost?.visualPrompt]);

  const handleViewFullSize = async () => {
    if ((generatedPost?.isFlattened || !cardRef.current) && generatedPost?.imageUrl) {
      setLightboxImage(generatedPost?.imageUrl || null);
      return;
    }
    if (!cardRef.current) {
      if (generatedPost?.imageUrl) setLightboxImage(generatedPost.imageUrl);
      return;
    }
    setIsCapturingVisual(true);
    try {
      const nodeWidth = cardRef.current.clientWidth || 384;
      const targetPixelRatio = Math.max(2, Math.round((1080 / nodeWidth) * 10) / 10);
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: targetPixelRatio,
        cacheBust: true,
        skipAutoScale: true,
        filter: (domNode) => {
          if (domNode instanceof HTMLElement) {
            if (domNode.dataset.noExport === 'true' || domNode.classList.contains('no-export')) {
              return false;
            }
          }
          return true;
        }
      });
      setLightboxImage(dataUrl);
    } catch (err) {
      console.warn('Could not snapshot card for full view, falling back to raw image:', err);
      setLightboxImage(generatedPost?.imageUrl || null);
    } finally {
      setIsCapturingVisual(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedPost?.imageUrl && !cardRef.current && generatedPost?.typographicIntent !== 'manifesto_body' && !generatedPost?.compositionMode) return;
    setIsCapturingVisual(true);
    try {
      let downloadUrl = generatedPost?.imageUrl || '';
      if (cardRef.current && (!generatedPost.isFlattened || !downloadUrl)) {
        const nodeWidth = cardRef.current.clientWidth || 384;
        const targetPixelRatio = Math.max(2, Math.round((1080 / nodeWidth) * 10) / 10);
        downloadUrl = await toPng(cardRef.current, {
          pixelRatio: targetPixelRatio,
          cacheBust: true,
          skipAutoScale: true,
          filter: (domNode) => {
            if (domNode instanceof HTMLElement) {
              if (domNode.dataset.noExport === 'true' || domNode.classList.contains('no-export')) {
                return false;
              }
            }
            return true;
          }
        });
      }
      const link = document.createElement('a');
      link.download = `post_${generatedPost.channel || 'visual'}.png`;
      link.href = downloadUrl;
      link.click();
    } catch (err) {
      console.warn('Failed to snapshot card locally via html-to-image, falling back to server compositor:', err);
      try {
        const token = user ? await user.getIdToken() : '';
        const res = await fetch('/api/render-visual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            visualType: 'custom-overlay',
            visualData: {
              headline: generatedPost.headline,
              subtext: generatedPost.subtext,
              eyebrow: generatedPost.eyebrow,
              highlightWords: generatedPost.highlightWords,
              primaryColor: activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#E9B638',
              fontFamily: (activeProduct as any)?.fontFamily || activeProduct?.visualData?.fonts?.primary || "'Inter Tight', sans-serif",
              layoutAnchor: generatedPost.layoutAnchor,
              scene: generatedPost.scene
            },
            imageUrl: generatedPost.imageUrl,
            dna: activeProduct,
            activeLogo: activeProduct?.logoDarkUrl || activeProduct?.logoUrl,
            fallbackText: activeProduct?.name || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            const link = document.createElement('a');
            link.download = `post_${generatedPost.channel || 'visual'}.png`;
            link.href = data.url;
            link.click();
            return;
          }
        }
      } catch (serverErr) {
        console.error('Server compositor fallback failed:', serverErr);
      }
      // Ultimate fallback:
      const link = document.createElement('a');
      link.download = `post_${generatedPost.channel || 'visual'}.png`;
      link.href = generatedPost.imageUrl;
      link.click();
    } finally {
      setIsCapturingVisual(false);
    }
  };

  // Handler for Tror Suggestions
  const handleGetSuggestions = async (field: 'topic' | 'purpose' | 'occasion') => {
    setLoadingSuggestions((prev) => ({ ...prev, [field]: true }));
    try {
      const items = await generatePostCreationSuggestions(
        activeProduct,
        field,
        { topic, purpose, occasion: specialOccasion, channel: selectedChannel },
        user?.uid
      );
      setSuggestions((prev) => ({ ...prev, [field]: items }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Main Post Generation
  const handleGeneratePost = async () => {
    if (!activeProduct) {
      alert('Please select an active brand first.');
      return;
    }

    if (creationMode === 'form' && !topic.trim()) {
      alert('Please enter a topic.');
      return;
    }

    if (creationMode === 'prompt' && !directPrompt.trim()) {
      alert('Please write a prompt.');
      return;
    }

    if (visualOption === 'merge' && (!asset1Url || !asset2Url)) {
      alert('Product merger requires both Asset 1 (Product) and Asset 2 (Person / Item 2).');
      return;
    }

    if (visualOption === 'single' && !singleAssetUrl) {
      alert('Please select or upload a brand asset.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // 1. Alex copywriting
      setGenerationStep(`Drafting ${selectedChannel} copy...`);
      const copyResult = await generatePostCreationContent({
        dna: activeProduct,
        topic: creationMode === 'form' ? topic : undefined,
        purpose: creationMode === 'form' ? purpose : undefined,
        specialOccasion: creationMode === 'form' ? specialOccasion : undefined,
        prompt: creationMode === 'prompt' ? directPrompt : undefined,
        channel: selectedChannel,
        isProductImageCreator: visualOption === 'merge',
        userId: user?.uid
      });

      // 2. Visual handling
      let finalImageUrl: string | undefined = undefined;

      if (visualOption === 'graphic') {
        setGenerationStep('Composing vector brand graphic card (zero AI diffusion)...');
        finalImageUrl = undefined;
      } else if (visualOption === 'merge' && asset1Url && asset2Url) {
        setGenerationStep('Merging product and model with AI Visual Engine...');
        finalImageUrl = await mergeProductImagesViaProxy(
          {
            asset1Url,
            asset2Url,
            prompt: copyResult.imagePrompt,
            headline: copyResult.primaryText || copyResult.headline,
            subtext: copyResult.secondaryText || copyResult.subtext,
            brandColors: [
              activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#08080C',
              activeProduct?.visualData?.colors?.[1] || activeProduct?.secondaryColor || '#E9B638'
            ],
            logoUrl: activeProduct?.logoDarkUrl || activeProduct?.logoUrl
          },
          user?.uid,
          activeProduct?.id
        );
      } else if (visualOption === 'single' && singleAssetUrl) {
        setGenerationStep('Enhancing brand visual with AI Visual Engine...');
        const promptPayload = {
          prompt: copyResult.imagePrompt || `Editorial post graphic about ${topic || directPrompt}`,
          headline: copyResult.primaryText || copyResult.headline,
          subtext: copyResult.secondaryText || copyResult.subtext,
          brandColors: [
            activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#08080C',
            activeProduct?.visualData?.colors?.[1] || activeProduct?.secondaryColor || '#E9B638'
          ],
          fontStyle: resolveBrandFonts(activeProduct?.tone, (activeProduct as any)?.fontFamily || activeProduct?.visualData?.fonts?.primary).headlineFont,
          brandAssetUrl: singleAssetUrl
        };
        const genUrl = await generateImageViaProxy(
          promptPayload,
          user?.uid,
          activeProduct?.id,
          activeProduct?.logoDarkUrl || activeProduct?.logoUrl
        );
        finalImageUrl = genUrl || singleAssetUrl;
      } else {
        setGenerationStep('Generating visual with AI Visual Engine...');
        const promptPayload = {
          prompt: copyResult.imagePrompt || `Editorial post graphic about ${topic || directPrompt}`,
          headline: copyResult.primaryText || copyResult.headline,
          subtext: copyResult.secondaryText || copyResult.subtext,
          layoutAnchor: copyResult.layoutAnchor,
          visualStrategy: copyResult.visualStrategy || (copyResult.typographicIntent === 'manifesto_body' ? 'brutalist_text_only' : 'synthetic_photography'),
          brandColors: [
            activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#08080C',
            activeProduct?.visualData?.colors?.[1] || activeProduct?.secondaryColor || '#E9B638'
          ]
        };
        const genUrl = await generateImageViaProxy(
          promptPayload,
          user?.uid,
          activeProduct?.id,
          activeProduct?.logoDarkUrl || activeProduct?.logoUrl
        );
        if (genUrl) finalImageUrl = genUrl;
      }

      const headlineStr = copyResult.primaryText || copyResult.headline || '';
      const subtextStr = copyResult.secondaryText || copyResult.subtext || '';

      let resolvedMode: CompositionMode;
      if (visualOption === 'graphic') {
        if (
          copyResult.typographicIntent === 'metric_callout' ||
          /\b(\d+%|\d+\.\d+x|\d+x|\$\d+|\d+\+)\b/i.test(headlineStr) ||
          headlineStr.toLowerCase().includes('leak') ||
          headlineStr.toLowerCase().includes('fail')
        ) {
          resolvedMode = 'metric_proof_plate';
        } else if (copyResult.typographicIntent === 'manifesto_body' || (headlineStr.length > 28 && subtextStr.length > 40)) {
          resolvedMode = 'typographic_manifesto';
        } else {
          resolvedMode = 'brand_mesh_gradient';
        }
      } else if (visualOption === 'single') {
        resolvedMode = singleAssetUrl && (singleAssetUrl.toLowerCase().includes('cutout') || singleAssetUrl.toLowerCase().includes('nobg'))
          ? 'product_studio_plate'
          : 'editorial_base_plate';
      } else {
        resolvedMode = copyResult.typographicIntent === 'manifesto_body'
          ? 'typographic_manifesto'
          : 'in_scene_overlay';
      }

      // 3. Generative Scene Graph Art Direction (Gemini 4 Argon - Section 6 & 7)
      setGenerationStep('Synthesizing generative scene graph with Gemini 4 Argon...');
      let generatedScene: ArgonSceneGraph | undefined = undefined;
      try {
        const availableImages = finalImageUrl ? [finalImageUrl] : (singleAssetUrl ? [singleAssetUrl] : []);
        generatedScene = await planAutonomousArtDirection({
          brandDna: activeProduct,
          postCopy: copyResult.copy,
          headline: copyResult.primaryText || copyResult.headline,
          subtext: copyResult.secondaryText || copyResult.subtext,
          availableImageUrls: availableImages,
          isGraphicOnly: visualOption === 'graphic'
        });
      } catch (sceneErr) {
        console.warn('Argon scene graph note:', sceneErr);
      }

      setGenerationStep('Saving post...');
      const postId = 'post_1day_' + Math.random().toString(36).substring(2, 10);

      const resolvedFonts = resolveBrandFonts(activeProduct?.tone, (activeProduct as any)?.fontFamily || activeProduct?.visualData?.fonts?.primary);

      const savedCampaignId = await saveOneDayPostToCampaigns({
        productId: activeProduct.id,
        userId: user?.uid || 'guest',
        productName: activeProduct.name,
        productLogoUrl: activeProduct.logoUrl,
        channel: selectedChannel,
        copy: copyResult.copy,
        imageUrl: finalImageUrl,
        headline: copyResult.primaryText || copyResult.headline,
        subtext: copyResult.secondaryText || copyResult.subtext,
        topic: creationMode === 'form' ? topic : directPrompt.substring(0, 50),
        purpose: creationMode === 'form' ? purpose : 'Direct Prompt Post',
        eyebrow: copyResult.eyebrow,
        layoutAnchor: copyResult.layoutAnchor,
        highlightWords: copyResult.highlightWords || [],
        typographicIntent: copyResult.typographicIntent,
        primaryText: copyResult.primaryText || copyResult.headline,
        secondaryText: copyResult.secondaryText || copyResult.subtext,
        kickerText: copyResult.kickerText,
        compositionMode: resolvedMode,
        scene: generatedScene,
        brandColors: [
          activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#08080C',
          activeProduct?.visualData?.colors?.[1] || activeProduct?.secondaryColor || '#E9B638'
        ],
        fontFamily: resolvedFonts.headlineFont
      });

      setGeneratedPost({
        id: postId,
        channel: selectedChannel,
        copy: copyResult.copy,
        headline: copyResult.primaryText || copyResult.headline,
        subtext: copyResult.secondaryText || copyResult.subtext,
        eyebrow: copyResult.eyebrow,
        highlightWords: copyResult.highlightWords,
        imageUrl: finalImageUrl,
        visualPrompt: copyResult.imagePrompt,
        isMergedImage: visualOption === 'merge',
        campaignId: savedCampaignId,
        layoutAnchor: copyResult.layoutAnchor,
        typographicIntent: copyResult.typographicIntent,
        compositionMode: resolvedMode,
        scene: generatedScene,
        primaryText: copyResult.primaryText || copyResult.headline,
        secondaryText: copyResult.secondaryText || copyResult.subtext,
        kickerText: copyResult.kickerText,
        frames: finalImageUrl ? [finalImageUrl] : []
      });

      playSuccessChime();

      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err: any) {
      console.error('Post generation error:', err);
      setGenerationError(err.message || 'Failed to generate post. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleCopyText = async () => {
    if (!generatedPost?.copy) return;
    await copyFormattedText(generatedPost.copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const channels: { id: SocialMediaPlatform; label: string; icon: React.ElementType }[] = [
    { id: 'LinkedIn', label: 'LinkedIn', icon: FaLinkedin },
    { id: 'X', label: 'X', icon: FaXTwitter },
    { id: 'Instagram', label: 'Instagram', icon: FaInstagram },
    { id: 'Facebook', label: 'Facebook', icon: FaFacebook },
    { id: 'Reddit', label: 'Reddit', icon: FaReddit }
  ];

  return (
    <div className="w-full space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Post Creation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create channel-native single posts with AI copy and visual assets.
          </p>
        </div>

        {generatedPost && (
          <button
            type="button"
            onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Jump to Preview
          </button>
        )}
      </div>

      {/* MINIMAL COMPACT FORM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Mode Toggle Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setCreationMode('form')}
              className={cn(
                "py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                creationMode === 'form'
                  ? "bg-white text-violet-700 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Guided Form
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('prompt')}
              className={cn(
                "py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                creationMode === 'prompt'
                  ? "bg-white text-violet-700 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Direct Prompt
            </button>
          </div>

          {activeProduct && (
            <span className="text-xs text-slate-400">
              Brand: <strong className="text-slate-700 font-semibold">{activeProduct.name}</strong>
            </span>
          )}
        </div>

        {/* Form Inputs */}
        {creationMode === 'form' ? (
          <div className="space-y-3.5">
            {/* Field 1: Topic */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Topic
                </label>
                <button
                  type="button"
                  onClick={() => handleGetSuggestions('topic')}
                  disabled={loadingSuggestions.topic}
                  className="text-xs flex items-center gap-1 text-violet-600 hover:text-violet-700 font-semibold cursor-pointer bg-violet-50 px-2 py-0.5 rounded-md"
                >
                  {loadingSuggestions.topic ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <img src="/B2P AVATAR.png" alt="Tror" className="w-3 h-3 rounded-full" />
                  )}
                  Ask Tror
                </button>
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Why traditional inbound SDR playbooks fail in 2026..."
                className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-600 transition-all text-slate-800 placeholder:text-slate-400"
              />

              {/* Tror Suggestions / Content Pillars */}
              {(suggestions.topic.length > 0 || (activeProduct?.contentPillars && activeProduct.contentPillars.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {suggestions.topic.length > 0 ? (
                    suggestions.topic.map((s, i) => (
                      <button
                        key={`s-${i}`}
                        type="button"
                        onClick={() => setTopic(s)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))
                  ) : (
                    activeProduct?.contentPillars?.slice(0, 3).map((pillar, i) => (
                      <button
                        key={`p-${i}`}
                        type="button"
                        onClick={() => setTopic(pillar)}
                        className="text-[11px] px-2 py-0.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-md transition-colors cursor-pointer"
                      >
                        Pillar: {pillar}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2-Column: Goal & Occasion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Field 2: Goal */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Goal / Purpose
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGetSuggestions('purpose')}
                    disabled={loadingSuggestions.purpose}
                    className="text-xs flex items-center gap-1 text-violet-600 hover:text-violet-700 font-semibold cursor-pointer bg-violet-50 px-2 py-0.5 rounded-md"
                  >
                    {loadingSuggestions.purpose ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <img src="/B2P AVATAR.png" alt="Tror" className="w-3 h-3 rounded-full" />
                    )}
                    Ask Tror
                  </button>
                </div>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Thought leadership, showcase product ROI..."
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-600 transition-all text-slate-800 placeholder:text-slate-400"
                />
                {suggestions.purpose.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {suggestions.purpose.map((s, i) => (
                      <button
                        key={`pur-${i}`}
                        type="button"
                        onClick={() => setPurpose(s)}
                        className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 3: Occasion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Occasion / Context
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGetSuggestions('occasion')}
                    disabled={loadingSuggestions.occasion}
                    className="text-xs flex items-center gap-1 text-violet-600 hover:text-violet-700 font-semibold cursor-pointer bg-violet-50 px-2 py-0.5 rounded-md"
                  >
                    {loadingSuggestions.occasion ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <img src="/B2P AVATAR.png" alt="Tror" className="w-3 h-3 rounded-full" />
                    )}
                    Ask Tror
                  </button>
                </div>
                <input
                  type="text"
                  value={specialOccasion}
                  onChange={(e) => setSpecialOccasion(e.target.value)}
                  placeholder="e.g., Evergreen, Feature Launch, Milestone..."
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-600 transition-all text-slate-800 placeholder:text-slate-400"
                />
                {suggestions.occasion.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {suggestions.occasion.map((s, i) => (
                      <button
                        key={`occ-${i}`}
                        type="button"
                        onClick={() => setSpecialOccasion(s)}
                        className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Direct Prompt Mode */
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-800">
              Prompt
            </label>
            <textarea
              value={directPrompt}
              onChange={(e) => setDirectPrompt(e.target.value)}
              rows={3}
              placeholder="Describe what you want to post about in detail..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-violet-600 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>
        )}

        {/* 2-Column: Media & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Visual / Media */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Visual
              </label>
              {/* Clean 4-Option Segment */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[11px]">
                <button
                  type="button"
                  onClick={() => setVisualOption('ai')}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                    visualOption === 'ai'
                      ? "bg-white text-violet-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  AI Image
                </button>
                <button
                  type="button"
                  onClick={() => setVisualOption('graphic')}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                    visualOption === 'graphic'
                      ? "bg-white text-violet-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Graphic (No AI)
                </button>
                <button
                  type="button"
                  onClick={() => setVisualOption('single')}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                    visualOption === 'single'
                      ? "bg-white text-violet-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Brand Asset
                </button>
                <button
                  type="button"
                  onClick={() => setVisualOption('merge')}
                  className={cn(
                    "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                    visualOption === 'merge'
                      ? "bg-white text-violet-700 font-bold shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Merge 2 Assets
                </button>
              </div>
            </div>

            {visualOption === 'ai' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <span>Direct generation will create a custom executive visual matched to your copy.</span>
              </div>
            )}

            {visualOption === 'graphic' && (
              <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <span className="font-semibold text-slate-800">Zero AI diffusion lag (0ms).</span>
                <span>Renders editorial manifesto typography, metric proof plates, and ambient brand mesh gradients.</span>
              </div>
            )}

            {visualOption === 'single' && (
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
                {singleAssetUrl ? (
                  <div className="flex items-center gap-2.5 w-full">
                    <img
                      src={singleAssetUrl}
                      alt="Attached asset"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate flex-1">Asset Attached</span>
                    <button
                      type="button"
                      onClick={() => setIsAssetModalOpen(true)}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-violet-500 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleAssetUrl(null)}
                      className="text-xs p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAssetModalOpen(true)}
                    className="w-full py-2 border border-dashed border-slate-300 hover:border-violet-500 rounded-lg text-xs font-semibold text-violet-600 hover:bg-violet-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Select from Library or Computer
                  </button>
                )}
              </div>
            )}

            {visualOption === 'merge' && (
              <ProductMergeSlots
                asset1Url={asset1Url}
                asset2Url={asset2Url}
                onSetAsset1={setAsset1Url}
                onSetAsset2={setAsset2Url}
              />
            )}
          </div>

          {/* Publishing Channel */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 block">
              Channel
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {channels.map((ch) => {
                const Icon = ch.icon;
                const isSelected = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChannel(ch.id)}
                    title={ch.label}
                    aria-label={ch.label}
                    className={cn(
                      "h-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "border-violet-600 bg-violet-50 text-violet-700 shadow-xs ring-1 ring-violet-600"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-violet-600" : "text-slate-600")} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {generationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {generationError}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGeneratePost}
            disabled={isGenerating}
            className={cn(
              "w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer",
              isGenerating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 active:scale-[0.99]"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStep || "Generating Post..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate 1-Day Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* POST PREVIEW (PUSHED BELOW FORM) */}
      <div ref={previewRef} id="post-preview-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">Post Preview</h2>
            <p className="text-xs text-slate-500">Live mockup and generated copy</p>
          </div>
          {generatedPost && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-violet-600 bg-white border border-slate-200 hover:bg-violet-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? "Copied" : "Copy Text"}
              </button>
              {generatedPost.imageUrl && (
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-violet-600 bg-white border border-slate-200 hover:bg-violet-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Download Image
                </button>
              )}
            </div>
          )}
        </div>

        {generatedPost ? (
          /* Live Post Display */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Post Copy */}
            <div className="md:col-span-7 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {activeProduct?.logoUrl ? (
                      <img
                        src={activeProduct.logoUrl}
                        alt="Logo"
                        className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                        {activeProduct?.name?.[0] || 'B'}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {activeProduct?.name || 'Brand Post'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Formatted for {generatedPost.channel}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {generatedPost.channel}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-1">
                  {generatedPost.copy}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Saved to Campaigns
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/campaigns')}
                  className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  View in Campaigns <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Display */}
            <div className="md:col-span-5 p-5 bg-slate-50/50 flex flex-col items-center justify-center">
              {generatedPost.imageUrl || generatedPost.compositionMode || generatedPost.typographicIntent === 'manifesto_body' || generatedPost.headline ? (
                <>
                  <div className="relative group w-full max-w-sm aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm">
                    {/* The Visual Artboard (ONLY this is captured by cardRef for export) */}
                    {generatedPost.scene ? (
                      <div ref={cardRef} className="w-full h-full relative">
                        <UniversalCanvasRenderer scene={generatedPost.scene} fallbackImageUrl={generatedPost.imageUrl} />
                      </div>
                    ) : (() => {
                      const autonomousDesign = resolveAutonomousDesign({
                        headline: generatedPost.primaryText || generatedPost.headline || '',
                        subtext: generatedPost.secondaryText || generatedPost.subtext || '',
                        eyebrow: generatedPost.eyebrow,
                        images: generatedPost.frames && generatedPost.frames.length > 0
                          ? generatedPost.frames
                          : (generatedPost.imageUrl ? [generatedPost.imageUrl] : []),
                        visionComplexity: postVisionAnalysis ? 50 : 40,
                        brandDna: activeProduct,
                        requestedIntent: generatedPost.typographicIntent,
                        requestedMode: generatedPost.compositionMode,
                        isGraphicOnly: !generatedPost.imageUrl,
                      });

                      return (
                        <AutonomousArtboard
                          design={autonomousDesign}
                          isFlattened={generatedPost.isFlattened}
                          flattenedImageUrl={generatedPost.imageUrl}
                          highlightWords={generatedPost.highlightWords}
                          containerRef={cardRef}
                        />
                      );
                    })()}

                    {/* Layer 4: Interactive Actions & Editor Launcher (OUTSIDE cardRef, completely isolated from capture) */}
                    <div 
                      data-no-export="true"
                      className={cn(
                        "no-export absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 z-30 p-4 pointer-events-none group-hover:pointer-events-auto",
                        isCapturingVisual && "!opacity-0 pointer-events-none"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setIsEditorOpen(true)}
                        className="px-3 py-1.5 bg-[#E9B638] text-slate-950 font-bold text-xs rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg cursor-pointer pointer-events-auto"
                        title="Open in Native Layered Visual Editor"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Edit in Visual Editor
                      </button>
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={handleViewFullSize}
                          disabled={isCapturingVisual}
                          className="p-2 bg-white text-slate-800 rounded-lg hover:scale-110 transition-transform cursor-pointer shadow-md flex items-center justify-center"
                          title="View Full Size Graphic"
                        >
                          {isCapturingVisual ? <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadImage}
                          disabled={isCapturingVisual}
                          className="p-2 bg-white text-slate-800 rounded-lg hover:scale-110 transition-transform cursor-pointer shadow-md flex items-center justify-center"
                          title="Download 1080x1350 Visual Card"
                        >
                          {isCapturingVisual ? <Loader2 className="w-4 h-4 animate-spin text-slate-600" /> : <Download className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

              </>
            ) : (
                <div className="w-full aspect-[4/5] rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-2 text-slate-300" />
                  <span className="text-xs font-medium">Text-only Post Generated</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sleek Minimal Placeholder */
          <div className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Post preview will appear here</span>
                <span className="text-[11px] text-slate-400">Generates platform copy, image visual, and auto-saves to Campaigns.</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Waiting for generation...</span>
          </div>
        )}
      </div>

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Select Brand Asset"
        description="Choose an asset from your Brand Library or upload from your computer."
        onSelectAsset={(url) => setSingleAssetUrl(url)}
      />

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {/* Native Layered Visual Editor Modal */}
      {isEditorOpen && generatedPost?.imageUrl && (
        <VisualEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageUrl={generatedPost.imageUrl}
          originalImageUrl={generatedPost.imageUrl}
          visualData={{
            headline: generatedPost.headline,
            subtext: generatedPost.subtext,
            baseImage: generatedPost.imageUrl,
            brandName: activeProduct?.name,
            colors: [
              activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#08080C',
              activeProduct?.visualData?.colors?.[1] || activeProduct?.secondaryColor || '#7C3AED'
            ],
            editorState: {
              headline: generatedPost.headline,
              subtext: generatedPost.subtext,
              bgImageUrl: generatedPost.imageUrl,
              baseBg: generatedPost.imageUrl,
              brandName: activeProduct?.name,
              brandColor: activeProduct?.visualData?.colors?.[0] || activeProduct?.primaryColor || '#E9B638',
              logoUrl: activeProduct?.logoDarkUrl || activeProduct?.logoUrl
            }
          }}
          activeLogo={activeProduct?.logoDarkUrl || activeProduct?.logoUrl}
          onSave={async (newImageUrl, _origUrl, newVisualData) => {
            setGeneratedPost(prev => prev ? {
              ...prev,
              imageUrl: newImageUrl,
              isFlattened: true,
              visualData: newVisualData
            } : null);

            // Also update the Firestore campaign if one was created
            if (generatedPost.campaignId) {
              try {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../firebase');
                const campaignRef = doc(db, 'campaigns', generatedPost.campaignId);
                await updateDoc(campaignRef, {
                  'dailyPosts.0.imageUrl': newImageUrl,
                  'platformVersions.0.imageUrl': newImageUrl,
                  'platformVersions.0.visualData': newVisualData
                });
              } catch (e) {
                console.warn('Failed to update campaign in Firestore:', e);
              }
            }
            setIsEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}
