import { useState, useEffect } from "react";
import { ArrowLeft, Layout, Sparkles, Image as ImageIcon, Type, Palette, Check, RefreshCw, Lock, Terminal, Loader2, AlertCircle, TrendingUp, Flame, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { LAYOUT_BLUEPRINTS } from "../lib/layoutBlueprints";
import {
  sanitizeTemplateHtml,
  escapeHtmlText,
  escapeHtmlAttr,
  safeUrlOrEmpty,
  TEMPLATE_CSP_META,
} from "../lib/sanitizeTemplateHtml";
import { researchVisualTrends, VisualTrendReport, RawDiscoveredTemplate } from "../services/geminiService";
import { useProducts } from "../contexts/ProductContext";

const STOCK_IMAGES = [
  {
    id: "chess",
    name: "Strategy & Chess",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    desc: "Boardroom table with chess pieces, dark moody cinematic lighting"
  },
  {
    id: "tech",
    name: "Tech & Code",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
    desc: "Laptop displaying code on a developer desk, clean minimal setup"
  },
  {
    id: "architecture",
    name: "Abstract Architecture",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    desc: "Modern corporate glass skyscraper façade, architectural scale"
  },
  {
    id: "creative",
    name: "Creative Flatlay",
    url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80",
    desc: "Minimalist workspace flatlay with tools and sketchbook"
  }
];

const FONTS = ["Inter", "Outfit", "Playfair Display", "JetBrains Mono", "Plus Jakarta Sans", "Clash Display"];

const SCRAPE_LOGS = [
  "Sarah: Spawning Gemini 2.5 Pro reasoning agent...",
  "Sarah: Evaluating live LinkedIn & X founder post feeds...",
  "Sarah: Extracting raw HTML/CSS structural geometry...",
  "Arthur: Compiling raw unedited market template code...",
  "Arthur: Validating 1080x1080 canvas inline CSS bounds...",
  "✓ Dynamic Market Templates Discovered!"
];

function renderDiscoveredHtml(rawHtml: string, data: {
  headline: string;
  subtext: string;
  imageUrl: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
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

  // Replace standalone {{LOGO_URL}} tokens
  html = html.replace(/\{\{LOGO_URL\}\}/g, logoMarkup);

  html = html.replace(/\{\{HEADLINE\}\}/g, escapeHtmlText(data.headline));
  html = html.replace(/\{\{SUBTEXT\}\}/g, escapeHtmlText(data.subtext));
  html = html.replace(/\{\{IMAGE_URL\}\}/g, escapeHtmlAttr(safeUrlOrEmpty(data.imageUrl)));
  html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, escapeHtmlAttr(data.primaryColor || "#6366F1"));
  html = html.replace(/\{\{SECONDARY_COLOR\}\}/g, escapeHtmlAttr(data.secondaryColor || "#0F172A"));
  html = html.replace(/\{\{FONT_FAMILY\}\}/g, escapeHtmlAttr(data.fontFamily || "Inter"));
  return html;
}

export function VisualTemplateLibrary() {
  let activeProduct: any = null;
  try {
    const productCtx = useProducts();
    activeProduct = productCtx?.activeProduct;
  } catch (e) {
    activeProduct = null;
  }
  const [selectedTemplateId, setSelectedTemplateId] = useState("editorial-left");
  const [headline, setHeadline] = useState("Stop Scaling Invisibility");
  const [subtext, setSubtext] = useState("Why templated thought leadership is destroying your B2B pipeline (and what to do instead).");
  const [selectedImage, setSelectedImage] = useState(STOCK_IMAGES[0].url);
  const primaryColor = activeProduct?.colors?.[0] || "#7C3AED";
  const secondaryColor = activeProduct?.colors?.[1] || "#0F172A";
  const [fontFamily, setFontFamily] = useState("Inter");
  const [logoOption, setLogoOption] = useState<"white" | "none">("white");

  // Real market research state variables
  const [isScraping, setIsScraping] = useState(false);
  const [hasResearched, setHasResearched] = useState(false);
  const [trendReport, setTrendReport] = useState<VisualTrendReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);

  // BrandToPost official logo icon fallback or active product logo
  const defaultLogo = activeProduct?.logoDarkUrl || activeProduct?.logoUrl || "/icon.png";
  const logoUrl = logoOption === "white" ? defaultLogo : null;

  // Find active discovered template if selected
  const activeDiscovered = trendReport?.discoveredTemplates?.find(t => t.id === selectedTemplateId) || trendReport?.discoveredTemplates?.[0];
  const currentFamilyLabel = "RAW MARKET DISCOVERED";

  // Render PURELY from the AI-researched rawHtml template!
  // Fallback to an editorial template if rawHtml is missing/empty
  let previewHtml = "";
  if (activeDiscovered?.rawHtml && activeDiscovered.rawHtml.trim().length > 30) {
    previewHtml = renderDiscoveredHtml(activeDiscovered.rawHtml, {
      headline,
      subtext,
      imageUrl: selectedImage,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily
    });
  } else if (hasResearched) {
    console.warn(`[TEMPLATE LIBRARY CANVAS] rawHtml empty for template "${activeDiscovered?.id || 'none'}". Rendering client fallback.`);
    const logoMarkup = logoUrl
      ? `<img src="${logoUrl}" style="max-height:45px;max-width:150px;object-fit:contain;" alt="Brand Logo" />`
      : "";
    previewHtml = `<div style="width:1080px;height:1080px;display:flex;background:${secondaryColor};overflow:hidden;font-family:'${fontFamily}',system-ui,sans-serif;box-sizing:border-box;">
      <div style="width:45%;padding:60px 40px;display:flex;flex-direction:column;justify-content:space-between;border-right:2px solid ${primaryColor};box-sizing:border-box;background:${secondaryColor};position:relative;z-index:10;">
        <div style="display:flex;flex-direction:column;gap:24px;margin-top:60px;">
          <div style="width:50px;height:6px;background:${primaryColor};border-radius:3px;"></div>
          <h2 style="color:#ffffff;font-weight:800;font-size:48px;line-height:1.2;margin:0;word-break:break-word;">${headline || "Your Headline"}</h2>
          <p style="color:#cbd5e1;font-weight:400;font-size:20px;line-height:1.5;margin:0;word-break:break-word;">${subtext || ""}</p>
        </div>
        <div>${logoMarkup}</div>
      </div>
      <div style="width:55%;position:relative;overflow:hidden;height:100%;">
        <img src="${selectedImage}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>`;
  }

  // HTML Page wrapper to ensure correct font loading inside the iframe sandbox
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${TEMPLATE_CSP_META}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&family=Outfit:wght@300;400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@300;400;500;700;800&family=Clash+Display:wght@400;600;700&display=swap" rel="stylesheet">
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

  // Scraper Log Simulation loop (runs while network fetch is loading)
  useEffect(() => {
    if (!isScraping) return;

    setActiveLogs([SCRAPE_LOGS[0]]);

    const interval = setInterval(() => {
      setActiveLogs((current) => {
        if (current.length >= SCRAPE_LOGS.length) {
          clearInterval(interval);
          return current;
        }
        return [...current, SCRAPE_LOGS[current.length]];
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isScraping]);

  const startTrendResearch = async () => {
    console.log(`\n======================================================`);
    console.log(`[TEMPLATE LIBRARY STEP 1/3] startTrendResearch triggered -> PASSED`);
    setIsScraping(true);
    setError(null);
    try {
      console.log(`[TEMPLATE LIBRARY STEP 2/3] Calling researchVisualTrends()...`);
      const reportData = await researchVisualTrends();
      setTrendReport(reportData);
      setHasResearched(true);
      
      const topId = reportData.discoveredTemplates?.[0]?.id;
      const isStaticFallback = ["editorial-left", "contrarian-card", "framed-mockup", "brutalist-hero", "quote-spotlight", "stat-billboard"].includes(topId || '');
      
      console.log(`[TEMPLATE LIBRARY STEP 2/3] Market trend research -> PASSED (${reportData.discoveredTemplates?.length || 0} templates returned).`);
      console.log(`[TEMPLATE LIBRARY TYPE CHECK] Active template is: ${isStaticFallback ? '⚠️ STATIC PREBUILT FALLBACK TEMPLATE' : '✨ DYNAMIC AI-GENERATED TEMPLATE'} -> ${isStaticFallback ? 'WARNING: FALLBACK ACTIVE' : 'PASSED: DYNAMIC AI ACTIVE'}`);

      if (topId) {
        setSelectedTemplateId(topId);
        console.log(`[TEMPLATE LIBRARY STEP 3/3] Selected template ID set to: "${topId}" -> PASSED`);
      }
      console.log(`======================================================\n`);
    } catch (err: any) {
      console.error("[TEMPLATE LIBRARY STEP 2/3] Market trend research -> FAILED:", err);
      setError(err.message || "Failed to query the live Gemini research engine.");
    } finally {
      setIsScraping(false);
    }
  };

  const standardLayoutsList = Object.values(LAYOUT_BLUEPRINTS);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#08080C] flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Scraper Terminal Overlay */}
      {isScraping && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="bg-slate-950/80 px-4 py-3.5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-slate-300 font-mono">Market Research Engine (Gemini 2.5 Pro)</span>
              </div>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
            </div>
            
            {/* Log viewport */}
            <div className="p-6 font-mono text-[11px] text-slate-300 space-y-2 h-[220px] overflow-y-auto select-text select-none">
              {activeLogs.map((log, idx) => (
                <p 
                  key={idx} 
                  className={
                    log.startsWith("✓") 
                      ? "text-emerald-400 font-semibold" 
                      : log.startsWith("Sarah") 
                        ? "text-sky-300" 
                        : "text-violet-300"
                  }
                >
                  {log}
                </p>
              ))}
              <div className="text-slate-500 pt-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Synthesizing Raw Unedited HTML Layouts via Gemini 2.5 Pro...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-900/10">
        <Link
          to="/dashboard/dna"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Brand Position
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono tracking-wider">
          <span>CREATIVE ENGINE LABORATORY</span>
        </div>
      </div>

      {/* Main Workspace split panel */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Left Configurator Column */}
        <div className="w-full lg:w-[420px] shrink-0 space-y-6 text-left">
          
          {/* Title block */}
          <div>
            <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-widest font-mono">Live Playground</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display mt-0.5">
              Visual Template Library
            </h1>
            <p className="text-slate-500 text-[11px] leading-relaxed mt-1 font-light">
              Tweak messaging, test stock photography, customize color/font configurations and see changes reflect instantly.
            </p>
          </div>

          {/* Configurator Box */}
          <div className="border border-slate-900/10 bg-white rounded-2xl p-5 space-y-5 shadow-xs">
            
            {/* Copywriter Section */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Type className="w-3 h-3 text-slate-400" /> 1. Edit Live Copy
              </span>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-700 block">Visual Headline Hook</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#7C3AED] font-medium"
                  placeholder="Enter contrarian hook..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-700 block">Supporting Subtext</label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-[#7C3AED] leading-relaxed resize-none font-light"
                  placeholder="Enter supporting thesis..."
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Image Selector Section */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-slate-400" /> 2. Select Stock Backdrop
              </span>
              <div className="grid grid-cols-2 gap-2">
                {STOCK_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative rounded-xl overflow-hidden text-left border aspect-video group transition-all ${
                      selectedImage === img.url
                        ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/20"
                        : "border-slate-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 p-2 flex flex-col justify-end">
                      <span className="text-[9px] font-bold text-white tracking-wide truncate">{img.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Auto-Harmonized Brand DNA Palette Section */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" /> 3. Brand Identity & Color Harmony
              </span>
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">Auto-Harmonized Brand DNA</span>
                  <div className="flex shrink-0 gap-1.5 items-center">
                    <div className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ background: primaryColor }} title={`Primary: ${primaryColor}`} />
                    <div className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ background: secondaryColor }} title={`Secondary: ${secondaryColor}`} />
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed font-light">
                  Colors auto-sync from your Brand DNA palette to guarantee optimal contrast and eliminate dark/light mode clashing.
                </p>
              </div>

              {/* Typography selector */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold"
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Logo Visibility</label>
                  <select
                    value={logoOption}
                    onChange={(e: any) => setLogoOption(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold"
                  >
                    <option value="white">Brand Logo (On)</option>
                    <option value="none">No Logo (Off)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Preview Column */}
        <div className="flex-1 flex flex-col min-h-0 gap-6">
          
          {/* Live Preview Box */}
          <div className="border border-slate-900/10 bg-white rounded-2xl p-5 shadow-xs flex flex-col items-center">
            
            {/* Live frame title */}
            <div className="w-full flex justify-between items-center pb-3 mb-4 border-b border-slate-100 text-left">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Composition Renderer</span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5">
                  Live 1080×1080 Interactive Canvas
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                activeDiscovered ? "bg-amber-100 text-amber-800" : "bg-indigo-50 text-indigo-600"
              }`}>
                {currentFamilyLabel}
              </span>
            </div>

            {/* Scaled Frame Box */}
            <div className="relative w-[360px] h-[360px] rounded-xl border border-slate-200 shadow overflow-hidden bg-slate-950 shrink-0">
              <iframe
                title="Visual Template Preview Renderer"
                srcDoc={fullHtml}
                // allow-same-origin (so the parent can read contentDocument for
                // export) WITHOUT allow-scripts — model-generated template markup
                // must never execute against this origin.
                sandbox="allow-same-origin"
                className="absolute origin-top-left border-none pointer-events-none"
                style={{
                  width: "1080px",
                  height: "1080px",
                  transform: "scale(0.333333)"
                }}
              />
            </div>
            
            <p className="text-[9px] text-slate-400 font-mono tracking-wide mt-3.5 flex items-center gap-1 select-none">
              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Real-time sandbox updates on keystroke.
            </p>
          </div>

          {/* Scrape Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-150 rounded-xl p-3.5 flex items-start gap-2.5 text-left text-xs text-red-700 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <span className="font-bold">Scrape Error:</span> {error}
              </div>
            </div>
          )}

          {/* Dynamic AI Discovered Templates Report Panel */}
          {trendReport && (
            <div className="border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/10 rounded-2xl p-5 shadow-xs text-left animate-in fade-in slide-in-from-top-2 space-y-4">
              
              {/* Report Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900">🔥 Market Discovered Trends (Raw Market Research via Gemini 2.5 Pro)</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500" /> Unedited Raw Layout Synthesis
                </span>
              </div>

              <p className="text-slate-600 text-[11px] font-light leading-relaxed">{trendReport.summary}</p>
              
              {/* RAW DISCOVERED TEMPLATES GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {trendReport.discoveredTemplates?.map((dt) => {
                  const isSelected = selectedTemplateId === dt.id;
                  return (
                    <div 
                      key={dt.id} 
                      className={`p-3.5 rounded-xl space-y-2.5 flex flex-col justify-between transition border ${
                        isSelected 
                          ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20" 
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">{dt.name}</span>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono shrink-0">
                            {dt.viralityScore || "98/100"}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-amber-700 font-mono uppercase block mt-1">
                          Source: {dt.sourceTrend}
                        </span>
                        <p className="text-slate-500 text-[9px] leading-relaxed mt-1.5 font-light">{dt.whyViral}</p>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedTemplateId(dt.id)}
                          className={`w-full text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            isSelected 
                              ? "bg-amber-600 text-white shadow-xs" 
                              : "bg-slate-900 hover:bg-amber-600 text-white"
                          }`}
                        >
                          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>{isSelected ? "Active Layout" : "Select Discovered Layout"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Blueprint Selector Registry */}
          <div className="border border-slate-900/10 bg-white rounded-2xl p-5 shadow-xs flex-1 flex flex-col min-h-0 text-left">
            
            {/* Header + Research triggers */}
            <div className="pb-3 border-b border-slate-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Template Registry</span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5">
                  Browse Standard Library Blueprints ({standardLayoutsList.length} Styles)
                </h3>
              </div>

              {/* Research Trend Autopilot button */}
              <button
                type="button"
                onClick={startTrendResearch}
                disabled={isScraping}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition border shadow-xs ${
                  hasResearched
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50"
                    : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-[#7C3AED] active:scale-98"
                }`}
              >
                {hasResearched ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
                    <span>Re-Run Raw Market Trend Scan</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Run Visual Trend Research</span>
                  </>
                )}
              </button>
            </div>

            {/* Standard Blueprint Grid */}
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {standardLayoutsList.map((lt) => {
                  const isActive = selectedTemplateId === lt.id;
                  return (
                    <button
                      key={lt.id}
                      onClick={() => setSelectedTemplateId(lt.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[90px] relative transition-all group ${
                        isActive
                          ? "bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/15"
                          : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/20"
                      }`}
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 block truncate group-hover:text-indigo-600 transition-colors leading-tight">
                          {lt.name}
                        </span>
                        <span className="text-[8px] font-semibold text-slate-400 tracking-wider font-mono uppercase block mt-1">
                          {lt.family}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 shrink-0">
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-md ${
                          lt.isLightBg ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-200"
                        }`}>
                          {lt.isLightBg ? "Light Layout" : "Dark Layout"}
                        </span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
