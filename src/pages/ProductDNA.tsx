import { VideoLoader } from "../components/VideoLoader";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Cpu,
  Brain,
  Upload,
  Megaphone,
  Pencil,
} from "lucide-react";
import { researchProductDNA, synthesizeFounderAgent } from "../services/geminiService";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { logSilentError } from "../lib/firestore-error";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { GOOGLE_FONTS, ADOBE_FONTS } from "../lib/fonts";
import { BrandExtractionModal } from "../components/BrandExtractionModal";

const ALL_FONTS = [...GOOGLE_FONTS, ...ADOBE_FONTS];
const POPULAR_FONTS = Array.from(new Set(ALL_FONTS)).sort();

const getFontUrl = (fontName: string) => {
  if (!fontName) return "";
  if (ADOBE_FONTS.includes(fontName)) return "";
  const formattedName = fontName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("+");
  return `https://fonts.googleapis.com/css?family=${formattedName}:300,400,500,600,700&display=swap`;
};
type TabKey = "identity" | "visual" | "psychographics" | "strategy";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "identity", label: "Identity", icon: Layout },
  { key: "visual", label: "Visual DNA", icon: Palette },
  { key: "psychographics", label: "Psychographics", icon: Target },
  { key: "strategy", label: "Strategy", icon: Megaphone },
];

// ─── SmartField: per-field view/edit with auto-height ───
interface SmartFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  onChange: (val: string) => void;
  accentColor?: string; // tailwind text color class for label
}

function SmartField({ label, value, placeholder = "—", hint, multiline = false, onChange, accentColor }: SmartFieldProps) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea to content height
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (editing) {
      autoResize();
      if (multiline) textareaRef.current?.focus();
      else inputRef.current?.focus();
    }
  }, [editing, autoResize, multiline]);

  const displayValue = value?.trim();

  return (
    <div className="group">
      {/* Header row: label + edit button */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor || "text-slate-400"}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1 text-xs transition-colors ${
            editing
              ? "text-[#7C3AED] font-semibold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Thin divider */}
      <div className="h-px bg-slate-100 mb-3" />

      {/* Hint text */}
      {hint && !editing && (
        <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{hint}</p>
      )}

      {/* Content area */}
      {editing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { onChange(e.target.value); autoResize(); }}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none resize-none overflow-hidden leading-relaxed transition-colors"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none transition-colors"
          />
        )
      ) : (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${displayValue ? "text-slate-800" : "text-slate-300 italic"}`}>
          {displayValue || placeholder}
        </p>
      )}
    </div>
  );
}

// ─── SmartSelect: same pattern but for dropdowns ───
interface SmartSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}

function SmartSelect({ label, value, options, onChange }: SmartSelectProps) {
  const [editing, setEditing] = useState(false);
  const display = options.find((o) => o.value === value)?.label || value;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1 text-xs transition-colors ${editing ? "text-[#7C3AED] font-semibold" : "text-slate-400 hover:text-slate-600"}`}
        >
          <Pencil className="h-3 w-3" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      {editing ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none appearance-none transition-colors"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <p className={`text-sm leading-relaxed ${display ? "text-slate-800" : "text-slate-300 italic"}`}>
          {display || "Not set"}
        </p>
      )}
    </div>
  );
}

// ─── FounderAgentField: editable bullet points ───
interface FounderAgentFieldProps {
  label: string;
  items: string[];
  icon: React.ElementType;
  color: string;
  dotColor: string;
  onChange: (newItems: string[]) => void;
}

