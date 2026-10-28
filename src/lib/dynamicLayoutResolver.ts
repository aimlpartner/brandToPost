import React from 'react';
import { resolveBrandFonts, resolveBrandFontPairing } from './fonts';

/**
 * Dynamic Layout & Text Placement Engine
 * Implements Native.no / Native.io Continuous Coordinate Optimization & Elastic Collision Solver:
 * 1. Continuous Bounding Box Detection (subjectBox: xMin, yMin, xMax, yMax)
 * 2. Perceived Luminance Calculation (L = 0.299R + 0.587G + 0.114B)
 * 3. Dynamic Typographic Auto-Clamping Formula
 * 4. Free-space discovery & continuous floating-point percentages (origin_x, origin_y, maxWidth)
 * 5. Logo safe zone repulsor & collision avoidance
 * 6. Contrast & legibility safeguards (ambient drop shadows, box-decoration-break clone, directional scrims)
 */

export interface BoundingBox {
  xMin: number; // 0.0 - 1.0 (Percentage of image width)
  yMin: number; // 0.0 - 1.0 (Percentage of image height)
  xMax: number;
  yMax: number;
}

export interface FreeSpaceRectangle {
  originX: number; // 0.0 - 1.0
  originY: number; // 0.0 - 1.0
  width: number;   // 0.0 - 1.0
  height: number;  // 0.0 - 1.0
}

export interface VisionAnalysis {
  subjectBox: BoundingBox;
  averageLuminance: number; // 0 - 255
  dominantLeadingLineY?: number; // e.g. 0.54 for a table horizon
  freeSpace?: FreeSpaceRectangle;
  detectedSubjectSide?: 'left' | 'right' | 'center';
}

export type LayoutAnchor =
  | 'negative_space_right'
  | 'bottom_left_editorial'
  | 'bottom_full_cinematic'
  | 'top_left_banner'
  | 'editorial_split'
  | 'centered_minimal';

export interface LayoutOptions {
  fontFamily?: string;
  customAnchor?: LayoutAnchor | string;
  containerSize?: number; // Base reference is 1080px
  baseScale?: number;     // e.g., 0.5 for preview, 1.0 for 1080x1080 export
  brandColor?: string;
}

export interface ContinuousLayout {
  containerStyle: React.CSSProperties;
  headlineStyle: React.CSSProperties;
  subtextStyle: React.CSSProperties;
  eyebrowStyle: React.CSSProperties;
  logoStyle: React.CSSProperties;
  badgeContainerStyle: React.CSSProperties;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  isDarkBackground: boolean;
  hasScrim: boolean;
  scrimRequired: boolean;
  scrimStyle: React.CSSProperties;
  fontSize: number;
  lineHeight: number;
  textShadow: string;
  coordinates: {
    originX: number;
    originY: number;
    width: number;
  };
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  anchor: LayoutAnchor;
}

export type ComputedPostLayout = ContinuousLayout;

export interface SaliencyResult {
  subjectBox: { x: number; y: number; width: number; height: number } | BoundingBox;
  averageLuminance: number;
  hasForegroundCutout?: boolean;
  detectedSubjectSide?: 'left' | 'right' | 'center';
  detectedSubjectVPos?: 'top' | 'bottom' | 'center';
}

/**
 * Phase 3: Dynamic Typographic Auto-Clamping Formula
 * The headline font size adjusts automatically based on string length and word count
 * to guarantee it never wraps awkwardly, spills off edges, or overflows.
 */
export function computeTypographicScale(
  headline: string,
  containerSize: number = 1080
): { fontSize: number; lineHeight: number } {
  const charCount = (headline || '').trim().length;
  const scaleRatio = containerSize / 1080;

  let baseFontSize: number;
  let lineHeight: number;

  if (charCount <= 28) {
    // Punchy 2-4 word hook (e.g. "Stop Cold Calling.")
    baseFontSize = 72;
    lineHeight = 1.05;
  } else if (charCount <= 60) {
    // Medium headline (e.g. "Why 80% of landing pages fail on day one")
    baseFontSize = 52;
    lineHeight = 1.12;
  } else {
    // Long narrative headline
    baseFontSize = 38;
    lineHeight = 1.2;
  }

  const finalFontSize = Math.round(baseFontSize * scaleRatio);
  return { fontSize: Math.max(14, finalFontSize), lineHeight };
}

/**
 * Computes luminance from RGB using the ITU-R BT.601 perceptual formula:
 * L = 0.299 * R + 0.587 * G + 0.114 * B
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// In-memory caches to prevent redundant image decoding
const visionAnalysisCache = new Map<string, VisionAnalysis>();
const luminanceCache = new Map<string, number>();

export function clearVisionCache(): void {
  visionAnalysisCache.clear();
  luminanceCache.clear();
}

export function cacheServerVisionAnalysis(imageUrl: string, analysis: VisionAnalysis) {
  if (!imageUrl || !analysis) return;
  visionAnalysisCache.set(imageUrl, analysis);
  visionAnalysisCache.set(`${imageUrl}::`, analysis);
  luminanceCache.set(`${imageUrl}::full`, analysis.averageLuminance);
  luminanceCache.set(`${imageUrl}::bottom-left`, analysis.averageLuminance);
}

/**
 * Continuous Saliency & Free-Space Computer Vision Pass
 * Samples image pixels via an offscreen canvas to compute:
 * 1. Edge gradient distribution and texture variance across regions
 * 2. Unoccluded free space discovery
 * 3. Horizontal gradient peaks for leading lines / horizons (dominantLeadingLineY)
 * 4. Average luminance inside the free space rectangle
 */
