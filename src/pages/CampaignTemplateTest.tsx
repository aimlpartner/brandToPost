import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Layers,
  Megaphone,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  Download,
  Share2,
  Copy,
  Trash2,
  Clock,
  Tag,
  Search,
  Eye,
  ChevronRight,
  Globe,
  Bot,
  RotateCcw,
  Palette,
  Type,
  Image as ImageIcon
} from "lucide-react";
import {
  FaLinkedin,
  FaXTwitter,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaReddit,
  FaYoutube,
} from "react-icons/fa6";
import { cn } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import {
  MasterTemplate,
  pickUnusedMasterTemplates,
  hydrateTemplateHtml,
  getUsedTemplateIds,
  resetTemplateRotation,
} from "../lib/campaignTemplateHydrator";

interface PlatformPostVersion {
  platform: string;
  copy: string;
  headline?: string;
  subtext?: string;
  imageUrl?: string;
}

interface CampaignDay {
  dayIndex: number;
  dayName: string;
  headline: string;
  subtext: string;
  assignedTemplate: MasterTemplate;
  imageUrl: string;
  posts: PlatformPostVersion[];
}

interface TestWeeklyCampaign {
  id: string;
  title: string;
  theme: string;
  targetAudience: string;
  industry: string;
  createdAt: string;
  days: CampaignDay[];
}

