import { createPortal } from 'react-dom';
import { VideoLoader } from '../components/VideoLoader';
import { useState, useEffect } from "react";
import { Loader2, Plus, Image as ImageIcon, Trash2, AlertCircle, Folder, DownloadCloud, CheckCircle2, Eye, X } from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Creative } from "../types";
import { handleFirestoreError, OperationType, logSilentError } from "../lib/firestore-error";

interface DriveFolder {
 id: string;
 name: string;
}

export function Creatives() {
 const { activeProduct } = useProducts();
 const { user } = useAuth();
 const [creatives, setCreatives] = useState<Creative[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 // Google Drive State
 const [driveToken, setDriveToken] = useState<string | null>(() => {
 const stored = sessionStorage.getItem('driveToken');
 const expiry = sessionStorage.getItem('driveTokenExpiry');
 if (stored && expiry && Date.now() < parseInt(expiry, 10)) {
 return stored;
 }
 return null;
 });
 const [isConnecting, setIsConnecting] = useState(false);
 const [folders, setFolders] = useState<DriveFolder[]>([]);
 const [selectedFolderId, setSelectedFolderId] = useState<string>("");
 const [isFetchingFolders, setIsFetchingFolders] = useState(false);
 const [isImporting, setIsImporting] = useState(false);
 const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
 const [creativeToDelete, setCreativeToDelete] = useState<Creative | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);

 useEffect(() => {
 if (!activeProduct || !user) {
 setCreatives([]);
 setIsLoading(false);
 return;
 }

 setIsLoading(true);
 const q = query(
 collection(db, "creatives"), 
 where("productId", "==", activeProduct.id),
 where("userId", "==", user.uid)
 );
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const fetched: Creative[] = [];
 snapshot.forEach((doc) => {
 fetched.push({ id: doc.id, ...doc.data() } as Creative);
 });
 fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 setCreatives(fetched);
 setIsLoading(false);
 }, (err) => {
 handleFirestoreError(err, OperationType.GET, "creatives");
 setIsLoading(false);
 });

 return () => unsubscribe();
 }, [activeProduct, user]);

 useEffect(() => {
 if (driveToken && folders.length === 0) {
 fetchFolders(driveToken);
 }
 }, [driveToken]);

 const handleConnectDrive = async () => {
 setIsConnecting(true);
 setError(null);
 try {
 const provider = new GoogleAuthProvider();
 provider.addScope('https://www.googleapis.com/auth/drive.readonly');
 // Force prompt to ensure we get a new token with the requested scopes
 provider.setCustomParameters({ prompt: 'consent' });
 
 const result = await signInWithPopup(auth, provider);
 const credential = GoogleAuthProvider.credentialFromResult(result);
 const token = credential?.accessToken;
 
 if (token) {
 setDriveToken(token);
 sessionStorage.setItem('driveToken', token);
 sessionStorage.setItem('driveTokenExpiry', (Date.now() + 3500 * 1000).toString()); // 58 mins
 fetchFolders(token);
 } else {
 throw new Error("Failed to retrieve access token.");
 }
 } catch (err: any) {
 console.error("Drive connection error:", err);
 setError(err.message || "Failed to connect to Google Drive. Please try again.");
 } finally {
 setIsConnecting(false);
 }
 };

 const fetchFolders = async (token: string) => {
 setIsFetchingFolders(true);
 setError(null);
 try {
 const response = await fetch(
 "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)&orderBy=name",
 {
 headers: { Authorization: `Bearer ${token}` }
 }
 );
 
 if (!response.ok) {
 const errData = await response.json();
 if (errData.error?.message?.includes("Drive API has not been used")) {
 throw new Error("Google Drive API is not enabled in your Google Cloud Project. Please enable it in the GCP Console.");
 }
 throw new Error(errData.error?.message || "Failed to fetch folders.");
 }

 const data = await response.json();
 setFolders(data.files || []);
 } catch (err: any) {
 console.error("Fetch folders error:", err);
 setError(err.message || "Failed to fetch folders.");
 setDriveToken(null); // Reset token if it's invalid
 sessionStorage.removeItem('driveToken');
 sessionStorage.removeItem('driveTokenExpiry');
 } finally {
 setIsFetchingFolders(false);
 }
 };

 const compressImageFile = async (blob: Blob, quality = 0.95): Promise<string> => {
 return new Promise((resolve, reject) => {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement('canvas');
 let width = img.width;
 let height = img.height;
 const MAX_SIZE = 1600;
 
 if (width > height && width > MAX_SIZE) {
 height *= MAX_SIZE / width;
 width = MAX_SIZE;
 } else if (height > MAX_SIZE) {
 width *= MAX_SIZE / height;
 height = MAX_SIZE;
 }
 
 canvas.width = width;
 canvas.height = height;
 const ctx = canvas.getContext('2d');
 if (!ctx) return reject("No canvas context");
 
 ctx.fillStyle = '#FFFFFF';
 ctx.fillRect(0, 0, width, height);
 ctx.drawImage(img, 0, 0, width, height);
 resolve(canvas.toDataURL('image/jpeg', quality));
 };
 img.onerror = reject;
 img.src = URL.createObjectURL(blob);
 });
 };

 const handleImportImages = async () => {
 if (!selectedFolderId || !driveToken || !activeProduct || !user) return;
 
 setIsImporting(true);
 setError(null);
 setImportProgress({ current: 0, total: 0 });

 try {
 // 1. Fetch list of images in the folder
 const response = await fetch(
 `https://www.googleapis.com/drive/v3/files?q='${selectedFolderId}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false&fields=files(id,name)`,
 {
 headers: { Authorization: `Bearer ${driveToken}` }
 }
 );

 if (!response.ok) throw new Error("Failed to fetch images from folder.");
 
 const data = await response.json();
 const files = data.files || [];
 
 if (files.length === 0) {
 throw new Error("No images found in the selected folder.");
 }

 setImportProgress({ current: 0, total: files.length });

 // 2. Process each image sequentially to avoid memory issues
 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 try {
 // Fetch the actual image content
 const imgResponse = await fetch(
 `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
 {
 headers: { Authorization: `Bearer ${driveToken}` }
 }
 );
 
 if (!imgResponse.ok) continue;
 
 const blob = await imgResponse.blob();
 
 // Compress to base64 JPEG
 const base64Data = await compressImageFile(blob);
 
 // Save to Firestore
 await addDoc(collection(db, "creatives"), {
 productId: activeProduct.id,
 userId: user.uid,
 url: base64Data,
 name: file.name,
 createdAt: new Date().toISOString()
 });
 
 } catch (err) {
 console.error(`Failed to process image ${file.name}:`, err);
 // Continue with next image even if one fails
 }
 
 setImportProgress({ current: i + 1, total: files.length });
 }
 
 // Reset selection after successful import
 setSelectedFolderId("");
 
 } catch (err: any) {
 console.error("Import error:", err);
 setError(err.message || "Failed to import images.");
 } finally {
 setIsImporting(false);
 setImportProgress(null);
 }
 };

 const confirmDelete = async () => {
 if (!creativeToDelete) return;
 setIsDeleting(true);
 try {
 await deleteDoc(doc(db, "creatives", creativeToDelete.id));
 setCreativeToDelete(null);
 } catch (err) {
 handleFirestoreError(err, OperationType.DELETE, `creatives/${creativeToDelete.id}`);
 setError("Failed to delete creative.");
 } finally {
 setIsDeleting(false);
 }
 };

 if (!activeProduct) {
 return (
 <div className="flex-1 flex items-center justify-center bg-transparent">
 <div className="text-center p-8 glass-panel max-w-sm">
 <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
 <h2 className="text-xl font-bold text-slate-800 mb-2 font-display">No Product Selected</h2>
 <p className="text-sm text-slate-500 font-light">Please select or create a product to manage assets.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col bg-transparent">
 <div className="tour-creatives-header px-4 md:px-8 py-4 md:py-6 border-b border-slate-200/50 bg-white/30 backdrop-blur-md">
 <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display">Brand Assets</h1>
 <p className="text-xs md:text-sm text-slate-500 mt-1 font-light">
 Connect your Google Drive to import photos or brand graphics. We'll use these images instead of AI-generated backgrounds and automatically overlay your campaign text and logo.
 </p>
 </div>

 <div className="p-4 md:p-8">
 <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-0">
 
 {/* Google Drive Import Section */}
 <div className="tour-drive-section glass-panel p-4 md:p-6 shadow-sm">
 <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
 <Folder className="h-5 w-5 text-[#7C3AED]" />
 Import from Google Drive
 </h2>
 
 {error && (
 <div className="mb-4 flex items-start gap-2 text-sm text-red-600 bg-red-100/60 border border-red-200/50 p-3 rounded-lg">
 <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
 <p>{error}</p>
 </div>
 )}

 {!driveToken ? (
 <div className="flex flex-col items-center justify-center py-6 md:py-8 px-4 border-2 border-dashed border-slate-200/80 rounded-xl bg-slate-50/40 backdrop-blur-sm">
 <DownloadCloud className="h-8 md:h-10 w-8 md:w-10 text-slate-400 mb-2 md:mb-3" />
 <p className="text-xs md:text-sm text-slate-500 mb-4 text-center max-w-md font-light">
 Connect your Google account to browse your Drive folders and import images directly into your brand assets library.
 </p>
 <button
 onClick={handleConnectDrive}
 disabled={isConnecting}
 className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
 >
 {isConnecting ? <VideoLoader className="h-7 w-7" /> : (
 <svg className="w-4 h-4" viewBox="0 0 24 24">
 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
 </svg>
 )}
 Connect Google Drive
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="flex items-center justify-between bg-[#18F07A]/10 text-[#14C161] px-4 py-3 rounded-lg border border-[#18F07A]/25 backdrop-blur-sm shadow-sm">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="h-5 w-5" />
 <span className="font-semibold text-sm">Connected to Google Drive</span>
 </div>
 <button 
 onClick={() => {
 setDriveToken(null);
 sessionStorage.removeItem('driveToken');
 sessionStorage.removeItem('driveTokenExpiry');
 }}
 className="text-sm font-semibold underline text-slate-500 hover:text-slate-800 transition-colors"
 >
 Disconnect
 </button>
 </div>

 {isFetchingFolders ? (
 <div className="flex items-center gap-3 text-sm text-slate-500 py-4">
 <VideoLoader className="mr-2 h-7 w-7" />
 Loading your folders...
 </div>
 ) : (
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-1 w-full">
 <label className="block text-sm font-semibold text-slate-600 mb-1">Select a Folder</label>
 <select
 value={selectedFolderId}
 onChange={(e) => setSelectedFolderId(e.target.value)}
 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none bg-white text-slate-800"
 disabled={isImporting}
 >
 <option value="">-- Choose a folder --</option>
 {folders.map(folder => (
 <option key={folder.id} value={folder.id}>{folder.name}</option>
 ))}
 </select>
 </div>
 <button
 onClick={handleImportImages}
 disabled={!selectedFolderId || isImporting}
 className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 text-white rounded-xl transition-colors disabled:opacity-50 h-11 glass-button glass-button-primary"
 >
 {isImporting ? (
 <>
 <VideoLoader className="mr-2 h-7 w-7" />
 {importProgress ? `Importing (${importProgress.current}/${importProgress.total})` : 'Importing...'}
 </>
 ) : (
 <>
 <DownloadCloud className="h-4 w-4" />
 Import Images
 </>
 )}
 </button>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Creatives Grid */}
 <div>
 <h2 className="text-lg font-bold text-slate-800 mb-4 font-display">Your Library ({creatives.length})</h2>
 
 {isLoading ? (
          <div className="space-y-6 w-full col-span-full">
            <div className="flex flex-col items-center justify-center py-6">
              <VideoLoader className="h-24 w-24 text-[#7C3AED] mx-auto mb-3" />
              <p className="text-xs text-[#7C3AED] font-semibold animate-pulse text-center">Syncing creative assets from your Google Drive folder...</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white/45 backdrop-blur-md rounded-xl border border-slate-200/50 overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED]/10 animate-pulse" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : creatives.length === 0 ? (
          <div className="text-center py-8 md:py-16 px-4 bg-[#1C1C22]/50 rounded-xl border border-[#7C3AED]/20 border-dashed flex flex-col items-center">
            <img src="/B2P AVATAR.png" alt="Tror" className="h-24 md:h-32 w-auto mb-4 drop-shadow-[0_0_15px_rgba(124,58,237,0.3)] animate-[pulse_5s_ease-in-out_infinite]" />
            <h3 className="text-base md:text-lg font-bold text-white font-display">No creatives yet</h3>
            <p className="text-xs md:text-sm text-gray-300 mt-2 max-w-md">Connect your Drive and import a folder to let Tror start using your assets in campaigns.</p>
          </div>
        ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {creatives.map((creative) => (
 <div key={creative.id} className="group relative bg-[#1C1C22] rounded-xl border border-[#7C3AED]/20 overflow-hidden shadow-sm hover:shadow-md transition-all">
 <div className="aspect-square bg-[#1C1C22]/80 relative">
 <img 
 src={creative.url || undefined} 
 alt={creative.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Load+Error';
 }}
 />
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={() => setPreviewCreative(creative)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      title="Preview Creative"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCreativeToDelete(creative)}
                      className="p-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Delete Creative"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
 </div>
 <div className="p-3">
 <p className="text-sm font-medium text-white truncate" title={creative.name}>
 {creative.name}
 </p>
 <p className="text-xs text-gray-300 mt-0.5">
 {new Date(creative.createdAt).toLocaleDateString()}
 </p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 </div>

 {/* Delete Confirmation Modal */}
 {creativeToDelete && createPortal(
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="bg-[#1C1C22] rounded-[18px] shadow-xl max-w-md w-full p-6">
 <h3 className="text-lg font-bold text-white mb-2">Delete Creative</h3>
 <p className="text-gray-300 mb-6">
 Are you sure you want to delete "{creativeToDelete.name}"? This action cannot be undone.
 </p>
 <div className="flex justify-end gap-3">
 <button
 onClick={() => setCreativeToDelete(null)}
 disabled={isDeleting}
 className="px-4 py-2 text-gray-300 font-medium hover:bg-[#1C1C22]/80 rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={confirmDelete}
 disabled={isDeleting}
 className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
 >
 {isDeleting ? <VideoLoader className="mr-2 h-7 w-7" /> : <Trash2 className="h-4 w-4" />}
 Delete
 </button>
 </div>
 </div>
 </div>,
  document.body
  )}

      {/* Full-screen Image Preview Overlay */}
      {previewCreative && createPortal(
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setPreviewCreative(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all"
            onClick={() => setPreviewCreative(null)}
          >
            <X className="h-8 w-8" />
          </button>
          
          <img 
            src={previewCreative.url || undefined} 
            alt={previewCreative.name}
            className="max-w-full max-h-[90vh] object-contain rounded-[14px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-full border border-white/10 text-white font-medium text-sm md:text-base whitespace-nowrap max-w-[90%] truncate">
            {previewCreative.name}
          </div>
        </div>,
  document.body
      )}

 </div>
 );
}
