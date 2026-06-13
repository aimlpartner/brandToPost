import { createPortal } from 'react-dom';
import { VideoLoader } from '../components/VideoLoader';
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { WeeklyCampaign, Feedback } from "../types";
import { Target, MessageSquare, Zap, RefreshCw, Layers, Sparkles, Calendar, ArrowLeft, Loader2, Clock, Send, Eye, Copy, Download, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatCopy, copyFormattedText } from "../lib/utils";
import { logSilentError } from "../lib/firestore-error";
import { ImageLoader } from "../components/ImageLoader";
import { PostFeedback } from "../components/PostFeedback";
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
 const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 
 // Preview state
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});
  const [openDayIdx, setOpenDayIdx] = useState<number | null>(0);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [generatedVisuals, setGeneratedVisuals] = useState<Record<string, string>>({});

  const handleSetGeneratedVisual = (key: string, url: string) => {
    setGeneratedVisuals(prev => ({...prev, [key]: url}));
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

  const [previewImage, setPreviewImage] = useState<string | null>(null);
 const [previewPost, setPreviewPost] = useState<{ platform: string, copy: string, imageUrl?: string } | null>(null);

 // Feedback identity
 const [reviewerName, setReviewerName] = useState(() => localStorage.getItem('reviewerName') || '');
 const [reviewerId, setReviewerId] = useState(() => {
 let id = localStorage.getItem('reviewerId');
 if (!id) {
 id = 'rev_' + Math.random().toString(36).substr(2, 9);
 localStorage.setItem('reviewerId', id);
 }
 return id;
 });
 const [isSettingName, setIsSettingName] = useState(!localStorage.getItem('reviewerName'));
 const [tempName, setTempName] = useState('');

 // Timer state
 const [timeLeft, setTimeLeft] = useState<string>('');
 const [timerExpired, setTimerExpired] = useState(false);

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

 // Listen to feedbacks
 const feedbacksRef = collection(db, `campaigns/${campaignId}/feedbacks`);
 const q = query(feedbacksRef, orderBy('timestamp', 'asc'));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const newFeedbacks: Feedback[] = [];
 snapshot.forEach(doc => {
 newFeedbacks.push({ id: doc.id, ...doc.data() } as Feedback);
 });
 setFeedbacks(newFeedbacks);
 }, (err) => {
 logSilentError(err as Error, { context: "fetchSharedCampaignFeedbacks", campaignId });
 });
 
 return () => unsubscribe();

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

 useEffect(() => {
 if (!campaign?.sharedAt) return;
 
 const calculateTimeLeft = () => {
 let endTime: number;
 if (campaign.feedbackExpiresAt) {
 endTime = new Date(campaign.feedbackExpiresAt).getTime();
 } else {
 // Fallback for older campaigns
 const sharedTime = new Date(campaign.sharedAt!).getTime();
 endTime = sharedTime + 3 * 24 * 60 * 60 * 1000; // 3 days
 }
 
 const now = new Date().getTime();
 const difference = endTime - now;

 if (difference <= 0) {
 setTimerExpired(true);
 setTimeLeft('Feedback period ended');
 return;
 }

 const days = Math.floor(difference / (1000 * 60 * 60 * 24));
 const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
 const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
 
 setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
 };

 calculateTimeLeft();
 const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
 return () => clearInterval(timer);
 }, [campaign?.sharedAt, campaign?.feedbackExpiresAt]);

 const handleSaveName = () => {
 if (tempName.trim()) {
 setReviewerName(tempName.trim());
 localStorage.setItem('reviewerName', tempName.trim());
 setIsSettingName(false);
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-[#1C1C22]/50 flex items-center justify-center">
 <VideoLoader className="h-32 w-32 text-[#7C3AED] mx-auto" />
 </div>
 );
 }

 if (error || !campaign) {
 return (
 <div className="min-h-screen bg-[#1C1C22]/50 flex flex-col items-center justify-center p-4 text-center">
 <div className="glass-panel p-8 max-w-md w-full">
 <h2 className="text-xl font-bold text-white mb-2">Unavailable</h2>
 <p className="text-gray-300 mb-6">{error}</p>
 <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#7C3AED] hover:text-[#18F07A] transition-colors">
 <ArrowLeft className="h-4 w-4" />
 Return Home
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[#1C1C22]/50 font-sans selection:bg-[#7C3AED]/30">
 {/* Name Setting Modal */}
 {isSettingName && createPortal(
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-[#1C1C22] rounded-2xl p-6 max-w-sm w-full shadow-xl">
 <h3 className="text-lg font-bold text-white mb-2">Leave Feedback</h3>
 <p className="text-sm text-gray-400 mb-4">Please enter your name so the team knows who is leaving feedback.</p>
 <input
 type="text"
 value={tempName}
 onChange={(e) => setTempName(e.target.value)}
 placeholder="Your Name"
 className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
 autoFocus
 onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
 />
 <button
 onClick={handleSaveName}
 disabled={!tempName.trim()}
 className="w-full text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors glass-button glass-button-primary inline-flex items-center justify-center"
 >
 Continue
  </button>
 </div>
 </div>,
 document.body
 )}

 {/* Header */}
 <header className="sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
 <div className="flex items-center gap-3 group">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#FF7778] p-[1px] shadow-[0_0_15px_rgba(124,58,237,0.3)]">
 <div className="w-full h-full bg-[#1C1C22] rounded-[7px] flex items-center justify-center">
 <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="w-5 h-5 object-contain" />
 </div>
 </div>
 <div>
 <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
 BrandToPost <span className="bg-[#7C3AED]/20 text-[#b895fc] px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border border-[#7C3AED]/30">Client Portal</span>
 </h1>
 </div>
 </div>
 <div className="flex items-center gap-4">
 {timeLeft && (
 <div className={cn("text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-inner", timerExpired ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-[#1C1C22] text-[#18F07A] border border-white/10")}>
 <Clock className="h-3.5 w-3.5" />
 {timeLeft}
 </div>
 )}
 </div>
 </div>
 </header>

 <main className="pb-24">
 <div className="relative border-b border-white/5 bg-gradient-to-b from-[#1C1C22]/40 to-[#0A0A0F] pt-12 sm:pt-20 pb-12 sm:pb-24 overflow-hidden">
 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)" }}></div>
 <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
 <div className="flex justify-center mb-6">
 {campaign.productLogoUrl ? (
 <img src={campaign.productLogoUrl || undefined} alt={campaign.productName} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain shadow-xl ring-1 ring-white/10 bg-[#1C1C22]" />
 ) : (
 <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2583EB] flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-1 ring-white/10">
 {campaign.productName?.charAt(0) || 'C'}
 </div>
 )}
 </div>
 <div className="inline-flex items-center gap-2 mb-4">
 <span className="text-[#18F07A] bg-[#18F07A]/10 border border-[#18F07A]/20 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded w-fit">
 Approved for Review
 </span>
 </div>
 <h2 className="text-3xl sm:text-5xl font-bold text-white font-display tracking-tight leading-tight mb-6">
 {campaign.theme}
 </h2>
 <p className="text-base sm:text-xl text-gray-400 font-medium leading-relaxed max-w-4xl mx-auto">
 {campaign.coreMessage}
 </p>
 </div>
 </div>

  {campaign.researchSummary && (
  <div className="max-w-5xl mx-auto px-4 -mt-8 sm:-mt-12 relative z-20">
    <div 
      onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
      className="bg-[#1C1C22]/90 backdrop-blur-xl border border-[#2583EB]/30 hover:border-[#2583EB]/50 rounded-2xl p-4 sm:p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer transition-all duration-250 flex items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#2583EB]/10 text-[#2583EB] transition-transform duration-200 group-hover:scale-105">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Tror's Research Insights
          </h4>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-lg hidden sm:block">
            {campaign.researchSummary}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-bold text-[#2583EB] bg-[#2583EB]/15 px-3 py-1 rounded-full group-hover:bg-[#2583EB]/25 transition-all">
          {isOverviewExpanded ? "COLLAPSE" : "EXPAND INSIGHTS"}
        </span>
        <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:text-white", isOverviewExpanded && "rotate-180")} />
      </div>
    </div>

    {isOverviewExpanded && (
      <div className="mt-4 bg-[#1C1C22]/95 backdrop-blur-xl border border-[#2583EB]/20 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-start gap-4">
          <div className="shrink-0 hidden sm:block">
            <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror" className="w-12 h-12 rounded-full border border-[#2583EB]/50 bg-[#0A0A0F]" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-[#2583EB] mb-2 uppercase tracking-wide">Detailed Insights Briefing</h5>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
              {campaign.researchSummary}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
  )}

 <div className="max-w-7xl mx-auto px-4 mt-16 sm:mt-24">
 <div className="flex items-center gap-3 mb-10 pb-4 border-b border-white/10">
 <Layers className="h-6 w-6 text-white" />
 <h3 className="text-2xl font-bold text-white">Campaign Deliverables</h3>
 </div>

 {campaign.dailyPosts ? (
 <div className="space-y-16">
 {campaign.dailyPosts.map((dp, idx) => (
 <div key={idx} className="space-y-6">
 <div 
   className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors group"
   onClick={() => setOpenDayIdx(openDayIdx === idx ? null : idx)}
 >
 <div className="flex items-center gap-3">
 {openDayIdx === idx ? <ChevronDown className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" /> : <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />}
 <h4 className="text-2xl font-bold text-white font-display flex items-baseline gap-3">
 {dp.day}
 {dp.date && <span className="text-base text-gray-500 font-medium font-sans">({new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
 </h4>
 </div>
 <span className="inline-flex items-center rounded bg-[#7C3AED]/20 border border-[#7C3AED]/30 px-3 py-1.5 text-xs font-bold text-[#b895fc] uppercase tracking-wider w-fit">
 {dp.contentType}
 </span>
 </div>

 {openDayIdx === idx && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
 {dp.platformVersions.map((pv, pIdx) => (
 <div key={pIdx} className="bg-[#1C1C22]/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
 <div className="w-full bg-[#1C1C22] border-b border-white/10 px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="font-bold text-sm text-white uppercase tracking-wider">{pv.platform}</span>
 {pv.format && <span className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase">{pv.format}</span>}
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => handleCopyText(pv.copy, `daily-${idx}-${pIdx}`)}
 className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded block sm:block hover:bg-white/10 border border-transparent hover:border-white/10"
 title="Copy Text"
 >
 {copiedState[`daily-${idx}-${pIdx}`] ? <CheckCircle2 className="h-4 w-4 text-[#18F07A]" /> : <Copy className="h-4 w-4" />}
 </button>
 {((((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || ((dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]))) || generatedVisuals[`daily-${idx}-${pIdx}`]) && (
 <button 
 onClick={() => handleDownloadImage(generatedVisuals[`daily-${idx}-${pIdx}`] || (pv as any).imageUrl || (pv.imageId && images[pv.imageId]) || (dp as any).imageUrl || ((dp as any).imageId && images[(dp as any).imageId]) || '', `${campaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pv.platform}.png`)}
 className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded block sm:block hover:bg-white/10 border border-transparent hover:border-white/10"
 title="Download Image"
 >
 <Download className="h-4 w-4" />
 </button>
 )}
 </div>
 </div>
 
 <div className="p-6 sm:p-10 bg-black/20 flex justify-center">
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
  onImageGenerated={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}
   onUpdateVisual={(url) => handleSetGeneratedVisual(`daily-${idx}-${pIdx}`, url)}
  />
 </div>
 </div>
 
 <div className="w-full bg-[#1C1C22]/80 border-t border-white/10 p-6 sm:px-10">
 <PostFeedback
 campaignId={campaign.id}
 postId={`daily-${idx}-${pIdx}`}
 feedbacks={feedbacks}
 reviewerId={reviewerId}
 reviewerName={reviewerName}
 timerExpired={timerExpired}
 onRequireName={() => setIsSettingName(true)}
 />
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
 <div key={idx} className="bg-[#1C1C22]/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl">
 <div className="w-full bg-[#1C1C22] border-b border-white/10 px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <span className="font-bold text-sm text-white uppercase tracking-wider">{pv.platform}</span>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => handleCopyText(pv.copy, `platform-${idx}`)}
 className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded block sm:block hover:bg-white/10 border border-transparent hover:border-white/10"
 title="Copy Text"
 >
 {copiedState[`platform-${idx}`] ? <CheckCircle2 className="h-4 w-4 text-[#18F07A]" /> : <Copy className="h-4 w-4" />}
 </button>
 {(((pv as any).imageUrl || (pv.imageId && images[pv.imageId])) || generatedVisuals[`platform-${idx}`]) && (
 <button 
 onClick={() => handleDownloadImage(generatedVisuals[`platform-${idx}`] || (pv as any).imageUrl || images[pv.imageId!], `${campaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${pv.platform}.png`)}
 className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded block sm:block hover:bg-white/10 border border-transparent hover:border-white/10"
 title="Download Image"
 >
 <Download className="h-4 w-4" />
 </button>
 )}
 </div>
 </div>
 
 <div className="p-6 sm:p-10 bg-black/20 flex justify-center">
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
  onImageGenerated={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}
   onUpdateVisual={(url) => handleSetGeneratedVisual(`platform-${idx}`, url)}
  />
 </div>
 </div>
 
 <div className="w-full bg-[#1C1C22]/80 border-t border-white/10 p-6 sm:px-10">
 <PostFeedback
 campaignId={campaign.id}
 postId={`platform-${idx}`}
 feedbacks={feedbacks}
 reviewerId={reviewerId}
 reviewerName={reviewerName}
 timerExpired={timerExpired}
 onRequireName={() => setIsSettingName(true)}
 />
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
