import React from 'react';

export interface TypographyRules {
  heading_font_size: string;
  heading_line_height: string;
  heading_font_weight: string;
}

export interface ResearchedBlueprint {
  blueprint_id: string;
  platform: 'linkedin' | 'x' | 'instagram' | 'reddit';
  content_intent: string;
  ideal_text_length: 'short' | 'medium' | 'long';
  composition_archetype: string;
  grid_layout_axis: string;
  negative_space_description: string;
  typography_rules: TypographyRules;
  cultural_justification: string;
}

export interface RenderParams {
  blueprint: ResearchedBlueprint;
  headline: string;
  subtext: string;
  ctaText?: string;
  imageUrl?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  scale?: number;
}

export function BlueprintVisualRenderer({
  blueprint,
  headline,
  subtext,
  ctaText = 'Learn More',
  imageUrl = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80',
  logoUrl = null,
  primaryColor = '#6366f1',
  secondaryColor = '#0f172a',
  accentColor = '#10b981',
  fontFamily = 'Inter',
  scale = 1.0,
}: RenderParams) {
  const fontStyle = { fontFamily: `${fontFamily}, system-ui, -apple-system, sans-serif` };

  const baseFontSize = parseInt(blueprint.typography_rules?.heading_font_size || '36px', 10) * 1.5;
  const fontWeight = blueprint.typography_rules?.heading_font_weight || '800';
  const lineHeight = blueprint.typography_rules?.heading_line_height || '1.2';

  const isLight = secondaryColor.toLowerCase() === '#ffffff' || secondaryColor.toLowerCase() === '#faf9f6' || secondaryColor.toLowerCase() === '#f8fafc';
  const textColor = isLight ? '#0f172a' : '#ffffff';
  const mutedTextColor = isLight ? '#475569' : '#94a3b8';
  const borderColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)';

  const renderLayoutContent = () => {
    const archetype = blueprint.composition_archetype?.toLowerCase() || '';

    // 1. CANVA LINKEDIN CAROUSEL COVER
    if (archetype.includes('carousel_cover') || archetype.includes('carousel_title')) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-14 relative" style={{ background: secondaryColor, ...fontStyle }}>
          {/* Top Bar */}
          <div className="flex justify-between items-center z-10">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 max-w-[150px] object-contain" />
            ) : (
              <span className="font-extrabold text-sm uppercase tracking-widest" style={{ color: primaryColor }}>
                Brand Carousel
              </span>
            )}
            <span className="text-xs font-mono px-3 py-1 rounded bg-black/40 text-emerald-400 border border-emerald-500/30 font-bold">
              01 / 07
            </span>
          </div>

          {/* Center Title Box */}
          <div className="my-auto z-10 space-y-6 max-w-3xl">
            <div className="w-16 h-2 rounded-full" style={{ background: primaryColor }} />
            <h2
              style={{
                fontSize: `${baseFontSize * 1.15}px`,
                fontWeight,
                lineHeight,
                color: textColor,
              }}
              className="tracking-tight"
            >
              {headline}
            </h2>
            <p style={{ color: mutedTextColor }} className="text-2xl leading-relaxed max-w-xl">
              {subtext}
            </p>
          </div>

          {/* Footer Navigation Cue */}
          <div className="z-10 flex justify-between items-center pt-6 border-t" style={{ borderColor }}>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: mutedTextColor }}>
              Swipe For Full Breakdown
            </span>
            <div className="flex items-center gap-2 font-bold text-sm" style={{ color: primaryColor }}>
              <span>{ctaText}</span>
              <span className="text-lg">→</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. CANVA INSTAGRAM MICRO-COPY CARD
    if (archetype.includes('microcopy')) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-14 relative border-8" style={{ background: secondaryColor, borderColor: primaryColor, ...fontStyle }}>
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white" style={{ background: primaryColor }}>
              15-Word Key Takeaway
            </span>
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-7 max-w-[130px] object-contain" />}
          </div>

          <div className="my-auto z-10 space-y-6">
            <h2
              style={{
                fontSize: `${baseFontSize * 1.2}px`,
                fontWeight,
                lineHeight: '1.25',
                color: textColor,
              }}
              className="tracking-tight"
            >
              {headline}
            </h2>
            <div className="w-full h-0.5" style={{ background: borderColor }} />
            <p style={{ color: mutedTextColor }} className="text-xl">
              {subtext}
            </p>
          </div>

          <div className="z-10 flex justify-between items-center text-xs" style={{ color: mutedTextColor }}>
            <span>Minimalist Organic Frame</span>
            <span className="font-bold text-white px-4 py-2 rounded" style={{ background: primaryColor }}>
              {ctaText}
            </span>
          </div>
        </div>
      );
    }

    // 3. CANVA EDITORIAL HERO (FULL BLEED WITH GRADIENT)
    if (archetype.includes('editorial_hero')) {
      return (
        <div className="w-full h-full relative overflow-hidden flex flex-col justify-between p-12" style={fontStyle}>
          <img src={imageUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" />
          <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 75%, ${secondaryColor} 100%)` }} />

          <div className="z-20 flex justify-between items-center">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-9 max-w-[150px] object-contain" />
            ) : (
              <span className="text-white font-extrabold text-sm uppercase tracking-widest bg-black/50 px-3 py-1 rounded">
                Featured Cover
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded bg-white/20 backdrop-blur-md text-white font-bold">
              EDITORIAL
            </span>
          </div>

          <div className="z-20 space-y-6 max-w-3xl">
            <h2
              style={{
                fontSize: `${baseFontSize * 1.1}px`,
                fontWeight,
                lineHeight,
                color: '#ffffff',
              }}
              className="tracking-tight drop-shadow-md"
            >
              {headline}
            </h2>
            <p className="text-slate-300 text-xl leading-relaxed max-w-xl">
              {subtext}
            </p>
            <button className="px-6 py-3 rounded-lg font-bold text-sm text-white shadow-xl flex items-center gap-2" style={{ background: primaryColor }}>
              {ctaText} →
            </button>
          </div>
        </div>
      );
    }

    // 4. CANVA COMPARISON SPLIT (BEFORE VS AFTER)
    if (archetype.includes('comparison_split')) {
      return (
        <div className="w-full h-full grid grid-cols-2 gap-3 p-6" style={{ background: secondaryColor, ...fontStyle }}>
          <div className="p-8 rounded-xl flex flex-col justify-between border" style={{ background: secondaryColor, borderColor }}>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded self-start">
              The Old Way
            </span>
            <div className="space-y-4 my-auto">
              <h3 className="text-2xl font-bold text-slate-300">Manual Spreadsheets & Overlaps</h3>
              <p className="text-sm text-slate-400">15+ hours lost weekly on manual fixes.</p>
            </div>
            <span className="text-xs text-slate-500">Status Quo</span>
          </div>

          <div className="p-8 rounded-xl flex flex-col justify-between text-white shadow-xl" style={{ background: primaryColor }}>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded self-start">
              The Automated Way
            </span>
            <div className="space-y-4 my-auto">
              <h3 className="text-2xl font-black">{headline}</h3>
              <p className="text-sm text-white/90">{subtext}</p>
            </div>
            <button className="text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded self-start">
              {ctaText}
            </button>
          </div>
        </div>
      );
    }

    // 5. CANVA NATIVE TWEET / X CARD
    if (archetype.includes('tweet') || archetype.includes('tweet_card')) {
      return (
        <div className="w-full h-full flex flex-col justify-center items-center p-12" style={{ background: secondaryColor, ...fontStyle }}>
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-base">
                    <span>Brand Authority</span>
                    <span className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white">✓</span>
                  </div>
                  <span className="text-xs text-slate-400">@brand_official</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">X / Twitter</span>
            </div>

            <h2 className="text-2xl font-medium text-white leading-relaxed">
              "{headline}"
            </h2>
            <p className="text-base text-slate-400">
              {subtext}
            </p>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>9:41 AM · Verified Post</span>
              <span className="font-bold text-sky-400">{ctaText} →</span>
            </div>
          </div>
        </div>
      );
    }

    // 6. CANVA REDDIT CONVERSATIONAL CARD
    if (archetype.includes('reddit')) {
      return (
        <div className="w-full h-full flex flex-col justify-between p-12" style={{ background: '#0e1113', color: '#d7dadc', ...fontStyle }}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs">r/</div>
              <span className="font-bold text-sm text-white">r/B2BSaaS</span>
              <span className="text-xs text-slate-500">· Posted by u/Founder</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">Community Post</span>
          </div>

          <div className="my-auto space-y-6">
            <h2 className="text-3xl font-bold text-white leading-snug">
              {headline}
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed bg-[#1a1a1b] p-6 rounded-lg border border-slate-800">
              {subtext}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-800 pt-4">
            <span className="bg-slate-800 px-3 py-1.5 rounded-full text-orange-500">▲ 482 Upvotes</span>
            <span>💬 94 Comments</span>
            <span className="ml-auto text-white bg-orange-600 px-4 py-1.5 rounded">{ctaText}</span>
          </div>
        </div>
      );
    }

    // 7. DEFAULT / SPLIT PANE FALLBACK
    return (
      <div className="w-full h-full flex" style={{ background: secondaryColor, ...fontStyle }}>
        <div className="w-1/2 p-12 flex flex-col justify-between border-r" style={{ borderColor }}>
          <div className="space-y-6 my-auto">
            <div className="w-12 h-1.5 rounded-full" style={{ background: primaryColor }} />
            <h2
              style={{
                fontSize: `${baseFontSize}px`,
                fontWeight,
                lineHeight,
                color: textColor,
              }}
              className="tracking-tight"
            >
              {headline}
            </h2>
            <p style={{ color: mutedTextColor }} className="text-xl leading-relaxed">
              {subtext}
            </p>
          </div>
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
            ) : (
              <span style={{ color: primaryColor }} className="font-bold text-sm uppercase tracking-wider">
                Brand Studio
              </span>
            )}
            <span className="text-xs px-3 py-1.5 rounded font-semibold text-white" style={{ background: primaryColor }}>
              {ctaText}
            </span>
          </div>
        </div>
        <div className="w-1/2 relative overflow-hidden">
          <img src={imageUrl} alt="Creative visual" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden shadow-2xl border border-slate-800"
      style={{
        width: `${1080 * scale}px`,
        height: `${1080 * scale}px`,
      }}
    >
      <div
        className="w-[1080px] h-[1080px] origin-top-left"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {renderLayoutContent()}
      </div>
    </div>
  );
}

export default BlueprintVisualRenderer;