const SAMPLE_LOGOS = [
  { id: 'logo-b2p', name: 'BrandToPost', url: '/whatsapp_images/BrandToPost.png' },
  { id: 'logo-b2p-badge', name: 'B2P Badge', url: '/whatsapp_images/b2p_badge.png' },
  { id: 'logo-growth', name: 'Growth Core', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' }
];

const SAMPLE_IMAGES = [
  { id: 'img-tech', name: 'Tech Dashboard', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80' },
  { id: 'img-exec', name: 'Executive Portrait', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80' },
  { id: 'img-team', name: 'Product Team', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80' },
  { id: 'img-abstract', name: 'Abstract Cyber', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' }
];

const FONTS = [
  'Inter Tight, sans-serif',
  'Plus Jakarta Sans, sans-serif',
  'Outfit, sans-serif',
  'Playfair Display, serif',
  'Space Grotesk, sans-serif'
];

const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CampaignTemplateTest() {
  const navigate = useNavigate();
  let activeProduct: any = null;
  try {
    const productCtx = useProducts();
    activeProduct = productCtx?.activeProduct;
  } catch (e) {
    // Fallback if accessed outside ProductProvider
  }
  const { user } = useAuth();

  const [masterPool, setMasterPool] = useState<MasterTemplate[]>([]);
  const [campaignsList, setCampaignsList] = useState<TestWeeklyCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<TestWeeklyCampaign | null>(null);

  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [activePlatform, setActivePlatform] = useState<string>('linkedin');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal & Generation State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Focus Inputs
  const [targetAudience, setTargetAudience] = useState<string>('B2B SaaS Founders & Product Leaders');
  const [industry, setIndustry] = useState<string>('Software & AI Automation');
  const [theme, setTheme] = useState<string>('Scaling Organic Distribution & Dynamic Branding');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['linkedin', 'instagram', 'x']);

  // Brand DNA Overrides
  const [primaryColor, setPrimaryColor] = useState<string>(activeProduct?.primaryColor || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState<string>(activeProduct?.secondaryColor || '#FAF9F6');
  const [accentColor, setAccentColor] = useState<string>(activeProduct?.accentColor || '#10B981');
  const [fontFamily, setFontFamily] = useState<string>(activeProduct?.fontFamily || 'Inter Tight, sans-serif');
  const [logoUrl, setLogoUrl] = useState<string>(activeProduct?.logoUrl || '/whatsapp_images/BrandToPost.png');
  const [globalImageUrl, setGlobalImageUrl] = useState<string>(SAMPLE_IMAGES[0].url);

  const [usedCount, setUsedCount] = useState<number>(0);

  // Sync Brand DNA when activeProduct changes
  useEffect(() => {
    if (activeProduct) {
      if (activeProduct.primaryColor) setPrimaryColor(activeProduct.primaryColor);
      if (activeProduct.secondaryColor) setSecondaryColor(activeProduct.secondaryColor);
      if (activeProduct.accentColor) setAccentColor(activeProduct.accentColor);
      if (activeProduct.fontFamily) setFontFamily(activeProduct.fontFamily);
      if (activeProduct.logoUrl) setLogoUrl(activeProduct.logoUrl);
    }
  }, [activeProduct]);

  // Load Master Pool
  useEffect(() => {
    fetchMasterPool();
  }, []);

  const fetchMasterPool = async () => {
    try {
      const res = await fetch('/api/research-channel-templates?channel=master');
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setMasterPool(data.templates);
        // Create initial default campaign if empty
        if (campaignsList.length === 0) {
          createInitialCampaign(data.templates);
        }
      }
      setUsedCount(getUsedTemplateIds().length);
    } catch (e) {
      console.error('Failed to load master pool:', e);
    }
  };

  const createInitialCampaign = (pool: MasterTemplate[]) => {
    const picked = pickUnusedMasterTemplates(pool, 7);
    const initialDays: CampaignDay[] = DAYS_LIST.map((dayName, idx) => {
      const template = picked[idx] || pool[idx % pool.length];
      const headline = `Scaling Organic Distribution — ${dayName}`;
      const subtext = `Automated multi-channel campaign visual execution for ${activeProduct?.name || 'BrandToPost'}.`;

      return {
        dayIndex: idx,
        dayName: `Day ${idx + 1} - ${dayName}`,
        headline,
        subtext,
        assignedTemplate: template,
        imageUrl: globalImageUrl,
        posts: [
          {
            platform: 'linkedin',
            copy: `🚀 ${headline}\n\n${subtext}\n\nKey takeaways for B2B leaders:\n1. Zero manual design friction\n2. Deterministic 1-template-per-day branding\n3. Instant multi-channel sync\n\n#B2BSaaS #Growth #Automation`,
            headline,
            subtext
          },
          {
            platform: 'instagram',
            copy: `✨ ${headline}\n\n${subtext}\n\nSwipe through to inspect today's visual teardown! 🔥\n\n#BrandToPost #VisualDesign #SaaS`,
            headline,
            subtext
          },
          {
            platform: 'x',
            copy: `🔥 ${headline}\n\n${subtext}\n\nThread below 🧵👇`,
            headline,
            subtext
          }
        ]
      };
    });

    const newCamp: TestWeeklyCampaign = {
      id: `campaign-${Date.now()}`,
      title: `${theme} Campaign`,
      theme,
      targetAudience,
      industry,
      createdAt: new Date().toLocaleDateString(),
      days: initialDays
    };

    setCampaignsList([newCamp]);
    setSelectedCampaign(newCamp);
    setUsedCount(getUsedTemplateIds().length);
  };

  const handleGenerateCampaignSubmit = () => {
    if (masterPool.length === 0) return;
    setIsGenerating(true);

    setTimeout(() => {
      // Pick 7 unused master templates from pool
      const picked = pickUnusedMasterTemplates(masterPool, 7);

      const headlines = [
        'Scaling Enterprise Workflows with AI Automation',
        'Why 84% of B2B SaaS Founders Fail at Organic Distribution',
        'The 3-Step Framework for High-Converting Visual Assets',
        'Data-Driven Distribution: 5 Metrics Every VP Should Track',
        'How We Reduced Campaign Production Time from 6 Hours to 3 Minutes',
        'Stop Creating AI Slop: Build Sustainable Brand Loyalty',
        'The Future of Multi-Channel Visual Storytelling in 2026'
      ];

      const subtexts = [
        'Eliminate manual friction and publish deterministic brand graphics across all channels automatically.',
        'Tactical breakdown on positioning, messaging hierarchy, and consistent visual branding.',
        'Discover how dynamic 8-token placeholder substitution elevates campaign aesthetics.',
        'Key operational indicators that separate high-growth SaaS companies from stagnant brands.',
        'Case study breakdown of our automated template replacement engine in production.',
        'High-contrast typography, premium off-white canvases, and structured grid design.',
        'Unified 1-template-per-day strategy across LinkedIn, Instagram, and X.'
      ];

      const newDays: CampaignDay[] = DAYS_LIST.map((dayName, idx) => {
        const template = picked[idx] || masterPool[idx % masterPool.length];
        const hl = headlines[idx];
        const st = subtexts[idx];

        return {
          dayIndex: idx,
          dayName: `Day ${idx + 1} - ${dayName}`,
          headline: hl,
          subtext: st,
          assignedTemplate: template,
          imageUrl: globalImageUrl,
          posts: selectedChannels.map((ch) => ({
            platform: ch,
            copy:
              ch === 'linkedin'
                ? `🚀 ${hl}\n\n${st}\n\nKey takeaways for B2B leaders:\n1. Deterministic template substitution\n2. Zero repetition across campaign cycles\n3. Instant multi-platform sync\n\n#B2BSaaS #BrandAutomation #VisualMarketing #Growth`
                : ch === 'instagram'
                ? `✨ ${hl}\n\n${st}\n\nSwipe through today's visual teardown to see how brand DNA tokens drive multi-channel consistency! 🔥\n\n#BrandToPost #DesignSystem #SocialStrategy`
                : `🔥 ${hl}\n\n${st}\n\nThread below breakdown 🧵👇`,
            headline: hl,
            subtext: st
          }))
        };
      });

      const campaign: TestWeeklyCampaign = {
        id: `campaign-${Date.now()}`,
        title: `${theme} Campaign`,
        theme,
        targetAudience,
        industry,
        createdAt: new Date().toLocaleDateString(),
        days: newDays
      };

      setCampaignsList((prev) => [campaign, ...prev]);
      setSelectedCampaign(campaign);
      setActiveDayIdx(0);
      setUsedCount(getUsedTemplateIds().length);

      // DIRECT PRESENTATION: Close modal immediately without any manual approval gates!
      setIsGenerating(false);
      setShowModal(false);
    }, 1000);
  };

  const handleResetRotation = () => {
    resetTemplateRotation();
    setUsedCount(0);
  };

  const currentDay = selectedCampaign?.days[activeDayIdx];

  const currentPost = currentDay?.posts.find((p) => p.platform === activePlatform) || currentDay?.posts[0];

  const renderedHtml = currentDay
    ? hydrateTemplateHtml(currentDay.assignedTemplate.rawHtml, {
        headline: currentDay.headline,
        subtext: currentDay.subtext,
        imageUrl: globalImageUrl,
        logoUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition"
          >
            <Megaphone className="w-5 h-5 text-sky-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Weekly Campaigns — V3 Visual Replacement Engine
            </h1>
            <p className="text-xs text-slate-500">
              1 Master Template Per Day • Deterministic 8-Token Replacement • Autopilot Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Used Rotation: <strong className="text-slate-900">{usedCount} / {masterPool.length || 60}</strong></span>
            {usedCount > 0 && (
              <button
                onClick={handleResetRotation}
                title="Reset Rotation History"
                className="p-1 hover:bg-slate-200 text-slate-500 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create New Campaign
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Saved Campaigns & Brand DNA Swapper */}
        <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-6 flex-shrink-0 shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-3">
              <span>Saved Campaigns</span>
              <span className="text-[10px] text-sky-600 font-mono">{campaignsList.length} total</span>
            </h3>

            <div className="space-y-2">
              {campaignsList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCampaign(c);
                    setActiveDayIdx(0);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    selectedCampaign?.id === c.id
                      ? 'border-sky-500 bg-sky-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900 truncate">{c.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{c.industry} • {c.createdAt}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              Active Brand DNA
            </h3>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
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
                <label className="text-[10px] text-slate-500 block mb-1">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] text-slate-800 focus:outline-none"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>{f.split(',')[0]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              Brand Logo & Stock Image
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Brand Logo Asset</label>
                <div className="grid grid-cols-3 gap-1">
                  {SAMPLE_LOGOS.map((lg) => (
                    <button
                      key={lg.id}
                      onClick={() => setLogoUrl(lg.url)}
                      className={`p-1 rounded border text-[9px] truncate transition ${
                        logoUrl === lg.url
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lg.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Stock Photo Asset</label>
                <div className="grid grid-cols-2 gap-1">
                  {SAMPLE_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setGlobalImageUrl(img.url)}
                      className={`p-1 rounded border text-[9px] truncate transition ${
                        globalImageUrl === img.url
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
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

        {/* Right Main Dashboard Workspace */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Overview Header Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedCampaign.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Audience: <strong>{selectedCampaign.targetAudience}</strong> • Industry: <strong>{selectedCampaign.industry}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direct Published (V3 Hydrated)
                  </span>
                </div>
              </div>

              {/* Day Tab Selector (Day 1 through Day 7) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {selectedCampaign.days.map((day, idx) => (
                  <button
                    key={day.dayIndex}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                      activeDayIdx === idx
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.dayName}</span>
                    <span className="text-[10px] opacity-80">({day.assignedTemplate.id})</span>
                  </button>
                ))}
              </div>

              {/* Day Details Workspace */}
              {currentDay && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Hydrated Visual Card Iframe (6 cols) */}
                  <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-sky-600" />
                          Day's Visual Graphic (1080x1080)
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Template: <strong>{currentDay.assignedTemplate.name}</strong> ({currentDay.assignedTemplate.id})
                        </span>
                      </div>
                      <select
                        value={currentDay.assignedTemplate.id}
                        onChange={(e) => {
                          const found = masterPool.find((m) => m.id === e.target.value);
                          if (found && selectedCampaign) {
                            const updatedDays = selectedCampaign.days.map((d) =>
                              d.dayIndex === currentDay.dayIndex ? { ...d, assignedTemplate: found } : d
                            );
                            setSelectedCampaign({ ...selectedCampaign, days: updatedDays });
                          }
                        }}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-800 font-mono focus:outline-none"
                      >
                        {masterPool.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.id}: {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rendered Visual Graphic Iframe (450px x 450px) */}
                    <div className="w-full flex justify-center items-center py-2">
                      <div className="w-[453.6px] h-[453.6px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shadow-sm">
                        <iframe
                          title={currentDay.assignedTemplate.name}
                          srcDoc={renderedHtml}
                          className="w-[1080px] h-[1080px] origin-top-left pointer-events-none border-none absolute top-0 left-0"
                          style={{ transform: 'scale(0.42)' }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Archetype: {currentDay.assignedTemplate.archetype}
                      </div>
                      <p>{currentDay.assignedTemplate.whyViral}</p>
                    </div>
                  </div>

                  {/* Right Column: Platform Copy Tabs & Inspector (6 cols) */}
                  <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Social Platform Copy
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {currentDay.posts.map((p) => (
                          <button
                            key={p.platform}
                            onClick={() => setActivePlatform(p.platform)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                              activePlatform === p.platform
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p.platform === 'linkedin' && <FaLinkedin className="w-3.5 h-3.5" />}
                            {p.platform === 'instagram' && <FaInstagram className="w-3.5 h-3.5 text-pink-500" />}
                            {p.platform === 'x' && <FaXTwitter className="w-3.5 h-3.5" />}
                            <span className="capitalize">{p.platform}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {currentPost && (
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            {currentPost.platform.toUpperCase()} Copy
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentPost.copy);
                              setCopiedId(currentPost.platform);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-sans"
                          >
                            {copiedId === currentPost.platform ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedId === currentPost.platform ? 'Copied!' : 'Copy Copy'}
                          </button>
                        </div>

                        <pre className="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap word-break">
                          {currentPost.copy}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Campaign Creation Modal (DIRECT PRESENTATION: No Approval Step!) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create 7-Day Campaign (V3 Template Engine)</h3>
                <p className="text-xs text-slate-500">Pick 7 unused master templates & hydrate automatically</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded bg-slate-200 text-slate-700 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Industry / Niche</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Campaign Focus / Theme</label>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Social Channels</label>
                <div className="flex items-center gap-3">
                  {['linkedin', 'instagram', 'x'].map((ch) => (
                    <label key={ch} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedChannels([...selectedChannels, ch]);
                          else setSelectedChannels(selectedChannels.filter((c) => c !== ch));
                        }}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="capitalize">{ch}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCampaignSubmit}
                disabled={isGenerating || selectedChannels.length === 0}
                className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-5 py-2 text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Synthesizing & Hydrating V3 Templates...' : 'Generate 7-Day Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
