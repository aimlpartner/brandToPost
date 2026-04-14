import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { WeeklyCampaign, Feedback } from "../types";
import { Target, MessageSquare, Zap, RefreshCw, Layers, Sparkles, Calendar, ArrowLeft, Loader2, Clock, Send } from "lucide-react";
import { cn, formatCopy } from "../lib/utils";
import { logSilentError } from "../lib/firestore-error";
import { ImageLoader } from "../components/ImageLoader";
import { PostFeedback } from "../components/PostFeedback";

export function SharedCampaign() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<WeeklyCampaign | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#ff6347] animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-[#111827] mb-2">Unavailable</h2>
          <p className="text-[#6b7280] mb-6">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#ff6347] hover:text-[#ffe066] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#ff6347]/30">
      {/* Name Setting Modal */}
      {isSettingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leave Feedback</h3>
            <p className="text-sm text-gray-500 mb-4">Please enter your name so the team knows who is leaving feedback.</p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Your Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#ff6347]"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button
              onClick={handleSaveName}
              disabled={!tempName.trim()}
              className="w-full bg-[#ff6347] text-white rounded-lg py-2 font-medium disabled:opacity-50 hover:bg-[#ff4f30] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {campaign.productLogoUrl ? (
              <img src={campaign.productLogoUrl} alt={campaign.productName} className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {campaign.productName?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-[#111827]">{campaign.productName || 'Campaign'}</h1>
              <p className="text-xs text-[#6b7280]">Shared Campaign View</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft && (
              <div className={cn("text-xs font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full", timerExpired ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}
              </div>
            )}
            <div className="text-xs font-medium text-[#ff8566] flex items-center gap-1.5 hidden sm:flex">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(campaign.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-12">
        <div className="glass-panel p-3 sm:p-16">
          <div className="space-y-6 sm:space-y-12">
            <div className="border-b border-white/20 pb-4 sm:pb-10 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mb-4 sm:mb-8">
                <div className="flex items-center justify-start gap-3 sm:gap-4">
                  {campaign.productLogoUrl ? (
                    <img src={campaign.productLogoUrl} alt={campaign.productName} className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl object-contain shadow-sm ring-1 ring-black/5" />
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-sm ring-1 ring-black/5">
                      {campaign.productName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="text-left">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">{campaign.productName || 'Product Campaign'}</h1>
                    <p className="text-xs sm:text-sm font-medium text-[#6b7280]">Social Media Strategy</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                  <span className="inline-flex items-center rounded-lg bg-white/50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#111827] ring-1 ring-inset ring-white/50 backdrop-blur-md">
                    {campaign.pillar}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-white/40 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#374151] ring-1 ring-inset ring-white/50 backdrop-blur-md">
                    {campaign.contentFormat}
                  </span>
                </div>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#111827] font-display tracking-tight leading-tight">{campaign.theme}</h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl lg:text-2xl text-[#6b7280] font-medium leading-relaxed max-w-4xl">{campaign.coreMessage}</p>
            </div>

            {campaign.researchSummary && (
              <div className="glass-card bg-blue-50/30 border-blue-200/50 p-4 sm:p-10">
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 sm:mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Live Research Insights
                </h4>
                <p className="text-sm sm:text-lg text-blue-800 leading-relaxed whitespace-pre-wrap">
                  {campaign.researchSummary}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6 sm:gap-16">
              <div className="space-y-5 sm:space-y-10">
                <div className="flex gap-4 sm:gap-5">
                  <Target className="h-6 w-6 sm:h-7 sm:w-7 text-[#ff6347] shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-[#111827]">Target Audience</h4>
                    <p className="text-base sm:text-lg text-[#6b7280] mt-1 sm:mt-2 leading-relaxed">{campaign.targetAudience}</p>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-5">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500 shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-[#111827]">Hook</h4>
                    <p className="text-base sm:text-lg text-[#6b7280] mt-1 sm:mt-2 italic leading-relaxed">"{campaign.hook}"</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6 sm:space-y-10">
                <div className="flex gap-4 sm:gap-5">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-violet-500 shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-[#111827]">Call to Action</h4>
                    <p className="text-base sm:text-lg text-[#6b7280] mt-1 sm:mt-2 leading-relaxed">{campaign.cta}</p>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-5">
                  <RefreshCw className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 shrink-0 mt-0.5 sm:mt-1" />
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-[#111827]">Repurposing Notes</h4>
                    <p className="text-base sm:text-lg text-[#6b7280] mt-1 sm:mt-2 leading-relaxed">{campaign.repurposingNotes}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 sm:pt-12 border-t border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-10">
                <Layers className="h-5 w-5 sm:h-7 sm:w-7 text-[#4b5563]" />
                <h3 className="text-xl sm:text-3xl font-semibold text-[#111827]">Platform Execution</h3>
              </div>
              
              {campaign.dailyPosts ? (
                <div className="space-y-4 sm:space-y-10">
                  {campaign.dailyPosts.map((dp, idx) => (
                    <div key={idx} className="glass-card p-4 sm:p-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-8">
                        <h4 className="text-xl sm:text-2xl font-bold text-[#111827]">
                          {dp.day}
                          {dp.date && <span className="text-base text-[#6b7280] font-normal ml-2">({new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
                        </h4>
                        <span className="inline-flex items-center rounded-full bg-[#ff6347]/20 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#111827] w-fit">
                          {dp.contentType}
                        </span>
                      </div>
                      
                      {dp.imageId && images[dp.imageId] && (
                        <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-sm">
                          <ImageLoader src={images[dp.imageId]} alt="Generated content" className="w-full h-auto object-cover max-h-[250px] sm:max-h-[500px]" containerClassName="w-full min-h-[120px] sm:min-h-[200px]" />
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-8">
                        {dp.platformVersions.map((pv, pIdx) => (
                          <div key={pIdx} className="bg-white/40 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/40">
                            <span className="font-semibold text-sm sm:text-base text-[#111827] mb-2 sm:mb-4 block">{pv.platform}</span>
                            <p className="text-sm sm:text-base text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
                            {pv.imageId && images[pv.imageId] && (
                              <div className="mt-3 sm:mt-6 rounded-lg sm:rounded-xl overflow-hidden border border-white/20">
                                <ImageLoader src={images[pv.imageId]} alt="Platform specific content" className="w-full h-auto object-cover max-h-[150px] sm:max-h-[300px]" containerClassName="w-full min-h-[80px] sm:min-h-[150px]" />
                              </div>
                            )}
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
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-8">
                  {campaign.platformVersions?.map((pv, idx) => (
                    <div key={idx} className="glass-card p-4 sm:p-8">
                      <span className="font-semibold text-base sm:text-lg text-[#111827] mb-2 sm:mb-5 block">{pv.platform}</span>
                      <p className="text-sm sm:text-lg text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
