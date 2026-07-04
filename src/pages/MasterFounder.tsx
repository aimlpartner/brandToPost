import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, Cpu, Upload, Loader2, Sparkles, Save, Target, MessageSquare, 
  Zap, Clock, Globe, FileText, CheckCircle2, ChevronRight, Play, Check,
  Palette, Type, Download, Copy, RefreshCw, FileSignature
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { logSilentError } from "../lib/firestore-error";
import { synthesizeFounderAgent, generateGeneralFounderPost, generateFounderTopicSuggestions } from "../services/geminiService";
import { CustomTimePicker } from "../components/CustomTimePicker";
import { utcToLocal, localToUtc } from "../lib/utils";
import { VisualEngine } from "../components/VisualEngine";
import { GOOGLE_FONTS, ADOBE_FONTS } from "../lib/fonts";

const ALL_FONTS = [...GOOGLE_FONTS, ...ADOBE_FONTS];
const POPULAR_FONTS = Array.from(new Set(ALL_FONTS)).sort();

const Divider = () => <div className="h-px bg-slate-105 my-5" />;

// ─── Bento Card Component ───
const BentoCard = ({ children, className = "", span = 1 }: { children: React.ReactNode; className?: string; span?: 1 | 2 | 3 }) => {
  const spanClass = span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm ${spanClass} ${className}`}>
      {children}
    </div>
  );
};

// ─── Section Title ───
const SectionTitle = ({ icon: Icon, title, iconColor = "text-[#7C3AED]" }: { icon: React.ElementType; title: string; iconColor?: string }) => (
  <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
    <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
    <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
  </div>
);

// ─── SmartField: Editable Text Component ───
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

  useEffect(() => {
    if (editing) {
      if (multiline) {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
        }
      } else {
        inputRef.current?.focus();
      }
    }
  }, [editing, multiline]);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor || "text-slate-400"}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="h-px bg-slate-100 mb-3" />
      {hint && !editing && <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{hint}</p>}
      {editing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2.5 text-sm text-slate-850 outline-none resize-none transition-colors"
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-sm text-slate-850 outline-none transition-colors"
          />
        )
      ) : (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${value?.trim() ? "text-slate-850" : "text-slate-350 italic"}`}>
          {value?.trim() || placeholder}
        </p>
      )}
    </div>
  );
}

// ─── Inline Bullets Editor for Synthesized Traits ───
interface BulletEditorProps {
  label: string;
  items: string[];
  icon: React.ElementType;
  color: string;
  dotColor: string;
  onChange: (newItems: string[]) => void;
}

function BulletEditor({ label, items, icon: Icon, color, dotColor, onChange }: BulletEditorProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (editing) setText(items.join("\n"));
  }, [editing, items]);

  const handleSave = () => {
    const list = text.split("\n").map(l => l.trim()).filter(Boolean);
    onChange(list);
    setEditing(false);
  };

  return (
    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (editing) handleSave();
            else setEditing(true);
          }}
          className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9]"
        >
          {editing ? "Save" : "Edit"}
        </button>
      </div>
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
          placeholder="One trait per line..."
        />
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-650 leading-relaxed">
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
              <span>{item}</span>
            </li>
          ))}
          {items.length === 0 && <li className="text-xs text-slate-350 italic">None generated yet.</li>}
        </ul>
      )}
    </div>
  );
}