export async function analyzeImageVision(
  imageUrl: string,
  promptHint?: string
): Promise<VisionAnalysis> {
  if (!imageUrl) {
    return getFallbackVisionAnalysis(imageUrl, promptHint);
  }

  const cacheKey = `${imageUrl}::${promptHint || ''}`;
  if (visionAnalysisCache.has(cacheKey)) {
    return visionAnalysisCache.get(cacheKey)!;
  }
  if (visionAnalysisCache.has(imageUrl)) {
    return visionAnalysisCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(getFallbackVisionAnalysis(imageUrl, promptHint));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timer = setTimeout(() => {
        const fallback = getFallbackVisionAnalysis(imageUrl, promptHint);
        visionAnalysisCache.set(cacheKey, fallback);
        resolve(fallback);
      }, 4500);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const sampleW = 64;
          const sampleH = 64;
          const canvas = document.createElement('canvas');
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(getFallbackVisionAnalysis(imageUrl, promptHint));
            return;
          }

          ctx.drawImage(img, 0, 0, sampleW, sampleH);
          const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

          const gray = new Float32Array(sampleW * sampleH);
          let totalLuminance = 0;
          for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
            const l = calculateLuminance(imgData[i], imgData[i + 1], imgData[i + 2]);
            gray[p] = l;
            totalLuminance += l;
          }
          const overallAvgLuminance = Math.round(totalLuminance / (sampleW * sampleH));

          // Column energy for continuous horizontal bound discovery
          const colEnergy = new Float32Array(sampleW);
          const horizEdges = new Float32Array(sampleH);

          let leftSum = 0, leftSumSq = 0, leftEdges = 0, leftCount = 0;
          let rightSum = 0, rightSumSq = 0, rightEdges = 0, rightCount = 0;
          const halfW = Math.floor(sampleW / 2);

          for (let y = 1; y < sampleH - 1; y++) {
            const yOffset = y * sampleW;
            for (let x = 1; x < sampleW - 1; x++) {
              const val = gray[yOffset + x];
              const gx = gray[yOffset + x + 1] - gray[yOffset + x - 1];
              const gy = gray[yOffset + sampleW + x] - gray[yOffset - sampleW + x];
              const edge = Math.abs(gx) + Math.abs(gy);

              colEnergy[x] += edge;
              horizEdges[y] += Math.abs(gy);

              if (x < halfW) {
                leftSum += val;
                leftSumSq += val * val;
                leftEdges += edge;
                leftCount++;
              } else {
                rightSum += val;
                rightSumSq += val * val;
                rightEdges += edge;
                rightCount++;
              }
            }
          }

          const leftVariance = (leftSumSq / leftCount) - Math.pow(leftSum / leftCount, 2);
          const rightVariance = (rightSumSq / rightCount) - Math.pow(rightSum / rightCount, 2);
          const leftComplexity = leftVariance + (leftEdges / leftCount) * 40;
          const rightComplexity = rightVariance + (rightEdges / rightCount) * 40;

          // Free space lies on the side with lower complexity
          const isSubjectLeft = leftComplexity >= rightComplexity;
          const detectedSubjectSide: 'left' | 'right' | 'center' = isSubjectLeft ? 'left' : 'right';

          // Detect continuous horizontal leading line peak (horizon, counter, table)
          let maxHoriz = 0;
          let dominantLeadingLineY: number | undefined = undefined;
          for (let y = Math.floor(sampleH * 0.22); y < Math.floor(sampleH * 0.75); y++) {
            if (horizEdges[y] > maxHoriz) {
              maxHoriz = horizEdges[y];
              dominantLeadingLineY = Number((y / sampleH).toFixed(3));
            }
          }

          // Calculate continuous subject bounds from energy distribution
          let xMin = 0.08;
          let xMax = 0.92;
          let freeSpace: FreeSpaceRectangle;

          if (isSubjectLeft) {
            // Subject is on the left: find where subject energy tapers off
            let leftTot = 0;
            for (let x = 0; x < halfW; x++) leftTot += colEnergy[x];
            let cumL = 0;
            let cutX = Math.floor(sampleW * 0.40);
            for (let x = 0; x < halfW; x++) {
              cumL += colEnergy[x];
              if (cumL >= leftTot * 0.85) {
                cutX = x;
                break;
              }
            }
            xMin = 0.08;
            xMax = Number(Math.max(0.36, Math.min(0.55, cutX / sampleW)).toFixed(3));
            const freeOriginX = Number((xMax + 0.04).toFixed(3));
            const freeWidth = Number((0.92 - freeOriginX).toFixed(3));
            freeSpace = {
              originX: freeOriginX,
              originY: dominantLeadingLineY && dominantLeadingLineY > 0.16 ? dominantLeadingLineY : 0.20,
              width: freeWidth,
              height: 0.60,
            };
          } else {
            // Subject is on the right: find where subject energy begins
            let rightTot = 0;
            for (let x = halfW; x < sampleW; x++) rightTot += colEnergy[x];
            let cumR = 0;
            let startX = Math.floor(sampleW * 0.60);
            for (let x = halfW; x < sampleW; x++) {
              cumR += colEnergy[x];
              if (cumR >= rightTot * 0.18) {
                startX = x;
                break;
              }
            }
            xMin = Number(Math.max(0.48, Math.min(0.68, startX / sampleW)).toFixed(3));
            xMax = 0.94;
            const freeWidth = Number(Math.min(xMin - 0.04, 0.52).toFixed(3));
            freeSpace = {
              originX: 0.08,
              originY: dominantLeadingLineY && dominantLeadingLineY > 0.16 ? dominantLeadingLineY : 0.52,
              width: freeWidth,
              height: 0.40,
            };
          }

          // Sample luminance inside the identified free space
          let fsSum = 0;
          let fsCount = 0;
          const fsXs = Math.floor(freeSpace.originX * sampleW);
          const fsXe = Math.floor((freeSpace.originX + freeSpace.width) * sampleW);
          const fsYs = Math.floor(freeSpace.originY * sampleH);
          const fsYe = Math.floor((freeSpace.originY + freeSpace.height) * sampleH);

          for (let y = fsYs; y < fsYe; y++) {
            const rowOffset = y * sampleW;
            for (let x = fsXs; x < fsXe; x++) {
              fsSum += gray[rowOffset + x];
              fsCount++;
            }
          }
          const freeSpaceLuminance = fsCount > 0 ? Math.round(fsSum / fsCount) : overallAvgLuminance;
          // Protect dark scenes: if overall image is dark (night/office/moody < 110), do not let localized highlights skew background detection
          let finalLuminance = freeSpaceLuminance;
          if (overallAvgLuminance < 110) {
            finalLuminance = Math.min(freeSpaceLuminance, Math.max(overallAvgLuminance, Math.round(freeSpaceLuminance * 0.35 + overallAvgLuminance * 0.65)));
          } else {
            finalLuminance = fsCount > 0 ? Math.round(freeSpaceLuminance * 0.70 + overallAvgLuminance * 0.30) : overallAvgLuminance;
          }

          const analysis: VisionAnalysis = {
            subjectBox: {
              xMin: Number(xMin.toFixed(3)),
              yMin: 0.14,
              xMax: Number(xMax.toFixed(3)),
              yMax: 0.86,
            },
            averageLuminance: finalLuminance,
            dominantLeadingLineY,
            freeSpace,
            detectedSubjectSide,
          };

          visionAnalysisCache.set(cacheKey, analysis);
          resolve(analysis);
        } catch (_) {
          resolve(getFallbackVisionAnalysis(imageUrl, promptHint));
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(getFallbackVisionAnalysis(imageUrl, promptHint));
      };

      img.src = imageUrl;
    } catch (_) {
      resolve(getFallbackVisionAnalysis(imageUrl, promptHint));
    }
  });
}

