import { VideoLoader } from "../components/VideoLoader";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ProductDNA as ProductDNAType } from "../types";
import {
  Save,
  Loader2,
  Sparkles,
  Trash2,
  AlertTriangle,
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  Globe,
  FileText,
  Target,
  MessageSquare,
  Zap,
  Link,
  Download,
  ChevronDown,
  ChevronUp,
  Cpu,
  Brain,
  Upload,
} from "lucide-react";
import { researchProductDNA, synthesizeFounderAgent } from "../services/geminiService";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import {
  logSilentError,
  handleFirestoreError,
  OperationType,
} from "../lib/firestore-error";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { GOOGLE_FONTS, ADOBE_FONTS } from "../lib/fonts";
import { BrandExtractionModal } from "../components/BrandExtractionModal";

const ALL_FONTS = [...GOOGLE_FONTS, ...ADOBE_FONTS];
const POPULAR_FONTS = Array.from(new Set(ALL_FONTS)).sort();

const getFontUrl = (fontName: string) => {
  if (!fontName) return "";
  // Check if it's explicitly an Adobe font or System font, which don't load from Google Fonts
  if (ADOBE_FONTS.includes(fontName)) {
    return "";
  }

  // Try to load any other font from Google Fonts
  const formattedName = fontName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("+");
  return `https://fonts.googleapis.com/css?family=${formattedName}:300,400,500,600,700&display=swap`;
};

