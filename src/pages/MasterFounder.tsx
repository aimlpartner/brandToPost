import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, Cpu, Upload, Loader2, Sparkles, Save, Target, MessageSquare, 
  Zap, Clock, Globe, FileText, CheckCircle2, ChevronRight, Play, Check,
  Palette, Type, Download, Copy, RefreshCw, FileSignature, Linkedin, Image as ImageIcon
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { db, auth } from "../firebase";
import { doc, updateDoc, collection, query, orderBy, getDocs, deleteDoc, setDoc } from "firebase/firestore";
import { logSilentError } from "../lib/firestore-error";
import { synthesizeFounderAgent, generateGeneralFounderPost, generateFounderTopicSuggestions, generateBrandedFounderPost } from "../services/geminiService";
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
  className?: string;
}

function BulletEditor({ label, items, icon: Icon, color, dotColor, onChange, className = "" }: BulletEditorProps) {
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
    <div className={`bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-xs font-bold text-slate-800 tracking-tight">{label}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editing) handleSave();
              else setEditing(true);
            }}
            className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>
        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] text-xs rounded-xl p-3 outline-none resize-none leading-relaxed transition-colors"
            placeholder="One item per line..."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-1.5 shrink-0`} />
                <span>{item}</span>
              </li>
            ))}
            {items.length === 0 && <li className="text-xs text-slate-350 italic">None generated yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MasterFounder() {
  const { user, userProfile } = useAuth();
  const { products, updateProduct } = useProducts();
  const [activeTab, setActiveTab] = useState<"brain" | "brands" | "generator">("brain");

  const renderMiniLayoutPreview = (id: string) => {
    switch (id) {
      case "auto":
        return (
          <div className="w-full h-20 bg-violet-50 rounded-lg overflow-hidden border border-violet-100 flex flex-col items-center justify-center text-violet-500 space-y-1">
            <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
            <span className="text-[8px] font-bold tracking-wider">AUTO ROTATE</span>
          </div>
        );
      case "editorial-left":
        return (
          <div className="w-full h-20 bg-slate-800 rounded-lg overflow-hidden flex border border-slate-200">
            <div className="w-[40%] bg-[#1e293b] p-1 flex flex-col justify-between border-r border-violet-500/20">
              <div className="space-y-0.5">
                <div className="h-0.5 w-3 bg-violet-400 rounded"></div>
                <div className="h-1.5 w-full bg-white/80 rounded"></div>
                <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1.5 w-4 bg-slate-500/50 rounded"></div>
            </div>
            <div className="w-[60%] bg-slate-200 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        );
      case "editorial-right":
        return (
          <div className="w-full h-20 bg-slate-800 rounded-lg overflow-hidden flex border border-slate-200">
            <div className="w-[60%] bg-slate-200 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="w-[40%] bg-[#1e293b] p-1 flex flex-col justify-between border-l border-violet-500/20">
              <div className="space-y-0.5">
                <div className="h-0.5 w-3 bg-violet-400 rounded"></div>
                <div className="h-1.5 w-full bg-white/80 rounded"></div>
                <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1.5 w-4 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "cinema-bottom":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-0 left-0 w-full h-[35%] bg-slate-900/90 border-t border-violet-500 p-1 flex justify-between items-center">
              <div className="space-y-0.5 w-[70%]">
                <div className="h-1.5 w-full bg-white rounded"></div>
                <div className="h-0.5 w-3/4 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "knockout-type":
        return (
          <div className="w-full h-20 bg-slate-300 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40 z-0"></div>
            <ImageIcon className="h-4 w-4 text-slate-400/60" />
            <div className="absolute inset-0 p-1.5 flex flex-col justify-end z-10 space-y-0.5">
              <div className="h-1 w-4 bg-violet-500 rounded"></div>
              <div className="h-2 w-4/5 bg-white rounded"></div>
              <div className="h-2 w-3/5 bg-white rounded"></div>
              <div className="h-1 w-1/2 bg-slate-300 rounded"></div>
            </div>
          </div>
        );
      case "ticker-strip":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute top-[35%] left-0 w-full h-[30%] bg-slate-950/95 border-y border-violet-500 p-1 flex justify-between items-center">
              <div className="h-1.5 w-2/3 bg-white rounded"></div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "stacked-blocks":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-1 left-1.5 space-y-0.5 flex flex-col items-start max-w-[90%]">
              <div className="bg-slate-900 text-white px-1 py-0.5 rounded shadow border-b border-violet-500">
                <div className="h-1.5 w-8 bg-white rounded"></div>
              </div>
              <div className="bg-white px-1 py-0.5 rounded shadow">
                <div className="h-1 w-10 bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        );
      case "frame-border":
        return (
          <div className="w-full h-20 bg-slate-50 rounded-lg p-1 overflow-hidden flex flex-col justify-between border border-slate-200">
            <div className="w-full h-[70%] bg-slate-200 rounded flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-slate-400" />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <div className="space-y-0.5">
                <div className="h-1 w-10 bg-slate-800 rounded"></div>
                <div className="h-0.5 w-6 bg-slate-400 rounded"></div>
              </div>
              <div className="h-1 w-3 bg-slate-350 rounded"></div>
            </div>
          </div>
        );
      case "diagonal-split":
        return (
          <div className="w-full h-20 bg-[#111827] rounded-lg overflow-hidden relative border border-slate-200">
            <div className="absolute inset-0 bg-slate-200" style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0% 75%)" }}>
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-end z-10">
              <div className="space-y-0.5 max-w-[70%]">
                <div className="h-1.5 w-full bg-white rounded border-l border-violet-500 pl-0.5"></div>
                <div className="h-0.5 w-3/4 bg-slate-400 rounded pl-0.5"></div>
              </div>
              <div className="h-1 w-3 bg-slate-500/50 rounded"></div>
            </div>
          </div>
        );
      case "neon-minimal":
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/30"></div>
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 space-y-0.5">
              <div className="flex gap-0.5">
                <div className="h-1.5 w-4 bg-violet-500 rounded"></div>
                <div className="h-1.5 w-6 bg-white rounded"></div>
                <div className="h-1.5 w-3 bg-violet-500 rounded"></div>
              </div>
              <div className="h-0.5 w-8 bg-slate-300 rounded"></div>
            </div>
          </div>
        );
      case "editorial-grid":
        return (
          <div className="w-full h-20 bg-slate-50 rounded-lg p-1 overflow-hidden flex justify-between items-center border border-slate-200">
            <div className="w-[50%] space-y-1 pl-0.5">
              <div className="h-0.5 w-4 bg-violet-500 rounded"></div>
              <div className="h-2 w-full bg-slate-800 rounded"></div>
              <div className="h-1 w-3/4 bg-slate-400 rounded"></div>
            </div>
            <div className="w-[45%] h-[85%] bg-slate-200 rounded flex items-center justify-center border border-white shadow-sm">
              <ImageIcon className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-20 bg-slate-200 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-slate-400" />
          </div>
        );
    }
  };

  // Profiler collapsible control & Success Modal states
  const [showProfiler, setShowProfiler] = useState(true);
  const [hasInitializedProfilerState, setHasInitializedProfilerState] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calibratedPersonaName, setCalibratedPersonaName] = useState("");

  useEffect(() => {
    if (userProfile && !hasInitializedProfilerState) {
      setShowProfiler(!userProfile.founderAgentSynthesized);
      setHasInitializedProfilerState(true);
    }
  }, [userProfile, hasInitializedProfilerState]);

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

  // Founder LinkedIn integration state
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);

  const checkLinkedinStatus = async () => {
    if (!user) return;
    setIsCheckingStatus(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/linkedin/status?productId=founder_${user.uid}`, {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLinkedinConnected(!!data.connected);
      }
    } catch (err) {
      console.error("Failed to fetch LinkedIn connection status:", err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectLinkedin = async () => {
    if (!user) return;
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/auth/linkedin/url?productId=founder_${user.uid}`, {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setError('Please allow popups for this site to connect your account.');
    } catch (error) {
      logSilentError(error as Error, { context: "handleConnectLinkedinFounder" });
      setError('Failed to initiate LinkedIn connection.');
    }
  };

  const handleDisconnectLinkedin = async () => {
    if (!user) return;
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ productId: `founder_${user.uid}`, platform: 'linkedin' })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to disconnect from LinkedIn');
      }
      setIsLinkedinConnected(false);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleDisconnectLinkedinFounder" });
      setError(err.message || 'Failed to disconnect LinkedIn.');
    }
  };

  const handleManualPublish = async (postId: string) => {
    if (!user) return;
    setPublishingPostId(postId);
    try {
      setError(null);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/founder/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ postId })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to publish post');
      }
      alert("Successfully published to LinkedIn!");
      await fetchAutomatedPosts();
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleManualPublishFounder" });
      setError(err.message || 'Failed to publish post to LinkedIn.');
    } finally {
      setPublishingPostId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "generator" && user) {
      checkLinkedinStatus();
    }
  }, [activeTab, user]);

  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkLinkedinStatus();
      }
    };
    window.addEventListener('message', handleOauthMessage);
    return () => window.removeEventListener('message', handleOauthMessage);
  }, [user]);

  // Track run states for products
  const [runningBrandId, setRunningBrandId] = useState<string | null>(null);
  const [brandMessage, setBrandMessage] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  // General Post Generator State
  const [postTopic, setPostTopic] = useState("");
  const [postReference, setPostReference] = useState("");
  const [nbAttachmentStyle, setNbAttachmentStyle] = useState<"text-only" | "image-only" | "image-overlay">("text-only");
  const [nbSelectedLayout, setNbSelectedLayout] = useState<string>("auto");
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
    layoutId?: string;
  } | null>(null);

  // Suggestions states
  const [suggestions, setSuggestions] = useState<{ title: string; description: string; prompt: string }[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Automated posts history states
  const [automatedPosts, setAutomatedPosts] = useState<any[]>([]);
  const [loadingAutoposts, setLoadingAutoposts] = useState(false);

  // Post scope state
  const [postScope, setPostScope] = useState<"general" | "branded">("general");
  const [selectedManualBrands, setSelectedManualBrands] = useState<string[]>([]);

  const fetchAutomatedPosts = async () => {
    if (!user) return;
    setLoadingAutoposts(true);
    try {
      const postsRef = collection(db, "users", user.uid, "founder_posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAutomatedPosts(list);
    } catch (err) {
      console.error("Failed to fetch automated posts:", err);
    } finally {
      setLoadingAutoposts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, "users", user.uid, "founder_posts", postId);
      await deleteDoc(postRef);
      setAutomatedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "generator" && user) {
      fetchAutomatedPosts();
    }
  }, [activeTab, user]);

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
    if (
      activeTab === "generator" &&
      suggestions.length === 0 &&
      userProfile?.founderAgentSynthesized &&
      !isFetchingSuggestions
    ) {
      fetchTopicSuggestions();
    }
  }, [activeTab, userProfile, suggestions.length, isFetchingSuggestions]);

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
      setLogs(p => [...p, "✓ Cognitive Synthesis Complete.", `Activated Founder Brain: "${profile.personaName}"`]);
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

      // Trigger UX modal and collapse profiler
      setCalibratedPersonaName(profile.personaName);
      setShowSuccessModal(true);
      setShowProfiler(false);

      // Trigger Founder Agent Email
      if (user.email) {
        try {
          const { generateFounderAgentPDF } = await import("../lib/pdfGenerator");
          const mockProduct = {
            name: "B2P Workspace",
            founderVoiceDescription: voiceDesc,
            founderAgentSynthesized: payload.founderAgentSynthesized
          };
          const pdfDoc = await generateFounderAgentPDF(mockProduct as any);
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

  // Handle General & Branded Founder Post Generation
  const handleGeneratePost = async () => {
    if (!userProfile?.founderAgentSynthesized) {
      setError("You must first synthesize your Founder Brain before generating founder posts.");
      return;
    }
    if (!postTopic.trim()) {
      setError("Please input a topic or core thought for your post.");
      return;
    }
    if (postScope === "branded" && selectedManualBrands.length === 0) {
      setError("Please select at least one brand/product to focus on.");
      return;
    }
    setError(null);
    setGeneratedPost(null);
    setIsGeneratingPost(true);
    setGeneratorLogs(["Spawning virtual Founder Brain...", `Topic: "${postTopic}"`]);

    const recentLayoutHistory = automatedPosts
      .map((p: any) => p.layoutId)
      .filter(Boolean)
      .slice(0, 10);

    const layoutIdParam = nbSelectedLayout === "auto" ? undefined : nbSelectedLayout;

    try {
      if (postScope === "general") {
        const t1 = setTimeout(() => setGeneratorLogs(p => [...p, "Analyzing behavioral heuristics for tone match..."]), 850);
        const t2 = setTimeout(() => setGeneratorLogs(p => [...p, "Drafting organic social copy (strictly non-branded)..."]), 1700);

        const result = await generateGeneralFounderPost({
          topic: postTopic,
          referencePosts: postReference,
          attachmentStyle: nbAttachmentStyle,
          customImagePrompt: nbCustomImagePrompt,
          founderAgent: userProfile.founderAgentSynthesized,
          userId: user?.uid,
          layoutId: layoutIdParam,
          recentLayoutHistory
        });

        clearTimeout(t1); clearTimeout(t2);

        if (nbAttachmentStyle !== "text-only" && result.imageUrl) {
          setGeneratorLogs(p => [...p, "✓ Image backdrop generated successfully via Imagen AI."]);
        }
        setGeneratorLogs(p => [...p, "✓ Central post copy drafted successfully."]);

        // Save to Firestore
        const newPostId = 'fpost_' + Math.random().toString(36).substring(2, 11);
        const newPost = {
          id: newPostId,
          userId: user?.uid,
          postCopy: result.postCopy,
          imageUrl: result.imageUrl || null,
          headline: result.headline || null,
          subtext: result.subtext || null,
          imagePrompt: result.imagePrompt || null,
          layoutId: result.layoutId || null,
          createdAt: new Date().toISOString(),
          status: "scheduled",
          topic: result.headline || "Manual Insight",
          isBranded: false,
          productId: null
        };
        await setDoc(doc(db, "users", user!.uid, "founder_posts", newPostId), newPost);

        setGeneratedPost(result);
        await fetchAutomatedPosts();
      } else {
        // Branded founder post loop
        const targets = selectedManualBrands;
        setGeneratorLogs(p => [...p, `Drafting branded copy for ${targets.length} product(s)...`]);

        let lastResult = null;
        for (const pId of targets) {
          const pData = products.find(p => p.id === pId);
          if (!pData) continue;
          setGeneratorLogs(p => [...p, `Generating branded post for: ${pData.name}...`]);

          const result = await generateBrandedFounderPost({
            topic: postTopic,
            referencePosts: postReference,
            attachmentStyle: nbAttachmentStyle,
            customImagePrompt: nbCustomImagePrompt,
            founderAgent: userProfile.founderAgentSynthesized,
            product: pData,
            userId: user?.uid,
            layoutId: layoutIdParam,
            recentLayoutHistory
          });

          const newPostId = 'fpost_' + Math.random().toString(36).substring(2, 11);
          const newPost = {
            id: newPostId,
            userId: user?.uid,
            postCopy: result.postCopy,
            imageUrl: result.imageUrl || null,
            headline: result.headline || null,
            subtext: result.subtext || null,
            imagePrompt: result.imagePrompt || null,
            layoutId: result.layoutId || null,
            createdAt: new Date().toISOString(),
            status: "scheduled",
            topic: `Focus: ${pData.name}`,
            isBranded: true,
            productId: pData.id
          };
          await setDoc(doc(db, "users", user!.uid, "founder_posts", newPostId), newPost);
          
          lastResult = result;
        }

        if (lastResult) {
          setGeneratedPost(lastResult);
        }
        setGeneratorLogs(p => [...p, "✓ All branded posts generated successfully."]);
        await fetchAutomatedPosts();
      }
      setIsGeneratingPost(false);
    } catch (err: any) {
      logSilentError(err, { context: "handleGeneratePost" });
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
      {/* Luxury Minimal Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 text-left">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-650 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-805 font-display">Master Founder Agent</h1>
              {userProfile?.founderAgentSynthesized ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                  <Sparkles className="h-2.5 w-2.5" /> Founder Brain Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider">
                  Not Synthesized
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-light max-w-2xl leading-relaxed">
              Your centralized Digital Founder Brain control board. Define your persona once and deploy it across all brands. Manages schedules, triggers content, and monitors daily automations.
            </p>
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

      {/* Main Layout: Left Vertical Tab Nav + Right Content Area (matches ProductDNA) */}
      <div className="flex gap-8 items-start text-left mt-6">
        
        {/* Desktop: Vertical Mini Sidebar Navigation */}
        <nav className="hidden md:flex flex-col shrink-0 w-44 pt-1 sticky top-8 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Master Agent</p>
          {[
            { key: "brain", label: "Founder Brain" },
            { key: "brands", label: "Brand Control Board" },
            { key: "generator", label: "Founder Post Generator" }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`text-left px-3 py-2.5 text-xs transition-all duration-150 border-l-2 ${
                  isActive
                    ? "border-[#7C3AED] text-slate-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile: Horizontal Scroll Tabs */}
        <div className="md:hidden w-full mb-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { key: "brain", label: "Founder Brain" },
            { key: "brands", label: "Brand Control Board" },
            { key: "generator", label: "Founder Post Generator" }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive ? "bg-[#7C3AED] text-white" : "text-slate-500 bg-slate-100 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
            {activeTab === "brain" ? (
              <div className="space-y-6">
                
                {/* Active control toggle bar */}
                {userProfile?.founderAgentSynthesized && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-900/10 rounded-2xl p-4 gap-3 shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Founder Brain Calibrated</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProfiler(!showProfiler)}
                      className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] border border-slate-200/80 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all cursor-pointer select-none text-center"
                    >
                      {showProfiler ? "Hide Profiler & Style Settings" : "Configure Voice Inputs & Style"}
                    </button>
                  </div>
                )}

                {/* Row 1: Collapsible Setup Tools */}
                {showProfiler && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in slide-in-from-top-1 duration-200">
                    
                    {/* Column 1: AI Founder Brain Profiler Uploader Tool */}
                    <BentoCard span={1} className="!bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <SectionTitle icon={Sparkles} title="Founder Brain AI Profiler" />
                        <p className="text-xs text-slate-500 leading-relaxed mb-5 font-light">
                          Feed descriptions of your personal voice or upload blog drafts/diary texts to synthesize your virtual Founder Brain.
                        </p>
                        
                        <div className="space-y-5">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">
                              <MessageSquare className="h-3 w-3 text-slate-455" /> Voice Description
                            </label>
                            <textarea
                              value={voiceDesc}
                              onChange={(e) => {
                                setVoiceDesc(e.target.value);
                                saveProfileData({ founderVoiceDescription: e.target.value });
                              }}
                              rows={4}
                              className="w-full bg-white border border-slate-200 focus:border-[#7C3AED] rounded-xl px-3 py-2.5 text-xs text-slate-805 placeholder-slate-300 outline-none resize-none transition-colors"
                              placeholder="e.g. I prefer punchy sentences, speak skeptically of corporate speak, and focus on developer problems..."
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-2">
                              <FileText className="h-3 w-3 text-slate-455" /> Voice Training Document
                            </label>
                            {voiceFile ? (
                              <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl justify-between">
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
                                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg border border-transparent hover:border-red-100 transition-all shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-355 transition-colors cursor-pointer"
                              />
                            )}
                          </div>

                          {/* Optional Strategic Overrides Collapsible Drawer */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => setShowOptionalInputs(!showOptionalInputs)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-wider transition-colors"
                            >
                              <span>Optional strategy overrides</span>
                              <ChevronRight className={`h-3.5 w-3.5 text-slate-450 transition-transform ${showOptionalInputs ? 'rotate-90' : ''}`} />
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
                        </div>
                      </div>

                      <div className="mt-6 pt-3">
                        <button
                          type="button"
                          onClick={handleSynthesize}
                          disabled={isSynthesizing || (!voiceDesc && !voiceFile)}
                          className="w-full bg-violet-600 hover:bg-violet-750 text-white rounded-xl py-3 text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase"
                        >
                          {isSynthesizing ? (
                            <>
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                              <span>Profiling Founder Brain...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Synthesize Founder Brain</span>
                            </>
                          )}
                        </button>
                      </div>
                    </BentoCard>

                    {/* Column 2: Personal Brand Graphic Styling */}
                    <BentoCard span={1} className="flex flex-col justify-between">
                      <div className="space-y-6">
                        {/* Color Palette section */}
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4 text-violet-500" />
                              <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wider">Color Palette</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (nbColors.length < 8) {
                                  const nextColors = [...nbColors, "#7C3AED"];
                                  setNbColors(nextColors);
                                  saveProfileData({ nonBrandedColors: nextColors });
                                }
                              }}
                              className="text-[10px] font-bold text-[#7C3AED] hover:bg-violet-50 px-2.5 py-1 rounded-lg border border-transparent hover:border-violet-100 transition"
                            >
                              + Add
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {nbColors.map((color, idx) => (
                              <div key={idx} className="relative group flex flex-col items-center">
                                <div 
                                  className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 cursor-pointer relative"
                                  style={{ backgroundColor: color }}
                                >
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => handleColorChange(idx, e.target.value)}
                                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 outline-none bg-transparent opacity-0"
                                  />
                                </div>
                                <span className="text-[9px] font-mono text-slate-450 mt-1.5 uppercase tracking-wider">{color}</span>
                                {nbColors.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextColors = nbColors.filter((_, i) => i !== idx);
                                      setNbColors(nextColors);
                                      await saveProfileData({ nonBrandedColors: nextColors });
                                    }}
                                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Typography section */}
                        <div>
                          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                            <Type className="h-4 w-4 text-violet-500" />
                            <h3 className="text-xs font-bold text-slate-855 uppercase tracking-wider">Typography</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Primary */}
                            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex items-center gap-3">
                              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white border border-slate-150 text-base font-bold text-slate-700 font-display shadow-sm shrink-0">
                                Aa
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block mb-0.5">Primary (Headings)</span>
                                <select
                                  value={nbPrimaryFont}
                                  onChange={async (e) => {
                                    setNbPrimaryFont(e.target.value);
                                    await saveProfileData({ nonBrandedPrimaryFont: e.target.value });
                                  }}
                                  className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-705 p-0 focus:ring-0 cursor-pointer"
                                >
                                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                            </div>

                            {/* Secondary */}
                            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex items-center gap-3">
                              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-white border border-slate-150 text-base font-bold text-slate-700 font-display shadow-sm shrink-0">
                                Aa
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-bold text-slate-455 uppercase tracking-widest block mb-0.5">Secondary (Body)</span>
                                <select
                                  value={nbSecondaryFont}
                                  onChange={async (e) => {
                                    setNbSecondaryFont(e.target.value);
                                    await saveProfileData({ nonBrandedSecondaryFont: e.target.value });
                                  }}
                                  className="w-full bg-transparent border-0 outline-none text-xs font-bold text-slate-705 p-0 focus:ring-0 cursor-pointer"
                                >
                                  {POPULAR_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Synthesizer Terminal logs */}
                      {isSynthesizing && (
                        <div className="mt-6 border border-slate-800 rounded-xl bg-slate-900 p-4 font-mono text-[10px] text-slate-300 space-y-2 select-none">
                          <div className="flex justify-between text-[9px] text-violet-400 font-bold uppercase tracking-wider">
                            <span>Engine Terminal</span><span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-violet-500 h-1 rounded-full transition-all duration-350" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto pt-2">
                            {logs.map((log, idx) => (
                              <p key={idx} className={log.startsWith("✓") ? "text-emerald-400 font-semibold" : "text-slate-400"}>{log}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </BentoCard>
                  </div>
                )}

                {/* Bento Grid: Active Founder Brain Details */}
                {userProfile?.founderAgentSynthesized && !isSynthesizing ? (
                  <div className="w-full animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Card 1: Identity & Sync Status */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between relative overflow-hidden lg:col-span-4 md:col-span-2">
                        {/* Interactive Brainwave animation background */}
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                          <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
                            <path d="M10 60 C 30 30, 50 90, 70 60 C 90 30, 110 90, 130 60 C 150 30, 170 90, 190 60" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
                            <path d="M20 70 C 40 40, 60 100, 80 70 C 100 40, 120 100, 140 70 C 160 40, 180 100, 200 70" stroke="#2583EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                          </svg>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 border border-violet-200/50 font-display text-lg font-bold shrink-0">
                                {userProfile.founderAgentSynthesized.personaName?.charAt(0) || "F"}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                                  {userProfile.founderAgentSynthesized.personaName || "Active Founder Brain"}
                                </h3>
                                <p className="text-[9px] text-violet-500 font-bold uppercase tracking-wider">Founder Persona Twin</p>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100" />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-455">Sync Status</span>
                              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                Online & Active
                              </span>
                            </div>
                            {userProfile.founderAgentSynthesized.synthesizedAt && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-455">Last Calibrated</span>
                                <span className="font-mono text-slate-600 text-[11px]">
                                  {new Date(userProfile.founderAgentSynthesized.synthesizedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cognitive DNA Clone</span>
                          <span className="text-violet-500 font-medium font-mono text-[10px]">Arthur V1.2</span>
                        </div>
                      </div>

                      {/* Card 2: Strategic Targets */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-4 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Target className="h-4 w-4 text-violet-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Strategic Targets</h4>
                          </div>

                          <div className="space-y-4">
                            <SmartField
                              label="Target Industry"
                              value={userProfile.founderAgentSynthesized.targetIndustry || ""}
                              placeholder="e.g. SaaS"
                              onChange={(v) => {
                                const updated = { ...userProfile.founderAgentSynthesized, targetIndustry: v };
                                saveProfileData({ founderAgentSynthesized: updated });
                              }}
                            />
                            <SmartField
                              label="Target Audience"
                              value={userProfile.founderAgentSynthesized.targetAudience || ""}
                              placeholder="e.g. CTOs"
                              onChange={(v) => {
                                const updated = { ...userProfile.founderAgentSynthesized, targetAudience: v };
                                saveProfileData({ founderAgentSynthesized: updated });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Growth Goal */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-4 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Growth Goal</h4>
                          </div>

                          <SmartField
                            label="Immediate Scaling Target"
                            value={userProfile.founderAgentSynthesized.goal || ""}
                            placeholder="What is the immediate business or scaling goal?"
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, goal: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Card 4: Long-Term Vision */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-6 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Core Vision</h4>
                          </div>

                          <SmartField
                            label="Future Outlook"
                            value={userProfile.founderAgentSynthesized.vision || ""}
                            placeholder="Define your personal or startup long-term vision..."
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, vision: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Card 5: Daily Mission */}
                      <div className="bg-white border border-slate-900/10 rounded-2xl p-6 transition-all duration-300 hover:border-slate-900/20 hover:shadow-sm flex flex-col justify-between lg:col-span-6 md:col-span-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                            <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daily Mission</h4>
                          </div>

                          <SmartField
                            label="Value Driver"
                            value={userProfile.founderAgentSynthesized.mission || ""}
                            placeholder="What is your core daily driving mission?"
                            multiline
                            onChange={(v) => {
                              const updated = { ...userProfile.founderAgentSynthesized, mission: v };
                              saveProfileData({ founderAgentSynthesized: updated });
                            }}
                          />
                        </div>
                      </div>

                      {/* Cards 6-9: Cognitive DNA Bullet Editors */}
                      {[
                        { key: "behavioralTraits" as const, icon: Brain, color: "text-violet-500", label: "Personality & Traits", items: userProfile.founderAgentSynthesized.behavioralTraits || [], dotColor: "bg-violet-400", gridClass: "lg:col-span-4 md:col-span-1" },
                        { key: "coreValues" as const, icon: Target, color: "text-rose-500", label: "Core Beliefs & Values", items: userProfile.founderAgentSynthesized.coreValues || [], dotColor: "bg-rose-400", gridClass: "lg:col-span-4 md:col-span-1" },
                        { key: "communicationStyle" as const, icon: MessageSquare, color: "text-emerald-500", label: "Communication Style", items: userProfile.founderAgentSynthesized.communicationStyle || [], dotColor: "bg-emerald-400", gridClass: "lg:col-span-4 md:col-span-2 lg:col-span-4" },
                        { key: "decisionHeuristics" as const, icon: Zap, color: "text-amber-500", label: "Decision Heuristics", items: userProfile.founderAgentSynthesized.decisionHeuristics || [], dotColor: "bg-amber-400", gridClass: "lg:col-span-6 md:col-span-1" },
                      ].map(({ key, icon, color, label, items, dotColor, gridClass }) => (
                        <BulletEditor
                          key={key}
                          label={label}
                          items={items}
                          icon={icon}
                          color={color}
                          dotColor={dotColor}
                          className={gridClass}
                          onChange={(newItems) => {
                            const updatedSynthesized = {
                              ...userProfile.founderAgentSynthesized,
                              [key]: newItems,
                            };
                            saveProfileData({ founderAgentSynthesized: updatedSynthesized });
                          }}
                        />
                      ))}

                      {/* Card 10: Key Content Pillars */}
                      <BulletEditor
                        label="Key Content Pillars"
                        items={userProfile.founderAgentSynthesized.contentPillars || []}
                        icon={Brain}
                        color="text-[#7C3AED]"
                        dotColor="bg-[#7C3AED]"
                        className="lg:col-span-6 md:col-span-1"
                        onChange={(newItems) => {
                          const updated = { ...userProfile.founderAgentSynthesized, contentPillars: newItems };
                          saveProfileData({ founderAgentSynthesized: updated });
                        }}
                      />

                    </div>
                  </div>
                ) : (
                  !isSynthesizing && !userProfile?.founderAgentSynthesized && (
                    <div className="flex flex-col items-center justify-center py-28 px-4 bg-slate-55 border border-slate-200 border-dashed rounded-2xl text-center">
                      <Brain className="h-8 w-8 text-slate-350 animate-pulse mb-3" />
                      <h4 className="text-xs font-bold text-slate-700">No Founder Brain Calibrated</h4>
                      <p className="text-[10px] text-slate-400 max-w-[280px] leading-relaxed mt-1">
                        Configure your voice guidelines above and run synthesis to build your virtual active Founder Brain workspace.
                      </p>
                    </div>
                  )
                )}
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
          /* General Post Generator View */
          <div className="space-y-6">
            
            {/* 1. Automated Daily Posting Settings Card */}
            <BentoCard span={3}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-violet-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Daily Automated Profile Auto-Posting</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light mt-1 max-w-xl leading-relaxed">
                    Let your Founder Agent write and design social posts automatically. The agent dynamically generates insights at your selected daily time.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  {/* Toggle */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Auto-Posting
                    </span>
                    <button
                      onClick={async () => {
                        const nextVal = !userProfile?.automateFounderPosts;
                        await saveProfileData({ automateFounderPosts: nextVal });
                      }}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                        userProfile?.automateFounderPosts ? "bg-violet-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                          userProfile?.automateFounderPosts ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {userProfile?.automateFounderPosts && (
                    <>
                      {/* Time Picker */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                          Schedule
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-655 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <CustomTimePicker
                            value={utcToLocal(userProfile?.founderPostTimeUtc || "14:00")}
                            onChange={async (newLocalTime) => {
                              const timeUtc = localToUtc(newLocalTime);
                              await saveProfileData({ founderPostTimeUtc: timeUtc });
                            }}
                          />
                        </div>
                      </div>

                      {/* Content Type Selector */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                          Type
                        </span>
                        <select
                          value={userProfile?.founderPostType || "general"}
                          onChange={async (e) => {
                            await saveProfileData({ founderPostType: e.target.value as any });
                          }}
                          className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                        >
                          <option value="general">General (Non-Branded)</option>
                          <option value="branded">Branded (Product Focus)</option>
                          <option value="both">Both (General & Branded)</option>
                        </select>
                      </div>

                      {/* Graphic Style Selector */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                          Style
                        </span>
                        <select
                          value={userProfile?.founderPostAttachmentStyle || "text-only"}
                          onChange={async (e) => {
                            await saveProfileData({ founderPostAttachmentStyle: e.target.value as any });
                          }}
                          className="bg-transparent border-0 outline-none text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
                        >
                          <option value="text-only">Text Only</option>
                          <option value="image-only">Clean Graphic</option>
                          <option value="image-overlay">Text Overlaid</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Brands to include in auto-posting */}
              {userProfile?.automateFounderPosts && (userProfile?.founderPostType === "branded" || userProfile?.founderPostType === "both") && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Brands to Automate:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {products.map((p) => {
                      const isChecked = (userProfile?.founderPostSelectedProducts || []).includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={async () => {
                            const currentList = userProfile?.founderPostSelectedProducts || [];
                            const nextList = isChecked 
                              ? currentList.filter(id => id !== p.id)
                              : [...currentList, p.id];
                            await saveProfileData({ founderPostSelectedProducts: nextList });
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                            isChecked 
                              ? "bg-violet-600 border-violet-500 text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-555 hover:bg-slate-100"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personal Socials Connection Area */}
              <div className="mt-4 pt-4 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                    Personal Social Connection (LinkedIn Profile)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    Connect your personal LinkedIn account so your virtual founder doppelganger can publish posts directly to your profile.
                  </p>
                </div>

                <div>
                  {isLinkedinConnected ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        Connected to Profile
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnectLinkedin}
                        className="text-[10px] font-bold text-red-500 hover:text-red-650 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectLinkedin}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-[#0A66C2] hover:bg-[#00509d] transition shadow-sm cursor-pointer"
                    >
                      <Linkedin className="h-3 w-3" />
                      Connect Personal Profile
                    </button>
                  )}
                </div>
              </div>
            </BentoCard>

            {/* 2. Main manual tool container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Input Config Card */}
              <BentoCard span={1}>
                <SectionTitle icon={FileSignature} title="Configure Post Topic & Visuals" iconColor="text-violet-650" />
                
                <div className="space-y-5">
                  {/* Manual Scope Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Post Persona Branding Scope
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "general", label: "General Post (Non-Branded)" },
                        { value: "branded", label: "Branded Post (Product Focus)" }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPostScope(opt.value as any)}
                          className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                            postScope === opt.value
                              ? "bg-violet-600 border-violet-500 text-white shadow-sm"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-655"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channels Selector (Read-Only LinkedIn for now) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Target Social Channel
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 py-2 px-3 border border-[#0A66C2]/20 bg-[#0A66C2]/5 text-[#0A66C2] rounded-xl text-xs font-bold shadow-sm cursor-default"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn (Selected & Configured)
                      </button>
                    </div>
                  </div>

                  {/* Manual Brands Selection */}
                  {postScope === "branded" && (
                    <div className="animate-in fade-in duration-200 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select Target Brands / Products
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {products.map((p) => {
                          const isChecked = selectedManualBrands.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedManualBrands(prev => 
                                  isChecked 
                                    ? prev.filter(id => id !== p.id) 
                                    : [...prev, p.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                isChecked
                                  ? "bg-violet-600 border-violet-500 text-white shadow-sm"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-slate-400 italic">
                        Select one or more products. We will draft a dedicated founder post for each selected brand using its Brand DNA.
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Active Post Concept / Topic
                      </label>
                      <button
                        type="button"
                        disabled={isFetchingSuggestions || !userProfile?.founderAgentSynthesized}
                        onClick={fetchTopicSuggestions}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-655 hover:text-[#6D28D9] disabled:opacity-40"
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
                    <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-2.5">
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
                              : "bg-white border-slate-200 hover:bg-slate-55 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {nbAttachmentStyle !== "text-only" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-2">
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

                      {nbAttachmentStyle === "image-overlay" && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-2">
                            Post Visual Layout Template
                          </label>
                          <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                            {[
                              { id: "auto", name: "Auto-Rotate (Variety)", desc: "Cycles all compositions" },
                              { id: "editorial-left", name: "Editorial Left Panel", desc: "Left sidebar column layout" },
                              { id: "editorial-right", name: "Editorial Right Panel", desc: "Right sidebar column layout" },
                              { id: "cinema-bottom", name: "Cinematic Bottom Bar", desc: "Wide widescreen base bar" },
                              { id: "knockout-type", name: "Heavy Typography", desc: "Bold statement text overlay" },
                              { id: "ticker-strip", name: "Ticker Strip", desc: "Center horizontal strip block" },
                              { id: "stacked-blocks", name: "Bauhaus Block Stack", desc: "Offset geometric stickered look" },
                              { id: "frame-border", name: "Classic Polaroid Frame", desc: "Border frame photo layout" },
                              { id: "diagonal-split", name: "Diagonal Split Slice", desc: "Modern angled split canvas" },
                              { id: "neon-minimal", name: "Highlight Accent", desc: "Highlighted brand word accents" },
                              { id: "editorial-grid", name: "Clean Asymmetric Grid", desc: "Asymmetric sidebar block" }
                            ].map((lt) => (
                              <button
                                key={lt.id}
                                type="button"
                                onClick={() => setNbSelectedLayout(lt.id)}
                                className={`p-2 rounded-xl transition-all border text-left flex flex-col gap-2 relative group ${
                                  nbSelectedLayout === lt.id
                                    ? "bg-violet-50/70 border-violet-500 ring-2 ring-violet-500/20 shadow-sm"
                                    : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs text-slate-705"
                                }`}
                              >
                                {renderMiniLayoutPreview(lt.id)}
                                <div className="px-0.5">
                                  <span className="text-[11px] font-bold text-slate-800 leading-tight block truncate group-hover:text-violet-700 transition-colors">
                                    {lt.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 leading-normal font-light block truncate mt-0.5">
                                    {lt.desc}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm text-left space-y-4">
                    {/* Mock Post Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-755 border border-violet-250 uppercase shrink-0">
                        {userProfile?.founderAgentSynthesized?.personaName?.charAt(0) || "F"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {userProfile?.founderAgentSynthesized?.personaName || "Founder Persona"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">• 1st</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight font-light truncate">
                          Founder & Executive • {userProfile?.founderAgentSynthesized?.targetIndustry || "Technology"}
                        </span>
                        <span className="text-[9px] text-slate-400 block leading-tight mt-0.5 font-light">
                          Just now • Edited • 🌐
                        </span>
                      </div>
                    </div>

                    {/* Mock Post Body Copy Placeholder */}
                    <div className="space-y-2 py-2">
                      <div className="h-2.5 w-11/12 bg-slate-100 rounded" />
                      <div className="h-2.5 w-full bg-slate-100 rounded" />
                      <div className="h-2.5 w-4/5 bg-slate-100 rounded" />
                      <p className="text-[10px] text-slate-450 leading-relaxed font-light pt-2 italic">
                        Select one of the AI suggestions or type your custom thought in the field, configure visual outputs, and click draft.
                      </p>
                    </div>

                    {/* Mock Visual Backdrop Area */}
                    <div className="aspect-square bg-slate-50 border border-slate-150 rounded-xl flex flex-col items-center justify-center text-center p-6 border-dashed">
                      <Sparkles className="h-7 w-7 text-slate-300 animate-pulse mb-2" />
                      <span className="text-xs font-bold text-slate-700">Visual Graphic Canvas</span>
                      <span className="text-[10px] text-slate-400 max-w-[200px] mt-1 font-light leading-relaxed">
                        Backdrop graphic generated by Imagen AI with custom headline overlays will render here.
                      </span>
                    </div>
                  </div>
                )}

                {generatedPost && !isGeneratingPost && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm text-left space-y-4">
                    {/* Mock Post Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-755 border border-violet-250 uppercase shrink-0">
                          {userProfile?.founderAgentSynthesized?.personaName?.charAt(0) || "F"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {userProfile?.founderAgentSynthesized?.personaName || "Founder Persona"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">• 1st</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block leading-tight font-light truncate">
                            Founder & Executive • {userProfile?.founderAgentSynthesized?.targetIndustry || "Technology"}
                          </span>
                          <span className="text-[9px] text-slate-400 block leading-tight mt-0.5 font-light">
                            Just now • Edited • 🌐
                          </span>
                        </div>
                      </div>

                      {/* Copy Action button */}
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7C3AED] hover:text-[#6D28D9] border border-slate-200/85 rounded-lg px-2.5 py-1.5 bg-white hover:bg-slate-50 transition shadow-sm shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Post Copy Edit Area */}
                    <div className="space-y-2">
                      <textarea
                        value={generatedPost.postCopy}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, postCopy: e.target.value })}
                        rows={10}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-xs text-slate-805 leading-relaxed focus:outline-none focus:border-violet-500 resize-none font-light"
                        placeholder="Edit copywriting draft here..."
                      />
                    </div>

                    {/* Visual Graphic preview inline */}
                    {generatedPost.imageUrl && (
                      <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 p-4 flex justify-center">
                        <div className="w-[min(100%,360px)] aspect-square rounded-lg overflow-hidden shadow bg-white">
                          <img
                            src={generatedPost.imageUrl}
                            alt="Visual graphic attachment"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* 3. Recent Automated & Generated Posts Section */}
            {automatedPosts.length > 0 && (
              <BentoCard span={3} className="mt-6">
                <SectionTitle icon={FileText} title="Recent Automated & Generated Insights" iconColor="text-violet-650" />
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {automatedPosts.map((post) => (
                    <div key={post.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-5 transition-all duration-200 text-left">
                      
                      {/* Left: Text copy */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-violet-100 text-violet-755 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {post.topic || "Daily Insight"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Generated: {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {/* Status Badges */}
                            {post.status === "published" ? (
                              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Published
                              </span>
                            ) : post.status === "failed" ? (
                              <span 
                                title={post.publishError || "Unknown publishing error"} 
                                className="text-[9px] font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider cursor-help"
                              >
                                Failed
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono bg-slate-100 text-slate-655 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Draft
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {post.status !== "published" && (
                              <button
                                disabled={!isLinkedinConnected || publishingPostId !== null}
                                onClick={() => handleManualPublish(post.id)}
                                title={!isLinkedinConnected ? "Please connect your personal LinkedIn account first" : "Publish to your personal LinkedIn profile"}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1.5 transition shadow-sm border ${
                                  !isLinkedinConnected
                                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-[#0A66C2] hover:text-[#00509d] border-[#0A66C2]/30 hover:border-[#0A66C2]/60"
                                }`}
                              >
                                {publishingPostId === post.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-[#0A66C2]" />
                                ) : (
                                  <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                                )}
                                <span>Publish to LinkedIn</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(post.postCopy);
                                alert("Copied to clipboard!");
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 border border-slate-200/85 rounded-lg px-2.5 py-1.5 bg-white transition shadow-sm"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy Text</span>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg px-2.5 py-1.5 transition"
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-light">
                          {post.postCopy}
                        </p>
                      </div>

                      {/* Right: Graphic attachment (if any) */}
                      {post.imageUrl && (
                        <div className="w-full md:w-48 aspect-square shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-150 bg-white">
                          <img
                            src={post.imageUrl}
                            alt="Visual graphic attachment"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </BentoCard>
            )}
          </div>
        )}
        </div>
      </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-900/10 rounded-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 shadow-xl">
            {/* Pulsing check circle indicator */}
            <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 animate-pulse text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Founder Brain Calibrated</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Your virtual persona twin <span className="font-semibold text-[#7C3AED]">"{calibratedPersonaName}"</span> has been synthesized and is now active inside the workspace.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl py-3 transition shadow-sm"
            >
              Explore Founder Brain
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