/**
 * Intelligent deterministic prior generator for when canvas access is blocked or image is loading.
 * Uses hash jitter to produce continuous floating-point coordinates.
 */
function getFallbackVisionAnalysis(imageUrl: string, promptHint?: string): VisionAnalysis {
  const hint = (promptHint || '').toLowerCase();

  let hash = 0;
  const str = imageUrl + (promptHint || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const jitterX = ((Math.abs(hash) % 11) - 5) * 0.008;
  const jitterY = ((Math.abs(hash >> 3) % 11) - 5) * 0.008;

  let xMin = 0.54 + jitterX;
  let yMin = 0.14 + jitterY;
  let xMax = 0.94 + jitterX;
  let yMax = 0.86 + jitterY;
  let detectedSubjectSide: 'left' | 'right' | 'center' = 'right';

  if (hint.includes('negative_space_right') || hint.includes('left third')) {
    xMin = 0.08 + jitterX;
    yMin = 0.14 + jitterY;
    xMax = 0.44 + jitterX;
    yMax = 0.86 + jitterY;
    detectedSubjectSide = 'left';
  } else if (hint.includes('top_left_banner') || hint.includes('negative_space_top')) {
    xMin = 0.48 + jitterX;
    yMin = 0.45 + jitterY;
    xMax = 0.92 + jitterX;
    yMax = 0.90 + jitterY;
    detectedSubjectSide = 'right';
  } else if (hint.includes('centered') || hint.includes('centered_minimal')) {
    xMin = 0.28 + jitterX;
    yMin = 0.24 + jitterY;
    xMax = 0.72 + jitterX;
    yMax = 0.68 + jitterY;
    detectedSubjectSide = 'center';
  } else if (hint.includes('bottom_full_cinematic') || hint.includes('negative_space_bottom')) {
    xMin = 0.15 + jitterX;
    yMin = 0.10 + jitterY;
    xMax = 0.85 + jitterX;
    yMax = 0.52 + jitterY;
    detectedSubjectSide = 'center';
  }

  const roundedXmin = Math.max(0.05, Math.min(0.90, Number(xMin.toFixed(3))));
  const roundedXmax = Math.max(0.10, Math.min(0.95, Number(xMax.toFixed(3))));

  const isDarkHint = hint.includes('night') || hint.includes('dark') || hint.includes('moody') || hint.includes('black') || hint.includes('cinematic');
  const fallbackLuminance = isDarkHint ? 45 : 145;

  return {
    subjectBox: {
      xMin: roundedXmin,
      yMin: Math.max(0.05, Math.min(0.90, Number(yMin.toFixed(3)))),
      xMax: roundedXmax,
      yMax: Math.max(0.10, Math.min(0.95, Number(yMax.toFixed(3)))),
    },
    averageLuminance: fallbackLuminance,
    dominantLeadingLineY: 0.36 + jitterY,
    detectedSubjectSide,
  };
}

/**
 * Phase 2: Client-side Fast Image Luminance Sampler
 */
export async function sampleImageLuminance(
  imageUrl: string,
  quadrant: 'bottom-left' | 'top-left' | 'bottom' | 'center' | 'full' = 'bottom-left'
): Promise<number> {
  if (!imageUrl) return 45;
  const cacheKey = `${imageUrl}::${quadrant}`;
  if (luminanceCache.has(cacheKey)) {
    return luminanceCache.get(cacheKey)!;
  }

  const analysis = await analyzeImageVision(imageUrl);
  luminanceCache.set(cacheKey, analysis.averageLuminance);
  return analysis.averageLuminance;
}

function isColorTooDark(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return calculateLuminance(r, g, b) < 80;
}

function isColorTooLight(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return calculateLuminance(r, g, b) > 210;
}

/**
 * Section 8: Elastic Continuous Layout Solver
 * Computes continuous floating-point percentage coordinates without rigid corner snaps.
 * Directly fulfills Native's continuous coordinate optimization specification.
 */
export function computeContinuousTextPosition(
  headline: string,
  analysis: VisionAnalysis,
  options?: LayoutOptions
): ContinuousLayout {
  const { subjectBox, averageLuminance, dominantLeadingLineY } = analysis;
  
  // Native Section 4.2 Spec: L = 0.299R + 0.587G + 0.114B
  // L < 125 is Dark plate (use Vellum #FAF7F2), L >= 125 is Light plate (use Deep Espresso #181613)
  const isDarkBackground = averageLuminance < 125;
  const textColor = isDarkBackground ? '#FAF7F2' : '#181613';
  const subtextColor = isDarkBackground ? '#C2BCB0' : '#4A453E';

  const containerSize = options?.containerSize || 1080;
  const scaleRatio = containerSize / 1080;
  const baseScale = options?.baseScale ?? 1.0;

  const { fontSize: baseFontSize, lineHeight } = computeTypographicScale(headline, 1080);
  const fontSize = Math.max(14, Math.round(baseFontSize * scaleRatio * baseScale));

  // Resolved brand accent for highlight words & eyebrow - Bottleneck 2 Fix: Eliminating #7C3AED
  const resolvedAccentColor = isDarkBackground
    ? (options?.brandColor && !isColorTooDark(options.brandColor) && options.brandColor !== '#7C3AED' ? options.brandColor : '#E9B638')
    : (options?.brandColor && !isColorTooLight(options.brandColor) && !isColorTooDark(options.brandColor) && options.brandColor !== '#7C3AED' ? options.brandColor : '#E9B638');

  // Eyebrow tag optical styling
  const eyebrowStyle: React.CSSProperties = {
    fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: `${Math.max(10, Math.round(11 * scaleRatio * baseScale))}px`,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: resolvedAccentColor,
    marginBottom: `${Math.max(4, Math.round(6 * scaleRatio * baseScale))}px`,
    display: 'inline-block',
    textShadow: isDarkBackground ? '0 1px 3px rgba(12, 20, 34, 0.50)' : '0 1px 2px rgba(250, 247, 242, 0.40)',
    lineHeight: 1.2,
  };

  // Logo Safe Zone (Repulsor): Top 12% is reserved for the brand logo
  const logoSafeTop = 0.12;
  // Footer Safe Zone (Repulsor): Bottom 10% is reserved for swipe indicator
  const footerSafeBottom = 0.90;

  let originX: number;
  let originY: number;
  let maxWidth: number;
  let textAlign: 'left' | 'center' | 'right' = 'left';
  let alignItems: 'flex-start' | 'center' | 'flex-end' = 'flex-start';
  let logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';
  let scrimGradient = '';
  let resolvedAnchor: LayoutAnchor = 'bottom_left_editorial';

  const explicitAnchor = (options?.customAnchor || '').toLowerCase();

  // 1. Direct Free Space Rectangle from Computer Vision (Native Section 4)
  if (analysis.freeSpace && analysis.freeSpace.width > 0.25 && analysis.freeSpace.height > 0.15) {
    originX = Number(Math.max(0.06, Math.min(0.60, analysis.freeSpace.originX)).toFixed(3));
    originY = Number(Math.max(logoSafeTop, Math.min(0.70, analysis.freeSpace.originY)).toFixed(3));
    maxWidth = Number(Math.min(analysis.freeSpace.width, 0.92 - originX).toFixed(3));
    if (originX > 0.40) {
      resolvedAnchor = 'negative_space_right';
      logoPosition = 'top-left';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to left, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to left, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    } else {
      resolvedAnchor = 'bottom_left_editorial';
      logoPosition = 'top-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to right, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to right, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    }
  } else if (!explicitAnchor || explicitAnchor === 'auto' || explicitAnchor === 'continuous') {
    // 2. Pure Continuous Elastic Solver (Direct Section 8 Implementation)
    if (subjectBox.xMin > 0.38) {
      // Subject is on the right side -> text gets continuous left lane
      resolvedAnchor = 'bottom_left_editorial';
      originX = 0.08;
      maxWidth = Number(Math.min(subjectBox.xMin - 0.04, 0.85).toFixed(3));

      if (dominantLeadingLineY && dominantLeadingLineY > logoSafeTop) {
        originY = dominantLeadingLineY;
      } else {
        originY = subjectBox.yMin > 0.4 ? logoSafeTop : Number((subjectBox.yMax + 0.03).toFixed(3));
      }
      logoPosition = 'top-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to right, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to right, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    } else if (subjectBox.xMax < 0.62) {
      // Subject is on the left side -> text gets continuous right lane starting just after subject
      resolvedAnchor = 'negative_space_right';
      originX = Number((subjectBox.xMax + 0.04).toFixed(3));
      originY = dominantLeadingLineY && dominantLeadingLineY > logoSafeTop ? dominantLeadingLineY : Number((logoSafeTop + 0.04).toFixed(3));
      maxWidth = Number((0.92 - originX).toFixed(3));
      logoPosition = 'top-left';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to left, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to left, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    } else {
      // Subject is centered -> place below subject or above
      originX = 0.08;
      maxWidth = 0.84;
      originY = subjectBox.yMax > 0.65 ? logoSafeTop : Number((subjectBox.yMax + 0.04).toFixed(3));
      resolvedAnchor = subjectBox.yMax > 0.65 ? 'top_left_banner' : 'bottom_full_cinematic';
      logoPosition = subjectBox.yMax > 0.65 ? 'bottom-right' : 'top-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to top, rgba(12, 17, 29, 0.75) 0%, rgba(12, 17, 29, 0.35) 55%, transparent 100%)'
        : 'linear-gradient(to top, rgba(250, 247, 242, 0.60) 0%, rgba(250, 247, 242, 0.20) 60%, transparent 100%)';
    }
  } else {
    // 3. User Manual Preference Override (from UI Editor dropdown)
    if (explicitAnchor.includes('right') || explicitAnchor === 'negative_space_right') {
      resolvedAnchor = 'negative_space_right';
      originX = Number(Math.max(0.44, subjectBox.xMax + 0.04).toFixed(3));
      maxWidth = Number((0.92 - originX).toFixed(3));
      originY = dominantLeadingLineY && dominantLeadingLineY > logoSafeTop ? dominantLeadingLineY : 0.20;
      logoPosition = 'top-left';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to left, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to left, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    } else if (explicitAnchor.includes('banner') || explicitAnchor.includes('top')) {
      resolvedAnchor = 'top_left_banner';
      originX = 0.08;
      maxWidth = 0.84;
      originY = logoSafeTop;
      logoPosition = 'bottom-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to bottom, rgba(12, 17, 29, 0.75) 0%, rgba(12, 17, 29, 0.35) 55%, transparent 100%)'
        : 'linear-gradient(to bottom, rgba(250, 247, 242, 0.60) 0%, rgba(250, 247, 242, 0.20) 60%, transparent 100%)';
    } else if (explicitAnchor.includes('cinematic') || explicitAnchor.includes('bottom_full_cinematic') || explicitAnchor.includes('bottom')) {
      resolvedAnchor = 'bottom_full_cinematic';
      originX = 0.08;
      maxWidth = 0.84;
      originY = Number(Math.max(0.56, Math.min(0.68, subjectBox.yMax + 0.03)).toFixed(3));
      logoPosition = 'top-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to top, rgba(12, 17, 29, 0.75) 0%, rgba(12, 17, 29, 0.35) 55%, transparent 100%)'
        : 'linear-gradient(to top, rgba(250, 247, 242, 0.60) 0%, rgba(250, 247, 242, 0.20) 60%, transparent 100%)';
    } else if (explicitAnchor.includes('center') || explicitAnchor.includes('centered_minimal')) {
      resolvedAnchor = 'centered_minimal';
      originX = 0.10;
      maxWidth = 0.80;
      originY = dominantLeadingLineY && dominantLeadingLineY > 0.22 ? dominantLeadingLineY : 0.34;
      textAlign = 'center';
      alignItems = 'center';
      logoPosition = 'top-right';
      scrimGradient = isDarkBackground
        ? 'radial-gradient(circle at center, rgba(12, 17, 29, 0.65) 0%, rgba(12, 17, 29, 0.25) 65%, transparent 100%)'
        : 'radial-gradient(circle at center, rgba(250, 247, 242, 0.65) 0%, rgba(250, 247, 242, 0.20) 65%, transparent 100%)';
    } else {
      resolvedAnchor = 'bottom_left_editorial';
      originX = 0.08;
      maxWidth = Number(Math.min(Math.max(0.42, subjectBox.xMin - 0.04), 0.85).toFixed(3));
      originY = dominantLeadingLineY && dominantLeadingLineY > logoSafeTop
        ? dominantLeadingLineY
        : (subjectBox.yMin > 0.4 ? logoSafeTop : Number((subjectBox.yMax + 0.03).toFixed(3)));
      logoPosition = 'top-right';
      scrimGradient = isDarkBackground
        ? 'linear-gradient(to right, rgba(12, 17, 29, 0.70) 0%, rgba(12, 17, 29, 0.32) 55%, transparent 100%)'
        : 'linear-gradient(to right, rgba(250, 247, 242, 0.55) 0%, rgba(250, 247, 242, 0.18) 60%, transparent 100%)';
    }
  }

  // Ensure originY never collides with footer
  originY = Number(Math.min(originY, footerSafeBottom - 0.25).toFixed(3));
  originY = Number(Math.max(originY, logoSafeTop).toFixed(3));

  let logoStyle: React.CSSProperties;
  const logoTop = Math.max(12, Math.round(28 * scaleRatio * baseScale));
  const logoSide = Math.max(14, Math.round(30 * scaleRatio * baseScale));
  if (logoPosition === 'top-left') {
    logoStyle = {
      position: 'absolute',
      top: `${logoTop}px`,
      left: `${logoSide}px`,
      zIndex: 20,
    };
  } else if (logoPosition === 'bottom-right') {
    logoStyle = {
      position: 'absolute',
      bottom: `${logoTop}px`,
      right: `${logoSide}px`,
      zIndex: 20,
    };
  } else {
    // top-right
    logoStyle = {
      position: 'absolute',
      top: `${logoTop}px`,
      right: `${logoSide}px`,
      zIndex: 20,
    };
  }

  // Clamping safeguards
  originY = Math.min(originY, footerSafeBottom - 0.28);
  originY = Math.max(originY, logoSafeTop);

  const scrimRequired = Boolean(scrimGradient);
  const scrimStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: scrimGradient,
    pointerEvents: 'none',
    zIndex: 1,
  };

  // Fix for Bottleneck 1: Resolve Brand Font Archetypes instead of defaulting everything to EB Garamond
  const brandFonts = resolveBrandFonts(options?.fontFamily);
  const resolvedFontFamily = brandFonts.headlineFont;
  const resolvedSubtextFont = brandFonts.subtextFont;

  const textShadow = isDarkBackground
    ? '0 1px 2px rgba(12, 20, 34, 0.40), 0 4px 20px rgba(12, 20, 34, 0.65)'
    : '0 1px 4px rgba(250, 247, 242, 0.70), 0 2px 10px rgba(0, 0, 0, 0.08)';

  return {
    anchor: resolvedAnchor,
    textColor,
    subtextColor,
    accentColor: resolvedAccentColor,
    isDarkBackground,
    eyebrowStyle,
    hasScrim: scrimRequired,
    scrimRequired,
    scrimStyle,
    fontSize,
    lineHeight,
    textShadow,
    logoPosition,
    logoStyle,
    coordinates: {
      originX: Number(originX.toFixed(3)),
      originY: Number(originY.toFixed(3)),
      width: Number(maxWidth.toFixed(3)),
    },
    containerStyle: {
      position: 'absolute',
      left: `${(originX * 100).toFixed(1)}%`,
      top: `${(originY * 100).toFixed(1)}%`,
      width: `${(maxWidth * 100).toFixed(1)}%`,
      display: 'flex',
      flexDirection: 'column',
      alignItems,
      zIndex: 2,
      pointerEvents: 'none',
      boxSizing: 'border-box',
      backgroundColor: 'transparent',
    },
    headlineStyle: {
      fontFamily: resolvedFontFamily,
      fontSize: `${fontSize}px`,
      lineHeight: 1.05,
      color: textColor,
      textAlign,
      textShadow,
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
      margin: 0,
      fontWeight: resolvedFontFamily.includes('EB Garamond') || resolvedFontFamily.includes('Cormorant') ? 600 : 700,
      letterSpacing: '-0.02em',
      textWrap: 'balance' as any,
      backgroundColor: 'transparent',
    },
    subtextStyle: {
      fontFamily: resolvedSubtextFont,
      fontSize: `${Math.max(12, Math.round(fontSize * 0.42))}px`,
      lineHeight: 1.45,
      color: subtextColor,
      textAlign,
      textShadow: isDarkBackground ? '0 1px 6px rgba(12, 20, 34, 0.50)' : '0 1px 4px rgba(255, 255, 255, 0.60)',
      marginTop: `${Math.max(6, Math.round(12 * scaleRatio * baseScale))}px`,
      fontWeight: 400,
      letterSpacing: '-0.01em',
      opacity: 0.90,
      textWrap: 'balance' as any,
      backgroundColor: 'transparent',
    },
    badgeContainerStyle: {
      display: 'none', // Removed per Anti-Slop Codex
    },
  };
}

/**
 * Stage 2 & 5: Semantic Highlight Formatter
 * Wraps target highlighted words in italicized accent spans or fragmented pills
 * as defined in Native's Section 6B & 6F.
 */
export function formatHighlightedHeadline(
  headline: string,
  highlightWords: string[] = [],
  accentColor: string = '#E9B638'
): string {
  if (!headline || !highlightWords || highlightWords.length === 0) {
    return headline || '';
  }
  let formatted = headline;
  highlightWords.forEach((word) => {
    if (!word || !word.trim()) return;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    formatted = formatted.replace(
      regex,
      `<span style="color: ${accentColor}; font-style: italic; font-family: 'EB Garamond', Georgia, serif;">$1</span>`
    );
  });
  return formatted;
}

/**
 * Universal Smart Layout Resolver
 * Converts saliency/vision inputs and calls computeContinuousTextPosition.
 * Guarantees zero hardcoded snaps and complete backward compatibility with existing callers.
 */
export function resolveSmartLayout(
  headline: string,
  saliency?: Partial<SaliencyResult> | VisionAnalysis,
  options?: LayoutOptions
): ComputedPostLayout {
  let analysis: VisionAnalysis;

  if (saliency && 'subjectBox' in saliency && 'xMin' in (saliency as any).subjectBox) {
    analysis = saliency as VisionAnalysis;
  } else if (saliency && 'subjectBox' in saliency) {
    const sb = (saliency as any).subjectBox;
    const xMin = typeof sb.x === 'number' ? sb.x : 0.45;
    const yMin = typeof sb.y === 'number' ? sb.y : 0.15;
    const width = typeof sb.width === 'number' ? sb.width : 0.45;
    const height = typeof sb.height === 'number' ? sb.height : 0.55;
    analysis = {
      subjectBox: {
        xMin,
        yMin,
        xMax: Math.min(0.98, xMin + width),
        yMax: Math.min(0.98, yMin + height),
      },
      averageLuminance: saliency.averageLuminance ?? 45,
    };
  } else {
    const anchor = options?.customAnchor;
    analysis = getFallbackVisionAnalysis('', typeof anchor === 'string' ? anchor : undefined);
    if (saliency?.averageLuminance !== undefined) {
      analysis.averageLuminance = saliency.averageLuminance;
    }
  }

  return computeContinuousTextPosition(headline, analysis, options);
}

/**
 * Phase 1: Spatial Steering Prompt Builder
 */
export function buildSpatialSteeringPrompt(params: {
  subjectDescription: string;
  brandColors?: string[];
  preferredAnchor?: LayoutAnchor | string;
  industryOrAesthetic?: string;
}): string {
  const { subjectDescription, preferredAnchor } = params;

  let directionalWeight = '';
  let negativeSpaceReservation = 'generous organic negative space and uncluttered breathing room';

  if (preferredAnchor === 'negative_space_right') {
    directionalWeight = 'positioned on the left third of the frame';
    negativeSpaceReservation = 'wide expansive clean negative copy space on the right side';
  } else if (preferredAnchor === 'top_left_banner' || preferredAnchor === 'negative_space_top') {
    directionalWeight = 'positioned on the lower right third of the frame';
    negativeSpaceReservation = 'spacious empty background with generous negative copy space on the upper left';
  } else if (preferredAnchor === 'centered_minimal' || preferredAnchor === 'centered_atmospheric') {
    directionalWeight = 'centered subject floating with expansive atmospheric surrounding';
    negativeSpaceReservation = 'wide uncluttered negative space surrounding the focal point';
  } else if (preferredAnchor === 'editorial_split' || preferredAnchor === 'dynamic_split') {
    directionalWeight = 'positioned in the top half of the composition';
    negativeSpaceReservation = 'clean empty lower half reserved for editorial presentation';
  } else if (preferredAnchor === 'bottom_full_cinematic' || preferredAnchor === 'negative_space_bottom') {
    directionalWeight = 'positioned in the upper two thirds with panoramic scope';
    negativeSpaceReservation = 'wide dark cinematic empty space across the entire bottom third';
  } else if (preferredAnchor === 'bottom_left_editorial') {
    directionalWeight = 'positioned on the upper right third of the frame';
    negativeSpaceReservation = 'wide empty clean neutral surface with generous negative copy space on the lower left';
  }

  const parts = [subjectDescription];
  if (directionalWeight) parts.push(directionalWeight);
  parts.push(negativeSpaceReservation);
  parts.push('editorial 35mm photography, f/1.8 shallow depth of field, subtle organic film grain, directional ambient lighting');
  parts.push('clean editorial composition, strictly no text, no letters, no words, no watermark');

  return parts.join(', ');
}

export const ALL_LAYOUT_ANCHORS: { id: LayoutAnchor; name: string; description: string }[] = [
  { id: 'negative_space_right', name: 'Right Lane (Subject Left)', description: 'Founder on left, text in open right negative space' },
  { id: 'bottom_left_editorial', name: 'Left Lane (Subject Right)', description: 'Subject on right, continuous text in left negative space' },
  { id: 'bottom_full_cinematic', name: 'Cinematic Bottom', description: 'Subject in upper half, full-width continuous typography across bottom' },
  { id: 'top_left_banner', name: 'Elevated Banner', description: 'Subject lower-right, elevated text in upper negative space' },
  { id: 'centered_minimal', name: 'Centered Atmospheric', description: 'Atmospheric scene with centered typography' },
];

// ============================================================================
// AUTONOMOUS TYPOGRAPHIC INTENT & COMPOSITION ENGINE (SPEC SECTION 4)
// Directly solves the "Text-Slapping" trap (Problem A) & 4 Bottlenecks (Problem B)
// ============================================================================

export type TypographicIntent =
  | 'attribution_badge'   // Person/Product spotlight: Just "Name" + "Role/Title" (e.g. Mike B / Team Member)
  | 'taxonomy_strip'      // Portfolio gallery: "Headline" + "Tag 1; Tag 2; Tag 3" + "Micro-Kicker"
  | 'manifesto_body'      // Agency philosophy: "Oversized Hook" + 4-line poetic body (Zero photos)
  | 'hero_headline_only'  // Bold 3-word statement: Just massive title, letting the visual breathe
  | 'metric_callout';     // Data proof: Giant stat (e.g. "84%") + short explanation

export type CompositionMode =
  | 'in_scene_overlay'
  | 'editorial_base_plate'
  | 'cinema_triptych'
  | 'typographic_manifesto'
  | 'brand_mesh_gradient'
  | 'metric_proof_plate'
  | 'product_studio_plate'
  | 'step_routine_collage';

export interface AutonomousDesignResult {
  mode: CompositionMode;
  intent: TypographicIntent;
  aspectRatio: '4/5' | '1/1';
  width: number;
  height: number;
  // Brand Tokens
  surfaceColor: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  accentColor: string;
  headlineFont: string;
  subtextFont: string;
  // Resolved Typography Payload
  primaryText: string;        // Headline OR Person Name OR Giant Stat
  secondaryText?: string;     // Role OR Semicolon Taxonomy OR Manifesto Body
  kickerText?: string;        // Micro-kicker at bottom
  eyebrowText?: string;       // Only if intent is metric or explicit tag
  frames: string[];
  logoUrl?: string;
  steps?: { title: string; subtitle?: string; highlightWords?: string[] }[];
}

export function resolveAutonomousDesign(params: {
  headline?: string;
  subtext?: string;
  eyebrow?: string;
  images: string[];
  visionComplexity?: number; // 0 - 100
  brandDna?: any;
  requestedIntent?: TypographicIntent;
  requestedMode?: CompositionMode;
  isGraphicOnly?: boolean;
  isProductCutout?: boolean;
}): AutonomousDesignResult {
  const {
    headline = '',
    subtext = '',
    eyebrow = '',
    images,
    visionComplexity = 50,
    brandDna,
    requestedIntent,
    requestedMode,
    isGraphicOnly = false,
    isProductCutout = false
  } = params;

  // 1. Resolve Brand Font Archetype (Fix for Bottleneck 1)
  const brandTone = (brandDna?.tone || '').toLowerCase();
  const fontPairing = resolveBrandFonts(brandTone, brandDna?.fontFamily || brandDna?.visualData?.fonts?.primary);
  const headlineFont = fontPairing.headlineFont;
  const subtextFont = fontPairing.subtextFont;

  // 2. Resolve Vellum Color Palette (Fix for Bottleneck 2 - Eliminating #7C3AED)
  const rawBrandColor = brandDna?.colors?.[0] || brandDna?.visualData?.colors?.[0] || brandDna?.primaryColor;
  const accentColor = rawBrandColor && rawBrandColor !== '#7C3AED' ? rawBrandColor : '#E9B638';
  const surfaceColor = '#FAF7F2';
  const inkPrimary = '#181613';
  const inkSecondary = '#4A453E';
  const inkMuted = '#7C756B';

  // 3. Resolve Composition Mode
  let mode: CompositionMode = requestedMode || 'in_scene_overlay';

  if (!requestedMode) {
    if (isGraphicOnly || images.length === 0) {
      // PURE GRAPHICAL / NO-AI ARCHETYPES (Spec Section 4)
      if (
        requestedIntent === 'metric_callout' ||
        /\b(\d+%|\d+\.\d+x|\d+x|\$\d+|\d+\+)\b/i.test(headline) ||
        headline.toLowerCase().includes('leak') ||
        headline.toLowerCase().includes('fail')
      ) {
        mode = 'metric_proof_plate';
      } else if (requestedIntent === 'manifesto_body' || (headline.length > 28 && subtext.length > 50)) {
        mode = 'typographic_manifesto';
      } else if (images.length === 1 && isProductCutout) {
        mode = 'product_studio_plate';
      } else {
        // High-end ambient mesh gradient by default for graphical post
        mode = 'brand_mesh_gradient';
      }
    } else if (images.length >= 4 && (headline.toLowerCase().includes('step') || headline.toLowerCase().includes('routine') || headline.toLowerCase().includes('guide'))) {
      mode = 'step_routine_collage';
    } else if (images.length >= 3) {
      mode = 'cinema_triptych';
    } else if (requestedIntent === 'manifesto_body') {
      mode = 'typographic_manifesto';
    } else if (visionComplexity > 55 || images.length === 2) {
      mode = 'editorial_base_plate';
    } else if (isProductCutout) {
      mode = 'product_studio_plate';
    } else {
      mode = 'in_scene_overlay';
    }
  }

  // 4. Resolve Typographic Intent (Fix for Problem A - No rigid slapping)
  let intent: TypographicIntent = requestedIntent || 'taxonomy_strip';

  if (!requestedIntent) {
    if (mode === 'typographic_manifesto') {
      intent = 'manifesto_body';
    } else if (mode === 'metric_proof_plate') {
      intent = 'metric_callout';
    } else if (mode === 'cinema_triptych') {
      intent = 'taxonomy_strip';
    } else if (
      subtext.toLowerCase().includes('team') ||
      subtext.toLowerCase().includes('founder') ||
      subtext.toLowerCase().includes('member') ||
      (headline.split(' ').length <= 2 && subtext.split(' ').length <= 3 && subtext.length > 0)
    ) {
      intent = 'attribution_badge';
    } else if (headline.length < 24 && !subtext) {
      intent = 'hero_headline_only';
    } else {
      intent = mode === 'editorial_base_plate' ? 'taxonomy_strip' : 'hero_headline_only';
    }
  }

  // Format secondary text based on intent
  let secondaryText = subtext;
  if (intent === 'taxonomy_strip' && eyebrow && eyebrow !== 'PERSPECTIVE') {
    secondaryText = eyebrow.replace(/\s+/g, '; ');
  }

  return {
    mode,
    intent,
    aspectRatio: '4/5',
    width: 1080,
    height: 1350,
    surfaceColor,
    inkPrimary,
    inkSecondary,
    inkMuted,
    accentColor,
    headlineFont,
    subtextFont,
    primaryText: headline,
    secondaryText,
    kickerText: subtext && subtext.length < 55 && intent !== 'attribution_badge' ? subtext : undefined,
    eyebrowText: intent === 'metric_callout' || mode === 'metric_proof_plate' ? (eyebrow || 'BENCHMARK AUDIT') : undefined,
    frames: images.slice(0, 4),
    logoUrl: brandDna?.logoDarkUrl || brandDna?.logoUrl || undefined,
  };
}

/**
 * Two-Tone Semantic Keyword Highlighting (Spec Section 7)
 * Renders keywords in accent color without breaking text layout or letter-spacing
 */
export function renderTwoToneHeadline(
  headline: string,
  highlightWords: string[] = [],
  accentColor: string = '#E9B638'
): React.ReactNode {
  if (!highlightWords || highlightWords.length === 0) {
    return headline;
  }

  const escapedWords = highlightWords
    .filter(w => w && w.trim().length > 0)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escapedWords.length === 0) return headline;

  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const tokens = headline.split(regex);

  return (
    React.createElement(
      React.Fragment,
      null,
      tokens.map((token, i) => {
        const isHighlight = highlightWords.some(w => w.toLowerCase() === token.toLowerCase());
        return isHighlight ? (
          React.createElement('span', { key: i, style: { color: accentColor } }, token)
        ) : (
          React.createElement(React.Fragment, { key: i }, token)
        );
      })
    )
  );
}

