import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { VideoLoader } from "../components/VideoLoader";
import { useState, useEffect } from "react";
import { generateCampaign, researchFocus, regeneratePostWithFeedback } from "../services/geminiService";
import { Plus, Calendar, Target, MessageSquare, Zap, RefreshCw, Layers, Megaphone, Send, CheckCircle2, Sparkles, CalendarClock, Image as ImageIcon, X, ArrowRight, Download, Share2, Copy, Mail, Trash2, Clock, Tag, Search, ArrowDownAZ, ArrowUpAZ, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatCopy } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, setDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";
import { ImageLightbox } from "../components/ImageLightbox";
import { PostPreviewModal } from "../components/PostPreviewModal";
export function Campaigns() {
  const { activeProduct } = useProducts();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [campaignImages, setCampaignImages] = useState({});
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState(/* @__PURE__ */ new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [publishing, setPublishing] = useState({});
  const [published, setPublished] = useState({});
  const [queuing, setQueuing] = useState({});
  const [queued, setQueued] = useState({});
  const [previewPost, setPreviewPost] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  useEffect(() => {
    if (!activeProduct || !user) return;
    const fetchQueue = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/schedule?productId=${activeProduct.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const newQueued = {};
        data.queue.forEach((item) => {
          const key = item.day ? `${item.campaignId}-${item.day}-${item.platform}` : `${item.campaignId}-${item.platform}`;
          newQueued[key] = true;
        });
        setQueued(newQueued);
      } catch (err) {
        logSilentError(err, { context: "fetchQueueStatus" });
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 1e4);
    return () => clearInterval(interval);
  }, [activeProduct, user]);
  const [generateImages, setGenerateImages] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [focusInput, setFocusInput] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [campaignTheme, setCampaignTheme] = useState("");
  const [focus, setFocus] = useState("");
  const [insights, setInsights] = useState([]);
  const [isResearching, setIsResearching] = useState(false);
  const [draftCampaign, setDraftCampaign] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["LinkedIn", "X", "Instagram", "Facebook", "Reddit"]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedState, setCopiedState] = useState({});
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [shareDuration, setShareDuration] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [newTagInput, setNewTagInput] = useState("");
  const [openDayIdx, setOpenDayIdx] = useState(0);
  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState((prev) => ({ ...prev, [key]: false }));
    }, 2e3);
  };
  const handleDownloadImage = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const allTags = Array.from(new Set(campaigns.flatMap((c) => c.tags || []))).sort();
  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedTagFilter && (!c.tags || !c.tags.includes(selectedTagFilter))) return false;
    if (searchQuery) {
      const query2 = searchQuery.toLowerCase();
      const matchesTheme = c.theme?.toLowerCase().includes(query2);
      const matchesPillar = c.pillar?.toLowerCase().includes(query2);
      const createdDate = new Date(c.createdAt).toLocaleDateString().toLowerCase();
      const startDate = c.startDate ? new Date(c.startDate).toLocaleDateString().toLowerCase() : "";
      const matchesDate = createdDate.includes(query2) || startDate.includes(query2) || c.startDate?.toLowerCase().includes(query2) || c.createdAt?.toLowerCase().includes(query2);
      if (!matchesTheme && !matchesPillar && !matchesDate) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });
  const getMonday = (date, offsetWeeks = 0) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff + offsetWeeks * 7);
    return d;
  };
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const displayDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const today = /* @__PURE__ */ new Date();
  const nextMonday = getMonday(today, 1);
  const followingMonday = getMonday(today, 2);
  const availableChannels = ["LinkedIn", "X", "Instagram", "Facebook", "Reddit", "TikTok", "YouTube Shorts", "Pinterest"];
  const handleToggleShare = async () => {
    if (!selectedCampaign || !user) return;
    setIsSharing(true);
    try {
      const isNowShared = !selectedCampaign.isShared;
      const updatedCampaign = {
        ...selectedCampaign,
        isShared: isNowShared
      };
      if (isNowShared) {
        updatedCampaign.sharedAt = selectedCampaign.sharedAt || (/* @__PURE__ */ new Date()).toISOString();
        const expires = new Date(updatedCampaign.sharedAt);
        expires.setMinutes(expires.getMinutes() + Number(shareDuration));
        updatedCampaign.feedbackExpiresAt = expires.toISOString();
      } else {
        delete updatedCampaign.sharedAt;
        delete updatedCampaign.feedbackExpiresAt;
      }
      Object.keys(updatedCampaign).forEach((key) => {
        if (updatedCampaign[key] === void 0) {
          delete updatedCampaign[key];
        }
      });
      await setDoc(doc(db, "campaigns", selectedCampaign.id), updatedCampaign);
      setSelectedCampaign(updatedCampaign);
      setCampaigns((prev) => prev.map((c) => c.id === updatedCampaign.id ? updatedCampaign : c));
    } catch (err) {
      logSilentError(err, { context: "toggleShareStatus", campaignId: selectedCampaign.id });
    } finally {
      setIsSharing(false);
    }
  };
  const getShareUrl = (campaignId) => {
    const origin = window.location.origin;
    const publicOrigin = origin.replace("ais-dev-", "ais-pre-");
    return `${publicOrigin}/shared/${campaignId}`;
  };
  const shareUrl = selectedCampaign ? getShareUrl(selectedCampaign.id) : "";
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleEmailLink = () => {
    if (!selectedCampaign) return;
    const subject = encodeURIComponent(`Review Campaign: ${selectedCampaign.theme}`);
    const body = encodeURIComponent(`I'd like you to review this campaign:

${selectedCampaign.theme}

View it here: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  useEffect(() => {
    if (!selectedCampaign || !selectedCampaign.isShared || !selectedCampaign.feedbackExpiresAt || selectedCampaign.feedbackProcessed) return;
    const checkExpiration = async () => {
      const expiresAt = new Date(selectedCampaign.feedbackExpiresAt).getTime();
      const now = (/* @__PURE__ */ new Date()).getTime();
      if (now > expiresAt && !isGenerating) {
        setIsGenerating(true);
        try {
          if (feedbacks.length === 0) {
            const updatedCampaign2 = { ...selectedCampaign, feedbackProcessed: true };
            await setDoc(doc(db, "campaigns", selectedCampaign.id), updatedCampaign2);
            setSelectedCampaign(updatedCampaign2);
            setCampaigns((prev) => prev.map((c) => c.id === updatedCampaign2.id ? updatedCampaign2 : c));
            return;
          }
          const feedbacksByPost = {};
          feedbacks.forEach((f) => {
            if (!feedbacksByPost[f.postId]) feedbacksByPost[f.postId] = [];
            feedbacksByPost[f.postId].push(`${f.reviewerName}: ${f.content}`);
          });
          const updatedCampaign = JSON.parse(JSON.stringify(selectedCampaign));
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
          await setDoc(doc(db, "campaigns", selectedCampaign.id), updatedCampaign);
          setSelectedCampaign(updatedCampaign);
          setCampaigns((prev) => prev.map((c) => c.id === updatedCampaign.id ? updatedCampaign : c));
        } catch (err) {
          logSilentError(err, { context: "autoProcessFeedbacks", campaignId: selectedCampaign.id });
        } finally {
          setIsGenerating(false);
        }
      }
    };
    checkExpiration();
    const interval = setInterval(checkExpiration, 6e4);
    return () => clearInterval(interval);
  }, [selectedCampaign, feedbacks, isGenerating, user]);
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("campaigns");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCampaigns(parsed);
          if (activeProduct) {
            const productCampaigns = parsed.filter((c) => c.productId === activeProduct.id);
            if (productCampaigns.length > 0) {
              setSelectedCampaign((prev) => {
                if (prev && productCampaigns.find((c) => c.id === prev.id)) {
                  return prev;
                }
                return productCampaigns[0];
              });
            } else {
              setSelectedCampaign(null);
            }
          }
        } catch (e) {
          logSilentError(e, { context: "parseLocalCampaigns" });
          setCampaigns([]);
          setSelectedCampaign(null);
        }
      } else {
        setCampaigns([]);
        setSelectedCampaign(null);
      }
      return;
    }
    const q = query(collection(db, "campaigns"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
      if (fetchedCampaigns.length === 0) {
        const saved = localStorage.getItem("campaigns");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            for (const c of parsed) {
              const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              try {
                await setDoc(doc(db, "campaigns", newId), { ...c, id: newId, userId: user.uid });
              } catch (error2) {
                handleFirestoreError(error2, OperationType.WRITE, `campaigns/${newId}`);
              }
            }
            localStorage.removeItem("campaigns");
            return;
          } catch (e) {
            logSilentError(e, { context: "migrateLocalCampaigns" });
            localStorage.removeItem("campaigns");
          }
        }
      }
      fetchedCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCampaigns(fetchedCampaigns);
      if (activeProduct) {
        const productCampaigns = fetchedCampaigns.filter((c) => c.productId === activeProduct.id);
        if (productCampaigns.length > 0) {
          setSelectedCampaign((prev) => {
            if (prev && productCampaigns.find((c) => c.id === prev.id)) {
              return prev;
            }
            return productCampaigns[0];
          });
        } else {
          setSelectedCampaign(null);
        }
      }
    }, (error2) => {
      handleFirestoreError(error2, OperationType.GET, "campaigns");
    });
    return () => unsubscribe();
  }, [user, activeProduct]);
  useEffect(() => {
    if (activeProduct) {
      fetch(`/api/linkedin/status?productId=${activeProduct.id}`).then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }).then((data) => setIsLinkedinConnected(data.connected)).catch((err) => logSilentError(err, { context: "fetchLinkedinStatus" }));
    }
  }, [activeProduct]);
  useEffect(() => {
    if (!selectedCampaign || !user) return;
    const fetchImages = async () => {
      setIsFetchingImages(true);
      try {
        const imagesRef = collection(db, `campaigns/${selectedCampaign.id}/images`);
        const snapshot = await getDocs(imagesRef);
        const newImages = {};
        const chunks = {};
        snapshot.forEach((doc2) => {
          const data = doc2.data();
          if (data.totalChunks) {
            if (!chunks[data.id]) chunks[data.id] = [];
            chunks[data.id].push({ index: data.chunkIndex, data: data.data, total: data.totalChunks });
          } else {
            newImages[doc2.id] = data.data;
          }
        });
        for (const [id, imageChunks] of Object.entries(chunks)) {
          imageChunks.sort((a, b) => a.index - b.index);
          newImages[id] = imageChunks.map((c) => c.data).join("");
        }
        setCampaignImages(newImages);
      } catch (err) {
        logSilentError(err, { context: "fetchCampaignImages", campaignId: selectedCampaign.id });
      } finally {
        setIsFetchingImages(false);
      }
    };
    fetchImages();
    const feedbacksRef = collection(db, `campaigns/${selectedCampaign.id}/feedbacks`);
    const unsubscribeFeedbacks = onSnapshot(feedbacksRef, (snapshot) => {
      const newFeedbacks = [];
      snapshot.forEach((doc2) => {
        newFeedbacks.push({ id: doc2.id, ...doc2.data() });
      });
      newFeedbacks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setFeedbacks(newFeedbacks);
    }, (err) => {
      logSilentError(err, { context: "fetchCampaignFeedbacks", campaignId: selectedCampaign.id });
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
  const handleProceedToNextStep = () => {
    if (generateImages) {
      setModalStep(2);
    } else {
      handleResearchFocus();
    }
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
        activeProduct,
        finalFocus,
        result,
        generateImages,
        void 0,
        void 0,
        selectedChannels,
        campaignTheme,
        subCategory,
        user?.uid,
        imageAspectRatio
      );
      const dayOffsets = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
      };
      if (newCampaignData.dailyPosts) {
        newCampaignData.dailyPosts = newCampaignData.dailyPosts.map((dp) => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = /* @__PURE__ */ new Date(selectedStartDate + "T12:00:00Z");
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: formatDate(postDate) };
        });
      }
      const newCampaign = {
        ...newCampaignData,
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct.id,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        startDate: selectedStartDate,
        focus: finalFocus,
        subCategory,
        campaignThemeInput: campaignTheme
      };
      setDraftCampaign(newCampaign);
      setModalStep(5);
    } catch (err) {
      logSilentError(err, { context: "handleResearchFocus" });
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
        activeProduct,
        focus,
        insights,
        generateImages,
        isRegenerating ? feedback : void 0,
        isRegenerating && draftCampaign ? draftCampaign : void 0,
        selectedChannels,
        campaignTheme,
        subCategory,
        user?.uid,
        imageAspectRatio
      );
      const dayOffsets = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
      };
      if (newCampaignData.dailyPosts) {
        newCampaignData.dailyPosts = newCampaignData.dailyPosts.map((dp) => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = /* @__PURE__ */ new Date(selectedStartDate + "T12:00:00Z");
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: formatDate(postDate) };
        });
      }
      const newCampaign = {
        ...newCampaignData,
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct.id,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        startDate: selectedStartDate,
        focus,
        subCategory,
        campaignThemeInput: campaignTheme
      };
      setDraftCampaign(newCampaign);
      setModalStep(5);
    } catch (err) {
      logSilentError(err, { context: "handleGenerateCampaign" });
      setError(err.message || "Failed to generate campaign. Please try again.");
      setModalStep(isRegenerating ? 6 : 1);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleApprove = async () => {
    if (!draftCampaign || !user) return;
    try {
      const campaignToSave = JSON.parse(JSON.stringify({
        ...draftCampaign,
        userId: user.uid,
        productName: activeProduct.name,
        productLogoUrl: activeProduct.logoUrl || activeProduct.logoDarkUrl || activeProduct.logoLightUrl || null
      }));
      const imagesToSave = [];
      const getUniqueId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (campaignToSave.platformVersions) {
        campaignToSave.platformVersions.forEach((pv) => {
          if (pv.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: pv.imageUrl });
            pv.imageId = imageId;
            delete pv.imageUrl;
          }
        });
      }
      if (campaignToSave.dailyPosts) {
        campaignToSave.dailyPosts.forEach((dp) => {
          if (dp.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: dp.imageUrl });
            dp.imageId = imageId;
            delete dp.imageUrl;
          }
          if (dp.platformVersions) {
            dp.platformVersions.forEach((pv) => {
              if (pv.imageUrl) {
                const existing = imagesToSave.find((img) => img.data === pv.imageUrl);
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
      await setDoc(doc(db, "campaigns", draftCampaign.id), campaignToSave);
      const newCampaignImages = {};
      for (const img of imagesToSave) {
        newCampaignImages[img.id] = img.data;
        const MAX_CHUNK_SIZE = 9e5;
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
      setCampaignImages((prev) => ({ ...prev, ...newCampaignImages }));
      setSelectedCampaign(campaignToSave);
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
      try {
        const { generateCampaignPDF } = await import("../lib/pdfGenerator");
        const pdfDoc = await generateCampaignPDF(campaignToSave, activeProduct);
        const pdfBase64 = pdfDoc.output("datauristring");
        const token = await auth.currentUser?.getIdToken();
        const emailRes = await fetch("/api/campaigns/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...token ? { "Authorization": `Bearer ${token}` } : {}
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
        logSilentError(emailErr, { context: "sendEmailShare" });
        setError("Campaign saved, but failed to send email. Please check your SMTP settings.");
      }
      setShowModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `campaigns/${draftCampaign.id}`);
    }
  };
  const handlePublish = async (platform, copy, campaignId, day, imageUrl) => {
    if (platform.toLowerCase() !== "linkedin" || !activeProduct) return;
    const publishKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setPublishing((prev) => ({ ...prev, [publishKey]: true }));
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": `Bearer ${token}` } : {}
        },
        body: JSON.stringify({ text: copy, productId: activeProduct.id, imageUrl })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }
      setPublished((prev) => ({ ...prev, [publishKey]: true }));
      setTimeout(() => {
        setPublished((prev) => ({ ...prev, [publishKey]: false }));
      }, 3e3);
    } catch (err) {
      setError(`Error publishing to LinkedIn: ${err.message}`);
    } finally {
      setPublishing((prev) => ({ ...prev, [publishKey]: false }));
    }
  };
  const handleQueue = async (platform, copy, campaignId, day, date) => {
    if (!activeProduct) return;
    const queueKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setQueuing((prev) => ({ ...prev, [queueKey]: true }));
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/schedule/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": `Bearer ${token}` } : {}
        },
        body: JSON.stringify({ text: copy, campaignId, platform, productId: activeProduct.id, day, date })
      });
      if (!res.ok) {
        throw new Error("Failed to queue post");
      }
      setQueued((prev) => ({ ...prev, [queueKey]: true }));
    } catch (err) {
      setError(`Error queuing post: ${err.message}`);
    } finally {
      setQueuing((prev) => ({ ...prev, [queueKey]: false }));
    }
  };
  const handleUnqueue = async (platform, campaignId, day) => {
    if (!activeProduct) return;
    const queueKey = day ? `${campaignId}-${day}-${platform}` : `${campaignId}-${platform}`;
    setQueuing((prev) => ({ ...prev, [queueKey]: true }));
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/schedule/queue/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": `Bearer ${token}` } : {}
        },
        body: JSON.stringify({ campaignId, platform, productId: activeProduct.id, day })
      });
      if (!res.ok) {
        throw new Error("Failed to remove from queue");
      }
      setQueued((prev) => ({ ...prev, [queueKey]: false }));
    } catch (err) {
      setError(`Error removing from queue: ${err.message}`);
    } finally {
      setQueuing((prev) => ({ ...prev, [queueKey]: false }));
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedCampaignIds.size === 0) return;
    setIsDeleting(true);
    try {
      for (const id of selectedCampaignIds) {
        await deleteDoc(doc(db, "campaigns", id));
      }
      const updatedCampaigns = campaigns.filter((c) => !selectedCampaignIds.has(c.id));
      setCampaigns(updatedCampaigns);
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
      setSelectedCampaignIds(/* @__PURE__ */ new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);
      if (selectedCampaign && selectedCampaignIds.has(selectedCampaign.id)) {
        setSelectedCampaign(null);
      }
    } catch (err) {
      setError(`Failed to delete campaigns: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleAddTag = async (campaignId, tag) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    const currentTags = campaign.tags || [];
    if (currentTags.includes(cleanTag)) {
      setNewTagInput("");
      return;
    }
    const updatedTags = [...currentTags, cleanTag];
    const updatedCampaign = { ...campaign, tags: updatedTags };
    try {
      await setDoc(doc(db, "campaigns", campaignId), updatedCampaign);
      setCampaigns((prev) => prev.map((c) => c.id === campaignId ? updatedCampaign : c));
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
      setNewTagInput("");
    } catch (error2) {
      handleFirestoreError(error2, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };
  const handleRemoveTag = async (campaignId, tagToRemove) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    const updatedTags = (campaign.tags || []).filter((t) => t !== tagToRemove);
    const updatedCampaign = { ...campaign, tags: updatedTags };
    try {
      await setDoc(doc(db, "campaigns", campaignId), updatedCampaign);
      setCampaigns((prev) => prev.map((c) => c.id === campaignId ? updatedCampaign : c));
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
    } catch (error2) {
      handleFirestoreError(error2, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };
  const toggleSelection = (id, e) => {
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
    const productCampaigns = campaigns.filter((c) => c.productId === activeProduct?.id);
    if (selectedCampaignIds.size === productCampaigns.length) {
      setSelectedCampaignIds(/* @__PURE__ */ new Set());
    } else {
      const allIds = productCampaigns.map((c) => c.id);
      setSelectedCampaignIds(new Set(allIds));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row h-full gap-6 overflow-hidden animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxs("div", { className: cn("w-full lg:w-1/3 flex flex-col gap-4 h-full", selectedCampaign ? "hidden lg:flex" : "flex"), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight text-white", children: "Campaigns" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-1", children: "Turn your Brand Position into Outreach and Signal." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative inline-flex items-center cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  className: "sr-only peer",
                  checked: generateImages,
                  onChange: (e) => setGenerateImages(e.target.checked),
                  disabled: isGenerating
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1C1C22] after:border-[#7C3AED]/20 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]" })
            ] }),
            /* @__PURE__ */ jsx(ImageIcon, { className: "h-4 w-4 text-gray-300" }),
            "Images"
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleStartGeneration,
              disabled: isGenerating,
              className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
              children: [
                isGenerating ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-1.5 h-7 w-7" }) : /* @__PURE__ */ jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
                "Generate"
              ]
            }
          )
        ] })
      ] }),
      !showModal && error && /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-red-500/10 p-4 border border-red-100", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500", children: error }) }),
      campaigns.filter((c) => c.productId === activeProduct?.id).length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 px-2 py-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search theme, pillar, date...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#7C3AED]/20 bg-[#1C1C22]/50 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSortOrder((prev) => prev === "newest" ? "oldest" : "newest"),
              className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#1C1C22]/50 border-[#7C3AED]/20 border border-[#7C3AED]/20 rounded-lg hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors shrink-0",
              children: [
                sortOrder === "newest" ? /* @__PURE__ */ jsx(ArrowDownAZ, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ArrowUpAZ, { className: "h-4 w-4" }),
                sortOrder === "newest" ? "Newest First" : "Oldest First"
              ]
            }
          )
        ] }),
        allTags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-gray-400 flex-shrink-0 flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Filter, { className: "h-3 w-3" }),
            "Tags:"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedTagFilter(null),
              className: cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors",
                selectedTagFilter === null ? "bg-[#7C3AED] text-white" : "bg-[#1C1C22]/80 text-gray-300 hover:bg-gray-200"
              ),
              children: "All"
            }
          ),
          allTags.map((tag) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedTagFilter(tag),
              className: cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors",
                selectedTagFilter === tag ? "bg-[#7C3AED] text-white" : "bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20"
              ),
              children: tag
            },
            tag
          ))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedCampaignIds(/* @__PURE__ */ new Set());
                },
                className: "text-xs font-medium text-gray-300 hover:text-white transition-colors",
                children: isSelectionMode ? "Cancel Selection" : "Select"
              }
            ),
            isSelectionMode && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: toggleSelectAll,
                className: "text-xs font-medium text-[#7C3AED] hover:text-gray-300 transition-colors",
                children: selectedCampaignIds.size === filteredCampaigns.filter((c) => c.productId === activeProduct?.id).length ? "Deselect All" : "Select All"
              }
            )
          ] }),
          isSelectionMode && selectedCampaignIds.size > 0 && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowDeleteConfirm(true),
              className: "flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-500 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
                "Delete (",
                selectedCampaignIds.size,
                ")"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto glass-panel divide-y divide-white/20", children: filteredCampaigns.filter((c) => c.productId === activeProduct?.id).length === 0 && !isGenerating ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-gray-300 flex flex-col items-center justify-center", children: campaigns.filter((c) => c.productId === activeProduct?.id).length === 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("img", { src: "https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png", alt: "Tror", className: "h-32 w-auto mb-4 drop-shadow-[0_0_15px_rgba(124,58,237,0.3)] animate-[bounce_5s_ease-in-out_infinite]" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white font-display", children: "No campaigns yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-2 max-w-sm", children: "Let Tror do the heavy lifting! Generate your first campaign below." })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No campaigns match the selected filters." }) }) : filteredCampaigns.filter((c) => c.productId === activeProduct?.id).map((c) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "w-full flex items-stretch hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors cursor-pointer",
            selectedCampaign?.id === c.id && !isSelectionMode && "bg-[#1C1C22]/50 border-[#7C3AED]/20 border-l-2 border-[#7C3AED] ",
            selectedCampaignIds.has(c.id) && isSelectionMode && "bg-orange-500/10"
          ),
          onClick: () => isSelectionMode ? toggleSelection(c.id, { stopPropagation: () => {
          } }) : setSelectedCampaign(c),
          children: [
            isSelectionMode && /* @__PURE__ */ jsx("div", { className: "pl-4 flex items-center", onClick: (e) => toggleSelection(c.id, e), children: /* @__PURE__ */ jsx("div", { className: cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
              selectedCampaignIds.has(c.id) ? "bg-[#7C3AED] border-[#7C3AED]" : "border-gray-300 bg-[#1C1C22]"
            ), children: selectedCampaignIds.has(c.id) && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-white" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left px-5 py-5", children: [
              /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start", children: /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-white line-clamp-1", children: c.theme }) }),
              /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-xs text-gray-300 line-clamp-2 leading-relaxed", children: c.coreMessage }),
              c.tags && c.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: c.tags.map((tag) => /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#1C1C22]/80 text-gray-300", children: tag }, tag)) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 text-xs font-medium text-gray-300", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
                new Date(c.createdAt).toLocaleDateString()
              ] })
            ] })
          ]
        },
        c.id
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: cn("flex-1 overflow-y-auto glass-panel p-4 sm:p-8", !selectedCampaign ? "hidden lg:block" : "block"), children: selectedCampaign ? /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "border-b border-[#7C3AED]/20 pb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedCampaign(null),
              className: "lg:hidden mr-2 p-1 hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 rounded-lg",
              children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 rotate-180" })
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-lg bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/50 ", children: selectedCampaign.pillar }),
          /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-lg bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2.5 py-1 text-xs font-semibold text-gray-300 ring-1 ring-inset ring-white/50 ", children: selectedCampaign.contentFormat }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 hidden sm:block" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setIsShareModalOpen(true),
                className: "inline-flex items-center gap-2 rounded-lg bg-[#1C1C22]/50 border-[#7C3AED]/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors ring-1 ring-inset ring-white/50",
                children: [
                  /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4" }),
                  "Share"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: async () => {
                  const { generateCampaignPDF } = await import("../lib/pdfGenerator");
                  const pdf = await generateCampaignPDF(selectedCampaign, activeProduct);
                  pdf.save(`${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_campaign.pdf`);
                },
                className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Download PDF" }),
                  /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "PDF" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-white font-display", children: selectedCampaign.theme }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-lg text-gray-300 font-medium leading-relaxed", children: selectedCampaign.coreMessage })
      ] }),
      selectedCampaign.researchSummary && /* @__PURE__ */ jsx("div", { className: "bg-[#1C1C22]/50 border border-[#2583EB]/30 rounded-xl p-4 sm:p-6 shadow-[0_0_15px_rgba(37,131,235,0.1)] mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "shrink-0 hidden sm:block", children: /* @__PURE__ */ jsx("img", { src: "https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png", alt: "Tror", className: "w-12 h-12 rounded-full border border-[#2583EB]/50 bg-[#0A0A0F]/50" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm sm:text-base font-semibold text-[#2583EB] mb-2 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-[#2583EB]" }),
            "Tror's Research Insights"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-lg text-gray-300 leading-relaxed whitespace-pre-wrap", children: selectedCampaign.researchSummary })
        ] })
      ] }) }),
      (selectedCampaign.focus || selectedCampaign.subCategory || selectedCampaign.campaignThemeInput) && /* @__PURE__ */ jsxs("div", { className: "glass-card bg-[#0A0A0F]/80/50 border-[#7C3AED]/20/50 p-5", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold text-white mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Layers, { className: "h-4 w-4 text-gray-300" }),
          "Campaign Inputs"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
          selectedCampaign.focus && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1", children: "Industry / Focus" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 font-medium", children: selectedCampaign.focus })
          ] }),
          selectedCampaign.subCategory && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1", children: "Sub-Category / Niche" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 font-medium", children: selectedCampaign.subCategory })
          ] }),
          selectedCampaign.campaignThemeInput && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1", children: "Provided Theme" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 font-medium", children: selectedCampaign.campaignThemeInput })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "glass-card bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#7C3AED]/20/50 p-5", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold text-white mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Tag, { className: "h-4 w-4 text-gray-300" }),
          "Campaign Tags"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
          (selectedCampaign.tags || []).map((tag) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-medium", children: [
            tag,
            /* @__PURE__ */ jsx("button", { onClick: () => handleRemoveTag(selectedCampaign.id, tag), className: "hover:text-[#7C3AED]/70 focus:outline-none", children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }) })
          ] }, tag)),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newTagInput,
                onChange: (e) => setNewTagInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(selectedCampaign.id, newTagInput);
                  }
                },
                placeholder: "Add tag...",
                className: "text-xs px-3 py-1.5 rounded-md border border-[#7C3AED]/20 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] focus:border-[#7C3AED] w-32 bg-[#1C1C22]"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleAddTag(selectedCampaign.id, newTagInput),
                className: "absolute right-2 text-gray-300 hover:text-[#7C3AED]",
                children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(Target, { className: "h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Target Audience" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-1 leading-relaxed", children: selectedCampaign.targetAudience })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(Zap, { className: "h-5 w-5 text-amber-500 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Hook" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-300 mt-1 italic leading-relaxed", children: [
                '"',
                selectedCampaign.hook,
                '"'
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "h-5 w-5 text-violet-500 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Call to Action" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-1 leading-relaxed", children: selectedCampaign.cta })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "h-5 w-5 text-blue-500 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Repurposing Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-1 leading-relaxed", children: selectedCampaign.repurposingNotes })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-8 border-t border-[#7C3AED]/20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
          /* @__PURE__ */ jsx(Layers, { className: "h-5 w-5 text-gray-300" }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white", children: "Platform Execution" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-8", children: selectedCampaign.dailyPosts && selectedCampaign.dailyPosts.length > 0 ? selectedCampaign.dailyPosts.map((dp, dayIdx) => /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between cursor-pointer select-none bg-[#1C1C22]/50 hover:bg-[#1C1C22]/80 border border-[#7C3AED]/20 p-4 rounded-xl transition-colors",
              onClick: () => setOpenDayIdx(openDayIdx === dayIdx ? null : dayIdx),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  openDayIdx === dayIdx ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-5 w-5 text-gray-400" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-5 w-5 text-gray-400" }),
                  /* @__PURE__ */ jsxs("h4", { className: "text-md font-bold text-white", children: [
                    dp.day,
                    dp.date && /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-300 font-normal ml-2", children: [
                      "(",
                      new Date(dp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                      ")"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-md bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2.5 py-0.5 text-xs font-medium text-gray-300 ", children: dp.contentType })
              ]
            }
          ),
          openDayIdx === dayIdx && /* @__PURE__ */ jsx("div", { className: "space-y-6 pt-2 pl-4 border-l-2 border-[#7C3AED]/20 ml-2", children: dp.platformVersions.map((pv, idx) => {
            const isLinkedin = pv.platform.toLowerCase() === "linkedin";
            const publishKey = `${selectedCampaign.id}-${dp.day}-${pv.platform}`;
            const isPublishing = publishing[publishKey];
            const isPublished = published[publishKey];
            return /* @__PURE__ */ jsxs("div", { className: "glass-card overflow-hidden", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-[#1C1C22]/50 border-[#7C3AED]/20 px-4 sm:px-5 py-3 border-b border-[#7C3AED]/20 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 ", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-white", children: pv.platform }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-300 bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2 py-1 rounded-md border border-[#7C3AED]/20 shadow-sm", children: pv.format }),
                  pv.improvedViaFeedback && /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
                    "Improved via feedbacks"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap w-full sm:w-auto", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => queued[publishKey] ? handleUnqueue(pv.platform, selectedCampaign.id, dp.day) : handleQueue(pv.platform, formatCopy(pv.copy), selectedCampaign.id, dp.day, dp.date),
                      disabled: queuing[publishKey],
                      className: cn("inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 rounded-lg transition-colors shadow-sm", queued[publishKey] && "bg-[#7C3AED]/20 border-[#7C3AED]/50 text-white"),
                      children: [
                        queuing[publishKey] ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-1.5 h-7 w-7" }) : queued[publishKey] ? /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1.5 h-3.5 w-3.5 text-[#7C3AED]" }) : /* @__PURE__ */ jsx(CalendarClock, { className: "mr-1.5 h-3.5 w-3.5" }),
                        queued[publishKey] ? "Queued" : "Queue"
                      ]
                    }
                  ),
                  isLinkedin && isLinkedinConnected && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handlePublish(pv.platform, formatCopy(pv.copy), selectedCampaign.id, dp.day, pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : void 0)),
                      disabled: isPublishing || isPublished,
                      className: "inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors shadow-sm",
                      children: [
                        isPublishing ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-1.5 h-7 w-7" }) : isPublished ? /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1.5 h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Send, { className: "mr-1.5 h-3.5 w-3.5" }),
                        isPublished ? "Published" : "Publish"
                      ]
                    }
                  ),
                  isLinkedin && !isLinkedinConnected && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300 italic", children: "Connect LinkedIn in Settings to publish" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleCopyText(formatCopy(pv.copy), publishKey),
                      className: "inline-flex items-center justify-center h-8 w-8 text-gray-300 bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 hover:text-white rounded-lg transition-colors shadow-sm",
                      title: "Copy text",
                      children: copiedState[publishKey] ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-500" }) : /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" })
                    }
                  ),
                  !dp?.visualType && (pv.imageUrl || pv.imageId && campaignImages[pv.imageId]) && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDownloadImage(pv.imageUrl || campaignImages[pv.imageId], `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${pv.platform}.png`),
                      className: "inline-flex items-center justify-center h-8 w-8 text-gray-300 bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 hover:text-white rounded-lg transition-colors shadow-sm",
                      title: "Download image",
                      children: /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-5 flex flex-col items-center bg-black/20", children: [
                /* @__PURE__ */ jsx(
                  PostPreviewModal,
                  {
                    inline: true,
                    platform: pv.platform,
                    copy: pv.copy,
                    imageUrl: pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : void 0),
                    visualType: pv.visualType || (typeof dp !== "undefined" ? dp.visualType : void 0),
                    visualData: pv.visualData || (typeof dp !== "undefined" ? dp.visualData : void 0),
                    dna: activeProduct,
                    productName: activeProduct?.name || "",
                    productLogo: activeProduct?.logoUrl || ""
                  }
                ),
                feedbacks.filter((f) => f.postId === `daily-${dayIdx}-${idx}`).length > 0 && /* @__PURE__ */ jsxs("div", { className: "w-full mt-6 pt-4 border-t border-[#7C3AED]/20/50", children: [
                  /* @__PURE__ */ jsxs("h5", { className: "text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(MessageSquare, { className: "h-3.5 w-3.5" }),
                    "Feedback Received"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-2", children: feedbacks.filter((f) => f.postId === `daily-${dayIdx}-${idx}`).map((feedback2) => /* @__PURE__ */ jsxs("div", { className: "bg-[#1C1C22]/50 border-[#7C3AED]/20 rounded p-2.5 text-xs border border-[#7C3AED]/20", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: feedback2.reviewerName }),
                      /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: new Date(feedback2.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric" }) })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-gray-300 whitespace-pre-wrap", children: feedback2.content })
                  ] }, feedback2.id)) })
                ] })
              ] })
            ] }, idx);
          }) })
        ] }, dayIdx)) : selectedCampaign.platformVersions.map((pv, idx) => {
          const isLinkedin = pv.platform.toLowerCase() === "linkedin";
          const publishKey = `${selectedCampaign.id}-${pv.platform}`;
          const isPublishing = publishing[publishKey];
          const isPublished = published[publishKey];
          return /* @__PURE__ */ jsxs("div", { className: "glass-card overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-[#1C1C22]/50 border-[#7C3AED]/20 px-4 sm:px-5 py-3 border-b border-[#7C3AED]/20 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 ", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-white", children: pv.platform }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-300 bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2 py-1 rounded-md border border-[#7C3AED]/20 shadow-sm", children: pv.format }),
                pv.improvedViaFeedback && /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
                  "Improved via feedbacks"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap w-full sm:w-auto", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => queued[publishKey] ? handleUnqueue(pv.platform, selectedCampaign.id) : handleQueue(pv.platform, formatCopy(pv.copy), selectedCampaign.id),
                    disabled: queuing[publishKey],
                    className: cn("inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 rounded-lg transition-colors shadow-sm", queued[publishKey] && "bg-[#7C3AED]/20 border-[#7C3AED]/50 text-white"),
                    children: [
                      queuing[publishKey] ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-1.5 h-7 w-7" }) : queued[publishKey] ? /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1.5 h-3.5 w-3.5 text-[#7C3AED]" }) : /* @__PURE__ */ jsx(CalendarClock, { className: "mr-1.5 h-3.5 w-3.5" }),
                      queued[publishKey] ? "Queued" : "Queue"
                    ]
                  }
                ),
                isLinkedin && isLinkedinConnected && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handlePublish(pv.platform, formatCopy(pv.copy), selectedCampaign.id, void 0, pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : void 0)),
                    disabled: isPublishing || isPublished,
                    className: "inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors shadow-sm",
                    children: [
                      isPublishing ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-1.5 h-7 w-7" }) : isPublished ? /* @__PURE__ */ jsx(CheckCircle2, { className: "mr-1.5 h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Send, { className: "mr-1.5 h-3.5 w-3.5" }),
                      isPublished ? "Published" : "Publish"
                    ]
                  }
                ),
                isLinkedin && !isLinkedinConnected && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300 italic", children: "Connect LinkedIn in Settings to publish" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleCopyText(formatCopy(pv.copy), publishKey),
                    className: "inline-flex items-center justify-center h-8 w-8 text-gray-300 bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 hover:text-white rounded-lg transition-colors shadow-sm",
                    title: "Copy text",
                    children: copiedState[publishKey] ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-500" }) : /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" })
                  }
                ),
                !pv?.visualType && (pv.imageUrl || pv.imageId && campaignImages[pv.imageId]) && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleDownloadImage(pv.imageUrl || campaignImages[pv.imageId], `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${pv.platform}.png`),
                    className: "inline-flex items-center justify-center h-8 w-8 text-gray-300 bg-[#1C1C22]/80 border border-[#7C3AED]/30 hover:bg-[#7C3AED]/20 hover:text-white rounded-lg transition-colors shadow-sm",
                    title: "Download image",
                    children: /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-5 flex flex-col items-center bg-black/20", children: [
              /* @__PURE__ */ jsx(
                PostPreviewModal,
                {
                  inline: true,
                  platform: pv.platform,
                  copy: pv.copy,
                  imageUrl: pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : void 0),
                  visualType: pv.visualType,
                  visualData: pv.visualData,
                  dna: activeProduct,
                  productName: activeProduct?.name || "",
                  productLogo: activeProduct?.logoUrl || ""
                }
              ),
              feedbacks.filter((f) => f.postId === `platform-${idx}`).length > 0 && /* @__PURE__ */ jsxs("div", { className: "w-full mt-6 pt-4 border-t border-[#7C3AED]/20/50", children: [
                /* @__PURE__ */ jsxs("h5", { className: "text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(MessageSquare, { className: "h-3.5 w-3.5" }),
                  "Feedback Received"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: feedbacks.filter((f) => f.postId === `platform-${idx}`).map((feedback2) => /* @__PURE__ */ jsxs("div", { className: "bg-[#1C1C22]/50 border-[#7C3AED]/20 rounded p-2.5 text-xs border border-[#7C3AED]/20", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: feedback2.reviewerName }),
                    /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: new Date(feedback2.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric" }) })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-gray-300 whitespace-pre-wrap", children: feedback2.content })
                ] }, feedback2.id)) })
              ] })
            ] })
          ] }, idx);
        }) })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center text-gray-300", children: [
      /* @__PURE__ */ jsx(Megaphone, { className: "h-16 w-16 mb-4 opacity-20" }),
      /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Select a campaign to view details" })
    ] }) }),
    showModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "glass-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#7C3AED]/20 bg-[#1C1C22]/50 border-[#7C3AED]/20 ", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-white", children: [
          modalStep === 1 && "Campaign Focus",
          modalStep === 2 && "Image Settings",
          modalStep === 4 && "Generating...",
          modalStep === 5 && "Review Campaign",
          modalStep === 6 && "Improve Campaign"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowModal(false), className: "text-gray-300 hover:text-gray-300 transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-y-auto", children: [
        error && /* @__PURE__ */ jsx("div", { className: "mb-6 glass-panel border-red-500/20 bg-red-500/10 p-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500", children: error }) }),
        modalStep === 1 && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "What industry or focus should this campaign target?" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-2", children: "e.g., Fitness, Skincare, Tech Gadgets, Local Restaurant" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: focusInput,
                onChange: (e) => setFocusInput(e.target.value),
                placeholder: "Enter focus or leave blank for default (Fitness industry)",
                className: "glass-input block w-full py-3 px-4 text-base bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#ff8566] focus:border-[#7C3AED] focus:ring-[#7C3AED] text-white placeholder:text-gray-300 shadow-sm rounded-xl",
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleResearchFocus();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "Industry Sub-Category or Niche" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-2", children: "Specify which part of the industry you want to focus more on." }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: subCategory,
                onChange: (e) => setSubCategory(e.target.value),
                placeholder: "e.g., Gyms, Fitness Equipments, Apparels, Supplements",
                className: "glass-input block w-full py-3 px-4 text-base bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#ff8566] focus:border-[#7C3AED] focus:ring-[#7C3AED] text-white placeholder:text-gray-300 shadow-sm rounded-xl",
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleResearchFocus();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "Campaign Theme" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-2", children: "Optional: Provide a specific theme for this campaign." }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: campaignTheme,
                onChange: (e) => setCampaignTheme(e.target.value),
                placeholder: "e.g., Winter Sale, New Feature Launch",
                className: "glass-input block w-full py-3 px-4 text-base bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#ff8566] focus:border-[#7C3AED] focus:ring-[#7C3AED] text-white placeholder:text-gray-300 shadow-sm rounded-xl",
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleResearchFocus();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "Campaign Start Week" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-3", children: "Select the Monday this weekly campaign will begin." }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
              { label: "Next Monday", date: nextMonday },
              { label: "In 2 Weeks", date: followingMonday }
            ].map((option) => /* @__PURE__ */ jsxs("label", { className: cn("flex flex-col p-3 rounded-xl border cursor-pointer transition-all", selectedStartDate === formatDate(option.date) ? "border-[#7C3AED] bg-[#7C3AED]/5" : "border-[#7C3AED]/20 bg-[#1C1C22]/50 border-[#7C3AED]/20 hover:border-[#7C3AED]/50"), children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                /* @__PURE__ */ jsx("span", { className: cn("text-sm font-semibold", selectedStartDate === formatDate(option.date) ? "text-[#7C3AED]" : "text-white"), children: option.label }),
                /* @__PURE__ */ jsx("input", { type: "radio", name: "startDate", value: formatDate(option.date), checked: selectedStartDate === formatDate(option.date), onChange: (e) => setSelectedStartDate(e.target.value), className: "text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300", children: displayDate(option.date) })
            ] }, option.label)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2 border-t border-[#7C3AED]/20", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "Select Research & Content Channels" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mb-3", children: "Choose the platforms to research and generate content for." }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: availableChannels.map((channel) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  if (selectedChannels.includes(channel)) {
                    setSelectedChannels(selectedChannels.filter((c) => c !== channel));
                  } else {
                    setSelectedChannels([...selectedChannels, channel]);
                  }
                },
                className: cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ",
                  selectedChannels.includes(channel) ? "bg-[#7C3AED]/20 border-[#7C3AED]/30 text-white" : "bg-[#1C1C22]/50 border-[#7C3AED]/20 border-[#7C3AED]/20 text-gray-300 hover:bg-[#1C1C22]/50 border-[#7C3AED]/20"
                ),
                children: channel
              },
              channel
            )) })
          ] })
        ] }),
        modalStep === 2 && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-base font-semibold text-white", children: "Choose Image Formats" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300", children: "Select the aspect ratio for the generated images." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
            { id: "1:1", label: "Square", ratio: "1:1", desc: "Best for Instagram / LinkedIn Feed", mockupClass: "aspect-square" },
            { id: "4:5", label: "Portrait", ratio: "4:5", desc: "Best for Instagram / Facebook Feed", mockupClass: "aspect-[4/5]" },
            { id: "9:16", label: "Story", ratio: "9:16", desc: "Best for Stories / Reels / TikTok", mockupClass: "aspect-[9/16]" }
          ].map((option) => /* @__PURE__ */ jsxs(
            "label",
            {
              className: cn(
                "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all",
                imageAspectRatio === option.id ? "border-[#7C3AED] bg-[#7C3AED]/5 shadow-sm" : "border-[#7C3AED]/20 bg-[#1C1C22]/50 border-[#7C3AED]/20 hover:border-[#7C3AED]/50"
              ),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("span", { className: cn("text-base font-semibold", imageAspectRatio === option.id ? "text-[#7C3AED]" : "text-white"), children: option.label }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "radio",
                      name: "aspectRatio",
                      value: option.id,
                      checked: imageAspectRatio === option.id,
                      onChange: (e) => setImageAspectRatio(e.target.value),
                      className: "text-[#7C3AED] focus:ring-[#7C3AED] h-4 w-4 mt-0.5"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col items-center justify-center py-4", children: /* @__PURE__ */ jsx("div", { className: cn("w-16 border-2 border-dashed rounded-md flex items-center justify-center font-mono text-xs text-gray-300", option.mockupClass, imageAspectRatio === option.id ? "border-[#7C3AED]/50 bg-[#7C3AED]/10" : "border-gray-300 bg-[#0A0A0F]/80"), children: option.ratio }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-300 text-center mt-2 leading-relaxed", children: option.desc })
              ]
            },
            option.id
          )) })
        ] }),
        modalStep === 4 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-8 space-y-4", children: [
          /* @__PURE__ */ jsx(VideoLoader, { className: "h-32 w-32 text-[#7C3AED] mx-auto" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-300", children: "Generating Campaign..." }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-300 text-center max-w-xs", children: [
            "Researching ",
            focus,
            " and crafting posts based on your Brand Position."
          ] })
        ] }),
        modalStep === 5 && draftCampaign && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white", children: draftCampaign.theme }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 mt-1", children: draftCampaign.coreMessage })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Generated Posts" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-4 pr-2", children: draftCampaign.dailyPosts ? draftCampaign.dailyPosts.map((dp, idx) => /* @__PURE__ */ jsxs("div", { className: "glass-card p-4 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "font-semibold text-sm text-white", children: [
                  dp.day,
                  " ",
                  dp.date && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-300 font-normal ml-1", children: [
                    "(",
                    new Date(dp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs bg-[#1C1C22]/50 border-[#7C3AED]/20 border border-[#7C3AED]/20 px-2 py-1 rounded text-gray-300", children: dp.contentType })
              ] }),
              dp.platformVersions.map((pv, pvIdx) => /* @__PURE__ */ jsxs("div", { className: "bg-black/20 rounded-lg overflow-hidden border border-[#7C3AED]/20", children: [
                /* @__PURE__ */ jsx("div", { className: "bg-[#1C1C22]/80 border-b border-[#7C3AED]/20 px-4 py-2", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-xs text-white uppercase tracking-wider", children: pv.platform }) }),
                /* @__PURE__ */ jsx("div", { className: "p-4 flex flex-col items-center", children: /* @__PURE__ */ jsx(
                  PostPreviewModal,
                  {
                    inline: true,
                    platform: pv.platform,
                    copy: pv.copy,
                    imageUrl: pv.imageUrl || dp.imageUrl,
                    visualType: pv.visualType || dp.visualType,
                    visualData: pv.visualData || dp.visualData,
                    dna: activeProduct,
                    productName: activeProduct?.name || "",
                    productLogo: activeProduct?.logoUrl || ""
                  }
                ) })
              ] }, pvIdx))
            ] }, idx)) : draftCampaign.platformVersions.map((pv, idx) => /* @__PURE__ */ jsxs("div", { className: "glass-card overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-[#1C1C22]/80 border-b border-[#7C3AED]/20 px-4 py-2", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-xs text-white uppercase tracking-wider", children: pv.platform }) }),
              /* @__PURE__ */ jsx("div", { className: "p-4 flex flex-col items-center bg-black/20", children: /* @__PURE__ */ jsx(
                PostPreviewModal,
                {
                  inline: true,
                  platform: pv.platform,
                  copy: pv.copy,
                  imageUrl: pv.imageUrl,
                  visualType: pv.visualType,
                  visualData: pv.visualData,
                  dna: activeProduct,
                  productName: activeProduct?.name || "",
                  productLogo: activeProduct?.logoUrl || ""
                }
              ) })
            ] }, idx)) })
          ] })
        ] }),
        modalStep === 6 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-300", children: "What would you like to improve?" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-300", children: "Provide specific feedback to guide the regeneration." }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: feedback,
              onChange: (e) => setFeedback(e.target.value),
              placeholder: "e.g., Make the tone more professional, focus more on feature X...",
              rows: 4,
              className: "glass-input block w-full py-2.5 px-3 sm:text-sm"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-t border-[#7C3AED]/20 bg-[#1C1C22]/50 border-[#7C3AED]/20 flex justify-end gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowModal(false),
            className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors",
            children: "Cancel"
          }
        ),
        modalStep === 1 && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleProceedToNextStep,
            disabled: selectedChannels.length === 0,
            className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center",
            children: [
              generateImages ? "Next step" : "Generate Campaign",
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
            ]
          }
        ),
        modalStep === 2 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setModalStep(1),
              className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors",
              children: "Back"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleResearchFocus,
              className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
              children: [
                "Generate Campaign ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "ml-2 h-4 w-4" })
              ]
            }
          )
        ] }),
        modalStep === 5 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setModalStep(6),
              className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors",
              children: "Reject & Improve"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleApprove,
              className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
              children: "Approve & Schedule"
            }
          )
        ] }),
        modalStep === 6 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setModalStep(5),
              className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors",
              children: "Back to Review"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleGenerate(true),
              className: "glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
              children: "Regenerate"
            }
          )
        ] })
      ] })
    ] }) }),
    showDeleteConfirm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm", children: /* @__PURE__ */ jsx("div", { className: "glass-panel max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200", children: /* @__PURE__ */ jsxs("div", { className: "p-6 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 mb-4", children: /* @__PURE__ */ jsx(Trash2, { className: "h-6 w-6 text-red-600" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "Delete Campaigns?" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-300 mb-6", children: [
        "Are you sure you want to delete ",
        selectedCampaignIds.size,
        " selected campaign",
        selectedCampaignIds.size > 1 ? "s" : "",
        "? This action cannot be undone and will permanently remove them from the database."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowDeleteConfirm(false),
            disabled: isDeleting,
            className: "px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-[#1C1C22]/50 border-[#7C3AED]/20 rounded-lg ring-1 ring-inset ring-gray-300",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDeleteSelected,
            disabled: isDeleting,
            className: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50",
            children: isDeleting ? /* @__PURE__ */ jsx(VideoLoader, { className: "mr-2 h-7 w-7" }) : "Delete Permanently"
          }
        )
      ] })
    ] }) }) }),
    isShareModalOpen && selectedCampaign && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "glass-panel max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 border-b border-[#7C3AED]/20 flex justify-between items-center bg-[#1C1C22]/50 border-[#7C3AED]/20 ", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Share2, { className: "h-5 w-5 text-[#7C3AED]" }),
          "Share Campaign"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsShareModalOpen(false), className: "text-gray-300 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-white", children: "Enable Public Link" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-300 mt-1", children: "Anyone with the link can view this campaign." })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleToggleShare,
              disabled: isSharing || !selectedCampaign.isShared && shareDuration === "",
              className: cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2",
                selectedCampaign.isShared ? "bg-[#7C3AED]" : "bg-gray-200",
                (isSharing || !selectedCampaign.isShared && shareDuration === "") && "opacity-50 cursor-not-allowed"
              ),
              children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#1C1C22] shadow ring-0 transition duration-200 ease-in-out",
                    selectedCampaign.isShared ? "translate-x-5" : "translate-x-0"
                  )
                }
              )
            }
          )
        ] }),
        !selectedCampaign.isShared && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t border-[#7C3AED]/20", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-gray-300", children: "Feedback Window Duration" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: shareDuration,
              onChange: (e) => setShareDuration(e.target.value === "" ? "" : Number(e.target.value)),
              className: "glass-input block w-full py-2 px-3 text-sm text-white",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Select duration..." }),
                /* @__PURE__ */ jsx("option", { value: 10, children: "10 Minutes (Testing)" }),
                /* @__PURE__ */ jsx("option", { value: 1440, children: "1 Day" }),
                /* @__PURE__ */ jsx("option", { value: 4320, children: "3 Days" }),
                /* @__PURE__ */ jsx("option", { value: 10080, children: "7 Days" }),
                /* @__PURE__ */ jsx("option", { value: 20160, children: "14 Days" })
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-300", children: "Reviewers can leave feedback until this window closes." })
        ] }),
        selectedCampaign.isShared && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-orange-500 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-orange-400", children: "Feedback Window Active" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-orange-500/80 mt-0.5", children: selectedCampaign.feedbackExpiresAt ? `Closes on ${new Date(selectedCampaign.feedbackExpiresAt).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : `Closes 3 days after sharing` })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-gray-300", children: "Public Link" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  readOnly: true,
                  value: shareUrl,
                  className: "glass-input flex-1 text-sm py-2 px-3 text-gray-300"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleCopyLink,
                  className: "inline-flex items-center justify-center rounded-lg bg-[#1C1C22]/50 border-[#7C3AED]/20 px-3 py-2 text-sm font-semibold text-white hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors ring-1 ring-inset ring-white/50",
                  title: "Copy link",
                  children: copied ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleEmailLink,
              className: "w-full glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center",
              children: [
                /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4" }),
                "Share via Email"
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    previewImage && /* @__PURE__ */ jsx(ImageLightbox, { src: previewImage, onClose: () => setPreviewImage(null) }),
    previewPost && /* @__PURE__ */ jsx(
      PostPreviewModal,
      {
        platform: previewPost.platform,
        copy: previewPost.copy,
        imageUrl: previewPost.imageUrl,
        visualType: previewPost.visualType,
        visualData: previewPost.visualData,
        dna: activeProduct,
        productName: activeProduct?.name || "Product Name",
        productLogo: activeProduct?.logoUrl || activeProduct?.logoDarkUrl || activeProduct?.logoLightUrl,
        onClose: () => setPreviewPost(null)
      }
    )
  ] });
}