export function MasterFounder() {
  const { user, userProfile } = useAuth();
  const { products, updateProduct } = useProducts();
  const [activeTab, setActiveTab] = useState<"brain" | "brands" | "generator">("brain");

  // Voice Inputs
  const [voiceDesc, setVoiceDesc] = useState(userProfile?.founderVoiceDescription || "");
  const [voiceFile, setVoiceFile] = useState<{ name: string; mimeType: string; data: string } | null>(
    userProfile?.founderVoiceFileName && userProfile?.founderVoiceFileData
      ? {
          name: userProfile.founderVoiceFileName,
          mimeType: userProfile.founderVoiceFileMimeType || "",
          data: userProfile.founderVoiceFileData,
        }
      : null
  );

  // Non-Branded Design Profile
  const [nbColors, setNbColors] = useState<string[]>(userProfile?.nonBrandedColors || ["#7C3AED", "#1E1B4B"]);
  const [nbPrimaryFont, setNbPrimaryFont] = useState(userProfile?.nonBrandedPrimaryFont || "Outfit");
  const [nbSecondaryFont, setNbSecondaryFont] = useState(userProfile?.nonBrandedSecondaryFont || "Inter");
  const [fontSearch, setFontSearch] = useState("");

  // Synthesis logs
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Track run states for products
  const [runningBrandId, setRunningBrandId] = useState<string | null>(null);
  const [brandMessage, setBrandMessage] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // General Post Generator State
  const [postTopic, setPostTopic] = useState("");
  const [postReference, setPostReference] = useState("");
  const [nbAttachmentStyle, setNbAttachmentStyle] = useState<"text-only" | "image-only" | "image-overlay">("text-only");
  const [nbCustomImagePrompt, setNbCustomImagePrompt] = useState("");
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatorLogs, setGeneratorLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<{
    postCopy: string;
    imagePrompt?: string;
    headline?: string;
    subtext?: string;
    imageUrl?: string;
  } | null>(null);

  // Suggestions states
  const [suggestions, setSuggestions] = useState<{ title: string; description: string; prompt: string }[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Optional Strategy Overrides during synthesis
  const [showOptionalInputs, setShowOptionalInputs] = useState(false);
  const [optIndustry, setOptIndustry] = useState("");
  const [optAudience, setOptAudience] = useState("");
  const [optVision, setOptVision] = useState("");
  const [optMission, setOptMission] = useState("");
  const [optGoal, setOptGoal] = useState("");
  const [optPillars, setOptPillars] = useState("");

  const fetchTopicSuggestions = async () => {
    if (!userProfile?.founderAgentSynthesized) return;
    setIsFetchingSuggestions(true);
    try {
      const list = await generateFounderTopicSuggestions(userProfile.founderAgentSynthesized, user?.uid);
      setSuggestions(list);
    } catch (err) {
      console.error("Failed to load topic suggestions:", err);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "generator" && suggestions.length === 0 && userProfile?.founderAgentSynthesized) {
      fetchTopicSuggestions();
    }
  }, [activeTab, userProfile]);

  useEffect(() => {
    if (userProfile) {
      setVoiceDesc(userProfile.founderVoiceDescription || "");
      if (userProfile.founderVoiceFileName && userProfile.founderVoiceFileData) {
        setVoiceFile({
          name: userProfile.founderVoiceFileName,
          mimeType: userProfile.founderVoiceFileMimeType || "",
          data: userProfile.founderVoiceFileData,
        });
      }
      if (userProfile.nonBrandedColors) {
        setNbColors(userProfile.nonBrandedColors);
      }
      if (userProfile.nonBrandedPrimaryFont) {
        setNbPrimaryFont(userProfile.nonBrandedPrimaryFont);
      }
      if (userProfile.nonBrandedSecondaryFont) {
        setNbSecondaryFont(userProfile.nonBrandedSecondaryFont);
      }
    }
  }, [userProfile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Training file size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setVoiceFile({ name: file.name, mimeType: file.type, data: base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setVoiceFile(null);
  };

  const saveProfileData = async (updatedFields: Partial<typeof userProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updatedFields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      logSilentError(err, { context: "saveUserProfileFields" });
      setError("Failed to update profile fields in database.");
    }
  };

  const handleColorChange = (idx: number, hex: string) => {
    const next = [...nbColors];
    next[idx] = hex;
    setNbColors(next);
    saveProfileData({ nonBrandedColors: next });
  };

  const handleSynthesize = async () => {
    if (!user) return;
    if (!voiceDesc && !voiceFile) {
      setError("Please input a description or upload a document to train the agent.");
      return;
    }
    setError(null);
    setIsSynthesizing(true);
    setProgress(5);
    setLogs(["Initializing Master Cognitive Profiler...", "Parsing founder profile metadata..."]);

    try {
      const t1 = setTimeout(() => { setLogs(p => [...p, "Running semantic voice analysis..."]); setProgress(25); }, 800);
      const t2 = setTimeout(() => { setLogs(p => [...p, "Synthesizing styles and vocab heuristics..."]); setProgress(55); }, 1600);
      const t3 = setTimeout(() => { setLogs(p => [...p, "Modeling core decisions structure..."]); setProgress(80); }, 2400);

      // Build products context
      const productsContext = products.map(p => `
Brand: ${p.name}
Website: ${p.website}
Description: ${p.description || "N/A"}
Positioning: ${p.positioning || "N/A"}
Audience: ${p.audience || "N/A"}
Stage: ${p.stage || "N/A"}
Content Pillars: ${p.contentPillars?.join(", ") || "N/A"}
`).join("\n---\n");

      // Build optional inputs overrides
      const optionalInputs = {
        targetIndustry: optIndustry,
        targetAudience: optAudience,
        vision: optVision,
        mission: optMission,
        goal: optGoal,
        contentPillars: optPillars
      };

      const docObj = voiceFile ? { data: voiceFile.data, mimeType: voiceFile.mimeType } : null;
      const profile = await synthesizeFounderAgent(voiceDesc, docObj, user.uid, productsContext, optionalInputs);

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setLogs(p => [...p, "✓ Cognitive Synthesis Complete.", `Activated Master Doppelganger: "${profile.personaName}"`]);
      setProgress(100);

      const payload = {
        founderVoiceDescription: voiceDesc,
        founderVoiceFileName: voiceFile?.name || "",
        founderVoiceFileMimeType: voiceFile?.mimeType || "",
        founderVoiceFileData: voiceFile?.data || "",
        founderAgentSynthesized: {
          ...profile,
          synthesizedAt: new Date().toISOString()
        }
      };

      await saveProfileData(payload);

      // Trigger Founder Agent Email
      if (user.email) {
        try {
          const { generateFounderAgentPDF } = await import("../lib/pdfGenerator");
          const mockProduct = {
            name: "B2P Workspace",
            founderVoiceDescription: voiceDesc,
            founderAgentSynthesized: payload.founderAgentSynthesized
          };
          const pdfDoc = await generateFounderAgentPDF(mockProduct);
          const pdfBase64 = pdfDoc.output("datauristring");
          const { triggerBrandedEmail } = await import("../lib/emailTriggers");
          await triggerBrandedEmail(
            "founder_agent",
            user.email,
            { personaName: profile.personaName, productName: "B2P Workspace" },
            pdfBase64
          );
        } catch (emailErr) {
          logSilentError(emailErr as Error, { context: "sendGlobalFounderEmail" });
        }
      }

      setIsSynthesizing(false);
    } catch (err: any) {
      logSilentError(err, { context: "handleSynthesizeMasterFounder" });
      setError("AI Synthesis failed. Please verify API configuration and try again.");
      setIsSynthesizing(false);
    }
  };

  // Central trigger automation for a specific product
  const handleTriggerBrandRun = async (brandId: string) => {
    setRunningBrandId(brandId);
    setBrandMessage(prev => ({ ...prev, [brandId]: { type: "success", text: "" } }));
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/automation/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ productId: brandId })
      });
      if (res.ok) {
        setBrandMessage(prev => ({ 
          ...prev, 
          [brandId]: { type: "success", text: "Successfully triggered daily run! Check schedule tab." } 
        }));
      } else {
        const errorData = await res.json();
        setBrandMessage(prev => ({ 
          ...prev, 
          [brandId]: { type: "error", text: errorData.error || "Execution failed." } 
        }));
      }
    } catch (err: any) {
      logSilentError(err, { context: "manualTriggerBrandRun" });
      setBrandMessage(prev => ({ 
        ...prev, 
        [brandId]: { type: "error", text: "Connection error occurred." } 
      }));
    } finally {
      setRunningBrandId(null);
    }
  };

  // Handle General Founder Post Generation
  const handleGeneratePost = async () => {
    if (!userProfile?.founderAgentSynthesized) {
      setError("You must first synthesize your Doppelganger Brain before generating founder posts.");
      return;
    }
    if (!postTopic.trim()) {
      setError("Please input a topic or core thought for your post.");
      return;
    }
    setError(null);
    setGeneratedPost(null);
    setIsGeneratingPost(true);
    setGeneratorLogs(["Spawning virtual Founder Doppelganger...", `Topic: "${postTopic}"`]);

    try {
      const t1 = setTimeout(() => setGeneratorLogs(p => [...p, "Analyzing behavioral heuristics for tone match..."]), 850);
      const t2 = setTimeout(() => setGeneratorLogs(p => [...p, "Drafting organic social copy (strictly non-branded)..."]), 1700);

      const result = await generateGeneralFounderPost({
        topic: postTopic,
        referencePosts: postReference,
        attachmentStyle: nbAttachmentStyle,
        customImagePrompt: nbCustomImagePrompt,
        founderAgent: userProfile.founderAgentSynthesized,
        userId: user?.uid
      });

      clearTimeout(t1); clearTimeout(t2);

      if (nbAttachmentStyle !== "text-only" && result.imageUrl) {
        setGeneratorLogs(p => [...p, "✓ Image backdrop generated successfully via Imagen AI."]);
      }
      setGeneratorLogs(p => [...p, "✓ Central post copy drafted successfully."]);

      setGeneratedPost(result);
      setIsGeneratingPost(false);
    } catch (err: any) {
      logSilentError(err, { context: "generateGeneralFounderPost" });
      setError("Failed to generate post. Please check your Gemini connection.");
      setIsGeneratingPost(false);
    }
  };

  // Clipboard copy helper
  const handleCopy = () => {
    if (!generatedPost?.postCopy) return;
    navigator.clipboard.writeText(generatedPost.postCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter Google Fonts for primary/secondary selectors
  const filteredFonts = fontSearch.trim()
    ? POPULAR_FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()))
    : POPULAR_FONTS;

  // Build Mock DNA for non-branded VisualEngine preview
  const mockNbDna = {
    name: "Master Founder",
    logoUrl: "", logoDarkUrl: "", logoLightUrl: "",
    visualData: {
      colors: nbColors,
      fonts: {
        primary: nbPrimaryFont,
        secondary: nbSecondaryFont
      },
      typographyHierarchy: "standard",
      imageStyle: "editorial"
    }
  } as any;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Premium Glowing Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1E1B4B] to-slate-900 p-8 shadow-xl border border-violet-950/40 text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.15),transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-display">Master Founder Agent</h1>
            </div>
            <p className="mt-2 text-xs text-slate-300 max-w-2xl font-light leading-relaxed">
              Your centralized Digital Doppelganger control board. Define your persona once and deploy it across all brands. Manages schedules, triggers content, and monitors daily automations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("brain")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                activeTab === "brain"
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
              }`}
            >
              Doppelganger Brain
            </button>
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                activeTab === "brands"
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
              }`}
            >
              Brand Control Board
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                activeTab === "generator"
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white"
              }`}
            >
              Founder Post Generator
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
          <p className="text-xs text-red-650 font-semibold">{error}</p>
        </div>
      )}

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-emerald-750 font-semibold">Changes synced successfully!</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6 text-left">
        {activeTab === "brain" ? (
          /* Redesigned 3-Column Identity Grid (Matches Brand Positioning styling) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Column 1: AI Doppelganger Brain Profiler Uploader Tool */}
            <div className="lg:col-span-1 space-y-6">
              <BentoCard span={1} className="!bg-slate-50/60">
                <SectionTitle icon={Sparkles} title="Doppelganger AI Profiler" />
                <p className="text-xs text-slate-500 leading-relaxed mb-5">
                  Feed descriptions of your personal voice or upload blog drafts/diary texts to synthesize your virtual Doppelganger Brain.
                </p>
                
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      <MessageSquare className="h-3 w-3" /> Voice Description
                    </label>
                    <div className="h-px bg-slate-200 mb-3" />
                    <textarea
                      value={voiceDesc}
                      onChange={(e) => {
                        setVoiceDesc(e.target.value);
                        saveProfileData({ founderVoiceDescription: e.target.value });
                      }}
                      rows={4}
                      className="w-full bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-xs text-slate-805 placeholder-slate-300 outline-none resize-none transition-colors"
                      placeholder="e.g. I prefer punchy sentences, speak skeptically of corporate speak, and focus on developer problems..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      <FileText className="h-3 w-3" /> Voice Training Document
                    </label>
                    <div className="h-px bg-slate-200 mb-3" />
                    {voiceFile ? (
                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-violet-500 shrink-0" />
                          <p className="text-xs font-semibold text-slate-700 truncate min-w-0">{voiceFile.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveFile();
                            saveProfileData({
                              founderVoiceFileName: "",
                              founderVoiceFileData: "",
                              founderVoiceFileMimeType: "",
                            });
                          }}
                          className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded border border-transparent hover:border-red-100 transition-all shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,.txt,.md"
                        onChange={handleFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-355 transition-colors"
                      />
                    )}
                  </div>

                  {/* Optional Strategic Overrides Collapsible Drawer */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white/70">
                    <button
                      type="button"
                      onClick={() => setShowOptionalInputs(!showOptionalInputs)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-colors"
                    >
                      <span>Optional strategy overrides</span>
                      <ChevronRight className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showOptionalInputs ? 'rotate-90' : ''}`} />
                    </button>
                    {showOptionalInputs && (
                      <div className="p-3 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Industry</label>
                          <input 
                            type="text" 
                            value={optIndustry} 
                            onChange={e => setOptIndustry(e.target.value)} 
                            placeholder="e.g. AI DevTools"
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
                          <input 
                            type="text" 
                            value={optAudience} 
                            onChange={e => setOptAudience(e.target.value)} 
                            placeholder="e.g. CTOs, Tech Founders"
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-755 focus:border-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vision</label>
                          <input 
                            type="text" 
                            value={optVision} 
                            onChange={e => setOptVision(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mission</label>
                          <input 
                            type="text" 
                            value={optMission} 
                            onChange={e => setOptMission(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Goal</label>
                          <input 
                            type="text" 
                            value={optGoal} 
                            onChange={e => setOptGoal(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Content Pillars (Comma separated)</label>
                          <input 
                            type="text" 
                            value={optPillars} 
                            onChange={e => setOptPillars(e.target.value)} 
                            placeholder="e.g. system design, lean teams"
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-750 focus:border-violet-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSynthesize}
                    disabled={isSynthesizing || (!voiceDesc && !voiceFile)}
                    className="w-full bg-violet-600 hover:bg-violet-750 text-white rounded-lg py-2.5 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase"
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        <span>Profiling Doppelganger...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Synthesize Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </BentoCard>

              {/* Synthesizer Terminal logs */}
              {isSynthesizing && (
                <BentoCard span={1} className="!bg-slate-955 !border-slate-850">
                  <div className="font-mono text-[10px] text-slate-300 space-y-2 select-none h-44 overflow-y-auto">
                    <div className="flex justify-between text-[9px] text-violet-400 font-bold uppercase tracking-wider">
                      <span>Engine Terminal</span><span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div className="bg-violet-500 h-1 rounded-full transition-all duration-305" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="space-y-1.5 pt-2">
                      {logs.map((log, idx) => (
                        <p key={idx} className={log.startsWith("✓") ? "text-emerald-400 font-semibold" : "text-slate-400"}>{log}</p>
                      ))}
                    </div>
                  </div>
                </BentoCard>
              )}

              {/* Personal Brand Aesthetic Colors & Fonts */}
              <BentoCard span={1}>
                <SectionTitle icon={Palette} title="Personal Brand Graphic Styling" iconColor="text-pink-500" />
                <p className="text-[11px] text-slate-400 mb-5 leading-relaxed font-light">
                  Define background hex colors and custom font typography layouts for non-branded graphic cards.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color Swatches</label>
                    <div className="flex gap-4">
                      {nbColors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(idx, e.target.value)}
                            className="w-8 h-8 border border-slate-200 rounded-lg cursor-pointer bg-transparent outline-none"
                          />
                          <span className="text-xs font-mono font-medium text-slate-600 uppercase">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Divider />

                  <datalist id="personal-fonts-list">
                    {filteredFonts.map((font, idx) => <option key={`${font}-${idx}`} value={font} />)}
                  </datalist>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Title Font", val: nbPrimaryFont, set: setNbPrimaryFont, field: "nonBrandedPrimaryFont" as const },
                      { label: "Body Font", val: nbSecondaryFont, set: setNbSecondaryFont, field: "nonBrandedSecondaryFont" as const },
                    ].map(({ label, val, set, field }) => (
                      <div key={field} className="bg-slate-55 border border-slate-200/50 p-3 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
                        <input
                          type="text"
                          list="personal-fonts-list"
                          value={val}
                          onFocus={(e) => setFontSearch(e.target.value)}
                          onChange={(e) => {
                            setFontSearch(e.target.value);
                            set(e.target.value);
                            saveProfileData({ [field]: e.target.value });
                          }}
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[#7C3AED] outline-none text-xs font-semibold text-slate-700 pb-0.5"
                          placeholder="Select font..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </BentoCard>
            </div>

            {/* Column 2 & 3: Main Strategic Profile & Strategy Context Editors (Like Identity Layout) */}
            <div className="lg:col-span-2 space-y-6">
              {userProfile?.founderAgentSynthesized && !isSynthesizing ? (
                <BentoCard span={2}>
                  {/* Header info */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 border border-violet-200/50">
                        <Cpu className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-md font-bold text-slate-850">
                          {userProfile.founderAgentSynthesized.personaName || "Active Doppelganger"}
                        </h3>
                        <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">Virtual Agent Profile Active</p>
                      </div>
                    </div>
                    {userProfile.founderAgentSynthesized.synthesizedAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Profiled: {new Date(userProfile.founderAgentSynthesized.synthesizedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Strategic position / target industry / target audience details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <SmartField
                        label="Target Industry"
                        value={userProfile.founderAgentSynthesized.targetIndustry || ""}
                        placeholder="e.g. Developer Productivity Tools, SaaS"
                        onChange={(v) => {
                          const updated = { ...userProfile.founderAgentSynthesized, targetIndustry: v };
                          saveProfileData({ founderAgentSynthesized: updated });
                        }}
                      />
                      <SmartField
                        label="Target Audience"
                        value={userProfile.founderAgentSynthesized.targetAudience || ""}
                        placeholder="e.g. Tech Founders, CTOs, Architects"
                        onChange={(v) => {
                          const updated = { ...userProfile.founderAgentSynthesized, targetAudience: v };
                          saveProfileData({ founderAgentSynthesized: updated });
                        }}
                      />
                    </div>
                    
                    <Divider />

                    <SmartField
                      label="Vision"
                      value={userProfile.founderAgentSynthesized.vision || ""}
                      placeholder="Define your personal or startup long-term vision..."
                      multiline
                      onChange={(v) => {
                        const updated = { ...userProfile.founderAgentSynthesized, vision: v };
                        saveProfileData({ founderAgentSynthesized: updated });
                      }}
                    />

                    <Divider />

                    <SmartField
                      label="Mission"
                      value={userProfile.founderAgentSynthesized.mission || ""}
                      placeholder="What is your core daily driving mission?"
                      multiline
                      onChange={(v) => {
                        const updated = { ...userProfile.founderAgentSynthesized, mission: v };
                        saveProfileData({ founderAgentSynthesized: updated });
                      }}
                    />

                    <Divider />

                    <SmartField
                      label="Goal"
                      value={userProfile.founderAgentSynthesized.goal || ""}
                      placeholder="What is the immediate business or scaling goal?"
                      multiline
                      onChange={(v) => {
                        const updated = { ...userProfile.founderAgentSynthesized, goal: v };
                        saveProfileData({ founderAgentSynthesized: updated });
                      }}
                    />

                    <Divider />

                    {/* Bullet Grid Editors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: "behavioralTraits" as const, icon: Brain, color: "text-violet-500", label: "Personality & Traits", items: userProfile.founderAgentSynthesized.behavioralTraits || [], dotColor: "bg-violet-400" },
                        { key: "coreValues" as const, icon: Target, color: "text-rose-500", label: "Core Beliefs & Values", items: userProfile.founderAgentSynthesized.coreValues || [], dotColor: "bg-rose-400" },
                        { key: "communicationStyle" as const, icon: MessageSquare, color: "text-emerald-500", label: "Communication Style", items: userProfile.founderAgentSynthesized.communicationStyle || [], dotColor: "bg-emerald-400" },
                        { key: "decisionHeuristics" as const, icon: Zap, color: "text-amber-500", label: "Decision Heuristics", items: userProfile.founderAgentSynthesized.decisionHeuristics || [], dotColor: "bg-amber-400" },
                      ].map(({ key, icon, color, label, items, dotColor }) => (
                        <BulletEditor
                          key={key}
                          label={label}
                          items={items}
                          icon={icon}
                          color={color}
                          dotColor={dotColor}
                          onChange={(newItems) => {
                            const updatedSynthesized = {
                              ...userProfile.founderAgentSynthesized,
                              [key]: newItems,
                            };
                            saveProfileData({ founderAgentSynthesized: updatedSynthesized });
                          }}
                        />
                      ))}
                      <div className="sm:col-span-2">
                        <BulletEditor
                          label="Key Content Pillars"
                          items={userProfile.founderAgentSynthesized.contentPillars || []}
                          icon={Brain}
                          color="text-[#7C3AED]"
                          dotColor="bg-[#7C3AED]"
                          onChange={(newItems) => {
                            const updated = { ...userProfile.founderAgentSynthesized, contentPillars: newItems };
                            saveProfileData({ founderAgentSynthesized: updated });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </BentoCard>
              ) : (
                !isSynthesizing && (
                  <div className="flex flex-col items-center justify-center py-28 px-4 bg-slate-55 border border-slate-200 border-dashed rounded-2xl text-center">
                    <Brain className="h-8 w-8 text-slate-300 animate-pulse mb-3" />
                    <h4 className="text-xs font-bold text-slate-700">No Doppelganger Synthesized</h4>
                    <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed mt-1">
                      Configure your voice parameters on the left and run synthesis to view your active strategical doppelganger context.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : activeTab === "brands" ? (
          /* Brand Control Board */
          <div className="space-y-4">
            <BentoCard span={3}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <SectionTitle icon={Globe} title="Connected Brands Automation Manager" iconColor="text-violet-600" />
                  <p className="text-xs text-slate-400 font-light mt-1">
                    Manage individual daily automation schedules, toggles, and manual run executions across your brands.
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 bg-slate-55 rounded-2xl border border-slate-150">
                  <p className="text-sm text-slate-400 italic">No brands found. Add one in the sidebar brand switcher.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Brand / Website</th>
                        <th className="py-3.5 px-4 text-center">Daily Posts</th>
                        <th className="py-3.5 px-4 text-center">Daily Blogs</th>
                        <th className="py-3.5 px-4 text-center">Weekly Campaigns</th>
                        <th className="py-3.5 px-4">Automation Time</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((brand) => {
                        const localTimeStr = utcToLocal(brand.automationTimeUtc || "14:00");
                        const statusMessage = brandMessage[brand.id];

                        const toggleFeature = async (field: "automateDailyPosts" | "automateDailyBlogs" | "automateWeeklyCampaigns") => {
                          const val = !brand[field];
                          const updates: any = { [field]: val };
                          
                          // Auto enable/disable master switch
                          const finalPosts = field === "automateDailyPosts" ? val : !!brand.automateDailyPosts;
                          const finalBlogs = field === "automateDailyBlogs" ? val : !!brand.automateDailyBlogs;
                          const finalWeekly = field === "automateWeeklyCampaigns" ? val : !!brand.automateWeeklyCampaigns;
                          updates.automationAgentEnabled = finalPosts || finalBlogs || finalWeekly;
                          
                          await updateProduct(brand.id, updates);
                        };

                        return (
                          <tr key={brand.id} className="hover:bg-slate-50/40 transition-colors">
                            {/* Product Identity */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {brand.logoUrl || brand.logoDarkUrl ? (
                                  <img
                                    src={brand.logoUrl || brand.logoDarkUrl}
                                    alt={brand.name}
                                    className="h-8 w-8 rounded-lg shrink-0 object-contain border border-slate-150 p-0.5 bg-white"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-755 shrink-0">
                                    {brand.name[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-805">{brand.name}</p>
                                  <a
                                    href={brand.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-slate-400 hover:text-[#7C3AED] truncate block max-w-[160px]"
                                  >
                                    {brand.website || "No website"}
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Daily Posts toggle */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => toggleFeature("automateDailyPosts")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                  brand.automateDailyPosts ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateDailyPosts ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Daily Blogs toggle */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => toggleFeature("automateDailyBlogs")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                  brand.automateDailyBlogs ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateDailyBlogs ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Weekly Campaigns toggle */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => toggleFeature("automateWeeklyCampaigns")}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                                  brand.automateWeeklyCampaigns ? "bg-violet-600" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                                    brand.automateWeeklyCampaigns ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Scheduling time */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-650">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <CustomTimePicker
                                  value={localTimeStr}
                                  onChange={async (newLocalTime) => {
                                    const timeUtc = localToUtc(newLocalTime);
                                    await updateProduct(brand.id, { automationTimeUtc: timeUtc });
                                  }}
                                />
                              </div>
                            </td>

                            {/* Actions column: manual run */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  type="button"
                                  disabled={runningBrandId === brand.id || !userProfile?.founderAgentSynthesized}
                                  onClick={() => handleTriggerBrandRun(brand.id)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-violet-50 text-[#7C3AED] hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed border border-violet-205/50 rounded-lg text-[11px] font-bold transition-all"
                                >
                                  {runningBrandId === brand.id ? (
                                    <>
                                      <Loader2 className="animate-spin h-3 w-3" />
                                      <span>Running...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 fill-current" />
                                      <span>Trigger Run</span>
                                    </>
                                  )}
                                </button>
                                {statusMessage && (
                                  <span className={`text-[9px] font-medium leading-tight max-w-[180px] text-right block ${
                                    statusMessage.type === "success" ? "text-emerald-650" : "text-red-505"
                                  }`}>
                                    {statusMessage.text}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </BentoCard>
          </div>
        ) : (
          /* General Post Generator View - Integrated click-to-fill chips directly in the configure card */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Input Config Card */}
            <BentoCard span={1}>
              <SectionTitle icon={FileSignature} title="Configure Post Topic & Visuals" iconColor="text-violet-650" />
              
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Post Concept / Topic
                    </label>
                    <button
                      type="button"
                      disabled={isFetchingSuggestions || !userProfile?.founderAgentSynthesized}
                      onClick={fetchTopicSuggestions}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-650 hover:text-[#6D28D9] disabled:opacity-40"
                    >
                      <RefreshCw className={`h-3 w-3 ${isFetchingSuggestions ? 'animate-spin' : ''}`} />
                      <span>Refresh AI Recommendations</span>
                    </button>
                  </div>

                  {/* AI Recommendation Click-to-Fill Chips */}
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPostTopic(sug.prompt)}
                          title={sug.description}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border text-left flex items-center justify-between gap-1 max-w-full ${
                            postTopic === sug.prompt
                              ? "bg-violet-600 border-violet-500 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{sug.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <textarea
                    rows={4}
                    value={postTopic}
                    onChange={(e) => setPostTopic(e.target.value)}
                    placeholder="Click a recommendation chip above to auto-fill, or type custom concept topics here..."
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none leading-relaxed resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Writing References (Optional style transfer)
                  </label>
                  <textarea
                    rows={3}
                    value={postReference}
                    onChange={(e) => setPostReference(e.target.value)}
                    placeholder="Paste sample texts/posts to guide copy structure and tone..."
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none leading-relaxed resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Graphic Layout Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "text-only", label: "Text Only" },
                      { value: "image-only", label: "Clean Graphic" },
                      { value: "image-overlay", label: "Text Overlaid" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNbAttachmentStyle(opt.value as any)}
                        className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all ${
                          nbAttachmentStyle === opt.value
                            ? "bg-violet-650 border-violet-500 text-white shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {nbAttachmentStyle !== "text-only" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Custom Image Backdrop Prompt (Optional)
                    </label>
                    <input
                      type="text"
                      value={nbCustomImagePrompt}
                      onChange={(e) => setNbCustomImagePrompt(e.target.value)}
                      placeholder="e.g. modern laptop desk with coffee mug, dramatic warm lighting"
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-colors"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePost}
                  disabled={isGeneratingPost || !postTopic.trim() || !userProfile?.founderAgentSynthesized}
                  className="w-full bg-violet-600 hover:bg-violet-750 text-white rounded-xl py-3 text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase"
                >
                  {isGeneratingPost ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Generating Draft...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Draft Founder Post</span>
                    </>
                  )}
                </button>
              </div>
            </BentoCard>

            {/* Output Display Card */}
            <div className="space-y-6">
              {isGeneratingPost && (
                <BentoCard span={1} className="!bg-slate-955 !border-slate-850">
                  <div className="font-mono text-[11px] text-slate-300 space-y-2.5">
                    <div className="flex justify-between text-[10px] text-violet-400 uppercase font-semibold tracking-wider">
                      <span>Generator Worker active</span>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-1.5 pt-2 select-none h-40 overflow-y-auto">
                      {generatorLogs.map((log, idx) => (
                        <p key={idx} className={log.startsWith("✓") ? "text-emerald-400 font-semibold" : "text-slate-450"}>
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                </BentoCard>
              )}

              {!generatedPost && !isGeneratingPost && (
                <div className="flex flex-col items-center justify-center py-28 px-4 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl text-center">
                  <Sparkles className="h-8 w-8 text-slate-300 animate-pulse mb-3" />
                  <h4 className="text-xs font-bold text-slate-700">No Post Drafted Yet</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                    Select one of the AI suggestions or type your custom thought in the field, configure visual outputs, and click draft.
                  </p>
                </div>
              )}

              {generatedPost && !isGeneratingPost && (
                <div className="space-y-6">
                  {/* Text Copy display */}
                  <BentoCard span={1} className="relative">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Copywriting Draft</span>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] border border-slate-200/80 rounded-lg px-2.5 py-1 bg-white hover:bg-slate-50 transition"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={generatedPost.postCopy}
                      onChange={(e) => setGeneratedPost({ ...generatedPost, postCopy: e.target.value })}
                      rows={10}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-xs text-slate-805 leading-relaxed focus:outline-none focus:border-violet-500 resize-none font-light"
                    />
                  </BentoCard>

                  {/* Graphic Display via VisualEngine */}
                  {generatedPost.imageUrl && (
                    <BentoCard span={1}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Graphic</span>
                      </div>
                      <div className="flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <div className="w-[min(100%,360px)] aspect-square rounded-lg overflow-hidden shadow">
                          <VisualEngine
                            visualType={nbAttachmentStyle === "image-overlay" ? "custom-overlay" : "none"}
                            imageUrl={generatedPost.imageUrl}
                            visualData={{
                              headline: generatedPost.headline || "",
                              subtext: generatedPost.subtext || ""
                            }}
                            dna={mockNbDna}
                            activeLogo=""
                          />
                        </div>
                      </div>
                    </BentoCard>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
