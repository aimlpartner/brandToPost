import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import {
  Loader2,
  CheckCircle2,
  Globe,
  Activity,
  Database,
  Sparkles,
  Terminal,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  FileText,
  Target,
  ChevronRight,
  Palette,
  Volume2,
  Info,
  Layers,
  HeartHandshake,
  LogOut,
  Pencil
} from "lucide-react";
import { researchProductDNA, researchFocus, generateCampaign } from "../services/geminiService";
import { db } from "../firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { logSilentError, handleFirestoreError, OperationType } from "../lib/firestore-error";
import { playSuccessChime } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { BrandExtractionModal } from "../components/BrandExtractionModal";
import { DnaModel } from "../components/DnaModel";

// --- SmartField component for onboarding (matches ProductDNA.tsx) ---
interface SmartFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  onChange: (val: string) => void;
  accentColor?: string;
}

function SmartField({ label, value, placeholder = "—", hint, multiline = false, onChange, accentColor }: SmartFieldProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (editing) {
      autoResize();
      if (multiline) textareaRef.current?.focus();
      else inputRef.current?.focus();
    }
  }, [editing, multiline]);

  const displayValue = value?.trim();

  return (
    <div className="group text-left">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor || "text-slate-450"}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
            editing ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="h-px bg-slate-100 mb-2" />

      {hint && !editing && (
        <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{hint}</p>
      )}

      {editing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); autoResize(); }}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-lg p-2 text-xs text-slate-800 placeholder-slate-350 outline-none resize-none overflow-hidden leading-relaxed transition-all"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-lg p-2 text-xs text-slate-800 placeholder-slate-350 outline-none transition-all"
          />
        )
      ) : (
        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${displayValue ? "text-slate-700 font-medium" : "text-slate-350 italic"}`}>
          {displayValue || placeholder}
        </p>
      )}
    </div>
  );
}

// --- SmartSelect component for onboarding (matches ProductDNA.tsx) ---
interface SmartSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

function SmartSelect({ label, value, options, onChange }: SmartSelectProps) {
  const [editing, setEditing] = useState(false);
  const display = value;

  return (
    <div className="text-left">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
            editing ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="h-px bg-slate-100 mb-2" />
      {editing ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-lg p-2 text-xs text-slate-850 outline-none transition-all"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <p className={`text-xs leading-relaxed ${display ? "text-slate-700 font-medium" : "text-slate-355 italic"}`}>
          {display || "Not set"}
        </p>
      )}
    </div>
  );
}

export function Onboarding() {
  const { user, userProfile, logout } = useAuth();
  const { activeProduct, updateProduct, addProduct, products, isLoaded } = useProducts();
  const navigate = useNavigate();

  // Initialize default product for brand new user if list is empty
  useEffect(() => {
    if (isLoaded && products.length === 0 && user && !activeProduct) {
      addProduct("My Product");
    }
  }, [isLoaded, products.length, user, activeProduct, addProduct]);

  // Wizard Steps
  // 1: Brand Scan (Inputs & Scan Console)
  // 2: Brand DNA Refinement (Edit extracted values)
  // 3: Brand Creatives (Upload assets)
  // 4: Campaign Form (Generate details + theme chips)
  // 5: Campaign Loading & Wait Screen
  // 6: Campaign Complete / Approve Screen
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // --- Step 1 State: Scanner Inputs & Scraper console ---
  const [website, setWebsite] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scanAbortControllerRef = useRef<AbortController | null>(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractionInputType, setExtractionInputType] = useState<"website" | "description" | "document">("website");

  // Extracted Brand DNA state
  const [dna, setDna] = useState<any>({
    name: "",
    website: "",
    positioning: "",
    audience: "",
    tone: "",
    stage: "Early Growth",
    visualStyle: "",
    visualData: {
      colors: ["#7C3AED", "#2583EB", "#0F172A"],
      fonts: { primary: "Outfit", secondary: "Inter" },
      typographyHierarchy: "Outfit for headings, Inter for body copy",
      imageStyle: "Modern, minimal, high-tech contrast overlays"
    },
    enemy: "",
    earnedSecret: "",
    originStory: "",
    hellState: "",
    heavenState: "",
    objections: "",
    uniqueMechanism: "",
    proofPoints: "",
    vocabularyAlways: "",
    vocabularyNever: "",
    contentPillars: [],
    targetIcps: [],
    recommendedThemes: []
  });

  useEffect(() => {
    if (activeProduct && step === 1) {
      setDna((prev: any) => {
        const merged = {
          ...prev,
          ...activeProduct,
          name: activeProduct.name || prev.name,
          website: activeProduct.website || prev.website,
          visualData: {
            colors: activeProduct.visualData?.colors || prev.visualData?.colors || ["#7C3AED", "#2583EB", "#0F172A"],
            fonts: {
              primary: activeProduct.visualData?.fonts?.primary || prev.visualData?.fonts?.primary || "Outfit",
              secondary: activeProduct.visualData?.fonts?.secondary || prev.visualData?.fonts?.secondary || "Inter"
            },
            typographyHierarchy: activeProduct.visualData?.typographyHierarchy || prev.visualData?.typographyHierarchy || "",
            imageStyle: activeProduct.visualData?.imageStyle || prev.visualData?.imageStyle || ""
          },
          targetIcps: activeProduct.targetIcps || prev.targetIcps || [],
          contentPillars: activeProduct.contentPillars || prev.contentPillars || [],
          recommendedThemes: activeProduct.recommendedThemes || prev.recommendedThemes || []
        };
        return merged;
      });
      if (activeProduct.name && activeProduct.name !== "My Product") {
        setBrandName(activeProduct.name);
      }
      if (activeProduct.website) {
        setWebsite(activeProduct.website);
      }
    }
  }, [activeProduct, step]);

  // --- Step 3 State: Creatives Upload ---
  const [uploadedCreatives, setUploadedCreatives] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- Step 4 State: Campaign Generation Form ---
  const [industry, setIndustry] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["LinkedIn", "X"]);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  // --- Step 5 State: Campaign Load & Wait Screen ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [draftCampaign, setDraftCampaign] = useState<any>(null);
  const genLogsEndRef = useRef<HTMLDivElement>(null);

  // --- Step 6 State: Campaign Complete & Approval ---
  const [isApproving, setIsApproving] = useState(false);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scanLogs]);

  useEffect(() => {
    if (genLogsEndRef.current) {
      genLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [genLogs]);

  // Handle Brand DNA Extraction Scan
  const handleBrandScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !user) {
      setError("Active product or user credentials not loaded.");
      return;
    }

    const targetWebsite = extractionInputType === "website" ? website.trim() : "";
    const targetDesc = extractionInputType === "description" ? brandDesc.trim() : "";

    setError(null);
    setUrlError(null);

    if (extractionInputType === "website") {
      if (!targetWebsite) {
        setUrlError("Please enter a Website URL to scan.");
        return;
      }
      
      const hasEmailIndicator = targetWebsite.includes('@');
      const hasDot = targetWebsite.includes('.');
      const tld = targetWebsite.split('.').pop() || '';
      
      if (hasEmailIndicator || !hasDot || tld.length < 2) {
        setUrlError("Please enter a valid website URL (e.g. stripe.com).");
        return;
      }
    }
    if (extractionInputType === "description" && !targetDesc) {
      setError("Please enter a Brand Description to extract DNA.");
      return;
    }
    if (!brandName.trim()) {
      setError("Please enter a Brand Name.");
      return;
    }

    setError(null);
    setIsScanning(true);
    setIsExtractionModalOpen(true);
    setExtractionComplete(false);
    setScanProgress(5);
    setScreenshotUrl(null);
    setScanLogs([
      "Initializing Tror Core [v2.5.0]...",
      "Booting Strategist Agent...",
      "Gathering brand context matrix..."
    ]);

    const abortController = new AbortController();
    scanAbortControllerRef.current = abortController;
    const signal = abortController.signal;

    try {
      let screenshotData: any = null;
      let microlinkMetadata: any = null;
      const targetWebsite = website.trim();

      if (targetWebsite) {
        setScanLogs((prev) => [
          ...prev,
          "Establishing connection to website: " + targetWebsite,
          "Fetching page snapshot via Microlink API..."
        ]);
        setScanProgress(20);

        try {
          const finalUrl = targetWebsite.startsWith("http") ? targetWebsite : `https://${targetWebsite}`;
          const encoded = encodeURIComponent(finalUrl);
          
          if (signal.aborted) {
            throw new DOMException("The user aborted a request.", "AbortError");
          }

          const response = await fetch(`https://api.microlink.io?url=${encoded}&screenshot=true&meta=true&palette=true&animations=false&waitForTimeout=4500`, { signal });
          
          if (!response.ok) {
            let errMsg = `HTTP status ${response.status}`;
            try {
              const errJson = await response.json();
              if (errJson.message) errMsg = errJson.message;
            } catch (_) {}
            throw new Error(`Microlink scan failed: ${errMsg}`);
          }

          const result = await response.json();
          if (result.status === "fail") {
            throw new Error(result.message || "Failed to scan website via Microlink.");
          }

          microlinkMetadata = result.data;
          if (result.data?.screenshot?.url) {
            const snapUrl = result.data.screenshot.url;
            setScreenshotUrl(snapUrl);
            setScanLogs((prev) => [...prev, "> Page Snapshot acquired successfully."]);
            setScanProgress(35);

            if (signal.aborted) {
              throw new DOMException("The user aborted a request.", "AbortError");
            }

            // Fetch screenshot base64
            const res = await fetch(snapUrl, { signal });
            if (!res.ok) {
              throw new Error(`Failed to download page screenshot from Microlink proxy (status ${res.status})`);
            }
            const blob = await res.blob();
            
            if (signal.aborted) {
              throw new DOMException("The user aborted a request.", "AbortError");
            }

            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(blob);
            });
            screenshotData = {
              data: base64.split(",")[1],
              mimeType: blob.type
            };
          } else {
            throw new Error("No screenshot image was captured by the scraper service.");
          }
        } catch (snapErr: any) {
          if (signal.aborted || snapErr.name === 'AbortError') {
            throw snapErr;
          }
          console.error("Screenshot capture failed:", snapErr);
          throw new Error(snapErr.message || snapErr);
        }
      }

      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      setScanLogs((prev) => [
        ...prev,
        "Scanning semantics and positioning NLP...",
        "Identifying pain points vs emotional transform goals...",
        "Extracting color schemes and brand identity..."
      ]);
      setScanProgress(60);

      const idToken = await user.getIdToken(true);

      const scanResult = await researchProductDNA(
        targetWebsite,
        { name: brandName || activeProduct.name, description: targetDesc },
        null,
        user.uid,
        screenshotData,
        microlinkMetadata,
        signal,
        idToken
      );

      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      setScanLogs((prev) => [
        ...prev,
        "JSON payload parsed successfully.",
        "Synchronizing memory graph...",
        "Onboarding Brand DNA configured."
      ]);
      setScanProgress(100);

      // Map result with strict fallback protection to prevent TypeErrors in Step 2 rendering
      const parsedDna = {
        ...dna,
        ...scanResult,
        name: brandName || scanResult.name || activeProduct.name || dna.name,
        website: targetWebsite || activeProduct.website || dna.website,
        visualData: {
          colors: scanResult.visualData?.colors || dna.visualData?.colors || ["#7C3AED", "#2583EB", "#0F172A"],
          fonts: {
            primary: scanResult.visualData?.fonts?.primary || dna.visualData?.fonts?.primary || "Outfit",
            secondary: scanResult.visualData?.fonts?.secondary || dna.visualData?.fonts?.secondary || "Inter",
          },
          typographyHierarchy: scanResult.visualData?.typographyHierarchy || dna.visualData?.typographyHierarchy || "",
          imageStyle: scanResult.visualData?.imageStyle || dna.visualData?.imageStyle || ""
        },
        targetIcps: scanResult.targetIcps || dna.targetIcps || [],
        contentPillars: scanResult.contentPillars || dna.contentPillars || [],
        recommendedThemes: scanResult.recommendedThemes || dna.recommendedThemes || []
      };

      // Set fallback logo if found
      if (microlinkMetadata?.logo?.url) {
        let logoBase64 = microlinkMetadata.logo.url;
        try {
          const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(microlinkMetadata.logo.url)}`;
          const response = await fetch(proxiedUrl);
          if (response.ok) {
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) {
          console.error("Failed to convert crawled onboarding logo to base64:", e);
        }
        if (!parsedDna.logoUrl) parsedDna.logoUrl = logoBase64;
        if (!parsedDna.logoLightUrl) parsedDna.logoLightUrl = logoBase64;
        if (!parsedDna.logoDarkUrl) parsedDna.logoDarkUrl = logoBase64;
      }

      // Add media images to creatives if found
      if (user && scanResult.extractedMediaImages && Array.isArray(scanResult.extractedMediaImages)) {
        try {
          const mediaImages = scanResult.extractedMediaImages as string[];
          for (let i = 0; i < mediaImages.length; i++) {
            await addDoc(collection(db, "creatives"), {
              productId: activeProduct.id, 
              userId: user.uid, 
              url: mediaImages[i],
              name: `Website Showcase Asset ${i + 1}`, 
              assetType: 'website_showcase',
              source: 'scraped_website',
              createdAt: new Date().toISOString(),
            });
          }
          setUploadedCreatives((prev) => [
            ...prev,
            ...mediaImages.map((url, i) => ({ name: `Website Showcase Asset ${i + 1}`, url }))
          ]);
        } catch (err) {
          logSilentError(err as Error, { context: "addExtractedMediaImagesToCreativesOnboarding" });
        }
      }

      // Add delay to show complete state
      setTimeout(async () => {
        setDna(parsedDna);
        setExtractionComplete(true);

        // Auto-save and move to step 2 directly without waiting or asking
        if (activeProduct && user) {
          try {
            await updateProduct(activeProduct.id, {
              ...parsedDna,
              logoUrl: parsedDna.logoUrl || null,
              logoDarkUrl: parsedDna.logoDarkUrl || null,
              logoLightUrl: parsedDna.logoLightUrl || null,
            });
          } catch (err) {
            console.error("Failed to save initial DNA scan:", err);
          }
        }
        setStep(2);
      }, 1000);

    } catch (err: any) {
      if (signal.aborted || err.name === 'AbortError') {
        console.log("Onboarding scan aborted by user.");
        setScanLogs((prev) => [...prev, "Scan cancelled by user."]);
        setIsScanning(false);
        setIsExtractionModalOpen(false);
        return;
      }
      logSilentError(err as Error, { context: "handleBrandScanOnboarding" });
      setError("Brand scan extraction failed: " + (err.message || "Please verify URL or try with description."));
      setIsScanning(false);
      setIsExtractionModalOpen(false);
    } finally {
      if (scanAbortControllerRef.current === abortController) {
         scanAbortControllerRef.current = null;
      }
    }
  };

  const handleCancelScan = () => {
    if (isScanning && scanAbortControllerRef.current) {
      scanAbortControllerRef.current.abort();
      scanAbortControllerRef.current = null;
      setIsScanning(false);
    }
    setIsExtractionModalOpen(false);
  };

  // Step 2 DNA refine change handlers
  const handleDnaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDna({ ...dna, [e.target.name]: e.target.value });
  };

  const handleColorChange = (index: number, val: string) => {
    const colors = [...dna.visualData.colors];
    colors[index] = val;
    setDna({ ...dna, visualData: { ...dna.visualData, colors } });
  };

  const handleFontChange = (type: "primary" | "secondary", val: string) => {
    setDna({
      ...dna,
      visualData: {
        ...dna.visualData,
        fonts: { ...dna.visualData.fonts, [type]: val }
      }
    });
  };

  const handleAddIcp = () => {
    setDna({
      ...dna,
      targetIcps: [...dna.targetIcps, { name: "", painPoints: [] }]
    });
  };

  const handleIcpChange = (index: number, field: "name" | "painPoints", val: string) => {
    const icps = [...dna.targetIcps];
    if (field === "name") {
      icps[index].name = val;
    } else {
      icps[index].painPoints = val.split("\n").filter((s) => s.trim() !== "");
    }
    setDna({ ...dna, targetIcps: icps });
  };

  const handleRemoveIcp = (index: number) => {
    const icps = dna.targetIcps.filter((_: any, i: number) => i !== index);
    setDna({ ...dna, targetIcps: icps });
  };

  // Save Step 2 Brand DNA
  const handleSaveDna = async () => {
    if (!activeProduct || !user) return;
    try {
      await updateProduct(activeProduct.id, {
        name: dna.name,
        website: dna.website,
        positioning: dna.positioning,
        audience: dna.audience,
        tone: dna.tone,
        stage: dna.stage,
        visualStyle: dna.visualStyle || `Palette: ${dna.visualData.colors.join(", ")}`,
        visualData: dna.visualData,
        logoUrl: dna.logoUrl || null,
        logoDarkUrl: dna.logoDarkUrl || null,
        logoLightUrl: dna.logoLightUrl || null,
        enemy: dna.enemy,
        earnedSecret: dna.earnedSecret,
        originStory: dna.originStory,
        hellState: dna.hellState,
        heavenState: dna.heavenState,
        objections: dna.objections,
        uniqueMechanism: dna.uniqueMechanism,
        proofPoints: dna.proofPoints,
        vocabularyAlways: dna.vocabularyAlways,
        vocabularyNever: dna.vocabularyNever,
        contentPillars: dna.contentPillars,
        targetIcps: dna.targetIcps
      });
      setStep(3); // Go to step 3: Upload creatives
    } catch (err: any) {
      setError("Failed to save brand details: " + err.message);
    }
  };

  // Step 3 Upload files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedArray: typeof uploadedCreatives = [];
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Only JPEG and PNG images are supported.");
        setIsUploading(false);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Images must be smaller than 5MB.");
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const creativeObj = {
            productId: activeProduct!.id,
            userId: user!.uid,
            url: base64String,
            name: file.name,
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, "creatives"), creativeObj);
          uploadedArray.push({ name: file.name, url: base64String });
        } catch (uploadErr) {
          console.error("Failed uploading creative asset:", uploadErr);
        }

        processed++;
        if (processed === files.length) {
          setUploadedCreatives((prev) => [...prev, ...uploadedArray]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 4 Campaign Setup Selection & Generate trigger
  const handleThemeChipClick = (theme: string) => {
    setSelectedTheme(theme);
    setFocusTopic(theme);
    // Parse possible subcategory from the theme keywords
    if (theme.toLowerCase().includes("cost")) {
      setSubcategory("ROI Leakage & Wastage");
    } else if (theme.toLowerCase().includes("myth")) {
      setSubcategory("Industry Debunking & Truth");
    } else if (theme.toLowerCase().includes("story")) {
      setSubcategory("Founder origin & Frustrations");
    } else {
      setSubcategory("Problem Empathy & Transformation");
    }
  };

  const handleGenerateCampaignOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !user) return;
    if (!focusTopic) {
      setError("Please specify a campaign topic or select one of the themes.");
      return;
    }

    setError(null);
    setStep(5); // Go to step 5: Campaign loading console
    setIsGenerating(true);
    setGenProgress(10);
    setGenLogs([
      "Launching Campaign Engine [v3.0]...",
      "Ingesting refined Brand DNA Positioning matrix...",
      "Target Channels configured: " + selectedChannels.join(", ")
    ]);

    try {
      setGenLogs((prev) => [
        ...prev,
        `Researching market positioning for Topic: "${focusTopic}"`,
        "Gathering real-time market data insights via Google Search API..."
      ]);
      setGenProgress(30);

      const idToken = await user.getIdToken(true);

      const insightsResult = await researchFocus(
        focusTopic,
        selectedChannels,
        subcategory,
        user.uid,
        idToken
      );

      setGenLogs((prev) => [
        ...prev,
        "> Insights harvested successfully.",
        "Drafting week-long campaign copy sequence...",
        "Constructing custom visual overlay templates..."
      ]);
      setGenProgress(60);

      const generated = await generateCampaign(
        { ...activeProduct, ...dna },
        focusTopic,
        insightsResult,
        false, // generateImages: false (uses overlays - much faster & cleaner)
        undefined,
        undefined,
        selectedChannels,
        selectedTheme || focusTopic,
        subcategory,
        user.uid,
        aspectRatio,
        (currentStep, total, msg) => {
          setGenProgress(Math.min(60 + Math.floor((currentStep / total) * 30), 95));
          setGenLogs((prev) => [...prev, msg]);
        },
        idToken
      );

      // Auto-assign dates to start next Monday
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      const formattedMonday = nextMonday.toISOString().split("T")[0];

      const dayOffsets: Record<string, number> = {
        Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6
      };

      if (generated.dailyPosts) {
        generated.dailyPosts = generated.dailyPosts.map((dp) => {
          const offset = dayOffsets[dp.day] || 0;
          const postDate = new Date(formattedMonday + "T12:00:00Z");
          postDate.setDate(postDate.getDate() + offset);
          return { ...dp, date: postDate.toISOString().split("T")[0] };
        });
      }

      const campaignObj = {
        ...generated,
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        productId: activeProduct.id,
        createdAt: new Date().toISOString(),
        startDate: formattedMonday,
        focus: focusTopic,
        subCategory: subcategory,
        campaignThemeInput: selectedTheme || focusTopic
      };

      setGenProgress(100);
      setGenLogs((prev) => [...prev, "Campaign structured. Synchronizing memory graph..."]);

      playSuccessChime();

      setTimeout(() => {
        setDraftCampaign(campaignObj);
        setIsGenerating(false);
        setStep(6); // Go to step 6: Approve screen
      }, 1000);

    } catch (err: any) {
      logSilentError(err as Error, { context: "generateCampaignOnboarding" });
      setError("Campaign generation failed: " + (err.message || "Please try again."));
      setStep(4); // Fallback to step 4
      setIsGenerating(false);
    }
  };

  // Step 6 Approval & Save Campaign
  const handleApproveCampaign = async () => {
    if (!draftCampaign || !user || isApproving) return;

    setIsApproving(true);
    try {
      const campaignToSave = {
        ...draftCampaign,
        userId: user.uid,
        productName: dna.name,
        productLogoUrl: activeProduct?.logoUrl || null
      };

      // Save to Firestore
      await setDoc(doc(db, "campaigns", draftCampaign.id), campaignToSave);

      // Mark Onboarding Complete in local storage & Firestore User Profile
      localStorage.setItem(`onboardingCompleted_${user.uid}`, "true");
      const profileDoc: any = {
        uid: user.uid,
        name: user.displayName || "User",
        role: "User",
        onboarded: true,
      };
      if (userProfile?.createdAt) {
        profileDoc.createdAt = userProfile.createdAt;
      } else {
        profileDoc.createdAt = new Date().toISOString();
      }
      if (user.email) profileDoc.email = user.email;
      if (user.displayName) profileDoc.displayName = user.displayName;
      if (user.photoURL) profileDoc.photoURL = user.photoURL;
      await setDoc(doc(db, "users", user.uid), profileDoc, { merge: true });

      // Navigate to campaigns list with tour=true
      navigate(`/dashboard/campaigns?id=${draftCampaign.id}&tour=true`, { replace: true });
    } catch (err: any) {
      logSilentError(err as Error, { context: "approveCampaignOnboarding" });
      setError("Failed to save campaign: " + err.message);
      setIsApproving(false);
    }
  };

  const handleSkipOnboarding = async () => {
    if (!user) return;
    try {
      localStorage.setItem(`onboardingCompleted_${user.uid}`, "true");
      const profileDoc: any = {
        uid: user.uid,
        name: user.displayName || "User",
        role: "User",
        onboarded: true,
      };
      if (userProfile?.createdAt) {
        profileDoc.createdAt = userProfile.createdAt;
      } else {
        profileDoc.createdAt = new Date().toISOString();
      }
      if (user.email) profileDoc.email = user.email;
      if (user.displayName) profileDoc.displayName = user.displayName;
      if (user.photoURL) profileDoc.photoURL = user.photoURL;
      await setDoc(doc(db, "users", user.uid), profileDoc, { merge: true });
    } catch (e) {
      console.error("Failed to save skipped onboarding in Firestore:", e);
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-8 pt-6 sm:pt-10 relative selection:bg-[#7C3AED] selection:text-white select-none">

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-50">
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        {/* Header Branding */}
        <div className="flex items-center justify-between w-full mb-6 sm:mb-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/B2PLOGO.png"
              alt="Logo"
              className="h-9 object-contain drop-shadow-md select-none pointer-events-none"
            />
            <span className="text-xl font-bold font-display text-slate-800 tracking-tight select-none">
              BrandToPost
            </span>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-slate-500 hover:text-slate-850 hover:bg-slate-200/50 py-1.5 px-3 border border-slate-350 bg-white/70 hover:border-slate-450 rounded-lg font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm font-semibold text-center shadow-sm">
            <div>{error}</div>
          </div>
        )}

        {/* Wizard Panel wrapper */}
        <div className="w-full bg-white/90 border border-slate-200/80 shadow-[0_30px_70px_rgba(15,23,42,0.06)] rounded-3xl overflow-hidden flex flex-col min-h-[500px] backdrop-blur-md">
          {/* Progress Indicator */}
          {step <= 4 && (
            <div className="w-full border-b border-slate-200/60 bg-slate-50/50 p-4 flex items-center justify-around text-xs font-sans font-semibold text-slate-500">
              {[
                { label: "1. Scan Brand", s: 1 },
                { label: "2. Refine DNA", s: 2 },
                { label: "3. Brand Assets", s: 3 },
                { label: "4. Setup Campaign", s: 4 }
              ].map((item) => (
                <div
                  key={item.s}
                  className={`flex items-center gap-1.5 transition-colors ${
                    step === item.s
                      ? "text-[#7C3AED] font-bold"
                      : step > item.s
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border font-bold ${
                      step === item.s
                        ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                        : step > item.s
                        ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                        : "border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                  >
                    {item.s}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: Scan Brand Input & Scraper Log */}
          {step === 1 && (
            <div className="flex-1 flex flex-col lg:flex-row h-full">
              {/* Left Form */}
              <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">Configure Brand Position</h2>
                    <p className="text-sm text-slate-500 font-light leading-relaxed">
                      Let's initialize your brand engine. Enter your website URL or describe your product, and our NLP model will parse the DOM and map your visual identity and positioning variables.
                    </p>
                  </div>

                  <form onSubmit={handleBrandScan} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. Stripe"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all"
                      />
                    </div>

                    {/* Tab Switcher for Scan Method */}
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setExtractionInputType("website");
                          setError(null);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          extractionInputType === "website"
                            ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Scan Website
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractionInputType("description");
                          setError(null);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          extractionInputType === "description"
                            ? "bg-white text-slate-800 shadow-sm border border-slate-200/20"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Describe Brand
                      </button>
                    </div>

                    {/* Conditional Input Rendering with smooth entry */}
                    <AnimatePresence mode="wait">
                      {extractionInputType === "website" ? (
                        <motion.div
                          key="website"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                              Website URL
                            </label>
                            <input
                              type="text"
                              value={website}
                              onChange={(e) => {
                                setWebsite(e.target.value);
                                if (urlError) setUrlError(null);
                              }}
                              placeholder="e.g. stripe.com"
                              className={`w-full bg-slate-50 border ${urlError ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/10"} focus:bg-white text-slate-800 focus:outline-none focus:ring-2 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all`}
                            />
                            {urlError && (
                              <p className="mt-1.5 text-xs font-semibold text-red-500">
                                {urlError}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="description"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                              Brand / Product Description
                            </label>
                            <textarea
                              rows={3}
                              value={brandDesc}
                              onChange={(e) => setBrandDesc(e.target.value)}
                              placeholder="Describe what your brand does, who it targets, and key features..."
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {extractionComplete ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (activeProduct && user) {
                            try {
                              await updateProduct(activeProduct.id, {
                                ...dna,
                                logoUrl: dna.logoUrl || null,
                                logoDarkUrl: dna.logoDarkUrl || null,
                                logoLightUrl: dna.logoLightUrl || null,
                              });
                            } catch (err) {
                              console.error("Failed to save initial DNA scan:", err);
                            }
                          }
                          setStep(2);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all text-sm cursor-pointer"
                      >
                        Save & Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : isScanning ? (
                      <button
                        type="button"
                        onClick={handleCancelScan}
                        className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-650 font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm cursor-pointer"
                      >
                        Cancel scan
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-[#7C3AED]/20 active:scale-[0.98] transition-all text-sm cursor-pointer"
                      >
                        {extractionInputType === "website" ? "Scan & Extract DNA" : "Extract Brand DNA"} <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Right panel: Terminal logs initially, then inline DNA Model visualizer during/after scanning */}
              {!(isScanning || scanProgress > 0) ? (
                /* Right Terminal Log Console */
                <div className="w-full lg:w-[45%] bg-slate-950/80 font-mono text-xs p-6 flex flex-col justify-between h-[350px] lg:h-auto overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Terminal className="w-4 h-4" />
                      <span>brand_scanner.stdout</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 text-slate-300 pr-1 scrollbar-thin scrollbar-thumb-white/10 min-h-[120px]">
                    <div className="text-slate-500 italic h-full flex items-center justify-center text-center">
                      Waiting for website scan parameters...
                    </div>
                  </div>
                </div>
              ) : (
                /* Inline 3D DNA Model visualizer */
                <div className="w-full lg:w-[45%] bg-[#FAF9F6] border-l border-slate-900/10 flex flex-col relative h-[450px] lg:h-auto overflow-hidden min-h-[350px] self-stretch">
                  {/* Floating Progress HUD Indicator */}
                  <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg text-emerald-600 text-[10px] font-mono font-bold tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>DNA_SYNTHESIS: {scanProgress}%</span>
                  </div>

                  <DnaModel progress={scanProgress} dna={dna} isComplete={extractionComplete} />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DNA Refinement (Refining Brand Positioning, Colors, Fonts, Objections, ICPs) */}
          {step === 2 && (
            <div className="p-6 sm:p-10 flex flex-col justify-between flex-1">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-display text-slate-800 mb-1">Refine Extracted Brand DNA</h2>
                  <p className="text-sm text-slate-500 font-light">
                    Gemini has parsed your brand. Confirm or edit the values below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto pr-2">
                  {/* Identity Section */}
                  <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <Globe className="w-4 h-4 text-[#7C3AED]" /> Identity & Voice
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <SmartField
                        label="Brand Name"
                        value={dna.name}
                        onChange={(val) => setDna({ ...dna, name: val })}
                      />
                      <SmartSelect
                        label="Estimated Stage"
                        value={dna.stage}
                        options={["MVP", "Early Growth", "Scaling", "Enterprise"]}
                        onChange={(val) => setDna({ ...dna, stage: val })}
                      />
                    </div>
                    <SmartField
                      label="Tone / Brand Voice"
                      value={dna.tone}
                      onChange={(val) => setDna({ ...dna, tone: val })}
                    />
                    <SmartField
                      label="Core Value Proposition"
                      value={dna.positioning}
                      multiline
                      onChange={(val) => setDna({ ...dna, positioning: val })}
                    />
                  </div>

                  {/* Visual Identity Section */}
                  <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <Palette className="w-4 h-4 text-[#7C3AED]" /> Visual Identity
                    </h3>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Primary Brand Colors (HEX)
                      </span>
                      <div className="h-px bg-slate-100 mb-2.5" />
                      <div className="flex items-center gap-3">
                        {dna.visualData.colors.slice(0, 3).map((col: string, idx: number) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5">
                            <div
                              className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
                              style={{ backgroundColor: col }}
                            />
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleColorChange(idx, e.target.value)}
                              className="w-[72px] text-center bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-800 p-1 font-mono focus:bg-white focus:border-[#7C3AED] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <SmartField
                        label="Primary Font"
                        value={dna.visualData.fonts.primary}
                        onChange={(val) => handleFontChange("primary", val)}
                      />
                      <SmartField
                        label="Secondary Font"
                        value={dna.visualData.fonts.secondary}
                        onChange={(val) => handleFontChange("secondary", val)}
                      />
                    </div>
                  </div>

                  {/* Psychographics Section */}
                  <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5 space-y-4 md:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-855 flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <Target className="w-4 h-4 text-[#7C3AED]" /> Psychographics & Strategy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SmartField
                        label="The Enemy (Status Quo)"
                        value={dna.enemy}
                        multiline
                        onChange={(val) => setDna({ ...dna, enemy: val })}
                      />
                      <SmartField
                        label="Earned Secret (What others miss)"
                        value={dna.earnedSecret}
                        multiline
                        onChange={(val) => setDna({ ...dna, earnedSecret: val })}
                      />
                      <SmartField
                        label="'Hell' State (Before product)"
                        value={dna.hellState}
                        multiline
                        accentColor="text-rose-500"
                        onChange={(val) => setDna({ ...dna, hellState: val })}
                      />
                      <SmartField
                        label="'Heaven' State (Payoff)"
                        value={dna.heavenState}
                        multiline
                        accentColor="text-emerald-600"
                        onChange={(val) => setDna({ ...dna, heavenState: val })}
                      />
                    </div>
                  </div>

                  {/* ICPs Section */}
                  <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-5 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <h3 className="text-sm font-semibold text-slate-850 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#7C3AED]" /> Ideal Customer Profiles (ICPs)
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddIcp}
                        className="text-[11px] bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 px-2 py-1 rounded-md border border-[#7C3AED]/20 hover:border-[#7C3AED] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add ICP
                      </button>
                    </div>

                    <div className="space-y-4">
                      {dna.targetIcps.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs italic py-4">
                          No Target ICPs specified. Click add to configure.
                        </div>
                      ) : (
                        dna.targetIcps.map((icp: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 relative">
                            <button
                              type="button"
                              onClick={() => handleRemoveIcp(idx)}
                              className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  ICP Name
                                </label>
                                <input
                                  type="text"
                                  value={icp.name}
                                  onChange={(e) => handleIcpChange(idx, "name", e.target.value)}
                                  placeholder="e.g. Agency Founders"
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] p-2 rounded-lg text-xs"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Core Pains (One per line)
                                </label>
                                <textarea
                                  rows={2}
                                  value={icp.painPoints.join("\n")}
                                  onChange={(e) => handleIcpChange(idx, "painPoints", e.target.value)}
                                  placeholder="e.g. Growth stagnation&#10;Lead acquisition fatigue"
                                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] p-2 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-5">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-350/80 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={handleSaveDna}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  Save & Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Brand Assets (Upload files) */}
          {step === 3 && (
            <div className="p-6 sm:p-10 flex flex-col justify-between flex-1">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">Upload Brand Assets</h2>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    Upload photos of your product, store, logo, or team to use in your social posts. For example: a clear product shot, your store exterior, or a clean logo file. If you skip this, the AI will design custom backdrops for you.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* File Upload Area */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-2xl p-8 text-center relative hover:border-[#7C3AED]/50 transition-colors group">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg, image/png"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="space-y-3">
                        <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">Ingesting Assets...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-[#7C3AED]/10 text-[#7C3AED] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Drag & Drop Files Here</p>
                          <p className="text-xs text-slate-400 mt-1">Accepts PNG, JPEG (Max 5MB each)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Files Grid Preview */}
                  <div className="flex flex-col justify-between bg-slate-50/40 p-5 rounded-2xl border border-slate-200/60 min-h-[200px]">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-3">Asset Library ({uploadedCreatives.length})</h3>
                      <div className="grid grid-cols-3 gap-3 max-h-[140px] overflow-y-auto pr-1">
                        {uploadedCreatives.length === 0 ? (
                          <div className="col-span-3 text-slate-500 text-xs italic text-center py-8">
                            No custom assets uploaded yet.
                          </div>
                        ) : (
                          uploadedCreatives.map((c, i) => (
                            <div key={i} className="aspect-square bg-white border border-slate-200 rounded-lg overflow-hidden relative group">
                              <img src={c.url} alt="Creative" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white p-1 text-center font-mono break-all">
                                {c.name.substring(0, 15)}...
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-4 bg-slate-100/60 p-2.5 rounded-xl border border-slate-200">
                      <Info className="w-4 h-4 text-[#7C3AED] shrink-0" />
                      <span>Assets are stored in your Brand Library for future campaign generation templates.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-5">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300/80 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl px-4 py-2.5 transition-all cursor-pointer"
                  >
                    Skip Upload
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Campaign Setup Form (Generated theme chips) */}
          {step === 4 && (
            <div className="p-6 sm:p-10 flex flex-col justify-between flex-1">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">Create First Weekly Campaign</h2>
                  <p className="text-sm text-slate-500 font-light">
                    Specify the target focus parameters for your campaign.
                  </p>
                </div>

                <form onSubmit={handleGenerateCampaignOnboarding} className="space-y-6">
                  {/* Theme suggestion chips */}
                  {dna.recommendedThemes && dna.recommendedThemes.length > 0 && (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Suggested Campaign Angles (Select to autofill)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dna.recommendedThemes.slice(0, 4).map((theme: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleThemeChipClick(theme)}
                            className={`px-3 py-1.5 rounded-full border text-[11px] transition-all text-left cursor-pointer ${
                              selectedTheme === theme
                                ? "bg-[#7C3AED] border-[#7C3AED] text-white font-semibold shadow-md shadow-[#7C3AED]/20 scale-[1.02]"
                                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/60 hover:text-slate-800"
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Target Industry
                      </label>
                      <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. B2B Software / Fintech"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Sub-category / Niche
                      </label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        placeholder="e.g. Subscription Analytics & Churn"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Campaign Focus Topic / Angle
                      </label>
                      <input
                        type="text"
                        value={focusTopic}
                        onChange={(e) => setFocusTopic(e.target.value)}
                        placeholder="e.g. The hidden costs of manual database syncs"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 py-3 px-4 rounded-xl placeholder:text-slate-400 text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Channels & Ratio config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/40 p-5 rounded-2xl border border-slate-200/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Target Social Platforms
                      </label>
                      <div className="flex items-center gap-3">
                        {["LinkedIn", "X", "Instagram", "Facebook", "Reddit"].map((ch) => {
                          const isSel = selectedChannels.includes(ch);
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => {
                                if (isSel) {
                                  setSelectedChannels(selectedChannels.filter((c) => c !== ch));
                                } else {
                                  setSelectedChannels([...selectedChannels, ch]);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSel
                                  ? "bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]"
                                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                              }`}
                            >
                              {ch}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Post Aspect Ratio
                      </label>
                      <div className="flex items-center gap-3">
                        {["1:1", "16:9", "9:16"].map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-3.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              aspectRatio === ratio
                                ? "bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-5">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-350/80 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSkipOnboarding}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl px-4 py-2.5 transition-all cursor-pointer"
                      >
                        Skip Campaign
                      </button>
                      <button
                        type="submit"
                        className="bg-[#7C3AED] hover:bg-[#6D28D9] hover:shadow-[#7C3AED]/20 text-white font-bold px-7 py-3 rounded-xl shadow-lg flex items-center gap-2 active:scale-[0.98] transition-all text-xs cursor-pointer"
                      >
                        Generate Campaign <ArrowRight className="w-4 h-4 animate-pulse" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: Campaign Loading & Wait Screen (Console logs) */}
          {step === 5 && (
            <div className="flex-grow flex flex-col justify-between p-6 sm:p-10 bg-slate-50/50 min-h-[400px]">
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-200/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow-lg relative shrink-0">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-800">Generating Social Campaign</h2>
                    <p className="text-xs text-[#7C3AED] font-semibold font-mono tracking-wider uppercase">
                      Running Tror Marketing Pipeline
                    </p>
                  </div>
                </div>

                {/* Console Log - Contained in a sleek obsidian shell */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-inner">
                  <div className="space-y-3 font-mono text-[11px] text-slate-300 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                    {genLogs.map((log, i) => (
                      <div
                        key={i}
                        className={`transition-all ${
                          log.startsWith(">") ? "text-[#a78bfa] ml-3 font-semibold" : "text-slate-400"
                        }`}
                      >
                        <span className="text-slate-600 mr-2">[{String(i + 1).padStart(2, "0")}]</span>
                        {log}
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 mt-2 text-[#a78bfa]">
                      <div className="w-1 h-3 bg-[#a78bfa] animate-pulse" />
                      Assembling assets & copy...
                    </div>
                    <div ref={genLogsEndRef} />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">Hang tight! This takes about 60 seconds.</p>
                  <p className="text-xs text-slate-500">
                    We are researching the topic and drafting daily post versions per platform.
                  </p>
                </div>
                <div className="text-[#7C3AED] font-mono font-bold text-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3.5 py-1.5 rounded-xl shrink-0">
                  Step {genProgress < 40 ? 1 : genProgress < 75 ? 2 : 3} of 3
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Campaign Complete / Preview & Approval */}
          {step === 6 && (
            <div className="p-6 sm:p-10 flex flex-col justify-between flex-1">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display text-slate-800">Campaign Generated successfully!</h2>
                    <p className="text-sm text-slate-500">
                      Your campaign is ready for approval. Review the summary of weekly posts below.
                    </p>
                  </div>
                </div>

                {draftCampaign && (
                  <div className="border border-slate-200 bg-slate-50/50 p-6 rounded-2xl space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200/60 pb-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          Campaign Theme
                        </span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                          {draftCampaign.theme}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          Audience Segment
                        </span>
                        <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                          {draftCampaign.targetAudience}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                          Confidence Score
                        </span>
                        <span className="text-sm font-bold text-emerald-600 mt-0.5 block">
                          {draftCampaign.confidenceScore}% Relevance
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        Weekly Post Schedule Preview
                      </span>
                      <div className="space-y-2">
                        {draftCampaign.dailyPosts?.map((dp: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 hover:border-[#7C3AED]/35 transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-xs font-bold text-[#7C3AED] font-mono w-20 shrink-0">
                                {dp.day}
                              </span>
                              <span className="text-xs text-slate-700 truncate max-w-sm sm:max-w-md">
                                {dp.platformVersions?.[0]?.copy || "Post copy generated."}
                              </span>
                            </div>
                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded shrink-0">
                              {dp.contentType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-5">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <HeartHandshake className="w-4 h-4 text-[#7C3AED]" />
                  <span>Approving auto-queues posts & drafts campaign workspace.</span>
                </div>
                <button
                  onClick={handleApproveCampaign}
                  disabled={isApproving}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-7 py-3 rounded-xl shadow-lg flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing...
                    </>
                  ) : (
                    <>
                      Approve & Enter App <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