export function ProductDNA() {
  const { activeProduct, updateProduct, deleteProduct } = useProducts();
  const { user } = useAuth();
  const [dna, setDna] = useState<ProductDNAType>({
    id: "",
    name: "",
    website: "",
    positioning: "",
    audience: "",
    tone: "",
    stage: "",
    visualStyle: "",
    visualData: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDocument, setProductDocument] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const navigate = useNavigate();

  // Extraction Modal State
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionInputType, setExtractionInputType] = useState<
    "website" | "document" | "description"
  >("website");
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [extractionLogs, setExtractionLogs] = useState<string[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const [fontSearch, setFontSearch] = useState("");

  const filteredFonts = useMemo(() => {
    const search = fontSearch.toLowerCase();
    return POPULAR_FONTS.filter((f) => f.toLowerCase().includes(search));
  }, [fontSearch]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // States to keep complex strategy sections minimized by default
  const [isPsychographicsExpanded, setIsPsychographicsExpanded] = useState(false);
  const [isCampaignStrategyExpanded, setIsCampaignStrategyExpanded] = useState(false);
  const [isFounderExpanded, setIsFounderExpanded] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisLogs, setSynthesisLogs] = useState<string[]>([]);
  const [synthesisProgress, setSynthesisProgress] = useState(0);

  useEffect(() => {
    if (activeProduct) {
      setDna(activeProduct);
    }
  }, [activeProduct]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setDna({ ...dna, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleArrayChange = (
    field: "contentPillars" | "recommendedThemes",
    value: string,
  ) => {
    setDna({
      ...dna,
      [field]: value.split("\n").filter((s) => s.trim() !== ""),
    });
    setSaved(false);
  };

  const handleIcpChange = (
    index: number,
    field: "name" | "painPoints",
    value: string,
  ) => {
    const icps = [...(dna.targetIcps || [])];
    if (!icps[index]) icps[index] = { name: "", painPoints: [] };

    if (field === "name") {
      icps[index].name = value;
    } else {
      icps[index].painPoints = value.split("\n").filter((s) => s.trim() !== "");
    }
    setDna({ ...dna, targetIcps: icps });
    setSaved(false);
  };

  const addIcp = () => {
    setDna({
      ...dna,
      targetIcps: [...(dna.targetIcps || []), { name: "", painPoints: [] }],
    });
    setSaved(false);
  };

  const removeIcp = (index: number) => {
    const icps = [...(dna.targetIcps || [])];
    icps.splice(index, 1);
    setDna({ ...dna, targetIcps: icps });
    setSaved(false);
  };

  useEffect(() => {
    if (isExtractionModalOpen || isDeleteModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isExtractionModalOpen, isDeleteModalOpen]);

  const handleColorChange = (index: number, value: string) => {
    const vd = dna.visualData || {
      colors: [],
      fonts: { primary: "", secondary: "" },
      typographyHierarchy: "",
      imageStyle: "",
    };
    const newColors = [...vd.colors];
    newColors[index] = value;
    setDna({ ...dna, visualData: { ...vd, colors: newColors } });
    setSaved(false);
  };

  const handleAddColor = () => {
    const vd = dna.visualData || {
      colors: [],
      fonts: { primary: "", secondary: "" },
      typographyHierarchy: "",
      imageStyle: "",
    };
    setDna({
      ...dna,
      visualData: { ...vd, colors: [...vd.colors, "#000000"] },
    });
    setSaved(false);
  };

  const handleRemoveColor = (index: number) => {
    const vd = dna.visualData || {
      colors: [],
      fonts: { primary: "", secondary: "" },
      typographyHierarchy: "",
      imageStyle: "",
    };
    const newColors = vd.colors.filter((_, i) => i !== index);
    setDna({ ...dna, visualData: { ...vd, colors: newColors } });
    setSaved(false);
  };

  const handleFontChange = (type: "primary" | "secondary", value: string) => {
    const vd = dna.visualData || {
      colors: [],
      fonts: { primary: "", secondary: "" },
      typographyHierarchy: "",
      imageStyle: "",
    };
    setDna({
      ...dna,
      visualData: { ...vd, fonts: { ...vd.fonts, [type]: value } },
    });
    setSaved(false);
  };

  const handleVisualTextChange = (
    field: "typographyHierarchy" | "imageStyle",
    value: string,
  ) => {
    const vd = dna.visualData || {
      colors: [],
      fonts: { primary: "", secondary: "" },
      typographyHierarchy: "",
      imageStyle: "",
    };
    setDna({ ...dna, visualData: { ...vd, [field]: value } });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setIsSaving(true);
    // Simulate API call
    setTimeout(async () => {
      try {
        await updateProduct(activeProduct.id, dna);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        logSilentError(err as Error, { context: "handleSubmitProductDNA" });
        setError("Failed to save product DNA. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }, 600);
  };

  const handleDeleteProduct = async () => {
    if (deleteConfirmation !== "DELETE" || !activeProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(activeProduct.id);
      setIsDeleteModalOpen(false);
      setDeleteConfirmation("");
    } catch (err) {
      logSilentError(err as Error, {
        context: "deleteProduct",
        productId: activeProduct.id,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResearch = async () => {
    if (
      (!dna.website && !dna.description && !productDocument) ||
      !activeProduct
    ) {
      setError(
        "Please enter a website URL, a product description, or upload a document first.",
      );
      return;
    }
    setError(null);
    setIsResearching(true);

    // Determine input type for modal
    let inputType: "website" | "document" | "description" = "website";
    if (dna.website) inputType = "website";
    else if (productDocument) inputType = "document";
    else if (dna.description) inputType = "description";

    setExtractionInputType(inputType);
    setExtractionComplete(false);
    setScreenshotUrl(null);
    setExtractionLogs([
      "Initializing Tror Core [v2.4.1]...",
      "Booting Strategist Agent...",
    ]);
    setExtractionProgress(5);
    setIsExtractionModalOpen(true);

    try {
      let screenshotData: {
        data: string;
        mimeType: string;
        url: string;
      } | null = null;
      let microlinkMetadata: any = null;
      if (dna.website) {
        try {
          setExtractionLogs((prev) => [
            ...prev,
            "Establishing secure connection to target URL...",
            "Fetching screenshot & metadata via Microlink...",
          ]);
          setExtractionProgress(15);
          const targetUrl = dna.website.startsWith("http")
            ? dna.website
            : `https://${dna.website}`;
          const encodedUrl = encodeURIComponent(targetUrl);
          const mLinkRes = await fetch(
            `https://api.microlink.io?url=${encodedUrl}&screenshot=true&meta=true&palette=true&animations=false&waitForTimeout=4500`,
          );

          if (mLinkRes.ok) {
            const mLinkData = await mLinkRes.json();
            microlinkMetadata = mLinkData?.data;

            if (mLinkData?.data?.screenshot?.url) {
              const mLinkUrl = mLinkData.data.screenshot.url;
              setScreenshotUrl(mLinkUrl);
              setExtractionLogs((prev) => [...prev, "> Snapshot Acquired."]);
              setExtractionProgress(30);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout for image fetch
              const res = await fetch(mLinkUrl, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const blob = await res.blob();
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
                screenshotData = {
                  data: base64.split(",")[1],
                  mimeType: blob.type,
                  url: mLinkUrl,
                };
                setExtractionProgress(45);
              }
            }
          }
        } catch (err) {
          console.warn("Screenshot capture failed:", err);
        }
      }

      setExtractionLogs((prev) => [
        ...prev,
        "Parsing DOM tree and semantic HTML...",
        "Extracting <H1> through <H3> hierarchy...",
        "Mapping CSS variables & theme tokens...",
        "Running psychographic NLP processing...",
      ]);
      setExtractionProgress(60);

      const researchedData = await researchProductDNA(
        dna.website,
        dna,
        productDocument
          ? { data: productDocument.data, mimeType: productDocument.mimeType }
          : null,
        user?.uid,
        screenshotData
          ? { data: screenshotData.data, mimeType: screenshotData.mimeType }
          : undefined,
        microlinkMetadata,
      );

      setExtractionLogs((prev) => [
        ...prev,
        '> "Hell State" quantified.',
        "Structuring DNA JSON payload...",
        "Finalizing Tror Memory Graph...",
      ]);
      setExtractionProgress(100);
      const newDna = { ...dna, ...researchedData } as ProductDNAType;

      // Inject exact logo from microlink if found, to guarantee we pick it up correctly
      if (microlinkMetadata?.logo?.url) {
        if (!newDna.logoUrl) {
          newDna.logoUrl = microlinkMetadata.logo.url;
        }
        if (!newDna.logoDarkUrl) {
          newDna.logoDarkUrl = microlinkMetadata.logo.url;
        }
        if (!newDna.logoLightUrl) {
          newDna.logoLightUrl = microlinkMetadata.logo.url;
        }
      }

      // Process extracted media images
      if (
        user &&
        researchedData.extractedMediaImages &&
        Array.isArray(researchedData.extractedMediaImages)
      ) {
        try {
          const mediaImages = researchedData.extractedMediaImages as string[];
          for (let i = 0; i < mediaImages.length; i++) {
            const creativeObj = {
              productId: activeProduct.id,
              userId: user.uid,
              url: mediaImages[i],
              name: `Website Image ${i + 1}`,
              createdAt: new Date().toISOString(),
            };
            await addDoc(collection(db, "creatives"), creativeObj);
          }
        } catch (err) {
          logSilentError(err as Error, {
            context: "addExtractedMediaImagesToCreatives",
          });
        }
      }

      // Remove temporary properties before saving to Firestore
      delete (newDna as any).extractedMediaImages;

      setDna(newDna);
      await updateProduct(activeProduct.id, newDna);
      setExtractionComplete(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      logSilentError(err as Error, { context: "handleResearch" });
      setError(
        "Failed to research. Please check your API key or document format.",
      );
      setIsExtractionModalOpen(false);
    } finally {
      setIsResearching(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Document file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setProductDocument({
        data: base64String,
        mimeType: file.type,
        name: file.name,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFounderFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setDna(prev => ({
        ...prev,
        founderVoiceFileName: file.name,
        founderVoiceFileMimeType: file.type,
        founderVoiceFileData: base64String
      }));
      setSaved(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFounderFile = () => {
    setDna(prev => {
      const updated = { ...prev };
      delete updated.founderVoiceFileName;
      delete updated.founderVoiceFileMimeType;
      delete updated.founderVoiceFileData;
      return updated;
    });
    setSaved(false);
  };

  const handleSynthesizeFounderAgent = async () => {
    if (!dna.founderVoiceDescription && !dna.founderVoiceFileData) {
      setError("Please describe the founder's behavior or upload a background document.");
      return;
    }
    setError(null);
    setIsSynthesizing(true);
    setSynthesisProgress(5);
    setSynthesisLogs([
      "Initializing AI Cognitive Profiler...",
      "Reading founder input details..."
    ]);

    try {
      // Step log updates
      const t1 = setTimeout(() => {
        setSynthesisLogs(prev => [...prev, "Analyzing personality & action patterns..."]);
        setSynthesisProgress(25);
      }, 800);

      const t2 = setTimeout(() => {
        setSynthesisLogs(prev => [...prev, "Extracting tone and communication style..."]);
        setSynthesisProgress(50);
      }, 1600);

      const t3 = setTimeout(() => {
        setSynthesisLogs(prev => [...prev, "Modeling behavioral heuristics..."]);
        setSynthesisProgress(75);
      }, 2400);

      const document = dna.founderVoiceFileData
        ? { data: dna.founderVoiceFileData, mimeType: dna.founderVoiceFileMimeType || "text/plain" }
        : null;

      const profile = await synthesizeFounderAgent(
        dna.founderVoiceDescription || "",
        document,
        user?.uid
      );

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setSynthesisLogs(prev => [
        ...prev,
        "> Analysis complete.",
        `Activating Doppelganger: "${profile.personaName}"`
      ]);
      setSynthesisProgress(100);

      const synthesizedAt = new Date().toISOString();
      const updatedDna = {
        ...dna,
        founderAgentSynthesized: {
          ...profile,
          synthesizedAt
        }
      };

      setDna(updatedDna);
      await updateProduct(activeProduct.id, updatedDna);

      setIsSynthesizing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      logSilentError(err as Error, { context: "handleSynthesizeFounderAgent" });
      setError("Failed to synthesize founder agent. Please try again.");
      setIsSynthesizing(false);
    }
  };

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logoUrl" | "logoDarkUrl" | "logoLightUrl",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG images are allowed.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // Preserve transparency by saving as PNG
          const base64String = canvas.toDataURL("image/png");
          setDna((prev) => ({ ...prev, [type]: base64String }));
          setSaved(false);
          setError(null);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (
    type: "logoUrl" | "logoDarkUrl" | "logoLightUrl",
  ) => {
    setDna((prev) => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
    setSaved(false);
  };

  const handleDownloadLogo = async (
    url: string | undefined,
    filename: string,
  ) => {
    if (!url) {
      setError("No logo image URL is available to download.");
      return;
    }

    try {
      // 1. Base64 encoded or data url directly triggers immediate virtual download
      if (url.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 2. Remote URLs are proxied through our express backend to completely bypass CORS
      // and guarantee a native background file attachment download dialog
      const downloadUrl = `/api/download-logo?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute('target', '_self');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      logSilentError("Direct proxy download triggered error fallback redirection", { error: err });
      window.open(url, "_blank");
    }
  };

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <BrandExtractionModal
        isOpen={isExtractionModalOpen}
        inputType={extractionInputType}
        isComplete={extractionComplete}
        screenshotUrl={screenshotUrl}
        extractionLogs={extractionLogs}
        extractionProgress={extractionProgress}
        onClose={() => setIsExtractionModalOpen(false)}
        onSaveAndContinue={() => {
          setIsExtractionModalOpen(false);
          navigate("/dashboard/campaigns");
        }}
      />
      <div className="tour-dna-header">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800 font-display">
          Brand Position
        </h1>
        <p className="mt-3 text-lg text-slate-600 font-light">
          Define your brand's Position (The 'P' in POST). The engine uses this
          to drive Outreach, Signal, and Traction.
        </p>
      </div>

      {error && (
        <div className="glass-panel bg-red-500/10 border-red-500/20 p-4">
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Core Identity */}
          <div className="lg:col-span-2 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-4">
              <Layout className="h-5 w-5 text-[#7C3AED]" />
              <h2 className="text-lg font-semibold text-slate-800">
                Core Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold leading-6 text-slate-700">
                    Primary Logo
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    Default logo used everywhere
                  </p>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                    {dna.logoUrl ? (
                      <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
                            <img
                              src={dna.logoUrl || undefined}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-slate-700 font-medium font-mono">
                              logo-primary.png
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Primary Brand Logo
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadLogo(dna.logoUrl, `${dna.name || "product"}-logo-primary.png`)}
                            className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-850 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold border border-slate-200 active:scale-95"
                            title="Download Logo"
                          >
                            <Download className="w-3.5 h-3.5 text-[#7C3AED]" />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo("logoUrl")}
                            className="p-1.5 sm:p-2 text-red-500 hover:text-red-650 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold border border-red-500/10 active:scale-95"
                            title="Remove Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/jpeg, image/png"
                        onChange={(e) => handleLogoUpload(e, "logoUrl")}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 sm:file:mr-4 sm:file:py-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#7C3AED]/10 file:text-[#7C3AED] hover:file:bg-[#7C3AED]/20 transition-colors"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold leading-6 text-slate-700">
                      Light Logo
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      Used on dark backgrounds
                    </p>
                    <div className="mt-2">
                       {dna.logoLightUrl ? (
                        <div className="flex flex-col gap-2">
                          <div className="h-14 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-900 flex items-center justify-center">
                            <img
                              src={dna.logoLightUrl || undefined}
                              alt="Light Logo"
                              className="max-h-10 max-w-full object-contain"
                            />
                          </div>
                          <div className="flex items-center gap-2 font-sans">
                            <button
                              type="button"
                              onClick={() => handleDownloadLogo(dna.logoLightUrl, `${dna.name || "product"}-logo-light.png`)}
                              className="flex-1 py-1 px-1.5 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 rounded-lg text-center text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 border border-[#7C3AED]/20"
                            >
                               <Download className="w-3 h-3" /> Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo("logoLightUrl")}
                              className="flex-1 py-1 px-1.5 bg-red-400/15 text-red-500 hover:bg-red-400/25 rounded-lg text-center text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 border border-red-500/15"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => handleLogoUpload(e, "logoLightUrl")}
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold leading-6 text-slate-700">
                      Dark Logo
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      Used on light backgrounds
                    </p>
                    <div className="mt-2">
                      {dna.logoDarkUrl ? (
                        <div className="flex flex-col gap-2">
                          <div className="h-14 w-full rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                            <img
                              src={dna.logoDarkUrl || undefined}
                              alt="Dark Logo"
                              className="max-h-10 max-w-full object-contain"
                            />
                          </div>
                          <div className="flex items-center gap-2 font-sans">
                            <button
                              type="button"
                              onClick={() => handleDownloadLogo(dna.logoDarkUrl, `${dna.name || "product"}-logo-dark.png`)}
                              className="flex-1 py-1 px-1.5 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 rounded-lg text-center text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 border border-[#7C3AED]/20"
                            >
                              <Download className="w-3 h-3" /> Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo("logoDarkUrl")}
                              className="flex-1 py-1 px-1.5 bg-red-400/15 text-red-500 hover:bg-red-400/25 rounded-lg text-center text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 border border-red-500/15"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => handleLogoUpload(e, "logoDarkUrl")}
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-100 file:text-slate-700"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold leading-6 text-slate-700"
                >
                  Product Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={dna.name}
                    onChange={handleChange}
                    className="glass-input px-4 py-3"
                    placeholder="My Product"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="positioning"
                className="block text-sm font-semibold leading-6 text-slate-700"
              >
                Positioning / Value Prop
              </label>
              <div className="mt-2">
                <textarea
                  name="positioning"
                  id="positioning"
                  rows={2}
                  value={dna.positioning}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., AI-powered social campaign engine..."
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="audience"
                className="block text-sm font-semibold leading-6 text-slate-700"
              >
                Target Audience Persona
              </label>
              <div className="mt-2">
                <textarea
                  name="audience"
                  id="audience"
                  rows={2}
                  value={dna.audience}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Solo founder / Head of Growth at early-stage SaaS..."
                  required
                />
              </div>
            </div>
          </div>

          {/* AI Auto-Fill */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-6 bg-gradient-to-br from-white/60 to-violet-50/20 border-slate-200">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-4">
              <Sparkles className="h-5 w-5 text-[#7C3AED]" />
              <h2 className="text-lg font-semibold text-slate-800">AI Auto-Fill</h2>
            </div>

            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Skip the manual setup. Drop your website URL or upload your
              product docs, and let our AI instantly reverse-engineer your core
              positioning, target audience, and unique tone of voice.
            </p>

            <div>
              <label
                htmlFor="website"
                className="flex items-center gap-2 text-sm font-semibold leading-6 text-slate-700"
              >
                <Globe className="h-4 w-4 text-slate-400" />
                Website URL
              </label>
              <div className="mt-2">
                <input
                  type="url"
                  name="website"
                  id="website"
                  value={dna.website}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="https://your-saas.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="flex items-center gap-2 text-sm font-semibold leading-6 text-slate-700"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Description
              </label>
              <div className="mt-2">
                <textarea
                  name="description"
                  id="description"
                  rows={2}
                  value={dna.description || ""}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="Briefly describe what you build..."
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold leading-6 text-slate-700">
                <Link className="h-4 w-4 text-slate-400" />
                Document (PDF/TXT/MD)
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleDocumentUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
                />
                {productDocument && (
                  <p className="mt-2 text-xs text-green-600 font-medium truncate">
                    ✓ {productDocument.name}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleResearch}
              disabled={
                isResearching ||
                (!dna.website && !dna.description && !productDocument)
              }
              className="tour-dna-extract-btn glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {isResearching ? (
                <VideoLoader className="mr-2 h-7 w-7" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Extract Brand DNA
            </button>
          </div>

          {/* Brand Voice */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-4">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-slate-800">Brand Voice</h2>
            </div>

            <div>
              <label
                htmlFor="tone"
                className="block text-sm font-semibold leading-6 text-slate-700"
              >
                Tone of Voice
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="tone"
                  id="tone"
                  value={dna.tone}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Professional, insight-driven"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-semibold leading-6 text-slate-700"
              >
                Company Stage
              </label>
              <div className="mt-2">
                <select
                  name="stage"
                  id="stage"
                  value={dna.stage}
                  onChange={handleChange}
                  className="glass-input px-4 py-3 appearance-none"
                >
                  <option value="" className="text-slate-800 bg-white">
                    Select stage...
                  </option>
                  <option value="MVP" className="text-slate-800 bg-white">
                    MVP / Pre-revenue
                  </option>
                  <option value="Early Growth" className="text-slate-800 bg-white">
                    Early Growth (10-100 customers)
                  </option>
                  <option value="Scaling" className="text-slate-800 bg-white">
                    Scaling ($1M+ ARR)
                  </option>
                  <option value="Enterprise" className="text-slate-800 bg-white">
                    Enterprise
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual DNA */}
          <div className="lg:col-span-2 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-4">
              <Palette className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-800">Visual DNA</h2>
            </div>

            <div>
              <label
                htmlFor="visualStyle"
                className="block text-sm font-semibold leading-6 text-slate-700"
              >
                Overall Aesthetic / Mood Board
              </label>
              <div className="mt-2">
                <textarea
                  name="visualStyle"
                  id="visualStyle"
                  rows={2}
                  value={dna.visualStyle || ""}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Minimalist, light elegance, purple accents..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              {/* Colors */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Color Palette
                  </span>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="text-[#7C3AED] hover:text-[#7C3AED]/80 text-xs font-semibold px-2 py-1 rounded bg-[#7C3AED]/10"
                  >
                    + Add Color
                  </button>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(dna.visualData?.colors || []).map((color, idx) => (
                    <div key={idx} className="group relative flex items-center">
                      <div
                        className="w-10 h-10 rounded-full shadow-sm border border-black/10 relative overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        <input
                          type="color"
                          value={color || "#000000"}
                          onChange={(e) =>
                            handleColorChange(idx, e.target.value)
                          }
                          className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {color}
                      </span>
                    </div>
                  ))}
                  {(dna.visualData?.colors || []).length === 0 && (
                    <p className="text-xs text-slate-400">
                      No colors added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Fonts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Typography
                </h3>
                {dna.visualData?.fonts?.primary &&
                  getFontUrl(dna.visualData.fonts.primary) && (
                    <style>
                      {`@import url('${getFontUrl(dna.visualData.fonts.primary)}');`}
                    </style>
                  )}
                {dna.visualData?.fonts?.secondary &&
                  getFontUrl(dna.visualData.fonts.secondary) && (
                    <style>
                      {`@import url('${getFontUrl(dna.visualData.fonts.secondary)}');`}
                    </style>
                  )}
                <datalist id="google-fonts-list">
                  {filteredFonts.map((font, idx) => (
                    <option key={`${font}-${idx}`} value={font} />
                  ))}
                </datalist>
                <div className="space-y-3">
                  <div className="bg-slate-50/50 border-slate-200 rounded-xl p-3 border flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm text-2xl border border-slate-200 text-slate-800 shrink-0"
                        style={{
                          fontFamily: dna.visualData?.fonts?.primary
                            ? `"${dna.visualData.fonts.primary}", sans-serif`
                            : "inherit",
                        }}
                      >
                        Aa
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5 font-semibold">
                          Primary (Headings)
                        </span>
                        <input
                          type="text"
                          list="google-fonts-list"
                          value={dna.visualData?.fonts?.primary || ""}
                          onFocus={(e) => setFontSearch(e.target.value)}
                          onChange={(e) => {
                            setFontSearch(e.target.value);
                            handleFontChange("primary", e.target.value);
                          }}
                          placeholder="Search or type a font..."
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[#7C3AED] outline-none text-sm font-medium text-slate-800 pb-1 placeholder:font-normal placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 border-slate-200 rounded-xl p-3 border flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm text-2xl border border-slate-200 text-slate-800 shrink-0"
                        style={{
                          fontFamily: dna.visualData?.fonts?.secondary
                            ? `"${dna.visualData.fonts.secondary}", sans-serif`
                            : "inherit",
                        }}
                      >
                        Aa
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5 font-semibold">
                          Secondary (Body)
                        </span>
                        <input
                          type="text"
                          list="google-fonts-list"
                          value={dna.visualData?.fonts?.secondary || ""}
                          onFocus={(e) => setFontSearch(e.target.value)}
                          onChange={(e) => {
                            setFontSearch(e.target.value);
                            handleFontChange("secondary", e.target.value);
                          }}
                          placeholder="Search or type a font..."
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[#7C3AED] outline-none text-sm font-medium text-slate-800 pb-1 placeholder:font-normal placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchy & Style */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border-slate-200 rounded-lg p-3 border flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Hierarchy
                  </h4>
                  <textarea
                    value={dna.visualData?.typographyHierarchy || ""}
                    onChange={(e) =>
                      handleVisualTextChange(
                        "typographyHierarchy",
                        e.target.value,
                      )
                    }
                    placeholder="Describe how headings, subheadings, and body text are used..."
                    className="w-full flex-1 min-h-[80px] bg-white border-slate-200 rounded border p-2 text-xs text-slate-700 leading-relaxed outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div className="bg-slate-50 border-slate-200 rounded-lg p-3 border flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Image Style
                  </h4>
                  <textarea
                    value={dna.visualData?.imageStyle || ""}
                    onChange={(e) =>
                      handleVisualTextChange("imageStyle", e.target.value)
                    }
                    placeholder="Describe the aesthetic and style of images..."
                    className="w-full flex-1 min-h-[80px] bg-white border-slate-200 rounded border p-2 text-xs text-slate-700 leading-relaxed outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADVANCED DNA (Psychographics & Strategy) */}
        <div className="glass-panel shadow-sm border border-slate-200 overflow-hidden mb-8 mt-8">
          <div 
            onClick={() => setIsPsychographicsExpanded(!isPsychographicsExpanded)}
            className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#7C3AED]" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                Deep Psychographics & Strategy
              </h2>
              <span className="text-[10px] bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
                {isPsychographicsExpanded ? "click to collapse" : "click to expand / edit"}
              </span>
            </div>
            {isPsychographicsExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#7C3AED]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#7C3AED]" />
            )}
          </div>
          {isPsychographicsExpanded && (
            <div className="p-6 text-left">
            <p className="text-sm text-slate-500 mb-6 border-l-2 border-[#7C3AED] pl-3">
              This root-level intelligence powers Tror's ability to write highly
              specific, empathy-driven hooks rather than generic AI copy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* The Why */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Globe className="h-3.5 w-3.5" /> The Narrative (The "Why")
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    The Enemy / Status Quo
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    What old way of doing things is this product trying to kill?
                  </p>
                  <textarea
                    name="enemy"
                    value={dna.enemy || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-20"
                    placeholder="e.g., Endless manual spreadsheet reconciliation..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    The "Earned Secret"
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    What does this company know about the industry that nobody
                    else realizes?
                  </p>
                  <textarea
                    name="earnedSecret"
                    value={dna.earnedSecret || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Origin Story
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Why was this built? What was the founding frustration?
                  </p>
                  <textarea
                    name="originStory"
                    value={dna.originStory || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-24"
                  />
                </div>
              </div>

              {/* The Who */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Target className="h-3.5 w-3.5" /> JTBD & Psychographics (The
                  "Who")
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" /> "Hell"
                      State
                    </label>
                    <textarea
                      name="hellState"
                      value={dna.hellState || ""}
                      onChange={handleChange}
                      placeholder="Before: The exact pain..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-red-500/10 focus:border-red-500 outline-none h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-600" /> "Heaven"
                      State
                    </label>
                    <textarea
                      name="heavenState"
                      value={dna.heavenState || ""}
                      onChange={handleChange}
                      placeholder="After: The emotional payoff..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Top 3 Buying Objections
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Why do people say no? (we will dismantle these in copy)
                  </p>
                  <textarea
                    name="objections"
                    value={dna.objections || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-20"
                  />
                </div>
              </div>

              {/* The How & The Voice */}
              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Zap className="h-3.5 w-3.5" /> Product & Proof (The "How")
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Unique Mechanism
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    How exactly does it deliver results differently?
                  </p>
                  <textarea
                    name="uniqueMechanism"
                    value={dna.uniqueMechanism || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Proof Points / Hard Numbers
                  </label>
                  <textarea
                    name="proofPoints"
                    value={dna.proofPoints || ""}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-20"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <MessageSquare className="h-3.5 w-3.5" /> Brand Dictionary
                  (The "Voice")
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">
                    Words we ALWAYS use
                  </label>
                  <textarea
                    name="vocabularyAlways"
                    value={dna.vocabularyAlways || ""}
                    onChange={handleChange}
                    placeholder="e.g., Revenue-driven, Asynchronous, Craft..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-red-600 mb-1">
                    Words we NEVER use
                  </label>
                  <textarea
                    name="vocabularyNever"
                    value={dna.vocabularyNever || ""}
                    onChange={handleChange}
                    placeholder="e.g., Synergy, Hack, Ninja, Revolutionary..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-red-500/10 focus:border-red-500 outline-none h-20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOUNDER VOICE & AGENT DOPPELGANGER */}
      <div className="glass-panel shadow-sm border border-slate-200 overflow-hidden mb-8 mt-8">
        <div 
          onClick={() => setIsFounderExpanded(!isFounderExpanded)}
          className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
              Founder Voice & Doppelganger Agent
            </h2>
            <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
              {isFounderExpanded ? "click to collapse" : "click to expand / edit"}
            </span>
          </div>
          {isFounderExpanded ? (
            <ChevronUp className="h-4 w-4 text-violet-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-violet-600" />
          )}
        </div>

        {isFounderExpanded && (
          <div className="p-6 text-left space-y-6">
            <p className="text-sm text-slate-500 border-l-2 border-violet-500 pl-3">
              Provide context on how you think, communicate, and behave. Our AI will analyze your inputs to synthesize a 
              virtual Doppelganger Agent, allowing the engine to automate post-generation tasks in your exact voice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Founder Behavior & Personality Description
                </label>
                <p className="text-[10px] text-slate-400">
                  Describe your actions, activities, communication style, or emotional vibes.
                </p>
                <textarea
                  name="founderVoiceDescription"
                  value={dna.founderVoiceDescription || ""}
                  onChange={handleChange}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  placeholder="e.g., I speak directly with no jargon. I prefer short, punchy paragraphs. I am highly skeptical of corporate synergies but passionate about craft. In real life, I value speed over perfect alignment..."
                />
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Upload Founder Background (PDF/TXT/MD)
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Upload essays, blog drafts, or diary logs to train the agent on your natural voice.
                  </p>
                  <div className="mt-2">
                    {dna.founderVoiceFileName ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-violet-500" />
                          <div>
                            <p className="text-xs text-slate-700 font-semibold truncate max-w-[180px]">
                              {dna.founderVoiceFileName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Voice training document loaded
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFounderFile}
                          className="p-1 px-2.5 text-xs text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition-all font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 hover:border-violet-300 rounded-xl p-4 transition-colors bg-slate-50/50 flex flex-col items-center justify-center text-center relative">
                        <input
                          type="file"
                          accept=".pdf,.txt,.md"
                          onChange={handleFounderFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600 font-medium">
                          Click or drag file to upload
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PDF, TXT, or MD (Max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Synthesize Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSynthesizeFounderAgent}
                    disabled={isSynthesizing || (!dna.founderVoiceDescription && !dna.founderVoiceFileData)}
                    className="w-full glass-button-primary rounded-xl py-3 text-sm font-semibold flex items-center justify-center bg-violet-650 hover:bg-violet-750 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSynthesizing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Synthesizing Agent...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        Synthesize Founder Agent Profile
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress/Logs for synthesis */}
            {isSynthesizing && (
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 border border-slate-800 shadow-inner max-h-[160px] overflow-y-auto">
                <div className="flex justify-between text-[10px] text-violet-400 uppercase font-semibold tracking-wider">
                  <span>Synthesis Engine Active</span>
                  <span>{synthesisProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${synthesisProgress}%` }}
                  />
                </div>
                <div className="space-y-1 pt-1 select-none text-left">
                  {synthesisLogs.map((log, idx) => (
                    <p key={idx} className={log.startsWith(">") ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Display Synthesized Doppelganger Profile */}
            {dna.founderAgentSynthesized && !isSynthesizing && (
              <div className="border border-violet-100 bg-violet-50/10 rounded-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left">
                <div className="flex items-center justify-between border-b border-violet-100/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 border border-violet-200/50 animate-pulse">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-slate-800 font-display">
                        {dna.founderAgentSynthesized.personaName || "Active Doppelganger"}
                      </h3>
                      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider">
                        Virtual Agent Active
                      </p>
                    </div>
                  </div>
                  {dna.founderAgentSynthesized.synthesizedAt && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Profiled on {new Date(dna.founderAgentSynthesized.synthesizedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Traits */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                      <Brain className="h-3.5 w-3.5 text-violet-500" /> Personality & Traits
                    </h4>
                    <ul className="space-y-1.5">
                      {dna.founderAgentSynthesized.behavioralTraits?.map((trait, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-violet-400 font-bold">•</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Core Values */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                      <Target className="h-3.5 w-3.5 text-rose-500" /> Core Beliefs & Values
                    </h4>
                    <ul className="space-y-1.5">
                      {dna.founderAgentSynthesized.coreValues?.map((value, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Voice Style */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> Communication Style
                    </h4>
                    <ul className="space-y-1.5">
                      {dna.founderAgentSynthesized.communicationStyle?.map((style, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{style}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Heuristics */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" /> Decision Heuristics
                    </h4>
                    <ul className="space-y-1.5">
                      {dna.founderAgentSynthesized.decisionHeuristics?.map((rule, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        {/* ACTIONABLE CAMPAIGN STRATEGY */}
        <div className="glass-panel shadow-sm border border-slate-200 overflow-hidden mb-8 mt-8">
          <div 
            onClick={() => setIsCampaignStrategyExpanded(!isCampaignStrategyExpanded)}
            className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-display">
                Actionable Campaign Strategy
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-750 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
                {isCampaignStrategyExpanded ? "click to collapse" : "click to expand / edit"}
              </span>
            </div>
            {isCampaignStrategyExpanded ? (
              <ChevronUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          {isCampaignStrategyExpanded && (
            <div className="p-6 text-left">
            <p className="text-sm text-slate-500 mb-6 border-l-2 border-emerald-500 pl-3">
              This section holds the practical themes, content pillars, and ICPs
              you can copy-paste into the Campaign Generator. Let Tror guide
              your actual content production.
            </p>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Layout className="h-3.5 w-3.5" /> Content Pillars
                </h3>
                <p className="text-[10px] text-slate-400 mb-2">
                  3-5 strategic topics to alternate between.
                </p>
                <textarea
                  value={(dna.contentPillars || []).join("\n")}
                  onChange={(e) =>
                    handleArrayChange("contentPillars", e.target.value)
                  }
                  placeholder="e.g. Founder Learnings&#10;Industry Myths&#10;Customer Case Studies"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-32 whitespace-pre shadow-inner"
                />
              </div>
 
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Sparkles className="h-3.5 w-3.5" /> Recommended Campaign
                  Themes
                </h3>
                <p className="text-[10px] text-slate-400 mb-2">
                  Highly specific angles tailored for this business. Use these
                  as inputs when generating campaigns.
                </p>
                <textarea
                  value={(dna.recommendedThemes || []).join("\n")}
                  onChange={(e) =>
                    handleArrayChange("recommendedThemes", e.target.value)
                  }
                  placeholder="e.g. Stop wasting hours on manual tracking&#10;How we save agencies 20hrs/week"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none h-32 whitespace-pre shadow-inner"
                />
              </div>
            </div>
 
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Target ICPs & Pain Points
                </h3>
                <button
                  type="button"
                  onClick={addIcp}
                  className="text-emerald-700 text-xs font-medium px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200"
                >
                  + Add ICP
                </button>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(dna.targetIcps || []).map((icp, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => removeIcp(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      value={icp.name}
                      onChange={(e) =>
                        handleIcpChange(index, "name", e.target.value)
                      }
                      placeholder="ICP Name (e.g. Agency Owners)"
                      className="w-full bg-transparent border-b border-slate-200 outline-none text-sm font-semibold text-emerald-700 pb-1 mb-3 placeholder:text-slate-400"
                    />
                    <textarea
                      value={(icp.painPoints || []).join("\n")}
                      onChange={(e) =>
                        handleIcpChange(index, "painPoints", e.target.value)
                      }
                      placeholder="Pain point 1&#10;Pain point 2"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#7C3AED]/20 outline-none h-24 whitespace-pre placeholder-slate-400"
                    />
                  </div>
                ))}
                {(!dna.targetIcps || dna.targetIcps.length === 0) && (
                  <p className="text-xs text-gray-500 italic col-span-full">
                    No ICPs defined. Extract DNA to generate them.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Product
          </button>

          <div className="flex items-center gap-x-4">
            {saved && (
              <span className="text-sm text-[#7C3AED] font-semibold animate-in fade-in">
                Saved successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="glass-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {isSaving ? (
                <VideoLoader className="mr-2 h-7 w-7" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save DNA
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Product</h3>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                You are about to delete <strong>{activeProduct?.name}</strong>.
                This will permanently erase all associated Brand Position data
                and generated campaigns. This action cannot be undone.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type{" "}
                  <span className="font-bold text-red-650 select-all">
                    DELETE
                  </span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmation("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <VideoLoader className="mr-2 h-7 w-7" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Forever
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
