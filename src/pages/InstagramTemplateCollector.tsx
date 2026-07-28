import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, RefreshCw, Layout, Eye, Copy, Check, Palette, Type, SlidersHorizontal, Flame, AlertCircle, CheckCircle2, Instagram } from 'lucide-react';
import { sanitizeTemplateHtml, escapeHtmlText, escapeHtmlAttr, safeUrlOrEmpty } from '../lib/sanitizeTemplateHtml';

export interface DiscoveredChannelTemplate {
  id: string;
  name: string;
  channel?: string;
  archetype: string;
  viralityScore?: string;
  sourceTrend?: string;
  whyViral: string;
  primaryColor?: string;
  secondaryColor?: string;
  rawHtml: string;
}

const SAMPLE_IMAGES = [
  { id: 'strategy', name: 'Strategy', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80' },
  { id: 'tech', name: 'Tech Code', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80' },
  { id: 'architecture', name: 'Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80' },
  { id: 'creative', name: 'Creative Desk', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1080&q=80' },
];

const SAMPLE_LOGOS = [
  { id: 'b2p_logo', name: '🚀 BrandToPost', url: '/B2PLOGO.png' },
  { id: 'b2p_avatar', name: '⚡ B2P Badge', url: '/B2P AVATAR.png' },
  { id: 'aiml', name: '🔷 AIML Partner', url: '/aimlpartner_logo.png' },
];

const FONTS = ['Inter', 'Outfit', 'Playfair Display', 'JetBrains Mono', 'Plus Jakarta Sans'];

function getContrastColor(hexColor: string): string {
  const hex = (hexColor || "#0F172A").replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#08080C' : '#FFFFFF';
}

function getContrastRGB(hexColor: string): string {
  const hex = (hexColor || "#0F172A").replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '8, 8, 12' : '255, 255, 255';
}

function renderDiscoveredHtml(rawHtml: string, data: {
  headline: string;
  subtext: string;
  imageUrl: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  isTextAuto: boolean;
  fontFamily: string;
}): string {
  if (!rawHtml) return "";

  let html = rawHtml;

  const logoSrc = safeUrlOrEmpty(data.logoUrl || SAMPLE_LOGOS[0].url);
  const imageSrc = safeUrlOrEmpty(data.imageUrl || SAMPLE_IMAGES[0].url);
  
  const resolvedTextColor = data.isTextAuto ? getContrastColor(data.secondaryColor) : data.textColor;
  const textRgb = getContrastRGB(data.secondaryColor); // Keep alpha opacities dynamic relative to BG

  // Substitute Placeholders FIRST before HTML Sanitization
  html = html.replace(/\{\{LOGO_URL\}\}/g, escapeHtmlAttr(logoSrc));
  html = html.replace(/\{\{HEADLINE\}\}/g, escapeHtmlText(data.headline));
  html = html.replace(/\{\{SUBTEXT\}\}/g, escapeHtmlText(data.subtext));
  html = html.replace(/\{\{IMAGE_URL\}\}/g, escapeHtmlAttr(imageSrc));
  html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, escapeHtmlAttr(data.primaryColor || "#EC4899"));
  html = html.replace(/\{\{SECONDARY_COLOR\}\}/g, escapeHtmlAttr(data.secondaryColor || "#0F172A"));
  html = html.replace(/\{\{ACCENT_COLOR\}\}/g, escapeHtmlAttr(data.accentColor || "#10B981"));
  html = html.replace(/\{\{FONT_FAMILY\}\}/g, escapeHtmlAttr(data.fontFamily || "Inter"));

  // Fix hardcoded colors to support light themes dynamically
  html = html.replace(/color:#FFFFFF/gi, `color:${resolvedTextColor}`);
  html = html.replace(/color:#ffffff/gi, `color:${resolvedTextColor}`);
  html = html.replace(/color:#FFF(?=[;\s'"])/gi, `color:${resolvedTextColor}`);
  html = html.replace(/color:#fff(?=[;\s'"])/gi, `color:${resolvedTextColor}`);
  html = html.replace(/255,\s*255,\s*255/g, textRgb);

  // Fix tiny logo dimensions in original templates (scale them up and preserve aspect ratio)
  html = html.replace(/max-height:\s*68px\s*;\s*max-width:\s*240px/g, "height:96px;max-width:320px");
  html = html.replace(/max-height:68px;max-width:240px/g, "height:96px;max-width:320px");

  // Prevent text overflow on 1080x1080 canvas
  // 1. Force word wrapping and root overflow containment
  html = html.replace(/width:\s*1080px;\s*height:\s*1080px;/gi, "width:1080px;height:1080px;overflow:hidden;word-break:break-word;overflow-wrap:break-word;");
  html = html.replace(/<div style=(['"])width:\s*1080px;/gi, "<div style=$1width:1080px;overflow:hidden;word-break:break-word;overflow-wrap:break-word;");

  // 2. Dynamic font scaling if headline is long text instead of a short metric/number
  if (data.headline && data.headline.length > 8) {
    html = html.replace(/font-size:\s*(\d+)px/gi, (match, p1) => {
      const size = parseInt(p1, 10);
      if (size >= 80) {
        const scaledSize = Math.min(60, Math.max(36, Math.round(size * 0.35)));
        return `font-size:${scaledSize}px;line-height:1.15;letter-spacing:-1px`;
      }
      return match;
    });
  }

  const { html: safeTemplate } = sanitizeTemplateHtml(html);
  return safeTemplate;
}

export function InstagramTemplateCollector() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [templates, setTemplates] = useState<DiscoveredChannelTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DiscoveredChannelTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic Sandbox Control State
  const [headline, setHeadline] = useState<string>('The 2026 B2B Design Paradigm Shift');
  const [subtext, setSubtext] = useState<string>('How minimalist 1:1 post structures drive 3x higher carousel engagement.');
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_IMAGES[3].url);
  const [logoUrl, setLogoUrl] = useState<string>(SAMPLE_LOGOS[0].url);
  const [primaryColor, setPrimaryColor] = useState<string>('#ec4899');
  const [secondaryColor, setSecondaryColor] = useState<string>('#FAF9F6');
  const [accentColor, setAccentColor] = useState<string>('#10b981');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [isTextAuto, setIsTextAuto] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<string>('Inter');

  // Load Saved Instagram Templates on Mount
  const loadSavedTemplates = async () => {
    try {
      const res = await fetch('/api/research-channel-templates?channel=instagram');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
          setSummary(`Loaded ${data.templates.length} saved Instagram templates from disk storage.`);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadSavedTemplates();
  }, []);

  const handleFetchInstagramTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research-channel-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'instagram',
          count: 20,
          niche: 'High-Impact Instagram B2B & Organic Brand Carousels (Micro-Copy, Editorial Hero, Before vs After Split)'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Discovery failed.`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.templates)) {
        throw new Error(data.error || 'Failed to parse discovered Instagram templates.');
      }

      setSummary(data.summary || `Extracted ${data.templates.length} Instagram templates.`);
      setTemplates(data.templates);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Instagram template discovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (html: string, id: string) => {
    navigator.clipboard.writeText(html);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-600" />
              Instagram Live Visual Template Collector
            </h1>
            <p className="text-xs text-slate-500">Grounded Research + Raw HTML/CSS Template Synthesis for Instagram 1:1 Posts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFetchInstagramTemplates}
            disabled={loading}
            className={`px-5 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
              loading
                ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                : 'bg-pink-600 hover:bg-pink-500 text-white border-pink-500 shadow-sm hover:shadow-pink-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Collecting 20 Instagram Templates...' : 'Discover & Collect All 20 Live Instagram Templates'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Panel (Live Sandbox Swapper) */}
        <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-6 flex-shrink-0 shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-pink-600" />
              Live Sandbox Copy Controls
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Headline Text</label>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Subtext / Hook</label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700 focus:bg-white focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              Brand Color DNA
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Primary Color</label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Canvas Bg</label>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-slate-200"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 block">Text Color</label>
                  <label className="text-[9px] text-pink-600 flex items-center gap-1 cursor-pointer font-bold">
                    <input 
                      type="checkbox" 
                      checked={isTextAuto} 
                      onChange={(e) => setIsTextAuto(e.target.checked)}
                      className="rounded bg-slate-100 border-slate-300" 
                    />
                    Auto
                  </label>
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    setIsTextAuto(false);
                  }}
                  disabled={isTextAuto}
                  className={`w-full h-8 bg-transparent rounded border border-slate-200 ${isTextAuto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <Type className="w-3.5 h-3.5 text-amber-600" />
              Font & Visual Asset
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Brand Logo Asset</label>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {SAMPLE_LOGOS.map((lg) => (
                    <button
                      key={lg.id}
                      onClick={() => setLogoUrl(lg.url)}
                      className={`p-1.5 rounded border text-[10px] truncate transition ${
                        logoUrl === lg.url ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lg.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Stock Image Asset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setImageUrl(img.url)}
                      className={`p-1.5 rounded border text-[10px] truncate transition ${
                        imageUrl === img.url ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Discovery Grid */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {summary && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-1 shadow-sm">
              <div className="font-bold text-pink-600 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" /> Grounded Instagram Research Summary
              </div>
              <p className="text-slate-600 leading-relaxed">{summary}</p>
            </div>
          )}

          {templates.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-20 border border-dashed border-slate-300 bg-white rounded-xl space-y-4 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No Instagram Templates Discovered Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Click "Discover & Collect All 20 Live Instagram Templates" above to perform a live search and synthesize 20 Instagram HTML/CSS templates.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center p-20 space-y-3 text-slate-500 text-xs font-mono">
              <RefreshCw className="w-6 h-6 animate-spin text-pink-600" />
              <span>Researching live Instagram B2B & organic post trends & synthesizing 20 HTML/CSS templates...</span>
            </div>
          )}

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map((t) => {
              const renderedHtml = renderDiscoveredHtml(t.rawHtml, {
                headline,
                subtext,
                imageUrl,
                logoUrl,
                primaryColor,
                secondaryColor,
                accentColor,
                textColor,
                isTextAuto,
                fontFamily,
              });

              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 hover:border-pink-300 rounded-xl p-4 transition flex flex-col space-y-3 shadow-sm hover:shadow-md group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{t.name}</h4>
                      <span className="text-[10px] text-pink-600 font-mono block mt-0.5">{t.archetype}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-mono">
                      {t.viralityScore || '98/100'}
                    </span>
                  </div>

                  {/* Scaled iframe preview container */}
                  <div className="w-full h-[345px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative flex justify-center items-center">
                    <div className="w-[345.6px] h-[345.6px] relative overflow-hidden">
                      <iframe
                        title={t.name}
                        srcDoc={renderedHtml}
                        className="w-[1080px] h-[1080px] origin-top-left pointer-events-none border-none absolute top-0 left-0"
                        style={{
                          transform: 'scale(0.32)',
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {t.whyViral}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyCode(t.rawHtml, t.id)}
                      className="px-3 py-1.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-200 hover:text-slate-900 flex items-center gap-1.5 transition"
                    >
                      {copiedId === t.id ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedId === t.id ? 'Copied HTML!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(t)}
                      className="px-3 py-1.5 rounded bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3 h-3" /> Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Modal Inspector for Selected Template */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedTemplate.name}</h2>
                <span className="text-xs text-pink-600 font-mono">{selectedTemplate.id}</span>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-3 py-1.5 rounded bg-slate-200 border border-slate-300 text-xs text-slate-700 hover:text-slate-900 font-medium"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col md:flex-row gap-6 items-center justify-center bg-slate-100">
              {/* Scaled Render Preview (0.55 scale: 594px x 594px) */}
              <div className="w-[594px] h-[594px] overflow-hidden rounded-lg border border-slate-300 flex-shrink-0 relative shadow-sm">
                <iframe
                  title="Inspector View"
                  srcDoc={renderDiscoveredHtml(selectedTemplate.rawHtml, {
                    headline,
                    subtext,
                    imageUrl,
                    logoUrl,
                    primaryColor,
                    secondaryColor,
                    accentColor,
                    textColor,
                    isTextAuto,
                    fontFamily,
                  })}
                  className="w-[1080px] h-[1080px] origin-top-left border-none absolute top-0 left-0"
                  style={{ transform: 'scale(0.55)' }}
                />
              </div>

              {/* Raw HTML Code Box */}
              <div className="w-full space-y-3 text-xs font-mono text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans font-semibold">Raw HTML Template Code:</span>
                  <button
                    onClick={() => handleCopyCode(selectedTemplate.rawHtml, selectedTemplate.id)}
                    className="px-3 py-1 bg-pink-600 text-white rounded font-sans text-xs font-bold shadow-sm"
                  >
                    Copy HTML
                  </button>
                </div>
                <pre className="w-full h-[540px] overflow-y-auto bg-slate-900 border border-slate-800 text-slate-100 rounded p-4 text-[11px] leading-snug whitespace-pre-wrap word-break">
                  {selectedTemplate.rawHtml}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstagramTemplateCollector;
