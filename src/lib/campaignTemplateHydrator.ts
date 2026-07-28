import { sanitizeTemplateHtml } from './sanitizeTemplateHtml';

export function ensureFontStylesheet(html: string, fontFamily?: string): string {
  if (!html) return html;
  const rawFont = fontFamily || 'Inter Tight';
  
  // Extract all non-generic font names from comma-separated list (e.g. "Space Grotesk, Syne, sans-serif")
  const fonts = rawFont
    .split(',')
    .map((f) => f.replace(/['"]/g, '').trim())
    .filter((f) => f && !['sans-serif', 'serif', 'monospace', 'system-ui', 'cursive', 'inherit'].includes(f.toLowerCase()));

  if (fonts.length === 0) fonts.push('Inter Tight');

  // Build dynamic Google Fonts query parameters for whatever font the brand specifies:
  const fontFamiliesParam = fonts
    .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;500;600;700;800;900`)
    .join('&');

  const fontUrl = `https://fonts.googleapis.com/css2?${fontFamiliesParam}&display=swap`;
  const fontLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${fontUrl}" rel="stylesheet">`;

  if (html.includes('fonts.googleapis.com')) {
    return html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/gi, fontLink);
  }
  return `${fontLink}\n${html}`;
}

export function getContrastColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith('#')) return '#08080C';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return '#08080C';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#08080C' : '#FFFFFF';
}

export interface MasterTemplate {
  id: string;
  name: string;
  archetype: string;
  whyViral: string;
  viralityScore?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  rawHtml: string;
}

export interface HydrationData {
  headline: string;
  subtext: string;
  imageUrl: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor?: string;
  isTextAuto?: boolean;
  fontFamily: string;
}

const STORAGE_KEY_USED_TEMPLATES = 'b2p_v3_used_template_ids';

/**
 * Get rotational used template IDs from localStorage
 */
export function getUsedTemplateIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USED_TEMPLATES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save rotational used template IDs to localStorage
 */
export function saveUsedTemplateIds(usedIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USED_TEMPLATES, JSON.stringify(usedIds));
  } catch (e) {}
}

/**
 * Reset template rotation history
 */
export function resetTemplateRotation(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_USED_TEMPLATES);
  } catch (e) {}
}

/**
 * Pick 7 unused master templates from pool, tracking rotational usage
 */
export function pickUnusedMasterTemplates(allTemplates: MasterTemplate[], count: number = 7): MasterTemplate[] {
  if (!allTemplates || allTemplates.length === 0) return [];

  let usedIds = getUsedTemplateIds();
  let available = allTemplates.filter((t) => !usedIds.includes(t.id));

  // If available is less than required count, reset rotation cleanly
  if (available.length < count) {
    usedIds = [];
    resetTemplateRotation();
    available = [...allTemplates];
  }

  // Shuffle available pool deterministic-randomly
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // Mark newly selected templates as used
  const newUsed = [...usedIds, ...selected.map((s) => s.id)];
  saveUsedTemplateIds(newUsed);

  return selected;
}

/**
 * Hydrates raw template HTML with 8-token dynamic placeholder replacement
 */
/**
 * Pre-Flight Color Role & Contrast Mapping Engine
 * Analyzes template slot roles before token replacement to guarantee zero color collisions.
 */