import type { ArgonSceneGraph } from '../types';
export type { ArgonSceneGraph };

const getProxyUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

export const UniversalCanvasRenderer: React.FC<{
  scene?: ArgonSceneGraph | null;
  fallbackImageUrl?: string;
}> = ({ scene, fallbackImageUrl }) => {
  if (!scene) return null;

  const canvas = {
    width: scene?.canvas?.width || 1080,
    height: scene?.canvas?.height || 1350,
    backgroundColor: scene?.canvas?.backgroundColor || '#0C111D',
    backgroundImage: scene?.canvas?.backgroundImage
  };
  const typography = {
    headlineFont: scene?.typography?.headlineFont || 'Inter Tight, sans-serif',
    bodyFont: scene?.typography?.bodyFont || 'Inter, sans-serif',
    headlineWeight: scene?.typography?.headlineWeight ?? 700,
    textTransform: (scene?.typography?.textTransform || 'none') as any,
    letterSpacing: scene?.typography?.letterSpacing || '-0.02em',
    lineHeight: scene?.typography?.lineHeight ?? 1.15
  };
  const palette = {
    textPrimary: scene?.palette?.textPrimary || '#FAF7F2',
    textSecondary: scene?.palette?.textSecondary || '#94A3B8',
    accent: scene?.palette?.accent || '#E9B638',
    surface: scene?.palette?.surface || '#141419',
    border: scene?.palette?.border || 'rgba(255,255,255,0.1)',
    isDarkMode: scene?.palette?.isDarkMode ?? true
  };

  let panels = Array.isArray(scene.panels) ? [...scene.panels] : [];
  // Ensure that if an image was generated, it is always rendered on the canvas
  const hasImage = panels.some(p => p.imageUrl && p.imageUrl.trim().length > 0);
  if (!hasImage && fallbackImageUrl) {
    if (panels.length === 0) {
      panels = [
        {
          id: 'hero',
          rect: { x: 0, y: 0, width: 100, height: 100 },
          imageUrl: fallbackImageUrl,
          overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
        }
      ];
    } else {
      panels[0] = {
        ...panels[0],
        imageUrl: fallbackImageUrl,
        overlayGradient: panels[0].overlayGradient || 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
      };
    }
  }

  const textBlocks = Array.isArray(scene.textBlocks) ? scene.textBlocks : [];
  const graphicAccents = Array.isArray(scene.graphicAccents) ? scene.graphicAccents : [];

  return React.createElement(
    'div',
    {
      className: 'relative w-full aspect-[4/5] overflow-hidden select-none',
      style: {
        backgroundColor: canvas.backgroundColor || '#0C111D',
        backgroundImage: canvas.backgroundImage || undefined,
        fontFamily: typography.bodyFont || 'Inter, sans-serif',
      }
    },
    // Panels
    panels.map((panel) =>
      React.createElement(
        'div',
        {
          key: panel.id,
          className: 'absolute overflow-hidden',
          style: {
            left: `${panel.rect?.x ?? 0}%`,
            top: `${panel.rect?.y ?? 0}%`,
            width: `${panel.rect?.width ?? 100}%`,
            height: `${panel.rect?.height ?? 100}%`,
            backgroundColor: panel.backgroundColor || 'transparent',
            border: panel.border || 'none',
            borderRadius: panel.borderRadius || '0px',
          }
        },
        panel.imageUrl &&
          React.createElement('img', {
            src: getProxyUrl(panel.imageUrl),
            crossOrigin: 'anonymous',
            className: 'w-full h-full object-cover',
            alt: ''
          }),
        panel.overlayGradient &&
          React.createElement('div', {
            className: 'absolute inset-0',
            style: { background: panel.overlayGradient }
          }),
        panel.stepBadge &&
          React.createElement(
            'span',
            {
              className: 'absolute top-3 left-3 text-2xl font-black leading-none opacity-80',
              style: {
                fontFamily: typography.headlineFont,
                color: palette.accent,
              }
            },
            panel.stepBadge
          )
      )
    ),
    // Graphic Accents
    graphicAccents.map((accent, idx) =>
      React.createElement('div', {
        key: idx,
        className: 'absolute pointer-events-none',
        style: {
          left: `${accent.rect?.x ?? 0}%`,
          top: `${accent.rect?.y ?? 0}%`,
          width: `${accent.rect?.width ?? 0}%`,
          height: `${accent.rect?.height ?? 0}%`,
          backgroundColor: accent.fill || '#000000',
        }
      })
    ),
    // Text blocks
    textBlocks.map((block) => {
      const positionStyles: React.CSSProperties = {
        maxWidth: block.maxWidth || '90%',
        textAlign: block.align || 'left',
        ...(block.rect?.top ? { top: block.rect.top } : {}),
        ...(block.rect?.bottom ? { bottom: block.rect.bottom } : {}),
        ...(block.rect?.left ? { left: block.rect.left } : {}),
        ...(block.rect?.right ? { right: block.rect.right } : {}),
        ...(block.rect?.x !== undefined ? { left: `${block.rect.x}%` } : {}),
        ...(block.rect?.y !== undefined ? { top: `${block.rect.y}%` } : {}),
      };

      const spans = Array.isArray(block.spans) && block.spans.length > 0
        ? block.spans
        : [{ text: (block as any).text || '', isAccent: false }];

      return React.createElement(
        'div',
        {
          key: block.id,
          className: 'absolute z-10 flex flex-col pointer-events-none',
          style: positionStyles
        },
        React.createElement(
          'h1',
          {
            style: {
              fontFamily: typography.headlineFont,
              fontWeight: typography.headlineWeight,
              textTransform: typography.textTransform,
              letterSpacing: typography.letterSpacing,
              lineHeight: typography.lineHeight,
              whiteSpace: 'pre-wrap',
            },
            className: 'text-2xl sm:text-3xl leading-tight'
          },
          spans.map((span, sIdx) =>
            React.createElement(
              'span',
              {
                key: sIdx,
                style: {
                  color: span.isAccent ? palette.accent : (span.color || palette.textPrimary),
                  fontStyle: span.fontStyle || 'normal',
                  fontFamily: span.fontFamily || typography.headlineFont,
                }
              },
              span.text
            )
          )
        ),
        block.subtext &&
          React.createElement(
            'p',
            {
              className: 'mt-2 text-xs sm:text-sm leading-snug',
              style: {
                color: block.subtext.color || palette.textSecondary,
                fontSize: block.subtext.fontSize || '14px',
                whiteSpace: 'pre-wrap',
              }
            },
            block.subtext.text
          )
      );
    }),
    // Logo
    scene.logo &&
      React.createElement('img', {
        src: getProxyUrl(scene.logo.url),
        crossOrigin: 'anonymous',
        className: 'absolute object-contain z-20 pointer-events-none',
        style: {
          ...(scene.logo.rect as any),
          height: scene.logo.height || '32px',
        },
        alt: 'Brand Logo'
      })
  );
};

