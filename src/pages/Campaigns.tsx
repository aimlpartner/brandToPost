import { useState, useEffect } from "react";
import { WeeklyCampaign, ProductDNA, PlatformPost, Feedback } from "../types";
import { generateCampaign, researchFocus, regeneratePostWithFeedback } from "../services/geminiService";
import { Loader2, Plus, Calendar, Target, MessageSquare, Zap, RefreshCw, Layers, Megaphone, Send, CheckCircle2, Sparkles, CalendarClock, Image as ImageIcon, X, ArrowRight, Download, Share2, Copy, Mail, Trash2, Clock, Tag, Search, ArrowDownAZ, ArrowUpAZ, Filter } from "lucide-react";
import { cn, formatCopy } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, setDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";
import { ImageLoader } from "../components/ImageLoader";

export function Campaigns() {
  const { activeProduct } = useProducts();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<WeeklyCampaign[]>([]);
  const [campaignImages, setCampaignImages] = useState<Record<string, string>>({});
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<WeeklyCampaign | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [queuing, setQueuing] = useState<Record<string, boolean>>({});
  const [queued, setQueued] = useState<Record<string, boolean>>({});
  
  // Fetch queue status
  useEffect(() => {
    if (!activeProduct) return;
    
    const fetchQueue = async () => {
      try {
        const res = await fetch(`/api/schedule?productId=${activeProduct.id}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const newQueued: Record<string, boolean> = {};
        data.queue.forEach((item: any) => {
          const key = item.day ? `${item.campaignId}-${item.day}-${item.platform}` : `${item.campaignId}-${item.platform}`;
          newQueued[key] = true;
        });
        setQueued(newQueued);
      } catch (err) {
        logSilentError(err as Error, { context: "fetchQueueStatus" });
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [activeProduct]);

  const [generateImages, setGenerateImages] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [focusInput, setFocusInput] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [campaignTheme, setCampaignTheme] = useState("");
  const [focus, setFocus] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [draftCampaign, setDraftCampaign] = useState<WeeklyCampaign | null>(null);
  const [feedback, setFeedback] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['LinkedIn', 'X', 'Instagram', 'Facebook', 'Reddit']);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [shareDuration, setShareDuration] = useState<number | "">("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [newTagInput, setNewTagInput] = useState("");

  // Derived state for all unique tags
  const allTags = Array.from(new Set(campaigns.flatMap(c => c.tags || []))).sort();

  // Filtered and sorted campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (selectedTagFilter && (!c.tags || !c.tags.includes(selectedTagFilter))) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTheme = c.theme?.toLowerCase().includes(query);
      const matchesPillar = c.pillar?.toLowerCase().includes(query);
      
      const createdDate = new Date(c.createdAt).toLocaleDateString().toLowerCase();
      const startDate = c.startDate ? new Date(c.startDate).toLocaleDateString().toLowerCase() : "";
      const matchesDate = createdDate.includes(query) || startDate.includes(query) || c.startDate?.toLowerCase().includes(query) || c.createdAt?.toLowerCase().includes(query);
      
      if (!matchesTheme && !matchesPillar && !matchesDate) return false;
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Utility functions for dates
  const getMonday = (date: Date, offsetWeeks: number = 0) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff + (offsetWeeks * 7));
    return d;
  };

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const displayDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const today = new Date();
  const nextMonday = getMonday(today, 1);
  const followingMonday = getMonday(today, 2);

  const availableChannels = ['LinkedIn', 'X', 'Instagram', 'Facebook', 'Reddit', 'TikTok', 'YouTube Shorts', 'Pinterest'];

  const handleToggleShare = async () => {
    if (!selectedCampaign || !user) return;
    setIsSharing(true);
    try {
      const isNowShared = !selectedCampaign.isShared;
      const updatedCampaign = { 
        ...selectedCampaign, 
        isShared: isNowShared,
      };
      
      if (isNowShared) {
        updatedCampaign.sharedAt = selectedCampaign.sharedAt || new Date().toISOString();
        const expires = new Date(updatedCampaign.sharedAt);
        expires.setMinutes(expires.getMinutes() + Number(shareDuration));
        updatedCampaign.feedbackExpiresAt = expires.toISOString();
      } else {
        delete updatedCampaign.sharedAt;
        delete updatedCampaign.feedbackExpiresAt;
      }

      // Remove any other undefined fields to prevent Firestore errors
      Object.keys(updatedCampaign).forEach(key => {
        if (updatedCampaign[key as keyof typeof updatedCampaign] === undefined) {
          delete updatedCampaign[key as keyof typeof updatedCampaign];
        }
      });

      await setDoc(doc(db, 'campaigns', selectedCampaign.id), updatedCampaign);
      setSelectedCampaign(updatedCampaign);
      setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    } catch (err) {
      logSilentError(err as Error, { context: "toggleShareStatus", campaignId: selectedCampaign.id });
    } finally {
      setIsSharing(false);
    }
  };

  const getShareUrl = (campaignId: string) => {
    const origin = window.location.origin;
    // If we are in the dev environment, replace ais-dev- with ais-pre- for the public link
    const publicOrigin = origin.replace('ais-dev-', 'ais-pre-');
    return `${publicOrigin}/shared/${campaignId}`;
  };

  const shareUrl = selectedCampaign ? getShareUrl(selectedCampaign.id) : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailLink = () => {
    if (!selectedCampaign) return;
    const subject = encodeURIComponent(`Review Campaign: ${selectedCampaign.theme}`);
    const body = encodeURIComponent(`I'd like you to review this campaign:\n\n${selectedCampaign.theme}\n\nView it here: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Auto-process feedbacks when timer expires
  useEffect(() => {
    if (!selectedCampaign || !selectedCampaign.isShared || !selectedCampaign.feedbackExpiresAt || selectedCampaign.feedbackProcessed) return;

    const checkExpiration = async () => {
      const expiresAt = new Date(selectedCampaign.feedbackExpiresAt!).getTime();
      const now = new Date().getTime();

      if (now > expiresAt && !isGenerating) {
        setIsGenerating(true);
        try {
          if (feedbacks.length === 0) {
            // No feedbacks to process, just mark as processed
            const updatedCampaign = { ...selectedCampaign, feedbackProcessed: true };
            await setDoc(doc(db, 'campaigns', selectedCampaign.id), updatedCampaign);
            setSelectedCampaign(updatedCampaign);
            setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
            return;
          }

          // Group feedbacks by postId
          const feedbacksByPost: Record<string, string[]> = {};
          feedbacks.forEach(f => {
            if (!feedbacksByPost[f.postId]) feedbacksByPost[f.postId] = [];
            feedbacksByPost[f.postId].push(`${f.reviewerName}: ${f.content}`);
          });

          // Deep copy the campaign
          const updatedCampaign = JSON.parse(JSON.stringify(selectedCampaign)) as WeeklyCampaign;
          
          // Process daily posts
          if (updatedCampaign.dailyPosts) {
            for (let dIdx = 0; dIdx < updatedCampaign.dailyPosts.length; dIdx++) {
              const day = updatedCampaign.dailyPosts[dIdx];
              for (let pIdx = 0; pIdx < day.platformVersions.length; pIdx++) {
                const post = day.platformVersions[pIdx];
                const postId = `daily-${dIdx}-${pIdx}`;
                if (feedbacksByPost[postId]) {
                  const newCopy = await regeneratePostWithFeedback(
                    post.copy,
                    feedbacksByPost[postId],
                    updatedCampaign.theme,
                    updatedCampaign.coreMessage,
                    user?.uid
                  );
                  post.copy = newCopy;
                  post.improvedViaFeedback = true;
                }
              }
            }
          }

          // Process platform versions (legacy/fallback)
          if (updatedCampaign.platformVersions) {
            for (let pIdx = 0; pIdx < updatedCampaign.platformVersions.length; pIdx++) {
              const post = updatedCampaign.platformVersions[pIdx];
              const postId = `platform-${pIdx}`;
              if (feedbacksByPost[postId]) {
                const newCopy = await regeneratePostWithFeedback(
                  post.copy,
                  feedbacksByPost[postId],
                  updatedCampaign.theme,
                  updatedCampaign.coreMessage,
                  user?.uid
                );
                post.copy = newCopy;
                post.improvedViaFeedback = true;
              }
            }
          }

          updatedCampaign.feedbackProcessed = true;
          await setDoc(doc(db, 'campaigns', selectedCampaign.id), updatedCampaign);
          setSelectedCampaign(updatedCampaign);
          setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));

        } catch (err) {
          logSilentError(err as Error, { context: "autoProcessFeedbacks", campaignId: selectedCampaign.id });
        } finally {
          setIsGenerating(false);
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [selectedCampaign, feedbacks, isGenerating, user]);

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("campaigns");
      if (saved) {
        try {
          const parsed: WeeklyCampaign[] = JSON.parse(saved);
          parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCampaigns(parsed);
          if (activeProduct) {
            const productCampaigns = parsed.filter(c => c.productId === activeProduct.id);
            if (productCampaigns.length > 0) {
              setSelectedCampaign(prev => {
                if (prev && productCampaigns.find(c => c.id === prev.id)) {
                  return prev;
                }
                return productCampaigns[0];
              });
            } else {
              setSelectedCampaign(null);
            }
          }
        } catch (e) {
          logSilentError(e as Error, { context: "parseLocalCampaigns" });
          setCampaigns([]);
          setSelectedCampaign(null);
        }
      } else {
        setCampaigns([]);
        setSelectedCampaign(null);
      }
      return;
    }

    const q = query(collection(db, 'campaigns'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyCampaign));
      
      // Migration logic
      if (fetchedCampaigns.length === 0) {
        const saved = localStorage.getItem("campaigns");
        if (saved) {
          try {
            const parsed: WeeklyCampaign[] = JSON.parse(saved);
            for (const c of parsed) {
              const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              try {
                await setDoc(doc(db, 'campaigns', newId), { ...c, id: newId, userId: user.uid });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `campaigns/${newId}`);
              }
            }
            localStorage.removeItem("campaigns");
            return;
          } catch (e) {
            logSilentError(e as Error, { context: "migrateLocalCampaigns" });
            localStorage.removeItem("campaigns");
          }
        }
      }

      // Sort by createdAt descending
      fetchedCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCampaigns(fetchedCampaigns);

      if (activeProduct) {
        const productCampaigns = fetchedCampaigns.filter(c => c.productId === activeProduct.id);
        if (productCampaigns.length > 0) {
          // Keep selected campaign if it still exists in the list, otherwise select the first one
          setSelectedCampaign(prev => {
            if (prev && productCampaigns.find(c => c.id === prev.id)) {
              return prev;
            }
            return productCampaigns[0];
          });
        } else {
          setSelectedCampaign(null);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'campaigns');
    });

    return () => unsubscribe();
  }, [user, activeProduct]);

  useEffect(() => {
    if (activeProduct) {
      fetch(`/api/linkedin/status?productId=${activeProduct.id}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => setIsLinkedinConnected(data.connected))
        .catch(err => logSilentError(err as Error, { context: "fetchLinkedinStatus" }));
    }
  }, [activeProduct]);

  useEffect(() => {
    if (!selectedCampaign || !user) return;
    
    const fetchImages = async () => {
      setIsFetchingImages(true);
      try {
        const imagesRef = collection(db, `campaigns/${selectedCampaign.id}/images`);
        const snapshot = await getDocs(imagesRef);
        const newImages: Record<string, string> = {};
        const chunks: Record<string, { index: number, data: string, total: number }[]> = {};

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.totalChunks) {
            if (!chunks[data.id]) chunks[data.id] = [];
            chunks[data.id].push({ index: data.chunkIndex, data: data.data, total: data.totalChunks });
          } else {
            newImages[doc.id] = data.data;
          }
        });

        // Reassemble chunked images
        for (const [id, imageChunks] of Object.entries(chunks)) {
          imageChunks.sort((a, b) => a.index - b.index);
          newImages[id] = imageChunks.map(c => c.data).join('');
        }

        setCampaignImages(newImages);
      } catch (err) {
        logSilentError(err as Error, { context: "fetchCampaignImages", campaignId: selectedCampaign.id });
      } finally {
        setIsFetchingImages(false);
      }
    };
    
    fetchImages();

    // Listen to feedbacks
    const feedbacksRef = collection(db, `campaigns/${selectedCampaign.id}/feedbacks`);
    const unsubscribeFeedbacks = onSnapshot(feedbacksRef, (snapshot) => {
      const newFeedbacks: Feedback[] = [];
      snapshot.forEach(doc => {
        newFeedbacks.push({ id: doc.id, ...doc.data() } as Feedback);
      });
      // Sort by timestamp
      newFeedbacks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setFeedbacks(newFeedbacks);
    }, (err) => {
      logSilentError(err as Error, { context: "fetchCampaignFeedbacks", campaignId: selectedCampaign.id });
    });

    return () => unsubscribeFeedbacks();
  }, [selectedCampaign?.id, user]);

  const handleStartGeneration = () => {
    if (!activeProduct) {
      setError("Please select or create a product first.");
      return;
    }
    setFocusInput("");
    setSubCategory("");
    setCampaignTheme("");
    setFocus("");
    setInsights([]);
    setDraftCampaign(null);
    setFeedback("");
    setSelectedStartDate(formatDate(nextMonday));
    setModalStep(1);
    setShowModal(true);
  };

  const handleResearchFocus = async () => {
    const finalFocus = focusInput.trim() || "Fitness industry";
    setFocus(finalFocus);
    setModalStep(4);
    setIsGenerating(true);
    setError(null);

    try {
      const result = await researchFocus(finalFocus, selectedChannels, subCategory, user?.uid);
      setInsights(result);
      
      const newCampaignData = await generateCampaign(
        activeProduct!, 
        finalFocus, 
        result, 
        generateImages,
        undefined,
        undefined,
        selectedChannels,
        campaignTheme,
        subCategory,
        user?.uid
      );
      
      const dayOffsets: Record<string, number> = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
      };

      if (newCampaignData.dailyPosts) {
        newCampaignData.dailyPosts = newCampaignData.dailyPosts.map(dp => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = new Date(selectedStartDate + 'T12:00:00Z'); // use noon UTC to avoid timezone shifts
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: formatDate(postDate) };
        });
      }
      
      const newCampaign: WeeklyCampaign = {
        ...newCampaignData,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct!.id,
        createdAt: new Date().toISOString(),
        startDate: selectedStartDate,
        focus: finalFocus,
        subCategory: subCategory,
        campaignThemeInput: campaignTheme,
      };

      setDraftCampaign(newCampaign);
      setModalStep(5);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleResearchFocus" });
      setError(err.message || "Failed to generate campaign. Please try again.");
      setModalStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (isRegenerating = false) => {
    setModalStep(4);
    setIsGenerating(true);
    setError(null);

    try {
      const newCampaignData = await generateCampaign(
        activeProduct!, 
        focus, 
        insights, 
        generateImages,
        isRegenerating ? feedback : undefined,
        isRegenerating && draftCampaign ? draftCampaign : undefined,
        selectedChannels,
        campaignTheme,
        subCategory,
        user?.uid
      );
      
      const dayOffsets: Record<string, number> = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6
      };

      if (newCampaignData.dailyPosts) {
        newCampaignData.dailyPosts = newCampaignData.dailyPosts.map(dp => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = new Date(selectedStartDate + 'T12:00:00Z');
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: formatDate(postDate) };
        });
      }
      
      const newCampaign: WeeklyCampaign = {
        ...newCampaignData,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct!.id,
        createdAt: new Date().toISOString(),
        startDate: selectedStartDate,
        focus: focus,
        subCategory: subCategory,
        campaignThemeInput: campaignTheme,
      };

      setDraftCampaign(newCampaign);
      setModalStep(5);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleGenerateCampaign" });
      setError(err.message || "Failed to generate campaign. Please try again.");
      setModalStep(isRegenerating ? 6 : 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!draftCampaign || !user) return;
    
    // Save campaign to Firestore
    try {
      const campaignToSave = JSON.parse(JSON.stringify({ 
        ...draftCampaign, 
        userId: user.uid,
        productName: activeProduct.name,
        productLogoUrl: activeProduct.logoUrl || null
      }));
      
      // Extract images to save separately to avoid 1MB document limit
      const imagesToSave: { id: string, data: string }[] = [];
      const getUniqueId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      if (campaignToSave.platformVersions) {
        campaignToSave.platformVersions.forEach((pv: any) => {
          if (pv.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: pv.imageUrl });
            pv.imageId = imageId;
            delete pv.imageUrl;
          }
        });
      }
      
      if (campaignToSave.dailyPosts) {
        campaignToSave.dailyPosts.forEach((dp: any) => {
          if (dp.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: dp.imageUrl });
            dp.imageId = imageId;
            delete dp.imageUrl;
          }
          if (dp.platformVersions) {
            dp.platformVersions.forEach((pv: any) => {
              if (pv.imageUrl) {
                const existing = imagesToSave.find(img => img.data === pv.imageUrl);
                if (existing) {
                  pv.imageId = existing.id;
                } else {
                  const imageId = getUniqueId();
                  imagesToSave.push({ id: imageId, data: pv.imageUrl });
                  pv.imageId = imageId;
                }
                delete pv.imageUrl;
              }
            });
          }
        });
      }

      await setDoc(doc(db, 'campaigns', draftCampaign.id), campaignToSave);
      
      // Save images to subcollection, chunking if necessary
      const newCampaignImages: Record<string, string> = {};
      for (const img of imagesToSave) {
        newCampaignImages[img.id] = img.data;
        const MAX_CHUNK_SIZE = 900000; // ~900KB to stay safely under 1MB limit
        if (img.data.length > MAX_CHUNK_SIZE) {
          const numChunks = Math.ceil(img.data.length / MAX_CHUNK_SIZE);
          for (let i = 0; i < numChunks; i++) {
            const chunkData = img.data.substring(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
            await setDoc(doc(db, `campaigns/${draftCampaign.id}/images`, `${img.id}_chunk_${i}`), {
              id: img.id,
              chunkIndex: i,
              totalChunks: numChunks,
              data: chunkData,
              userId: user.uid
            });
          }
        } else {
          await setDoc(doc(db, `campaigns/${draftCampaign.id}/images`, img.id), {
            id: img.id,
            data: img.data,
            userId: user.uid
          });
        }
      }
      
      setCampaignImages(prev => ({ ...prev, ...newCampaignImages }));
      setSelectedCampaign(campaignToSave);
      
      // Auto-queue all posts
      if (draftCampaign.dailyPosts) {
        for (const dp of draftCampaign.dailyPosts) {
          for (const pv of dp.platformVersions) {
            handleQueue(pv.platform, formatCopy(pv.copy), draftCampaign.id, dp.day, dp.date);
          }
        }
      } else if (draftCampaign.platformVersions) {
        for (const pv of draftCampaign.platformVersions) {
          handleQueue(pv.platform, formatCopy(pv.copy), draftCampaign.id);
        }
      }

      // Send PDF to email
      try {
        const { generateCampaignPDF } = await import('../lib/pdfGenerator');
        const pdfDoc = await generateCampaignPDF(campaignToSave, activeProduct!);
        const pdfBase64 = pdfDoc.output('datauristring');
        
        const token = await auth.currentUser?.getIdToken();
        const emailRes = await fetch('/api/campaigns/email', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            email: user.email,
            pdfBase64,
            campaignTheme: campaignToSave.theme
          })
        });
        
        if (!emailRes.ok) {
          const emailData = await emailRes.json();
          setError(`Campaign saved, but email failed: ${emailData.error}`);
        }
      } catch (emailErr) {
        logSilentError(emailErr as Error, { context: "sendEmailShare" });
        setError("Campaign saved, but failed to send email. Please check your SMTP settings.");
      }

      setShowModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `campaigns/${draftCampaign.id}`);
    }
  };

  const handlePublish = async (platform: string, copy: string, campaignId: string, day?: string, imageUrl?: string) => {
    if (platform.toLowerCase() !== 'linkedin' || !activeProduct) return;
    
    const publishKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setPublishing(prev => ({ ...prev, [publishKey]: true }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: copy, productId: activeProduct.id, imageUrl })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish');
      }
      
      setPublished(prev => ({ ...prev, [publishKey]: true }));
      setTimeout(() => {
        setPublished(prev => ({ ...prev, [publishKey]: false }));
      }, 3000);
    } catch (err: any) {
      setError(`Error publishing to LinkedIn: ${err.message}`);
    } finally {
      setPublishing(prev => ({ ...prev, [publishKey]: false }));
    }
  };

  const handleQueue = async (platform: string, copy: string, campaignId: string, day?: string, date?: string) => {
    if (!activeProduct) return;
    const queueKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setQueuing(prev => ({ ...prev, [queueKey]: true }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/schedule/queue', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: copy, campaignId, platform, productId: activeProduct.id, day, date })
      });
      
      if (!res.ok) {
        throw new Error('Failed to queue post');
      }
      
      setQueued(prev => ({ ...prev, [queueKey]: true }));
    } catch (err: any) {
      setError(`Error queuing post: ${err.message}`);
    } finally {
      setQueuing(prev => ({ ...prev, [queueKey]: false }));
    }
  };

  const handleUnqueue = async (platform: string, campaignId: string, day?: string) => {
    if (!activeProduct) return;
    const queueKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setQueuing(prev => ({ ...prev, [queueKey]: true }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/schedule/queue/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ campaignId, platform, productId: activeProduct.id, day })
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove from queue');
      }
      
      setQueued(prev => ({ ...prev, [queueKey]: false }));
    } catch (err: any) {
      setError(`Error removing from queue: ${err.message}`);
    } finally {
      setQueuing(prev => ({ ...prev, [queueKey]: false }));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCampaignIds.size === 0) return;
    setIsDeleting(true);
    try {
      // Delete from Firestore
      for (const id of selectedCampaignIds) {
        await deleteDoc(doc(db, 'campaigns', id));
      }
      
      // Update local state
      const updatedCampaigns = campaigns.filter(c => !selectedCampaignIds.has(c.id));
      setCampaigns(updatedCampaigns);
      
      // Update local storage
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
      
      // Clear selection
      setSelectedCampaignIds(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      
      // If selected campaign was deleted, clear it
      if (selectedCampaign && selectedCampaignIds.has(selectedCampaign.id)) {
        setSelectedCampaign(null);
      }
    } catch (err: any) {
      setError(`Failed to delete campaigns: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTag = async (campaignId: string, tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const currentTags = campaign.tags || [];
    if (currentTags.includes(cleanTag)) {
      setNewTagInput("");
      return;
    }

    const updatedTags = [...currentTags, cleanTag];
    const updatedCampaign = { ...campaign, tags: updatedTags };

    try {
      await setDoc(doc(db, 'campaigns', campaignId), updatedCampaign);
      setCampaigns(prev => prev.map(c => c.id === campaignId ? updatedCampaign : c));
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
      setNewTagInput("");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  const handleRemoveTag = async (campaignId: string, tagToRemove: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const updatedTags = (campaign.tags || []).filter(t => t !== tagToRemove);
    const updatedCampaign = { ...campaign, tags: updatedTags };

    try {
      await setDoc(doc(db, 'campaigns', campaignId), updatedCampaign);
      setCampaigns(prev => prev.map(c => c.id === campaignId ? updatedCampaign : c));
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedCampaignIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCampaignIds(newSelection);
  };

  const toggleSelectAll = () => {
    const productCampaigns = campaigns.filter(c => c.productId === activeProduct?.id);
    if (selectedCampaignIds.size === productCampaigns.length) {
      setSelectedCampaignIds(new Set());
    } else {
      const allIds = productCampaigns.map(c => c.id);
      setSelectedCampaignIds(new Set(allIds));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className={cn("w-full lg:w-1/3 flex flex-col gap-4 h-full", selectedCampaign ? "hidden lg:flex" : "flex")}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Campaigns</h1>
            <p className="text-sm text-[#ff8566] mt-1">Turn your Brand Position into Outreach and Signal.</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 text-sm font-medium text-[#4b5563] cursor-pointer">
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={generateImages}
                  onChange={(e) => setGenerateImages(e.target.checked)}
                  disabled={isGenerating}
                />
                <div className="w-9 h-5 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff6347]"></div>
              </div>
              <ImageIcon className="h-4 w-4 text-[#ff8566]" />
              Images
            </label>
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="glass-button-primary px-4 py-2 text-sm rounded-full"
            >
              {isGenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Generate
            </button>
          </div>
        </div>

        {!showModal && error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {campaigns.filter(c => c.productId === activeProduct?.id).length > 0 && (
          <div className="flex flex-col gap-3 px-2 py-1">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search theme, pillar, date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white/50 focus:outline-none focus:ring-1 focus:ring-[#ff6347] focus:border-[#ff6347] transition-all"
                />
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white/50 border border-gray-200 rounded-lg hover:bg-white/80 transition-colors shrink-0"
              >
                {sortOrder === "newest" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-xs font-medium text-gray-500 flex-shrink-0 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Tags:
                </span>
                <button
                  onClick={() => setSelectedTagFilter(null)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors",
                    selectedTagFilter === null ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(tag)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors",
                      selectedTagFilter === tag ? "bg-[#ff6347] text-white" : "bg-[#ff6347]/10 text-[#ff6347] hover:bg-[#ff6347]/20"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedCampaignIds(new Set());
                  }}
                  className="text-xs font-medium text-[#4b5563] hover:text-[#111827] transition-colors"
                >
                  {isSelectionMode ? 'Cancel Selection' : 'Select'}
                </button>
                {isSelectionMode && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-medium text-[#ff6347] hover:text-[#ff8566] transition-colors"
                  >
                    {selectedCampaignIds.size === filteredCampaigns.filter(c => c.productId === activeProduct?.id).length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              {isSelectionMode && selectedCampaignIds.size > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedCampaignIds.size})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto glass-panel divide-y divide-white/20">
          {filteredCampaigns.filter(c => c.productId === activeProduct?.id).length === 0 && !isGenerating ? (
            <div className="p-8 text-center text-[#ff8566] text-sm">
              {campaigns.filter(c => c.productId === activeProduct?.id).length === 0 
                ? "No campaigns yet for this product. Generate your first one!"
                : "No campaigns match the selected filters."}
            </div>
          ) : (
            filteredCampaigns.filter(c => c.productId === activeProduct?.id).map((c) => (
              <div
                key={c.id}
                className={cn(
                  "w-full flex items-stretch hover:bg-white/40 transition-colors cursor-pointer",
                  selectedCampaign?.id === c.id && !isSelectionMode && "bg-white/60 border-l-2 border-[#ff6347] backdrop-blur-md",
                  selectedCampaignIds.has(c.id) && isSelectionMode && "bg-orange-50/50"
                )}
                onClick={() => isSelectionMode ? toggleSelection(c.id, { stopPropagation: () => {} } as any) : setSelectedCampaign(c)}
              >
                {isSelectionMode && (
                  <div className="pl-4 flex items-center" onClick={(e) => toggleSelection(c.id, e)}>
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      selectedCampaignIds.has(c.id) ? "bg-[#ff6347] border-[#ff6347]" : "border-gray-300 bg-white"
                    )}>
                      {selectedCampaignIds.has(c.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                )}
                <div className="flex-1 text-left px-5 py-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-[#111827] line-clamp-1">{c.theme}</h3>
                  </div>
                  <p className="mt-1.5 text-xs text-[#ff8566] line-clamp-2 leading-relaxed">{c.coreMessage}</p>
                  {c.tags && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#ff8566]">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className={cn("flex-1 overflow-y-auto glass-panel p-4 sm:p-8", !selectedCampaign ? "hidden lg:block" : "block")}>
        {selectedCampaign ? (
          <div className="space-y-8">
            <div className="border-b border-white/20 pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="lg:hidden mr-2 p-1 hover:bg-white/20 rounded-lg"
                >
                  <ArrowRight className="h-5 w-5 rotate-180" />
                </button>
                <span className="inline-flex items-center rounded-lg bg-white/50 px-2.5 py-1 text-xs font-semibold text-[#111827] ring-1 ring-inset ring-white/50 backdrop-blur-md">
                  {selectedCampaign.pillar}
                </span>
                <span className="inline-flex items-center rounded-lg bg-white/40 px-2.5 py-1 text-xs font-semibold text-[#374151] ring-1 ring-inset ring-white/50 backdrop-blur-md">
                  {selectedCampaign.contentFormat}
                </span>
                <div className="flex-1 hidden sm:block" />
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/50 px-3 py-1.5 text-xs font-semibold text-[#111827] hover:bg-white/80 transition-colors ring-1 ring-inset ring-white/50"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button
                    onClick={async () => {
                      const { generateCampaignPDF } = await import('../lib/pdfGenerator');
                      const pdf = await generateCampaignPDF(selectedCampaign, activeProduct!);
                      pdf.save(`${selectedCampaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_campaign.pdf`);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#374151] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-[#111827] font-display">{selectedCampaign.theme}</h2>
              <p className="mt-4 text-lg text-[#6b7280] font-medium leading-relaxed">{selectedCampaign.coreMessage}</p>
            </div>

            {selectedCampaign.researchSummary && (
              <div className="glass-card bg-blue-50/30 border-blue-200/50 p-5">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Live Research Insights
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                  {selectedCampaign.researchSummary}
                </p>
              </div>
            )}

            {(selectedCampaign.focus || selectedCampaign.subCategory || selectedCampaign.campaignThemeInput) && (
              <div className="glass-card bg-gray-50/50 border-gray-200/50 p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-600" />
                  Campaign Inputs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {selectedCampaign.focus && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Industry / Focus</span>
                      <p className="text-sm text-gray-800 font-medium">{selectedCampaign.focus}</p>
                    </div>
                  )}
                  {selectedCampaign.subCategory && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Sub-Category / Niche</span>
                      <p className="text-sm text-gray-800 font-medium">{selectedCampaign.subCategory}</p>
                    </div>
                  )}
                  {selectedCampaign.campaignThemeInput && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Provided Theme</span>
                      <p className="text-sm text-gray-800 font-medium">{selectedCampaign.campaignThemeInput}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="glass-card bg-white/50 border-gray-200/50 p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                Campaign Tags
              </h4>
              <div className="flex flex-wrap gap-2 items-center">
                {(selectedCampaign.tags || []).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ff6347]/10 text-[#ff6347] text-xs font-medium">
                    {tag}
                    <button onClick={() => handleRemoveTag(selectedCampaign.id, tag)} className="hover:text-[#ff6347]/70 focus:outline-none">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(selectedCampaign.id, newTagInput);
                      }
                    }}
                    placeholder="Add tag..."
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#ff6347] focus:border-[#ff6347] w-32 bg-white"
                  />
                  <button 
                    onClick={() => handleAddTag(selectedCampaign.id, newTagInput)}
                    className="absolute right-2 text-gray-400 hover:text-[#ff6347]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-5">
                <div className="flex gap-3">
                  <Target className="h-5 w-5 text-[#ff6347] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#111827]">Target Audience</h4>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{selectedCampaign.targetAudience}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#111827]">Hook</h4>
                    <p className="text-sm text-[#6b7280] mt-1 italic leading-relaxed">"{selectedCampaign.hook}"</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex gap-3">
                  <MessageSquare className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#111827]">Call to Action</h4>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{selectedCampaign.cta}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#111827]">Repurposing Notes</h4>
                    <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{selectedCampaign.repurposingNotes}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <Layers className="h-5 w-5 text-[#4b5563]" />
                <h3 className="text-lg font-semibold text-[#111827]">Platform Execution</h3>
              </div>
              
              <div className="space-y-8">
                {selectedCampaign.dailyPosts && selectedCampaign.dailyPosts.length > 0 ? (
                  selectedCampaign.dailyPosts.map((dp, dayIdx) => (
                    <div key={dayIdx} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-md font-bold text-[#111827]">
                          {dp.day}
                          {dp.date && <span className="text-sm text-[#6b7280] font-normal ml-2">({new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
                        </h4>
                        <span className="inline-flex items-center rounded-md bg-white/40 px-2.5 py-0.5 text-xs font-medium text-[#374151] backdrop-blur-md">
                          {dp.contentType}
                        </span>
                      </div>
                      <div className="space-y-6">
                        {dp.platformVersions.map((pv, idx) => {
                          const isLinkedin = pv.platform.toLowerCase() === 'linkedin';
                          const publishKey = `${selectedCampaign.id}-${dp.day}-${pv.platform}`;
                          const isPublishing = publishing[publishKey];
                          const isPublished = published[publishKey];

                          return (
                            <div key={idx} className="glass-card overflow-hidden">
                              <div className="bg-white/20 px-4 sm:px-5 py-3 border-b border-white/20 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 backdrop-blur-md">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-semibold text-sm text-[#111827]">{pv.platform}</span>
                                  <span className="text-xs font-semibold text-[#4b5563] bg-white/50 px-2 py-1 rounded-md border border-white/50 backdrop-blur-md shadow-sm">{pv.format}</span>
                                  {pv.improvedViaFeedback && (
                                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      Improved via feedbacks
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                  <button
                                    onClick={() => queued[publishKey] ? handleUnqueue(pv.platform, selectedCampaign.id, dp.day) : handleQueue(pv.platform, formatCopy(pv.copy), selectedCampaign.id, dp.day, dp.date)}
                                    disabled={queuing[publishKey]}
                                    className={cn("glass-button px-3 py-1.5 text-xs transition-colors", queued[publishKey] && "bg-[#ff6347]/20 border-[#ff6347]/50 text-[#111827]")}
                                  >
                                    {queuing[publishKey] ? (
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : queued[publishKey] ? (
                                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#ff6347]" />
                                    ) : (
                                      <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    {queued[publishKey] ? 'Queued' : 'Queue'}
                                  </button>
                                  {isLinkedin && isLinkedinConnected && (
                                    <button
                                      onClick={() => handlePublish(pv.platform, formatCopy(pv.copy), selectedCampaign.id, dp.day, pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined))}
                                      disabled={isPublishing || isPublished}
                                      className="glass-button-primary px-3 py-1.5 text-xs bg-[#0A66C2] hover:bg-[#004182]"
                                    >
                                      {isPublishing ? (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                      ) : isPublished ? (
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      ) : (
                                        <Send className="mr-1.5 h-3.5 w-3.5" />
                                      )}
                                      {isPublished ? 'Published' : 'Publish'}
                                    </button>
                                  )}
                                  {isLinkedin && !isLinkedinConnected && (
                                    <span className="text-xs text-[#ff8566] italic">Connect LinkedIn in Settings to publish</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-5">
                                {(pv.imageUrl || pv.imageId) && (
                                  <div className="mb-4 rounded-lg overflow-hidden border border-white/50 bg-white/20 backdrop-blur-md">
                                    {isFetchingImages && pv.imageId && !campaignImages[pv.imageId] ? (
                                      <div className="w-full min-h-[200px] flex items-center justify-center bg-gray-100 animate-pulse">
                                        <div className="flex flex-col items-center gap-2">
                                          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                                          <span className="text-sm text-gray-500 font-medium">Loading image...</span>
                                        </div>
                                      </div>
                                    ) : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId])) ? (
                                      <ImageLoader src={pv.imageUrl || campaignImages[pv.imageId!]} alt="Generated post image" className="w-full h-auto object-cover max-h-[400px]" containerClassName="w-full min-h-[200px]" />
                                    ) : null}
                                  </div>
                                )}
                                <p className="text-sm text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
                                
                                {feedbacks.filter(f => f.postId === `daily-${dayIdx}-${idx}`).length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                                    <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      Feedback Received
                                    </h5>
                                    <div className="space-y-2">
                                      {feedbacks.filter(f => f.postId === `daily-${dayIdx}-${idx}`).map(feedback => (
                                        <div key={feedback.id} className="bg-white/60 rounded p-2.5 text-xs border border-gray-100">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-900">{feedback.reviewerName}</span>
                                            <span className="text-gray-500">{new Date(feedback.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                          </div>
                                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  selectedCampaign.platformVersions.map((pv, idx) => {
                    const isLinkedin = pv.platform.toLowerCase() === 'linkedin';
                    const publishKey = `${selectedCampaign.id}-${pv.platform}`;
                    const isPublishing = publishing[publishKey];
                    const isPublished = published[publishKey];

                    return (
                      <div key={idx} className="glass-card overflow-hidden">
                        <div className="bg-white/20 px-4 sm:px-5 py-3 border-b border-white/20 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 backdrop-blur-md">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-sm text-[#111827]">{pv.platform}</span>
                            <span className="text-xs font-semibold text-[#4b5563] bg-white/50 px-2 py-1 rounded-md border border-white/50 backdrop-blur-md shadow-sm">{pv.format}</span>
                            {pv.improvedViaFeedback && (
                              <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Improved via feedbacks
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                            <button
                              onClick={() => queued[publishKey] ? handleUnqueue(pv.platform, selectedCampaign.id) : handleQueue(pv.platform, formatCopy(pv.copy), selectedCampaign.id)}
                              disabled={queuing[publishKey]}
                              className={cn("glass-button px-3 py-1.5 text-xs transition-colors", queued[publishKey] && "bg-[#ff6347]/20 border-[#ff6347]/50 text-[#111827]")}
                            >
                              {queuing[publishKey] ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : queued[publishKey] ? (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#ff6347]" />
                              ) : (
                                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {queued[publishKey] ? 'Queued' : 'Queue'}
                            </button>
                            {isLinkedin && isLinkedinConnected && (
                              <button
                                onClick={() => handlePublish(pv.platform, formatCopy(pv.copy), selectedCampaign.id, undefined, pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined))}
                                disabled={isPublishing || isPublished}
                                className="glass-button-primary px-3 py-1.5 text-xs bg-[#0A66C2] hover:bg-[#004182]"
                              >
                                {isPublishing ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : isPublished ? (
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                ) : (
                                  <Send className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {isPublished ? 'Published' : 'Publish'}
                              </button>
                            )}
                            {isLinkedin && !isLinkedinConnected && (
                              <span className="text-xs text-[#ff8566] italic">Connect LinkedIn in Settings to publish</span>
                            )}
                          </div>
                        </div>
                        <div className="p-5">
                          {(pv.imageUrl || pv.imageId) && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-white/50 bg-white/20 backdrop-blur-md">
                              {isFetchingImages && pv.imageId && !campaignImages[pv.imageId] ? (
                                <div className="w-full min-h-[200px] flex items-center justify-center bg-gray-100 animate-pulse">
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                                    <span className="text-sm text-gray-500 font-medium">Loading image...</span>
                                  </div>
                                </div>
                              ) : (pv.imageUrl || (pv.imageId && campaignImages[pv.imageId])) ? (
                                <ImageLoader src={pv.imageUrl || campaignImages[pv.imageId!]} alt="Generated post image" className="w-full h-auto object-cover max-h-[400px]" containerClassName="w-full min-h-[200px]" />
                              ) : null}
                            </div>
                          )}
                          <p className="text-sm text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
                          
                          {feedbacks.filter(f => f.postId === `platform-${idx}`).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200/50">
                              <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Feedback Received
                              </h5>
                              <div className="space-y-2">
                                {feedbacks.filter(f => f.postId === `platform-${idx}`).map(feedback => (
                                  <div key={feedback.id} className="bg-white/60 rounded p-2.5 text-xs border border-gray-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-900">{feedback.reviewerName}</span>
                                      <span className="text-gray-500">{new Date(feedback.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{feedback.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#ff8566]">
            <Megaphone className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium">Select a campaign to view details</p>
          </div>
        )}
      </div>
      {/* Generation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/10 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-[#111827]">
                {modalStep === 1 && "Campaign Focus"}
                {modalStep === 4 && "Generating..."}
                {modalStep === 5 && "Review Campaign"}
                {modalStep === 6 && "Improve Campaign"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#ff8566] hover:text-[#6b7280] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 glass-panel border-red-200/50 bg-red-50/50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {modalStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-base font-semibold text-[#111827]">
                      What industry or focus should this campaign target?
                    </label>
                    <p className="text-sm text-[#6b7280] mb-2">e.g., Fitness, Skincare, Tech Gadgets, Local Restaurant</p>
                    <input
                      type="text"
                      value={focusInput}
                      onChange={(e) => setFocusInput(e.target.value)}
                      placeholder="Enter focus or leave blank for default (Fitness industry)"
                      className="glass-input block w-full py-3 px-4 text-base bg-white/60 border-[#ff8566] focus:border-[#ff6347] focus:ring-[#ff6347] text-[#111827] placeholder:text-[#ff8566] shadow-sm rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleResearchFocus();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-base font-semibold text-[#111827]">
                      Industry Sub-Category or Niche
                    </label>
                    <p className="text-sm text-[#6b7280] mb-2">Specify which part of the industry you want to focus more on.</p>
                    <input
                      type="text"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="e.g., Gyms, Fitness Equipments, Apparels, Supplements"
                      className="glass-input block w-full py-3 px-4 text-base bg-white/60 border-[#ff8566] focus:border-[#ff6347] focus:ring-[#ff6347] text-[#111827] placeholder:text-[#ff8566] shadow-sm rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleResearchFocus();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-base font-semibold text-[#111827]">
                      Campaign Theme
                    </label>
                    <p className="text-sm text-[#6b7280] mb-2">Optional: Provide a specific theme for this campaign.</p>
                    <input
                      type="text"
                      value={campaignTheme}
                      onChange={(e) => setCampaignTheme(e.target.value)}
                      placeholder="e.g., Winter Sale, New Feature Launch"
                      className="glass-input block w-full py-3 px-4 text-base bg-white/60 border-[#ff8566] focus:border-[#ff6347] focus:ring-[#ff6347] text-[#111827] placeholder:text-[#ff8566] shadow-sm rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleResearchFocus();
                      }}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="block text-base font-semibold text-[#111827]">
                      Campaign Start Week
                    </label>
                    <p className="text-sm text-[#6b7280] mb-3">Select the Monday this weekly campaign will begin.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Next Monday", date: nextMonday },
                        { label: "In 2 Weeks", date: followingMonday }
                      ].map((option) => (
                        <label key={option.label} className={cn("flex flex-col p-3 rounded-xl border cursor-pointer transition-all", selectedStartDate === formatDate(option.date) ? "border-[#ff6347] bg-[#ff6347]/5" : "border-gray-200 bg-white/40 hover:border-[#ff6347]/50")}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn("text-sm font-semibold", selectedStartDate === formatDate(option.date) ? "text-[#ff6347]" : "text-[#111827]")}>{option.label}</span>
                            <input type="radio" name="startDate" value={formatDate(option.date)} checked={selectedStartDate === formatDate(option.date)} onChange={(e) => setSelectedStartDate(e.target.value)} className="text-[#ff6347] focus:ring-[#ff6347] h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs text-[#4b5563]">{displayDate(option.date)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/20">
                    <label className="block text-base font-semibold text-[#111827]">
                      Select Research & Content Channels
                    </label>
                    <p className="text-sm text-[#6b7280] mb-3">Choose the platforms to research and generate content for.</p>
                    <div className="flex flex-wrap gap-2">
                      {availableChannels.map(channel => (
                        <button
                          key={channel}
                          onClick={() => {
                            if (selectedChannels.includes(channel)) {
                              setSelectedChannels(selectedChannels.filter(c => c !== channel));
                            } else {
                              setSelectedChannels([...selectedChannels, channel]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors backdrop-blur-md",
                            selectedChannels.includes(channel) 
                              ? "bg-[#ff6347]/20 border-[#ff6347]/30 text-[#111827]" 
                              : "bg-white/40 border-white/50 text-[#4b5563] hover:bg-white/60"
                          )}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 4 && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-8 w-8 text-[#ff6347] animate-spin" />
                  <p className="text-sm font-medium text-[#4b5563]">Generating Campaign...</p>
                  <p className="text-xs text-[#ff8566] text-center max-w-xs">
                    Researching {focus} and crafting posts based on your Brand Position.
                  </p>
                </div>
              )}

              {modalStep === 5 && draftCampaign && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">{draftCampaign.theme}</h3>
                    <p className="text-sm text-[#6b7280] mt-1">{draftCampaign.coreMessage}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-[#111827]">Generated Posts</h4>
                    <div className="space-y-4 pr-2">
                      {draftCampaign.dailyPosts ? (
                        draftCampaign.dailyPosts.map((dp, idx) => (
                          <div key={idx} className="glass-card p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm text-[#111827]">
                                {dp.day} {dp.date && <span className="text-xs text-[#6b7280] font-normal ml-1">({new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>}
                              </span>
                              <span className="text-xs bg-white/50 border border-white/50 backdrop-blur-md px-2 py-1 rounded text-[#374151]">{dp.contentType}</span>
                            </div>
                            {dp.platformVersions.map((pv, pvIdx) => (
                              <div key={pvIdx} className="bg-white/40 p-3 rounded-lg border border-white/50 backdrop-blur-md">
                                <span className="font-semibold text-xs text-[#ff8566] mb-2 block uppercase tracking-wider">{pv.platform}</span>
                                <p className="text-sm text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
                                {(pv.imageUrl || dp.imageUrl) && (
                                  <div className="mt-3 rounded-lg overflow-hidden border border-white/20 bg-white/20">
                                    <ImageLoader src={pv.imageUrl || dp.imageUrl!} alt="Generated post image" className="w-full h-auto object-cover max-h-[400px]" containerClassName="w-full min-h-[200px]" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))
                      ) : (
                        draftCampaign.platformVersions.map((pv, idx) => (
                          <div key={idx} className="glass-card p-4">
                            <span className="font-semibold text-sm text-[#111827] mb-3 block">{pv.platform}</span>
                            <p className="text-sm text-[#4b5563] whitespace-pre-wrap leading-relaxed">{formatCopy(pv.copy)}</p>
                            {pv.imageUrl && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-white/20 bg-white/20">
                                <ImageLoader src={pv.imageUrl} alt="Generated post image" className="w-full h-auto object-cover max-h-[400px]" containerClassName="w-full min-h-[200px]" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 6 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[#4b5563]">
                    What would you like to improve?
                  </label>
                  <p className="text-xs text-[#ff8566]">Provide specific feedback to guide the regeneration.</p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g., Make the tone more professional, focus more on feature X..."
                    rows={4}
                    className="glass-input block w-full py-2.5 px-3 sm:text-sm"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/20 bg-white/10 backdrop-blur-md flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-[#4b5563] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              {modalStep === 1 && (
                <button
                  onClick={handleResearchFocus}
                  disabled={selectedChannels.length === 0}
                  className="glass-button-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Campaign <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
              {modalStep === 5 && (
                <>
                  <button
                    onClick={() => setModalStep(6)}
                    className="px-4 py-2 text-sm font-medium text-[#4b5563] hover:text-[#111827] transition-colors"
                  >
                    Reject & Improve
                  </button>
                  <button
                    onClick={handleApprove}
                    className="glass-button-primary px-4 py-2 text-sm"
                  >
                    Approve & Schedule
                  </button>
                </>
              )}
              {modalStep === 6 && (
                <>
                  <button
                    onClick={() => setModalStep(5)}
                    className="px-4 py-2 text-sm font-medium text-[#4b5563] hover:text-[#111827] transition-colors"
                  >
                    Back to Review
                  </button>
                  <button
                    onClick={() => handleGenerate(true)}
                    className="glass-button-primary px-4 py-2 text-sm"
                  >
                    Regenerate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] mb-2">Delete Campaigns?</h3>
              <p className="text-sm text-[#6b7280] mb-6">
                Are you sure you want to delete {selectedCampaignIds.size} selected campaign{selectedCampaignIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove them from the database.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-[#4b5563] hover:text-[#111827] transition-colors bg-white/50 rounded-lg ring-1 ring-inset ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/20 flex justify-between items-center bg-white/10 backdrop-blur-md">
              <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                <Share2 className="h-5 w-5 text-[#ff6347]" />
                Share Campaign
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-[#6b7280] hover:text-[#111827] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#111827]">Enable Public Link</h4>
                  <p className="text-xs text-[#6b7280] mt-1">Anyone with the link can view this campaign.</p>
                </div>
                <button
                  onClick={handleToggleShare}
                  disabled={isSharing || (!selectedCampaign.isShared && shareDuration === "")}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#ff6347] focus:ring-offset-2",
                    selectedCampaign.isShared ? "bg-[#ff6347]" : "bg-gray-200",
                    (isSharing || (!selectedCampaign.isShared && shareDuration === "")) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      selectedCampaign.isShared ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {!selectedCampaign.isShared && (
                <div className="space-y-2 pt-2 border-t border-white/20">
                  <label className="text-xs font-medium text-[#4b5563]">Feedback Window Duration</label>
                  <select
                    value={shareDuration}
                    onChange={(e) => setShareDuration(e.target.value === "" ? "" : Number(e.target.value))}
                    className="glass-input block w-full py-2 px-3 text-sm text-[#111827]"
                  >
                    <option value="" disabled>Select duration...</option>
                    <option value={10}>10 Minutes (Testing)</option>
                    <option value={1440}>1 Day</option>
                    <option value={4320}>3 Days</option>
                    <option value={10080}>7 Days</option>
                    <option value={20160}>14 Days</option>
                  </select>
                  <p className="text-[10px] text-[#6b7280]">Reviewers can leave feedback until this window closes.</p>
                </div>
              )}

              {selectedCampaign.isShared && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3 flex items-start gap-2">
                    <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-orange-800">Feedback Window Active</p>
                      <p className="text-[10px] text-orange-600 mt-0.5">
                        {selectedCampaign.feedbackExpiresAt 
                          ? `Closes on ${new Date(selectedCampaign.feedbackExpiresAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                          : `Closes 3 days after sharing`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#4b5563]">Public Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="glass-input flex-1 text-sm py-2 px-3 text-[#4b5563]"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center justify-center rounded-lg bg-white/50 px-3 py-2 text-sm font-semibold text-[#111827] hover:bg-white/80 transition-colors ring-1 ring-inset ring-white/50"
                        title="Copy link"
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleEmailLink}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#374151] transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Share via Email
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