export function resolvePreflightColorRoles(rawHtml: string, data: HydrationData) {
  const userBg = data.secondaryColor || '#FAF9F6';
  const userPrimary = data.primaryColor || '#3B82F6';
  const userAccent = data.accentColor || '#10B981';

  // Determine if canvas background is light or dark
  const bgIsDark = getContrastColor(userBg) === '#FFFFFF';
  const canvasBg = userBg;

  // Determine primary card/accent background role to ensure it never matches canvasBg luminance
  const primaryIsDark = getContrastColor(userPrimary) === '#FFFFFF';

  let cardBg = userPrimary;
  // If primary and secondary colors collide (both dark or both light), resolve card background to opposite contrast:
  if (bgIsDark === primaryIsDark) {
    cardBg = bgIsDark ? '#FFFFFF' : '#0F172A';
  }

  // Text color on top of canvas background:
  const canvasTextColor = bgIsDark ? '#FFFFFF' : '#0F172A';
  const canvasSubtextColor = bgIsDark ? '#CBD5E1' : '#475569';

  // Text color on top of inner cards (cardBg):
  const cardIsDark = getContrastColor(cardBg) === '#FFFFFF';
  const cardTextColor = cardIsDark ? '#FFFFFF' : '#0F172A';

  return {
    canvasBg,
    cardBg,
    accentColor: userAccent,
    canvasTextColor,
    canvasSubtextColor,
    cardTextColor,
    isDarkBg: bgIsDark
  };
}

/**
 * Hydrates raw template HTML with 8-token dynamic placeholder replacement and pre-flight contrast role mapping
 */
export function hydrateTemplateHtml(rawHtml: string, data: HydrationData): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Run Pre-Flight Role Analysis & Contrast Mapping
  const roles = resolvePreflightColorRoles(html, data);

  // 2. Replace structural tokens with pre-flight contrast resolved colors
  html = html.replace(/\{\{HEADLINE\}\}/g, data.headline || 'Empowering Modern Brands');
  html = html.replace(/\{\{SUBTEXT\}\}/g, data.subtext || 'Automated multi-channel campaign generation powered by AI.');
  html = html.replace(/\{\{IMAGE_URL\}\}/g, data.imageUrl || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80');
  html = html.replace(/\{\{LOGO_URL\}\}/g, data.logoUrl || '/whatsapp_images/BrandToPost.png');
  html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, roles.cardBg);
  html = html.replace(/\{\{SECONDARY_COLOR\}\}/g, roles.canvasBg);
  html = html.replace(/\{\{ACCENT_COLOR\}\}/g, roles.accentColor);
  html = html.replace(/\{\{FONT_FAMILY\}\}/g, data.fontFamily || 'Inter Tight, sans-serif');

  // 3. Post-replacement Slot-Level Text Contrast Enforcement
  if (roles.isDarkBg) {
    // Dark Canvas: Ensure headlines and body text outside cards are bright white & light slate
    html = html.replace(/color:\s*#000\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#000000\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#08080C\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#08080c\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#0f172a\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#1e293b\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#334155\b/gi, `color: ${roles.canvasSubtextColor}`);
    html = html.replace(/color:\s*#475569\b/gi, `color: ${roles.canvasSubtextColor}`);
    html = html.replace(/color:\s*rgba\(8,\s*8,\s*12/gi, `color: rgba(255, 255, 255`);
    html = html.replace(/color:\s*rgba\(15,\s*23,\s*42/gi, `color: rgba(255, 255, 255`);
  } else {
    // Light Canvas: Ensure headlines outside cards are dark slate
    html = html.replace(/color:\s*#FFF\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*#FFFFFF\b/gi, `color: ${roles.canvasTextColor}`);
    html = html.replace(/color:\s*rgba\(255,\s*255,\s*255/gi, `color: rgba(15, 23, 42`);
  }

  // Dynamic Headline Font Clamping for overflow prevention
  const headlineLength = (data.headline || '').length;
  if (headlineLength > 10) {
    html = html.replace(/font-size:\s*([8-9]\d|1\d\d|2\d\d)px/g, (match, p1) => {
      const num = parseInt(p1, 10);
      if (num >= 80) return 'font-size: 42px; line-height: 1.15;';
      return match;
    });
  }

  // Inject root container clip safeguard
  if (!html.includes('overflow: hidden')) {
    html = html.replace(/<div([^>]*style="[^"]*)"/i, '<div$1; overflow: hidden; word-break: break-word;"');
  }

  const sanitized = sanitizeTemplateHtml(html).html;
  return ensureFontStylesheet(sanitized, data.fontFamily);
}

