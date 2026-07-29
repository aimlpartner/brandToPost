import { createPortal } from "react-dom";
import { VideoLoader } from "../components/VideoLoader";
import { useState, useEffect } from "react";
import { WeeklyCampaign, ProductDNA, PlatformPost } from "../types";
import {
  generateFieldSuggestions,
  generateCampaign,
  researchFocus,
  regenerateBlogCoverImage,
} from "../services/geminiService";
import {
  Loader2,
  Plus,
  Calendar,
  Target,
  MessageSquare,
  Zap,
  RefreshCw,
  Layers,
  Megaphone,
  Send,
  CheckCircle2,
  Sparkles,
  CalendarClock,
  Image as ImageIcon,
  X,
  ArrowRight,
  Download,
  Share2,
  Copy,
  Mail,
  Trash2,
  Clock,
  Tag,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Layout,
  Globe,
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
import { cn, formatCopy, copyFormattedText, playSuccessChime } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import {
  handleFirestoreError,
  OperationType,
  logSilentError,
} from "../lib/firestore-error";
import { ImageLoader } from "../components/ImageLoader";
import { VisualEngine } from "../components/VisualEngine";
import { ImageLightbox } from "../components/ImageLightbox";
import { PostPreviewModal } from "../components/PostPreviewModal";
import { CampaignLoaderConsole } from "../components/CampaignLoaderConsole";

import { useLocation, useNavigate } from "react-router-dom";
const getVisualDataWithImages = (
  vd: any,
  campaignImages: Record<string, string>,
) => {
  if (!vd) return vd;
  const newVd = { ...vd };
  if (newVd.baseImageId && campaignImages[newVd.baseImageId]) {
    newVd.baseImage = campaignImages[newVd.baseImageId];
  }
  return newVd;
};

const getPlatformLogo = (platform: string, isActive: boolean = false, className: string = "w-5 h-5") => {
  const p = platform.toLowerCase();
  
  if (isActive) {
    switch (p) {
      case "linkedin":
        return <FaLinkedin className={cn("text-white", className)} />;
      case "twitter":
      case "x":
        return <FaXTwitter className={cn("text-white", className)} />;
      case "facebook":
        return <FaFacebook className={cn("text-white", className)} />;
      case "instagram":
        return <FaInstagram className={cn("text-white", className)} />;
      case "tiktok":
        return <FaTiktok className={cn("text-white", className)} />;
      case "reddit":
        return <FaReddit className={cn("text-white", className)} />;
      case "youtube":
        return <FaYoutube className={cn("text-white", className)} />;
      default:
        return null;
    }
  }

  switch (p) {
    case "linkedin":
      return <FaLinkedin className={cn("text-[#0A66C2]", className)} />;
    case "twitter":
    case "x":
      return <FaXTwitter className={cn("text-slate-800 dark:text-white", className)} />;
    case "facebook":
      return <FaFacebook className={cn("text-[#1877F2]", className)} />;
    case "instagram":
      return <FaInstagram className={cn("text-[#E1306C]", className)} />;
    case "tiktok":
      return <FaTiktok className={cn("text-slate-900 dark:text-white", className)} />;
    case "reddit":
      return <FaReddit className={cn("text-[#FF4500]", className)} />;
    case "youtube":
      return <FaYoutube className={cn("text-[#FF0000]", className)} />;
    default:
      return null;
  }
};

export function Campaigns() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProduct, setActiveProductId, campaigns: allCampaigns, isLoadingCampaigns, setCampaigns } = useProducts();
  const { user } = useAuth();
  const campaigns = activeProduct 
    ? allCampaigns.filter(c => c.productId === activeProduct.id) 
    : [];
  const [campaignImages, setCampaignImages] = useState<Record<string, string>>(
    {},
  );
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generationStep, setGenerationStep] = useState<number>(1);
  const [generationTotal, setGenerationTotal] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] =
    useState<WeeklyCampaign | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [blogConfig, setBlogConfig] = useState<{ type: string; wordpress?: { url: string }; webhook?: { url: string } } | null>(null);
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);
  const [blogPublishSuccess, setBlogPublishSuccess] = useState<string | null>(null);
  const [blogPublishErrorMsg, setBlogPublishErrorMsg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [queuing, setQueuing] = useState<Record<string, boolean>>({});
  const [queued, setQueued] = useState<Record<string, boolean>>({});
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [isRegeneratingBlogImage, setIsRegeneratingBlogImage] = useState(false);

  const handleRegenerateBlogImage = async () => {
    if (!selectedCampaign || !activeProduct) return;
    setIsRegeneratingBlogImage(true);
    try {
      const res = await regenerateBlogCoverImage(selectedCampaign.id, activeProduct.id);
      setSelectedCampaign((prev: any) => prev ? {
        ...prev,
        blogImageUrl: res.blogImageUrl,
        blogImagePrompt: res.blogImagePrompt
      } : null);

      setCampaigns((prevList) => prevList.map(c => c.id === selectedCampaign.id ? {
        ...c,
        blogImageUrl: res.blogImageUrl,
        blogImagePrompt: res.blogImagePrompt
      } : c));
    } catch (err: any) {
      console.error("Failed to regenerate blog cover image:", err);
      alert(err.message || "Failed to regenerate blog cover image.");
    } finally {
      setIsRegeneratingBlogImage(false);
    }
  };

  const [previewPost, setPreviewPost] = useState<{
    platform: string;
    copy: string;
    imageUrl?: string;
    visualType?: string;
    visualData?: any;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch queue status
  useEffect(() => {
    if (!activeProduct || !user) return;

    const fetchQueue = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/schedule?productId=${activeProduct.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const newQueued: Record<string, boolean> = {};
        data.queue.forEach((item: any) => {
          const key = item.day
            ? `${item.campaignId}-${item.day}-${item.platform}`
            : `${item.campaignId}-${item.platform}`;
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
  }, [activeProduct, user]);

  const [generateImages, setGenerateImages] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // 1 = focus form, 4 = generating, 5 = review draft
  const [modalStep, setModalStep] = useState<1 | 4 | 5>(1);
  const [fieldSuggestions, setFieldSuggestions] = useState<{
    industry: string[];
    subcategory: string[];
    theme: string[];
  }>({ industry: [], subcategory: [], theme: [] });
  const [loadingSuggestions, setLoadingSuggestions] = useState<{
    industry?: boolean;
    subcategory?: boolean;
    theme?: boolean;
  }>({});

  const handleGetSuggestions = async (
    field: "industry" | "subcategory" | "theme",
  ) => {
    setLoadingSuggestions((prev) => ({ ...prev, [field]: true }));
    try {
      const suggestions = await generateFieldSuggestions(
        activeProduct,
        field,
        {
          industry: focusInput,
          subcategory: subCategory,
        },
        user?.uid,
      );
      setFieldSuggestions((prev) => ({ ...prev, [field]: suggestions }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [field]: false }));
    }
  };
  const [focusInput, setFocusInput] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [campaignTheme, setCampaignTheme] = useState("");
  const [focus, setFocus] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [draftCampaign, setDraftCampaign] = useState<WeeklyCampaign | null>(
    null,
  );
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "LinkedIn",
    "X",
    "Instagram",
    "Facebook",
    "Reddit",
  ]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<"weekly" | "oneday" | "blogs">("weekly");

  // Reset page when filters or product changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeProduct?.id, searchQuery, selectedTagFilter, sortOrder, campaignTypeFilter]);

  const [newTagInput, setNewTagInput] = useState("");
  const [openDayIdx, setOpenDayIdx] = useState<number | null>(0);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [generatedVisuals, setGeneratedVisuals] = useState<
    Record<string, string>
  >({});
  const [generatedVisualData, setGeneratedVisualData] = useState<
    Record<string, any>
  >({});
  const [warmupStatus, setWarmupStatus] = useState("");

  useEffect(() => {
    if (!isGenerating || !generationStatus.includes("Rendering")) {
      setWarmupStatus("");
      return;
    }
    const hasWarmedUp = sessionStorage.getItem("hasWarmedUpRender");
    if (hasWarmedUp) return;

    const timer = setTimeout(() => {
      setWarmupStatus(" — First render is warming up...");
      sessionStorage.setItem("hasWarmedUpRender", "true");
    }, 6000);

    return () => clearTimeout(timer);
  }, [generationStatus, isGenerating]);

  const saveImageToDb = async (campaignId: string, imageId: string, dataUrl: string) => {
    const MAX_CHUNK_SIZE = 900000;
    const userId = user?.uid;
    if (dataUrl.length > MAX_CHUNK_SIZE) {
      const numChunks = Math.ceil(dataUrl.length / MAX_CHUNK_SIZE);
      for (let i = 0; i < numChunks; i++) {
        const chunkData = dataUrl.substring(
          i * MAX_CHUNK_SIZE,
          (i + 1) * MAX_CHUNK_SIZE,
        );
        await setDoc(
          doc(
            db,
            `campaigns/${campaignId}/images`,
            `${imageId}_chunk_${i}`,
          ),
          {
            id: imageId,
            chunkIndex: i,
            totalChunks: numChunks,
            data: chunkData,
            userId: userId || "",
          },
        );
      }
    } else {
      await setDoc(
        doc(db, `campaigns/${campaignId}/images`, imageId),
        {
          id: imageId,
          data: dataUrl,
          userId: userId || "",
        },
      );
    }
  };

  const processAndCleanVisualData = async (campaignId: string, vd: any) => {
    if (!vd) return null;
    const cleanVd = JSON.parse(JSON.stringify(vd));
    
    // Remove baseImage base64 string because it is redundant and huge (already saved in images collection)
    delete cleanVd.baseImage;
    
    // Check if user uploaded a new background image base64
    if (cleanVd.editorState) {
      const bg = cleanVd.editorState.baseBg;
      if (bg && bg.startsWith("data:image")) {
        const newBgId = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        
        try {
          await saveImageToDb(campaignId, newBgId, bg);
          setCampaignImages((prev) => ({ ...prev, [newBgId]: bg }));
          cleanVd.baseImageId = newBgId;
        } catch (e) {
          console.error("Failed to save custom uploaded baseBg background:", e);
        }
      }
      // Delete the massive baseBg from editorState as it is redundant and huge (we can load it on open dynamically)
      delete cleanVd.editorState.baseBg;
    }
    
    // Preserve baseImageId if it already exists and wasn't just set above
    // This prevents the field from being lost during visual data cleaning
    if (vd.baseImageId && !cleanVd.baseImageId) {
      cleanVd.baseImageId = vd.baseImageId;
    }
    
    return cleanVd;
  };

  const handleSetGeneratedVisual = async (
    key: string,
    url: string,
    newVisualData?: any,
  ) => {
    // 1. Sync React UI States Instantly
    setGeneratedVisuals((prev) => ({ ...prev, [key]: url }));
    if (newVisualData) {
      setGeneratedVisualData((prev) => ({ ...prev, [key]: newVisualData }));
    }

    // 2. Creation Flow / Draft Campaign - Synchronize Same-Day Channels
    if (key.startsWith("draft-daily-")) {
      const parts = key.split("-"); // ["draft", "daily", dayIdx, pvIdx]
      const dayIdx = parseInt(parts[2]);
      if (draftCampaign && draftCampaign.dailyPosts && draftCampaign.dailyPosts[dayIdx]) {
        const dp = draftCampaign.dailyPosts[dayIdx];
        dp.platformVersions.forEach((p, pIdx) => {
          const syncKey = `draft-daily-${dayIdx}-${pIdx}`;
          setGeneratedVisuals((prev) => ({ ...prev, [syncKey]: url }));
          if (newVisualData) {
            setGeneratedVisualData((prev) => ({ ...prev, [syncKey]: newVisualData }));
          }
        });
      }
      return;
    }

    // 3. Saved Campaign Editing - Persist to Database and Propagate to Same-Day Channels
    if (selectedCampaign) {
      const campaignId = selectedCampaign.id;
      const updatedCampaign = JSON.parse(JSON.stringify(selectedCampaign)) as WeeklyCampaign;
      let hasChanged = false;

      if (key.startsWith(campaignId + "-")) {
        const remaining = key.substring(campaignId.length + 1); // e.g., "Monday-LinkedIn" or "LinkedIn"
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const matchedDay = days.find((day) => remaining.startsWith(day + "-"));

        const processedVisualData = newVisualData ? await processAndCleanVisualData(campaignId, newVisualData) : undefined;

        if (matchedDay && updatedCampaign.dailyPosts) {
          // This is a dynamic daily post. Sync all channels for this day.
          const dayIdx = updatedCampaign.dailyPosts.findIndex((dp) => dp.day === matchedDay);
          if (dayIdx !== -1) {
            const dp = updatedCampaign.dailyPosts[dayIdx];
            const newImageId =
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

            // Upload image to database if logged in
            if (user) {
              try {
                await saveImageToDb(campaignId, newImageId, url);
              } catch (err) {
                console.error("Failed to save updated image chunk:", err);
                logSilentError(err as Error, { context: "saveImageToDb_inline", campaignId });
              }
            }

            // Put it in local cache so UI displays it immediately
            setCampaignImages((prev) => ({ ...prev, [newImageId]: url }));

            // Propagate visual data and new image to all other platform posts of this exact day
            dp.platformVersions.forEach((pv) => {
              pv.imageId = newImageId;
              delete pv.imageUrl;
              // Mark as flattened so display pipeline shows static JPEG (no re-rendering)
              (pv as any).isFlattened = true;
              if (processedVisualData) {
                pv.visualData = processedVisualData;
              }

              // Sync the individual platform UI states so they update in list instantaneously
              const syncKey = `${campaignId}-${matchedDay}-${pv.platform}`;
              setGeneratedVisuals((prev) => ({ ...prev, [syncKey]: url }));
              if (processedVisualData) {
                setGeneratedVisualData((prev) => ({ ...prev, [syncKey]: processedVisualData }));
              }
            });
            
            // Mark the daily post itself as flattened
            (dp as any).isFlattened = true;

            hasChanged = true;
          }
        } else {
          // Top-level repurposed platform version editing
          const platformName = remaining; // "LinkedIn", "X", etc.
          if (updatedCampaign.platformVersions) {
            const pvIdx = updatedCampaign.platformVersions.findIndex((pv) => pv.platform === platformName);
            if (pvIdx !== -1) {
              const pv = updatedCampaign.platformVersions[pvIdx];
              const newImageId =
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

              if (user) {
                try {
                  await saveImageToDb(campaignId, newImageId, url);
                } catch (err) {
                  console.error("Failed to save repurposed post image chunk:", err);
                }
              }
              setCampaignImages((prev) => ({ ...prev, [newImageId]: url }));

              pv.imageId = newImageId;
              delete pv.imageUrl;
              // Mark as flattened so display pipeline shows static JPEG
              (pv as any).isFlattened = true;
              if (processedVisualData) {
                pv.visualData = processedVisualData;
              }
              hasChanged = true;
            }
          }
        }

        if (hasChanged) {
          try {
            if (user) {
              const cleanCampaign = JSON.parse(JSON.stringify(updatedCampaign));
              await setDoc(doc(db, "campaigns", campaignId), cleanCampaign);
            } else {
              // LocalStorage Fallback for guests
              const savedList = localStorage.getItem("campaigns");
              if (savedList) {
                const parsed: WeeklyCampaign[] = JSON.parse(savedList);
                const newCampaigns = parsed.map((c) => (c.id === campaignId ? updatedCampaign : c));
                localStorage.setItem("campaigns", JSON.stringify(newCampaigns));
              }
            }

            // Sync visual campaign lists and state
            setSelectedCampaign(updatedCampaign);
            setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updatedCampaign : c)));
          } catch (err) {
            console.error("Failed to persist updated campaign doc after visual edits:", err);
            logSilentError(err as Error, { context: "persist_visual_edits", campaignId });
          }
        }
      }
    }
  };

  useEffect(() => {
    if (showModal || showDeleteConfirm || isShareModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal, showDeleteConfirm, isShareModalOpen]);

  const handleCopyText = async (text: string, key: string) => {
    await copyFormattedText(text);
    setCopiedState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const [downloadingKeys, setDownloadingKeys] = useState<Record<string, boolean>>({});

  const handleDownloadImageBlob = async (url: string, filename: string) => {
    try {
      if (url.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      console.warn("Direct blob download failed, falling back to direct link", e);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    handleDownloadImageBlob(url, filename);
  };

  const handleDownloadVisualCard = async (
    publishKey: string,
    pv: any,
    dp?: any,
    fallbackFilename?: string
  ) => {
    setDownloadingKeys((prev) => ({ ...prev, [publishKey]: true }));
    try {
      const rawVisual = (pv as any)?.visualData || (typeof dp !== "undefined" ? dp?.visualData : undefined);
      const visualData =
        generatedVisualData[publishKey] ||
        getVisualDataWithImages(rawVisual, campaignImages) ||
        rawVisual;

      const filename = fallbackFilename || `post_visual_${pv?.platform || 'card'}.png`;

      // 1. FIRST Priority: If V3 visual template exists (renderedHtml / customHtml), render full 1080x1080 visual card
      if (visualData?.renderedHtml || visualData?.customHtml) {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        const res = await fetch("/api/render-visual", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            visualType: "custom-overlay",
            visualData: {
              ...visualData,
              renderedHtml: visualData.renderedHtml || visualData.customHtml
            },
            imageUrl: visualData?.imageUrl || pv?.imageUrl || dp?.imageUrl || "",
            dna: activeProduct,
            fallbackText: activeProduct?.name || "",
          }),
        });
        const data = await res.json();
        if (data.url) {
          await handleDownloadImageBlob(data.url, filename);
          return;
        }
      }

      // 2. Second Priority: Pre-rendered flattened image URL or image asset
      const existingUrl =
        generatedVisuals[publishKey] ||
        pv?.imageUrl ||
        (pv?.imageId ? campaignImages[pv.imageId] : undefined) ||
        (dp?.imageUrl) ||
        (dp?.imageId ? campaignImages[dp.imageId] : undefined);

      if (existingUrl) {
        await handleDownloadImageBlob(existingUrl, filename);
      } else {
        alert("No visual asset found to download.");
      }
    } catch (err: any) {
      console.error("Failed to download visual card:", err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloadingKeys((prev) => ({ ...prev, [publishKey]: false }));
    }
  };

  // Derived state for all unique tags
  const allTags = Array.from(
    new Set(campaigns.flatMap((c) => c.tags || [])),
  ).sort();

  // Filtered and sorted campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      const isOneDay = c.isOneDay === true;
      const isBlog = c.isBlog === true;
      if (campaignTypeFilter === "blogs") {
        if (!isBlog) return false;
      } else if (campaignTypeFilter === "oneday") {
        if (!isOneDay || isBlog) return false;
      } else {
        if (isOneDay || isBlog) return false;
      }

      if (selectedTagFilter && (!c.tags || !c.tags.includes(selectedTagFilter)))
        return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTheme = c.theme?.toLowerCase().includes(query);
        const matchesPillar = c.pillar?.toLowerCase().includes(query);

        const createdDate = new Date(c.createdAt)
          .toLocaleDateString()
          .toLowerCase();
        const startDate = c.startDate
          ? new Date(c.startDate).toLocaleDateString().toLowerCase()
          : "";
        const matchesDate =
          createdDate.includes(query) ||
          startDate.includes(query) ||
          c.startDate?.toLowerCase().includes(query) ||
          c.createdAt?.toLowerCase().includes(query);

        if (!matchesTheme && !matchesPillar && !matchesDate) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const activeProductCampaigns = filteredCampaigns.filter(
    (c) => c.productId === activeProduct?.id
  );

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(activeProductCampaigns.length / ITEMS_PER_PAGE);
  const paginatedCampaigns = activeProductCampaigns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Utility functions for dates
  const getMonday = (date: Date, offsetWeeks: number = 0) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff + offsetWeeks * 7);
    return d;
  };

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const displayDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const today = new Date();
  const nextMonday = getMonday(today, 1);
  const followingMonday = getMonday(today, 2);

  const availableChannels = [
    "LinkedIn",
    "X",
    "Instagram",
    "Facebook",
    "Reddit",
  ];

  const handleToggleShare = async () => {
    if (!selectedCampaign || !user) return;
    setIsSharing(true);
    try {
      const isNowShared = !selectedCampaign.isShared;
      const updatedCampaign: WeeklyCampaign = {
        ...selectedCampaign,
        isShared: isNowShared,
        sharedAt: isNowShared ? (selectedCampaign.sharedAt || new Date().toISOString()) : undefined
      };
      delete (updatedCampaign as any).feedbackExpiresAt;
      delete (updatedCampaign as any).feedbackProcessed;

      // Remove any undefined fields to prevent Firestore errors
      Object.keys(updatedCampaign).forEach((key) => {
        if (
          updatedCampaign[key as keyof typeof updatedCampaign] === undefined
        ) {
          delete updatedCampaign[key as keyof typeof updatedCampaign];
        }
      });

      await setDoc(doc(db, "campaigns", selectedCampaign.id), updatedCampaign);
      setSelectedCampaign(updatedCampaign);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)),
      );
    } catch (err) {
      logSilentError(err as Error, {
        context: "toggleShareStatus",
        campaignId: selectedCampaign.id,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getShareUrl = (campaignId: string) => {
    const origin = window.location.origin;
    // If we are in the dev environment, replace ais-dev- with ais-pre- for the public link
    const publicOrigin = origin.replace("ais-dev-", "ais-pre-");
    return `${publicOrigin}/shared/${campaignId}`;
  };

  const shareUrl = selectedCampaign ? getShareUrl(selectedCampaign.id) : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailLink = async () => {
    if (!selectedCampaign || !activeProduct) return;
    try {
      // 1. Generate & download the campaign PDF report
      const { generateCampaignPDF } = await import("../lib/pdfGenerator");
      const pdf = await generateCampaignPDF(
        selectedCampaign,
        activeProduct!
      );
      const filename = `${(selectedCampaign.theme || "campaign").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.pdf`;
      pdf.save(filename);

      // 2. Draft email subject and body
      const subject = encodeURIComponent(
        `Campaign Overview: ${selectedCampaign.theme || 'BrandToPost Campaign'}`
      );
      const body = encodeURIComponent(
        `Hi,\n\nI wanted to share the latest marketing campaign created for ${activeProduct.name}:\n\n` +
        `📌 Theme: ${selectedCampaign.theme || 'N/A'}\n` +
        `🎯 Core Message: ${selectedCampaign.coreMessage || 'N/A'}\n` +
        `🔗 View Online Campaign: ${shareUrl}\n\n` +
        `📎 Note: The complete PDF Campaign Report (${filename}) has been generated and downloaded to your computer so you can easily attach it to this email!\n\n` +
        `Best regards,`
      );

      // 3. Open Gmail compose window in a new tab (or fallback to mailto:)
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
      const win = window.open(gmailUrl, "_blank");
      if (!win) {
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    } catch (err) {
      logSilentError(err as Error, {
        context: "handleEmailLink",
        campaignId: selectedCampaign.id,
      });
    }
  };

  // Cleaned up redundant network fetching on mount to allow 0ms page rendering transition

  useEffect(() => {
    if (activeProduct) {
      const typeFiltered = campaigns.filter((c) => {
        if (c.productId !== activeProduct.id) return false;
        const isOneDay = c.isOneDay === true;
        const isBlog = c.isBlog === true;
        if (campaignTypeFilter === "blogs") {
          return isBlog;
        } else if (campaignTypeFilter === "oneday") {
          return isOneDay && !isBlog;
        } else {
          return !isOneDay && !isBlog;
        }
      });

      if (typeFiltered.length > 0) {
        setSelectedCampaign((prev) => {
          if (prev && typeFiltered.find((c) => c.id === prev.id)) {
            return prev;
          }
          return typeFiltered[0];
        });
      } else {
        setSelectedCampaign(null);
      }
    } else {
      setSelectedCampaign(null);
    }
  }, [campaignTypeFilter, activeProduct?.id, campaigns]);

  useEffect(() => {
    if (!activeProduct || !user) return;

    let isCancelled = false;

    const checkStatuses = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers: HeadersInit = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const fetchStatus = async (platform: string) => {
          try {
            const res = await fetch(
              `/api/${platform}/status?productId=${activeProduct.id}`,
              { headers },
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return !!data.connected;
          } catch (err) {
            logSilentError(err as Error, {
              context: `fetch${platform.charAt(0).toUpperCase() + platform.slice(1)}StatusInCampaigns`,
            });
            return false;
          }
        };

        const [linkedinConnected, instagramConnected] = await Promise.all([
          fetchStatus("linkedin"),
          fetchStatus("instagram"),
        ]);

        if (!isCancelled) {
          setIsLinkedinConnected(linkedinConnected);
          setIsInstagramConnected(instagramConnected);
        }

        try {
          const res = await fetch(`/api/blog/config?productId=${activeProduct.id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled) {
              setBlogConfig(data);
            }
          }
        } catch (e) {
          logSilentError(e as Error, { context: "fetchBlogConfigInCampaigns" });
        }
      } catch (err) {
        logSilentError(err as Error, { context: "checkStatusesInCampaigns" });
      }
    };

    checkStatuses();

    return () => {
      isCancelled = true;
    };
  }, [activeProduct, user]);

  useEffect(() => {
    if (!selectedCampaign || !user) return;

    const fetchImages = async () => {
      setIsFetchingImages(true);
      try {
        const imagesRef = collection(
          db,
          `campaigns/${selectedCampaign.id}/images`,
        );
        const snapshot = await getDocs(imagesRef);
        const newImages: Record<string, string> = {};
        const chunks: Record<
          string,
          { index: number; data: string; total: number }[]
        > = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.totalChunks) {
            if (!chunks[data.id]) chunks[data.id] = [];
            chunks[data.id].push({
              index: data.chunkIndex,
              data: data.data,
              total: data.totalChunks,
            });
          } else {
            newImages[doc.id] = data.data;
          }
        });

        // Reassemble chunked images
        for (const [id, imageChunks] of Object.entries(chunks)) {
          imageChunks.sort((a, b) => a.index - b.index);
          newImages[id] = imageChunks.map((c) => c.data).join("");
        }

        setCampaignImages(newImages);
      } catch (err) {
        logSilentError(err as Error, {
          context: "fetchCampaignImages",
          campaignId: selectedCampaign.id,
        });
      } finally {
        setIsFetchingImages(false);
      }
    };

    fetchImages();
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

    setGenerationTotal(generateImages ? 4 : 3);
    setGenerationStep(1);
    setGenerationStatus(
      `Tror is analyzing ${finalFocus} and gathering market intelligence...`,
    );

    try {
      const result = await researchFocus(
        finalFocus,
        selectedChannels,
        subCategory,
        user?.uid,
      );
      setInsights(result);

      setGenerationStep(2);
      setGenerationStatus(
        `Tror is drafting your posts using your Brand DNA...`,
      );

      // Extract recent layout history from existing campaigns of this product to rotation-safeguard
      const recentLayoutHistory: string[] = [];
      if (campaigns) {
        const productCampaigns = campaigns
          .filter((c: any) => c.productId === activeProduct?.id)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        for (const camp of productCampaigns) {
          if (camp.dailyPosts) {
            for (const dp of camp.dailyPosts) {
              const lid = dp.layoutId || dp.visualData?.layoutId || dp.visualData?.layout?.layoutId;
              if (lid) recentLayoutHistory.push(lid);
            }
          }
          if (recentLayoutHistory.length >= 12) break;
        }
      }

      const newCampaignData = await generateCampaign(
        activeProduct!,
        finalFocus,
        result,
        generateImages,
        selectedChannels,
        campaignTheme,
        subCategory,
        user?.uid,
        (step, total, msg) => {
          setGenerationStep(step + 1);
          setGenerationTotal(total + 1);
          setGenerationStatus(msg);
        },
        undefined,
        recentLayoutHistory
      );

      const dayOffsets: Record<string, number> = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

      if (newCampaignData.dailyPosts) {
        newCampaignData.dailyPosts = newCampaignData.dailyPosts.map((dp) => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = new Date(selectedStartDate + "T12:00:00Z"); // use noon UTC to avoid timezone shifts
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: formatDate(postDate) };
        });
      }

      const newCampaign: WeeklyCampaign = {
        ...newCampaignData,
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct!.id,
        createdAt: new Date().toISOString(),
        startDate: selectedStartDate,
        focus: finalFocus,
        subCategory: subCategory,
        campaignThemeInput: campaignTheme,
      };

      // Save directly to Firestore for direct presentation (No approval step friction)
      if (user && db) {
        try {
          const campaignToSave = JSON.parse(
            JSON.stringify({
              ...newCampaign,
              userId: user.uid,
              productName: activeProduct!.name,
              productLogoUrl:
                activeProduct!.logoUrl ||
                activeProduct!.logoDarkUrl ||
                activeProduct!.logoLightUrl ||
                null,
            })
          );
          await setDoc(doc(db, "campaigns", newCampaign.id), campaignToSave);
        } catch (fsErr) {
          logSilentError(fsErr as Error, { context: "directSaveCampaign" });
        }
      }

      playSuccessChime();
      setSelectedCampaign(newCampaign);
      setShowModal(false);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleResearchFocus" });
      setError(err.message || "Failed to generate campaign. Please try again.");
      setModalStep(1);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleApprove = async () => {
    if (!draftCampaign || !user || isApproving) return;

    setIsApproving(true);
    // Save campaign to Firestore
    try {
      const campaignToSave = JSON.parse(
        JSON.stringify({
          ...draftCampaign,
          userId: user.uid,
          productName: activeProduct.name,
          productLogoUrl:
            activeProduct.logoUrl ||
            activeProduct.logoDarkUrl ||
            activeProduct.logoLightUrl ||
            null,
        }),
      );

      // Extract images to save separately to avoid 1MB document limit
      const imagesToSave: { id: string; data: string }[] = [];
      const getUniqueId = () =>
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);

      if (campaignToSave.platformVersions) {
        campaignToSave.platformVersions.forEach((pv: any, idx: number) => {
          const genKey = `draft-platform-${idx}`;
          if (generatedVisuals[genKey]) {
            pv.imageUrl = generatedVisuals[genKey];
          }
          if (generatedVisualData[genKey]) {
            pv.visualData = generatedVisualData[genKey];
          }
          if (pv.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: pv.imageUrl });
            pv.imageId = imageId;
            delete pv.imageUrl;
          }
          if (pv.visualData?.baseImage) {
            const existing = imagesToSave.find(
              (img) => img.data === pv.visualData.baseImage,
            );
            if (existing) {
              pv.visualData.baseImageId = existing.id;
            } else {
              const imageId = getUniqueId();
              imagesToSave.push({ id: imageId, data: pv.visualData.baseImage });
              pv.visualData.baseImageId = imageId;
            }
            delete pv.visualData.baseImage;
          }
          if (pv.visualData?.editorState?.baseBg) {
            delete pv.visualData.editorState.baseBg;
          }
        });
      }

      if (campaignToSave.dailyPosts) {
        campaignToSave.dailyPosts.forEach((dp: any, idx: number) => {
          if (dp.platformVersions) {
            dp.platformVersions.forEach((pv: any, pvIdx: number) => {
              const genKey = `draft-daily-${idx}-${pvIdx}`;
              if (generatedVisuals[genKey]) {
                pv.imageUrl = generatedVisuals[genKey];
              }
              if (generatedVisualData[genKey]) {
                pv.visualData = generatedVisualData[genKey];
              }
            });
          }
          if (dp.imageUrl) {
            const imageId = getUniqueId();
            imagesToSave.push({ id: imageId, data: dp.imageUrl });
            dp.imageId = imageId;
            delete dp.imageUrl;
          }
          if (dp.visualData?.baseImage) {
            const existing = imagesToSave.find(
              (img) => img.data === dp.visualData.baseImage,
            );
            if (existing) {
              dp.visualData.baseImageId = existing.id;
            } else {
              const imageId = getUniqueId();
              imagesToSave.push({ id: imageId, data: dp.visualData.baseImage });
              dp.visualData.baseImageId = imageId;
            }
            delete dp.visualData.baseImage;
          }
          if (dp.visualData?.editorState?.baseBg) {
            delete dp.visualData.editorState.baseBg;
          }
          if (dp.platformVersions) {
            dp.platformVersions.forEach((pv: any) => {
              if (pv.imageUrl) {
                const existing = imagesToSave.find(
                  (img) => img.data === pv.imageUrl,
                );
                if (existing) {
                  pv.imageId = existing.id;
                } else {
                  const imageId = getUniqueId();
                  imagesToSave.push({ id: imageId, data: pv.imageUrl });
                  pv.imageId = imageId;
                }
                delete pv.imageUrl;
              }
              if (pv.visualData?.baseImage) {
                const existing = imagesToSave.find(
                  (img) => img.data === pv.visualData.baseImage,
                );
                if (existing) {
                  pv.visualData.baseImageId = existing.id;
                } else {
                  const imageId = getUniqueId();
                  imagesToSave.push({
                    id: imageId,
                    data: pv.visualData.baseImage,
                  });
                  pv.visualData.baseImageId = imageId;
                }
                delete pv.visualData.baseImage;
              }
              if (pv.visualData?.editorState?.baseBg) {
                delete pv.visualData.editorState.baseBg;
              }
            });
          }
        });
      }

      await setDoc(doc(db, "campaigns", draftCampaign.id), campaignToSave);

      // Save images to subcollection, chunking if necessary
      const newCampaignImages: Record<string, string> = {};
      for (const img of imagesToSave) {
        newCampaignImages[img.id] = img.data;
        const MAX_CHUNK_SIZE = 900000; // ~900KB to stay safely under 1MB limit
        if (img.data.length > MAX_CHUNK_SIZE) {
          const numChunks = Math.ceil(img.data.length / MAX_CHUNK_SIZE);
          for (let i = 0; i < numChunks; i++) {
            const chunkData = img.data.substring(
              i * MAX_CHUNK_SIZE,
              (i + 1) * MAX_CHUNK_SIZE,
            );
            await setDoc(
              doc(
                db,
                `campaigns/${draftCampaign.id}/images`,
                `${img.id}_chunk_${i}`,
              ),
              {
                id: img.id,
                chunkIndex: i,
                totalChunks: numChunks,
                data: chunkData,
                userId: user.uid,
              },
            );
          }
        } else {
          await setDoc(
            doc(db, `campaigns/${draftCampaign.id}/images`, img.id),
            {
              id: img.id,
              data: img.data,
              userId: user.uid,
            },
          );
        }
      }

      setCampaignImages((prev) => ({ ...prev, ...newCampaignImages }));
      setSelectedCampaign(campaignToSave);
      setShowModal(false);

      // Auto-queue and PDF email delivery in the background
      (async () => {
        try {
          if (draftCampaign.dailyPosts) {
            for (const dp of draftCampaign.dailyPosts) {
              if (dp.platformVersions) {
                for (const pv of dp.platformVersions) {
                  await handleQueue(
                    pv.platform,
                    formatCopy(pv.copy),
                    draftCampaign.id,
                    dp.day,
                    dp.date,
                    pv.imageUrl || dp.imageUrl || (pv.imageId ? newCampaignImages[pv.imageId] : undefined) || (dp.imageId ? newCampaignImages[dp.imageId] : undefined),
                  );
                }
              }
            }
          } else if (draftCampaign.platformVersions) {
            for (const pv of draftCampaign.platformVersions) {
              await handleQueue(
                pv.platform,
                formatCopy(pv.copy),
                draftCampaign.id,
                undefined,
                undefined,
                pv.imageUrl || (pv.imageId ? newCampaignImages[pv.imageId] : undefined),
              );
            }
          }

          // Trigger Interactive Email Approval for the Campaign / Blog / Post
          try {
            const token = await auth.currentUser?.getIdToken();
            const itemType = campaignToSave.isBlog ? 'blog' : (campaignToSave.isOneDay ? 'post' : 'campaign');
            const itemTitle = campaignToSave.blogTitle || campaignToSave.theme || "Generated Campaign";
            const itemPreview = campaignToSave.blogContent || campaignToSave.coreMessage || campaignToSave.hook || "";

            const approvalRes = await fetch("/api/approval/trigger", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                productId: activeProduct!.id,
                productName: activeProduct!.name,
                itemType,
                itemTitle,
                itemPreview,
                itemData: campaignToSave,
              }),
            });
            if (approvalRes.ok) {
              const apprData = await approvalRes.json();
              if (apprData.approvedInstantly) {
                console.log("Content approved & published instantly based on product settings.");
              } else {
                console.log("Approval email sent to user. Waiting for approval or 12h timeout.");
              }
            }
          } catch (apprErr) {
            console.warn("Failed to trigger email approval request:", apprErr);
          }

          // Send PDF to email
          try {
            const { generateCampaignPDF } = await import("../lib/pdfGenerator");
            const pdfDoc = await generateCampaignPDF(
              campaignToSave,
              activeProduct!,
            );
            const pdfBase64 = pdfDoc.output("datauristring");

            const token = await auth.currentUser?.getIdToken();
            const emailRes = await fetch("/api/campaigns/email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                email: user.email,
                pdfBase64,
                campaignTheme: campaignToSave.theme,
              }),
            });

            if (!emailRes.ok) {
              const emailData = await emailRes.json();
              console.warn(`Campaign saved and closed, but background PDF email failed: ${emailData.error}`);
            }

            // Check and trigger first campaign success email
            try {
              const { doc, getDoc, updateDoc } = await import("firebase/firestore");
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                if (!userData.firstCampaignEmailSent) {
                  // Optimistically update flag to prevent duplicate calls
                  await updateDoc(userRef, { firstCampaignEmailSent: true });
                  const { triggerBrandedEmail } = await import("../lib/emailTriggers");
                  await triggerBrandedEmail("first_campaign", user.email, { theme: campaignToSave.theme });
                }
              }
            } catch (fcErr) {
              logSilentError(fcErr as Error, { context: "firstCampaignEmailTrigger" });
            }
          } catch (emailErr) {
            logSilentError(emailErr as Error, { context: "sendEmailShare" });
          }
        } catch (backgroundErr) {
          console.error("Background approval tasks failed:", backgroundErr);
        }
      })();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `campaigns/${draftCampaign.id}`,
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handlePublishBlog = async (campaign: WeeklyCampaign) => {
    if (!activeProduct) return;
    setIsPublishingBlog(true);
    setBlogPublishSuccess(null);
    setBlogPublishErrorMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: activeProduct.id,
          campaignId: campaign.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish blog post');
      }

      if (blogConfig?.type === 'wordpress') {
        setBlogPublishSuccess(`Blog post published successfully!`);
        setSelectedCampaign((prev) => {
          if (prev && prev.id === campaign.id) {
            return {
              ...prev,
              publishedBlogUrl: data.url,
              publishedAt: new Date().toISOString()
            };
          }
          return prev;
        });
      } else {
        setBlogPublishSuccess('Blog payload delivered successfully to Webhook endpoint!');
        setSelectedCampaign((prev) => {
          if (prev && prev.id === campaign.id) {
            return {
              ...prev,
              publishedBlogUrl: 'Webhook Delivered',
              publishedAt: new Date().toISOString()
            };
          }
          return prev;
        });
      }
    } catch (err: any) {
      logSilentError(err as Error, { context: "handlePublishBlog" });
      setBlogPublishErrorMsg(err.message || 'Error publishing blog.');
    } finally {
      setIsPublishingBlog(false);
    }
  };

  const handlePublish = async (
    platform: string,
    copy: string,
    campaignId: string,
    day?: string,
    imageUrl?: string,
  ) => {
    const normPlatform = platform.toLowerCase();
    if (
      (normPlatform !== "linkedin" && normPlatform !== "instagram") ||
      !activeProduct
    )
      return;

    const publishKey = day
      ? `${campaignId}-${day}-${platform}`
      : `${campaignId}-${platform}`;
    setPublishing((prev) => ({ ...prev, [publishKey]: true }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const endpoint =
        normPlatform === "instagram"
          ? "/api/instagram/publish"
          : "/api/linkedin/publish";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: copy,
          productId: activeProduct.id,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }

      setPublished((prev) => ({ ...prev, [publishKey]: true }));
      setTimeout(() => {
        setPublished((prev) => ({ ...prev, [publishKey]: false }));
      }, 3000);
    } catch (err: any) {
      setError(`Error publishing to ${platform}: ${err.message}`);
    } finally {
      setPublishing((prev) => ({ ...prev, [publishKey]: false }));
    }
  };

  const handleQueue = async (
    platform: string,
    copy: string,
    campaignId: string,
    day?: string,
    date?: string,
    imageUrl?: string,
  ) => {
    if (!activeProduct) return;
    const queueKey = day
      ? `${campaignId}-${day}-${platform}`
      : `${campaignId}-${platform}`;
    setQueuing((prev) => ({ ...prev, [queueKey]: true }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/schedule/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: copy,
          campaignId,
          platform,
          productId: activeProduct.id,
          day,
          date,
          imageUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to queue post");
      }

      setQueued((prev) => ({ ...prev, [queueKey]: true }));
    } catch (err: any) {
      setError(`Error queuing post: ${err.message}`);
    } finally {
      setQueuing((prev) => ({ ...prev, [queueKey]: false }));
    }
  };

  const handleUnqueue = async (
    platform: string,
    campaignId: string,
    day?: string,
  ) => {
    if (!activeProduct) return;
    const queueKey = day
      ? `${campaignId}-${day}-${platform}`
      : `${campaignId}-${platform}`;
    setQueuing((prev) => ({ ...prev, [queueKey]: true }));

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/schedule/queue/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          campaignId,
          platform,
          productId: activeProduct.id,
          day,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove from queue");
      }

      setQueued((prev) => ({ ...prev, [queueKey]: false }));
    } catch (err: any) {
      setError(`Error removing from queue: ${err.message}`);
    } finally {
      setQueuing((prev) => ({ ...prev, [queueKey]: false }));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCampaignIds.size === 0) return;
    setIsDeleting(true);
    const idsToDelete = new Set(selectedCampaignIds);
    try {
      // Delete from Firestore only if user is logged in
      if (user) {
        for (const id of idsToDelete) {
          try {
            await deleteDoc(doc(db, "campaigns", id));
          } catch (e: any) {
            handleFirestoreError(e, OperationType.DELETE, `campaigns/${id}`);
          }
        }
      }

      // Update local state
      const updatedCampaigns = campaigns.filter(
        (c) => !idsToDelete.has(c.id),
      );
      setCampaigns(updatedCampaigns);

      // Update local storage
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));

      // Clear selection
      setSelectedCampaignIds(new Set());
      setIsSelectionMode(false);
      setShowDeleteConfirm(false);

      // If selected campaign was deleted, clear it
      if (selectedCampaign && idsToDelete.has(selectedCampaign.id)) {
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
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updatedCampaign : c)),
      );
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
      setNewTagInput("");
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `campaigns/${campaignId}`,
      );
    }
  };

  const handleRemoveTag = async (campaignId: string, tagToRemove: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    const updatedTags = (campaign.tags || []).filter((t) => t !== tagToRemove);
    const updatedCampaign = { ...campaign, tags: updatedTags };

    try {
      await setDoc(doc(db, "campaigns", campaignId), updatedCampaign);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? updatedCampaign : c)),
      );
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(updatedCampaign);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `campaigns/${campaignId}`,
      );
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
    const productCampaigns = campaigns.filter(
      (c) => c.productId === activeProduct?.id,
    );
    if (selectedCampaignIds.size === productCampaigns.length) {
      setSelectedCampaignIds(new Set());
    } else {
      const allIds = productCampaigns.map((c) => c.id);
      setSelectedCampaignIds(new Set(allIds));
    }
  };

  useEffect(() => {
    if (location.search.includes("create=true") && activeProduct) {
      if (!showModal) {
        handleStartGeneration();
      }
      navigate("/dashboard/campaigns", { replace: true });
    }
  }, [location.search, activeProduct, showModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const campaignId = params.get("id") || params.get("campaignId");
    if (campaignId && campaigns.length > 0) {
      const found = campaigns.find((c) => c.id === campaignId);
      if (found) {
        setSelectedCampaign(found);
        if (found.productId && (!activeProduct || found.productId !== activeProduct.id)) {
          setActiveProductId(found.productId);
        }
      }
    }
  }, [location.search, campaigns, activeProduct, setActiveProductId]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div
        className={cn(
          "w-full lg:w-1/3 flex flex-col gap-4 h-full",
          selectedCampaign ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="tour-campaigns-header">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 font-display">
              Campaigns
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-light">
              Turn your Brand Position into Outreach and Signal.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button
              id="trigger-create-campaign"
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="tour-campaigns-generate-btn glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold hidden md:inline-flex items-center justify-center"
            >
              {isGenerating ? (
                <VideoLoader className="mr-1.5 h-7 w-7" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Generate
            </button>
          </div>
        </div>

        {/* View Switcher for Weekly Campaigns vs 1-Day Posts vs Blogs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-sm shrink-0">
          <button
            onClick={() => setCampaignTypeFilter("weekly")}
            className={cn(
              "flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all duration-200",
              campaignTypeFilter === "weekly"
                ? "bg-white text-violet-600 shadow-sm font-bold border border-slate-200/30"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Weekly Campaigns
          </button>
          <button
            onClick={() => setCampaignTypeFilter("oneday")}
            className={cn(
              "flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all duration-200",
              campaignTypeFilter === "oneday"
                ? "bg-white text-violet-600 shadow-sm font-bold border border-slate-200/30"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            1-Day Posts
          </button>
          <button
            onClick={() => setCampaignTypeFilter("blogs")}
            className={cn(
              "flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all duration-200",
              campaignTypeFilter === "blogs"
                ? "bg-white text-violet-600 shadow-sm font-bold border border-slate-200/30"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Blogs & Newsletters
          </button>
        </div>

        {!showModal && error && (
          <div className="rounded-xl bg-red-500/10 p-4 border border-red-100">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {campaigns.filter((c) => c.productId === activeProduct?.id).length >
          0 && (
          <div className="flex flex-col gap-3 px-2 py-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedCampaignIds(new Set());
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-[#7C3AED] transition-colors"
                >
                  {isSelectionMode ? "Cancel Selection" : "Select"}
                </button>
                {isSelectionMode && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-medium text-[#7C3AED] hover:text-slate-700 transition-colors"
                  >
                    {selectedCampaignIds.size ===
                    filteredCampaigns.filter(
                      (c) => c.productId === activeProduct?.id,
                    ).length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>
              {isSelectionMode && selectedCampaignIds.size > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedCampaignIds.size})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto hide-scroll-when-modal glass-panel border border-slate-200 shadow-sm divide-y divide-slate-100 bg-white/40 pb-[70px] sm:pb-0">
          {isLoadingCampaigns ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-[#7C3AED] animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="absolute w-6 h-6 rounded-full bg-[#7C3AED]/20 animate-ping"></div>
              </div>
              <h3 className="text-base font-bold text-slate-800 font-display">
                Loading Campaigns...
              </h3>
              <p className="text-xs text-slate-500 mt-2 max-w-xs font-light leading-relaxed">
                Please wait while we sync your marketing campaigns securely with Tror.
              </p>
            </div>
          ) : activeProductCampaigns.length === 0 && !isGenerating ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              {campaigns.filter((c) => c.productId === activeProduct?.id)
                .length === 0 ? (
                <>
                  <img
                    src="/B2P AVATAR.png"
                    alt="Tror"
                    className="h-32 w-auto mb-4 drop-shadow-[0_0_15px_rgba(124,58,237,0.3)] animate-[bounce_5s_ease-in-out_infinite]"
                  />
                  <h3 className="text-lg font-bold text-slate-800 font-display">
                    No campaigns yet
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm font-light leading-relaxed">
                    Let Tror do the heavy lifting! Generate your first campaign
                    below.
                  </p>
                </>
              ) : (
                <p className="text-sm">
                  No campaigns match the selected filters.
                </p>
              )}
            </div>
          ) : (
            paginatedCampaigns.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "w-full flex items-stretch hover:bg-slate-50 transition-colors cursor-pointer bg-white/40 border-b border-slate-100/60",
                    selectedCampaign?.id === c.id &&
                      !isSelectionMode &&
                      "bg-[#7C3AED]/5 border-l-2 border-[#7C3AED] ",
                    selectedCampaignIds.has(c.id) &&
                      isSelectionMode &&
                      "bg-orange-500/10",
                  )}
                  onClick={() =>
                    isSelectionMode
                      ? toggleSelection(c.id, {
                          stopPropagation: () => {},
                        } as any)
                      : setSelectedCampaign(c)
                  }
                >
                  {isSelectionMode && (
                    <div
                      className="pl-4 flex items-center"
                      onClick={(e) => toggleSelection(c.id, e)}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          selectedCampaignIds.has(c.id)
                            ? "bg-[#7C3AED] border-[#7C3AED]"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {selectedCampaignIds.has(c.id) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 text-left px-5 py-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1 font-display">
                        {c.theme}
                      </h3>
                      {c.isAutomated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-600 text-white shrink-0 shadow-[0_0_8px_rgba(124,58,237,0.4)]">
                          🤖 Automated
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed font-light">
                      {c.coreMessage}
                    </p>
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 border border-slate-200/60 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl shadow-sm mt-2 shrink-0">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 font-sans">
              Page {currentPage} of {totalPages} ({activeProductCampaigns.length} total)
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail View */}
      <div
        className={cn(
          "flex-1 overflow-y-auto hide-scroll-when-modal p-0 sm:p-8 glass-panel !bg-transparent sm:!bg-white/65 sm:!border-solid shadow-sm sm:border-slate-200 rounded-none sm:rounded-2xl pb-[70px] sm:pb-8",
          !selectedCampaign ? "hidden lg:block" : "block",
        )}
      >
        {selectedCampaign ? (
          <div className="space-y-4 sm:space-y-8">
            <div className="border-b border-slate-150 pb-4 sm:pb-6 px-4 sm:px-0 pt-4 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="lg:hidden mr-2 p-1.5 hover:bg-slate-50 border border-slate-150 rounded-lg text-slate-500"
                >
                  <ArrowRight className="h-5 w-5 rotate-180" />
                </button>
                <span className="inline-flex items-center rounded-lg bg-[#7C3AED]/8 border border-[#7C3AED]/20 px-2.5 py-1 text-xs font-bold text-[#7C3AED]">
                  {selectedCampaign.pillar}
                </span>
                <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200/50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {selectedCampaign.contentFormat}
                </span>
                {selectedCampaign.isBlog && (
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-250 px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                    Blog & Newsletter
                  </span>
                )}
                <div className="flex-1 hidden sm:block" />
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button
                    onClick={async () => {
                      const { generateCampaignPDF } =
                        await import("../lib/pdfGenerator");
                      const pdf = await generateCampaignPDF(
                        selectedCampaign,
                        activeProduct!,
                      );
                      pdf.save(
                        `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_campaign.pdf`,
                      );
                    }}
                    className="glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-bold text-slate-800 font-display">
                  {selectedCampaign.theme}
                </h2>
                {selectedCampaign.isAutomated && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)] animate-pulse">
                    🤖 AI Agent Automated
                  </span>
                )}
              </div>
              <p className="mt-4 text-lg text-slate-700 font-medium leading-relaxed font-light">
                {selectedCampaign.coreMessage}
              </p>
            </div>

            {/* Accordion Toggle Banner for Campaign Strategy & Setup */}
            <div 
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="bg-white border border-slate-200 hover:border-slate-350 sm:rounded-xl p-4 sm:p-5 shadow-sm mb-6 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base flex flex-wrap items-center gap-2">
                    Campaign Strategy & Insights
                    <span className="inline-flex items-center rounded-full bg-slate-105 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      Target, Hook, CTA & Focus
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xl font-light">
                    {selectedCampaign.targetAudience ? `Audience: ${selectedCampaign.targetAudience}` : "Click to view high-level project DNA, hook, and campaign guidelines."}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-100 pt-3 sm:pt-0 sm:border-0 shrink-0">
                <span className="text-xs font-semibold text-[#7C3AED] bg-[#7C3AED]/10 px-2.5 py-1 rounded-full group-hover:bg-[#7C3AED]/20 transition-all duration-200">
                  {isOverviewExpanded ? "Hide Details" : "Show Details"}
                </span>
                <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300 group-hover:text-slate-600", isOverviewExpanded && "rotate-180")} />
              </div>
            </div>

            {isOverviewExpanded && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
                {selectedCampaign.researchSummary && (
                  <div className="bg-white border-y sm:border border-blue-200/85 sm:rounded-xl p-4 sm:p-5 shadow-sm mb-6">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 hidden sm:block mt-1">
                        <img
                          src="/B2P AVATAR.png"
                          alt="Tror"
                          className="w-10 h-10 rounded-full border border-blue-250 bg-white"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#2583EB] mb-1.5 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#2583EB]" />
                          Tror's Research Insights
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-light">
                          {selectedCampaign.researchSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Highly aligned two-column layout grid resolving any weird sizing/overflow issues */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Left Column (2 Grid Columns wide) - Houses Target, Hook, CTAs, Repurposing */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="glass-card bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-6 shadow-sm">
                      <div className="flex gap-3.5">
                        <Target className="h-5 w-5 text-[#7C3AED] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">
                            Target Audience
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed font-light">
                            {selectedCampaign.targetAudience}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3.5">
                        <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">Hook</h4>
                          <p className="text-sm text-slate-600 mt-1 italic leading-relaxed font-light">
                            "{selectedCampaign.hook}"
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3.5">
                        <MessageSquare className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">
                            Call to Action
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed font-light">
                            {selectedCampaign.cta}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3.5 pt-4 border-t border-slate-105 mt-2">
                        <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Repurposing Notes
                          </span>
                          <p className="text-sm text-slate-600 leading-relaxed font-light">
                            {selectedCampaign.repurposingNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (1 Grid Column wide) - Houses Campaign Inputs & Campaign Tags */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                    {(selectedCampaign.focus ||
                      selectedCampaign.subCategory ||
                      selectedCampaign.campaignThemeInput) && (
                      <div className="glass-card bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Layers className="h-4 w-4 text-slate-400" />
                          Campaign Inputs
                        </h4>
                        {selectedCampaign.focus && (
                          <div className="mt-2.5">
                            <span className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">
                              Industry / Focus
                            </span>
                            <p className="text-sm text-slate-650 font-medium">
                              {selectedCampaign.focus}
                            </p>
                          </div>
                        )}
                        {selectedCampaign.subCategory && (
                          <div className="mt-2.5">
                            <span className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-1">
                              Sub-Category / Niche
                            </span>
                            <p className="text-sm text-slate-650 font-medium">
                              {selectedCampaign.subCategory}
                            </p>
                          </div>
                        )}
                        {selectedCampaign.campaignThemeInput && (
                          <div className="mt-2.5">
                            <span className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-1">
                              Provided Theme
                            </span>
                            <p className="text-sm text-slate-650 font-medium">
                              {selectedCampaign.campaignThemeInput}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="glass-card bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Tag className="h-4 w-4 text-slate-400" />
                        Campaign Tags
                      </h4>
                      <div className="flex flex-wrap gap-2 items-center mt-2.5">
                        {(selectedCampaign.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-semibold border border-[#7C3AED]/20"
                          >
                            {tag}
                            <button
                              onClick={() =>
                                handleRemoveTag(selectedCampaign.id, tag)
                              }
                              className="hover:text-[#7C3AED]/70 focus:outline-none cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        <div className="relative border border-slate-200 rounded-md bg-slate-50 flex items-center shadow-inner">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag(selectedCampaign.id, newTagInput);
                              }
                            }}
                            placeholder="Add tag..."
                            className="text-xs px-2.5 py-1.5 focus:outline-none bg-transparent text-slate-800 placeholder:text-slate-450 w-24"
                          />
                          <button
                            onClick={() =>
                              handleAddTag(selectedCampaign.id, newTagInput)
                            }
                            className="pr-2.5 text-slate-400 hover:text-[#7C3AED]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-205">
              {!selectedCampaign.isBlog && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 sm:px-0">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-800 font-display">
                      Platform Execution
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
                    {[
                      "All",
                      "LinkedIn",
                      "Twitter",
                      "Facebook",
                      "Instagram",
                      "Reddit",
                    ].map((platform) => {
                      const pLowerCase = platform.toLowerCase();
                      // Check if this campaign has any posts for this platform
                      const hasPostsForPlatform =
                        platform === "All" ||
                        (selectedCampaign.dailyPosts &&
                          selectedCampaign.dailyPosts.some((dp) =>
                            dp.platformVersions.some(
                              (pv) => pv.platform.toLowerCase() === pLowerCase,
                            ),
                          )) ||
                        (selectedCampaign.platformVersions &&
                          selectedCampaign.platformVersions.some(
                            (pv) => pv.platform.toLowerCase() === pLowerCase,
                          ));

                      if (!hasPostsForPlatform && platform !== "All") return null;
                      const isActive =
                        platformFilter === pLowerCase ||
                        (platform === "All" && platformFilter === null);

                      return (
                        <button
                          key={platform}
                          onClick={() =>
                            setPlatformFilter(
                              platform === "All" ? null : pLowerCase,
                            )
                          }
                          className={cn(
                            "rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center shadow-sm",
                            platform === "All" ? "h-8 px-3" : "w-8 h-8",
                            isActive
                              ? "bg-[#7C3AED] text-white"
                              : "bg-white text-slate-500 hover:bg-[#7C3AED]/5 border border-slate-200/60",
                          )}
                          title={platform}
                        >
                          {platform === "All" ? (
                            platform
                          ) : (
                            <>
                              {getPlatformLogo(platform, isActive, "w-4 h-4")}
                              <span className="sr-only">{platform}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {selectedCampaign.isBlog ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Visual 16:9 Image Backdrop */}
                    {selectedCampaign.blogImageUrl ? (
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                        <img
                          src={selectedCampaign.blogImageUrl}
                          alt="Blog visual"
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={handleRegenerateBlogImage}
                            disabled={isRegeneratingBlogImage}
                            className="bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-xl backdrop-blur-md transition-colors text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                            title="Regenerate Brand Cover Image"
                          >
                            <Sparkles className={`h-3.5 w-3.5 ${isRegeneratingBlogImage ? 'animate-spin text-violet-400' : 'text-amber-300'}`} />
                            {isRegeneratingBlogImage ? 'Generating...' : 'Regenerate Cover'}
                          </button>
                          <button
                            onClick={() => handleDownloadImage(selectedCampaign.blogImageUrl!, `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_visual.png`)}
                            className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl backdrop-blur-md transition-colors"
                            title="Download Visual"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                        <ImageIcon className="h-10 w-10 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 font-medium mb-3">No Brand Cover Image Generated Yet</p>
                        <button
                          onClick={handleRegenerateBlogImage}
                          disabled={isRegeneratingBlogImage}
                          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                        >
                          <Sparkles className={`h-4 w-4 ${isRegeneratingBlogImage ? 'animate-spin text-violet-200' : 'text-amber-300'}`} />
                          {isRegeneratingBlogImage ? 'Generating Cover Image...' : 'Generate Brand Cover Image'}
                        </button>
                      </div>
                    )}

                    {/* Blog Content Header */}
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200/50">
                        📰 Blog & Newsletter Content
                      </span>
                      <h3 className="text-2xl font-bold text-slate-800 font-display leading-tight">
                        {selectedCampaign.blogTitle || selectedCampaign.theme}
                      </h3>
                      {selectedCampaign.blogImagePrompt && (
                        <p className="text-xs text-slate-400 font-light italic mt-1">
                          Visual Prompt: "{selectedCampaign.blogImagePrompt}"
                        </p>
                      )}
                    </div>

                    {/* Blog Text Content */}
                    <div className="border-t border-slate-100 pt-6">
                      <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap font-light tracking-wide bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                        {selectedCampaign.blogContent || "No blog content generated yet."}
                      </div>
                    </div>

                    {/* Blog Direct Publishing Integration */}
                    <div className="border-t border-slate-100 pt-6 space-y-4 text-left font-sans">
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150 shadow-inner">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Globe className="h-4.5 w-4.5 text-[#7C3AED]" /> Blog Website Integration
                          </h4>
                          {blogConfig && blogConfig.type !== 'none' ? (
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                              Configured: <span className="font-semibold text-slate-700 capitalize">{blogConfig.type}</span>
                              {blogConfig.wordpress?.url && ` at ${blogConfig.wordpress.url}`}
                              {blogConfig.webhook?.url && ` at ${blogConfig.webhook.url}`}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-1">
                              No blog website connected. Connect your site in <span className="font-semibold text-[#7C3AED] hover:underline cursor-pointer" onClick={() => navigate('/settings')}>Settings</span> to publish instantly.
                            </p>
                          )}
                        </div>

                        {blogConfig && blogConfig.type !== 'none' && (
                          <div className="flex items-center gap-3">
                            {selectedCampaign.publishedBlogUrl ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-250/50">
                                  ✓ Published
                                </span>
                                {selectedCampaign.publishedBlogUrl.startsWith('http') && (
                                  <a
                                    href={selectedCampaign.publishedBlogUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#7C3AED] hover:underline hover:text-[#6D28D9] transition-all"
                                  >
                                    View live post →
                                  </a>
                                )}
                                <button
                                  onClick={() => handlePublishBlog(selectedCampaign)}
                                  disabled={isPublishingBlog}
                                  className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-semibold border border-[#7C3AED]/20 bg-white rounded-lg px-3 py-1.5 hover:bg-[#7C3AED]/5 transition-all cursor-pointer"
                                >
                                  {isPublishingBlog ? "Re-publishing..." : "Re-publish"}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePublishBlog(selectedCampaign)}
                                disabled={isPublishingBlog}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shadow-[#7C3AED]/20"
                              >
                                {isPublishingBlog ? "Publishing..." : `Publish to ${blogConfig.type === 'wordpress' ? 'WordPress' : 'Webhook'}`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedCampaign.blogPublishError && !blogPublishSuccess && !blogPublishErrorMsg && (
                        <div className="p-3.5 text-xs bg-amber-50 border border-amber-250 text-amber-800 rounded-xl">
                          <strong>Last Publish Error:</strong> {selectedCampaign.blogPublishError}
                        </div>
                      )}

                      {blogPublishSuccess && (
                        <div className="p-3.5 text-xs bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-xl">
                          {blogPublishSuccess}
                        </div>
                      )}
                      {blogPublishErrorMsg && (
                        <div className="p-3.5 text-xs bg-red-50 border border-red-200/60 text-red-800 rounded-xl">
                          {blogPublishErrorMsg}
                        </div>
                      )}
                    </div>

                    {/* Copy to Clipboard CTA */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedCampaign.blogContent || "");
                            alert("Blog content copied to clipboard!");
                          } catch (err) {
                            console.error("Clipboard copy failed:", err);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors shadow-md shadow-violet-500/20"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Blog Text
                      </button>
                    </div>
                  </div>
                ) : selectedCampaign.dailyPosts &&
                selectedCampaign.dailyPosts.length > 0
                  ? selectedCampaign.dailyPosts.map((dp, dayIdx) => {
                      const filteredPVs = dp.platformVersions.filter(
                        (pv) =>
                          platformFilter === null ||
                          pv.platform.toLowerCase() ===
                            platformFilter.toLowerCase(),
                      );

                      if (filteredPVs.length === 0) return null;

                      return (
                        <div key={dayIdx} className="space-y-4">
                          <div
                            className="flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50 border border-slate-200/85 p-4 rounded-xl transition-colors shadow-sm"
                            onClick={() =>
                              setOpenDayIdx(
                                openDayIdx === dayIdx ? null : dayIdx,
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              {openDayIdx === dayIdx ? (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              )}
                              <h4 className="text-md font-extrabold text-slate-800 font-display">
                                {dp.day}
                                {dp.date && (
                                  <span className="text-sm text-slate-400 font-normal ml-2">
                                    (
                                    {new Date(dp.date).toLocaleDateString(
                                      "en-US",
                                      { month: "short", day: "numeric" },
                                    )}
                                    )
                                  </span>
                                )}
                              </h4>
                            </div>
                            <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500 shadow-inner">
                              {dp.contentType}
                            </span>
                          </div>

                          {openDayIdx === dayIdx && (
                            <div className="space-y-6 pt-2 sm:pl-4 sm:border-l-2 border-[#7C3AED]/20 sm:ml-2">
                              {filteredPVs.map((pv, idx) => {
                                const isLinkedin =
                                  pv.platform.toLowerCase() === "linkedin";
                                const publishKey = `${selectedCampaign.id}-${dp.day}-${pv.platform}`;
                                const isPublishing = publishing[publishKey];
                                const isPublished = published[publishKey];

                                return (
                                  <div
                                    key={idx}
                                    className="glass-card overflow-hidden !rounded-none sm:!rounded-xl !border-x-0 sm:!border-x border-slate-200/80 "
                                  >
                                    <div className="bg-slate-50/80 border-slate-200 px-4 sm:px-5 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 shrink-0" title={pv.platform}>
                                          {getPlatformLogo(pv.platform, false, "w-5 h-5") || (
                                            <span className="font-extrabold text-sm text-slate-800 tracking-wider">
                                              {pv.platform}
                                            </span>
                                          )}
                                          <span className="sr-only">{pv.platform}</span>
                                          {pv.improvedViaFeedback && (
                                            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/50 flex items-center gap-1 shrink-0">
                                              <Sparkles className="h-2.5 w-2.5" />
                                              Improved
                                            </span>
                                          )}
                                        </div>
                                        {pv.format && (
                                          <span 
                                            className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded inline-block truncate max-w-full font-light shadow-inner" 
                                            title={pv.format}
                                          >
                                            {pv.format}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 flex-nowrap justify-start md:justify-end">
                                        <button
                                          onClick={() =>
                                            queued[publishKey]
                                              ? handleUnqueue(
                                                  pv.platform,
                                                  selectedCampaign.id,
                                                  dp.day,
                                                )
                                              : handleQueue(
                                                  pv.platform,
                                                  formatCopy(pv.copy),
                                                  selectedCampaign.id,
                                                  dp.day,
                                                  dp.date,
                                                  pv.imageUrl || dp.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined) || (dp.imageId ? campaignImages[dp.imageId] : undefined),
                                                )
                                          }
                                          disabled={queuing[publishKey]}
                                          className={cn(
                                            "inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm shrink-0",
                                            queued[publishKey] &&
                                              "bg-[#7C3AED]/12 border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/20",
                                          )}
                                        >
                                          {queuing[publishKey] ? (
                                            <VideoLoader className="mr-1.5 h-7 w-7" />
                                          ) : queued[publishKey] ? (
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#7C3AED]" />
                                          ) : (
                                            <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                                          )}
                                          {queued[publishKey]
                                            ? "Queued"
                                            : "Queue"}
                                        </button>
                                        
                                        {isLinkedin && (
                                          isLinkedinConnected ? (
                                            <button
                                              onClick={() =>
                                                handlePublish(
                                                  pv.platform,
                                                  formatCopy(pv.copy),
                                                  selectedCampaign.id,
                                                  dp.day,
                                                  generatedVisuals[publishKey] ||
                                                    pv.imageUrl ||
                                                    (pv.imageId
                                                      ? campaignImages[pv.imageId]
                                                      : typeof dp !==
                                                            "undefined" &&
                                                          dp.imageId
                                                        ? campaignImages[
                                                            dp.imageId
                                                          ]
                                                        : undefined),
                                                )
                                              }
                                              disabled={
                                                isPublishing || isPublished
                                              }
                                              className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors shadow-sm shrink-0"
                                            >
                                              {isPublishing ? (
                                                <VideoLoader className="mr-1.5 h-7 w-7" />
                                              ) : isPublished ? (
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                              ) : (
                                                <Send className="mr-1.5 h-3.5 w-3.5" />
                                              )}
                                              {isPublished
                                                ? "Published"
                                                : "Publish"}
                                            </button>
                                          ) : (
                                            <button
                                              disabled
                                              title="Connect LinkedIn in Settings to publish directly"
                                              className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
                                            >
                                              <Send className="mr-1.5 h-3.5 w-3.5" />
                                              Publish
                                            </button>
                                          )
                                        )}

                                        {pv.platform.toLowerCase() === "instagram" && (
                                          isInstagramConnected ? (
                                            <button
                                              onClick={() =>
                                                handlePublish(
                                                  pv.platform,
                                                  formatCopy(pv.copy),
                                                  selectedCampaign.id,
                                                  dp.day,
                                                  generatedVisuals[
                                                    publishKey
                                                  ] ||
                                                    pv.imageUrl ||
                                                    (pv.imageId
                                                      ? campaignImages[
                                                          pv.imageId
                                                        ]
                                                      : typeof dp !==
                                                            "undefined" &&
                                                          dp.imageId
                                                        ? campaignImages[
                                                            dp.imageId
                                                          ]
                                                        : undefined),
                                                )
                                              }
                                              disabled={
                                                isPublishing || isPublished
                                              }
                                              className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#E1306C] hover:bg-[#c12456] rounded-lg transition-colors shadow-sm shrink-0"
                                            >
                                              {isPublishing ? (
                                                <VideoLoader className="mr-1.5 h-7 w-7" />
                                              ) : isPublished ? (
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                              ) : (
                                                <Send className="mr-1.5 h-3.5 w-3.5" />
                                              )}
                                              {isPublished
                                                ? "Published"
                                                : "Publish"}
                                            </button>
                                          ) : (
                                            <button
                                              disabled
                                              title="Connect Instagram in Settings to publish directly"
                                              className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
                                            >
                                              <Send className="mr-1.5 h-3.5 w-3.5" />
                                              Publish
                                            </button>
                                          )
                                        )}

                                        <button
                                          onClick={() =>
                                            handleCopyText(
                                              formatCopy(pv.copy),
                                              publishKey,
                                            )
                                          }
                                          className="inline-flex items-center justify-center h-8 w-8 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors shadow-sm shrink-0"
                                          title="Copy text"
                                        >
                                          {copiedState[publishKey] ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                          ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                          )}
                                        </button>

                                        {(pv.imageUrl ||
                                          (pv.imageId &&
                                            campaignImages[pv.imageId]) ||
                                          generatedVisuals[publishKey] ||
                                          (typeof dp !== "undefined" &&
                                            dp.imageId &&
                                            campaignImages[dp.imageId])) && (
                                          <button
                                            onClick={() =>
                                              handleDownloadVisualCard(
                                                publishKey,
                                                pv,
                                                dp,
                                                `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${pv.platform}.png`
                                              )
                                            }
                                            disabled={downloadingKeys[publishKey]}
                                            className="inline-flex items-center justify-center h-8 w-8 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors shadow-sm shrink-0"
                                            title="Download 1080x1080 visual graphic"
                                          >
                                            {downloadingKeys[publishKey] ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
                                            ) : (
                                              <Download className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="py-2 sm:p-5 flex flex-col items-center bg-slate-50/50 sm:rounded-b-xl px-0 sm:px-5">
                                      <PostPreviewModal
                                        inline
                                        platform={pv.platform}
                                        copy={pv.copy}
                                        imageUrl={
                                          generatedVisuals[publishKey] ||
                                          pv.imageUrl ||
                                          (pv.imageId
                                            ? campaignImages[pv.imageId]
                                            : typeof dp !== "undefined" &&
                                                dp.imageId
                                              ? campaignImages[dp.imageId]
                                              : undefined)
                                        }
                                        visualType={
                                          (pv as any).visualType ||
                                          (typeof dp !== "undefined"
                                            ? dp.visualType
                                            : undefined)
                                        }
                                        visualData={
                                          generatedVisualData[publishKey] ||
                                          getVisualDataWithImages(
                                            (pv as any).visualData ||
                                              (typeof dp !== "undefined"
                                                ? dp.visualData
                                                : undefined),
                                            campaignImages,
                                          )
                                        }
                                        dna={activeProduct!}
                                        isLoadingVisual={isFetchingImages && !(generatedVisuals[publishKey] || pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined) || (typeof dp !== "undefined" && dp.imageId ? campaignImages[dp.imageId] : undefined))}
                                        productName={activeProduct?.name || ""}
                                        productLogo={
                                          activeProduct?.logoUrl || ""
                                        }
                                        isFlattened={(pv as any).isFlattened || (typeof dp !== "undefined" && (dp as any).isFlattened)}
                                        onImageGenerated={(url) =>
                                          handleSetGeneratedVisual(
                                            publishKey,
                                            url,
                                          )
                                        }
                                        onUpdateVisual={(url, orig, data) =>
                                          handleSetGeneratedVisual(
                                            publishKey,
                                            url,
                                            data,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  : selectedCampaign.platformVersions
                      .filter(
                        (pv) =>
                          platformFilter === null ||
                          pv.platform.toLowerCase() ===
                            platformFilter.toLowerCase(),
                      )
                      .map((pv, idx) => {
                        const matchingDp = selectedCampaign.dailyPosts ? selectedCampaign.dailyPosts[idx % selectedCampaign.dailyPosts.length] : undefined;
                        const isLinkedin =
                          pv.platform.toLowerCase() === "linkedin";
                        const publishKey = `${selectedCampaign.id}-${pv.platform}`;
                        const isPublishing = publishing[publishKey];
                        const isPublished = published[publishKey];

                        return (
                          <div
                            key={idx}
                            className="glass-card overflow-hidden !rounded-none sm:!rounded-xl !border-x-0 sm:!border-x border-slate-200/80 "
                          >
                            <div className="bg-slate-50/80 border-slate-200 px-4 sm:px-5 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-extrabold text-sm text-slate-800 tracking-wider">
                                    {pv.platform}
                                  </span>
                                  {pv.improvedViaFeedback && (
                                    <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/50 flex items-center gap-1 shrink-0">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      Improved
                                    </span>
                                  )}
                                </div>
                                {pv.format && (
                                  <span 
                                    className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded inline-block truncate max-w-full font-light shadow-inner" 
                                    title={pv.format}
                                  >
                                    {pv.format}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 flex-nowrap justify-start md:justify-end">
                                <button
                                  onClick={() =>
                                    queued[publishKey]
                                      ? handleUnqueue(
                                          pv.platform,
                                          selectedCampaign.id,
                                        )
                                      : handleQueue(
                                          pv.platform,
                                          formatCopy(pv.copy),
                                          selectedCampaign.id,
                                          undefined,
                                          undefined,
                                          pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined),
                                        )
                                  }
                                  disabled={queuing[publishKey]}
                                  className={cn(
                                    "inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm shrink-0",
                                    queued[publishKey] &&
                                      "bg-[#7C3AED]/12 border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/20",
                                  )}
                                >
                                  {queuing[publishKey] ? (
                                    <VideoLoader className="mr-1.5 h-7 w-7" />
                                  ) : queued[publishKey] ? (
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#7C3AED]" />
                                  ) : (
                                    <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  {queued[publishKey] ? "Queued" : "Queue"}
                                </button>
                                
                                {isLinkedin && (
                                  isLinkedinConnected ? (
                                    <button
                                      onClick={() =>
                                        handlePublish(
                                          pv.platform,
                                          formatCopy(pv.copy),
                                          selectedCampaign.id,
                                          undefined,
                                          generatedVisuals[publishKey] ||
                                            pv.imageUrl ||
                                            (pv.imageId
                                              ? campaignImages[pv.imageId]
                                              : undefined),
                                        )
                                      }
                                      disabled={isPublishing || isPublished}
                                      className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-colors shadow-sm shrink-0"
                                    >
                                      {isPublishing ? (
                                        <VideoLoader className="mr-1.5 h-7 w-7" />
                                      ) : isPublished ? (
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      ) : (
                                        <Send className="mr-1.5 h-3.5 w-3.5" />
                                      )}
                                      {isPublished ? "Published" : "Publish"}
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      title="Connect LinkedIn in Settings to publish directly"
                                      className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
                                    >
                                      <Send className="mr-1.5 h-3.5 w-3.5" />
                                      Publish
                                    </button>
                                  )
                                )}

                                {pv.platform.toLowerCase() === "instagram" && (
                                  isInstagramConnected ? (
                                    <button
                                      onClick={() =>
                                        handlePublish(
                                          pv.platform,
                                          formatCopy(pv.copy),
                                          selectedCampaign.id,
                                          undefined,
                                          generatedVisuals[publishKey] ||
                                            pv.imageUrl ||
                                            (pv.imageId
                                              ? campaignImages[pv.imageId]
                                              : undefined),
                                        )
                                      }
                                      disabled={isPublishing || isPublished}
                                      className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-white bg-[#E1306C] hover:bg-[#c12456] rounded-lg transition-colors shadow-sm shrink-0"
                                    >
                                      {isPublishing ? (
                                        <VideoLoader className="mr-1.5 h-7 w-7" />
                                      ) : isPublished ? (
                                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      ) : (
                                        <Send className="mr-1.5 h-3.5 w-3.5" />
                                      )}
                                      {isPublished ? "Published" : "Publish"}
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      title="Connect Instagram in Settings to publish directly"
                                      className="opacity-50 cursor-not-allowed inline-flex items-center justify-center px-3 h-8 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
                                    >
                                      <Send className="mr-1.5 h-3.5 w-3.5" />
                                      Publish
                                    </button>
                                  )
                                )}

                                <button
                                  onClick={() =>
                                    handleCopyText(
                                      formatCopy(pv.copy),
                                      publishKey,
                                    )
                                  }
                                  className="inline-flex items-center justify-center h-8 w-8 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors shadow-sm shrink-0"
                                  title="Copy text"
                                >
                                  {copiedState[publishKey] ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                {(pv.imageUrl ||
                                  (pv.imageId && campaignImages[pv.imageId]) ||
                                  generatedVisuals[publishKey]) && (
                                  <button
                                    onClick={() =>
                                      handleDownloadVisualCard(
                                        publishKey,
                                        pv,
                                        matchingDp,
                                        `${selectedCampaign.theme.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${pv.platform}.png`,
                                      )
                                    }
                                    className="inline-flex items-center justify-center h-8 w-8 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors shadow-sm shrink-0"
                                    title="Download image"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="py-2 sm:p-5 flex flex-col items-center bg-slate-50/50 sm:rounded-b-xl px-0 sm:px-5">
                              <PostPreviewModal
                                inline
                                platform={pv.platform}
                                copy={pv.copy}
                                imageUrl={
                                  generatedVisuals[publishKey] ||
                                  pv.imageUrl ||
                                  (pv.imageId
                                    ? campaignImages[pv.imageId]
                                    : matchingDp?.imageUrl ||
                                      (matchingDp?.imageId ? campaignImages[matchingDp.imageId] : undefined))
                                }
                                visualType={(pv as any).visualType || matchingDp?.visualType}
                                visualData={
                                  generatedVisualData[publishKey] ||
                                  getVisualDataWithImages(
                                    (pv as any).visualData || matchingDp?.visualData,
                                    campaignImages,
                                  )
                                }
                                dna={activeProduct!}
                                isLoadingVisual={isFetchingImages && !(generatedVisuals[publishKey] || pv.imageUrl || matchingDp?.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined))}
                                productName={activeProduct?.name || ""}
                                productLogo={activeProduct?.logoUrl || ""}
                                isFlattened={(pv as any).isFlattened}
                                onImageGenerated={(url) =>
                                  handleSetGeneratedVisual(publishKey, url)
                                }
                                onUpdateVisual={(url, orig, data) =>
                                  handleSetGeneratedVisual(
                                    publishKey,
                                    url,
                                    data,
                                  )
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300">
            <Megaphone className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium">Select a campaign to view details</p>
          </div>
        )}
      </div>
      {/* Generation Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-4xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] shadow-[0_25px_60px_rgba(15,23,42,0.18)] !rounded-none sm:!rounded-[22px] border-0 sm:border border-slate-200">
               <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <h2 className="text-lg font-bold text-slate-800 font-display">
                  {modalStep === 1 && "Campaign Focus"}
                  {modalStep === 4 && "Campaign Boardroom"}
                  {modalStep === 5 && "Review Campaign"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {error && (
                  <div className="mb-6 glass-panel border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}

                {modalStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-base font-bold text-slate-800 font-display">
                          What industry or focus should this campaign target?
                        </label>
                        <button
                          onClick={() => handleGetSuggestions("industry")}
                          disabled={loadingSuggestions.industry}
                          className="text-xs flex items-center gap-1.5 text-[#7C3AED] hover:text-[#9D5CFF] transition-colors bg-[#7C3AED]/10 px-2 py-1.5 rounded-full border border-[#7C3AED]/20 font-semibold"
                        >
                          {loadingSuggestions.industry ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <img
                              src="/B2P AVATAR.png"
                              alt="Tror"
                              className="w-4 h-4 rounded-full border border-[#7C3AED]/30"
                            />
                          )}{" "}
                          Ask Tror
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-light mb-2">
                        e.g., Fitness, Skincare, Tech Gadgets, Local Restaurant
                      </p>
                      <input
                        type="text"
                        value={focusInput}
                        onChange={(e) => setFocusInput(e.target.value)}
                        placeholder="Enter focus or leave blank for default (Fitness industry)"
                        className="glass-input block w-full py-3 px-4 text-base bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-800 placeholder:text-slate-400 shadow-sm rounded-xl outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleResearchFocus();
                        }}
                      />

                      {/* Priority Suggestions from DNA */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activeProduct?.targetIcps?.map((icp, i) => (
                          <button
                            key={`icp-${i}`}
                            onClick={() => setFocusInput(icp.name)}
                            className="text-xs px-2.5 py-1.5 bg-[#18F07A]/10 text-[#14C161] border border-[#18F07A]/25 rounded-lg hover:bg-[#18F07A]/20 transition-colors shadow-sm flex items-center gap-1 font-semibold"
                          >
                            <Target className="w-3 h-3" /> Target ICP:{" "}
                            {icp.name}
                          </button>
                        ))}
                        {activeProduct?.contentPillars?.map((pillar, i) => (
                          <button
                            key={`pillar-${i}`}
                            onClick={() => setFocusInput(pillar)}
                            className="text-xs px-2.5 py-1.5 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/25 rounded-lg hover:bg-[#7C3AED]/20 transition-colors shadow-sm flex items-center gap-1 font-semibold"
                          >
                            <Layout className="w-3 h-3" /> Pillar: {pillar}
                          </button>
                        ))}
                        {/* Dynamic Suggestions from Tror */}
                        {fieldSuggestions.industry.map((s, i) => (
                          <button
                            key={`dyn-${i}`}
                            onClick={() => setFocusInput(s)}
                            className="text-xs px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-base font-bold text-slate-800 font-display">
                          Industry Sub-Category or Niche
                        </label>
                        <button
                          onClick={() => handleGetSuggestions("subcategory")}
                          disabled={loadingSuggestions.subcategory}
                          className="text-xs flex items-center gap-1.5 text-[#7C3AED] hover:text-[#9D5CFF] transition-colors bg-[#7C3AED]/10 px-2 py-1.5 rounded-full border border-[#7C3AED]/25 font-semibold"
                        >
                          {loadingSuggestions.subcategory ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <img
                              src="/B2P AVATAR.png"
                              alt="Tror"
                              className="w-4 h-4 rounded-full border border-[#7C3AED]/30"
                            />
                          )}{" "}
                          Ask Tror
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-light mb-2">
                        Specify which part of the industry you want to focus
                        more on.
                      </p>
                      <input
                        type="text"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        placeholder="e.g., Gyms, Fitness Equipments, Apparels, Supplements"
                        className="glass-input block w-full py-3 px-4 text-base bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-800 placeholder:text-slate-400 shadow-sm rounded-xl outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleResearchFocus();
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activeProduct?.targetIcps?.flatMap((icp, i) =>
                          icp.painPoints?.map((painPoint, j) => (
                            <button
                              key={`icp-pain-${i}-${j}`}
                              onClick={() => setSubCategory(painPoint)}
                              className="text-xs px-2.5 py-1.5 bg-[#2583EB]/10 text-[#1E70EB] border border-[#2583EB]/20 rounded-lg hover:bg-[#2583EB]/20 transition-colors shadow-sm flex items-center gap-1 font-semibold"
                            >
                              <Target className="w-3 h-3" /> Niche: {painPoint}
                            </button>
                          )),
                        )}
                        {fieldSuggestions.subcategory.map((s, i) => (
                          <button
                            key={`dyn-sub-${i}`}
                            onClick={() => setSubCategory(s)}
                            className="text-xs px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-250/50 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-base font-bold text-slate-800 font-display">
                          Campaign Theme
                        </label>
                        <button
                          onClick={() => handleGetSuggestions("theme")}
                          disabled={loadingSuggestions.theme}
                          className="text-xs flex items-center gap-1.5 text-[#7C3AED] hover:text-[#9D5CFF] transition-colors bg-[#7C3AED]/10 px-2 py-1.5 rounded-full border border-[#7C3AED]/25 font-semibold"
                        >
                          {loadingSuggestions.theme ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <img
                              src="/B2P AVATAR.png"
                              alt="Tror"
                              className="w-4 h-4 rounded-full border border-[#7C3AED]/30"
                            />
                          )}{" "}
                          Ask Tror
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-light mb-2">
                        Optional: Provide a specific theme for this campaign.
                      </p>
                      <input
                        type="text"
                        value={campaignTheme}
                        onChange={(e) => setCampaignTheme(e.target.value)}
                        placeholder="e.g., Winter Sale, New Feature Launch"
                        className="glass-input block w-full py-3 px-4 text-base bg-white border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 text-slate-800 placeholder:text-slate-400 shadow-sm rounded-xl outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleResearchFocus();
                        }}
                      />

                      <div className="flex flex-wrap gap-2 mt-2">
                        {activeProduct?.recommendedThemes?.map((theme, i) => (
                          <button
                            key={`theme-${i}`}
                            onClick={() => setCampaignTheme(theme)}
                            className="text-xs px-2.5 py-1.5 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors shadow-sm flex items-center gap-1 font-semibold"
                          >
                            <Sparkles className="w-3 h-3" /> Recommended:{" "}
                            {theme}
                          </button>
                        ))}
                        {fieldSuggestions.theme.map((s, i) => (
                          <button
                            key={`dyn-theme-${i}`}
                            onClick={() => setCampaignTheme(s)}
                            className="text-xs px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="block text-base font-bold text-slate-800 font-display">
                        Campaign Start Week
                      </label>
                      <p className="text-xs text-slate-500 font-light mb-3">
                        Select the Monday this weekly campaign will begin.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Next Monday", date: nextMonday },
                          { label: "In 2 Weeks", date: followingMonday },
                        ].map((option) => (
                          <label
                            key={option.label}
                            className={cn(
                              "flex flex-col p-3 rounded-xl border cursor-pointer transition-all",
                              selectedStartDate === formatDate(option.date)
                                ? "border-[#7C3AED] bg-[#7C3AED]/5"
                                : "border-slate-200 bg-white hover:border-[#7C3AED]/30",
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  selectedStartDate === formatDate(option.date)
                                    ? "text-[#7C3AED]"
                                    : "text-slate-700",
                                )}
                              >
                                {option.label}
                              </span>
                              <input
                                type="radio"
                                name="startDate"
                                value={formatDate(option.date)}
                                checked={
                                  selectedStartDate === formatDate(option.date)
                                }
                                onChange={(e) =>
                                  setSelectedStartDate(e.target.value)
                                }
                                className="text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5"
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-light">
                              {displayDate(option.date)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200/60">
                      <label className="block text-base font-bold text-slate-800 font-display">
                        Select Research & Content Channels
                      </label>
                      <p className="text-xs text-slate-500 font-light mb-3">
                        Choose the platforms to research and generate content
                        for.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableChannels.map((channel) => (
                          <button
                            key={channel}
                            onClick={() => {
                              if (selectedChannels.includes(channel)) {
                                setSelectedChannels(
                                  selectedChannels.filter((c) => c !== channel),
                                );
                              } else {
                                setSelectedChannels([
                                  ...selectedChannels,
                                  channel,
                                ]);
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                              selectedChannels.includes(channel)
                                ? "bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#7C3AED]"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                            )}
                          >
                            {channel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200/60 font-semibold">
                      <label className="flex items-center gap-3 text-base font-bold text-slate-800 cursor-pointer font-display">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={generateImages}
                            onChange={(e) =>
                              setGenerateImages(e.target.checked)
                            }
                            disabled={isGenerating}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C3AED]"></div>
                        </div>
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                        Generate AI Background Images
                      </label>
                      <p className="text-xs text-slate-500 font-light pl-[3.25rem] leading-relaxed">
                        When enabled, the AI will generate brand new backgrounds for your posts. When disabled, the system will prioritize using your uploaded brand photos and assets.
                      </p>
                    </div>
                  </div>
                )}

                {modalStep === 4 && (
                  <CampaignLoaderConsole
                    activeProduct={activeProduct}
                    focus={focus || focusInput || "Fitness industry"}
                    subCategory={subCategory}
                    campaignTheme={campaignTheme}
                    selectedChannels={selectedChannels}
                    generationStep={generationStep}
                    generationTotal={generationTotal}
                    generationStatus={generationStatus}
                    warmupStatus={warmupStatus}
                  />
                )}

                {modalStep === 5 && draftCampaign && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 font-display">
                        {draftCampaign.theme}
                      </h3>
                      <p className="text-sm text-slate-500 font-light mt-1">
                        {draftCampaign.coreMessage}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800 px-4 sm:px-0 font-display">
                        Generated Posts
                      </h4>
                      <div className="space-y-4 sm:pr-2 px-0">
                        {draftCampaign.dailyPosts
                          ? draftCampaign.dailyPosts.map((dp, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-4 space-y-4"
                              >
                                <div
                                  className="flex items-center justify-between cursor-pointer select-none px-4 sm:px-0"
                                  onClick={() =>
                                    setOpenDayIdx(
                                      openDayIdx === idx ? null : idx,
                                    )
                                  }
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {openDayIdx === idx ? (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                    <span className="font-bold text-sm text-slate-800 font-display">
                                      {dp.day}{" "}
                                      {dp.date && (
                                        <span className="text-xs text-slate-400 font-light ml-1">
                                          (
                                          {new Date(dp.date).toLocaleDateString(
                                            "en-US",
                                            { month: "short", day: "numeric" },
                                          )}
                                          )
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs bg-[#7C3AED]/5 border-[#7C3AED]/15 border px-2.5 py-1 rounded-md text-[#7C3AED] font-semibold tracking-wide text-[11px]">
                                    {dp.contentType}
                                  </span>
                                </div>
                                {openDayIdx === idx && (
                                  <div className="space-y-4 pt-2">
                                    {dp.platformVersions.map((pv, pvIdx) => (
                                      <div
                                        key={pvIdx}
                                        className="bg-slate-50/50 sm:rounded-lg overflow-hidden border-y sm:border border-slate-200/60"
                                      >
                                        <div className="bg-slate-100/80 border-b border-slate-200/50 px-4 py-2">
                                          <span className="font-bold text-xs text-slate-700 uppercase tracking-wider font-display">
                                            {pv.platform}
                                          </span>
                                        </div>
                                        <div className="py-4 sm:p-4 flex flex-col items-center px-0 sm:px-4">
                                          <PostPreviewModal
                                            inline
                                            platform={pv.platform}
                                            copy={pv.copy}
                                            imageUrl={
                                              generatedVisuals[
                                                `draft-daily-${idx}-${pvIdx}`
                                              ] ||
                                              pv.imageUrl ||
                                              (pv.imageId
                                                ? campaignImages[pv.imageId]
                                                : undefined) ||
                                              dp.imageUrl ||
                                              (dp.imageId
                                                ? campaignImages[dp.imageId]
                                                : undefined)
                                            }
                                            visualType={
                                              (pv as any).visualType ||
                                              dp.visualType
                                            }
                                            visualData={
                                              generatedVisualData[
                                                `draft-daily-${idx}-${pvIdx}`
                                              ] ||
                                              getVisualDataWithImages(
                                                (pv as any).visualData ||
                                                  dp.visualData,
                                                campaignImages,
                                              )
                                            }
                                            dna={activeProduct!}
                                            isLoadingVisual={isFetchingImages && !(generatedVisuals[`draft-daily-${idx}-${pvIdx}`] || pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined) || dp.imageUrl || (dp.imageId ? campaignImages[dp.imageId] : undefined))}
                                            productName={
                                              activeProduct?.name || ""
                                            }
                                            productLogo={
                                              activeProduct?.logoUrl || ""
                                            }
                                            onImageGenerated={(url) =>
                                              handleSetGeneratedVisual(
                                                `draft-daily-${idx}-${pvIdx}`,
                                                url,
                                              )
                                            }
                                            onUpdateVisual={(url, orig, data) =>
                                              handleSetGeneratedVisual(
                                                `draft-daily-${idx}-${pvIdx}`,
                                                url,
                                                data,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          : draftCampaign.platformVersions.map((pv, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50/50 border border-slate-200/80 rounded-xl overflow-hidden"
                              >
                                <div className="bg-slate-100/80 border-b border-slate-200/50 px-4 py-2">
                                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider font-display">
                                    {pv.platform}
                                  </span>
                                </div>
                                <div className="py-4 sm:p-4 flex flex-col items-center bg-slate-50/50 sm:rounded-b-xl px-0 sm:px-4">
                                  <PostPreviewModal
                                    inline
                                    platform={pv.platform}
                                    copy={pv.copy}
                                    imageUrl={
                                      generatedVisuals[
                                        `draft-platform-${idx}`
                                      ] ||
                                      pv.imageUrl ||
                                      (pv.imageId
                                        ? campaignImages[pv.imageId]
                                        : undefined)
                                    }
                                    visualType={(pv as any).visualType}
                                    visualData={
                                      generatedVisualData[
                                        `draft-platform-${idx}`
                                      ] ||
                                      getVisualDataWithImages(
                                        (pv as any).visualData,
                                        campaignImages,
                                      )
                                    }
                                    dna={activeProduct!}
                                    isLoadingVisual={isFetchingImages && !(generatedVisuals[`draft-platform-${idx}`] || pv.imageUrl || (pv.imageId ? campaignImages[pv.imageId] : undefined))}
                                    productName={activeProduct?.name || ""}
                                    productLogo={activeProduct?.logoUrl || ""}
                                    onImageGenerated={(url) =>
                                      handleSetGeneratedVisual(
                                        `draft-platform-${idx}`,
                                        url,
                                      )
                                    }
                                    onUpdateVisual={(url, orig, data) =>
                                      handleSetGeneratedVisual(
                                        `draft-platform-${idx}`,
                                        url,
                                        data,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-xl transition-all"
                >
                  Cancel
                </button>
                {modalStep === 1 && (
                  <button
                    onClick={handleResearchFocus}
                    disabled={selectedChannels.length === 0}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center shadow-md shadow-[#7C3AED]/10 hover:shadow-[#7C3AED]/20 transition-all active:scale-[0.98]"
                  >
                    Generate Campaign <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
                {modalStep === 5 && (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-6 py-2.5 text-sm font-semibold inline-flex items-center justify-center shadow-md shadow-[#7C3AED]/10 hover:shadow-[#7C3AED]/20 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Approving...
                      </>
                    ) : (
                      "Approve & Schedule"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white max-w-sm w-full overflow-hidden rounded-[22px] border border-slate-200/80 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-50 border border-rose-100 mb-4 animate-[pulse_3s_ease-in-out_infinite]">
                  <Trash2 className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight font-display mb-2">
                  Delete Campaigns?
                </h3>
                <p className="text-sm text-slate-500 font-sans tracking-wide leading-relaxed mb-6">
                  Are you sure you want to delete {selectedCampaignIds.size}{" "}
                  selected campaign{selectedCampaignIds.size > 1 ? "s" : ""}?
                  This action cannot be undone and will permanently remove them
                  from the database.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Permanently"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Share Modal */}
      {isShareModalOpen &&
        selectedCampaign &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className="bg-white max-w-lg w-full overflow-hidden flex flex-col rounded-3xl border border-slate-200/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-900">
                      Share Campaign
                    </h3>
                    <p className="text-xs text-slate-500">
                      Export, generate public links, or email this campaign report
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                
                {/* Public Link Toggle Card */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          Enable Public Share Link
                        </h4>
                        {selectedCampaign.isShared && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Allow anyone with the unique link to view this campaign.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleShare}
                      disabled={isSharing}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED]",
                        selectedCampaign.isShared ? "bg-[#7C3AED]" : "bg-slate-300",
                        isSharing && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
                          selectedCampaign.isShared ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Share Link Field when active */}
                  {selectedCampaign.isShared && (
                    <div className="space-y-1.5 pt-3 border-t border-slate-200/60 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Public Access URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none font-mono selection:bg-[#7C3AED]/20 shadow-inner"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-4 py-2 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer gap-1.5"
                          title="Copy link"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sharing Options Action Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleEmailLink}
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl px-4 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#7C3AED]/15 hover:shadow-[#7C3AED]/25 active:scale-95 cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    Share via Email (Draft & PDF)
                  </button>

                  <button
                    onClick={async () => {
                      if (!selectedCampaign || !activeProduct) return;
                      const { generateCampaignPDF } = await import("../lib/pdfGenerator");
                      const pdf = await generateCampaignPDF(selectedCampaign, activeProduct);
                      pdf.save(`${(selectedCampaign.theme || "campaign").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.pdf`);
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-slate-600" />
                    Download PDF Report
                  </button>
                </div>

              </div>
            </div>
          </div>,
          document.body,
        )}

      {previewImage && (
        <ImageLightbox
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {previewPost && (
        <PostPreviewModal
          platform={previewPost.platform}
          copy={previewPost.copy}
          imageUrl={previewPost.imageUrl}
          visualType={previewPost.visualType}
          visualData={getVisualDataWithImages(
            previewPost.visualData,
            campaignImages,
          )}
          dna={activeProduct!}
          isLoadingVisual={isFetchingImages && !previewPost.imageUrl}
          isFlattened={(previewPost as any).isFlattened}
          productName={activeProduct?.name || "Product Name"}
          productLogo={
            activeProduct?.logoUrl ||
            activeProduct?.logoDarkUrl ||
            activeProduct?.logoLightUrl
          }
          onClose={() => setPreviewPost(null)}
        />
      )}
    </div>
  );
}
