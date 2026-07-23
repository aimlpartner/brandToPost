import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useProducts } from "../contexts/ProductContext";
import { LiveLogsConsole } from "../components/LiveLogsConsole";
import { loggerService } from "../services/loggerService";
import { VisualEngine } from "../components/VisualEngine";
import { generateOneDayStoryImage } from "../services/geminiService";
import {
  MessageSquare,
  Search,
  Filter,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  RefreshCw,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  Smartphone,
  Send,
  Check,
  Languages,
  Zap,
  CheckCircle,
  HelpCircle,
  Paperclip
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  photosCount: number;
  rating: number;
  outcome: "passed" | "skipped_no_photos" | "skipped_landline";
  reason?: string;
  image?: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text?: string;
  timestamp: string;
  interactiveLeadResults?: Lead[];
  customCard?: {
    name: string;
    address: string;
    rating: number;
    image: string;
    compressedSize: string;
    originalSize: string;
  };
  outreachTemplate?: {
    language: string;
    copiedText: string;
  };
  generatedStoryImage?: {
    imageUrl: string;
    businessName: string;
  };
  attachedImage?: string;
}

export function WhatsAppSystem() {
  const { activeProduct } = useProducts();
  const [niche, setNiche] = useState("Clinics & Dental Centers");
  const [location, setLocation] = useState("South Delhi");
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Hindi-Mix");
  const [liveBotUrl, setLiveBotUrl] = useState("https://wa.me/15550267562?text=Hi%20Tror");

  // --- 1-Day Story Post Generator State ---
  const [oneDayName, setOneDayName] = useState("Glow Salon & Spa");
  const [oneDayAbout, setOneDayAbout] = useState("Premium bespoke haircut styling, organic facial therapies, and bridal makeovers with a team of elite artists.");
  const [oneDayPhone, setOneDayPhone] = useState("+91 99112 00382");
  const [oneDayAddress, setOneDayAddress] = useState("GK-2 Main Market, New Delhi");
  const [isGeneratingOneDay, setIsGeneratingOneDay] = useState(false);
  const [oneDayStatus, setOneDayStatus] = useState("");
  const [oneDayAttachedImage, setOneDayAttachedImage] = useState<string | null>(null);
  const [chatAttachedImage, setChatAttachedImage] = useState<string | null>(null);
  const [isChatBotGenerating, setIsChatBotGenerating] = useState(false);

  useEffect(() => {
    if (activeProduct?.name) {
      setOneDayName(activeProduct.name);
    }
  }, [activeProduct]);

  const handleGenerateOneDayCampaign = async () => {
    if (isGeneratingOneDay) return;
    setIsGeneratingOneDay(true);
    setOneDayStatus("Analyzing brand info...");

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user request to chat
    setChatMessages(prev => [...prev, {
      id: `u-oneday-${Math.random()}`,
      sender: "user",
      text: `🎨 Generate an Instagram & WhatsApp story post for:\n🏢 *${oneDayName}*\n📞 Phone: ${oneDayPhone}\n📍 Address: ${oneDayAddress}\n📝 About: ${oneDayAbout}${oneDayAttachedImage ? "\n\n🖼️ [Custom Background Creative Attached]" : ""}`,
      timestamp: timeStr,
      attachedImage: oneDayAttachedImage || undefined
    }]);

    // Add bot acknowledging message
    await addMessageWithDelay({
      sender: "bot",
      text: oneDayAttachedImage 
        ? `✨ Request received! Starting our background 1-Day Story Creative Generator...

Since you shared your own image creative, we will keep your photo EXACTLY same to skip background generation. We are setting up our HTML canvas layers and running the offscreen Puppeteer renderer to overlay the phone, location, name, and stylized slogan on top... 🚀 ⏳`
        : `✨ Request received! Starting our background 1-Day Story Creative Generator...

We will apply our exact core overlay and offscreen Puppeteer rendering architecture. Currently generating a custom cinematic base background image related to your niche using Gemini Imagen AI... ⏳`
    }, 1000);

    try {
      setOneDayStatus(oneDayAttachedImage ? "Composing layer positioning..." : "Generating base image via Gemini Imagen...");
      const result = await generateOneDayStoryImage({
        businessName: oneDayName,
        aboutBusiness: oneDayAbout,
        phone: oneDayPhone,
        address: oneDayAddress,
        backgroundImage: oneDayAttachedImage || undefined,
        dnaUrl: activeProduct?.logoLightUrl || activeProduct?.logoUrl || "/B2PLOGO.png"
      });

      setOneDayStatus("Rendering text-contrast overlay...");
      await new Promise(r => setTimeout(r, 1200));

      const successTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, {
        id: `bot-oneday-success-${Date.now()}`,
        sender: "bot",
        text: `🚀 Success! Your custom story banner has been generated in the background.

Optimal and flattened 1080x1080 JPEG for Instagram and WhatsApp high-engagement stories:`,
        timestamp: successTimeStr,
        generatedStoryImage: {
          imageUrl: result.imageUrl,
          businessName: oneDayName
        }
      }]);
    } catch (err) {
      console.error("1-day campaign generation error:", err);
      await addMessageWithDelay({
        sender: "bot",
        text: "❌ Service rendering error encountered in background layers. Utilizing an elite pre-made template as an instant fail-safe:"
      }, 1000);

      await addMessageWithDelay({
        sender: "bot",
        text: "Fallback premium creative:",
        generatedStoryImage: {
          imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          businessName: oneDayName
        }
      }, 800);
    } finally {
      setIsGeneratingOneDay(false);
      setOneDayStatus("");
    }
  };

  useEffect(() => {
    fetch('/api/whatsapp/public-link')
      .then(res => res.json())
      .then(data => {
        if (data.url) setLiveBotUrl(data.url);
      })
      .catch(err => console.error("Could not fetch public bot link", err));
  }, []);
  
  // Custom manual image generator state
  const [customBusinessName, setCustomBusinessName] = useState("My Clinic");
  const [customAddress, setCustomAddress] = useState("Main Metro Road, South Delhi");
  const [customImage, setCustomImage] = useState("https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=80");
  const [customRating, setCustomRating] = useState(4.8);
  const [compressing, setCompressing] = useState(false);
  
  const [previewTab, setPreviewTab] = useState<"mockup" | "engine">("engine");
  const [visualType, setVisualType] = useState<string>("custom-overlay");

  const [compressedFile, setCompressedFile] = useState<{
    original: string;
    compressed: string;
    ratio: string;
  } | null>({
    original: "4.2 MB",
    compressed: "348 KB",
    ratio: "91% Space Saved (WebP 80% Q)",
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: "bot",
      text: "👋 Welcome to the BrandToPost WhatsApp Outreach System! I am Tror's Outreach Bot.",
      timestamp: "11:30 AM"
    },
    {
      id: "m2",
      sender: "bot",
      text: "I help local businesses and agencies automate lead discovery on Google Maps, sieve out landlines & dead profiles, compress massive assets to <1MB, and deliver custom localized WhatsApp creatives. 🚀",
      timestamp: "11:31 AM"
    },
    {
      id: "m3",
      sender: "bot",
      text: "Feel free to run a simulated scan for your neighborhood below! Select a niche to launch the pipeline.",
      timestamp: "11:31 AM"
    }
  ]);

  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside phone simulator
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const addMessageWithDelay = (msg: Omit<ChatMessage, "id" | "timestamp">, delay: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages(prev => [...prev, {
          ...msg,
          id: `m-${Math.random()}`,
          timestamp: timeStr
        }]);
        resolve(true);
      }, delay);
    });
  };

  const handleRunSimulation = async (selectedNiche: string, selectedLoc: string) => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    loggerService.addLog("whatsapp", "info", `Triggering local business discovery simulation for '${selectedNiche}' in location '${selectedLoc}'...`);
    loggerService.addLog("whatsapp", "info", `Querying Google Places (New) API matching bounds...`);

    const presetMessagesCount = chatMessages.length;
    
    // 1. Add User Message
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, {
      id: `u-${Math.random()}`,
      sender: "user",
      text: `Let's find ${selectedNiche} in ${selectedLoc}`,
      timestamp: timeStr
    }]);

    // 2. Bot Searching message
    await addMessageWithDelay({
      sender: "bot",
      text: `🔍 Fetching live data from Google Places (New) for keywords corresponding to "${selectedNiche}" around "${selectedLoc}"...`
    }, 800);

    // 3. Sieve Filtering details
    const simulatedLeads: Lead[] = [
      {
        id: "l1",
        name: selectedNiche.includes("Dental") || selectedNiche.includes("Clinic") ? "Apex Dental & Implant Centre" : "Royal Orchard Grocery Hub",
        phone: "+91 98711 00382",
        address: `${selectedLoc}, New Delhi`,
        status: "PENDING_OUTREACH",
        photosCount: 6,
        rating: 4.9,
        outcome: "passed",
        image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80"
      },
      {
        id: "l2",
        name: selectedNiche.includes("Dental") || selectedNiche.includes("Clinic") ? "Metro Chemist & Medicos" : "Deli-Bites Bakeries",
        phone: "+91 88200 44101",
        address: `Main Market Rd, ${selectedLoc}`,
        status: "SKIPPED",
        photosCount: 0,
        rating: 4.1,
        outcome: "skipped_no_photos",
        reason: "Filtered: Zero user images on Google Places. Sieve requires real visuals to build designs."
      },
      {
        id: "l3",
        name: selectedNiche.includes("Dental") || selectedNiche.includes("Clinic") ? "South Delhi Cardiology Unit" : "Daily Fresh Mart",
        phone: "011-26498877",
        address: `Ring Road, ${selectedLoc}`,
        status: "SKIPPED",
        photosCount: 4,
        rating: 4.7,
        outcome: "skipped_landline",
        reason: "Filtered: Landline or invalid cellular sequence detected. Prevent WhatsApp bouncing."
      },
      {
        id: "l4",
        name: selectedNiche.includes("Dental") || selectedNiche.includes("Clinic") ? "Dr. Sahil's Pediatric Clinic" : "Elite Grocers & Organics",
        phone: "+91 99112 33455",
        address: `Sector 3 Green Park, ${selectedLoc}`,
        status: "PENDING_OUTREACH",
        photosCount: 3,
        rating: 4.6,
        outcome: "passed",
        image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&auto=format&fit=crop&q=80"
      }
    ];

    simulatedLeads.forEach(lead => {
      if (lead.outcome === "passed") {
        loggerService.addLog("whatsapp", "success", `Lead discovery PASSED: "${lead.name}" (${lead.phone}) is cellular-valid with ${lead.photosCount} high-res gallery items.`);
      } else {
        loggerService.addLog("whatsapp", "warn", `Lead discovery SKIPPED: "${lead.name}" - ${lead.reason}`);
      }
    });

    await addMessageWithDelay({
      sender: "bot",
      text: "⚡ Running Sieve Analytics on 4 matching results... checking WhatsApp availability, cellular line types, and photo counts:",
      interactiveLeadResults: simulatedLeads
    }, 1200);

    loggerService.addLog("image", "info", `Initiating WebP compression batch. Loading lead artwork assets...`);
    loggerService.addLog("image", "success", `Finished WebP compression. File compressed from 3.8 MB package down to 328 KB (retained full clarity).`);

    // 4. Creative generation message
    await addMessageWithDelay({
      sender: "bot",
      text: "🎨 Creating personalized vertical (10B981) Story templates! Auto-compressing heavy assets down to <1.0MB WebP files..."
    }, 1800);

    // 5. Custom Card block
    await addMessageWithDelay({
      sender: "bot",
      customCard: {
        name: simulatedLeads[0].name,
        address: simulatedLeads[0].address,
        rating: simulatedLeads[0].rating,
        image: simulatedLeads[0].image!,
        compressedSize: "328 KB",
        originalSize: "3.8 MB"
      }
    }, 1500);

    // 6. Regional local message translation
    await addMessageWithDelay({
      sender: "bot",
      text: `🌐 Translating pitch concept into a localized, high-engagement Dialect (${selectedLanguage}):`
    }, 1000);

    const regionalTexts: Record<string, string> = {
      "Hindi-Mix": `Hi Dr. Specialist! We spotted your beautiful center "${simulatedLeads[0].name}" in ${selectedLoc}. Solid ⭐ ${simulatedLeads[0].rating} rating with stunning reviews! 
      
Humne aapke clinic ke liye ek beautiful custom promotional banner design kiya hai (attached above) to show off your great service on social stories. 

Aap ise apne WhatsApp Status, Instagram, and Boards par use kar sakte hain completely free.

Interactive download link is details secure call booking: https://brandtopost.com/shared/secure_clinic_00382`,
      "Marathi-Mix": `Namaskar! Tumche "${simulatedLeads[0].name}" centre ${selectedLoc} madhe khup prasiddha ahe. Tumche rating ⭐ ${simulatedLeads[0].rating} khup changle ahe!

Ame tumcha sathi ek customized aesthetic marketing Story photo create kela ahe. Ha design free download kara ani social var share kara.

Aapla digital vault link: https://brandtopost.com/shared/secure_clinic_00382`,
      "English-Pro": `Hello there! We noticed your outstanding establishment "${simulatedLeads[0].name}" located in ${selectedLoc}. With a stellar rating of ⭐ ${simulatedLeads[0].rating}, your reputation is impressive.

To celebrate, our design orchestrator custom-crafted a high-res mobile marketing layout showcasing your clinic. 

Review it and explore your full digital expansion kit here: https://brandtopost.com/shared/secure_clinic_00382`
    };

    await addMessageWithDelay({
      sender: "bot",
      outreachTemplate: {
        language: selectedLanguage,
        copiedText: regionalTexts[selectedLanguage] || regionalTexts["Hindi-Mix"]
      }
    }, 1200);

    // 7. TTL database state engine detail
    await addMessageWithDelay({
      sender: "bot",
      text: "⏱️ Database record configured:\n- Status: OUTREACH_SENT\n- TTL Window: 72 hours\n- Trigger: If lead doesn't respond or engage, profile is safely archived/deactivated to prevent unnecessary pricing and storage consumption. 🔒"
    }, 1400);

    setIsSimulating(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !chatAttachedImage) || isSimulating || isChatBotGenerating) return;

    const text = inputValue;
    const attachedImg = chatAttachedImage;
    setInputValue("");
    setChatAttachedImage(null);
    setIsChatBotGenerating(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text || "Process this attached style creative...",
      timestamp: timeStr,
      attachedImage: attachedImg || undefined
    }]);

    await new Promise(r => setTimeout(r, 1000));

    const cleanBusinessName = oneDayName || activeProduct?.name || "Premium Salon & Spa";
    const cleanPhone = oneDayPhone || "+91 99999 88888";
    const cleanAddress = oneDayAddress || "GK-2 Market, New Delhi";
    const cleanAbout = text || oneDayAbout || "Exquisite customer experiences.";

    if (attachedImg) {
      setChatMessages(prev => [...prev, {
        id: `bot-ack-${Date.now()}`,
        sender: "bot",
        text: `✨ I noticed you shared an image creative backdrop!

We are keeping your photo EXACTLY the same to skip background generation. We are setting up our HTML canvas layers and running the offscreen Puppeteer renderer to overlay the high-fidelity branding, contact phone, location, and name designed beautifully on top... 🚀 ⏳`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      await new Promise(r => setTimeout(r, 1500));

      try {
        const result = await generateOneDayStoryImage({
          businessName: cleanBusinessName,
          aboutBusiness: cleanAbout,
          phone: cleanPhone,
          address: cleanAddress,
          backgroundImage: attachedImg,
          dnaUrl: activeProduct?.logoLightUrl || activeProduct?.logoUrl || "/B2PLOGO.png"
        });

        const successTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages(prev => [...prev, {
          id: `bot-chat-success-${Date.now()}`,
          sender: "bot",
          text: `🎨 Creative processing complete! Here is your finalized visual creative story for ${cleanBusinessName}, with high-contrast text layering and verified details intact. Ready for WhatsApp and Instagram:`,
          timestamp: successTimeStr,
          generatedStoryImage: {
            imageUrl: result.imageUrl,
            businessName: cleanBusinessName
          }
        }]);
      } catch (err) {
        console.error(err);
        setChatMessages(prev => [...prev, {
          id: `bot-chat-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Overlay render timed out. Here is an optimized modern grid preview of the business banner:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generatedStoryImage: {
            imageUrl: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=500&auto=format&fit=crop&q=80",
            businessName: cleanBusinessName
          }
        }]);
      }
    } else {
      setChatMessages(prev => [...prev, {
        id: `bot-ack-${Date.now()}`,
        sender: "bot",
        text: `✨ Let's generate a custom story creative card for: *${cleanBusinessName}*!

Since you didn't share an image, I will generate a premium, contextually optimized base photo via Gemini Imagen first... then layer the stylized branding over it!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      await new Promise(r => setTimeout(r, 1800));

      try {
        const result = await generateOneDayStoryImage({
          businessName: cleanBusinessName,
          aboutBusiness: cleanAbout,
          phone: cleanPhone,
          address: cleanAddress,
          dnaUrl: activeProduct?.logoLightUrl || activeProduct?.logoUrl || "/B2PLOGO.png"
        });

        const successTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages(prev => [...prev, {
          id: `bot-chat-success-${Date.now()}`,
          sender: "bot",
          text: `🎨 Success! Background generated from brand description and overlaid beautifully in premium layouts:`,
          timestamp: successTimeStr,
          generatedStoryImage: {
            imageUrl: result.imageUrl,
            businessName: cleanBusinessName
          }
        }]);
      } catch (err) {
        console.error(err);
        setChatMessages(prev => [...prev, {
          id: `bot-chat-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Creative generation failed. Using default design layout for safety:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          generatedStoryImage: {
            imageUrl: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=80",
            businessName: cleanBusinessName
          }
        }]);
      }
    }

    setIsChatBotGenerating(false);
  };

  const handleCustomCompress = () => {
    setCompressing(true);
    setTimeout(() => {
      setCompressing(false);
      setCompressedFile({
        original: "5.4 MB",
        compressed: "412 KB",
        ratio: "92.3% post-WebP optimization. Retained full vector text alignment!",
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 selection:bg-[#7C3AED]/30 selection:text-white">
      {/* Header Navbar */}
      <nav className="border-b border-white/5 bg-[#0D0D15]/80 backdrop-blur-md sticky top-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED] p-[1px] shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <div className="w-full h-full bg-[#1C1C22] rounded-[7px] flex items-center justify-center">
                <img src="/B2PLOGO.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <span className="text-xl tracking-tight font-display text-white font-medium">BrandToPost</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Return Home
            </Link>
            <Link to="/login" className="px-5 py-2 rounded-full text-sm font-medium transition-all bg-[#7C3AED] text-white hover:bg-[#6c2ec9]">
              Launch Main Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Core Description Title */}
        <div className="text-center md:text-left mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 fill-emerald-400/20" /> WhatsApp Customer Acquisition & Local Growth Machine
          </div>
          <h1 className="text-4xl md:text-6xl font-light font-display text-white mb-6 tracking-tight leading-tight">
            The WhatsApp <span className="text-emerald-400">Outreach System</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
            Our automated agentic system lets local businesses or marketing agencies discover clients instantly on Google Maps, screen validity, build WebP compressed social templates, localized regionals, and run autonomous time-gated conversion.
          </p>
        </div>

        {/* Dynamic Grid split -> Left explanation and tools, Right Smartphone simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT SYSTEM DESCRIPTION & MINI INTERACTIVE PLAYGROUNDS */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Quick overview of Modules */}
            <div className="bg-[#12121E] rounded-3xl border border-white/5 p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2583EB]/5 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Layers className="w-6 h-6 text-[#2583EB]" /> Core Architectural Blueprint
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    step: "01",
                    title: "Lead Sieve & Discovery Engine",
                    desc: "Queries real Google Maps listings. Validates mobile connectivity while filtering out landline prefixes; inspects business galleries and drops profiles without high-res photos.",
                    color: "border-l-blue-500"
                  },
                  {
                    step: "02",
                    title: "Ultra-Lightweight Canvas Optimizer",
                    desc: "Ingests heavy assets and processes them down to < 1.0 MB WebP files. Eliminates delivery latency and guarantees instantly-loading creative headers over WhatsApp/cellular links.",
                    color: "border-l-[#7C3AED]"
                  },
                  {
                    step: "03",
                    title: "Regional Dialog Copy Localizer",
                    desc: "Adapts outreach copies based on location and local culture. Generates specialized mixtures (Hinglish, Marathinglish, regional dialects) to increase click-through rates.",
                    color: "border-l-emerald-500"
                  },
                  {
                    step: "04",
                    title: "State-Gated TTL Auto-Deactivation",
                    desc: "Tracks response latency. To prevent bloated collections, unengaged outreach leads automatically deactivate or clean out within 48 to 72 hours.",
                    color: "border-l-yellow-500"
                  },
                  {
                    step: "05",
                    title: "Secure Cloud Vaults & Monthly Billing",
                    desc: "Saves high-fidelity digital files behind encrypted, short-lived signed URLs. Automatically assesses actual directory size limits and invoices monthly storage vault billing tiers.",
                    color: "border-l-pink-500"
                  }
                ].map((item, idx) => (
                  <div key={idx} className={`pl-5 border-l-2 ${item.color} space-y-1`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 tracking-widest">{item.step}</span>
                      <h3 className="text-base font-semibold text-slate-200">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Campaign Processing Diagnostics Logs Console */}
            <LiveLogsConsole title="WhatsApp Outreach & Graphics Diagnostic Console" defaultSectionFilter="whatsapp" />

            {/* Live Interactive Module A: Image Compressor & Dynamic Template Overlay */}
            <div className="bg-[#12121E] rounded-3xl border border-white/5 p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-3xl"></div>
              
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  <FileImage className="w-6 h-6 text-[#7C3AED]" /> Live Interactive Image Compression & Story Canvas
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Upload or customize a clinic picture to see our canvas crop, overlay credentials, and compress to optimal size.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase mb-1.5">Business Name</label>
                    <input 
                      type="text" 
                      value={customBusinessName} 
                      onChange={(e) => setCustomBusinessName(e.target.value)}
                      className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase mb-1.5">Location Address</label>
                    <input 
                      type="text" 
                      value={customAddress} 
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase mb-1.5">Star Rating</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        max="5"
                        min="1"
                        value={customRating} 
                        onChange={(e) => setCustomRating(parseFloat(e.target.value) || 4.8)}
                        className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase mb-1.5">Cover Style</label>
                      <select 
                        value={customImage} 
                        onChange={(e) => setCustomImage(e.target.value)}
                        className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                      >
                        <option value="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=80">Dental Lab</option>
                        <option value="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=500&auto=format&fit=crop&q=80">Modern Clinic</option>
                        <option value="https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=500&auto=format&fit=crop&q=80">Physiotherapy</option>
                        <option value="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80">Pizzeria Shop</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase mb-1.5">Creative Template Style</label>
                    <select 
                      value={visualType} 
                      onChange={(e) => setVisualType(e.target.value)}
                      className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C3AED]"
                    >
                      <option value="custom-overlay">Custom WebP Branding Overlay</option>
                      <option value="creative-story">Cinematic Local Story Layout</option>
                      <option value="data-infographic">Bento-Box Data Infographic</option>
                      <option value="powerful-quote">Elite Status Bold Quote Banner</option>
                      <option value="abstract-announcement">Vibrant Promotion Announcement</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCustomCompress}
                    disabled={compressing}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#7C3AED] hover:bg-[#6a2cbd] transition-colors rounded-xl font-bold text-sm relative overflow-hidden"
                  >
                    {compressing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Optimizing WebP Matrix...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" /> Run Mobile Compression
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {compressedFile && !compressing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-1.5 relative overflow-hidden"
                      >
                        <div className="font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> COMPRESSION PASSED</div>
                        <div>Original Size: <strong>{compressedFile.original}</strong></div>
                        <div>Compressed WebP Target: <strong className="text-white text-sm">{compressedFile.compressed}</strong></div>
                        <div className="text-slate-300 font-light italic">{compressedFile.ratio}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Previews Story template / VisualEngine tabs */}
                <div className="flex flex-col items-center gap-4 justify-center">
                  <div className="flex bg-[#1C1C2A] p-1 rounded-xl text-xs w-full justify-between border border-white/5 max-w-[280px]">
                    <button 
                      onClick={() => setPreviewTab("mockup")}
                      className={`px-3 py-1.5 rounded-lg transition-all w-1/2 ${previewTab === "mockup" ? "bg-[#7C3AED] text-white font-medium shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      Smartphone View
                    </button>
                    <button 
                      onClick={() => setPreviewTab("engine")}
                      className={`px-3 py-1.5 rounded-lg transition-all w-1/2 ${previewTab === "engine" ? "bg-[#7C3AED] text-white font-medium shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      Campaigns Engine
                    </button>
                  </div>

                  {previewTab === "mockup" ? (
                    <div className="w-[190px] h-[330px] rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex flex-col bg-[#050508]">
                      {/* Header */}
                      <div className="absolute top-2 left-2 z-10 flex gap-1 items-center">
                        <div className="w-5 h-5 bg-white/20 backdrop-blur rounded p-[1px] flex items-center justify-center">
                          <img src="/B2PLOGO.png" alt="Logo" className="w-3 h-3 object-contain" />
                        </div>
                        <span className="text-[7px] text-white/50 tracking-widest font-mono">Tror Canvas</span>
                      </div>

                      <div className="absolute top-2 right-2 z-10 bg-emerald-500 px-1 py-[1px] text-[7px] font-bold text-black rounded uppercase">
                        ⭐ {customRating}
                      </div>

                      {/* Image */}
                      <div className="w-full h-1/2 relative">
                        <img src={customImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#050508]/30"></div>
                      </div>

                      {/* Content overlays */}
                      <div className="flex-1 p-3 flex flex-col justify-between relative z-10 bg-[#050508]/90">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white tracking-tight line-clamp-2 leading-tight">{customBusinessName}</h4>
                          <p className="text-[9px] text-slate-400 line-clamp-1 flex items-center gap-0.5 font-light">📍 {customAddress}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-[#2583EB]/15 border border-[#2583EB]/30 rounded p-1.5 text-[8px] text-slate-300 leading-tight text-center">
                            "Top Quality services verified in local boundaries"
                          </div>
                          <div className="w-full py-1.5 rounded-lg bg-[#7C3AED] text-[8px] font-bold text-center text-white cursor-pointer hover:bg-[#6c2ec9] uppercase tracking-wider">
                            Connect on WhatsApp
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative p-2 flex items-center justify-center bg-black/40 rounded-3xl border border-white/5 overflow-hidden w-[240px] h-[240px] select-none text-left">
                      <VisualEngine 
                        visualType={visualType}
                        visualData={{
                          headline: customBusinessName,
                          subtext: `★ ${customRating} — ${customAddress}`,
                          stats: [
                            { label: "Rating", value: `${customRating} ★` },
                            { label: "Outreach Result", value: "98% Reach" },
                            { label: "WebP Compressor", value: "Save 91%" }
                          ],
                          customHtml: `<div class="absolute inset-0 flex flex-col justify-between p-4 bg-black/60 font-sans">
                            <div class="flex justify-between items-center bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                              <div class="text-white text-sm font-black tracking-tight">${customBusinessName}</div>
                              <div class="bg-emerald-500 text-black px-2 py-0.5 text-xs font-black rounded-md">★ ${customRating}</div>
                            </div>
                            <div class="bg-black/80 backdrop-blur-lg p-3 rounded-2xl border border-white/10 space-y-1.5">
                              <p class="text-white text-[11px] font-light leading-relaxed">"${customBusinessName} offers elite-grade localized services."</p>
                              <div class="text-emerald-400 font-mono text-[9px] flex items-center gap-1">📍 ${customAddress}</div>
                            </div>
                          </div>`
                        }}
                        imageUrl={customImage}
                        dna={activeProduct || {
                          id: "fallback-dna",
                          name: activeProduct?.name || "BrandToPost",
                          website: activeProduct?.website || "",
                          positioning: activeProduct?.positioning || "",
                          audience: activeProduct?.audience || "",
                          tone: activeProduct?.tone || "",
                          stage: activeProduct?.stage || "",
                          logoUrl: "/B2PLOGO.png",
                          logoLightUrl: "/B2PLOGO.png",
                          logoDarkUrl: "/B2PLOGO.png",
                          visualData: {
                            colors: ["#10B981", "#050508"],
                            fonts: {
                              primary: "Inter",
                              secondary: "Inter"
                            },
                            typographyHierarchy: "standard",
                            imageStyle: "cinematic"
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI 1-Day Story Post Generator */}
            <div className="bg-[#12121E] rounded-3xl border border-white/5 p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
              
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 text-[10px] font-bold uppercase mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Story Campaign Engine
                </div>
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2 font-display">
                  <Sparkles className="w-6 h-6 text-emerald-400" /> 1-Day Story Creative Generator
                </h2>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed font-light">
                  Generate gorgeous, direct marketing story/status post graphics with premium layout placements in the background. Content copywriting is bypassed, generating optimal social visual assets instantly!
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Business Name</label>
                    <input 
                      type="text" 
                      value={oneDayName} 
                      onChange={(e) => setOneDayName(e.target.value)}
                      placeholder="e.g. Bella Hair Salon"
                      disabled={isGeneratingOneDay}
                      className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">WhatsApp / Phone</label>
                    <input 
                      type="text" 
                      value={oneDayPhone} 
                      onChange={(e) => setOneDayPhone(e.target.value)}
                      placeholder="e.g. +91 99999 88888"
                      disabled={isGeneratingOneDay}
                      className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Location Address</label>
                  <input 
                    type="text" 
                    value={oneDayAddress} 
                    onChange={(e) => setOneDayAddress(e.target.value)}
                    placeholder="e.g. GK-2 M Block Market, New Delhi"
                    disabled={isGeneratingOneDay}
                    className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Brief Slogan & Context (About business)</label>
                  <textarea 
                    value={oneDayAbout} 
                    onChange={(e) => setOneDayAbout(e.target.value)}
                    placeholder="e.g. Modern dental clinic delivering cinematic smile makeovers..."
                    rows={2}
                    disabled={isGeneratingOneDay}
                    className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 resize-none font-sans"
                  />
                </div>

                {/* Optional Backdrop Attachment Dropzone */}
                <div className="bg-[#1C1C2A]/40 border border-white/5 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Creative Backdrop (Optional)
                    </label>
                    {oneDayAttachedImage && (
                      <button
                        type="button"
                        onClick={() => setOneDayAttachedImage(null)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" /> Clear Backdrop
                      </button>
                    )}
                  </div>

                  {!oneDayAttachedImage ? (
                    <div 
                      onClick={() => document.getElementById("one_day_file_upload2")?.click()}
                      className="border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl p-3.5 text-center cursor-pointer hover:bg-white/[0.02] transition-all group"
                    >
                      <input 
                        type="file" 
                        id="one_day_file_upload2" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setOneDayAttachedImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <FileImage className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 mx-auto mb-1.5 transition-colors" />
                      <div className="text-[11px] font-semibold text-slate-300">
                        Upload Custom Background Creative
                      </div>
                      <div className="text-[9px] text-slate-550 mt-0.5 leading-tight">
                        Keeps exact image intact — overlays text layouts beautifully
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-950 p-2 flex items-center gap-3">
                      <img 
                        src={oneDayAttachedImage} 
                        alt="Attached background" 
                        className="w-12 h-12 object-cover rounded-lg border border-white/10 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom Base Creative Ready
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-normal truncate">
                          Original frame will remain completely untouched.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateOneDayCampaign}
                    disabled={isGeneratingOneDay}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] transition-all rounded-xl font-bold text-sm text-black uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                  >
                    {isGeneratingOneDay ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" /> {oneDayStatus || "Processing Background Image..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black fill-black" /> Generate 1-Day Story Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* FAQ, Cloud Vault info */}
            <div className="bg-[#12121E] rounded-3xl border border-white/5 p-8 relative overflow-hidden shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5.5 h-5.5 text-emerald-400" /> Secure Storage Subscription & Analytics
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Once a local lead engages, their vertical creatives are kept inside a high-fidelity Client Archive. We estimate directory usages dynamically and automatically charge monthly storage fee metrics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1C1C2A] p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Storage Tier</span>
                    <span className="text-xs text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/10 font-bold border border-emerald-400/20">Standard</span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">Standard Cloud Vault</div>
                  <div className="text-xs text-slate-500 mb-3">5 GB Allocated storage space</div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-1">
                    <div className="bg-emerald-400 h-full w-[12%]"></div>
                  </div>
                  <div className="text-[10px] text-slate-400">120 MB / 5,000 MB (12 campaigns stored)</div>
                </div>

                <div className="bg-[#1C1C2A] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Associated Fees</span>
                    <div className="text-2xl font-bold text-white mt-1">$2.99 / mo</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Flat secure archive upkeep fee mapped safely to active merchant billing triggers on Stripe.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SMARTPHONE CONTAINER (INTERACTIVE WHATSAPP BOT CHATBOT PROCESS SIMULATOR) */}
          <div className="lg:col-span-5 sticky top-24">
            
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" /> WhatsApp Growth Chatbot Simulation
              </div>
              <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></div>
            </div>

            {/* The Smartphone container */}
            <div className="w-full max-w-[360px] h-[640px] bg-[#0c0c14] border-4 border-slate-700/80 rounded-[40px] overflow-hidden shadow-2xl flex flex-col mx-auto relative relative">
              
              {/* Selfie Camera speaker Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-[#000000] z-30 flex justify-center items-center">
                <div className="w-16 h-3.5 bg-[#000000] rounded-b-md flex justify-center items-start">
                  <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
                </div>
              </div>

              {/* WhatsApp App Header Custom styled */}
              <div className="bg-[#0b141a] pt-6 pb-2.5 px-4 shadow-md flex items-center gap-3 border-b border-white/5 sticky top-0 z-20 shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border border-emerald-400 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img src="/B2P AVATAR.png" alt="Tror Specialist" className="w-9 h-9 object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b141a] rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold tracking-wide leading-tight">BrandToPost Bot</div>
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online Outreach Core
                  </div>
                </div>
                
                <div className="h-2.5 w-12 rounded bg-white/5 flex items-center justify-center text-[8px] font-mono text-slate-500">
                  SANDBOX
                </div>
              </div>

              {/* Chat Interface Content Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#0a0a0c] lg:bg-[#070b0d] space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {chatMessages.map((msg, index) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    
                    {/* Chat Balloon */}
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                      msg.sender === "user" 
                        ? "bg-[#005c4b] text-white rounded-tr-none" 
                        : "bg-[#202c33] text-slate-100 rounded-tl-none border border-white/5"
                    }`}>
                      
                      {/* Attached Image */}
                      {msg.attachedImage && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-white/10 shadow-sm relative">
                          <img src={msg.attachedImage} alt="User creative" className="w-full object-cover max-h-[160px]" referrerPolicy="no-referrer" />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[7px] text-white/85 uppercase font-mono font-bold tracking-wider">
                            Creative Backdrop
                          </div>
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && <div className="whitespace-pre-line">{msg.text}</div>}

                      {/* Interactive Leads outcome layout */}
                      {msg.interactiveLeadResults && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-white/5">
                          {msg.interactiveLeadResults.map(lead => (
                            <div key={lead.id} className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-[10px] space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-white truncate max-w-[120px]">{lead.name}</span>
                                <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${
                                  lead.outcome === "passed" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {lead.outcome === "passed" ? "Pass ✅" : "Skip ⚠️"}
                                </span>
                              </div>
                              <div className="text-slate-400">Mobile: {lead.phone}</div>
                              {lead.reason && (
                                <div className="text-[9px] text-amber-400 italic font-mono mt-0.5">{lead.reason}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Flyer custom card container */}
                      {msg.customCard && (
                        <div className="mt-3 bg-black rounded-xl p-2.5 border border-slate-700 overflow-hidden relative">
                          <img src={msg.customCard.image} alt="Lead cover" className="w-full h-24 object-cover rounded-lg mb-2" />
                          <div className="text-[10px] font-bold text-white mb-0.5">{msg.customCard.name}</div>
                          <div className="text-[9px] text-slate-450 truncate">📍 {msg.customCard.address}</div>
                          
                          <div className="mt-1.5 flex justify-between items-center text-[9px] bg-slate-900 hover:bg-slate-800 transition-colors p-1 rounded">
                            <span className="text-[#7C3AED] font-bold">WebP Compressed</span>
                            <span className="text-emerald-400 font-bold">{msg.customCard.compressedSize}</span>
                          </div>
                        </div>
                      )}

                      {/* Generated Story Image container */}
                      {msg.generatedStoryImage && (
                        <div className="mt-3 bg-black rounded-xl border border-slate-800 overflow-hidden relative shadow-lg">
                          <img src={msg.generatedStoryImage.imageUrl} alt="Generated Story" className="w-full h-auto object-cover max-h-[300px]" referrerPolicy="no-referrer" />
                          <div className="p-2.5 bg-[#141b21] border-t border-slate-800 flex justify-between items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-bold text-white truncate">{msg.generatedStoryImage.businessName}</div>
                              <div className="text-[8px] text-emerald-400 font-mono mt-0.5">High-Res JPEG Ready</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement("a");
                                link.download = `${msg.generatedStoryImage?.businessName || 'story'}_flyer.jpg`;
                                link.href = msg.generatedStoryImage?.imageUrl || '';
                                link.click();
                              }}
                              className="px-2 py-1 rounded bg-[#00a884] hover:bg-[#008f72] font-semibold text-[8px] text-white transition-colors flex-shrink-0"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Code dialog localized copy translation block */}
                      {msg.outreachTemplate && (
                        <div className="mt-3 bg-[#111b21] rounded-xl p-2 border border-emerald-500/20 relative">
                          <div className="text-[8px] text-slate-500 uppercase tracking-widest font-mono mb-1 font-semibold">Localized Dialect copy output ({msg.outreachTemplate.language})</div>
                          <div className="font-sans text-[10px] text-slate-200 leading-relaxed italic whitespace-pre-wrap bg-slate-950/80 p-2 rounded-lg border border-white/5">
                            {msg.outreachTemplate.copiedText}
                          </div>
                        </div>
                      )}

                      <div className="text-[8px] text-slate-400 text-right mt-1.5 font-mono">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                
                {isSimulating && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#202c33] px-3 py-2 rounded-xl rounded-tl-none border border-white/5 max-w-[120px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Scraping maps...</span>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Bot selection controls panel inside Phone */}
              <div className="bg-[#1c2226] p-3 border-t border-white/5 shrink-0">
                <div className="text-[9px] font-semibold text-slate-350 mb-2 uppercase tracking-wide">Launch Simulated Sandbox Search</div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[8px] text-slate-450 uppercase mb-0.5">Niche</label>
                    <select 
                      value={niche} 
                      onChange={(e) => setNiche(e.target.value)}
                      className="w-full bg-[#202c33] text-white border border-transparent rounded text-[10px] px-1 py-1 focus:outline-none"
                    >
                      <option value="Clinics & Dental Centers">🏥 Dental Clinics</option>
                      <option value="Ayurvedic Medicine Centers">🌿 Ayurvedic Stores</option>
                      <option value="Health Stores & Meds">💊 Chemists Shop</option>
                      <option value="Organic Superfoods">🥗 Organic Groceries</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-450 uppercase mb-0.5">Location</label>
                    <select 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#202c33] text-white border border-transparent rounded text-[10px] px-1 py-1 focus:outline-none"
                    >
                      <option value="South Delhi">Lajpat Nagar, DL</option>
                      <option value="Chelsea New York">Chelsea, NY</option>
                      <option value="Mumbai Central">Mumbai Central, MH</option>
                      <option value="Indiranagar Bangalore">Indiranagar, KA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRunSimulation(niche, location)}
                    disabled={isSimulating}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all rounded text-[10px] font-bold text-black"
                  >
                    <Zap className="w-3 h-3 fill-black/10" /> Run Pipeline Scan
                  </button>
                  <a
                    href={liveBotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-[#2583EB] text-[#2583EB] hover:bg-[#2583EB]/10 active:scale-95 transition-all rounded text-[10px] font-bold"
                  >
                    <Smartphone className="w-3 h-3" /> Connect Live Bot
                  </a>
                </div>
              </div>

              {/* Attached Image Thumbnail Preview bubble inside chat box */}
              {chatAttachedImage && (
                <div className="bg-[#10171d] px-3 pt-2 pb-0 flex items-center justify-between border-t border-white/5 shrink-0 relative">
                  <div className="relative rounded-lg overflow-hidden border border-white/10 h-10 w-10 flex-shrink-0">
                    <img src={chatAttachedImage} alt="Chat attachment" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setChatAttachedImage(null)}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-white text-[8px] flex items-center justify-center hover:bg-red-600 shadow-md font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-[9px] text-emerald-400 italic pl-2 font-mono flex-1 truncate">
                    Overlay image attached! Try Sending.
                  </div>
                </div>
              )}

              {/* Chat Input form bottom */}
              <form onSubmit={handleSendMessage} className="bg-[#10171d] px-3 py-2 flex items-center gap-1.5 border-t border-white/5 shrink-0 z-10">
                <input
                  type="file"
                  id="chat-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setChatAttachedImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => document.getElementById("chat-image-input")?.click()}
                  disabled={isSimulating || isChatBotGenerating}
                  className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-350 shrink-0 transition-colors cursor-pointer"
                  title="Attach Creative Background"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>

                <input
                  type="text"
                  placeholder={isChatBotGenerating ? "Ai is processing..." : "Type business query..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isSimulating || isChatBotGenerating}
                  className="flex-1 bg-[#202c33] text-white text-[11px] rounded-full px-3 py-1.5 focus:outline-none border border-transparent focus:border-emerald-500/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSimulating || isChatBotGenerating || (!inputValue.trim() && !chatAttachedImage)}
                  className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center text-white shrink-0 hover:bg-[#008f72] transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 fill-white/10" />
                </button>
              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
