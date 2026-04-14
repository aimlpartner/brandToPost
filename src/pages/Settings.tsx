import { useState, useEffect } from "react";
import { Linkedin, Trash2, CheckCircle2, Facebook, Instagram } from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";

export function Settings() {
  const { activeProduct } = useProducts();
  const { user } = useAuth();
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isRedditConnected, setIsRedditConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProduct) return;
    
    fetch(`/api/linkedin/status?productId=${activeProduct.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setIsLinkedinConnected(data.connected))
      .catch(err => logSilentError(err as Error, { context: "fetchLinkedinStatus" }));

    fetch(`/api/facebook/status?productId=${activeProduct.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setIsFacebookConnected(data.connected))
      .catch(err => logSilentError(err as Error, { context: "fetchFacebookStatus" }));

    fetch(`/api/instagram/status?productId=${activeProduct.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setIsInstagramConnected(data.connected))
      .catch(err => logSilentError(err as Error, { context: "fetchInstagramStatus" }));

    fetch(`/api/reddit/status?productId=${activeProduct.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setIsRedditConnected(data.connected))
      .catch(err => logSilentError(err as Error, { context: "fetchRedditStatus" }));

    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the same origin
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') setIsLinkedinConnected(true);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_FACEBOOK') setIsFacebookConnected(true);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_INSTAGRAM') setIsInstagramConnected(true);
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS_REDDIT') setIsRedditConnected(true);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeProduct]);

  const handleConnectLinkedin = async () => {
    if (!activeProduct) return;
    try {
      const response = await fetch(`/api/auth/linkedin/url?productId=${activeProduct.id}`);
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
      const response = await fetch(`/api/auth/facebook/url?productId=${activeProduct.id}`);
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
      const response = await fetch(`/api/auth/instagram/url?productId=${activeProduct.id}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setError('Please allow popups for this site to connect your account.');
    } catch (error) {
      logSilentError(error as Error, { context: "handleConnectInstagram" });
      setError('Failed to initiate Instagram connection.');
    }
  };

  const handleConnectReddit = async () => {
    if (!activeProduct) return;
    try {
      const response = await fetch(`/api/auth/reddit/url?productId=${activeProduct.id}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setError('Please allow popups for this site to connect your account.');
    } catch (error) {
      logSilentError(error as Error, { context: "handleConnectReddit" });
      setError('Failed to initiate Reddit connection.');
    }
  };

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#111827]">Settings</h1>
        <p className="mt-2 text-sm text-[#ff8566]">
          Manage your account settings and integrations for <span className="font-semibold text-[#111827]">{activeProduct.name}</span>.
        </p>
      </div>

      {error && (
        <div className="glass-panel border-red-200/50 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="glass-panel p-8 space-y-8">
        
        {/* Integrations Section */}
        <div>
          <h3 className="text-lg font-semibold leading-6 text-[#111827]">Integrations</h3>
          <p className="mt-1 text-sm text-[#ff8566] mb-6">
            Connect your social accounts to publish campaigns directly.
          </p>
          
          <div className="glass-card p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-10 w-10 bg-[#0A66C2] rounded-lg flex items-center justify-center text-white shrink-0">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">LinkedIn</p>
                  <p className="text-xs text-[#ff8566]">Publish posts and articles directly to your profile.</p>
                </div>
              </div>
              {isLinkedinConnected ? (
                <div className="flex items-center gap-2 text-[#111827] bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 w-fit">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectLinkedin}
                  className="glass-button-primary px-4 py-2 text-sm w-full sm:w-auto shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
            
            {!isLinkedinConnected && (
                <div className="mt-2 text-xs text-[#ff8566] glass-panel p-3">
                <p className="font-semibold text-[#4b5563] mb-1">Setup Instructions:</p>
                <p>Make sure you have added the following Authorized Redirect URIs in your LinkedIn Developer App:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-[#6b7280] break-all">
                  <li>{window.location.origin}/api/auth/linkedin/callback</li>
                </ul>
              </div>
            )}
          </div>

          <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-10 w-10 bg-[#1877F2] rounded-lg flex items-center justify-center text-white shrink-0">
                  <Facebook className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Facebook</p>
                  <p className="text-xs text-[#ff8566]">Publish posts to your Facebook Pages.</p>
                </div>
              </div>
              {isFacebookConnected ? (
                <div className="flex items-center gap-2 text-[#111827] bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 w-fit">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectFacebook}
                  className="glass-button-primary px-4 py-2 text-sm w-full sm:w-auto shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
            {!isFacebookConnected && (
              <div className="mt-2 text-xs text-[#ff8566] glass-panel p-3">
                <p className="font-semibold text-[#4b5563] mb-1">Setup Instructions:</p>
                <p>Make sure you have added the following Valid OAuth Redirect URIs in your Facebook App:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-[#6b7280] break-all">
                  <li>{window.location.origin}/api/auth/facebook/callback</li>
                </ul>
              </div>
            )}
          </div>

          <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-10 w-10 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-lg flex items-center justify-center text-white shrink-0">
                  <Instagram className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Instagram</p>
                  <p className="text-xs text-[#ff8566]">Publish photos and reels to your Instagram account.</p>
                </div>
              </div>
              {isInstagramConnected ? (
                <div className="flex items-center gap-2 text-[#111827] bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 w-fit">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectInstagram}
                  className="glass-button-primary px-4 py-2 text-sm w-full sm:w-auto shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
            {!isInstagramConnected && (
              <div className="mt-2 text-xs text-[#ff8566] glass-panel p-3">
                <p className="font-semibold text-[#4b5563] mb-1">Setup Instructions:</p>
                <p>Make sure you have added the following Valid OAuth Redirect URIs in your Instagram App:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-[#6b7280] break-all">
                  <li>{window.location.origin}/api/auth/instagram/callback</li>
                </ul>
              </div>
            )}
          </div>

          <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="h-10 w-10 bg-[#FF4500] rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                  r/
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Reddit</p>
                  <p className="text-xs text-[#ff8566]">Publish posts to subreddits.</p>
                </div>
              </div>
              {isRedditConnected ? (
                <div className="flex items-center gap-2 text-[#111827] bg-white/40 px-3 py-1.5 rounded-lg border border-white/60 w-fit">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectReddit}
                  className="glass-button-primary px-4 py-2 text-sm w-full sm:w-auto shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
            {!isRedditConnected && (
              <div className="mt-2 text-xs text-[#ff8566] glass-panel p-3">
                <p className="font-semibold text-[#4b5563] mb-1">Setup Instructions:</p>
                <p>Make sure you have added the following redirect uri in your Reddit App:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[10px] text-[#6b7280] break-all">
                  <li>{window.location.origin}/api/auth/reddit/callback</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* API Config Section */}
        <div className="border-t border-white/20 pt-8">
          <h3 className="text-lg font-semibold leading-6 text-[#111827]">API Configuration</h3>
          <p className="mt-1 text-sm text-[#ff8566]">
            Your Gemini API key is automatically injected by the AI Studio environment.
          </p>
        </div>
        
        {/* Data Management Section */}
        <div className="border-t border-white/20 pt-8">
          <h3 className="text-lg font-semibold leading-6 text-red-600">Danger Zone</h3>
          <p className="mt-1 text-sm text-[#ff8566] mb-4">
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
            className="glass-button text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200/50 px-4 py-2 text-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Data
          </button>
        </div>

      </div>
    </div>
  );
}
