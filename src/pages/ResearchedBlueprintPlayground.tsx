import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Palette, Type, Image as ImageIcon, Sparkles, Layout, Check, SlidersHorizontal, Eye, Copy, Download, RefreshCw } from 'lucide-react';
import { fetchResearchedBlueprints, ResearchedBlueprint } from '../lib/researchedBlueprints';
import { BlueprintVisualRenderer } from '../components/BlueprintVisualRenderer';

const SAMPLE_IMAGES = [
  { id: 'strategy', name: 'Strategy', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80' },
  { id: 'tech', name: 'Tech Code', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80' },
  { id: 'architecture', name: 'Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80' },
  { id: 'creative', name: 'Creative Desk', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1080&q=80' },
];

const BRAND_PALETTES = [
  { name: 'Indigo Core', primary: '#6366f1', secondary: '#0f172a', accent: '#10b981' },
  { name: 'Emerald Growth', primary: '#10b981', secondary: '#064e3b', accent: '#38bdf8' },
  { name: 'Rose Authority', primary: '#f43f5e', secondary: '#18181b', accent: '#fbbf24' },
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#08080c', accent: '#a855f7' },
  { name: 'Warm Ivory Light', primary: '#2563eb', secondary: '#faf9f6', accent: '#d97706' },
  { name: 'Clean White Light', primary: '#000000', secondary: '#ffffff', accent: '#4f46e5' },
];

const FONTS = ['Inter', 'Outfit', 'Playfair Display', 'JetBrains Mono', 'Plus Jakarta Sans'];

export function ResearchedBlueprintPlayground() {
  const [blueprints, setBlueprints] = useState<ResearchedBlueprint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlueprint, setSelectedBlueprint] = useState<ResearchedBlueprint | null>(null);

  // Dynamic Brand Replacement State
  const [headline, setHeadline] = useState<string>('The Hidden ROI of B2B Automation in 2026');
  const [subtext, setSubtext] = useState<string>('Stop wasting 15+ hours a week on repetitive manual tasks.');
  const [ctaText, setCtaText] = useState<string>('Get Free Playbook');
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_IMAGES[0].url);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState<string>('#0f172a');
  const [fontFamily, setFontFamily] = useState<string>('Inter');

  // Load Blueprints on Mount
  const loadBlueprints = async () => {
    setLoading(true);
    const data = await fetchResearchedBlueprints();
    setBlueprints(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBlueprints();
  }, []);

  // Filtered Blueprints
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((bp) => {
      const matchPlatform = platformFilter === 'all' || bp.platform?.toLowerCase() === platformFilter.toLowerCase();
      const matchSearch =
        searchQuery === '' ||
        bp.blueprint_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.content_intent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.composition_archetype?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bp.cultural_justification?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlatform && matchSearch;
    });
  }, [blueprints, platformFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#08080C] text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0F0F16]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-400" />
              100 Researched Layout Blueprints
            </h1>
            <p className="text-xs text-slate-400">Pre-built Visual Template Playground for Zero-Error Campaign Generation</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={loadBlueprints}
            className="p-2 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-medium">
            {filteredBlueprints.length} / {blueprints.length} Blueprints Active
          </span>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar Control Console (Brand DNA Swapper) */}
        <aside className="w-full lg:w-80 bg-[#0B0B12] border-r border-slate-800/80 p-5 overflow-y-auto space-y-6 flex-shrink-0">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic Content Injection
            </h3>
            
            {/* Copy Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Headline Text</label>
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={2}
                  className="w-full bg-[#040406] border border-slate-800 rounded p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Subtext / Hook</label>
                <textarea
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  rows={2}
                  className="w-full bg-[#040406] border border-slate-800 rounded p-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-[#040406] border border-slate-800 rounded p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              Brand Color Palette
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {BRAND_PALETTES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setPrimaryColor(p.primary);
                    setSecondaryColor(p.secondary);
                  }}
                  className="p-2 rounded border border-slate-800 bg-[#040406] hover:border-slate-700 text-left text-[11px] flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: p.primary }} />
                  <span className="text-slate-300 truncate">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Primary Color</label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Canvas Bg</label>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full h-8 bg-transparent cursor-pointer rounded"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              Typography & Image
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-[#040406] border border-slate-800 rounded p-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Stock Visual Asset</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setImageUrl(img.url)}
                      className={`p-1.5 rounded border text-[10px] truncate ${
                        imageUrl === img.url ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold' : 'border-slate-800 bg-[#040406] text-slate-400'
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

        {/* Right Main Grid Workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0F0F16] p-4 rounded-lg border border-slate-800">
            {/* Platform Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {['all', 'linkedin', 'x', 'instagram', 'reddit'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                    platformFilter === plat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search archetypes, intents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#040406] border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Blueprint Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center p-20 text-slate-400 text-xs font-mono gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              Loading Researched Blueprints...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBlueprints.map((bp) => (
                <div
                  key={bp.blueprint_id}
                  className="bg-[#0F0F16] border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col space-y-4 shadow-lg group"
                >
                  {/* Header Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{bp.blueprint_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 text-slate-300 border border-slate-800">
                        {bp.platform}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 italic capitalize">{bp.content_intent}</span>
                  </div>

                  {/* Canvas Render Container (Scaled to 0.31) */}
                  <div className="flex justify-center items-center bg-[#040406] p-2 rounded-lg border border-slate-900 overflow-hidden relative cursor-pointer" onClick={() => setSelectedBlueprint(bp)}>
                    <BlueprintVisualRenderer
                      blueprint={bp}
                      headline={headline}
                      subtext={subtext}
                      ctaText={ctaText}
                      imageUrl={imageUrl}
                      logoUrl={logoUrl}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      fontFamily={fontFamily}
                      scale={0.31}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Full Blueprint
                      </button>
                    </div>
                  </div>

                  {/* Cultural Justification Footer */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {bp.cultural_justification}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Inspector for Selected Blueprint */}
      {selectedBlueprint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F16] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#08080C]">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-indigo-400">{selectedBlueprint.blueprint_id}</span>
                  <span className="uppercase text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                    {selectedBlueprint.platform}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedBlueprint.cultural_justification}</p>
              </div>
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex flex-col md:flex-row gap-8 items-center justify-center bg-[#040406]">
              {/* Scaled Render Preview (0.55 scale) */}
              <div className="flex-shrink-0">
                <BlueprintVisualRenderer
                  blueprint={selectedBlueprint}
                  headline={headline}
                  subtext={subtext}
                  ctaText={ctaText}
                  imageUrl={imageUrl}
                  logoUrl={logoUrl}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  fontFamily={fontFamily}
                  scale={0.55}
                />
              </div>

              {/* Rules & Physics Details */}
              <div className="w-full space-y-4 text-xs font-mono text-slate-300">
                <div className="bg-[#0F0F16] p-4 rounded border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Composition Archetype</div>
                  <div className="text-indigo-400 font-bold text-sm">{selectedBlueprint.composition_archetype}</div>
                </div>

                <div className="bg-[#0F0F16] p-4 rounded border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Grid Layout Axis</div>
                  <div className="text-slate-200 bg-[#040406] p-2 rounded border border-slate-900 text-[11px]">
                    {selectedBlueprint.grid_layout_axis}
                  </div>
                </div>

                <div className="bg-[#0F0F16] p-4 rounded border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Negative Space Rules</div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">{selectedBlueprint.negative_space_description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearchedBlueprintPlayground;
