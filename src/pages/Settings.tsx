import { createPortal } from 'react-dom';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Linkedin, Trash2, CheckCircle2, Facebook, Instagram, HelpCircle, RefreshCw } from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";

export function Settings() {
 const { activeProduct, updateProduct } = useProducts();
 const { user } = useAuth();
 const navigate = useNavigate();
 const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
 const [isFacebookConnected, setIsFacebookConnected] = useState(false);
 const [isInstagramConnected, setIsInstagramConnected] = useState(false);
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
 <h3 className="text-lg font-semibold leading-6 text-slate-800">Integrations</h3>
 <p className="mt-1 text-sm text-slate-500 mb-6">
 Connect your social accounts to publish campaigns directly.
 </p>
 
 <div className="tour-linkedin-card glass-card p-4 sm:p-5 flex flex-col gap-4 w-full">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-4">
 <div className="h-10 w-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white shrink-0">
 <Linkedin className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-800">LinkedIn</p>
 <p className="text-xs text-slate-500">Publish posts and articles directly to your profile.</p>
 </div>
 </div>
 {isLinkedinConnected ? (
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
   <div className="flex items-center gap-2 text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
     <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
     <span className="text-sm font-medium">Connected</span>
   </div>
   <button
     onClick={() => handleDisconnect('linkedin')}
     className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/10 rounded-lg px-2.5 py-1.5 hover:bg-red-500/20 transition-all font-medium inline-flex items-center justify-center shrink-0"
   >
     Disconnect
   </button>
 </div>
 ) : (
 <button
 onClick={handleConnectLinkedin}
 className="glass-button-primary rounded-lg px-4 py-2 text-sm w-full sm:w-auto shrink-0 inline-flex items-center justify-center"
 >
 Connect
 </button>
 )}
 </div>
 
 {!isLinkedinConnected && (
  <div className="mt-2 text-left">
    <button
      onClick={() => setShowLinkedinDev(!showLinkedinDev)}
      className="text-xs text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors focus:outline-none"
    >
      {showLinkedinDev ? '✕ Hide Developer Setup' : '⚙️ Show Developer Setup'}
    </button>
    {showLinkedinDev && (
      <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg">
        <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
        <p>Make sure you have added the following Authorized Redirect URIs in your LinkedIn Developer App:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
          <li>{window.location.origin}/api/auth/linkedin/callback</li>
        </ul>
      </div>
    )}
  </div>
 )}
 </div>

 <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 w-full">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-4">
 <div className="h-10 w-10 bg-[#1877F2] rounded-lg flex items-center justify-center text-white shrink-0">
 <Facebook className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-800">Facebook</p>
 <p className="text-xs text-slate-500">Publish posts to your Facebook Pages.</p>
 </div>
 </div>
 {isFacebookConnected ? (
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
   <div className="flex items-center gap-2 text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
     <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
     <span className="text-sm font-medium">Connected</span>
   </div>
   <button
     onClick={() => handleDisconnect('facebook')}
     className="text-xs text-red-600 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-all font-medium inline-flex items-center justify-center shrink-0"
   >
     Disconnect
   </button>
 </div>
 ) : (
 <button
 onClick={handleConnectFacebook}
 className="glass-button-primary rounded-lg px-4 py-2 text-sm w-full sm:w-auto shrink-0 inline-flex items-center justify-center"
 >
 Connect
 </button>
 )}
 </div>
 {!isFacebookConnected && (
  <div className="mt-2 text-left">
    <button
      onClick={() => setShowFacebookDev(!showFacebookDev)}
      className="text-xs text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors focus:outline-none"
    >
      {showFacebookDev ? '✕ Hide Developer Setup' : '⚙️ Show Developer Setup'}
    </button>
    {showFacebookDev && (
      <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg">
        <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
        <p>Make sure you have added the following Valid OAuth Redirect URIs in your Facebook App:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
          <li>{window.location.origin}/api/auth/facebook/callback</li>
        </ul>
      </div>
    )}
  </div>
 )}
 </div>

 <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 w-full">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-4">
 <div className="h-10 w-10 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-lg flex items-center justify-center text-white shrink-0">
 <Instagram className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-800">Instagram</p>
 <p className="text-xs text-slate-500">Publish photos and reels to your Instagram account.</p>
 </div>
 </div>
 {isInstagramConnected ? (
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
   <div className="flex items-center gap-2 text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
     <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
     <span className="text-sm font-medium">Connected</span>
   </div>
   <button
     onClick={() => handleDisconnect('instagram')}
     className="text-xs text-red-600 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-all font-medium inline-flex items-center justify-center shrink-0"
   >
     Disconnect
   </button>
 </div>
 ) : (
 <button
 onClick={handleConnectInstagram}
 className="glass-button-primary rounded-lg px-4 py-2 text-sm w-full sm:w-auto shrink-0 inline-flex items-center justify-center"
 >
 Connect
 </button>
 )}
 </div>
 {!isInstagramConnected && (
  <div className="mt-2 text-left">
    <button
      onClick={() => setShowInstagramDev(!showInstagramDev)}
      className="text-xs text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors focus:outline-none"
    >
      {showInstagramDev ? '✕ Hide Developer / Sandbox Setup' : '⚙️ Show Developer / Sandbox Setup'}
    </button>
    {showInstagramDev && (
      <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg">
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
               className="h-8 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
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
    )}
  </div>
 )}
 </div>

 <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 w-full">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start sm:items-center gap-4">
 <div className="h-10 w-10 bg-[#FF4500] rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
 r/
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-800">Reddit</p>
 <p className="text-xs text-slate-500">Publish posts to subreddits.</p>
 </div>
 </div>
 {isRedditConnected ? (
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
   <div className="flex items-center gap-2 text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
     <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
     <span className="text-sm font-medium">Connected</span>
   </div>
   <button
     onClick={() => handleDisconnect('reddit')}
     className="text-xs text-red-600 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-all font-medium inline-flex items-center justify-center shrink-0"
   >
     Disconnect
   </button>
 </div>
 ) : (
 <button
 onClick={handleConnectReddit}
 className="glass-button-primary rounded-lg px-4 py-2 text-sm w-full sm:w-auto shrink-0 inline-flex items-center justify-center"
 >
 Connect
 </button>
 )}
 </div>
 {!isRedditConnected && (
  <div className="mt-2 text-left">
    <button
      onClick={() => setShowRedditDev(!showRedditDev)}
      className="text-xs text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors focus:outline-none"
    >
      {showRedditDev ? '✕ Hide Developer Setup' : '⚙️ Show Developer Setup'}
    </button>
    {showRedditDev && (
      <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 p-3 rounded-lg">
        <p className="font-semibold text-slate-800 mb-1">Setup Instructions:</p>
        <p>Make sure you have added the following redirect uri in your Reddit App:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-slate-500 break-all">
          <li>{window.location.origin}/api/auth/reddit/callback</li>
        </ul>
      </div>
    )}
  </div>
 )}
 </div>
 </div>

 {/* API Config Section */}
 <div className="border-t border-[#7C3AED]/15 pt-8">
 <h3 className="text-lg font-semibold leading-6 text-slate-800">API Configuration</h3>
 <p className="mt-1 text-sm text-slate-500">
 Your Gemini API key is automatically injected by the AI Studio environment.
  </p>
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
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 border border-slate-200">
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
