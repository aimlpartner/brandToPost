import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Music, 
  ArrowLeft, 
  ArrowRight, 
  Video, 
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

  // Extra instructions from testing pilot request
  const [scriptInstructions, setScriptInstructions] = useState("");

  // Active generation & playbook state
  const [activeTab, setActiveTab] = useState<"chrono" | "style" | "assets">("chrono");
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptTweakInput, setScriptTweakInput] = useState("");
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  
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
      const currentInstructions = activeProduct.scriptInstructions || "";

      setNarrativeVibe(currentVibe);
      setTimingLimit(currentTiming);
      setProductionFormat(currentFormat);
      setLogoShowcase(currentLogo);
      setMascotShowcase(currentMascot);
      setScriptInstructions(currentInstructions);
      
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
      else if (key === 'scriptInstructions') setScriptInstructions(value);

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
        activeScript: scriptData,
        scriptInstructions
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
      "Analyzing brand position & psychographics with Sarah...",
      "Arthur is aligning Founder voice clone parameters...",
      "Zack is composing cinematic screenplays & camera cues...",
      "Chloe is calibrating visual styles and scene directives...",
      "Julian is compiling required video assets specifications...",
      "Synthesizing script and timing limits using Gemini..."
    ];

    const finalVibe = customVibe || narrativeVibe;
    const finalTiming = customTiming || timingLimit;
    const finalFormat = customFormat || productionFormat;
    const finalLogo = customLogo || logoShowcase;
    const finalMascot = customMascot || mascotShowcase;

    runLogSimulation(logs, async () => {
      try {
        const token = await user?.getIdToken();

        const brandName = activeProduct?.name || "Unknown Brand";
        const brandDescription = activeProduct?.description || "";
        const brandAudience = activeProduct?.audience || "";
        const brandTone = activeProduct?.tone || "Bold, Intellectual, Professional";
        const brandPositioning = activeProduct?.positioning || "";

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
${brandEnemy ? `- Brand Nemesis / Enemy Status Status Quo: ${brandEnemy}` : ""}
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
${scriptInstructions ? `- Custom Directives & Guidelines: ${scriptInstructions}` : ""}

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
        // Fallback
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
      "Zack is reviewing script tweak suggestions...",
      "Chloe is re-calibrating scene timings & visual direction...",
      "Re-synthesizing screenplay blocks with Gemini..."
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
    if (!scriptData) return;
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
    if (!scriptData) return;
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
    <div className="flex flex-col min-h-screen bg-transparent text-slate-800 p-4 md:p-8" id="scripts-studio-container">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 border-b border-slate-200 pb-6 w-full max-w-7xl mx-auto">
        <div className="tour-scripts-header">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-sans font-semibold text-amber-600 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              🚧 Under Construction Zone
            </span>
          </div>
          <h1 className="text-4xl font-display font-light text-slate-900 tracking-tight">
            Script Studio
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Co-directed by <span className="font-medium text-slate-800">Zack (Video Screenwriter)</span> and <span className="font-medium text-slate-800">Chloe (Creative Director)</span>. Translate your active brand position DNA into high-converting screenplay briefs, scene dialogues, and asset specifications.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-slate-200 py-2.5 px-4 rounded-lg shadow-sm shrink-0">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Module Status</span>
            <span className="text-xs font-semibold text-amber-700 truncate max-w-[150px]">🔒 Lab Calibrating</span>
          </div>
        </div>
      </div>

      {/* Full Blur Overlay Banner Container */}
      <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
        
        {/* Full-Coverage Frosted Glass Blur Overlay */}
        <div className="absolute inset-0 z-50 backdrop-blur-xl bg-slate-950/65 flex flex-col items-center justify-start pt-12 md:pt-16 pb-16 px-8 text-center space-y-5">
          {/* Subtle Caution Bar Top */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-3xl shadow-xl shadow-amber-500/10">
            🚧
          </div>

          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-sans font-semibold tracking-wider uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>🚧 Active Engineering & Construction Zone</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-light font-display text-white tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
              Script Studio Is Locked For <br />
              <span className="font-normal italic text-amber-400">Heavy Safety Calibration.</span>
            </h2>

            <p className="text-sm font-light text-slate-200 leading-relaxed max-w-md mx-auto">
              Zack (Video Screenwriter) and the B2B video screenplay generator are sealed under safety calibration and API lockdown. Full public release coming in Q3.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link 
              to="/dashboard" 
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Beautifully Blurred Underlying UI Content */}
        <div className="p-6 filter blur-[8px] opacity-60 pointer-events-none select-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Left Column: Production Deck */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 pr-0 lg:pr-6 lg:border-r border-slate-200 text-left">
              
              {/* Section 1: Narrative & Pacing */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1. Narrative & Pacing
                  </h3>
                </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Narrative mode vibe
                </label>
                <select 
                  value={narrativeVibe}
                  onChange={(e) => handleConfigChange('narrativeVibe', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Playback timing limits
                </label>
                <select 
                  value={timingLimit}
                  onChange={(e) => handleConfigChange('timingLimit', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-sm text-slate-800 outline-none transition-colors cursor-pointer"
                >
                  <option>10 Seconds (Ultra Snappy Hook / Micro-Short)</option>
                  <option>30 Seconds (Standard Social Explainer)</option>
                  <option>60 Seconds (Deep Dive Storytelling)</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-2">
                  Production format
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleConfigChange("productionFormat", "SaaS UI & Animated VFX")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${productionFormat === "SaaS UI & Animated VFX" ? "border-[#7C3AED] bg-[#7C3AED]/5 text-slate-800" : "border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <span className="text-xs font-semibold block">SaaS UI & VFX</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Screen captures, mouse glide, browser flows.</span>
                  </button>

                  <button 
                    onClick={() => handleConfigChange("productionFormat", "Real-Life Creator / Studio Shoot")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${productionFormat === "Real-Life Creator / Studio Shoot" ? "border-[#7C3AED] bg-[#7C3AED]/5 text-slate-800" : "border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50"}`}
                  >
                    <span className="text-xs font-semibold block">Creator Studio</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Presenter cues, studio lights, gestures.</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scripting Guidelines */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Scripting Guidelines
              </h3>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Extra instructions / directives
              </label>
              <textarea 
                value={scriptInstructions}
                onChange={(e) => handleConfigChange('scriptInstructions', e.target.value)}
                placeholder="e.g. Speak directly to B2B founders. Do not mention generic SaaS metrics. Emphasize pipeline predictability. Avoid emojis."
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition-colors h-28 resize-none placeholder-slate-400 leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 block mt-1.5 leading-normal">
                These rules are directly injected into Zack's prompts to guide voice flow.
              </span>
            </div>
          </div>

          {/* Section 3: Branding & Assets */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Branding & Assets Strategy
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-2">
                  Logo placement strategy
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 hide-scrollbar">
                  {[
                    "Corner Watermark",
                    "Physical Apparel",
                    "3D Floating Overlay",
                    "Intro/Outro Slate",
                    "Device Backing"
                  ].map((logoOpt) => (
                    <button
                      key={logoOpt}
                      onClick={() => handleConfigChange("logoShowcase", logoOpt)}
                      className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${logoShowcase === logoOpt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED]" : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {logoOpt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Mascot illustration
                  </span>
                  {mascotPreview && (
                    <button 
                      onClick={handleRemoveMascot}
                      className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!mascotPreview ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border border-dashed border-slate-300 hover:border-[#7C3AED] rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer transition-all relative group"
                  >
                    <input 
                      type="file" 
                      onChange={handleMascotChange}
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-4 h-4 text-slate-400 mb-1.5 group-hover:text-[#7C3AED] transition-colors" />
                    <span className="text-[11px] font-semibold text-slate-700">Drag or click to upload mascot</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0">
                      <img src={mascotPreview} alt="Mascot Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-800 block truncate" title={mascotFile?.name || "Active Mascot"}>
                        {mascotFile?.name || "Active Mascot"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-2">
                  Mascot showcase strategy
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1 hide-scrollbar">
                  {[
                    "Animated Sticker Overlay",
                    "Actor Figurine Desk Buddy",
                    "Over-the-Shoulder 3D Holo",
                    "AI-Voice Sidekick Dialogue",
                    "Comedic Green-Screen Buddy",
                    "Handheld Smartphone AR",
                    "Emotional Empath Overlay",
                    "Intro Splash Star",
                    "Dashboard App Guide"
                  ].map((mscOpt) => (
                    <button
                      key={mscOpt}
                      onClick={() => handleConfigChange("mascotShowcase", mscOpt)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${mascotShowcase === mscOpt ? "border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED] font-semibold" : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-50"}`}
                    >
                      {mscOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-sm">
            <button 
              onClick={() => handleGenerateScript()}
              disabled={isGenerating}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isGenerating ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Writing screenplay...</span>
                </>
              ) : (
                <span>Generate screenplay</span>
              )}
            </button>

            <button
              onClick={handleManualSave}
              disabled={isGenerating}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] text-xs cursor-pointer"
            >
              {saveStatus === "saving" && "Saving details..."}
              {saveStatus === "saved" && "✓ Preserved in brand profile"}
              {saveStatus === "error" && "✗ Save failed"}
              {saveStatus === "idle" && "Save workspace configuration"}
            </button>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-grow text-center min-h-[500px] py-12"
              >
                <div className="relative w-12 h-12 mb-6">
                  <div className="w-full h-full border-2 border-slate-200 border-t-[#7C3AED] rounded-full animate-spin" />
                </div>

                <h3 className="text-2xl font-display font-light text-slate-900 mb-2">
                  Zack is drafting screenplay...
                </h3>
                <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                  Mapping your registered brand positioning DNA, founder doppelganger style, and scene directives into active screenplay briefs.
                </p>

                {/* Simulated build logger */}
                <div className="w-full max-w-md bg-slate-900 text-slate-200 rounded-lg p-4 text-left font-mono text-xs space-y-2 h-48 overflow-y-auto">
                  {generationLogs.map((log, lIdx) => (
                    <div key={lIdx} className="flex gap-2 items-start text-emerald-400">
                      <span>&gt;</span>
                      <span className="text-slate-300">{log}</span>
                    </div>
                  ))}
                  <div className="inline-block animate-pulse w-2 h-3.5 bg-emerald-400 mt-0.5" />
                </div>
              </motion.div>
            ) : !scriptData ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col justify-start flex-grow py-8 space-y-12"
              >
                {/* Onboarding steps list on top */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-950 flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                      Choose production format
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                      Select narration vibe angles, timeline playback limits, logo showcase, and active mascot formats.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-950 flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                      Drop logo or mascot
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                      Provide a custom brand illustration or vector to generate matching camera framing guidelines.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                      Compose screenplay
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                      Trigger the Gemini pipeline to compile complete scene dialogue briefs and filming directions.
                    </p>
                  </div>
                </div>

                {/* Simplified header / title at the bottom of empty state */}
                <div className="border-t border-slate-200 pt-8 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-display font-semibold text-slate-900">
                    Create your video script
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set up your script preferences on the left pane and generate a customized cinematic screenplay for your brand.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col space-y-6 flex-grow"
              >
                {/* Active Screenplay Brief Title Header */}
                <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                      Active screenplay brief
                    </span>
                    <h2 className="text-2xl font-semibold text-slate-900 mt-0.5 tracking-tight">
                      {scriptData.title}
                    </h2>
                  </div>
                  {activeProduct?.website && (
                    <div className="text-xs text-slate-400">
                      <span>Analyzed link: </span>
                      <a 
                        href={activeProduct.website.startsWith("http") ? activeProduct.website : `https://${activeProduct.website}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[#7C3AED] hover:underline"
                      >
                        {activeProduct.website}
                      </a>
                    </div>
                  )}
                </div>
                  {/* Tabs Selector Header with Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
                    <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                      <button
                        onClick={() => setActiveTab("chrono")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "chrono" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Chrono board
                      </button>
                      <button
                        onClick={() => setActiveTab("style")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "style" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Style & music
                      </button>
                      <button
                        onClick={() => setActiveTab("assets")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${activeTab === "assets" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        Required video assets
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => notifyCopy("full-script", JSON.stringify(scriptData, null, 2))}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        {copiedState === "full-script" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>Copy screenplay JSON</span>
                      </button>
                      <button
                        onClick={handleDownloadFullScript}
                        className="bg-slate-950 hover:bg-slate-900 text-white py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download brief</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Tab Body Content */}
                  <div className="flex-grow flex flex-col space-y-5">
                    {activeTab === "chrono" ? (
                      <>
                        {/* Monitor Deck Container - styled as a beautiful, premium pitch-black layout frame */}
                        <div className="bg-[#08080C] border border-slate-950 rounded-lg overflow-hidden aspect-[16/9] relative flex flex-col items-center justify-center shadow-md">
                          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">
                            REC
                          </div>
                          
                          <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded">
                            [{activeScene?.timing || "0:00 - 0:05"}]
                          </div>

                          {/* Sound wave simulation */}
                          <div className="absolute bottom-4 right-4 flex items-end gap-1 h-8">
                            {[0.4, 0.7, 0.2, 0.9, 0.6, 0.3, 0.8, 0.5].map((h, hIdx) => (
                              <motion.div 
                                key={hIdx}
                                animate={{ height: [h*10, h*30, h*10] }}
                                transition={{ repeat: Infinity, duration: 1.2 + hIdx*0.1, ease: "easeInOut" }}
                                className="w-1 bg-[#2583EB]"
                              />
                            ))}
                          </div>

                          {/* Subtitles Overlay */}
                          <div className="p-6 text-center max-w-lg w-full relative z-10 flex flex-col justify-end h-full select-none">
                            <span className="text-[9px] font-bold tracking-widest text-[#2583EB] uppercase mb-1.5">
                              Live cinematic monitor (subtitles feed)
                            </span>
                            <p className="text-sm font-medium text-white leading-relaxed bg-[#08080C]/85 p-3 rounded border border-slate-800">
                              {activeScene?.dialog || 'Speaking cues will be generated here...'}
                            </p>
                          </div>
                        </div>

                        {/* Camera details */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                Active camera cue direction
                              </span>
                              <button 
                                onClick={() => notifyCopy("cameraCue", activeScene?.activeCameraCue)}
                                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedState === "cameraCue" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>Copy cue</span>
                              </button>
                            </div>
                            <blockquote className="text-xs text-slate-700 italic pl-3 border-l-2 border-[#2583EB] bg-white py-2.5 px-3 rounded-r-lg mt-1 relative shadow-sm border border-slate-200 border-l-0">
                              "{activeScene?.activeCameraCue || 'Backlight studio desk workspace'}"
                            </blockquote>
                          </div>

                          {/* Scene Playbook Spoken Cues Card */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-100">
                                  Dialogue playbook
                                </span>
                                <h4 className="text-xs font-semibold text-slate-900">
                                  {activeScene?.title || "Scene #1"} ({activeScene?.timing || "0:00 - 0:05"})
                                </h4>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => notifyCopy("dialogue", activeScene?.dialog)}
                                  className="text-[10px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedState === "dialogue" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                                  <span>Copy phrase</span>
                                </button>
                                <button 
                                  onClick={() => handleDownloadScene(selectedSceneIndex)}
                                  className="text-[10px] bg-slate-950 text-white px-2.5 py-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                                >
                                  Download scene
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-0.5">
                              Dialogue spoken text
                            </p>
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed font-sans bg-slate-50/50 p-3 rounded border border-slate-200">
                              {activeScene?.dialog || "No spoken dialogue."}
                            </p>
                          </div>

                          {/* Sora visual prompt */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 relative shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-wider">
                                Video generator prompt (Sora / Luma / Runway)
                              </span>
                              <button 
                                onClick={() => notifyCopy("aiPrompt", activeScene?.videoPrompt)}
                                className="text-[10px] bg-cyan-50 border border-cyan-100 text-cyan-600 hover:bg-cyan-100/50 px-2 py-1 rounded inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedState === "aiPrompt" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                                <span>Copy prompt</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50/50 p-3 rounded border border-slate-200">
                              {activeScene?.videoPrompt || "No prompts generated."}
                            </p>
                          </div>

                          {/* SFX and tip row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm space-y-1.5">
                              <span className="text-[9px] text-[#2583EB] font-bold uppercase tracking-wider block">
                                Audio & sound effects
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {activeScene?.soundEffects || "No sound effects cues."}
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm space-y-1.5">
                              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block">
                                Filming directive tip
                              </span>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {activeScene?.directingTip || "No directing tip cues."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sequence Tracker Scroll block */}
                        <div className="border-t border-slate-200 pt-4 space-y-3 mt-auto">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            Timeline sequence track (Select active scene frame)
                          </span>
                          <div className="flex gap-3 overflow-x-auto pb-1.5 hide-scrollbar">
                            {scriptData.scenes.map((scItem, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSceneIndex(sIdx)}
                                className={`px-4 py-3 rounded-lg border text-left shrink-0 text-xs transition-all cursor-pointer ${selectedSceneIndex === sIdx ? "border-[#7C3AED] bg-white text-slate-800 shadow-sm" : "border-slate-200 bg-white/50 text-slate-500 hover:bg-white"}`}
                              >
                                <span className="font-semibold block text-slate-800">Scene {sIdx + 1}</span>
                                <span className="text-[10px] text-slate-400 leading-snug mt-0.5 block">{scItem.timing}</span>
                              </button>
                            ))}
                          </div>
                          
                          {/* Inner Navigation */}
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                            <button 
                              onClick={() => setSelectedSceneIndex(prev => Math.max(0, prev - 1))}
                              disabled={selectedSceneIndex === 0}
                              className="px-3 py-1 rounded bg-white border border-slate-200 disabled:opacity-30 flex items-center gap-1 font-semibold hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-3 h-3" /> Previous scene
                            </button>
                            <span className="font-semibold uppercase tracking-wider text-[10px]">Scene {selectedSceneIndex + 1} of {scriptData.scenes.length}</span>
                            <button 
                              onClick={() => setSelectedSceneIndex(prev => Math.min(scriptData.scenes.length - 1, prev + 1))}
                              disabled={selectedSceneIndex === scriptData.scenes.length - 1}
                              className="px-3 py-1 rounded bg-white border border-slate-200 disabled:opacity-30 flex items-center gap-1 font-semibold hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              Next scene <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : activeTab === "style" ? (
                      <div className="space-y-4 flex-grow">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                            <Palette className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Video art style & visual guidelines</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {scriptData.visualStyleGuide}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                            <Music className="w-4 h-4 text-[#2583EB]" />
                            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Soundtrack & music track design</h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {scriptData.musicVibeGuide}
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-semibold text-slate-800 block">Outro Transition Guide</span>
                          <span className="text-[11px] text-slate-500 mt-1 max-w-sm">
                            Logo fade flare containing direct CTAs linking to call schedules. Standard outro assets are loaded into your assets locker automatically.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-grow flex flex-col text-left">
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-1">
                            Media attachments checklist
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            To ensure high-fidelity brand representations inside visual editors, prepare these graphic files as input attachments.
                          </p>
                        </div>

                        {scriptData.requiredAssets && scriptData.requiredAssets.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-96 pr-1 hide-scrollbar">
                            {scriptData.requiredAssets.map((asset, index) => (
                              <div 
                                key={index} 
                                className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden transition-colors shadow-sm"
                              >
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#7C3AED]" />
                                
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    {asset.type}
                                  </span>
                                  <h4 className="text-xs font-semibold text-slate-800">
                                    {asset.name}
                                  </h4>
                                </div>

                                <div className="space-y-2 mt-1.5 pl-1.5 border-l border-slate-100">
                                  <div className="text-[11px] text-slate-600 leading-relaxed">
                                    <span className="text-[9px] text-[#2583EB] font-bold uppercase tracking-wider block mb-0.5">Asset placement purpose:</span>
                                    {asset.purpose}
                                  </div>
                                  <div className="text-[11px] text-slate-500 leading-relaxed">
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block mb-0.5">Visual specs & guidelines:</span>
                                    {asset.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center my-auto shadow-inner">
                            <span className="text-xs font-semibold text-slate-700">No assets listed yet</span>
                            <span className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                              Compile a screenplay playbook from the production deck to parse required asset details.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Iterative Tweak Editor */}
                  <div className="border-t border-slate-200 pt-4 space-y-3.5 mt-auto">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Polishing script note tweaks
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                        Adjust specific visual highlights or wording hook preferences. Zack and Chloe will update script values while preserving core Brand DNA setup.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scriptTweakInput}
                        onChange={(e) => setScriptTweakInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyTweak()}
                        placeholder="e.g., 'Make the hook in Scene 1 much more contrarian' or 'Describe the dashboard back-lighting as glowing orange'"
                        className="flex-grow bg-white border border-slate-200 focus:border-[#7C3AED] rounded-lg px-3 py-2.5 text-xs text-slate-800 outline-none transition-colors shadow-sm"
                      />
                      <button
                        onClick={handleApplyTweak}
                        className="bg-slate-950 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer shrink-0"
                      >
                        Apply tweak
                      </button>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
