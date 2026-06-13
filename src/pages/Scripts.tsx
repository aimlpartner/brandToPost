import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Settings, 
  FileText, 
  CalendarClock, 
  Upload, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Music, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle,
  Video,
  Smile,
  Sliders,
  Tv,
  Clapperboard,
  BookOpen,
  Palette
} from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { Scene, ScriptData } from "../types";
import { copyFormattedText } from "../lib/utils";


// Standard model we use:
const MODEL_NAME = "gemini-3.5-flash";

const DEFAULT_SCRIPT: ScriptData = {
  title: "Tror: The Anti-Slop Campaign Solution",
  gtmHook: "Stop posting. Start positioning.",
  coreMission: "Tror is an autonomous AI brand ecosystem that maps customer psychographics to auto-generate context-aware social copies and ad creatives.",
  logoIdentityDna: "A modern, minimalist icon in a rounded square featuring a stylized, abstract 'B' glyph split diagonally, shaded with a vibrant violet-to-purple gradient. Highly suited for an impactful intro/outro branding slate.",
  mascotIdentityDna: "A cool, stylized cartoon mascot named 'TROR' sporting windblown black hair, dark shades with purple reflection, a high-collar black jacket, and a striking violet scarf. He confidently holds a dark manual outlining 'Position, Outreach, Signal, Traction.' Excellent for interactive sticker-style overlays.",
  primaryAudience: "Growth marketers, brand managers, and agency founders tired of generic AI-slop content.",
  crownJewelProposition: "Transforms raw company data into campaigns with deep emotional resonance through psychographic Heaven/Hell state mapping.",
  centralAgitatedPain: "Brands post endless, automated generic social media content that lacks true emotional signal, traction, or pull.",
  calibratedToneAdjectives: ["Bold", "Intellectual", "Uncompromising"],
  suggestedColors: [
    { label: "Obsidian Black", value: "#0B0B0C" },
    { label: "Electric Violet", value: "#7C3AED" },
    { label: "Deep Charcoal", value: "#1C1C22" },
    { label: "Slate Purple", value: "#4C1D95" }
  ],
  scenes: [
    {
      title: "Scene #1",
      timing: "0:00 - 0:05",
      activeCameraCue: "A moody, atmospheric studio desk workspace lit with warm amber and deep purple neon accent backlights. The central presenter sits poised.",
      dialog: "[Leans aggressively close to the lens, pointing a single finger with a deadpan, highly intense facial expression] Stop publishing endless AI-slop that absolutely nobody reads. Right?",
      videoPrompt: "A cinematic 35mm lens close-up of a charismatic creator in a black hoodie leaning into the camera, dark atmospheric studio room with purple neon accent backlights, warm amber key light, dramatic look, photorealistic.",
      soundEffects: "Phonk beat kicks in instantly. Quick keyboard 'clack' SFX aligned with the pointing gesture.",
      directingTip: "Keep a deadpan face for the first two seconds, then lock eye contact with high intensity to freeze the viewer's scroll."
    },
    {
      title: "Scene #2",
      timing: "0:05 - 0:10",
      activeCameraCue: "Slight camera pan to reveal a glowing analytics dashboard in the background showing sudden conversion spikes, with the TROR mascot animated sticker floating in the corner.",
      dialog: "If you want real conversion, you have to craft sharp, customized narratives. Custom-calibrated content that commands organic authority.",
      videoPrompt: "Dolly-in shot towards computer screen, premium user interface with interactive data visualization, neon purple lines climbing dramatically, modern ultra-clean design aesthetic.",
      soundEffects: "Clean sweep/swoosh transition. Ambient background hum.",
      directingTip: "Gesture naturally, shifting focus from the camera to the desk board to create a polished, interactive teacher flow."
    }
  ],
  visualStyleGuide: "Moody, shadow-heavy cinematic film noir combined with energetic cyber-punk electric violet neon styling. High-end screen transitions and precise timing blocks.",
  musicVibeGuide: "Phonk / Dark Synthwave (120 BPM) with sharp percussion, fast mechanical keyboard clacks, and heavily gated plate reverb.",
  requiredAssets: [
    {
      name: "High-Res Logo png (with Alpha transparency)",
      type: "Branding / Graphic Asset",
      purpose: "Applied onto the intro and outro slate to establish direct, distinct brand attribution.",
      description: "White minimalist icon featuring a diagonal-split abstract 'B' glyph shaded with a purple gradient."
    },
    {
      name: "Vector illustration of mascot 'TROR'",
      type: "Animated Overlay Sticker",
      purpose: "Floating corner animation overlay during Scene #2 to build mascot affiliation.",
      description: "Stylized vector of a character wearing black shades, black jacket, and a violet scarf holding a brand manual."
    },
    {
      name: "Interactive SaaS Analytics dashboard screen",
      type: "UI Desktop Capture / Screenshot",
      purpose: "Used as B-Roll visual background elements in Scene #2 computer screen dolly shot.",
      description: "Dashboard view displaying sudden traffic spikes with modern purple styled analytics charts."
    }
  ]
};