function FounderAgentField({ label, items, icon: Icon, color, dotColor, onChange }: FounderAgentFieldProps) {
  const [editing, setEditing] = useState(false);
  const [textValue, setTextValue] = useState("");

  useEffect(() => {
    if (editing) {
      setTextValue(items.join("\n"));
    }
  }, [editing, items]);

  const handleSave = () => {
    const newItems = textValue
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    onChange(newItems);
    setEditing(false);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-left">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2.5 mb-2.5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
        </h4>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
            }
          }}
          className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
            editing ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Pencil className="h-3 w-3" strokeWidth={1.8} />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing ? (
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          rows={5}
          placeholder={`Enter each ${label.toLowerCase()} on a new line...`}
          className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-350 outline-none resize-none leading-relaxed transition-all"
        />
      ) : (
        <ul className="space-y-1.5">
          {items.length === 0 ? (
            <li className="text-xs text-slate-400 italic">None specified. Click Edit to add.</li>
          ) : (
            items.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-650 flex items-start gap-1.5">
                <span className={`${dotColor} font-bold mt-0.5`}>•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState<TabKey>("identity");

  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionInputType, setExtractionInputType] = useState<"website" | "document" | "description">("website");
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [extractionLogs, setExtractionLogs] = useState<string[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const extractionAbortControllerRef = useRef<AbortController | null>(null);

  const [fontSearch, setFontSearch] = useState("");
  const filteredFonts = useMemo(() => {
    const search = fontSearch.toLowerCase();
    return POPULAR_FONTS.filter((f) => f.toLowerCase().includes(search));
  }, [fontSearch]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisLogs, setSynthesisLogs] = useState<string[]>([]);
  const [synthesisProgress, setSynthesisProgress] = useState(0);

  useEffect(() => {
    if (activeProduct) setDna(activeProduct);
  }, [activeProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDna({ ...dna, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const setField = (field: keyof ProductDNAType, value: string) => {
    setDna((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleArrayChange = (field: "contentPillars" | "recommendedThemes", value: string) => {
    setDna({ ...dna, [field]: value.split("\n").filter((s) => s.trim() !== "") });
    setSaved(false);
  };

  const handleIcpChange = (index: number, field: "name" | "painPoints", value: string) => {
    const icps = [...(dna.targetIcps || [])];
    if (!icps[index]) icps[index] = { name: "", painPoints: [] };
    if (field === "name") icps[index].name = value;
    else icps[index].painPoints = value.split("\n").filter((s) => s.trim() !== "");
    setDna({ ...dna, targetIcps: icps });
    setSaved(false);
  };

  const addIcp = () => {
    setDna({ ...dna, targetIcps: [...(dna.targetIcps || []), { name: "", painPoints: [] }] });
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
    return () => document.body.classList.remove("modal-open");
  }, [isExtractionModalOpen, isDeleteModalOpen]);

  const handleColorChange = (index: number, value: string) => {
    const vd = dna.visualData || { colors: [], fonts: { primary: "", secondary: "" }, typographyHierarchy: "", imageStyle: "" };
    const newColors = [...vd.colors];
    newColors[index] = value;
    setDna({ ...dna, visualData: { ...vd, colors: newColors } });
    setSaved(false);
  };

  const handleAddColor = () => {
    const vd = dna.visualData || { colors: [], fonts: { primary: "", secondary: "" }, typographyHierarchy: "", imageStyle: "" };
    setDna({ ...dna, visualData: { ...vd, colors: [...vd.colors, "#7C3AED"] } });
    setSaved(false);
  };

  const handleRemoveColor = (index: number) => {
    const vd = dna.visualData || { colors: [], fonts: { primary: "", secondary: "" }, typographyHierarchy: "", imageStyle: "" };
    setDna({ ...dna, visualData: { ...vd, colors: vd.colors.filter((_, i) => i !== index) } });
    setSaved(false);
  };

  const handleFontChange = (type: "primary" | "secondary", value: string) => {
    const vd = dna.visualData || { colors: [], fonts: { primary: "", secondary: "" }, typographyHierarchy: "", imageStyle: "" };
    setDna({ ...dna, visualData: { ...vd, fonts: { ...vd.fonts, [type]: value } } });
    setSaved(false);
  };

  const handleVisualTextChange = (field: "typographyHierarchy" | "imageStyle", value: string) => {
    const vd = dna.visualData || { colors: [], fonts: { primary: "", secondary: "" }, typographyHierarchy: "", imageStyle: "" };
    setDna({ ...dna, visualData: { ...vd, [field]: value } });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setIsSaving(true);
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
      logSilentError(err as Error, { context: "deleteProduct", productId: activeProduct.id });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResearch = async () => {
    if ((!dna.website && !dna.description && !productDocument) || !activeProduct) {
      setError("Please enter a website URL, a product description, or upload a document first.");
      return;
    }
    setError(null);
    setIsResearching(true);
    let inputType: "website" | "document" | "description" = "website";
    if (dna.website) inputType = "website";
    else if (productDocument) inputType = "document";
    else if (dna.description) inputType = "description";
    setExtractionInputType(inputType);
    setExtractionComplete(false);
    setScreenshotUrl(null);
    setExtractionLogs(["Initializing Tror Core [v2.4.1]...", "Booting Strategist Agent..."]);
    setExtractionProgress(5);
    setIsExtractionModalOpen(true);

    const abortController = new AbortController();
    extractionAbortControllerRef.current = abortController;
    const signal = abortController.signal;

    try {
      let screenshotData: { data: string; mimeType: string; url: string } | null = null;
      let microlinkMetadata: any = null;
      if (dna.website) {
        try {
          setExtractionLogs((prev) => [...prev, "Establishing secure connection to target URL...", "Fetching screenshot & metadata via Microlink..."]);
          setExtractionProgress(15);
          const targetUrl = dna.website.startsWith("http") ? dna.website : `https://${dna.website}`;
          const encodedUrl = encodeURIComponent(targetUrl);
          
          if (signal.aborted) {
            throw new DOMException("The user aborted a request.", "AbortError");
          }

          const mLinkRes = await fetch(`https://api.microlink.io?url=${encodedUrl}&screenshot=true&meta=true&palette=true&animations=false&waitForTimeout=4500`, { signal });
          if (mLinkRes.ok) {
            const mLinkData = await mLinkRes.json();
            microlinkMetadata = mLinkData?.data;
            if (mLinkData?.data?.screenshot?.url) {
              const mLinkUrl = mLinkData.data.screenshot.url;
              setScreenshotUrl(mLinkUrl);
              setExtractionLogs((prev) => [...prev, "> Snapshot Acquired."]);
              setExtractionProgress(30);
              
              if (signal.aborted) {
                throw new DOMException("The user aborted a request.", "AbortError");
              }

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000);
              
              const onAbort = () => {
                controller.abort();
              };
              signal.addEventListener('abort', onAbort);
              
              try {
                const res = await fetch(mLinkUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                signal.removeEventListener('abort', onAbort);
                if (res.ok) {
                  const blob = await res.blob();
                  const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(blob);
                  });
                  screenshotData = { data: base64.split(",")[1], mimeType: blob.type, url: mLinkUrl };
                  setExtractionProgress(45);
                }
              } catch (eImg: any) {
                clearTimeout(timeoutId);
                signal.removeEventListener('abort', onAbort);
                if (signal.aborted || eImg.name === 'AbortError') {
                  throw new DOMException("The user aborted a request.", "AbortError");
                }
                console.warn("Screenshot download failed:", eImg);
              }
            }
          }
        } catch (err: any) {
          if (signal.aborted || err.name === 'AbortError') {
            throw err;
          }
          console.warn("Screenshot capture failed:", err);
        }
      }

      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      setExtractionLogs((prev) => [...prev, "Parsing DOM tree and semantic HTML...", "Extracting <H1> through <H3> hierarchy...", "Mapping CSS variables & theme tokens...", "Running psychographic NLP processing..."]);
      setExtractionProgress(60);

      const researchedData = await researchProductDNA(
        dna.website, dna, productDocument ? { data: productDocument.data, mimeType: productDocument.mimeType } : null,
        user?.uid,
        screenshotData ? { data: screenshotData.data, mimeType: screenshotData.mimeType } : undefined,
        microlinkMetadata,
        signal
      );

      if (signal.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }

      setExtractionLogs((prev) => [...prev, '> "Hell State" quantified.', "Structuring DNA JSON payload...", "Finalizing Tror Memory Graph..."]);
      setExtractionProgress(100);
      const newDna = { ...dna, ...researchedData } as ProductDNAType;

      if (microlinkMetadata?.logo?.url) {
        if (!newDna.logoUrl) newDna.logoUrl = microlinkMetadata.logo.url;
        if (!newDna.logoDarkUrl) newDna.logoDarkUrl = microlinkMetadata.logo.url;
        if (!newDna.logoLightUrl) newDna.logoLightUrl = microlinkMetadata.logo.url;
      }

      if (user && researchedData.extractedMediaImages && Array.isArray(researchedData.extractedMediaImages)) {
        try {
          const mediaImages = researchedData.extractedMediaImages as string[];
          for (let i = 0; i < mediaImages.length; i++) {
            await addDoc(collection(db, "creatives"), {
              productId: activeProduct.id, userId: user.uid, url: mediaImages[i],
              name: `Website Image ${i + 1}`, createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          logSilentError(err as Error, { context: "addExtractedMediaImagesToCreatives" });
        }
      }
      delete (newDna as any).extractedMediaImages;
      setDna(newDna);
      await updateProduct(activeProduct.id, newDna);
      
      // Trigger Product DNA Research PDF Mail
      if (user?.email) {
        (async () => {
          try {
            const { generateDNAPDF } = await import("../lib/pdfGenerator");
            const pdfDoc = await generateDNAPDF(newDna);
            const pdfBase64 = pdfDoc.output("datauristring");
            const { triggerBrandedEmail } = await import("../lib/emailTriggers");
            await triggerBrandedEmail("product_dna", user.email!, { productName: newDna.name }, pdfBase64);
          } catch (emailErr) {
            logSilentError(emailErr as Error, { context: "sendProductDNAEmail" });
          }
        })();
      }

      setExtractionComplete(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (signal.aborted || err.name === 'AbortError') {
        console.log("Brand extraction aborted by user.");
        setExtractionLogs((prev) => [...prev, "Extraction cancelled by user."]);
        setIsExtractionModalOpen(false);
        return;
      }
      logSilentError(err as Error, { context: "handleResearch" });
      setError("Failed to research. Please check your API key or document format.");
      setIsExtractionModalOpen(false);
    } finally {
      setIsResearching(false);
      if (extractionAbortControllerRef.current === abortController) {
        extractionAbortControllerRef.current = null;
      }
    }
  };

  const handleCloseExtractionModal = () => {
    if (isResearching && extractionAbortControllerRef.current) {
      extractionAbortControllerRef.current.abort();
      extractionAbortControllerRef.current = null;
      setIsResearching(false);
    }
    setIsExtractionModalOpen(false);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Document file size must be less than 5MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductDocument({ data: (reader.result as string).split(",")[1], mimeType: file.type, name: file.name });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFounderFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File size must be less than 5MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDna((prev) => ({ ...prev, founderVoiceFileName: file.name, founderVoiceFileMimeType: file.type, founderVoiceFileData: (reader.result as string).split(",")[1] }));
      setSaved(false); setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFounderFile = () => {
    setDna((prev) => {
      const updated = { ...prev };
      delete updated.founderVoiceFileName; delete updated.founderVoiceFileMimeType; delete updated.founderVoiceFileData;
      return updated;
    });
    setSaved(false);
  };

  const handleSynthesizeFounderAgent = async () => {
    if (!dna.founderVoiceDescription && !dna.founderVoiceFileData) {
      setError("Please describe the founder's behavior or upload a background document."); return;
    }
    setError(null); setIsSynthesizing(true); setSynthesisProgress(5);
    setSynthesisLogs(["Initializing AI Cognitive Profiler...", "Reading founder input details..."]);
    try {
      const t1 = setTimeout(() => { setSynthesisLogs((p) => [...p, "Analyzing personality & action patterns..."]); setSynthesisProgress(25); }, 800);
      const t2 = setTimeout(() => { setSynthesisLogs((p) => [...p, "Extracting tone and communication style..."]); setSynthesisProgress(50); }, 1600);
      const t3 = setTimeout(() => { setSynthesisLogs((p) => [...p, "Modeling behavioral heuristics..."]); setSynthesisProgress(75); }, 2400);
      const document = dna.founderVoiceFileData ? { data: dna.founderVoiceFileData, mimeType: dna.founderVoiceFileMimeType || "text/plain" } : null;
      const profile = await synthesizeFounderAgent(dna.founderVoiceDescription || "", document, user?.uid);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setSynthesisLogs((p) => [...p, "> Analysis complete.", `Activating Doppelganger: "${profile.personaName}"`]);
      setSynthesisProgress(100);
      const updatedDna = { ...dna, founderAgentSynthesized: { ...profile, synthesizedAt: new Date().toISOString() } };
      setDna(updatedDna);
      await updateProduct(activeProduct!.id, updatedDna);

      // Trigger Founder Agent Synthesized PDF Mail
      if (user?.email) {
        (async () => {
          try {
            const { generateFounderAgentPDF } = await import("../lib/pdfGenerator");
            const pdfDoc = await generateFounderAgentPDF(updatedDna);
            const pdfBase64 = pdfDoc.output("datauristring");
            const { triggerBrandedEmail } = await import("../lib/emailTriggers");
            await triggerBrandedEmail(
              "founder_agent",
              user.email!,
              { personaName: profile.personaName, productName: updatedDna.name },
              pdfBase64
            );
          } catch (emailErr) {
            logSilentError(emailErr as Error, { context: "sendFounderAgentEmail" });
          }
        })();
      }

      setIsSynthesizing(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      logSilentError(err as Error, { context: "handleSynthesizeFounderAgent" });
      setError("Failed to synthesize founder agent. Please try again.");
      setIsSynthesizing(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "logoUrl" | "logoDarkUrl" | "logoLightUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { setError("Only JPEG and PNG images are allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Logo file size must be less than 2MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0); setDna((prev) => ({ ...prev, [type]: canvas.toDataURL("image/png") })); setSaved(false); setError(null); }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (type: "logoUrl" | "logoDarkUrl" | "logoLightUrl") => {
    setDna((prev) => { const updated = { ...prev }; delete updated[type]; return updated; });
    setSaved(false);
  };

  const handleDownloadLogo = async (url: string | undefined, filename: string) => {
    if (!url) { setError("No logo image URL is available to download."); return; }
    try {
      if (url.startsWith("data:")) {
        const link = document.createElement("a"); link.href = url; link.download = filename;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); return;
      }
      const link = document.createElement("a");
      link.href = `/api/download-logo?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      link.setAttribute("target", "_self");
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err: any) {
      logSilentError("Direct proxy download triggered error fallback", { error: err });
      window.open(url, "_blank");
    }
  };

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  // ─── Reusable Bento Card ───
  const BentoCard = ({ children, className = "", span = 1 }: { children: React.ReactNode; className?: string; span?: 1 | 2 | 3 }) => {
    const spanClass = span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-6 ${spanClass} ${className}`}>
        {children}
      </div>
    );
  };

  const SectionTitle = ({ icon: Icon, title, iconColor = "text-[#7C3AED]", action }: { icon: React.ElementType; title: string; iconColor?: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.8} />
        <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
  );

  // ─── Divider ───
  const Divider = () => <div className="h-px bg-slate-100 my-5" />;

  // ─── Tab Renderers ───

  const renderIdentityTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Core Identity — col 2 */}
      <BentoCard span={2}>
        <SectionTitle icon={Layout} title="Core Identity" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SmartField
              label="Product Name"
              value={dna.name}
              placeholder="My Product"
              onChange={(v) => setField("name", v)}
            />
            <SmartField
              label="Tone of Voice"
              value={dna.tone}
              placeholder="e.g., Professional, insight-driven"
              onChange={(v) => setField("tone", v)}
            />
          </div>
          <Divider />
          <SmartField
            label="Positioning / Value Prop"
            value={dna.positioning}
            placeholder="e.g., AI-powered social campaign engine..."
            multiline
            onChange={(v) => setField("positioning", v)}
          />
          <Divider />
          <SmartField
            label="Target Audience Persona"
            value={dna.audience}
            placeholder="e.g., Solo founder / Head of Growth at early-stage SaaS..."
            multiline
            onChange={(v) => setField("audience", v)}
          />
          <Divider />
          <SmartSelect
            label="Company Stage"
            value={dna.stage}
            options={[
              { value: "", label: "Not set" },
              { value: "MVP", label: "MVP / Pre-revenue" },
              { value: "Early Growth", label: "Early Growth (10-100 customers)" },
              { value: "Scaling", label: "Scaling ($1M+ ARR)" },
              { value: "Enterprise", label: "Enterprise" },
            ]}
            onChange={(v) => setField("stage", v)}
          />
        </div>
      </BentoCard>

      {/* AI Auto-Fill — col 1 */}
      <BentoCard span={1} className="!bg-slate-50/60">
        <SectionTitle icon={Sparkles} title="AI Auto-Fill" />
        <p className="text-xs text-slate-500 leading-relaxed mb-5">
          Drop your website URL or upload docs, and let AI reverse-engineer your core positioning, audience, and voice.
        </p>
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Globe className="h-3 w-3" /> Website URL
            </label>
            <div className="h-px bg-slate-200 mb-3" />
            <input
              type="url" name="website" value={dna.website} onChange={handleChange}
              className="w-full bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none transition-colors"
              placeholder="https://your-saas.com"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <FileText className="h-3 w-3" /> Description
            </label>
            <div className="h-px bg-slate-200 mb-3" />
            <textarea
              name="description" value={dna.description || ""} onChange={handleChange} rows={2}
              className="w-full bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none resize-none transition-colors"
              placeholder="Briefly describe what you build..."
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Link className="h-3 w-3" /> Document
            </label>
            <div className="h-px bg-slate-200 mb-3" />
            <input
              type="file" accept=".pdf,.txt,.md" onChange={handleDocumentUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 transition-colors"
            />
            {productDocument && <p className="mt-2 text-xs text-green-600 font-medium truncate">✓ {productDocument.name}</p>}
          </div>
          <button
            type="button" onClick={handleResearch}
            disabled={isResearching || (!dna.website && !dna.description && !productDocument)}
            className="tour-dna-extract-btn w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
          >
            {isResearching ? <VideoLoader className="mr-2 h-7 w-7" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Extract Brand DNA
          </button>
        </div>
      </BentoCard>

      {/* Brand Logos — col 2 */}
      <BentoCard span={2}>
        <SectionTitle icon={ImageIcon} title="Brand Logos" iconColor="text-blue-500" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { key: "logoUrl" as const, label: "Primary Logo", hint: "Default logo used everywhere", bg: "bg-slate-50" },
            { key: "logoLightUrl" as const, label: "Light Logo", hint: "Used on dark backgrounds", bg: "bg-slate-900" },
            { key: "logoDarkUrl" as const, label: "Dark Logo", hint: "Used on light backgrounds", bg: "bg-white" },
          ].map(({ key, label, hint, bg }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-[10px] text-slate-400 mb-3">{hint}</p>
              {dna[key] ? (
                <div className="space-y-2">
                  <div className={`h-16 w-full rounded-lg border border-slate-200 overflow-hidden ${bg} flex items-center justify-center`}>
                    <img src={dna[key] || undefined} alt={label} className="max-h-12 max-w-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleDownloadLogo(dna[key], `${dna.name || "product"}-${key}.png`)}
                      className="flex-1 py-1 px-2 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-[#7C3AED]/20">
                      <Download className="w-3 h-3" /> Download
                    </button>
                    <button type="button" onClick={() => handleRemoveLogo(key)}
                      className="flex-1 py-1 px-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-red-100">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <input type="file" accept="image/jpeg, image/png" onChange={(e) => handleLogoUpload(e, key)}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors" />
              )}
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Brand Voice — col 1 */}
      <BentoCard span={1}>
        <SectionTitle icon={MessageSquare} title="Brand Voice" iconColor="text-violet-500" />
        <SmartField
          label="Overall Aesthetic"
          value={dna.visualStyle || ""}
          placeholder="e.g., Minimalist, light elegance, purple accents..."
          multiline
          onChange={(v) => setField("visualStyle", v)}
        />
      </BentoCard>
    </div>
  );

  const renderVisualTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Color Palette */}
      <BentoCard span={1}>
        <SectionTitle
          icon={Palette} title="Color Palette"
          action={<button type="button" onClick={handleAddColor} className="text-[#7C3AED] text-xs font-semibold px-2 py-1 rounded-lg bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 transition-colors">+ Add</button>}
        />
        <div className="flex flex-wrap gap-3 mt-1">
          {(dna.visualData?.colors || []).map((color, idx) => (
            <div key={idx} className="group relative">
              <div className="w-12 h-12 rounded-xl shadow-sm border border-black/10 relative overflow-hidden" style={{ backgroundColor: color }}>
                <input type="color" value={color || "#000000"} onChange={(e) => handleColorChange(idx, e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0" />
              </div>
              <button type="button" onClick={() => handleRemoveColor(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-[10px]">×</button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-slate-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{color}</span>
            </div>
          ))}
          {(dna.visualData?.colors || []).length === 0 && <p className="text-xs text-slate-400">No colors yet. Click + Add.</p>}
        </div>
      </BentoCard>

      {/* Typography */}
      <BentoCard span={2}>
        <SectionTitle icon={Type} title="Typography" iconColor="text-slate-700" />
        {dna.visualData?.fonts?.primary && getFontUrl(dna.visualData.fonts.primary) && <style>{`@import url('${getFontUrl(dna.visualData.fonts.primary)}');`}</style>}
        {dna.visualData?.fonts?.secondary && getFontUrl(dna.visualData.fonts.secondary) && <style>{`@import url('${getFontUrl(dna.visualData.fonts.secondary)}');`}</style>}
        <datalist id="google-fonts-list">
          {filteredFonts.map((font, idx) => <option key={`${font}-${idx}`} value={font} />)}
        </datalist>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { type: "primary" as const, label: "Primary (Headings)" },
            { type: "secondary" as const, label: "Secondary (Body)" },
          ].map(({ type, label }) => (
            <div key={type} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm text-2xl border border-slate-200 text-slate-800 shrink-0"
                  style={{ fontFamily: dna.visualData?.fonts?.[type] ? `"${dna.visualData.fonts[type]}", sans-serif` : "inherit" }}>Aa</div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5 font-semibold">{label}</span>
                  <input type="text" list="google-fonts-list"
                    value={dna.visualData?.fonts?.[type] || ""}
                    onFocus={(e) => setFontSearch(e.target.value)}
                    onChange={(e) => { setFontSearch(e.target.value); handleFontChange(type, e.target.value); }}
                    placeholder="Search or type a font..."
                    className="w-full bg-transparent border-b border-slate-200 focus:border-[#7C3AED] outline-none text-sm font-medium text-slate-800 pb-1 placeholder:font-normal placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Hierarchy */}
      <BentoCard span={1}>
        <SmartField
          label="Typography Hierarchy"
          value={dna.visualData?.typographyHierarchy || ""}
          placeholder="Describe how headings, subheadings, and body text are used..."
          multiline
          onChange={(v) => handleVisualTextChange("typographyHierarchy", v)}
        />
      </BentoCard>

      {/* Image Style */}
      <BentoCard span={2}>
        <SmartField
          label="Image Style"
          value={dna.visualData?.imageStyle || ""}
          placeholder="Describe the aesthetic and style of images used in your brand..."
          multiline
          onChange={(v) => handleVisualTextChange("imageStyle", v)}
        />
      </BentoCard>
    </div>
  );

  const renderPsychographicsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* The Narrative */}
      <BentoCard span={1}>
        <SectionTitle icon={Globe} title='The Narrative (The "Why")' />
        <div className="space-y-6">
          <SmartField
            label="The Enemy / Status Quo"
            hint="What old way of doing things is this product trying to kill?"
            value={dna.enemy || ""}
            placeholder="e.g., Endless manual spreadsheet reconciliation..."
            multiline
            onChange={(v) => setField("enemy", v)}
          />
          <Divider />
          <SmartField
            label='The "Earned Secret"'
            hint="What does this company know that nobody else realizes?"
            value={dna.earnedSecret || ""}
            placeholder="We discovered that..."
            multiline
            onChange={(v) => setField("earnedSecret", v)}
          />
          <Divider />
          <SmartField
            label="Origin Story"
            hint="Why was this built? What was the founding frustration?"
            value={dna.originStory || ""}
            placeholder="It started when..."
            multiline
            onChange={(v) => setField("originStory", v)}
          />
        </div>
      </BentoCard>

      {/* JTBD & Psychographics */}
      <BentoCard span={1}>
        <SectionTitle icon={Target} title='JTBD & Psychographics (The "Who")' iconColor="text-rose-500" />
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <SmartField
              label='"Hell" State'
              value={dna.hellState || ""}
              placeholder="Before: The exact pain..."
              multiline
              accentColor="text-red-400"
              onChange={(v) => setField("hellState", v)}
            />
            <SmartField
              label='"Heaven" State'
              value={dna.heavenState || ""}
              placeholder="After: The emotional payoff..."
              multiline
              accentColor="text-emerald-500"
              onChange={(v) => setField("heavenState", v)}
            />
          </div>
          <Divider />
          <SmartField
            label="Top 3 Buying Objections"
            hint="Why do people say no? (we will dismantle these in copy)"
            value={dna.objections || ""}
            placeholder="1. It's too expensive..."
            multiline
            onChange={(v) => setField("objections", v)}
          />
        </div>
      </BentoCard>

      {/* Product & Proof */}
      <BentoCard span={1}>
        <SectionTitle icon={Zap} title='Product & Proof (The "How")' iconColor="text-amber-500" />
        <div className="space-y-6">
          <SmartField
            label="Unique Mechanism"
            hint="How exactly does it deliver results differently?"
            value={dna.uniqueMechanism || ""}
            placeholder="Unlike other tools, we..."
            multiline
            onChange={(v) => setField("uniqueMechanism", v)}
          />
          <Divider />
          <SmartField
            label="Proof Points / Hard Numbers"
            value={dna.proofPoints || ""}
            placeholder="e.g., 10x faster than manual workflows, 94% customer retention..."
            multiline
            onChange={(v) => setField("proofPoints", v)}
          />
        </div>
      </BentoCard>

      {/* Brand Dictionary */}
      <BentoCard span={1}>
        <SectionTitle icon={MessageSquare} title='Brand Dictionary (The "Voice")' iconColor="text-emerald-500" />
        <div className="space-y-6">
          <SmartField
            label="Words we ALWAYS use"
            value={dna.vocabularyAlways || ""}
            placeholder="e.g., Revenue-driven, Asynchronous, Craft..."
            multiline
            accentColor="text-emerald-600"
            onChange={(v) => setField("vocabularyAlways", v)}
          />
          <Divider />
          <SmartField
            label="Words we NEVER use"
            value={dna.vocabularyNever || ""}
            placeholder="e.g., Synergy, Hack, Ninja, Revolutionary..."
            multiline
            accentColor="text-red-500"
            onChange={(v) => setField("vocabularyNever", v)}
          />
        </div>
      </BentoCard>
    </div>
  );

  const renderStrategyTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BentoCard span={1}>
        <SectionTitle icon={Layout} title="Content Pillars" />
        <p className="text-[10px] text-slate-400 mb-4">3-5 strategic topics to alternate between. One per line.</p>
        <SmartField
          label="Pillars"
          value={(dna.contentPillars || []).join("\n")}
          placeholder={"e.g. Founder Learnings\nIndustry Myths\nCustomer Case Studies"}
          multiline
          onChange={(v) => handleArrayChange("contentPillars", v)}
        />
      </BentoCard>

      <BentoCard span={1}>
        <SectionTitle icon={Sparkles} title="Recommended Campaign Themes" iconColor="text-amber-500" />
        <p className="text-[10px] text-slate-400 mb-4">Highly specific angles for this business. One per line.</p>
        <SmartField
          label="Themes"
          value={(dna.recommendedThemes || []).join("\n")}
          placeholder={"e.g. Stop wasting hours on manual tracking\nHow we save agencies 20hrs/week"}
          multiline
          onChange={(v) => handleArrayChange("recommendedThemes", v)}
        />
      </BentoCard>

      {/* Target ICPs */}
      <BentoCard span={2}>
        <SectionTitle
          icon={Target} title="Target ICPs & Pain Points" iconColor="text-emerald-600"
          action={<button type="button" onClick={addIcp} className="text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-200">+ Add ICP</button>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dna.targetIcps || []).map((icp, index) => (
            <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
              <button type="button" onClick={() => removeIcp(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm">×</button>
              <input
                type="text" value={icp.name} onChange={(e) => handleIcpChange(index, "name", e.target.value)}
                placeholder="ICP Name (e.g. Agency Owners)"
                className="w-full bg-transparent border-b border-slate-200 outline-none text-sm font-semibold text-emerald-700 pb-1 mb-3 placeholder:text-slate-400 placeholder:font-normal"
              />
              <textarea
                value={(icp.painPoints || []).join("\n")} onChange={(e) => handleIcpChange(index, "painPoints", e.target.value)}
                placeholder={"Pain point 1\nPain point 2"}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 outline-none resize-none overflow-hidden placeholder-slate-300 whitespace-pre leading-relaxed"
                rows={4}
              />
            </div>
          ))}
          {(!dna.targetIcps || dna.targetIcps.length === 0) && (
            <p className="text-xs text-slate-400 italic col-span-full">No ICPs defined. Extract DNA to generate them automatically.</p>
          )}
        </div>
      </BentoCard>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <BrandExtractionModal
        isOpen={isExtractionModalOpen}
        inputType={extractionInputType}
        isComplete={extractionComplete}
        screenshotUrl={screenshotUrl}
        extractionLogs={extractionLogs}
        extractionProgress={extractionProgress}
        onClose={handleCloseExtractionModal}
        onSaveAndContinue={() => { setIsExtractionModalOpen(false); navigate("/dashboard/campaigns"); }}
        dna={dna}
      />

      {/* Page Header */}
      <div className="tour-dna-header">
        <h1 className="text-display text-slate-800">Brand Position</h1>
        <p className="mt-2 text-headline-1 text-slate-500">
          Define your brand's Position (The 'P' in POST). The engine uses this to drive Outreach, Signal, and Traction.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Main Layout: Mini Sidebar + Content */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-8 items-start">

          {/* ── Desktop: Vertical Mini Sidebar ── */}
          <nav className="hidden md:flex flex-col shrink-0 w-44 pt-1 sticky top-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Brand DNA</p>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-left px-3 py-2.5 text-sm transition-all duration-150 border-l-2 ${
                    isActive
                      ? "border-[#7C3AED] text-slate-900 font-semibold"
                      : "border-transparent text-slate-500 hover:text-slate-800 font-normal"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* ── Mobile: Horizontal Scroll Tabs ── */}
          <div className="md:hidden w-full mb-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive ? "bg-[#7C3AED] text-white" : "text-slate-500 bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Content Area ── */}
          <div className="flex-1 min-w-0">
            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
              {activeTab === "identity" && renderIdentityTab()}
              {activeTab === "visual" && renderVisualTab()}
              {activeTab === "psychographics" && renderPsychographicsTab()}
              {activeTab === "strategy" && renderStrategyTab()}
            </div>
          </div>
        </div>

        {/* Save/Delete Footer */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between mt-6 ml-0 md:ml-52">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Product
          </button>
          <div className="flex items-center gap-x-4">
            {saved && <span className="text-sm text-[#7C3AED] font-semibold animate-in fade-in">Saved successfully!</span>}
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
            >
              {isSaving ? <VideoLoader className="mr-2 h-7 w-7" /> : <Save className="mr-2 h-4 w-4" />}
              Save DNA
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[22px] shadow-xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Product</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                You are about to delete <strong>{activeProduct?.name}</strong>. This will permanently erase all associated Brand Position data and generated campaigns. This action cannot be undone.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type <span className="font-bold text-red-600 select-all">DELETE</span> to confirm
                </label>
                <input
                  type="text" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmation(""); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={handleDeleteProduct}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? <VideoLoader className="mr-2 h-7 w-7" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
