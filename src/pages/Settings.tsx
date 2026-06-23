import { createPortal } from 'react-dom';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, CheckCircle2, HelpCircle, RefreshCw, UserPlus } from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";

const InstagramLogo = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ig-gradient" cx="30%" cy="107%" r="130%" fx="30%" fy="107%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-gradient)" />
    <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15.35C10.15 15.35 8.65 13.85 8.65 12C8.65 10.15 10.15 8.65 12 8.65C13.85 8.65 15.35 10.15 15.35 12C15.35 13.85 13.85 15.35 12 15.35ZM16.92 8C16.92 8.48 16.53 8.87 16.05 8.87C15.57 8.87 15.18 8.48 15.18 8C15.18 7.52 15.57 7.13 16.05 7.13C16.53 7.13 16.92 7.52 16.92 8Z" fill="white" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="white" strokeWidth="1.5" fill="none" />
  </svg>
);

const LinkedinLogo = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.7 19H4.9V10H7.7V19ZM6.3 8.8C5.4 8.8 4.7 8.1 4.7 7.2C4.7 6.3 5.4 5.6 6.3 5.6C7.2 5.6 7.9 6.3 7.9 7.2C7.9 8.1 7.2 8.8 6.3 8.8ZM19 19H16.2V14.6C16.2 13.5 16.2 12.1 14.7 12.1C13.1 12.1 12.9 13.3 12.9 14.5V19H10.1V10H12.8V11.2H12.8C13.2 10.5 14.1 9.8 15.4 9.8C18.2 9.8 18.7 11.6 18.7 14V19H19Z" fill="white" />
  </svg>
);

const FacebookLogo = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2"/>
  </svg>
);

const RedditLogo = () => (
  <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#FF4500" />
    <path d="M18.96 11.11a1.9 1.9 0 0 0-3.15-1.42 8.7 8.7 0 0 0-4.22-1.32l.86-2.73 2.8.6a1.44 1.44 0 1 0 1.44-1.42 1.44 1.44 0 0 0-1.39 1.09l-3.1-.66a.37.37 0 0 0-.44.25L10.87 8.35a8.76 8.76 0 0 0-4.25 1.33 1.9 1.9 0 0 0-3.13 1.43 1.88 1.88 0 0 0 .82 1.55 7.5 7.5 0 0 0-.08 1.13c0 3.19 3.93 5.78 8.77 5.78s8.77-2.59 8.77-5.78a7.14 7.14 0 0 0-.08-1.12 1.87 1.87 0 0 0 .88-1.56zm-11.83 2a1.08 1.08 0 1 1 1.08-1.08 1.08 1.08 0 0 1-1.08 1.08zm7.1 2.94a4.48 4.48 0 0 1-4.46 0 .37.37 0 0 1 .37-.64 3.73 3.73 0 0 0 3.72 0 .37.37 0 0 1 .37.64zm-.42-1.86a1.08 1.08 0 1 1 1.08-1.08 1.08 1.08 0 0 1-1.08 1.08z" fill="white" />
  </svg>
);