export function Scripts() {
  const { activeProduct, updateProduct } = useProducts();
  const { user } = useAuth();
  
  // Script inputs
  const [narrativeVibe, setNarrativeVibe] = useState("Problem-Agitating Explainer (Pain & Savior)");
  const [timingLimit, setTimingLimit] = useState("10 Seconds (Ultra Snappy Hook / Micro-Short)");
  const [productionFormat, setProductionFormat] = useState("Real-Life Creator / Studio Shoot");
  const [logoShowcase, setLogoShowcase] = useState("Intro/Outro Slate");
  
  // Mascot logic
  const [mascotFile, setMascotFile] = useState<File | null>(null);
  const [mascotPreview, setMascotPreview] = useState<string | null>(null);
  const [mascotShowcase, setMascotShowcase] = useState("Animated Sticker Overlay");
  const [isMascotUploading, setIsMascotUploading] = useState(false);

  // Active generation & playbook state
  const [activeTab, setActiveTab] = useState<"chrono" | "style" | "assets">("chrono");
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptTweakInput, setScriptTweakInput] = useState("");
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState<string | null>(null);
  
  // UX Copy/Download helpers
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Sync with activeProduct properties on load
  useEffect(() => {
    if (activeProduct) {
      const currentVibe = activeProduct.narrativeVibe || "Problem-Agitating Explainer (Pain & Savior)";
      const currentTiming = activeProduct.timingLimit || "10 Seconds (Ultra Snappy Hook / Micro-Short)";
      const currentFormat = activeProduct.productionFormat || "Real-Life Creator / Studio Shoot";
      const currentLogo = activeProduct.logoShowcase || "Intro/Outro Slate";
      const currentMascot = activeProduct.mascotShowcase || "Animated Sticker Overlay";

      setNarrativeVibe(currentVibe);
      setTimingLimit(currentTiming);
      setProductionFormat(currentFormat);
      setLogoShowcase(currentLogo);
      setMascotShowcase(currentMascot);
      if (activeProduct.mascotPreview) setMascotPreview(activeProduct.mascotPreview);

      if (activeProduct.activeScript) {
        setScriptData(activeProduct.activeScript);
      } else {
        setScriptData(null);
      }
    }
  }, [activeProduct?.id, activeProduct?.activeScript]);

  // Handle configuration changes with instant persistence
  const handleConfigChange = async (key: string, value: string) => {
    if (!activeProduct) return;
    try {
      if (key === 'narrativeVibe') setNarrativeVibe(value);
      else if (key === 'timingLimit') setTimingLimit(value);
      else if (key === 'productionFormat') setProductionFormat(value);
      else if (key === 'logoShowcase') setLogoShowcase(value);
      else if (key === 'mascotShowcase') setMascotShowcase(value);

      await updateProduct(activeProduct.id, { [key]: value });
    } catch (e) {
      console.error(`Failed to update ${key}:`, e);
    }
  };

  // Manual save for guaranteed reassurance
  const handleManualSave = async () => {
    if (!activeProduct) return;
    setSaveStatus("saving");
    try {
      await updateProduct(activeProduct.id, {
        narrativeVibe,
        timingLimit,
        productionFormat,
        logoShowcase,
        mascotShowcase,
        mascotPreview: mascotPreview || undefined,
        activeScript: scriptData
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      console.error("Manual save failed:", e);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  };

  // Trigger brief simulation of logs during generation
  const runLogSimulation = (logs: string[], callback: () => void) => {
    let index = 0;
    setGenerationLogs([]);
    const interval = setInterval(() => {
      if (index < logs.length) {
        setGenerationLogs(prev => [...prev, logs[index]]);
        index++;
      } else {
        clearInterval(interval);
        callback();
      }
    }, 700);
  };

  const notifyCopy = async (id: string, text: string) => {
    await copyFormattedText(text);
    setCopiedState(id);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleMascotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsMascotUploading(true);
      setMascotFile(file);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setMascotPreview(base64);
        setIsMascotUploading(false);
        if (activeProduct) {
          await updateProduct(activeProduct.id, { mascotPreview: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setIsMascotUploading(true);
      setMascotFile(file);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setMascotPreview(base64);
        setIsMascotUploading(false);
        if (activeProduct) {
          await updateProduct(activeProduct.id, { mascotPreview: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMascot = async () => {
    setMascotFile(null);
    setMascotPreview(null);
    if (activeProduct) {
      await updateProduct(activeProduct.id, { mascotPreview: "" });
    }
  };

  // Generate Script utilizing Gemini
  const handleGenerateScript = async (
    customVibe?: string,
    customTiming?: string,
    customFormat?: string,
    customLogo?: string,
    customMascot?: string
  ) => {
    setIsGenerating(true);
    setSelectedSceneIndex(0);
    
    const logs = [
      "Analyzing registered Brand Position & DNA...",
      "Extracting hooks from GTM Hook Tagline...",
      "Mapping psychographics & core mission profile...",
      "Composing cinematic monitor directives & camera cues...",
      "Synthesizing customized script scripts and timing limits using Gemini..."
    ];

    const finalVibe = customVibe || narrativeVibe;
    const finalTiming = customTiming || timingLimit;
    const finalFormat = customFormat || productionFormat;
    const finalLogo = customLogo || logoShowcase;
    const finalMascot = customMascot || mascotShowcase;

    runLogSimulation(logs, async () => {
      try {
        const token = await user?.getIdToken();

        // Craft a precise strategic prompt grounded in active brand position
        const brandName = activeProduct?.name || "Unknown Brand";
        const brandDescription = activeProduct?.description || "";
        const brandAudience = activeProduct?.audience || "";
        const brandTone = activeProduct?.tone || "Bold, Intellectual, Professional";
        const brandPositioning = activeProduct?.positioning || "";

        // Collect all advanced brand positioning DNA values
        const brandEnemy = activeProduct?.enemy || "";
        const brandEarnedSecret = activeProduct?.earnedSecret || "";
        const brandOriginStory = activeProduct?.originStory || "";
        const brandHellState = activeProduct?.hellState || "";
        const brandHeavenState = activeProduct?.heavenState || "";
        const brandObjections = activeProduct?.objections || "";
        const brandUniqueMechanism = activeProduct?.uniqueMechanism || "";
        const brandProofPoints = activeProduct?.proofPoints || "";
        const brandVocabularyAlways = activeProduct?.vocabularyAlways || "";
        const brandVocabularyNever = activeProduct?.vocabularyNever || "";
        const brandContentPillars = activeProduct?.contentPillars ? activeProduct.contentPillars.join(", ") : "";
        const brandThemes = activeProduct?.recommendedThemes ? activeProduct.recommendedThemes.join(", ") : "";

        const systemPrompt = `You are an elite Hollywood Creative Director and a performance social copywriter.
Generate a high-converting, deeply emotional cinematic screenplay script for ${brandName}.
The output must STRICTLY follow JSON format and have the exact properties specified. Return ONLY the JSON object, do not wrap in markdown blocks, do not include any other text outside the JSON.`;

        const userPrompt = `Brand Positioning:
- Name: ${brandName}
- Description: ${brandDescription}
- Audience: ${brandAudience}
- Tone: ${brandTone}
- Core Brand Positioning: ${brandPositioning}

Advanced Strategic Brand DNA:
${brandEnemy ? `- Brand Nemesis / Enemy Status Quo: ${brandEnemy}` : ""}
${brandHellState ? `- Target Audience "Hell State" (Pre-solution pains): ${brandHellState}` : ""}
${brandHeavenState ? `- Target Audience "Heaven State" (Desired outcome): ${brandHeavenState}` : ""}
${brandEarnedSecret ? `- Earned Secret (Our unique discovery): ${brandEarnedSecret}` : ""}
${brandUniqueMechanism ? `- Unique Mechanism (How our technology/product solves it): ${brandUniqueMechanism}` : ""}
${brandProofPoints ? `- Specific Proof Points / Trust Factors: ${brandProofPoints}` : ""}
${brandOriginStory ? `- Brand Origin / Human Backstory: ${brandOriginStory}` : ""}
${brandContentPillars ? `- Core Content Pillars to weave in: ${brandContentPillars}` : ""}
${brandThemes ? `- Recommended Narrative Themes: ${brandThemes}` : ""}
${brandVocabularyAlways ? `- Words/phrases to ALWAYS include/prefer: ${brandVocabularyAlways}` : ""}
${brandVocabularyNever ? `- Words/phrases to NEVER use or avoid completely: ${brandVocabularyNever}` : ""}
${brandObjections ? `- Handling common buyer objections: ${brandObjections}` : ""}

Script Configuration:
- Narrative Vibe / Copy Angle: ${finalVibe}
- Target Playback Timing Limit: ${finalTiming}
- Production Format: ${finalFormat}
- Logo Showcase Location: ${finalLogo}
- Mascot Integration Type: ${finalMascot}

Based on this complete strategic Brand DNA positioning, generate an extremely punchy, memorable, high-converting 2-Scene screenplay script that addresses all the core pain points, unique mechanisms, and tone guidelines. Adhere strictly to the requested Vocabulary rules (always include/never use).
Your response MUST be wrapped in a strictly valid JSON object conforming to this structure:
{
  "title": "A short, catchy, action-oriented screenplay title",
  "gtmHook": "A powerful 1-sentence hook tailored to this brand",
  "coreMission": "Summarized 1-sentence brand mission mechanics",
  "logoIdentityDna": "Description of how the logo matches this production config",
  "mascotIdentityDna": "Description of Mascot character alignment or placeholder mascot if none uploaded",
  "primaryAudience": "Target client psychographics tied to this narrative",
  "crownJewelProposition": "The crown jewel core proposition being pitched in this script",
  "centralAgitatedPain": "The core agitated pain point targeted by the script",
  "calibratedToneAdjectives": ["Bold", "Intellectual", "Uncompromising"],
  "suggestedColors": [{"label": "Name", "value": "#hex_code"}],
  "scenes": [
    {
      "title": "Scene #1",
      "timing": "0:00 - 0:05",
      "activeCameraCue": "Detailed scene monitor camera directions",
      "dialog": "[Action details in brackets] Spoken dialog to say in this timing interval",
      "videoPrompt": "A highly premium AI video generator prompt (e.g. for Sora, Runway, or Luma) to construct this visual scene",
      "soundEffects": "Description of sound track transitions, beats, and cues",
      "directingTip": "Professional tips for actors to lock eye contact or facial cue"
    }
  ],
  "visualStyleGuide": "Detailed color palette visual description matching colors",
  "musicVibeGuide": "Audio and music guide details",
  "requiredAssets": [
    {
      "name": "Exact name of the specific asset (e.g. 'Desktop SaaS Analytics Dashboard Screen', 'Transparent Mascot PNG Overlay', 'Corporate Logo PNG')",
      "type": "Media file type (e.g. 'Transparent PNG', 'Figma Screen Capture', 'Foley Sound FX')",
      "purpose": "How and where this is leveraged in the scenes as a necessary attachment input",
      "description": "Visual instructions, content/data to display, colors, and layout specs to prepare for this asset"
    }
  ]
}`;

        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          throw new Error("Failed to communicate with AI endpoint");
        }

        const data = await response.json();
        
        // Robust clean-up of potential markdown output
        let cleanText = data.text || "";
        cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const parsed: ScriptData = JSON.parse(cleanText);
        setScriptData(parsed);

        // Auto-save generated screenplay
        if (activeProduct) {
          await updateProduct(activeProduct.id, {
            narrativeVibe,
            timingLimit,
            productionFormat,
            logoShowcase,
            mascotShowcase,
            activeScript: parsed
          });
        }
      } catch (err) {
        console.error("Failed to generate custom script:", err);
        // Fallback to beautiful customized schema using brand data on JSON parse errors
        const fallback: ScriptData = {
          title: `${activeProduct?.name || "Tror"}: Custom Playbook Campaign`,
          gtmHook: activeProduct?.positioning ? `"${activeProduct.positioning}"` : "Precision-crafted results over noisy generic updates.",
          coreMission: activeProduct?.description || "An advanced social media content strategy to drive genuine engagement and establish unique positioning.",
          logoIdentityDna: `Intro Outro Slate features ${activeProduct?.name || "the brand"} icon inside a high-definition centered layout.`,
          mascotIdentityDna: `Mascot elements utilize custom visual overlay styles aligned with the ${activeProduct?.tone || "Bold"} theme.`,
          primaryAudience: activeProduct?.audience || "Growth marketers, builders, and high-growth agency founders.",
          crownJewelProposition: "Brings target audiences customized value props designed to minimize cost and maximize organic CTR.",
          centralAgitatedPain: "Inundated social channels containing empty generic blogs that lack authentic branding signal.",
          calibratedToneAdjectives: activeProduct?.tone ? activeProduct.tone.split(",").map(t => t.trim()) : ["Bold", "Intellectual"],
          suggestedColors: [
            { label: "Dark Obsidian", value: "#0A0A0F" },
            { label: "Brand Accent", value: "#7C3AED" },
            { label: "Deep Charcoal", value: "#1C1C22" }
          ],
          scenes: [
            {
              title: "Scene #1",
              timing: "0:00 - 0:05",
              activeCameraCue: `A sophisticated, atmospheric studio backlit with ${activeProduct?.name || "Brand"} custom color schemes.`,
              dialog: `[Authoritative focus to the lens] Stop letting generic noise waste your ad spend. Optimize for true positioning.`,
              videoPrompt: `Close-up portrait with cinematic 35mm shallow depth of field, warm face fill, dark background styled under an ambient aesthetic.`,
              soundEffects: "Phonk bass line building up instantly with smooth visual transitions.",
              directingTip: "Look directly into the lens, speak with serious conviction and no smiles."
            },
            {
              title: "Scene #2",
              timing: "0:05 - 0:10",
              activeCameraCue: "Camera scales out highlighting actual interface metrics with vibrant progress visuals.",
              dialog: "That is how smart brand positioning converts. Start building today.",
              videoPrompt: "Dolly-out workspace, high-end design charts displaying performance uptrends, smooth glassmorphism assets.",
              soundEffects: "Swoosh sound-effect. Ambient mechanical keyboard tick.",
              directingTip: "Keep standard eye level, gesture dynamically with hands."
            }
          ],
          visualStyleGuide: `Visual aesthetic designed for standard premium setups, referencing tones like ${activeProduct?.tone}.`,
          musicVibeGuide: "Calm, tech-focused ambient synthesizer soundtrack (110 BPM) aligning with brand pacing."
        };
        setScriptData(fallback);

        if (activeProduct) {
          await updateProduct(activeProduct.id, {
            narrativeVibe,
            timingLimit,
            productionFormat,
            logoShowcase,
            mascotShowcase,
            activeScript: fallback
          });
        }
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleApplyTweak = async () => {
    if (!scriptTweakInput.trim()) return;
    setIsGenerating(true);
    
    const logs = [
      "Analyzing script tweak suggestions...",
      "Re-calibrating scene timings & dialogues...",
      "Re-synthesizing screenplay blocks..."
    ];

    runLogSimulation(logs, async () => {
      try {
        const token = await user?.getIdToken();
        const systemPrompt = `You are an elite Hollywood Creative Director.
Polish the existing video script screenplay based on the user's specific tweak input.
Maintain the exact Brand DNA values and return ONLY a valid, modified JSON conforming precisely to the structure of the existing script data (including updating the "requiredAssets" list of video attachments if the user's tweak modifies the visual content requirements). No other comments.`;

        const userPrompt = `Existing Script:
${JSON.stringify(scriptData)}

Requested Script Tweak:
"${scriptTweakInput}"

Modify and output the complete revised JSON conforming strictly to the original keys.`;

        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let cleanText = data.text || "";
          cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanText);
          setScriptData(parsed);
          setScriptTweakInput("");

          // Auto-save revisions
          if (activeProduct) {
            await updateProduct(activeProduct.id, { activeScript: parsed });
          }
        }
      } catch (err) {
        console.error("Tweak application error:", err);
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleDownloadFullScript = () => {
    let textOut = `SCREENPLAY BRIEF PLAYBOOK\n`;
    textOut += `====================================\n`;
    textOut += `TITLE: ${scriptData.title}\n`;
    textOut += `GTM HOOK TAGLINE: ${scriptData.gtmHook}\n\n`;
    textOut += `CORE MISSION: ${scriptData.coreMission}\n\n`;
    
    scriptData.scenes.forEach((sc, i) => {
      textOut += `------------------------------------\n`;
      textOut += `${sc.title} (${sc.timing})\n`;
      textOut += `------------------------------------\n`;
      textOut += `[CAMERA DIRECTION] ${sc.activeCameraCue}\n\n`;
      textOut += `[DIALOGUE] ${sc.dialog}\n\n`;
      textOut += `[AI VIDEO PROMPT] ${sc.videoPrompt}\n\n`;
      textOut += `[SOUND & MUSIC] ${sc.soundEffects}\n\n`;
      textOut += `[DIRECTING HINTS] ${sc.directingTip}\n\n`;
    });
    
    textOut += `====================================\n`;
    textOut += `VISUAL STYLE AND ART GUIDE:\n${scriptData.visualStyleGuide}\n\n`;
    textOut += `MUSIC AND AUDIO DESIGN:\n${scriptData.musicVibeGuide}\n`;

    if (scriptData.requiredAssets && scriptData.requiredAssets.length > 0) {
      textOut += `\n====================================\n`;
      textOut += `REQUIRED VIDEO PRODUCTION ASSETS & ATTACHMENTS CHECKLIST:\n`;
      scriptData.requiredAssets.forEach((asset, idx) => {
        textOut += `${idx + 1}. [${asset.type}] ${asset.name}\n`;
        textOut += `   Purpose: ${asset.purpose}\n`;
        textOut += `   Description: ${asset.description}\n\n`;
      });
    }

    const blob = new Blob([textOut], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${scriptData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_screenplay.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadScene = (scIdx: number) => {
    const sc = scriptData.scenes[scIdx];
    if (!sc) return;
    let textOut = `${sc.title} (${sc.timing})\n`;
    textOut += `------------------------------------\n`;
    textOut += `[CAMERA DIRECTION] ${sc.activeCameraCue}\n\n`;
    textOut += `[DIALOGUE] ${sc.dialog}\n\n`;
    textOut += `[AI VIDEO PROMPT] ${sc.videoPrompt}\n\n`;
    textOut += `[SOUND EFFECTS] ${sc.soundEffects}\n\n`;
    textOut += `[DIRECTING TIP] ${sc.directingTip}\n`;

    const blob = new Blob([textOut], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scene_${scIdx + 1}_script.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeScene = scriptData ? (scriptData.scenes[selectedSceneIndex] || scriptData.scenes[0]) : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#07070B] text-gray-100 p-4 md:p-8" id="scripts-studio-container">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#7C3AED]/20 pb-6 w-full max-w-full px-2 lg:px-4 xl:px-6 mx-auto">
        <div className="tour-scripts-header">
          <div className="flex items-center gap-2 text-[#7C3AED] text-xs font-bold uppercase tracking-wider mb-2">
            <Clapperboard className="w-4 h-4" />
            <span>Cinematic Production Hub</span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-3">
            Creative Script Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Turn your registered active brand position DNA into professional, customized screenplays and video production scripts.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#1C1C22]/50 border border-[#7C3AED]/20 py-2 px-4 rounded-xl shadow-lg">
          <div className="w-3 h-3 bg-[#18F07A] rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Connected Brand</span>
            <span className="text-sm font-semibold text-white truncate max-w-[150px]">{activeProduct?.name || "Default Brand"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-full px-2 lg:px-4 xl:px-6 mx-auto">
        {/* Left Control Panel Column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-[#101015]/80 border border-[#7C3AED]/15 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#7C3AED]/10">
              <Sliders className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-lg font-bold text-white">Production Settings</h2>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  Narrative Vibe / Copy Angle
                </label>
                <select 
                  value={narrativeVibe}
                  onChange={(e) => handleConfigChange('narrativeVibe', e.target.value)}
                  className="w-full bg-[#1C1C22] border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
                >
                  <option>Problem-Agitating Explainer (Pain & Savior)</option>
                  <option>Contrarian Mindset Shift</option>
                  <option>Behind-the-Scenes Build & Launch</option>
                  <option>Educational How-To Drilldown</option>
                  <option>UGC-Style Raw Confessional</option>
                  <option>The Deep-Tech ASMR Breakdown</option>
                  <option>David vs. Goliath Disruption</option>
                  <option>Day-in-the-Life Stress Relief</option>
                  <option>Mythbuster (Debunking Industry Lies)</option>
                  <option>Viral Fast-Cut Hype-Hook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  Target Playback limits
                </label>
                <select 
                  value={timingLimit}
                  onChange={(e) => handleConfigChange('timingLimit', e.target.value)}
                  className="w-full bg-[#1C1C22] border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
                >
                  <option>10 Seconds (Ultra Snappy Hook / Micro-Short)</option>
                  <option>30 Seconds (Standard Social Explainer)</option>
                  <option>60 Seconds (Deep Dive Storytelling)</option>
                </select>
              </div>
            </div>

            {/* Production Format Mode Selection */}
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Production Format</span>
                <span className="text-[10px] lowercase text-purple-400 font-medium">Digital capture or physical shoot?</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => handleConfigChange("productionFormat", "SaaS UI & Animated VFX")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${productionFormat === "SaaS UI & Animated VFX" ? "border-[#7C3AED] bg-[#7C3AED]/10 text-white shadow-xl shadow-purple-900/10" : "border-[#7C3AED]/10 bg-[#1C1C22]/30 text-gray-400 hover:bg-[#1C1C22]/65"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productionFormat === "SaaS UI & Animated VFX" ? "border-[#7C3AED]" : "border-gray-500"}`}>
                       {productionFormat === "SaaS UI & Animated VFX" && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                    </div>
                    <span className="text-xs font-bold block">SaaS UI & Animated VFX</span>
                  </div>
                  <span className="text-[10px] leading-relaxed block mt-0.5 max-h-24 overflow-y-auto">High-end dark layout screen capture, mouse cursor glide zooms, browser features walkthrough, and clean typography.</span>
                </button>

                <button 
                  onClick={() => handleConfigChange("productionFormat", "Real-Life Creator / Studio Shoot")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${productionFormat === "Real-Life Creator / Studio Shoot" ? "border-[#7C3AED] bg-[#7C3AED]/10 text-white shadow-xl shadow-purple-900/10" : "border-[#7C3AED]/10 bg-[#1C1C22]/30 text-gray-400 hover:bg-[#1C1C22]/65"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${productionFormat === "Real-Life Creator / Studio Shoot" ? "border-[#7C3AED]" : "border-gray-500"}`}>
                       {productionFormat === "Real-Life Creator / Studio Shoot" && <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                    </div>
                    <span className="text-xs font-bold block">Real-Life Creator & S. Shoot</span>
                  </div>
                  <span className="text-[10px] leading-relaxed block mt-0.5 max-h-24 overflow-y-auto">Cinematic directions for actors/founders, Cozy studio lights, gestures, hand-held phone shots, eye contact, and dialogue hooks.</span>
                </button>
              </div>
            </div>

            {/* Logo Showcase options */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Where / How should the Logo be showcased?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { name: "Corner Watermark", desc: "Semi-transparent overlaid in upper corners." },
                  { name: "Physical Apparel", desc: "Actor wears branding hoodie/t-shirt." },
                  { name: "3D Floating Overlay", desc: "Logo hovers near presenter's head." },
                  { name: "Intro/Outro Slate", desc: "Central high-fidelity zooming slate." },
                  { name: "Device Backing", desc: "Distinct sticker clearly shown on laptop." }
                ].map((logoOpt) => (
                  <button
                    key={logoOpt.name}
                    onClick={() => handleConfigChange("logoShowcase", logoOpt.name)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${logoShowcase === logoOpt.name ? "border-red-500 bg-red-950/20 text-white shadow-md shadow-red-900/10" : "border-[#7C3AED]/10 bg-[#1C1C22]/30 text-gray-400 hover:bg-[#1C1C22]/65"}`}
                  >
                    <span className="text-xs font-bold mb-0.5">{logoOpt.name}</span>
                    <span className="text-[9px] text-gray-500 leading-tight block">{logoOpt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Mascot Option */}
            <div className="space-y-3 pt-3 border-t border-[#7C3AED]/10">
              <div className="flex items-center justify-between">
                <span className="inner-label text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Smile className="w-4 h-4 text-purple-400" />
                  Upload Mascot Illustration (analyzed visually)
                </span>
                {mascotPreview && (
                  <button 
                    onClick={handleRemoveMascot}
                    className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Mascot
                  </button>
                )}
              </div>

              {!mascotPreview ? (
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border border-dashed border-[#7C3AED]/35 hover:border-[#7C3AED]/60 rounded-xl p-5 flex flex-col items-center justify-center bg-[#0C0C12]/50 cursor-pointer transition-all relative group"
                >
                  <input 
                    type="file" 
                    onChange={handleMascotChange}
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-7 h-7 text-[#7C3AED]/70 mb-2 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-semibold text-gray-300">Drag & Drop Mascot illustration here</span>
                  <span className="text-[10px] text-gray-500 mt-1">or Click to browse PNG/JPG assets</span>
                </div>
              ) : (
                <div className="bg-[#1C1C22]/60 rounded-xl p-4 border border-emerald-500/30 flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-1.5 bg-emerald-500 animate-pulse w-full" />
                  <div className="w-12 h-12 bg-gray-900 rounded-lg overflow-hidden border border-[#7C3AED]/20 shrink-0">
                    <img src={mascotPreview} alt="Mascot Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block truncate max-w-[200px]" title={mascotFile?.name || "Stored Mascot Asset"}>
                      {mascotFile?.name || "Stored Mascot Asset"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#18F07A] uppercase bg-[#18F07A]/10 px-2 py-0.5 rounded-full mt-1">
                      Ready for Mascot Analysis
                    </span>
                  </div>
                </div>
              )}

              {/* Showcase mascot rule */}
              <div className="space-y-2">
                <span className="inner-label text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Where / How should the brand Mascot be showcased? (with rich Actor-Sidekick options)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {[
                    { name: "Animated Sticker Overlay", desc: "Mascot floats quietly in corner screen overlays." },
                    { name: "Actor Figurine Desk Buddy", desc: "Actor interacts or gestures towards physical desktop model ornament." },
                    { name: "Over-the-Shoulder 3D Holo", desc: "Sleek animated 3D holographic projection floating next to actor's head." },
                    { name: "AI-Voice Sidekick Dialogue", desc: "Actor has dynamic verbal script conversation with a synthesized off-screen mascot." },
                    { name: "Comedic Green-Screen Buddy", desc: "Full-size keyed mascot acting alongside the presenter, buddy-cop style." },
                    { name: "Handheld Smartphone AR", desc: "Actor glances at phone lens with mascot fully rendered next to them in AR." },
                    { name: "Emotional Empath Overlay", desc: "Pop-up comic graphic frames showing mascot reacting visually to actor cues." },
                    { name: "Intro Splash Star", desc: "Mascot leaps out dramatically into center to trigger title cards." },
                    { name: "Dashboard App Guide", desc: "Mascot acts as smart holographic hover guide within SaaS walk-throughs." }
                  ].map((mscOpt) => (
                    <button
                      key={mscOpt.name}
                      onClick={() => handleConfigChange("mascotShowcase", mscOpt.name)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all h-full ${mascotShowcase === mscOpt.name ? "border-red-500 bg-red-950/20 text-white shadow-md shadow-red-900/15" : "border-[#7C3AED]/10 bg-[#1C1C22]/30 text-gray-400 hover:bg-[#1C1C22]/65"}`}
                    >
                      <span className="text-xs font-bold mb-0.5">{mscOpt.name}</span>
                      <span className="text-[9px] text-gray-500 leading-tight block">{mscOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-4 space-y-3">
              <button 
                onClick={() => handleGenerateScript()}
                disabled={isGenerating}
                className="tour-generate-script-btn w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xl shadow-purple-900/20 hover:shadow-purple-900/40 inline-flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-60 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] active:scale-95 text-sm"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isGenerating ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-purple-200" />
                    </motion.div>
                    <span>Generating Playbook...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-200 animate-pulse" />
                    <span>Generate Screenplay & Video Script</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualSave}
                disabled={isGenerating}
                className="w-full bg-[#1C1C22]/80 hover:bg-[#1C1C22] border border-[#7C3AED]/25 text-gray-300 hover:text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-xs"
              >
                <Settings className={`w-4 h-4 ${saveStatus === "saving" ? "animate-spin text-purple-400" : "text-gray-400"}`} />
                {saveStatus === "saving" && "Saving Changes to Brand..."}
                {saveStatus === "saved" && "✓ Preserved in Brand Profile!"}
                {saveStatus === "error" && "✗ Save Failed."}
                {saveStatus === "idle" && "Save Current State To Firestore"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#101015]/80 border border-[#2583EB]/25 rounded-2xl p-10 flex flex-col items-center justify-center flex-grow text-center min-h-[500px] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#2583EB]/5 to-transparent pointer-events-none" />
                
                {/* Visual loading ring */}
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-t-[#2583EB] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  <div className="absolute inset-2 border-4 border-b-[#7C3AED] border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin [animation-duration:1.5s]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-8 h-8 text-[#2583EB]" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 font-display">Crafting Cinematic Script</h3>
                <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
                  Our advanced Gemini pipeline is mapping your registered product psychographics, GTM goals, and selected options into scenic cue codes...
                </p>

                {/* Simulated build logger */}
                <div className="w-full max-w-md bg-[#07070B] border border-gray-800 rounded-xl p-4 text-left font-mono text-xs text-gray-400 space-y-1.5 h-44 overflow-y-auto">
                  {generationLogs.map((log, lIdx) => (
                    <div key={lIdx} className="flex gap-2 items-start text-emerald-400">
                      <span className="text-[#2583EB] font-bold">●</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <div className="inline-block animate-pulse w-2 h-4 bg-emerald-400 mt-1" />
                </div>
              </motion.div>
            ) : !scriptData ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#101015]/80 border border-[#7C3AED]/15 rounded-2xl p-6 md:p-8 flex flex-col justify-between flex-grow min-h-[500px] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Upper Hero Panel */}
                <div className="flex flex-col items-center justify-center text-center pt-8 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-[#1C1C22]/80 rounded-2xl border border-[#7C3AED]/30 flex items-center justify-center shadow-xl shadow-purple-950/10 mb-6 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#7C3AED]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Clapperboard className="w-8 h-8 text-[#7C3AED] relative z-10 animate-pulse" />
                  </div>
                  
                  <h3 className="text-2xl font-extrabold text-white tracking-tight font-display mb-3">
                    Sculpt Your Brand Playbook Screenplay
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Custom-calibrated scripts, voiceover narration prompts, sound cues, and scene transitions designed exclusively for your connected brand DNA.
                  </p>
                </div>

                {/* Bento Grid layout of loaded Profile Data */}
                <div className="my-8 bg-[#1C1C22]/20 border border-[#7C3AED]/10 rounded-xl p-5 space-y-4">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">
                    Ready Brand Profile Inputs
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-[#0C0C12]/80 border border-gray-800/60 p-3 rounded-lg">
                      <span className="text-[9px] text-[#2583EB] font-bold uppercase block mb-1">Company / Product</span>
                      <span className="text-xs text-white font-semibold truncate block">
                        {activeProduct?.name || "No active name"}
                      </span>
                    </div>

                    <div className="bg-[#0C0C12]/80 border border-gray-800/60 p-3 rounded-lg">
                      <span className="text-[9px] text-purple-400 font-bold uppercase block mb-1">Website URL</span>
                      <span className="text-xs text-white font-semibold truncate block">
                        {activeProduct?.website || "Unspecified"}
                      </span>
                    </div>

                    <div className="bg-[#0C0C12]/80 border border-gray-800/60 p-3 rounded-lg sm:col-span-2">
                      <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Target Audience Context</span>
                      <p className="text-xs text-gray-300 leading-relaxed truncate">
                        {activeProduct?.description || "Ready to evaluate brand description context..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Onboarding steps list */}
                <div className="pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left border-t border-[#7C3AED]/10 pt-6">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full flex items-center justify-center text-[10px] font-extrabold">1</span>
                      Choose Set-up
                    </span>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Adjust your narrative mode vibe, timing limits, and desired layout shoot style from the left pane.
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full flex items-center justify-center text-[10px] font-extrabold">2</span>
                      Add Mascot
                    </span>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Drop an optional mascot illustration vector to get visual sticker placement styling cues.
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                      <span className="w-5 h-5 bg-[#18F07A]/20 text-[#18F07A] rounded-full flex items-center justify-center text-[10px] font-extrabold">3</span>
                      Launch Gemini
                    </span>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Click "Generate Screenplay & Video Script" to synthesize high-quality cinematic scripts instantly!
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow"
              >
                {/* Brand DNA Specs Column */}
                <div className="md:col-span-5 bg-[#101015]/80 border border-[#7C3AED]/15 rounded-2xl p-5 shadow-lg space-y-5 flex flex-col">
                  <div>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Active Brief Playbook
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2 mb-1 tracking-tight">
                      {scriptData.title}
                    </h3>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>ANALYSED LINK:</span>
                      <span className="text-purple-400 font-semibold underline truncate max-w-[150px]">
                        {activeProduct?.website || "brandtopost.com"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-[#7C3AED]/10 pt-4 flex-grow">
                    {/* Brand DNA Params */}
                    <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/10 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Brand DNA Parameters</span>
                      </div>
                      
                      <div>
                        <span className="text-[9px] text-[#2583EB] font-bold uppercase tracking-wide block mb-1">
                          GTM Hook Tagline
                        </span>
                        <blockquote className="text-sm font-semibold italic text-white pl-2 border-l-2 border-[#2583EB] leading-snug">
                          {scriptData.gtmHook}
                        </blockquote>
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                          Core Mission & Mechanics
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                          {scriptData.coreMission}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block mb-1">
                          Logo Visual Identity DNA
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                          {scriptData.logoIdentityDna}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block mb-1">
                          Mascot Visual Identity DNA
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                          {scriptData.mascotIdentityDna}
                        </p>
                      </div>
                    </div>

                    {/* Targets block */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">
                          Primary Audience Targets
                        </span>
                        <div className="bg-gradient-to-r from-[#1C1C22]/50 to-[#101015] border border-gray-800 p-3 rounded-xl flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#2583EB] rounded-full shrink-0" />
                          <span className="text-xs text-gray-200 font-medium leading-normal">{scriptData.primaryAudience}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/10 p-3 rounded-xl space-y-1">
                          <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">
                            Crown Jewel Prop
                          </span>
                          <span className="text-[11px] text-gray-300 block leading-snug max-h-32 overflow-y-auto">
                            {scriptData.crownJewelProposition}
                          </span>
                        </div>
                        <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/10 p-3 rounded-xl space-y-1">
                          <span className="text-[9px] text-yellow-500/95 font-bold uppercase tracking-wider block">
                            Central Agitated Pain
                          </span>
                          <span className="text-[11px] text-gray-300 block leading-snug max-h-32 overflow-y-auto">
                            {scriptData.centralAgitatedPain}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Art Styles bottom parameters */}
                  <div className="border-t border-[#7C3AED]/10 pt-4 space-y-3 mt-auto">
                    <div>
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        Calibrated Tone Adjectives
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {scriptData.calibratedToneAdjectives.map((toneAdj, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="text-[10px] bg-[#1C1C22] border border-[#7C3AED]/20 text-gray-200 font-extrabold px-2 py-0.5 rounded-full"
                          >
                            ● {toneAdj}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                        Suggested Color Profile
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs max-w-[150px] truncate text-gray-300 font-mono">
                          {scriptData.suggestedColors?.[0]?.label || "Obsidian Black"}
                        </span>
                        <div className="flex gap-1.5 ml-auto">
                          {scriptData.suggestedColors.map((colorObj, cIdx) => (
                            <div 
                              key={cIdx}
                              className="w-4 h-4 rounded-full border border-white/20 shadow-md cursor-help"
                              style={{ backgroundColor: colorObj.value }}
                              title={`${colorObj.label}: ${colorObj.value}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Screenplay Timeline + Camera Playbook Track */}
                <div className="md:col-span-7 flex flex-col space-y-4">
                  {/* Tabs Selector Header with Action Buttons */}
                  <div className="flex items-center justify-between border-b border-[#7C3AED]/20 pb-2">
                    <div className="flex gap-1 bg-[#101015]/90 p-1 rounded-xl border border-[#7C3AED]/10">
                      <button
                        onClick={() => setActiveTab("chrono")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "chrono" ? "bg-[#7C3AED] text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        <Clapperboard className="w-3.5 h-3.5" /> Chrono Board
                      </button>
                      <button
                        onClick={() => setActiveTab("style")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "style" ? "bg-[#7C3AED] text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Style & Music Guide
                      </button>
                      <button
                        onClick={() => setActiveTab("assets")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${activeTab === "assets" ? "bg-[#7C3AED] text-white" : "text-gray-400 hover:text-white"}`}
                        title="Requirements Checklist for LLM Inputs"
                      >
                        <Upload className="w-3.5 h-3.5" /> Required Video Assets
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => notifyCopy("full-script", JSON.stringify(scriptData, null, 2))}
                        className="bg-[#1C1C22]/80 hover:bg-[#1C1C22]/100 border border-gray-800 text-gray-300 py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 hover:text-white"
                        title="Copy Entire JSON Screenplay"
                      >
                        {copiedState === "full-script" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Full Screenplay
                      </button>
                      <button
                        onClick={handleDownloadFullScript}
                        className="bg-[#2583EB] hover:bg-[#2583EB]/90 text-white py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow"
                        title="Download Whole Script (.txt)"
                      >
                        <Download className="w-3.5 h-3.5" /> Download .TXT Brief
                      </button>
                    </div>
                  </div>

                  {/* Active Tab Body Content */}
                  <div className="bg-[#101015]/80 border border-[#7C3AED]/15 rounded-2xl p-5 shadow-lg flex-grow flex flex-col space-y-4">
                    {activeTab === "chrono" ? (
                      <>
                        {/* Monitor Deck Container */}
                        <div className="bg-black/90 border border-[#2583EB]/25 rounded-xl overflow-hidden aspect-[16/9] relative flex flex-col items-center justify-center">
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/10 border border-red-600/30 text-red-500 text-[10px] font-bold px-2.5 py-1.5 rounded uppercase tracking-widest animate-pulse">
                            <Video className="w-3.5 h-3.5 inline" /> REC
                          </div>
                          
                          <div className="absolute top-3 right-3 text-[10px] font-mono text-gray-400 bg-black/60 px-2 py-1 rounded">
                            Frame Timing: [{activeScene?.timing || "0:00 - 0:05"}]
                          </div>

                          {/* Cinematic Monitor visualizer waves */}
                          <div className="absolute bottom-5 right-5 flex items-end gap-1 shrink-0 h-10">
                            {[0.4, 0.7, 0.2, 0.9, 0.6, 0.3, 0.8, 0.5].map((h, hIdx) => (
                              <motion.div 
                                key={hIdx}
                                animate={{ height: [h*15, h*40, h*15] }}
                                transition={{ repeat: Infinity, duration: 1.2 + hIdx*0.1, ease: "easeInOut" }}
                                className="w-1.5 bg-[#2583EB]"
                              />
                            ))}
                          </div>

                          {/* Subtitles Overlay / Live Feed Representation */}
                          <div className="p-6 text-center max-w-md w-full relative z-10 flex flex-col justify-end h-full select-none">
                            <span className="text-[10px] font-bold tracking-widest text-[#2583EB] uppercase mb-1">
                              Live Cinematic Monitor (Visual Mock Feed)
                            </span>
                            <p className="text-sm font-semibold text-white drop-shadow-md leading-relaxed bg-black/60 p-3 rounded-lg border border-gray-800">
                              {activeScene?.dialog || 'Speaking cues will be generated here...'}
                            </p>
                          </div>
                        </div>

                        {/* Camera details */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2583EB]">
                                Active Camera Cue Direction
                              </span>
                              <button 
                                onClick={() => notifyCopy("cameraCue", activeScene?.activeCameraCue)}
                                className="text-[11px] text-gray-500 hover:text-[#2583EB] flex items-center gap-1"
                              >
                                {copiedState === "cameraCue" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Copy Cue
                              </button>
                            </div>
                            <blockquote className="text-xs text-gray-300 italic pl-3 border-l-2 border-[#2583EB] bg-[#0A0A0F] py-2 px-3 rounded-r-lg mt-1 relative">
                              "{activeScene?.activeCameraCue || 'Backlight studio desk workspace'}"
                            </blockquote>
                          </div>

                          {/* Scene Playbook Spoken Cues Card */}
                          <div className="bg-[#1C1C22]/20 border border-[#7C3AED]/10 rounded-xl p-4 space-y-3 relative">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-[#18F07A]/15 text-[#18F07A] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                  Action Playbook
                                </span>
                                <h4 className="text-sm font-extrabold text-white">
                                  {activeScene?.title || "Scene #1"} ({activeScene?.timing || "0:00 - 0:05"})
                                </h4>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => notifyCopy("dialogue", activeScene?.dialog)}
                                  className="text-[10px] bg-[#1C1C22] border border-gray-800 px-2 py-1 rounded text-gray-400 hover:text-white inline-flex items-center gap-1"
                                >
                                  {copiedState === "dialogue" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  Copy selected phrase
                                </button>
                                <button 
                                  onClick={() => handleDownloadScene(selectedSceneIndex)}
                                  className="text-[10px] bg-[#2583EB]/15 text-[#2583EB] px-2 py-1 rounded border border-[#2583EB]/20 hover:bg-[#2583EB]/35"
                                >
                                  Download Scene
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-400 pl-0.5 font-bold uppercase tracking-wider mb-1">
                              Spoken Actor Dialogue & Actions [Zero Voiceover]
                            </p>
                            <p className="text-sm font-semibold text-white leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-gray-800">
                              {activeScene?.dialog || "No spoken dialogue."}
                            </p>
                          </div>

                          {/* Sora visual prompt */}
                          <div className="bg-black/40 border border-[#7C3AED]/15 rounded-xl p-4 space-y-2 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 inline text-cyan-300" />
                                AI Video Generator Prompt (Sora / Runway / Luma)
                              </span>
                              <button 
                                onClick={() => notifyCopy("aiPrompt", activeScene?.videoPrompt)}
                                className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 px-2 py-1 rounded inline-flex items-center gap-1"
                              >
                                {copiedState === "aiPrompt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                Copy AI Prompt
                              </button>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-mono bg-[#07070B] p-2.5 rounded border border-gray-800/80">
                              {activeScene?.videoPrompt || "No model prompts generated."}
                            </p>
                          </div>

                          {/* SFX and tip row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/10 p-3.5 rounded-xl space-y-1.5">
                              <span className="text-[9px] text-[#2583EB] font-bold uppercase tracking-wider block">
                                Sound Effects Accent Cues
                              </span>
                              <p className="text-xs text-gray-300 leading-normal max-h-32 overflow-y-auto">
                                {activeScene?.soundEffects || "No sound effects cues."}
                              </p>
                            </div>
                            <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/10 p-3.5 rounded-xl space-y-1.5">
                              <span className="text-[9px] text-yellow-500/90 font-bold uppercase tracking-wider block">
                                Filming Directing Tip
                              </span>
                              <p className="text-xs text-gray-300 leading-normal max-h-32 overflow-y-auto font-medium">
                                {activeScene?.directingTip || "No directing tip cues."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sequence Tracker Scroll block */}
                        <div className="border-t border-[#7C3AED]/10 pt-4 space-y-2 mt-auto">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">
                            Timeline Sequencer Track (Scrub or Select Scene Frame Blocks)
                          </span>
                          <div className="flex gap-3 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden">
                            {scriptData.scenes.map((scItem, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSceneIndex(sIdx)}
                                className={`px-4 py-3 rounded-xl border text-left shrink-0 text-xs transition-all cursor-pointer ${selectedSceneIndex === sIdx ? "border-[#7C3AED] bg-[#7C3AED]/10 text-white shadow-md shadow-purple-950/20" : "border-[#7C3AED]/10 bg-[#1C1C22]/30 text-gray-400 hover:bg-[#1C1C22]/50"}`}
                              >
                                <span className="font-bold block text-white">SC {sIdx + 1}</span>
                                <span className="text-[10px] text-gray-500 leading-snug">{scItem.timing}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Inner Nodes Navigation */}
                          <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-gray-500">
                            <button 
                              onClick={() => setSelectedSceneIndex(prev => Math.max(0, prev - 1))}
                              disabled={selectedSceneIndex === 0}
                              className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 disabled:opacity-30 flex items-center gap-1 font-bold hover:text-white"
                            >
                              <ArrowLeft className="w-3 h-3" /> Prev Frame
                            </button>
                            <span>FRAME NODE {selectedSceneIndex + 1} OF {scriptData.scenes.length}</span>
                            <button 
                              onClick={() => setSelectedSceneIndex(prev => Math.min(scriptData.scenes.length - 1, prev + 1))}
                              disabled={selectedSceneIndex === scriptData.scenes.length - 1}
                              className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 disabled:opacity-30 flex items-center gap-1 font-bold hover:text-white"
                            >
                              Next Frame <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : activeTab === "style" ? (
                      <div className="space-y-5 flex-grow">
                        <div className="bg-[#1C1C22]/20 border border-[#7C3AED]/10 rounded-xl p-4.5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/10">
                            <Palette className="w-4.5 h-4.5 text-indigo-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Video Art Style & Direction</h4>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-mono">
                            {scriptData.visualStyleGuide}
                          </p>
                        </div>

                        <div className="bg-[#1C1C22]/20 border border-[#7C3AED]/10 rounded-xl p-4.5 space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-[#7C3AED]/10">
                            <Music className="w-4.5 h-4.5 text-[#2583EB]" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Music Track & Sound design</h4>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-mono">
                            {scriptData.musicVibeGuide}
                          </p>
                        </div>

                        <div className="bg-[#0C0C12] border border-dashed border-[#7C3AED]/20 hover:border-[#7C3AED]/35 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                          <Clapperboard className="w-7 h-7 text-[#7C3AED]/70 mb-2" />
                          <span className="text-xs font-bold text-white block">Active Outro Transition</span>
                          <span className="text-[10px] text-gray-500 mt-1 max-w-sm">
                            Logo fade flare containing direct CTAs linking to call schedules. Built automatically inside campaigns list views.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-grow flex flex-col text-left">
                        <div className="bg-[#1C1C22]/30 border border-[#7C3AED]/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                            <Sparkles className="w-4 h-4 text-indigo-300" />
                            <span className="text-xs font-bold uppercase tracking-wider">Required Media Attachments for Video Generation</span>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            To ensure high-fidelity brand representations inside text-to-video tools (like Sora, Luma, Runway, or edit suites), make sure you attach the following physical elements as files or screenshot guidelines:
                          </p>
                        </div>

                        {scriptData.requiredAssets && scriptData.requiredAssets.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[380px] md:max-h-[450px] pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                            {scriptData.requiredAssets.map((asset, index) => (
                              <div 
                                key={index} 
                                className="bg-[#0C0C12]/90 border border-[#7C3AED]/15 hover:border-[#7C3AED]/30 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden transition-colors group"
                              >
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#7C3AED] to-indigo-500" />
                                
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-extrabold px-2 py-0.5 rounded border border-indigo-400/10 uppercase tracking-widest scale-95 origin-left">
                                    {asset.type}
                                  </span>
                                  <h4 className="text-xs font-extrabold text-white tracking-tight">
                                    {asset.name}
                                  </h4>
                                </div>

                                <div className="space-y-1 mt-1 pl-1">
                                  <div className="text-[11px] text-gray-300 leading-relaxed">
                                    <span className="text-[9px] text-[#2583EB] font-bold uppercase block tracking-wider mb-0.5">Where/How it is Used:</span>
                                    {asset.purpose}
                                  </div>
                                  <div className="text-[11px] text-gray-400 bg-black/45 p-2 rounded border border-gray-800/50 mt-1.5">
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase block tracking-wider mb-0.5">Asset Preparation Specs:</span>
                                    {asset.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[#1C1C22]/10 border border-dashed border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center my-auto">
                            <Upload className="w-8 h-8 text-gray-600 mb-2 animate-bounce" />
                            <span className="text-xs text-gray-400 font-bold">No assets parsed yet</span>
                            <span className="text-[10px] text-gray-500 mt-1 max-w-xs leading-normal">
                              Run the screenplay generation above to auto-compile a professional list of visual, UI, and logo elements checklist!
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Iterative Tweak Editor */}
                  <div className="bg-[#101015]/80 border border-[#7C3AED]/15 rounded-2xl p-4 md:p-5 shadow-lg space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span>Iterative Strategy Editor</span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white block leading-snug">
                        Need a sharper hook? Or specific visual frame highlights?
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed block mt-0.5">
                        Provide any specific script notes or dialog tweaks. Our generation pipeline will rewrite timing and narrative, leaving central Brand DNA intact.
                      </p>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={scriptTweakInput}
                          onChange={(e) => setScriptTweakInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyTweak()}
                          placeholder="e.g. 'Make Scene 1 start with a shocking contrarian rule overlay' or 'Integrate a direct click demo walkthrough'"
                          className="flex-grow bg-[#1C1C22] border border-[#7C3AED]/30 hover:border-[#7C3AED]/50 rounded-xl px-4.5 py-3 text-xs text-white focus:outline-none focus:border-[#7C3AED] transition-all"
                        />
                        <button
                          onClick={handleApplyTweak}
                          className="bg-[#7C3AED] hover:bg-[#7C3AED]/90 text-white font-bold px-4 py-3 rounded-xl text-xs transition-colors shadow shadow-purple-950/20 shrink-0 uppercase active:scale-95"
                        >
                          Apply Script Tweak
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
