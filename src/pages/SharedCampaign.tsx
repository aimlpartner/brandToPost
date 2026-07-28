import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { WeeklyCampaign } from "../types";
import { Layers, Sparkles, ArrowLeft, Copy, Download, CheckCircle2, ChevronDown, ChevronRight, Mail } from "lucide-react";
import { cn, copyFormattedText } from "../lib/utils";
import { logSilentError } from "../lib/firestore-error";
import { ImageLightbox } from "../components/ImageLightbox";
import { PostPreviewModal } from "../components/PostPreviewModal";

const getVisualDataWithImages = (vd: any, campaignImages: Record<string, string>) => {
  if (!vd) return vd;
  const newVd = { ...vd };
  if (newVd.baseImageId && campaignImages[newVd.baseImageId]) {
    newVd.baseImage = campaignImages[newVd.baseImageId];
  }
  return newVd;
};

export function SharedCampaign() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<WeeklyCampaign | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive State
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [openDayIdx, setOpenDayIdx] = useState<number | null>(0);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [generatedVisuals, setGeneratedVisuals] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleSetGeneratedVisual = (key: string, url: string) => {
    setGeneratedVisuals(prev => ({ ...prev, [key]: url }));
  };

  const handleCopyText = async (text: string, key: string) => {
    await copyFormattedText(text);
    setCopiedState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const handleExportPdf = async () => {
    if (!campaign) return;
    setIsExportingPdf(true);
    try {
      const { generateCampaignPDF } = await import("../lib/pdfGenerator");
      const pdf = await generateCampaignPDF(campaign, { name: campaign.productName || "Product", logoUrl: campaign.productLogoUrl } as any, images);
      pdf.save(`${(campaign.theme || "campaign").replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
    } catch (err) {
      logSilentError(err as Error, { context: "handleExportPdf", campaignId: campaign.id });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareEmail = async () => {
    if (!campaign) return;
    await handleExportPdf();
    const subject = encodeURIComponent(`Campaign Overview: ${campaign.theme || 'BrandToPost Campaign'}`);
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share this marketing campaign for ${campaign.productName || 'our brand'}:\n\n` +
      `📌 Theme: ${campaign.theme || 'N/A'}\n` +
      `🎯 Core Message: ${campaign.coreMessage || 'N/A'}\n` +
      `🔗 View Online: ${window.location.href}\n\n` +
      `📎 Note: The PDF report has been generated and saved to your Downloads folder so you can easily attach it to this email!\n\n` +
      `Best regards,`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
    const win = window.open(gmailUrl, "_blank");
    if (!win) {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;
      
      try {
        const docRef = doc(db, "campaigns", campaignId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as WeeklyCampaign;
          if (data.isShared) {
            setCampaign(data);
            
            // Fetch images
            try {
              const imagesRef = collection(db, `campaigns/${campaignId}/images`);
              const imagesSnap = await getDocs(imagesRef);
              const newImages: Record<string, string> = {};
              const chunks: Record<string, { index: number, data: string, total: number }[]> = {};

              imagesSnap.forEach(imgDoc => {
                const data = imgDoc.data();
                if (data.totalChunks) {
                  if (!chunks[data.id]) chunks[data.id] = [];
                  chunks[data.id].push({ index: data.chunkIndex, data: data.data, total: data.totalChunks });
                } else {
                  newImages[imgDoc.id] = data.data;
                }
              });

              for (const [id, imageChunks] of Object.entries(chunks)) {
                imageChunks.sort((a, b) => a.index - b.index);
                newImages[id] = imageChunks.map(c => c.data).join('');
              }

              setImages(newImages);
            } catch (imgErr) {
              logSilentError(imgErr as Error, { context: "fetchSharedCampaignImages", campaignId });
            }
          } else {
            setError("This campaign is not available for public viewing.");
          }
        } else {
          setError("Campaign not found.");
        }
      } catch (err) {
        logSilentError(err as Error, { context: "fetchSharedCampaign", campaignId });
        setError("Failed to load campaign. It may have been deleted or made private.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading Campaign Deliverables...</span>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white border border-slate-200 p-8 max-w-md w-full rounded-2xl shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 text-xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Campaign Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-[#7C3AED]/20">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED] p-[1px] shadow-sm">
              <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
                <img src="/B2PLOGO.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                BrandToPost <span className="bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border border-[#7C3AED]/20">Shared Campaign</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              title="Copy Public Link"
            >
              {isCopiedLink ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{isCopiedLink ? "Copied" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email & PDF</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isExportingPdf ? "Generating..." : "Download PDF"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <main className="pb-24">
        <div className="relative border-b border-slate-200/70 bg-white pt-10 sm:pt-16 pb-12 sm:pb-16 shadow-xs">
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            
            <div className="flex justify-center mb-5">
              {campaign.productLogoUrl ? (
                <img src={campaign.productLogoUrl} alt={campaign.productName} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain shadow-md ring-1 ring-slate-200 bg-white p-1" />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white font-bold text-2xl shadow-md ring-1 ring-slate-200">
                  {campaign.productName?.charAt(0) || 'C'}
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Approved for Publishing
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold font-display text-slate-900 tracking-tight leading-tight mb-4">
              {campaign.theme}
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
              {campaign.coreMessage}
            </p>
          </div>
        </div>

        {/* Research Insights Accordion */}
        {campaign.researchSummary && (
          <div className="max-w-5xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-20">
            <div 
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="bg-white border border-slate-200/90 shadow-md hover:border-[#7C3AED]/40 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] transition-transform duration-200 group-hover:scale-105">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide">
                    Research Briefing & Audience Insights
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-lg hidden sm:block">
                    {campaign.researchSummary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-3 py-1 rounded-full group-hover:bg-[#7C3AED]/15 transition-all">
                  {isOverviewExpanded ? "COLLAPSE" : "EXPAND INSIGHTS"}
                </span>
                <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:text-slate-700", isOverviewExpanded && "rotate-180")} />
              </div>
            </div>

            {isOverviewExpanded && (
              <div className="mt-3 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 hidden sm:block">
                    <img src="/B2P AVATAR.png" alt="Tror" className="w-12 h-12 rounded-full border border-slate-200 bg-slate-100" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#7C3AED] mb-2 uppercase tracking-wider">Detailed Research Findings</h5>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
                      {campaign.researchSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deliverables Section */}
        <div className="max-w-7xl mx-auto px-4 mt-10 sm:mt-14">
          <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-200/80">
            <Layers className="h-5 w-5 text-[#7C3AED]" />
            <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Campaign Deliverables</h3>
          </div>

          {campaign.dailyPosts ? (
            <div className="space-y-10">
              {campaign.dailyPosts.map((dp, idx) => (
                <div key={idx} className="space-y-5">
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white p-3 -ml-3 rounded-2xl border border-transparent hover:border-slate-200 transition-all group"
                    onClick={() => setOpenDayIdx(openDayIdx === idx ? null : idx)}
                  >
                    <div className="flex items-center gap-3">
                      {openDayIdx === idx ? <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-slate-800 transition-colors" /> : <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-800 transition-colors" />}
                      <h4 className="text-xl sm:text-2xl font-bold text-slate-900 font-display flex items-baseline gap-3">
                        {dp.day}
                        {dp.date && <span className="text-sm text-slate-500 font-normal font-sans">({new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
                      </h4>
                    </div>
                    <span className="inline-flex items-center rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-1 text-xs font-bold text-[#7C3AED] uppercase tracking-wider w-fit">
                      {dp.contentType}
                    </span>
                  </div>

                  {openDayIdx === idx && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-1">
                      {dp.platformVersions.map((pv, pIdx) => (
                        <div key={pIdx} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                          <div className="w-full bg-slate-50/80 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-slate-900 uppercase tracking-wider">{pv.platform}</span>
                              {pv.format && <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase">{pv.format}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleCopyText(pv.copy, `daily-${idx}-${pIdx}`)}
                                className="text-slate-600 hover:text-slate-900 transition-colors p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                                title="Copy Post Copy"
                              >
                                {copiedState[`daily-${idx}-${pIdx}`] ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                <span className="hidden sm:inline">{copiedState[`daily-${idx}-${pIdx}`] ? "Copied" : "Copy"}</span>
                              </button>

                              {((((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || ((dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]))) || generatedVisuals[`daily-${idx}-${pIdx}`]) && (
                                <button 
                                  onClick={() => handleDownloadImage(generatedVisuals[`daily-${idx}-${pIdx}`] || (pv as any).imageUrl || (pv.imageId && images[pv.imageId]) || (dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]) || '', `${campaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pv.platform}.png`)}
                                  className="text-slate-600 hover:text-slate-900 transition-colors p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                                  title="Download Image"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-6 sm:p-8 bg-slate-50/40 flex justify-center">
                            <div className="w-full max-w-2xl">
                              <PostPreviewModal 
                                inline 
                                platform={pv.platform} 
                                copy={pv.copy} 
                                imageUrl={generatedVisuals[`daily-${idx}-${pIdx}`] || (pv as any).imageUrl || (pv.imageId && images[pv.imageId]) || (dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]) || undefined}
                                visualType={(pv as any).visualType || dp.visualType} 
                                visualData={getVisualDataWithImages((pv as any).visualData || dp.visualData, images)} 
                                dna={campaign as any} 
                                productName={campaign.productName || ''} 
                                productLogo={campaign.productLogoUrl || ''}
                                isFlattened={(pv as any).isFlattened || (dp as any).isFlattened}
                                onImageGenerated={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}
                                onUpdateVisual={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {campaign.platformVersions?.map((pv, idx) => (
                <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full bg-slate-50/80 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900 uppercase tracking-wider">{pv.platform}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyText(pv.copy, `platform-${idx}`)}
                        className="text-slate-600 hover:text-slate-900 transition-colors p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                        title="Copy Post Copy"
                      >
                        {copiedState[`platform-${idx}`] ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        <span className="hidden sm:inline">{copiedState[`platform-${idx}`] ? "Copied" : "Copy"}</span>
                      </button>

                      {(((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || generatedVisuals[`platform-${idx}`]) && (
                        <button 
                          onClick={() => handleDownloadImage(generatedVisuals[`platform-${idx}`] || (pv as any).imageUrl || images[pv.imageId!], `${campaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pv.platform}.png`)}
                          className="text-slate-600 hover:text-slate-900 transition-colors p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-xs"
                          title="Download Image"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 bg-slate-50/40 flex justify-center">
                    <div className="w-full max-w-2xl">
                      <PostPreviewModal 
                        inline 
                        platform={pv.platform} 
                        copy={pv.copy} 
                        imageUrl={generatedVisuals[`platform-${idx}`] || (pv as any).imageUrl || (pv.imageId ? images[pv.imageId] : undefined)}
                        visualType={(pv as any).visualType} 
                        visualData={getVisualDataWithImages((pv as any).visualData, images)} 
                        dna={campaign as any} 
                        productName={campaign.productName || ''} 
                        productLogo={campaign.productLogoUrl || ''}
                        isFlattened={(pv as any).isFlattened}
                        onImageGenerated={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}
                        onUpdateVisual={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {previewImage && (
        <ImageLightbox src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
}