export function Settings() {
 const { activeProduct, updateProduct } = useProducts();
 const { user } = useAuth();
 const navigate = useNavigate();
 const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
 const [isFacebookConnected, setIsFacebookConnected] = useState(false);
 const [isInstagramConnected, setIsInstagramConnected] = useState(false);
 
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSavingGeminiKey, setIsSavingGeminiKey] = useState(false);
  const [geminiSuccessMsg, setGeminiSuccessMsg] = useState<string | null>(null);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
 const [instagramManualToken, setInstagramManualToken] = useState("");
 const [isSavingInstaToken, setIsSavingInstaToken] = useState(false);
 const [instaSuccessMsg, setInstaSuccessMsg] = useState<string | null>(null);
 const [isRedditConnected, setIsRedditConnected] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [linkedinOrgs, setLinkedinOrgs] = useState<any[]>([]);
 const [showOrgModal, setShowOrgModal] = useState(false);
 const [isSelectingOrg, setIsSelectingOrg] = useState(false);

 const [whatsappToken, setWhatsappToken] = useState("");
 const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
 const [whatsappBotNumber, setWhatsappBotNumber] = useState("");
 const [waWebhookKey, setWaWebhookKey] = useState("TROR_WEBHOOK_SECURE_KEY");
 const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
 const [whatsappSuccessMsg, setWhatsappSuccessMsg] = useState<string | null>(null);
 const [showWhatsappDev, setShowWhatsappDev] = useState(false);

 const [showLinkedinDev, setShowLinkedinDev] = useState(false);
 const [showFacebookDev, setShowFacebookDev] = useState(false);
 const [showInstagramDev, setShowInstagramDev] = useState(false);
 const [showRedditDev, setShowRedditDev] = useState(false);

  useEffect(() => {
    if (!activeProduct) return;
    
    let isCancelled = false;

    const loadStatuses = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers: HeadersInit = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const fetchStatus = async (platform: string) => {
          try {
            const res = await fetch(`/api/${platform}/status?productId=${activeProduct.id}`, { headers });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return !!data.connected;
          } catch (e) {
            logSilentError(e as Error, { context: `fetch${platform.charAt(0).toUpperCase() + platform.slice(1)}Status` });
            return false;
          }
        };

        const [linkedinConnected, facebookConnected, instagramConnected, redditConnected] = await Promise.all([
          fetchStatus('linkedin'),
          fetchStatus('facebook'),
          fetchStatus('instagram'),
          fetchStatus('reddit')
        ]);

        if (!isCancelled) {
          setIsLinkedinConnected(linkedinConnected);
          setIsFacebookConnected(facebookConnected);
          setIsInstagramConnected(instagramConnected);
          setIsRedditConnected(redditConnected);
        }

        try {
          const res = await fetch(`/api/whatsapp/config?productId=${activeProduct.id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled) {
              setWhatsappToken(data.token || "");
              setWhatsappPhoneId(data.phoneNumberId || "");
              setWaWebhookKey(data.webhookVerifyToken || "TROR_WEBHOOK_SECURE_KEY");
              setWhatsappBotNumber(data.botPhoneNumber || "");
            }
          }
        } catch (e) {
          logSilentError(e as Error, { context: "fetchWhatsappConfig" });
        }

        try {
          const res = await fetch(`/api/config/gemini?productId=${activeProduct.id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (!isCancelled) {
              setIsGeminiConfigured(data.configured);
              if (data.configured) {
                setGeminiApiKey(data.maskedKey || "");
              }
            }
          }
        } catch (e) {
          logSilentError(e as Error, { context: "fetchGeminiConfig" });
        }
      } catch (err) {
        logSilentError(err as Error, { context: "loadStatuses" });
      }
    };

    loadStatuses();

    const fetchLinkedinOrganizations = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/linkedin/organizations?productId=${activeProduct.id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error('Failed to fetch orgs');
        const data = await res.json();
        if (data.organizations && data.organizations.length > 0) {
          setLinkedinOrgs(data.organizations);
          setShowOrgModal(true);
        } else {
          setIsLinkedinConnected(true);
        }
      } catch (err) {
        logSilentError(err as Error, { context: "fetchLinkedinOrganizations" });
        setIsLinkedinConnected(true); // Fallback to personal profile
      }
    };

    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the same origin
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchLinkedinOrganizations();
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_FACEBOOK') setIsFacebookConnected(true);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_INSTAGRAM') setIsInstagramConnected(true);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_REDDIT') setIsRedditConnected(true);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      isCancelled = true;
      window.removeEventListener('message', handleMessage);
    };
  }, [activeProduct, user]);

  const handleSaveWhatsappConfig = async () => {
    if (!activeProduct) return;
    setIsSavingWhatsapp(true);
    setError(null);
    setWhatsappSuccessMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          productId: activeProduct.id,
          token: whatsappToken.trim(), 
          phoneNumberId: whatsappPhoneId.trim(),
          webhookVerifyToken: waWebhookKey.trim(),
          botPhoneNumber: whatsappBotNumber.trim()
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save config');
      }
      setWhatsappSuccessMsg('WhatsApp Business configurations saved successfully!');
      setTimeout(() => setWhatsappSuccessMsg(null), 5000);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleSaveWhatsappConfig" });
      setError(err.message || 'Failed to connect WhatsApp configurations.');
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleSaveGeminiConfig = async () => {
    if (!activeProduct) return;
    setIsSavingGeminiKey(true);
    setError(null);
    setGeminiSuccessMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/config/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          productId: activeProduct.id,
          geminiApiKey: geminiApiKey.trim()
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save Gemini API key');
      }
      setGeminiSuccessMsg('Gemini API Key saved successfully!');
      setIsGeminiConfigured(!!geminiApiKey.trim());
      setTimeout(() => setGeminiSuccessMsg(null), 5000);
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleSaveGeminiConfig" });
      setError(err.message || 'Failed to save Gemini API key.');
    } finally {
      setIsSavingGeminiKey(false);
    }
  };

 const handleSelectOrganization = async (orgUrn: string) => {
   if (!activeProduct) return;
   setIsSelectingOrg(true);
   try {
     const token = await auth.currentUser?.getIdToken();
     const res = await fetch('/api/linkedin/select-organization', {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       },
       body: JSON.stringify({ productId: activeProduct.id, organizationUrn: orgUrn })
     });
     if (!res.ok) throw new Error('Failed to select organization');
     setShowOrgModal(false);
     setIsLinkedinConnected(true);
   } catch (err) {
     logSilentError(err as Error, { context: "handleSelectOrganization" });
     setError('Failed to select organization.');
   } finally {
     setIsSelectingOrg(false);
   }
 };

 const handleConnectLinkedin = async () => {
   if (!activeProduct) return;
   try {
     const token = await auth.currentUser?.getIdToken();
     const response = await fetch(`/api/auth/linkedin/url?productId=${activeProduct.id}`, {
       headers: {
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       }
     });
     if (!response.ok) throw new Error('Failed to get auth URL');
     const { url } = await response.json();
     const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
     if (!authWindow) setError('Please allow popups for this site to connect your account.');
   } catch (error) {
     logSilentError(error as Error, { context: "handleConnectLinkedin" });
     setError('Failed to initiate LinkedIn connection.');
   }
 };

 const handleConnectFacebook = async () => {
   if (!activeProduct) return;
   try {
     const token = await auth.currentUser?.getIdToken();
     const response = await fetch(`/api/auth/facebook/url?productId=${activeProduct.id}`, {
       headers: {
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       }
     });
     if (!response.ok) throw new Error('Failed to get auth URL');
     const { url } = await response.json();
     const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
     if (!authWindow) setError('Please allow popups for this site to connect your account.');
   } catch (error) {
     logSilentError(error as Error, { context: "handleConnectFacebook" });
     setError('Failed to initiate Facebook connection.');
   }
 };

 const handleConnectInstagram = async () => {
   if (!activeProduct) return;
   try {
     const token = await auth.currentUser?.getIdToken();
     const response = await fetch(`/api/auth/instagram/url?productId=${activeProduct.id}`, {
       headers: {
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       }
     });
     if (!response.ok) throw new Error('Failed to get auth URL');
     const { url } = await response.json();
     const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
     if (!authWindow) setError('Please allow popups for this site to connect your account.');
   } catch (error) {
     logSilentError(error as Error, { context: "handleConnectInstagram" });
     setError('Failed to initiate Instagram connection.');
   }
 };

 const handleSaveInstagramManualToken = async () => {
 if (!activeProduct || !instagramManualToken.trim()) return;
 setIsSavingInstaToken(true);
 setError(null);
 setInstaSuccessMsg(null);
 try {
 const token = await auth.currentUser?.getIdToken();
 const response = await fetch('/api/instagram/manual-token', {
 method: 'POST',
 headers: { 
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({ token: instagramManualToken.trim(), productId: activeProduct.id })
 });
 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error || 'Failed to save token');
 }
 setIsInstagramConnected(true);
 setInstagramManualToken('');
 setInstaSuccessMsg('Success! Your tester token/access code connected.');
 setTimeout(() => setInstaSuccessMsg(null), 5000);
 } catch (err: any) {
 logSilentError(err as Error, { context: "handleSaveInstagramManualToken" });
 setError(err.message || 'Failed to connect Instagram custom token.');
 } finally {
 setIsSavingInstaToken(false);
 }
 };

 const handleConnectReddit = async () => {
   if (!activeProduct) return;
   try {
     const token = await auth.currentUser?.getIdToken();
     const response = await fetch(`/api/auth/reddit/url?productId=${activeProduct.id}`, {
       headers: {
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       }
     });
     if (!response.ok) throw new Error('Failed to get auth URL');
     const { url } = await response.json();
     const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
     if (!authWindow) setError('Please allow popups for this site to connect your account.');
   } catch (error) {
     logSilentError(error as Error, { context: "handleConnectReddit" });
     setError('Failed to initiate Reddit connection.');
   }
 };

 const handleDisconnect = async (platform: string) => {
   if (!activeProduct) return;
   try {
     setError(null);
     const token = await auth.currentUser?.getIdToken();
     const response = await fetch('/api/disconnect', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
       },
       body: JSON.stringify({ productId: activeProduct.id, platform })
     });
     if (!response.ok) {
       const errData = await response.json();
       throw new Error(errData.error || `Failed to disconnect from ${platform}`);
     }
     
     if (platform === 'linkedin') setIsLinkedinConnected(false);
     if (platform === 'facebook') setIsFacebookConnected(false);
     if (platform === 'instagram') setIsInstagramConnected(false);
     if (platform === 'reddit') setIsRedditConnected(false);
   } catch (err: any) {
     logSilentError(err as Error, { context: "handleDisconnect" });
     setError(err.message || `Failed to disconnect ${platform}.`);
   }
 };

 if (!activeProduct) {
 return <div className="p-8">Please select or create a product first.</div>;
 }

 const platforms = [
   {
     id: "instagram",
     name: "Instagram",
     isConnected: isInstagramConnected,
     connectFn: handleConnectInstagram,
     disconnectFn: () => handleDisconnect("instagram"),
     logo: <InstagramLogo />,
     showDev: showInstagramDev,
     setShowDev: setShowInstagramDev,
     devSetup: (
       <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg w-full animate-in slide-in-from-top-2 duration-200 text-left">
         <div className="mb-4">
           <p className="font-semibold text-emerald-600 mb-1">💡 Sandbox / Tester Access (Instant Connect):</p>
           <p className="mb-2 text-slate-600">
             Standard "Connect" requires custom Meta Developer client credentials. If you are a tester or have your own 
             <strong> Instagram User Access Token (starts with IGAAN...)</strong>, you can paste it below to connect instantly:
           </p>
           <div className="flex flex-col sm:flex-row gap-2 mt-2">
             <input
               type="text"
               value={instagramManualToken}
               onChange={(e) => setInstagramManualToken(e.target.value)}
               placeholder="Paste token (starts with IGAANKiw...)"
               className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7C3AED]/85"
             />
             <button
                onClick={handleSaveInstagramManualToken}
                disabled={isSavingInstaToken || !instagramManualToken.trim()}
                className="h-8 px-4 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
             >
               {isSavingInstaToken ? "Saving..." : "Save Token"}
             </button>
           </div>
           {instaSuccessMsg && (
             <p className="text-emerald-600 font-medium mt-2">{instaSuccessMsg}</p>
           )}
         </div>

         <div className="border-t border-[#7C3AED]/15 pt-3">
           <p className="font-semibold text-slate-800 mb-1">Standard Setup (Facebook Login & Instagram API Use Case):</p>
           <p className="mt-2 text-slate-600">1. On the <strong className="text-slate-800">Facebook Login for Business &gt; Settings</strong> screen you are viewing, paste the redirect URI below into the <strong className="text-slate-800">Valid OAuth Redirect URIs</strong> input field and click Save Changes:</p>
           <ul className="list-disc pl-4 mt-2 space-y-2 font-mono text-[10px] text-purple-700 break-all mb-4 select-all">
             <li>{window.location.origin}/api/auth/instagram/callback</li>
             <li>{window.location.origin.replace("ais-dev-", "ais-pre-")}/api/auth/instagram/callback</li>
           </ul>
           <p className="mt-3 text-slate-600">2. <strong className="text-amber-600">Important Testing Step (Roles):</strong> Since your Meta App is in Development mode, only register/connected accounts of registered testers will work. Go to <strong className="text-slate-800">App roles &gt; Roles &gt; Instagram Testers</strong>, click <strong className="text-slate-800">Add Instagram Testers</strong>, and type your personal Instagram username.</p>
           <p className="mt-1.5 text-xs text-slate-500">3. Log into your personal Instagram account on your browser, go to <strong className="text-slate-800">Settings &gt; Apps and Websites &gt; Tester invites</strong>, and accept the invite.</p>
           <p className="mt-3 text-xs text-emerald-600">✔ <strong className="font-semibold">No Webhooks Needed:</strong> Webhook subscription is optional and not required just to post/publish content in draft mode.</p>
         </div>
       </div>
     )
   },
   {
     id: "linkedin",
     name: "LinkedIn",
     isConnected: isLinkedinConnected,
     connectFn: handleConnectLinkedin,
     disconnectFn: () => handleDisconnect("linkedin"),
     logo: <LinkedinLogo />,
     showDev: showLinkedinDev,
     setShowDev: setShowLinkedinDev,
     devSetup: (
       <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg w-full animate-in slide-in-from-top-2 duration-200 text-left">
         <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
         <p>Make sure you have added the following Authorized Redirect URIs in your LinkedIn Developer App:</p>
         <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
           <li>{window.location.origin}/api/auth/linkedin/callback</li>
         </ul>
       </div>
     )
   },
   {
     id: "facebook",
     name: "Facebook",
     isConnected: isFacebookConnected,
     connectFn: handleConnectFacebook,
     disconnectFn: () => handleDisconnect("facebook"),
     logo: <FacebookLogo />,
     showDev: showFacebookDev,
     setShowDev: setShowFacebookDev,
     devSetup: (
       <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg w-full animate-in slide-in-from-top-2 duration-200 text-left">
         <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
         <p>Make sure you have added the following Valid OAuth Redirect URIs in your Facebook App:</p>
         <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
           <li>{window.location.origin}/api/auth/facebook/callback</li>
         </ul>
       </div>
     )
   },
   {
     id: "reddit",
     name: "Reddit",
     isConnected: isRedditConnected,
     connectFn: handleConnectReddit,
     disconnectFn: () => handleDisconnect("reddit"),
     logo: <RedditLogo />,
     showDev: showRedditDev,
     setShowDev: setShowRedditDev,
     devSetup: (
       <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg w-full animate-in slide-in-from-top-2 duration-200 text-left">
         <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
         <p>Make sure you have added the following redirect uri in your Reddit App:</p>
         <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
           <li>{window.location.origin}/api/auth/reddit/callback</li>
         </ul>
       </div>
     )
   }
 ];

 const firstUnconnectedIndex = platforms.findIndex((p) => !p.isConnected);

 return (
 <div className="space-y-8 w-full max-w-6xl animate-in fade-in duration-500">
  <div className="tour-settings-header">
  <h1 className="text-4xl font-bold tracking-tight text-slate-800">Settings</h1>
  <p className="mt-2 text-sm text-slate-500">
  Manage your account settings and integrations for <span className="font-semibold text-slate-800">{activeProduct.name}</span>.
  </p>
  </div>

 {error && (
 <div className="glass-panel border-red-500/20 bg-red-500/10 p-4">
 <p className="text-sm text-red-500">{error}</p>
 </div>
 )}

 <div className="glass-panel p-8 space-y-8">
 
 {/* Integrations Section */}
 <div>
 <h3 className="text-lg font-semibold leading-6 text-slate-800">Social Media</h3>
 <p className="mt-1 text-sm text-slate-500 mb-6">
 Connect your social accounts to publish campaigns directly.
 </p>

 <div className="flex flex-col gap-3 mt-4">
   {platforms.map((platform, idx) => {
     const isNextUp = idx === firstUnconnectedIndex;
     
     return (
       <div
         key={platform.id}
         className={`w-full transition-all duration-300 px-4 sm:px-5 py-4 ${
           isNextUp
             ? "border border-slate-200 bg-white/60 rounded-2xl shadow-sm animate-in fade-in duration-300"
             : ""
         }`}
       >
         <div className="flex items-center justify-between w-full">
           {/* Left Side: Logo, Name */}
           <div className="flex items-center gap-3">
             {platform.logo}
             <span className="text-sm sm:text-base font-semibold text-slate-800">
               {platform.name}
             </span>
           </div>

           {/* Right Side: Status and Connect/Disconnect */}
           <div className="flex items-center gap-3">
             {platform.isConnected ? (
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-lg text-xs font-semibold">
                   <CheckCircle2 className="h-3.5 w-3.5" />
                   Connected
                 </div>
                 <button
                   onClick={platform.disconnectFn}
                   className="text-xs text-red-600 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-all font-medium"
                 >
                   Disconnect
                 </button>
               </div>
             ) : (
               <div className="flex items-center gap-2">
                 {isNextUp && (
                   <span className="text-xs sm:text-sm text-slate-400 font-medium mr-1 flex items-center gap-1">
                     Next up <span className="text-base leading-none">→</span>
                   </span>
                 )}
                 <button
                   onClick={platform.connectFn}
                   className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm ${
                     isNextUp
                       ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                       : "bg-white hover:bg-[#7C3AED]/5 text-[#7C3AED] border border-[#7C3AED]/20"
                   }`}
                 >
                   <UserPlus className="h-4 w-4" />
                   Connect
                 </button>
               </div>
             )}
           </div>
         </div>

         {/* Developer Settings Section */}
         {!platform.isConnected && (
           <div className={`text-left ${isNextUp ? "mt-2" : "mt-1 pl-9"}`}>
             <button
               onClick={() => platform.setShowDev(!platform.showDev)}
               className="text-[10px] sm:text-xs text-[#A855F7] hover:text-[#C084FC] font-semibold transition-colors focus:outline-none flex items-center gap-1"
             >
               {platform.showDev ? "✕ Hide Developer Setup" : "⚙️ Show Developer Setup"}
             </button>
             {platform.showDev && platform.devSetup}
           </div>
         )}
       </div>
     );
   })}
 </div>
 </div>

  {/* API Config Section */}
  <div className="border-t border-[#7C3AED]/15 pt-8">
    <h3 className="text-lg font-semibold leading-6 text-slate-800">API Configuration</h3>
    <p className="mt-1 text-sm text-slate-500 mb-4">
      Configure your Google Gemini AI API key below. If not configured, the application will attempt to use the host environment variable fallback.
    </p>

    <div className="max-w-md space-y-3">
      {geminiSuccessMsg && (
        <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl">
          {geminiSuccessMsg}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="password"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          placeholder={isGeminiConfigured ? "••••••••••••••••" : "Enter your GEMINI_API_KEY"}
          className="flex-1 bg-slate-50/80 border border-slate-200 focus:border-[#7C3AED] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-450 outline-none transition-all"
        />
        <button
          onClick={handleSaveGeminiConfig}
          disabled={isSavingGeminiKey}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          {isSavingGeminiKey ? "Saving..." : "Save Key"}
        </button>
      </div>
      <p className="text-[10px] text-slate-400 leading-normal">
        {isGeminiConfigured 
          ? "✅ Gemini API Key is configured and saved for this product." 
          : "⚠️ No custom API key set. The system will fall back to default server keys."}
      </p>
    </div>
  </div>

  {/* Guided Tour & Setup Wizard Management Section */}
  <div className="border-t border-[#7C3AED]/15 pt-8">
    <h3 className="text-lg font-semibold leading-6 text-slate-800">Help & Guided Tour</h3>
    <p className="mt-1 text-sm text-slate-500 mb-6">
      Control your guided tour settings and onboarding parameters.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="glass-card p-5 border border-slate-200/60 bg-slate-50/50 flex flex-col justify-between items-start gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#7C3AED]" /> Interactive App Tour
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Runs the step-by-step interactive spotlight guide. It will point out the different sidebar tabs, switcher widgets, and page commands.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("start-tror-tour"));
          }}
          className="glass-button rounded-xl text-[#7C3AED] hover:text-white hover:bg-[#7C3AED] border-[#7C3AED]/20 hover:border-[#7C3AED] px-4.5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
        >
          Restart Guided Tour
        </button>
      </div>

      <div className="glass-card p-5 border border-slate-200/60 bg-slate-50/50 flex flex-col justify-between items-start gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" /> Onboarding Setup Wizard
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Clears your brand's onboarding state and returns you to the multi-step Brand Scan and setup wizard to re-test the complete campaign generation process.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!user) return;
            try {
              localStorage.removeItem(`onboardingCompleted_${user.uid}`);
              localStorage.removeItem(`dashboardTourCompleted_${user.uid}`);
              
              // Mark as NOT onboarded in Firestore user profile
              await setDoc(doc(db, "users", user.uid), { onboarded: false }, { merge: true });
              
              if (activeProduct) {
                await updateProduct(activeProduct.id, { website: "" });
              }
              navigate("/onboarding");
            } catch (e) {
              console.error("Failed to reset onboarding:", e);
              navigate("/onboarding");
            }
          }}
          className="glass-button rounded-xl text-emerald-600 hover:text-white hover:bg-emerald-600 border-emerald-500/20 hover:border-emerald-600 px-4.5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
        >
          Reset Setup Wizard
        </button>
      </div>
    </div>
  </div>

  {/* Data Management Section */}
 <div className="border-t border-[#7C3AED]/15 pt-8">
 <h3 className="text-lg font-semibold leading-6 text-red-600">Danger Zone</h3>
 <p className="mt-1 text-sm text-slate-500 mb-4">
 Clear your local data including Brand Position and generated campaigns. This action cannot be undone.
 </p>
 <button
 type="button"
 onClick={async () => {
 if (user) {
 try {
 const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid));
 const productsSnapshot = await getDocs(productsQuery);
 const deleteProducts = productsSnapshot.docs.map(doc => deleteDoc(doc.ref));

 const campaignsQuery = query(collection(db, 'campaigns'), where('userId', '==', user.uid));
 const campaignsSnapshot = await getDocs(campaignsQuery);
 const deleteCampaigns = campaignsSnapshot.docs.map(doc => deleteDoc(doc.ref));

 await Promise.all([...deleteProducts, ...deleteCampaigns]);
 } catch (error) {
 handleFirestoreError(error, OperationType.DELETE, 'products/campaigns');
 }
 }
 localStorage.removeItem("campaigns");
 localStorage.removeItem("products");
 if (user) localStorage.removeItem(`activeProductId_${user.uid}`);
 window.location.reload();
 }}
 className="glass-button rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20 px-4 py-2 text-sm"
 >
 <Trash2 className="mr-2 h-4 w-4" />
 Clear All Data
 </button>
 </div>

 </div>

 {/* LinkedIn Organization Modal */}
 {showOrgModal && createPortal(
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6 m-4 border border-slate-200">
 <h3 className="text-xl font-bold text-slate-800 mb-2">Select LinkedIn Page</h3>
 <p className="text-sm text-slate-500 mb-6">
 Which LinkedIn page should we post to for <strong className="text-slate-800">{activeProduct?.name}</strong>?
 </p>
 
 <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
 <button
 onClick={() => handleSelectOrganization('')}
 disabled={isSelectingOrg}
 className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-[#0a66c2] hover:bg-slate-50 transition-colors flex items-center justify-between"
 >
 <span className="font-medium text-slate-800">Personal Profile</span>
 </button>
 
 {linkedinOrgs.map((org) => (
 <button
 key={org.id}
 onClick={() => handleSelectOrganization(org.urn)}
 disabled={isSelectingOrg}
 className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-[#0a66c2] hover:bg-slate-50 transition-colors flex items-center justify-between"
 >
 <span className="font-medium text-slate-800">{org.name}</span>
 <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Company Page</span>
 </button>
 ))}
 </div>
 
 <div className="flex justify-end">
 <button
 onClick={() => setShowOrgModal(false)}
 className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
 >
 Cancel
 </button>
  </div>
  </div>
  </div>,
  document.body
)}
  </div>
  );
}
